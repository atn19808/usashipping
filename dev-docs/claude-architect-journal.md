# Claude Certified Architect — Learning Journal
## Hands-on documentation tied to quaxave.com (usashipping)

This document records what was built for each lesson, which exam concepts it demonstrates,
and key takeaways. Use this for exam review — each section maps real code to exam task statements.

---

## PHASE 1: Claude Code Configuration & Workflows (Domain 3 — 20%)

### Lesson 3.1 — CLAUDE.md Hierarchy, Scoping & Modular Organization
**Task Statement:** 3.1 — Configure CLAUDE.md files with appropriate hierarchy, scoping, and modular organization
**Status:** COMPLETE ✓ (2026-03-18)

**What was built:**
- Slimmed root `CLAUDE.md` from 179 → 54 lines (universal context only: overview, commands, imports, config, deployment)
- Created 5 path-scoped rule files in `.claude/rules/`:
  - `extensions.md` — `paths: ["extensions/**/*"]` — extension system, processor/hook, event system
  - `api-endpoints.md` — `paths: ["extensions/*/api/**/*"]` — API route convention, middleware types, service resolvers
  - `graphql.md` — `paths: ["extensions/*/graphql/**/*"]` — GraphQL type/resolver conventions
  - `migrations.md` — `paths: ["extensions/*/migration/**/*"]` — DB migration patterns
  - `page-components.md` — `paths: ["extensions/*/pages/**/*"]` — page exports, context bridge, SSR, checkout steps
- Created `dev-docs/cart-architecture.md` — full cart architecture reference doc
- Created `.claude/rules/cart-system.md` — path-scoped rule with `@import dev-docs/cart-architecture.md`, targeting all 10 cart files across both extensions
- Mapped DOE Framework (Directive-Orchestrator-Execution) to exam domains

**Exam concepts demonstrated:**
- **3-level hierarchy**: user (`~/.claude/CLAUDE.md`) → project (root `CLAUDE.md`) → directory-level
- **User-level NOT shared with teammates** — trap: new team member missing instructions = user-level config issue
- **`@import` syntax** for modularity — reference external files without inlining
- **`.claude/rules/`** with YAML frontmatter `paths:` glob patterns — rules load ONLY when editing matching files
- **Flat rule structure** — scoping comes from YAML `paths:` field, not file location in directory tree
- **Path-specific rules** (also Task 3.3) — glob patterns like `extensions/*/api/**/*` reduce token usage by loading context only when relevant
- **Test files spread across codebase** — `**/*.test.*` glob pattern catches them regardless of location

**Key takeaways:**
- CLAUDE.md should contain only universal context (what every file needs). Domain-specific knowledge goes in path-scoped rules.
- Path scoping is in the YAML frontmatter, NOT the file's location — don't mirror repo structure in `.claude/rules/`.
- DOE Framework maps cleanly: Directives = Domain 3 (CLAUDE.md/rules), Orchestration = Domain 1 (agentic loops), Execution = Domain 2 (MCP tools).
- "Directives guide the Orchestrator; the Orchestrator invokes Execution."

---

### Lesson 3.2 — Custom Slash Commands & Skills
**Task Statement:** 3.2 — Create and configure custom slash commands and skills
**Status:** COMPLETE ✓ (2026-03-19)

