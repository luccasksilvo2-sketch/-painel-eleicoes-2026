/* Funções puras. Sem resultados eleitorais ou credenciais embutidos. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object") module.exports = api;
  else root.ElectionCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  "use strict";
  function number(value) {
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    const s = String(value ?? "").trim();
    if (!s) return 0;
    const n = Number(
      s.includes(",")
        ? s.replace(/\./g, "").replace(",", ".")
        : /^\d{1,3}(\.\d{3})+$/.test(s)
          ? s.replace(/\./g, "")
          : s,
    );
    return Number.isFinite(n) ? n : 0;
  }
  function percent(value) {
    const n = number(String(value ?? "").replace("%", ""));
    return n >= 0 && n <= 100 ? n : 0;
  }
  function candidates(data) {
    const cargos = data?.carg;
    if (!Array.isArray(cargos)) return [];
    const cargo =
      cargos.find((c) => String(c.cd) === "1" || String(c.cd) === "0001") ||
      (cargos.length === 1 ? cargos[0] : null);
    return (cargo?.agr || [])
      .flatMap((a) =>
        (a.par || []).flatMap((p) =>
          (p.cand || []).map((c) => ({
            ...c,
            party: p.sg || "",
            partyName: p.nm || "",
            group: a.nm || "",
          })),
        ),
      )
      .sort(
        (a, b) =>
          number(b.vap) - number(a.vap) ||
          String(a.nmu || a.nm).localeCompare(String(b.nmu || b.nm), "pt-BR"),
      );
  }
  function validate(
    data,
    { election, turn = "2", uf, municipality, year } = {},
  ) {
    if (
      !data ||
      String(data.ele) !== String(election) ||
      String(data.t) !== String(turn)
    )
      throw Error("Arquivo de eleição ou turno incorreto");
    if (
      !Array.isArray(data.carg) ||
      !data.carg.length ||
      !candidates(data).length
    )
      throw Error("Estrutura de candidatos incompatível");
    const cargo =
      data.carg.find((c) => String(c.cd) === "1" || String(c.cd) === "0001") ||
      data.carg[0];
    if (cargo.cd == null || Number(cargo.cd) !== 1)
      throw Error("Cargo não presidencial");
    const all = candidates(data),
      ids = new Set();
    for (const c of all) {
      const v = String(c.vap ?? "");
      if (
        !/^(\d+|\d{1,3}(\.\d{3})+)$/.test(v) ||
        !Number.isSafeInteger(number(c.vap))
      )
        throw Error("Votos inválidos");
      if (!/^\d+$/.test(String(c.n)) || !String(c.nmu || c.nm || "").trim())
        throw Error("Identidade de candidato ausente");
      const id = String(c.n);
      if (ids.has(id)) throw Error("Candidato duplicado");
      ids.add(id);
      const p = number(c.pvap);
      if (
        c.pvap == null ||
        p < 0 ||
        p > 100 ||
        !/^\d+([.,]\d+)?$/.test(String(c.pvap))
      )
        throw Error("Percentual inválido");
    }
    if (
      year &&
      (!timestamp(data.dt, data.ht) || !String(data.dt).endsWith("/" + year))
    )
      throw Error("Data de totalização incompatível com a eleição");
    // Quando presentes, metadados devem concordar com o escopo solicitado.
    if (uf && data.uf && String(data.uf).toLowerCase() !== uf)
      throw Error("UF incorreta");
    if (
      municipality &&
      data.mun &&
      String(data.mun).padStart(5, "0") !== municipality
    )
      throw Error("Município incorreto");
    return data;
  }
  function electionAvailable(config, id, turn = "2") {
    if (!Array.isArray(config?.pl))
      throw Error("Configuração de eleições incompatível");
    return config.pl.some((pl) =>
      (pl.e || []).some(
        (e) => String(e.cd) === String(id) && String(e.t) === turn,
      ),
    );
  }
  function timestamp(date, time) {
    const m = String(date || "").match(/^(\d{2})\/(\d{2})\/(\d{4})$/),
      t = String(time || "").match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
    if (!m || !t || +t[1] > 23 || +t[2] > 59 || +(t[3] || 0) > 59) return null;
    const iso = `${m[3]}-${m[2]}-${m[1]}T${t[1]}:${t[2]}:${t[3] || "00"}-03:00`,
      d = new Date(iso);
    if (
      !Number.isFinite(+d) ||
      new Date(+d - 10800000).toISOString().slice(0, 10) !==
        `${m[3]}-${m[2]}-${m[1]}`
    )
      return null;
    return d;
  }
  function version(d) {
    return JSON.stringify([
      d?.idg,
      d?.dt,
      d?.ht,
      d?.s,
      d?.e,
      d?.and,
      candidates(d).map((c) => [c.n, c.vap, c.pvap]),
    ]);
  }
  function top(rows, key) {
    return [...rows]
      .sort(
        (a, b) =>
          b[key] - a[key] ||
          a.nm.localeCompare(b.nm, "pt-BR") ||
          a.cd.localeCompare(b.cd),
      )
      .slice(0, 5);
  }
  function requireCurrent(previous, next) {
    const oldTime = previous && timestamp(previous.dt, previous.ht),
      newTime = timestamp(next.dt, next.ht);
    if (oldTime && newTime && newTime < oldTime)
      throw Error("Arquivo anterior à última totalização recebida");
    return next;
  }
  function resultVersion(d) {
    return JSON.stringify([
      d?.s,
      candidates(d).map((c) => [c.n, c.vap, c.pvap]),
    ]);
  }
  return {
    requireCurrent,
    resultVersion,
    number,
    percent,
    candidates,
    validate,
    electionAvailable,
    timestamp,
    version,
    top,
  };
});
