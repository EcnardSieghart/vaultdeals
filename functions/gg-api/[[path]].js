// Cloudflare Pages Function — GG.deals proxy
// Handles /gg-api/* and forwards to api.gg.deals/*

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const targetUrl = 'https://api.gg.deals' + url.pathname.replace('/gg-api', '') + url.search;

  const response = await fetch(targetUrl, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'VaultDeals/1.0',
    }
  });

  const data = await response.text();

  return new Response(data, {
    status: response.status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600',
    }
  });
}
