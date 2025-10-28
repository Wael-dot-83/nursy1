import { Request, Response } from "express";
import { z } from "zod";
import {
  createChild,
  deleteChild,
  listChildren,
  updateChild,
} from "../services/childService";
import { unauthorized } from "../utils/errors";

const childSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  birthDate: z.string().refine((val) => !Number.isNaN(Date.parse(val)), {
    message: "birthDate must be a valid ISO date string",
  }),
  guardianNote: z.string().optional().nullable(),
  parentId: z.string().uuid(),
  classroomId: z.string().uuid().optional().nullable(),
  nurseryId: z.string().uuid(),
});

export async function getChildren(req: Request, res: Response) {
  if (!req.user) {
    throw unauthorized();
  }
  const classroomId = req.query.classroomId
    ? z.string().uuid().parse(req.query.classroomId)
    : undefined;
  const parentId = req.query.parentId
    ? z.string().uuid().parse(req.query.parentId)
    : undefined;

  const children = await listChildren(req.user, { classroomId, parentId });
  return res.json(children);
}

export async function createChildHandler(req: Request, res: Response) {
  if (!req.user) {
    throw unauthorized();
  }
  const body = childSchema.parse(req.body);
  const child = await createChild(req.user, body);
  return res.status(201).json(child);
}

export async function updateChildHandler(req: Request, res: Response) {
  if (!req.user) {
    throw unauthorized();
  }
  const body = childSchema.partial().parse(req.body);
  const child = await updateChild(req.user, req.params.id, body);
  return res.json(child);
}

export async function deleteChildHandler(req: Request, res: Response) {
  if (!req.user) {
    throw unauthorized();
  }
  await deleteChild(req.user, req.params.id);
  return res.status(204).send();
}
