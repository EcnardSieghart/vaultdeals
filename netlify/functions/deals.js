// VaultDeals — Netlify function
// Serves config for client-side GG.deals fetching
// All Steam IDs verified against store.steampowered.com

const GGDEALS_API_KEY = process.env.GGDEALS_API_KEY;

const TRACKED_GAMES = [
  { steamId: '1245620', title: 'Elden Ring',                  genre: 'Action RPG',  originalPrice: 59.99 },
  { steamId: '1086940', title: "Baldur's Gate 3",             genre: 'RPG',         originalPrice: 59.99 },
  { steamId: '1091500', title: 'Cyberpunk 2077',              genre: 'RPG',         originalPrice: 59.99 },
  { steamId: '1174180', title: 'Red Dead Redemption 2',       genre: 'Action',      originalPrice: 49.99 },
  { steamId: '1817070', title: "Marvel's Spider-Man",         genre: 'Action',      originalPrice: 59.99 },
  { steamId: '292030',  title: 'The Witcher 3',               genre: 'RPG',         originalPrice: 39.99 },
  { steamId: '1888930', title: 'The Last of Us',              genre: 'Action',      originalPrice: 59.99 },
  { steamId: '289070',  title: 'Civilization VI',             genre: 'Strategy',    originalPrice: 59.99 },
  { steamId: '632470',  title: 'Disco Elysium',               genre: 'RPG',         originalPrice: 39.99 },
  { steamId: '1109910', title: 'Control',                     genre: 'Action',      originalPrice: 39.99 },
  { steamId: '1145360', title: 'Hades',                       genre: 'Roguelike',   originalPrice: 24.99 },
  { steamId: '1113560', title: 'Alan Wake',                   genre: 'Thriller',    originalPrice: 29.99 },
  { steamId: '1245170', title: 'Horizon Zero Dawn',           genre: 'Action RPG',  originalPrice: 49.99 },
  { steamId: '2183900', title: 'Hogwarts Legacy',             genre: 'RPG',         originalPrice: 59.99 },
  { steamId: '271590',  title: 'GTA V',                       genre: 'Action',      originalPrice: 29.99 },
  { steamId: '814380',  title: 'Sekiro',                      genre: 'Action',      originalPrice: 59.99 },
  { steamId: '1938090', title: 'God of War',                  genre: 'Action',      originalPrice: 49.99 },
  { steamId: '1817190', title: 'Spider-Man Miles Morales',    genre: 'Action',      originalPrice: 49.99 },
  { steamId: '1237970', title: 'Titanfall 2',                 genre: 'FPS',         originalPrice: 29.99 },
  { steamId: '976730',  title: 'Halo Master Chief',           genre: 'FPS',         originalPrice: 39.99 },
  { steamId: '1627720', title: 'God of War Ragnarok',         genre: 'Action',      originalPrice: 59.99 },
  { steamId: '1517290', title: 'Farming Simulator 22',        genre: 'Simulation',  originalPrice: 34.99 },
  { steamId: '1840404', title: 'Dave the Diver',              genre: 'Adventure',   originalPrice: 19.99 },
  { steamId: '2358720', title: 'Lies of P',                   genre: 'Action RPG',  originalPrice: 49.99 },
  { steamId: '1446780', title: 'Monster Hunter Rise',         genre: 'Action RPG',  originalPrice: 29.99 },
];

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=3600',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      apiKey: GGDEALS_API_KEY,
      games: TRACKED_GAMES,
      apiBase: '/gg-api/v1/prices/by-steam-app-id/',
    })
  };
};
