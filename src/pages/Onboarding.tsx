import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { Button, Input, useToast } from '../components/ui';
import { useCreateOrganization } from '../hooks';

export function Onboarding() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const createOrg = useCreateOrganization();

  const [orgName, setOrgName] = useState('');
  const [error, setError] = useState('');

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!orgName.trim()) {
      setError('Organization name is required');
      return;
    }

    try {
      await createOrg.mutateAsync(orgName.trim());
      showToast('Organization created!');
      navigate('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create organization';
      showToast(message, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sway-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sway-500 to-sway-600 flex items-center justify-center shadow-lg shadow-sway-500/25">
              <span className="text-white font-display font-bold text-2xl">S</span>
            </div>
            <span className="font-display font-semibold text-3xl text-slate-800">Swayleo</span>
          </div>
        </div>

        {/* Create Org Form */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mx-auto mb-6">
            <Building2 className="w-8 h-8 text-slate-600" />
          </div>

          <h1 className="font-display font-semibold text-2xl text-slate-800 mb-2 text-center">
            Create your organization
          </h1>
          <p className="text-slate-500 mb-8 text-center">
            This is your agency's workspace where you'll manage all your client brands.
          </p>

          <form onSubmit={handleCreateOrg} className="space-y-6">
            <Input
              label="Organization Name"
              placeholder="e.g., Acme Agency"
              value={orgName}
              onChange={(e) => {
                setOrgName(e.target.value);
                setError('');
              }}
              error={error}
              required
            />

            <Button 
              type="submit" 
              loading={createOrg.isPending}
              className="w-full"
              size="lg"
            >
              Create Organization
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
