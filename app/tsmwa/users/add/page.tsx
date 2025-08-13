import Header from "@/components/header";
import { SidebarInset } from "@/components/ui/sidebar";
import UserForm from "@/components/users/user-form";
import React from "react";

const page = () => {
  return (
    <SidebarInset>
      <Header breadcrumbs={[{ label: "Add a user" }]} />
      <div className="flex flex-1 flex-col p-4">
        <UserForm />
      </div>
    </SidebarInset>
  );
};

export default page;
