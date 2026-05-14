export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname.replace(/^\/gamerpower-api/, '');
  const target = 'https://www.gamerpower.com/api' + path + url.search;

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
    }
  });
}
