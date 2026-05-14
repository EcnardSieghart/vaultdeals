// VaultDeals — Cloudflare Pages Function
// Path: /functions/cheapshark-api/[[path]].js
// Proxies /cheapshark-api/* to www.cheapshark.com/api/1.0/*
// CheapShark only indexes legitimate stores (Steam, GOG, Humble, GMG, Fanatical)
// so adult content is naturally absent from all results.

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname.replace(/^\/cheapshark-api/, '');
  const target = 'https://www.cheapshark.com/api/1.0' + path + url.search;

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
      'Cache-Control': 'public, max-age=300',
    }
  });
}
