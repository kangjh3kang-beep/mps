import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";
import { z } from "zod";

import { getUserByEmail, upsertOAuthUser, getUserById } from "@/lib/server/user-db";
import { verifyPassword } from "@/lib/server/password";

type JwtToken = {
  sub?: string;
  email?: string;
  mfaEnabled?: boolean;
  mfaVerified?: boolean;
};

function optionalProviders() {
  const providers = [];
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push(
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET
      })
    );
  }
  // Apple requires additional env/config (teamId/keyId/privateKey) depending on provider usage.
  if (process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET) {
    providers.push(
      AppleProvider({
        clientId: process.env.APPLE_CLIENT_ID,
        clientSecret: process.env.APPLE_CLIENT_SECRET
      })
    );
  }
  return providers;
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/signin"
  },
  providers: [
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const schema = z.object({
          email: z.string().email(),
          password: z.string().min(6)
        });
        const parsed = schema.safeParse(credentials);
        if (!parsed.success) return null;

        const u = await getUserByEmail(parsed.data.email);
        if (!u?.passwordHash) return null;
        const ok = verifyPassword(parsed.data.password, u.passwordHash);
        if (!ok) return null;

        return {
          id: u.id,
          email: u.email
        };
      }
    }),
    ...optionalProviders()
  ],
  callbacks: {
    async signIn({ user, account }) {
      // If OAuth sign-in, ensure we have a user record.
      if (account?.provider && account.provider !== "credentials") {
        if (user.email) {
          await upsertOAuthUser({ email: user.email, provider: account.provider });
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      const t = token as JwtToken;

      if (user?.id) {
        t.sub = user.id;
        t.email = user.email ?? t.email;
        const dbUser = await getUserById(user.id);
        t.mfaEnabled = !!dbUser?.mfa.enabled;
        t.mfaVerified = false;
      }

      if (trigger === "update") {
        // Allow setting MFA verified from client after successful TOTP verify.
        const s = session as any;
        if (s?.mfaVerified === true) t.mfaVerified = true;
      }

      return token;
    },
    async session({ session, token }) {
      const t = token as JwtToken;
      (session.user as any).id = t.sub;
      (session.user as any).mfaEnabled = !!t.mfaEnabled;
      (session.user as any).mfaVerified = !!t.mfaVerified;
      return session;
    }
  }
};







