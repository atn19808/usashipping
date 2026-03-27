# Claude Certified Architect — Quiz Bank
## Pop quizzes for each lesson (5 questions each)

Answer key at the bottom of each section. Try answering before checking.

---

## Lesson 3.1 — CLAUDE.md Hierarchy, Scoping & Modular Organization

**Q1.** What are the three levels of CLAUDE.md hierarchy, from broadest to narrowest scope?

**Q2.** A new developer joins your team. They clone the repo and use Claude Code, but Claude doesn't follow any of your project conventions. You check and confirm the project-level CLAUDE.md exists. What's the most likely cause?

**Q3.** You have a 200-line CLAUDE.md covering database conventions, API patterns, React components, GraphQL types, and deployment procedures. What's wrong with this approach, and how do you fix it?

**Q4.** What does `@import dev-docs/cart-architecture.md` do inside a rule file? When does the imported content actually load into context?

**Q5.** Your `.claude/rules/api-endpoints.md` has `paths: ["extensions/*/api/**/*"]`. You're editing `extensions/quaxave_custom_cart/services/cartService.js`. Does this rule load? Why or why not?

<details>
<summary>Answers</summary>

**A1.** User-level (`~/.claude/CLAUDE.md`) → Project-level (root `CLAUDE.md` or `.claude/CLAUDE.md`) → Directory-level (CLAUDE.md in subdirectories). Each level adds to (doesn't replace) the parent.

**A2.** The conventions are NOT missing from the project CLAUDE.md — they're there. The issue is likely the developer has a user-level CLAUDE.md or settings that conflict, OR more likely the conventions were stored in someone's user-level config (`~/.claude/CLAUDE.md`) and never put in the project-level file. User-level config is NOT shared with teammates.

**A3.** Every file edit loads all 200 lines, even when only 20 are relevant. Fix: extract domain-specific content into `.claude/rules/` files with `paths:` globs — API conventions load only when editing API files, React conventions load only when editing page files, etc.

**A4.** `@import` inlines the referenced file's content into the rule. It loads ONLY when the rule file itself loads — which is when you're editing a file matching the rule's `paths:` globs. If the rule doesn't match, the import never fires.

**A5.** No. The path `extensions/quaxave_custom_cart/services/cartService.js` does not match `extensions/*/api/**/*` — it's under `services/`, not `api/`. Rules only load when the file being edited matches the glob pattern.

</details>

---

## Lesson 3.2 — Custom Slash Commands & Skills

**Q1.** Your team needs a `/review` command that every developer can use. Where do you put it?
- A) `~/.claude/commands/review.md`
- B) `.claude/commands/review.md`
- C) `.claude/skills/review/SKILL.md`
- D) `.claude/rules/review.md`

**Q2.** What is the `$ARGUMENTS` placeholder in a command file, and what happens if you write `"Take a file path via $ARGUMENTS"` as line 1 of your command?

**Q3.** You're building a skill that explores the full dependency tree of a module — it will need to read 30+ files and produce verbose Grep output. What two SKILL.md frontmatter fields should you set, and why?

**Q4.** What's the difference between `allowed-tools` in a skill and the tools available in a regular command?

**Q5.** You have a `/deploy-check` command that needs to run `git status`, search for env vars, and compare files. A teammate complains it "just tells me to check things but doesn't actually do it." What's wrong with the command's prompt?

<details>
<summary>Answers</summary>

**A1.** B) `.claude/commands/review.md` — project-scoped, version-controlled, shared with the team. A is personal only. C is a skill (different mechanism). D is a rule (loads automatically on matching files, not invokable).

**A2.** `$ARGUMENTS` captures whatever the user types after the command name. Writing "Take a file path via $ARGUMENTS" is wrong because it *describes* the placeholder to Claude instead of *using* it as the input. Correct: "Review the file $ARGUMENTS for conventions." — Claude receives the actual file path substituted in.

