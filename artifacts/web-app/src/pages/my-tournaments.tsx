import { Link } from "wouter";
import { useGetMyRegistrations, getGetMyRegistrationsQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Trophy, Clock, Users, MapPin, Sword, Zap, Key, Lock,
  Hash, Check, ChevronRight, Coins, Copy
} from "lucide-react";
import { useState } from "react";
import { useCountdown, pad } from "@/hooks/useCountdown";

const MODE_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
  solo: { icon: <Sword className="w-3.5 h-3.5" />, label: "SOLO", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/30" },
  duo: { icon: <Users className="w-3.5 h-3.5" />, label: "DUO", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30" },
  squad: { icon: <Zap className="w-3.5 h-3.5" />, label: "SQUAD", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/30" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  upcoming: { label: "UPCOMING", color: "text-blue-400 border-blue-500/30 bg-blue-500/10", dot: "bg-blue-400" },
  live: { label: "LIVE", color: "text-green-400 border-green-500/30 bg-green-500/10", dot: "bg-green-400 animate-pulse" },
  completed: { label: "ENDED", color: "text-zinc-500 border-zinc-700 bg-zinc-800/50", dot: "bg-zinc-500" },
};

function MiniCountdown({ scheduledAt }: { scheduledAt: string }) {
  const cd = useCountdown(scheduledAt);
  if (cd.isExpired) return <span className="text-green-400 font-mono text-xs font-bold">Starting soon</span>;
  if (cd.days > 0) return <span className="font-mono text-xs text-zinc-400">{cd.days}d {pad(cd.hours)}h {pad(cd.minutes)}m</span>;
  return (
    <span className="font-mono text-xs text-orange-400 font-bold">
      {pad(cd.hours)}:{pad(cd.minutes)}:{pad(cd.seconds)}
    </span>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={(e) => { e.preventDefault(); navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="text-zinc-600 hover:text-orange-400 transition-colors"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

export default function MyTournaments() {
  const { data: registrations, isLoading } = useGetMyRegistrations({
    query: { queryKey: getGetMyRegistrationsQueryKey() },
  });

  const live = registrations?.filter((r) => r.tournament?.status === "live") ?? [];
  const upcoming = registrations?.filter((r) => r.tournament?.status === "upcoming") ?? [];
  const completed = registrations?.filter((r) => r.tournament?.status === "completed") ?? [];

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Hero */}
      <div className="bg-gradient-to-b from-zinc-900 to-[#0a0a0a] border-b border-zinc-800/60 px-4 py-10">
        <div className="container mx-auto max-w-3xl">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-orange-400" />
            <span className="text-xs font-mono uppercase tracking-widest text-orange-400">My Battles</span>
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tight text-white">
            Your <span className="text-orange-400">Matches</span>
          </h1>
          <p className="text-zinc-500 font-mono text-sm mt-1">
            {registrations ? `${registrations.length} registered tournament${registrations.length !== 1 ? "s" : ""}` : "Loading..."}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-3xl space-y-8">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-2xl bg-zinc-800/50" />
            ))}
          </div>
        ) : !registrations || registrations.length === 0 ? (
          <div className="text-center py-24 border border-zinc-800 rounded-2xl bg-zinc-900/40">
            <Trophy className="w-14 h-14 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500 font-mono text-sm uppercase tracking-wider">No battles yet</p>
            <p className="text-zinc-700 text-xs mt-1 mb-5">You haven't joined any tournaments</p>
            <Link href="/tournaments">
              <button className="bg-orange-500 hover:bg-orange-400 text-white font-black uppercase tracking-widest py-2.5 px-6 rounded-xl text-sm transition-all shadow-lg shadow-orange-500/20">
                Browse Tournaments
              </button>
            </Link>
          </div>
        ) : (
          <>
            {/* Live matches */}
            {live.length > 0 && (
              <Section title="🔴 Live Now" count={live.length} accent="text-green-400">
                {live.map((reg) => <MatchCard key={reg.id} reg={reg} />)}
              </Section>
            )}

            {/* Upcoming */}
            {upcoming.length > 0 && (
              <Section title="🔵 Upcoming" count={upcoming.length} accent="text-blue-400">
                {upcoming.map((reg) => <MatchCard key={reg.id} reg={reg} />)}
              </Section>
            )}

            {/* Completed */}
            {completed.length > 0 && (
              <Section title="✓ Completed" count={completed.length} accent="text-zinc-500">
                {completed.map((reg) => <MatchCard key={reg.id} reg={reg} />)}
              </Section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Section({ title, count, accent, children }: { title: string; count: number; accent: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <h2 className={`text-sm font-black uppercase tracking-widest ${accent}`}>{title}</h2>
        <span className="bg-zinc-800 text-zinc-500 text-xs font-mono px-2 py-0.5 rounded-full">{count}</span>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function MatchCard({ reg }: { reg: any }) {
  const t = reg.tournament;
  if (!t) return null;

  const mode = MODE_CONFIG[t.mode] ?? MODE_CONFIG.solo;
  const status = STATUS_CONFIG[t.status] ?? STATUS_CONFIG.upcoming;
  const showRoom = t.status === "live" && t.roomId;

  return (
    <div className={`bg-zinc-900 border rounded-2xl overflow-hidden transition-all duration-200 ${
      t.status === "live" ? "border-green-500/30 shadow-lg shadow-green-500/5" : "border-zinc-800 hover:border-zinc-700"
    }`}>
      {t.status === "live" && <div className="h-0.5 bg-gradient-to-r from-green-500 to-emerald-400" />}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg border ${status.color}`}>
                <span className={`w-1 h-1 rounded-full ${status.dot}`} />
                {status.label}
              </span>
              <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg border ${mode.bg} ${mode.color}`}>
                {mode.icon} {mode.label}
              </span>
            </div>
            <h3 className="text-base font-black uppercase tracking-tight text-white truncate">{t.title}</h3>
            {t.mapName && (
              <p className="text-xs text-zinc-600 font-mono flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" /> {t.mapName}
              </p>
            )}
          </div>
          <Link href={`/tournaments/${t.id}`}>
            <button className="flex items-center gap-1 text-xs font-bold text-orange-400 hover:text-orange-300 border border-orange-500/20 hover:border-orange-500/40 px-2.5 py-1.5 rounded-lg transition-colors shrink-0">
              View <ChevronRight className="w-3 h-3" />
            </button>
          </Link>
        </div>

        {/* Info row */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500 font-mono">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {t.status === "live" ? (
              <span className="text-green-400 font-bold">In Progress</span>
            ) : t.status === "completed" ? (
              new Date(t.scheduledAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })
            ) : (
              <MiniCountdown scheduledAt={t.scheduledAt} />
            )}
          </span>
          <span className="flex items-center gap-1">
            <Trophy className="w-3 h-3 text-yellow-400" />
            <span className="text-yellow-400 font-bold">{t.prizePool.toLocaleString()}</span> prize
          </span>
          <span className="flex items-center gap-1">
            <Coins className="w-3 h-3 text-orange-400" />
            {t.entryFee === 0 ? "FREE" : `${t.entryFee} coins`}
          </span>
          {reg.freeFireName && (
            <span className="flex items-center gap-1">
              <Sword className="w-3 h-3" /> {reg.freeFireName}
            </span>
          )}
          {reg.teamName && (
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" /> {reg.teamName}
            </span>
          )}
        </div>

        {/* Room details — live + has room */}
        {showRoom && (
          <div className="mt-3 bg-zinc-800/60 border border-green-500/20 rounded-xl p-3">
            <p className="text-[10px] font-mono uppercase tracking-widest text-green-400 mb-2 flex items-center gap-1">
              <Zap className="w-3 h-3" /> Room Details — Share with team
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-zinc-600 font-mono uppercase flex items-center gap-1 mb-1">
                  <Hash className="w-3 h-3" /> Room ID
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="font-black font-mono text-lg tracking-widest text-white">{t.roomId}</span>
                  <CopyBtn text={t.roomId} />
                </div>
              </div>
              <div>
                <p className="text-[10px] text-zinc-600 font-mono uppercase flex items-center gap-1 mb-1">
                  <Lock className="w-3 h-3" /> Password
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="font-black font-mono text-lg tracking-widest text-white">{t.roomPassword}</span>
                  <CopyBtn text={t.roomPassword || ""} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upcoming — room coming */}
        {t.status === "upcoming" && (
          <div className="mt-3 bg-zinc-800/40 border border-zinc-700/50 rounded-xl p-3 flex items-center gap-2">
            <Key className="w-4 h-4 text-zinc-600 shrink-0" />
            <p className="text-xs text-zinc-600 font-mono">Room ID & password will appear here when match goes live</p>
          </div>
        )}
      </div>
    </div>
  );
}
