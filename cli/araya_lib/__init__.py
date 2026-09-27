"""ARAYA capability foundation — shared library (Python stdlib only).

This package is the single shared implementation consumed by the ARAYA CLI
(`cli/araya`) and any future host adapters. It is deliberately free of:

- a global runtime / lifecycle hooks,
- an authority or approval ledger,
- an orchestration engine,
- durable workflow state.

Daneel (the Professor's personal Pi-level agent) is NOT part of ARAYA and is
never created, owned, or managed by this package.
"""

VERSION = "0.1.0"
CAPABILITY_FOUNDATION = "araya-capability-foundation"
