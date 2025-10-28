import { Request, Response } from "express";
import { z } from "zod";
import {
  createClassroom,
  deleteClassroom,
  listClassrooms,
  updateClassroom,
} from "../services/classroomService";
import { unauthorized } from "../utils/errors";

const classroomSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  nurseryId: z.string().uuid(),
  supervisorId: z.string().uuid().optional().nullable(),
});

export async function getClassrooms(req: Request, res: Response) {
  if (!req.user) {
    throw unauthorized();
  }
  const classrooms = await listClassrooms(req.user);
  return res.json(classrooms);
}

export async function createClassroomHandler(req: Request, res: Response) {
  if (!req.user) {
    throw unauthorized();
  }
  const body = classroomSchema.parse(req.body);
  const classroom = await createClassroom(req.user, body);
  return res.status(201).json(classroom);
}

export async function updateClassroomHandler(req: Request, res: Response) {
  if (!req.user) {
    throw unauthorized();
  }
  const body = classroomSchema.partial().parse(req.body);
  const classroom = await updateClassroom(req.user, req.params.id, body);
  return res.json(classroom);
}

export async function deleteClassroomHandler(req: Request, res: Response) {
  if (!req.user) {
    throw unauthorized();
  }
  await deleteClassroom(req.user, req.params.id);
  return res.status(204).send();
}
