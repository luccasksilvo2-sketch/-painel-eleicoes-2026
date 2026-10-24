(function (root, factory) {
  const api = factory();
  if (typeof module === "object") module.exports = api;
  else root.TurnCompare = api;
})(globalThis, () => {
  const num = (x) => {
    if (x == null || String(x).trim() === "") return null;
    const n =
      typeof x === "number" ? x : Number(String(x ?? "").replace(",", "."));
    return Number.isFinite(n) ? n : null;
  };
  const norm = (x) =>
    String(x)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase();
  function config(d) {
    const p = d.pl?.find((p) => p.c === "ele2026"),
      e = p?.e?.find(
        (e) =>
          e.cd === "6257" &&
          e.t === "1" &&
          e.abr?.some((a) => a.cp?.some((c) => c.cd === "1")),
      );
    if (
      !e ||
      !(
        e.cdt2 === "6258" ||
        d.pl.some(
          (p) =>
            p.c === "ele2026" &&
            p.e?.some((e) => e.cd === "6258" && e.t === "2"),
        )
      )
    )
      throw Error("Identificadores presidenciais não confirmados pelo TSE");
    return true;
  }
  function parse(d, id, scope) {
    if (
      d.ele !== id ||
      d.t !== (id === "6257" ? "1" : "2") ||
      d.f !== "o" ||
      String(d.cdabr).toLowerCase() !== scope.toLowerCase()
    )
      throw Error("Eleição, turno, origem ou localidade incompatível");
    const cargo = d.carg?.find((c) => c.cd === "1");
    if (!cargo) throw Error("Cargo presidencial ausente");
    const all = (cargo.agr || []).flatMap((a) =>
      (a.par || []).flatMap((p) => p.cand || []),
    );
    const cand = {};
    for (const [key, match] of [
      ["lula", (n) => n.includes("LULA")],
      ["flavio", (n) => n.includes("FLAVIO") && n.includes("BOLSONARO")],
    ]) {
      const c = all.find((c) => match(norm(c.nmu || c.nm)));
      if (!c) throw Error("Candidato ausente");
      const votes = num(c.vap),
        pct = num(c.pvap);
      if (
        votes === null ||
        votes < 0 ||
        !Number.isSafeInteger(votes) ||
        pct === null ||
        pct < 0 ||
        pct > 100
      )
        throw Error("Votos ou percentuais inválidos");
      cand[key] = { votes, pct };
    }
    const sections = num(d.s?.pst);
    if (sections === null || sections < 0 || sections > 100)
      throw Error("Seções inválidas");
    const started = d.and !== "n" && sections > 0;
    return {
      cand,
      valid: num(d.v?.vv) ?? all.reduce((s, c) => s + (num(c.vap) || 0), 0),
      totalSections: num(d.s.ts),
      doneSections: num(d.s.st),
      sections,
      started,
      final: d.and === "f" && sections === 100,
      stamp: d.dt && d.ht ? `${d.dt} ${d.ht}` : null,
      signature: JSON.stringify([d.s, cand]),
      idg: d.idg,
    };
  }
  function delta(a, b, key) {
    const x = a?.cand[key],
      y = b?.cand[key];
    const final = !!(a?.final && b?.final);
    return {
      first: x?.votes ?? null,
      second: b?.started ? (y?.votes ?? null) : null,
      pct1: x?.pct ?? null,
      pct2: b?.started ? (y?.pct ?? null) : null,
      diff: final ? y.votes - x.votes : null,
      variation:
        final && x.votes !== 0 ? (100 * (y.votes - x.votes)) / x.votes : null,
      pp: final ? y.pct - x.pct : null,
      final,
    };
  }
  function aggregate(list) {
    if (!list.length || list.some((x) => !x)) return null;
    const valid = list.reduce((s, x) => s + x.valid, 0),
      cand = {};
    for (const key of ["lula", "flavio"]) {
      const votes = list.reduce((s, x) => s + x.cand[key].votes, 0);
      cand[key] = { votes, pct: valid ? (100 * votes) / valid : 0 };
    }
    const totalSections = list.reduce((s, x) => s + (x.totalSections || 0), 0),
      doneSections = list.reduce((s, x) => s + (x.doneSections || 0), 0);
    return {
      cand,
      valid,
      totalSections,
      doneSections,
      sections: totalSections ? (100 * doneSections) / totalSections : 0,
      started: list.some((x) => x.started),
      final: list.every((x) => x.final),
      stamp: null,
      signature: JSON.stringify(list.map((x) => x.signature)),
    };
  }
  return { aggregate, num, norm, config, parse, delta };
});
