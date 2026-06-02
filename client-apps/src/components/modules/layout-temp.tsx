"use client";

import React from 'react'
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from '@/components/ui/buttons';
import { useAuth } from '../auths/context/auth-context';

export default function LayoutTemp({ children }: { children: React.ReactNode }) {
    const { logout } = useAuth();
    const pathname = usePathname();
    // const formattedPath = pathname.startsWith("/") ? pathname.slice(1) : pathname;
    const pathSegments = pathname.split("/").filter(Boolean);
    const breadcrumb = pathSegments.join(" / ");

    return (
        <>
            <div className="mb-3 border-bottom p-2">
                <div className="container">
                    <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center text-body-emphasis text-decoration-none">
                            <Link href={'/modules'} className="text-dark text-hover-primary"><i className="bi bi-house-fill fs-4"></i></Link>
                            <small className="ms-2 text-muted">
                                {breadcrumb}
                            </small>
                        </div>
                        <div>
                            <Button type="button" variant='light' className='btn-sm' onClick={logout}>
                                Sign Out
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="container">
                {children}
            </div>
        </>
    )
}
