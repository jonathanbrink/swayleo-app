import type { BrandKit, Brand } from '../types';
import type { EmailType, EmailGenerationRequest } from '../types/email';
import type { KnowledgeEntry } from '../types/knowledge';

// ============================================
// Brand Kit to XML Context
// ============================================

export function buildKnowledgeBaseContext(entries: KnowledgeEntry[]): string {
  if (!entries || entries.length === 0) return '';

  // Group entries by category
  const grouped: Record<string, KnowledgeEntry[]> = {};
  for (const entry of entries) {
    if (!grouped[entry.category]) grouped[entry.category] = [];
    grouped[entry.category].push(entry);
  }

  let xml = '\n  <knowledge_base>';
  for (const [category, categoryEntries] of Object.entries(grouped)) {
    xml += `\n    <${category}>`;
    for (const entry of categoryEntries) {
      xml += `\n      <entry title="${entry.title}">${entry.content}</entry>`;
    }
    xml += `\n    </${category}>`;
  }
  xml += '\n  </knowledge_base>';

  return xml;
}

export function buildBrandKitContext(brand: Brand, kit: BrandKit, knowledgeEntries?: KnowledgeEntry[]): string {
  const knowledgeXml = knowledgeEntries ? buildKnowledgeBaseContext(knowledgeEntries) : '';

  return `<brand_kit>
  <brand_name>${brand.name}</brand_name>
  ${brand.website_url ? `<website>${brand.website_url}</website>` : ''}
  ${brand.vertical ? `<vertical>${brand.vertical}</vertical>` : ''}
  
  <brand_identity>
    <values_and_themes>${kit.brand_identity.values_themes || 'Not specified'}</values_and_themes>
    <brand_story>${kit.brand_identity.brand_story || 'Not specified'}</brand_story>
    <desired_customer_feeling>${kit.brand_identity.desired_feeling || 'Not specified'}</desired_customer_feeling>
    <cultural_influences>${kit.brand_identity.cultural_influences || 'Not specified'}</cultural_influences>
  </brand_identity>
  
  <product_differentiation>
    <unique_aspects>${kit.product_differentiation.unique_aspects || 'Not specified'}</unique_aspects>
    <best_sellers>${kit.product_differentiation.best_sellers || 'Not specified'}</best_sellers>
    <features_to_emphasize>${kit.product_differentiation.features_to_emphasize || 'Not specified'}</features_to_emphasize>
  </product_differentiation>
  
  <customer_audience>
    <ideal_customer>${kit.customer_audience.ideal_customer || 'Not specified'}</ideal_customer>
    <customer_day_to_day>${kit.customer_audience.day_to_day || 'Not specified'}</customer_day_to_day>
    <brands_they_buy>${kit.customer_audience.brands_they_buy || 'Not specified'}</brands_they_buy>
  </customer_audience>
  
  <brand_voice>
    <voice_description>${kit.brand_voice.voice_description || 'Not specified'}</voice_description>
    <words_to_avoid>${kit.brand_voice.words_to_avoid || 'None specified'}</words_to_avoid>
    <reference_brands>${kit.brand_voice.reference_brands || 'Not specified'}</reference_brands>
  </brand_voice>
  
  <marketing_context>
    <competitors>${kit.marketing_strategy.competitors || 'Not specified'}</competitors>
    <welcome_incentives>${kit.marketing_strategy.welcome_incentives || 'None'}</welcome_incentives>
    <has_review_platform>${kit.marketing_strategy.has_review_platform ? 'Yes' : 'No'}</has_review_platform>
    ${kit.marketing_strategy.review_platform ? `<review_platform>${kit.marketing_strategy.review_platform}</review_platform>` : ''}
    <international_shipping>${kit.marketing_strategy.international_shipping ? 'Yes' : 'No'}</international_shipping>
    <return_policy>${kit.marketing_strategy.return_policy || 'Not specified'}</return_policy>
  </marketing_context>
${knowledgeXml}</brand_kit>`;
}

// ============================================
// Email Type Specific Instructions
// ============================================

