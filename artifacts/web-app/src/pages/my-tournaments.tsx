import { Link } from "wouter";
import { useGetMyRegistrations, getGetMyRegistrationsQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Clock, Users, MapPin } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  upcoming: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  live: "bg-green-500/20 text-green-400 border-green-500/30",
  completed: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

export default function MyTournaments() {
  const { data: registrations, isLoading } = useGetMyRegistrations({
    query: { queryKey: getGetMyRegistrationsQueryKey() },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">
        My <span className="text-primary">Battles</span>
      </h1>
      <p className="text-muted-foreground font-mono text-sm mb-8">Your registered tournaments</p>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
        </div>
      ) : registrations && registrations.length > 0 ? (
        <div className="space-y-4">
          {registrations.map((reg) => {
            const t = reg.tournament;
            if (!t) return null;
            return (
              <Link key={reg.id} href={`/tournaments/${t.id}`}>
                <div
                  data-testid={`my-reg-${reg.id}`}
                  className="bg-card border border-border rounded-lg p-5 cursor-pointer hover:border-primary/50 transition-all duration-200 flex items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${STATUS_COLORS[t.status]}`}>
                        {t.status}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono uppercase">{t.mode}</span>
                    </div>
                    <h3 className="text-lg font-black uppercase tracking-tight truncate">{t.title}</h3>
                    {t.mapName && (
                      <p className="text-xs text-muted-foreground font-mono flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" /> {t.mapName}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground font-mono">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(t.scheduledAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
                      </span>
                      {reg.teamName && <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {reg.teamName}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1 text-primary mb-1">
                      <Trophy className="w-4 h-4" />
                      <span className="font-black">{t.prizePool.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">prize pool</p>
                    <p className="text-xs text-muted-foreground font-mono mt-2">FF: {reg.freeFireName}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 border border-border rounded-lg">
          <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground font-mono">You haven't joined any tournaments yet.</p>
          <Link href="/tournaments">
            <span className="text-primary font-bold text-sm cursor-pointer hover:underline mt-2 inline-block">Browse Tournaments</span>
          </Link>
        </div>
      )}
    </div>
  );
}
