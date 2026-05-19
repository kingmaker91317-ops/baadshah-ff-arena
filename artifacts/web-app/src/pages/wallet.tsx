import { useState, useRef } from "react";
import {
  useGetWallet, getGetWalletQueryKey,
  useGetTransactions, getGetTransactionsQueryKey,
  useRechargeWallet,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Coins, ArrowDownLeft, ArrowUpRight, Clock, ImageIcon, X,
  Hash, CheckCircle, AlertCircle, Hourglass, Upload
} from "lucide-react";

const TX_CONFIG: Record<string, { color: string; bg: string; sign: string; icon: React.ReactNode }> = {
  recharge: { color: "text-green-400", bg: "bg-green-500/10", sign: "+", icon: <ArrowDownLeft className="w-4 h-4 text-green-400" /> },
  deduction: { color: "text-red-400", bg: "bg-red-500/10", sign: "-", icon: <ArrowUpRight className="w-4 h-4 text-red-400" /> },
  refund: { color: "text-blue-400", bg: "bg-blue-500/10", sign: "+", icon: <ArrowDownLeft className="w-4 h-4 text-blue-400" /> },
  withdrawal: { color: "text-orange-400", bg: "bg-orange-500/10", sign: "-", icon: <ArrowUpRight className="w-4 h-4 text-orange-400" /> },
};

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  pending: { icon: <Hourglass className="w-3 h-3" />, color: "text-yellow-400", label: "Pending" },
  completed: { icon: <CheckCircle className="w-3 h-3" />, color: "text-green-400", label: "Completed" },
  rejected: { icon: <AlertCircle className="w-3 h-3" />, color: "text-red-400", label: "Rejected" },
};

// ─── UPI QR placeholder ───────────────────────────────────────────────────────
const ADMIN_UPI = "baadshahffarena@upi";

