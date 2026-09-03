"use client";

import React from "react";
import { logo } from "@/assets";
import Image from "next/image";
import Link from "next/link";
import SidebarItem from "../sidebar_item";
import Logout from "@/components/logout";
import { useUser } from "@/context/user_context";

const Sidebar = () => {
  const { user } = useUser();

  const adminRoutes = [
    {
      id: "1",
      label: "Clubs",
      href: "/dashboard"
    },
    {
      id: "2",
      label: "Year book",
      href: "/dashboard/yearbook"
    },
    {
      id: "3",
      label: "Forms",
      href: "/dashboard/forms"
    },
    {
      id: "4",
      label: "Rules",
      href: "/dashboard/rules"
    },
    {
      id: "5",
      label: "Calendar",
      href: "/dashboard/calendar"
    },
    {
      id: "6",
      label: "NZFSS Contacts",
      href: "/dashboard/contact"
    },
    {
      id: "7",
      label: "Club Contacts",
      href: "/dashboard/club-contacts"
    },
    {
      id: "8",
      label: "Club Mushers",
      href: "/dashboard/club-mushers"
    },
    {
      id: "9",
      label: "Title Changes",
      href: "/dashboard/title-changes"
    }
  ];

  const clubRoutes = [
    {
      id: "1",
      label: "Events",
      href: "/events"
    },
    {
      id: "2",
      label: "Club Details",
      href: "/manage-club"
    },
    {
      id: "3",
      label: "Club Mushers",
      href: "/manage-musher"
    },
    {
      id: "3b",
      label: "Musher Transfers",
      href: "/manage-musher/transfers"
    },
    {
      id: "4",
      label: "Club Contact",
      href: "/clubcontact"
    }
  ];

  const routes = user?.role === "ADMIN" ? adminRoutes : clubRoutes;

  return (
    <div className="h-full overflow-y-auto -ml-[2vw] -mt-4 w-[25vw] max-w-[320px]">
      <div className="px-[30px] pb-[24px] flex flex-col justify-between h-full w-[17vw] max-w-[320px]">
        <div className=" px-[10px] flex flex-col gap-y-[48px] flex-grow">
          <Link href={"/home"}>
            {/* Logo component here */}
          </Link>

          <div className="flex flex-col gap-6">
            {routes.map((route) => (
              <SidebarItem
                key={route.id}
                id={route.id}
                label={route.label}
                href={route.href}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
