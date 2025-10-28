import { prisma } from "../config/prisma";
import { AuthUser } from "../types/auth";
import { badRequest, forbidden, notFound } from "../utils/errors";

type NurseryInput = {
  name: string;
  address: string;
  city: string;
  district: string;
  phone?: string | null;
  email?: string | null;
};

export async function listNurseries(requestor: AuthUser) {
  if (requestor.role === "ADMIN") {
    return prisma.nursery.findMany({
      orderBy: { name: "asc" },
    });
  }

  if (!requestor.nurseryId) {
    return [];
  }

  const nursery = await prisma.nursery.findUnique({
    where: { id: requestor.nurseryId },
  });

  return nursery ? [nursery] : [];
}

export async function createNursery(requestor: AuthUser, input: NurseryInput) {
  if (requestor.role !== "ADMIN") {
    throw forbidden();
  }

  const exists = await prisma.nursery.findFirst({
    where: { name: input.name },
  });
  if (exists) {
    throw badRequest("Nursery with this name already exists");
  }

  return prisma.nursery.create({
    data: input,
  });
}

export async function updateNursery(
  requestor: AuthUser,
  nurseryId: string,
  input: Partial<NurseryInput>,
) {
  if (requestor.role !== "ADMIN") {
    throw forbidden();
  }

  const nursery = await prisma.nursery.findUnique({
    where: { id: nurseryId },
  });
  if (!nursery) {
    throw notFound("Nursery not found");
  }

  return prisma.nursery.update({
    where: { id: nurseryId },
    data: input,
  });
}

export async function deleteNursery(requestor: AuthUser, nurseryId: string) {
  if (requestor.role !== "ADMIN") {
    throw forbidden();
  }

  const nursery = await prisma.nursery.findUnique({
    where: { id: nurseryId },
  });
  if (!nursery) {
    throw notFound("Nursery not found");
  }

  const childCount = await prisma.child.count({ where: { nurseryId } });
  if (childCount > 0) {
    throw badRequest("Cannot delete nursery with enrolled children");
  }

  await prisma.nursery.delete({ where: { id: nurseryId } });
}
