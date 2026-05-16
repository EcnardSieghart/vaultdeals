export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const path = url.pathname.replace('/steam-api', '');
  const search = url.search;
  const target = `https://store.steampowered.com${path}${search}`;

  const res = await fetch(target, {
    headers: { 'Accept': 'application/json', 'Accept-Language': 'en-US,en;q=0.9' }
  });

  const data = await res.text();
  return new Response(data, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300',
    }
  });
}
