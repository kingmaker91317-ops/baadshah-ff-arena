import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { Layout } from "./components/Layout";

import Home from "./pages/home";
import Login from "./pages/login";
import Register from "./pages/register";
import Dashboard from "./pages/dashboard";
import Tournaments from "./pages/tournaments";
import TournamentDetail from "./pages/tournament-detail";
import MyTournaments from "./pages/my-tournaments";
import WalletPage from "./pages/wallet";
import Profile from "./pages/profile";
import Admin from "./pages/admin";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, staleTime: 30_000 },
  },
});

function ProtectedRoute({ component: Component, adminOnly = false }: { component: React.ComponentType; adminOnly?: boolean }) {
  const { user, dbUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground font-mono text-sm uppercase tracking-wider">Loading Arena...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    window.location.replace("/login");
    return null;
  }

  if (adminOnly && dbUser && !dbUser.isAdmin) {
    window.location.replace("/tournaments");
    return null;
  }

  return <Component />;
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
        <Route path="/tournaments" component={() => <ProtectedRoute component={Tournaments} />} />
        <Route path="/tournaments/:id" component={() => <ProtectedRoute component={TournamentDetail} />} />
        <Route path="/my-tournaments" component={() => <ProtectedRoute component={MyTournaments} />} />
        <Route path="/wallet" component={() => <ProtectedRoute component={WalletPage} />} />
        <Route path="/profile" component={() => <ProtectedRoute component={Profile} />} />
        <Route path="/admin" component={() => <ProtectedRoute component={Admin} adminOnly={true} />} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
