# Swayleo - Brand Management Platform

An agency-only copywriting platform for building Brand Kits that power AI-generated email copy.

## Tech Stack

- **Frontend:** React 18 + TypeScript + Tailwind CSS
- **State Management:** TanStack React Query
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **LLM Providers:** Anthropic Claude, OpenAI GPT-4o, DeepSeek
- **Routing:** React Router v7

## Quick Start

### 1. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the migrations in order:
   ```
   supabase/migrations/001_initial_schema.sql
   supabase/migrations/002_user_setup.sql
   supabase/migrations/003_saved_emails.sql
   supabase/migrations/004_organization_management.sql
   supabase/migrations/005_analytics.sql
   supabase/migrations/006_email_templates.sql
   supabase/migrations/007_billing_usage.sql
   supabase/migrations/008_client_portal.sql
   ```
3. Go to **Storage** and create a bucket called `moodboards` (private)
4. Copy your project URL and anon key from **Settings > API**

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# For AI email generation (at least one required)
VITE_ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Features

### Phase 1 (Brand Management) ✅
- [x] User authentication (email/password)
- [x] Create, edit, delete brands
- [x] Multi-section Brand Kit questionnaire
- [x] Autosave on form changes
- [x] Progress tracking
- [x] Moodboard image uploads
- [x] Brand detail view

### Phase 2 (Email Generation) ✅
- [x] 12 email type templates (welcome, abandoned cart, etc.)
- [x] Multi-provider LLM support (Claude, GPT-4o, DeepSeek)
- [x] Brand Kit context injection
- [x] Configurable generation (tone, length, emoji)
- [x] Multiple subject line & body variations
- [x] Copy, export HTML, save emails
- [x] Saved emails management
- [x] Demo mode (works without API keys)

### Phase 3 (Multi-user & Organization) ✅
- [x] Organization onboarding flow
- [x] Organization settings page
- [x] Team member management
- [x] Role-based permissions (owner, admin, member)
- [x] Email invitations with secure tokens
- [x] Invitation acceptance flow
- [x] Audit logging infrastructure

### Phase 4 (Analytics Dashboard) ✅
- [x] Dashboard homepage with key metrics
- [x] Stats cards (brands, emails, tokens, completion rate)
- [x] Generation activity chart (30-day trend)
- [x] Email type distribution breakdown
- [x] Brand performance table
- [x] Recent team activity feed
- [x] Quick action shortcuts
- [x] Automatic audit logging triggers

### Phase 5 (Template Library) ✅
- [x] Custom email template creation
- [x] Save tone, length, and style preferences
- [x] Add custom AI instructions
- [x] Share templates with team
- [x] Duplicate templates
- [x] Template usage tracking
- [x] Filter by category (My Templates, Shared, Popular)
- [x] Search templates

### Phase 6 (Template Integration & ESP Export) ✅
- [x] Template selector in email generation flow
- [x] Auto-load template settings (tone, length, instructions)
- [x] Template usage tracking on generation
- [x] Klaviyo export format with flow variables
- [x] Mailchimp export format with merge tags
- [x] Generic HTML export for any ESP
- [x] ESP export modal with format selection

### Phase 7 (Billing & Usage Limits) ✅
- [x] Subscription tiers (Free, Starter, Professional, Agency)
- [x] Usage tracking (emails, brands, members, templates)
- [x] Plan limits enforced at database level
- [x] Usage progress bars on billing page
- [x] Upgrade modal with plan comparison
- [x] Billing management (Stripe portal placeholder)
- [x] Automatic subscription creation for new orgs

### Phase 8 (Client Portal) ✅
- [x] Client access management per brand
- [x] Access levels (View, Review, Approve)
- [x] Secure token-based client links
- [x] Expiring links option
- [x] Read-only brand view for clients
- [x] Email review with expand/collapse
- [x] Approval workflow (approve, reject, request changes)
- [x] Feedback capture on rejections
- [x] Audit logging for approvals

## Client Portal

The client portal allows agencies to share brands with clients for review and approval.

### Access Levels

| Level | Description |
|-------|-------------|
| **View** | Can view brand details and generated emails |
| **Review** | Can view and leave comments on emails |
| **Approve** | Can approve, reject, or request revisions |

### How It Works

1. Go to a brand's detail page
2. Click "Add Client" in the Client Access section
3. Enter client email, name (optional), and access level
4. Copy the generated link and share with your client
5. Client can access the portal without logging in

## Subscription Tiers

| Feature | Free | Starter | Professional | Agency |
|---------|------|---------|--------------|--------|
| Brands | 1 | 5 | 25 | Unlimited |
| Emails/month | 10 | 100 | 500 | Unlimited |
| Team members | 1 | 3 | 10 | Unlimited |
| Templates | 3 | 20 | 100 | Unlimited |
| API access | ❌ | ❌ | ✅ | ✅ |
| Priority support | ❌ | ❌ | ✅ | ✅ |
| Price | $0 | $29/mo | $79/mo | $199/mo |

## ESP Export Formats

| Format | Features |
|--------|----------|
| **Klaviyo** | Flow variables ({{ event.x }}), organization merge tags, unsubscribe links |
| **Mailchimp** | Merge tags (*\|FNAME\|*), editable regions (mc:edit), MSO conditionals |
| **Generic HTML** | Clean, responsive HTML5 that works with any ESP |

## User Roles

| Role | Permissions |
|------|-------------|
| **Owner** | Full access, cannot be removed |
| **Admin** | Manage team, invite members, all brand access |
| **Member** | View and edit brands, generate emails |

## Deployment

### Vercel

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

### Edge Functions

Deploy the email generation function to Supabase:

```bash
supabase functions deploy generate-email
```

Set secrets in Supabase Dashboard > Edge Functions:
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY` (optional)
- `DEEPSEEK_API_KEY` (optional)

### Build

```bash
npm run build
```

Output in `dist/` folder.

## License

Proprietary - Swayleo
