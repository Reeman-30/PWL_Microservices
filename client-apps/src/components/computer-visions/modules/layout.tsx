"use client";
import { Cards } from "@/components/ui/cards";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

export default function Layout({
  children,
  navigations,
}: {
  children: React.ReactNode;
  navigations: any[];
}) {
  const pathname = usePathname();
  const last_path = pathname.split("/").pop();

  const isNavActive = (navPath: string) => {
    if (pathname === navPath) return true;

    if (pathname.startsWith(navPath + "/")) {
      const moreSpecificNav = navigations.find(
        (nav) =>
          nav.path !== navPath &&
          nav.path.length > navPath.length &&
          pathname.startsWith(nav.path),
      );
      return !moreSpecificNav;
    }

    return false;
  };

  return (
    <div className="">
      <div className="d-flex align-items-center">
        <Link className="btn btn-clear" href={"/modules/computer-visions"}>
          <i className="bi bi-arrow-left-circle text-success fs-1"></i>
        </Link>
        <div className="d-flex flex-column">
          <span className="fs-4">Computer Vision Modules</span>
          <span className="text-muted">{last_path}</span>
        </div>
      </div>
      {navigations && Object.values(navigations).length > 0 && (
        <ul className="nav nav-tabs mt-2" role="tablist">
          {navigations.map((nav) => {
            const isActive = isNavActive(nav.path);
            return (
              <li className="nav-item" key={nav.id} role="presentation">
                <Link
                  href={nav.path}
                  className={`nav-link ${isActive ? "active fw-bold" : ""}`}
                >
                  <i className={`bi ${nav.icon} me-2`}></i>
                  {nav.name}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <div className={`${navigations && Object.values(navigations).length > 0 ? 'border border-top-0':''}  p-2 mb-5`}>{children}</div>
    </div>
  );
}
