import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import type { NextAuthConfig } from "next-auth";
import NextAuth, { type DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";

import { createDefaultWorkspace } from "@/data/create-default-workspsce";

import { getUserByEmail, getUserById } from "@/data/user";
import { env } from "@/env";
import { generateWorkspaceSlug } from "@/lib/generate-workspace-slug";
import { LoginSchema } from "@/schema/auth";
import { db } from "@/server/db";
import { nanoid } from "nanoid";
/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      defaultWorkspace: string;
    } & DefaultSession["user"];
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */

export const providers = {
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
    GithubProvider({
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    }),
    CredentialsProvider({
      id: "credentials",
      type: "credentials",
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },
      async authorize(credentials) {
        const validatedFields = LoginSchema.safeParse(credentials);

        // TODO: Add rate limiting & exceeded Login Attempts

        if (validatedFields.success) {
          const { email, password } = validatedFields.data;

          const user = await getUserByEmail(email);
          if (!user?.password) throw new Error("invalid-credentials");

          const passwordsMatch = await bcrypt.compare(password, user?.password);

          if (passwordsMatch) return user;
        }

        throw new Error("invalid-credentials");
      },
    }),
  ],
} satisfies NextAuthConfig;

export const authOptions: NextAuthConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false; // Prevent sign in without email or blacklisted email

      // Allow OAuth without email verification
      if (account?.provider !== "credentials") {
        // create a default workspace for the user
        return true;
      }

      // const existingUser = await getUserById(user.id);

      // Prevent sign in without email verification
      // if (!existingUser?.emailVerified) return false;

      // if (existingUser?.isTwoFactorEnabled) {
      //   const twoFactorConfirmation = await getTwoFactorConfirmationByUserId(
      //     existingUser.id,
      //   );

      //   if (!twoFactorConfirmation) return false;

      //   // Delete two factor confirmation for next sign in
      //   await deleteTwoFactorConfirmation(twoFactorConfirmation.id);
      // }

      return true;
    },
    async session({ token, session }) {
      if (session.user) {
        if (token.sub) session.user.id = token.sub;
        session.user.name = token.name;
        session.user.email = token.email!;
        session.user.defaultWorkspace = token.defaultWorkspace as string;
      }

      return session;
    },
    async jwt({ token }) {
      if (!token.sub) return token;

      const existingUser = await getUserById(token.sub);

      if (!existingUser) return token;

      token.name = existingUser.name;
      token.email = existingUser.email;
      token.defaultWorkspace = existingUser.defaultWorkspace;

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
  ...providers,
  debug: env.NODE_ENV === "development",
};

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth(authOptions);
