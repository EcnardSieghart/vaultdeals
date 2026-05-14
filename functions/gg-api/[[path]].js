export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname.replace(/^\/gg-api/, '');
  const target = 'https://api.gg.deals' + path + url.search;
  
  console.log('GG proxy target:', target);
  
  const res = await fetch(target, {
    headers: { 'Accept': 'application/json', 'User-Agent': 'VaultDeals/1.0' }
  });
  const body = await res.text();
  return new Response(body, {
    status: res.status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600',
      'X-Proxy-Target': target
    }
  });
}
