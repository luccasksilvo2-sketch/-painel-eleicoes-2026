(() => {
  "use strict";
  const C = TurnCompare,
    $ = (id) => document.getElementById(id),
    base = "https://resultados.tse.jus.br/oficial/ele2026",
    ids = ["6257", "6258"];
  const regions = {
    Norte: "ac am ap pa ro rr to",
    Nordeste: "al ba ce ma pb pe pi rn se",
    "Centro-Oeste": "df go ms mt",
    Sudeste: "es mg rj sp",
    Sul: "pr rs sc",
  };
  const states = {
    ac: "Acre",
    al: "Alagoas",
    ap: "Amapá",
    am: "Amazonas",
    ba: "Bahia",
    ce: "Ceará",
    df: "Distrito Federal",
    es: "Espírito Santo",
    go: "Goiás",
    ma: "Maranhão",
    mt: "Mato Grosso",
    ms: "Mato Grosso do Sul",
    mg: "Minas Gerais",
    pa: "Pará",
    pb: "Paraíba",
    pr: "Paraná",
    pe: "Pernambuco",
    pi: "Piauí",
    rj: "Rio de Janeiro",
    rn: "Rio Grande do Norte",
    rs: "Rio Grande do Sul",
    ro: "Rondônia",
    rr: "Roraima",
    sc: "Santa Catarina",
    sp: "São Paulo",
    se: "Sergipe",
    to: "Tocantins",
  };
  const records = new Map(),
    cache = new Map(),
    tracking = new Map();
  let cities = [],
    catalogs = [],
    ready = false,
    busy = false,
    page = 1,
    selected = [],
    lastRows = [],
    run = 0;
  const fmt = (x) =>
    x == null
      ? "—"
      : new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(x);
  const esc = (x) =>
    String(x ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const url = (id, uf, cd = "") =>
    `${base}/${id}/dados/${uf}/${uf}${cd}-c0001-e${id.padStart(6, "0")}-u.json`;
  let active = 0;
  const waiting = [];
  async function json(url, ttl = 30000) {
    const old = cache.get(url);
    if (old && Date.now() - old.at < ttl) return old.data;
    if (active >= 3) await new Promise((r) => waiting.push(r));
    active++;
    const ctrl = new AbortController(),
      timer = setTimeout(() => ctrl.abort(), 15000);
    try {
      const r = await fetch(url, { signal: ctrl.signal, cache: "no-cache" });
      if (r.status === 304 && old) {
        old.at = Date.now();
        return old.data;
      }
      if (!r.ok) throw Error(`HTTP ${r.status}`);
      const data = await r.json();
      cache.set(url, { data, at: Date.now(), etag: r.headers.get("etag") });
      return data;
    } finally {
      clearTimeout(timer);
      active--;
      waiting.shift()?.();
    }
  }
  function place(uf, cd = "", name) {
    return {
      key: cd ? `${uf}:${cd}` : uf,
      uf,
      cd,
      name: name || states[uf] || "Brasil",
    };
  }
  function allStates() {
    return Object.keys(states).map((uf) => place(uf));
  }
  async function init() {
    if (ready) return;
    C.config(
      await json(
        "https://resultados.tse.jus.br/oficial/comum/config/ele-c.json",
        300000,
      ),
    );
    catalogs = await Promise.all(
      ids.map((id) =>
        json(
          `${base}/${id}/config/mun-e${id.padStart(6, "0")}-cm.json`,
          3600000,
        ),
      ),
    );
    if (catalogs.some((c) => !Array.isArray(c.abr)))
      throw Error("Cadastro municipal incompatível");
    cities = catalogs[0].abr
      .filter((a) => states[a.cd])
      .flatMap((a) =>
        (a.mu || []).map((m) => {
          const cd = String(m.cd);
          if (!/^\d{5}$/.test(cd)) throw Error("Código municipal TSE inválido");
          return {
            ...place(a.cd, cd, `${m.nm} / ${a.cd.toUpperCase()}`),
            inSecond: catalogs[1].abr
              .find((b) => b.cd === a.cd)
              ?.mu?.some((n) => n.cd === cd && n.cdi === m.cdi),
          };
        }),
      );
    if (new Set(cities.map((c) => c.key)).size !== cities.length)
      throw Error("Cadastro duplicado");
    ready = true;
    fillCities();
  }
  function fillCities() {
    const uf = $("cmpState").value;
    $("cmpCities").innerHTML = cities
      .filter((c) => !uf || c.uf === uf)
      .map((c) => `<option value="${esc(c.name)}"></option>`)
      .join("");
  }
  async function load(loc, force = false) {
    let rec = records.get(loc.key) || {
      ...loc,
      turns: [],
      errors: [],
      changed: [],
    };
    await Promise.all(
      ids.map(async (id, i) => {
        try {
          const hint = tracking.get(loc.key);
          if (
            i === 1 &&
            loc.cd &&
            rec.turns[1] &&
            !rec.errors[1] &&
            hint &&
            rec.hint === hint.signature &&
            Date.now() - (rec.checked || 0) < 300000 &&
            (!rec.turns[1].started || hint.started)
          )
            return;
          if (i === 1 && loc.cd && !loc.inSecond)
            throw Error("Município ausente do cadastro do segundo turno");
          const endpoint = url(id, loc.uf, loc.cd);
          if (force) cache.delete(endpoint);
          const data = C.parse(
            await json(
              endpoint,
              i === 0 && rec.turns[0]?.final ? 3600000 : 30000,
            ),
            id,
            loc.cd || loc.uf,
          );
          const prev = rec.turns[i];
          if (prev?.signature !== data.signature) rec.changed[i] = Date.now();
          rec.turns[i] = data;
          rec.errors[i] = null;
          if (i === 1) {
            rec.checked = Date.now();
            rec.hint = tracking.get(loc.key)?.signature;
          }
        } catch (e) {
          rec.errors[i] = e.message;
        }
      }),
    );
    records.set(loc.key, rec);
  }
  function filters() {
    const uf = $("cmpState").value,
      reg = $("cmpRegion").value,
      query = C.norm($("cmpCity").value.trim());
    if (query) {
      const city = cities.find(
        (c) => C.norm(c.name) === query && (!uf || c.uf === uf),
      );
      if (!city) throw Error("Selecione um município da lista de sugestões.");
      return [city];
    }
    if (uf) return [place(uf), ...cities.filter((c) => c.uf === uf)];
    if (reg) {
      const ufs = regions[reg].split(" ");
      return [
        {
          key: "region:" + reg,
          uf: "region:" + reg,
          name: reg,
          aggregate: true,
        },
        ...ufs.map((uf) => place(uf)),
        ...cities.filter((c) => ufs.includes(c.uf)),
      ];
    }
    return [place("br"), ...allStates(), ...cities];
  }
  function rows() {
    const keys = new Set(selected.map((x) => x.key)),
      which = $("cmpCandidate").value,
      search = C.norm($("cmpSearch").value);
    let list = [...records.values()]
      .filter((r) => keys.has(r.key))
      .flatMap((r) =>
        (which === "both" ? ["lula", "flavio"] : [which]).map((key) => ({
          ...C.delta(...r.turns, key),
          key,
          rec: r,
          name: key === "lula" ? "Lula" : "Flávio Bolsonaro",
        })),
      )
      .filter((r) => C.norm(r.rec.name + " " + r.name).includes(search));
    const order = $("cmpSort").value;
    list.sort((a, b) => {
      const key =
        order === "votes"
          ? "second"
          : order === "percent"
            ? "variation"
            : "diff";
      if (a[key] == null)
        return b[key] == null ? a.rec.name.localeCompare(b.rec.name) : 1;
      if (b[key] == null) return -1;
      return (
        (order === "loss" ? 1 : -1) * (a[key] - b[key]) ||
        a.rec.name.localeCompare(b.rec.name)
      );
    });
    return list;
  }
  function signed(n) {
    return n == null ? "—" : `${n > 0 ? "+" : ""}${fmt(n)}`;
  }
  function cell(n, suffix = "") {
    return `<td class="${n == null ? "cmp-neutral" : n > 0 ? "cmp-up" : n < 0 ? "cmp-down" : "cmp-neutral"}">${signed(n)}${n == null ? "" : suffix}</td>`;
  }
  function render() {
    const agg = selected.find((s) => s.aggregate);
    if (agg) {
      const ufs = regions[agg.name].split(" "),
        turns = [0, 1].map((i) =>
          C.aggregate(ufs.map((uf) => records.get(uf)?.turns[i])),
        );
      records.set(agg.key, {
        ...agg,
        turns,
        errors: ufs.flatMap((uf) => records.get(uf)?.errors || []),
        changed: [],
      });
    }
    lastRows = rows();
    const pages = Math.max(1, Math.ceil(lastRows.length / 20));
    page = Math.min(page, pages);
    $("cmpPage").textContent =
      `Página ${page}/${pages} • ${lastRows.length} linhas`;
    $("cmpPrev").disabled = page <= 1;
    $("cmpNext").disabled = page >= pages;
    $("cmpBody").innerHTML =
      lastRows
        .slice((page - 1) * 20, page * 20)
        .map(
          (r) =>
            `<tr><td>${esc(r.rec.name)}<br><small>${r.rec.turns[1]?.started ? (r.final ? "Final nos dois turnos" : "PROVISÓRIA — diferenças suspensas") : "Aguardando apuração do segundo turno"}${r.rec.errors.some(Boolean) ? " • Falha de atualização; confira os horários" : ""}</small></td><td>${r.name}</td><td>${fmt(r.first)}<br><small>${fmt(r.pct1)}% válidos</small></td><td>${fmt(r.second)}<br><small>${r.pct2 == null ? "—" : fmt(r.pct2) + "% válidos"}</small></td>${cell(r.diff)}${cell(r.variation, "%")}${cell(r.pp, " p.p.")}<td>${r.rec.turns.map((t) => (t ? `${fmt(t.sections)}% • ${t.final ? "final" : t.started ? "parcial" : "não iniciado"}<br>${esc(t.stamp || "Horário indisponível")}<br>` : "Indisponível<br>")).join("")}</td></tr>`,
        )
        .join("") ||
      '<tr><td colspan="8">Selecione uma localidade e consulte o TSE.</td></tr>';
    const visible = lastRows.slice((page - 1) * 20, page * 20);
    const max = Math.max(
      1,
      ...visible.flatMap((r) => [r.first || 0, r.second || 0]),
    );
    $("cmpBars").innerHTML = visible
      .map(
        (r) =>
          `<div class="cmp-bar"><strong>${esc(r.rec.name)} • ${r.name}</strong><div>1º: ${fmt(r.first)} <i style="width:${(100 * (r.first || 0)) / max}%"></i></div><div>2º: ${fmt(r.second)} <i class="second" style="width:${(100 * (r.second || 0)) / max}%"></i></div></div>`,
      )
      .join("");
    rankings();
    clocks();
  }
  function rankings() {
    const scope = new Set(selected.map(s => s.key));
    const metric = $("cmpRankMetric").value;
    const municipal = selected.filter((c) => c.cd),
      loaded = municipal.filter(
        (c) => records.get(c.key)?.turns[0] && records.get(c.key)?.turns[1],
      );
    $("cmpCoverage").textContent =
      `Cobertura municipal da seleção: ${loaded.length}/${municipal.length} carregados; catálogo nacional: ${cities.length} municípios. Rankings restritos às localidades carregadas e finalizadas. Não é ranking nacional completo. Municípios pendentes, parciais ou com falhas não entram.`;
    $("cmpRanks").innerHTML = ["lula", "flavio"]
      .filter(
        (k) =>
          $("cmpCandidate").value === "both" || $("cmpCandidate").value === k,
      )
      .flatMap((key) =>
        [true, false].map((gain) => {
          const eligible = [...records.values()]
            .filter(
              (r) =>
                scope.has(r.key) &&
                !r.errors.some(Boolean),
            )
            .map((r) => ({ rec: r, ...C.delta(...r.turns, key) }))
            .filter(
              (r) =>
                r.rec.cd &&
                r.final &&
                r[metric] != null &&
                (gain ? r[metric] > 0 : r[metric] < 0),
            )
            .sort((a, b) => (gain ? -1 : 1) * (a[metric] - b[metric]))
            .slice(0, 10);
          return `<article><h4>${key === "lula" ? "Lula" : "Flávio"} • maiores ${gain ? "ganhos" : "perdas"}</h4>${eligible.length ? "<ol>" + eligible.map((r) => `<li>${esc(r.rec.name)}: ${signed(r[metric])}${metric === "variation" ? "%" : " votos"}</li>`).join("") + "</ol>" : "<p>Aguardando totalização final dos dois turnos.</p>"}</article>`;
        }),
      )
      .join("");
    const sr = lastRows
      .filter(
        (r) =>
          !r.rec.cd &&
          !r.rec.aggregate &&
          r.rec.uf !== "br" &&
          r.final &&
          !r.rec.errors.some(Boolean),
      )
      .sort((a, b) => (b[metric] ?? -Infinity) - (a[metric] ?? -Infinity));
    $("cmpStateRank").innerHTML = sr.length
      ? "<ol>" +
        sr
          .map(
            (r) =>
              `<li>${esc(r.rec.name)} • ${r.name}: ${signed(r[metric])}${metric === "variation" ? "%" : " votos"}</li>`,
          )
          .join("") +
        "</ol>"
      : "Rankings estaduais definitivos aguardam finalização dos dois turnos.";
  }
  function clocks() {
    const rec =
      selected.length === 1
        ? records.get(selected[0].key)
        : records.get(
            selected.find((s) => s.aggregate)?.key ||
              $("cmpState").value ||
              "br",
          );
    $("cmpClock").textContent = rec?.turns[1]
      ? `2º turno • ${rec.turns[1].final ? "FINAL" : rec.turns[1].started ? "PROVISÓRIO" : "Aguardando apuração do segundo turno"} • ${fmt(rec.turns[1].sections)}% das seções • última totalização oficial: ${rec.turns[1].stamp || "indisponível"} (Brasília) • sem mudanças observadas nesta sessão: ${rec.changed[1] ? Math.max(0, Math.floor((Date.now() - rec.changed[1]) / 60000)) + " min" : "—"}`
      : "Aguardando apuração do segundo turno";
  }
  async function updateTracking(targets) {
    for (const uf of new Set(targets.filter((t) => t.cd).map((t) => t.uf))) {
      try {
        const d = await json(`${base}/6258/dados/${uf}/${uf}-e006258-ab.json`);
        if (
          d.ele !== "6258" ||
          d.t !== "2" ||
          d.f !== "o" ||
          !Array.isArray(d.abr)
        )
          throw Error("Acompanhamento incompatível");
        for (const a of d.abr.filter((a) => a.tpabr === "mun"))
          tracking.set(`${uf}:${a.cdabr}`, {
            signature: JSON.stringify(a),
            started: a.and !== "n",
          });
      } catch (e) {
        for (const key of tracking.keys())
          if (key.startsWith(uf + ":")) tracking.delete(key);
      }
    }
  }
  async function execute(batch = false, refresh = false) {
    if (busy) return;
    busy = true;
    const token = ++run;
    for (const id of ["cmpLoad", "cmpBatch", "cmpRefresh"])
      $(id).disabled = true;
    try {
      await init();
      selected = filters();
      const targets = refresh
        ? selected.filter((l) => !l.aggregate && records.has(l.key))
        : batch
          ? selected.filter((l) => !l.aggregate)
          : selected.filter((l) => !l.aggregate && !l.cd);
      if (!targets.length && !batch && !refresh && selected.length === 1)
        targets.push(selected[0]);
      if (refresh) await updateTracking(targets);
      $("cmpMessage").textContent =
        `Consultando ${targets.length} localidades, no máximo 3 requisições simultâneas…`;
      for (let i = 0; i < targets.length; i++) {
        if (token !== run) break;
        await load(targets[i]);
        if (i % 5 === 0 || i === targets.length - 1) {
          render();
          $("cmpMessage").textContent =
            `${i + 1}/${targets.length} localidades consultadas. ${[...records.values()].filter((r) => r.errors.some(Boolean)).length} com falha; dados anteriores preservados.`;
        }
        if (batch) await new Promise((r) => setTimeout(r, 200));
      }
      render();
      if (!targets.length)
        $("cmpMessage").textContent =
          "Municípios listados. Use Carregar municípios da seleção para consultar seus resultados.";
    } catch (e) {
      $("cmpMessage").textContent =
        `Não foi possível consultar: ${e.message}. Nenhum dado foi inventado.`;
    } finally {
      busy = false;
      for (const id of ["cmpLoad", "cmpBatch", "cmpRefresh"])
        $(id).disabled = false;
    }
  }
  $("cmpState").innerHTML =
    '<option value="">Brasil / região</option>' +
    Object.entries(states)
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([uf, n]) => `<option value="${uf}">${n}</option>`)
      .join("");
  $("cmpRegion").innerHTML =
    '<option value="">Todas as regiões</option>' +
    Object.keys(regions)
      .map((r) => `<option>${r}</option>`)
      .join("");
  $("cmpState").value = "pa";
  $("cmpCity").value = "CANAÃ DOS CARAJÁS / PA";
  $("cmpState").onchange = () => {
    $("cmpCity").value = "";
    $("cmpRegion").value = "";
    fillCities();
    execute();
  };
  $("cmpRegion").onchange = () => {
    $("cmpState").value = "";
    $("cmpCity").value = "";
    fillCities();
    execute();
  };
  $("cmpLoad").onclick = () => execute();
  $("cmpBatch").onclick = () => execute(true);
  $("cmpRefresh").onclick = () => execute(false, true);
  $("cmpStop").onclick = () => {
    run++;
    $("cmpMessage").textContent =
      "Coleta interrompida; a localidade em andamento terminará. Dados já carregados preservados.";
  };
  for (const id of ["cmpCandidate", "cmpSort", "cmpRankMetric"])
    $(id).onchange = () => {
      page = 1;
      render();
    };
  $("cmpSearch").oninput = () => {
    page = 1;
    render();
  };
  $("cmpPrev").onclick = () => {
    page--;
    render();
  };
  $("cmpNext").onclick = () => {
    page++;
    render();
  };
  $("cmpCsv").onclick = () => {
    const rows = [
      [
        "Localidade",
        "Candidato",
        "Votos 1",
        "Votos 2",
        "% válidos 1",
        "% válidos 2",
        "Diferença",
        "Variação %",
        "Diferença pp",
        "Status",
        "Horário 1 (Brasília)",
        "Horário 2 (Brasília)",
        "Seções 1 %",
        "Seções 2 %",
      ],
      ...lastRows.map((r) => [
        r.rec.name,
        r.name,
        r.first,
        r.second,
        r.pct1,
        r.pct2,
        r.diff,
        r.variation,
        r.pp,
        r.final
          ? "Final"
          : r.rec.turns[1]?.started
            ? "PROVISÓRIO"
            : "Aguardando",
        r.rec.turns[0]?.stamp,
        r.rec.turns[1]?.stamp,
        r.rec.turns[0]?.sections,
        r.rec.turns[1]?.sections,
      ]),
    ];
    const csv =
      "\ufeff" +
      rows
        .map((row) =>
          row
            .map(
              (v) =>
                '"' +
                String(v ?? "")
                  .replace(/^[=+@-]/, "'$&")
                  .replace(/"/g, '""') +
                '"',
            )
            .join(";"),
        )
        .join("\r\n");
    const a = document.createElement("a"),
      u = URL.createObjectURL(
        new Blob([csv], { type: "text/csv;charset=utf-8" }),
      );
    a.href = u;
    a.download = "comparativo-tse.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(u), 1000);
  };
  $("nav").addEventListener("click", (e) => {
    if (e.target.closest('[data-view="compare"]') && !ready) execute();
  });
  setInterval(() => {
    clocks();
    if (
      !document.hidden &&
      $("view-compare").classList.contains("active") &&
      ready &&
      !busy
    )
      execute(false, true);
  }, 30000);
})();
