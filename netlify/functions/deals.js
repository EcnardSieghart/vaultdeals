// VaultDeals — Netlify Serverless Function
// Fetches live prices from GG.deals API using Steam App IDs
// Required attribution: prices powered by GG.deals

const GGDEALS_API_KEY = process.env.GGDEALS_API_KEY;
const ITAD_API_KEY = process.env.ITAD_API_KEY;

// Curated popular games by Steam App ID
const TRACKED_GAMES = [
  { steamId: '1245620', title: 'Elden Ring', genre: 'Action RPG', originalPrice: 59.99 },
  { steamId: '1086940', title: "Baldur's Gate 3", genre: 'RPG', originalPrice: 59.99 },
  { steamId: '1091500', title: 'Cyberpunk 2077', genre: 'RPG', originalPrice: 59.99 },
  { steamId: '1174180', title: 'Red Dead Redemption 2', genre: 'Action', originalPrice: 49.99 },
  { steamId: '1888160', title: "Marvel's Spider-Man", genre: 'Action', originalPrice: 59.99 },
  { steamId: '292030',  title: 'The Witcher 3', genre: 'RPG', originalPrice: 29.99 },
  { steamId: '1449560', title: 'Mass Effect Legendary', genre: 'RPG', originalPrice: 59.99 },
  { steamId: '1868140', title: 'The Last of Us Part I', genre: 'Action', originalPrice: 59.99 },
  { steamId: '2369390', title: 'Assassins Creed Mirage', genre: 'Action', originalPrice: 39.99 },
  { steamId: '632470',  title: 'Disco Elysium', genre: 'RPG', originalPrice: 39.99 },
  { steamId: '1109910', title: 'Control Ultimate', genre: 'Action', originalPrice: 39.99 },
  { steamId: '1145360', title: 'Hades', genre: 'Roguelike', originalPrice: 24.99 },
  { steamId: '1113560', title: 'Alan Wake Remastered', genre: 'Thriller', originalPrice: 29.99 },
  { steamId: '1245170', title: 'Horizon Zero Dawn', genre: 'Action RPG', originalPrice: 49.99 },
  { steamId: '2183900', title: 'Hogwarts Legacy', genre: 'RPG', originalPrice: 59.99 },
  { steamId: '271590',  title: 'GTA V', genre: 'Action', originalPrice: 29.99 },
  { steamId: '814380',  title: 'Sekiro', genre: 'Action', originalPrice: 59.99 },
  { steamId: '1938090', title: 'God of War', genre: 'Action', originalPrice: 49.99 },
  { steamId: '1716740', title: 'Ghostwire Tokyo', genre: 'Action', originalPrice: 49.99 },
  { steamId: '1237970', title: 'Titanfall 2', genre: 'FPS', originalPrice: 29.99 },
];

function calculateDealScore(currentPrice, originalPrice) {
  const ratio = currentPrice / originalPrice;
  if (ratio <= 0.25) return { grade: 'A+', label: 'At historical low' };
  if (ratio <= 0.40) return { grade: 'A',  label: 'Near historical low' };
  if (ratio <= 0.55) return { grade: 'B+', label: 'Good deal' };
  if (ratio <= 0.70) return { grade: 'B',  label: 'Decent deal' };
  if (ratio <= 0.85) return { grade: 'C+', label: 'Mild discount' };
  return { grade: 'C', label: 'Small discount' };
}

function getBadge(grade, discountPct) {
  if (grade === 'A+') return { type: 'low',  text: 'All-time low' };
  if (grade === 'A')  return { type: 'low',  text: 'Near low' };
  if (grade === 'B+') return { type: 'sale', text: 'Good deal' };
  if (discountPct >= 50) return { type: 'hot', text: `-${discountPct}% off` };
  return { type: 'sale', text: `-${discountPct}% off` };
}

