import { useState } from "react";
import { useParams, Link } from "wouter";
import {
  useGetTournament,
  getGetTournamentQueryKey,
  useRegisterForTournament,
  useGetWallet,
  getGetWalletQueryKey,
  getListTournamentsQueryKey,
  useGetMyRegistrations,
  getGetMyRegistrationsQueryKey,
  getGetTransactionsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useCountdown, pad } from "@/hooks/useCountdown";
import {
  Trophy, Users, Clock, Sword, Zap, MapPin, Lock, Key,
  Coins, ChevronLeft, Shield, Copy, Check, AlertCircle,
  UserCircle2, Hash
} from "lucide-react";

const MODE_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string; bg: string; teamSize: string }> = {
  solo: { icon: <Sword className="w-4 h-4" />, label: "SOLO", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/30", teamSize: "1 Player" },
  duo: { icon: <Users className="w-4 h-4" />, label: "DUO", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30", teamSize: "2 Players" },
  squad: { icon: <Zap className="w-4 h-4" />, label: "SQUAD", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/30", teamSize: "4 Players" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  upcoming: { label: "UPCOMING", color: "text-blue-400 border-blue-500/30 bg-blue-500/10", dot: "bg-blue-400" },
  live: { label: "LIVE NOW", color: "text-green-400 border-green-500/30 bg-green-500/10", dot: "bg-green-400 animate-pulse" },
  completed: { label: "ENDED", color: "text-zinc-500 border-zinc-700 bg-zinc-800/50", dot: "bg-zinc-500" },
};

function Countdown({ scheduledAt }: { scheduledAt: string }) {
  const cd = useCountdown(scheduledAt);
  if (cd.isExpired) return (
    <div className="flex items-center gap-2 text-green-400">
      <Zap className="w-4 h-4" />
      <span className="font-mono font-bold text-sm">Match starting...</span>
    </div>
  );
  return (
    <div className="flex items-center gap-3">
      {cd.days > 0 && (
        <div className="text-center">
          <p className="text-2xl font-black tabular-nums text-white">{pad(cd.days)}</p>
          <p className="text-[10px] text-zinc-500 font-mono uppercase">Days</p>
        </div>
      )}
      <div className="text-center">
        <p className="text-2xl font-black tabular-nums text-white">{pad(cd.hours)}</p>
        <p className="text-[10px] text-zinc-500 font-mono uppercase">Hrs</p>
      </div>
      <div className="text-orange-500 font-black text-xl">:</div>
      <div className="text-center">
        <p className="text-2xl font-black tabular-nums text-white">{pad(cd.minutes)}</p>
        <p className="text-[10px] text-zinc-500 font-mono uppercase">Min</p>
      </div>
      <div className="text-orange-500 font-black text-xl">:</div>
      <div className="text-center">
        <p className="text-2xl font-black tabular-nums text-orange-400">{pad(cd.seconds)}</p>
        <p className="text-[10px] text-zinc-500 font-mono uppercase">Sec</p>
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="ml-2 text-zinc-500 hover:text-orange-400 transition-colors">
      {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

export default function TournamentDetail() {
  const { id } = useParams<{ id: string }>();
  const numId = parseInt(id || "0");
  const { dbUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tournament, isLoading } = useGetTournament(numId, {
    query: { enabled: !!numId, queryKey: getGetTournamentQueryKey(numId) },
  });

  const { data: wallet } = useGetWallet({ query: { queryKey: getGetWalletQueryKey() } });
  const { data: myRegs } = useGetMyRegistrations({ query: { queryKey: getGetMyRegistrationsQueryKey() } });
  const registerMutation = useRegisterForTournament();

  const isAlreadyRegistered = myRegs?.some((r) => r.tournamentId === numId);
  const myReg = myRegs?.find((r) => r.tournamentId === numId);

  const [showModal, setShowModal] = useState(false);
  const [ffUid, setFfUid] = useState(dbUser?.freeFireUid || "");
  const [ffName, setFfName] = useState(dbUser?.freeFireName || "");
  const [teamName, setTeamName] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tournament || !confirmed) return;
    try {
      await registerMutation.mutateAsync({
        id: numId,
        data: { freeFireUid: ffUid, freeFireName: ffName, teamName: teamName || undefined },
      });
      toast({ title: "⚔ Registered!", description: `You're locked in for ${tournament.title}` });
      setShowModal(false);
      setConfirmed(false);
      queryClient.invalidateQueries({ queryKey: getGetTournamentQueryKey(numId) });
      queryClient.invalidateQueries({ queryKey: getListTournamentsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetMyRegistrationsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetWalletQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetTransactionsQueryKey() });
    } catch (err: any) {
      toast({ title: "Registration Failed", description: err?.response?.data?.error || "Something went wrong", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] p-4">
        <div className="container mx-auto max-w-3xl pt-8 space-y-4">
          <Skeleton className="h-8 w-40 bg-zinc-800" />
          <Skeleton className="h-16 w-full bg-zinc-800" />
          <Skeleton className="h-48 w-full bg-zinc-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <p className="text-zinc-500 font-mono">Tournament not found.</p>
      </div>
    );
  }

  const mode = MODE_CONFIG[tournament.mode] ?? MODE_CONFIG.solo;
  const status = STATUS_CONFIG[tournament.status] ?? STATUS_CONFIG.upcoming;
  const slotsLeft = tournament.maxSlots - tournament.filledSlots;
  const fillPct = Math.round((tournament.filledSlots / tournament.maxSlots) * 100);
  const isFull = slotsLeft <= 0;
  const canRegister = !isAlreadyRegistered && tournament.status !== "completed" && !isFull;
  const hasEnoughCoins = !wallet || tournament.entryFee === 0 || wallet.balance >= tournament.entryFee;
  const showRoomDetails = isAlreadyRegistered && tournament.status === "live" && tournament.roomId;

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-12">
      {/* Top bar */}
      <div className="bg-zinc-900/80 border-b border-zinc-800 px-4 py-3">
        <div className="container mx-auto max-w-3xl">
          <Link href="/tournaments">
            <button className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-sm font-mono transition-colors">
              <ChevronLeft className="w-4 h-4" /> Back to Arena
            </button>
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-3xl pt-6 space-y-5">
        {/* Title section */}
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border ${status.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>
            <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border ${mode.bg} ${mode.color}`}>
              {mode.icon} {mode.label} · {mode.teamSize}
            </span>
            {isAlreadyRegistered && (
              <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border bg-green-500/10 border-green-500/30 text-green-400">
                <Check className="w-3.5 h-3.5" /> REGISTERED
              </span>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-white mb-2">
            {tournament.title}
          </h1>
          {tournament.description && (
            <p className="text-zinc-400 text-sm leading-relaxed">{tournament.description}</p>
          )}
          {tournament.mapName && (
            <p className="flex items-center gap-1.5 text-xs text-zinc-500 font-mono mt-2">
              <MapPin className="w-3.5 h-3.5" /> {tournament.mapName}
            </p>
          )}
        </div>

        {/* Countdown - only for upcoming */}
        {tournament.status === "upcoming" && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <p className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" /> Starts In
            </p>
            <Countdown scheduledAt={tournament.scheduledAt} />
            <p className="text-zinc-600 font-mono text-xs mt-3">
              {new Date(tournament.scheduledAt).toLocaleString("en-IN", { dateStyle: "full", timeStyle: "short" })}
            </p>
          </div>
        )}

        {/* Room Details — only if registered AND live */}
        {showRoomDetails && (
          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/30 rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500 to-emerald-400" />
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Zap className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-widest text-green-400">Match Room Details</p>
                <p className="text-xs text-zinc-500 font-mono">Share with your teammates</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-900/60 border border-zinc-700 rounded-xl p-4">
                <p className="text-xs text-zinc-500 font-mono uppercase flex items-center gap-1 mb-2">
                  <Hash className="w-3.5 h-3.5" /> Room ID
                </p>
                <div className="flex items-center gap-1">
                  <p className="font-black font-mono text-2xl tracking-[0.2em] text-white">{tournament.roomId}</p>
                  <CopyButton text={tournament.roomId!} />
                </div>
              </div>
              <div className="bg-zinc-900/60 border border-zinc-700 rounded-xl p-4">
                <p className="text-xs text-zinc-500 font-mono uppercase flex items-center gap-1 mb-2">
                  <Lock className="w-3.5 h-3.5" /> Password
                </p>
                <div className="flex items-center gap-1">
                  <p className="font-black font-mono text-2xl tracking-[0.2em] text-white">{tournament.roomPassword}</p>
                  <CopyButton text={tournament.roomPassword || ""} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Registered but not live yet — room coming soon */}
        {isAlreadyRegistered && tournament.status === "upcoming" && (
          <div className="bg-zinc-900 border border-blue-500/20 rounded-2xl p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
              <Key className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Room details coming soon</p>
              <p className="text-zinc-500 text-xs font-mono">Room ID & password will appear here once the match goes live.</p>
            </div>
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: <Trophy className="w-5 h-5 text-yellow-400" />, value: tournament.prizePool.toLocaleString(), label: "Prize Pool", sub: "coins" },
            { icon: <Coins className="w-5 h-5 text-orange-400" />, value: tournament.entryFee === 0 ? "FREE" : tournament.entryFee, label: "Entry Fee", sub: tournament.entryFee > 0 ? "coins" : "no fee" },
            { icon: <Users className="w-5 h-5 text-blue-400" />, value: `${tournament.filledSlots}/${tournament.maxSlots}`, label: "Players", sub: `${slotsLeft} slots left` },
            { icon: <Shield className="w-5 h-5 text-purple-400" />, value: mode.label, label: "Mode", sub: mode.teamSize },
          ].map((item, i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
              <div className="flex justify-center mb-2">{item.icon}</div>
              <p className="text-xl font-black text-white">{item.value}</p>
              <p className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider">{item.label}</p>
              <p className="text-[10px] text-zinc-600 font-mono">{item.sub}</p>
            </div>
          ))}
        </div>

        {/* Slot progress */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-mono text-zinc-400">Slot Availability</span>
            <span className={`font-bold ${isFull ? "text-red-400" : "text-zinc-300"}`}>
              {isFull ? "LOBBY FULL" : `${slotsLeft} slots remaining`}
            </span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                fillPct >= 90 ? "bg-red-500" : fillPct >= 60 ? "bg-orange-500" : "bg-green-500"
              }`}
              style={{ width: `${fillPct}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-zinc-600 font-mono mt-1">
            <span>0</span>
            <span>{tournament.maxSlots}</span>
          </div>
        </div>

        {/* Wallet status */}
        {wallet && !isAlreadyRegistered && tournament.status !== "completed" && (
          <div className={`flex items-center gap-3 rounded-xl p-4 border ${hasEnoughCoins ? "bg-zinc-900 border-zinc-800" : "bg-red-500/5 border-red-500/30"}`}>
            <Coins className={`w-5 h-5 ${hasEnoughCoins ? "text-yellow-400" : "text-red-400"}`} />
            <div className="flex-1">
              <p className="text-sm font-bold text-white">Your Balance: <span className="text-yellow-400">{wallet.balance} coins</span></p>
              {!hasEnoughCoins && (
                <p className="text-xs text-red-400 font-mono mt-0.5">You need {tournament.entryFee - wallet.balance} more coins to join</p>
              )}
            </div>
            {!hasEnoughCoins && (
              <Link href="/wallet">
                <button className="text-xs font-bold text-orange-400 border border-orange-500/30 px-3 py-1.5 rounded-lg hover:bg-orange-500/10 transition-colors">
                  Add Coins
                </button>
              </Link>
            )}
          </div>
        )}

        {/* Action button */}
        {tournament.status !== "completed" ? (
          isAlreadyRegistered ? (
            <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-5 text-center">
              <Check className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="font-black uppercase tracking-wider text-green-400 text-lg">You're Registered!</p>
              <p className="text-zinc-500 text-sm font-mono mt-1">
                FF: {myReg?.freeFireName}
                {myReg?.teamName && ` · Team: ${myReg.teamName}`}
              </p>
            </div>
          ) : isFull ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-center">
              <AlertCircle className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="font-black uppercase tracking-wider text-zinc-500">Lobby Full</p>
            </div>
          ) : (
            <button
              onClick={() => hasEnoughCoins && setShowModal(true)}
              disabled={!hasEnoughCoins}
              className={`w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-black uppercase tracking-widest text-base transition-all duration-200 ${
                hasEnoughCoins
                  ? "bg-orange-500 hover:bg-orange-400 text-white shadow-xl shadow-orange-500/20 hover:shadow-orange-500/30"
                  : "bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-700"
              }`}
            >
              <Sword className="w-5 h-5" />
              {hasEnoughCoins
                ? `Join Tournament ${tournament.entryFee > 0 ? `— ${tournament.entryFee} Coins` : "— FREE"}`
                : "Insufficient Balance"}
            </button>
          )
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-center">
            <Trophy className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <p className="font-black uppercase tracking-wider text-zinc-500">Tournament Ended</p>
          </div>
        )}
      </div>

      {/* Registration Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            {/* Modal header */}
            <div className="relative bg-gradient-to-br from-orange-500/20 to-transparent border-b border-zinc-800 p-6">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-orange-400" />
              <h2 className="text-xl font-black uppercase tracking-widest text-white">Register for Battle</h2>
              <p className="text-zinc-400 text-sm font-mono mt-1">{tournament.title}</p>
            </div>

            <form onSubmit={handleRegister} className="p-6 space-y-4">
              {/* Cost summary */}
              {tournament.entryFee > 0 && (
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 flex items-center justify-between">
                  <span className="text-sm font-bold text-orange-300">Entry Fee</span>
                  <div className="flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-yellow-400" />
                    <span className="font-black text-yellow-400 text-lg">{tournament.entryFee} coins</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2 flex items-center gap-1">
                  <UserCircle2 className="w-3.5 h-3.5" /> Free Fire UID
                </label>
                <input
                  type="text"
                  value={ffUid}
                  onChange={(e) => setFfUid(e.target.value)}
                  placeholder="Your FF UID"
                  required
                  className="w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 rounded-xl px-4 py-2.5 text-white placeholder-zinc-600 font-mono text-sm outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2 flex items-center gap-1">
                  <Sword className="w-3.5 h-3.5" /> In-Game Name
                </label>
                <input
                  type="text"
                  value={ffName}
                  onChange={(e) => setFfName(e.target.value)}
                  placeholder="Your FF username"
                  required
                  className="w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 rounded-xl px-4 py-2.5 text-white placeholder-zinc-600 font-mono text-sm outline-none transition-all"
                />
              </div>

              {(tournament.mode === "duo" || tournament.mode === "squad") && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> Team Name <span className="text-zinc-600">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Your squad name"
                    className="w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 rounded-xl px-4 py-2.5 text-white placeholder-zinc-600 font-mono text-sm outline-none transition-all"
                  />
                </div>
              )}

              {/* Confirm deduction */}
              {tournament.entryFee > 0 && (
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                    className="w-4 h-4 accent-orange-500"
                  />
                  <span className="text-xs text-zinc-400 font-mono">
                    I agree to deduct <span className="text-yellow-400 font-bold">{tournament.entryFee} coins</span> from my wallet
                  </span>
                </label>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setConfirmed(false); }}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-3 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registerMutation.isPending || (tournament.entryFee > 0 && !confirmed)}
                  className="flex-1 bg-orange-500 hover:bg-orange-400 text-white font-black uppercase tracking-wider py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/20"
                >
                  {registerMutation.isPending ? "Joining..." : "⚔ Confirm Join"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
