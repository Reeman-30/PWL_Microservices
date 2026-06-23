"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  let pathname = usePathname();
  const navigations = [
    {
      id: 1,
      name: "Robot Navigation",
      path: "/modules/machine-learning/reinforcement",
      icon: "bi-robot",
    },
    {
      id: 2,
      name: "Recomendation System",
      path: "/modules/machine-learning/reinforcement/recommendation",
      icon: "bi-stars",
    },
  ];

  return (
    <div className="container-fluid">
      <div className="border rounded p-1">
        <div className="d-flex align-items-center justify-content-between">
          <h4 className="mb-0 text-muted">
            <i className="bi bi-arrow-repeat me-2"></i>
            Reinforcement Learning
          </h4>
          <ul className="nav nav-pills" role="tablist">
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
        </div>
      </div>

      {children}
    </div>
  );
}
