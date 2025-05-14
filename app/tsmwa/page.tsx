"use client";

import AuthButton from "@/components/AuthButton";
import { useSession } from "next-auth/react";
import { Router } from "next/router";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
function page() {
  const session = useSession();
  const router = useRouter();
  useEffect(() => {
    if (session.status === "unauthenticated") {
      router.push("/login");
    }
  }, [session.status, Router]);

  if (session.status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (session.status === "unauthenticated") {
    return null; // This will redirect in the useEffect
  }

  return (
    <div>
      TSMWA <AuthButton />
      <div>Role: {session.data?.user.role}</div>
      <div>token: {session.data?.user.token}</div>
    </div>
  );
}

export default page;
