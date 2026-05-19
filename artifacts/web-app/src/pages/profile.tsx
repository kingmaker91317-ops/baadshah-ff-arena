import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSyncUser, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { User, Shield, Edit3, Check } from "lucide-react";

export default function Profile() {
  const { user, dbUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const syncMutation = useSyncUser();

  const [editing, setEditing] = useState(false);
  const [ffUid, setFfUid] = useState(dbUser?.freeFireUid || "");
  const [ffName, setFfName] = useState(dbUser?.freeFireName || "");

  const handleSave = async () => {
    if (!user) return;
    try {
      await syncMutation.mutateAsync({
        data: {
          firebaseUid: user.uid,
          email: user.email || "",
          displayName: user.displayName || "Gamer",
          photoUrl: user.photoURL || null,
        },
      });
      // update ff details separately via a direct fetch for now
      const uid = localStorage.getItem("firebase_uid");
      await fetch("/api/users/me/ff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-firebase-uid": uid || "" },
        body: JSON.stringify({ freeFireUid: ffUid, freeFireName: ffName }),
      });
      queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      toast({ title: "Profile updated!" });
      setEditing(false);
    } catch {
      toast({ title: "Failed to update profile", variant: "destructive" });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      <h1 className="text-4xl font-black uppercase tracking-tighter mb-8">
        <span className="text-primary">Warrior</span> Profile
      </h1>

      <Card className="border-border mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-black uppercase tracking-wider text-lg">
            <User className="w-5 h-5 text-primary" /> Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground font-mono uppercase mb-1">Display Name</p>
            <p className="font-bold">{dbUser?.displayName || user?.displayName || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-mono uppercase mb-1">Email</p>
            <p className="font-mono text-sm">{dbUser?.email || user?.email || "—"}</p>
          </div>
          {dbUser?.isAdmin && (
            <div className="flex items-center gap-2 text-primary text-sm font-bold">
              <Shield className="w-4 h-4" /> Admin
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center justify-between font-black uppercase tracking-wider text-lg">
            <span className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" /> Free Fire Details
            </span>
            {!editing && (
              <Button data-testid="button-edit-profile" size="sm" variant="outline" onClick={() => setEditing(true)}>
                <Edit3 className="w-4 h-4 mr-1" /> Edit
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {editing ? (
            <>
              <div className="space-y-2">
                <Label>Free Fire UID</Label>
                <Input
                  data-testid="input-ff-uid"
                  value={ffUid}
                  onChange={(e) => setFfUid(e.target.value)}
                  placeholder="Your FF UID"
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label>Free Fire In-Game Name</Label>
                <Input
                  data-testid="input-ff-name"
                  value={ffName}
                  onChange={(e) => setFfName(e.target.value)}
                  placeholder="Your in-game name"
                  className="font-mono"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  data-testid="button-save-profile"
                  className="flex-1 font-bold uppercase"
                  onClick={handleSave}
                  disabled={syncMutation.isPending}
                >
                  <Check className="w-4 h-4 mr-1" />
                  {syncMutation.isPending ? "Saving..." : "Save"}
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </>
          ) : (
            <>
              <div>
                <p className="text-xs text-muted-foreground font-mono uppercase mb-1">FF UID</p>
                <p className="font-mono font-bold">{dbUser?.freeFireUid || <span className="text-muted-foreground">Not set</span>}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-mono uppercase mb-1">In-Game Name</p>
                <p className="font-bold">{dbUser?.freeFireName || <span className="text-muted-foreground">Not set</span>}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
