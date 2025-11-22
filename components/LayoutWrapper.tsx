"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Hide Header and Footer for admin pages and auth pages
  const isAdminPage = pathname?.startsWith("/admin");
  const isAuthPage = pathname?.startsWith("/auth");

  const shouldHideNavigation = isAdminPage || isAuthPage;

  return (
    <>
      {!shouldHideNavigation && <Header />}
      {children}
      {!shouldHideNavigation && <Footer />}
    </>
  );
}
