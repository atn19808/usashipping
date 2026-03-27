Run a pre-deployment checklist for usashipping. Report each check as PASS or FAIL.

## Check 1: Uncommited changes
Run `git status`. PASS if working tree is clean. FAIL if any modified or untracked files exist - list them.

## Check 2: Migration version bump
Run `git diff --name-only HEAD` and look for files under any `migration/` folder. For each, check whether that extension's package.json version was bumped compared to the last commit. PASS if no new migrations or all have version bumped. FAIL if a migration was added without a version bump.

## Check 3: Undocumented env vars
Search `extensions/` for all `process.env.*` references. Read `.env.dev` and compare. PASS if every referenced env var exists in `.env.dev`. FAIL if any are missing - list them. 