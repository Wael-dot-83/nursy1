import { Role } from "@prisma/client";
import { Router } from "express";
import {
  createChildHandler,
  deleteChildHandler,
  getChildren,
  updateChildHandler,
} from "../controllers/childController";
import { requireAuth, requireRoles } from "../middleware/auth";

export const childRouter = Router();

childRouter.get("/", requireAuth, getChildren);
childRouter.post(
  "/",
  requireAuth,
  requireRoles(Role.ADMIN, Role.MANAGER),
  createChildHandler,
);
childRouter.patch(
  "/:id",
  requireAuth,
  requireRoles(Role.ADMIN, Role.MANAGER, Role.SUPERVISOR, Role.PARENT),
  updateChildHandler,
);
childRouter.delete(
  "/:id",
  requireAuth,
  requireRoles(Role.ADMIN, Role.MANAGER),
  deleteChildHandler,
);
