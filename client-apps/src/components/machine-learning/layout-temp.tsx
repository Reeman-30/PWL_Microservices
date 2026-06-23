"use client";

import React from 'react'
import Link from "next/link";
import { usePathname } from "next/navigation";
import LayoutTemp from '../modules/layout-temp';

export default function LayoutMLTemp({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const navigations = [
        { id: 1, name: 'Dashboard', path: '/modules/machine-learning', icon: 'bi-speedometer2' },
        { id: 2, name: 'Supervised', path: '/modules/machine-learning/supervised', icon: 'bi-diagram-3' },
        { id: 3, name: 'Unsupervised', path: '/modules/machine-learning/unsupervised', icon: 'bi-grid-3x3' },
        { id: 4, name: 'Reinforcement', path: '/modules/machine-learning/reinforcement', icon: 'bi-arrow-repeat' }
    ]

    return (
        <LayoutTemp>
            <ul className="nav nav-tabs" role="tablist">
                {navigations.map((nav) => (
                    <li className="nav-item" key={nav.id} role="presentation">
                        <Link
                            href={nav.path}
                            className={`nav-link ${pathname === nav.path ? 'active' : ''}`}
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
    )
}