const EMAIL_TYPE_INSTRUCTIONS: Record<EmailType, string> = {
  welcome: `This is the FIRST email a new subscriber receives. Goals:
- Make an incredible first impression
- Introduce the brand's story and values
- Set expectations for future emails
- If there's a welcome incentive, mention it naturally
- Create excitement about being part of the community`,

  welcome_series_2: `This is the SECOND email in the welcome series (sent 1-2 days after signup). Goals:
- Deepen the brand connection
- Share the founder story or brand mission
- Highlight bestselling products
- Build trust and credibility
- Keep the welcome incentive top of mind if applicable`,

  welcome_series_3: `This is the THIRD email in the welcome series (sent 3-4 days after signup). Goals:
- Provide social proof (reviews, testimonials, press mentions)
- Create urgency if welcome offer is expiring
- Showcase product quality or craftsmanship
- Give a gentle nudge to make first purchase`,

  abandoned_cart: `Customer added items to cart but didn't complete purchase. Goals:
- Remind them what they left behind (be specific but not pushy)
- Address potential objections (shipping, returns, quality)
- Create subtle urgency without being aggressive
- Make it easy to complete the purchase
- Consider mentioning customer support if they have questions`,

  abandoned_browse: `Customer browsed products but didn't add to cart. Goals:
- Reference what they were looking at
- Highlight product benefits they may have missed
- Suggest similar or complementary items
- Be helpful, not salesy
- Offer assistance if they have questions`,

  post_purchase: `Customer just made a purchase. Goals:
- Express genuine gratitude
- Build excitement for their order arriving
- Set delivery expectations
- Introduce them to the brand community
- Avoid being too salesy - focus on appreciation`,

  review_request: `Product has been delivered, asking for a review. Goals:
- Thank them again for their purchase
- Make leaving a review feel easy and valuable
- Explain how reviews help other customers
- Be genuine, not transactional
- Consider offering a small incentive for reviewing`,

  winback: `Customer hasn't purchased in a while. Goals:
- Acknowledge it's been a while (without being guilt-trippy)
- Share what's new since they last visited
- Offer a compelling reason to come back
- Make them feel valued, not forgotten
- Consider a special "we miss you" offer`,

  promotion: `Announcing a sale or special offer. Goals:
- Create excitement without being spammy
- Clearly communicate the offer details
- Build urgency appropriately
- Stay true to brand voice (don't go generic "SALE SALE SALE")
- Make the value proposition crystal clear`,

  new_product: `Launching a new product or collection. Goals:
- Build anticipation and excitement
- Explain what makes this product special
- Connect to brand story and values
- Show how it fits customer lifestyle
- Create desire to be among the first to try`,

  back_in_stock: `Popular item is available again. Goals:
- Create urgency (it sold out before, might again)
- Remind them why this product is special
- Make it easy to buy quickly
- Consider exclusive early access angle
- Be excited but not desperate`,

  vip_exclusive: `Special offer for top customers. Goals:
- Make them feel genuinely special and valued
- Offer something meaningful (not just another discount)
- Acknowledge their loyalty
- Create exclusivity without being elitist
- Deepen the relationship`,
};

// ============================================
// Tone Modifiers
// ============================================

const TONE_MODIFIERS: Record<string, string> = {
  default: '',
  more_casual: `Adjust the tone to be MORE CASUAL than the brand's typical voice. Use conversational language, contractions, and a friendly, relaxed feel. Think "texting a friend" energy.`,
  more_formal: `Adjust the tone to be MORE FORMAL than the brand's typical voice. Use polished, professional language. Avoid slang or overly casual phrases. Think "luxury brand" energy.`,
  more_urgent: `Inject MORE URGENCY into the copy. Use time-sensitive language, emphasize scarcity or deadlines, and create a sense of "act now." But stay authentic to the brand - don't be spammy.`,
  more_playful: `Make the tone MORE PLAYFUL and fun. Use wordplay, humor, or wit where appropriate. Think "brand with personality" energy. But ensure it still feels on-brand.`,
};

// ============================================
// Length Guidelines
// ============================================

const LENGTH_GUIDELINES: Record<string, string> = {
  short: `Keep the email CONCISE. Body should be 2-3 short paragraphs max. Get to the point quickly. Perfect for mobile readers.`,
  medium: `Standard email length. Body should be 3-4 paragraphs. Enough space to tell a story but not so long they lose interest.`,
  long: `This can be a LONGER email with more storytelling. 4-6 paragraphs is fine. Use for brand stories, product launches, or when you have a lot to say.`,
};

