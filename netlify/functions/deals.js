// VaultDeals — Netlify Serverless Function
// GG.deals API — verified working endpoint and response format:
// GET https://api.gg.deals/v1/prices/by-steam-app-id/?key=KEY&ids=ID1,ID2&region=us
// Response: { success, data: { [steamId]: { title, url, prices: { currentRetail, historicalRetail, currentKeyshops, historicalKeyshops, currency } } } }

const GGDEALS_API_KEY = process.env.GGDEALS_API_KEY;

// Curated popular games by Steam App ID
const TRACKED_GAMES = [
  { steamId: '1245620', title: 'Elden Ring',               genre: 'Action RPG',  originalPrice: 59.99 },
  { steamId: '1086940', title: "Baldur's Gate 3",          genre: 'RPG',         originalPrice: 59.99 },
  { steamId: '1091500', title: 'Cyberpunk 2077',           genre: 'RPG',         originalPrice: 59.99 },
  { steamId: '1174180', title: 'Red Dead Redemption 2',    genre: 'Action',      originalPrice: 49.99 },
  { steamId: '1888160', title: "Marvel's Spider-Man",      genre: 'Action',      originalPrice: 59.99 },
  { steamId: '292030',  title: 'The Witcher 3',            genre: 'RPG',         originalPrice: 29.99 },
  { steamId: '1449560', title: 'Mass Effect Legendary',    genre: 'RPG',         originalPrice: 59.99 },
  { steamId: '1868140', title: 'The Last of Us Part I',    genre: 'Action',      originalPrice: 59.99 },
  { steamId: '2369390', title: 'Assassins Creed Mirage',   genre: 'Action',      originalPrice: 39.99 },
  { steamId: '632470',  title: 'Disco Elysium',            genre: 'RPG',         originalPrice: 39.99 },
  { steamId: '1109910', title: 'Control Ultimate',         genre: 'Action',      originalPrice: 39.99 },
  { steamId: '1145360', title: 'Hades',                    genre: 'Roguelike',   originalPrice: 24.99 },
  { steamId: '1113560', title: 'Alan Wake Remastered',     genre: 'Thriller',    originalPrice: 29.99 },
  { steamId: '1245170', title: 'Horizon Zero Dawn',        genre: 'Action RPG',  originalPrice: 49.99 },
  { steamId: '2183900', title: 'Hogwarts Legacy',          genre: 'RPG',         originalPrice: 59.99 },
  { steamId: '271590',  title: 'GTA V',                    genre: 'Action',      originalPrice: 29.99 },
  { steamId: '814380',  title: 'Sekiro',                   genre: 'Action',      originalPrice: 59.99 },
  { steamId: '1938090', title: 'God of War',               genre: 'Action',      originalPrice: 49.99 },
  { steamId: '1716740', title: 'Ghostwire Tokyo',          genre: 'Action',      originalPrice: 49.99 },
  { steamId: '1237970', title: 'Titanfall 2',              genre: 'FPS',         originalPrice: 29.99 },
];

// Score based on how close current price is to historical low
// historicalRetail = all-time low at retail stores
function calculateScore(current, historical) {
  if (!historical || historical <= 0) return { grade: 'C+', label: 'On sale' };
  const ratio = current / historical;
  if (ratio <= 1.05) return { grade: 'A+', label: 'At historical low' };
  if (ratio <= 1.20) return { grade: 'A',  label: 'Near historical low' };
  if (ratio <= 1.50) return { grade: 'B+', label: 'Good deal' };
  if (ratio <= 2.00) return { grade: 'B',  label: 'Decent deal' };
  return { grade: 'C+', label: 'On sale' };
}

