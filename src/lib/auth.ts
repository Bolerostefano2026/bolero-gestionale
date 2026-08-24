import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          include: { role: true },
        });
        if (!user || !user.active) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        await prisma.auditLog.create({
          data: {
            userId: user.id,
            entityType: "auth",
            entityId: user.id,
            action: "login",
            source: "manual",
          },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatarUrl ?? undefined,
          roleId: user.roleId,
          roleName: user.role.name,
          roleLabel: user.role.label,
          permissions: (user.role.permissions as string[]) ?? [],
        };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user, trigger }) => {
      if (user) {
        token.roleId = user.roleId;
        token.roleName = user.roleName;
        token.roleLabel = user.roleLabel;
        token.permissions = user.permissions;
        token.activeCheckedAt = Date.now();
      }
      // Controlla se l'utente è ancora attivo ogni ora — invalida il token se disabilitato
      const checkedAt = (token.activeCheckedAt as number | undefined) ?? 0;
      if (token.sub && Date.now() - checkedAt > 60 * 60 * 1000) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { active: true },
        });
        if (!dbUser?.active) return null;
        token.activeCheckedAt = Date.now();
      }
      // Quando il client chiama update() dopo cambio nome/avatar, rilegge il DB
      if (trigger === "update" && token.sub) {
        const fresh = await prisma.user.findUnique({
          where: { id: token.sub },
          include: { role: true },
        });
        if (fresh) {
          token.name = fresh.name;
          token.picture = fresh.avatarUrl ?? undefined;
          token.roleId = fresh.roleId;
          token.roleName = fresh.role.name;
          token.roleLabel = fresh.role.label;
          token.permissions = (fresh.role.permissions as string[]) ?? [];
        }
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.name = (token.name as string) ?? session.user.name;
        session.user.image = (token.picture as string | undefined) ?? session.user.image;
        session.user.roleId = token.roleId as string;
        session.user.roleName = token.roleName as string;
        session.user.roleLabel = token.roleLabel as string;
        session.user.permissions = token.permissions as string[];
      }
      return session;
    },
  },
});
