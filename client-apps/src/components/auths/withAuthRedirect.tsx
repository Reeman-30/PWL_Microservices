"use client";

import { useEffect, ComponentType } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./context/auth-context";

export const withAuthRedirect = <P extends object>(
  Component: ComponentType<P>,
): ComponentType<P> => {
  return function WithAuthRedirectComponent(props: P) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && user) {
        router.push("/modules"); //
        console.log("Redirecting to modules kuduna");
      }
    }, [user, loading, router]);

    if (loading) {
      return (
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ minHeight: "100vh" }}
        >
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      );
    }

    if (user) {
      return null;
    }

    return <Component {...props} />;
  };
};
