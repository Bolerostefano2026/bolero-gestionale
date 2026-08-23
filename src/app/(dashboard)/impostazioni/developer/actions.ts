"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isDeveloper } from "@/lib/developer";

async function requireDeveloper() {
  const session = await auth();
  if (!isDeveloper(session?.user.email)) throw new Error("Accesso negato");
  return session!;
}

export async function toggleFeatureFlag(key: string, enabled: boolean) {
  await requireDeveloper();
  await prisma.featureFlag.upsert({
    where: { key },
    update: { enabled },
    create: { key, label: key, enabled },
  });
  revalidatePath("/impostazioni/developer");
}

export async function createFeatureFlag(formData: FormData) {
  await requireDeveloper();
  const key = (formData.get("key") as string).trim().toLowerCase().replace(/\s+/g, "_");
  const label = (formData.get("label") as string).trim();
  const description = (formData.get("description") as string | null)?.trim() || null;
  if (!key || !label) throw new Error("Chiave e nome sono obbligatori");
  await prisma.featureFlag.create({ data: { key, label, description: description ?? undefined, enabled: false } });
  revalidatePath("/impostazioni/developer");
}

export async function deleteFeatureFlag(key: string) {
  await requireDeveloper();
  await prisma.featureFlag.delete({ where: { key } });
  revalidatePath("/impostazioni/developer");
}

export async function updateFeatureFlag(key: string, formData: FormData) {
  await requireDeveloper();
  const label = (formData.get("label") as string).trim();
  const description = (formData.get("description") as string | null)?.trim() || null;
  await prisma.featureFlag.update({ where: { key }, data: { label, description: description ?? undefined } });
  revalidatePath("/impostazioni/developer");
}
