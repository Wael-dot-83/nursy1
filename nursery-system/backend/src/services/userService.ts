import { Role } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AuthUser } from "../types/auth";
import { badRequest, forbidden, notFound } from "../utils/errors";
import { hashPassword } from "../utils/password";

const jordanPhoneRegex = /^\+9627\d{8}$/;

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw notFound("User not found");
  }

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    role: user.role,
    nurseryId: user.nurseryId,
    createdAt: user.createdAt,
  };
}

export async function listUsers(requestor: AuthUser) {
  const where =
    requestor.role === Role.ADMIN
      ? {}
      : {
          nurseryId: requestor.nurseryId ?? undefined,
        };

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      role: true,
      nurseryId: true,
      createdAt: true,
    },
  });

  return users;
}

type CreateUserInput = {
  email: string;
  fullName: string;
  phone: string;
  password: string;
  role: Role;
  nurseryId?: string | null;
};

export async function createUser(requestor: AuthUser, input: CreateUserInput) {
  if (!jordanPhoneRegex.test(input.phone)) {
    throw badRequest("Phone number must follow Jordan format (+9627XXXXXXXX)");
  }

  if (input.role === Role.ADMIN && requestor.role !== Role.ADMIN) {
    throw forbidden("Only admins can create other admins");
  }

  if (input.role === Role.MANAGER && requestor.role !== Role.ADMIN) {
    throw forbidden("Only admins can create managers");
  }

  if (
    input.role === Role.SUPERVISOR &&
    ![Role.ADMIN, Role.MANAGER].includes(requestor.role)
  ) {
    throw forbidden("Only managers or admins can create supervisors");
  }

  if (
    input.role === Role.PARENT &&
    requestor.role !== Role.ADMIN &&
    requestor.role !== Role.MANAGER
  ) {
    throw forbidden("Only admins or managers can create parents");
  }

  const targetNurseryId =
    input.nurseryId ??
    (requestor.role === Role.ADMIN ? null : requestor.nurseryId ?? null);

  if (targetNurseryId && requestor.role !== Role.ADMIN) {
    if (requestor.nurseryId !== targetNurseryId) {
      throw forbidden("Cannot assign user to another nursery");
    }
  }

  if ([Role.MANAGER, Role.SUPERVISOR, Role.PARENT].includes(input.role)) {
    if (!targetNurseryId) {
      throw badRequest("Nursery assignment is required for this role");
    }

    const nurseryExists = await prisma.nursery.findUnique({
      where: { id: targetNurseryId },
    });
    if (!nurseryExists) {
      throw badRequest("Nursery not found");
    }
  }

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email: input.email }, { phone: input.phone }],
    },
  });
  if (existing) {
    throw badRequest("Email or phone already in use");
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      fullName: input.fullName,
      phone: input.phone,
      role: input.role,
      nurseryId: targetNurseryId,
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      role: true,
      nurseryId: true,
      createdAt: true,
    },
  });

  return user;
}

export async function updateUser(
  requestor: AuthUser,
  userId: string,
  input: Partial<Omit<CreateUserInput, "password"> & { password: string }>,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw notFound("User not found");
  }

  if (
    requestor.role !== Role.ADMIN &&
    requestor.nurseryId !== user.nurseryId
  ) {
    throw forbidden("Cannot update user from another nursery");
  }

  const data: Record<string, unknown> = {};

  if (input.fullName) data.fullName = input.fullName;
  if (input.email) {
    const existingEmail = await prisma.user.findFirst({
      where: {
        email: input.email,
        NOT: { id: userId },
      },
    });
    if (existingEmail) {
      throw badRequest("Email already in use");
    }
    data.email = input.email;
  }
  if (input.phone) {
    if (!jordanPhoneRegex.test(input.phone)) {
      throw badRequest("Phone number must follow Jordan format (+9627XXXXXXXX)");
    }
    const existingPhone = await prisma.user.findFirst({
      where: {
        phone: input.phone,
        NOT: { id: userId },
      },
    });
    if (existingPhone) {
      throw badRequest("Phone already in use");
    }
    data.phone = input.phone;
  }
  if (input.role) {
    if (requestor.role !== Role.ADMIN && input.role === Role.ADMIN) {
      throw forbidden("Cannot promote to admin");
    }
    data.role = input.role;
  }
  if (input.nurseryId !== undefined) {
    if (input.nurseryId) {
      const nursery = await prisma.nursery.findUnique({
        where: { id: input.nurseryId },
      });
      if (!nursery) {
        throw badRequest("Nursery not found");
      }
    }
    data.nurseryId = input.nurseryId;
  }
  if (input.password) {
    data.passwordHash = await hashPassword(input.password);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      role: true,
      nurseryId: true,
      createdAt: true,
    },
  });

  return updated;
}

export async function deleteUser(requestor: AuthUser, userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw notFound("User not found");
  }

  if (user.role === Role.ADMIN && requestor.role !== Role.ADMIN) {
    throw forbidden("Cannot delete admin");
  }

  if (
    requestor.role !== Role.ADMIN &&
    requestor.nurseryId !== user.nurseryId
  ) {
    throw forbidden("Cannot delete user from another nursery");
  }

  await prisma.refreshToken.deleteMany({
    where: { userId },
  });

  await prisma.user.delete({
    where: { id: userId },
  });
}
