import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from './components/ui';
import { Layout } from './components/layout';
import { 
  BrandsList, 
  BrandDetail, 
  BrandKitBuilder, 
  AuthPage, 
  EmailGenerator, 
  SavedEmails,
  Onboarding,
  Settings,
  AcceptInvitation,
  Dashboard,
  Templates,
  ClientPortal
} from './pages';
import { useAuth, useCurrentOrganization } from './hooks';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
    },
  },
});

// Protected Route wrapper with org check
function ProtectedRoute({ children, requireOrg = true }: { children: React.ReactNode; requireOrg?: boolean }) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { data: org, isLoading: orgLoading, isFetched } = useCurrentOrganization();

  // Wait for auth to finish
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-2 border-sway-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Wait for org query to complete (either loading or not yet fetched)
  if (requireOrg && (orgLoading || !isFetched)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-2 border-sway-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Redirect to onboarding if no org
  if (requireOrg && !org) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/invite/:token" element={<AcceptInvitation />} />

      {/* Client Portal (no auth required) */}
      <Route path="/client/:token" element={<ClientPortal />} />

      {/* Onboarding (auth required, no org required) */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute requireOrg={false}>
            <Onboarding />
          </ProtectedRoute>
        }
      />

      {/* Protected Routes (auth + org required) */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="brands" element={<BrandsList />} />
        <Route path="brands/:id" element={<BrandDetail />} />
        <Route path="brands/:id/kit" element={<BrandKitBuilder />} />
        <Route path="brands/:id/generate" element={<EmailGenerator />} />
        <Route path="brands/:id/emails" element={<SavedEmails />} />
        <Route path="templates" element={<Templates />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}
