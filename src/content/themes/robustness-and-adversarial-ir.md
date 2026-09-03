---
title: Robustness & Adversarial IR
short: How neural rankers can be attacked, why they fail, and what it takes to defend them.
leadQuestion: If a search ranking can be moved by an adversary, what is a retrieval score actually worth?
order: 2
---

Neural ranking models are now deployed where the stakes are real — and where somebody benefits
from being ranked higher. That makes them a target. We study retrieval systems the way security
researchers study software: by trying to break them, precisely, and reporting what breaks.

Our work covers embedding-space perturbation attacks, adversarial content injection into
documents, and poisoning of the graphs that graph-based retrieval depends on. In each case the
question is the same: how small an intervention moves a ranking, and does the manipulated
content still look legitimate to a human reader?

Attack work is only half of it. Understanding *why* a query fails — in retrieval, in relevance
judgment, and in generation — is what turns a list of vulnerabilities into a design principle.

**Representative work**

- *EMPRA: Embedding Perturbation Rank Attack against Neural Ranking Models* — TOIS, 2026
- *Led to Mislead: Adversarial Content Injection for Attacks on Neural Ranking Models* — TIST, 2026
- *Graph Poisoning for Node Rank Manipulation* — TheWebConf 2026
- *Failing Forward: Understanding Query Failure in Retrieval, Judgment, and Generation* — SIGIR 2026
