import Header from "@/components/header";
import LabourForm from "@/components/labour/labour-form";
import { SidebarInset } from "@/components/ui/sidebar";

export default function Page() {
  return (
    <SidebarInset>
      <Header breadcrumbs={[{ label: "Add a Labour" }]} />
      <div className="flex flex-1 flex-col p-4">
        <LabourForm isEditMode={false} />
      </div>
    </SidebarInset>
  );
}
