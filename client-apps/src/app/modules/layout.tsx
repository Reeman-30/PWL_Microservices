import type { Metadata } from "next";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import ProtectedRoute from "@/components/auths/protected-route";
import Modals from "@/components/ui/modals";

export const metadata: Metadata = {
  title: "Client Apps - ML & Auth Platform",
  description:
    "Platform untuk analisis sentimen YouTube dan deteksi kendaraan real-time",
  manifest: "/manifest.json",
  themeColor: "#0d6efd",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Client Apps",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function ModulesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ProtectedRoute>
      {children}
      <Modals />
    </ProtectedRoute>
  );
}
