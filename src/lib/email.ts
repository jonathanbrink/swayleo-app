import { supabase } from './supabase';
import { buildEmailPrompt, EMAIL_SYSTEM_PROMPT } from './prompts';
import type { Brand, BrandKit } from '../types';
import type { 
  EmailGenerationRequest, 
  GeneratedEmail, 
  SavedEmail,
  LLMProvider
} from '../types/email';

// ============================================
// Demo mode flag (set to true for local dev without edge function)
// ============================================

const isDemoMode = () => {
  return import.meta.env.VITE_USE_MOCK_GENERATION === 'true';
};

// ============================================
// Mock Generator (for demo/development)
// ============================================

const generateMockEmail = (request: EmailGenerationRequest): GeneratedEmail => {
  const mockSubjectLines = [
    { text: `Welcome to the ${request.brandId} family ✨`, previewText: "We're so glad you're here" },
    { text: `You're in! Here's what to expect`, previewText: "Plus a little something special" },
    { text: `This is the start of something good`, previewText: "Welcome to our community" },
    { text: `Hey, welcome aboard`, previewText: "Let's get you started" },
    { text: `You made a great choice`, previewText: "Here's why we think so" },
  ].slice(0, request.subjectLineCount);

  const mockVariations = [
    {
      id: crypto.randomUUID(),
      headline: "Welcome to the family",
      body: `We're thrilled to have you here.\n\nAt [Brand], we believe in [core value from brand kit]. Every product we create is designed with [customer benefit] in mind.\n\nAs a thank you for joining us, here's [welcome incentive] on your first order.\n\nWe can't wait for you to experience what makes us different.`,
      cta: "Shop Now",
    },
    {
      id: crypto.randomUUID(),
      headline: undefined,
      body: `Hey there,\n\nThanks for signing up! You're now part of a community that values [brand values].\n\nHere's a quick intro to who we are: [brand story snippet]\n\nReady to explore? Your welcome gift is waiting.`,
      cta: "Explore the Collection",
    },
    {
      id: crypto.randomUUID(),
      headline: "Let's get started",
      body: `Welcome!\n\nWe started [Brand] because [founder story]. Today, we're proud to serve customers like you who care about [customer values].\n\nOur bestsellers? [Bestseller 1] and [Bestseller 2] — both customer favorites for good reason.\n\nTake a look around, and don't hesitate to reach out if you have questions.`,
      cta: "Meet Our Bestsellers",
    },
  ].slice(0, request.variationCount);

  return {
    id: crypto.randomUUID(),
    brandId: request.brandId,
    emailType: request.emailType,
    subjectLines: mockSubjectLines,
    variations: mockVariations,
    generatedAt: new Date().toISOString(),
    model: 'mock-demo',
    promptTokens: 1500,
    completionTokens: 800,
  };
};

// ============================================
// Real LLM Generation (via Edge Function)
// ============================================

const getLocalApiKeys = (orgId: string): { anthropic?: string; openai?: string; deepseek?: string } => {
  try {
    const savedKeys = localStorage.getItem(`api_keys_${orgId}`);
    if (savedKeys) {
      return JSON.parse(savedKeys);
    }
  } catch {
    // Ignore parse errors
  }
  return {};
};

const generateWithLLM = async (
  brand: Brand,
  kit: BrandKit,
  request: EmailGenerationRequest,
  provider: LLMProvider = 'anthropic'
): Promise<GeneratedEmail> => {
  const prompt = buildEmailPrompt(brand, kit, request);
  
  // Get locally stored API keys (org-specific)
  const localKeys = getLocalApiKeys(brand.org_id);
  
  // Call Supabase Edge Function
  const { data, error } = await supabase.functions.invoke('generate-email', {
    body: {
      prompt,
      systemPrompt: EMAIL_SYSTEM_PROMPT,
      provider,
      brandId: request.brandId,
      emailType: request.emailType,
      // Pass local keys if available
      apiKeys: localKeys,
    },
  });

  if (error) throw error;
  
  return {
    id: crypto.randomUUID(),
    brandId: request.brandId,
    emailType: request.emailType,
    subjectLines: data.subject_lines,
    variations: data.variations.map((v: { 
      headline?: string; 
      subheader1?: string;
      cta1?: string;
      subheader2?: string;
      body: string; 
      cta?: string;
      cta2?: string;
    }) => ({
      id: crypto.randomUUID(),
      headline: v.headline,
      subheader1: v.subheader1,
      cta1: v.cta1,
      subheader2: v.subheader2,
      body: v.body,
      cta: v.cta || v.cta1 || 'Shop Now', // Backward compatibility
      cta2: v.cta2,
    })),
    generatedAt: new Date().toISOString(),
    model: data.model,
    promptTokens: data.usage?.prompt_tokens,
    completionTokens: data.usage?.completion_tokens,
  };
};

// ============================================
// Main Generation Function
// ============================================

export const generateEmail = async (
  brand: Brand,
  kit: BrandKit,
  request: EmailGenerationRequest,
  provider?: LLMProvider
): Promise<GeneratedEmail> => {
  if (isDemoMode()) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    return generateMockEmail(request);
  }
  
  return generateWithLLM(brand, kit, request, provider);
};

// ============================================
// Saved Emails CRUD
// ============================================

