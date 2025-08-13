"use client";

import React, { Suspense } from "react";
import { SidebarInset } from "@/components/ui/sidebar";
import Header from "@/components/header";
import { Card, CardContent } from "@/components/ui/card";
import MeetingsList from "@/components/meetings/meetings-list";

function page() {
  return (
    <SidebarInset>
      <Header breadcrumbs={[{ label: "All Meetings" }]} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
        <Suspense
          fallback={
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-center items-center min-h-[400px]">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">
                      Loading meetings...
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          }
        >
          <MeetingsList />
        </Suspense>
      </div>
    </SidebarInset>
  );
}

export default page;
