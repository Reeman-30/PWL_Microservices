"use client";

import React from 'react'
import LayoutTemp from '../modules/layout-temp';

export default function LayoutCVTemp({ children }: { children: React.ReactNode }) {
    return (
        <LayoutTemp>
            {children}
        </LayoutTemp>
    )
}
