import { Request, Response } from "express";
import { z } from "zod";
import {
  login as loginService,
  logout as logoutService,
  refresh as refreshService,
  registerParent,
} from "../services/authService";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

const parentSignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1),
  phone: z.string().min(10),
  nurseryId: z.string().uuid().optional().nullable(),
});

export async function login(req: Request, res: Response) {
  const body = loginSchema.parse(req.body);
  const result = await loginService(body.email, body.password);
  return res.json(result);
}

export async function refresh(req: Request, res: Response) {
  const body = refreshSchema.parse(req.body);
  const result = await refreshService(body.refreshToken);
  return res.json(result);
}

export async function logout(req: Request, res: Response) {
  const body = refreshSchema.partial().parse(req.body ?? {});
  if (body.refreshToken) {
    await logoutService(body.refreshToken);
  }
  return res.status(200).json({ message: "Logged out" });
}

export async function signupParent(req: Request, res: Response) {
  const body = parentSignupSchema.parse(req.body);
  const result = await registerParent(body);
  return res.status(201).json(result);
}
