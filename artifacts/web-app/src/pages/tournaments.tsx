import { useState } from "react";
import { Link } from "wouter";
import { useListTournaments, getListTournamentsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Users, Clock, Zap, Shield } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  upcoming: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  live: "bg-green-500/20 text-green-400 border-green-500/30",
  completed: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const MODE_ICONS: Record<string, React.ReactNode> = {
  solo: <Shield className="w-4 h-4" />,
  duo: <Users className="w-4 h-4" />,
  squad: <Zap className="w-4 h-4" />,
};

export default function Tournaments() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [modeFilter, setModeFilter] = useState<string | undefined>(undefined);

  const { data: tournaments, isLoading } = useListTournaments(
    { status: statusFilter as any, mode: modeFilter as any },
    { query: { queryKey: getListTournamentsQueryKey({ status: statusFilter as any, mode: modeFilter as any }) } }
  );

  const statuses = [
    { label: "All", value: undefined },
    { label: "Live", value: "live" },
    { label: "Upcoming", value: "upcoming" },
    { label: "Completed", value: "completed" },
  ];

  const modes = [
    { label: "All Modes", value: undefined },
    { label: "Solo", value: "solo" },
    { label: "Duo", value: "duo" },
    { label: "Squad", value: "squad" },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-black uppercase tracking-tighter text-foreground mb-2">
          Tournament <span className="text-primary">Arena</span>
        </h1>
        <p className="text-muted-foreground font-mono text-sm">Choose your battle. Dominate the lobby.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8">
        <div className="flex flex-wrap gap-2">
          {statuses.map((s) => (
            <Button
              key={String(s.value)}
              data-testid={`filter-status-${s.value ?? "all"}`}
              variant={statusFilter === s.value ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(s.value)}
              className="uppercase tracking-wider text-xs font-bold"
            >
              {s.label}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {modes.map((m) => (
            <Button
              key={String(m.value)}
              data-testid={`filter-mode-${m.value ?? "all"}`}
              variant={modeFilter === m.value ? "secondary" : "outline"}
              size="sm"
              onClick={() => setModeFilter(m.value)}
              className="uppercase tracking-wider text-xs font-bold"
            >
              {m.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Tournament Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      ) : tournaments && tournaments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map((t) => (
            <Link key={t.id} href={`/tournaments/${t.id}`}>
              <div
                data-testid={`card-tournament-${t.id}`}
                className="group relative border border-border bg-card rounded-lg overflow-hidden cursor-pointer hover:border-primary/50 transition-all duration-200 hover:shadow-lg hover:shadow-primary/10"
              >
                {t.status === "live" && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500 to-primary" />
                )}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded border ${STATUS_COLORS[t.status]}`}>
                      {t.status}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground uppercase font-mono">
                      {MODE_ICONS[t.mode]} {t.mode}
                    </span>
                  </div>

                  <h3 className="text-lg font-black uppercase tracking-tight mb-1 group-hover:text-primary transition-colors line-clamp-2">
                    {t.title}
                  </h3>
                  {t.mapName && (
                    <p className="text-xs text-muted-foreground font-mono mb-3">{t.mapName}</p>
                  )}

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="bg-background/60 rounded p-2 text-center">
                      <div className="flex items-center justify-center gap-1 text-primary mb-1">
                        <Trophy className="w-3.5 h-3.5" />
                      </div>
                      <p className="text-lg font-black">{t.prizePool.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground uppercase font-mono">Prize</p>
                    </div>
                    <div className="bg-background/60 rounded p-2 text-center">
                      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                        <Users className="w-3.5 h-3.5" />
                      </div>
                      <p className="text-lg font-black">{t.filledSlots}/{t.maxSlots}</p>
                      <p className="text-xs text-muted-foreground uppercase font-mono">Slots</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(t.scheduledAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                    </div>
                    <span className="text-xs font-bold text-primary uppercase">
                      {t.entryFee === 0 ? "FREE" : `${t.entryFee} coins`}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground font-mono">No tournaments found. Check back soon.</p>
        </div>
      )}
    </div>
  );
}
