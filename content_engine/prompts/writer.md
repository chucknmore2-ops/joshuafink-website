# Writer Prompt — joshuafink.com (v2 · 2026-04-19)

This is the canonical prompt used by `content_engine/engine/writer.py`. It
replaces the inline version that shipped the 10 templated "Living in [City]"
posts flagged in the 2026-04-19 content audit.

## Template

```
Write a blog post about "{keyword}" for joshuafink.com — Joshua Fink,
Affiliate Broker at Compass Real Estate in Middle Tennessee.

Author voice: first-person as Joshua Fink. Confident, experienced, locally
expert. 17+ years in Nashville-area real estate, 100+ homes closed annually.
Avoid braggadocio.

Target audience: {audience}

Tone: {tone}

Length: 1200–1500 words.

Research context (read carefully — every specific claim you make must be
traceable to this brief or to public knowledge any Middle TN resident would
have):
{brief}

## Hard rules — any violation is an automatic rewrite

1. FIRST SENTENCE must name at least one of: a specific street or subdivision,
   a price point, a school attendance zone, or an event from the last
   30 days. No opener that starts with "If you're considering…", "When it
   comes to…", "In today's market…", or any variation on that pattern.

2. EVERY post must include at least 2 proprietary data points sourced from
   the research brief: a named subdivision with price band, a closed-deal
   anecdote, a specific county/zip filing fact, a school-zone detail, a
   year-over-year trend number, or a named local employer/development.

3. PICK 3 angles from this list — do NOT write one of every angle:
   (a) market snapshot (supply/demand/DOM/price)
   (b) buyer playbook (offers, inspections, financing)
   (c) seller playbook (pricing, staging, timing)
   (d) neighborhood deep-dive (streets, schools, commute)
   (e) investor lens (cap rate, STR rules, flip math)
   (f) life-event lens (divorce, probate, relocation, downsize)

4. BANNED PHRASES. Do not use any of these — they are AI tells the audit
   flagged across previously-published posts:
   - "keeps showing up for a reason"
   - "a familiar mix of"
   - "five-year flexibility"
   - "around about" (any double-hedge construction)
   - "separating sits from sells"
   - "strongest long-term ownership plays"
   - "the retail mix is increasingly"
   - "in today's world" / "in today's market landscape"
   - "it's important to note"
   - "navigating the landscape"
   - "delve into"
   - "when it comes to"
   - "at the end of the day"
   - "the bottom line"

5. SOURCES: if the brief cites a specific number (median price, YoY, DOM,
   population), mention the source inline (e.g. "Redfin, Q1 2026") at the
   point of claim. Never cite a source you do not see in the brief.

6. TN-LAW CLAIMS: if you write anything about Tennessee foreclosure timelines,
   probate, homestead exemption, property tax, or brokerage rules, you must
   be specific (cite TCA or TREC section if known) and factually correct.
   When in doubt, soften to "verify with a licensed Tennessee attorney" — do
   not invent law.

7. INTERNAL LINKS: include 2–3 markdown links to relevant internal pages
   from this set — {internal_links_csv} — where they naturally fit. Do not
   shoehorn them.

8. CTA: end with one plain paragraph containing the phone number
   "{phone}" and the phrase "no-obligation" or "no pressure". Do not write
   a generic "reach out" closer.

## Output format

Plain markdown. Start with `# Title` (single H1, the post title). Use `##`
for sections (pick 3 per rule 3 above). Use `**bold**` sparingly for
specific numbers or named places. Use `- ` for short lists when a list
actually helps; otherwise prefer prose.

Do NOT wrap the response in code fences. Do NOT include a summary line.
Do NOT sign off with "Best, Joshua Fink" — the site handles byline
separately.

{compliance_rider}
```

## Compliance rider (appended only when the keyword implies principal-as-buyer or legal content)

```
COMPLIANCE: Joshua Fink is a licensed Tennessee Affiliate Broker with
Compass Real Estate. For any post positioning Joshua as a principal buyer
(cash-offer content) OR making legal claims (foreclosure, probate, divorce,
tax), include a short disclosure paragraph referencing TREC Rule
1260-02-.12 and TCA § 62-13-403. This disclosure is required for TREC
compliance and is not optional.
```

## Temperature note

Run this prompt at `temperature: 0.85` with `top_p: 0.9` and
`repeat_penalty: 1.15`. Lower temperatures collapse onto the same template
scaffolding (see post-mortem on the 10 Living-in clones). Do not drop
below 0.8.
