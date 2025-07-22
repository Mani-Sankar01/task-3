"use client";
import MembershipDetailsWrapper from "@/components/member-detail-page";
import AddMemberForm from "@/components/test-component/add-member-form";

export default function Page({ params }: { params: { id: string } }) {
  const memberId = params.id;
  return <div>{memberId}</div>;
}
