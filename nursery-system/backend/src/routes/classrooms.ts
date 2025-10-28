import { Role } from "@prisma/client";
import { Router } from "express";
import {
  createClassroomHandler,
  deleteClassroomHandler,
  getClassrooms,
  updateClassroomHandler,
} from "../controllers/classroomController";
import { requireAuth, requireRoles } from "../middleware/auth";

export const classroomRouter = Router();

classroomRouter.get(
  "/",
  requireAuth,
  requireRoles(Role.ADMIN, Role.MANAGER, Role.SUPERVISOR),
  getClassrooms,
);
classroomRouter.post(
  "/",
  requireAuth,
  requireRoles(Role.ADMIN, Role.MANAGER),
  createClassroomHandler,
);
classroomRouter.patch(
  "/:id",
  requireAuth,
  requireRoles(Role.ADMIN, Role.MANAGER),
  updateClassroomHandler,
);
classroomRouter.delete(
  "/:id",
  requireAuth,
  requireRoles(Role.ADMIN, Role.MANAGER),
  deleteClassroomHandler,
);
