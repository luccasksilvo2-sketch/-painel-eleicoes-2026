const { test } = require("node:test");
const assert = require("node:assert/strict");
const C = require("../election-core.js");
function result() {
  return {
    ele: "6258",
    t: "2",
    dt: "25/10/2026",
    ht: "18:00:00",
    carg: [
      {
        cd: "0001",
        agr: [
          {
            par: [
              {
                cand: [
                  { n: "13", nmu: "LULA", vap: "600", pvap: "60,00" },
                  {
                    n: "22",
                    nmu: "FLÁVIO BOLSONARO",
                    vap: "400",
                    pvap: "40,00",
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
}
test("números preservam decimais numéricos e formatos brasileiros", () => {
  assert.equal(C.number(50.25), 50.25);
  assert.equal(C.number("1.234,56"), 1234.56);
  assert.equal(C.number("1234"), 1234);
  assert.equal(C.percent("50,25"), 50.25);
  assert.equal(C.percent(50.25), 50.25);
  assert.equal(C.percent("5000"), 0);
});
test("configuração confirma identificador e turno; estrutura desconhecida falha", () => {
  assert(C.electionAvailable({ pl: [{ e: [{ cd: 6258, t: 2 }] }] }, "6258"));
  assert(!C.electionAvailable({ pl: [{ e: [{ cd: 6257, t: 1 }] }] }, "6258"));
  assert.throws(() => C.electionAvailable({}, "6258"));
});
test("arquivo presidencial e turno corretos são aceitos", () => {
  const d = result();
  assert.equal(C.validate(d, { election: "6258" }), d);
  assert.equal(C.candidates(d)[0].vap, "600");
});
test("outro turno, eleição ou cargo são rejeitados", () => {
  for (const [key, value] of [
    ["ele", "6257"],
    ["t", "1"],
  ]) {
    const d = result();
    d[key] = value;
    assert.throws(() => C.validate(d, { election: "6258" }));
  }
  const d = result();
  d.carg[0].cd = "3";
  assert.throws(() => C.validate(d, { election: "6258" }));
});
test("JSON incompatível e votos inválidos não viram zero", () => {
  for (const d of [
    { ele: "6258", t: "2" },
    { ...result(), carg: [] },
  ])
    assert.throws(() => C.validate(d, { election: "6258" }));
  for (const value of ["-1", "NaN", "1,5", "", null]) {
    const d = result();
    d.carg[0].agr[0].par[0].cand[0].vap = value;
    assert.throws(() => C.validate(d, { election: "6258" }));
  }
});
test("percentual e identidade duplicada são rejeitados", () => {
  let d = result();
  d.carg[0].agr[0].par[0].cand[0].pvap = "100,01";
  assert.throws(() => C.validate(d, { election: "6258" }));
  d = result();
  d.carg[0].agr[0].par[0].cand[1].n = "13";
  assert.throws(() => C.validate(d, { election: "6258" }));
});
test("escopo municipal e estadual discordante é rejeitado", () => {
  let d = { ...result(), uf: "pa", mun: "12345" };
  assert.equal(
    C.validate(d, { election: "6258", uf: "pa", municipality: "12345" }),
    d,
  );
  assert.throws(() => C.validate(d, { election: "6258", uf: "sp" }));
  assert.throws(() =>
    C.validate(d, { election: "6258", municipality: "54321" }),
  );
});
test("horário usa Brasília e rejeita datas impossíveis", () => {
  assert.equal(
    C.timestamp("25/10/2026", "18:00:00").toISOString(),
    "2026-10-25T21:00:00.000Z",
  );
  for (const [d, t] of [
    ["31/02/2026", "12:00"],
    ["25/10/2026", "25:00"],
    ["25/10/2026", "12:60"],
    ["", ""],
  ])
    assert.equal(C.timestamp(d, t), null);
});
test("versão muda sem idg e não muda ao consultar o mesmo resultado", () => {
  const a = result(),
    b = result();
  assert.equal(C.version(a), C.version(b));
  b.carg[0].agr[0].par[0].cand[0].vap = "601";
  assert.notEqual(C.version(a), C.version(b));
});
test("top 5 usa votos absolutos e desempate determinístico", () => {
  const rows = Array.from({ length: 7 }, (_, i) => ({
    cd: String(i),
    nm: `Cidade ${i}`,
    lula: i * 10,
    flavio: 70 - i * 10,
  }));
  assert.deepEqual(
    C.top(rows, "lula").map((r) => r.cd),
    ["6", "5", "4", "3", "2"],
  );
  assert.deepEqual(
    C.top(rows, "flavio").map((r) => r.cd),
    ["0", "1", "2", "3", "4"],
  );
  assert.equal(rows[0].cd, "0");
});
test("contagem agrupada em milhares continua inteira", () => {
  assert.equal(C.number("1.234"), 1234);
  const d = result();
  d.carg[0].agr[0].par[0].cand[0].vap = "1.234";
  assert.equal(C.validate(d, { election: "6258" }), d);
});
test("data fora de 2026 é rejeitada quando requerida", () => {
  const d = result();
  d.dt = "25/10/2022";
  assert.throws(() => C.validate(d, { election: "6258", year: 2026 }));
});
test("arquivo mais antigo não substitui a totalização atual", () => {
  const a = result(),
    b = result();
  b.ht = "17:59:59";
  assert.throws(() => C.requireCurrent(a, b));
  b.ht = "18:01:00";
  assert.equal(C.requireCurrent(a, b), b);
});
test("nova geração sem mudança nos votos não reinicia assinatura de resultado", () => {
  const a = result(),
    b = result();
  b.ht = "18:01:00";
  assert.equal(C.resultVersion(a), C.resultVersion(b));
  assert.notEqual(C.version(a), C.version(b));
});