**A3.** `context: fork` (isolates verbose output from main conversation, preventing context pollution) and `allowed-tools` restricted to read-only tools like `Read, Grep, Glob` (principle of least privilege — exploration skills shouldn't modify code).

**A4.** Commands have access to all tools Claude Code normally has — no restriction. Skills can restrict available tools via `allowed-tools` in SKILL.md frontmatter. This enforces principle of least privilege — e.g., a read-only analysis skill can't accidentally edit files.

**A5.** The command lacks explicit **action → compare → pass/fail** criteria. It needs to tell Claude: (1) what specific tool/command to run, (2) what to compare the result against, and (3) what constitutes PASS vs FAIL. Investigation commands need more structure than reading commands.

</details>

---

## Lesson 3.3 — Path-Specific Rules for Conditional Convention Loading

**Q1.** You have test files in `extensions/quaxave_custom_cart/tests/`, `extensions/quaxave_sync_product_pricing/tests/`, and `themes/usashipping/tests/`. What glob pattern in a rule's `paths:` would catch ALL of them?

**Q2.** True or false: placing a rule file at `.claude/rules/api/endpoints.md` makes it apply only to API files.

**Q3.** You're editing `extensions/quaxave_custom_product_view/components/common/localCart.js`. Which of these rules would load?
- A) `paths: ["extensions/**/*"]`
- B) `paths: ["extensions/*/api/**/*"]`
- C) `paths: ["extensions/*/components/**/*"]`
- D) `paths: ["extensions/quaxave_custom_product_view/**/*"]`

**Q4.** Why are glob-based `.claude/rules/` better than putting a CLAUDE.md in each subdirectory for enforcing test conventions?

**Q5.** You create a rule with `paths: ["extensions/*/pages/**/*.jsx"]`. Your teammate creates a page component at `extensions/quaxave_wishlist/pages/frontStore/wishlist/WishlistPage.tsx`. Does the rule load? What's the fix?

<details>
<summary>Answers</summary>

**A1.** `**/*.test.*` or `**/tests/**/*` — the double-star glob matches at any depth, catching test files regardless of which directory tree they're in. This is the exam's canonical example of why globs beat subdirectory CLAUDE.md.

**A2.** False. The file's location in `.claude/rules/` has zero effect on scoping. Scoping comes exclusively from the YAML frontmatter `paths:` field. Nesting rules in subdirectories adds no functional benefit.

**A3.** A, C, and D would load. B would NOT (the file is in `components/`, not `api/`). Multiple rules can load simultaneously if the file matches multiple globs.

**A4.** Test files are spread across the entire codebase — every extension, every module, possibly themes too. You'd need a CLAUDE.md in every single test directory. A single rule with `paths: ["**/*.test.*"]` catches them all from one file, regardless of location.

**A5.** No — the glob ends in `*.jsx` but the file is `.tsx`. Fix: change to `**/*.{jsx,tsx}` or `**/*` to catch both extensions. Always consider file extension variants when writing globs.

</details>

---

## Lesson 3.4 — Plan Mode vs Direct Execution

**Q1.** You need to add a `console.log` to one function in one file. Which mode do you use?
- A) Plan mode
- B) Direct execution
- C) Explore subagent
- D) Any of the above

**Q2.** You're designing a new extension that touches 8 files across 3 directories. You want to review Claude's approach before it starts writing code. What do you use?

**Q3.** What's the key difference between Plan mode and the Explore subagent in terms of context cost?

**Q4.** After using an Explore subagent to research how the cart sync works, you want to reuse those findings in a future session. What's the problem, and how do you solve it?

**Q5.** You're working on a complex refactor. You use Plan mode to investigate, then switch to direct execution to implement. Halfway through, you realize the plan missed a dependency. What's the most efficient next step?
- A) Start over in a fresh Plan mode session
- B) Switch back to Plan mode in the same session to re-investigate
- C) Use `/compact` then continue in the same session
- D) Use an Explore subagent to investigate just the missed dependency

<details>
<summary>Answers</summary>

**A1.** B) Direct execution. Single file, single function, clear change — no planning needed. Using Plan mode or Explore would waste context on unnecessary investigation.

