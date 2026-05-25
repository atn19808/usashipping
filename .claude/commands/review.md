Review the API endpoint at $ARGUMENTS for Evershop extension conventions. 

Check EverShop extension conventions:
1. Does route.json exist?
2. Are middleware files named with bracket ordering? (e.g. [context]bodyParser[auth].js)
3. Do handlers use the correct signature? async (request, response, delegate, next)
4. Is response.$body used (not response.json() or response.send())?
5. Does it call next() if it's active middleware?

Output findings as a checklist
- [] or [x] for each convention
- Include the specific file and line if a violation is found
- If the path is a directory, check ALL files under it
