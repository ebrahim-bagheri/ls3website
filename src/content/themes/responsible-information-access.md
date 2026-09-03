---
title: Responsible Information Access
short: Measuring and mitigating the social harms that search and recommendation systems reproduce.
leadQuestion: When a ranking model learns from human data, whose assumptions does it carry forward — and can we take them back out?
order: 1
---

Retrieval systems are trained on text people wrote, and they inherit the biases in it. A dense
retriever asked a neutral query can return a systematically gendered picture of who does a job;
a query reformulation model can quietly narrow what a user is allowed to find.

We work on making those effects measurable and then correctable. That means building the
datasets and metrics that let bias be observed in the first place, and designing training-time
interventions — regularization objectives, fair reformulation strategies — that reduce it
without destroying the retrieval effectiveness the system exists for.

The work extends past the model itself. We study how AI ethics is actually taught and assessed,
and how retrieval systems shape public narratives about groups of people who have little say in
how they are represented.

**Representative work**

- *A Regularization Framework for Gender Bias Mitigation in Dense Neural Rankers* — Machine Learning Journal, 2026
- *A Large-Scale Dataset for Gender-Fair Query Reformulations* — SIGIR 2026
- *AI ethics education: A scoping review of pedagogy, curriculum, and assessment* — IP&M, 2026
