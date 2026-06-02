"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LayoutTemp from "../modules/layout-temp";

export default function LayoutMicroservicesTemp({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const navigations = [
    {
      id: 1,
      name: "Dashboard",
      path: "/modules/microservices",
      icon: "bi-speedometer2",
    },
    {
      id: 2,
      name: "Book Management",
      path: "/modules/microservices/book-management",
      icon: "bi-book",
    },
    {
      id: 3,
      name: "User Management",
      path: "/modules/microservices/user-management",
      icon: "bi-people",
    },
  ];

  return (
    <LayoutTemp>
      <ul className="nav nav-tabs" role="tablist">
        {navigations.map((nav) => (
          <li className="nav-item" key={nav.id} role="presentation">
            <Link
              href={nav.path}
              className={`nav-link ${pathname === nav.path ? "active" : ""}`}
            >
              <i className={`bi ${nav.icon} me-2`}></i>
              {nav.name}
            </Link>
          </li>
        ))}
      </ul>

      <div className="border rounded-bottom border-top-0 p-3 mb-5">
        {children}
      </div>
    </LayoutTemp>
  );
}
