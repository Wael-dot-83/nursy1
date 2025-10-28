import { Role } from "@prisma/client";
import { Router } from "express";
import {
  createNotificationHandler,
  getNotifications,
  markNotificationReadHandler,
} from "../controllers/notificationController";
import { requireAuth, requireRoles } from "../middleware/auth";

export const notificationRouter = Router();

notificationRouter.get("/", requireAuth, getNotifications);
notificationRouter.post(
  "/",
  requireAuth,
  requireRoles(Role.ADMIN, Role.MANAGER, Role.SUPERVISOR),
  createNotificationHandler,
);
notificationRouter.patch(
  "/:id/read",
  requireAuth,
  requireRoles(Role.ADMIN, Role.MANAGER, Role.SUPERVISOR, Role.PARENT),
  markNotificationReadHandler,
);
