"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function ModulesHeader() {
    const pathname = usePathname();
    const formattedPath = pathname.startsWith("/") ? pathname.slice(1) : pathname;

    // Atau dengan breadcrumb style
    const pathSegments = pathname.split("/").filter(Boolean);
    const breadcrumb = pathSegments.join(" / ");


    return (
        <div className="mb-4 border-bottom p-2">
            <div className="container">
                <div className="d-flex align-items-center text-body-emphasis text-decoration-none">
                    <Link href={'/modules'} className="text-dark text-hover-primary"><i className="bi bi-house-fill fs-4"></i></Link>
                    <small className="ms-2 text-muted">
                        {breadcrumb}
                    </small>
                </div>
            </div>
        </div>
    );
}