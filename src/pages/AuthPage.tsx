import { useState, useEffect } from 'react';
import { Navigate, useSearchParams, useNavigate } from 'react-router-dom';
import { Button, Input, useToast } from '../components/ui';
import { useAuth, useInvitationByToken, useAcceptInvitation } from '../hooks';

export function AuthPage() {
  const { isAuthenticated, signIn, signUp, loading } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const redirect = searchParams.get('redirect') || '/';
  // Extract token from redirect URL if it's an invite
  const inviteToken = redirect.startsWith('/invite/') ? redirect.split('/invite/')[1] : null;
  
  // Fetch invite details if we have a token
  const { data: invitation } = useInvitationByToken(inviteToken || '');
  const acceptInvite = useAcceptInvitation();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pre-fill email from invitation (let user choose sign-in or sign-up)
  useEffect(() => {
    if (invitation?.email) {
      setEmail(invitation.email);
    }
  }, [invitation]);

  // Auto-accept invitation after authentication
  useEffect(() => {
    const autoAcceptInvite = async () => {
      if (isAuthenticated && inviteToken && invitation) {
        try {
          await acceptInvite.mutateAsync(inviteToken);
          showToast(`Welcome to ${invitation.organization?.name || 'the team'}!`);
          navigate('/');
        } catch (err) {
          console.error('Failed to auto-accept invite:', err);
          const message = err instanceof Error ? err.message : 'Failed to accept invitation';
          showToast(message, 'error');
          // Redirect to the invite page so user sees the error state
          navigate(`/invite/${inviteToken}`);
        }
      }
    };

    autoAcceptInvite();
  }, [isAuthenticated, inviteToken, invitation]);

  // Redirect if already authenticated and no invite to process
  if (isAuthenticated && !inviteToken) {
    return <Navigate to={redirect} replace />;
  }

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (isSignUp && !fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      if (isSignUp) {
        await signUp(email, password, fullName);
        // If there's an invite, the useEffect above will auto-accept it
        if (!inviteToken) {
          showToast('Account created! Please check your email to confirm.');
        }
      } else {
        await signIn(email, password);
        if (!inviteToken) {
          showToast('Welcome back!');
        }
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Authentication failed';
      showToast(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-2 border-sway-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-sway-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sway-500 to-sway-600 flex items-center justify-center shadow-lg shadow-sway-500/25">
              <span className="text-white font-display font-bold text-xl">S</span>
            </div>
            <span className="font-display font-semibold text-2xl text-slate-800">Swayleo</span>
          </div>
          <p className="text-slate-500">
            {invitation
              ? `Sign in or create an account to join ${invitation.organization?.name || 'the team'}`
              : isSignUp
                ? 'Create your account'
                : 'Sign in to your account'}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <Input
                label="Full Name"
                placeholder="Jane Smith"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  setErrors((prev) => ({ ...prev, fullName: '' }));
                }}
                error={errors.fullName}
                required
              />
            )}

            <Input
              label="Email"
              type="email"
              placeholder="you@agency.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors((prev) => ({ ...prev, email: '' }));
              }}
              error={errors.email}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors((prev) => ({ ...prev, password: '' }));
              }}
              error={errors.password}
              required
            />

            <Button type="submit" loading={isSubmitting} className="w-full" size="lg">
              {isSignUp ? 'Create Account' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrors({});
              }}
              className="text-sm text-slate-500 hover:text-sway-600 transition-colors"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>

        {/* Demo Note */}
        <p className="mt-6 text-center text-xs text-slate-400">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
