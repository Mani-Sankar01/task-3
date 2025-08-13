import Header from "@/components/header";
import { SidebarInset } from "@/components/ui/sidebar";
import UserForm from "@/components/users/user-form";
import React from "react";

const page = async ({ params }: { params: { id: string } }) => {
  const userId = await params.id;
  return (
    <SidebarInset>
      <Header breadcrumbs={[{ label: "Edit an user" }]} />
      <div className="flex flex-1 flex-col p-4">
        <UserForm userId={userId} />
      </div>
    </SidebarInset>
  );
};

export default page;
