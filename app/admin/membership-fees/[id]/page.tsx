"use client";
import { notFound } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import MembershipFeeDetails from "@/components/membership-fees/membership-fee-details";
import { SidebarInset } from "@/components/ui/sidebar";
import Header from "@/components/header";

export default function Page({ params }: { params: { id: string } }) {
  const feeId = params.id;
  const [fee, setFee] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const { data: session, status } = useSession();

  useEffect(() => {
    const fetchFee = async () => {
      if (status === "authenticated" && session?.user?.token) {
        try {
          setIsLoading(true);
          const response = await axios.get(
            `${
              process.env.BACKEND_API_URL || "https://tsmwa.online"
            }/api/bill/getBillById/${feeId}`,
            {
              headers: {
                Authorization: `Bearer ${session.user.token}`,
              },
            }
          );
          setFee(response.data);
        } catch (err) {
          console.error("Error fetching membership fee:", err);
          setError("Failed to load membership fee details");
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchFee();
  }, [feeId, status, session?.user?.token]);

  if (status === "loading" || isLoading) {
    return (
      <SidebarInset>
        <Header breadcrumbs={[{ label: "Membership Fees Details" }]} />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">
                Loading membership fee details...
              </p>
            </div>
          </div>
        </div>
      </SidebarInset>
    );
  }

  if (error || !fee) {
    return (
      <SidebarInset>
        <Header breadcrumbs={[{ label: "Membership Fees Details" }]} />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <p className="text-destructive font-medium mb-2">Error</p>
              <p className="text-muted-foreground">{error || "Membership fee not found"}</p>
            </div>
          </div>
        </div>
      </SidebarInset>
    );
  }

  return (
    <SidebarInset>
      <Header breadcrumbs={[{ label: "Membership Fees Details" }]} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
        <MembershipFeeDetails fee={fee} />
      </div>
    </SidebarInset>
  );
}
