---
title: Neural Ranking & Retrieval Models
short: The core machinery — ranking objectives, query reformulation, and generative approaches to retrieval.
leadQuestion: Most retrieval systems optimize a surrogate for the metric they are judged on. What if they did not have to?
order: 4
---

This is the lab's methodological centre: the models, losses and representations that retrieval
runs on. Much of ranking practice rests on convenient approximations — differentiable stand-ins
for metrics that are not differentiable, expansion heuristics that predate the models now doing
the expanding. We are interested in what happens when those approximations are replaced.

Current directions include end-to-end joint optimization of ranker and loss, casting ranking as
a denoising diffusion process, evidence-grounded query expansion with LLMs, and generative
models for expert team formation. We also run reproducibility studies, because a field moving
this fast accumulates results that nobody has checked.

**Representative work**

- *From Noise to Order: Learning to Rank via Denoising Diffusion* — ICTIR 2026
- *LearnDCG: End-to-End Joint Optimization of Ranker and Loss in Neural Ranking* — SIGIR 2026
- *EviQE: Evidence Selection for LLM-Based Query Expansion* — CIKM 2026
- *A Reproducibility Study of LLM-Based Query Reformulation* — SIGIR 2026
