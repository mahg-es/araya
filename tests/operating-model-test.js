#!/usr/bin/env node
// ARAYA S1 — Deterministic Operating Model tests (ADR-0021 / REQ-051).
// Exit codes decide. No pipelines decide PASS/FAIL.
const { execFileSync } = require("node:child_process");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
let passed = 0, failed = 0;
const failures = [];
function check(label, cond, detail) {
  if (cond) passed++;
  else { failed++; failures.push(`${label}${detail ? ` — ${detail}` : ""}`); }
}

const out = execFileSync("npx", ["tsx", "-e", `
import {
  resolveAuthorityClass, preActionGate, preDispositionGate,
  verifyCapability, deriveState
} from "./src/araya/operating-model/index";

const r = {};

// ── Authority resolution ──────────────────────────────────────────────
r.a1 = resolveAuthorityClass({ canonicalRepository:true, canonicalPlacement:true, lifecycleStatus:"current", approvedBranchState:"dev-araya-portfolio", governingSourcePresent:true, acceptanceState:"merged" });
r.a2 = resolveAuthorityClass({ canonicalRepository:true, canonicalPlacement:false, lifecycleStatus:"draft", approvedBranchState:"feature/x", governingSourcePresent:false, acceptanceState:"proposed" });
r.a3 = resolveAuthorityClass({ canonicalRepository:false, canonicalPlacement:false, lifecycleStatus:"draft", approvedBranchState:"", governingSourcePresent:false, acceptanceState:"proposed" });
r.a4 = resolveAuthorityClass({ canonicalRepository:true, canonicalPlacement:true, lifecycleStatus:"draft", approvedBranchState:"feature/x", governingSourcePresent:false, acceptanceState:"proposed" });

// ── Pre-action gate ───────────────────────────────────────────────────
r.pa1 = preActionGate({ newSubstantiveOwnerIntent:true, requirementInRepositoryTruth:false, authorityClass:"REPOSITORY_TRUTH", requiredArchitecturePresent:true, requiredDependencySatisfied:true, candidateIdentityStale:false, stageAuthorized:true });
r.pa2 = preActionGate({ newSubstantiveOwnerIntent:true, requirementInRepositoryTruth:true, authorityClass:"REPOSITORY_TRUTH", requiredArchitecturePresent:true, requiredDependencySatisfied:true, candidateIdentityStale:false, stageAuthorized:true });
r.pa3 = preActionGate({ newSubstantiveOwnerIntent:false, requirementInRepositoryTruth:true, authorityClass:"UNKNOWN", requiredArchitecturePresent:true, requiredDependencySatisfied:true, candidateIdentityStale:false, stageAuthorized:true });
r.pa4 = preActionGate({ newSubstantiveOwnerIntent:false, requirementInRepositoryTruth:true, authorityClass:"WORKING_ARTIFACT", requiredArchitecturePresent:true, requiredDependencySatisfied:true, candidateIdentityStale:false, stageAuthorized:true });
r.pa5 = preActionGate({ newSubstantiveOwnerIntent:false, requirementInRepositoryTruth:true, authorityClass:"REPOSITORY_TRUTH", requiredArchitecturePresent:false, requiredDependencySatisfied:true, candidateIdentityStale:false, stageAuthorized:true });
r.pa6 = preActionGate({ newSubstantiveOwnerIntent:false, requirementInRepositoryTruth:true, authorityClass:"REPOSITORY_TRUTH", requiredArchitecturePresent:true, requiredDependencySatisfied:true, candidateIdentityStale:true, stageAuthorized:true });
r.pa7 = preActionGate({ newSubstantiveOwnerIntent:false, requirementInRepositoryTruth:true, authorityClass:"REPOSITORY_TRUTH", requiredArchitecturePresent:true, requiredDependencySatisfied:true, candidateIdentityStale:false, stageAuthorized:false });
r.pa8 = preActionGate({ newSubstantiveOwnerIntent:false, requirementInRepositoryTruth:true, authorityClass:"REPOSITORY_TRUTH", requiredArchitecturePresent:true, requiredDependencySatisfied:true, candidateIdentityStale:false, stageAuthorized:true });

// ── Pre-disposition gate (the S0→S1 regression) ───────────────────────
r.pd1 = preDispositionGate({ disposition:"STOP", nextEligibleActionExists:true, stageAuthorized:true, blockerExists:false, verificationRequiredButAbsent:false, repositoryTruthPublicationRequiredButAbsent:false });
r.pd2 = preDispositionGate({ disposition:"STOP", nextEligibleActionExists:false, stageAuthorized:true, blockerExists:false, verificationRequiredButAbsent:false, repositoryTruthPublicationRequiredButAbsent:false });
r.pd3 = preDispositionGate({ disposition:"STOP", nextEligibleActionExists:false, stageAuthorized:true, blockerExists:false, verificationRequiredButAbsent:true, repositoryTruthPublicationRequiredButAbsent:false });
r.pd4 = preDispositionGate({ disposition:"STOP", nextEligibleActionExists:false, stageAuthorized:true, blockerExists:false, verificationRequiredButAbsent:false, repositoryTruthPublicationRequiredButAbsent:true });

// ── Verification capability (persona-free) ────────────────────────────
const sha = "d8897280d91766e4f0311198ed9ccaf890531d55";
r.v1 = verifyCapability({ producerIdentity:"Daneel", verifierIdentity:"AX3", candidateSha:sha, disposition:"STOP", evidenceDurable:true }, sha);
r.v2 = verifyCapability({ producerIdentity:"Daneel", verifierIdentity:"Daneel", candidateSha:sha, disposition:"STOP", evidenceDurable:true }, sha);
r.v3 = verifyCapability({ producerIdentity:"Daneel", verifierIdentity:"AX3", candidateSha:"deadbeef".repeat(5), disposition:"STOP", evidenceDurable:true }, sha);
r.v4 = verifyCapability({ producerIdentity:"Daneel", verifierIdentity:"AX3", candidateSha:sha, disposition:"FIX", evidenceDurable:true }, sha);
r.v5 = verifyCapability({ producerIdentity:"Daneel", verifierIdentity:"AX3", candidateSha:sha, disposition:"STOP", evidenceDurable:false }, sha);

// ── State derivation ──────────────────────────────────────────────────
r.s1 = deriveState({ currentStage:"3", currentNode:"S0", requirementInRepositoryTruth:true, authorityClass:"REPOSITORY_TRUTH", dependenciesSatisfied:true, candidateSha:sha, candidateShaStale:false, verificationPresent:true, verificationStale:false, repositoryTruthPublished:true, nextEligibleAction:"S1" });
r.s2 = deriveState({ currentStage:"3", currentNode:"S0", requirementInRepositoryTruth:false, authorityClass:"REPOSITORY_TRUTH", dependenciesSatisfied:true, candidateSha:sha, candidateShaStale:false, verificationPresent:true, verificationStale:false, repositoryTruthPublished:true, nextEligibleAction:null });

console.log(JSON.stringify(r));
`, ROOT], { encoding: "utf-8" });

