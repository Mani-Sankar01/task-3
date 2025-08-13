import { Suspense } from "react";
import MembershipFeesList from "@/components/membership-fees/membership-fees-list";
import { Card, CardContent } from "@/components/ui/card";
import { SidebarInset } from "@/components/ui/sidebar";
import Header from "@/components/header";

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
                  Loading membership fees...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      }
    >
      <SidebarInset>
        <Header breadcrumbs={[{ label: "All Membership Fees" }]} />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
          <MembershipFeesList />
        </div>
      </SidebarInset>
    </Suspense>
  );
};

export default page;