function getBadge(grade, discountPct) {
  if (grade === 'A+') return { type: 'low',  text: 'All-time low' };
  if (grade === 'A')  return { type: 'low',  text: 'Near low' };
  if (discountPct >= 50) return { type: 'hot',  text: `-${discountPct}% off` };
  return { type: 'sale', text: `-${discountPct}% off` };
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=3600',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  if (!GGDEALS_API_KEY) {
    return { statusCode: 200, headers, body: JSON.stringify({
      success: false, message: 'API key missing', deals: getFallback()
    })};
  }

  try {
    const ids = TRACKED_GAMES.map(g => g.steamId).join(',');
    const url = `https://api.gg.deals/v1/prices/by-steam-app-id/?key=${GGDEALS_API_KEY}&ids=${ids}&region=us`;

    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error(`GG.deals ${res.status}`);

    const json = await res.json();
    if (!json.success || !json.data) throw new Error('GG.deals returned no data');

    const deals = [];

    for (const game of TRACKED_GAMES) {
      const info = json.data[game.steamId];
      if (!info || !info.prices) continue;

      const current = parseFloat(info.prices.currentRetail);
      const historical = parseFloat(info.prices.historicalRetail);
      if (!current || current <= 0) continue;

      // Only show if there's a real discount vs original price
      const discountPct = Math.round((1 - current / game.originalPrice) * 100);
      if (discountPct < 20) continue;

      const score = calculateScore(current, historical);
      const badge = getBadge(score.grade, discountPct);

      deals.push({
        id: parseInt(game.steamId),
        steamId: game.steamId,
        title: info.title || game.title,
        genre: game.genre,
        currentPrice: current.toFixed(2),
        originalPrice: game.originalPrice.toFixed(2),
        historicalLow: historical ? historical.toFixed(2) : null,
        discountPercent: discountPct,
        score: score.grade,
        scoreLabel: score.label,
        badge,
        store: 'Best retail price',
        storeUrl: info.url || `https://gg.deals/game/${game.title.toLowerCase().replace(/[\s']+/g,'-').replace(/[^a-z0-9-]/g,'')}/`,
        image: `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.steamId}/header.jpg`,
      });
    }

    // Sort: best score first, then by discount %
    const scoreOrder = ['A+','A','B+','B','C+'];
    deals.sort((a,b) => {
      const diff = scoreOrder.indexOf(a.score) - scoreOrder.indexOf(b.score);
      return diff !== 0 ? diff : b.discountPercent - a.discountPercent;
    });

    const historicalLows = deals.filter(d => ['A+','A'].includes(d.score)).slice(0,4);
    const topDeals      = deals.filter(d => ['B+','B'].includes(d.score)).slice(0,4);
    const hiddenGems    = deals.filter(d => parseFloat(d.currentPrice) <= 10).slice(0,4);
    const dealOfDay     = deals.find(d => d.image) || deals[0] || null;

    return {
      statusCode: 200, headers,
      body: JSON.stringify({
        success: true,
        lastUpdated: new Date().toISOString(),
        totalDeals: deals.length,
        dealOfDay,
        historicalLows,
        topDeals,
        hiddenGems,
        attribution: 'Prices powered by GG.deals',
      })
    };

  } catch (err) {
    console.error('GG.deals error:', err.message);
    return {
      statusCode: 200, headers,
      body: JSON.stringify({
        success: false,
        message: err.message,
        dealOfDay: getFallback()[0],
        historicalLows: getFallback(),
        topDeals: getFallback().slice(2),
        hiddenGems: [],
      })
    };
  }
};

function getFallback() {
  return [
    { id:1245620, title:'Elden Ring', genre:'Action RPG', currentPrice:'44.99', originalPrice:'59.99', historicalLow:'28.78', discountPercent:25, score:'B+', scoreLabel:'Good deal', badge:{type:'sale',text:'-25% off'}, store:'Best retail price', storeUrl:'https://gg.deals/game/elden-ring/', image:'https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/header.jpg' },
    { id:1086940, title:"Baldur's Gate 3", genre:'RPG', currentPrice:'41.99', originalPrice:'59.99', historicalLow:'35.99', discountPercent:30, score:'B+', scoreLabel:'Good deal', badge:{type:'sale',text:'-30% off'}, store:'Best retail price', storeUrl:'https://gg.deals/game/baldurs-gate-3/', image:'https://cdn.cloudflare.steamstatic.com/steam/apps/1086940/header.jpg' },
    { id:1091500, title:'Cyberpunk 2077', genre:'RPG', currentPrice:'19.99', originalPrice:'59.99', historicalLow:'17.49', discountPercent:67, score:'A', scoreLabel:'Near historical low', badge:{type:'low',text:'Near low'}, store:'Best retail price', storeUrl:'https://gg.deals/game/cyberpunk-2077/', image:'https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/header.jpg' },
    { id:1174180, title:'Red Dead Redemption 2', genre:'Action', currentPrice:'14.99', originalPrice:'49.99', historicalLow:'11.99', discountPercent:70, score:'A', scoreLabel:'Near historical low', badge:{type:'low',text:'Near low'}, store:'Best retail price', storeUrl:'https://gg.deals/game/red-dead-redemption-2/', image:'https://cdn.cloudflare.steamstatic.com/steam/apps/1174180/header.jpg' },
  ];
}
