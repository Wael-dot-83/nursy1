import { Role } from "@prisma/client";
import { Router } from "express";
import {
  createAttendance,
  getAttendance,
} from "../controllers/attendanceController";
import { requireAuth, requireRoles } from "../middleware/auth";

export const attendanceRouter = Router();

attendanceRouter.get("/", requireAuth, getAttendance);
attendanceRouter.post(
  "/",
  requireAuth,
  requireRoles(Role.ADMIN, Role.MANAGER, Role.SUPERVISOR),
  createAttendance,
);
