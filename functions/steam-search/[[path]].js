// VaultDeals — Cloudflare Pages Function
// Path: /functions/steam-search/[[path]].js
// Proxies /steam-search/* to store.steampowered.com/api/storesearch/*
// Needed because Steam store API has CORS restrictions on browser requests.

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const target = 'https://store.steampowered.com/api/storesearch/' + url.search;

  const res = await fetch(target, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'VaultDeals/1.0'
    }
  });

  const body = await res.text();

  return new Response(body, {
    status: res.status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300', // 5 min cache — search results don't change that fast
    }
  });
}
