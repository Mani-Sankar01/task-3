import MembershipDetailsWrapper from "@/components/member-detail-page";
import AddMemberForm from "@/components/test-component/add-member-form";

export default async function page({ params }: { params: { id: string } }) {
  const memberId = await params.id;

  return <div>{memberId}</div>;
}
