import Header from "@/components/header";
import LabourList from "@/components/labour/labour-list";
import { Card, CardContent } from "@/components/ui/card";
import { SidebarInset } from "@/components/ui/sidebar";
import React, { Suspense } from "react";

const page = () => {
  return (
    <Suspense
      fallback={
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">
                  Loading labour records...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      }
    >
      <SidebarInset>
        <Header breadcrumbs={[{ label: "All Labours" }]} />
        <div className="flex flex-1 flex-col p-4">
          <LabourList />
        </div>
      </SidebarInset>
    </Suspense>
  );
};

export default page;
