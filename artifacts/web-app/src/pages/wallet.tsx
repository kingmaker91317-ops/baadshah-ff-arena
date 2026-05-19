import { useState } from "react";
import {
  useGetWallet,
  getGetWalletQueryKey,
  useGetTransactions,
  getGetTransactionsQueryKey,
  useRechargeWallet,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Wallet as WalletIcon, ArrowDownLeft, ArrowUpRight, RefreshCw, Clock } from "lucide-react";

const TX_COLORS: Record<string, string> = {
  recharge: "text-green-400",
  deduction: "text-red-400",
  refund: "text-blue-400",
};

const TX_STATUS_COLORS: Record<string, string> = {
  pending: "text-yellow-400",
  completed: "text-green-400",
  rejected: "text-red-400",
};

export default function WalletPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [utrNumber, setUtrNumber] = useState("");

  const { data: wallet, isLoading: walletLoading } = useGetWallet({
    query: { queryKey: getGetWalletQueryKey() },
  });
  const { data: transactions, isLoading: txLoading } = useGetTransactions({
    query: { queryKey: getGetTransactionsQueryKey() },
  });
  const rechargeMutation = useRechargeWallet();

  const handleRecharge = async (e: React.FormEvent) => {
    e.preventDefault();
    const amtNum = parseInt(amount);
    if (!amtNum || amtNum < 1) {
      toast({ title: "Invalid amount", variant: "destructive" });
      return;
    }
    try {
      await rechargeMutation.mutateAsync({ data: { amount: amtNum, utrNumber } });
      toast({ title: "Recharge request submitted!", description: "Admin will approve within 24 hours." });
      setAmount("");
      setUtrNumber("");
      queryClient.invalidateQueries({ queryKey: getGetTransactionsQueryKey() });
    } catch {
      toast({ title: "Failed to submit recharge", variant: "destructive" });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-4xl font-black uppercase tracking-tighter mb-8">
        <span className="text-primary">Wallet</span> &amp; Coins
      </h1>

      {/* Balance */}
      <Card className="mb-8 border-primary/30 bg-gradient-to-br from-primary/10 to-card">
        <CardContent className="pt-6 pb-6">
          {walletLoading ? (
            <Skeleton className="h-16 w-48" />
          ) : (
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                <WalletIcon className="w-7 h-7 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-mono uppercase tracking-wider">Balance</p>
                <p className="text-5xl font-black text-primary">{wallet?.balance ?? 0}</p>
                <p className="text-xs text-muted-foreground font-mono">coins</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recharge Form */}
      <Card className="mb-8 border-border">
        <CardHeader>
          <CardTitle className="font-black uppercase tracking-wider text-lg flex items-center gap-2">
            <ArrowDownLeft className="w-5 h-5 text-green-400" /> Add Coins
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRecharge} className="space-y-4">
            <div className="space-y-2">
              <Label>Amount (coins)</Label>
              <Input
                data-testid="input-recharge-amount"
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 100"
                required
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label>UTR / Transaction Reference Number</Label>
              <Input
                data-testid="input-utr-number"
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value)}
                placeholder="Your payment UTR number"
                required
                className="font-mono"
              />
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              Make payment to the admin UPI and enter the UTR number above. Admin will approve within 24 hours.
            </p>
            <Button
              data-testid="button-submit-recharge"
              type="submit"
              className="w-full font-bold uppercase"
              disabled={rechargeMutation.isPending}
            >
              {rechargeMutation.isPending ? "Submitting..." : "Submit Recharge Request"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <div>
        <h2 className="text-xl font-black uppercase tracking-wider mb-4">Transaction History</h2>
        {txLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
          </div>
        ) : transactions && transactions.length > 0 ? (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                data-testid={`tx-item-${tx.id}`}
                className="bg-card border border-border rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === "recharge" || tx.type === "refund" ? "bg-green-500/10" : "bg-red-500/10"}`}>
                    {tx.type === "recharge" || tx.type === "refund"
                      ? <ArrowDownLeft className="w-4 h-4 text-green-400" />
                      : <ArrowUpRight className="w-4 h-4 text-red-400" />
                    }
                  </div>
                  <div>
                    <p className="font-bold text-sm capitalize">{tx.type}</p>
                    <p className="text-xs text-muted-foreground font-mono">{tx.description || tx.utrNumber || "—"}</p>
                    <p className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(tx.createdAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-black ${TX_COLORS[tx.type]}`}>
                    {tx.type === "deduction" ? "-" : "+"}{tx.amount}
                  </p>
                  <p className={`text-xs font-mono uppercase ${TX_STATUS_COLORS[tx.status]}`}>{tx.status}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border border-border rounded-lg">
            <RefreshCw className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground font-mono text-sm">No transactions yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