**A2.** Plan mode (`/plan` or Shift+Tab). You want to SEE Claude's reasoning — which files it plans to touch, what order, what trade-offs. Plan mode shows all investigation in the conversation so you can review and redirect before any code is written.

**A3.** Plan mode shows ALL investigation steps in the main conversation — high context cost but full visibility. Explore subagent runs investigation in an isolated context and returns only a summary — low context cost but you can't review the reasoning process.

**A4.** Subagent context is discarded after it returns its summary. The detailed findings are gone. Solution: have the Explore subagent write findings to a **scratchpad file** on disk (e.g., `dev-docs/cart-research.md`). Files persist across sessions; subagent context doesn't.

**A5.** D) Use an Explore subagent to investigate just the missed dependency. It's targeted (only the gap), low context cost (isolated), and you can continue implementing in the main session with the summary. Starting over (A) wastes work. Plan mode in the same session (B) adds more context load. `/compact` (C) helps with context but doesn't address the missing information.

</details>

---

## Lesson 3.5 — Iterative Refinement Techniques

**Q1.** You want Claude to transform product prices from various formats (`"$12.99"`, `"12.99 USD"`, `"$12,990.00"`) into a consistent `{ cents: number }` object. What's the most effective way to communicate this?
- A) "Convert all price strings to cents as an integer"
- B) Provide 2-3 input→output examples showing each format
- C) Write a detailed specification document
- D) Ask Claude to figure out the pattern from the codebase

**Q2.** You give Claude a vague prompt: "Build a notification system for our store." Claude immediately starts writing code. What technique should you have used to prevent wasted work?

**Q3.** You have 3 bugs to fix: Bug A is in the cart badge, Bug B is in the cart page, and Bug C is in the checkout flow. Bugs A and B interact (badge reads from the same state the cart page writes). Bug C is independent. How do you batch these?

**Q4.** You're iterating on a function with Claude. You share a test failure, Claude fixes it, but introduces a new failure. You share that failure, Claude fixes it but breaks the first test again. What's going wrong and how do you fix it?

**Q5.** True or false: The interview pattern (Claude asks questions first) is always better than providing I/O examples upfront.

<details>
<summary>Answers</summary>

**A1.** B) Provide 2-3 input→output examples. `"$12.99" → { cents: 1299 }`, `"12.99 USD" → { cents: 1299 }`, `"$12,990.00" → { cents: 1299000 }`. Concrete examples eliminate ambiguity about comma handling, currency symbols, and the cents conversion. Prose (A) leaves edge cases unclear. A spec doc (C) is overkill. Codebase inference (D) is unreliable.

**A2.** The **interview pattern**. For open-ended/ambiguous tasks, prompt Claude to ask clarifying questions before implementing: "Before building anything, ask me questions about scope, users, and requirements." This surfaces assumptions early instead of after wasted implementation.

**A3.** Bugs A + B together in one message (they interact — Claude needs to see both to avoid fixing one while breaking the other). Bug C separately in a sequential message (independent — giving it full attention without diluting focus on A+B).

**A4.** Claude is losing context of the full test suite — it's fixing the latest failure without considering all constraints simultaneously. Fix: share ALL test results (passing and failing) in each iteration, not just the new failure. This gives Claude the complete picture of what must hold true.

**A5.** False. It depends on ambiguity level. **I/O examples** are better when you know exactly what you want (clear transformation, specific format). **Interview pattern** is better when requirements are unclear or open-ended. Using interview pattern for a clear transformation wastes a round-trip; using I/O examples for an ambiguous feature risks building the wrong thing.

</details>

---

## Lesson 3.6 — CI/CD Pipeline Integration (10 questions)

**Q1.** Your team sets up Claude Code in GitHub Actions but it hangs indefinitely. What's the most likely cause?
- A) Missing CLAUDE.md
- B) Missing `-p` flag
- C) Missing `--output-format json`
- D) Wrong Node.js version

**Q2.** Which command correctly pipes a PR diff to Claude for non-interactive review?
- A) `claude "Review this diff" --output-format json < diff.txt`
- B) `git diff | claude -p "Review this diff" --output-format json`
- C) `claude -p "Review $(git diff)" --output-format json`
- D) `claude --ci "Review this diff"`

