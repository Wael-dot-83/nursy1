import { Request, Response } from "express";
import { z } from "zod";
import {
  createNotification,
  listNotifications,
  markNotificationRead,
} from "../services/notificationService";
import { unauthorized } from "../utils/errors";

const notificationSchema = z.object({
  parentId: z.string().uuid(),
  childId: z.string().uuid().optional().nullable(),
  message: z.string().min(1),
});

export async function getNotifications(req: Request, res: Response) {
  if (!req.user) {
    throw unauthorized();
  }
  const querySchema = z.object({
    parentId: z.string().uuid().optional(),
    childId: z.string().uuid().optional(),
  });
  const query = querySchema.parse(req.query);
  const notifications = await listNotifications(req.user, query);
  return res.json(notifications);
}

export async function createNotificationHandler(req: Request, res: Response) {
  if (!req.user) {
    throw unauthorized();
  }
  const body = notificationSchema.parse(req.body);
  const notification = await createNotification(req.user, body);
  return res.status(201).json(notification);
}

export async function markNotificationReadHandler(
  req: Request,
  res: Response,
) {
  if (!req.user) {
    throw unauthorized();
  }
  await markNotificationRead(req.user, req.params.id);
  return res.status(200).json({ message: "Marked as read" });
}
