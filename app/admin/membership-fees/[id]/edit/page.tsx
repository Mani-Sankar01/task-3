import { SidebarInset } from "@/components/ui/sidebar";
import Header from "@/components/header";
import MembershipFeeForm from "@/components/membership-fees/membership-fee-form";

export default function EditMembershipFeePage({
  params,
}: {
  params: { id: string };
}) {
  const billingId = params.id;
  return (
    <SidebarInset>
      <Header breadcrumbs={[{ label: "Edit Membership Fees Details" }]} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
        <MembershipFeeForm billingId={billingId} isEditMode={true} />
      </div>
    </SidebarInset>
  );
}
