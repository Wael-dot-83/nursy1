import { Role } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AuthUser } from "../types/auth";
import { badRequest, forbidden, notFound } from "../utils/errors";

type ClassroomInput = {
  name: string;
  description?: string | null;
  nurseryId: string;
  supervisorId?: string | null;
};

function assertCanManage(requestor: AuthUser) {
  if (![Role.ADMIN, Role.MANAGER].includes(requestor.role)) {
    throw forbidden("Insufficient permissions for classrooms");
  }
}

async function assertNurseryOwnership(
  requestor: AuthUser,
  nurseryId: string,
) {
  if (requestor.role === Role.ADMIN) {
    return;
  }
  if (!requestor.nurseryId || requestor.nurseryId !== nurseryId) {
    throw forbidden("Cannot manage classroom in another nursery");
  }
}

export async function listClassrooms(requestor: AuthUser) {
  const where =
    requestor.role === Role.ADMIN
      ? {}
      : { nurseryId: requestor.nurseryId ?? undefined };

  return prisma.classroom.findMany({
    where,
    include: {
      supervisor: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
      nursery: {
        select: {
          id: true,
          name: true,
        },
      },
      children: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function createClassroom(
  requestor: AuthUser,
  input: ClassroomInput,
) {
  assertCanManage(requestor);
  await assertNurseryOwnership(requestor, input.nurseryId);

  const nursery = await prisma.nursery.findUnique({
    where: { id: input.nurseryId },
  });
  if (!nursery) {
    throw badRequest("Nursery not found");
  }

  if (input.supervisorId) {
    const supervisor = await prisma.user.findUnique({
      where: { id: input.supervisorId },
    });
    if (!supervisor || supervisor.role !== Role.SUPERVISOR) {
      throw badRequest("Supervisor not found");
    }
    if (supervisor.nurseryId !== input.nurseryId) {
      throw badRequest("Supervisor assigned to different nursery");
    }
  }

  return prisma.classroom.create({
    data: {
      name: input.name,
      description: input.description ?? null,
      nurseryId: input.nurseryId,
      supervisorId: input.supervisorId ?? null,
    },
  });
}

export async function updateClassroom(
  requestor: AuthUser,
  classroomId: string,
  input: Partial<ClassroomInput>,
) {
  assertCanManage(requestor);

  const classroom = await prisma.classroom.findUnique({
    where: { id: classroomId },
  });
  if (!classroom) {
    throw notFound("Classroom not found");
  }

  await assertNurseryOwnership(requestor, classroom.nurseryId);

  const data: Partial<ClassroomInput> & Record<string, unknown> = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.description !== undefined) data.description = input.description;
  if (input.supervisorId !== undefined) {
    if (input.supervisorId === null) {
      data.supervisorId = null;
    } else {
      const supervisor = await prisma.user.findUnique({
        where: { id: input.supervisorId },
      });
      if (!supervisor || supervisor.role !== Role.SUPERVISOR) {
        throw badRequest("Supervisor not found");
      }
      if (supervisor.nurseryId !== classroom.nurseryId) {
        throw badRequest("Supervisor assigned to different nursery");
      }
      data.supervisorId = input.supervisorId;
    }
  }

  return prisma.classroom.update({
    where: { id: classroomId },
    data,
  });
}

export async function deleteClassroom(
  requestor: AuthUser,
  classroomId: string,
) {
  assertCanManage(requestor);

  const classroom = await prisma.classroom.findUnique({
    where: { id: classroomId },
    include: { children: true },
  });
  if (!classroom) {
    throw notFound("Classroom not found");
  }

  await assertNurseryOwnership(requestor, classroom.nurseryId);

  if (classroom.children.length > 0) {
    throw badRequest("Cannot delete classroom with enrolled children");
  }

  await prisma.classroom.delete({
    where: { id: classroomId },
  });
}
