"use client";
import EditMemberForm from "@/components/test-component/edit-member-form";

export default function Page({ params }: { params: { id: string } }) {
  const memberId = params.id;
  return <EditMemberForm memberId={memberId} />;
}
