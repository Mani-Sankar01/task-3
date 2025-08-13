"use client";

import React, { useEffect } from "react";
import { SidebarInset } from "@/components/ui/sidebar";
import Header from "@/components/header";
import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic"; // This ensures the page is not statically generated
import DashboardOverview from "@/components/dashboard/dashboard-overview";
import { useSession } from "next-auth/react";

function page() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role) {
      localStorage.setItem("userRole", session.user.role);
    }
  }, [status, session]);
  return (
    <Suspense
      fallback={
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">
                  Loading dashboard...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      }
    >
      <SidebarInset>
        <Header breadcrumbs={[{ label: "Dashoard" }]} />
        <div className="flex flex-1 flex-col">
          <DashboardOverview />
        </div>
      </SidebarInset>
    </Suspense>
  );
}

export default page;
