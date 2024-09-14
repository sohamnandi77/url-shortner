import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthConfig, User } from "next-auth";
import NextAuth, { type DefaultSession } from "next-auth";
import { type AdapterUser } from "next-auth/adapters";

import { createDefaultWorkspace } from "@/data/create-default-workspsce";

import { getUserById } from "@/data/user";
import { env } from "@/env";
import { generateWorkspaceSlug } from "@/lib/generate-workspace-slug";
import { db } from "@/server/db";
import { type UserProps } from "@/types";
import { nanoid } from "nanoid";
import { type JWT } from "next-auth/jwt";
import { providers } from "./providers";
/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id?: string;
      lockedAt?: Date;
      createdAt: Date;
      updatedAt: Date;
      defaultWorkspace?: string;
      provider: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    /** OpenID ID Token */
    user: User | UserProps | AdapterUser;
  }
}

// const VERCEL_DEPLOYMENT = !!process.env.VERCEL_URL;

export const authOptions: NextAuthConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      console.log({ user, account });

      if (!user.email) return false; // Prevent sign in without email or blacklisted email

      if ("lockedAt" in user && user?.lockedAt) {
        return false;
      }

      if (account?.provider !== "credentials") {
        return true;
      }

      return true;
    },
    async session({ token, session }) {
      if (session.user && token.user) {
        const user = token.user as UserProps;
        session.user = {
          ...session.user,
          ...user,
          id: token.sub ?? session.user.id,
        };
      }

      return session;
    },
    async jwt({
      token,
      user,
      trigger,
    }: {
      token: JWT;
      user: User | AdapterUser | UserProps;
      trigger?: "signIn" | "update" | "signUp";
    }) {
      if (!token.sub) return token;

      if (user) {
        token.user = user;
      }

      // refresh the user's data if they update their name / email
      if (trigger === "update") {
        const refreshedUser = await getUserById(token.sub);
        if (refreshedUser) {
          token.user = {
            ...refreshedUser,
            provider: "credentials",
          } as UserProps;
        }
      }

      return token;
    },
  },
  events: {
    async createUser({ user }) {
      const slug = generateWorkspaceSlug(user?.id);
      const inviteCode = nanoid(24);
      // create a default workspace for the user
      await createDefaultWorkspace(user?.id, slug, inviteCode);
    },
  },
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  // cookies: {
  //   sessionToken: {
  //     name: `${VERCEL_DEPLOYMENT ? "__Secure-" : ""}next-auth.session-token`,
  //     options: {
  //       httpOnly: true,
  //       sameSite: "lax",
  //       path: "/",
  //       // When working on localhost, the cookie domain must be omitted entirely (https://stackoverflow.com/a/1188145)
  //       domain: VERCEL_DEPLOYMENT
  //         ? `.${process.env.NEXT_PUBLIC_APP_DOMAIN}`
  //         : undefined,
  //       secure: VERCEL_DEPLOYMENT,
  //     },
  //   },
  // },
  ...providers,
  debug: env.NODE_ENV === "development",
};

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth(authOptions);
