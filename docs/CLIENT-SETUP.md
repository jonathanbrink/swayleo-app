# Swayleo - Client Setup Instructions

This document outlines the external accounts and API credentials you (Swayleo) need to create and manage. You will own all accounts and billing relationships directly.

---

## Required Accounts

### 1. Supabase (Database & Auth)
**What it does:** Hosts your database, user authentication, and file storage for moodboard images.

**Setup Steps:**
1. Go to [supabase.com](https://supabase.com) and create an account
2. Click "New Project"
3. Choose your organization name and project name (e.g., "swayleo-production")
4. Set a secure database password (save this somewhere safe)
5. Select a region closest to your users (e.g., US East for US-based agencies)
6. Wait for project to provision (~2 minutes)

**Credentials to Provide:**
| Credential | Where to Find | Example |
|------------|---------------|---------|
| `SUPABASE_URL` | Settings → API → Project URL | `https://abc123xyz.supabase.co` |
| `SUPABASE_ANON_KEY` | Settings → API → anon/public key | `eyJhbGciOiJIUzI1NiIs...` |

**Estimated Cost:** Free tier includes 500MB database, 1GB file storage, 50,000 monthly active users. Paid plans start at $25/month.

---

### 2. Resend (Transactional Email)
**What it does:** Sends authentication emails — password resets, email verification, etc. Required for production.

**Setup Steps:**
1. Go to [resend.com](https://resend.com) and create an account
2. Add and verify your domain (e.g., `swayleo.com` or `mail.swayleo.com`)
   - Add the DNS records Resend provides (SPF, DKIM, DMARC)
   - Wait for verification (~5-10 minutes)
3. Go to API Keys → Create API Key
4. Name it "supabase-auth"

**Credentials to Provide:**
| Credential | Where to Find |
|------------|---------------|
| `RESEND_API_KEY` | API Keys page | `re_...` |
| Verified Domain | Domains page | `mail.swayleo.com` |

**Configure in Supabase:**
1. Go to Supabase Dashboard → Authentication → Email Templates
2. Go to Settings → Authentication → SMTP Settings
3. Enable "Custom SMTP"
4. Enter:
   - Host: `smtp.resend.com`
   - Port: `465`
   - Username: `resend`
   - Password: Your Resend API key
   - Sender email: `noreply@yourdomain.com`

**Estimated Cost:** Free tier includes 3,000 emails/month. Then $20/month for 50,000 emails.

---

### 3. Vercel (Web Hosting)
**What it does:** Hosts and deploys your web application with automatic SSL, CDN, and continuous deployment.

**Setup Steps:**
1. Go to [vercel.com](https://vercel.com) and create an account
2. Connect your GitHub account (we'll push code to a repo you own)
3. Import the Swayleo repository
4. Add environment variables (from Supabase above)
5. Deploy

**Credentials to Provide:**
- Your GitHub account username (to transfer/share the repository)
- OR create a new GitHub repository and share access

**Environment Variables to Set in Vercel:**
```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

**Estimated Cost:** Free tier includes 100GB bandwidth, unlimited deployments. Pro plan $20/month/member for team features.

---

## Phase 2+ Requirements (AI Email Generation)

When we build the email generation module, you'll need API keys from one or more LLM providers. Set these up when ready.

### 4. Anthropic (Claude) — Recommended Primary
**What it does:** Powers AI-generated email copy using Claude models.

**Setup Steps:**
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an account and verify your email
3. Add a payment method (required for API access)
4. Go to API Keys → Create Key
5. Name it "swayleo-production"

**Credentials to Provide:**
| Credential | Where to Find |
|------------|---------------|
| `ANTHROPIC_API_KEY` | API Keys page | `sk-ant-api03-...` |

**Estimated Cost:** Pay-per-use. Claude Sonnet ~$3 per 1M input tokens, $15 per 1M output tokens. Typical email generation: ~$0.01-0.05 per email.

---

### 5. OpenAI (ChatGPT) — Optional Fallback
**What it does:** Alternative AI provider for email generation.

**Setup Steps:**
1. Go to [platform.openai.com](https://platform.openai.com)
2. Create an account
3. Add payment method under Billing
4. Go to API Keys → Create new secret key
5. Name it "swayleo-production"

**Credentials to Provide:**
| Credential | Where to Find |
|------------|---------------|
| `OPENAI_API_KEY` | API Keys page | `sk-proj-...` |

**Estimated Cost:** Pay-per-use. GPT-4o ~$2.50 per 1M input tokens, $10 per 1M output tokens.

---

### 6. DeepSeek — Optional Budget Alternative
**What it does:** Cost-effective AI provider for high-volume generation.

**Setup Steps:**
1. Go to [platform.deepseek.com](https://platform.deepseek.com)
2. Create an account
3. Add credits under Billing
4. Generate an API key

**Credentials to Provide:**
| Credential | Where to Find |
|------------|---------------|
| `DEEPSEEK_API_KEY` | API Keys page |

**Estimated Cost:** Significantly cheaper than Anthropic/OpenAI. ~$0.14 per 1M input tokens.

---

## Summary Checklist

### Phase 1 (Now)
- [ ] Create Supabase account and project
- [ ] Provide `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- [ ] Create Resend account and verify domain
- [ ] Provide `RESEND_API_KEY` and verified sender domain
- [ ] Configure Supabase SMTP with Resend credentials
- [ ] Create Vercel account
- [ ] Provide GitHub access for deployment

### Phase 2 (Email Generation)
- [ ] Create Anthropic account and provide `ANTHROPIC_API_KEY`
- [ ] (Optional) Create OpenAI account and provide `OPENAI_API_KEY`
- [ ] (Optional) Create DeepSeek account and provide `DEEPSEEK_API_KEY`

---

## Credential Delivery

Please send credentials securely via:
- **1Password** shared vault (preferred)
- **Encrypted email** (PGP)
- **Signal** message

**Never send API keys via regular email, Slack, or text.**

---

## Questions?

Contact [YOUR EMAIL/CONTACT] if you need help setting up any of these accounts.
