"use client";

import AddMember from "@/components/addMember";
import React from "react";

const page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const memberId = (await params).id;
  return <AddMember editMode={true} meterId={memberId} />;
};

export default page;
