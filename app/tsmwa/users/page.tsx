import type { Metadata } from "next";
import UsersList from "@/components/users/users-list";
import { SidebarInset } from "@/components/ui/sidebar";
import Header from "@/components/header";

export const metadata: Metadata = {
  title: "Users Management",
  description: "Manage system users and their roles",
};

export default function UsersPage() {
  return (
    <SidebarInset>
      <Header breadcrumbs={[{ label: "Dashoard" }]} />
      <div className="flex flex-1 flex-col p-4">
        <UsersList />
      </div>
    </SidebarInset>
  );
}
