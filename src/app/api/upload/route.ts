import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { uploadPhoto } from "@/lib/storage";

export const runtime = "nodejs";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 8 * 1024 * 1024;

export async function POST(req: Request) {
  const session = await auth();
  if (!hasPermission(session?.user.permissions, "measurements:write")) {
    return NextResponse.json({ error: "Permesso negato" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Nessun file ricevuto" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Formato immagine non supportato" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File troppo grande (max 8MB)" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() || "jpg";
  const filename = `${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const url = await uploadPhoto(buffer, filename, file.type);

  return NextResponse.json({ url });
}
