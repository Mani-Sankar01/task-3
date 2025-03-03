import { notFound } from "next/navigation";
import MeetingDetails from "@/components/meetings/meeting-details";
import { getMeetingById } from "@/data/meetings";
import { SidebarInset } from "@/components/ui/sidebar";
import Header from "@/components/header";

export default async function MeetingDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const meetingId = (await params).id;
  const meeting = getMeetingById(meetingId);

  if (!meeting) {
    notFound();
  }

  return (
    <SidebarInset>
      <Header breadcrumbs={[{ label: `${meetingId} - Details` }]} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
        <MeetingDetails meeting={meeting} />
      </div>
    </SidebarInset>
  );
}
