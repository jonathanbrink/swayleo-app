import { useState } from 'react';
import { Copy, Check, Download, Save, RefreshCw, ChevronDown, ChevronUp, FileDown } from 'lucide-react';
import { Button, Modal, useToast } from '../ui';
import { copyToClipboard, exportEmailAsText, exportEmailAsHTML } from '../../lib/email';
import { ESP_FORMATS, exportEmail, downloadExport, type ESPFormat } from '../../lib/espExport';
import type { GeneratedEmail, GeneratedSubjectLine, GeneratedEmailVariation } from '../../types/email';

interface GeneratedEmailPreviewProps {
  email: GeneratedEmail;
  onSave: (subjectLine: GeneratedSubjectLine, variation: GeneratedEmailVariation) => void;
  onRegenerate: () => void;
  isRegenerating: boolean;
  brandName?: string;
}

export function GeneratedEmailPreview({ 
  email, 
  onSave, 
  onRegenerate, 
  isRegenerating,
  brandName = 'Brand'
}: GeneratedEmailPreviewProps) {
  const { showToast } = useToast();
  const [selectedSubject, setSelectedSubject] = useState(0);
  const [selectedVariation, setSelectedVariation] = useState(0);
  const [copiedSubject, setCopiedSubject] = useState<number | null>(null);
  const [showAllSubjects, setShowAllSubjects] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ESPFormat>('html');

  const currentSubject = email.subjectLines[selectedSubject];
  const currentVariation = email.variations[selectedVariation];

  const handleCopySubject = async (index: number) => {
    const subject = email.subjectLines[index];
    await copyToClipboard(subject.text);
    setCopiedSubject(index);
    showToast('Subject line copied');
    setTimeout(() => setCopiedSubject(null), 2000);
  };

  const handleCopyBody = async () => {
    await copyToClipboard(currentVariation.body);
    showToast('Email body copied');
  };

  const handleCopyAll = async () => {
    const text = exportEmailAsText({
      subjectLine: currentSubject.text,
      previewText: currentSubject.previewText,
      body: currentVariation.body,
      cta: currentVariation.cta,
    });
    await copyToClipboard(text);
    showToast('Full email copied');
  };

  const handleExportHTML = () => {
    const html = exportEmailAsHTML({
      subjectLine: currentSubject.text,
      previewText: currentSubject.previewText,
      headline: currentVariation.headline || undefined,
      body: currentVariation.body,
      cta: currentVariation.cta,
    });
    
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${email.emailType}-email.html`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('HTML exported');
  };

  const handleESPExport = () => {
    // Convert body to simple HTML
    const bodyHtml = currentVariation.body
      .split('\n\n')
      .map(p => `<p>${p}</p>`)
      .join('\n');

    const content = {
      subjectLine: currentSubject.text,
      previewText: currentSubject.previewText,
      bodyHtml: currentVariation.headline 
        ? `<h1>${currentVariation.headline}</h1>\n${bodyHtml}`
        : bodyHtml,
      ctaText: currentVariation.cta,
    };

    const options = {
      brandName,
      emailType: email.emailType,
    };

    const exported = exportEmail(selectedFormat, content, options);
    const filename = `${email.emailType}-${selectedFormat}.html`;
    downloadExport(exported, filename);
    
    setShowExportModal(false);
    showToast(`Exported for ${ESP_FORMATS.find(f => f.id === selectedFormat)?.name}`);
  };

  const handleSave = () => {
    onSave(currentSubject, currentVariation);
  };

  const visibleSubjects = showAllSubjects 
    ? email.subjectLines 
    : email.subjectLines.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">
            Generated with {email.model}
          </span>
          {email.promptTokens && (
            <span className="text-xs text-slate-400">
              • {email.promptTokens + (email.completionTokens || 0)} tokens
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onRegenerate} loading={isRegenerating}>
            <RefreshCw className="w-4 h-4" />
            Regenerate
          </Button>
        </div>
      </div>

      {/* Subject Lines */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
          <h3 className="font-medium text-slate-700">Subject Lines</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {visibleSubjects.map((subject, index) => (
            <div
              key={index}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                selectedSubject === index ? 'bg-sway-50' : 'hover:bg-slate-50'
              }`}
              onClick={() => setSelectedSubject(index)}
            >
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  selectedSubject === index
                    ? 'border-sway-500 bg-sway-500'
                    : 'border-slate-300'
                }`}
              >
                {selectedSubject === index && (
                  <Check className="w-3 h-3 text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 truncate">{subject.text}</p>
                {subject.previewText && (
                  <p className="text-sm text-slate-500 truncate">{subject.previewText}</p>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopySubject(index);
                }}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {copiedSubject === index ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          ))}
        </div>
        {email.subjectLines.length > 3 && (
          <button
            onClick={() => setShowAllSubjects(!showAllSubjects)}
            className="w-full px-4 py-2 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1"
          >
            {showAllSubjects ? (
              <>
                <ChevronUp className="w-4 h-4" /> Show less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" /> Show {email.subjectLines.length - 3} more
              </>
            )}
          </button>
        )}
      </div>

      {/* Variation Tabs */}
      {email.variations.length > 1 && (
        <div className="flex gap-2">
          {email.variations.map((_, index) => (
            <button
              key={index}
              onClick={() => setSelectedVariation(index)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedVariation === index
                  ? 'bg-sway-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Variation {index + 1}
            </button>
          ))}
        </div>
      )}

      {/* Email Body Preview */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h3 className="font-medium text-slate-700">Email Body</h3>
          <button
            onClick={handleCopyBody}
            className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
          >
            <Copy className="w-3 h-3" /> Copy
          </button>
        </div>
        <div className="p-6">
          {currentVariation.headline && (
            <h2 className="text-xl font-semibold text-slate-800 mb-4">
              {currentVariation.headline}
            </h2>
          )}
          <div className="text-slate-600 leading-relaxed whitespace-pre-wrap">
            {currentVariation.body}
          </div>
          <div className="mt-6">
            <span className="inline-block px-6 py-3 bg-slate-900 text-white rounded-lg font-medium">
              {currentVariation.cta}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={handleCopyAll} className="flex-1">
          <Copy className="w-4 h-4" />
          Copy All
        </Button>
        <Button variant="outline" onClick={handleExportHTML} className="flex-1">
          <Download className="w-4 h-4" />
          Export HTML
        </Button>
        <Button variant="outline" onClick={() => setShowExportModal(true)} className="flex-1">
          <FileDown className="w-4 h-4" />
          Export for ESP
        </Button>
        <Button onClick={handleSave} className="flex-1">
          <Save className="w-4 h-4" />
          Save to Brand
        </Button>
      </div>

      {/* ESP Export Modal */}
      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Export for Email Service Provider"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Choose your email service provider for optimized export with proper variables and formatting.
          </p>
          
          <div className="space-y-2">
            {ESP_FORMATS.map((format) => (
              <button
                key={format.id}
                onClick={() => setSelectedFormat(format.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedFormat === format.id
                    ? 'border-sway-500 bg-sway-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{format.icon}</span>
                  <div>
                    <p className="font-medium text-slate-800">{format.name}</p>
                    <p className="text-sm text-slate-500">{format.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setShowExportModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button onClick={handleESPExport} className="flex-1">
              <FileDown className="w-4 h-4" />
              Download
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
