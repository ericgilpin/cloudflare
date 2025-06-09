export default {
  async fetch(req) {
    const url = new URL(req.url);
    const q   = url.searchParams.get("q") || "";
    const api = await fetch(
      `https://api.scryfall.com/cards/autocomplete?q=${encodeURIComponent(q)}`
    );
    const { data=[] } = await api.json();
    return new Response(
      JSON.stringify([q, data, [], []]),
      { headers: { "content-type": "application/x-suggestions+json" } }
    );
  }
}
