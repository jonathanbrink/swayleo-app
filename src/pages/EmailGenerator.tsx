import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, AlertCircle } from 'lucide-react';
import { Button, Modal, Input, useToast } from '../components/ui';
import { EmailTypeSelector, GenerationForm, GeneratedEmailPreview, TemplateSelector } from '../components/email';
import { useBrand, useBrandKit, useEmailGeneration, useSaveEmail, useCurrentOrganization } from '../hooks';
import { EMAIL_TEMPLATES } from '../types/email';
import type { EmailType, EmailGenerationRequest, GeneratedSubjectLine, GeneratedEmailVariation } from '../types/email';
import type { CustomTemplate } from '../types/template';

type Step = 'select-type' | 'configure' | 'preview';

export function EmailGenerator() {
  const { id: brandId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const { data: org } = useCurrentOrganization();
  const { data: brand, isLoading: brandLoading } = useBrand(brandId!);
  const { data: kit, isLoading: kitLoading } = useBrandKit(brandId!);
  const { generate, isGenerating, generatedEmail, reset } = useEmailGeneration();
  const saveEmail = useSaveEmail();

  const [step, setStep] = useState<Step>('select-type');
  const [selectedType, setSelectedType] = useState<EmailType | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<CustomTemplate | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveData, setSaveData] = useState<{
    subjectLine: GeneratedSubjectLine;
    variation: GeneratedEmailVariation;
  } | null>(null);
  const [saveName, setSaveName] = useState('');

  const selectedEmailType = selectedType 
    ? EMAIL_TEMPLATES.find(t => t.id === selectedType) 
    : null;

  const handleSelectType = (type: EmailType) => {
    setSelectedType(type);
    setSelectedTemplate(null);
    setStep('configure');
    reset();
  };

  const handleTemplateSelect = (template: CustomTemplate | null) => {
    setSelectedTemplate(template);
  };

  const handleGenerate = useCallback(async (options: Omit<EmailGenerationRequest, 'brandId' | 'emailType'>) => {
    if (!brand || !kit || !selectedType) return;

    try {
      await generate(brand, kit, {
        brandId: brand.id,
        emailType: selectedType,
        ...options,
      });
      setStep('preview');
    } catch {
      showToast('Failed to generate email. Please try again.', 'error');
    }
  }, [brand, kit, selectedType, generate, showToast]);

  const handleRegenerate = useCallback(() => {
    setStep('configure');
    reset();
  }, [reset]);

  const handleSaveClick = (subjectLine: GeneratedSubjectLine, variation: GeneratedEmailVariation) => {
    setSaveData({ subjectLine, variation });
    setSaveName(`${selectedEmailType?.name || 'Email'} - ${new Date().toLocaleDateString()}`);
    setShowSaveModal(true);
  };

  const handleSaveConfirm = async () => {
    if (!saveData || !brandId || !selectedType) return;

    try {
      await saveEmail.mutateAsync({
        brand_id: brandId,
        email_type: selectedType,
        name: saveName,
        subject_line: saveData.subjectLine.text,
        preview_text: saveData.subjectLine.previewText || null,
        body_content: saveData.variation.body,
        cta_text: saveData.variation.cta,
        status: 'draft',
      });
      showToast('Email saved successfully');
      setShowSaveModal(false);
    } catch {
      showToast('Failed to save email', 'error');
    }
  };

  const handleBack = () => {
    if (step === 'configure') {
      setStep('select-type');
      setSelectedType(null);
      setSelectedTemplate(null);
    } else if (step === 'preview') {
      setStep('configure');
    }
  };

  if (brandLoading || kitLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-sway-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!brand || !kit) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <p className="text-slate-500">Brand not found</p>
      </div>
    );
  }

  // Check if Brand Kit is complete enough
  const kitIsReady = 
    kit.brand_identity.values_themes && 
    kit.brand_voice.voice_description &&
    kit.customer_audience.ideal_customer;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-8 py-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => step === 'select-type' ? navigate(`/brands/${brandId}`) : handleBack()}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="font-display font-semibold text-xl text-slate-800 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-sway-500" />
              Generate Email
            </h1>
            <p className="text-sm text-slate-500">
              {brand.name} • {step === 'select-type' && 'Choose email type'}
              {step === 'configure' && selectedEmailType?.name}
              {step === 'preview' && 'Review generated content'}
            </p>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center gap-2">
            {['select-type', 'configure', 'preview'].map((s, i) => (
              <div
                key={s}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  step === s
                    ? 'bg-sway-500'
                    : i < ['select-type', 'configure', 'preview'].indexOf(step)
                    ? 'bg-sway-200'
                    : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto p-8">
        {/* Kit Incomplete Warning */}
        {!kitIsReady && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">Brand Kit Incomplete</p>
              <p className="text-sm text-amber-700 mt-1">
                For best results, complete your Brand Kit with brand values, voice description, and customer profile.{' '}
                <button
                  onClick={() => navigate(`/brands/${brandId}/kit`)}
                  className="underline hover:no-underline"
                >
                  Complete Kit →
                </button>
              </p>
            </div>
          </div>
        )}

        {/* Step 1: Select Type */}
        {step === 'select-type' && (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-800">What type of email?</h2>
              <p className="text-slate-500">Choose the email type that matches your campaign goal.</p>
            </div>
            <EmailTypeSelector
              selected={selectedType}
              onSelect={handleSelectType}
            />
          </div>
        )}

        {/* Step 2: Configure */}
        {step === 'configure' && selectedEmailType && selectedType && (
          <div className="space-y-6">
            <div className="p-4 bg-white rounded-xl border border-slate-100">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selectedEmailType.icon}</span>
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">{selectedEmailType.name}</h2>
                  <p className="text-sm text-slate-500">{selectedEmailType.description}</p>
                </div>
              </div>
            </div>

            {/* Template Selector */}
            {org && (
              <TemplateSelector
                orgId={org.id}
                emailType={selectedType}
                onSelect={handleTemplateSelect}
                selectedTemplateId={selectedTemplate?.id || null}
              />
            )}

            <GenerationForm
              emailType={selectedType}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              template={selectedTemplate}
            />
          </div>
        )}

        {/* Step 3: Preview */}
        {step === 'preview' && generatedEmail && (
          <GeneratedEmailPreview
            email={generatedEmail}
            onSave={handleSaveClick}
            onRegenerate={handleRegenerate}
            isRegenerating={isGenerating}
            brandName={brand.name}
          />
        )}
      </main>

      {/* Save Modal */}
      <Modal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        title="Save Email"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Email Name"
            placeholder="e.g., Welcome Email v2"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
          />
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowSaveModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveConfirm}
              loading={saveEmail.isPending}
              className="flex-1"
            >
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
