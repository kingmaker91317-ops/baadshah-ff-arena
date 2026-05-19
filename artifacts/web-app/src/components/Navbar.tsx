import { Link, useLocation } from "wouter";
import { useAuth } from "../hooks/useAuth";
import { Button } from "./ui/button";
import { Coins } from "lucide-react";

export function Navbar() {
  const { user, dbUser, signOut } = useAuth();
  const [location] = useLocation();

  const walletBalance = dbUser?.walletBalance ?? 0;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href={user ? "/dashboard" : "/"}>
          <span className="text-xl font-black text-primary uppercase tracking-tighter cursor-pointer">
            BAADSHAH <span className="text-white">FF</span> ARENA
          </span>
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link href="/tournaments">
                <Button variant={location === "/tournaments" ? "secondary" : "ghost"} size="sm">Tournaments</Button>
              </Link>
              <Link href="/my-tournaments">
                <Button variant={location === "/my-tournaments" ? "secondary" : "ghost"} size="sm">My Matches</Button>
              </Link>
              <Link href="/wallet">
                <Button variant={location === "/wallet" ? "secondary" : "ghost"} size="sm" className="gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-yellow-400" />
                  {walletBalance}
                </Button>
              </Link>
              {dbUser?.isAdmin && (
                <Link href="/admin">
                  <Button variant={location === "/admin" ? "secondary" : "ghost"} size="sm">Admin</Button>
                </Link>
              )}
              <Link href="/dashboard">
                <Button variant="outline" size="sm">Dashboard</Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">Login</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Register</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
