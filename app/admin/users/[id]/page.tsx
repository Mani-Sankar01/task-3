import Header from "@/components/header";
import { SidebarInset } from "@/components/ui/sidebar";
import React from "react";
import type { Metadata } from "next";
import UserDetails from "@/components/users/user-details";

export const metadata: Metadata = {
  title: "User Details",
  description: "View user details",
};

const page = ({ params }: { params: { id: string } }) => {
  return (
    <SidebarInset>
      <Header breadcrumbs={[{ label: "Dashoard" }]} />
      <div className="flex flex-1 flex-col p-4">
        <UserDetails userId={params.id} />
      </div>
    </SidebarInset>
  );
};

export default page;
