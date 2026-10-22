(() => {
  "use strict";
  const BASE26 = "https://resultados.tse.jus.br/oficial/ele2026";
  const PRES26 = { e: "6258", uf: "br", c: "0001" };
  const PRES26_FIRST = "6257";
  const ELECTION_DAY = "25/10/2026";
  const BASE22 =
    "https://resultados.tse.jus.br/oficial/ele2022/544/dados-simplificados";
  const UFS = [
    { uf: "rr", sigla: "RR", nome: "Roraima", reg: "Norte", x: 4, y: 1 },
    { uf: "ap", sigla: "AP", nome: "Amapá", reg: "Norte", x: 8, y: 1 },
    { uf: "am", sigla: "AM", nome: "Amazonas", reg: "Norte", x: 3, y: 3 },
    { uf: "pa", sigla: "PA", nome: "Pará", reg: "Norte", x: 7, y: 3 },
    { uf: "ac", sigla: "AC", nome: "Acre", reg: "Norte", x: 1, y: 5 },
    { uf: "ro", sigla: "RO", nome: "Rondônia", reg: "Norte", x: 2, y: 5 },
    { uf: "to", sigla: "TO", nome: "Tocantins", reg: "Norte", x: 7, y: 5 },
    { uf: "ma", sigla: "MA", nome: "Maranhão", reg: "Nordeste", x: 8, y: 4 },
    { uf: "pi", sigla: "PI", nome: "Piauí", reg: "Nordeste", x: 9, y: 4 },
    { uf: "ce", sigla: "CE", nome: "Ceará", reg: "Nordeste", x: 10, y: 4 },
    {
      uf: "rn",
      sigla: "RN",
      nome: "Rio Grande do Norte",
      reg: "Nordeste",
      x: 10,
      y: 3,
    },
    { uf: "pb", sigla: "PB", nome: "Paraíba", reg: "Nordeste", x: 10, y: 5 },
    { uf: "pe", sigla: "PE", nome: "Pernambuco", reg: "Nordeste", x: 9, y: 5 },
    { uf: "al", sigla: "AL", nome: "Alagoas", reg: "Nordeste", x: 9, y: 6 },
    { uf: "se", sigla: "SE", nome: "Sergipe", reg: "Nordeste", x: 10, y: 6 },
    { uf: "ba", sigla: "BA", nome: "Bahia", reg: "Nordeste", x: 8, y: 6 },
    {
      uf: "mt",
      sigla: "MT",
      nome: "Mato Grosso",
      reg: "Centro-Oeste",
      x: 4,
      y: 6,
    },
    {
      uf: "ms",
      sigla: "MS",
      nome: "Mato Grosso do Sul",
      reg: "Centro-Oeste",
      x: 4,
      y: 8,
    },
    { uf: "go", sigla: "GO", nome: "Goiás", reg: "Centro-Oeste", x: 6, y: 7 },
    {
      uf: "df",
      sigla: "DF",
      nome: "Distrito Federal",
      reg: "Centro-Oeste",
      x: 7,
      y: 7,
    },
    { uf: "mg", sigla: "MG", nome: "Minas Gerais", reg: "Sudeste", x: 7, y: 8 },
    {
      uf: "es",
      sigla: "ES",
      nome: "Espírito Santo",
      reg: "Sudeste",
      x: 9,
      y: 8,
    },
    {
      uf: "rj",
      sigla: "RJ",
      nome: "Rio de Janeiro",
      reg: "Sudeste",
      x: 9,
      y: 9,
    },
    { uf: "sp", sigla: "SP", nome: "São Paulo", reg: "Sudeste", x: 6, y: 9 },
    { uf: "pr", sigla: "PR", nome: "Paraná", reg: "Sul", x: 6, y: 10 },
    { uf: "sc", sigla: "SC", nome: "Santa Catarina", reg: "Sul", x: 6, y: 11 },
    {
      uf: "rs",
      sigla: "RS",
      nome: "Rio Grande do Sul",
      reg: "Sul",
      x: 5,
      y: 12,
    },
  ];
  const HIST = {
    2018: {
      first: [
        { name: "Jair Bolsonaro", votes: 49276990, pct: 46.03 },
        { name: "Fernando Haddad", votes: 31342005, pct: 29.28 },
      ],
      second: [
        { name: "Jair Bolsonaro", votes: 57797847, pct: 55.13 },
        { name: "Fernando Haddad", votes: 47040906, pct: 44.87 },
      ],
      poll: [
        { name: "Jair Bolsonaro", pct: 40 },
        { name: "Fernando Haddad", pct: 25 },
      ],
    },
    2022: {
      first: [
        { name: "Lula", votes: 57259504, pct: 48.43 },
        { name: "Jair Bolsonaro", votes: 51072345, pct: 43.2 },
      ],
      second: [
        { name: "Lula", votes: 60345999, pct: 50.9 },
        { name: "Jair Bolsonaro", votes: 58206354, pct: 49.1 },
      ],
      poll: [
        { name: "Lula", pct: 50 },
        { name: "Jair Bolsonaro", pct: 36 },
      ],
    },
    2026: { poll: null },
  };
  const HISTORY_SEEDS = []; // Dados do primeiro turno não entram na curva.
  const S = {
    data: null,
    idg: null,
    first26: null,
    seconds: 30,
    states: {},
    stateIdg: {},
    states22: {},
    selectedUf: "pa",
    view: "live",
    history: [],
    sim: {},
    available: false,
    configChecked: 0,
    geo: null,
    munConfig: null,
    munCache: {},
    munJob: 0,
    munAbort: null,
    checkedAt: null,
  };
  const $ = (id) => document.getElementById(id);
  const num = ElectionCore.number;
  const pnum = ElectionCore.percent;
  const int = (v) =>
    new Intl.NumberFormat("pt-BR").format(Math.round(Number(v || 0)));
  const dec = (v, d = 2) =>
    new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: d,
      maximumFractionDigits: d,
    }).format(Number(v || 0));
  const pct = (v) => dec(pnum(v), 2) + "%";
  const pp = (v) => (Number(v) >= 0 ? "+" : "") + dec(v, 2) + " p.p.";
  const esc = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (m) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;",
        })[m],
    );
  const norm = (s) =>
    String(s ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase();
  const endpoint26 = () =>
    `${BASE26}/${PRES26.e}/dados/br/br-c0001-e${PRES26.e.padStart(6, "0")}-u.json`;
  const firstEndpoint26 = () =>
    `${BASE26}/${PRES26_FIRST}/dados/br/br-c0001-e006257-u.json`;
  const stateEndpoint26 = (uf) =>
    `${BASE26}/${PRES26.e}/dados/${uf}/${uf}-c0001-e${PRES26.e.padStart(6, "0")}-u.json`;
  const munConfigEndpoint26 = () =>
    `${BASE26}/${PRES26.e}/config/mun-e${PRES26.e.padStart(6, "0")}-cm.json`;
  const munEndpoint26 = (uf, code) =>
    `${BASE26}/${PRES26.e}/dados/${uf}/${uf}${code}-c0001-e${PRES26.e.padStart(6, "0")}-u.json`;
  const stateEndpoint22 = (uf) => `${BASE22}/${uf}/${uf}-c0001-e000544-r.json`;
  const candidates = ElectionCore.candidates;
  function candidates22(d) {
    return (d?.cand || [])
      .map((c) => ({ ...c, party: c.cc || "" }))
      .sort((a, b) => num(b.vap) - num(a.vap));
  }
  function findLula(all) {
    return all.find((c) => norm(c.nmu || c.nm).includes("LULA"));
  }
  function findFlavio(all) {
    return all.find(
      (c) =>
        norm(c.nmu || c.nm).includes("FLAVIO") &&
        norm(c.nmu || c.nm).includes("BOLSONARO"),
    );
  }
  function findBolsonaro22(all) {
    return all.find(
      (c) =>
        c.n === "22" ||
        norm(c.nm || c.nmu).includes("JAIR BOLSONARO") ||
        norm(c.nm || c.nmu) === "BOLSONARO",
    );
  }
  function leaderKey(c) {
    if (!c) return "outro";
    if (findLula([c])) return "lula";
    if (findFlavio([c])) return "flavio";
    return "outro";
  }
  function shortName(c) {
    if (!c) return "Sem dados";
    if (findLula([c])) return "Lula";
    if (findFlavio([c])) return "Flávio";
    return c.nmu || c.nm || "Outro";
  }
  function duel(a, b) {
    const av = num(a),
      bv = num(b),
      diff = Math.abs(av - bv);
    return {
      diff,
      leader: av === bv ? "Empate" : av > bv ? "Lula" : "Flávio Bolsonaro",
      short: av === bv ? "Empate" : av > bv ? "Lula" : "Flávio",
    };
  }
  function stateInfo(meta, d) {
    if (!d)
      return {
        ...meta,
        loaded: false,
        all: [],
        leader: null,
        leaderType: "outro",
        lulaVotes: 0,
        lulaPct: 0,
        flavioVotes: 0,
        flavioPct: 0,
        totalPct: 0,
        pending: 0,
      };
    const all = candidates(d),
      l = findLula(all),
      f = findFlavio(all),
      leader =
        all.some((c) => num(c.vap) > 0) && num(all[0]?.vap) !== num(all[1]?.vap)
          ? all[0]
          : null;
    const te = num(d.e?.te),
      est = num(d.e?.est);
    return {
      ...meta,
      loaded: true,
      tied:
        all.length > 1 &&
        num(all[0].vap) > 0 &&
        num(all[0].vap) === num(all[1].vap),
      raw: d,
      all,
      leader,
      leaderType: leaderKey(leader),
      lulaVotes: num(l?.vap),
      lulaPct: pnum(l?.pvap),
      flavioVotes: num(f?.vap),
      flavioPct: pnum(f?.pvap),
      totalPct: pnum(d.s?.pst),
      sectionsDone: num(d.s?.st),
      sectionsTotal: num(d.s?.ts),
      pending:
        d.e?.te == null || d.e?.est == null ? null : Math.max(0, te - est),
    };
  }
  function stateInfo22(meta, d) {
    if (!d)
      return {
        ...meta,
        loaded: false,
        lulaVotes: 0,
        lulaPct: 0,
        bolsoVotes: 0,
        bolsoPct: 0,
      };
    const all = candidates22(d),
      l = findLula(all),
      b = findBolsonaro22(all);
    return {
      ...meta,
      loaded: true,
      lulaVotes: num(l?.vap),
      lulaPct: pnum(l?.pvap),
      bolsoVotes: num(b?.vap),
      bolsoPct: pnum(b?.pvap),
    };
  }
  function nav() {
    $("nav").addEventListener("click", (e) => {
      const b = e.target.closest("button[data-view]");
      if (!b) return;
      S.view = b.dataset.view;
      document.querySelectorAll(".nav button").forEach((x) => {
        x.classList.toggle("active", x === b);
        x.setAttribute("aria-pressed", String(x === b));
      });
      document
        .querySelectorAll(".view")
        .forEach((v) =>
          v.classList.toggle("active", v.id === `view-${S.view}`),
        );
      if (S.view === "history") renderHistory();
      if (S.view === "polls") renderPolls();
      if (S.view === "scenarios") renderSimulation();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
  function renderAll() {
    renderLive();
    renderMap();
    renderRegions();
    renderRankings();
    renderMath();
    renderHistory();
    renderPolls();
    if (S.simRenderedFor !== S.first26) {
      renderSimulation();
      S.simRenderedFor = S.first26;
    }
  }
  function renderLive() {
    const d = S.data;
    if (!d) {
      $("liveMessage").className = "notice warn";
      $("liveMessage").textContent =
        "Aguardando a disponibilização dos dados oficiais de 25/10/2026 pelo TSE. O painel não exibe votos do 1º turno como se fossem do 2º.";
      updateClocks();
      return;
    }
    const all = candidates(d),
      l = findLula(all),
      f = findFlavio(all),
      leader = all[0],
      second = all[1],
      prog = pnum(d.s?.pst);
    $("kProgress").textContent = pct(prog);
    $("kSections").textContent = `${int(d.s?.st)} de ${int(d.s?.ts)} seções`;
    $("kLeader").textContent =
      num(leader?.vap) === num(second?.vap) ? "Empate" : shortName(leader);
    $("kLeaderPct").textContent =
      `${int(leader?.vap)} votos • ${pct(leader?.pvap)}`;
    const hasVotes = all.some((c) => num(c.vap) > 0);
    if (!hasVotes) {
      $("kLeader").textContent = "Aguardando";
      $("kLeaderPct").textContent = "Nenhum voto divulgado";
    }
    const topDiff = Math.max(0, num(leader?.vap) - num(second?.vap));
    $("kDiffVotes").textContent = hasVotes ? int(topDiff) : "—";
    $("kDiffVotesHint").textContent =
      hasVotes && second
        ? `${topDiff === 0 ? "Empate entre" : shortName(leader) + " à frente de"} ${topDiff === 0 ? shortName(leader) + " e " : ""}${shortName(second)}`
        : "entre os dois primeiros";
    $("kDiffPP").textContent = hasVotes
      ? dec(Math.abs(pnum(leader?.pvap) - pnum(second?.pvap)), 2) + " p.p."
      : "—";
    updateClocks();
    $("liveMeta").textContent =
      `Brasil + exterior • ${pct(prog)} das seções • ${d.and === "f" ? "finalizado" : d.and === "p" ? "parcial" : "ainda não iniciado"}`;
    $("progressBar").style.width = Math.max(0, Math.min(100, prog)) + "%";
    $("liveMessage").classList.add("hidden");
    if (l && f) {
      $("duelTop").classList.remove("hidden");
      $("duelBar").classList.remove("hidden");
      $("lulaVotes").textContent = int(l.vap);
      $("lulaPct").textContent = pct(l.pvap);
      $("flavioVotes").textContent = int(f.vap);
      $("flavioPct").textContent = pct(f.pvap);
      const pair = Math.max(1, num(l.vap) + num(f.vap));
      $("lulaSeg").style.width = (100 * num(l.vap)) / pair + "%";
      $("flavioSeg").style.width = (100 * num(f.vap)) / pair + "%";
    }
    $("candidateList").innerHTML = all
      .map(
        (c, i) =>
          `<article class="cand"><div class="rank">${i + 1}º</div><div><div class="name">${esc(c.nmu || c.nm || "Candidato")} ${c.st ? `<span class="chip">${esc(c.st)}</span>` : ""}</div><div class="details"><span>Nº ${esc(c.n)}</span><span>•</span><span>${esc(c.party || "Partido não informado")}</span></div><div class="bar"><i style="width:${Math.min(100, pnum(c.pvap))}%"></i></div></div><div class="votes"><strong>${int(c.vap)}</strong><div class="pct">${pct(c.pvap)}</div></div></article>`,
      )
      .join("");
    updateStateLeadKpis();
    captureSnapshot();
    renderChart();
  }
  function updateStateLeadKpis() {
    const infos = UFS.map((m) => stateInfo(m, S.states[m.uf]));
    const loaded = infos.filter((i) => i.loaded);
    const l = loaded.filter((i) => i.leaderType === "lula").length,
      f = loaded.filter((i) => i.leaderType === "flavio").length;
    $("kStatesLula").textContent = loaded.length ? l : "—";
    $("kStatesFlavio").textContent = loaded.length ? f : "—";
    const regs = regionStats();
    const rl = regs.filter((r) => r.leader === "Lula").length,
      rf = regs.filter((r) => r.leader === "Flávio Bolsonaro").length;
    $("kRegions").textContent = `L ${rl} × F ${rf}`;
  }
  function captureSnapshot() {
    if (!S.data) return;
    const all = candidates(S.data),
      l = findLula(all),
      f = findFlavio(all);
    if (!l || !f) return;
    const p = pnum(S.data.s?.pst);
    let saved = [];
    try {
      saved = JSON.parse(
        localStorage.getItem("pres2026_t2_history_validated_v2") || "[]",
      );
    } catch (e) {}
    if (!Array.isArray(saved)) saved = [];
    saved = saved.filter(
      (x) =>
        x &&
        [x.p, x.lula, x.flavio].every(
          (v) =>
            typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 100,
        ),
    );
    const last = saved[saved.length - 1];
    if (
      !last ||
      Math.abs(p - last.p) >= 0.05 ||
      Math.abs(pnum(l.pvap) - last.lula) >= 0.05 ||
      Math.abs(pnum(f.pvap) - last.flavio) >= 0.05
    ) {
      saved.push({
        p,
        lula: pnum(l.pvap),
        flavio: pnum(f.pvap),
        label: S.data.ht || "",
      });
      saved = saved.slice(-180);
      try {
        localStorage.setItem(
          "pres2026_t2_history_validated_v2",
          JSON.stringify(saved),
        );
      } catch (e) {}
    }
    S.history = saved;
  }
  function renderChart() {
    const svg = $("liveChart");
    if (!svg) return;
    const pts = [...(S.history || [])]
      .filter((x) => x.p >= 0 && x.p <= 100)
      .sort((a, b) => a.p - b.p);
    const ded = [];
    for (const x of pts) {
      const prev = ded[ded.length - 1];
      if (prev && Math.abs(prev.p - x.p) < 0.001) ded[ded.length - 1] = x;
      else ded.push(x);
    }
    const W = 1000,
      H = 300,
      m = { l: 50, r: 20, t: 18, b: 35 },
      iw = W - m.l - m.r,
      ih = H - m.t - m.b;
    const X = (p) => m.l + (iw * p) / 100,
      Y = (p) => m.t + (ih * (100 - p)) / 100;
    let out = "";
    for (let x = 0; x <= 100; x += 20) {
      const xx = X(x);
      out += `<line x1="${xx}" y1="${m.t}" x2="${xx}" y2="${H - m.b}" stroke="#22324a" stroke-width="1"/><text x="${xx}" y="${H - 10}" fill="#95a4ba" font-size="11" text-anchor="middle">${x}%</text>`;
    }
    for (let y = 0; y <= 100; y += 20) {
      const yy = Y(y);
      out += `<line x1="${m.l}" y1="${yy}" x2="${W - m.r}" y2="${yy}" stroke="#22324a" stroke-width="1"/><text x="8" y="${yy + 4}" fill="#95a4ba" font-size="11">${y}%</text>`;
    }
    const line = (key, color) => {
      if (!ded.length) return "";
      const p = ded.map((z) => `${X(z.p)},${Y(z[key])}`).join(" ");
      return `<polyline points="${p}" fill="none" stroke="${color}" stroke-width="4" vector-effect="non-scaling-stroke"/>`;
    };
    out += line("lula", "#d46a6a") + line("flavio", "#4ba3ff");
    ded.forEach((z) => {
      out += `<circle cx="${X(z.p)}" cy="${Y(z.lula)}" r="4" fill="#d46a6a"/><circle cx="${X(z.p)}" cy="${Y(z.flavio)}" r="4" fill="#4ba3ff"/>`;
    });
    svg.innerHTML = out;
  }
  function renderMath() {
    const infos = UFS.map((m) => stateInfo(m, S.states[m.uf])).filter(
      (i) => i.loaded,
    );
    if (
      infos.length !== 27 ||
      !S.data ||
      infos.some((i) => i.pending == null || i.raw.e?.c == null)
    ) {
      $("mathNotice").textContent =
        "Estimativa indisponível: requer dados nacionais e das 27 UFs.";
      for (const id of [
        "mathPending",
        "mathPendingPct",
        "mathEstValid",
        "mathRates",
        "mathNetNeed",
        "mathNetHint",
      ])
        $(id).textContent = "—";
      return;
    }
    const electorate = infos.reduce((a, i) => a + num(i.raw.e?.te), 0),
      reached = infos.reduce((a, i) => a + num(i.raw.e?.est), 0),
      turnout = infos.reduce((a, i) => a + num(i.raw.e?.c), 0),
      pending = Math.max(0, electorate - reached);
    const validKnown = infos.reduce(
      (a, i) => a + i.all.reduce((s, c) => s + num(c.vap), 0),
      0,
    );
    const turnoutRate = reached ? turnout / reached : 0,
      validRate = turnout ? validKnown / turnout : 0,
      estValid = pending * turnoutRate * validRate;
    $("mathPending").textContent = int(pending);
    $("mathPendingPct").textContent = electorate
      ? `${dec((100 * pending) / electorate, 2)}% do eleitorado das 27 UFs`
      : "—";
    $("mathEstValid").textContent = int(estValid);
    $("mathRates").textContent =
      `comparecimento observado ${dec(100 * turnoutRate, 2)}% • válidos/comparecimento ${dec(100 * validRate, 2)}%`;
    const all = candidates(S.data),
      first = all[0],
      second = all[1],
      gap = Math.max(0, num(first?.vap) - num(second?.vap));
    const net = estValid ? (100 * gap) / estValid : Infinity;
    $("mathNetNeed").textContent = Number.isFinite(net)
      ? dec(net, 1) + "%"
      : "—";
    $("mathNetHint").textContent = second
      ? `${shortName(second)} precisa ganhar do líder por ${int(gap + 1)} votos líquidos entre os novos votos`
      : "—";
    const twoWay = estValid ? 50 + (50 * gap) / estValid : Infinity;
    $("mathNotice").innerHTML =
      estValid <= 0
        ? "Não há base suficiente para estimar novos votos válidos."
        : estValid < gap
          ? `Pela estimativa atual, o volume de votos válidos ainda a entrar (${int(estValid)}) é menor que a diferença entre os dois primeiros (${int(gap)}). <strong>Isso é uma estimativa baseada nas taxas observadas, não uma certificação matemática do resultado.</strong>`
          : `O segundo colocado precisa obter uma vantagem líquida equivalente a <strong>${dec(net, 1)}%</strong> do pool estimado de novos votos válidos. Em uma hipótese artificial em que todos esses novos votos fossem apenas dos dois líderes, isso exigiria cerca de <strong>${dec(twoWay, 1)}%</strong> para o segundo colocado contra ${dec(100 - twoWay, 1)}% para o líder.`;
  }
  function renderMap() {
    const infos = UFS.map((m) => stateInfo(m, S.states[m.uf]));
    const loaded = infos.filter((i) => i.loaded);
    $("tileMap").innerHTML = infos
      .map((i) => {
        const cls = ["stateTile", `leader-${i.leaderType}`];
        if (i.uf === S.selectedUf) cls.push("active");
        if (i.reg === "Nordeste") cls.push("ne");
        return `<button class="${cls.join(" ")}" data-uf="${i.uf}" style="grid-column:${i.x};grid-row:${i.y}"><div class="tileTop"><div class="uf">${i.sigla}</div><div class="regTag">${esc(i.reg)}</div></div><div><div class="leaderShort">${i.leader ? esc(shortName(i.leader)) : i.tied ? "Empate" : "Sem votos"}</div><div class="tileMeta">L ${int(i.lulaVotes)} / F ${int(i.flavioVotes)}</div><div class="tilePct">${i.loaded ? pct(i.totalPct) : "—"}</div></div></button>`;
      })
      .join("");
    $("tileMap").onclick = (e) => {
      const b = e.target.closest(".stateTile[data-uf]");
      if (b) selectUf(b.dataset.uf);
    };
    drawGeo(infos);
    const s = infos.find((i) => i.uf === S.selectedUf) || loaded[0];
    if (!s) {
      $("stateDetail").textContent = "Selecione uma UF.";
      return;
    }
    const d = duel(s.lulaVotes, s.flavioVotes),
      badge =
        s.leaderType === "lula"
          ? "lula"
          : s.leaderType === "flavio"
            ? "flavio"
            : "other";
    $("stateDetail").innerHTML =
      `<h4>${esc(s.nome)} (${s.sigla})</h4><div class="desc">${esc(s.reg)} • ${s.loaded ? pct(s.totalPct) : "Sem totalização disponível"} </div><div class="miniGrid"><div class="miniCard"><div class="miniLabel">Líder</div><div class="miniValue">${s.leader ? esc(shortName(s.leader)) : s.tied ? "Empate" : "—"}</div><div class="miniHint"><span class="leaderBadge ${badge}">${s.leader ? pct(s.leader?.pvap) : "Aguardando"}</span></div></div><div class="miniCard"><div class="miniLabel">Diferença Lula × Flávio</div><div class="miniValue">${s.lulaVotes + s.flavioVotes ? int(d.diff) : "—"}</div><div class="miniHint">${s.lulaVotes + s.flavioVotes ? (d.leader === "Empate" ? "empate" : `${esc(d.short)} à frente`) : "Aguardando votos"} • ${s.loaded ? dec(Math.abs(s.lulaPct - s.flavioPct), 2) + " p.p." : "—"}</div></div></div><div class="duelTop"><div class="duelBox red"><div class="duelName">Lula</div><div class="duelVotes">${s.loaded ? int(s.lulaVotes) : "—"}</div><div class="duelPct">${s.loaded ? pct(s.lulaPct) : "—"}</div></div><div class="duelBox blue"><div class="duelName">Flávio</div><div class="duelVotes">${s.loaded ? int(s.flavioVotes) : "—"}</div><div class="duelPct">${s.loaded ? pct(s.flavioPct) : "—"}</div></div></div><div class="notice"><strong>Eleitorado em seções ainda não totalizadas:</strong> ${s.loaded && s.pending != null ? int(s.pending) : "—"}</div><div class="notice">Última totalização desta UF: ${s.loaded && tseDate(s.raw.dt, s.raw.ht) ? esc(s.raw.dt + " " + s.raw.ht) + " (Brasília)" : "indisponível"}<br>${S.stateErrors?.[s.uf] ? "Falha na última consulta; dados anteriores preservados." : "Fonte: TSE • resultado parcial até finalização oficial."}</div>`;
    renderMuniStatus();
  }
  function selectUf(uf) {
    if (!UFS.some((x) => x.uf === uf)) return;
    S.selectedUf = uf;
    $("geoTip").classList.add("hidden");
    if (S.munAbort) {
      S.munAbort.abort();
      S.munAbort = null;
      S.munJob++;
    }
    renderMap();
  }
  function flattenGeometry(g) {
    if (!g) return [];
    if (g.type === "Polygon") return g.coordinates || [];
    if (g.type === "MultiPolygon")
      return (g.coordinates || []).flatMap((p) => p);
    return [];
  }
  function drawGeo(infos) {
    if (!S.geo) return;
    const svg = $("geoMap").querySelector("svg");
    if (!svg) return;
    for (const i of infos) {
      const path = svg.querySelector(`path[data-uf="${i.uf}"]`);
      if (!path) continue;
      path.setAttribute(
        "class",
        `geoState leader-${i.leaderType}${i.uf === S.selectedUf ? " selected" : ""}`,
      );
      path.querySelector("title").textContent =
        `${i.nome}: ${i.leader ? shortName(i.leader) + " lidera" : i.tied ? "empate" : "sem votos"}; Lula ${int(i.lulaVotes)} (${pct(i.lulaPct)}), Flávio ${int(i.flavioVotes)} (${pct(i.flavioPct)}); diferença ${int(Math.abs(i.lulaVotes - i.flavioVotes))} votos, ${dec(Math.abs(i.lulaPct - i.flavioPct), 2)} p.p.`;
      path.setAttribute("aria-pressed", String(i.uf === S.selectedUf));
      path.setAttribute(
        "aria-label",
        `${i.nome}, ${i.leader ? shortName(i.leader) + " lidera" : i.tied ? "empate" : "aguardando votos"}, Lula ${int(i.lulaVotes)}, Flávio ${int(i.flavioVotes)}`,
      );
    }
  }
  async function loadGeo() {
    const sources = ["assets/estados.geojson"];
    for (const url of sources) {
      try {
        const geo = await fetchJson(url, { cache: "force-cache" });
        if (!Array.isArray(geo.features) || geo.features.length < 27)
          throw Error("Malha incompleta");
        S.geo = geo;
        buildGeoSvg(geo);
        renderMap();
        return;
      } catch (e) {
        console.warn("Malha geográfica indisponível", e);
      }
    }
    $("geoMap").innerHTML =
      '<div class="notice warn">Não foi possível carregar a malha geográfica agora. Utilize a grade de estados logo abaixo.</div>';
    document.querySelector(".geoFallback").open = true;
  }
  function buildGeoSvg(geo) {
    const items = geo.features
      .map((f) => ({
        uf: String(
          f.properties?.sigla || f.properties?.SIGLA || f.properties?.uf || "",
        ).toLowerCase(),
        rings: flattenGeometry(f.geometry),
      }))
      .filter((f) => UFS.some((m) => m.uf === f.uf));
    if (items.length !== 27 || new Set(items.map((f) => f.uf)).size !== 27)
      throw Error("Malha geográfica não contém 27 UFs");
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    for (const f of items)
      for (const ring of f.rings)
        for (const p of ring) {
          const x = Number(p[0]),
            y = Number(p[1]);
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
    const W = 740,
      H = 690,
      pad = 16,
      scale = Math.min(
        (W - 2 * pad) / (maxX - minX),
        (H - 2 * pad) / (maxY - minY),
      );
    const X = (x) => pad + (x - minX) * scale,
      Y = (y) => H - pad - (y - minY) * scale;
    let body = "";
    for (const f of items) {
      const m = UFS.find((x) => x.uf === f.uf);
      const d = f.rings
        .map(
          (r) =>
            r
              .map(
                (p, j) =>
                  `${j ? "L" : "M"}${X(p[0]).toFixed(2)},${Y(p[1]).toFixed(2)}`,
              )
              .join(" ") + " Z",
        )
        .join(" ");
      body += `<path class="geoState leader-outro" data-uf="${f.uf}" tabindex="0" role="button" d="${d}"><title>${esc(m.nome)}</title></path>`;
    }
    for (const f of items) {
      let minlon = Infinity,
        maxlon = -Infinity,
        minlat = Infinity,
        maxlat = -Infinity;
      for (const ring of f.rings)
        for (const p of ring) {
          if (p[0] < minlon) minlon = p[0];
          if (p[0] > maxlon) maxlon = p[0];
          if (p[1] < minlat) minlat = p[1];
          if (p[1] > maxlat) maxlat = p[1];
        }
      const cx = X((minlon + maxlon) / 2),
        cy = Y((minlat + maxlat) / 2);
      body += `<text class="geoLabel" x="${cx.toFixed(1)}" y="${cy.toFixed(1)}">${f.uf.toUpperCase()}</text>`;
    }
    $("geoMap").innerHTML =
      `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="group" aria-label="Mapa geográfico do Brasil por unidade federativa">${body}</svg>`;
    const map = $("geoMap");
    map.onclick = (e) => {
      const p = e.target.closest("path[data-uf]");
      if (p) selectUf(p.dataset.uf);
    };
    map.onkeydown = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        const p = e.target.closest("path[data-uf]");
        if (p) {
          e.preventDefault();
          selectUf(p.dataset.uf);
        }
      }
    };
    map.addEventListener("mousemove", (e) => {
      const p = e.target.closest("path[data-uf]"),
        tip = $("geoTip");
      if (!p) {
        tip.classList.add("hidden");
        return;
      }
      const m = UFS.find((m) => m.uf === p.dataset.uf),
        i = stateInfo(m, S.states[m.uf]);
      tip.textContent = `${m.nome}: ${i.leader ? shortName(i.leader) + " lidera" : i.tied ? "empate" : "aguardando votos"} • L ${int(i.lulaVotes)} × F ${int(i.flavioVotes)}`;
      tip.classList.remove("hidden");
      const rect = map.parentElement.getBoundingClientRect();
      tip.style.left =
        Math.max(4, Math.min(rect.width - 230, e.clientX - rect.left + 12)) +
        "px";
      tip.style.top = Math.max(40, e.clientY - rect.top + 10) + "px";
    });
    map.addEventListener("mouseleave", () =>
      $("geoTip").classList.add("hidden"),
    );
  }
  function regionStats() {
    const order = ["Norte", "Nordeste", "Centro-Oeste", "Sudeste", "Sul"];
    return order.map((reg) => {
      const a = UFS.filter((m) => m.reg === reg)
        .map((m) => stateInfo(m, S.states[m.uf]))
        .filter((i) => i.loaded);
      const b = UFS.filter((m) => m.reg === reg)
        .map((m) => stateInfo22(m, S.states22[m.uf]))
        .filter((i) => i.loaded);
      const l = a.reduce((s, i) => s + i.lulaVotes, 0),
        f = a.reduce((s, i) => s + i.flavioVotes, 0),
        pair = Math.max(1, l + f),
        diff26 = (100 * (l - f)) / pair;
      const l22 = b.reduce((s, i) => s + i.lulaVotes, 0),
        bo22 = b.reduce((s, i) => s + i.bolsoVotes, 0),
        pair22 = Math.max(1, l22 + bo22),
        diff22 = (100 * (l22 - bo22)) / pair22;
      const d = duel(l, f);
      return {
        reg,
        a,
        b,
        l,
        f,
        diff26,
        diff22,
        swing:
          a.length === UFS.filter((x) => x.reg === reg).length &&
          b.length === a.length
            ? diff26 - diff22
            : null,
        leader: !a.some((i) => i.lulaVotes + i.flavioVotes > 0)
          ? "Aguardando votos"
          : d.leader,
        wins: {
          lula: a.filter((i) => i.leaderType === "lula").length,
          flavio: a.filter((i) => i.leaderType === "flavio").length,
          other: a.filter((i) => i.leaderType === "outro").length,
        },
      };
    });
  }
  function renderRegions() {
    const regs = regionStats();
    $("regionGrid").innerHTML = regs
      .map(
        (r) =>
          `<article class="regionCard ${r.reg === "Nordeste" ? "nordeste" : ""}"><div class="regionTitleRow"><div class="regionTitle">${r.reg}</div><div class="regionUFs">${r.a.length}/${UFS.filter((x) => x.reg === r.reg).length} UFs • ${r.a.length === UFS.filter((x) => x.reg === r.reg).length ? "cobertura completa" : "cobertura parcial"}</div></div><div class="regionalLeader"><span>Líder 2026</span><strong>${r.leader === "Empate" ? "Empate" : esc(r.leader)}</strong></div><div class="regionVotes"><div class="regionVoteBox red"><div class="miniLabel">Lula</div><div class="regionVoteValue">${r.a.length ? int(r.l) : "—"}</div></div><div class="regionVoteBox blue"><div class="miniLabel">Flávio</div><div class="regionVoteValue">${r.a.length ? int(r.f) : "—"}</div></div></div><div class="swing">Diferença 2026 (L−F): <strong>${r.a.length ? pp(r.diff26) : "—"}</strong><br>Diferença 2022 (L−Bolsonaro): <strong>${r.b.length ? pp(r.diff22) : "carregando"}</strong><br>Swing: <strong>${r.swing == null ? "—" : pp(r.swing)}</strong></div></article>`,
      )
      .join("");
  }
  function renderRankings() {
    const infos = UFS.map((m) => stateInfo(m, S.states[m.uf])).filter(
      (i) => i.loaded,
    );
    const saldos = [...infos].sort(
      (a, b) =>
        Math.abs(b.lulaVotes - b.flavioVotes) -
        Math.abs(a.lulaVotes - a.flavioVotes),
    );
    $("stateRanking").innerHTML =
      saldos
        .slice(0, 12)
        .map((i, n) => {
          const delta = i.lulaVotes - i.flavioVotes,
            who = delta === 0 ? "Empate" : delta > 0 ? "Lula" : "Flávio";
          return `<div class="rankRow"><div class="n">${n + 1}º</div><div class="state"><strong>${i.nome} (${i.sigla})</strong><small>${i.reg} • ${pct(i.totalPct)} totalizado</small></div><div class="saldo ${delta > 0 ? "neg" : "pos"}">${who} +${int(Math.abs(delta))}</div><div class="pending">pendente: ${i.pending == null ? "indisponível" : int(i.pending)} eleitores</div></div>`;
        })
        .join("") || '<div class="notice">Aguardando estados.</div>';
    const pending = infos
      .filter((i) => i.pending != null)
      .sort((a, b) => b.pending - a.pending);
    $("pendingRanking").innerHTML = pending
      .slice(0, 10)
      .map(
        (i, n) =>
          `<div class="rankRow"><div class="n">${n + 1}º</div><div class="state"><strong>${i.nome} (${i.sigla})</strong><small>${pct(i.totalPct)} totalizado</small></div><div class="saldo">${int(i.pending)}</div><div class="pending">eleitores em seções ainda não totalizadas</div></div>`,
      )
      .join("");
  }
  function current26History() {
    if (!S.first26) return null;
    const all = candidates(S.first26),
      a = all[0],
      b = all[1];
    if (!a || !b) return null;
    return {
      first: [
        { name: a.nmu || a.nm, votes: num(a.vap), pct: pnum(a.pvap) },
        { name: b.nmu || b.nm, votes: num(b.vap), pct: pnum(b.pvap) },
      ],
    };
  }
  function renderHistory() {
    const h26 = current26History(),
      years = [2018, 2022, 2026];
    const rows = years
      .map((y) => {
        const h = y === 2026 ? h26 : HIST[y];
        if (!h) return null;
        const a = h.first[0],
          b = h.first[1],
          gapVotes = Math.abs(a.votes - b.votes),
          gapPP = Math.abs(a.pct - b.pct);
        return { y, a, b, gapVotes, gapPP };
      })
      .filter(Boolean);
    const max = Math.max(1, ...rows.map((r) => r.gapPP));
    $("historyCards").innerHTML = rows
      .map(
        (r) =>
          `<article class="electionCard"><div class="year">${r.y} • 1º turno</div><div class="electionTitle">${esc(r.a.name)}</div><div class="electionMeta">${pct(r.a.pct)} × ${pct(r.b.pct)} de ${esc(r.b.name)}<br>Diferença: <strong>${int(r.gapVotes)} votos • ${dec(r.gapPP, 2)} p.p.</strong></div><div class="marginBar"><i style="width:${(100 * r.gapPP) / max}%"></i></div></article>`,
      )
      .join("");
    $("historyTable").innerHTML = rows
      .map(
        (r) =>
          `<tr><td><strong>${r.y}</strong></td><td>${esc(r.a.name)}</td><td>${int(r.a.votes)}</td><td>${pct(r.a.pct)}</td><td>${esc(r.b.name)}</td><td>${int(r.b.votes)}</td><td>${pct(r.b.pct)}</td><td><strong>${int(r.gapVotes)}</strong><br><span class="muted">${dec(r.gapPP, 2)} p.p.</span></td></tr>`,
      )
      .join("");
    const trs = [];
    for (const y of [2018, 2022]) {
      const h = HIST[y];
      for (let i = 0; i < 2; i++) {
        const a = h.first[i],
          b = h.second[i],
          gain = b.votes - a.votes;
        trs.push(
          `<tr><td><strong>${y}</strong></td><td>${esc(a.name)}</td><td>${int(a.votes)} (${pct(a.pct)})</td><td>${int(b.votes)} (${pct(b.pct)})</td><td><strong>+${int(gain)}</strong></td><td>${i === 0 ? "<strong>Eleito</strong>" : "2º lugar"}</td></tr>`,
        );
      }
    }
    $("turnTable").innerHTML = trs.join("");
  }
  function renderPolls() {
    const liveAll = S.first26 ? candidates(S.first26) : [];
    const liveL = findLula(liveAll),
      liveF = findFlavio(liveAll);
    const actual26 =
      liveL && liveF
        ? [
            { name: "Lula", votes: num(liveL.vap), pct: pnum(liveL.pvap) },
            {
              name: "Flávio Bolsonaro",
              votes: num(liveF.vap),
              pct: pnum(liveF.pvap),
            },
          ]
        : null;
    const items = [
      { y: 2018, h: HIST[2018], label: "Bolsonaro × Haddad" },
      { y: 2022, h: HIST[2022], label: "Lula × Bolsonaro" },
      {
        y: 2026,
        h: { ...HIST[2026], first: actual26 },
        label: "Lula × Flávio",
      },
    ];
    $("pollCards").innerHTML = items
      .map((x) => {
        const p = x.h.poll,
          first = x.h.first;
        if (!p || !first)
          return `<article class="pollCard"><div class="year">${x.y}</div><div class="electionTitle">${x.label}</div><div class="errBox">Pesquisa de 2026 não verificada; comparação indisponível.</div></article>`;
        const pg = Math.abs(p[0].pct - p[1].pct),
          ag = Math.abs(first[0].pct - first[1].pct);
        return `<article class="pollCard"><div class="year">${x.y} • última Datafolha</div><div class="electionTitle">${x.label}</div><div class="pollGap">${dec(pg, 1)} p.p.</div><div class="errBox">gap na pesquisa<br><strong style="color:#eef5ff">Urna: ${dec(ag, 2)} p.p.</strong><br>Diferença pesquisa→urna: ${dec(ag - pg, 2)} p.p.</div></article>`;
      })
      .join("");
    $("pollTable").innerHTML = items
      .map((x) => {
        const p = x.h.poll,
          first = x.h.first;
        if (!p || !first)
          return `<tr><td>${x.y}</td><td>Não verificada</td><td>${first ? "Recebido do TSE" : "Indisponível"}</td><td>—</td><td>—</td><td>—</td><td>—</td></tr>`;
        const e1 = Math.abs(p[0].pct - first[0].pct),
          e2 = Math.abs(p[1].pct - first[1].pct),
          pg = Math.abs(p[0].pct - p[1].pct),
          ag = Math.abs(first[0].pct - first[1].pct);
        return `<tr><td><strong>${x.y}</strong></td><td>${esc(p[0].name)} ${pct(p[0].pct)} × ${esc(p[1].name)} ${pct(p[1].pct)}</td><td>${esc(first[0].name)} ${pct(first[0].pct)} × ${esc(first[1].name)} ${pct(first[1].pct)}</td><td>${dec(e1, 2)} p.p.</td><td>${dec(e2, 2)} p.p.</td><td>${dec(pg, 2)} p.p.</td><td><strong>${dec(ag, 2)} p.p.</strong></td></tr>`;
      })
      .join("");
  }
  function simCandidates() {
    if (!S.first26) return [];
    const all = candidates(S.first26);
    return all.filter(
      (c) => !findLula([c]) && !findFlavio([c]) && num(c.vap) > 0,
    );
  }
  function initSim() {
    for (const c of simCandidates()) {
      const key = c.sqcand || c.n || c.nm;
      if (!S.sim[key]) S.sim[key] = { turnout: 100, flavio: 50 };
    }
  }
  function renderSimulation() {
    if (!S.first26) {
      $("simControls").innerHTML =
        '<div class="notice">Aguardando os votos oficiais de 2026.</div>';
      $("simResult").innerHTML = "";
      return;
    }
    initSim();
    const others = simCandidates();
    $("simControls").innerHTML =
      others
        .map((c) => {
          const key = c.sqcand || c.n || c.nm,
            v = S.sim[key];
          return `<div class="sliderCard" data-key="${esc(key)}"><div class="sliderHead"><strong>${esc(c.nmu || c.nm)}</strong><span class="sliderVotes">${int(c.vap)} votos</span></div><div class="sliderRow"><label>Participa no 2º turno</label><input data-field="turnout" type="range" min="0" max="100" value="${v.turnout}"><div class="sliderVal" data-val="turnout">${v.turnout}%</div></div><div class="sliderRow"><label>% para Flávio*</label><input data-field="flavio" type="range" min="0" max="100" value="${v.flavio}"><div class="sliderVal" data-val="flavio">${v.flavio}%</div></div><div class="miniHint">*dos votos desse candidato que você considera que compareceriam. O restante vai para Lula.</div></div>`;
        })
        .join("") ||
      '<div class="notice">Nenhum outro candidato com votos encontrado.</div>';
    $("simControls").oninput = (e) => {
      const input = e.target.closest("input[type=range]");
      if (!input) return;
      const card = input.closest("[data-key]"),
        key = card.dataset.key,
        field = input.dataset.field;
      S.sim[key][field] = Number(input.value);
      card.querySelector(`[data-val="${field}"]`).textContent =
        input.value + "%";
      calcSimulation();
    };
    calcSimulation();
  }
  function calcSimulation() {
    const all = candidates(S.first26),
      l = findLula(all),
      f = findFlavio(all);
    if (!l || !f) return;
    let lv = num(l.vap),
      fv = num(f.vap),
      unused = 0;
    for (const c of simCandidates()) {
      const key = c.sqcand || c.n || c.nm,
        v = S.sim[key] || { turnout: 100, flavio: 50 },
        pool = (num(c.vap) * v.turnout) / 100;
      fv += (pool * v.flavio) / 100;
      lv += (pool * (100 - v.flavio)) / 100;
      unused += num(c.vap) - pool;
    }
    const total = Math.max(1, lv + fv),
      lp = (100 * lv) / total,
      fp = (100 * fv) / total,
      winner = lp === fp ? "Empate" : lp > fp ? "Lula" : "Flávio Bolsonaro",
      diff = Math.abs(lv - fv);
    $("simResult").innerHTML =
      `<div class="simWinner">Resultado da hipótese<strong>${winner}</strong></div><div class="duelTop"><div class="duelBox red"><div class="duelName">Lula</div><div class="duelVotes">${int(lv)}</div><div class="duelPct">${dec(lp, 2)}%</div></div><div class="duelBox blue"><div class="duelName">Flávio</div><div class="duelVotes">${int(fv)}</div><div class="duelPct">${dec(fp, 2)}%</div></div></div><div class="splitbar"><i class="redSeg" style="width:${lp}%"></i><i class="blueSeg" style="width:${fp}%"></i></div><div class="notice"><strong>Diferença simulada:</strong> ${int(diff)} votos</div><div class="simNote">SIMULAÇÃO HIPOTÉTICA — não é resultado oficial. Base: votos do 1º turno recebidos pelo TSE. Votos de Lula e Flávio são mantidos; os demais são redistribuídos conforme seus controles. ${unused ? `${int(unused)} votos dos demais ficaram fora por redução de comparecimento definida por você.` : "Todos os votos dos demais foram redistribuídos."}</div>`;
  }

  // EA12: municípios por estado, com código TSE de cinco dígitos. EA20: resultados locais.
  function cityRows(uf) {
    const arr =
      S.munConfig?.abr?.find((a) => String(a.cd || a.sg).toLowerCase() === uf)
        ?.mu || [];
    return arr
      .map((m) => ({
        uf,
        cd: String(m.cd).padStart(5, "0"),
        nm: String(m.nm || "Município"),
      }))
      .filter((m) => /^\d{5}$/.test(m.cd));
  }
  function renderMuniStatus() {
    const uf = S.selectedUf,
      meta = UFS.find((m) => m.uf === uf),
      cache = S.munCache[uf],
      state = S.states[uf];
    $("munSubtitle").textContent =
      `${meta.nome} (${meta.sigla}) • ranking por votos absolutos de cada candidato. Calculado a partir dos arquivos municipais do TSE.`;
    if (
      !S.available ||
      !state ||
      !state.carg ||
      !candidates(state).some((c) => num(c.vap) > 0)
    ) {
      $("munMessage").className = "notice warn";
      $("munMessage").textContent =
        "Aguardando divulgação de votos nesta UF no segundo turno. Nenhum resultado do 1º turno é mostrado aqui.";
      $("loadCities").disabled = true;
      $("munProgress").textContent = "";
      $("topLula").textContent = "Informação indisponível para esta UF.";
      $("topFlavio").textContent = "Informação indisponível para esta UF.";
      return;
    }
    $("loadCities").disabled = !!S.munAbort;
    if (!cache) {
      $("munMessage").className = "notice";
      $("munMessage").textContent =
        "Para calcular o Top 5 dos arquivos coletados, é necessário consultar todos os municípios desta UF. Clique em “Carregar municípios”. A coleta é manual e limitada para respeitar o TSE.";
      $("munProgress").textContent = "";
      $("topLula").innerHTML = '<div class="notice">Aguardando consulta.</div>';
      $("topFlavio").innerHTML =
        '<div class="notice">Aguardando consulta.</div>';
      return;
    }
    const fresh = cache.stateIdg === S.stateIdg[uf],
      complete = cache.done === cache.total && cache.errors === 0;
    $("munMessage").className = complete && fresh ? "notice" : "notice warn";
    $("munMessage").textContent =
      complete && fresh
        ? "Coleta completa, não simultânea: os municípios podem ter horários diferentes. Confira a última totalização de cada arquivo."
        : "Ranking parcial ou desatualizado; confira o total de municípios abaixo antes de interpretar as posições como definitivas.";
    $("munProgress").textContent =
      `${cache.done}/${cache.total} municípios consultados • ${cache.errors} erros • ${fresh ? "dados da versão estadual atual" : "nova totalização estadual detectada: atualize o ranking"}`;
    const top = (key) =>
      ElectionCore.top(
        cache.rows.filter((r) => r[key] > 0),
        key,
      )
        .map(
          (r, n) =>
            `<div class="cityLine"><span class="cityN">${n + 1}º</span><div><strong>${esc(r.nm)}</strong><small>${esc(r.dt || "Data indisponível")} ${esc(r.ht || "")} • Brasília</small><small>Lula ${int(r.lula)} • Flávio ${int(r.flavio)} • ${r.lula === r.flavio ? "Empate" : (r.lula > r.flavio ? "Lula" : "Flávio") + " +" + int(Math.abs(r.lula - r.flavio))}</small></div><div class="cityVotes">${int(r[key])}<small>${r.valid ? dec((100 * r[key]) / r.valid, 2) + "% dos válidos" : "—"} • Δ ${r.valid ? dec((100 * Math.abs(r.lula - r.flavio)) / r.valid, 2) : "—"} p.p.</small></div></div>`,
        )
        .join("") ||
      '<div class="notice">Sem votos municipais disponíveis.</div>';
    $("topLula").innerHTML = top("lula");
    $("topFlavio").innerHTML = top("flavio");
  }
  async function loadMunicipalConfig(signal) {
    if (S.munConfig) return S.munConfig;
    const d = await fetchJson(munConfigEndpoint26(), {
      signal,
      cache: "force-cache",
    });
    if (!Array.isArray(d.abr) || !d.abr.length)
      throw Error("Cadastro TSE sem municípios");
    S.munConfig = d;
    return d;
  }
  async function loadMunicipios() {
    const uf = S.selectedUf;
    if (!S.available || !S.states[uf]) return;
    const token = ++S.munJob;
    S.munAbort?.abort();
    const ctrl = new AbortController();
    S.munAbort = ctrl;
    $("loadCities").disabled = true;
    $("munMessage").className = "notice";
    $("munMessage").textContent = "Lendo cadastro oficial de municípios…";
    try {
      await loadMunicipalConfig(ctrl.signal);
      if (token !== S.munJob) return;
      const cities = cityRows(uf);
      if (
        !cities.length ||
        new Set(cities.map((c) => c.cd)).size !== cities.length
      )
        throw Error("Cadastro municipal vazio ou duplicado");
      const cache = {
        stateIdg: S.stateIdg[uf],
        total: cities.length,
        done: 0,
        errors: 0,
        rows: [],
        startedAt: new Date(),
      };
      S.munCache[uf] = cache;
      await pool(
        cities,
        async (c) => {
          if (ctrl.signal.aborted) return;
          try {
            const d = ElectionCore.validate(
              await fetchJson(munEndpoint26(uf, c.cd), { signal: ctrl.signal }),
              { election: PRES26.e, uf, municipality: c.cd, year: 2026 },
            );
            const all = candidates(d),
              l = findLula(all),
              f = findFlavio(all);
            // Ausência de candidato não equivale a zero votos verificado.
            if (!l || !f) throw Error("Candidatos esperados ausentes");
            cache.rows.push({
              cd: c.cd,
              nm: c.nm,
              lula: num(l.vap),
              flavio: num(f.vap),
              valid: all.reduce((v, x) => v + num(x.vap), 0),
              dt: d.dt,
              ht: d.ht,
            });
            cache.done++;
          } catch (e) {
            if (ctrl.signal.aborted) return;
            cache.errors++;
          }
          if (token === S.munJob && S.selectedUf === uf) renderMuniStatus();
          await new Promise((resolve) => setTimeout(resolve, 320));
        },
        3,
      );
      if (token !== S.munJob) return;
      cache.completedAt = new Date();
      renderMuniStatus();
    } catch (e) {
      if (token !== S.munJob || ctrl.signal.aborted) return;
      $("munMessage").className = "notice err";
      $("munMessage").textContent =
        `Não foi possível obter o ranking: ${e.message}. Tente novamente mais tarde.`;
    } finally {
      if (token === S.munJob) {
        S.munAbort = null;
        $("loadCities").disabled = false;
      }
    }
  }
  $("loadCities").addEventListener("click", loadMunicipios);
  // Todas as consultas têm prazo e limite de concorrência; erros não apagam dados válidos.
  async function fetchJson(url, { signal, cache = "no-store" } = {}) {
    const ctrl = new AbortController(),
      abort = () => ctrl.abort(signal.reason);
    if (signal?.aborted) abort();
    else signal?.addEventListener("abort", abort, { once: true });
    const timer = setTimeout(() => ctrl.abort(), 15000);
    try {
      const r = await fetch(url, { cache, signal: ctrl.signal });
      if (!r.ok) throw Error(`HTTP ${r.status}`);
      return await r.json();
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
    }
  }
  async function pool(items, fn, limit = 4) {
    let next = 0;
    const results = new Array(items.length);
    await Promise.all(
      Array.from({ length: Math.min(limit, items.length) }, async () => {
        while (next < items.length) {
          const i = next++;
          try {
            results[i] = { status: "fulfilled", value: await fn(items[i]) };
          } catch (reason) {
            results[i] = { status: "rejected", reason };
          }
        }
      }),
    );
    return results;
  }
  const tseDate = ElectionCore.timestamp;
  function updateClocks() {
    const d = S.data,
      stamp = d ? tseDate(d.dt, d.ht) : null;
    $("kUnchanged").textContent = S.resultChangedAt
      ? `${Math.max(0, Math.floor((Date.now() - S.resultChangedAt) / 60000))} min`
      : "—";
    $("kTime").textContent = stamp ? d.ht : "—";
    $("kDate").textContent = stamp
      ? `${d.dt} • Brasília (UTC−3)`
      : "Horário oficial indisponível";
    const minutes = stamp
      ? Math.floor((Date.now() - stamp.getTime()) / 60000)
      : null;
    $("kSilence").textContent =
      minutes == null || minutes < 0 ? "—" : `${minutes} min`;
    $("kSilenceHint").textContent =
      minutes < 0
        ? "Horário futuro: confira o relógio do dispositivo"
        : d?.and === "f"
          ? "Totalização finalizada pelo TSE"
          : stamp
            ? "Desde o horário da última totalização; consultas não reiniciam o contador"
            : "Aguardando horário oficial";
    $("kChecked").textContent = S.checkedAt
      ? S.checkedAt.toLocaleTimeString("pt-BR", {
          timeZone: "America/Sao_Paulo",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      : "—";
    $("kCheckedHint").textContent =
      "Consulta com arquivo válido • horário de Brasília";
  }
  async function checkAvailability(force = false) {
    if (!force && S.configChecked && Date.now() - S.configChecked < 300000)
      return S.available;
    const d = await fetchJson(
      "https://resultados.tse.jus.br/oficial/comum/config/ele-c.json",
    );
    const available = ElectionCore.electionAvailable(d, PRES26.e);
    S.available = available;
    S.configChecked = Date.now();
    return available;
  }
  async function loadFirst26() {
    if (S.first26) return;
    try {
      const d = ElectionCore.validate(await fetchJson(firstEndpoint26()), {
        election: PRES26_FIRST,
        turn: "1",
        uf: "br",
        year: 2026,
      });
      S.first26 = d;
      renderHistory();
      renderPolls();
      renderSimulation();
    } catch (e) {
      console.warn(
        "Histórico de 2026 não disponível ou incompatível:",
        e.message,
      );
    }
  }
  async function load26() {
    const d = ElectionCore.validate(await fetchJson(endpoint26()), {
      election: PRES26.e,
      uf: "br",
      year: 2026,
    });
    ElectionCore.requireCurrent(S.data, d);
    const signature = ElectionCore.resultVersion(d);
    if (S.resultSignature !== signature) {
      S.resultSignature = signature;
      S.resultChangedAt = Date.now();
    }
    S.data = d;
    S.idg = ElectionCore.version(d);
    S.checkedAt = new Date();
    return d;
  }
  async function loadState26(uf) {
    try {
      const d = ElectionCore.validate(await fetchJson(stateEndpoint26(uf)), {
        election: PRES26.e,
        uf,
        year: 2026,
      });
      ElectionCore.requireCurrent(S.states[uf], d);
      S.states[uf] = d;
      S.stateIdg[uf] = ElectionCore.version(d);
      delete S.stateErrors[uf];
      return d;
    } catch (e) {
      S.stateErrors[uf] = e.message;
      throw e;
    }
  }
  async function load22() {
    const rs = await pool(UFS, async (m) => {
      const d = await fetchJson(stateEndpoint22(m.uf), {
        cache: "force-cache",
      });
      if (
        String(d.ele) !== "544" ||
        String(d.t) !== "2" ||
        !Array.isArray(d.cand)
      )
        throw Error("Histórico incompatível");
      S.states22[m.uf] = d;
    });
    $("hist2022Status").textContent =
      `2022: ${rs.filter((r) => r.status === "fulfilled").length}/27 UFs carregadas`;
    renderRegions();
  }
  function reportData(text, error = false) {
    $("dataStatus").className = error ? "notice warn" : "notice";
    $("dataStatus").textContent = text;
  }
  async function refresh(force = false) {
    if (S.busy) return;
    if (!navigator.onLine) {
      reportData(
        "Sem conexão. Dados anteriores, se houver, permanecem visíveis com o horário original.",
        true,
      );
      S.seconds = 120;
      return;
    }
    S.busy = true;
    $("refresh").disabled = true;
    $("status").textContent = "Consultando TSE…";
    try {
      const available = await checkAvailability(force);
      if (!available) {
        $("dot").className = "dot err";
        $("status").textContent =
          "2º turno não confirmado na configuração do TSE";
        reportData(
          "Informação indisponível: o identificador de 2º turno configurado não foi confirmado pelo TSE. Nenhum resultado de outro pleito será utilizado." +
            (S.data
              ? " Os dados anteriores estão preservados; confira seu horário."
              : ""),
          true,
        );
        S.seconds = 300;
        return;
      }
      const rs = await pool(["br", ...UFS.map((m) => m.uf)], (uf) =>
        uf === "br" ? load26() : loadState26(uf),
      );
      const ok = rs.filter((r) => r.status === "fulfilled").length;
      S.failures = ok === 28 ? 0 : (S.failures || 0) + 1;
      renderAll();
      updateStateLeadKpis();
      $("dot").className = ok === 28 ? "dot" : "dot err";
      $("status").textContent = `TSE: ${ok}/28 arquivos válidos nesta consulta`;
      reportData(
        `${ok ? "Arquivos recebidos do TSE e validados para eleição, cargo, turno e data de 2026." : "Não foi possível atualizar os resultados."} ${rs[0].status === "rejected" ? "Brasil sem atualização nesta consulta. " : ""}${27 - Object.keys(S.states).length} UFs sem dados. ${ok < 28 ? "Atualização incompleta: arquivos anteriores permanecem com seus horários originais." : "Resultados parciais até finalização oficial."}`,
        ok < 28,
      );
      S.seconds =
        ok === 28 ? 30 : Math.min(300, 30 * 2 ** Math.min(S.failures, 3));
      if (!S.first26) void loadFirst26();
    } catch (e) {
      S.failures = (S.failures || 0) + 1;
      $("dot").className = "dot err";
      $("status").textContent = "Falha ao consultar o TSE";
      reportData(
        `Não foi possível confirmar a configuração oficial: ${e.message}. Nenhum arquivo não validado será utilizado. ${S.data ? "Últimos dados preservados; confira o horário oficial." : "Resultados indisponíveis."}`,
        true,
      );
      S.seconds = Math.min(300, 30 * 2 ** Math.min(S.failures, 3));
    } finally {
      S.busy = false;
      $("refresh").disabled = false;
      $("timer").textContent = S.seconds + "s";
      updateClocks();
    }
  }
  $("refresh").addEventListener("click", () => refresh(true));
  $("resetSim").addEventListener("click", () => {
    S.sim = {};
    renderSimulation();
  });
  S.stateErrors = {};
  nav();
  renderAll();
  loadGeo();
  load22();
  refresh(true);
  setInterval(() => {
    if (!S.busy && !document.hidden) {
      S.seconds = Math.max(0, S.seconds - 1);
      $("timer").textContent = S.seconds + "s";
      if (S.seconds === 0) refresh(false);
    }
    updateClocks();
  }, 1000);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && S.seconds === 0) refresh(false);
  });
  window.addEventListener("online", () => refresh(true));
})();
