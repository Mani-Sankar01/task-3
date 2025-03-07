"use client";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  FileText,
  Edit,
  ArrowLeft,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  type GstFiling,
  getMemberNameById,
  getGstFilingStatistics,
} from "@/data/gst-filings";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";

interface GstFilingDetailsProps {
  filing: GstFiling;
}

export default function GstFilingDetails({ filing }: GstFilingDetailsProps) {
  const router = useRouter();
  const memberName = getMemberNameById(filing.membershipId);
  const statistics = getGstFilingStatistics(filing.membershipId);

  const handleEdit = () => {
    router.push(`/admin/gst-filings/${filing.id}/edit`);
  };

  const handleBack = () => {
    router.push("/admin/gst-filings");
  };

  // Colors for the pie chart
  const COLORS = ["#0088FE", "#FFBB28", "#FF8042"];

  return (
    <div className="container">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="outline" onClick={handleBack} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <h1 className="text-2xl font-bold">GST Filing Details</h1>
        </div>
        <Button onClick={handleEdit}>
          <Edit className="mr-2 h-4 w-4" /> Edit Filing
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center">
                  <FileText className="mr-2 h-5 w-5" /> {filing.filingPeriod} -{" "}
                  {filing.id}
                </CardTitle>
                <CardDescription>Member: {memberName}</CardDescription>
              </div>
              <Badge
                variant={
                  filing.status === "filled"
                    ? "default"
                    : filing.status === "pending"
                    ? "secondary"
                    : "destructive"
                }
              >
                {filing.status.charAt(0).toUpperCase() + filing.status.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Due Date: {new Date(filing.dueDate).toLocaleDateString()}
                  </span>
                </div>
                {filing.filingDate && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Filing Date:{" "}
                      {new Date(filing.filingDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Created on:{" "}
                    {new Date(filing.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Total Taxable Amount: ₹
                    {filing.totalTaxableAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Total GST Amount (18%): ₹
                    {filing.totalAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Last Updated:{" "}
                    {new Date(filing.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
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
                <p className="text-2xl font-bold">{statistics.totalFilings}</p>
                <p className="text-sm text-muted-foreground">
                  {statistics.filledFilings} filled, {statistics.pendingFilings}{" "}
                  pending, {statistics.dueFilings} due
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

        <Tabs defaultValue="analytics" className="space-y-4">
          <TabsList>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="items">GST Items</TabsTrigger>
          </TabsList>

          <TabsContent value="items">
            <Card>
              <CardHeader>
                <CardTitle>GST Items</CardTitle>
                <CardDescription>
                  Breakdown of taxable items in this filing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Name</TableHead>
                      <TableHead className="text-right">
                        Taxable Amount (₹)
                      </TableHead>
                      <TableHead className="text-right">
                        GST Amount (₹)
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filing.gstItems.map((item, index) => (
                      <TableRow key={item.id || index}>
                        <TableCell className="font-medium">
                          {item.name}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.taxableAmount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {(item.taxableAmount * 0.18).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50">
                      <TableCell className="font-bold">Total</TableCell>
                      <TableCell className="text-right font-bold">
                        {filing.totalTaxableAmount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {filing.totalAmount.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
              {filing.notes && (
                <CardFooter>
                  <div className="w-full">
                    <h3 className="font-medium mb-2">Notes</h3>
                    <p className="text-muted-foreground">{filing.notes}</p>
                  </div>
                </CardFooter>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>GST Filing Status</CardTitle>
                  <CardDescription>
                    Distribution of filing statuses
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statistics.statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statistics.statusData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>GST Amount by Period</CardTitle>
                  <CardDescription>
                    Trend of GST amounts over time
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={statistics.filingsByPeriod}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip
                        formatter={(value) =>
                          `₹${Number(value).toLocaleString()}`
                        }
                      />
                      <Legend />
                      <Bar
                        dataKey="taxAmount"
                        name="GST Amount"
                        fill="#8884d8"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
