import { useState } from 'react';
import { 
  UserPlus, Copy, Check, Trash2, RefreshCw, 
  Eye, MessageSquare, CheckCircle2, MoreVertical, Link2
} from 'lucide-react';
import { Button, Modal, Input, Select, useToast } from '../ui';
import { 
  useClientAccess, 
  useCreateClientAccess, 
  useDeleteClientAccess,
  useRegenerateClientToken
} from '../../hooks/useClient';
import { ACCESS_LEVELS } from '../../types/client';
import { getClientPortalUrl } from '../../lib/client';
import type { ClientAccess, ClientAccessLevel } from '../../types/client';

interface ClientAccessManagerProps {
  brandId: string;
  brandName: string;
}

export function ClientAccessManager({ brandId, brandName }: ClientAccessManagerProps) {
  const { showToast } = useToast();
  const { data: clients = [], isLoading } = useClientAccess(brandId);
  const createClient = useCreateClientAccess();
  const deleteClient = useDeleteClientAccess();
  const regenerateToken = useRegenerateClientToken();

  const [showAddModal, setShowAddModal] = useState(false);
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [newClientAccess, setNewClientAccess] = useState<ClientAccessLevel>('view');
  const [newClientExpiry, setNewClientExpiry] = useState<string>('never');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createClient.mutateAsync({
        brand_id: brandId,
        email: newClientEmail.trim(),
        name: newClientName.trim() || undefined,
        access_level: newClientAccess,
        expires_in_days: newClientExpiry === 'never' ? null : parseInt(newClientExpiry),
      });
      showToast('Client access created');
      setShowAddModal(false);
      setNewClientEmail('');
      setNewClientName('');
      setNewClientAccess('view');
      setNewClientExpiry('never');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create client access';
      showToast(message, 'error');
    }
  };

  const handleCopyLink = async (client: ClientAccess) => {
    const url = getClientPortalUrl(client.token);
    await navigator.clipboard.writeText(url);
    setCopiedId(client.id);
    showToast('Link copied');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (client: ClientAccess) => {
    if (!window.confirm(`Remove ${client.name || client.email}'s access?`)) return;
    
    try {
      await deleteClient.mutateAsync({ id: client.id, brandId });
      showToast('Client access removed');
    } catch {
      showToast('Failed to remove access', 'error');
    }
  };

  const handleRegenerateToken = async (client: ClientAccess) => {
    if (!window.confirm('Regenerate link? The old link will stop working.')) return;
    
    try {
      await regenerateToken.mutateAsync({ id: client.id, brandId });
      showToast('New link generated');
    } catch {
      showToast('Failed to regenerate link', 'error');
    }
  };

  const getAccessIcon = (level: ClientAccessLevel) => {
    switch (level) {
      case 'approve': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'review': return <MessageSquare className="w-4 h-4 text-blue-500" />;
      default: return <Eye className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-slate-800">Client Access</h2>
          <p className="text-sm text-slate-500">Share this brand with clients for review</p>
        </div>
        <Button size="sm" onClick={() => setShowAddModal(true)}>
          <UserPlus className="w-4 h-4" />
          Add Client
        </Button>
      </div>

      {isLoading ? (
        <div className="p-8 text-center">
          <div className="w-6 h-6 border-2 border-sway-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : clients.length === 0 ? (
        <div className="p-8 text-center">
          <Link2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 mb-4">No clients have access yet.</p>
          <Button variant="outline" size="sm" onClick={() => setShowAddModal(true)}>
            <UserPlus className="w-4 h-4" />
            Add Your First Client
          </Button>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {clients.map((client) => (
            <div key={client.id} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                  {getAccessIcon(client.access_level)}
                </div>
                <div>
                  <p className="font-medium text-slate-800">
                    {client.name || client.email}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    {client.name && <span>{client.email}</span>}
                    <span>•</span>
                    <span className="capitalize">{client.access_level} access</span>
                    {client.expires_at && (
                      <>
                        <span>•</span>
                        <span>
                          Expires {new Date(client.expires_at).toLocaleDateString()}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyLink(client)}
                >
                  {copiedId === client.id ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>

                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMenuOpen(menuOpen === client.id ? null : client.id)}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>

                  {menuOpen === client.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-100 py-1 z-20">
                        <button
                          onClick={() => {
                            handleCopyLink(client);
                            setMenuOpen(null);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <Copy className="w-4 h-4" /> Copy Link
                        </button>
                        <button
                          onClick={() => {
                            handleRegenerateToken(client);
                            setMenuOpen(null);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <RefreshCw className="w-4 h-4" /> Regenerate Link
                        </button>
                        <button
                          onClick={() => {
                            handleDelete(client);
                            setMenuOpen(null);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" /> Remove Access
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Client Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Client Access"
        size="md"
      >
        <form onSubmit={handleAddClient} className="space-y-4">
          <p className="text-sm text-slate-500">
            Give your client access to view {brandName} and review generated emails.
          </p>

          <Input
            label="Client Email"
            type="email"
            placeholder="client@company.com"
            value={newClientEmail}
            onChange={(e) => setNewClientEmail(e.target.value)}
            required
          />

          <Input
            label="Client Name (Optional)"
            placeholder="John Smith"
            value={newClientName}
            onChange={(e) => setNewClientName(e.target.value)}
          />

          <Select
            label="Access Level"
            value={newClientAccess}
            onChange={(e) => setNewClientAccess(e.target.value as ClientAccessLevel)}
            options={ACCESS_LEVELS.map(level => ({
              value: level.id,
              label: `${level.name} - ${level.description}`,
            }))}
          />

          <Select
            label="Link Expiry"
            value={newClientExpiry}
            onChange={(e) => setNewClientExpiry(e.target.value)}
            options={[
              { value: 'never', label: 'Never expires' },
              { value: '7', label: 'Expires in 7 days' },
              { value: '30', label: 'Expires in 30 days' },
              { value: '90', label: 'Expires in 90 days' },
            ]}
          />

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowAddModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" loading={createClient.isPending} className="flex-1">
              Create Access
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
