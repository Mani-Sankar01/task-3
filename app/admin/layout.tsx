"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";

import {
  AlertCircle,
  BellIcon,
  CalendarDays,
  ChartColumn,
  Check,
  ChevronRight,
  ChevronsUpDown,
  CircleAlert,
  ClipboardList,
  Dices,
  GalleryVerticalEnd,
  IndianRupee,
  ListTodoIcon,
  PlusSquare,
  SquareKanban,
  UserIcon,
  UserRoundCogIcon,
  UserRoundX,
  Users2,
  Users2Icon,
  UsersIcon,
  UsersRound,
} from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
} from "@/components/ui/sidebar";
import AuthButton from "@/components/AuthButton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const data = {
  versions: ["Admin", "TSMWA", "TQMWA"],
  navMain: [
    {
      title: "Platform",
      url: "#",
      items: [
        {
          title: "Dashboard",
          url: "/admin",
          icon: SquareKanban,
        },
        {
          title: "Analytics",
          url: "/admin/analytics",
          icon: ChartColumn,
        },
        {
          title: "Users",
          url: "/admin/users",
          icon: UserRoundCogIcon,
        },
      ],
    },
    {
      title: "Memberships",
      url: "/Memberships",
      items: [
        {
          title: "All Members",
          url: "/admin/memberships",
          icon: UsersIcon,
        },
        {
          title: "Membership Fees",
          url: "/admin/membership-fees",
          icon: IndianRupee,
        },
        {
          title: "Pending Approvals",
          url: "/admin/memberships/approval-pending",
          icon: AlertCircle,
        },
        {
          title: "Bill Approvals",
          url: "/admin/membership-fees/approval-pending",
          icon: AlertCircle,
        }
      ],
    },

    // {
    //   title: "Products",
    //   url: "/dashboard/products",
    //   items: [
    //     {
    //       title: "All Products",
    //       url: "/dashboard/products",
    //       icon: Dices,
    //     },
    //   ],
    // },
    {
      title: "GST & Invoices",
      url: "#",
      items: [
        // {
        //   title: "All Filling",
        //   url: "/admin/gst-filings",
        //   icon: SquareKanban,
        // },
        {
          title: "All Invoices",
          url: "/admin/invoices",
          icon: ClipboardList,
        },
        // {
        //   title: "Add Filling",
        //   url: "/gst-filling/add",
        //   icon: PlusSquare,
        // },
      ],
    },
    {
      title: "Meetings",
      url: "#",
      items: [
        {
          title: "All Meetings",
          url: "/admin/meetings",
          icon: CalendarDays,
        },
        {
          title: "Add Meeting",
          url: "/meetings/add",
          icon: PlusSquare,
        },
      ],
    },
    {
      title: "Vehicle",
      url: "#",
      items: [
        {
          title: "All Vehicle",
          url: "/admin/vehicle",
          icon: CalendarDays,
        },
        {
          title: "All Trips",
          url: "/admin/vehicle/trips",
          icon: IndianRupee,
        },
      ],
    },
    {
      title: "Labours",
      url: "#",
      items: [
        {
          title: "All Labours",
          url: "/admin/labour",
          icon: Users2,
        },
      ],
    },
    {
      title: "All Lease",
      url: "#",
      items: [
        {
          title: "All Lease",
          url: "/admin/lease-queries",
          icon: Users2,
        },
      ],
    },
  ],
};

  

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const { toast } = useToast();
const { data: session, status } = useSession();
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-sidebar-primary-foreground font-bold text-lg">
                  {(session?.user?.name?.[0] || 'U').toUpperCase()}
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">{session?.user?.name}</span>
                  <span className="capitalize text-xs text-muted-foreground">{session?.user?.role}</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>

          <Separator />
          {/* */}
        </SidebarHeader>
        <SidebarContent className="gap-0">
          {/* We create a collapsible SidebarGroup for each parent. */}
          {data.navMain.map((item) => (
            <Collapsible
              key={item.title}
              title={item.title}
              defaultOpen
              className="group/collapsible"
            >
              <SidebarGroup>
                <SidebarGroupLabel
                  asChild
                  className="group/label text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  <CollapsibleTrigger>
                    {item.title}{" "}
                    <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {item.items.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton
                            asChild
                            isActive={pathname == item.url ? true : false}
                          >
                            <div className="">
                              {item.icon && <item.icon className="w-4" />}
                              <a className="w-full" href={item.url}>
                                {item.title}
                              </a>
                            </div>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          ))}

          <div className="p-2 w-full">
            <Button
              variant={"default"}
              size={"lg"}
              className="w-full"
              onClick={() => {
                toast({
                  title: "Logout Successful",
                  description: "Redirecting you to login.",
                  variant: "destructive",
                });
                localStorage.removeItem("userRole");
                signOut();
              }}
            >
              Logout
            </Button>
          </div>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>

      {children}
    </SidebarProvider>
  );
}
