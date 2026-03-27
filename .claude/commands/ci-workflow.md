Run a CI check for usashipping. Report each check as a PASS or FAIL with a brief explanation.
1. Review only the files modified in the current pr
2. Use Evershop conventions from CLAUDE.md and /rules
3. Run "claude -p "Review the diff" --output-format json" to output structured JSON file with: file, line, severity (error/warning/info), message
4. Exit with non-zero code if any errors found