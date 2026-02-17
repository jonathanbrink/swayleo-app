import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Building2, AlertCircle, Loader2 } from 'lucide-react';
import { Button, useToast } from '../components/ui';
import { useInvitationByToken, useAcceptInvitation, useAuth } from '../hooks';

export function AcceptInvitation() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isAuthenticated, user } = useAuth();

  const { data: invitation, isLoading, error } = useInvitationByToken(token || '');
  const acceptInvite = useAcceptInvitation();
  const [autoAccepting, setAutoAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  // Check if email matches
  const emailMatches = Boolean(user?.email && invitation?.email && user.email.toLowerCase() === invitation.email.toLowerCase());
  const emailMismatch = Boolean(user?.email && invitation?.email && user.email.toLowerCase() !== invitation.email.toLowerCase());

  // Auto-accept if logged in and email matches
  useEffect(() => {
    const autoAccept = async () => {
      if (isAuthenticated && emailMatches && invitation && !autoAccepting && !acceptError) {
        setAutoAccepting(true);
        try {
          await acceptInvite.mutateAsync(token!);
          showToast(`Welcome to ${invitation.organization?.name || 'the team'}!`);
          navigate('/');
        } catch (err) {
          setAutoAccepting(false);
          const message = err instanceof Error ? err.message : 'Failed to accept invitation';
          setAcceptError(message);
          console.error('Failed to auto-accept:', err);
        }
      }
    };

    autoAccept();
  }, [isAuthenticated, emailMatches, invitation, autoAccepting, acceptError]);

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated && invitation) {
      navigate(`/auth?redirect=/invite/${token}`);
    }
  }, [isLoading, isAuthenticated, invitation, token, navigate]);

  if (isLoading || autoAccepting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-sway-500 animate-spin" />
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="font-display font-semibold text-xl text-slate-800 mb-2">
            Invalid or Expired Invitation
          </h1>
          <p className="text-slate-500 mb-6">
            This invitation link is no longer valid. It may have expired or already been used.
          </p>
          <Link to="/">
            <Button variant="secondary" className="w-full">
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Only show this page if there's an email mismatch or an error
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-sway-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 max-w-md w-full">
        <div className="text-center">
          {/* Logo */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sway-500 to-sway-600 flex items-center justify-center shadow-lg shadow-sway-500/25 mx-auto mb-6">
            <span className="text-white font-display font-bold text-xl">S</span>
          </div>

          <h1 className="font-display font-semibold text-2xl text-slate-800 mb-2">
            You're Invited!
          </h1>
          <p className="text-slate-500 mb-8">
            You've been invited to join an organization on Swayleo.
          </p>
        </div>

        {/* Organization Card */}
        <div className="bg-slate-50 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center">
              <Building2 className="w-6 h-6 text-slate-400" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">{invitation.organization?.name}</p>
              <p className="text-sm text-slate-500 capitalize">
                Joining as {invitation.role}
              </p>
            </div>
          </div>
        </div>

        {/* Accept Error */}
        {acceptError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-red-800">Failed to Accept Invitation</p>
                <p className="text-red-700 mt-1">{acceptError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Email Mismatch Warning */}
        {emailMismatch && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-amber-800">Email Mismatch</p>
                <p className="text-amber-700 mt-1">
                  This invitation was sent to <strong>{invitation.email}</strong>, but you're logged in as <strong>{user?.email}</strong>.
                </p>
                <p className="text-amber-700 mt-2">
                  Please log out and sign in with the invited email address.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {acceptError && emailMatches && (
            <Button
              className="w-full"
              onClick={() => {
                setAcceptError(null);
                setAutoAccepting(false);
              }}
            >
              Try Again
            </Button>
          )}
          <Link to="/">
            <Button variant="secondary" className="w-full">
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
