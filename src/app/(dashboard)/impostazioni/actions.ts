"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { isDeveloper } from "@/lib/developer";

const createUserSchema = z.object({
  name: z.string().min(2, "Nome troppo corto"),
  email: z.string().email("Email non valida"),
  roleId: z.string().uuid("Ruolo non valido"),
  password: z.string().min(8, "La password deve avere almeno 8 caratteri"),
});

export async function createUser(formData: FormData) {
  const session = await auth();
  if (!hasPermission(session?.user.permissions, "users:manage")) {
    throw new Error("Permesso negato");
  }

  const parsed = createUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    roleId: formData.get("roleId"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Dati non validi");
  }

  const { name, email, roleId, password } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: { name, email: email.toLowerCase(), roleId, passwordHash },
  });

  await prisma.auditLog.create({
    data: {
      userId: session!.user.id,
      entityType: "user",
      action: "create",
      changes: { name, email, roleId },
      source: "manual",
    },
  });

  revalidatePath("/impostazioni");
}

export async function toggleUserActive(userId: string, active: boolean) {
  const session = await auth();
  if (!hasPermission(session?.user.permissions, "users:manage")) {
    throw new Error("Permesso negato");
  }
  if (userId === session!.user.id) {
    throw new Error("Non puoi disattivare il tuo stesso account");
  }

  await prisma.user.update({ where: { id: userId }, data: { active } });

  await prisma.auditLog.create({
    data: {
      userId: session!.user.id,
      entityType: "user",
      entityId: userId,
      action: active ? "activate" : "deactivate",
      source: "manual",
    },
  });

  revalidatePath("/impostazioni");
}

export async function changeUserRole(userId: string, roleId: string) {
  const session = await auth();
  if (!hasPermission(session?.user.permissions, "users:manage")) {
    throw new Error("Permesso negato");
  }
  if (userId === session!.user.id) {
    throw new Error("Non puoi cambiare il tuo stesso ruolo");
  }

  await prisma.user.update({ where: { id: userId }, data: { roleId } });

  await prisma.auditLog.create({
    data: {
      userId: session!.user.id,
      entityType: "user",
      entityId: userId,
      action: "change_role",
      changes: { roleId },
      source: "manual",
    },
  });

  revalidatePath("/impostazioni");
}

const updateUserSchema = z.object({
  name: z.string().min(2, "Nome troppo corto"),
  email: z.string().email("Email non valida"),
  password: z.string().min(8, "La password deve avere almeno 8 caratteri").optional().or(z.literal("")),
});

export async function updateUser(userId: string, formData: FormData) {
  const session = await auth();
  if (!hasPermission(session?.user.permissions, "users:manage")) {
    throw new Error("Permesso negato");
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) throw new Error("Utente non trovato");
  if (isDeveloper(target.email)) throw new Error("L'account sviluppatore non può essere modificato");

  const rawPassword = formData.get("password") as string;
  const parsed = updateUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: rawPassword || undefined,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Dati non validi");
  }

  const { name, email, password } = parsed.data;
  const data: Record<string, unknown> = { name, email: email.toLowerCase() };
  if (password) data.passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.update({ where: { id: userId }, data });

  await prisma.auditLog.create({
    data: {
      userId: session!.user.id,
      entityType: "user",
      entityId: userId,
      action: "update",
      changes: { name, email },
      source: "manual",
    },
  });

  revalidatePath("/impostazioni");
}

export async function deleteUser(userId: string) {
  const session = await auth();
  if (!hasPermission(session?.user.permissions, "users:manage")) {
    throw new Error("Permesso negato");
  }
  if (userId === session!.user.id) {
    throw new Error("Non puoi eliminare il tuo stesso account");
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) throw new Error("Utente non trovato");
  if (isDeveloper(target.email)) throw new Error("L'account sviluppatore non può essere eliminato");

  await prisma.user.delete({ where: { id: userId } });

  await prisma.auditLog.create({
    data: {
      userId: session!.user.id,
      entityType: "user",
      entityId: userId,
      action: "delete",
      changes: { name: target.name, email: target.email },
      source: "manual",
    },
  });

  revalidatePath("/impostazioni");
}