export const getSavedEmails = async (brandId: string): Promise<SavedEmail[]> => {
  const { data, error } = await supabase
    .from('saved_emails')
    .select('*')
    .eq('brand_id', brandId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const saveEmail = async (email: Omit<SavedEmail, 'id' | 'created_at' | 'updated_at'>): Promise<SavedEmail> => {
  const { data, error } = await supabase
    .from('saved_emails')
    .insert(email)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateSavedEmail = async (
  id: string, 
  updates: Partial<Pick<SavedEmail, 'name' | 'subject_line' | 'preview_text' | 'body_content' | 'cta_text' | 'status'>>
): Promise<SavedEmail> => {
  const { data, error } = await supabase
    .from('saved_emails')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteSavedEmail = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('saved_emails')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// ============================================
// Export to Clipboard / File
// ============================================

export const exportEmailAsText = (email: {
  subjectLine: string;
  previewText?: string;
  body: string;
  cta: string;
}): string => {
  return `SUBJECT LINE:
${email.subjectLine}

PREVIEW TEXT:
${email.previewText || '(none)'}

BODY:
${email.body}

CTA:
${email.cta}`;
};

export const exportEmailAsDocx = async (email: {
  subjectLine: string;
  previewText?: string;
  headline?: string;
  subheader1?: string;
  cta1?: string;
  subheader2?: string;
  body: string;
  cta2?: string;
}, brandName: string, emailType: string): Promise<void> => {
  // Dynamically import docx library
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = await import('docx');
  
  const children: any[] = [
    // Title
    new Paragraph({
      children: [new TextRun({ text: `${brandName} - ${emailType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Email`, bold: true, size: 32 })],
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 400 },
    }),
    
    // Subject Line
    new Paragraph({
      children: [new TextRun({ text: 'Subject Line', bold: true, size: 24 })],
      spacing: { before: 300, after: 100 },
    }),
    new Paragraph({
      children: [new TextRun({ text: email.subjectLine, size: 22 })],
      spacing: { after: 200 },
    }),
    
    // Preview Text
    new Paragraph({
      children: [new TextRun({ text: 'Preview Text', bold: true, size: 24 })],
      spacing: { before: 300, after: 100 },
    }),
    new Paragraph({
      children: [new TextRun({ text: email.previewText || '(none)', size: 22, italics: !email.previewText })],
      spacing: { after: 300 },
    }),
    
    // Divider
    new Paragraph({
      children: [new TextRun({ text: '─'.repeat(50), color: 'CCCCCC' })],
      spacing: { before: 200, after: 200 },
    }),
    
    // Email Body Header
    new Paragraph({
      children: [new TextRun({ text: 'Email Body', bold: true, size: 28 })],
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 300, after: 300 },
    }),
  ];

  // Header
  if (email.headline) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'Header', bold: true, size: 20, color: '666666' })],
        spacing: { before: 200, after: 50 },
      }),
      new Paragraph({
        children: [new TextRun({ text: email.headline, bold: true, size: 28 })],
        spacing: { after: 200 },
      })
    );
  }

  // Subheader 1
  if (email.subheader1) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'Subheader', bold: true, size: 20, color: '666666' })],
        spacing: { before: 200, after: 50 },
      }),
      new Paragraph({
        children: [new TextRun({ text: email.subheader1, size: 22 })],
        spacing: { after: 200 },
      })
    );
  }

  // CTA 1
  if (email.cta1) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'CTA', bold: true, size: 20, color: '666666' })],
        spacing: { before: 200, after: 50 },
      }),
      new Paragraph({
        children: [new TextRun({ text: email.cta1, bold: true, size: 22, allCaps: true })],
        spacing: { after: 200 },
      })
    );
  }

  // Subheader 2
  if (email.subheader2) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'Subheader', bold: true, size: 20, color: '666666' })],
        spacing: { before: 200, after: 50 },
      }),
      new Paragraph({
        children: [new TextRun({ text: email.subheader2, size: 22 })],
        spacing: { after: 200 },
      })
    );
  }

  // Body Copy
  if (email.body) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'Body Copy', bold: true, size: 20, color: '666666' })],
        spacing: { before: 200, after: 50 },
      })
    );
    
    // Split body into paragraphs
    const bodyParagraphs = email.body.split('\n\n');
    bodyParagraphs.forEach(para => {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: para, size: 22 })],
          spacing: { after: 200 },
        })
      );
    });
  }

  // CTA 2
  if (email.cta2) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'CTA', bold: true, size: 20, color: '666666' })],
        spacing: { before: 200, after: 50 },
      }),
      new Paragraph({
        children: [new TextRun({ text: email.cta2, bold: true, size: 22, allCaps: true })],
        spacing: { after: 200 },
      })
    );
  }

  const doc = new Document({
    sections: [{
      properties: {},
      children,
    }],
  });

  const buffer = await Packer.toBlob(doc);
  const url = URL.createObjectURL(buffer);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${brandName.toLowerCase().replace(/\s+/g, '-')}-${emailType}-email.docx`;
  a.click();
  URL.revokeObjectURL(url);
};

export const exportEmailAsHTML = (email: {
  subjectLine: string;
  previewText?: string;
  headline?: string;
  body: string;
  cta: string;
}): string => {
  const bodyParagraphs = email.body
    .split('\n\n')
    .map(p => `<p style="margin: 0 0 16px 0; line-height: 1.6;">${p.replace(/\n/g, '<br>')}</p>`)
    .join('\n');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${email.subjectLine}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  ${email.previewText ? `<div style="display: none; max-height: 0; overflow: hidden;">${email.previewText}</div>` : ''}
  
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="padding: 40px;">
              ${email.headline ? `<h1 style="margin: 0 0 24px 0; font-size: 28px; font-weight: 600; color: #1a1a1a;">${email.headline}</h1>` : ''}
              
              <div style="color: #4a4a4a; font-size: 16px;">
                ${bodyParagraphs}
              </div>
              
              <table cellpadding="0" cellspacing="0" style="margin-top: 32px;">
                <tr>
                  <td style="background-color: #1a1a1a; border-radius: 6px;">
                    <a href="#" style="display: inline-block; padding: 14px 28px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;">
                      ${email.cta}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};
