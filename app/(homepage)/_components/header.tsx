"use client";

import { downloadIcon, logo } from "@/assets";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { useQuery, gql } from "@apollo/client";
import gif from "@/assets/gg.gif"
import Phone from "@/assets/phone.gif";


const GET_ALL_YEARBOOKS = gql`
  query GetAllYearbooks {
    getAllYearbooks {
      _id
      yearbook
      yearPublish
    }
  }
`;

type Route = {
  label: string;
  href: string;
  sub?: SubRoute[];
};

type SubRoute = {
  label: string;
  href: string;
  icon?: string;
};

// Define a type for a Yearbook item.
type Yearbook = {
  yearbook: string;
  yearPublish: string;
  _id: string;
};

// Add GraphQL query to fetch club by ID
const GET_CLUB_BY_ID = gql`
  query FindClubById($input: FindClubByIdInput!) {
    findClubById(input: $input) {
      _id
      name
    }
  }
`;

/**
 * Header functional component used for rendering the top navigation,
 * including dropdown menus and interactive hover effects.
 *
 * @returns {JSX.Element} The rendered Header component.
 */
const Header: React.FC = () => {
  const pathname: string = usePathname();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Execute the GET_ALL_YEARBOOKS GraphQL query.
  const { data, loading, error } = useQuery<{ getAllYearbooks: Yearbook[] }>(
    GET_ALL_YEARBOOKS
  );
  if (error) {
    console.error("Error fetching yearbooks:", error);
  }
  const yearbooks: Yearbook[] = data?.getAllYearbooks || [];

  // Define the navigation routes.
  const routes: Route[] = [
    { label: "Home", href: "/home" },
    { label: "Juniors", href: "/juniors" },
    { label: "Forms", href: "/form" },
    { label: "Rules", href: "/rule" },
    { label: "Calendar", href: "/event_calendar" },
    { label: "Clubs", href: "/clubs" },
    { label: "History", href: "/history" },
    {
      label: "Yearbook Current",
      href: "#",
      sub: yearbooks.map((yearbook: Yearbook) => ({
        label: `${yearbook.yearPublish} Yearbook`,
        href: yearbook.yearbook,
        icon: downloadIcon,
      })),
    },
    { label: "IFSS", href: "/IFSS" },
    {
      label: "Points",
      href: "#",
      sub: [
        { label: "Musher ranking", href: "/musher-ranking" },
        { label: "Result", href: "/result" },
        { label: "Dog race point", href: "/dog-race-point" },
        { label: "Dog weightpull point", href: "/dog-weightpull-points" },
      ],
    },
    {
      label: "Links",
      href: "#",
      sub: [
        {
          label: "International Federation Of Sleddog Sport",
          href: "https://sleddogsport.net/",
        },
        {
          label: "DogsNZ",
          href: "https://www.dogsnz.org.nz/",
        },
      ],
    },
  ];

  // Helper to determine if a route is active
  function isRouteActive(route: Route) {
    if (route.href === "/home") return pathname === "/" || pathname === "/home";
    if (route.href === "/form") return pathname === "/form" || pathname.startsWith("/form/");
    // Highlight 'Clubs' for both /clubs and /clubs/[id]
    if (route.href === "/clubs") return pathname === "/clubs" || /^\/clubs\/[^/]+$/.test(pathname);
    return pathname === route.href;
  }

  /**
   * Toggles the dropdown state for the given route label.
   *
   * @param {string} label - The label of the route to toggle.
   */
  const handleDropdownToggle = (label: string): void => {
    if (activeDropdown === label) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(label);
    }
  };

  return (
    <div className="w-full h-auto md:h-[200px] lg:h-[10.42vw] bg-white px-[16px] md:px-[48px] lg:px-[2.5vw] relative">
      {/* Desktop Header */}
      <div className="hidden lg:flex pt-[47px] lg:pt-[2.45vw] h-[56px] lg:h-[2.92vw] w-full gap-x-[24px] lg:gap-x-[1.25vw]">
        <Link href="/">
          <Image className="w-[53.57px] h-[56px] lg:w-[2.79vw] lg:h-[2.92vw]" src={logo} alt="Logo" />
        </Link>
        <div className="border-[#B5B5B5] border-[0.89px] rounded-[10px] flex-1 h-[56px] lg:h-[2.92vw] flex justify-between items-center px-[24px] lg:px-[1.25vw]">
          <div className="flex gap-x-[24px] lg:gap-x-[1.25vw] flex-wrap justify-between w-full">
            {routes.map((route, i) => (
              <div key={i} className="relative flex items-center">
                <Link
                  href={route.href}
                  className="flex items-center gap-x-[8px] lg:gap-x-[0.42vw] group"
                  onClick={(e) => {
                    if (route.sub) {
                      e.preventDefault();
                      handleDropdownToggle(route.label);
                    }
                  }}
                >
                  <div
                    className={`w-[8px] h-[8px] lg:w-[0.42vw] lg:h-[0.42vw] rounded-full transition-all duration-300 ease-in-out transform ${
                      isRouteActive(route)
                        ? "bg-[#000000] translate-y-0"
                        : "group-hover:bg-[#000000] group-hover:translate-y-0 translate-y-[10px] lg:translate-y-[0.52vw]"
                    }`}
                  ></div>
                  <p
                    className={
                      isRouteActive(route)
                        ? "text-[#000000] text-[16px] lg:text-[0.83vw] font-[600]"
                        : "text-[#838484] text-[16px] lg:text-[0.83vw] group-hover:text-[#000000] font-[600] transition-colors duration-300"
                    }
                  >
                    {route.label}
                  </p>
                  {route.sub && (
                    <span className="text-[#838484]">
                      {activeDropdown === route.label ? (
                        <ChevronUp className="w-[20px] h-[20px] lg:w-[1.04vw] lg:h-[1.04vw]" />
                      ) : (
                        <ChevronDown className="w-[20px] h-[20px] lg:w-[1.04vw] lg:h-[1.04vw]" />
                      )}
                    </span>
                  )}
                </Link>
                {route.sub && activeDropdown === route.label && (
                  <div className="absolute top-[56px] lg:top-[2.92vw] left-0 bg-white shadow-md rounded-[10px] w-[200px] lg:w-[10.42vw]">
                    {route.sub.map((subRoute, subIndex) => (
                      route.label === "Yearbook Current" ? (
                        <a
                          key={subIndex}
                          href={subRoute.href}
                          download
                          target="_self"
                          className="font-[600] flex items-center justify-between px-[16px] lg:px-[0.83vw] py-[8px] lg:py-[0.42vw] text-[#000000] hover:bg-[#f1f1f1] rounded-[10px] text-[14px] lg:text-[0.73vw]"
                          onClick={async (e) => {
                            e.preventDefault();
                            try {
                              const response = await fetch(subRoute.href);
                              const blob = await response.blob();
                              const url = window.URL.createObjectURL(blob);
                              const link = document.createElement("a");
                              link.href = url;
                              link.download = `${subRoute.label.replace(" Yearbook", "")}_yearbook.pdf`;
                              document.body.appendChild(link);
                              link.click();
                              window.URL.revokeObjectURL(url);
                              document.body.removeChild(link);
                            } catch (error) {
                              console.error("Error downloading yearbook:", error);
                              window.open(subRoute.href, "_blank");
                            }
                          }}
                        >
                          {subRoute.label}
                          {subRoute.icon && (
                            <Image
                              src={subRoute.icon as string}
                              alt="download icon"
                              className="lg:w-[0.83vw] lg:h-[0.83vw]"
                            />
                          )}
                        </a>
                      ) : (
                        <Link
                          key={subIndex}
                          href={subRoute.href}
                          className="font-[600] flex items-center justify-between px-[16px] lg:px-[0.83vw] py-[8px] lg:py-[0.42vw] text-[#000000] hover:bg-[#f1f1f1] rounded-[10px] text-[14px] lg:text-[0.73vw]"
                        >
                          {subRoute.label}
                          {subRoute.icon && (
                            <Image
                              src={subRoute.icon as string}
                              alt="download icon"
                              className="lg:w-[0.83vw] lg:h-[0.83vw]"
                            />
                          )}
                        </Link>
                      )
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-x-[24px] lg:gap-x-[1.25vw]">
          <Link href="/contacts">
            <button
              type="button"
              className="group flex items-center justify-start h-[56px] lg:h-[2.92vw] bg-transparent text-[#000000] w-[167px] lg:w-[8.7vw] border border-[#B5B5B5] rounded-[10px] px-[20px] lg:px-[1.04vw] focus:outline-none"
            >
              <div className="relative w-[48px] h-[48px] lg:w-[2.5vw] lg:h-[2.5vw]">
                <div className="absolute inset-0 flex items-center justify-start transition-opacity duration-300 opacity-100 group-hover:opacity-0">
                  <div className="w-[8px] h-[8px] lg:w-[0.42vw] lg:h-[0.42vw] bg-[#000000] rounded-full"></div>
                </div>
                {/* Hover icon: Enlarged Phone gif aligned to the left */}
                <div className="absolute inset-0 flex items-center justify-start -ml-[0.8vw] transition-opacity duration-300 opacity-0 group-hover:opacity-100">
                  <Image
                    src={Phone}
                    alt="Phone icon"
                    width={48}
                    height={48}
                    className="object-contain lg:w-[2.5vw] lg:h-[2.5vw]"
                  />
                </div>
              </div>
           
              <span className="-ml-2 text-[#000000] text-[16px] lg:text-[0.938vw] font-[600]">Contacts</span>
            </button>
          </Link>
          <Link href="/login">
            <button
              type="button"
              className="group flex items-center justify-start h-[56px] lg:h-[2.92vw] bg-[#000000] text-white w-[167px] lg:w-[8.7vw] rounded-[10px] px-[20px] lg:px-[1.04vw] focus:outline-none"
            >
              <div className="relative w-[48px] h-[48px] lg:w-[2.5vw] lg:h-[2.5vw]">
                <div className="absolute inset-0 flex items-center justify-start transition-opacity duration-300 opacity-100 group-hover:opacity-0">
                  <div className="w-[8px] h-[8px] lg:w-[0.42vw] lg:h-[0.42vw] bg-white rounded-full"></div>
                </div>
                {/* Hover icon: Enlarged gif aligned to the left */}
                <div className="absolute inset-0 flex items-center justify-start -ml-[0.8vw] transition-opacity duration-300 opacity-0 group-hover:opacity-100">
                  <Image
                    src={gif}
                    alt="Login gif"
                    width={48}
                    height={48}
                    className="object-contain lg:w-[2.5vw] lg:h-[2.5vw]"
                  />
                </div>
              </div>
              <span className="-ml-2 text-white text-[16px] lg:text-[0.938vw] font-[600]">Login</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="flex lg:hidden justify-between items-center h-[80px]">
        <Link href="/">
          <Image className="w-[40px] h-[42px]" src={logo} alt="Logo" />
        </Link>
        {/* Show club pill in mobile header if on club details page */}
        {/* Removed club pill rendering */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed top-0 right-0 w-[70%] max-w-[280px] h-screen bg-white z-50 shadow-xl flex flex-col">
          {/* Header with close button */}
          <div className="flex justify-start items-center h-[60px] px-[12px] border-b border-gray-100 flex-shrink-0">
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 hover:bg-gray-200 ml-[180px] rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Scrollable menu content */}
          <div className="flex-1 px-[12px] py-[12px] overflow-y-auto">
            <div className="flex flex-col gap-y-[16px]">
              {routes.map((route, i) => (
                <div key={i}>
                  <div
                    className="flex items-center justify-between py-2"
                    onClick={() => {
                      if (route.sub) {
                        handleDropdownToggle(route.label);
                      }
                    }}
                  >
                    <Link
                      href={route.href}
                      className="flex items-center gap-x-[12px] flex-1"
                      onClick={(e) => {
                        if (route.sub) {
                          e.preventDefault();
                        } else {
                          setIsMobileMenuOpen(false);
                        }
                      }}
                    >
                      <div className={`w-[6px] h-[6px] rounded-full flex-shrink-0 ${
                        isRouteActive(route)
                          ? "bg-black"
                          : "bg-gray-300"
                      }`} />
                      <span className="text-[16px] font-[500] text-gray-800">{route.label}</span>
                    </Link>
                    {route.sub && (
                      <button className="p-1 ml-2">
                        <ChevronDown 
                          className={`w-[18px] h-[18px] transition-transform text-gray-600 ${
                            activeDropdown === route.label ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    )}
                  </div>

                  {route.sub && activeDropdown === route.label && (
                    <div className="ml-[18px] mt-[8px] mb-[8px] flex flex-col gap-y-[12px] pl-3 border-l-2 border-gray-100">
                      {route.sub.map((subRoute, subIndex) => (
                        route.label === "Yearbook Current" ? (
                          <a
                            key={subIndex}
                            href={subRoute.href}
                            download
                            target="_self"
                            className="flex items-center justify-between py-1"
                            onClick={async (e) => {
                              e.preventDefault();
                              setIsMobileMenuOpen(false);
                              try {
                                const response = await fetch(subRoute.href);
                                const blob = await response.blob();
                                const url = window.URL.createObjectURL(blob);
                                const link = document.createElement("a");
                                link.href = url;
                                link.download = `${subRoute.label.replace(" Yearbook", "")}_yearbook.pdf`;
                                document.body.appendChild(link);
                                link.click();
                                window.URL.revokeObjectURL(url);
                                document.body.removeChild(link);
                              } catch (error) {
                                console.error("Error downloading yearbook:", error);
                                window.open(subRoute.href, "_blank");
                              }
                            }}
                          >
                            <span className="text-[14px] text-[#666] pr-2">
                              {subRoute.label}
                            </span>
                            {subRoute.icon && (
                              <Image
                                src={subRoute.icon as string}
                                alt="icon"
                                width={16}
                                height={16}
                                className="flex-shrink-0"
                              />
                            )}
                          </a>
                        ) : (
                          <Link
                            key={subIndex}
                            href={subRoute.href}
                            className="flex items-center justify-between py-1"
                            onClick={() => {
                              setIsMobileMenuOpen(false);
                            }}
                          >
                            <span className="text-[14px] text-[#666] pr-2">
                              {subRoute.label}
                            </span>
                            {subRoute.icon && (
                              <Image
                                src={subRoute.icon as string}
                                alt="icon"
                                width={16}
                                height={16}
                                className="flex-shrink-0"
                              />
                            )}
                          </Link>
                        )
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Fixed login button at bottom */}
          <div className="px-[12px] py-[12px] border-t border-gray-100 flex-shrink-0 flex justify-center">
            <Link 
              href="login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-[205px] mr-10 h-[40px] bg-black text-white rounded-[6px] flex items-center justify-center gap-x-[6px] transition-colors hover:bg-gray-800"
            >
              <div className="w-[4px] h-[4px] rounded-full bg-white flex-shrink-0" />
              <span className="font-[500] text-[14px]">Login</span>
            </Link>
          </div>
        </div>
      )}

      {/* Optional: Add overlay when menu is open */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default Header;
