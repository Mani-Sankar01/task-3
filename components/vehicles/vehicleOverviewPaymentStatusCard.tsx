"use client";

import { TrendingUp } from "lucide-react";
import { Pie, PieChart } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartConfig = {
  amounts: {
    label: "Amounts",
  },
  totalAmountToPay: {
    label: "Total",
    color: "hsl(var(--chart-1))",
  },
  totalAmountPaid: {
    label: "Paid ",
    color: "hsl(var(--chart-2))",
  },
  totalDues: {
    label: "Dues ",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

interface VehicleOverviewPaymentStatusCardPropType {
  totalAmountToPay: number;
  totalAmountPaid: number;
  totalDues: number;
}

export function VehicleOverviewPaymentStatusCard({
  totalAmountToPay,
  totalAmountPaid,
  totalDues,
}: VehicleOverviewPaymentStatusCardPropType) {
  const chartData = [
    {
      browser: "totalAmountToPay",
      amounts: totalAmountToPay,
      fill: "var(--color-totalAmountToPay)",
    },
    {
      browser: "totalAmountPaid",
      amounts: totalAmountPaid,
      fill: "var(--color-totalAmountPaid)",
    },
    {
      browser: "totalDues",
      amounts: totalDues,
      fill: "var(--color-totalDues)",
    },
  ];
  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Payment Status Distribution</CardTitle>
        <CardDescription>Breakdown of trip payment statuses</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="amounts"
              nameKey="browser"
              innerRadius={60}
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Showing total visitors for the last 6 months
        </div>
      </CardFooter>
    </Card>
  );
}
