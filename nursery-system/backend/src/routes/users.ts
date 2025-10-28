import { Role } from "@prisma/client";
import { Router } from "express";
import {
  createUser,
  deleteUser,
  getMe,
  listUsers,
  updateUser,
} from "../controllers/userController";
import { requireAuth, requireRoles } from "../middleware/auth";

export const userRouter = Router();

userRouter.get("/me", requireAuth, getMe);
userRouter.get("/", requireAuth, requireRoles(Role.ADMIN, Role.MANAGER), listUsers);
userRouter.post(
  "/",
  requireAuth,
  requireRoles(Role.ADMIN, Role.MANAGER),
  createUser,
);
userRouter.patch(
  "/:id",
  requireAuth,
  requireRoles(Role.ADMIN, Role.MANAGER),
  updateUser,
);
userRouter.delete(
  "/:id",
  requireAuth,
  requireRoles(Role.ADMIN, Role.MANAGER),
  deleteUser,
);
