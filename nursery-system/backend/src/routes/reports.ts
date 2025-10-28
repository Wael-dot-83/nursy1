import { Role } from "@prisma/client";
import { Router } from "express";
import {
  createReportHandler,
  getReports,
} from "../controllers/reportController";
import { requireAuth, requireRoles } from "../middleware/auth";

export const reportRouter = Router();

reportRouter.get(
  "/",
  requireAuth,
  requireRoles(Role.ADMIN, Role.MANAGER, Role.SUPERVISOR, Role.PARENT),
  getReports,
);
reportRouter.post(
  "/",
  requireAuth,
  requireRoles(Role.ADMIN, Role.MANAGER, Role.SUPERVISOR),
  createReportHandler,
);
