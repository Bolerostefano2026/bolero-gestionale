import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";

export const runtime = "nodejs";

export type SearchResult = {
  type: "cliente" | "preventivo" | "progetto" | "misura" | "fattura";
  id: string;
  title: string;
  subtitle?: string;
  href: string;
};

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });

  const query = new URL(req.url).searchParams.get("q")?.trim();
  if (!query || query.length < 2) return NextResponse.json({ results: [] });

  const permissions = session.user.permissions;
  const results: SearchResult[] = [];

  const [clients, quotes, projects, measurements, invoices] = await Promise.all([
    prisma.client.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { surname: { contains: query, mode: "insensitive" } },
          { phone: { contains: query } },
          { email: { contains: query, mode: "insensitive" } },
          { city: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 5,
      select: { id: true, name: true, surname: true, city: true, phone: true },
    }),
    hasPermission(permissions, "quotes:read")
      ? prisma.quote.findMany({
          where: { number: { contains: query, mode: "insensitive" } },
          take: 4,
          include: { client: { select: { name: true, surname: true } } },
        })
      : Promise.resolve([]),
    hasPermission(permissions, "workflow:read")
      ? prisma.project.findMany({
          where: { title: { contains: query, mode: "insensitive" } },
          take: 4,
          include: { client: { select: { name: true, surname: true } } },
        })
      : Promise.resolve([]),
    hasPermission(permissions, "measurements:read")
      ? prisma.measurement.findMany({
          where: {
            OR: [
              { product: { name: { contains: query, mode: "insensitive" } } },
              { client: { surname: { contains: query, mode: "insensitive" } } },
            ],
          },
          take: 3,
          include: {
            product: { select: { name: true } },
            client: { select: { name: true, surname: true } },
          },
        })
      : Promise.resolve([]),
    hasPermission(permissions, "invoices:read")
      ? prisma.invoice.findMany({
          where: { number: { contains: query, mode: "insensitive" } },
          take: 4,
          include: { client: { select: { name: true, surname: true } } },
        })
      : Promise.resolve([]),
  ]);

  for (const c of clients) {
    results.push({
      type: "cliente",
      id: c.id,
      title: `${c.name} ${c.surname}`,
      subtitle: [c.city, c.phone].filter(Boolean).join(" · ") || undefined,
      href: `/clienti/${c.id}`,
    });
  }
  for (const q of quotes) {
    results.push({
      type: "preventivo",
      id: q.id,
      title: q.number,
      subtitle: `${q.client.name} ${q.client.surname} · CHF ${Number(q.total).toLocaleString("it-CH")}`,
      href: `/preventivi/${q.id}`,
    });
  }
  for (const p of projects) {
    results.push({
      type: "progetto",
      id: p.id,
      title: p.title,
      subtitle: `${p.client.name} ${p.client.surname}`,
      href: `/workflow/${p.id}`,
    });
  }
  for (const m of measurements) {
    results.push({
      type: "misura",
      id: m.id,
      title: m.product.name,
      subtitle: `${m.client.name} ${m.client.surname}`,
      href: `/misure/${m.id}`,
    });
  }
  for (const inv of invoices) {
    results.push({
      type: "fattura",
      id: inv.id,
      title: inv.number,
      subtitle: `${inv.client.name} ${inv.client.surname} · CHF ${Number(inv.total).toLocaleString("it-CH")}`,
      href: `/fatture/${inv.id}`,
    });
  }

  return NextResponse.json({ results });
}
