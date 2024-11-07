// components/AuthButton.tsx
"use client";

import { useSession, signIn, signOut } from "next-auth/react";

export default function AuthButton() {
  const { data: session } = useSession();

  return session ? (
    <button
      onClick={() => signOut()}
      className="bg-red-500 text-white px-4 py-2 rounded-md"
    >
      Logout
    </button>
  ) : (
    <button
      onClick={() => signIn()}
      className="bg-blue-500 text-white px-4 py-2 rounded-md"
    >
      Login
    </button>
  );
}
