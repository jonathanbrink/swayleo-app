import { Package, HelpCircle, Swords, Users, BarChart3, FileText, ExternalLink, Trash2, Eye, EyeOff } from 'lucide-react';
import type { KnowledgeEntry, KnowledgeCategory } from '../../types/knowledge';

interface KnowledgeListProps {
  entries: KnowledgeEntry[];
  onEdit: (entry: KnowledgeEntry) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, isActive: boolean) => void;
  isDeleting?: boolean;
}

const categoryIcons: Record<KnowledgeCategory, React.ReactNode> = {
  product: <Package className="w-4 h-4" />,
  faq: <HelpCircle className="w-4 h-4" />,
  competitor: <Swords className="w-4 h-4" />,
  persona: <Users className="w-4 h-4" />,
  campaign_result: <BarChart3 className="w-4 h-4" />,
  general: <FileText className="w-4 h-4" />,
};

const categoryColors: Record<KnowledgeCategory, string> = {
  product: 'bg-blue-50 text-blue-700',
  faq: 'bg-amber-50 text-amber-700',
  competitor: 'bg-red-50 text-red-700',
  persona: 'bg-emerald-50 text-emerald-700',
  campaign_result: 'bg-purple-50 text-purple-700',
  general: 'bg-slate-50 text-slate-700',
};

export function KnowledgeList({ entries, onEdit, onDelete, onToggle }: KnowledgeListProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 font-medium">No knowledge entries yet</p>
        <p className="text-slate-400 text-sm mt-1">
          Add product info, FAQs, competitor intel, and more to improve AI-generated content.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map(entry => (
        <div
          key={entry.id}
          className={`bg-white rounded-xl border border-slate-100 p-4 hover:border-slate-200 transition-colors cursor-pointer ${
            !entry.is_active ? 'opacity-50' : ''
          }`}
          onClick={() => onEdit(entry)}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${categoryColors[entry.category]}`}>
                  {categoryIcons[entry.category]}
                  {entry.category.replace('_', ' ')}
                </span>
                {entry.source_type === 'web_research' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-sway-50 text-sway-700">
                    AI Research
                  </span>
                )}
              </div>
              <h4 className="font-medium text-slate-800 truncate">{entry.title}</h4>
              <p className="text-sm text-slate-500 mt-1 line-clamp-2">{entry.content}</p>
              {entry.source_url && (
                <a
                  href={entry.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-sway-600 hover:text-sway-700 mt-2"
                  onClick={e => e.stopPropagation()}
                >
                  <ExternalLink className="w-3 h-3" />
                  Source
                </a>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle(entry.id, !entry.is_active);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                title={entry.is_active ? 'Disable' : 'Enable'}
              >
                {entry.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('Delete this knowledge entry?')) {
                    onDelete(entry.id);
                  }
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
