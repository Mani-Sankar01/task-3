import NextAuth, {
  NextAuthOptions,
  Session,
  User as NextAuthUser,
  DefaultSession,
  DefaultUser,
} from "next-auth";
import { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import { rule } from "postcss";

// Define the extended User interface
declare module "next-auth" {
  interface Session {
    user: {
      role: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: any) {
        const { username, password } = credentials ?? {};

        // Dummy user check
        if (username === "admin" && password === "123") {
          return {
            id: "1",
            name: "Test User",
            email: "testuser@example.com",
            role: "admin", // Include role here
          };
        }
        if (username === "twwa" && password === "123") {
          return {
            id: "1",
            name: "Test User",
            email: "testuser@example.com",
            role: "twwaManager", // Include role here
          };
        }
        if (username === "tsmwa" && password === "123") {
          return {
            id: "1",
            name: "Test User",
            email: "testuser@example.com",
            role: "tsmwaManager", // Include role here
          };
        }

        return null;
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    jwt: async ({ user, token }: any) => {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    session: ({ session, token, user }: any) => {
      if (session.user) {
        session.user.role = token.role;
      }

      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
