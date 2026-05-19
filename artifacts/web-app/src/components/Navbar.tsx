import { Link, useLocation } from "wouter";
import { useAuth } from "../hooks/useAuth";
import { Button } from "./ui/button";

export function Navbar() {
  const { user, dbUser, signOut } = useAuth();
  const [location] = useLocation();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/">
          <span className="text-xl font-black text-primary uppercase tracking-tighter cursor-pointer">BAADSHAH FF ARENA</span>
        </Link>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/tournaments">
                <Button variant={location === "/tournaments" ? "secondary" : "ghost"}>Tournaments</Button>
              </Link>
              <Link href="/my-tournaments">
                <Button variant={location === "/my-tournaments" ? "secondary" : "ghost"}>My Matches</Button>
              </Link>
              <Link href="/wallet">
                <Button variant={location === "/wallet" ? "secondary" : "ghost"}>Wallet</Button>
              </Link>
              <Link href="/profile">
                <Button variant={location === "/profile" ? "secondary" : "ghost"}>Profile</Button>
              </Link>
              {dbUser?.isAdmin && (
                <Link href="/admin">
                  <Button variant={location === "/admin" ? "secondary" : "ghost"}>Admin</Button>
                </Link>
              )}
              <Button variant="outline" onClick={() => signOut()}>Logout</Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link href="/register">
                <Button>Register</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
