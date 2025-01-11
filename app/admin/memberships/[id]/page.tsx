"use client";

import Header from "@/components/header";
import { SidebarInset } from "@/components/ui/sidebar";
import React from "react";
import {
  CalendarDays,
  CreditCard,
  FileText,
  History,
  LayoutDashboard,
  CopyrightIcon as License,
  WashingMachineIcon as Machinery,
  PackageIcon as Product,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const memberId = (await params).id;
  return (
    <SidebarInset>
      <Header breadcrumbs={[{ label: memberId }]} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
        <div>
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src="/placeholder.svg" alt="Member avatar" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-2xl">John Doe</CardTitle>
                  <Badge>Active</Badge>
                </div>
                <CardDescription>Member since January 2024</CardDescription>
              </div>
              <Button>Edit Profile</Button>
            </CardHeader>
          </Card>
        </div>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-7">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
            <TabsTrigger
              value="transactions"
              className="flex items-center gap-2"
            >
              <CreditCard className="h-4 w-4" />
              Transactions
            </TabsTrigger>
            <TabsTrigger value="gst" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              GST Fillings
            </TabsTrigger>
            <TabsTrigger value="licenses" className="flex items-center gap-2">
              <License className="h-4 w-4" />
              Licenses
            </TabsTrigger>
            <TabsTrigger
              value="machineries"
              className="flex items-center gap-2"
            >
              <Machinery className="h-4 w-4" />
              Machineries
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Product className="h-4 w-4" />
              Products
            </TabsTrigger>
          </TabsList>

          {/* Previous tab contents remain the same until licenses */}

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Spent
                  </CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$12,345</div>
                  <p className="text-xs text-muted-foreground">
                    +20.1% from last month
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Licenses
                  </CardTitle>
                  <License className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3</div>
                  <p className="text-xs text-muted-foreground">
                    2 renewals pending
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Last Filing
                  </CardTitle>
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Dec 15</div>
                  <p className="text-xs text-muted-foreground">
                    Next due in 12 days
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Previous tab contents remain the same */}

          <TabsContent value="machineries">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Machinery Inventory</CardTitle>
                  <CardDescription>
                    List of all registered machinery and equipment
                  </CardDescription>
                </div>
                <Button>
                  <Machinery className="h-4 w-4 mr-2" />
                  Add Machinery
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Machine ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Installation Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Maintenance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      {
                        id: "MCH001",
                        name: "Industrial Mixer XL2000",
                        installDate: "2023-06-15",
                        status: "Operational",
                        lastMaintenance: "2024-01-05",
                      },
                      {
                        id: "MCH002",
                        name: "Packaging Unit P100",
                        installDate: "2023-08-20",
                        status: "Maintenance",
                        lastMaintenance: "2024-01-10",
                      },
                      {
                        id: "MCH003",
                        name: "Conveyor Belt CB500",
                        installDate: "2023-09-01",
                        status: "Operational",
                        lastMaintenance: "2023-12-28",
                      },
                    ].map((machine) => (
                      <TableRow key={machine.id}>
                        <TableCell className="font-medium">
                          {machine.id}
                        </TableCell>
                        <TableCell>{machine.name}</TableCell>
                        <TableCell>{machine.installDate}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              machine.status === "Operational"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {machine.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{machine.lastMaintenance}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Product Catalog</CardTitle>
                  <CardDescription>
                    Registered products and their details
                  </CardDescription>
                </div>
                <Button>
                  <Product className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {[
                    {
                      id: "PRD001",
                      name: "Premium Widget X",
                      category: "Electronics",
                      status: "In Stock",
                      quantity: 150,
                      lastUpdated: "2024-01-10",
                    },
                    {
                      id: "PRD002",
                      name: "Super Gadget Y",
                      category: "Accessories",
                      status: "Low Stock",
                      quantity: 25,
                      lastUpdated: "2024-01-08",
                    },
                    {
                      id: "PRD003",
                      name: "Mega Tool Z",
                      category: "Tools",
                      status: "Out of Stock",
                      quantity: 0,
                      lastUpdated: "2024-01-05",
                    },
                  ].map((product) => (
                    <Card key={product.id}>
                      <CardHeader className="flex flex-row items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-base">
                            {product.name}
                          </CardTitle>
                          <CardDescription>ID: {product.id}</CardDescription>
                        </div>
                        <Badge
                          variant={
                            product.status === "In Stock"
                              ? "default"
                              : product.status === "Low Stock"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {product.status}
                        </Badge>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">
                              Category:
                            </span>
                            <span className="text-sm font-medium">
                              {product.category}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">
                              Quantity:
                            </span>
                            <span className="text-sm font-medium">
                              {product.quantity}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">
                              Last Updated:
                            </span>
                            <span className="text-sm font-medium">
                              {product.lastUpdated}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SidebarInset>
  );
};

export default page;
