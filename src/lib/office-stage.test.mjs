import test from "node:test";
import assert from "node:assert/strict";
import { packetStage, isPending } from "./office-stage.ts";

const no = { signedLatest: false, askedTech: false };

test("recorded office stages win", () => {
  for (const s of ["approved", "inspection", "closed"]) assert.equal(packetStage(s, { signedLatest: true, askedTech: true }), "approved");
  assert.equal(packetStage("submitted", { signedLatest: true, askedTech: false }), "submitted");
});

test("ready to submit only when the latest version is signed", () => {
  assert.equal(packetStage("preparing", no), "review");
  assert.equal(packetStage("new", { ...no, signedLatest: true }), "ready");
  assert.equal(packetStage(null, no), "review");
});

test("asking the tech shows as missing info", () => {
  assert.equal(packetStage("new", { ...no, askedTech: true }), "missing");
});

test("asked_tech keeps a conflict open; real decisions close it; missing stays open", () => {
  assert.equal(isPending({ kind: "conflict", decision: null }), true);
  assert.equal(isPending({ kind: "conflict", decision: "asked_tech" }), true);
  assert.equal(isPending({ kind: "conflict", decision: "use_evidence" }), false);
  assert.equal(isPending({ kind: "conflict", decision: "keep_with_note" }), false);
  assert.equal(isPending({ kind: "missing", decision: null }), true);
  assert.equal(isPending({ kind: "matched", decision: null }), false);
});
