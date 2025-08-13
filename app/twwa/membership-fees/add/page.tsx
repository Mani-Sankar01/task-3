import Header from "@/components/header";
import MembershipFeeForm from "@/components/membership-fees/membership-fee-form";
import { SidebarInset } from "@/components/ui/sidebar";

export default function AddMembershipFeePage() {
  return (
    <SidebarInset>
      <Header breadcrumbs={[{ label: "Add Membership Fees" }]} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
        <MembershipFeeForm isEditMode={false} />
      </div>
    </SidebarInset>
  );
}
