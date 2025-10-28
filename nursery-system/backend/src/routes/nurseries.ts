import { Role } from "@prisma/client";
import { Router } from "express";
import {
  createNurseryHandler,
  deleteNurseryHandler,
  getNurseries,
  updateNurseryHandler,
} from "../controllers/nurseryController";
import { requireAuth, requireRoles } from "../middleware/auth";

export const nurseryRouter = Router();

nurseryRouter.get("/", requireAuth, requireRoles(Role.ADMIN, Role.MANAGER), getNurseries);
nurseryRouter.post("/", requireAuth, requireRoles(Role.ADMIN), createNurseryHandler);
nurseryRouter.patch(
  "/:id",
  requireAuth,
  requireRoles(Role.ADMIN),
  updateNurseryHandler,
);
nurseryRouter.delete(
  "/:id",
  requireAuth,
  requireRoles(Role.ADMIN),
  deleteNurseryHandler,
);
