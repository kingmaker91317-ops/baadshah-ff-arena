import { useState } from "react";
import { Link } from "wouter";
import { useListTournaments, getListTournamentsQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Users, Clock, Sword, Zap, Shield, Coins, MapPin, ChevronRight } from "lucide-react";
import { useCountdown, pad } from "@/hooks/useCountdown";

const MODE_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
  solo: {
    icon: <Sword className="w-3.5 h-3.5" />,
    label: "SOLO",
    color: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/30",
  },
  duo: {
    icon: <Users className="w-3.5 h-3.5" />,
    label: "DUO",
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/30",
  },
  squad: {
    icon: <Zap className="w-3.5 h-3.5" />,
    label: "SQUAD",
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/30",
  },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  upcoming: { label: "UPCOMING", color: "text-blue-400 border-blue-500/30 bg-blue-500/10", dot: "bg-blue-400" },
  live: { label: "LIVE", color: "text-green-400 border-green-500/30 bg-green-500/10", dot: "bg-green-400 animate-pulse" },
  completed: { label: "ENDED", color: "text-zinc-500 border-zinc-700 bg-zinc-800/50", dot: "bg-zinc-500" },
};

function TournamentCountdown({ scheduledAt, status }: { scheduledAt: string; status: string }) {
  const cd = useCountdown(scheduledAt);
  if (status === "completed" || status === "live") return null;
  if (cd.isExpired) return <span className="text-green-400 font-mono text-xs">Starting soon...</span>;
  if (cd.days > 0) return <span className="font-mono text-xs text-zinc-400">{cd.days}d {pad(cd.hours)}h {pad(cd.minutes)}m</span>;
  return (
    <span className="font-mono text-xs text-orange-400 font-bold">
      {pad(cd.hours)}:{pad(cd.minutes)}:{pad(cd.seconds)}
    </span>
  );
}

function TournamentCard({ t }: { t: any }) {
  const mode = MODE_CONFIG[t.mode] ?? MODE_CONFIG.solo;
  const status = STATUS_CONFIG[t.status] ?? STATUS_CONFIG.upcoming;
  const fillPct = Math.round((t.filledSlots / t.maxSlots) * 100);
  const isFull = t.filledSlots >= t.maxSlots;

  return (
    <Link href={`/tournaments/${t.id}`}>
      <div className="group relative bg-zinc-900 border border-zinc-800 hover:border-orange-500/40 rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-xl hover:shadow-orange-500/5 hover:-translate-y-0.5">
        {/* Top accent */}
        {t.status === "live" && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500 via-emerald-400 to-green-500" />
        )}
        {t.status === "upcoming" && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500/50 via-orange-400/80 to-orange-500/50" />
        )}

        <div className="p-5">
          {/* Header row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg border ${status.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                {status.label}
              </span>
            </div>
            <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg border ${mode.bg} ${mode.color}`}>
              {mode.icon} {mode.label}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-lg font-black uppercase tracking-tight text-white group-hover:text-orange-400 transition-colors line-clamp-2 mb-1">
            {t.title}
          </h3>
          {t.mapName && (
            <p className="flex items-center gap-1 text-xs text-zinc-500 font-mono mb-4">
              <MapPin className="w-3 h-3" /> {t.mapName}
            </p>
          )}

          {/* Prize + Entry */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Trophy className="w-3.5 h-3.5 text-yellow-400" />
              </div>
              <p className="text-xl font-black text-yellow-400">{t.prizePool.toLocaleString()}</p>
              <p className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider">Prize Pool</p>
            </div>
            <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Coins className="w-3.5 h-3.5 text-orange-400" />
              </div>
              <p className="text-xl font-black text-white">{t.entryFee === 0 ? "FREE" : t.entryFee}</p>
              <p className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider">Entry Fee</p>
            </div>
          </div>

          {/* Slot progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-zinc-500 font-mono flex items-center gap-1">
                <Users className="w-3 h-3" /> {t.filledSlots}/{t.maxSlots} slots
              </span>
              {isFull ? (
                <span className="text-red-400 font-bold font-mono">FULL</span>
              ) : (
                <span className="text-zinc-400 font-mono">{t.maxSlots - t.filledSlots} left</span>
              )}
            </div>
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  fillPct >= 90 ? "bg-red-500" : fillPct >= 60 ? "bg-orange-500" : "bg-green-500"
                }`}
                style={{ width: `${fillPct}%` }}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-mono">
              <Clock className="w-3 h-3" />
              {t.status === "live" ? (
                <span className="text-green-400 font-bold">In Progress</span>
              ) : t.status === "completed" ? (
                new Date(t.scheduledAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
              ) : (
                <TournamentCountdown scheduledAt={t.scheduledAt} status={t.status} />
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-orange-400 font-bold group-hover:gap-2 transition-all">
              View <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

const FILTERS = {
  status: [
    { label: "All", value: undefined },
    { label: "🔴 Live", value: "live" },
    { label: "🔵 Upcoming", value: "upcoming" },
    { label: "✓ Ended", value: "completed" },
  ],
  mode: [
    { label: "All Modes", value: undefined },
    { label: "⚔ Solo", value: "solo" },
    { label: "👥 Duo", value: "duo" },
    { label: "⚡ Squad", value: "squad" },
  ],
};

export default function Tournaments() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [modeFilter, setModeFilter] = useState<string | undefined>(undefined);

  const { data: tournaments, isLoading } = useListTournaments(
    { status: statusFilter as any, mode: modeFilter as any },
    { query: { queryKey: getListTournamentsQueryKey({ status: statusFilter as any, mode: modeFilter as any }) } }
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Hero */}
      <div className="relative bg-gradient-to-b from-zinc-900 to-[#0a0a0a] border-b border-zinc-800/60 px-4 py-10">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center gap-2 mb-2">
            <Sword className="w-5 h-5 text-orange-400" />
            <span className="text-xs font-mono uppercase tracking-widest text-orange-400">Tournament Arena</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-white mb-2">
            Choose Your <span className="text-orange-400">Battle</span>
          </h1>
          <p className="text-zinc-500 font-mono text-sm">Compete, win, and rise to the top. Every match counts.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="flex flex-wrap gap-2">
            {FILTERS.status.map((s) => (
              <button
                key={String(s.value)}
                onClick={() => setStatusFilter(s.value)}
                className={`text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-xl border transition-all duration-150 ${
                  statusFilter === s.value
                    ? "bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20"
                    : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="w-px bg-zinc-800 hidden md:block" />
          <div className="flex flex-wrap gap-2">
            {FILTERS.mode.map((m) => (
              <button
                key={String(m.value)}
                onClick={() => setModeFilter(m.value)}
                className={`text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-xl border transition-all duration-150 ${
                  modeFilter === m.value
                    ? "bg-zinc-700 border-zinc-500 text-white"
                    : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-2xl bg-zinc-800/50" />
            ))}
          </div>
        ) : tournaments && tournaments.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {tournaments.map((t) => (
              <TournamentCard key={t.id} t={t} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 border border-zinc-800 rounded-2xl bg-zinc-900/40">
            <Trophy className="w-14 h-14 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500 font-mono text-sm uppercase tracking-wider">No tournaments found</p>
            <p className="text-zinc-700 text-xs mt-1">Check back soon for new battles</p>
          </div>
        )}
      </div>
    </div>
  );
}
