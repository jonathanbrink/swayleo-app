import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Mail, Copy, Trash2 } from 'lucide-react';
import { Button, Modal, useToast } from '../components/ui';
import { useBrand, useSavedEmails, useDeleteSavedEmail, useUpdateSavedEmail } from '../hooks';
import { copyToClipboard, exportEmailAsText } from '../lib/email';
import { EMAIL_TEMPLATES } from '../types/email';
import type { SavedEmail } from '../types/email';

export function SavedEmails() {
  const { id: brandId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const { data: brand, isLoading: brandLoading } = useBrand(brandId!);
  const { data: emails = [], isLoading: emailsLoading } = useSavedEmails(brandId!);
  const deleteEmail = useDeleteSavedEmail();
  const updateEmail = useUpdateSavedEmail();

  const [selectedEmail, setSelectedEmail] = useState<SavedEmail | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const handleDelete = async (email: SavedEmail) => {
    if (!window.confirm(`Delete "${email.name}"? This cannot be undone.`)) return;

    try {
      await deleteEmail.mutateAsync({ id: email.id, brandId: brandId! });
      showToast('Email deleted');
      if (selectedEmail?.id === email.id) {
        setSelectedEmail(null);
        setShowPreviewModal(false);
      }
    } catch {
      showToast('Failed to delete email', 'error');
    }
  };

  const handleStatusChange = async (email: SavedEmail, status: SavedEmail['status']) => {
    try {
      await updateEmail.mutateAsync({
        id: email.id,
        brandId: brandId!,
        updates: { status },
      });
      showToast(`Email marked as ${status}`);
    } catch {
      showToast('Failed to update status', 'error');
    }
  };

  const handleCopy = async (email: SavedEmail) => {
    const text = exportEmailAsText({
      subjectLine: email.subject_line,
      previewText: email.preview_text || undefined,
      body: email.body_content,
      cta: email.cta_text,
    });
    await copyToClipboard(text);
    showToast('Email copied to clipboard');
  };

  const handlePreview = (email: SavedEmail) => {
    setSelectedEmail(email);
    setShowPreviewModal(true);
  };

  const getStatusColor = (status: SavedEmail['status']) => {
    switch (status) {
      case 'draft':
        return 'bg-slate-100 text-slate-600';
      case 'approved':
        return 'bg-emerald-50 text-emerald-600';
      case 'exported':
        return 'bg-blue-50 text-blue-600';
    }
  };

  if (brandLoading || emailsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-sway-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <p className="text-slate-500">Brand not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/brands/${brandId}`)}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-display font-semibold text-xl text-slate-800">
                Saved Emails
              </h1>
              <p className="text-sm text-slate-500">{brand.name}</p>
            </div>
          </div>
          <Button onClick={() => navigate(`/brands/${brandId}/generate`)}>
            <Plus className="w-5 h-5" />
            Generate New
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="p-8">
        {emails.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-4">
              <Mail className="w-8 h-8" />
            </div>
            <h3 className="font-display font-semibold text-lg text-slate-800 mb-2">
              No saved emails yet
            </h3>
            <p className="text-slate-500 max-w-sm mx-auto mb-6">
              Generate AI-powered emails using this brand's kit and save them here.
            </p>
            <Button onClick={() => navigate(`/brands/${brandId}/generate`)}>
              <Plus className="w-5 h-5" />
              Generate Your First Email
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {emails.map((email) => {
                  const template = EMAIL_TEMPLATES.find(t => t.id === email.email_type);
                  return (
                    <tr key={email.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handlePreview(email)}
                          className="text-left"
                        >
                          <p className="font-medium text-slate-800 hover:text-sway-600">
                            {email.name}
                          </p>
                          <p className="text-sm text-slate-500 truncate max-w-xs">
                            {email.subject_line}
                          </p>
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                          {template?.icon} {template?.name || email.email_type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={email.status}
                          onChange={(e) => handleStatusChange(email, e.target.value as SavedEmail['status'])}
                          className={`text-xs font-medium px-2.5 py-1 rounded-full cursor-pointer border-0 ${getStatusColor(email.status)}`}
                        >
                          <option value="draft">Draft</option>
                          <option value="approved">Approved</option>
                          <option value="exported">Exported</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {new Date(email.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleCopy(email)}
                            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                            title="Copy"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(email)}
                            className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Preview Modal */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title={selectedEmail?.name || 'Email Preview'}
        size="lg"
      >
        {selectedEmail && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                Subject Line
              </label>
              <p className="text-slate-800 font-medium">{selectedEmail.subject_line}</p>
              {selectedEmail.preview_text && (
                <p className="text-sm text-slate-500">{selectedEmail.preview_text}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                Body
              </label>
              <div className="p-4 bg-slate-50 rounded-lg text-slate-700 whitespace-pre-wrap">
                {selectedEmail.body_content}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                Call to Action
              </label>
              <span className="inline-block px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium">
                {selectedEmail.cta_text}
              </span>
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => handleCopy(selectedEmail)}
                className="flex-1"
              >
                <Copy className="w-4 h-4" />
                Copy
              </Button>
              <Button
                onClick={() => setShowPreviewModal(false)}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
