import { useState, useRef } from "react";
import {
  useGetAdminStats, getGetAdminStatsQueryKey,
  useListTournaments, getListTournamentsQueryKey,
  useCreateTournament, useUpdateTournament, useDeleteTournament,
  useSetRoomDetails, useListRechargeRequests, getListRechargeRequestsQueryKey,
  useApproveRecharge, useRejectRecharge,
  useGetTournamentRegistrations, getGetTournamentRegistrationsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import {
  Trophy, Users, Zap, Coins, Plus, Trash2, Edit3, Key, Check, X,
  Shield, BarChart3, CreditCard, ArrowUpRight, Crown, Eye, Search,
  Clock, ImageIcon, Hash, Lock, Sword, ChevronDown, ChevronUp, UserCog,
} from "lucide-react";

const BASE = "/api";
const authHeaders = () => ({
  "Content-Type": "application/json",
  "x-firebase-uid": localStorage.getItem("firebase_uid") || "",
});

// ─── Sidebar nav ─────────────────────────────────────────────────────────────
const TABS = [
  { id: "dashboard", label: "Dashboard", icon: <BarChart3 className="w-4 h-4" /> },
  { id: "tournaments", label: "Tournaments", icon: <Trophy className="w-4 h-4" /> },
  { id: "recharges", label: "Recharges", icon: <CreditCard className="w-4 h-4" />, badge: "recharges" },
  { id: "withdrawals", label: "Withdrawals", icon: <ArrowUpRight className="w-4 h-4" />, badge: "withdrawals" },
  { id: "users", label: "Players", icon: <Users className="w-4 h-4" /> },
];

// ─── Stats ────────────────────────────────────────────────────────────────────
function DashboardTab() {
  const { data: stats, isLoading } = useGetAdminStats({ query: { queryKey: getGetAdminStatsQueryKey() } });
  const items = [
    { icon: <Users className="w-5 h-5 text-blue-400" />, value: stats?.totalUsers, label: "Total Players", color: "border-blue-500/20 bg-blue-500/5" },
    { icon: <Trophy className="w-5 h-5 text-orange-400" />, value: stats?.totalTournaments, label: "Tournaments", color: "border-orange-500/20 bg-orange-500/5" },
    { icon: <Zap className="w-5 h-5 text-green-400" />, value: stats?.activeTournaments, label: "Active Now", color: "border-green-500/20 bg-green-500/5" },
    { icon: <Users className="w-5 h-5 text-purple-400" />, value: stats?.totalRegistrations, label: "Registrations", color: "border-purple-500/20 bg-purple-500/5" },
    { icon: <CreditCard className="w-5 h-5 text-yellow-400" />, value: stats?.pendingRecharges, label: "Pending Recharges", color: "border-yellow-500/20 bg-yellow-500/5" },
    { icon: <ArrowUpRight className="w-5 h-5 text-red-400" />, value: stats?.pendingWithdrawals, label: "Pending Withdrawals", color: "border-red-500/20 bg-red-500/5" },
    { icon: <Coins className="w-5 h-5 text-yellow-400" />, value: stats?.totalRevenue, label: "Total Revenue (coins)", color: "border-yellow-500/20 bg-yellow-500/5" },
  ];
  return (
    <div>
      <h2 className="text-xl font-black uppercase tracking-widest text-white mb-6">Arena Overview</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map((s, i) => (
          <div key={i} className={`border rounded-xl p-4 ${s.color}`}>
            <div className="mb-3">{s.icon}</div>
            {isLoading ? <Skeleton className="h-8 w-16 bg-zinc-700 mb-1" /> : (
              <p className="text-3xl font-black text-white">{(s.value ?? 0).toLocaleString()}</p>
            )}
            <p className="text-xs text-zinc-500 font-mono uppercase tracking-wider mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tournament form ──────────────────────────────────────────────────────────
function TournamentForm({ initial, onSubmit, isPending, onCancel }: {
  initial?: any; onSubmit: (d: any) => void; isPending: boolean; onCancel: () => void;
}) {
  const [f, setF] = useState({
    title: initial?.title || "",
    mode: initial?.mode || "solo",
    status: initial?.status || "upcoming",
    prizePool: String(initial?.prizePool || ""),
    entryFee: String(initial?.entryFee || "0"),
    maxSlots: String(initial?.maxSlots || "100"),
    scheduledAt: initial?.scheduledAt ? new Date(initial.scheduledAt).toISOString().slice(0, 16) : "",
    mapName: initial?.mapName || "",
    description: initial?.description || "",
  });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title: f.title, mode: f.mode, status: f.status,
      prizePool: parseInt(f.prizePool), entryFee: parseInt(f.entryFee),
      maxSlots: parseInt(f.maxSlots), scheduledAt: new Date(f.scheduledAt).toISOString(),
      mapName: f.mapName || undefined, description: f.description || undefined,
    });
  };

  const inputCls = "w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 rounded-xl px-4 py-2.5 text-white placeholder-zinc-600 font-mono text-sm outline-none transition-all";
  const labelCls = "block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelCls}>Title</label>
        <input value={f.title} onChange={set("title")} required placeholder="Tournament name" className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Mode</label>
          <select value={f.mode} onChange={set("mode")} className={inputCls + " appearance-none cursor-pointer"}>
            <option value="solo">⚔ Solo</option>
            <option value="duo">👥 Duo</option>
            <option value="squad">⚡ Squad</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Status</label>
          <select value={f.status} onChange={set("status")} className={inputCls + " appearance-none cursor-pointer"}>
            <option value="upcoming">🔵 Upcoming</option>
            <option value="live">🔴 Live</option>
            <option value="completed">✓ Completed</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelCls}>Prize Pool</label>
          <input type="number" value={f.prizePool} onChange={set("prizePool")} required className={inputCls} placeholder="5000" />
        </div>
        <div>
          <label className={labelCls}>Entry Fee</label>
          <input type="number" value={f.entryFee} onChange={set("entryFee")} required className={inputCls} placeholder="20" />
        </div>
        <div>
          <label className={labelCls}>Max Slots</label>
          <input type="number" value={f.maxSlots} onChange={set("maxSlots")} required className={inputCls} placeholder="100" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Scheduled At</label>
          <input type="datetime-local" value={f.scheduledAt} onChange={set("scheduledAt")} required className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Map Name</label>
          <input value={f.mapName} onChange={set("mapName")} placeholder="Bermuda, Kalahari..." className={inputCls} />
        </div>
      </div>
      <div>
        <label className={labelCls}>Description</label>
        <textarea value={f.description} onChange={set("description")} rows={2} placeholder="Tournament description..." className={inputCls + " resize-none"} />
      </div>
      <div className="flex gap-3 pt-1">
        <button type="submit" disabled={isPending}
          className="flex-1 bg-orange-500 hover:bg-orange-400 text-white font-black uppercase tracking-widest py-3 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-orange-500/20">
          {isPending ? "Saving..." : initial ? "Save Changes" : "Create Tournament"}
        </button>
        <button type="button" onClick={onCancel}
          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-3 px-5 rounded-xl transition-all">
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── Winner selector ──────────────────────────────────────────────────────────
function WinnerModal({ tournamentId, onClose }: { tournamentId: number; onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: regs } = useGetTournamentRegistrations(tournamentId, {
    query: { enabled: !!tournamentId, queryKey: getGetTournamentRegistrationsQueryKey(tournamentId) }
  });
  const [selectedRegId, setSelectedRegId] = useState<number | null>(null);
  const [prizeAmount, setPrizeAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSelectWinner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRegId || !prizeAmount) return;
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/admin/tournaments/${tournamentId}/winner`, {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ registrationId: selectedRegId, prizeAmount: parseInt(prizeAmount) }),
      });
      if (!r.ok) throw new Error(await r.text());
      toast({ title: "🏆 Winner crowned & prize credited!" });
      queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
      onClose();
    } catch { toast({ title: "Failed to set winner", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  return (
    <Modal title="👑 Select Tournament Winner" onClose={onClose}>
      <form onSubmit={handleSelectWinner} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Select Winner</label>
          {regs && regs.length > 0 ? (
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {regs.map((reg) => (
                <label key={reg.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedRegId === reg.id ? "border-orange-500 bg-orange-500/10" : "border-zinc-700 bg-zinc-800/60 hover:border-zinc-600"}`}>
                  <input type="radio" name="winner" value={reg.id} onChange={() => setSelectedRegId(reg.id)} className="accent-orange-500" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm">{reg.freeFireName}</p>
                    <p className="text-xs text-zinc-500 font-mono">{reg.freeFireUid} · {reg.user?.email}</p>
                    {reg.teamName && <p className="text-xs text-zinc-600">Team: {reg.teamName}</p>}
                  </div>
                  {selectedRegId === reg.id && <Crown className="w-4 h-4 text-yellow-400" />}
                </label>
              ))}
            </div>
          ) : <p className="text-zinc-500 font-mono text-sm">No registrations found.</p>}
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Prize Amount (coins)</label>
          <input
            type="number" value={prizeAmount} onChange={(e) => setPrizeAmount(e.target.value)}
            required min={1} placeholder="e.g. 5000"
            className="w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500 rounded-xl px-4 py-2.5 text-white font-mono text-sm outline-none transition-all"
          />
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-3 rounded-xl transition-all">Cancel</button>
          <button type="submit" disabled={!selectedRegId || !prizeAmount || loading}
            className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-zinc-900 font-black uppercase tracking-widest py-3 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-yellow-500/20">
            {loading ? "Crediting..." : "👑 Crown Winner"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Room modal ───────────────────────────────────────────────────────────────
function RoomModal({ tournamentId, onClose }: { tournamentId: number; onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const setRoom = useSetRoomDetails();
  const [roomId, setRoomId] = useState("");
  const [roomPassword, setRoomPassword] = useState("");

  const handleSetRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setRoom.mutateAsync({ id: tournamentId, data: { roomId, roomPassword } });
      toast({ title: "Room details updated!" });
      queryClient.invalidateQueries({ queryKey: getListTournamentsQueryKey({}) });
      onClose();
    } catch { toast({ title: "Failed", variant: "destructive" }); }
  };

  const inputCls = "w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500 rounded-xl px-4 py-2.5 text-white font-mono text-sm outline-none transition-all";

  return (
    <Modal title="🔑 Set Room Details" onClose={onClose}>
      <form onSubmit={handleSetRoom} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 flex items-center gap-1"><Hash className="w-3.5 h-3.5" /> Room ID</label>
          <input value={roomId} onChange={(e) => setRoomId(e.target.value)} required placeholder="e.g. FF123456" className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 flex items-center gap-1"><Lock className="w-3.5 h-3.5" /> Room Password</label>
          <input value={roomPassword} onChange={(e) => setRoomPassword(e.target.value)} required placeholder="e.g. KING123" className={inputCls} />
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-3 rounded-xl transition-all">Cancel</button>
          <button type="submit" disabled={setRoom.isPending}
            className="flex-1 bg-orange-500 hover:bg-orange-400 text-white font-black uppercase tracking-widest py-3 rounded-xl transition-all disabled:opacity-50">
            {setRoom.isPending ? "Saving..." : "Set Room"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Registrations modal ──────────────────────────────────────────────────────
function RegsModal({ tournamentId, onClose }: { tournamentId: number; onClose: () => void }) {
  const { data: regs } = useGetTournamentRegistrations(tournamentId, {
    query: { enabled: !!tournamentId, queryKey: getGetTournamentRegistrationsQueryKey(tournamentId) }
  });
  return (
    <Modal title={`Registrations (${regs?.length ?? 0})`} onClose={onClose} wide>
      <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
        {regs && regs.length > 0 ? regs.map((reg) => (
          <div key={reg.id} className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-3 flex items-center justify-between gap-3">
            <div>
              <p className="font-bold text-white text-sm">{reg.freeFireName} <span className="text-zinc-500 text-xs font-mono">({reg.freeFireUid})</span></p>
              {reg.teamName && <p className="text-xs text-zinc-500">Team: {reg.teamName}</p>}
              <p className="text-xs text-zinc-600 font-mono">{reg.user?.email}</p>
            </div>
            <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-lg ${reg.status === "confirmed" ? "bg-green-500/20 text-green-400" : "bg-zinc-700 text-zinc-500"}`}>{reg.status}</span>
          </div>
        )) : <p className="text-zinc-500 font-mono text-sm text-center py-4">No registrations yet.</p>}
      </div>
    </Modal>
  );
}

// ─── Tournaments tab ──────────────────────────────────────────────────────────
function TournamentsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: tournaments, isLoading } = useListTournaments({}, { query: { queryKey: getListTournamentsQueryKey({}) } });
  const createTournament = useCreateTournament();
  const updateTournament = useUpdateTournament();
  const deleteTournament = useDeleteTournament();

  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [roomTid, setRoomTid] = useState<number | null>(null);
  const [regsTid, setRegsTid] = useState<number | null>(null);
  const [winnerTid, setWinnerTid] = useState<number | null>(null);

  const handleCreate = async (data: any) => {
    try {
      await createTournament.mutateAsync({ data });
      toast({ title: "Tournament created!" });
      setShowCreate(false);
      queryClient.invalidateQueries({ queryKey: getListTournamentsQueryKey({}) });
      queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
    } catch { toast({ title: "Failed to create", variant: "destructive" }); }
  };

  const handleUpdate = async (id: number, data: any) => {
    try {
      await updateTournament.mutateAsync({ id, data });
      toast({ title: "Tournament updated!" });
      setEditId(null);
      queryClient.invalidateQueries({ queryKey: getListTournamentsQueryKey({}) });
    } catch { toast({ title: "Failed to update", variant: "destructive" }); }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await deleteTournament.mutateAsync({ id });
      toast({ title: "Tournament deleted" });
      queryClient.invalidateQueries({ queryKey: getListTournamentsQueryKey({}) });
      queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
    } catch { toast({ title: "Failed to delete", variant: "destructive" }); }
  };

  const STATUS_DOT: Record<string, string> = {
    upcoming: "bg-blue-400", live: "bg-green-400 animate-pulse", completed: "bg-zinc-500"
  };
  const MODE_COLOR: Record<string, string> = {
    solo: "text-orange-400", duo: "text-blue-400", squad: "text-purple-400"
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-black uppercase tracking-widest text-white">Manage Tournaments</h2>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-black uppercase tracking-wider py-2.5 px-5 rounded-xl text-sm transition-all shadow-lg shadow-orange-500/20">
          <Plus className="w-4 h-4" /> New Tournament
        </button>
      </div>

      {showCreate && (
        <div className="bg-zinc-900 border border-orange-500/30 rounded-2xl p-5 mb-5">
          <h3 className="text-sm font-black uppercase tracking-widest text-orange-400 mb-4">New Tournament</h3>
          <TournamentForm onSubmit={handleCreate} isPending={createTournament.isPending} onCancel={() => setShowCreate(false)} />
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl bg-zinc-800" />)}</div>
      ) : (
        <div className="space-y-3">
          {tournaments?.map((t) => (
            <div key={t.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              {editId === t.id ? (
                <div className="p-5">
                  <h3 className="text-sm font-black uppercase tracking-widest text-orange-400 mb-4">Edit Tournament</h3>
                  <TournamentForm initial={t} onSubmit={(d) => handleUpdate(t.id, d)} isPending={updateTournament.isPending} onCancel={() => setEditId(null)} />
                </div>
              ) : (
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full ${STATUS_DOT[t.status] || "bg-zinc-500"}`} />
                        <span className={`text-xs font-bold uppercase ${MODE_COLOR[t.mode] || ""}`}>{t.mode}</span>
                        <span className="text-xs text-zinc-600 font-mono">{t.status}</span>
                      </div>
                      <h3 className="font-black text-white uppercase truncate">{t.title}</h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500 font-mono flex-wrap">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {t.filledSlots}/{t.maxSlots}</span>
                        <span className="flex items-center gap-1"><Trophy className="w-3 h-3 text-yellow-400" /> {t.prizePool.toLocaleString()}</span>
                        <span className="flex items-center gap-1"><Coins className="w-3 h-3 text-orange-400" /> {t.entryFee === 0 ? "FREE" : t.entryFee}</span>
                        {t.mapName && <span>{t.mapName}</span>}
                        {t.roomId && <span className="text-green-400 flex items-center gap-1"><Hash className="w-3 h-3" /> {t.roomId}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <AdminBtn icon={<Eye className="w-3.5 h-3.5" />} label="Players" onClick={() => setRegsTid(t.id)} color="blue" />
                      <AdminBtn icon={<Key className="w-3.5 h-3.5" />} label="Room" onClick={() => setRoomTid(t.id)} color="green" />
                      <AdminBtn icon={<Crown className="w-3.5 h-3.5" />} label="Winner" onClick={() => setWinnerTid(t.id)} color="yellow" />
                      <AdminBtn icon={<Edit3 className="w-3.5 h-3.5" />} label="Edit" onClick={() => setEditId(t.id)} color="default" />
                      <button onClick={() => handleDelete(t.id, t.title)}
                        className="flex items-center gap-1 text-xs font-bold text-red-400 border border-red-500/30 hover:bg-red-500/10 px-2.5 py-1.5 rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {roomTid && <RoomModal tournamentId={roomTid} onClose={() => setRoomTid(null)} />}
      {regsTid && <RegsModal tournamentId={regsTid} onClose={() => setRegsTid(null)} />}
      {winnerTid && <WinnerModal tournamentId={winnerTid} onClose={() => setWinnerTid(null)} />}
    </div>
  );
}

// ─── Recharges tab ────────────────────────────────────────────────────────────
function RechargesTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: requests, isLoading } = useListRechargeRequests({ query: { queryKey: getListRechargeRequestsQueryKey() } });
  const approveRecharge = useApproveRecharge();
  const rejectRecharge = useRejectRecharge();
  const [viewImg, setViewImg] = useState<string | null>(null);

  const handleApprove = async (id: number) => {
    try {
      await approveRecharge.mutateAsync({ id });
      toast({ title: "✅ Recharge approved — coins credited!" });
      queryClient.invalidateQueries({ queryKey: getListRechargeRequestsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
    } catch { toast({ title: "Failed", variant: "destructive" }); }
  };

  const handleReject = async (id: number) => {
    try {
      await rejectRecharge.mutateAsync({ id });
      toast({ title: "Recharge rejected" });
      queryClient.invalidateQueries({ queryKey: getListRechargeRequestsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
    } catch { toast({ title: "Failed", variant: "destructive" }); }
  };

  return (
    <div>
      <h2 className="text-xl font-black uppercase tracking-widest text-white mb-5">
        Recharge Requests
        {requests && requests.length > 0 && (
          <span className="ml-2 bg-orange-500 text-white text-xs font-black px-2 py-0.5 rounded-full">{requests.length}</span>
        )}
      </h2>
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl bg-zinc-800" />)}</div>
      ) : requests && requests.length > 0 ? (
        <div className="space-y-3">
          {requests.map((r: any) => (
            <div key={r.id} className="bg-zinc-900 border border-yellow-500/20 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-black text-white">
                      {r.userName || `User #${r.userId}`}
                      <span className="ml-2 text-yellow-400 font-black">+{r.amount} coins</span>
                    </p>
                  </div>
                  <p className="text-xs text-zinc-500 font-mono">{r.userEmail}</p>
                  {r.utrNumber && (
                    <p className="text-xs text-zinc-400 font-mono mt-1 flex items-center gap-1">
                      <Hash className="w-3 h-3" /> UTR: <span className="font-bold text-white">{r.utrNumber}</span>
                    </p>
                  )}
                  <p className="text-xs text-zinc-600 font-mono mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(r.createdAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {r.screenshotUrl && (
                    <button onClick={() => setViewImg(r.screenshotUrl)}
                      className="flex items-center gap-1.5 text-xs font-bold text-blue-400 border border-blue-500/30 hover:bg-blue-500/10 px-3 py-1.5 rounded-lg transition-colors">
                      <ImageIcon className="w-3.5 h-3.5" /> View Screenshot
                    </button>
                  )}
                  <button onClick={() => handleApprove(r.id)}
                    className="flex items-center gap-1.5 text-xs font-bold text-green-400 border border-green-500/30 hover:bg-green-500/10 px-3 py-1.5 rounded-lg transition-colors">
                    <Check className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button onClick={() => handleReject(r.id)}
                    className="flex items-center gap-1.5 text-xs font-bold text-red-400 border border-red-500/30 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-colors">
                    <X className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={<CreditCard className="w-10 h-10 text-zinc-700" />} label="No pending recharge requests" />
      )}

      {viewImg && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setViewImg(null)}>
          <div className="relative max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setViewImg(null)} className="absolute -top-10 right-0 text-zinc-400 hover:text-white"><X className="w-6 h-6" /></button>
            <img src={viewImg} alt="UPI Screenshot" className="w-full rounded-2xl border border-zinc-700 shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Withdrawals tab ──────────────────────────────────────────────────────────
function WithdrawalsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "all">("pending");

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/admin/withdraw-requests`, { headers: authHeaders() });
      const data = await r.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch { } finally { setLoading(false); }
  };

  useState(() => { fetchRequests(); });

  const handleAction = async (id: number, action: "approve" | "reject") => {
    try {
      await fetch(`${BASE}/admin/withdraw-requests/${id}/${action}`, { method: "POST", headers: authHeaders() });
      toast({ title: action === "approve" ? "Withdrawal approved!" : "Withdrawal rejected & refunded" });
      fetchRequests();
      queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
    } catch { toast({ title: "Failed", variant: "destructive" }); }
  };

  const filtered = filter === "pending" ? requests.filter((r) => r.status === "pending") : requests;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-black uppercase tracking-widest text-white">Withdrawal Requests</h2>
        <div className="flex gap-2">
          {["pending", "all"].map((f) => (
            <button key={f} onClick={() => setFilter(f as any)}
              className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border transition-all ${filter === f ? "bg-orange-500 border-orange-500 text-white" : "bg-zinc-900 border-zinc-700 text-zinc-400"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl bg-zinc-800" />)}</div>
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div key={r.id} className={`bg-zinc-900 border rounded-xl p-4 ${r.status === "pending" ? "border-red-500/20" : r.status === "completed" ? "border-green-500/20" : "border-zinc-800"}`}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <p className="font-black text-white">
                    {r.userName || `User #${r.userId}`}
                    <span className="ml-2 text-red-400 font-black">-{r.amount} coins</span>
                  </p>
                  <p className="text-xs text-zinc-500 font-mono">{r.userEmail}</p>
                  {r.description && <p className="text-xs text-zinc-400 font-mono mt-1">{r.description}</p>}
                  <p className="text-xs text-zinc-600 font-mono mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(r.createdAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold uppercase px-2 py-1 rounded-lg ${r.status === "pending" ? "bg-yellow-500/20 text-yellow-400" : r.status === "completed" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                    {r.status}
                  </span>
                  {r.status === "pending" && (
                    <>
                      <button onClick={() => handleAction(r.id, "approve")}
                        className="flex items-center gap-1 text-xs font-bold text-green-400 border border-green-500/30 hover:bg-green-500/10 px-3 py-1.5 rounded-lg transition-colors">
                        <Check className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button onClick={() => handleAction(r.id, "reject")}
                        className="flex items-center gap-1 text-xs font-bold text-red-400 border border-red-500/30 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-colors">
                        <X className="w-3.5 h-3.5" /> Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={<ArrowUpRight className="w-10 h-10 text-zinc-700" />} label="No withdrawal requests" />
      )}
    </div>
  );
}

// ─── Users tab ────────────────────────────────────────────────────────────────
function UsersTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [creditUserId, setCreditUserId] = useState<number | null>(null);
  const [creditAmount, setCreditAmount] = useState("");
  const [creditNotes, setCreditNotes] = useState("");
  const [crediting, setCrediting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/admin/users`, { headers: authHeaders() });
      setUsers(await r.json());
    } catch { } finally { setLoading(false); }
  };

  useState(() => { fetchUsers(); });

  const handleToggleAdmin = async (id: number, current: boolean) => {
    try {
      await fetch(`${BASE}/admin/users/${id}/admin`, {
        method: "PATCH", headers: authHeaders(),
        body: JSON.stringify({ isAdmin: !current }),
      });
      toast({ title: `Admin ${!current ? "granted" : "revoked"}` });
      fetchUsers();
    } catch { toast({ title: "Failed", variant: "destructive" }); }
  };

  const handleCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creditUserId || !creditAmount) return;
    setCrediting(true);
    try {
      await fetch(`${BASE}/admin/users/${creditUserId}/credit`, {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ amount: parseInt(creditAmount), notes: creditNotes || undefined }),
      });
      toast({ title: `+${creditAmount} coins credited!` });
      setCreditUserId(null); setCreditAmount(""); setCreditNotes("");
      fetchUsers();
    } catch { toast({ title: "Failed", variant: "destructive" }); }
    finally { setCrediting(false); }
  };

  const filtered = users.filter((u) =>
    !search || u.displayName?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-black uppercase tracking-widest text-white">Player Management</h2>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search players..."
            className="bg-zinc-900 border border-zinc-700 rounded-xl pl-9 pr-4 py-2 text-sm text-white font-mono outline-none focus:border-orange-500 transition-all w-52"
          />
        </div>
      </div>
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl bg-zinc-800" />)}</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((u) => (
            <div key={u.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {u.photoUrl ? (
                  <img src={u.photoUrl} alt="" className="w-9 h-9 rounded-full border border-zinc-700 object-cover shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 text-zinc-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-white text-sm truncate">{u.displayName}</p>
                    {u.isAdmin && <Shield className="w-3.5 h-3.5 text-orange-400 shrink-0" />}
                  </div>
                  <p className="text-xs text-zinc-500 font-mono truncate">{u.email}</p>
                  {u.freeFireName && <p className="text-xs text-orange-400/70 font-mono">〔{u.freeFireName}〕</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1 bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1.5">
                  <Coins className="w-3.5 h-3.5 text-yellow-400" />
                  <span className="text-yellow-400 font-black text-sm">{u.walletBalance}</span>
                </div>
                <button onClick={() => { setCreditUserId(u.id); setCreditAmount(""); setCreditNotes(""); }}
                  className="flex items-center gap-1 text-xs font-bold text-green-400 border border-green-500/30 hover:bg-green-500/10 px-2.5 py-1.5 rounded-lg transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Credit
                </button>
                <button onClick={() => handleToggleAdmin(u.id, u.isAdmin)}
                  className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors border ${u.isAdmin ? "text-orange-400 border-orange-500/30 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30" : "text-zinc-500 border-zinc-700 hover:bg-orange-500/10 hover:text-orange-400 hover:border-orange-500/30"}`}>
                  <UserCog className="w-3.5 h-3.5" />
                  {u.isAdmin ? "Revoke" : "Admin"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {creditUserId && (
        <Modal title={`💰 Credit Coins — ${users.find((u) => u.id === creditUserId)?.displayName}`} onClose={() => setCreditUserId(null)}>
          <form onSubmit={handleCredit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Amount (coins)</label>
              <input type="number" min={1} value={creditAmount} onChange={(e) => setCreditAmount(e.target.value)} required placeholder="e.g. 500"
                className="w-full bg-zinc-800 border border-zinc-700 focus:border-green-500 rounded-xl px-4 py-2.5 text-white font-mono text-sm outline-none transition-all" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Notes (optional)</label>
              <input value={creditNotes} onChange={(e) => setCreditNotes(e.target.value)} placeholder="Reason for credit..."
                className="w-full bg-zinc-800 border border-zinc-700 focus:border-green-500 rounded-xl px-4 py-2.5 text-white font-mono text-sm outline-none transition-all" />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setCreditUserId(null)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-3 rounded-xl transition-all">Cancel</button>
              <button type="submit" disabled={crediting}
                className="flex-1 bg-green-500 hover:bg-green-400 text-white font-black uppercase tracking-widest py-3 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-green-500/20">
                {crediting ? "Crediting..." : `+ Credit ${creditAmount || "?"} coins`}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────
function AdminBtn({ icon, label, onClick, color }: { icon: React.ReactNode; label: string; onClick: () => void; color: string }) {
  const colors: Record<string, string> = {
    blue: "text-blue-400 border-blue-500/30 hover:bg-blue-500/10",
    green: "text-green-400 border-green-500/30 hover:bg-green-500/10",
    yellow: "text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/10",
    default: "text-zinc-400 border-zinc-700 hover:bg-zinc-800",
  };
  return (
    <button onClick={onClick} className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg border transition-colors ${colors[color] || colors.default}`}>
      {icon} {label}
    </button>
  );
}

function EmptyState({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="text-center py-16 border border-zinc-800 rounded-2xl bg-zinc-900/40">
      <div className="flex justify-center mb-3">{icon}</div>
      <p className="text-zinc-500 font-mono text-sm uppercase tracking-wider">{label}</p>
    </div>
  );
}

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`bg-zinc-900 border border-zinc-700 rounded-2xl w-full shadow-2xl overflow-hidden ${wide ? "max-w-2xl" : "max-w-md"}`}>
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <h3 className="font-black uppercase tracking-widest text-white text-sm">{title}</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────
export default function Admin() {
  const { dbUser, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const { data: stats } = useGetAdminStats({ query: { queryKey: getGetAdminStatsQueryKey() } });

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
    </div>
  );
  if (!dbUser?.isAdmin) { setLocation("/dashboard"); return null; }

  const badgeCounts: Record<string, number> = {
    recharges: stats?.pendingRecharges ?? 0,
    withdrawals: stats?.pendingWithdrawals ?? 0,
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* Sidebar */}
      <div className="w-56 shrink-0 bg-zinc-900 border-r border-zinc-800 flex flex-col py-6 hidden md:flex">
        <div className="px-5 mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-orange-400" />
            <span className="text-xs font-mono uppercase tracking-widest text-orange-400">Admin Panel</span>
          </div>
          <p className="text-white font-black uppercase tracking-tight text-sm">BAADSHAH FF</p>
        </div>
        <nav className="space-y-1 px-3 flex-1">
          {TABS.map((tab) => {
            const badge = tab.badge ? badgeCounts[tab.badge] : 0;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" : "text-zinc-500 hover:text-white hover:bg-zinc-800"}`}
              >
                {tab.icon}
                <span className="flex-1 text-left">{tab.label}</span>
                {badge > 0 && (
                  <span className="bg-orange-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">{badge}</span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="px-4 pt-4 border-t border-zinc-800 mx-3">
          <p className="text-[10px] text-zinc-700 font-mono uppercase">Logged in as admin</p>
          <p className="text-xs text-zinc-500 font-mono truncate">{dbUser?.email}</p>
        </div>
      </div>

      {/* Mobile top nav */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-zinc-900 border-b border-zinc-800 z-40 flex overflow-x-auto gap-1 p-2">
        {TABS.map((tab) => {
          const badge = tab.badge ? badgeCounts[tab.badge] : 0;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${activeTab === tab.id ? "bg-orange-500 text-white" : "text-zinc-500 hover:text-white"}`}
            >
              {tab.icon} {tab.label}
              {badge > 0 && <span className="bg-white text-orange-500 text-[10px] font-black px-1 rounded-full">{badge}</span>}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto md:pt-0 pt-16">
        <div className="p-6 max-w-5xl mx-auto">
          {activeTab === "dashboard" && <DashboardTab />}
          {activeTab === "tournaments" && <TournamentsTab />}
          {activeTab === "recharges" && <RechargesTab />}
          {activeTab === "withdrawals" && <WithdrawalsTab />}
          {activeTab === "users" && <UsersTab />}
        </div>
      </div>
    </div>
  );
}
