"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/auths/context/auth-context";
import { ProgressBar } from "react-bootstrap";

interface ProtectedRouteProps {
    children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [shouldRedirect, setShouldRedirect] = useState(false);
    const [isChecking, setIsChecking] = useState(true);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Force re-check authentication on pathname change
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsChecking(true);
        setProgress(0);

        const checkAuth = () => {
            const token = localStorage.getItem("accessToken");
            const userData = localStorage.getItem("user");

            if (!token || !userData) {
                setShouldRedirect(true);
            } else {
                setShouldRedirect(false);
            }

            setIsChecking(false);
            setProgress(100);
        };

        // Add small delay to ensure state is updated
        const timer = setTimeout(checkAuth, 50);

        return () => clearTimeout(timer);
    }, [pathname]);

    useEffect(() => {
        if (!loading && !user && !isChecking) {
            const timer = setTimeout(() => {
                setShouldRedirect(true);
            }, 100);

            return () => clearTimeout(timer);
        }
    }, [user, loading, isChecking]);

    useEffect(() => {
        if (shouldRedirect) {
            sessionStorage.setItem("redirectAfterLogin", pathname);
            router.push("/sign-in");
        }
    }, [shouldRedirect, router, pathname]);

    // Animate progress bar
    useEffect(() => {
        if (loading || isChecking) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setProgress(0);
            const interval = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 90) return 90; // Stop at 90% until actually done
                    return prev + 10;
                });
            }, 100);

            return () => clearInterval(interval);
        } else {
            setProgress(100);
            // Reset progress after animation completes
            const timer = setTimeout(() => setProgress(0), 500);
            return () => clearTimeout(timer);
        }
    }, [loading, isChecking]);

    if (loading || isChecking) {
        return (
            <>
                <div className="position-fixed w-100 top-0" style={{ zIndex: 9999 }}>
                    <ProgressBar animated now={progress} />
                </div>
                {children}
            </>
        );
    }

    if (!user) {
        return null;
    }

    return <>{children}</>;
}