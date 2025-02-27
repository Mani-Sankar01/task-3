"use client";

import React from "react";

const page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const memberId = (await params).id;
  return <div>{memberId}</div>;
};

export default page;
