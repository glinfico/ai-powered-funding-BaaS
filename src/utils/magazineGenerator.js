// Native Glinfico Magazine Generator
export async function generateMagazineArticle(topic, publication) {
  try {
    const response = await fetch('/api/magazine/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, publication })
    });
    
    if (!response.ok) throw new Error('Failed to generate magazine article');
    return await response.json();
  } catch (error) {
    console.error("Magazine generation error:", error);
    return { success: false, error: error.message };
  }
}

export async function fetchMagazineArticles(publication) {
  try {
    const response = await fetch(`/api/magazine/articles?publication=${publication || ''}`);
    if (!response.ok) throw new Error('Failed to fetch articles');
    return await response.json();
  } catch (error) {
    console.error("Error fetching articles:", error);
    return [];
  }
}

// Compatibility exports used by CapitalDigest.jsx
export async function loadLatestArticles(publication) {
  return fetchMagazineArticles(publication);
}

export async function hasTodaysArticles(publication) {
  const articles = await fetchMagazineArticles(publication);
  return Array.isArray(articles) && articles.length > 0;
}

export async function generateDailyArticles(publication) {
  return generateMagazineArticle("Daily Market Update", publication);
}
