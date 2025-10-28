import { Router } from "express";
import { authRouter } from "./auth";
import { userRouter } from "./users";
import { nurseryRouter } from "./nurseries";
import { classroomRouter } from "./classrooms";
import { childRouter } from "./children";
import { attendanceRouter } from "./attendance";
import { reportRouter } from "./reports";
import { notificationRouter } from "./notifications";

export const router = Router();

router.use("/auth", authRouter);
router.use("/users", userRouter);
router.use("/nurseries", nurseryRouter);
router.use("/classrooms", classroomRouter);
router.use("/children", childRouter);
router.use("/attendance", attendanceRouter);
router.use("/reports", reportRouter);
router.use("/notifications", notificationRouter);
