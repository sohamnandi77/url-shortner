import type { NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";

import { getUserByEmail } from "@/data/user";
import { env } from "@/env";
import {
  exceededLoginAttemptsThreshold,
  incrementLoginAttempts,
  resetLoginAttempts,
} from "@/lib/auth/lock-account";
import { validatePassword } from "@/lib/auth/password";
import { LoginSchema } from "@/schema/auth";

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
      allowDangerousEmailAccountLinking: true,
    }),
    GithubProvider({
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
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

        if (validatedFields.success) {
          const { email, password } = validatedFields.data;

          const user = await getUserByEmail(email);
          if (!user?.password) throw new Error("invalid-credentials");

          if (exceededLoginAttemptsThreshold(user)) {
            throw new Error("exceeded-login-attempts");
          }

          const passwordMatch = await validatePassword({
            password,
            passwordHash: user.password,
          });

          if (!passwordMatch) {
            const exceededLoginAttempts = exceededLoginAttemptsThreshold(
              await incrementLoginAttempts(user),
            );

            if (exceededLoginAttempts) {
              throw new Error("exceeded-login-attempts");
            } else {
              throw new Error("invalid-credentials");
            }
          }

          // Reset invalid login attempts
          await resetLoginAttempts(user);

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
          };
        }

        throw new Error("invalid-credentials");
      },
    }),
  ],
} satisfies NextAuthConfig;
