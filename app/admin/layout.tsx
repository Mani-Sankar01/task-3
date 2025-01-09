"use client";

import React from "react";
import { usePathname } from "next/navigation";

import {
  BellIcon,
  CalendarDays,
  ChartColumn,
  Check,
  ChevronRight,
  ChevronsUpDown,
  Dices,
  GalleryVerticalEnd,
  IndianRupee,
  ListTodoIcon,
  PlusSquare,
  SquareKanban,
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

const data = {
  versions: ["1.0.1", "1.1.0-alpha", "2.0.0-beta1"],
  navMain: [
    {
      title: "Platform",
      url: "#",
      items: [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: SquareKanban,
        },
        {
          title: "Transactions",
          url: "/dashboard/transactions",
          icon: IndianRupee,
        },
        {
          title: "Analytics",
          url: "/dashboard/analytics",
          icon: ChartColumn,
        },
        {
          title: "Notifications",
          url: "/dashboard/notifications",
          icon: BellIcon,
        },
      ],
    },
    {
      title: "Memberships",
      url: "/dashboard/Memberships",
      items: [
        {
          title: "All Members",
          url: "/dashboard/memberships",
          icon: UsersIcon,
        },
        {
          title: "Fees",
          url: "/Vehicle/Fees",
          icon: IndianRupee,
        },
        {
          title: "Add Member",
          url: "/dashboard/members/add",
          icon: PlusSquare,
        },
      ],
    },

    {
      title: "Products",
      url: "/dashboard/products",
      items: [
        {
          title: "All Products",
          url: "/dashboard/products",
          icon: Dices,
        },
        {
          title: "Add Product",
          url: "/products/add",
          icon: PlusSquare,
        },
      ],
    },
    {
      title: "GST Filling",
      url: "#",
      items: [
        {
          title: "All Filling",
          url: "/gst-filling",
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
          url: "/meetings",
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
          url: "/Vehicle",
          icon: CalendarDays,
        },
        {
          title: "Fees",
          url: "/Vehicle/Fees",
          icon: IndianRupee,
        },
        {
          title: "Add Vehicle",
          url: "/Vehicle/add",
          icon: PlusSquare,
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
                      <GalleryVerticalEnd className="size-4" />
                    </div>
                    <div className="flex flex-col gap-0.5 leading-none">
                      <span className="font-semibold">Documentation</span>
                      <span className="">v{selectedVersion}</span>
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
                      v{version}{" "}
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
        </SidebarContent>
        <SidebarRail />
      </Sidebar>

      {children}
    </SidebarProvider>
  );
}
