"use client";

import AuthButton from "@/components/AuthButton";
import { useSession } from "next-auth/react";
function page() {
  const session = useSession();
  return (
    <div>
      <div>Role: {session.data?.user.role}</div>
      TWWA <AuthButton />
    </div>
  );
}

export default page;
