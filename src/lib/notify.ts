import { prisma } from "@/lib/prisma";

export async function notify(
  userId: string,
  params: { type: string; title: string; body?: string; link?: string }
) {
  await prisma.notification.create({
    data: {
      userId,
      type: params.type,
      title: params.title,
      body: params.body,
      link: params.link,
    },
  });
}

export async function notifyTitolari(params: {
  type: string;
  title: string;
  body?: string;
  link?: string;
}) {
  const titolari = await prisma.user.findMany({
    where: { active: true, role: { name: "titolare" } },
    select: { id: true },
  });
  await Promise.all(titolari.map((u) => notify(u.id, params)));
}
