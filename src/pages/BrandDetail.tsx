import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe, Calendar, Check, Pencil, Trash2, ExternalLink, Sparkles, Mail } from 'lucide-react';
import { Button, useToast } from '../components/ui';
import { ClientAccessManager } from '../components/brands/ClientAccessManager';
import { useBrand, useBrandKit, useDeleteBrand, useMoodboardAssets } from '../hooks';

export function BrandDetail() {
  const { id: brandId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const { data: brand, isLoading: brandLoading } = useBrand(brandId!);
  const { data: kit, isLoading: kitLoading } = useBrandKit(brandId!);
  const { data: moodboardAssets = [] } = useMoodboardAssets(brandId!);
  const deleteBrand = useDeleteBrand();

  const handleDelete = async () => {
    if (!brand) return;
    
    if (!window.confirm(`Are you sure you want to delete "${brand.name}"? This cannot be undone.`)) {
      return;
    }

    try {
      await deleteBrand.mutateAsync(brand.id);
      showToast(`"${brand.name}" has been deleted`);
      navigate('/brands');
    } catch (error) {
      showToast('Failed to delete brand', 'error');
      console.error('Delete error:', error);
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

  const DetailSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white rounded-xl border border-slate-100 p-6">
      <h3 className="font-semibold text-slate-800 mb-4">{title}</h3>
      {children}
    </div>
  );

  const DetailItem = ({ label, value, type = 'text' }: { label: string; value: string | boolean | null | undefined; type?: 'text' | 'boolean' | 'link' }) => {
    if (value === null || value === undefined || (typeof value === 'string' && !value.trim())) {
      return null;
    }

    return (
      <div className="mb-4 last:mb-0">
        <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">
          {label}
        </dt>
        {type === 'boolean' ? (
          <dd className="text-slate-700">{value ? 'Yes' : 'No'}</dd>
        ) : type === 'link' ? (
          <dd>
            <a
              href={value as string}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sway-600 hover:text-sway-700 flex items-center gap-1"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="truncate">{value as string}</span>
            </a>
          </dd>
        ) : (
          <dd className="text-slate-700 whitespace-pre-wrap">{value as string}</dd>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-8 py-6">
        <button
          onClick={() => navigate('/brands')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back to Brands</span>
        </button>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sway-100 to-fuchsia-100 flex items-center justify-center">
              <span className="font-display font-bold text-2xl text-sway-600">
                {brand.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="font-display font-semibold text-2xl text-slate-800">
                {brand.name}
              </h1>
              <div className="flex items-center gap-4 mt-1">
                {brand.website_url && (
                  <a
                    href={brand.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-slate-500 hover:text-sway-600 text-sm"
                  >
                    <Globe className="w-4 h-4" />
                    {brand.website_url.replace(/^https?:\/\//, '')}
                  </a>
                )}
                {brand.vertical && (
                  <span className="text-sm text-slate-400 capitalize">{brand.vertical}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full ${
                kit.is_complete
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-amber-50 text-amber-600'
              }`}
            >
              {kit.is_complete ? (
                <>
                  <Check className="w-4 h-4" /> Kit Complete
                </>
              ) : (
                'Kit In Progress'
              )}
            </span>
            <Button
              onClick={() => navigate(`/brands/${brand.id}/generate`)}
            >
              <Sparkles className="w-4 h-4" />
              Generate Email
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate(`/brands/${brand.id}/emails`)}
            >
              <Mail className="w-4 h-4" />
              Saved Emails
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate(`/brands/${brand.id}/kit`)}
            >
              <Pencil className="w-4 h-4" />
              Edit Kit
            </Button>
            <Button
              variant="ghost"
              onClick={handleDelete}
              className="text-red-500 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <DetailSection title="Brand Identity & Positioning">
              <DetailItem label="Core Values & Themes" value={kit.brand_identity.values_themes} />
              <DetailItem label="Brand Story" value={kit.brand_identity.brand_story} />
              <DetailItem label="Desired Customer Feeling" value={kit.brand_identity.desired_feeling} />
              <DetailItem label="Cultural Influences" value={kit.brand_identity.cultural_influences} />
            </DetailSection>

            <DetailSection title="Product & Differentiation">
              <DetailItem label="What Makes Products Unique" value={kit.product_differentiation.unique_aspects} />
              <DetailItem label="Best-Selling Products" value={kit.product_differentiation.best_sellers} />
              <DetailItem label="Features to Emphasize" value={kit.product_differentiation.features_to_emphasize} />
            </DetailSection>

            <DetailSection title="Customer & Audience">
              <DetailItem label="Ideal Customer Profile" value={kit.customer_audience.ideal_customer} />
              <DetailItem label="Day-to-Day Reality" value={kit.customer_audience.day_to_day} />
              <DetailItem label="Brands They Buy" value={kit.customer_audience.brands_they_buy} />
            </DetailSection>

            <DetailSection title="Brand Voice & Creative">
              <DetailItem label="Voice Description" value={kit.brand_voice.voice_description} />
              <DetailItem label="Words to Avoid" value={kit.brand_voice.words_to_avoid} />
              <DetailItem label="Reference Brands" value={kit.brand_voice.reference_brands} />
            </DetailSection>

            <DetailSection title="Marketing & Strategy">
              <DetailItem label="Competitors" value={kit.marketing_strategy.competitors} />
              <DetailItem label="Planned Launches" value={kit.marketing_strategy.planned_launches} />
              <DetailItem label="Welcome Incentives" value={kit.marketing_strategy.welcome_incentives} />
              <DetailItem label="Return Policy" value={kit.marketing_strategy.return_policy} />
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100">
                <DetailItem
                  label="Review Platform"
                  value={
                    kit.marketing_strategy.has_review_platform
                      ? kit.marketing_strategy.review_platform || 'Yes'
                      : 'No'
                  }
                />
                <DetailItem
                  label="International Shipping"
                  value={kit.marketing_strategy.international_shipping ? 'Yes' : 'No'}
                />
              </div>
            </DetailSection>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <DetailSection title="Design Preferences">
              <DetailItem label="Brands Liked Visually" value={kit.design_preferences.brands_liked_visually} />
              <DetailItem label="Design Elements" value={kit.design_preferences.design_elements} />
              <DetailItem label="Moodboard Link" value={kit.design_preferences.moodboard_link} type="link" />
            </DetailSection>

            {/* Moodboard Images */}
            {moodboardAssets.length > 0 && (
              <DetailSection title="Moodboard Images">
                <div className="grid grid-cols-2 gap-3">
                  {moodboardAssets.map((asset) => (
                    <div key={asset.id} className="relative">
                      {asset.url ? (
                        <img
                          src={asset.url}
                          alt={asset.filename}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-24 bg-slate-100 rounded-lg" />
                      )}
                      <p className="text-xs text-slate-400 mt-1 truncate">{asset.filename}</p>
                    </div>
                  ))}
                </div>
              </DetailSection>
            )}

            {/* Client Access */}
            <ClientAccessManager brandId={brand.id} brandName={brand.name} />

            {/* Metadata */}
            <div className="bg-slate-100/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                <Calendar className="w-3.5 h-3.5" />
                <span>Created {new Date(brand.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Calendar className="w-3.5 h-3.5" />
                <span>Updated {new Date(kit.updated_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
