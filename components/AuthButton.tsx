// components/AuthButton.tsx
"use client";

import { useToast } from "@/hooks/use-toast";
import { useSession, signIn, signOut } from "next-auth/react";

export default function AuthButton() {
  const { data: session } = useSession();
  const { toast } = useToast();

  return session ? (
    <button
      onClick={() => {
        toast({
          title: "Logout Successful",
          description: "Redirecting you to login.",
          variant: "destructive",
        });
        signOut();
      }}
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
