import { Request, Response } from "express";
import { Role } from "@prisma/client";
import { z } from "zod";
import {
  createUser as createUserService,
  deleteUser as deleteUserService,
  getMe as getMeService,
  listUsers as listUsersService,
  updateUser as updateUserService,
} from "../services/userService";
import { unauthorized } from "../utils/errors";

const createUserSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1),
  phone: z.string().min(10),
  password: z.string().min(8),
  role: z.nativeEnum(Role),
  nurseryId: z.string().uuid().optional().nullable(),
});

const updateUserSchema = z
  .object({
    email: z.string().email().optional(),
    fullName: z.string().min(1).optional(),
    phone: z.string().min(10).optional(),
    password: z.string().min(8).optional(),
    role: z.nativeEnum(Role).optional(),
    nurseryId: z.string().uuid().optional().nullable(),
  })
  .refine((val) => Object.keys(val).length > 0, {
    message: "At least one field must be provided",
  });

export async function getMe(req: Request, res: Response) {
  if (!req.user) {
    throw unauthorized();
  }

  const me = await getMeService(req.user.id);
  return res.json(me);
}

export async function listUsers(req: Request, res: Response) {
  if (!req.user) {
    throw unauthorized();
  }
  const users = await listUsersService(req.user);
  return res.json(users);
}

export async function createUser(req: Request, res: Response) {
  if (!req.user) {
    throw unauthorized();
  }
  const body = createUserSchema.parse(req.body);
  const user = await createUserService(req.user, body);
  return res.status(201).json(user);
}

export async function updateUser(req: Request, res: Response) {
  if (!req.user) {
    throw unauthorized();
  }
  const body = updateUserSchema.parse(req.body);
  const user = await updateUserService(req.user, req.params.id, body);
  return res.json(user);
}

export async function deleteUser(req: Request, res: Response) {
  if (!req.user) {
    throw unauthorized();
  }
  await deleteUserService(req.user, req.params.id);
  return res.status(204).send();
}
