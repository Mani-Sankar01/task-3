import EditMemberForm from "@/components/test-component/edit-member-form";

export default async function page({ params }: { params: { id: string } }) {
  const memberId = await params.id;

  return <EditMemberForm memberId={memberId} />;
}
