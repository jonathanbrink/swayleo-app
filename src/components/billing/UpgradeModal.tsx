import { useState } from 'react';
import { Check, Sparkles, Zap } from 'lucide-react';
import { Button, Modal } from '../ui';
import { SUBSCRIPTION_PLANS, formatLimit, type SubscriptionTier } from '../../types/billing';
import { useCreateCheckoutSession } from '../../hooks';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
  currentTier: SubscriptionTier;
  limitReached?: 'brands' | 'members' | 'templates' | 'emails';
}

export function UpgradeModal({ 
  isOpen, 
  onClose, 
  orgId, 
  currentTier,
  limitReached 
}: UpgradeModalProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null);
  const checkout = useCreateCheckoutSession();

  const availablePlans = SUBSCRIPTION_PLANS.filter(p => {
    const tierOrder = ['free', 'starter', 'professional', 'agency'];
    return tierOrder.indexOf(p.id) > tierOrder.indexOf(currentTier);
  });

  const handleUpgrade = async (tier: SubscriptionTier) => {
    setSelectedTier(tier);
    try {
      const { url } = await checkout.mutateAsync({ orgId, tier, billingCycle });
      // In production, redirect to Stripe checkout
      window.location.href = url;
    } catch (error) {
      console.error('Checkout error:', error);
    }
  };

  const getLimitMessage = () => {
    switch (limitReached) {
      case 'brands':
        return "You've reached your brand limit.";
      case 'members':
        return "You've reached your team member limit.";
      case 'templates':
        return "You've reached your template limit.";
      case 'emails':
        return "You've reached your monthly email limit.";
      default:
        return "Upgrade to unlock more features.";
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upgrade Your Plan"
      size="lg"
    >
      <div className="space-y-6">
        {/* Header Message */}
        {limitReached && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
            <Zap className="w-5 h-5 text-amber-500" />
            <p className="text-amber-800">{getLimitMessage()} Upgrade to continue.</p>
          </div>
        )}

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-3">
          <span className={`text-sm ${billingCycle === 'monthly' ? 'text-slate-800 font-medium' : 'text-slate-500'}`}>
            Monthly
          </span>
          <button
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              billingCycle === 'yearly' ? 'bg-sway-500' : 'bg-slate-200'
            }`}
          >
            <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
              billingCycle === 'yearly' ? 'translate-x-7' : 'translate-x-0.5'
            }`} />
          </button>
          <span className={`text-sm ${billingCycle === 'yearly' ? 'text-slate-800 font-medium' : 'text-slate-500'}`}>
            Yearly
          </span>
          {billingCycle === 'yearly' && (
            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
              Save 17%
            </span>
          )}
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {availablePlans.map((plan) => {
            const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
            const monthlyEquivalent = billingCycle === 'yearly' ? Math.round(price / 12) : price;

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border-2 p-6 transition-all ${
                  plan.highlighted
                    ? 'border-sway-500 bg-sway-50/50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-sway-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-4">
                  <h3 className="font-semibold text-lg text-slate-800">{plan.name}</h3>
                  <p className="text-sm text-slate-500">{plan.description}</p>
                </div>

                <div className="text-center mb-6">
                  <span className="text-4xl font-bold text-slate-800">
                    ${monthlyEquivalent}
                  </span>
                  <span className="text-slate-500">/mo</span>
                  {billingCycle === 'yearly' && (
                    <p className="text-xs text-slate-500 mt-1">
                      Billed ${price}/year
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>{formatLimit(plan.limits.brands)} brands</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>{formatLimit(plan.limits.emailsPerMonth)} emails/mo</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>{formatLimit(plan.limits.teamMembers)} team members</span>
                  </li>
                  {plan.limits.apiAccess && (
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span>API access</span>
                    </li>
                  )}
                  {plan.limits.prioritySupport && (
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span>Priority support</span>
                    </li>
                  )}
                </ul>

                <Button
                  onClick={() => handleUpgrade(plan.id)}
                  loading={checkout.isPending && selectedTier === plan.id}
                  variant={plan.highlighted ? 'primary' : 'outline'}
                  className="w-full"
                >
                  {plan.highlighted && <Sparkles className="w-4 h-4" />}
                  Upgrade to {plan.name}
                </Button>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-slate-500">
          All plans include a 14-day money-back guarantee. Cancel anytime.
        </p>
      </div>
    </Modal>
  );
}
