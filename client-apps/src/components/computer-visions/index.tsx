"use client";

import React from "react";
import { AboutCV, CVModules, HeaderCV, IntroCV, ResourscesCV, TipsCV } from "./components";

export default function Dashboard() {
  return (
    <div className="container-fluid py-4">
      <HeaderCV />
      <IntroCV />
      <CVModules />
      <AboutCV /> 
      <TipsCV />
      <ResourscesCV />
    </div>
  );
}