export default function WalletPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<"recharge" | "withdraw">("recharge");
  const [amount, setAmount] = useState("");
  const [utrNumber, setUtrNumber] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [screenshotName, setScreenshotName] = useState("");

  // Withdraw form
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [upiId, setUpiId] = useState("");
  const [withdrawNotes, setWithdrawNotes] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  const { data: wallet, isLoading: walletLoading } = useGetWallet({ query: { queryKey: getGetWalletQueryKey() } });
  const { data: transactions, isLoading: txLoading } = useGetTransactions({ query: { queryKey: getGetTransactionsQueryKey() } });
  const rechargeMutation = useRechargeWallet();

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      toast({ title: "File too large. Max 3MB", variant: "destructive" });
      return;
    }
    setScreenshotName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setScreenshot(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleRecharge = async (e: React.FormEvent) => {
    e.preventDefault();
    const amtNum = parseInt(amount);
    if (!amtNum || amtNum < 1) { toast({ title: "Invalid amount", variant: "destructive" }); return; }
    try {
      await rechargeMutation.mutateAsync({
        data: { amount: amtNum, utrNumber, screenshotUrl: screenshot } as any,
      });
      toast({ title: "✅ Recharge request submitted!", description: "Admin will approve within 24 hours." });
      setAmount(""); setUtrNumber(""); setScreenshot(null); setScreenshotName("");
      if (fileRef.current) fileRef.current.value = "";
      queryClient.invalidateQueries({ queryKey: getGetTransactionsQueryKey() });
    } catch { toast({ title: "Failed to submit recharge", variant: "destructive" }); }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amtNum = parseInt(withdrawAmount);
    if (!amtNum || amtNum < 1) { toast({ title: "Invalid amount", variant: "destructive" }); return; }
    if ((wallet?.balance ?? 0) < amtNum) { toast({ title: "Insufficient balance", variant: "destructive" }); return; }
    setWithdrawLoading(true);
    try {
      const r = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-firebase-uid": localStorage.getItem("firebase_uid") || "" },
        body: JSON.stringify({ amount: amtNum, upiId, notes: withdrawNotes || undefined }),
      });
      if (!r.ok) { const d = await r.json(); throw new Error(d.error); }
      toast({ title: "Withdrawal request submitted!", description: "Admin will process within 24 hours." });
      setWithdrawAmount(""); setUpiId(""); setWithdrawNotes("");
      queryClient.invalidateQueries({ queryKey: getGetWalletQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetTransactionsQueryKey() });
    } catch (err: any) {
      toast({ title: err.message || "Failed to submit withdrawal", variant: "destructive" });
    } finally { setWithdrawLoading(false); }
  };

  const inputCls = "w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 rounded-xl px-4 py-3 text-white placeholder-zinc-600 font-mono text-sm outline-none transition-all";

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Hero */}
      <div className="bg-gradient-to-b from-zinc-900 to-[#0a0a0a] border-b border-zinc-800/60 px-4 py-8">
        <div className="container mx-auto max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            <Coins className="w-5 h-5 text-yellow-400" />
            <span className="text-xs font-mono uppercase tracking-widest text-yellow-400">Wallet</span>
          </div>
          {walletLoading ? (
            <Skeleton className="h-14 w-40 bg-zinc-800" />
          ) : (
            <div>
              <p className="text-6xl font-black text-yellow-400">{wallet?.balance ?? 0}</p>
              <p className="text-zinc-500 font-mono text-sm">coins available</p>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        {/* Tab switcher */}
        <div className="flex gap-2 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
          {[
            { id: "recharge", label: "Add Coins", icon: <ArrowDownLeft className="w-4 h-4" /> },
            { id: "withdraw", label: "Withdraw", icon: <ArrowUpRight className="w-4 h-4" /> },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-black uppercase tracking-wider transition-all ${tab === t.id ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" : "text-zinc-500 hover:text-white"}`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Recharge form */}
        {tab === "recharge" && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="border-b border-zinc-800 px-5 py-4">
              <h3 className="font-black uppercase tracking-widest text-white text-sm flex items-center gap-2">
                <ArrowDownLeft className="w-4 h-4 text-green-400" /> Add Coins via UPI
              </h3>
            </div>
            <div className="p-5">
              {/* UPI info */}
              <div className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-4 mb-5">
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Pay to this UPI ID</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-white font-black font-mono text-lg">{ADMIN_UPI}</p>
                    <p className="text-zinc-500 text-xs font-mono">BAADSHAH FF ARENA</p>
                  </div>
                  <div className="bg-white rounded-lg p-2">
                    <div className="w-16 h-16 bg-zinc-900 rounded flex items-center justify-center text-xs text-zinc-400 text-center font-mono">QR<br/>Code</div>
                  </div>
                </div>
                <p className="text-xs text-zinc-600 font-mono mt-3 leading-relaxed">
                  Make payment → note the UTR number → fill form below → attach screenshot → submit
                </p>
              </div>

              <form onSubmit={handleRecharge} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Amount (coins) · ₹1 = 1 coin</label>
                  <input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} required placeholder="e.g. 100" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 flex items-center gap-1"><Hash className="w-3.5 h-3.5" /> UTR / Reference Number</label>
                  <input value={utrNumber} onChange={(e) => setUtrNumber(e.target.value)} required placeholder="12-digit UTR number" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 flex items-center gap-1"><ImageIcon className="w-3.5 h-3.5" /> Payment Screenshot</label>
                  <div
                    onClick={() => fileRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${screenshot ? "border-green-500/40 bg-green-500/5" : "border-zinc-700 hover:border-zinc-500 bg-zinc-800/40"}`}
                  >
                    {screenshot ? (
                      <div className="flex items-center justify-center gap-3">
                        <img src={screenshot} alt="preview" className="w-16 h-16 object-cover rounded-lg border border-zinc-600" />
                        <div className="text-left">
                          <p className="text-green-400 font-bold text-sm">Screenshot attached</p>
                          <p className="text-zinc-500 text-xs font-mono truncate max-w-32">{screenshotName}</p>
                          <button type="button" onClick={(e) => { e.stopPropagation(); setScreenshot(null); setScreenshotName(""); if (fileRef.current) fileRef.current.value = ""; }}
                            className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 mt-1">
                            <X className="w-3 h-3" /> Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                        <p className="text-zinc-400 text-sm font-bold">Tap to upload screenshot</p>
                        <p className="text-zinc-600 text-xs font-mono mt-1">JPG, PNG — max 3MB</p>
                      </div>
                    )}
                    <input ref={fileRef} type="file" accept="image/*" onChange={handleScreenshotChange} className="hidden" />
                  </div>
                </div>
                <button type="submit" disabled={rechargeMutation.isPending}
                  className="w-full bg-green-500 hover:bg-green-400 text-white font-black uppercase tracking-widest py-3.5 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-green-500/20">
                  {rechargeMutation.isPending ? "Submitting..." : "Submit Recharge Request"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Withdraw form */}
        {tab === "withdraw" && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="border-b border-zinc-800 px-5 py-4">
              <h3 className="font-black uppercase tracking-widest text-white text-sm flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-orange-400" /> Withdraw Coins
              </h3>
            </div>
            <div className="p-5">
              <div className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-4 mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-mono uppercase tracking-widest text-zinc-500">Available Balance</p>
                  <p className="text-3xl font-black text-yellow-400">{wallet?.balance ?? 0} <span className="text-base text-zinc-500 font-normal">coins</span></p>
                </div>
                <Coins className="w-8 h-8 text-yellow-400/30" />
              </div>
              <form onSubmit={handleWithdraw} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Amount to Withdraw</label>
                  <input type="number" min={1} max={wallet?.balance ?? 0} value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} required placeholder="Min 1 coin" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Your UPI ID</label>
                  <input value={upiId} onChange={(e) => setUpiId(e.target.value)} required placeholder="yourname@upi" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Notes (optional)</label>
                  <input value={withdrawNotes} onChange={(e) => setWithdrawNotes(e.target.value)} placeholder="Account name, etc." className={inputCls} />
                </div>
                <p className="text-xs text-zinc-600 font-mono">Coins will be deducted immediately. Admin processes within 24 hours.</p>
                <button type="submit" disabled={withdrawLoading || !withdrawAmount || !upiId || parseInt(withdrawAmount) > (wallet?.balance ?? 0)}
                  className="w-full bg-orange-500 hover:bg-orange-400 text-white font-black uppercase tracking-widest py-3.5 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-orange-500/20">
                  {withdrawLoading ? "Submitting..." : `Request Withdrawal — ${withdrawAmount || "?"} coins`}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Transaction history */}
        <div>
          <h2 className="text-lg font-black uppercase tracking-widest text-white mb-4">Transaction History</h2>
          {txLoading ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl bg-zinc-800" />)}</div>
          ) : transactions && transactions.length > 0 ? (
            <div className="space-y-2">
              {transactions.map((tx) => {
                const cfg = TX_CONFIG[tx.type] ?? TX_CONFIG.recharge;
                const sc = STATUS_CONFIG[tx.status] ?? STATUS_CONFIG.pending;
                return (
                  <div key={tx.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
                      {cfg.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white text-sm capitalize">{tx.type}</p>
                      <p className="text-xs text-zinc-500 font-mono truncate">{tx.description || tx.utrNumber || "—"}</p>
                      <p className="text-xs text-zinc-700 font-mono flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {new Date(tx.createdAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-xl font-black ${cfg.color}`}>{cfg.sign}{tx.amount}</p>
                      <p className={`text-[10px] font-bold font-mono uppercase flex items-center justify-end gap-1 mt-0.5 ${sc.color}`}>
                        {sc.icon} {sc.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 border border-zinc-800 rounded-2xl bg-zinc-900/40">
              <Coins className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500 font-mono text-sm">No transactions yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
