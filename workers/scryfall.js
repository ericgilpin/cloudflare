export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    const q   = url.searchParams.get("q") || "";

    // Abort early if the user didn’t type anything
    if (!q) {
      return new Response(JSON.stringify([q, [], [], []]), {
        headers: { "content-type": "application/x-suggestions+json" },
        status: 400,
      });
    }

    // Build the outbound request with REQUIRED headers
    const apiReq = new Request(
      `https://api.scryfall.com/cards/autocomplete?q=${encodeURIComponent(q)}`,
      {
        headers: {
          "User-Agent":
            "ScryfallAutocompleteProxy/0.1 (+https://github.com/eric-gilpin/cloudflare)",
          "Accept": "application/json",
        },
      },
    );

    // Optional: short‑circuit Cloudflare’s default cache (<‑ blazing fast)
    const cache = caches.default;
    let apiRes = await cache.match(apiReq);

    if (!apiRes) {
      apiRes = await fetch(apiReq);
      // Cache *successful* look‑ups for one day
      if (apiRes.ok) {
        ctx.waitUntil(cache.put(apiReq, apiRes.clone()));
      }
    }

    const json = await apiRes.json();
    const suggestions = Array.isArray(json.data) ? json.data : [];

    return new Response(JSON.stringify([q, suggestions, [], []]), {
      headers: {
        "content-type": "application/x-suggestions+json",
        "Cache-Control": "public, max-age=86400",
      },
    });
  },
};
