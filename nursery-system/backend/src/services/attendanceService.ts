import { AttendanceStatus, Role } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AuthUser } from "../types/auth";
import { badRequest, forbidden, notFound } from "../utils/errors";

type AttendanceInput = {
  childId: string;
  date: string;
  status: AttendanceStatus;
  notes?: string | null;
  checkIn?: string | null;
  checkOut?: string | null;
};

export async function recordAttendance(
  requestor: AuthUser,
  input: AttendanceInput,
) {
  if (![Role.ADMIN, Role.MANAGER, Role.SUPERVISOR].includes(requestor.role)) {
    throw forbidden("Only staff can record attendance");
  }

  const child = await prisma.child.findUnique({
    where: { id: input.childId },
  });
  if (!child) {
    throw notFound("Child not found");
  }

  if (requestor.role !== Role.ADMIN) {
    if (!requestor.nurseryId || requestor.nurseryId !== child.nurseryId) {
      throw forbidden("Cannot record attendance for another nursery");
    }
  }

  const date = new Date(input.date);
  if (Number.isNaN(date.getTime())) {
    throw badRequest("Invalid date");
  }

  const checkIn = input.checkIn ? new Date(input.checkIn) : null;
  const checkOut = input.checkOut ? new Date(input.checkOut) : null;

  const attendance = await prisma.attendance.upsert({
    where: {
      childId_date: {
        childId: input.childId,
        date,
      },
    },
    update: {
      status: input.status,
      notes: input.notes ?? null,
      checkIn,
      checkOut,
      recordedById: requestor.id,
    },
    create: {
      childId: input.childId,
      date,
      status: input.status,
      notes: input.notes ?? null,
      checkIn,
      checkOut,
      recordedById: requestor.id,
    },
    include: {
      child: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  return attendance;
}

type AttendanceQuery = {
  childId?: string;
  from?: string;
  to?: string;
};

export async function listAttendance(
  requestor: AuthUser,
  query: AttendanceQuery,
) {
  const where: Record<string, unknown> = {};

  if (query.childId) {
    const child = await prisma.child.findUnique({
      where: { id: query.childId },
    });
    if (!child) {
      throw notFound("Child not found");
    }

    if (requestor.role === Role.PARENT && child.parentId !== requestor.id) {
      throw forbidden("Cannot view attendance for another child");
    }

    if (
      requestor.role !== Role.ADMIN &&
      requestor.role !== Role.PARENT &&
      requestor.nurseryId !== child.nurseryId
    ) {
      throw forbidden("Cannot view attendance for another nursery");
    }

    where.childId = query.childId;
  } else if (requestor.role === Role.PARENT) {
    where.child = {
      parentId: requestor.id,
    };
  } else if (requestor.role !== Role.ADMIN) {
    where.child = {
      nurseryId: requestor.nurseryId ?? undefined,
    };
  }

  if (query.from || query.to) {
    where.date = {};
    if (query.from) {
      (where.date as Record<string, Date>).gte = new Date(query.from);
    }
    if (query.to) {
      (where.date as Record<string, Date>).lte = new Date(query.to);
    }
  }

  return prisma.attendance.findMany({
    where,
    include: {
      child: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      recordedBy: {
        select: { id: true, fullName: true },
      },
    },
    orderBy: { date: "desc" },
  });
}
