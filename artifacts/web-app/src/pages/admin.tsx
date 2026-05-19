import { useState } from "react";
import {
  useGetAdminStats,
  getGetAdminStatsQueryKey,
  useListTournaments,
  getListTournamentsQueryKey,
  useCreateTournament,
  useUpdateTournament,
  useDeleteTournament,
  useSetRoomDetails,
  useListRechargeRequests,
  getListRechargeRequestsQueryKey,
  useApproveRecharge,
  useRejectRecharge,
  useGetTournamentRegistrations,
  getGetTournamentRegistrationsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Trophy, Users, Zap, DollarSign, Plus, Trash2, Edit3, Key, Check, X } from "lucide-react";

function StatsGrid() {
  const { data: stats, isLoading } = useGetAdminStats({ query: { queryKey: getGetAdminStatsQueryKey() } });
  const statItems = [
    { icon: <Users className="w-5 h-5" />, value: stats?.totalUsers, label: "Total Users" },
    { icon: <Trophy className="w-5 h-5" />, value: stats?.totalTournaments, label: "Tournaments" },
    { icon: <Zap className="w-5 h-5" />, value: stats?.activeTournaments, label: "Active" },
    { icon: <Users className="w-5 h-5" />, value: stats?.totalRegistrations, label: "Registrations" },
    { icon: <DollarSign className="w-5 h-5" />, value: stats?.pendingRecharges, label: "Pending Recharges" },
    { icon: <Trophy className="w-5 h-5" />, value: stats?.totalRevenue, label: "Total Revenue (coins)" },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
      {statItems.map((s, i) => (
        <div key={i} className="bg-card border border-border rounded-lg p-4 text-center">
          <div className="text-primary flex justify-center mb-2">{s.icon}</div>
          {isLoading ? <Skeleton className="h-8 w-16 mx-auto" /> : <p className="text-2xl font-black">{s.value ?? 0}</p>}
          <p className="text-xs text-muted-foreground font-mono uppercase">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

function TournamentForm({ initial, onSubmit, isPending, onCancel }: {
  initial?: any; onSubmit: (d: any) => void; isPending: boolean; onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title || "");
  const [mode, setMode] = useState(initial?.mode || "solo");
  const [status, setStatus] = useState(initial?.status || "upcoming");
  const [prizePool, setPrizePool] = useState(String(initial?.prizePool || ""));
  const [entryFee, setEntryFee] = useState(String(initial?.entryFee || "0"));
  const [maxSlots, setMaxSlots] = useState(String(initial?.maxSlots || "100"));
  const [scheduledAt, setScheduledAt] = useState(initial?.scheduledAt ? new Date(initial.scheduledAt).toISOString().slice(0, 16) : "");
  const [mapName, setMapName] = useState(initial?.mapName || "");
  const [description, setDescription] = useState(initial?.description || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ title, mode, status, prizePool: parseInt(prizePool), entryFee: parseInt(entryFee), maxSlots: parseInt(maxSlots), scheduledAt: new Date(scheduledAt).toISOString(), mapName: mapName || undefined, description: description || undefined });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1"><Label>Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} required /></div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Mode</Label>
          <Select value={mode} onValueChange={setMode}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="solo">Solo</SelectItem><SelectItem value="duo">Duo</SelectItem><SelectItem value="squad">Squad</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="upcoming">Upcoming</SelectItem><SelectItem value="live">Live</SelectItem><SelectItem value="completed">Completed</SelectItem></SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1"><Label>Prize Pool</Label><Input type="number" value={prizePool} onChange={e => setPrizePool(e.target.value)} required /></div>
        <div className="space-y-1"><Label>Entry Fee</Label><Input type="number" value={entryFee} onChange={e => setEntryFee(e.target.value)} required /></div>
        <div className="space-y-1"><Label>Max Slots</Label><Input type="number" value={maxSlots} onChange={e => setMaxSlots(e.target.value)} required /></div>
      </div>
      <div className="space-y-1"><Label>Scheduled At</Label><Input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} required /></div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1"><Label>Map Name</Label><Input value={mapName} onChange={e => setMapName(e.target.value)} /></div>
        <div className="space-y-1"><Label>Description</Label><Input value={description} onChange={e => setDescription(e.target.value)} /></div>
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1 font-bold uppercase" disabled={isPending}>{isPending ? "Saving..." : "Save"}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

export default function Admin() {
  const { dbUser, loading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tournaments, isLoading: tLoading } = useListTournaments({}, { query: { queryKey: getListTournamentsQueryKey({}) } });
  const { data: rechargeRequests, isLoading: rLoading } = useListRechargeRequests({ query: { queryKey: getListRechargeRequestsQueryKey() } });
  const createTournament = useCreateTournament();
  const updateTournament = useUpdateTournament();
  const deleteTournament = useDeleteTournament();
  const setRoom = useSetRoomDetails();
  const approveRecharge = useApproveRecharge();
  const rejectRecharge = useRejectRecharge();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [roomTournamentId, setRoomTournamentId] = useState<number | null>(null);
  const [roomId, setRoomId] = useState("");
  const [roomPassword, setRoomPassword] = useState("");
  const [viewRegsTid, setViewRegsTid] = useState<number | null>(null);

  const { data: viewRegs } = useGetTournamentRegistrations(viewRegsTid || 0, {
    query: { enabled: !!viewRegsTid, queryKey: getGetTournamentRegistrationsQueryKey(viewRegsTid || 0) }
  });

  if (loading) return <div className="p-8 text-center font-mono">LOADING...</div>;
  if (!dbUser?.isAdmin) { setLocation("/tournaments"); return null; }

  const handleCreate = async (data: any) => {
    try {
      await createTournament.mutateAsync({ data });
      toast({ title: "Tournament created!" });
      setShowCreateForm(false);
      queryClient.invalidateQueries({ queryKey: getListTournamentsQueryKey({}) });
      queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
    } catch { toast({ title: "Failed", variant: "destructive" }); }
  };

  const handleUpdate = async (id: number, data: any) => {
    try {
      await updateTournament.mutateAsync({ id, data });
      toast({ title: "Updated!" });
      setEditId(null);
      queryClient.invalidateQueries({ queryKey: getListTournamentsQueryKey({}) });
    } catch { toast({ title: "Failed", variant: "destructive" }); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this tournament?")) return;
    try {
      await deleteTournament.mutateAsync({ id });
      toast({ title: "Deleted" });
      queryClient.invalidateQueries({ queryKey: getListTournamentsQueryKey({}) });
      queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
    } catch { toast({ title: "Failed", variant: "destructive" }); }
  };

  const handleSetRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomTournamentId) return;
    try {
      await setRoom.mutateAsync({ id: roomTournamentId, data: { roomId, roomPassword } });
      toast({ title: "Room details set!" });
      setRoomTournamentId(null);
      setRoomId(""); setRoomPassword("");
      queryClient.invalidateQueries({ queryKey: getListTournamentsQueryKey({}) });
    } catch { toast({ title: "Failed", variant: "destructive" }); }
  };

  const handleApprove = async (id: number) => {
    try {
      await approveRecharge.mutateAsync({ id });
      toast({ title: "Recharge approved!" });
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-black uppercase tracking-tighter mb-8">
        Admin <span className="text-primary">Panel</span>
      </h1>

      <StatsGrid />

      <Tabs defaultValue="tournaments">
        <TabsList className="mb-6 bg-card border border-border">
          <TabsTrigger value="tournaments" className="font-bold uppercase tracking-wider text-xs">Tournaments</TabsTrigger>
          <TabsTrigger value="recharges" className="font-bold uppercase tracking-wider text-xs">
            Recharges {rechargeRequests && rechargeRequests.length > 0 && <span className="ml-1 bg-primary text-primary-foreground rounded-full w-4 h-4 text-xs flex items-center justify-center">{rechargeRequests.length}</span>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tournaments">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-black uppercase tracking-wider">Manage Tournaments</h2>
            <Button data-testid="button-create-tournament" onClick={() => setShowCreateForm(true)} className="font-bold uppercase">
              <Plus className="w-4 h-4 mr-1" /> New Tournament
            </Button>
          </div>

          {showCreateForm && (
            <Card className="mb-6 border-primary/30">
              <CardHeader><CardTitle className="font-black uppercase">Create Tournament</CardTitle></CardHeader>
              <CardContent>
                <TournamentForm onSubmit={handleCreate} isPending={createTournament.isPending} onCancel={() => setShowCreateForm(false)} />
              </CardContent>
            </Card>
          )}

          {tLoading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
          ) : (
            <div className="space-y-3">
              {tournaments?.map((t) => (
                <div key={t.id} className="bg-card border border-border rounded-lg p-4">
                  {editId === t.id ? (
                    <TournamentForm initial={t} onSubmit={(d) => handleUpdate(t.id, d)} isPending={updateTournament.isPending} onCancel={() => setEditId(null)} />
                  ) : (
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <h3 className="font-black uppercase">{t.title}</h3>
                        <p className="text-xs text-muted-foreground font-mono uppercase">{t.mode} · {t.status} · {t.filledSlots}/{t.maxSlots} slots · {t.prizePool} prize</p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button size="sm" variant="outline" onClick={() => { setViewRegsTid(t.id); }}><Users className="w-3.5 h-3.5 mr-1" /> Registrations</Button>
                        <Button size="sm" variant="outline" onClick={() => { setRoomTournamentId(t.id); }}><Key className="w-3.5 h-3.5 mr-1" /> Set Room</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditId(t.id)}><Edit3 className="w-3.5 h-3.5 mr-1" /> Edit</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(t.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recharges">
          <h2 className="text-xl font-black uppercase tracking-wider mb-4">Pending Recharge Requests</h2>
          {rLoading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
          ) : rechargeRequests && rechargeRequests.length > 0 ? (
            <div className="space-y-3">
              {rechargeRequests.map((r) => (
                <div key={r.id} data-testid={`recharge-req-${r.id}`} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="font-bold">User #{r.userId} — <span className="text-primary font-black">{r.amount} coins</span></p>
                    <p className="text-xs text-muted-foreground font-mono">UTR: {r.utrNumber} · {new Date(r.createdAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button data-testid={`button-approve-${r.id}`} size="sm" className="bg-green-600 hover:bg-green-700 font-bold" onClick={() => handleApprove(r.id)}>
                      <Check className="w-3.5 h-3.5 mr-1" /> Approve
                    </Button>
                    <Button data-testid={`button-reject-${r.id}`} size="sm" variant="destructive" onClick={() => handleReject(r.id)}>
                      <X className="w-3.5 h-3.5 mr-1" /> Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-border rounded-lg">
              <p className="text-muted-foreground font-mono">No pending recharge requests.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Set Room Dialog */}
      <Dialog open={!!roomTournamentId} onOpenChange={(o) => { if (!o) setRoomTournamentId(null); }}>
        <DialogContent className="bg-card border border-border">
          <DialogHeader><DialogTitle className="font-black uppercase">Set Room Details</DialogTitle></DialogHeader>
          <form onSubmit={handleSetRoom} className="space-y-4">
            <div className="space-y-2"><Label>Room ID</Label><Input data-testid="input-room-id" value={roomId} onChange={e => setRoomId(e.target.value)} required className="font-mono" /></div>
            <div className="space-y-2"><Label>Room Password</Label><Input data-testid="input-room-password" value={roomPassword} onChange={e => setRoomPassword(e.target.value)} required className="font-mono" /></div>
            <Button type="submit" className="w-full font-bold uppercase" disabled={setRoom.isPending}>{setRoom.isPending ? "Setting..." : "Set Room Details"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Registrations Dialog */}
      <Dialog open={!!viewRegsTid} onOpenChange={(o) => { if (!o) setViewRegsTid(null); }}>
        <DialogContent className="bg-card border border-border max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-black uppercase">Tournament Registrations</DialogTitle></DialogHeader>
          {viewRegs && viewRegs.length > 0 ? (
            <div className="space-y-2 mt-2">
              {viewRegs.map((reg) => (
                <div key={reg.id} className="bg-background border border-border rounded p-3 flex items-center justify-between">
                  <div>
                    <p className="font-bold font-mono">{reg.freeFireName} <span className="text-muted-foreground text-xs">({reg.freeFireUid})</span></p>
                    {reg.teamName && <p className="text-xs text-muted-foreground font-mono">Team: {reg.teamName}</p>}
                    <p className="text-xs text-muted-foreground font-mono">{reg.user?.email}</p>
                  </div>
                  <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${reg.status === "confirmed" ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}`}>{reg.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground font-mono text-sm mt-2">No registrations yet.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
