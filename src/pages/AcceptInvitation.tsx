import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Building2, AlertCircle, Check, Loader2 } from 'lucide-react';
import { Button, useToast } from '../components/ui';
import { useInvitationByToken, useAcceptInvitation, useAuth } from '../hooks';

export function AcceptInvitation() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isAuthenticated, user } = useAuth();

  const { data: invitation, isLoading, error } = useInvitationByToken(token || '');
  const acceptInvite = useAcceptInvitation();
  const [accepted, setAccepted] = useState(false);

  const handleAccept = async () => {
    if (!token) return;

    try {
      await acceptInvite.mutateAsync(token);
      setAccepted(true);
      showToast('You\'ve joined the organization!');
      
      // Redirect to dashboard after a moment
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to accept invitation';
      showToast(message, 'error');
    }
  };

  // Auto-redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated && invitation) {
      // Store token for after auth
      sessionStorage.setItem('pendingInviteToken', token || '');
      navigate(`/auth?redirect=/invite/${token}`);
    }
  }, [isLoading, isAuthenticated, invitation, token, navigate]);

  // Check for pending invite after auth
  useEffect(() => {
    const pendingToken = sessionStorage.getItem('pendingInviteToken');
    if (pendingToken && isAuthenticated) {
      sessionStorage.removeItem('pendingInviteToken');
    }
  }, [isAuthenticated]);

  if (isLoading) {
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

  if (accepted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="font-display font-semibold text-xl text-slate-800 mb-2">
            Welcome to {invitation.organization?.name}!
          </h1>
          <p className="text-slate-500 mb-6">
            You're now a member. Redirecting to dashboard...
          </p>
          <Loader2 className="w-6 h-6 text-sway-500 animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  // Check if email matches
  const emailMismatch = Boolean(user?.email && user.email.toLowerCase() !== invitation.email.toLowerCase());

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
              </div>
            </div>
          </div>
        )}

        {/* Invitation Details */}
        <div className="space-y-3 mb-6 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Invited by</span>
            <span className="text-slate-700">{invitation.inviter?.full_name || 'Team Admin'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Expires</span>
            <span className="text-slate-700">
              {new Date(invitation.expires_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={handleAccept}
            loading={acceptInvite.isPending}
            disabled={emailMismatch}
            className="w-full"
            size="lg"
          >
            Accept Invitation
          </Button>
          
          <Link to="/">
            <Button variant="ghost" className="w-full">
              Decline
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
