# OpenClaw Persistent Memory Analysis from a MASA Perspective

## Executive summary

OpenClaw (the personal AI assistant framework, not the unrelated “Captain Claw” reimplementation project that also uses the name) has a persistence stack that is deliberately optimized around bounded-context prompting: it keeps a durable append-only transcript on disk, but treats the model context window as a cache that must be actively managed with pruning, compaction, and retrieval from disk-backed “memory” files. citeturn1view0turn5view0turn18view0turn0search21

From your MASA framing (“semantic utility” vs “causal/axiomatic utility”), OpenClaw’s primitives are strongest at: (a) isolating and routing conversational state, (b) minimizing token/cost blow-ups (especially for Anthropic prompt caching), and (c) retrieving relevant Markdown knowledge via hybrid sparse+dense search. citeturn3view0turn1view2turn18view0turn13search0

The key mismatch MASA is trying to address is epistemic: OpenClaw’s compaction and memory are fundamentally text/log-centric (they store summaries and Markdown notes), whereas MASA wants durable “axioms” aligned to a causal hierarchy (association → intervention → counterfactual). That is not a criticism of OpenClaw; it’s a statement about what its storage objects are and are not. citeturn5view0turn18view0turn14search3turn14search32

## OpenClaw persistence primitives

OpenClaw centralizes session state in a single Gateway process (“source of truth”), and persists sessions in two layers: a mutable session store (`sessions.json`) holding pointers/metadata, and append-only JSONL transcripts (`*.jsonl`) that store the actual conversation, tool calls, and compaction summaries. citeturn3view0turn16view1

The on-disk layout is explicit: per agent, the session store typically lives at `~/.openclaw/agents/<agentId>/sessions/sessions.json`, and transcripts live alongside it as `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl` (with channel-specific variants like Telegram topic suffixes). citeturn3view0turn16view1

Session isolation is configured primarily through `sessionKey` routing and DM grouping controls. OpenClaw documents canonical session key patterns (for main, group, cron, webhooks, etc.) and also supports `session.dmScope` modes that determine whether DMs share one “main” context or are isolated per peer / per channel+peer / per account+channel+peer—explicitly motivated as a safety boundary for multi-user DM inboxes. citeturn3view0turn6view0turn16view1turn17view0

Transcripts are tree-structured JSONL (entries with `id` + `parentId`, plus special entry types). Notably for MASA-style auditability: compaction is persisted as a `compaction` entry (with `firstKeptEntryId` and token metadata), and the transcript is the material used to rebuild future model context (distinct from transient pruning). citeturn2view2turn3view0

## TTL-aware pruning and prompt-caching economics

OpenClaw’s “session pruning” is explicitly not durable forgetting: it trims old tool results from the in-memory context *right before an LLM call* and “does not rewrite the on-disk session history (`*.jsonl`).” citeturn1view2turn5view1

The pruning trigger is designed around Anthropic prompt caching TTL behavior: when `mode: "cache-ttl"` is enabled, pruning runs when the last Anthropic call for the session is older than the configured `ttl`, and OpenClaw recommends matching this to the model’s cache TTL. This makes pruning a cache-write minimization step for the first post-idle request, as OpenClaw explains in its “cost + cache behavior” rationale. citeturn1view2turn5view1turn13search0turn13search3

This aligns with how Anthropic describes prompt caching: caching is a prefix-based optimization controlled via `cache_control`, with TTL options (commonly 5 minutes by default and an extended 1-hour option), and usage reporting that distinguishes cache write vs cache reads. citeturn13search0turn13search3turn13search9

Mechanically, OpenClaw constrains what pruning can touch: only `toolResult` messages are eligible; user and assistant messages are never modified; recent assistant turns are protected via `keepLastAssistants`; tool results with image blocks are skipped; and the system uses approximate char-based heuristics (e.g., chars ≈ tokens × 4) plus a two-stage policy of “soft-trim” (head+tail preservation with elision) and “hard-clear” (placeholder replacement). citeturn1view2turn5view1

A practical nuance (relevant to MASA’s “keep high-integrity evidence” idea): OpenClaw treats image-bearing tool results as non-prunable, and external evidence suggests prompt-caching edge cases around images inside tool results have existed in Anthropic integrations—so “preserve tool outputs with images” is not just epistemic conservatism; it can also avoid brittle caching behavior. citeturn1view2turn13search5

