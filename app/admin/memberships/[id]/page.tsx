import MembershipDetailsWrapper from "@/components/member-detail-page";

export default async function page({ params }: { params: { id: string } }) {
  const memberId = await params.id;

  return <MembershipDetailsWrapper id={memberId} />;
}
