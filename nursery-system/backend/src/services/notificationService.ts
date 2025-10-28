import { Role } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AuthUser } from "../types/auth";
import { badRequest, forbidden, notFound } from "../utils/errors";

type NotificationInput = {
  parentId: string;
  childId?: string | null;
  message: string;
};

type NotificationQuery = {
  childId?: string;
  parentId?: string;
};

export async function listNotifications(
  requestor: AuthUser,
  query: NotificationQuery,
) {
  const where: Record<string, unknown> = {};

  if (requestor.role === Role.PARENT) {
    where.parentId = requestor.id;
  } else if (requestor.role === Role.ADMIN) {
    if (query.parentId) where.parentId = query.parentId;
    if (query.childId) where.childId = query.childId;
  } else {
    if (!requestor.nurseryId) {
      return [];
    }
    where.parent = {
      nurseryId: requestor.nurseryId,
    };
    if (query.parentId) where.parentId = query.parentId;
    if (query.childId) where.childId = query.childId;
  }

  return prisma.notification.findMany({
    where,
    include: {
      child: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createNotification(
  requestor: AuthUser,
  input: NotificationInput,
) {
  if (![Role.ADMIN, Role.MANAGER, Role.SUPERVISOR].includes(requestor.role)) {
    throw forbidden("Only staff can create notifications");
  }

  const parent = await prisma.user.findUnique({
    where: { id: input.parentId },
  });
  if (!parent || parent.role !== Role.PARENT) {
    throw badRequest("Parent not found");
  }

  if (requestor.role !== Role.ADMIN) {
    if (!requestor.nurseryId || parent.nurseryId !== requestor.nurseryId) {
      throw forbidden("Cannot notify parent from another nursery");
    }
  }

  if (input.childId) {
    const child = await prisma.child.findUnique({
      where: { id: input.childId },
    });
    if (!child || child.parentId !== input.parentId) {
      throw badRequest("Child must belong to the parent");
    }
  }

  return prisma.notification.create({
    data: {
      parentId: input.parentId,
      childId: input.childId ?? null,
      message: input.message,
    },
  });
}

export async function markNotificationRead(
  requestor: AuthUser,
  notificationId: string,
) {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });
  if (!notification) {
    throw notFound("Notification not found");
  }

  const parent = await prisma.user.findUnique({
    where: { id: notification.parentId },
    select: { id: true, nurseryId: true },
  });
  if (!parent) {
    throw notFound("Parent not found for notification");
  }

  if (
    requestor.role === Role.PARENT &&
    notification.parentId !== requestor.id
  ) {
    throw forbidden("Cannot modify another parent's notification");
  }

  if (
    requestor.role !== Role.ADMIN &&
    requestor.role !== Role.PARENT &&
    (!requestor.nurseryId || parent.nurseryId !== requestor.nurseryId)
  ) {
    throw forbidden("Cannot modify notification for another nursery");
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });
}
