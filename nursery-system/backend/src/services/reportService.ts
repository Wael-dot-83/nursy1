import { Role } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AuthUser } from "../types/auth";
import { badRequest, forbidden, notFound } from "../utils/errors";

type ReportInput = {
  childId: string;
  weekStart: string;
  weekEnd: string;
  summary: string;
  highlights?: string | null;
  nextSteps?: string | null;
};

export async function createReport(requestor: AuthUser, input: ReportInput) {
  if (![Role.ADMIN, Role.MANAGER, Role.SUPERVISOR].includes(requestor.role)) {
    throw forbidden("Only staff members can create reports");
  }

  const child = await prisma.child.findUnique({
    where: { id: input.childId },
  });
  if (!child) {
    throw notFound("Child not found");
  }

  if (requestor.role !== Role.ADMIN) {
    if (!requestor.nurseryId || requestor.nurseryId !== child.nurseryId) {
      throw forbidden("Cannot create report for another nursery");
    }
  }

  const weekStart = new Date(input.weekStart);
  const weekEnd = new Date(input.weekEnd);

  if (Number.isNaN(weekStart.getTime()) || Number.isNaN(weekEnd.getTime())) {
    throw badRequest("Invalid week dates");
  }

  if (weekEnd < weekStart) {
    throw badRequest("weekEnd must be after weekStart");
  }

  return prisma.report.create({
    data: {
      childId: input.childId,
      supervisorId: requestor.id,
      weekStart,
      weekEnd,
      summary: input.summary,
      highlights: input.highlights ?? null,
      nextSteps: input.nextSteps ?? null,
    },
    include: {
      child: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });
}

type ReportQuery = {
  childId?: string;
};

export async function listReports(requestor: AuthUser, query: ReportQuery) {
  const where: Record<string, unknown> = {};

  if (query.childId) {
    const child = await prisma.child.findUnique({
      where: { id: query.childId },
    });
    if (!child) {
      throw notFound("Child not found");
    }

    if (requestor.role === Role.PARENT && child.parentId !== requestor.id) {
      throw forbidden("Cannot view reports for another child");
    }

    if (
      requestor.role !== Role.ADMIN &&
      requestor.role !== Role.PARENT &&
      requestor.nurseryId !== child.nurseryId
    ) {
      throw forbidden("Cannot view reports for another nursery");
    }

    where.childId = query.childId;
  } else if (requestor.role === Role.PARENT) {
    where.child = { parentId: requestor.id };
  } else if (requestor.role !== Role.ADMIN) {
    where.child = { nurseryId: requestor.nurseryId ?? undefined };
  }

  return prisma.report.findMany({
    where,
    include: {
      child: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      supervisor: {
        select: { id: true, fullName: true },
      },
    },
    orderBy: { weekStart: "desc" },
  });
}
