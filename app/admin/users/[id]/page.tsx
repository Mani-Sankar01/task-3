"use client";
import Header from "@/components/header";
import { SidebarInset } from "@/components/ui/sidebar";
import React from "react";
import UserDetails from "@/components/users/user-details";

const Page = ({ params }: { params: { id: string } }) => {
  const userId = params.id;
  return (
    <SidebarInset>
      <Header breadcrumbs={[{ label: "Dashoard" }]} />
      <div className="flex flex-1 flex-col p-4">
        <UserDetails userId={userId} />
      </div>
    </SidebarInset>
  );
};

export default Page;
