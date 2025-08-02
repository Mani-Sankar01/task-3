"use client";

import AddMember from "@/components/addMember";
import EditMemberForm from "@/components/test-component/edit-member-form";
import React from "react";

const page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const memberId = (await params).id;
  return <EditMemberForm memberId={memberId} />;
};

export default page;
