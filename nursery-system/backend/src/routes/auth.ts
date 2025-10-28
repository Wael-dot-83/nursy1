import { Router } from "express";
import {
  login,
  logout,
  refresh,
  signupParent,
} from "../controllers/authController";

export const authRouter = Router();

authRouter.post("/login", login);
authRouter.post("/refresh", refresh);
authRouter.post("/logout", logout);
authRouter.post("/register-parent", signupParent);
