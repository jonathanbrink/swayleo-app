import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, required, disabled, ...props }, ref) => {
    return (
      <div className={className}>
        {label && (
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {label}
            {required && <span className="text-sway-500 ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          disabled={disabled}
          className={`w-full px-4 py-3 rounded-xl border ${
            error 
              ? 'border-red-300 bg-red-50' 
              : disabled
                ? 'border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed'
                : 'border-slate-200 bg-white'
          } text-slate-800 placeholder-slate-400 transition-all duration-200 focus:outline-none focus:border-sway-500 focus:ring-2 focus:ring-sway-500/20`}
          {...props}
        />
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
