import { useState, useEffect } from 'react';
import { Sparkles, Sliders, Cpu } from 'lucide-react';
import { Button, Textarea, Toggle } from '../ui';
import type { EmailGenerationRequest, EmailType, LLMProvider } from '../../types/email';
import { LLM_CONFIGS } from '../../types/email';
import type { CustomTemplate } from '../../types/template';

interface GenerationFormProps {
  emailType: EmailType;
  onGenerate: (options: Omit<EmailGenerationRequest, 'brandId' | 'emailType'> & { provider?: LLMProvider }) => void;
  isGenerating: boolean;
  template?: CustomTemplate | null;
}

export function GenerationForm({ onGenerate, isGenerating, template }: GenerationFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [additionalContext, setAdditionalContext] = useState('');
  const [subjectLineCount, setSubjectLineCount] = useState(3);
  const [variationCount, setVariationCount] = useState(2);
  const [tone, setTone] = useState<'default' | 'more_casual' | 'more_formal' | 'more_urgent' | 'more_playful'>('default');
  const [includeEmoji, setIncludeEmoji] = useState(true);
  const [maxLength, setMaxLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [provider, setProvider] = useState<LLMProvider>('deepseek');

  // Apply template settings when selected
  useEffect(() => {
    if (template) {
      setSubjectLineCount(template.subject_line_count);
      setVariationCount(template.variation_count);
      setTone(template.tone);
      setIncludeEmoji(template.include_emoji);
      setMaxLength(template.max_length);
      if (template.custom_instructions) {
        setAdditionalContext(template.custom_instructions);
      }
      // Auto-expand advanced if template has non-default settings
      if (template.tone !== 'default' || template.max_length !== 'medium') {
        setShowAdvanced(true);
      }
    } else {
      // Reset to defaults when template cleared
      setSubjectLineCount(3);
      setVariationCount(2);
      setTone('default');
      setIncludeEmoji(true);
      setMaxLength('medium');
      setAdditionalContext('');
      setShowAdvanced(false);
    }
  }, [template]);

  const handleGenerate = () => {
    onGenerate({
      subjectLineCount,
      variationCount,
      additionalContext: additionalContext.trim() || undefined,
      tone,
      includeEmoji,
      maxLength,
      provider,
    });
  };

  return (
    <div className="space-y-6">
      {/* Template Applied Banner */}
      {template && (
        <div className="bg-sway-50 border border-sway-100 rounded-xl p-4 flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-sway-600" />
          <div className="flex-1">
            <p className="font-medium text-sway-800">Using template: {template.name}</p>
            <p className="text-sm text-sway-600">
              {template.tone === 'default' ? 'Brand default tone' : template.tone.replace('more_', '').replace('_', ' ')}
              {' • '}
              {template.max_length} length
              {template.custom_instructions && ' • Custom instructions applied'}
            </p>
          </div>
        </div>
      )}

      {/* Additional Context */}
      <Textarea
        label="Additional Context (Optional)"
        placeholder="Any specific details for this email? E.g., 'Focus on our new spring collection' or 'Mention the 20% off code SPRING20'"
        value={additionalContext}
        onChange={(e) => setAdditionalContext(e.target.value)}
        rows={3}
        hint="Provide specific products, offers, or angles you want emphasized"
      />

      {/* Quick Options */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Subject Lines
          </label>
          <div className="flex gap-2">
            {[3, 5, 7].map((count) => (
              <button
                key={count}
                onClick={() => setSubjectLineCount(count)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  subjectLineCount === count
                    ? 'bg-sway-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Body Variations
          </label>
          <div className="flex gap-2">
            {[1, 2, 3].map((count) => (
              <button
                key={count}
                onClick={() => setVariationCount(count)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  variationCount === count
                    ? 'bg-sway-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {count}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Advanced Toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <Sliders className="w-4 h-4" />
        {showAdvanced ? 'Hide' : 'Show'} Advanced Options
      </button>

      {/* Advanced Options */}
      {showAdvanced && (
        <div className="space-y-5 p-4 bg-slate-50 rounded-xl">
          {/* Tone */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Tone Adjustment
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'default', label: 'Brand Default' },
                { value: 'more_casual', label: 'More Casual' },
                { value: 'more_formal', label: 'More Formal' },
                { value: 'more_urgent', label: 'More Urgent' },
                { value: 'more_playful', label: 'More Playful' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTone(option.value as typeof tone)}
                  className={`py-1.5 px-3 rounded-full text-sm transition-all ${
                    tone === option.value
                      ? 'bg-sway-500 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Length */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email Length
            </label>
            <div className="flex gap-2">
              {[
                { value: 'short', label: 'Short', desc: '2-3 paragraphs' },
                { value: 'medium', label: 'Medium', desc: '3-4 paragraphs' },
                { value: 'long', label: 'Long', desc: '4-6 paragraphs' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setMaxLength(option.value as typeof maxLength)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm transition-all ${
                    maxLength === option.value
                      ? 'bg-sway-500 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="font-medium">{option.label}</div>
                  <div className={`text-xs ${maxLength === option.value ? 'text-sway-100' : 'text-slate-400'}`}>
                    {option.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Emoji Toggle */}
          <Toggle
            label="Include Emoji in Subject Lines"
            description="Add relevant emoji to make subject lines pop"
            checked={includeEmoji}
            onChange={setIncludeEmoji}
          />

          {/* AI Model Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <span className="flex items-center gap-2">
                <Cpu className="w-4 h-4" />
                AI Model
              </span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(LLM_CONFIGS) as LLMProvider[]).map((key) => {
                const config = LLM_CONFIGS[key];
                return (
                  <button
                    key={key}
                    onClick={() => setProvider(key)}
                    className={`py-2 px-3 rounded-lg text-sm transition-all ${
                      provider === key
                        ? 'bg-sway-500 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-medium">{config.displayName}</div>
                    <div className={`text-xs ${provider === key ? 'text-sway-100' : 'text-slate-400'}`}>
                      {key === 'deepseek' ? 'Cheapest' : key === 'anthropic' ? 'Best quality' : 'Fast'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Generate Button */}
      <Button
        onClick={handleGenerate}
        loading={isGenerating}
        size="lg"
        className="w-full"
      >
        <Sparkles className="w-5 h-5" />
        {isGenerating ? 'Generating...' : 'Generate Email'}
      </Button>

      {isGenerating && (
        <p className="text-center text-sm text-slate-500">
          This usually takes 10-20 seconds...
        </p>
      )}
    </div>
  );
}
