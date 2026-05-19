import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { getUserProfile, saveUserProfile, FirestoreUserProfile } from "@/lib/firestoreUser";
import { useToast } from "@/hooks/use-toast";
import {
  Flame, LogOut, Wallet, Trophy, Sword, User, Edit3, Check, X,
  Shield, Phone, Star, Gamepad2, Coins, ChevronRight
} from "lucide-react";

export default function Dashboard() {
  const { user, dbUser, signOut } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [profile, setProfile] = useState<FirestoreUserProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    ffUid: "",
    inGameName: "",
    level: "",
    phone: "",
  });

  useEffect(() => {
    if (user) {
      getUserProfile(user.uid).then((p) => {
        if (p) {
          setProfile(p);
          setForm({
            name: p.name || user.displayName || "",
            ffUid: p.ffUid || "",
            inGameName: p.inGameName || "",
            level: p.level || "",
            phone: p.phone || "",
          });
        } else {
          setForm({
            name: user.displayName || "",
            ffUid: "",
            inGameName: "",
            level: "",
            phone: "",
          });
        }
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await saveUserProfile({
        uid: user.uid,
        email: user.email || "",
        name: form.name,
        ffUid: form.ffUid,
        inGameName: form.inGameName,
        level: form.level,
        phone: form.phone,
        wallet: profile?.wallet ?? 0,
        photoUrl: user.photoURL,
      });
      const updated = await getUserProfile(user.uid);
      setProfile(updated);
      setEditing(false);
      toast({ title: "Profile updated!" });
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    setLocation("/login");
  };

  const displayName = profile?.name || user?.displayName || "Warrior";
  const avatar = user?.photoURL;
  const walletBalance = profile?.wallet ?? dbUser?.walletBalance ?? 0;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Hero header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-900 to-orange-950/30 border-b border-zinc-800">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23f97316%22 fill-opacity=%220.03%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50" />
        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-5">
              {/* Avatar */}
              <div className="relative">
                {avatar ? (
                  <img src={avatar} alt="avatar" className="w-20 h-20 rounded-2xl border-2 border-orange-500/60 object-cover" />
                ) : (
                  <div className="w-20 h-20 rounded-2xl border-2 border-orange-500/60 bg-zinc-800 flex items-center justify-center">
                    <User className="w-10 h-10 text-orange-400" />
                  </div>
                )}
                {dbUser?.isAdmin && (
                  <div className="absolute -top-2 -right-2 bg-orange-500 rounded-full p-1">
                    <Shield className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span className="text-xs font-mono uppercase tracking-widest text-orange-400">Warrior Dashboard</span>
                </div>
                <h1 className="text-3xl font-black uppercase tracking-tight">{displayName}</h1>
                <p className="text-zinc-500 font-mono text-sm">{user?.email}</p>
                {profile?.inGameName && (
                  <p className="text-orange-400/80 font-mono text-sm font-bold">〔{profile.inGameName}〕</p>
                )}
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-zinc-800 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/40 border border-zinc-700 text-zinc-400 font-bold py-2 px-4 rounded-xl transition-all duration-200 text-sm"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-4 text-center">
              <Coins className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
              <p className="text-2xl font-black text-yellow-400">{walletBalance}</p>
              <p className="text-xs font-mono uppercase text-zinc-500 tracking-wider">Coins</p>
            </div>
            <div className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-4 text-center">
              <Star className="w-5 h-5 text-orange-400 mx-auto mb-1" />
              <p className="text-2xl font-black text-orange-400">{profile?.level || "—"}</p>
              <p className="text-xs font-mono uppercase text-zinc-500 tracking-wider">Level</p>
            </div>
            <div className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-4 text-center">
              <Gamepad2 className="w-5 h-5 text-green-400 mx-auto mb-1" />
              <p className="text-2xl font-black text-green-400">{profile?.ffUid ? "✓" : "—"}</p>
              <p className="text-xs font-mono uppercase text-zinc-500 tracking-wider">FF Linked</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-2xl space-y-4">
        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/tournaments">
            <div className="group bg-zinc-900 border border-zinc-800 hover:border-orange-500/40 rounded-xl p-4 flex items-center gap-3 cursor-pointer transition-all duration-200">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
                <Sword className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="font-bold text-white text-sm uppercase tracking-wider">Tournaments</p>
                <p className="text-zinc-500 text-xs">Browse & join</p>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-600 ml-auto group-hover:text-orange-400 transition-colors" />
            </div>
          </Link>
          <Link href="/wallet">
            <div className="group bg-zinc-900 border border-zinc-800 hover:border-yellow-500/40 rounded-xl p-4 flex items-center gap-3 cursor-pointer transition-all duration-200">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center group-hover:bg-yellow-500/20 transition-colors">
                <Wallet className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="font-bold text-white text-sm uppercase tracking-wider">Wallet</p>
                <p className="text-zinc-500 text-xs">Add coins</p>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-600 ml-auto group-hover:text-yellow-400 transition-colors" />
            </div>
          </Link>
          <Link href="/my-tournaments">
            <div className="group bg-zinc-900 border border-zinc-800 hover:border-green-500/40 rounded-xl p-4 flex items-center gap-3 cursor-pointer transition-all duration-200">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                <Trophy className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="font-bold text-white text-sm uppercase tracking-wider">My Matches</p>
                <p className="text-zinc-500 text-xs">Your history</p>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-600 ml-auto group-hover:text-green-400 transition-colors" />
            </div>
          </Link>
          {dbUser?.isAdmin && (
            <Link href="/admin">
              <div className="group bg-zinc-900 border border-zinc-800 hover:border-red-500/40 rounded-xl p-4 flex items-center gap-3 cursor-pointer transition-all duration-200">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                  <Shield className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="font-bold text-white text-sm uppercase tracking-wider">Admin Panel</p>
                  <p className="text-zinc-500 text-xs">Manage arena</p>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-600 ml-auto group-hover:text-red-400 transition-colors" />
              </div>
            </Link>
          )}
        </div>

        {/* Profile card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-orange-400" />
              <h3 className="font-black uppercase tracking-widest text-sm">Warrior Profile</h3>
            </div>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-orange-400 hover:text-orange-300 transition-colors border border-orange-500/30 hover:border-orange-400 px-3 py-1.5 rounded-lg"
              >
                <Edit3 className="w-3 h-3" /> Edit
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-green-400 border border-green-500/30 hover:border-green-400 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Check className="w-3 h-3" /> {saving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-zinc-500 border border-zinc-700 px-3 py-1.5 rounded-lg transition-colors hover:text-zinc-300"
                >
                  <X className="w-3 h-3" /> Cancel
                </button>
              </div>
            )}
          </div>

          <div className="p-6 space-y-4">
            {editing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "Full Name", field: "name" as const, icon: <User className="w-4 h-4" />, placeholder: "Your name" },
                  { label: "Phone", field: "phone" as const, icon: <Phone className="w-4 h-4" />, placeholder: "+91 9876543210" },
                  { label: "Free Fire UID", field: "ffUid" as const, icon: <Gamepad2 className="w-4 h-4" />, placeholder: "e.g. 123456789" },
                  { label: "In-Game Name", field: "inGameName" as const, icon: <Sword className="w-4 h-4" />, placeholder: "FF username" },
                ].map(({ label, field, icon, placeholder }) => (
                  <div key={field}>
                    <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">
                      {icon} {label}
                    </label>
                    <input
                      type="text"
                      value={form[field]}
                      onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 rounded-xl px-4 py-2.5 text-white placeholder-zinc-600 font-mono text-sm outline-none transition-all"
                    />
                  </div>
                ))}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">
                    <Star className="w-4 h-4" /> Level
                  </label>
                  <select
                    value={form.level}
                    onChange={(e) => setForm((p) => ({ ...p, level: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500 rounded-xl px-4 py-2.5 text-white font-mono text-sm outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-zinc-900">Select level</option>
                    {Array.from({ length: 80 }, (_, i) => i + 1).map((lvl) => (
                      <option key={lvl} value={lvl} className="bg-zinc-900">Level {lvl}</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "Full Name", value: profile?.name || user?.displayName, icon: <User className="w-4 h-4" /> },
                  { label: "Email", value: user?.email, icon: <User className="w-4 h-4" />, mono: true },
                  { label: "Phone", value: profile?.phone, icon: <Phone className="w-4 h-4" />, mono: true },
                  { label: "Level", value: profile?.level ? `Level ${profile.level}` : null, icon: <Star className="w-4 h-4" /> },
                  { label: "Free Fire UID", value: profile?.ffUid, icon: <Gamepad2 className="w-4 h-4" />, mono: true },
                  { label: "In-Game Name", value: profile?.inGameName, icon: <Sword className="w-4 h-4" /> },
                ].map(({ label, value, icon, mono }) => (
                  <div key={label} className="bg-zinc-800/50 rounded-xl p-3 border border-zinc-700/50">
                    <div className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-zinc-500 mb-1">
                      <span className="text-orange-400/60">{icon}</span> {label}
                    </div>
                    <p className={`text-white font-bold ${mono ? "font-mono text-sm" : ""}`}>
                      {value || <span className="text-zinc-600 font-normal">Not set</span>}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Wallet card */}
        <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/5 border border-yellow-500/20 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Coins className="w-4 h-4 text-yellow-400" />
              <span className="text-xs font-mono uppercase tracking-widest text-yellow-400/80">Coin Wallet</span>
            </div>
            <p className="text-4xl font-black text-yellow-400">{walletBalance}</p>
            <p className="text-zinc-500 text-xs mt-1">Available balance</p>
          </div>
          <Link href="/wallet">
            <button className="bg-yellow-500 hover:bg-yellow-400 text-zinc-900 font-black uppercase tracking-wider py-2.5 px-5 rounded-xl text-sm transition-all duration-200 shadow-lg shadow-yellow-500/20">
              + Add Coins
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
