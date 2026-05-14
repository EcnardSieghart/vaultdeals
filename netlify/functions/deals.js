// VaultDeals — Netlify Serverless Function
// CheapShark API — free, no attribution required

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=3600',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  try {
    // Fetch sorted by Deal Rating — CheapShark's own quality score
    const res = await fetch(
      'https://www.cheapshark.com/api/1.0/deals?sortBy=DealRating&desc=1&pageSize=60&onSale=1',
      { headers: { 'Accept': 'application/json' } }
    );

    if (!res.ok) throw new Error(`CheapShark ${res.status}`);
    const raw = await res.json();
    if (!raw?.length) throw new Error('No deals returned');

    const storeNames = {
      '1':'Steam','2':'GamersGate','3':'Green Man Gaming',
      '7':'GOG','11':'Humble Bundle','15':'Fanatical',
      '23':'GameBillet','27':'Epic Games','31':'WinGameStore'
    };

    const processed = raw
      .filter(d => {
        const savings = parseFloat(d.savings);
        const normal = parseFloat(d.normalPrice);
        const current = parseFloat(d.salePrice);
        const rating = parseFloat(d.dealRating);
        // Filter: meaningful savings, real game price, decent deal rating
        return savings >= 30 && normal >= 3 && current > 0 && rating >= 5;
      })
      .map(d => {
        const current = parseFloat(d.salePrice);
        const original = parseFloat(d.normalPrice);
        const savings = parseFloat(d.savings);
        const steamRating = parseFloat(d.steamRatingPercent) || 0;
        const metacritic = parseFloat(d.metacriticScore) || 0;
        const dealRating = parseFloat(d.dealRating) || 0;

        // Score based on savings % + deal rating combined
        let grade, label;
        if (savings >= 75 || (savings >= 60 && dealRating >= 9))
          { grade = 'A+'; label = 'Exceptional deal'; }
        else if (savings >= 60 || (savings >= 45 && dealRating >= 8))
          { grade = 'A';  label = 'Near historical low'; }
        else if (savings >= 45 || dealRating >= 7)
          { grade = 'B+'; label = 'Good deal'; }
        else
          { grade = 'B';  label = 'Decent deal'; }

        let badge;
        if (grade === 'A+')     badge = { type: 'low',  text: 'Best deal' };
        else if (grade === 'A') badge = { type: 'low',  text: 'Near low' };
        else if (savings >= 50) badge = { type: 'hot',  text: `-${Math.round(savings)}% off` };
        else                    badge = { type: 'sale', text: `-${Math.round(savings)}% off` };

        let genre = 'On Sale';
        if (steamRating >= 90)      genre = 'Highly Rated';
        else if (steamRating >= 80) genre = 'Well Reviewed';
        else if (metacritic >= 80)  genre = 'Critically Acclaimed';

        return {
          id: d.dealID,
          steamId: d.steamAppID || null,
          title: d.title,
          genre,
          currentPrice: current.toFixed(2),
          originalPrice: original.toFixed(2),
          discountPercent: Math.round(savings),
          score: grade,
          scoreLabel: label,
          badge,
          store: storeNames[d.storeID] || 'Best price',
          storeUrl: `https://www.cheapshark.com/redirect?dealID=${d.dealID}`,
          image: d.steamAppID
            ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${d.steamAppID}/header.jpg`
            : null,
          steamRating: Math.round(steamRating),
          dealRating: dealRating.toFixed(1),
        };
      });

    // Sort by grade then savings
    const scoreOrder = ['A+','A','B+','B','C+','C'];
    processed.sort((a,b) => {
      const scoreDiff = scoreOrder.indexOf(a.score) - scoreOrder.indexOf(b.score);
      return scoreDiff !== 0 ? scoreDiff : b.discountPercent - a.discountPercent;
    });

    const historicalLows = processed.filter(d => ['A+','A'].includes(d.score)).slice(0,4);
    const topDeals = processed.filter(d => ['B+','B'].includes(d.score)).slice(0,4);
    const hiddenGems = processed.filter(d => parseFloat(d.currentPrice) <= 10 && d.steamId).slice(0,4);
    const dealOfDay = processed.find(d => d.image) || processed[0] || null;

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
    { id:'1', title:'Elden Ring', genre:'Highly Rated', currentPrice:'24.99', originalPrice:'59.99', discountPercent:58, score:'A+', scoreLabel:'Exceptional deal', badge:{type:'low',text:'Best deal'}, store:'Fanatical', storeUrl:'https://www.cheapshark.com', image:'https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/header.jpg', steamRating:96 },
    { id:'2', title:"Baldur's Gate 3", genre:'Highly Rated', currentPrice:'33.49', originalPrice:'59.99', discountPercent:44, score:'A', scoreLabel:'Near historical low', badge:{type:'low',text:'Near low'}, store:'GMG', storeUrl:'https://www.cheapshark.com', image:'https://cdn.cloudflare.steamstatic.com/steam/apps/1086940/header.jpg', steamRating:97 },
    { id:'3', title:'Cyberpunk 2077', genre:'Highly Rated', currentPrice:'19.99', originalPrice:'59.99', discountPercent:67, score:'A', scoreLabel:'Near historical low', badge:{type:'low',text:'Near low'}, store:'Humble', storeUrl:'https://www.cheapshark.com', image:'https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/header.jpg', steamRating:88 },
    { id:'4', title:'Red Dead Redemption 2', genre:'Well Reviewed', currentPrice:'26.99', originalPrice:'49.99', discountPercent:46, score:'B+', scoreLabel:'Good deal', badge:{type:'sale',text:'Good deal'}, store:'Fanatical', storeUrl:'https://www.cheapshark.com', image:'https://cdn.cloudflare.steamstatic.com/steam/apps/1174180/header.jpg', steamRating:83 },
  ];
}
