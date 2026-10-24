const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  P = require("../live-poll");
test("intervalo normal e backoff", () => {
  assert.equal(P.NORMAL, 10);
  assert.equal(P.UNAVAILABLE, 300);
  assert.deepEqual([1, 2, 3, 4, 5].map(P.backoff), [60, 120, 240, 300, 300]);
});
test("acompanhamento valida eleição e 27 UFs", () => {
  const ufs = Array.from({ length: 27 }, (_, i) => `u${i}`),
    d = {
      ele: "6258",
      t: "2",
      f: "o",
      abr: ufs.map((cdabr) => ({ cdabr, tpabr: "uf", and: "p" })),
    };
  assert.equal(P.tracker(d, ufs).size, 27);
  assert.throws(() => P.tracker({ ...d, t: "1" }, ufs));
  assert.throws(() => P.tracker({ ...d, abr: d.abr.slice(1) }, ufs));
});
test("UF inalterada não baixa; alteração, ausência, botão e rechecagem baixam", () => {
  const x = {
    loaded: true,
    previous: "a",
    current: "a",
    checked: 1000,
    now: 11000,
  };
  assert.equal(P.due(x), false);
  for (const fields of [
    { loaded: false },
    { current: "b" },
    { force: true },
    { now: 301000 },
  ])
    assert.equal(P.due({ ...x, ...fields }), true);
});
test("horário oficial faz parte da assinatura, consulta local não", () => {
  const d = { idg: "1", dt: "25/10/2026", ht: "18:00:00", s: { pst: "20" } };
  assert.equal(P.signature(d), P.signature({ ...d, checkedAt: 999 }));
  assert.notEqual(P.signature(d), P.signature({ ...d, ht: "18:10:00" }));
});
test("Retry-After numérico e HTTP-date", () => {
  assert.equal(P.retrySeconds("120"), 120);
  assert.equal(
    P.retrySeconds(
      "Sun, 25 Oct 2026 21:02:00 GMT",
      Date.parse("2026-10-25T21:00:00Z"),
    ),
    120,
  );
});
test("bloqueio impede também pedido manual até liberar intervalo", async () => {
  let calls = 0,
    now = 0;
  const c = P.client(
    async () => {
      calls++;
      return { ok: false, status: 429, headers: { get: () => "600" } };
    },
    () => now,
  );
  await assert.rejects(c.json("x"), /429/);
  assert.equal(c.remaining(), 600);
  await assert.rejects(c.json("x"), /Aguardando/);
  assert.equal(calls, 1);
  now = 600000;
  await assert.rejects(c.json("x"), /429/);
  assert.equal(calls, 2);
});
