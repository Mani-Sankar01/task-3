import LeaseQueryList from "@/components/lease-queries/lease-query-list";
import { SidebarInset } from "@/components/ui/sidebar";
import Header from "@/components/header";
export default function Page() {
  return (
    <SidebarInset>
      <Header breadcrumbs={[{ label: "All Lease Queries" }]} />
      <div className="flex flex-1 flex-col">
        <LeaseQueryList />
      </div>
    </SidebarInset>
  );
}
