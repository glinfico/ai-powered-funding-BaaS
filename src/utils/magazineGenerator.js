import { base44 } from "@/api/base44Client";
import { format } from "date-fns";

const AUTHORS = ["Diana Cross", "Priya Nair", "Lena Marchetti", "James Holden", "Sofia Reyes"];

const CATEGORIES = [
  "finance",
  "economy",
  "insurance",
  "retirement",
  "travel",
  "business consulting",
];

// Category → Unsplash image fallbacks
const CATEGORY_IMAGES = {
  finance: [
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
    "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&q=80",
  ],
  economy: [
    "https://images.unsplash.com/photo-1444653614773-995cb1ef9efa?w=800&q=80",
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
  ],
  insurance: [
    "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80",
    "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&q=80",
  ],
  retirement: [
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80",
    "https://images.unsplash.com/photo-1559526324-593bc073d938?w=800&q=80",
  ],
  travel: [
    "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80",
    "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80",
  ],
  "business consulting": [
    "https://images.unsplash.com/photo-1553484771-047a44eee27b?w=800&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
  ],
};

function getFallbackImage(category) {
  const imgs = CATEGORY_IMAGES[category] || CATEGORY_IMAGES["finance"];
  return imgs[Math.floor(Math.random() * imgs.length)];
}

function randomAuthor() {
  return AUTHORS[Math.floor(Math.random() * AUTHORS.length)];
}

/**
 * Generate one article per category for a given publication.
 * publication: "finventure" | "capital_digest"
 */
export async function generateDailyArticles(onProgress, publication = "finventure") {
  const today = format(new Date(), "yyyy-MM-dd");
  const todayDisplay = format(new Date(), "MMM d, yyyy");
  const results = [];

  const pubLabel = publication === "capital_digest" ? "FinVenture Pro: Capital Digest" : "FinVenture Pro";

  for (let i = 0; i < CATEGORIES.length; i++) {
    const category = CATEGORIES[i];
    if (onProgress) onProgress({ step: i + 1, total: CATEGORIES.length, category });

    const articleResult = await base44.integrations.Core.InvokeLLM({
      model: "gemini_3_flash",
      add_context_from_internet: true,
      prompt: `You are Diana Cross, executive editor at ${pubLabel} — powered by GLINFICO Financial Operations.

Today is ${todayDisplay}. Search Bloomberg, Reuters, Wall Street Journal, AP, and Financial Times for the LATEST real financial headlines and data in the category: "${category}".

Write ONE premium, data-driven magazine article in the style of Bloomberg Businessweek. The article must:
- Be grounded in REAL current events and real data points from today's news (cite specific figures, percentages, company names)
- Have a bold, specific headline with real numbers (e.g. "$4.7 Trillion", "34%", "Q3 2026")
- Feel authoritative and executive-level — not generic
- Include at minimum 3 specific data points, statistics, or named companies/institutions
- Excerpt: a compelling 2-sentence hook
- Body: 4–6 full paragraphs of substantive editorial content
- Suggest a brief image prompt for a professional financial news photograph

Respond as JSON matching this exact schema:
{
  "headline": "string",
  "excerpt": "string",
  "body": "string (full article, paragraph breaks with \\n\\n)",
  "image_prompt": "string (describe a professional financial photograph suitable for this article)"
}`,
      response_json_schema: {
        type: "object",
        properties: {
          headline: { type: "string" },
          excerpt: { type: "string" },
          body: { type: "string" },
          image_prompt: { type: "string" },
        },
        required: ["headline", "excerpt", "body", "image_prompt"],
      },
    });

    let imageUrl = getFallbackImage(category);
    try {
      const imgResult = await base44.integrations.Core.GenerateImage({
        prompt: `${articleResult.image_prompt}. Professional financial news photography, editorial magazine style, high quality, clean composition, suitable for Bloomberg Businessweek cover story.`,
      });
      if (imgResult?.url) imageUrl = imgResult.url;
    } catch {
      imageUrl = getFallbackImage(category);
    }

    const isHero = i === CATEGORIES.indexOf("business consulting");
    const isEditorsPick = i < 3;

    const record = await base44.entities.MagazineArticle.create({
      publication,
      category,
      headline: articleResult.headline,
      excerpt: articleResult.excerpt,
      body: articleResult.body,
      author: randomAuthor(),
      image_url: imageUrl,
      image_prompt: articleResult.image_prompt,
      published_date: today,
      is_hero: isHero,
      is_editors_pick: isEditorsPick,
      generation_status: "generated",
      source_context: "Generated via Gemini + live Bloomberg/Reuters/WSJ web context",
    });

    results.push(record);
  }

  return results;
}

/**
 * Check if articles have already been generated today for a given publication.
 */
export async function hasTodaysArticles(publication = "finventure") {
  const today = format(new Date(), "yyyy-MM-dd");
  const existing = await base44.entities.MagazineArticle.filter({
    published_date: today,
    publication,
  });
  return existing.length >= CATEGORIES.length;
}

/**
 * Load today's articles for a publication (fallback to most recent batch).
 */
export async function loadLatestArticles(publication = "finventure") {
  const today = format(new Date(), "yyyy-MM-dd");
  let articles = await base44.entities.MagazineArticle.filter({
    published_date: today,
    publication,
  });
  if (!articles.length) {
    // Fallback: most recent articles for this publication
    articles = await base44.entities.MagazineArticle.filter({ publication }, "-created_date", 12);
    if (!articles.length) {
      // Legacy fallback: articles with no publication set (pre-migration)
      articles = await base44.entities.MagazineArticle.list("-created_date", 12);
    }
  }
  return articles;
}