**Q3.** You add a CI step that uses Claude to review PRs AND fix any issues it finds. What's wrong with this approach?

**Q4.** Your CI review keeps reporting the same 3 warnings on every push, even after the team has acknowledged them as acceptable. How do you fix this?

**Q5.** True or false: When Claude runs with `-p` in CI, it does NOT read the project's CLAUDE.md or `.claude/rules/` files.

**Q6.** Your CI pipeline has two steps: Step 1 uses Claude to generate tests, Step 2 uses Claude to review the generated tests. A colleague suggests combining them into one Claude invocation for efficiency. Why is this a bad idea?

**Q7.** You want Claude's CI review to output findings as a JSON array where each item has `file`, `line`, `severity`, and `message`. What flags do you need?
- A) `-p` only
- B) `-p --output-format json`
- C) `-p --output-format json --json-schema <schema>`
- D) `--json` only

**Q8.** In your CI workflow, who should decide whether the build passes or fails — Claude or your script? Why?

**Q9.** A teammate creates `.claude/commands/ci-review.md` so developers can run `/ci-review` locally. Another teammate puts the same logic in `.github/workflows/claude-review.yml`. Are both valid? What's the difference?

**Q10.** Your CI review rule says "Review files modified in the current PR" but doesn't include a read-only instruction. Claude finds a missing `route.json` and creates it. The PR now has an unexpected commit from CI. What two things went wrong?

<details>
<summary>Answers</summary>

**A1.** B) Missing `-p` flag. Without `-p` (print/non-interactive mode), Claude launches its interactive terminal UI, which waits for user input that never comes in CI. This is the #1 CI/CD exam question.

**A2.** B) `git diff | claude -p "Review this diff" --output-format json`. Pipe the diff into Claude's stdin with `-p` for non-interactive mode and `--output-format json` for machine-parseable output. Option C is wrong because command substitution `$(git diff)` can break with large diffs or special characters. Option D — `--ci` flag doesn't exist.

**A3.** Two problems: (1) **Read-only violation** — CI review should observe, not mutate. Creating/editing files in CI can produce unexpected commits or dirty working trees. (2) **Session context isolation** — Claude reviewing code it just generated retains its reasoning context and is less likely to catch its own mistakes. Use separate sessions for generation and review.

**A4.** **Incremental review** — pass prior acknowledged findings into the prompt so Claude reports only NEW or UNADDRESSED issues. Example: include a `known_acceptable` list in the prompt and instruct Claude to skip those. This maps to the ci-review.md rule: "If prior findings are provided in the prompt, continue from there without repeating previous findings."

**A5.** False. Claude with `-p` still reads CLAUDE.md and `.claude/rules/` from the project directory. This is a feature — your project conventions, EverShop patterns, and review rules all apply automatically in CI without repeating them in the prompt.

**A6.** **Session context isolation.** If Claude generates tests and reviews them in the same invocation, it retains the reasoning from generation. It's less likely to question its own decisions ("I chose this approach because..."). An independent review session has no memory of why the code was written that way, so it evaluates purely on quality. Two separate `-p` calls = two independent sessions.

**A7.** C) `-p --output-format json --json-schema <schema>`. `-p` for non-interactive, `--output-format json` for JSON output, `--json-schema` to enforce the exact structure (`file`, `line`, `severity`, `message`). Without `--json-schema`, Claude outputs JSON but the shape isn't guaranteed — it might use `fileName` instead of `file`, or nest fields differently.

**A8.** **Your script.** Claude's job is to produce structured findings (the JSON array). Your script's job is to interpret those findings and decide the exit code. This separation means you can change pass/fail thresholds (e.g., allow warnings but fail on errors) without changing the Claude prompt. Claude outputs data; your pipeline enforces policy.

**A9.** Both are valid for different purposes. The **slash command** (`/ci-review`) is for interactive local use — a developer runs it manually in their terminal to preview what CI would catch before pushing. The **workflow YAML** runs automatically in GitHub Actions on PR events with `-p` (no human present). They complement each other: local preview + automated enforcement. The key difference: slash commands are interactive (human approves tool calls), workflows are headless (must be read-only).

