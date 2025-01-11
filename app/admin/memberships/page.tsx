"use client";

import React from "react";
import { SidebarInset } from "@/components/ui/sidebar";
import Header from "@/components/header";
import { Component1 } from "@/components/chart1";
import { Component4 } from "@/components/chart4";
import { Component3 } from "@/components/chart3";
import { Component2 } from "@/components/component2";
import FilterableTable2 from "@/components/FilterableTable2";

const page = () => {
  const readings = [
    {
      id: "1",
      meterId: "MET459",
      name: "Charlie Davis",
      email: "user1730813275123@example.com",
      date: new Date(),
      status: "LIVE",
      price: 351,
    },
    {
      id: "2",
      meterId: "MET794",
      name: "John Doe",
      email: "user1730813350120@example.com",
      date: new Date(),
      status: "LIVE",
      price: 965,
    },
    {
      id: "3",
      meterId: "MET845",
      name: "John Doe",
      email: "user1730813353495@example.com",
      date: new Date(),
      status: "CANCELLED",
      price: 129,
    },
    {
      id: "4",
      meterId: "MET024",
      name: "Alice Brown",
      email: "user1730816428256@example.com",
      date: new Date(),
      status: "INACTIVE",
      price: 232,
    },
    {
      id: "5",
      meterId: "MET382",
      name: "Bob Johnson",
      email: "user1730818830359@example.com",
      date: new Date(),
      status: "CANCELLED",
      price: 242,
    },
    {
      id: "6",
      meterId: "MET783",
      name: "Jane Smith",
      email: "user1730823161952@example.com",
      date: new Date(),
      status: "CANCELLED",
      price: 841,
    },
    {
      id: "7",
      meterId: "MET362",
      name: "Bob Johnson",
      email: "user1731923150817@example.com",
      date: new Date(),
      status: "LIVE",
      price: 252,
    },
    {
      id: "7",
      meterId: "MET362",
      name: "Bob Johnson",
      email: "user1731923150817@example.com",
      date: new Date(),
      status: "LIVE",
      price: 252,
    },
    {
      id: "7",
      meterId: "MET362",
      name: "Bob Johnson",
      email: "user1731923150817@example.com",
      date: new Date(),
      status: "CANCELLED",
      price: 252,
    },
    {
      id: "7",
      meterId: "MET362",
      name: "Bob Johnson",
      email: "user1731923150817@example.com",
      date: new Date(),
      status: "LIVE",
      price: 252,
    },
    {
      id: "7",
      meterId: "MET362",
      name: "Bob Johnson",
      email: "user1731923150817@example.com",
      date: new Date(),
      status: "LIVE",
      price: 252,
    },
    {
      id: "7",
      meterId: "MET362",
      name: "Bob Johnson",
      email: "user1731923150817@example.com",
      date: new Date(),
      status: "INACTIVE",
      price: 252,
    },
    {
      id: "7",
      meterId: "MET362",
      name: "Bob Johnson",
      email: "user1731923150817@example.com",
      date: new Date(),
      status: "INACTIVE",
      price: 252,
    },
  ];

  const formattedReadings = readings.map((reading) => ({
    ...reading,
    date: reading.date.toISOString().split("T")[0], // Format date as YYYY-MM-DD
    status: reading.status.toLowerCase() as "live" | "inactive" | "cancelled",
  }));

  return (
    <SidebarInset>
      <Header breadcrumbs={[{ label: "All Memberships" }]} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
        <FilterableTable2 initialData={formattedReadings} />
      </div>
    </SidebarInset>
  );
};

export default page;
