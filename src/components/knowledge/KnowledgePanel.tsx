import { useState, useEffect } from 'react';
import { Plus, Search, Package, HelpCircle, Swords, Users, BarChart3, FileText } from 'lucide-react';
import { Button, Input } from '../ui';
import { useToast } from '../ui/Toast';
import { KnowledgeList } from './KnowledgeList';
import { KnowledgeEntryForm } from './KnowledgeEntryForm';
import {
  useKnowledgeEntries,
  useKnowledgeStats,
  useCreateKnowledgeEntry,
  useUpdateKnowledgeEntry,
  useDeleteKnowledgeEntry,
  useToggleKnowledgeEntry,
} from '../../hooks/useKnowledge';
import type { KnowledgeEntry, KnowledgeCategory, CreateKnowledgeEntryInput } from '../../types/knowledge';

interface KnowledgePanelProps {
  brandId: string;
}

const categoryFilterIcons: Record<string, React.ReactNode> = {
  all: <FileText className="w-4 h-4" />,
  product: <Package className="w-4 h-4" />,
  faq: <HelpCircle className="w-4 h-4" />,
  competitor: <Swords className="w-4 h-4" />,
  persona: <Users className="w-4 h-4" />,
  campaign_result: <BarChart3 className="w-4 h-4" />,
  general: <FileText className="w-4 h-4" />,
};

const categoryLabels: Record<string, string> = {
  all: 'All',
  product: 'Products',
  faq: 'FAQs',
  competitor: 'Competitors',
  persona: 'Personas',
  campaign_result: 'Results',
  general: 'General',
};

export function KnowledgePanel({ brandId }: KnowledgePanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<KnowledgeCategory | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<KnowledgeEntry | undefined>(undefined);
  const { showToast } = useToast();

  const { data: entries = [], isLoading } = useKnowledgeEntries(brandId, selectedCategory);
  const { data: stats } = useKnowledgeStats(brandId);
  const createEntry = useCreateKnowledgeEntry();
  const updateEntry = useUpdateKnowledgeEntry();
  const deleteEntry = useDeleteKnowledgeEntry();
  const toggleEntry = useToggleKnowledgeEntry();

  // Close edit form when switching categories or brands
  useEffect(() => {
    setEditingEntry(undefined);
  }, [selectedCategory, brandId]);

  // Filter entries by search query locally
  const filteredEntries = searchQuery
    ? entries.filter(e =>
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : entries;

  const totalEntries = stats
    ? Object.values(stats).reduce((a, b) => a + b, 0)
    : 0;

  const handleCreate = async (input: CreateKnowledgeEntryInput) => {
    try {
      await createEntry.mutateAsync(input);
      showToast('Knowledge entry added');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create entry';
      showToast(message, 'error');
    }
  };

  const handleUpdate = async (input: CreateKnowledgeEntryInput) => {
    if (!editingEntry) return;
    try {
      await updateEntry.mutateAsync({
        id: editingEntry.id,
        input: {
          category: input.category,
          title: input.title,
          content: input.content,
          source_url: input.source_url || null,
        },
        brandId,
      });
      showToast('Knowledge entry updated');
      setEditingEntry(undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update entry';
      showToast(message, 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEntry.mutateAsync({ id, brandId });
      showToast('Knowledge entry deleted');
    } catch (error) {
      showToast('Failed to delete entry', 'error');
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await toggleEntry.mutateAsync({ id, isActive, brandId });
      showToast(isActive ? 'Entry enabled' : 'Entry disabled');
    } catch (error) {
      showToast('Failed to update entry', 'error');
    }
  };

  const categories = ['all', 'product', 'faq', 'competitor', 'persona', 'campaign_result', 'general'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-semibold text-lg text-slate-800">Knowledge Base</h3>
          <p className="text-sm text-slate-500 mt-0.5">
            {totalEntries} {totalEntries === 1 ? 'entry' : 'entries'} — used to ground AI-generated content
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} size="sm">
          <Plus className="w-4 h-4 mr-1" />
          Add Entry
        </Button>
      </div>

      {/* Category filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map(cat => {
          const isSelected = cat === 'all' ? !selectedCategory : selectedCategory === cat;
          const count = cat === 'all' ? totalEntries : (stats?.[cat as KnowledgeCategory] || 0);
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat === 'all' ? undefined : cat as KnowledgeCategory)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                isSelected
                  ? 'bg-sway-100 text-sway-700'
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              }`}
            >
              {categoryFilterIcons[cat]}
              {categoryLabels[cat]}
              <span className={`text-xs ${isSelected ? 'text-sway-500' : 'text-slate-400'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search knowledge entries..."
          className="pl-10"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-sway-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <KnowledgeList
          entries={filteredEntries}
          onEdit={(entry) => setEditingEntry(entry)}
          onDelete={handleDelete}
          onToggle={handleToggle}
          isMutating={deleteEntry.isPending || toggleEntry.isPending}
        />
      )}

      {/* Add Entry Form */}
      <KnowledgeEntryForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreate}
        brandId={brandId}
        isLoading={createEntry.isPending}
      />

      {/* Edit Entry Form */}
      {editingEntry && (
        <KnowledgeEntryForm
          isOpen={!!editingEntry}
          onClose={() => setEditingEntry(undefined)}
          onSubmit={handleUpdate}
          brandId={brandId}
          existingEntry={editingEntry}
          isLoading={updateEntry.isPending}
        />
      )}
    </div>
  );
}
