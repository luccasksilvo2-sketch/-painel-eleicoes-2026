const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  C = require("../compare-core");
const fixture = (id = "6258", end = true, votes = 120) => ({
  ele: id,
  t: id === "6258" ? "2" : "1",
  f: "o",
  cdabr: "04707",
  and: end ? "f" : "p",
  s: { ts: "100", st: end ? "100" : "50", pst: end ? "100,00" : "50,00" },
  dt: "25/10/2026",
  ht: "18:30:00",
  carg: [
    {
      cd: "1",
      agr: [
        {
          par: [
            {
              cand: [
                { nmu: "LULA", vap: String(votes), pvap: "60,00" },
                { nmu: "FLAVIO BOLSONARO", vap: "80", pvap: "40,00" },
              ],
            },
          ],
        },
      ],
    },
  ],
});
const parse = (d) => C.parse(d, d.ele, "04707");
test("confirma elo oficial cdt2 antes da publicação do segundo turno", () => {
  assert(
    C.config({
      pl: [
        {
          c: "ele2026",
          e: [
            { cd: "6257", t: "1", cdt2: "6258", abr: [{ cp: [{ cd: "1" }] }] },
          ],
        },
      ],
    }),
  );
  assert.throws(() => C.config({ pl: [] }));
});
test("crescimento e pontos percentuais", () => {
  const a = parse(fixture("6257", true, 100)),
    b = parse(fixture());
  assert.deepEqual(C.delta(a, b, "lula"), {
    first: 100,
    second: 120,
    pct1: 60,
    pct2: 60,
    diff: 20,
    variation: 20,
    pp: 0,
    final: true,
  });
});
test("queda final mantém sinal", () => {
  assert.equal(
    C.delta(parse(fixture("6257", true, 200)), parse(fixture()), "lula").diff,
    -80,
  );
});
test("provisório mostra votos sem queda artificial", () => {
  const r = C.delta(
    parse(fixture("6257", true, 200)),
    parse(fixture("6258", false, 1)),
    "lula",
  );
  assert.equal(r.second, 1);
  assert.equal(r.diff, null);
  assert.equal(r.variation, null);
  assert.equal(r.pp, null);
});
test("não iniciado não é zero votos", () => {
  const d = fixture();
  d.and = "n";
  d.s.pst = "0";
  const r = C.delta(parse(fixture("6257")), parse(d), "lula");
  assert.equal(r.second, null);
  assert.equal(r.diff, null);
});
test("divisão por zero permanece indefinida", () => {
  const r = C.delta(parse(fixture("6257", true, 0)), parse(fixture()), "lula");
  assert.equal(r.variation, null);
  assert.equal(r.diff, 120);
});
test("escopo, eleição, turno e cargo incorretos rejeitados", () => {
  for (const [k, v] of [
    ["cdabr", "1502152"],
    ["ele", "6257"],
    ["t", "1"],
    ["f", "s"],
  ]) {
    const d = fixture();
    d[k] = v;
    assert.throws(() => C.parse(d, "6258", "04707"));
  }
  const d = fixture();
  d.carg[0].cd = "3";
  assert.throws(() => parse(d));
});
test("valor inválido não vira zero", () => {
  for (const v of ["", null, "NaN", "-1", "1.5"]) {
    const d = fixture();
    d.carg[0].agr[0].par[0].cand[0].vap = v;
    assert.throws(() => parse(d));
  }
});
test("região exige cobertura integral e pondera seções", () => {
  const a = parse(fixture()),
    b = parse(fixture("6258", false));
  assert.equal(C.aggregate([a, null]), null);
  const r = C.aggregate([a, b]);
  assert.equal(r.sections, 75);
  assert.equal(r.final, false);
  assert.equal(r.cand.lula.votes, 240);
});
