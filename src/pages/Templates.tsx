import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, FileText, Users, Star, Copy, Trash2, 
  Edit2, MoreVertical, Share2, Lock, Sparkles
} from 'lucide-react';
import { Button, Input, Modal, Textarea, Select, Toggle, useToast } from '../components/ui';
import { 
  useCurrentOrganization,
  useTemplates,
  useCreateTemplate,
  useDeleteTemplate,
  useDuplicateTemplate,
  useUpdateTemplate,
  useAuth
} from '../hooks';
import { EMAIL_TEMPLATES, TEMPLATE_CATEGORIES } from '../types';
import type { CustomTemplate, TemplateCategory, CreateTemplateInput } from '../types/template';
import type { EmailType } from '../types/email';

export function Templates() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  const { data: org } = useCurrentOrganization();
  
  const [category, setCategory] = useState<TemplateCategory>('my_templates');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<CustomTemplate | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const { data: templates = [], isLoading } = useTemplates(org?.id || '', category);
  const createTemplate = useCreateTemplate();
  const deleteTemplate = useDeleteTemplate();
  const duplicateTemplate = useDuplicateTemplate();
  const updateTemplate = useUpdateTemplate();

  // Filter templates by search
  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = async (input: CreateTemplateInput) => {
    if (!org) return;
    try {
      await createTemplate.mutateAsync({ orgId: org.id, input });
      showToast('Template created');
      setShowCreateModal(false);
    } catch {
      showToast('Failed to create template', 'error');
    }
  };

  const handleEdit = async (input: CreateTemplateInput) => {
    if (!org || !selectedTemplate) return;
    try {
      await updateTemplate.mutateAsync({ 
        id: selectedTemplate.id, 
        input, 
        orgId: org.id 
      });
      showToast('Template updated');
      setShowEditModal(false);
      setSelectedTemplate(null);
    } catch {
      showToast('Failed to update template', 'error');
    }
  };

  const handleDelete = async (template: CustomTemplate) => {
    if (!org) return;
    if (!window.confirm(`Delete "${template.name}"? This cannot be undone.`)) return;
    
    try {
      await deleteTemplate.mutateAsync({ id: template.id, orgId: org.id });
      showToast('Template deleted');
    } catch {
      showToast('Failed to delete template', 'error');
    }
  };

  const handleDuplicate = async (template: CustomTemplate) => {
    if (!org) return;
    try {
      await duplicateTemplate.mutateAsync({ 
        id: template.id, 
        newName: `${template.name} (Copy)`,
        orgId: org.id 
      });
      showToast('Template duplicated');
    } catch {
      showToast('Failed to duplicate template', 'error');
    }
  };

  const handleToggleShare = async (template: CustomTemplate) => {
    if (!org) return;
    try {
      await updateTemplate.mutateAsync({
        id: template.id,
        input: { is_shared: !template.is_shared },
        orgId: org.id,
      });
      showToast(template.is_shared ? 'Template is now private' : 'Template shared with team');
    } catch {
      showToast('Failed to update template', 'error');
    }
  };

  const openEditModal = (template: CustomTemplate) => {
    setSelectedTemplate(template);
    setShowEditModal(true);
    setMenuOpen(null);
  };

  const getEmailTypeLabel = (type: string) => {
    const template = EMAIL_TEMPLATES.find(t => t.id === type);
    return template?.name || type;
  };

  const getEmailTypeIcon = (type: string) => {
    const template = EMAIL_TEMPLATES.find(t => t.id === type);
    return template?.icon || '📧';
  };

  if (!org) return null;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-semibold text-2xl text-slate-800">Template Library</h1>
            <p className="text-slate-500 mt-1">Save and reuse your best email configurations</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4" />
            New Template
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="p-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-56 flex-shrink-0">
            <nav className="space-y-1">
              {TEMPLATE_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
                    category === cat.id
                      ? 'bg-sway-50 text-sway-600 font-medium'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>{cat.icon}</span>
                  {cat.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Search */}
            <div className="mb-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sway-500/20 focus:border-sway-500"
                />
              </div>
            </div>

            {/* Templates Grid */}
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-sway-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="font-semibold text-slate-800 mb-2">
                  {searchQuery ? 'No templates found' : 'No templates yet'}
                </h3>
                <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                  {searchQuery 
                    ? 'Try adjusting your search terms.'
                    : 'Create your first template to save time on future email generation.'}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="w-4 h-4" />
                    Create Template
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    isOwner={template.created_by === user?.id}
                    menuOpen={menuOpen === template.id}
                    onMenuToggle={() => setMenuOpen(menuOpen === template.id ? null : template.id)}
                    onEdit={() => openEditModal(template)}
                    onDuplicate={() => handleDuplicate(template)}
                    onDelete={() => handleDelete(template)}
                    onToggleShare={() => handleToggleShare(template)}
                    onUse={() => navigate(`/brands?template=${template.id}`)}
                    getEmailTypeLabel={getEmailTypeLabel}
                    getEmailTypeIcon={getEmailTypeIcon}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create Modal */}
      <TemplateFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreate}
        isLoading={createTemplate.isPending}
        title="Create Template"
      />

      {/* Edit Modal */}
      {selectedTemplate && (
        <TemplateFormModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedTemplate(null);
          }}
          onSubmit={handleEdit}
          isLoading={updateTemplate.isPending}
          title="Edit Template"
          initialValues={selectedTemplate}
        />
      )}
    </div>
  );
}

