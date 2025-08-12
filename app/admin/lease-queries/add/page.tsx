import Header from "@/components/header";
import LeaseQueryForm from "@/components/lease-queries/lease-query-form";
import { SidebarInset } from "@/components/ui/sidebar";

export default function Page() {
  return (
    <SidebarInset>
      <Header breadcrumbs={[{ label: "Add a Lease Query" }]} />
      <div className="flex flex-1 flex-col p-4">
        <LeaseQueryForm />
      </div>
    </SidebarInset>
  );
}
