import { useState, useEffect } from 'react';
import { Copy, Check, Download, Save, RefreshCw, FileDown, FileText } from 'lucide-react';
import { Button, Modal, useToast } from '../ui';
import { copyToClipboard, exportEmailAsHTML, exportEmailAsDocx } from '../../lib/email';
import { ESP_FORMATS, exportEmail, downloadExport, type ESPFormat } from '../../lib/espExport';
import type { GeneratedEmail, GeneratedSubjectLine, GeneratedEmailVariation } from '../../types/email';

// Section types for the email body
type SectionType = 'header' | 'subheader' | 'body' | 'cta';

interface EmailSection {
  id: string;
  type: SectionType;
  content: string;
}

interface EditableEmailData {
  subjectLine: string;
  previewText: string;
  sections: EmailSection[];
}

interface GeneratedEmailEditorProps {
  email: GeneratedEmail;
  onSave: (subjectLine: GeneratedSubjectLine, variation: GeneratedEmailVariation) => void;
  onRegenerate: () => void;
  isRegenerating: boolean;
  brandName?: string;
}

const SECTION_LABELS: Record<SectionType, string> = {
  header: 'Header',
  subheader: 'Subheader',
  body: 'Body Copy',
  cta: 'CTA',
};

const SECTION_PLACEHOLDERS: Record<SectionType, string> = {
  header: 'Enter headline text...',
  subheader: 'Enter subheader text...',
  body: 'Enter body copy...',
  cta: 'SHOP NOW',
};

// Parse the generated email body into sections - creates full structure matching mockup
function parseEmailToSections(variation: GeneratedEmailVariation): EmailSection[] {
  const sections: EmailSection[] = [];
  
  // Header - use headline
  sections.push({
    id: crypto.randomUUID(),
    type: 'header',
    content: variation.headline || '',
  });
  
  // First Subheader - use subheader1 from generation
  sections.push({
    id: crypto.randomUUID(),
    type: 'subheader',
    content: variation.subheader1 || '',
  });
  
  // First CTA - use cta1 or cta
  sections.push({
    id: crypto.randomUUID(),
    type: 'cta',
    content: variation.cta1 || variation.cta,
  });
  
  // Second Subheader - use subheader2 from generation
  sections.push({
    id: crypto.randomUUID(),
    type: 'subheader',
    content: variation.subheader2 || '',
  });
  
  // Body Copy
  const bodyContent = variation.body.trim();
  sections.push({
    id: crypto.randomUUID(),
    type: 'body',
    content: bodyContent,
  });
  
  // Second CTA - use cta2 or cta
  sections.push({
    id: crypto.randomUUID(),
    type: 'cta',
    content: variation.cta2 || variation.cta,
  });
  
  return sections;
}

// Convert sections back to variation format
function sectionsToVariation(sections: EmailSection[]): { headline?: string; body: string; cta: string } {
  const headerSection = sections.find(s => s.type === 'header' && s.content.trim());
  const ctaSections = sections.filter(s => s.type === 'cta' && s.content.trim());
  
  // Build body from all non-CTA sections that have content (except the first header which becomes headline)
  const bodyParts = sections
    .filter(s => s.type !== 'cta')
    .filter(s => !(s.type === 'header' && s === headerSection)) // Exclude header that becomes headline
    .filter(s => s.content.trim())
    .map(s => s.content.trim());
  
  // Use first CTA with content
  const primaryCta = ctaSections[0]?.content || 'Shop Now';
  
  return {
    headline: headerSection?.content,
    body: bodyParts.join('\n\n'),
    cta: primaryCta,
  };
}

