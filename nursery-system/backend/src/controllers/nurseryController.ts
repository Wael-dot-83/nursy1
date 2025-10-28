import { Request, Response } from "express";
import { z } from "zod";
import {
  createNursery,
  deleteNursery,
  listNurseries,
  updateNursery,
} from "../services/nurseryService";
import { unauthorized } from "../utils/errors";

const nurserySchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  district: z.string().min(1),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
});

export async function getNurseries(req: Request, res: Response) {
  if (!req.user) {
    throw unauthorized();
  }
  const data = await listNurseries(req.user);
  return res.json(data);
}

export async function createNurseryHandler(req: Request, res: Response) {
  if (!req.user) {
    throw unauthorized();
  }
  const body = nurserySchema.parse(req.body);
  const nursery = await createNursery(req.user, body);
  return res.status(201).json(nursery);
}

export async function updateNurseryHandler(req: Request, res: Response) {
  if (!req.user) {
    throw unauthorized();
  }
  const body = nurserySchema.partial().parse(req.body);
  const nursery = await updateNursery(req.user, req.params.id, body);
  return res.json(nursery);
}

export async function deleteNurseryHandler(req: Request, res: Response) {
  if (!req.user) {
    throw unauthorized();
  }
  await deleteNursery(req.user, req.params.id);
  return res.status(204).send();
}
