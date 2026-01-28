import { EMAIL_TEMPLATES, EMAIL_CATEGORIES } from '../../types/email';
import type { EmailType, EmailTemplate } from '../../types/email';

interface EmailTypeSelectorProps {
  selected: EmailType | null;
  onSelect: (type: EmailType) => void;
}

export function EmailTypeSelector({ selected, onSelect }: EmailTypeSelectorProps) {
  return (
    <div className="space-y-8">
      {EMAIL_CATEGORIES.map((category) => {
        const templates = EMAIL_TEMPLATES.filter((t) => t.category === category.id);
        
        return (
          <div key={category.id}>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
              <span>{category.icon}</span>
              {category.name}
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {templates.map((template) => (
                <EmailTypeCard
                  key={template.id}
                  template={template}
                  selected={selected === template.id}
                  onSelect={() => onSelect(template.id)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface EmailTypeCardProps {
  template: EmailTemplate;
  selected: boolean;
  onSelect: () => void;
}

function EmailTypeCard({ template, selected, onSelect }: EmailTypeCardProps) {
  return (
    <button
      onClick={onSelect}
      className={`text-left p-4 rounded-xl border-2 transition-all duration-200 ${
        selected
          ? 'border-sway-500 bg-sway-50 shadow-lg shadow-sway-500/10'
          : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-md'
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{template.icon}</span>
        <div className="flex-1 min-w-0">
          <h4 className={`font-medium ${selected ? 'text-sway-700' : 'text-slate-800'}`}>
            {template.name}
          </h4>
          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
            {template.description}
          </p>
        </div>
      </div>
    </button>
  );
}
