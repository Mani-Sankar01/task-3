import Header from "@/components/header";
import { SidebarInset } from "@/components/ui/sidebar";
import { Suspense } from "react";
import AnalyticsOverview from "@/components/analytics/analytics-overview";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic"; // This ensures the page is not statically generated

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
                  Loading analytics...
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
          <AnalyticsOverview />
        </div>
      </SidebarInset>
    </Suspense>
  );
};

export default page;
