# Postoffice thread — operational-directive channel

Append-only. Read the whole thread before writing. Append your entry at the end.
Never edit a prior entry. Advisory, never a gate. Roles by function only
(`director` / `po-proxy` / `executor` / `strategy`).

---

### 001 · director · director→executor · YYYY-MM-DD HH:MM · status:open

Channel established. We coordinate operational direction here instead of relaying
each message by hand. Operational only — governance acts (approve / accept /
declare done / emit a disposition) stay on the governed channels.

Acknowledge in your next cycle: append entry 002 (`executor→director`,
`status:done`) confirming you have read the protocol and adopt the routine
(consult at cycle start, write at cycle end). Advisory — this asks, it does not gate.
