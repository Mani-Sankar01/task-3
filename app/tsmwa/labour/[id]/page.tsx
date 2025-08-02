"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { notFound } from "next/navigation";
import axios from "axios";
import LabourDetails from "@/components/labour/labour-details";
import { SidebarInset } from "@/components/ui/sidebar";
import Header from "@/components/header";
import { Loader2 } from "lucide-react";

export default function Page({ params }: { params: { id: string } }) {
  const labourId = params.id;
  const { data: session, status: sessionStatus } = useSession();
  const [labour, setLabour] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const fetchLabourDetails = async () => {
    if (sessionStatus === "authenticated" && session?.user?.token) {
      setIsLoading(true);
      setError("");
      try {
        const response = await axios.get(
          `${process.env.BACKEND_API_URL || "https://tsmwa.online"}/api/labour/get_labour_id/${labourId}`,
          {
            headers: {
              Authorization: `Bearer ${session.user.token}`,
            },
          }
        );
        setLabour(response.data);
      } catch (err: any) {
        console.error("Error fetching labour details:", err);
        setError("Failed to load labour details");
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (sessionStatus === "loading") return;
    
    if (sessionStatus === "unauthenticated") {
      setError("Please login to view labour details");
      setIsLoading(false);
      return;
    }

    fetchLabourDetails();
  }, [sessionStatus, session?.user?.token, labourId]);

  if (isLoading) {
    return (
      <SidebarInset>
        <Header breadcrumbs={[{ label: "All Labours" }]} />
        <div className="flex flex-1 flex-col p-4">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">Loading labour details...</p>
            </div>
          </div>
        </div>
      </SidebarInset>
    );
  }

  if (error || !labour) {
    return (
      <SidebarInset>
        <Header breadcrumbs={[{ label: "All Labours" }]} />
        <div className="flex flex-1 flex-col p-4">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <p className="text-destructive mb-2">{error || "Labour not found"}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </SidebarInset>
    );
  }

  return (
    <SidebarInset>
      <Header breadcrumbs={[{ label: "All Labours" }]} />
      <div className="flex flex-1 flex-col p-4">
        <LabourDetails labour={labour} refetchLabour={fetchLabourDetails} />
      </div>
    </SidebarInset>
  );
}
