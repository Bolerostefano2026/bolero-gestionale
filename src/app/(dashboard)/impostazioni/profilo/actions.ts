"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function aggiornaNome(formData: FormData) {
  const session = await auth();
  if (!session) return { error: "Non autorizzato" };

  const name = formData.get("name")?.toString().trim();
  if (!name || name.length < 2) return { error: "Nome non valido" };

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name },
  });

  revalidatePath("/impostazioni/profilo");
  return { success: "Nome aggiornato" };
}

export async function cambiaPassword(formData: FormData) {
  const session = await auth();
  if (!session) return { error: "Non autorizzato" };

  const current = formData.get("current")?.toString();
  const nuova = formData.get("nuova")?.toString();
  const conferma = formData.get("conferma")?.toString();

  if (!current || !nuova || !conferma) return { error: "Compila tutti i campi" };
  if (nuova.length < 8) return { error: "La password deve essere di almeno 8 caratteri" };
  if (nuova !== conferma) return { error: "Le password non coincidono" };

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.password) return { error: "Account senza password locale" };

  const valid = await bcrypt.compare(current, user.password);
  if (!valid) return { error: "Password attuale errata" };

  const hash = await bcrypt.hash(nuova, 12);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: hash },
  });

  return { success: "Password aggiornata" };
}

export async function aggiornaAvatar(formData: FormData) {
  const session = await auth();
  if (!session) return { error: "Non autorizzato" };

  const imageUrl = formData.get("imageUrl")?.toString().trim();
  if (!imageUrl) return { error: "URL immagine mancante" };

  await prisma.user.update({
    where: { id: session.user.id },
    data: { image: imageUrl },
  });

  revalidatePath("/impostazioni/profilo");
  return { success: "Avatar aggiornato" };
}
