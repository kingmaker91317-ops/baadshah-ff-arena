import { useState } from "react";
import { Link, useLocation } from "wouter";
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { saveUserProfile } from "@/lib/firestoreUser";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Flame, ChevronRight, ChevronLeft, UserCircle2 } from "lucide-react";

interface FormData {
  name: string;
  email: string;
  password: string;
  confirm: string;
  ffUid: string;
  inGameName: string;
  level: string;
  phone: string;
}

export default function Register() {
  const [step, setStep] = useState(1);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [form, setForm] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    confirm: "",
    ffUid: "",
    inGameName: "",
    level: "",
    phone: "",
  });

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (form.password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setStep(2);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await updateProfile(cred.user, { displayName: form.name });
      await saveUserProfile({
        uid: cred.user.uid,
        name: form.name,
        email: form.email,
        ffUid: form.ffUid,
        inGameName: form.inGameName,
        level: form.level,
        phone: form.phone,
        wallet: 0,
        photoUrl: null,
      });
      setLocation("/dashboard");
    } catch (error: any) {
      toast({ title: "Registration Failed", description: friendlyError(error.code), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      await saveUserProfile({
        uid: cred.user.uid,
        name: cred.user.displayName || "",
        email: cred.user.email || "",
        ffUid: "",
        inGameName: "",
        level: "",
        phone: "",
        wallet: 0,
        photoUrl: cred.user.photoURL,
      });
      setLocation("/dashboard");
    } catch (error: any) {
      toast({ title: "Google Sign-Up Failed", description: friendlyError(error.code), variant: "destructive" });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/4 w-64 h-64 bg-orange-600/5 rounded-full blur-2xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-500/20 border border-orange-500/40 mb-4">
            <Flame className="w-8 h-8 text-orange-400" />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-[0.15em] text-white">
            BAADSHAH <span className="text-orange-400">FF</span> ARENA
          </h1>
          <p className="text-zinc-500 text-sm font-mono mt-1 uppercase tracking-wider">Create your warrior profile</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all ${
                step >= s
                  ? "bg-orange-500 border-orange-500 text-white"
                  : "bg-transparent border-zinc-700 text-zinc-600"
              }`}>
                {s}
              </div>
              {s < 2 && <div className={`w-12 h-0.5 transition-all ${step > s ? "bg-orange-500" : "bg-zinc-700"}`} />}
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-16 text-xs font-mono uppercase tracking-wider text-zinc-600 mb-6">
          <span className={step === 1 ? "text-orange-400" : ""}>Account</span>
          <span className={step === 2 ? "text-orange-400" : ""}>Game Profile</span>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-8 backdrop-blur-sm shadow-2xl">
          {step === 1 && (
            <>
              <h2 className="text-xl font-black uppercase tracking-widest text-white mb-6">
                <span className="text-orange-400">STEP 1</span> — Account Info
              </h2>

              {/* Google */}
              <button
                onClick={handleGoogleRegister}
                disabled={googleLoading || loading}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-zinc-100 text-zinc-900 font-bold py-3 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 mb-5 shadow-lg"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                {googleLoading ? "Connecting..." : "Sign up with Google"}
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-zinc-700" />
                <span className="text-zinc-600 text-xs font-mono uppercase tracking-widest">or</span>
                <div className="flex-1 h-px bg-zinc-700" />
              </div>

              <form onSubmit={handleStep1} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={set("name")}
                    required
                    placeholder="Your name"
                    className="w-full bg-zinc-800/80 border border-zinc-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/40 rounded-xl px-4 py-3 text-white placeholder-zinc-600 font-mono text-sm outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={set("email")}
                    required
                    placeholder="player@example.com"
                    className="w-full bg-zinc-800/80 border border-zinc-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/40 rounded-xl px-4 py-3 text-white placeholder-zinc-600 font-mono text-sm outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={set("phone")}
                    placeholder="+91 9876543210"
                    className="w-full bg-zinc-800/80 border border-zinc-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/40 rounded-xl px-4 py-3 text-white placeholder-zinc-600 font-mono text-sm outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Password</label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      value={form.password}
                      onChange={set("password")}
                      required
                      placeholder="Min 6 characters"
                      className="w-full bg-zinc-800/80 border border-zinc-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/40 rounded-xl px-4 py-3 pr-12 text-white placeholder-zinc-600 font-mono text-sm outline-none transition-all"
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                      {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Confirm Password</label>
                  <input
                    type="password"
                    value={form.confirm}
                    onChange={set("confirm")}
                    required
                    placeholder="••••••••"
                    className="w-full bg-zinc-800/80 border border-zinc-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/40 rounded-xl px-4 py-3 text-white placeholder-zinc-600 font-mono text-sm outline-none transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-black uppercase tracking-widest py-3 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-orange-500/20 mt-2"
                >
                  Next: Game Profile <ChevronRight className="w-4 h-4" />
                </button>
              </form>

              <p className="text-center text-zinc-500 text-sm mt-6">
                Already have an account?{" "}
                <Link href="/login">
                  <span className="text-orange-400 font-bold hover:text-orange-300 cursor-pointer transition-colors">Login</span>
                </Link>
              </p>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-xl font-black uppercase tracking-widest text-white mb-6">
                <span className="text-orange-400">STEP 2</span> — Game Profile
              </h2>

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Free Fire UID</label>
                  <input
                    type="text"
                    value={form.ffUid}
                    onChange={set("ffUid")}
                    placeholder="e.g. 123456789"
                    className="w-full bg-zinc-800/80 border border-zinc-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/40 rounded-xl px-4 py-3 text-white placeholder-zinc-600 font-mono text-sm outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">In-Game Name</label>
                  <input
                    type="text"
                    value={form.inGameName}
                    onChange={set("inGameName")}
                    placeholder="Your FF username"
                    className="w-full bg-zinc-800/80 border border-zinc-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/40 rounded-xl px-4 py-3 text-white placeholder-zinc-600 font-mono text-sm outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Level</label>
                  <select
                    value={form.level}
                    onChange={set("level")}
                    className="w-full bg-zinc-800/80 border border-zinc-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/40 rounded-xl px-4 py-3 text-white font-mono text-sm outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-zinc-900">Select your level</option>
                    {Array.from({ length: 80 }, (_, i) => i + 1).map((lvl) => (
                      <option key={lvl} value={lvl} className="bg-zinc-900">Level {lvl}</option>
                    ))}
                  </select>
                </div>

                <div className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <UserCircle2 className="w-4 h-4 text-orange-400" />
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Your Account</p>
                  </div>
                  <p className="text-white font-mono text-sm">{form.name}</p>
                  <p className="text-zinc-500 font-mono text-xs">{form.email}</p>
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-3 px-4 rounded-xl transition-all duration-200"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-black uppercase tracking-widest py-3 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 shadow-lg shadow-orange-500/20"
                  >
                    {loading ? "Creating..." : "⚔ Join the Arena"}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function friendlyError(code: string): string {
  const map: Record<string, string> = {
    "auth/email-already-in-use": "An account with this email already exists.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/weak-password": "Password is too weak. Use at least 6 characters.",
    "auth/popup-closed-by-user": "Sign-in window was closed.",
  };
  return map[code] || "Something went wrong. Please try again.";
}
