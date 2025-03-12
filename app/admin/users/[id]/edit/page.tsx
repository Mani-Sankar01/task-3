import Header from "@/components/header";
import { SidebarInset } from "@/components/ui/sidebar";
import UserForm from "@/components/users/user-form";
import React from "react";

const page = ({ params }: { params: { id: string } }) => {
  return (
    <SidebarInset>
      <Header breadcrumbs={[{ label: "Edit an user" }]} />
      <div className="flex flex-1 flex-col p-4">
        <UserForm userId={params.id} />
      </div>
    </SidebarInset>
  );
};

export default page;