**A10.** Two failures: (1) **No read-only enforcement** — the CI rule didn't explicitly say "DO NOT create, edit, or delete files." Without this, Claude tries to be helpful by fixing issues. (2) **No tool restrictions in headless mode** — Claude running with `-p` has no human to approve/deny tool calls, so it can execute Write/Edit without confirmation. The fix: add "Read-only. Report findings only." to the CI rule, and consider using `--allowedTools` to restrict to read-only tools (Read, Grep, Glob only).

</details>

---

## PHASE 2: Tool Design & MCP Integration (Domain 2 — 18%)

---

## Lesson 2.1 — Designing Effective Tool Interfaces

**Q1.** You define a tool with `"description": "Get customer info"` and a single `"query"` parameter. A user asks "what's the status of order #12345?" — Claude calls `get_customer` instead of `lookup_order`. Why?
- A) The tool name is misleading
- B) The description is too vague to distinguish from other tools
- C) The query parameter accepts any string
- D) All of the above

**Q2.** You add a custom field `"boundary": "Do not use for order lookups"` to your tool definition JSON. Does Claude respect this boundary?

**Q3.** Your tool definition uses `"parameters"` as the key for the input schema. This works in OpenAI's API. What happens in the Anthropic API?

**Q4.** Your `get_customer` tool accepts both `email` and `customer_id`. Should both be in the `required` array? Why or why not?

**Q5.** Your `process_refund` tool description says "Process a refund." What's missing that could lead to dangerous misuse?

<details>
<summary>Answers</summary>

**A1.** D) All of the above, but B is the primary issue. When descriptions are vague ("Get customer info" vs "Get order by id"), Claude can't reliably distinguish tools. The generic `query` parameter makes it worse — Claude doesn't know if "query" means email, order ID, or product name.

**A2.** No. Claude's API only reads `name`, `description`, and `input_schema`. Custom fields like `boundary`, `edge_case`, or `input_format` are **silently ignored**. All context must go in the `description` string or property-level descriptions within `input_schema`.

**A3.** It doesn't work. Anthropic's API uses `input_schema`, not `parameters`. The field is silently ignored, so the tool appears to have no parameters — Claude either fails to call it or guesses inputs. Always use `input_schema` for Anthropic.

**A4.** Neither should be required. The customer might provide an email OR a customer ID. Making both required forces the caller to have both, which they rarely do. Leave both optional so Claude passes whichever the customer provided.

**A5.** Three critical things: (1) **Irreversibility warning** — "This action is irreversible" so Claude doesn't call it casually. (2) **Prerequisites** — "Only call after confirming the order exists via lookup_order." (3) **Required parameters** — refund_amount and reason should be explicit to prevent full-amount refunds by default.

</details>

---

## Lesson 2.2 — Structured Error Responses for MCP Tools

**Q1.** Your `get_customer` tool returns `{ "isError": false, "message": "Customer not found" }`. Is this correct?
- A) Yes — the customer wasn't found, so it's a result
- B) No — "not found" is an error, so `isError` should be true
- C) It depends on whether the customer exists

**Q2.** Name the 4 error categories and give one example of each from a customer support system.

**Q3.** Your `lookup_order` tool returns `{ "isError": true, "errorCategory": "validation", "isRetryable": true, "retry_after_ms": 5000 }` for an invalid order ID format. What's wrong?

**Q4.** A customer asks about order #999. Your tool returns `{ "isError": true, "errorCategory": "transient", "message": "Database connection timeout" }`. Claude tells the customer "Order #999 was not found." What went wrong?

**Q5.** Your `process_refund` tool has a $500 threshold — refunds over $500 require manager approval. What error category is this, and should `isRetryable` be true or false?

<details>
<summary>Answers</summary>

**A1.** A) Yes — this is correct. "Customer not found" with a valid search is a **valid empty result**, not an error. The database was successfully queried and returned zero matches. If `isError` were true, Claude might tell the customer "there was a system error" instead of "we couldn't find an account with that email."

