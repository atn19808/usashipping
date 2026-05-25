### CI Review Rules

When reviewing code changes (e.g., in a PR), follow these rules:

1. **Read only**: DO NOT create, edit, or delete files. Report findings only.
2. **Scope**: Only review files modified in the current PR
3. **Conventions**: Adhere to Evershop conventions defined in `CLAUDE.md` and `/rules`
4. **Output Format**: Use structured JSON with `file`, `line`, `severity`, `message`
5. **Error Handling**: Exit with non-zero code if errors found
6. **Incremental Instruction**: If prior findings are provided in the prompt, continue from there without repeating previous findings

**Severity Levels:**
- `error`: Critical issues blocking deployment
- `warning`: Non-critical issues that should be fixed
- `info`: Informational messages about best practices

**Common Review Areas:**
- Missing middleware in API routes
- Incorrect handler signatures
- Not using `response.$body`
- Missing `next()` in active middleware
- Missing `route.json`
- Bracket ordering in middleware filenames
- Missing env vars in `.env.dev`
- Version bumps in `migration/`
