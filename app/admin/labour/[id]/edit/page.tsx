import { notFound } from "next/navigation";
import LabourForm from "@/components/labour/labour-form";
import { getLabourById } from "@/data/labour";
import { SidebarInset } from "@/components/ui/sidebar";
import Header from "@/components/header";

export default async function Page({ params }: { params: { id: string } }) {
  const labourId = await params.id;
  const labour = getLabourById(labourId);

  if (!labour) {
    notFound();
  }

  return (
    <SidebarInset>
      <Header breadcrumbs={[{ label: "Edit Labour Details" }]} />
      <div className="flex flex-1 flex-col p-4">
        <LabourForm labour={labour} isEditMode={true} />
      </div>
    </SidebarInset>
  );
}