**A2.** (1) **Transient**: database timeout, rate limit exceeded — retry after delay. (2) **Validation**: invalid email format, wrong UUID format — fix input and retry. (3) **Business**: multiple refund requests on same order, refund exceeds order total — explain policy to customer. (4) **Permission**: refund over $500 threshold — escalate to human, agent can't fix authorization limits.

**A3.** `retry_after_ms` doesn't make sense for validation errors. An invalid order ID won't become valid after waiting 5 seconds. Validation errors need `provided_value` and `expected_format` in `details` so Claude can explain what format is expected.

**A4.** **Access failure vs valid empty result.** A timeout is an access failure (transient error) — the database never responded, so we DON'T KNOW if the order exists. Without `isError: true`, Claude interpreted the error message as a result. With proper `isError: true`, Claude should tell the customer "we're experiencing a temporary issue, please try again" — NOT "order not found."

**A5.** **Permission** category, `isRetryable: false`. The agent cannot increase its own authorization limit — no amount of retrying will change the $500 threshold. The response should include `escalate_to_human: true` with the actual values (`requested_amount`, `max_allowed_refund: 500`) so the human reviewer has context.

</details>

---

## Lesson 2.3 — Tool Distribution Across Agents & Tool Choice

**Q1.** What's the difference between `tools` and `tool_choice` in an API call?
- A) `tools` defines which tools exist, `tool_choice` picks one
- B) `tools` defines the available menu, `tool_choice` controls selection behavior
- C) `tools` is set once, `tool_choice` must stay the same
- D) They're interchangeable

**Q2.** Your Order Agent has `tool_choice: { type: "tool", name: "get_customer" }` on EVERY turn. After calling `get_customer` successfully, what happens?

**Q3.** Your system has 18 tools distributed evenly across 3 agents (6 each). Performance is fine. A new developer consolidates all 18 tools into a single agent for "simplicity." What degrades?

**Q4.** Your Coordinator agent needs to dispatch tasks to subagents. What tools should it have?
- A) All domain tools (so it can handle simple requests itself)
- B) Only the `Task` tool
- C) `Task` plus `get_customer` (for quick lookups)
- D) No tools (it just routes via text)

**Q5.** Your Refund Agent has `process_refund` and `lookup_order` but NOT `get_customer`. A customer gives their email and asks for a refund. What happens, and what's the fix?

<details>
<summary>Answers</summary>

**A1.** B) `tools` defines the available menu (set once per agent/session), `tool_choice` controls selection behavior (can change per turn). They are independent parameters — you can have 5 tools with `tool_choice: "auto"`, or 5 tools with `tool_choice` forcing a specific one.

**A2.** **Infinite loop.** Forced `tool_choice` makes the agent call `get_customer` again, and again, forever — it has no choice. Fix: use a **turn-based strategy** — force `get_customer` on turn 1, then switch to `tool_choice: "auto"` on turn 2+ so the agent can proceed to other tools or end.

**A3.** **Tool selection accuracy degrades.** At ~18 tools, Claude starts misrouting — choosing `get_customer` when it should choose `lookup_order`, or calling `process_refund` during an investigation. Also, the investigation agent now has access to destructive tools (process_refund) it should never call. The 3-agent split was enforcing both accuracy and least privilege.

**A4.** B) Only the `Task` tool. The Coordinator routes requests to specialized subagents — it never touches domain data directly. Giving it domain tools (A, C) means it might handle requests itself instead of delegating, bypassing the subagent's specialized context and tool_choice enforcement.

**A5.** The Refund Agent can't look up the customer by email — it has `lookup_order` (needs order ID) but no `get_customer` (accepts email). The refund flow stalls. Fix: add `get_customer` to the Refund Agent's tools with `tool_choice` forcing it on turn 1, then `lookup_order` on turn 2, then `auto` from turn 3.

</details>

---

## Lesson 2.4 — MCP Server Integration in Claude Code

**Q1.** Where do you configure an MCP server that your whole team should use for the project?
- A) `~/.claude.json`
- B) `.mcp.json` in the project root
- C) `.claude/mcp-servers.json`
- D) `CLAUDE.md`

