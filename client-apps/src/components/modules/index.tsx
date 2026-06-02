"use client";

import React, { useEffect, useState } from "react";

import { ModuleCard } from "./components/module-cards";
import { useAuth } from "@/components/auths/context/auth-context";
import { Skeleton } from "@/components/ui/loading";
import { useRouter } from "next/navigation";
import { Cards } from "../ui/cards";

interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  picture?: string;
  verified: boolean;
  status: string;
  role?: string;
}

export default function Dashboard() {
  return (
    <main className="min-vh-100 bg-light">
      <div className="container pb-5 pt-3">
        <CardUser />
        <ModuleSection />
      </div>
    </main>
  );
}

const CardUser = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { logout } = useAuth();

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem("accessToken");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/");
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
    } catch (error) {
      console.error("Error parsing user data:", error);
      router.push("/");
    } finally {
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return <Skeleton />;
  }

  return (
    <div className="mb-4">
      {/* Header Background with Gradient */}
      <div
        className="rounded-top position-relative"
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          height: "150px",
        }}
      >
        {/* Sign Out Button - Top Right */}
        <div className="position-absolute top-0 end-0 p-3">
          <button
            className="btn btn-light btn-sm d-flex align-items-center gap-2"
            onClick={logout}
          >
            <i className="bi bi-box-arrow-right"></i>
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* User Info Card */}
      <Cards>
        <Cards.Body className={`pt-0 px-4 pb-4`}>
          <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center gap-3">
            {/* Profile Picture */}
            <div className="position-relative" style={{ marginTop: "-70px" }}>
              {user?.picture ? (
                <img
                  src={user?.picture}
                  alt={user?.name}
                  className="rounded-circle border border-4 border-white shadow bg-light"
                  width="120"
                  height="120"
                  style={{ objectFit: "cover" }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null; // Prevent infinite loop
                    target.src = "/assets/images/logo.png";
                  }}
                />
              ) : (
                <div
                  className="rounded-circle border border-4 border-white shadow bg-secondary d-flex align-items-center justify-content-center"
                  style={{ width: "120px", height: "120px" }}
                >
                  <i
                    className="bi bi-person-fill text-white"
                    style={{ fontSize: "3rem" }}
                  ></i>
                </div>
              )}
            </div>

            {/* User Details */}
            <div className="flex-grow-1 mt-0">
              <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center gap-2 mb-2">
                <h2 className="h3 fw-bold mb-0">{user?.name}</h2>
                {user?.role && (
                  <span className="badge bg-primary rounded-pill px-3 py-2 fw-semibold">
                    {user.role}
                  </span>
                )}
              </div>

              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2 text-muted">
                  <i className="bi bi-envelope"></i>
                  <span>{user?.email}</span>
                </div>

                {/* Status Badges */}
                <div className="d-flex flex-wrap gap-3">
                  {/* Active Status */}
                  <div className="d-flex align-items-center gap-2">
                    <i
                      className={`bi bi-check-circle-fill ${user?.status === "active" ? "text-success" : "text-warning"}`}
                    ></i>
                    <span
                      className={`fw-semibold ${user?.status === "active" ? "text-success" : "text-warning"}`}
                    >
                      {user?.status === "active" ? "Active" : user?.status}
                    </span>
                  </div>

                  {/* Verified Status */}
                  {user?.verified && (
                    <div className="d-flex align-items-center gap-2">
                      <i className="bi bi-patch-check-fill text-primary"></i>
                      <span className="fw-semibold text-primary">Verified</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Cards.Body>
      </Cards>
    </div>
  );
};

const ModuleSection = () => {
  const modules = [
    {
      icon: "bookmark",
      title: "REST FULL API",
      description: "Bangun & konsumsi endpoint HTTP dengan praktik terbaik.",
      tag: "Microservices",
      path: "microservices",
    },
    {
      icon: "bookmark",
      title: "Machine Learning",
      description: "Algoritma supervised, unsupervised, dan reinforcement.",
      tag: "AI",
      path: "machine-learning",
    },
    {
      icon: "bookmark",
      title: "Deep Learning",
      description: "Neural network, CNN, RNN, dan transformer modern.",
      tag: "AI",
      path: "#",
    },
    {
      icon: "bookmark",
      title: "Natural Lang Processing",
      description: "Tokenisasi, embedding, hingga LLM fine-tuning.",
      tag: "NLP",
      path: "#",
    },
    {
      icon: "bookmark",
      title: "Computer Vision",
      description: "Pengolahan citra, deteksi objek, dan segmentasi.",
      tag: "Vision",
      path: "computer-visions",
    },
  ];

  return (
    <section>
      <div className="d-flex align-items-end justify-content-between mb-4">
        <div>
          <h2 className="fs-3 fw-semibold text-dark mb-2">
            Modul Pembelajaran
          </h2>
        </div>
        <span className="text-muted small d-none d-sm-block">
          {modules.length} modul
        </span>
      </div>

      <div className="row g-4 align-items-center justify-content-center">
        {modules.map((m) => (
          <div key={m.title} className="col-12 col-sm-6 col-lg-4">
            <ModuleCard {...m} />
          </div>
        ))}
      </div>
    </section>
  );
};
