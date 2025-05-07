import { AddReadingButton } from "@/components/AddReadingButton";
import AuthButton from "@/components/AuthButton";
import FilterableTable2 from "@/components/FilterableTable2";
import { PrismaClient } from "@prisma/client";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // adjust path as needed
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { read } from "fs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { BarChart3, Layers, Users } from "lucide-react";

const prisma = new PrismaClient();

// Set the page to dynamic to avoid caching in Next.js 13+
export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/api/auth/signin"); // Redirects to login page if not authenticated
  }

  if (session.user?.role === "twwaManager") {
    redirect("/twwa");
  }
  if (session.user?.role === "tsmwaManager") {
    redirect("/tsmwa");
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight">
          Select Your Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          Choose one of the following options to continue
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-6">
        {/* Admin Dashboard Card */}
        <Link href="/admin" className="block w-[300px]">
          <Card className="h-full transition-all hover:shadow-lg hover:border-primary">
            <CardHeader className="text-center pb-2">
              <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <BarChart3 className="h-10 w-10 text-primary" />
              </div>
              <CardTitle>Admin Dashboard</CardTitle>
              <CardDescription>
                Manage users, content and settings
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p>
                Complete administrative control with analytics, user management,
                and system configuration.
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* TSMWA Card */}
        <Link href="/tsmwa" className="block w-[300px]">
          <Card className="h-full transition-all hover:shadow-lg hover:border-primary">
            <CardHeader className="text-center pb-2">
              <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Layers className="h-10 w-10 text-primary" />
              </div>
              <CardTitle>TSMWA</CardTitle>
              <CardDescription>
                Tandur Stone Merchant Association
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p>
                Manage and view all related to Tandur Stone Merchant
                Association.
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* TWWA Card */}
        <Link href="/twwa" className="block w-[300px]">
          <Card className="h-full transition-all hover:shadow-lg hover:border-primary">
            <CardHeader className="text-center pb-2">
              <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Users className="h-10 w-10 text-primary" />
              </div>
              <CardTitle>TQMWA</CardTitle>
              <CardDescription>
                Tandur Quary Mandal Welfare Association
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p>
                Manage and view all related to Tandur Quarry Mandal Welfare
                Association.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
