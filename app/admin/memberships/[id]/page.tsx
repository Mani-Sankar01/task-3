"use client";
import MembershipDetailsWrapper from "@/components/member-detail-page";

export default function Page({ params }: { params: { id: string } }) {
  const memberId = params.id;
  return <MembershipDetailsWrapper id={memberId} />;
}
