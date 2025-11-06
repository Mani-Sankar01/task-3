import LogsList from "@/components/logs/logs-list";
import { SidebarInset } from "@/components/ui/sidebar";
import Header from "@/components/header";

export default function Page() {
  return (
    <SidebarInset>
      <Header breadcrumbs={[{ label: "System Logs" }]} />
      <div className="flex flex-1 flex-col p-4">
        <LogsList />
      </div>
    </SidebarInset>
  );
}
