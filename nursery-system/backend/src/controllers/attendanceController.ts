import { AttendanceStatus } from "@prisma/client";
import { Request, Response } from "express";
import { z } from "zod";
import {
  listAttendance,
  recordAttendance,
} from "../services/attendanceService";
import { unauthorized } from "../utils/errors";

const attendanceSchema = z.object({
  childId: z.string().uuid(),
  date: z.string().refine((val) => !Number.isNaN(Date.parse(val)), {
    message: "date must be a valid ISO string",
  }),
  status: z.nativeEnum(AttendanceStatus),
  notes: z.string().optional().nullable(),
  checkIn: z.string().optional().nullable(),
  checkOut: z.string().optional().nullable(),
});

export async function createAttendance(req: Request, res: Response) {
  if (!req.user) {
    throw unauthorized();
  }
  const body = attendanceSchema.parse(req.body);
  const attendance = await recordAttendance(req.user, body);
  return res.status(201).json(attendance);
}

export async function getAttendance(req: Request, res: Response) {
  if (!req.user) {
    throw unauthorized();
  }
  const querySchema = z.object({
    childId: z.string().uuid().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
  });
  const query = querySchema.parse(req.query);
  const attendance = await listAttendance(req.user, query);
  return res.json(attendance);
}
