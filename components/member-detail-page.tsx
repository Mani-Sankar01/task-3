"use client";

import React, { useEffect, useState } from "react";
import MembershipDetailsClient from "./membership-details-client";
import axios from "axios";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { SidebarInset } from "./ui/sidebar";
import Header from "./header";

export default function MembershipDetailsWrapper({ id }: { id: string }) {
  const { data: session, status } = useSession();
  const [memberData, setMemberData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMemberData = async () => {
    if (status === "authenticated" && session?.user?.token) {
      try {
        const response = await axios.get(
          `${process.env.BACKEND_API_URL}/api/member/get_member/${id}`,
          {
            headers: {
              Authorization: `Bearer ${session.user.token}`,
            },
          }
        );
        setMemberData(response.data);
      } catch (err: any) {
        console.error("Error fetching member data:", err);
        setError("Failed to load member data");
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchMemberData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session, id]);

  // Render loading state
  if (status === "loading" || isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">
              Loading memberships details...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="text-center">
                <p className="text-destructive font-medium mb-2">Error</p>
                <p className="text-muted-foreground">{error}</p>
                <Button
                  className="mt-4"
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) return <div>{error}</div>;
  if (!memberData) return <div>No data found.</div>;

  return (
    <SidebarInset>
      <Header breadcrumbs={[{ label: id }]} />
      <div className="flex flex-1 flex-col gap-4">
        <div>
          <MembershipDetailsClient member={memberData} refetchMember={fetchMemberData} />
        </div>
      </div>
    </SidebarInset>
  );
}
