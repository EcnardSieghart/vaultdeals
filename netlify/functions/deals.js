// VaultDeals — Netlify Serverless Function
// Primary: CheapShark API (free, no attribution, no network blocks)
// Covers: Steam, GOG, Humble, GreenManGaming, Fanatical and more

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=3600',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  try {
    // Fetch top deals from CheapShark — sorted by Deal Rating (0-10)
    // storeID list: 1=Steam, 2=GamersGate, 3=GreenManGaming, 7=GOG, 11=Humble, 15=Fanatical, 27=Epic
    const params = new URLSearchParams({
      upperPrice: 60,
      sortBy: 'DealRating',
      desc: 1,
      pageSize: 40,
      onSale: 1,
      steamRating: 70, // Only well-reviewed games
    });

    const res = await fetch(`https://www.cheapshark.com/api/1.0/deals?${params}`, {
      headers: { 'Accept': 'application/json' }
    });

    if (!res.ok) throw new Error(`CheapShark ${res.status}`);
    const deals = await res.json();

    if (!deals?.length) throw new Error('No deals returned');

    // Process and score each deal
    const processed = deals
      .filter(d => parseFloat(d.salePrice) > 0)
      .map(d => {
        const current = parseFloat(d.salePrice);
        const original = parseFloat(d.normalPrice);
        const savings = parseFloat(d.savings);
        const rating = parseFloat(d.dealRating);
        const steamRating = parseFloat(d.steamRatingPercent) || 0;

        // Deal score based on savings % and deal rating
        let grade, label;
        if (savings >= 75 && rating >= 9) { grade = 'A+'; label = 'Exceptional deal'; }
        else if (savings >= 60 && rating >= 8) { grade = 'A';  label = 'Near historical low'; }
        else if (savings >= 50 && rating >= 7) { grade = 'B+'; label = 'Good deal'; }
        else if (savings >= 35 && rating >= 6) { grade = 'B';  label = 'Decent deal'; }
        else if (savings >= 20) { grade = 'C+'; label = 'Mild discount'; }
        else { grade = 'C'; label = 'Small discount'; }

        // Badge
        let badge;
        if (grade === 'A+') badge = { type: 'low',  text: 'Best deal' };
        else if (grade === 'A')  badge = { type: 'low',  text: 'Near low' };
        else if (savings >= 50)  badge = { type: 'hot',  text: `-${Math.round(savings)}% off` };
        else                     badge = { type: 'sale', text: `-${Math.round(savings)}% off` };

        // Store name mapping
        const storeNames = {
          '1': 'Steam', '2': 'GamersGate', '3': 'Green Man Gaming',
          '7': 'GOG', '11': 'Humble Bundle', '15': 'Fanatical',
          '23': 'GameBillet', '27': 'Epic Games', '31': 'WinGameStore'
        };
        const storeName = storeNames[d.storeID] || 'Best price';

        // Build store URL via CheapShark redirect (they handle the affiliate)
        const storeUrl = `https://www.cheapshark.com/redirect?dealID=${d.dealID}`;

        // Steam header image if available
        const image = d.steamAppID
          ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${d.steamAppID}/header.jpg`
          : null;

        return {
          id: d.dealID,
          steamId: d.steamAppID || null,
          title: d.title,
          genre: steamRating >= 90 ? 'Highly Rated' : steamRating >= 75 ? 'Well Reviewed' : 'On Sale',
          currentPrice: current.toFixed(2),
          originalPrice: original.toFixed(2),
          discountPercent: Math.round(savings),
          score: grade,
          scoreLabel: label,
          badge,
          store: storeName,
          storeUrl,
          image,
          steamRating: Math.round(steamRating),
          dealRating: rating.toFixed(1),
        };
      });

    // Sort by score
    const scoreOrder = ['A+','A','B+','B','C+','C'];
    processed.sort((a,b) => scoreOrder.indexOf(a.score) - scoreOrder.indexOf(b.score));

    const dealOfDay = processed[0] || null;
    const historicalLows = processed.filter(d => ['A+','A'].includes(d.score)).slice(0, 4);
    const topDeals = processed.filter(d => ['B+','B'].includes(d.score)).slice(0, 4);
    const hiddenGems = processed.filter(d => parseFloat(d.currentPrice) <= 10).slice(0, 4);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        lastUpdated: new Date().toISOString(),
        totalDeals: processed.length,
        dealOfDay,
        historicalLows,
        topDeals,
        hiddenGems,
      })
    };

  } catch (err) {
    console.error('Error:', err.message);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: false,
        message: err.message,
        dealOfDay: null,
        historicalLows: getFallback(),
        topDeals: getFallback(),
        hiddenGems: [],
      })
    };
  }
};

function getFallback() {
  return [
    { id:'1', title:'Elden Ring', genre:'Action RPG', currentPrice:'24.99', originalPrice:'59.99', discountPercent:58, score:'A+', scoreLabel:'Exceptional deal', badge:{type:'low',text:'Best deal'}, store:'Fanatical', storeUrl:'https://www.cheapshark.com', image:'https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/header.jpg' },
    { id:'2', title:"Baldur's Gate 3", genre:'RPG', currentPrice:'33.49', originalPrice:'59.99', discountPercent:44, score:'A', scoreLabel:'Near historical low', badge:{type:'low',text:'Near low'}, store:'GMG', storeUrl:'https://www.cheapshark.com', image:'https://cdn.cloudflare.steamstatic.com/steam/apps/1086940/header.jpg' },
    { id:'3', title:'Cyberpunk 2077', genre:'RPG', currentPrice:'19.99', originalPrice:'59.99', discountPercent:67, score:'A', scoreLabel:'Near historical low', badge:{type:'low',text:'Near low'}, store:'Humble', storeUrl:'https://www.cheapshark.com', image:'https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/header.jpg' },
    { id:'4', title:'Red Dead Redemption 2', genre:'Action', currentPrice:'26.99', originalPrice:'49.99', discountPercent:46, score:'B+', scoreLabel:'Good deal', badge:{type:'sale',text:'Good deal'}, store:'Fanatical', storeUrl:'https://www.cheapshark.com', image:'https://cdn.cloudflare.steamstatic.com/steam/apps/1174180/header.jpg' },
  ];
}
