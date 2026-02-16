import { useState, useEffect } from 'react';
import { Button, Input, Textarea, Select } from '../ui';
import { Modal } from '../ui/Modal';
import type { KnowledgeEntry, KnowledgeCategory, CreateKnowledgeEntryInput } from '../../types/knowledge';
import { KNOWLEDGE_CATEGORIES } from '../../types/knowledge';

const MAX_TITLE_LENGTH = 200;
const MAX_CONTENT_LENGTH = 50000;

interface KnowledgeEntryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateKnowledgeEntryInput) => Promise<void>;
  brandId: string;
  existingEntry?: KnowledgeEntry;
  isLoading?: boolean;
}

export function KnowledgeEntryForm({
  isOpen,
  onClose,
  onSubmit,
  brandId,
  existingEntry,
  isLoading,
}: KnowledgeEntryFormProps) {
  const [title, setTitle] = useState(existingEntry?.title || '');
  const [content, setContent] = useState(existingEntry?.content || '');
  const [category, setCategory] = useState<KnowledgeCategory>(existingEntry?.category || 'general');
  const [sourceUrl, setSourceUrl] = useState(existingEntry?.source_url || '');

  // Sync form state when editing a different entry
  useEffect(() => {
    if (existingEntry) {
      setTitle(existingEntry.title);
      setContent(existingEntry.content);
      setCategory(existingEntry.category);
      setSourceUrl(existingEntry.source_url || '');
    } else {
      setTitle('');
      setContent('');
      setCategory('general');
      setSourceUrl('');
    }
  }, [existingEntry?.id]);

  const isTitleOverLimit = title.trim().length > MAX_TITLE_LENGTH;
  const isContentOverLimit = content.trim().length > MAX_CONTENT_LENGTH;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || isTitleOverLimit || isContentOverLimit) return;

    await onSubmit({
      brand_id: brandId,
      category,
      title: title.trim(),
      content: content.trim(),
      source_url: sourceUrl.trim() || undefined,
      source_type: 'manual',
    });

    // Reset form
    setTitle('');
    setContent('');
    setCategory('general');
    setSourceUrl('');
    onClose();
  };

  const categoryOptions = KNOWLEDGE_CATEGORIES.map(cat => ({
    value: cat.id,
    label: cat.name,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={existingEntry ? 'Edit Knowledge Entry' : 'Add Knowledge Entry'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value as KnowledgeCategory)}
          options={categoryOptions}
        />

        <div>
          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Summer Collection 2026, Competitor Analysis - Brand X"
            required
            maxLength={MAX_TITLE_LENGTH + 50}
          />
          {title.trim().length > MAX_TITLE_LENGTH * 0.8 && (
            <p className={`text-xs mt-1 ${isTitleOverLimit ? 'text-red-500' : 'text-slate-400'}`}>
              {title.trim().length}/{MAX_TITLE_LENGTH} characters
            </p>
          )}
        </div>

        <div>
          <Textarea
            label="Content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter the knowledge content. Be as detailed as possible — this information will be used to ground AI-generated content."
            rows={8}
            required
          />
          {content.trim().length > MAX_CONTENT_LENGTH * 0.8 && (
            <p className={`text-xs mt-1 ${isContentOverLimit ? 'text-red-500' : 'text-slate-400'}`}>
              {content.trim().length.toLocaleString()}/{MAX_CONTENT_LENGTH.toLocaleString()} characters
            </p>
          )}
        </div>

        <Input
          label="Source URL (optional)"
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
          placeholder="https://..."
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button
            type="submit"
            loading={isLoading}
            disabled={!title.trim() || !content.trim() || isTitleOverLimit || isContentOverLimit}
          >
            {existingEntry ? 'Update Entry' : 'Add Entry'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
