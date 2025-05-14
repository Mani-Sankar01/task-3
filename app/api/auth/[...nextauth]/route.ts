import NextAuth, {
  type NextAuthOptions,
  type DefaultSession,
  type DefaultUser,
  type Session,
  RequestInternal,
} from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import axios from "axios";

// Extend the NextAuth User and Session types
declare module "next-auth" {
  interface Session {
    user: {
      id: number;
      fullName: string;
      gender: string;
      email: string | null;
      phone: string;
      role: string;
      status: string;
      token: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: string;
    phone?: string;
  }
}

// In-memory OTP storage (use a DB in production)
const otpStore: Record<string, { otp: string; expiry: number; role: string }> =
  {};

// NextAuth options
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Phone Number",
      credentials: {
        phone: { label: "Phone Number", type: "text" },
        otp: { label: "OTP", type: "text" },
        step: { label: "Step", type: "text" },
      },
      async authorize(
        credentials: Record<"phone" | "otp" | "step", string> | undefined,
        req: Pick<RequestInternal, "body" | "query" | "headers" | "method">
      ) {
        try {
          const { phone, otp, step } = credentials ?? {};

          if (!phone) {
            return null;
          }

          // Step 1: Request OTP (we don't authenticate at this step)
          if (step === "requestOTP") {
            // We don't need to return anything here as we're just requesting an OTP
            return null;
          }

          // Step 2: Verify OTP
          if (step === "verifyOTP") {
            if (!otp) return null;

            // Call the verify OTP API using axios
            try {
              const response = await axios.post(
                `${process.env.BACKEND_API_URL}/api/auth/verify_otp`,
                { phone, otp },
                {
                  headers: {
                    "Content-Type": "application/json",
                  },
                }
              );

              const data = response.data;
              console.log(data.token);

              // Return user data with token
              return {
                id: data.user.id,
                name: data.user.fullName,
                email: data.user.email || `${data.user.phone}@example.com`, // NextAuth requires an email
                fullName: data.user.fullName,
                gender: data.user.gender,
                phone: data.user.phone,
                role: data.user.role,
                status: data.user.status,
                token: data.token, // Store the JWT token
              };
            } catch (error) {
              console.error("Error verifying OTP:", error);
              return null;
            }
          }

          return null;
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      },
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.fullName = user.fullName;
        token.gender = user.gender;
        token.email = user.email;
        token.phone = user.phone;
        token.role = user.role;
        token.status = user.status;
        token.token = user.token; // Store the JWT token
      }
      return token;
    },

    async session({ session, token, user }: any) {
      if (session.user) {
        session.user.id = token.id;
        session.user.fullName = token.fullName;
        session.user.gender = token.gender;
        session.user.email = token.email;
        session.user.phone = token.phone;
        session.user.role = token.role;
        session.user.status = token.status;
        session.user.token = token.token; // Include the JWT token in the session
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },

  pages: {
    signIn: "/login",
    error: "/auth/error",
  },

  debug: process.env.NODE_ENV === "development",
};

// API handler
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
