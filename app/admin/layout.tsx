"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";

import {
  BellIcon,
  CalendarDays,
  ChartColumn,
  Check,
  ChevronRight,
  ChevronsUpDown,
  CircleAlert,
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
  UsersIcon,
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
  versions: ["Admin", "TSMWA", "TQMA"],
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
          title: "Transactions",
          url: "/admin/transactions",
          icon: IndianRupee,
        },
        {
          title: "Analytics",
          url: "/admin/admin/analytics",
          icon: ChartColumn,
        },
        {
          title: "Notifications",
          url: "/admin/notifications",
          icon: BellIcon,
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
          url: "/admin/memberships/Fees",
          icon: IndianRupee,
        },
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
      title: "GST Filling",
      url: "#",
      items: [
        {
          title: "All Filling",
          url: "/admin/gst-filings",
          icon: SquareKanban,
        },
        {
          title: "Add Filling",
          url: "/gst-filling/add",
          icon: PlusSquare,
        },
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
          title: "Fees",
          url: "/admin/vehicle/Fees",
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
  ],
};

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [selectedVersion, setSelectedVersion] = React.useState(
    data.versions[0]
  );

  const pathname = usePathname();
  const { toast } = useToast();

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-sidebar-primary-foreground">
                      <UserIcon className="size-4" />
                    </div>
                    <div className="flex flex-col gap-0.5 leading-none">
                      <span className="font-semibold">Mani Sankar</span>
                      <span className="">{selectedVersion}</span>
                    </div>
                    <ChevronsUpDown className="ml-auto" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width]"
                  align="start"
                >
                  {data.versions.map((version) => (
                    <DropdownMenuItem
                      key={version}
                      onSelect={() => setSelectedVersion(version)}
                    >
                      {version}{" "}
                      {version === selectedVersion && (
                        <Check className="ml-auto" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
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
