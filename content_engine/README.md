# content_engine — joshuafink.com

Local-LLM (Ollama) powered pipeline that produces draft blog posts for
`lib/blog.ts`. Runs on Chuck's machine, commits nothing directly — every
output is a human-approval-gated draft under `output/drafts/` that must
be hand-merged into `lib/blog.ts`.

## Pipeline

```
keyword_queue → researcher → writer → quality_check → publisher
                                          │
                             ┌────────────┴─────────────┐
                             ▼                          ▼
                   output/drafts/{slug}.md     output/rejected/{slug}.md
                   output/drafts/{slug}.ts.txt
                                │
                                ▼
                 human review + copy/paste into lib/blog.ts
```

## The 2026-04-19 hardening

The earlier version of this engine produced 10 nearly-identical "Living in
[City]" posts that shared paragraphs verbatim (see the Phase 3 audit in
`lib/blog.ts` → `rewriteTierSlugs`). The root cause was a one-size-fits-all
prompt with too-low temperature and no uniqueness check.

This version closes those gaps:

### `prompts/writer.md`

Canonical prompt lives as markdown, not inline Python. Enforces:

- Specific opener rule — first sentence must name a street, subdivision,
  price, school zone, or recent event
- 3-of-6 angle picker — prevents "one of every angle" template drift
- 2+ proprietary data points required from the research brief
- Banned phrase list (`keeps showing up for a reason`, `delve into`, etc.)
- Source-at-claim rule for any number
- TREC compliance rider for cash-offer / legal keywords

### `engine/writer.py`

- Loads the prompt from `prompts/writer.md`
- Enforces `temperature >= 0.8` (lower values collapse onto template
  scaffolding)
- Adds `repeat_penalty: 1.15`
- Detects compliance-sensitive keywords and appends the rider

### `engine/quality_check.py`

Four local gates run BEFORE the LLM self-score (cheap and deterministic):

1. **Banned-phrase detector** — fails the post if ≥ 2 audit-flagged AI
   tells appear
2. **Uniqueness gate** — computes word-trigram Jaccard similarity against
   every published post in `lib/blog.ts`; fails if overlap > 0.45
3. **Readability floor** — Flesch-Kincaid ≥ 40
4. **Compliance check** — if the keyword requires the TREC rider, the
   article body must mention TREC or TCA § 62-13-403

Any failure lands the post in `output/rejected/` with explicit `issues`
in frontmatter. The LLM self-score is skipped on hard rejects to save
Ollama cycles.

### `engine/publisher.py`

- `status: rejected` for local-gate failures (regardless of LLM score)
- `status: draft` for posts that clear all gates AND score ≥ min_quality_score
- `status: draft-borderline` for gate-passing posts in the 5.0–7.0 range
- Frontmatter now records `uniqueness_score`, `banned_phrases_found`,
  `compliance_required`, `compliance_ok`

## Running

```bash
# One-shot run (expects Ollama on localhost:11434)
python -m content_engine.main

# Or
cd content_engine && python main.py
```

Approved drafts must be merged by copy-pasting the `{slug}.ts.txt` snippet
into `lib/blog.ts` before they appear on the live site. The publisher
never writes to `lib/blog.ts` directly by design — that's the human
approval gate.

## Regenerating the Phase 3 rewrite-tier posts

```bash
# After the hardened prompts are merged, re-run against the flagged slugs
python -m content_engine.main --slugs "$(node -e "
  import('./lib/blog.ts').then(m =>
    console.log(m.rewriteTierSlugs.join(','))
  )
")"
```

(Or, simpler: paste the 10 slugs from `lib/blog.ts` → `rewriteTierSlugs`
into the keyword queue and let the normal pipeline run.)

## Mirrored to `content_engine_cash_offer/`

The cash-offer-specific engine mirrors `engine/writer.py`,
`engine/quality_check.py`, `engine/publisher.py`, and `prompts/writer.md`.
Its config and keyword queue differ; its prompt can diverge later if
cash-offer content needs a specialized rider beyond the shared rules.
