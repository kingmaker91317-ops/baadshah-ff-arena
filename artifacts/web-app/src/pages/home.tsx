import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Shield, Swords, Trophy, Users } from "lucide-react";
import { useGetTournamentStats } from "@workspace/api-client-react";

export default function Home() {
  const { user } = useAuth();
  const { data: stats } = useGetTournamentStats();

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="relative flex-1 flex items-center justify-center py-24 overflow-hidden">
        <div className="absolute inset-0 bg-background">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
        </div>
        
        <div className="container relative z-10 px-4 text-center">
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              Baadshah FF Arena
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10 font-mono">
            The ultimate battleground for elite Free Fire players. Compete, win, and rise to the top.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {user ? (
              <Link href="/tournaments">
                <Button size="lg" className="h-14 px-8 text-lg font-bold uppercase tracking-wider bg-primary hover:bg-primary/90 text-primary-foreground">
                  Enter the Arena
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button size="lg" className="h-14 px-8 text-lg font-bold uppercase tracking-wider bg-primary hover:bg-primary/90 text-primary-foreground">
                  Join Now
                </Button>
              </Link>
            )}
            <Link href="/tournaments">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-bold uppercase tracking-wider border-primary/50 text-primary hover:bg-primary/10">
                View Tournaments
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-t border-border bg-card/50">
        <div className="container px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="p-6 rounded-lg bg-background border border-border/50 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4 text-primary">
                <Swords className="w-6 h-6" />
              </div>
              <h3 className="text-3xl font-black mb-2">{stats?.totalTournaments || 0}</h3>
              <p className="text-muted-foreground uppercase text-sm font-bold tracking-wider">Total Battles</p>
            </div>
            
            <div className="p-6 rounded-lg bg-background border border-border/50 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4 text-primary">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-3xl font-black mb-2">{stats?.liveCount || 0}</h3>
              <p className="text-muted-foreground uppercase text-sm font-bold tracking-wider">Live Now</p>
            </div>
            
            <div className="p-6 rounded-lg bg-background border border-border/50 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4 text-primary">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-3xl font-black mb-2">{stats?.upcomingCount || 0}</h3>
              <p className="text-muted-foreground uppercase text-sm font-bold tracking-wider">Upcoming</p>
            </div>
            
            <div className="p-6 rounded-lg bg-background border border-border/50 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4 text-primary">
                <Trophy className="w-6 h-6" />
              </div>
              <h3 className="text-3xl font-black mb-2">{stats?.totalPrizePool || 0}</h3>
              <p className="text-muted-foreground uppercase text-sm font-bold tracking-wider">Total Prize Pool</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