**What was built:**
- `.claude/commands/review.md` — reviews API endpoint for EverShop conventions (route.json, bracket naming, handler signature, response.$body, next()). Uses `$ARGUMENTS` for file path.
- `.claude/commands/extension-scaffold.md` — scaffolds new extension directory structure + bootstrap.js + config registration. Uses `$ARGUMENTS` for extension name.
- `.claude/commands/deploy-check.md` — pre-deployment checklist (no arguments): uncommitted changes, migration version bumps, undocumented env vars. Each check has explicit action/compare/pass/fail criteria.
- `.claude/skills/analyze-cart-flow/SKILL.md` — traces full cart data flow with `context: fork` (isolated context) and `allowed-tools: Read, Grep, Glob` (read-only).
- Also rewrote `dev-docs/cart-architecture.md` — corrected 7 misconceptions found during skill creation (syncAndNavigate didn't exist, background sync was missing, sync endpoints were wrong, etc.)

**Exam concepts demonstrated:**
- **`.claude/commands/`** = project-scoped (version-controlled, team-shared). **`~/.claude/commands/`** = personal (not shared). **Exam Q4 trap.**
- **`$ARGUMENTS`** placeholder — captures user input after the command name
- **Command design patterns**: reading commands (review) vs investigation commands (deploy-check) vs creation commands (extension-scaffold)
- **Investigation commands** need explicit action→compare→pass/fail criteria (not just "check X")
- **`.claude/skills/`** with `SKILL.md` frontmatter: `description`, `context`, `allowed-tools`
- **`context: fork`** — isolates verbose exploratory output from main conversation (prevents context pollution)
- **`allowed-tools`** — principle of least privilege; read-only skill gets Read/Grep/Glob only. Can include MCP tools in future.
- **Skills vs CLAUDE.md**: skills load on-demand when invoked; CLAUDE.md/rules load automatically

**Key takeaways:**
- Commands are just markdown prompt templates — write them like you're instructing a colleague.
- Don't describe `$ARGUMENTS` — *use* it: "Review the file $ARGUMENTS" not "Take a file path via $ARGUMENTS".
- Investigation commands need more structure than reading commands — specify what tool to run, what to compare against, and what pass/fail looks like.
- Skills that investigate code should use `context: fork` + read-only tools. The skill prompt should tell Claude to *find* the answer, not pre-state it.
- Stale mental models get corrected when you verify against actual code — the analyze-cart-flow skill exposed 7 misconceptions in our cart docs.

---

### Lesson 3.3 — Path-Specific Rules for Conditional Convention Loading
**Task Statement:** 3.3 — Apply path-specific rules for conditional convention loading
**Status:** COMPLETE ✓ (2026-03-19) — covered in Lesson 3.1 build + review quiz

**What was built:**
- (Built in 3.1) 6 rule files in `.claude/rules/` with YAML frontmatter `paths:` globs
- (Built in 3.1) `cart-system.md` with `@import` — demonstrates conditional loading of external docs
- Review quiz: 5 questions testing scoping, hierarchy, token efficiency, @import, flat vs nested

**Exam concepts demonstrated:**
- **Rules load ONLY when editing matching files** — reduces token usage vs monolithic CLAUDE.md
- **Glob patterns for cross-directory conventions** — `**/*.test.*` catches test files anywhere; `extensions/*/api/**/*` catches all API endpoints
- **Files not matching any rule get no extra context** — e.g., editing `components/` files doesn't load `api-endpoints.md` or `page-components.md`
- **`@import` is conditional too** — only fires when the rule file's `paths:` match, so heavy docs stay out of context until needed
- **Glob patterns > subdirectory CLAUDE.md** — globs work across directory boundaries; subdirectory CLAUDE.md only applies to descendants

**Key takeaways:**
- Think carefully about glob coverage gaps — `components/` wasn't covered by any rule in our setup (discovered in quiz Q2)
- Flat `.claude/rules/` is preferred — nesting adds no scoping benefit since `paths:` frontmatter controls loading
- `**/*.test.*` pattern is the exam's go-to example of why globs beat subdirectory CLAUDE.md (test files spread across the codebase)

---

### Lesson 3.4 — Plan Mode vs Direct Execution
**Task Statement:** 3.4 — Determine when to use plan mode vs direct execution
**Status:** COMPLETE ✓ (2026-03-19)

**What was built:**
- Exercise A (Direct): Added `console.warn` to `_doBackgroundSync` error catch in `localCart.js` — Claude executed immediately
- Exercise B (Plan): Asked Claude to plan a wishlist extension — Claude investigated patterns, proposed full architecture, all research visible in conversation
- Exercise C (Explore): Subagent mapped localCart.js consumers — clean summary returned, investigation hidden

**Exam concepts demonstrated:**
- **Direct execution**: well-scoped, single-file, clear change — just do it
- **Plan mode** (`/plan` or Shift+Tab): multi-file, architectural, multiple approaches — research + propose + wait
- **Explore subagent**: isolated context, returns summary only — same research as plan mode but lower context cost
- **Context cost tradeoff**: Plan shows all investigation (high). Explore hides it (low). Choose based on whether you need to review reasoning.
- **Scratchpad files**: persist Explore findings to disk for reuse (bridges to Lesson 5.4)

**Key takeaways:**
- Plan mode = review the reasoning. Explore = just get the answer. Direct = just do it.
- Combine: Explore then Plan then Direct = research then design then build.
- If Explore research is valuable, write to a scratchpad file — subagent context is discarded after return.

---

### Lesson 3.5 — Iterative Refinement Techniques
**Task Statement:** 3.5 — Apply iterative refinement techniques for progressive improvement
**Status:** COMPLETE ✓ (2026-03-19)

**What was built:**
- Exercise A (I/O examples + direct execution): Gave Claude concrete input→output examples for a transformation task — Claude nailed the format immediately without ambiguity
- Exercise B (Interview pattern): Asked Claude to design a feature with open-ended prompt — Claude asked clarifying questions before implementing, narrowing scope collaboratively

**Exam concepts demonstrated:**
- **I/O examples** beat prose descriptions — showing 2-3 concrete before→after pairs eliminates ambiguity about edge cases and formatting
- **Interview pattern**: open-ended prompts trigger Claude to ask questions first, preventing wasted work on wrong assumptions
- **Direct execution** for well-scoped tasks with clear examples — Claude doesn't need to plan when the pattern is obvious
- **Batch vs sequential**: interacting concerns in one message (so Claude sees the full picture), independent issues sequentially (so each gets full attention)

**Key takeaways:**
- The more specific your examples, the less iteration you need. One good I/O pair > a paragraph of description.
- Interview pattern is best for ambiguous/open-ended tasks — let Claude ask before building.
- Match the technique to the ambiguity level: clear spec → direct with examples, unclear spec → interview → iterate.

---

### Lesson 3.6 — CI/CD Pipeline Integration
**Task Statement:** 3.6 — Integrate Claude Code into CI/CD pipelines
**Status:** COMPLETE ✓ (2026-03-19)

**What was built:**
- `.claude/rules/ci-review.md` — behavioral rule for CI review mode (read-only enforcement, severity levels, incremental review, EverShop-specific check areas)
- `.github/workflows/claude-review.yml` — GitHub Actions workflow: git diff → pipe to `claude -p` → `--output-format json` → jq check for errors → exit code

**Exam concepts demonstrated:**
- **`-p` flag** = non-interactive mode — the #1 CI/CD exam question. Claude reads prompt, executes, prints, exits.
- **`--output-format json`** = machine-parseable output for downstream processing (posting comments, failing builds)
- **Pipe context in** — Claude doesn't discover things in CI; you feed it the diff via `git diff | claude -p`
- **Read-only enforcement** — CI rules must explicitly say "DO NOT modify files" or Claude may try to fix issues
- **Session context isolation** — don't review code in the same session that generated it (reasoning bias)
- **Incremental review** — pass prior findings in prompt so Claude reports only new/unaddressed issues
- **Exit code ownership** — your script decides pass/fail (jq + exit 1), not Claude
- **CLAUDE.md in CI** — Claude still reads project CLAUDE.md and rules in headless mode

**Key takeaways:**
- CI = observation, not mutation. Always enforce read-only in CI review rules.
- The diff comes from git, not Claude. Claude processes what you give it.
- Slash commands are for interactive use. CI invocations go in workflow YAML files.
- Bash is sufficient for simple pipe-check-exit patterns. Use Node/Python for complex JSON processing or API calls.

---

## PHASE 2: Tool Design & MCP Integration (Domain 2 — 18%)

### Lesson 2.1 — Designing Effective Tool Interfaces
**Task Statement:** 2.1 — Design effective tool interfaces with clear descriptions and boundaries
**Status:** COMPLETE ✓ (2026-03-19)

**What was built:**
- `dev-docs/tool-definitions.json` — 4 customer support tools (get_customer, lookup_order, check_product_availability, process_refund) in "bad" (minimal) and "good" (detailed) versions side by side

**Exam concepts demonstrated:**
- **`description` is the primary mechanism** Claude uses for tool selection — vague descriptions cause misrouting
- **Standard schema fields only**: `name`, `description`, `input_schema` — custom fields like `boundary` or `edge_case` are silently ignored
- **`input_schema`** not `parameters` (Anthropic API vs OpenAI)
- **Good descriptions include**: when to use (and NOT use), relationship to other tools, return format, edge cases (empty vs error), input format examples
- **Destructive tools** (process_refund) need explicit irreversibility warnings and prerequisite steps in the description
- **Avoid overlapping descriptions** — `check_product_availability` must focus on stock/availability, not general product info

**Key takeaways:**
- Everything goes in the description string or property descriptions. Custom JSON fields are invisible to Claude.
- The bad→good comparison makes the difference obvious: "Get customer info" causes misrouting; a 2-sentence description with boundaries eliminates it.
- Write tools need more guardrails in descriptions than read tools.

---

### Lesson 2.2 — Structured Error Responses for MCP Tools
**Task Statement:** 2.2 — Implement structured error responses for MCP tools
**Status:** COMPLETE ✓ (2026-03-20)

**What was built:**
- `dev-docs/tool-error-responses.json` — 8 error scenarios across 4 tools, covering all 4 error categories (transient, validation, business, permission) with structured metadata

**Exam concepts demonstrated:**
- **MCP `isError` flag** — distinguishes error from valid data, prevents Claude from interpreting error messages as results
- **4 error categories**: transient (retry), validation (fix input), business (explain policy), permission (escalate)
- **`isRetryable` + contextual `details`** — transient: `retry_after_ms`; validation: `provided_value`/`expected_format`; business: actual values (order_total, max_refundable); permission: `escalate_to_human` + threshold
- **Access failure vs valid empty result** — database timeout ≠ "customer not found." One is an error (don't tell user "no record"), the other is data (tell user "no match")
- **Details enable intelligent recovery** — Claude can say "max refund is $49.99" instead of generic "refund failed"

**Key takeaways:**
- `retry_after_ms` only makes sense on transient errors. Validation errors need `provided_value`/`expected_format`. Business errors need the actual values that violated the rule.
- "Out of stock" is a valid result, not an error. Don't conflate expected outcomes with failures.
- Permission errors always escalate — the agent can't fix authorization limits.

---

### Lesson 2.3 — Tool Distribution Across Agents & Tool Choice
**Task Statement:** 2.3 — Distribute tools appropriately across agents and configure tool choice
**Status:** COMPLETE ✓ (2026-03-20)

**What was built:**
- `dev-docs/agent-tool-distribution.json` — 4-agent system (Coordinator/Task only, Order Agent/2 tools, Inventory Agent/1 tool, Refund Agent/3 tools) with turn-based tool_choice strategies and anti-pattern documentation

**Exam concepts demonstrated:**
- **`tools` vs `tool_choice`**: `tools` = menu (set once per agent), `tool_choice` = ordering behavior (changes per turn)
- **3 modes**: `auto` (may return text), `any` (must call a tool), forced `{ type: "tool", name: "..." }` (must call specific tool)
- **Turn-based strategy**: force `get_customer` on turn 1 (programmatic prerequisite), then `auto` for subsequent turns — solves the Q1 exam trap (agent skips prerequisite 12%)
- **Coordinator gets Task only** — zero domain tools, routes to specialized subagents
- **Principle of least privilege**: Order Agent can't trigger refunds, Inventory Agent is anonymous (no get_customer needed)
- **Anti-pattern**: 18+ tools per agent degrades selection; investigation agents with write tools risk accidental mutations

**Key takeaways:**
- Forced tool_choice on turn 1 is the programmatic fix for prerequisite skipping — prompts are probabilistic, tool_choice is deterministic.
- `tools` defines capability, `tool_choice` defines behavior. Both are independent controls.
- Shared prerequisite tools (get_customer) across agents is fine — the key is excluding tools that violate the agent's role.

---

### Lesson 2.4 — MCP Server Integration in Claude Code
**Task Statement:** 2.4 — Integrate MCP servers into Claude Code and agent workflows
**Status:** COMPLETE ✓ (2026-03-20)

**What was built:**
- `.mcp.json` — project-level MCP config with GitHub server (`${GITHUB_TOKEN}`) and Postgres server (`${DATABASE_URL}`) for EverShop database access

**Exam concepts demonstrated:**
- **Two config scopes**: `.mcp.json` (project root, git-committed, team-shared) vs `~/.claude.json` (home dir, personal, all projects)
- **Environment variable expansion** works in both `env` and `args` fields — `${GITHUB_TOKEN}`, `${DATABASE_URL}` keep secrets out of git
- **Server discovery at connection time** — all configured MCP servers connect on startup, tools available immediately
- **MCP resources vs tools**: resources = read-only data loaded into context (product catalog, SKU list); tools = actions Claude calls (query DB, create issue)
- **Description competition**: MCP tool descriptions must out-describe built-in tools (Read, Bash, Grep) or Claude defaults to built-ins it knows well
- **Scope decision**: team-shared tools (project DB) → `.mcp.json`; personal productivity (Notion, calendar) → `~/.claude.json`
- **Project-level wins** when both scopes define the same server name (closer scope takes precedence)

**Key takeaways:**
- `~` = home directory (`C:\Users\you\`), applies to ALL projects you open with Claude Code — it's user-scoped, not repo-scoped.
- Connection string in `DATABASE_URL` already contains credentials — don't duplicate username/password as separate env vars.
- MCP resources reduce exploratory tool calls — a SKU list as a resource means Claude doesn't need to query the DB each time.
- Vague MCP tool descriptions lose to built-in tools. "Run query" → Claude picks Bash+psql. Detailed description → Claude picks MCP tool.

---

### Lesson 2.5 — Built-in Tools (Read, Write, Edit, Bash, Grep, Glob)
**Task Statement:** 2.5 — Select and apply built-in tools effectively
**Status:** COMPLETE ✓ (2026-03-21)

**What was built:**
- Exercise A: 6-scenario tool selection challenge — matched correct tool to each task type
- Exercise B: Traced `_doBackgroundSync` call chain using exploration pattern (Grep → Read → Grep → Read)

**Exam concepts demonstrated:**
- **Grep vs Glob**: Grep = search file contents ("who imports X?"), Glob = search file names/paths ("what JSX files exist?")
- **Edit vs Read+Write**: Edit for targeted unique-string replacement. If match isn't unique, fall back to Read → Write (full rewrite)
- **Bash = last resort**: only for shell operations (npm, git, scripts) — never for search/read/edit when dedicated tools exist
- **Exploration pattern**: Grep entry point → Read file → Grep next function → Read → repeat. Purely read-only chain.
- **Exploration ≠ debugging**: exploration uses read-only tools (Grep, Read, Glob). Debugging may use mutating tools (Write console.log, Bash). Different goals, different toolsets.
- **Explore subagents are read-only** — `allowed-tools: Read, Grep, Glob` — consistent with exploration being non-mutating

**Key takeaways:**
- Two search tools, two purposes: Glob finds files by name pattern, Grep finds files by content. Don't mix them up.
- The exploration chain (Grep → Read → Grep → Read) is the exam's expected pattern for codebase understanding — no mutation needed.
- Edit fails when `old_string` matches multiple locations — this is a feature (prevents accidental changes). Fall back to Read+Write.
- Bash is powerful but opaque — dedicated tools give better UX and are easier to review.

---

## PHASE 3: Agentic Architecture & Orchestration (Domain 1 — 27%)

### Lesson 1.1 — Agentic Loop Design
**Task Statement:** 1.1 — Design and implement agentic loops for autonomous task execution
**Status:** COMPLETE ✓ (2026-03-22)

**What was built:**
- `dev-docs/agentic-loop.js` — complete agentic loop in Node.js using Anthropic SDK: messages array, while(true), stop_reason check, tool extraction, execution, result appending. Connected to 4 customer support tools (get_customer, lookup_order, check_product_availability, process_refund) with mock implementations.
- Exercise B: identified 3 anti-pattern code snippets (NL termination, iteration cap, text content check)

**Exam concepts demonstrated:**
- **Agentic loop lifecycle**: send request → check `stop_reason` → execute tools → append results → repeat
- **`stop_reason` is the ONLY reliable termination signal**: `"end_turn"` → done, `"tool_use"` → continue
- **Model-driven decisions**: Claude decides which tools to call and when to stop — your code is just the messenger
- **Messages array = conversation transcript**: each iteration appends assistant response + tool results, growing the history
- **`response.content` is an array**: can contain BOTH text blocks AND tool_use blocks in the same response
- **4 anti-patterns**: (1) NL parsing for termination ("if text includes 'done'"), (2) hardcoded iteration cap (max 5 loops), (3) text content check (text exists → stop), (4) NL-based routing (parse text to decide next action)
- **Why anti-patterns fail**: Claude may say "I've completed looking up..." mid-task (NL), tasks vary in steps needed (cap), text + tool_use coexist (text check)

**Key takeaways:**
- The loop is deceptively simple: while(true) + stop_reason check. Everything else in Phase 3 layers on top of this.
- Your code never decides what tool to call — Claude does. Your code only executes what Claude requests.
- This is the foundation: multi-agent (1.2), hooks (1.5), enforcement (1.4) all wrap around this same inner loop.

---

### Lesson 1.2 — Multi-Agent Coordinator-Subagent Orchestration
**Task Statement:** 1.2 — Orchestrate multi-agent systems with coordinator-subagent patterns
**Status:** COMPLETE ✓ (2026-03-24)

**What was built:**
- `dev-docs/multi-agent-coordinator.js` — full multi-agent system with coordinator + 3 subagents (Order Agent, Inventory Agent, Refund Agent). Two agentic loops: `coordinatorLoop` (dispatches via `dispatch_to_agent` tool) and `subAgentLoop` (executes domain tools). Includes `dispatch_tool` definition with `agent_name`, `task`, `context` fields. Test prompt exercises multi-concern decomposition (refund + availability check).

**Exam concepts demonstrated:**
- **Hub-and-spoke pattern**: coordinator has ONLY `dispatch_to_agent` tool — zero domain tools. All inter-subagent communication goes through coordinator.
- **Subagent context isolation**: each `subAgentLoop` call creates a brand new `messages` array, `system` prompt, and `tools` set. Nothing transfers automatically from coordinator.
- **Explicit context passing**: `dispatch_to_agent` tool has a `context` field — coordinator must pass relevant info because subagents don't inherit conversation history.
- **Dynamic subagent selection**: coordinator uses `tool_choice: auto` — Claude decides which subagent to dispatch to (and when to stop dispatching and give final answer). Not a fixed pipeline.
- **Tool resolution**: subagent configs store tool names as strings; `subAgentLoop` resolves them to full tool definition objects via `.map(name => tools.find(...))` before passing to API.
- **dispatch_to_agent spawns a new agentic loop**: when coordinator calls dispatch, your code doesn't call `executeTool()` — it calls `subAgentLoop()`, which is a complete while(true) loop with its own API calls.
- **`response.content` is an array with mixed types**: must `.find(b => b.type === "tool_use")` to extract tool call — `content[0]` might be text if Claude writes text before calling the tool.
- **Narrow decomposition trap (Q7)**: coordinator task description that's too specific ("only visual arts") causes subagents to miss broader coverage. Task descriptions must match the full scope.

**Key takeaways:**
- The coordinator loop and subagent loop are structurally identical (while + stop_reason + tool extraction + message appending). The only difference: coordinator calls `subAgentLoop()` for dispatch, subagent calls `executeTool()` for domain tools.
- `tool_choice: { type: "tool" }` forces a specific tool every turn — useful for prerequisites (turn 1 force), but causes infinite loops if used on the coordinator (can never end_turn).
- This pattern comes from AI application architecture, not traditional CS. It combines hub-and-spoke (network architecture) + manager-worker (distributed systems) + LLM decision-making.
- Real-world example: Claude Code itself uses this pattern — the Agent tool spawns subagents with isolated context and tools.

---

### Lesson 1.3 — Subagent Invocation, Context Passing & Spawning
**Task Statement:** 1.3 — Configure subagent invocation, context passing, and spawning
**Status:** COMPLETE ✓ (2026-03-24)

**What was built:**
- Refactored `dev-docs/multi-agent-coordinator.js` with three improvements: (A) Clean AgentDefinition configs — separated runtime fields (`name`, `description`, `system_prompt`, `tools`) from design-time documentation (`tool_choice` strategy, `reasoning`) into `agent_docs`. (B) Structured context passing — `subAgentLoop` receives `JSON.stringify({task, context})` instead of flat string concatenation. (C) Parallel spawning — `coordinatorLoop` uses `Promise.all` with `.filter()` to run multiple subagents concurrently, then appends all tool_results in a single user message.

**Exam concepts demonstrated:**
- **AgentDefinition = runtime config only**: `name`, `description`, `system_prompt`, `tools` — what the API call needs. Design-time docs (`reasoning`, `tool_choice` strategy) go elsewhere.
- **`description` serves dual purpose**: helps coordinator decide which subagent to dispatch to (same role as tool descriptions in tool selection).
- **Structured context > flat strings**: `JSON.stringify({task, context})` lets subagents distinguish the task from background info. Enables metadata like `customer_id`, `order_id` as discrete fields for attribution.
- **Parallel spawning via `Promise.all`**: when coordinator returns multiple `dispatch_to_agent` calls in one response, run all subagents concurrently. All `tool_result` blocks go in a single user message (API requirement).
- **Message appending AFTER parallel completion**: pushing messages inside `Promise.all` causes interleaving. Collect results first, then append once.
- **`return await` inside async map**: without `return`, `Promise.all` resolves to `[undefined, ...]` — results are silently lost.
- **fork_session concept**: two subagents explore different approaches to the same task (e.g., refund via original payment vs store credit), coordinator compares. Different from parallel spawning (independent tasks).

**Key takeaways:**
- Keep runtime configs clean — extra documentation fields in the object waste tokens when serialized and confuse the separation of concerns.
- Structured context is about attribution: the subagent knows what it was told and where the info came from. Flat strings lose this.
- Parallel spawning is just `Promise.all` on the subagent calls — same async JS pattern you already know, applied to agentic loops.
- The API requires all tool_results for a single assistant response to be in one user message — don't push them individually.

---

### Lesson 1.4 — Multi-Step Workflows: Enforcement & Handoffs
**Task Statement:** 1.4 — Implement multi-step workflows with enforcement and handoff patterns
**Status:** COMPLETE ✓ (2026-03-25)

**What was built:**
- Part A: Programmatic prerequisite gate in `executeTool()` — `completedTools` Set tracks which tools have been called. Before the switch statement, a gate blocks `process_refund` unless BOTH `get_customer` AND `lookup_order` have completed. Returns structured error with `isError`, `errorCategory: "validation"`, `isRetryable: true`, and conditional spread array listing missing prerequisites.
- Part B: Multi-concern decomposition — coordinator dispatches to refund agent AND inventory agent in parallel via `Promise.all`. Each subagent runs its own agentic loop independently.
- Part C: Structured handoff for human escalation — `process_refund` returns escalation object when `refund_amount > 500` with `escalate_to_human: true`, `order_total`, `requested_amount`, `max_allowed_refund`. In `subAgentLoop`, parsed result is checked for `escalate_to_human` flag and wrapped in proper `tool_result` format with escalation summary.

**Exam concepts demonstrated:**
- **Programmatic enforcement > prompt-based (Exam Q1)**: telling Claude "always call get_customer first" works ~88% of the time. The other 12% skips it. A gate in `executeTool()` is deterministic — 100% enforcement.
- **Gate placement matters**: gate BEFORE the switch statement (gatekeeper), not inside a case (after return = dead code).
- **`completedTools` outside function scope**: must persist across calls — declaring inside `executeTool` resets every call.
- **Structured error for gates vs hard limits**: prerequisite gate returns `isRetryable: true` (agent can fix by calling missing tools). Business rule violation (refund > $500) returns `isRetryable: false` + `escalate_to_human: true` (agent can't fix).
- **Conditional spread pattern**: `...(!completedTools.has("get_customer") ? ["get_customer"] : [])` — builds array of only the missing prerequisites dynamically.
- **Consistent tool_result format**: both escalation and normal paths must return `{ type: "tool_result", tool_use_id, content }` — the API rejects malformed messages.
- **Handoff object = structured summary for human**: contains everything the human needs to act without re-investigating (customer_id, order details, refund amount, why it was escalated, max allowed).

**Key takeaways:**
- Prompts are probabilistic; gates are deterministic. For compliance-critical sequences, always use programmatic enforcement.
- Two types of tool failures: retryable (agent can self-correct by calling missing prerequisites) and non-retryable (requires human escalation). The `isRetryable` flag tells the agent which path to take.
- Handoff objects prevent the "repeat your issue" anti-pattern — the human gets full context without asking the customer to start over.
- Gate code runs in YOUR code, not Claude's — this is the key insight. You intercept between Claude's request and the actual tool execution.

---

### Lesson 1.5 — Agent SDK Hooks: Tool Interception & Data Normalization
**Task Statement:** 1.5 — Apply Agent SDK hooks for tool call interception and data normalization
**Status:** COMPLETE ✓ (2026-03-25)

**What was built:**
- `dev-docs/agent-hooks.js` — two hook functions imported into multi-agent-coordinator.js:
  - `postToolUse(result)` — parses tool result string, walks all keys with `Object.keys()`, normalizes `*_date` fields to ISO 8601 via `new Date().toISOString()`, normalizes `*_price`/`*_total`/`*_amount` number fields to formatted currency strings (`$50.00`). Returns modified JSON string.
  - `preToolUse(toolName, toolInput)` — blocks `process_refund` when `refund_amount > 500`, returns escalation object with `isError`, `errorCategory: "permission"`, `isRetryable: false`, `escalate_to_human: true`. Returns `null` to proceed normally.
- Wired into `subAgentLoop` inside `toolCalls.map()`: preToolUse runs before executeTool (blocks if non-null), postToolUse runs after executeTool (normalizes result). Return values from both hooks are actually used — not discarded.
- Part C decision exercise: 5 business rules classified as hook (deterministic: email masking, UUID hiding, field trimming) vs prompt (judgment: apology tone, refund timeline explanation).

**Exam concepts demonstrated:**
- **PreToolUse = intercept BEFORE execution**: compliance gates, field validation, audit logging. Tool never runs if hook blocks it.
- **PostToolUse = intercept AFTER execution**: data normalization, output trimming, format standardization. Transforms what Claude sees.
- **Hook vs Prompt decision rule**: deterministic correct answer (yes/no, format A→B) → hook. Requires judgment (tone, summarization) → prompt.
- **Hooks separate concerns**: business logic (refund limit) lives in the hook, not mixed into `executeTool` mock data or the agentic loop. The tool stays pure.
- **Return values matter**: calling a hook without using its return value means the hook has no effect — a common wiring bug.
- **Suffix-based normalization**: `Object.keys()` + `key.endsWith("_date")` catches any date field generically, not hardcoded field names. Scales to new tools without code changes.
- **1.4 gates vs 1.5 hooks**: both intercept between Claude's request and execution. Gates are inline in `executeTool` (prerequisite ordering). Hooks are separate functions (compliance + normalization). Production systems use hooks for separation of concerns.

**Key takeaways:**
- Hooks are the production version of 1.4's gates — same interception pattern, better separation of concerns.
- Two wiring bugs to watch for: (1) calling hook but ignoring return value, (2) passing wrong type (object vs string) to the hook.
- The hook decision matrix: if you can write a unit test with a single expected output, it's a hook. If "it depends," it's a prompt.
- `postToolUse` normalizes data BEFORE it enters the conversation context — Claude sees clean, consistent formats across all tools.

---

### Lesson 1.6 — Task Decomposition Strategies
**Task Statement:** 1.6 — Design task decomposition strategies for complex workflows
**Status:** Not started

**What was built:**
<!-- Record: prompt chaining pipeline, dynamic decomposition example -->

**Exam concepts demonstrated:**
<!--
- Fixed sequential (prompt chaining) vs dynamic adaptive decomposition
- Prompt chaining: per-file analysis → cross-file integration pass
- Dynamic: map structure → identify high-impact → prioritize → adapt
- Attention dilution in single-pass multi-file reviews
-->

**Key takeaways:**

---

### Lesson 1.7 — Session State, Resumption & Forking
**Task Statement:** 1.7 — Manage session state, resumption, and forking
**Status:** Not started

**What was built:**
<!-- Record: session resumption scenarios, fork_session usage -->

**Exam concepts demonstrated:**
<!--
- --resume <session-name> for named session continuation
- fork_session for independent branches from shared baseline
- Inform agent about file changes when resuming
- Fresh session + structured summary > resuming with stale tool results
-->

**Key takeaways:**

---

## PHASE 4: Prompt Engineering & Structured Output (Domain 4 — 20%)

### Lesson 4.1 — Explicit Criteria for Precision
**Task Statement:** 4.1 — Design prompts with explicit criteria to improve precision and reduce false positives
**Status:** Not started

**What was built:**
<!-- Record: review criteria, severity definitions, category management -->

**Exam concepts demonstrated:**
<!--
- Explicit criteria >> vague instructions ("be conservative" doesn't work)
- Specific categories: what to report vs skip
- High false positive rates in one category undermine all categories
- Concrete code examples for each severity level
-->

**Key takeaways:**

---

### Lesson 4.2 — Few-Shot Prompting
**Task Statement:** 4.2 — Apply few-shot prompting to improve output consistency and quality
**Status:** Not started

**What was built:**
<!-- Record: few-shot examples created for extraction, review, escalation -->

**Exam concepts demonstrated:**
<!--
- Few-shot = most effective for consistent formatted output
- Demonstrate ambiguous-case handling (not just clear cases)
- Enable generalization to novel patterns
- Reduce hallucination in extraction (informal measurements, varied structures)
- 2-4 targeted examples with reasoning for why one action chosen over alternatives
-->

**Key takeaways:**

---

### Lesson 4.3 — Structured Output via Tool Use & JSON Schemas
**Task Statement:** 4.3 — Enforce structured output using tool use and JSON schemas
**Status:** Not started

**What was built:**
<!-- Record: extraction tool schema, tool_choice configurations -->

**Exam concepts demonstrated:**
<!--
- tool_use + JSON schemas = most reliable for schema-compliant output
- tool_choice: "auto" vs "any" vs forced {"type":"tool","name":"..."}
- Strict schemas eliminate syntax errors NOT semantic errors
- Nullable/optional fields prevent fabrication
- Enum with "other" + detail for extensibility; "unclear" for ambiguity
-->

**Key takeaways:**

---

### Lesson 4.4 — Validation, Retry & Feedback Loops
**Task Statement:** 4.4 — Implement validation, retry, and feedback loops for extraction quality
**Status:** Not started

**What was built:**
<!-- Record: validation-retry code, detected_pattern tracking, self-correction -->

**Exam concepts demonstrated:**
<!--
- Retry-with-error-feedback: append specific validation errors on retry
- Retries ineffective when info absent (vs format errors where retries work)
- detected_pattern field for systematic false positive analysis
- Semantic validation errors vs schema syntax errors
- Self-correction: calculated_total vs stated_total, conflict_detected
-->

**Key takeaways:**

---

### Lesson 4.5 — Batch Processing Strategies
**Task Statement:** 4.5 — Design efficient batch processing strategies
**Status:** Not started

**What was built:**
<!-- Record: batch processing design, timing calculations, failure handling -->

**Exam concepts demonstrated:**
<!--
- Message Batches API: 50% savings, up to 24h, no latency SLA
- Appropriate: overnight, weekly audits. NOT: blocking pre-merge checks
- No multi-turn tool calling in batch requests
- custom_id for correlating request/response
- Prompt refinement on sample before full batch
-->

**Key takeaways:**

---

### Lesson 4.6 — Multi-Instance & Multi-Pass Review
**Task Statement:** 4.6 — Design multi-instance and multi-pass review architectures
**Status:** Not started

**What was built:**
<!-- Record: two-instance setup, multi-pass review pipeline -->

**Exam concepts demonstrated:**
<!--
- Self-review limitation: retains reasoning context → less likely to question own decisions
- Independent review instances more effective than self-review
- Multi-pass: per-file local analysis + cross-file integration pass
- Confidence self-reporting for calibrated review routing
-->

**Key takeaways:**

---

## PHASE 5: Context Management & Reliability (Domain 5 — 15%)

### Lesson 5.1 — Preserving Critical Information Across Long Interactions
**Task Statement:** 5.1 — Manage conversation context to preserve critical information
**Status:** Not started

**What was built:**
<!-- Record: case facts block, tool output trimming, position-aware ordering -->

**Exam concepts demonstrated:**
<!--
- Progressive summarization risks (losing numbers, dates, expectations)
- "Lost in the middle" effect
- Tool results accumulate tokens disproportionately (40+ fields, only 5 relevant)
- "Case facts" persistent block in every prompt
- Trim verbose tool outputs before they enter context
- Key findings at beginning; section headers for detailed results
-->

**Key takeaways:**

---

### Lesson 5.2 — Escalation & Ambiguity Resolution
**Task Statement:** 5.2 — Design effective escalation and ambiguity resolution patterns
**Status:** Not started

**What was built:**
<!-- Record: escalation criteria, few-shot examples, multiple-match handling -->

**Exam concepts demonstrated:**
<!--
- Triggers: customer requests human, policy gaps, inability to progress
- Honor explicit human requests IMMEDIATELY (no investigation first)
- Sentiment-based escalation is unreliable (doesn't correlate with complexity)
- Multiple matches → ask for identifiers (not heuristic selection)
- Acknowledge frustration → offer resolution → escalate only if reiterated
-->

**Key takeaways:**

---

### Lesson 5.3 — Error Propagation Across Multi-Agent Systems
**Task Statement:** 5.3 — Implement error propagation strategies across multi-agent systems
**Status:** Not started

**What was built:**
<!-- Record: structured error format, local recovery logic, coverage annotations -->

**Exam concepts demonstrated:**
<!--
- Structured error context enables intelligent coordinator recovery
- Access failures vs valid empty results (critical distinction)
- Generic "search unavailable" hides context from coordinator
- Anti-patterns: silently suppressing errors; terminating entire workflow
- Local recovery first; propagate only unresolvable with partial results
-->

**Key takeaways:**

---

### Lesson 5.4 — Context Management in Large Codebase Exploration
**Task Statement:** 5.4 — Manage context effectively in large codebase exploration
**Status:** Not started

**What was built:**
<!-- Record: subagent delegation, scratchpad files, crash recovery manifest -->

**Exam concepts demonstrated:**
<!--
- Context degradation in extended sessions ("typical patterns" vs specific findings)
- Scratchpad files persist key findings across context boundaries
- Subagent delegation isolates verbose exploration
- Crash recovery: agent state exports, coordinator loads manifest on resume
- /compact for extended sessions
-->

**Key takeaways:**

---

### Lesson 5.5 — Human Review Workflows & Confidence Calibration
**Task Statement:** 5.5 — Design human review workflows and confidence calibration
**Status:** Not started

**What was built:**
<!-- Record: confidence scoring, stratified sampling, accuracy analysis -->

**Exam concepts demonstrated:**
<!--
- Aggregate accuracy (97%) may mask poor performance on specific types
- Stratified random sampling of high-confidence extractions
- Field-level confidence scores calibrated with labeled validation sets
- Validate by document type AND field before automating
-->

**Key takeaways:**

---

### Lesson 5.6 — Information Provenance & Uncertainty
**Task Statement:** 5.6 — Preserve information provenance and handle uncertainty in multi-source synthesis
**Status:** Not started

**What was built:**
<!-- Record: claim-source mappings, conflict annotation, temporal handling -->

**Exam concepts demonstrated:**
<!--
- Source attribution lost during summarization without claim-source mappings
- Conflicting statistics: annotate with attribution, don't pick one
- Temporal data: require publication/collection dates
- Reports: well-established vs contested vs gaps sections
- Render content types appropriately (tables, prose, lists)
-->

**Key takeaways:**

---

## PHASE 6: Integration Exercises

### Exercise 1 — Multi-Tool Agent with Escalation Logic
**Domains:** 1, 2, 5 | **Status:** Not started

**What was built:**

**Exam concepts demonstrated:**

**Key takeaways:**

---

### Exercise 2 — Claude Code for Team Development
**Domains:** 3, 2 | **Status:** Not started

**What was built:**

**Exam concepts demonstrated:**

**Key takeaways:**

---

### Exercise 3 — Structured Data Extraction Pipeline
**Domains:** 4, 5 | **Status:** Not started

**What was built:**

**Exam concepts demonstrated:**

**Key takeaways:**

---

### Exercise 4 — Multi-Agent Research Pipeline
**Domains:** 1, 2, 5 | **Status:** Not started

**What was built:**

**Exam concepts demonstrated:**

**Key takeaways:**

---

## PHASE 7: Exam Simulation

### Mock Exam Results
<!-- Record: score, weak areas, questions missed, review notes -->
