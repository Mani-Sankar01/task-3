"use client";
import Header from "@/components/header";
import { SidebarInset } from "@/components/ui/sidebar";
import React from "react";
import {
  CalendarDays,
  CreditCard,
  DeleteIcon,
  Edit2,
  FileText,
  History,
  LayoutDashboard,
  CopyrightIcon as License,
  WashingMachineIcon as Machinery,
  MoreHorizontal,
  PackageIcon as Product,
  Trash2,
  UsersIcon,
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
import { getMemberById, addMember, updateMember } from "@/data/members";
import Link from "next/link";
import {
  getGstFilingsByMembershipId,
  getGstFilingStatistics,
} from "@/data/gst-filings";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";

const page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const memberId = (await params).id;
  const member = getMemberById(memberId);
  const gstFilling = getGstFilingsByMembershipId(memberId);
  const statistics = getGstFilingStatistics(memberId);

  return (
    <SidebarInset>
      <Header breadcrumbs={[{ label: memberId }]} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
        <div>
          <Card className="mb-2">
            <CardHeader className="flex flex-row items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src="/placeholder.svg" alt="Member avatar" />
                <AvatarFallback>
                  {member?.memberDetails.applicantName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-2xl">
                    {member?.memberDetails.applicantName}
                  </CardTitle>
                  <Badge>Active</Badge>
                </div>
                <CardDescription>Member since January 2024</CardDescription>
              </div>
              <Link href={`/admin/memberships/${memberId}/edit`}>
                <Button>Edit Profile</Button>
              </Link>
            </CardHeader>
          </Card>
        </div>
        <Card className="p-4">
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-7">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4" />
                Overview
              </TabsTrigger>

              <TabsTrigger
                value="transactions"
                className="flex items-center gap-2"
              >
                <CreditCard className="h-4 w-4" />
                Membership Fees
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
              <TabsTrigger value="labors" className="flex items-center gap-2">
                <UsersIcon className="h-4 w-4" />
                Labors
              </TabsTrigger>
            </TabsList>

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

            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Activity History</CardTitle>
                  <CardDescription>
                    Recent activities and changes to the membership
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      {
                        date: "2024-01-10",
                        action: "License renewed",
                        details: "Business Operation License - 2024",
                      },
                      {
                        date: "2024-01-05",
                        action: "Payment processed",
                        details: "Monthly membership fee",
                      },
                      {
                        date: "2023-12-28",
                        action: "Document uploaded",
                        details: "Annual compliance report",
                      },
                    ].map((activity, index) => (
                      <div key={index} className="flex items-start gap-4">
                        <div className="rounded-full bg-primary/10 p-2">
                          <History className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{activity.action}</p>
                          <p className="text-sm text-muted-foreground">
                            {activity.details}
                          </p>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {activity.date}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="transactions">
              <Card>
                <CardHeader>
                  <CardTitle>Transaction History</CardTitle>
                  <CardDescription>
                    A list of all transactions made by the member
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        {
                          date: "2024-01-10",
                          description: "Monthly Membership Fee",
                          amount: "$199.00",
                          status: "Paid",
                        },
                      ].map((transaction, index) => (
                        <TableRow key={index}>
                          <TableCell>{transaction.date}</TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell>{transaction.amount}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                transaction.status === "Paid"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {transaction.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="gst">
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Summary</CardTitle>
                  <CardDescription>
                    GST filing summary for this member
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="bg-muted p-4 rounded-md">
                      <h3 className="font-medium mb-2">Total Filings</h3>
                      <p className="text-2xl font-bold">
                        {statistics.totalFilings}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {statistics.filledFilings} filled,{" "}
                        {statistics.pendingFilings} pending,{" "}
                        {statistics.dueFilings} due
                      </p>
                    </div>
                    <div className="bg-muted p-4 rounded-md">
                      <h3 className="font-medium mb-2">Total Taxable Amount</h3>
                      <p className="text-2xl font-bold">
                        ₹{statistics.totalTaxableAmount.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Across all filings
                      </p>
                    </div>
                    <div className="bg-muted p-4 rounded-md">
                      <h3 className="font-medium mb-2">Total GST Paid</h3>
                      <p className="text-2xl font-bold">
                        ₹{statistics.totalTaxAmount.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        18% of taxable amount
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>GST Fillings</CardTitle>
                  <CardDescription>
                    Track and manage GST filling history
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>GST ID</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Filing Date</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Total Amount</TableHead>
                        <TableHead>Total Tax Amount</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {gstFilling.map((filing, index) => (
                        <TableRow key={index}>
                          <TableCell>{filing.id}</TableCell>
                          <TableCell>{filing.filingPeriod}</TableCell>
                          <TableCell>{filing.filingDate}</TableCell>
                          <TableCell>{filing.dueDate}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                filing.status === "filled"
                                  ? "default"
                                  : filing.status === "pending"
                                  ? "secondary"
                                  : "destructive"
                              }
                            >
                              {filing.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{filing.totalAmount}</TableCell>
                          <TableCell>{filing.totalTaxableAmount}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Link href={`/admin/gst-filings/${filing.id}`}>
                                <Button>
                                  <Edit2 />
                                </Button>
                              </Link>
                              <Button variant={"destructive"}>
                                <Trash2 />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="licenses">
              <Card>
                <CardHeader>
                  <CardTitle>Active Licenses</CardTitle>
                  <CardDescription>
                    View and manage member licenses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {[
                      {
                        name: "Business Operation License",
                        type: "Type A",
                        expiry: "2024-12-31",
                        status: "Active",
                      },
                      {
                        name: "Food Safety Certificate",
                        type: "Type B",
                        expiry: "2024-06-30",
                        status: "Expiring Soon",
                      },
                      {
                        name: "Health and Safety Permit",
                        type: "Type C",
                        expiry: "2024-09-15",
                        status: "Active",
                      },
                    ].map((license, index) => (
                      <Card key={index}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <div className="space-y-1">
                            <CardTitle className="text-base">
                              {license.name}
                            </CardTitle>
                            <CardDescription>
                              Type: {license.type}
                            </CardDescription>
                          </div>
                          <Badge
                            variant={
                              license.status === "Active"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {license.status}
                          </Badge>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Expires:
                            </span>
                            <span>{license.expiry}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
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
        </Card>
      </div>
    </SidebarInset>
  );
};

export default page;
