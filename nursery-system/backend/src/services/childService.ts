import { Role } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AuthUser } from "../types/auth";
import { badRequest, forbidden, notFound } from "../utils/errors";

type ChildInput = {
  firstName: string;
  lastName: string;
  birthDate: string;
  guardianNote?: string | null;
  parentId: string;
  classroomId?: string | null;
  nurseryId: string;
};

function ensureManagerialRole(requestor: AuthUser) {
  if (![Role.ADMIN, Role.MANAGER].includes(requestor.role)) {
    throw forbidden("Insufficient permissions for children management");
  }
}

async function ensureNurseryMatch(
  requestor: AuthUser,
  nurseryId: string,
) {
  if (requestor.role === Role.ADMIN) {
    return;
  }
  if (!requestor.nurseryId || requestor.nurseryId !== nurseryId) {
    throw forbidden("Cannot manage children for another nursery");
  }
}

export async function listChildren(requestor: AuthUser, query: { classroomId?: string; parentId?: string }) {
  if (requestor.role === Role.PARENT) {
    return prisma.child.findMany({
      where: {
        parentId: requestor.id,
      },
      include: {
        classroom: {
          select: { id: true, name: true },
        },
        nursery: {
          select: { id: true, name: true },
        },
      },
      orderBy: { firstName: "asc" },
    });
  }

  const where: Record<string, unknown> = {};

  if (requestor.role !== Role.ADMIN) {
    where.nurseryId = requestor.nurseryId ?? undefined;
  }
  if (query.classroomId) {
    where.classroomId = query.classroomId;
  }
  if (query.parentId) {
    where.parentId = query.parentId;
  }

  return prisma.child.findMany({
    where,
    include: {
      parent: {
        select: { id: true, fullName: true, email: true },
      },
      classroom: {
        select: { id: true, name: true },
      },
      nursery: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createChild(requestor: AuthUser, input: ChildInput) {
  ensureManagerialRole(requestor);
  await ensureNurseryMatch(requestor, input.nurseryId);

  const parent = await prisma.user.findUnique({
    where: { id: input.parentId },
  });
  if (!parent || parent.role !== Role.PARENT) {
    throw badRequest("Parent not found");
  }
  if (parent.nurseryId !== input.nurseryId) {
    throw badRequest("Parent belongs to a different nursery");
  }

  if (input.classroomId) {
    const classroom = await prisma.classroom.findUnique({
      where: { id: input.classroomId },
    });
    if (!classroom || classroom.nurseryId !== input.nurseryId) {
      throw badRequest("Classroom not found for this nursery");
    }
  }

  return prisma.child.create({
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      birthDate: new Date(input.birthDate),
      guardianNote: input.guardianNote ?? null,
      parentId: input.parentId,
      classroomId: input.classroomId ?? null,
      nurseryId: input.nurseryId,
    },
  });
}

export async function updateChild(
  requestor: AuthUser,
  childId: string,
  input: Partial<ChildInput>,
) {
  const child = await prisma.child.findUnique({
    where: { id: childId },
  });
  if (!child) {
    throw notFound("Child not found");
  }

  if (requestor.role === Role.PARENT && child.parentId !== requestor.id) {
    throw forbidden("Cannot update another child");
  }

  if (requestor.role === Role.SUPERVISOR) {
    if (!requestor.nurseryId || requestor.nurseryId !== child.nurseryId) {
      throw forbidden("Cannot update child in another nursery");
    }
  }

  if ([Role.ADMIN, Role.MANAGER].includes(requestor.role)) {
    await ensureNurseryMatch(requestor, child.nurseryId);
  }

  if (
    ![Role.ADMIN, Role.MANAGER, Role.SUPERVISOR].includes(requestor.role) &&
    requestor.role !== Role.PARENT
  ) {
    throw forbidden();
  }

  const data: Record<string, unknown> = {};
  if (input.firstName !== undefined) data.firstName = input.firstName;
  if (input.lastName !== undefined) data.lastName = input.lastName;
  if (input.guardianNote !== undefined) data.guardianNote = input.guardianNote;
  if (input.birthDate !== undefined) {
    data.birthDate = new Date(input.birthDate);
  }
  if (input.classroomId !== undefined) {
    if (input.classroomId === null) {
      data.classroomId = null;
    } else {
      const classroom = await prisma.classroom.findUnique({
        where: { id: input.classroomId },
      });
      if (!classroom || classroom.nurseryId !== child.nurseryId) {
        throw badRequest("Classroom not found for this nursery");
      }
      data.classroomId = input.classroomId;
    }
  }

  if (input.parentId !== undefined) {
    const parent = await prisma.user.findUnique({
      where: { id: input.parentId },
    });
    if (!parent || parent.role !== Role.PARENT) {
      throw badRequest("Parent not found");
    }
    if (parent.nurseryId !== child.nurseryId) {
      throw badRequest("Parent belongs to a different nursery");
    }
    data.parentId = input.parentId;
  }

  return prisma.child.update({
    where: { id: childId },
    data,
  });
}

export async function deleteChild(requestor: AuthUser, childId: string) {
  ensureManagerialRole(requestor);

  const child = await prisma.child.findUnique({
    where: { id: childId },
  });
  if (!child) {
    throw notFound("Child not found");
  }

  await ensureNurseryMatch(requestor, child.nurseryId);

  await prisma.attendance.deleteMany({
    where: { childId },
  });
  await prisma.report.deleteMany({
    where: { childId },
  });
  await prisma.notification.deleteMany({
    where: { childId },
  });

  await prisma.child.delete({
    where: { id: childId },
  });
}