export function GeneratedEmailEditor({ 
  email, 
  onSave, 
  onRegenerate, 
  isRegenerating,
  brandName = 'Brand'
}: GeneratedEmailEditorProps) {
  const { showToast } = useToast();
  const [selectedSubjectIndex, setSelectedSubjectIndex] = useState(0);
  const [selectedVariation, setSelectedVariation] = useState(0);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ESPFormat>('html');
  
  // Editable state
  const [editableData, setEditableData] = useState<EditableEmailData>(() => {
    const subject = email.subjectLines[0];
    const variation = email.variations[0];
    return {
      subjectLine: subject.text,
      previewText: subject.previewText || '',
      sections: parseEmailToSections(variation),
    };
  });

  // Update editable data when variation changes
  useEffect(() => {
    const subject = email.subjectLines[selectedSubjectIndex];
    const variation = email.variations[selectedVariation];
    setEditableData({
      subjectLine: subject.text,
      previewText: subject.previewText || '',
      sections: parseEmailToSections(variation),
    });
  }, [selectedSubjectIndex, selectedVariation, email]);

  const handleCopy = async (field: string, content: string) => {
    await copyToClipboard(content);
    setCopiedField(field);
    showToast('Copied to clipboard');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCopyAll = async () => {
    const allContent = [
      `Subject: ${editableData.subjectLine}`,
      `Preview: ${editableData.previewText}`,
      '',
      ...editableData.sections.map(s => s.content),
    ].join('\n\n');
    
    await copyToClipboard(allContent);
    showToast('Full email copied');
  };

  const handleSectionChange = (id: string, content: string) => {
    setEditableData(prev => ({
      ...prev,
      sections: prev.sections.map(s => 
        s.id === id ? { ...s, content } : s
      ),
    }));
  };

  const handleExportHTML = () => {
    const { headline, body, cta } = sectionsToVariation(editableData.sections);
    const html = exportEmailAsHTML({
      subjectLine: editableData.subjectLine,
      previewText: editableData.previewText,
      headline,
      body,
      cta,
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

  const handleExportDocx = async () => {
    // Get section content by type
    const getSection = (type: string, index = 0) => {
      const matches = editableData.sections.filter(s => s.type === type);
      return matches[index]?.content || '';
    };

    try {
      await exportEmailAsDocx({
        subjectLine: editableData.subjectLine,
        previewText: editableData.previewText,
        headline: getSection('header'),
        subheader1: getSection('subheader', 0),
        cta1: getSection('cta', 0),
        subheader2: getSection('subheader', 1),
        body: getSection('body'),
        cta2: getSection('cta', 1),
      }, brandName, email.emailType);
      showToast('Google Doc exported');
    } catch (error) {
      console.error('Export error:', error);
      showToast('Failed to export', 'error');
    }
  };

  const handleESPExport = () => {
    const { headline, body, cta } = sectionsToVariation(editableData.sections);
    
    // Convert body to HTML
    const bodyHtml = body
      .split('\n\n')
      .map(p => `<p>${p}</p>`)
      .join('\n');

    const content = {
      subjectLine: editableData.subjectLine,
      previewText: editableData.previewText,
      bodyHtml: headline ? `<h1>${headline}</h1>\n${bodyHtml}` : bodyHtml,
      ctaText: cta,
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
    const { headline, body, cta } = sectionsToVariation(editableData.sections);
    
    onSave(
      { text: editableData.subjectLine, previewText: editableData.previewText },
      { 
        id: email.variations[selectedVariation].id,
        headline,
        body,
        cta,
      }
    );
  };

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

      {/* Subject Lines - Checkbox Style */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <h3 className="font-medium text-slate-700">Subject Lines</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {email.subjectLines.map((subject, index) => (
            <div
              key={index}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                selectedSubjectIndex === index ? 'bg-sway-50' : 'hover:bg-slate-50'
              }`}
              onClick={() => {
                setSelectedSubjectIndex(index);
                setEditableData(prev => ({
                  ...prev,
                  subjectLine: subject.text,
                  previewText: subject.previewText || '',
                }));
              }}
            >
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  selectedSubjectIndex === index
                    ? 'border-sway-500 bg-sway-500'
                    : 'border-slate-300'
                }`}
              >
                {selectedSubjectIndex === index && (
                  <Check className="w-3 h-3 text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800">{subject.text}</p>
                {subject.previewText && (
                  <p className="text-sm text-slate-500 truncate">{subject.previewText}</p>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopy(`subject-${index}`, subject.text);
                }}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                title="Copy subject line"
              >
                {copiedField === `subject-${index}` ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Preview Text */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <div className="flex items-center">
          <div className="w-32 shrink-0 px-4 py-3 border-r border-slate-100">
            <span className="text-sm font-medium text-slate-700">Preview Text</span>
          </div>
          <div className="flex-1 px-4 py-2">
            <input
              type="text"
              value={editableData.previewText}
              onChange={(e) => setEditableData(prev => ({ ...prev, previewText: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-sway-500 focus:ring-2 focus:ring-sway-500/20 outline-none text-sm"
              placeholder="Enter preview text..."
            />
          </div>
          <div className="w-14 shrink-0 flex justify-center">
            <button
              onClick={() => handleCopy('preview', editableData.previewText)}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              title="Copy preview text"
            >
              {copiedField === 'preview' ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Form-based Editor */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        {/* Email Body Header */}
        <div className="px-4 py-3 border-b border-slate-100">
          <span className="text-sm font-semibold text-slate-700">Email Body</span>
        </div>

        {/* Sections */}
        <div className="divide-y divide-slate-100">
          {editableData.sections.map((section, _index) => (
            <div key={section.id} className="group">
              <div className="flex items-start">
                {/* Section Type Label */}
                <div className="w-32 shrink-0 px-4 py-3 border-r border-slate-100">
                  <span className="text-sm font-medium text-slate-700">
                    {SECTION_LABELS[section.type]}
                  </span>
                </div>
                
                {/* Content */}
                <div className="flex-1 px-4 py-2">
                  {section.type === 'body' ? (
                    <textarea
                      value={section.content}
                      onChange={(e) => {
                        handleSectionChange(section.id, e.target.value);
                        // Auto-resize
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                      }}
                      onFocus={(e) => {
                        // Auto-resize on focus
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                      }}
                      ref={(el) => {
                        // Auto-resize on mount
                        if (el) {
                          el.style.height = 'auto';
                          el.style.height = el.scrollHeight + 'px';
                        }
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-sway-500 focus:ring-2 focus:ring-sway-500/20 outline-none text-sm resize-none overflow-hidden min-h-[80px]"
                      placeholder={SECTION_PLACEHOLDERS[section.type]}
                    />
                  ) : (
                    <input
                      type="text"
                      value={section.content}
                      onChange={(e) => handleSectionChange(section.id, e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-sway-500 focus:ring-2 focus:ring-sway-500/20 outline-none text-sm ${
                        section.type === 'header' ? 'font-semibold' : ''
                      } ${section.type === 'cta' ? 'uppercase tracking-wide' : ''}`}
                      placeholder={SECTION_PLACEHOLDERS[section.type]}
                    />
                  )}
                </div>

                {/* Actions */}
                <div className="w-14 shrink-0 flex justify-center py-2">
                  <button
                    onClick={() => handleCopy(section.id, section.content)}
                    className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                    title="Copy"
                  >
                    {copiedField === section.id ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={handleCopyAll} className="flex-1">
          <Copy className="w-4 h-4" />
          Copy All
        </Button>
        <Button variant="outline" onClick={handleExportDocx} className="flex-1">
          <FileText className="w-4 h-4" />
          Google Doc
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
