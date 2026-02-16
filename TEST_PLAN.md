# Swayleo Test Plan

## Overview
Comprehensive test plan for the Swayleo brand management platform.
**Tech Stack:** React 18 + TypeScript + Vite + Supabase + React Query
**Test Framework:** Vitest + React Testing Library + MSW (Mock Service Worker)

---

## 1. Unit Tests — Type Helpers & Constants

### 1.1 `types/billing.ts` helpers
- [x] `getPlan('free')` returns Free plan
- [x] `getPlan('starter')` returns Starter plan
- [x] `getPlan('professional')` returns Professional plan with `highlighted: true`
- [x] `getPlan('agency')` returns Agency plan with unlimited (-1) limits
- [x] `getPlan` with invalid tier falls back to Free plan
- [x] `isUnlimited(-1)` returns `true`
- [x] `isUnlimited(5)` returns `false`
- [x] `isUnlimited(0)` returns `false`
- [x] `formatLimit(-1)` returns `'Unlimited'`
- [x] `formatLimit(100)` returns `'100'`
- [x] `formatLimit(1000)` returns `'1,000'`
- [x] `SUBSCRIPTION_PLANS` has exactly 4 plans
- [x] All plans have required fields (id, name, limits, features)

### 1.2 `types/client.ts` helpers
- [x] `getApprovalStatus('pending')` returns correct status object
- [x] `getApprovalStatus('approved')` returns emerald color
- [x] `getApprovalStatus('rejected')` returns red color
- [x] `getApprovalStatus('revision_requested')` returns blue color
- [x] `ACCESS_LEVELS` has 3 levels (view, review, approve)
- [x] `APPROVAL_STATUSES` has 4 statuses

### 1.3 `types/email.ts` constants
- [x] `EMAIL_TEMPLATES` has exactly 12 templates
- [x] All templates have required fields (id, name, category, icon)
- [x] `EMAIL_CATEGORIES` has 5 categories
- [x] `LLM_CONFIGS` has 3 providers (anthropic, openai, deepseek)
- [x] All LLM configs have pricing fields

### 1.4 `types/index.ts` constants
- [x] `BRAND_KIT_SECTIONS` has 6 sections
- [x] `VERTICAL_OPTIONS` has 8 options
- [x] All sections have id, title, icon

### 1.5 `types/knowledge.ts` constants & helpers
- [x] `KNOWLEDGE_CATEGORIES` has exactly 6 categories
- [x] Includes all expected category IDs (product, faq, competitor, persona, campaign_result, general)
- [x] All categories have required fields (id, name, description, icon)
- [x] Has unique IDs for all categories
- [x] Has unique names for all categories
- [x] `getCategoryInfo('product')` returns Products info
- [x] `getCategoryInfo('faq')` returns FAQs info
- [x] `getCategoryInfo('competitor')` returns Competitors info
- [x] `getCategoryInfo('persona')` returns Personas info
- [x] `getCategoryInfo('campaign_result')` returns Campaign Results info
- [x] `getCategoryInfo('general')` returns General info
- [x] `getCategoryInfo` falls back to general for unknown category

---

## 2. Unit Tests — Lib Functions

### 2.1 `lib/prompts.ts`
- [x] `buildBrandKitContext()` generates XML with brand name
- [x] `buildBrandKitContext()` includes website_url when present
- [x] `buildBrandKitContext()` omits website when null
- [x] `buildBrandKitContext()` includes all 6 kit sections
- [x] `buildBrandKitContext()` uses 'Not specified' for empty fields
- [x] `buildBrandKitContext()` includes marketing booleans (review_platform, shipping)
- [x] `buildEmailPrompt()` includes email type instructions
- [x] `buildEmailPrompt()` includes tone modifier when not default
- [x] `buildEmailPrompt()` omits tone section when default
- [x] `buildEmailPrompt()` includes length guideline
- [x] `buildEmailPrompt()` includes subject line count
- [x] `buildEmailPrompt()` includes variation count
- [x] `buildEmailPrompt()` includes additional context when provided
- [x] `buildEmailPrompt()` includes emoji instructions
- [x] `buildEmailPrompt()` includes critical rules
- [x] `buildEmailPrompt()` includes output format JSON specification
- [x] `EMAIL_SYSTEM_PROMPT` is non-empty string

