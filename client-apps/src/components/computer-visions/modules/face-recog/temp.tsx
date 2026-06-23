"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import Layout from "../layout";

export default function Temp({ children }: { children: React.ReactNode }) {
  const navigations = [
    {
      id: 1,
      name: "Face Detection",
      path: "/modules/computer-visions/face-detections",
      icon: "bi-person-bounding-box",
      description: "Deteksi wajah dengan BlazeFace",
      color: "primary",
    },
    {
      id: 2,
      name: "Real-time Face Detection",
      path: "/modules/computer-visions/face-detections/real-time",
      icon: "bi-camera-video",
      description: "Deteksi wajah dengan BlazeFace",
      color: "success",
    },
    {
      id: 3,
      name: "Face Recognition",
      path: "/modules/computer-visions/face-detections/recognitions",
      icon: "bi-person-bounding-box",
      description: "Deteksi wajah dengan teachable machine",
      color: "info",
    },
    {
      id: 4,
      name: "Emotional Recognition",
      path: "/modules/computer-visions/face-detections/emotionals",
      icon: "bi-emoji-smile",
      description: "Deteksi emosi pada wajah dengan FACE API",
      color: "danger",
    }
  ];  
  return (
    <Layout navigations={navigations}>
      {children}
    </Layout>
  );
}
