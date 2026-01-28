import { TextareaHTMLAttributes, forwardRef } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', label, hint, error, ...props }, ref) => {
    return (
      <div className={className}>
        {label && (
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`w-full px-4 py-3 rounded-xl border ${
            error ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'
          } text-slate-800 placeholder-slate-400 transition-all duration-200 focus:outline-none focus:border-sway-500 focus:ring-2 focus:ring-sway-500/20 resize-none`}
          {...props}
        />
        {hint && !error && <p className="mt-2 text-xs text-slate-400">{hint}</p>}
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