async function fetchPrices(steamIds) {
  const url = `https://api.gg.deals/v1/prices/?key=${GGDEALS_API_KEY}&ids=${steamIds.join(',')}&region=us`;
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) throw new Error(`GG.deals ${res.status}`);
  return res.json();
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=3600',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  if (!GGDEALS_API_KEY) {
    return { statusCode: 200, headers, body: JSON.stringify({ success: false, message: 'API key missing', deals: getFallbackDeals() }) };
  }

  try {
    const steamIds = TRACKED_GAMES.map(g => g.steamId);
    const priceData = await fetchPrices(steamIds);

    if (!priceData?.data) throw new Error('No data returned');

    const deals = [];
    for (const game of TRACKED_GAMES) {
      const info = priceData.data[game.steamId];
      if (!info) continue;

      const current = parseFloat(info.prices?.currentRetail);
      if (!current || current >= game.originalPrice) continue;

      const discountPct = Math.round((1 - current / game.originalPrice) * 100);
      if (discountPct < 20) continue;

      const score = calculateDealScore(current, game.originalPrice);
      const badge = getBadge(score.grade, discountPct);

      deals.push({
        id: parseInt(game.steamId),
        steamId: game.steamId,
        title: game.title,
        genre: game.genre,
        currentPrice: current.toFixed(2),
        originalPrice: game.originalPrice.toFixed(2),
        discountPercent: discountPct,
        score: score.grade,
        scoreLabel: score.label,
        badge,
        store: 'Best price',
        storeUrl: info.urls?.game || `https://gg.deals/game/${game.title.toLowerCase().replace(/[\s']+/g,'-').replace(/[^a-z0-9-]/g,'')}/`,
        image: `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.steamId}/header.jpg`,
      });
    }

    const scoreOrder = ['A+','A','B+','B','C+','C'];
    deals.sort((a,b) => scoreOrder.indexOf(a.score) - scoreOrder.indexOf(b.score));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        lastUpdated: new Date().toISOString(),
        totalDeals: deals.length,
        dealOfDay: deals[0] || null,
        historicalLows: deals.filter(d => ['A+','A'].includes(d.score)).slice(0,4),
        topDeals: deals.filter(d => ['B+','B'].includes(d.score)).slice(0,4),
        hiddenGems: deals.filter(d => parseFloat(d.currentPrice) < 10).slice(0,4),
        attribution: 'Prices powered by GG.deals',
      })
    };

  } catch (err) {
    console.error('Error:', err.message);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: false, message: err.message, deals: getFallbackDeals() })
    };
  }
};

function getFallbackDeals() {
  return [
    { id:1245620, title:'Elden Ring', genre:'Action RPG', currentPrice:'24.99', originalPrice:'59.99', discountPercent:58, score:'A+', scoreLabel:'At historical low', badge:{type:'low',text:'All-time low'}, store:'Fanatical', storeUrl:'https://gg.deals/game/elden-ring/', image:'https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/header.jpg' },
    { id:1086940, title:"Baldur's Gate 3", genre:'RPG', currentPrice:'33.49', originalPrice:'59.99', discountPercent:44, score:'A', scoreLabel:'Near historical low', badge:{type:'low',text:'Near low'}, store:'GMG', storeUrl:'https://gg.deals/game/baldurs-gate-3/', image:'https://cdn.cloudflare.steamstatic.com/steam/apps/1086940/header.jpg' },
    { id:1091500, title:'Cyberpunk 2077', genre:'RPG', currentPrice:'19.99', originalPrice:'59.99', discountPercent:67, score:'A', scoreLabel:'Near historical low', badge:{type:'low',text:'Near low'}, store:'Humble', storeUrl:'https://gg.deals/game/cyberpunk-2077/', image:'https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/header.jpg' },
    { id:1174180, title:'Red Dead Redemption 2', genre:'Action', currentPrice:'26.99', originalPrice:'49.99', discountPercent:46, score:'B+', scoreLabel:'Good deal', badge:{type:'sale',text:'Good deal'}, store:'Fanatical', storeUrl:'https://gg.deals/game/red-dead-redemption-2/', image:'https://cdn.cloudflare.steamstatic.com/steam/apps/1174180/header.jpg' },
  ];
}