An alternative systems-level approach (devil’s advocate against “prune tool results” as the only answer) is to prevent tool results from becoming part of the cacheable prefix in the first place—e.g., research on agentic prompt caching describes strategies that deliberately exclude tool results from caching boundaries to avoid caching dynamic, session-specific payloads. This is not OpenClaw’s current default strategy, but it matters when you’re designing MASA’s “causal sieve” layer: pruning is one lever, cache-boundary design is another. citeturn0search12turn1view2

## Compaction and the limits of summaries

OpenClaw compaction is a persistent operation: it “summarizes older conversation into a compact summary entry” stored in session JSONL, and future turns then use the compaction summary plus messages after the compaction point. citeturn5view0turn3view0

Operationally, auto-compaction is tied to context-window pressure: in embedded Pi sessions, OpenClaw documents two triggers—overflow recovery (compact → retry after a context overflow error) and threshold maintenance when `contextTokens > contextWindow - reserveTokens`—and it additionally enforces a safety floor (`reserveTokensFloor`) to keep enough headroom for housekeeping. citeturn2view2turn3view0turn5view1

OpenClaw also has a “safeguard” compaction mode described as chunked summarization for long histories, with configuration surfaced as `agents.defaults.compaction.mode: "default" | "safeguard"`. This matters for MASA because it implies OpenClaw already acknowledges that “one-shot summarize everything” is fragile on very long histories, and provides a more structured summarization path. citeturn5view1turn8search3turn4search15

Before compaction, OpenClaw implements a “pre-compaction memory flush”: a silent agentic turn (suppressed via the `NO_REPLY` convention) that prompts the agent to write durable notes to disk (e.g., `memory/YYYY-MM-DD.md`) before context is compacted. This flush runs once per compaction cycle (tracked in `sessions.json`), can be skipped in read-only workspaces, and is documented both in the session management deep dive and the memory subsystem docs. citeturn3view0turn18view0turn5view1

From a MASA epistemology lens, your core critique of compaction is technically well-founded: summaries are lossy, and modern abstractive summarization systems have well-documented failure modes around faithfulness (hallucinating or distorting content), even when the output “sounds right.” If compaction outputs become the canonical remembered representation, the system can end up preserving fluent error. citeturn5view0turn14search0turn14search1

This is where your “axioms vs summaries” proposal has a concrete justification: if MASA can transform a compaction window into a structured set of claims with provenance and constraints (what was observed, what was done, what would have happened otherwise), it’s attempting to reduce the semantic-loss and faithfulness-risk that generic summarization introduces. The causal hierarchy framing (association/intervention/counterfactual) provides a principled scaffolding for that transformation. citeturn14search3turn14search32turn14search20

## Persistent memory retrieval as “truth store”

OpenClaw’s long-term memory is “plain Markdown in the agent workspace,” with an explicit stance: “files are the source of truth; the model only ‘remembers’ what gets written to disk.” Memory tools are provided by a memory plugin (default `memory-core`), and can be disabled by configuration. citeturn18view0

The default memory layout is intentionally split into (at least) two layers: an append-only daily log (`memory/YYYY-MM-DD.md`) that is read at session start (today + yesterday), and an optional curated `MEMORY.md` intended for durable knowledge and only loaded in the main/private session (not group contexts). citeturn18view0turn16view1

Retrieval is implemented as an indexing + search pipeline over Markdown: `memory_search` queries chunked memory content (~400-token target, overlap), returning only snippets plus file path/line ranges and scores (not full file payloads), while `memory_get` reads specific memory files with path restrictions (it rejects paths outside `MEMORY.md` / `memory/`). citeturn18view0

Indexing is per-agent and stored in SQLite (documented default path: `~/.openclaw/memory/<agentId>.sqlite`), with file-watch-based invalidation and background sync; hybrid retrieval is supported by combining vector similarity with BM25 keyword relevance (via SQLite full-text search), with fallback to vector-only search if full-text is unavailable. citeturn18view0

