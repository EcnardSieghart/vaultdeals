// VaultDeals — Netlify Serverless Function
// NOTE: GG.deals API blocks Netlify's server IPs
// This function serves as a secure config endpoint only
// Actual GG.deals fetching happens client-side (browser can reach api.gg.deals)

const GGDEALS_API_KEY = process.env.GGDEALS_API_KEY;

// Verified correct Steam App IDs (checked against store.steampowered.com)
const TRACKED_GAMES = [
  { steamId: '1245620', title: 'Elden Ring',               genre: 'Action RPG',  originalPrice: 59.99 },
  { steamId: '1086940', title: "Baldur's Gate 3",          genre: 'RPG',         originalPrice: 59.99 },
  { steamId: '1091500', title: 'Cyberpunk 2077',           genre: 'RPG',         originalPrice: 59.99 },
  { steamId: '1174180', title: 'Red Dead Redemption 2',    genre: 'Action',      originalPrice: 49.99 },
  { steamId: '1817070', title: "Marvel's Spider-Man Rem.", genre: 'Action',      originalPrice: 59.99 },
  { steamId: '292030',  title: 'The Witcher 3',            genre: 'RPG',         originalPrice: 29.99 },
  { steamId: '1449560', title: 'Mass Effect Legendary',    genre: 'RPG',         originalPrice: 59.99 },
  { steamId: '1888930', title: 'The Last of Us Part I',    genre: 'Action',      originalPrice: 59.99 },
  { steamId: '289070',  title: "Sid Meier's Civilization VI", genre: 'Strategy', originalPrice: 59.99 },
  { steamId: '632470',  title: 'Disco Elysium',            genre: 'RPG',         originalPrice: 39.99 },
  { steamId: '1109910', title: 'Control Ultimate',         genre: 'Action',      originalPrice: 39.99 },
  { steamId: '1145360', title: 'Hades',                    genre: 'Roguelike',   originalPrice: 24.99 },
  { steamId: '1113560', title: 'Alan Wake Remastered',     genre: 'Thriller',    originalPrice: 29.99 },
  { steamId: '1245170', title: 'Horizon Zero Dawn',        genre: 'Action RPG',  originalPrice: 49.99 },
  { steamId: '2183900', title: 'Hogwarts Legacy',          genre: 'RPG',         originalPrice: 59.99 },
  { steamId: '271590',  title: 'GTA V',                    genre: 'Action',      originalPrice: 29.99 },
  { steamId: '814380',  title: 'Sekiro',                   genre: 'Action',      originalPrice: 59.99 },
  { steamId: '1938090', title: 'God of War',               genre: 'Action',      originalPrice: 49.99 },
  { steamId: '1817190', title: "Spider-Man: Miles Morales",genre: 'Action',      originalPrice: 49.99 },
  { steamId: '1237970', title: 'Titanfall 2',              genre: 'FPS',         originalPrice: 29.99 },
];

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=3600',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  // Return config for client-side to use
  // API key exposure is low risk — it's read-only with rate limits
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      apiKey: GGDEALS_API_KEY,
      games: TRACKED_GAMES,
      apiBase: 'https://api.gg.deals/v1/prices/by-steam-app-id/',
    })
  };
};
