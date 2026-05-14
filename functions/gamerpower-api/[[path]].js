// Cloudflare Pages Function — GamerPower proxy
// Handles ONLY /gamerpower-api/* requests

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname.replace('/gamerpower-api', '');
  const targetUrl = 'https://www.gamerpower.com/api' + path + url.search;

  const response = await fetch(targetUrl, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 VaultDeals/1.0',
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