OpenClaw’s hybrid search rationale is explicitly aligned with your “scientific projects need exact tokens” claim: it notes that vector search is weak on exact IDs and code symbols, while BM25 is strong there but weaker on paraphrases, so mixing the two is a pragmatic compromise. It also documents a simple weighted-score fusion approach and points to Reciprocal Rank Fusion as a possible next step. citeturn18view0turn1view3

A non-obvious but MASA-relevant extension point is that OpenClaw now documents: (a) an experimental QMD backend (local sidecar combining BM25 + vectors + reranking) and (b) optional indexing of sanitized session transcripts into retrieval (either via an experimental built-in flag or via QMD session collections). This begins to blur “memory files” and “session history” into a unified retrievable substrate—useful for MASA if you want “engrams” to include both curated knowledge and recent conversational evidence. citeturn18view0

## MASA bridge architecture and validation roadmap

Your “Pearlian bridge” proposal can be made concrete by aligning MASA’s desired epistemic objects to OpenClaw’s existing hook points: OpenClaw already distinguishes transient pruning (per-request), persistent compaction (writes a `compaction` entry), and durable memory flush (writes Markdown before compaction), and it explicitly notes that Pi exposes a `session_before_compact` hook even though OpenClaw’s current flush logic lives on the Gateway side. Those are natural interception seams for MASA’s axiom extraction and causal integrity scoring. citeturn3view0turn18view0turn5view1

On the “causal pruning” idea: OpenClaw pruning today is rule-based (tool-result-only, TTL-gated, head/tail trimming, protected recent assistants). MASA could treat OpenClaw’s pruning pass as a *policy injection point* where tool results are ranked by epistemic rung (association vs intervention vs counterfactual) rather than size/age alone, but the MASA policy must still respect OpenClaw’s cost/caching goals (i.e., the pruning pass exists because cache TTL expiration makes the *next* request expensive unless the prompt is trimmed). citeturn1view2turn13search0turn14search3turn14search32

On “fractal compaction”: OpenClaw’s safeguard mode already acknowledges that compaction must be chunked for very long histories, but it remains summarization-centric. MASA’s stronger move is to replace (or post-process) compaction summaries into a structured, auditable representation—e.g., axioms + provenance pointers into the transcript tree—explicitly to mitigate faithfulness risk documented in summarization research. citeturn5view1turn3view0turn14search0turn14search1

On “cross-session causal lattice”: OpenClaw already provides session tools (`sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`) with (a) explicit key models, (b) reply-back ping-pong loops (`REPLY_SKIP`) and announce suppression (`ANNOUNCE_SKIP`), (c) sandbox visibility constraints, and (d) policy gating via `session.sendPolicy`. That is enough substrate to treat “axiom broadcasts” as a first-class inter-session message type, rather than shoehorning everything into natural-language chat. citeturn17view0turn16view3turn6view0turn16view2

A critical counter-interpretation (devil’s advocate against MASA overreach) is that many of the failure cases MASA wants to prevent may be solved with less epistemic machinery: better pre-compaction memory flush discipline, tighter compaction thresholds, and higher-quality retrieval governance (“search before answering; don’t rely on chat history”) can yield most of the practical benefit without building a causal theory layer. OpenClaw’s own docs push this “write it down; don’t keep it in RAM” posture very explicitly, and its memory subsystem is evolving in that direction. citeturn18view0turn5view0turn3view0

What is the evidence? Specifically, what empirical delta do you expect from “axiom extraction” versus (1) stricter memory-writing prompts, (2) hybrid retrieval improvements, and (3) better compaction tuning? Without an evaluation plan (precision/recall of recalled facts, regression rate of repeated mistakes, auditability metrics, and failure-mode taxonomy), MASA risks becoming an elegant abstraction that does not measurably outperform disciplined use of OpenClaw’s existing primitives. citeturn18view0turn14search0turn14search3turn1view2

Your staged roadmap maps cleanly onto OpenClaw realities if implemented as: (a) universal traceability by binding MASA `trace_id` equivalents to OpenClaw session keys / transcript entry IDs (tree structure is already explicit), (b) pruning policy injection that stays compatible with Anthropic TTL economics, and (c) compaction interception that uses the pre-compaction flush and/or `session_before_compact` seam to persist axioms before summaries can erase detail. citeturn3view0turn1view2turn18view0turn14search3turn13search0