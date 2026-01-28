import { useState } from 'react';
import { FileText, Plus, Star, ChevronRight } from 'lucide-react';
import { useTemplatesByType, useIncrementTemplateUse } from '../../hooks';
import type { CustomTemplate } from '../../types/template';
import type { EmailType } from '../../types/email';

interface TemplateSelectorProps {
  orgId: string;
  emailType: EmailType;
  onSelect: (template: CustomTemplate | null) => void;
  selectedTemplateId: string | null;
}

export function TemplateSelector({ 
  orgId, 
  emailType, 
  onSelect,
  selectedTemplateId 
}: TemplateSelectorProps) {
  const { data: templates = [], isLoading } = useTemplatesByType(orgId, emailType);
  const incrementUse = useIncrementTemplateUse();
  const [expanded, setExpanded] = useState(true);

  const handleSelect = (template: CustomTemplate | null) => {
    if (template) {
      incrementUse.mutate(template.id);
    }
    onSelect(template);
  };

  if (isLoading) {
    return (
      <div className="bg-slate-50 rounded-xl p-4 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-32 mb-3" />
        <div className="h-10 bg-slate-200 rounded" />
      </div>
    );
  }

  if (templates.length === 0) {
    return null; // Don't show if no templates for this type
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-100 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-700">
            Use a Template
          </span>
          <span className="text-xs text-slate-400">
            ({templates.length} available)
          </span>
        </div>
        <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-2">
          {/* No template option */}
          <button
            onClick={() => handleSelect(null)}
            className={`w-full text-left p-3 rounded-lg border transition-all ${
              selectedTemplateId === null
                ? 'border-sway-500 bg-sway-50'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                selectedTemplateId === null ? 'bg-sway-100' : 'bg-slate-100'
              }`}>
                <Plus className={`w-4 h-4 ${selectedTemplateId === null ? 'text-sway-600' : 'text-slate-500'}`} />
              </div>
              <div>
                <p className={`text-sm font-medium ${selectedTemplateId === null ? 'text-sway-700' : 'text-slate-700'}`}>
                  Start Fresh
                </p>
                <p className="text-xs text-slate-500">Configure from scratch</p>
              </div>
            </div>
          </button>

          {/* Template options */}
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => handleSelect(template)}
              className={`w-full text-left p-3 rounded-lg border transition-all ${
                selectedTemplateId === template.id
                  ? 'border-sway-500 bg-sway-50'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    selectedTemplateId === template.id ? 'bg-sway-100' : 'bg-slate-100'
                  }`}>
                    <FileText className={`w-4 h-4 ${selectedTemplateId === template.id ? 'text-sway-600' : 'text-slate-500'}`} />
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${selectedTemplateId === template.id ? 'text-sway-700' : 'text-slate-700'}`}>
                      {template.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="capitalize">{template.tone === 'default' ? 'Brand default' : template.tone.replace('more_', '')}</span>
                      <span>•</span>
                      <span className="capitalize">{template.max_length}</span>
                    </div>
                  </div>
                </div>
                {template.use_count > 0 && (
                  <div className="flex items-center gap-1 text-xs text-amber-600">
                    <Star className="w-3 h-3" />
                    {template.use_count}
                  </div>
                )}
              </div>
              {template.description && (
                <p className="text-xs text-slate-500 mt-2 ml-11 line-clamp-1">
                  {template.description}
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
