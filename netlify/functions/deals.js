// VaultDeals — Netlify Serverless Function
// Fetches live deals from GG.deals API and calculates deal scores
// Deployed at: /.netlify/functions/deals

const GGDEALS_API_KEY = process.env.GGDEALS_API_KEY;
const ITAD_API_KEY = process.env.ITAD_API_KEY;

// Deal score calculator — the core differentiator from ITAD
// Compares current price to historical low and assigns a grade
function calculateDealScore(currentPrice, historicalLow, discountPercent) {
  if (!historicalLow || historicalLow <= 0) {
    if (discountPercent >= 70) return { grade: 'A', label: 'Great deal' };
    if (discountPercent >= 50) return { grade: 'B+', label: 'Good deal' };
    if (discountPercent >= 30) return { grade: 'B', label: 'Decent deal' };
    return { grade: 'C', label: 'Mild discount' };
  }

  const ratio = currentPrice / historicalLow;

  if (ratio <= 1.05) return { grade: 'A+', label: 'At historical low' };
  if (ratio <= 1.15) return { grade: 'A', label: 'Near historical low' };
  if (ratio <= 1.30) return { grade: 'B+', label: 'Good deal' };
  if (ratio <= 1.60) return { grade: 'B', label: 'Decent deal' };
  if (ratio <= 2.00) return { grade: 'C+', label: 'Below average' };
  return { grade: 'C', label: 'Wait for better deal' };
}

// Badge label based on score
function getBadgeType(grade) {
  if (grade === 'A+') return { type: 'low', text: 'All-time low' };
  if (grade === 'A')  return { type: 'low', text: 'Near low' };
  if (grade === 'B+') return { type: 'sale', text: 'Good deal' };
  if (grade === 'B')  return { type: 'sale', text: 'On sale' };
  return { type: 'sale', text: 'Discounted' };
}

// Fetch deals from GG.deals
async function fetchGGDeals(type = 'deals') {
  try {
    // GG.deals API endpoint for current deals
    const url = `https://api.gg.deals/v1/games/deals/?key=${GGDEALS_API_KEY}&limit=20&regions=US&sort=discount`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });

    if (!res.ok) {
      console.error('GG.deals API error:', res.status);
      return null;
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.error('GG.deals fetch failed:', err.message);
    return null;
  }
}

// Fetch historical lows from ITAD
async function fetchHistoricalLow(gameId) {
  try {
    const url = `https://api.isthereanydeal.com/games/storelow/v2?key=${ITAD_API_KEY}&id=${gameId}`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data?.data?.[gameId]?.price || null;
  } catch {
    return null;
  }
}

// Format a raw GG.deals game into our card format
function formatDeal(game, historicalLow) {
  const currentPrice = game.price?.current?.amount || 0;
  const originalPrice = game.price?.regular?.amount || 0;
  const discountPercent = game.price?.current?.discount || 0;
  const score = calculateDealScore(currentPrice, historicalLow, discountPercent);
  const badge = getBadgeType(score.grade);

  return {
    id: game.id,
    title: game.title,
    image: game.assets?.banner400 || game.assets?.banner300 || null,
    currentPrice: currentPrice.toFixed(2),
    originalPrice: originalPrice.toFixed(2),
    discountPercent: Math.round(discountPercent),
    score: score.grade,
    scoreLabel: score.label,
    badge: badge,
    store: game.deals?.[0]?.shop?.name || 'Best price',
    storeUrl: game.deals?.[0]?.url || '#',
    platforms: game.platforms || [],
    genres: game.genres || [],
  };
}

// Main handler
exports.handler = async (event) => {
  // CORS headers — allows the frontend to call this function
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Check API key is set
    if (!GGDEALS_API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'API key not configured' })
      };
    }

    const params = event.queryStringParameters || {};
    const section = params.section || 'all';

    // Fetch live deals
    const rawDeals = await fetchGGDeals();

    if (!rawDeals || !rawDeals.data) {
      // Return fallback placeholder data if API fails
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Using fallback data — API unavailable',
          deals: getFallbackDeals()
        })
      };
    }

    // Process and score each deal
    const games = rawDeals.data.slice(0, 12);
    const processedDeals = await Promise.all(
      games.map(async (game) => {
        // Fetch historical low for scoring (best effort)
        const historicalLow = await fetchHistoricalLow(game.id).catch(() => null);
        return formatDeal(game, historicalLow);
      })
    );

    // Sort by deal score for featured sections
    const scoreOrder = ['A+', 'A', 'B+', 'B', 'C+', 'C'];
    const sorted = processedDeals.sort((a, b) =>
      scoreOrder.indexOf(a.score) - scoreOrder.indexOf(b.score)
    );

    // Split into sections
    const historicalLows = sorted.filter(d => ['A+', 'A'].includes(d.score)).slice(0, 4);
    const topDeals = sorted.filter(d => ['B+', 'B'].includes(d.score)).slice(0, 4);
    const dealOfDay = sorted[0] || null;
    const hiddenGems = sorted
      .filter(d => parseFloat(d.currentPrice) < 10)
      .slice(0, 4);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        lastUpdated: new Date().toISOString(),
        dealOfDay,
        historicalLows,
        topDeals,
        hiddenGems,
        all: sorted
      })
    };

  } catch (err) {
    console.error('Function error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal error', message: err.message })
    };
  }
};

// Fallback data if API is unavailable — keeps site looking good
function getFallbackDeals() {
  return [
    {
      id: 1, title: "Elden Ring", currentPrice: "24.99", originalPrice: "59.99",
      discountPercent: 58, score: "A+", scoreLabel: "At historical low",
      badge: { type: "low", text: "All-time low" }, store: "Fanatical",
      storeUrl: "#", image: null
    },
    {
      id: 2, title: "Baldur's Gate 3", currentPrice: "33.49", originalPrice: "59.99",
      discountPercent: 44, score: "A", scoreLabel: "Near historical low",
      badge: { type: "low", text: "Near low" }, store: "Green Man Gaming",
      storeUrl: "#", image: null
    },
    {
      id: 3, title: "Cyberpunk 2077", currentPrice: "19.99", originalPrice: "59.99",
      discountPercent: 67, score: "A", scoreLabel: "Near historical low",
      badge: { type: "low", text: "Near low" }, store: "Humble Bundle",
      storeUrl: "#", image: null
    },
    {
      id: 4, title: "Red Dead Redemption 2", currentPrice: "26.99", originalPrice: "49.99",
      discountPercent: 46, score: "B+", scoreLabel: "Good deal",
      badge: { type: "sale", text: "Good deal" }, store: "Fanatical",
      storeUrl: "#", image: null
    }
  ];
}