### 2.2 `lib/espExport.ts`
- [x] `exportToKlaviyo()` generates valid HTML with Klaviyo variables
- [x] `exportToKlaviyo()` includes brand name in comment
- [x] `exportToKlaviyo()` includes preview text div
- [x] `exportToKlaviyo()` includes CTA when provided
- [x] `exportToKlaviyo()` omits CTA section when not provided
- [x] `exportToKlaviyo()` includes unsubscribe link
- [x] `exportToMailchimp()` generates HTML with Mailchimp merge tags
- [x] `exportToMailchimp()` converts `{{first_name}}` to `*|FNAME|*`
- [x] `exportToMailchimp()` includes MSO conditionals
- [x] `exportToMailchimp()` includes mc:edit regions
- [x] `exportToGenericHtml()` generates valid HTML5 document
- [x] `exportToGenericHtml()` includes subject line as title
- [x] `exportToGenericHtml()` includes preview text when present
- [x] `exportEmail()` routes to correct exporter based on format
- [x] `ESP_FORMATS` has 3 formats

### 2.3 `lib/prompts.ts` — Knowledge Base Integration
- [x] `buildKnowledgeBaseContext()` returns empty string for empty array
- [x] `buildKnowledgeBaseContext()` returns empty string for null/undefined
- [x] `buildKnowledgeBaseContext()` wraps entries in `<knowledge_base>` tags
- [x] `buildKnowledgeBaseContext()` groups entries by category
- [x] `buildKnowledgeBaseContext()` includes entry titles and content
- [x] `buildKnowledgeBaseContext()` puts multiple entries in same category group
- [x] `buildKnowledgeBaseContext()` handles single entry
- [x] `buildBrandKitContext()` includes knowledge base XML when entries provided
- [x] `buildBrandKitContext()` does not include KB XML when no entries
- [x] `buildBrandKitContext()` does not include KB XML when empty array
- [x] `buildBrandKitContext()` places knowledge base inside brand_kit tags
- [x] `buildEmailPrompt()` includes knowledge entries in the full prompt
- [x] `buildEmailPrompt()` works without knowledge entries (backward compatible)
- [x] `buildEmailPrompt()` includes all prompt sections alongside knowledge

### 2.4 `lib/email.ts`
- [x] `exportEmailAsText()` formats email with all sections
- [x] `exportEmailAsText()` shows '(none)' for missing preview text
- [x] `exportEmailAsHTML()` generates valid HTML
- [x] `exportEmailAsHTML()` includes headline when present
- [x] `exportEmailAsHTML()` includes preview text hidden div
- [x] `exportEmailAsHTML()` splits body into paragraphs
- [x] `generateMockEmail()` returns correct number of subject lines
- [x] `generateMockEmail()` returns correct number of variations
- [x] `generateMockEmail()` returns valid GeneratedEmail structure

---

## 3. Component Tests

### 3.1 UI Components
- [x] `Button` renders with text and handles click
- [x] `Button` shows spinner when loading
- [x] `Button` is disabled when disabled prop is true
- [x] `Button` renders all variants (primary, secondary, ghost, outline, danger)
- [x] `Button` renders all sizes (sm, md, lg)
- [x] `Input` renders with label and placeholder
- [x] `Input` shows error message
- [x] `Input` handles onChange
- [x] `Textarea` renders with label and placeholder
- [x] `Modal` renders when open and hides when closed
- [x] `Modal` calls onClose when backdrop clicked
- [x] `Modal` calls onClose on Escape key
- [x] `Select` renders options
- [x] `Toggle` renders and toggles state
- [x] `UsageBar` renders progress with correct percentage
- [x] `UsageBar` shows warning color at 80%+
- [x] `UsageBar` shows 'Unlimited' when limit is -1

### 3.2 Brand Components
- [x] `BrandCard` displays brand name, website, vertical
- [x] `BrandCard` shows kit completion percentage
- [x] `EmailTypeSelector` renders all 12 email types
- [x] `EmailTypeSelector` calls onSelect with correct type

---

## 4. Integration Tests

### 4.1 Email Generation Flow
- [x] Mock mode returns email within timeout
- [x] Generated email has correct brandId and emailType

### 4.2 Billing Logic
- [x] `checkLimit` returns `allowed: true` when under limit
- [x] `checkLimit` returns `allowed: false` when at limit
- [x] `checkLimit` returns `allowed: true` for unlimited plans
- [x] `getUsageSummary` calculates correct percentages

---

## 5. Build Verification
- [x] TypeScript compilation passes (`tsc --noEmit`)
- [x] Vite build succeeds (`vite build`)
- [x] All tests pass

---

## Test Coverage Summary

| Area | Tests |
|------|-------|
| Type helpers & constants | 42 |
| Prompt builder | 32 |
| KB prompt integration | 14 |
| ESP export | 30 |
| Email utils | 11 |
| UI components | 39 |
| Brand/Email components | 3 |
| Knowledge Base types | 12 |
| Integration | 4+ |
| **Total** | **205** |

*Last verified: Feb 14, 2026 — 14 test files, 205 tests, 0 failures*