// ============================================
// Main Prompt Builder
// ============================================

export function buildEmailPrompt(
  brand: Brand,
  kit: BrandKit,
  request: EmailGenerationRequest,
  knowledgeEntries?: KnowledgeEntry[]
): string {
  const brandContext = buildBrandKitContext(brand, kit, knowledgeEntries);
  const typeInstructions = EMAIL_TYPE_INSTRUCTIONS[request.emailType];
  const toneModifier = TONE_MODIFIERS[request.tone || 'default'];
  const lengthGuideline = LENGTH_GUIDELINES[request.maxLength || 'medium'];

  return `You are an expert email copywriter for DTC (direct-to-consumer) brands. You write emails that convert while staying authentic to each brand's unique voice and values.

${brandContext}

<email_request>
  <email_type>${request.emailType}</email_type>
  <subject_lines_needed>${request.subjectLineCount}</subject_lines_needed>
  <variations_needed>${request.variationCount}</variations_needed>
  ${request.additionalContext ? `<additional_context>${request.additionalContext}</additional_context>` : ''}
  <include_emoji>${request.includeEmoji ? 'Yes, use emoji in subject lines where it feels natural' : 'No emoji in subject lines'}</include_emoji>
</email_request>

<email_type_instructions>
${typeInstructions}
</email_type_instructions>

${toneModifier ? `<tone_adjustment>\n${toneModifier}\n</tone_adjustment>` : ''}

<length_guideline>
${lengthGuideline}
</length_guideline>

<critical_rules>
1. NEVER use generic marketing speak. No "Hey there!", "Don't miss out!", or "Act now!"
2. ALWAYS honor the brand voice description. If they say "warm and conversational" - be warm and conversational.
3. NEVER use words from the "words to avoid" list.
4. Subject lines should be specific and intriguing, not clickbait.
5. Preview text should complement (not repeat) the subject line.
6. CTAs should be action-oriented but match the brand voice.
7. Write like a human who genuinely cares about the customer, not a marketer hitting quota.
</critical_rules>

<output_format>
Return your response as JSON with this exact structure:
{
  "subject_lines": [
    {"text": "Subject line 1", "preview_text": "Preview text 1"},
    {"text": "Subject line 2", "preview_text": "Preview text 2"}
  ],
  "variations": [
    {
      "headline": "Main headline/header for the email",
      "subheader1": "First subheader - a short punchy line that introduces the main message",
      "cta1": "First call to action button text",
      "subheader2": "Second subheader - introduces the body copy section",
      "body": "The main email body copy with line breaks as \\n",
      "cta2": "Second call to action button text"
    }
  ]
}

IMPORTANT: Each variation MUST include all fields: headline, subheader1, cta1, subheader2, body, cta2
- headline: The main header (bold, attention-grabbing)
- subheader1: A short compelling line under the headline (1-2 sentences max)
- cta1: First CTA button (action-oriented)
- subheader2: Introduces the body copy section (e.g., "Their routines, their words" or "Why customers love us")
- body: The main content with testimonials, product details, or brand story
- cta2: Second CTA button (can be same or different from cta1)
</output_format>

Generate ${request.subjectLineCount} subject lines with preview text, and ${request.variationCount} email body variation(s). Each variation should have a different angle or approach while staying true to the brand.`;
}

// ============================================
// System Prompt (for LLM configuration)
// ============================================

export const EMAIL_SYSTEM_PROMPT = `You are an expert email copywriter specializing in DTC (direct-to-consumer) ecommerce brands. You have deep expertise in:

- Writing emails that convert while feeling authentic and human
- Matching brand voice and tone precisely
- Creating compelling subject lines that get opened
- Understanding customer psychology and purchase behavior
- Writing for different stages of the customer journey

You always:
- Prioritize brand authenticity over generic best practices
- Write copy that sounds like a human, not a marketing robot
- Respect the brand's words-to-avoid list
- Create multiple distinct variations when asked
- Output clean, properly formatted JSON

You never:
- Use clichéd marketing phrases
- Ignore the brand voice guidelines
- Write generic copy that could be for any brand
- Sacrifice brand voice for conversion tactics`;
