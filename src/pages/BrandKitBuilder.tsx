import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Sparkles, Diamond, Target, MessageSquare, TrendingUp, Palette } from 'lucide-react';
import { Button, Input, Textarea, Toggle, useToast } from '../components/ui';
import { MoodboardUploader } from '../components/brands';
import { useBrand, useBrandKit, useUpdateBrandKit } from '../hooks';
import { BRAND_KIT_SECTIONS } from '../types';
import type { BrandKit, UpdateBrandKitInput } from '../types';

// Icon map for sections
const sectionIcons: Record<string, React.ElementType> = {
  Sparkles,
  Diamond,
  Target,
  MessageSquare,
  TrendingUp,
  Palette,
};

export function BrandKitBuilder() {
  const { id: brandId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const { data: brand, isLoading: brandLoading } = useBrand(brandId!);
  const { data: kit, isLoading: kitLoading } = useBrandKit(brandId!);
  const updateKit = useUpdateBrandKit();

  const [activeSection, setActiveSection] = useState(0);
  const [localKit, setLocalKit] = useState<BrandKit | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);

  // Initialize local state when kit loads
  useEffect(() => {
    if (kit && !localKit) {
      setLocalKit(kit);
    }
  }, [kit, localKit]);

  // Calculate progress
  const calculateProgress = useCallback(() => {
    if (!localKit) return 0;

    const fields = [
      localKit.brand_identity.values_themes,
      localKit.brand_identity.brand_story,
      localKit.brand_identity.desired_feeling,
      localKit.product_differentiation.unique_aspects,
      localKit.product_differentiation.best_sellers,
      localKit.customer_audience.ideal_customer,
      localKit.customer_audience.day_to_day,
      localKit.brand_voice.voice_description,
      localKit.brand_voice.words_to_avoid,
      localKit.marketing_strategy.competitors,
      localKit.design_preferences.brands_liked_visually,
    ];

    const filled = fields.filter((f) => f && f.trim().length > 0).length;
    return Math.round((filled / fields.length) * 100);
  }, [localKit]);

  // Update field with autosave
  const updateField = useCallback(
    (section: keyof UpdateBrandKitInput, field: string, value: string | boolean) => {
      if (!localKit || !brandId) return;

      // Update local state immediately
      setLocalKit((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          [section]: {
            ...(prev[section as keyof BrandKit] as object),
            [field]: value,
          },
        };
      });

      // Debounced save
      setSaving(true);
      const saveTimeout = setTimeout(async () => {
        try {
          await updateKit.mutateAsync({
            brandId,
            input: {
              [section]: { [field]: value },
            },
          });
          setLastSaved(new Date());
        } catch (error) {
          console.error('Save error:', error);
          showToast('Failed to save', 'error');
        } finally {
          setSaving(false);
        }
      }, 500);

      return () => clearTimeout(saveTimeout);
    },
    [brandId, localKit, updateKit, showToast]
  );

  const markComplete = async () => {
    if (!brandId) return;

    try {
      await updateKit.mutateAsync({
        brandId,
        input: { is_complete: true },
      });
      showToast('Brand Kit marked as complete!');
      navigate(`/brands/${brandId}`);
    } catch (error) {
      console.error('Error marking complete:', error);
      showToast('Failed to mark as complete', 'error');
    }
  };

  if (brandLoading || kitLoading || !localKit) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-sway-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-slate-500">Brand not found</p>
      </div>
    );
  }

  const progress = calculateProgress();

  return (
    <div className="flex min-h-screen">
      {/* Section Navigation */}
      <div className="w-80 bg-white border-r border-slate-100 p-6 flex flex-col">
        <button
          onClick={() => navigate('/brands')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back to Brands</span>
        </button>

        <div className="mb-6">
          <h2 className="font-display font-semibold text-lg text-slate-800">
            {brand.name}
          </h2>
          <p className="text-sm text-slate-500">Brand Kit Builder</p>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Progress</span>
            <span className="text-xs font-semibold text-sway-600">{progress}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sway-400 to-sway-600 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Section List */}
        <nav className="space-y-1 flex-1">
          {BRAND_KIT_SECTIONS.map((section, index) => {
            const Icon = sectionIcons[section.icon];
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(index)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-200 ${
                  activeSection === index
                    ? 'bg-sway-50 text-sway-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${activeSection === index ? 'text-sway-600' : 'text-slate-400'}`} />
                <span className="text-sm font-medium">{section.title}</span>
              </button>
            );
          })}
        </nav>

        {/* Save Status */}
        <div className="pt-6 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            {saving ? (
              <span>Saving...</span>
            ) : lastSaved ? (
              <span>Saved {lastSaved.toLocaleTimeString()}</span>
            ) : (
              <span>Autosave enabled</span>
            )}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto bg-slate-50">
        <div className="max-w-3xl mx-auto p-8">
          {/* Section Header */}
          <div className="mb-8">
            {(() => {
              const HeaderIcon = sectionIcons[BRAND_KIT_SECTIONS[activeSection].icon];
              return (
                <div className="flex items-center gap-3 mb-2">
                  <HeaderIcon className="w-6 h-6 text-sway-600" />
                  <h1 className="font-display font-semibold text-2xl text-slate-800">
                    {BRAND_KIT_SECTIONS[activeSection].title}
                  </h1>
                </div>
              );
            })()}
            <p className="text-slate-500">
              {activeSection === 0 && "Define your brand's core identity and what it stands for."}
              {activeSection === 1 && "What makes your products special and worth talking about."}
              {activeSection === 2 && "Who you're talking to and what they care about."}
              {activeSection === 3 && "How your brand sounds and communicates."}
              {activeSection === 4 && "Your competitive landscape and business context."}
              {activeSection === 5 && "Visual inspiration and design references."}
            </p>
          </div>

          {/* Section 1: Brand Identity */}
          {activeSection === 0 && (
            <div className="space-y-6">
              <Textarea
                label="Core Values & Themes"
                placeholder="What values and themes define this brand? (e.g., sustainability, innovation, heritage, community)"
                value={localKit.brand_identity.values_themes}
                onChange={(e) => updateField('brand_identity', 'values_themes', e.target.value)}
                rows={4}
              />
              <Textarea
                label="Brand Story"
                placeholder="How did this company start? Why does it exist? What's the founder's story?"
                value={localKit.brand_identity.brand_story}
                onChange={(e) => updateField('brand_identity', 'brand_story', e.target.value)}
                rows={6}
              />
              <Textarea
                label="Desired Customer Feeling"
                placeholder="What feeling or association should customers have when they think of this brand?"
                value={localKit.brand_identity.desired_feeling}
                onChange={(e) => updateField('brand_identity', 'desired_feeling', e.target.value)}
                rows={4}
              />
              <Textarea
                label="Cultural Influences"
                placeholder="What cultural movements, trends, or influences shape the brand's voice and visuals?"
                value={localKit.brand_identity.cultural_influences}
                onChange={(e) => updateField('brand_identity', 'cultural_influences', e.target.value)}
                rows={4}
              />
            </div>
          )}

          {/* Section 2: Product & Differentiation */}
          {activeSection === 1 && (
            <div className="space-y-6">
              <Textarea
                label="What Makes Products Unique"
                placeholder="What makes the product or service unique compared to competitors?"
                value={localKit.product_differentiation.unique_aspects}
                onChange={(e) => updateField('product_differentiation', 'unique_aspects', e.target.value)}
                rows={5}
              />
              <Textarea
                label="Best-Selling Products"
                placeholder="What are the best-selling products? Why do customers love them?"
                value={localKit.product_differentiation.best_sellers}
                onChange={(e) => updateField('product_differentiation', 'best_sellers', e.target.value)}
                rows={5}
              />
              <Textarea
                label="Features to Emphasize"
                placeholder="What materials, craftsmanship, or features should always be emphasized?"
                value={localKit.product_differentiation.features_to_emphasize}
                onChange={(e) => updateField('product_differentiation', 'features_to_emphasize', e.target.value)}
                rows={4}
              />
            </div>
          )}

          {/* Section 3: Customer & Audience */}
          {activeSection === 2 && (
            <div className="space-y-6">
              <Textarea
                label="Ideal Customer Profile"
                placeholder="Describe the ideal customer in deep detail—go beyond demographics. What do they value? What are their aspirations?"
                value={localKit.customer_audience.ideal_customer}
                onChange={(e) => updateField('customer_audience', 'ideal_customer', e.target.value)}
                rows={6}
              />
              <Textarea
                label="Day-to-Day Reality"
                placeholder="What's their day-to-day like? What do they love? What do they hate? What problems do they face?"
                value={localKit.customer_audience.day_to_day}
                onChange={(e) => updateField('customer_audience', 'day_to_day', e.target.value)}
                rows={5}
              />
              <Textarea
                label="Brands They Already Buy"
                placeholder="What other brands does this customer already buy from or admire?"
                value={localKit.customer_audience.brands_they_buy}
                onChange={(e) => updateField('customer_audience', 'brands_they_buy', e.target.value)}
                rows={4}
              />
            </div>
          )}

          {/* Section 4: Brand Voice */}
          {activeSection === 3 && (
            <div className="space-y-6">
              <Textarea
                label="Voice Description"
                placeholder="How should the brand sound in emails? (e.g., warm & conversational, bold & direct, witty & playful, refined & sophisticated)"
                value={localKit.brand_voice.voice_description}
                onChange={(e) => updateField('brand_voice', 'voice_description', e.target.value)}
                rows={5}
              />
              <Textarea
                label="Words & Phrases to Avoid"
                placeholder="Are there any words, phrases, or tones that should never be used?"
                value={localKit.brand_voice.words_to_avoid}
                onChange={(e) => updateField('brand_voice', 'words_to_avoid', e.target.value)}
                rows={4}
                hint='e.g., No "cheap", no exclamation points, no slang'
              />
              <Textarea
                label="Reference Brands"
                placeholder="What brands' messaging do you admire? Why?"
                value={localKit.brand_voice.reference_brands}
                onChange={(e) => updateField('brand_voice', 'reference_brands', e.target.value)}
                rows={4}
              />
            </div>
          )}

          {/* Section 5: Marketing & Strategy */}
          {activeSection === 4 && (
            <div className="space-y-6">
              <Textarea
                label="Key Competitors"
                placeholder="Who are the main competitors you benchmark against?"
                value={localKit.marketing_strategy.competitors}
                onChange={(e) => updateField('marketing_strategy', 'competitors', e.target.value)}
                rows={4}
              />
              <Textarea
                label="Planned Launches & Promos"
                placeholder="Any major product launches or promotions planned?"
                value={localKit.marketing_strategy.planned_launches}
                onChange={(e) => updateField('marketing_strategy', 'planned_launches', e.target.value)}
                rows={4}
              />

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Toggle
                    label="Has Review Platform"
                    checked={localKit.marketing_strategy.has_review_platform}
                    onChange={(val) => updateField('marketing_strategy', 'has_review_platform', val)}
                  />
                  {localKit.marketing_strategy.has_review_platform && (
                    <Input
                      placeholder="Which platform? (e.g., Yotpo, Judge.me)"
                      value={localKit.marketing_strategy.review_platform}
                      onChange={(e) => updateField('marketing_strategy', 'review_platform', e.target.value)}
                    />
                  )}
                </div>
                <Toggle
                  label="International Shipping"
                  checked={localKit.marketing_strategy.international_shipping}
                  onChange={(val) => updateField('marketing_strategy', 'international_shipping', val)}
                />
              </div>

              <Textarea
                label="Welcome Incentives"
                placeholder="What welcome offers or incentives are used? (e.g., 10% off first order, free shipping)"
                value={localKit.marketing_strategy.welcome_incentives}
                onChange={(e) => updateField('marketing_strategy', 'welcome_incentives', e.target.value)}
                rows={3}
              />
              <Textarea
                label="Return Policy"
                placeholder="What's the return/exchange policy?"
                value={localKit.marketing_strategy.return_policy}
                onChange={(e) => updateField('marketing_strategy', 'return_policy', e.target.value)}
                rows={3}
              />
            </div>
          )}

          {/* Section 6: Design & Moodboard */}
          {activeSection === 5 && (
            <div className="space-y-6">
              <Textarea
                label="Brands You Like Visually"
                placeholder="What brands do you admire from a visual/design perspective?"
                value={localKit.design_preferences.brands_liked_visually}
                onChange={(e) => updateField('design_preferences', 'brands_liked_visually', e.target.value)}
                rows={4}
              />
              <Textarea
                label="Design Elements to Capture"
                placeholder="What specific design elements should be mimicked or captured? (e.g., minimal layouts, bold typography, organic textures)"
                value={localKit.design_preferences.design_elements}
                onChange={(e) => updateField('design_preferences', 'design_elements', e.target.value)}
                rows={4}
              />

              <Input
                label="Moodboard Link"
                type="url"
                placeholder="Link to Google Drive folder, Pinterest board, etc."
                value={localKit.design_preferences.moodboard_link}
                onChange={(e) => updateField('design_preferences', 'moodboard_link', e.target.value)}
              />

              <MoodboardUploader brandId={brandId!} />
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-10 pt-6 border-t border-slate-200">
            <Button
              variant="ghost"
              onClick={() => setActiveSection(Math.max(0, activeSection - 1))}
              disabled={activeSection === 0}
            >
              Previous Section
            </Button>

            <div className="flex gap-3">
              {activeSection < BRAND_KIT_SECTIONS.length - 1 ? (
                <Button onClick={() => setActiveSection(activeSection + 1)}>
                  Next Section
                </Button>
              ) : (
                <Button onClick={markComplete} loading={updateKit.isPending}>
                  <Check className="w-4 h-4" />
                  Mark Kit Complete
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
