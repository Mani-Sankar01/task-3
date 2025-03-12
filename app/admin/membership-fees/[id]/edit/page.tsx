import { notFound } from "next/navigation";
import MembershipFeeForm from "@/components/membership-fees/membership-fee-form";
import { getMembershipFeeById } from "@/data/membership-fees";
import { SidebarInset } from "@/components/ui/sidebar";
import Header from "@/components/header";

export default function EditMembershipFeePage({
  params,
}: {
  params: { id: string };
}) {
  const feeId = params.id;
  const fee = getMembershipFeeById(feeId);

  if (!fee) {
    notFound();
  }

  return (
    <SidebarInset>
      <Header breadcrumbs={[{ label: "Edit Membership Fees Details" }]} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
        <MembershipFeeForm fee={fee} isEditMode={true} />
      </div>
    </SidebarInset>
  );
}
