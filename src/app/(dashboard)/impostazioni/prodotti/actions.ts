"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { slugifyKey } from "@/lib/field-types";

async function requireManage() {
  const session = await auth();
  if (!hasPermission(session?.user.permissions, "products:manage")) {
    throw new Error("Permesso negato");
  }
  return session!;
}

const productSchema = z.object({
  name: z.string().min(1, "Il nome è obbligatorio"),
  category: z.string().optional(),
  description: z.string().optional(),
});

export async function createProduct(formData: FormData) {
  await requireManage();

  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Dati non validi");
  }

  const product = await prisma.product.create({
    data: {
      ...parsed.data,
      templates: {
        create: {
          name: "Scheda misure",
          fields: [],
        },
      },
    },
  });

  revalidatePath("/impostazioni/prodotti");
  return product.id;
}

export async function updateProduct(productId: string, formData: FormData) {
  await requireManage();

  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Dati non validi");
  }

  await prisma.product.update({ where: { id: productId }, data: parsed.data });
  revalidatePath("/impostazioni/prodotti");
  revalidatePath(`/impostazioni/prodotti/${productId}`);
}

export async function toggleProductActive(productId: string, active: boolean) {
  await requireManage();
  await prisma.product.update({ where: { id: productId }, data: { active } });
  revalidatePath("/impostazioni/prodotti");
}

const fieldSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(["number", "text", "textarea", "select", "checkbox", "dimension"]),
  required: z.boolean(),
  unit: z.string().optional(),
  options: z.array(z.string()).optional(),
});

export async function saveTemplateFields(
  templateId: string,
  fields: {
    label: string;
    type: string;
    required: boolean;
    unit?: string;
    options?: string[];
  }[]
) {
  await requireManage();

  const usedKeys = new Set<string>();
  const parsedFields = fields.map((f) => {
    let key = slugifyKey(f.label);
    let suffix = 1;
    while (usedKeys.has(key) || !key) {
      key = `${slugifyKey(f.label) || "campo"}_${suffix++}`;
    }
    usedKeys.add(key);
    return fieldSchema.parse({ ...f, key });
  });

  const template = await prisma.measurementTemplate.update({
    where: { id: templateId },
    data: { fields: parsedFields, version: { increment: 1 } },
  });

  revalidatePath(`/impostazioni/prodotti/${template.productId}`);
}