**Q2.** Your `.mcp.json` has `"env": { "DATABASE_URL": "${DATABASE_URL}" }`. Where does the actual value of `DATABASE_URL` come from?

**Q3.** You personally use a Notion MCP server for your own notes, but your teammates don't use Notion. Where do you configure it?

**Q4.** Your Postgres MCP server has a tool with description "run query." Claude keeps using `Bash` → `psql` instead. Why?

**Q5.** What's the difference between MCP **tools** and MCP **resources**?

<details>
<summary>Answers</summary>

**A1.** B) `.mcp.json` in the project root. It's git-committed and team-shared. `~/.claude.json` (A) is user-scoped (personal). C doesn't exist. D is for instructions, not server configuration.

**A2.** From the developer's local environment variables (shell environment, `.env` file, system settings). `${DATABASE_URL}` is expanded at connection time — the actual connection string is never stored in `.mcp.json`, keeping secrets out of git.

**A3.** `~/.claude.json` — user-scoped configuration. It applies to all projects YOU open with Claude Code, but isn't shared with teammates. Personal productivity tools go here; project-shared tools go in `.mcp.json`.

**A4.** **Description competition.** Claude knows exactly what Bash does — it's a built-in tool with detailed capabilities. "Run query" is too vague to compete. Fix: make the description specific — "Execute a read-only SQL query against the EverShop PostgreSQL database. Returns rows as JSON. Use this for product lookups, order queries, and price data instead of shell commands."

**A5.** **Tools** are actions Claude calls on demand (query database, create issue). **Resources** are read-only data loaded into context (product catalog, SKU list). Resources are available as context without Claude making a tool call — faster, cheaper, no query risk.

</details>

---

## Lesson 2.5 — Built-in Tools (Read, Write, Edit, Bash, Grep, Glob)

**Q1.** You need to find every file that imports `localCart.js`. Which tool?
- A) Glob
- B) Grep
- C) Read
- D) Bash (`grep -r`)

**Q2.** You need to find all `.jsx` page components in the `extensions/` directory. Which tool?
- A) Glob
- B) Grep
- C) Read
- D) Bash (`find`)

**Q3.** You use Edit to change `retry_after_ms: 2000` to `retry_after_ms: 3000` in a JSON file, but it fails. Why might this happen, and what's the fallback?

**Q4.** Describe the exploration pattern for tracing a function's call chain. What tools do you use, and in what order?

**Q5.** Your Explore subagent has `allowed-tools: Read, Grep, Glob`. Can it run `npm test` to verify its findings? Why or why not?

<details>
<summary>Answers</summary>

**A1.** B) Grep — you're searching file **contents** for a pattern (`import.*localCart` or `require.*localCart`). Glob searches file names, not contents. Bash `grep` works but dedicated tools are preferred for better UX and reviewability.

**A2.** A) Glob — you're searching for files by **name pattern** (`extensions/**/*.jsx`). Grep searches file contents, which isn't what you need here. Bash `find` works but Glob is the dedicated tool.

**A3.** Edit fails when `old_string` matches multiple locations in the file — it can't determine which occurrence to replace (safety feature, prevents accidental changes). Fallback: **Read** the file first (to see full contents), then **Write** the entire file with the change applied. Read+Write is the escape hatch when Edit can't find a unique match.

**A4.** **Grep → Read → Grep → Read** (repeat). (1) Grep the function name to find all files that reference it. (2) Read the most relevant file to understand how it's called. (3) Grep the calling function's name to find ITS callers. (4) Read those files. Continue until you've traced the full chain. This is purely read-only — no mutation needed for exploration.

**A5.** No. `npm test` requires the **Bash** tool, which isn't in the allowed list. Explore subagents are restricted to the tools specified in `allowed-tools` — Read, Grep, Glob are all read-only exploration tools. This enforces the principle that exploration doesn't mutate the codebase. If you need to run tests, that's a separate step outside the Explore subagent.

</details>

---

<!-- Future lessons will be appended below -->
