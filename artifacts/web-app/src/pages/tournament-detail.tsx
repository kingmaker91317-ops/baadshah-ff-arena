import { useState } from "react";
import { useParams } from "wouter";
import {
  useGetTournament,
  getGetTournamentQueryKey,
  useRegisterForTournament,
  useGetWallet,
  getGetWalletQueryKey,
  getListTournamentsQueryKey,
  getGetMyRegistrationsQueryKey,
  getGetTransactionsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Trophy, Users, Clock, Shield, Zap, MapPin, Lock, Key } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const STATUS_COLORS: Record<string, string> = {
  upcoming: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  live: "bg-green-500/20 text-green-400 border-green-500/30",
  completed: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

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
  const registerMutation = useRegisterForTournament();

  const [showModal, setShowModal] = useState(false);
  const [ffUid, setFfUid] = useState(dbUser?.freeFireUid || "");
  const [ffName, setFfName] = useState(dbUser?.freeFireName || "");
  const [teamName, setTeamName] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tournament) return;
    try {
      await registerMutation.mutateAsync({
        id: numId,
        data: { freeFireUid: ffUid, freeFireName: ffName, teamName: teamName || undefined },
      });
      toast({ title: "Registered!", description: `You're in for ${tournament.title}` });
      setShowModal(false);
      queryClient.invalidateQueries({ queryKey: getGetTournamentQueryKey(numId) });
      queryClient.invalidateQueries({ queryKey: getListTournamentsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetMyRegistrationsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetWalletQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetTransactionsQueryKey() });
    } catch (err: any) {
      toast({ title: "Registration failed", description: err?.data?.error || "Something went wrong", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-10 w-64 mb-4" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-muted-foreground font-mono">Tournament not found.</p>
      </div>
    );
  }

  const slotsLeft = tournament.maxSlots - tournament.filledSlots;
  const canRegister = tournament.status !== "completed" && slotsLeft > 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded border ${STATUS_COLORS[tournament.status]}`}>
            {tournament.status}
          </span>
          <span className="text-xs text-muted-foreground font-mono uppercase">{tournament.mode}</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-2">{tournament.title}</h1>
        {tournament.description && (
          <p className="text-muted-foreground">{tournament.description}</p>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { icon: <Trophy className="w-5 h-5" />, value: tournament.prizePool.toLocaleString(), label: "Prize Pool" },
          { icon: <Shield className="w-5 h-5" />, value: `${tournament.entryFee === 0 ? "FREE" : tournament.entryFee + " coins"}`, label: "Entry Fee" },
          { icon: <Users className="w-5 h-5" />, value: `${tournament.filledSlots}/${tournament.maxSlots}`, label: "Slots" },
          { icon: <Clock className="w-5 h-5" />, value: new Date(tournament.scheduledAt).toLocaleTimeString("en-IN", { timeStyle: "short" }), label: new Date(tournament.scheduledAt).toLocaleDateString("en-IN") },
        ].map((item, i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-4 text-center">
            <div className="text-primary flex justify-center mb-2">{item.icon}</div>
            <p className="text-xl font-black">{item.value}</p>
            <p className="text-xs text-muted-foreground uppercase font-mono">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Map */}
      {tournament.mapName && (
        <div className="flex items-center gap-2 text-muted-foreground font-mono text-sm mb-6">
          <MapPin className="w-4 h-4" />
          Map: <span className="text-foreground font-bold">{tournament.mapName}</span>
        </div>
      )}

      {/* Room Details - only if live and registered (show for now if live) */}
      {tournament.status === "live" && tournament.roomId && (
        <div className="border border-primary/30 bg-primary/5 rounded-lg p-5 mb-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4" /> Room Details
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground font-mono uppercase mb-1 flex items-center gap-1"><Key className="w-3 h-3" /> Room ID</p>
              <p className="font-black font-mono text-lg tracking-widest">{tournament.roomId}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-mono uppercase mb-1 flex items-center gap-1"><Lock className="w-3 h-3" /> Password</p>
              <p className="font-black font-mono text-lg tracking-widest">{tournament.roomPassword}</p>
            </div>
          </div>
        </div>
      )}

      {/* Wallet balance */}
      {wallet && (
        <div className="text-sm text-muted-foreground font-mono mb-4">
          Your wallet: <span className="text-primary font-bold">{wallet.balance} coins</span>
          {tournament.entryFee > 0 && wallet.balance < tournament.entryFee && (
            <span className="text-destructive ml-2">(insufficient balance)</span>
          )}
        </div>
      )}

      {/* Register Button */}
      {canRegister ? (
        <Button
          data-testid="button-join-tournament"
          size="lg"
          className="w-full font-black uppercase tracking-wider text-base"
          onClick={() => setShowModal(true)}
          disabled={!!(wallet && tournament.entryFee > 0 && wallet.balance < tournament.entryFee)}
        >
          Join Tournament {tournament.entryFee > 0 ? `— ${tournament.entryFee} Coins` : "— FREE"}
        </Button>
      ) : (
        <Button size="lg" className="w-full" disabled>
          {tournament.status === "completed" ? "Tournament Ended" : "Lobby Full"}
        </Button>
      )}

      {/* Registration Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-card border border-border">
          <DialogHeader>
            <DialogTitle className="font-black uppercase tracking-wider">Register for Battle</DialogTitle>
            <DialogDescription className="font-mono">Enter your Free Fire details to join</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRegister} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Free Fire UID</Label>
              <Input
                data-testid="input-ff-uid"
                value={ffUid}
                onChange={(e) => setFfUid(e.target.value)}
                placeholder="Your FF UID"
                required
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label>Free Fire Name</Label>
              <Input
                data-testid="input-ff-name"
                value={ffName}
                onChange={(e) => setFfName(e.target.value)}
                placeholder="Your in-game name"
                required
                className="font-mono"
              />
            </div>
            {(tournament.mode === "duo" || tournament.mode === "squad") && (
              <div className="space-y-2">
                <Label>Team Name <span className="text-muted-foreground">(optional)</span></Label>
                <Input
                  data-testid="input-team-name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Your squad name"
                  className="font-mono"
                />
              </div>
            )}
            <Button
              data-testid="button-confirm-register"
              type="submit"
              className="w-full font-bold uppercase"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? "Registering..." : `Confirm — ${tournament.entryFee === 0 ? "FREE" : `${tournament.entryFee} Coins`}`}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
