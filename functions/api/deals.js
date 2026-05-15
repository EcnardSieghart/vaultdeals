// VaultDeals — Cloudflare Pages Function
// Path: /functions/api/deals.js
// Accessible at: /api/deals
// All Steam IDs verified against store.steampowered.com URLs or GG.deals responses
// Last verified: May 2026

const TRACKED_GAMES = [

  // ── AAA ──────────────────────────────────────────────────────────
  { steamId: '1245620', title: 'Elden Ring',                   genre: 'Action RPG',      originalPrice: 59.99 },
  { steamId: '1086940', title: "Baldur's Gate 3",              genre: 'RPG',             originalPrice: 59.99 },
  { steamId: '1091500', title: 'Cyberpunk 2077',               genre: 'RPG',             originalPrice: 59.99 },
  { steamId: '1174180', title: 'Red Dead Redemption 2',        genre: 'Action',          originalPrice: 49.99 },
  { steamId: '1817070', title: "Marvel's Spider-Man",          genre: 'Action',          originalPrice: 59.99 },
  { steamId: '292030',  title: 'The Witcher 3',                genre: 'RPG',             originalPrice: 39.99 },
  { steamId: '1888930', title: 'The Last of Us Part I',        genre: 'Action',          originalPrice: 59.99 },
  { steamId: '289070',  title: 'Civilization VI',              genre: 'Strategy',        originalPrice: 59.99 },
  { steamId: '870780',  title: 'Control',                      genre: 'Action',          originalPrice: 39.99 },
  { steamId: '108710',  title: 'Alan Wake',                    genre: 'Thriller',        originalPrice: 19.99 },
  { steamId: '1151640', title: 'Horizon Zero Dawn',            genre: 'Action RPG',      originalPrice: 49.99 },
  { steamId: '990080',  title: 'Hogwarts Legacy',              genre: 'RPG',             originalPrice: 59.99 },
  { steamId: '271590',  title: 'GTA V',                        genre: 'Action',          originalPrice: 29.99 },
  { steamId: '814380',  title: 'Sekiro',                       genre: 'Action',          originalPrice: 59.99 },
  { steamId: '1593500', title: 'God of War',                   genre: 'Action',          originalPrice: 49.99 },
  { steamId: '1817190', title: 'Spider-Man Miles Morales',     genre: 'Action',          originalPrice: 49.99 },
  { steamId: '1237970', title: 'Titanfall 2',                  genre: 'FPS',             originalPrice: 29.99 },
  { steamId: '976730',  title: 'Halo Master Chief Collection', genre: 'FPS',             originalPrice: 39.99 },
  { steamId: '2322010', title: 'God of War Ragnarok',          genre: 'Action',          originalPrice: 59.99 },
  { steamId: '1868140', title: 'Dave the Diver',               genre: 'Adventure',       originalPrice: 19.99 },
  { steamId: '1627720', title: 'Lies of P',                    genre: 'Action RPG',      originalPrice: 49.99 },
  { steamId: '1446780', title: 'Monster Hunter Rise',          genre: 'Action RPG',      originalPrice: 29.99 },
  { steamId: '582010',  title: 'Monster Hunter World',         genre: 'Action RPG',      originalPrice: 29.99 },
  { steamId: '2050650', title: 'Resident Evil 4',              genre: 'Survival Horror', originalPrice: 59.99 },
  { steamId: '952060',  title: 'Resident Evil 2',              genre: 'Survival Horror', originalPrice: 39.99 },
  { steamId: '418370',  title: 'Resident Evil 7',              genre: 'Survival Horror', originalPrice: 29.99 },
  { steamId: '1716740', title: 'Starfield',                    genre: 'RPG',             originalPrice: 69.99 },
  { steamId: '377160',  title: 'Fallout 4',                    genre: 'RPG',             originalPrice: 29.99 },
  { steamId: '489830',  title: 'Skyrim Special Edition',       genre: 'RPG',             originalPrice: 39.99 },
  { steamId: '1475810', title: 'Ghostwire Tokyo',              genre: 'Action',          originalPrice: 59.99 },
  { steamId: '534380',  title: 'Dying Light 2',                genre: 'Action',          originalPrice: 59.99 },
  { steamId: '239140',  title: 'Dying Light',                  genre: 'Action',          originalPrice: 29.99 },
  { steamId: '2208920', title: 'Assassins Creed Valhalla',     genre: 'Action RPG',      originalPrice: 59.99 },
  { steamId: '812140',  title: 'Assassins Creed Odyssey',      genre: 'Action RPG',      originalPrice: 49.99 },
  { steamId: '3035570', title: 'Assassins Creed Mirage',       genre: 'Action',          originalPrice: 49.99 },
  { steamId: '1551360', title: 'Forza Horizon 5',              genre: 'Racing',          originalPrice: 59.99 },
  { steamId: '1328670', title: 'Mass Effect Legendary',        genre: 'RPG',             originalPrice: 59.99 },
  { steamId: '2358720', title: 'Black Myth Wukong',            genre: 'Action RPG',      originalPrice: 59.99 },

  // ── INDIE ────────────────────────────────────────────────────────
  { steamId: '367520',  title: 'Hollow Knight',                genre: 'Metroidvania',    originalPrice: 14.99, isIndie: true },
  { steamId: '504230',  title: 'Celeste',                      genre: 'Platformer',      originalPrice: 19.99, isIndie: true },
  { steamId: '413150',  title: 'Stardew Valley',               genre: 'Simulation',      originalPrice: 14.99, isIndie: true },
  { steamId: '1794680', title: 'Vampire Survivors',            genre: 'Roguelite',       originalPrice: 4.99,  isIndie: true },
  { steamId: '753640',  title: 'Outer Wilds',                  genre: 'Adventure',       originalPrice: 24.99, isIndie: true },
  { steamId: '632470',  title: 'Disco Elysium',                genre: 'RPG',             originalPrice: 39.99, isIndie: true },
  { steamId: '105600',  title: 'Terraria',                     genre: 'Sandbox',         originalPrice: 9.99,  isIndie: true },
  { steamId: '646570',  title: 'Slay the Spire',               genre: 'Deckbuilder',     originalPrice: 24.99, isIndie: true },
  { steamId: '892970',  title: 'Valheim',                      genre: 'Survival',        originalPrice: 19.99, isIndie: true },
  { steamId: '837470',  title: 'Untitled Goose Game',          genre: 'Puzzle',          originalPrice: 19.99, isIndie: true },
  { steamId: '264710',  title: 'Subnautica',                   genre: 'Survival',        originalPrice: 29.99, isIndie: true },
  { steamId: '590380',  title: 'Into the Breach',              genre: 'Strategy',        originalPrice: 14.99, isIndie: true },
  { steamId: '1145360', title: 'Hades',                        genre: 'Roguelite',       originalPrice: 24.99, isIndie: true },
  { steamId: '1145350', title: 'Hades II',                     genre: 'Roguelite',       originalPrice: 29.99, isIndie: true },
  { steamId: '268910',  title: 'Cuphead',                      genre: 'Platformer',      originalPrice: 19.99, isIndie: true },
  { steamId: '107100',  title: 'Bastion',                      genre: 'Action RPG',      originalPrice: 14.99, isIndie: true },
  { steamId: '237930',  title: 'Transistor',                   genre: 'Action RPG',      originalPrice: 19.99, isIndie: true },
  { steamId: '462770',  title: 'Pyre',                         genre: 'RPG',             originalPrice: 19.99, isIndie: true },
  { steamId: '653530',  title: 'Return of the Obra Dinn',      genre: 'Puzzle',          originalPrice: 19.99, isIndie: true },
  { steamId: '1135690', title: 'Unpacking',                    genre: 'Puzzle',          originalPrice: 19.99, isIndie: true },
  { steamId: '1092790', title: 'Inscryption',                  genre: 'Deckbuilder',     originalPrice: 19.99, isIndie: true },
  { steamId: '553420',  title: 'Tunic',                        genre: 'Action Adventure',originalPrice: 29.99, isIndie: true },
  { steamId: '1123450', title: 'Chicory A Colorful Tale',      genre: 'Adventure',       originalPrice: 19.99, isIndie: true },
  { steamId: '972660',  title: 'Spiritfarer',                  genre: 'Management',      originalPrice: 29.99, isIndie: true },
  { steamId: '1562430', title: 'Dredge',                       genre: 'Adventure',       originalPrice: 24.99, isIndie: true },
  { steamId: '1147560', title: 'Skul The Hero Slayer',         genre: 'Roguelite',       originalPrice: 19.99, isIndie: true },
  { steamId: '1055540', title: 'A Short Hike',                 genre: 'Adventure',       originalPrice: 7.99,  isIndie: true },
  { steamId: '1282730', title: 'Loop Hero',                    genre: 'Roguelite',       originalPrice: 14.99, isIndie: true },
  { steamId: '418530',  title: 'Spelunky 2',                   genre: 'Platformer',      originalPrice: 19.99, isIndie: true },
  { steamId: '239030',  title: 'Papers Please',                genre: 'Simulation',      originalPrice: 9.99,  isIndie: true },
  { steamId: '763890',  title: 'Wildermyth',                   genre: 'RPG',             originalPrice: 24.99, isIndie: true },
  { steamId: '1167630', title: 'Teardown',                     genre: 'Sandbox',         originalPrice: 19.99, isIndie: true },
  { steamId: '1533420', title: 'Neon White',                   genre: 'Action',          originalPrice: 19.99, isIndie: true },
  { steamId: '1369630', title: 'Ender Lilies',                 genre: 'Metroidvania',    originalPrice: 19.99, isIndie: true },
  { steamId: '874260',  title: 'The Forgotten City',           genre: 'Adventure',       originalPrice: 24.99, isIndie: true },
  { steamId: '1593030', title: 'Terra Nil',                    genre: 'Strategy',        originalPrice: 19.99, isIndie: true },
  { steamId: '1491670', title: 'Venba',                        genre: 'Adventure',       originalPrice: 14.99, isIndie: true },
  { steamId: '1082430', title: 'Before Your Eyes',             genre: 'Adventure',       originalPrice: 9.99,  isIndie: true },
  { steamId: '1578650', title: 'Citizen Sleeper',              genre: 'RPG',             originalPrice: 19.99, isIndie: true },
  { steamId: '1221250', title: 'Norco',                        genre: 'Adventure',       originalPrice: 14.99, isIndie: true },
  { steamId: '1102190', title: 'Monster Train',                genre: 'Deckbuilder',     originalPrice: 24.99, isIndie: true },
  { steamId: '250760',  title: 'Shovel Knight Treasure Trove', genre: 'Platformer',      originalPrice: 24.99, isIndie: true },
  { steamId: '477160',  title: 'Human Fall Flat',              genre: 'Puzzle',          originalPrice: 14.99, isIndie: true },
  { steamId: '964800',  title: 'Prodeus',                      genre: 'FPS',             originalPrice: 19.99, isIndie: true },

];

export async function onRequestGet(context) {
  const apiKey = context.env.GGDEALS_API_KEY;
  return new Response(JSON.stringify({
    apiKey,
    games: TRACKED_GAMES,
    apiBase: '/gg-api/v1/prices/by-steam-app-id/',
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600',
    }
  });
}