// ============================================
// Template Card Component
// ============================================

interface TemplateCardProps {
  template: CustomTemplate;
  isOwner: boolean;
  menuOpen: boolean;
  onMenuToggle: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleShare: () => void;
  onUse: () => void;
  getEmailTypeLabel: (type: string) => string;
  getEmailTypeIcon: (type: string) => string;
}

function TemplateCard({
  template,
  isOwner,
  menuOpen,
  onMenuToggle,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleShare,
  onUse,
  getEmailTypeLabel,
  getEmailTypeIcon,
}: TemplateCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{getEmailTypeIcon(template.email_type)}</span>
          <span className="text-xs text-slate-500">{getEmailTypeLabel(template.email_type)}</span>
        </div>
        <div className="flex items-center gap-1">
          {template.is_shared ? (
            <span title="Shared with team">
              <Users className="w-4 h-4 text-blue-500" />
            </span>
          ) : (
            <span title="Private">
              <Lock className="w-4 h-4 text-slate-300" />
            </span>
          )}
          <div className="relative">
            <button
              onClick={onMenuToggle}
              className="p-1 rounded hover:bg-slate-100 text-slate-400"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={onMenuToggle} />
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-100 py-1 z-20">
                  <button
                    onClick={onEdit}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Edit2 className="w-4 h-4" /> Edit
                  </button>
                  <button
                    onClick={onDuplicate}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Copy className="w-4 h-4" /> Duplicate
                  </button>
                  {isOwner && (
                    <button
                      onClick={onToggleShare}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <Share2 className="w-4 h-4" /> 
                      {template.is_shared ? 'Make Private' : 'Share with Team'}
                    </button>
                  )}
                  {isOwner && (
                    <button
                      onClick={onDelete}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <h3 className="font-semibold text-slate-800 mb-1">{template.name}</h3>
      {template.description && (
        <p className="text-sm text-slate-500 line-clamp-2 mb-3">{template.description}</p>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        <span className="px-2 py-0.5 bg-slate-100 rounded text-xs text-slate-600 capitalize">
          {template.tone === 'default' ? 'Brand default' : template.tone.replace('more_', '')}
        </span>
        <span className="px-2 py-0.5 bg-slate-100 rounded text-xs text-slate-600 capitalize">
          {template.max_length}
        </span>
        {template.use_count > 0 && (
          <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded text-xs flex items-center gap-1">
            <Star className="w-3 h-3" /> {template.use_count} uses
          </span>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <span className="text-xs text-slate-400">
          by {template.creator?.full_name || 'Unknown'}
        </span>
        <Button size="sm" onClick={onUse}>
          <Sparkles className="w-3 h-3" /> Use
        </Button>
      </div>
    </div>
  );
}

// ============================================
// Template Form Modal
// ============================================

interface TemplateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateTemplateInput) => void;
  isLoading: boolean;
  title: string;
  initialValues?: CustomTemplate;
}

function TemplateFormModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  title,
  initialValues,
}: TemplateFormModalProps) {
  const [name, setName] = useState(initialValues?.name || '');
  const [description, setDescription] = useState(initialValues?.description || '');
  const [emailType, setEmailType] = useState<EmailType>(initialValues?.email_type as EmailType || 'welcome');
  const [tone, setTone] = useState(initialValues?.tone || 'default');
  const [maxLength, setMaxLength] = useState(initialValues?.max_length || 'medium');
  const [includeEmoji, setIncludeEmoji] = useState(initialValues?.include_emoji ?? true);
  const [subjectLineCount, setSubjectLineCount] = useState(initialValues?.subject_line_count || 3);
  const [variationCount, setVariationCount] = useState(initialValues?.variation_count || 2);
  const [customInstructions, setCustomInstructions] = useState(initialValues?.custom_instructions || '');
  const [exampleCta, setExampleCta] = useState(initialValues?.example_cta || '');
  const [isShared, setIsShared] = useState(initialValues?.is_shared ?? false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      description: description || undefined,
      email_type: emailType,
      tone: tone as CreateTemplateInput['tone'],
      max_length: maxLength as CreateTemplateInput['max_length'],
      include_emoji: includeEmoji,
      subject_line_count: subjectLineCount,
      variation_count: variationCount,
      custom_instructions: customInstructions || undefined,
      example_cta: exampleCta || undefined,
      is_shared: isShared,
    });
  };

  // Reset form when modal opens/closes
  const resetForm = () => {
    setName(initialValues?.name || '');
    setDescription(initialValues?.description || '');
    setEmailType(initialValues?.email_type as EmailType || 'welcome');
    setTone(initialValues?.tone || 'default');
    setMaxLength(initialValues?.max_length || 'medium');
    setIncludeEmoji(initialValues?.include_emoji ?? true);
    setSubjectLineCount(initialValues?.subject_line_count || 3);
    setVariationCount(initialValues?.variation_count || 2);
    setCustomInstructions(initialValues?.custom_instructions || '');
    setExampleCta(initialValues?.example_cta || '');
    setIsShared(initialValues?.is_shared ?? false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        resetForm();
        onClose();
      }}
      title={title}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Template Name"
            placeholder="e.g., High-Energy Welcome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Select
            label="Email Type"
            value={emailType}
            onChange={(e) => setEmailType(e.target.value as EmailType)}
            options={EMAIL_TEMPLATES.map(t => ({ value: t.id, label: `${t.icon} ${t.name}` }))}
          />
        </div>

        <Textarea
          label="Description (Optional)"
          placeholder="What makes this template special?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Tone"
            value={tone}
            onChange={(e) => setTone(e.target.value as typeof tone)}
            options={[
              { value: 'default', label: 'Brand Default' },
              { value: 'more_casual', label: 'More Casual' },
              { value: 'more_formal', label: 'More Formal' },
              { value: 'more_urgent', label: 'More Urgent' },
              { value: 'more_playful', label: 'More Playful' },
            ]}
          />
          <Select
            label="Length"
            value={maxLength}
            onChange={(e) => setMaxLength(e.target.value as typeof maxLength)}
            options={[
              { value: 'short', label: 'Short (2-3 paragraphs)' },
              { value: 'medium', label: 'Medium (3-4 paragraphs)' },
              { value: 'long', label: 'Long (4-6 paragraphs)' },
            ]}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Subject Lines</label>
            <div className="flex gap-2">
              {[3, 5, 7].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setSubjectLineCount(n)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    subjectLineCount === n
                      ? 'bg-sway-500 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Variations</label>
            <div className="flex gap-2">
              {[1, 2, 3].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setVariationCount(n)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    variationCount === n
                      ? 'bg-sway-500 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Textarea
          label="Custom Instructions (Optional)"
          placeholder="Add specific instructions for the AI, e.g., 'Always mention free shipping' or 'Use a question in the opening line'"
          value={customInstructions}
          onChange={(e) => setCustomInstructions(e.target.value)}
          rows={3}
        />

        <div>
          <Input
            label="Example CTA (Optional)"
            placeholder="e.g., Shop the Collection"
            value={exampleCta}
            onChange={(e) => setExampleCta(e.target.value)}
          />
          <p className="text-xs text-slate-500 mt-1">Provide a sample CTA style for the AI to follow</p>
        </div>

        <div className="flex items-center justify-between py-2">
          <Toggle
            label="Include Emoji in Subject Lines"
            checked={includeEmoji}
            onChange={setIncludeEmoji}
          />
          <Toggle
            label="Share with Team"
            checked={isShared}
            onChange={setIsShared}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" loading={isLoading} className="flex-1">
            {initialValues ? 'Save Changes' : 'Create Template'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
