/* Política de consultas do placar. Não contém resultados eleitorais. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object") module.exports = api;
  else root.LivePoll = api;
})(globalThis, () => {
  const NORMAL = 10,
    UNAVAILABLE = 300,
    RECHECK = 300000;
  function signature(d) {
    return JSON.stringify([d.idg, d.dt, d.ht, d.and, d.s, d.e, d.carg]);
  }
  function tracker(d, ufs) {
    if (d.ele !== "6258" || d.t !== "2" || d.f !== "o" || !Array.isArray(d.abr))
      throw Error("Acompanhamento nacional incompatível");
    const map = new Map();
    for (const a of d.abr) {
      if (a.tpabr !== "uf" || !ufs.includes(a.cdabr)) continue;
      if (map.has(a.cdabr)) throw Error("UF duplicada no acompanhamento");
      map.set(a.cdabr, JSON.stringify(a));
    }
    if (map.size !== ufs.length)
      throw Error("Acompanhamento nacional incompleto");
    return map;
  }
  function retrySeconds(value, now = Date.now()) {
    if (!value) return 0;
    const n = Number(value);
    return Number.isFinite(n)
      ? Math.max(0, n)
      : Math.max(0, Math.ceil((Date.parse(value) - now) / 1000)) || 0;
  }
  function backoff(failures) {
    return Math.min(300, 60 * 2 ** Math.min(Math.max(0, failures - 1), 3));
  }
  function due({
    loaded,
    previous,
    current,
    checked = 0,
    now = Date.now(),
    force = false,
  }) {
    return force || !loaded || previous !== current || now - checked >= RECHECK;
  }
  function client(fetcher = fetch, now = () => Date.now()) {
    let blockedUntil = 0;
    async function json(url) {
      if (now() < blockedUntil)
        throw Error("Aguardando intervalo solicitado pelo TSE");
      const ctrl = new AbortController(),
        timer = setTimeout(() => ctrl.abort(), 15000);
      try {
        const r = await fetcher(url, {
          cache: "no-cache",
          signal: ctrl.signal,
        });
        if (!r.ok) {
          const wait = retrySeconds(r.headers.get("Retry-After"), now());
          if (r.status === 429 || r.status === 403 || r.status === 503 || wait)
            blockedUntil = Math.max(
              blockedUntil,
              now() +
                1000 *
                  Math.max(
                    wait,
                    r.status === 403 || r.status === 429 ? 300 : 60,
                  ),
            );
          throw Error(`HTTP ${r.status}`);
        }
        return await r.json();
      } finally {
        clearTimeout(timer);
      }
    }
    return {
      json,
      remaining: () => Math.max(0, Math.ceil((blockedUntil - now()) / 1000)),
    };
  }
  return {
    NORMAL,
    UNAVAILABLE,
    RECHECK,
    signature,
    tracker,
    retrySeconds,
    backoff,
    due,
    client,
  };
});
