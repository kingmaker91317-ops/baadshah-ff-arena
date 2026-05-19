import { ReactNode } from "react";
import { useLocation } from "wouter";
import { Navbar } from "./Navbar";

const FULLSCREEN_ROUTES = ["/login", "/register", "/dashboard"];

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const isFullscreen = FULLSCREEN_ROUTES.some((r) => location === r || location.startsWith(r + "/"));

  if (isFullscreen) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
