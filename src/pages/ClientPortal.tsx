import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Building2, Mail, CheckCircle2, XCircle, MessageSquare, 
  Clock, ExternalLink, AlertCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { Button, Modal, Textarea, useToast } from '../components/ui';
import { useClientPortal, useClientBrand, useClientEmails, useSubmitApproval } from '../hooks/useClient';
import { getApprovalStatus } from '../types/client';
import type { ClientPortalEmail } from '../types/client';

export function ClientPortal() {
  const { token } = useParams<{ token: string }>();
  const { showToast } = useToast();
  
  const { data: client, isLoading: clientLoading, error: clientError } = useClientPortal(token || '');
  const { data: brand, isLoading: brandLoading } = useClientBrand(token || '');
  const { data: emails = [], isLoading: emailsLoading } = useClientEmails(token || '');
  const submitApproval = useSubmitApproval();

  const [selectedEmail, setSelectedEmail] = useState<ClientPortalEmail | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approved' | 'rejected' | 'revision_requested' | null>(null);
  const [feedback, setFeedback] = useState('');
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);

  const canApprove = client?.access_level === 'approve';

  const handleApprovalClick = (email: ClientPortalEmail, action: 'approved' | 'rejected' | 'revision_requested') => {
    setSelectedEmail(email);
    setApprovalAction(action);
    setFeedback('');
    setShowApprovalModal(true);
  };

  const handleSubmitApproval = async () => {
    if (!token || !selectedEmail || !approvalAction) return;

    try {
      await submitApproval.mutateAsync({
        token,
        emailId: selectedEmail.id,
        input: {
          status: approvalAction,
          feedback: feedback.trim() || undefined,
        },
      });
      showToast(
        approvalAction === 'approved' 
          ? 'Email approved' 
          : approvalAction === 'rejected'
          ? 'Email rejected'
          : 'Revision requested'
      );
      setShowApprovalModal(false);
      setSelectedEmail(null);
    } catch {
      showToast('Failed to submit approval', 'error');
    }
  };

  // Loading state
  if (clientLoading || brandLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-sway-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Invalid/expired token
  if (clientError || !client) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-semibold text-slate-800 mb-2">Invalid or Expired Link</h1>
          <p className="text-slate-500">
            This client portal link is no longer valid. Please contact your agency for a new link.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">Client Portal</p>
              <h1 className="text-2xl font-display font-semibold text-slate-800">
                {client.brand_name}
              </h1>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">Logged in as</p>
              <p className="font-medium text-slate-800">{client.name || client.email}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Brand Overview */}
        {brand && (
          <section className="bg-white rounded-2xl border border-slate-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-sway-100 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-sway-600" />
              </div>
              <div>
                <h2 className="font-semibold text-lg text-slate-800">{brand.name}</h2>
                {brand.website_url && (
                  <a 
                    href={brand.website_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-sway-500 hover:underline flex items-center gap-1"
                  >
                    {brand.website_url} <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            {brand.brand_kit && (
              <div className="grid md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-slate-100">
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-2">Brand Values</h3>
                  <p className="text-slate-700">
                    {brand.brand_kit.brand_identity.values_themes || 'Not specified'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-2">Brand Voice</h3>
                  <p className="text-slate-700">
                    {brand.brand_kit.brand_voice.voice_description || 'Not specified'}
                  </p>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Emails for Review */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Emails for Review</h2>
            <span className="text-sm text-slate-500">{emails.length} email(s)</span>
          </div>

          {emailsLoading ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
              <div className="w-6 h-6 border-2 border-sway-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : emails.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
              <Mail className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No emails to review yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {emails.map((email) => {
                const isExpanded = expandedEmail === email.id;
                const approval = email.approval;
                const statusInfo = approval ? getApprovalStatus(approval.status) : null;

                return (
                  <div 
                    key={email.id} 
                    className="bg-white rounded-2xl border border-slate-100 overflow-hidden"
                  >
                    {/* Email Header */}
                    <div 
                      className="p-5 cursor-pointer hover:bg-slate-50 transition-colors"
                      onClick={() => setExpandedEmail(isExpanded ? null : email.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-slate-500 uppercase">
                              {email.email_type.replace(/_/g, ' ')}
                            </span>
                            {statusInfo && (
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-${statusInfo.color}-100 text-${statusInfo.color}-700`}>
                                {statusInfo.name}
                              </span>
                            )}
                          </div>
                          <h3 className="font-medium text-slate-800">{email.name}</h3>
                          <p className="text-sm text-slate-500 mt-1">
                            Subject: {email.subject_line}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">
                            {new Date(email.created_at).toLocaleDateString()}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="border-t border-slate-100">
                        <div className="p-5 bg-slate-50">
                          {email.preview_text && (
                            <p className="text-sm text-slate-500 mb-4">
                              Preview: {email.preview_text}
                            </p>
                          )}
                          <div className="bg-white rounded-xl p-5 border border-slate-200">
                            <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap">
                              {email.body_content}
                            </div>
                            {email.cta_text && (
                              <div className="mt-4">
                                <span className="inline-block px-5 py-2.5 bg-slate-900 text-white rounded-lg font-medium text-sm">
                                  {email.cta_text}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Approval Feedback */}
                        {approval?.feedback && (
                          <div className="px-5 py-3 bg-blue-50 border-t border-blue-100">
                            <p className="text-sm text-blue-800">
                              <span className="font-medium">Your feedback:</span> {approval.feedback}
                            </p>
                          </div>
                        )}

                        {/* Approval Actions */}
                        {canApprove && (
                          <div className="p-5 border-t border-slate-100 flex items-center gap-3">
                            <Button
                              onClick={() => handleApprovalClick(email, 'approved')}
                              className="bg-emerald-500 hover:bg-emerald-600"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleApprovalClick(email, 'revision_requested')}
                            >
                              <MessageSquare className="w-4 h-4" />
                              Request Changes
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleApprovalClick(email, 'rejected')}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              <XCircle className="w-4 h-4" />
                              Reject
                            </Button>
                          </div>
                        )}

                        {!canApprove && (
                          <div className="p-4 border-t border-slate-100 bg-slate-50">
                            <p className="text-sm text-slate-500 flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              View-only access. Contact your agency to request changes.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 mt-12 py-6">
        <p className="text-center text-sm text-slate-400">
          Powered by Swayleo
        </p>
      </footer>

      {/* Approval Modal */}
      <Modal
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        title={
          approvalAction === 'approved' 
            ? 'Approve Email' 
            : approvalAction === 'rejected'
            ? 'Reject Email'
            : 'Request Changes'
        }
        size="md"
      >
        <div className="space-y-4">
          <p className="text-slate-600">
            {approvalAction === 'approved' && 'Are you sure you want to approve this email?'}
            {approvalAction === 'rejected' && 'Please provide feedback on why this email is being rejected.'}
            {approvalAction === 'revision_requested' && 'Please describe the changes you\'d like to see.'}
          </p>

          <Textarea
            label={approvalAction === 'approved' ? 'Feedback (Optional)' : 'Feedback'}
            placeholder="Enter your feedback..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={4}
            required={approvalAction !== 'approved'}
          />

          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setShowApprovalModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitApproval}
              loading={submitApproval.isPending}
              className={`flex-1 ${
                approvalAction === 'approved' 
                  ? 'bg-emerald-500 hover:bg-emerald-600' 
                  : approvalAction === 'rejected'
                  ? 'bg-red-500 hover:bg-red-600'
                  : ''
              }`}
              disabled={approvalAction !== 'approved' && !feedback.trim()}
            >
              {approvalAction === 'approved' && 'Approve'}
              {approvalAction === 'rejected' && 'Reject'}
              {approvalAction === 'revision_requested' && 'Request Changes'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