const r = JSON.parse(out);

check("a1 merged canonical = REPOSITORY_TRUTH", r.a1 === "REPOSITORY_TRUTH", r.a1);
check("a2 feature-branch draft = WORKING_ARTIFACT", r.a2 === "WORKING_ARTIFACT", r.a2);
check("a3 external = EXTERNAL_INPUT", r.a3 === "EXTERNAL_INPUT", r.a3);
check("a4 canonical draft feature = WORKING_ARTIFACT (not RT)", r.a4 === "WORKING_ARTIFACT", r.a4);

check("pa1 new intent + no REQ → blocked", r.pa1.eligible === false && r.pa1.route === "BLOCK-EVIDENCE-GAP", JSON.stringify(r.pa1));
check("pa2 new intent + REQ present → eligible", r.pa2.eligible === true, JSON.stringify(r.pa2));
check("pa3 UNKNOWN authority → blocked", r.pa3.eligible === false, JSON.stringify(r.pa3));
check("pa4 WORKING_ARTIFACT → blocked", r.pa4.eligible === false, JSON.stringify(r.pa4));
check("pa5 missing architecture → blocked", r.pa5.eligible === false, JSON.stringify(r.pa5));
check("pa6 stale candidate → blocked", r.pa6.eligible === false, JSON.stringify(r.pa6));
check("pa7 stage not authorized → ESCALATE", r.pa7.eligible === false && r.pa7.route === "ESCALATE-AUTHORITY", JSON.stringify(r.pa7));
check("pa8 all good → eligible LOCK", r.pa8.eligible === true && r.pa8.route === "LOCK", JSON.stringify(r.pa8));

check("pd1 STOP with next eligible → REJECTED (S0→S1 regression)", r.pd1.allowed === false, JSON.stringify(r.pd1));
check("pd2 STOP no next → allowed", r.pd2.allowed === true, JSON.stringify(r.pd2));
check("pd3 STOP verification absent → rejected", r.pd3.allowed === false, JSON.stringify(r.pd3));
check("pd4 STOP publication absent → rejected", r.pd4.allowed === false, JSON.stringify(r.pd4));

check("v1 independent STOP exact SHA → PASS", r.v1 === "PASS", r.v1);
check("v2 producer==verifier → FAIL", r.v2 === "PRODUCER_IS_VERIFIER", r.v2);
check("v3 stale SHA → FAIL", r.v3 === "STALE_SHA", r.v3);
check("v4 non-STOP → MISSING_VERIFICATION", r.v4 === "MISSING_VERIFICATION", r.v4);
check("v5 non-durable → NON_DURABLE_EVIDENCE", r.v5 === "NON_DURABLE_EVIDENCE", r.v5);

check("s1 state derived with next eligible S1, terminal ineligible", r.s1.nextEligibleAction === "S1" && r.s1.terminalDispositionEligibility === false, JSON.stringify(r.s1));
check("s1 REQUIREMENT_FIRST invariant true when REQ in RT", r.s1.invariants.find(i => i.name === "REQUIREMENT_FIRST").satisfied === true, JSON.stringify(r.s1.invariants));
check("s2 REQUIREMENT_FIRST invariant false when REQ absent", r.s2.invariants.find(i => i.name === "REQUIREMENT_FIRST").satisfied === false, JSON.stringify(r.s2.invariants));

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) { console.log(failures.join("\n")); process.exit(1); }
