---
name: bird
description: |
  X/Twitter CLI tool for reading, searching, and posting. 
  
  USE WHEN:
  - User asks to read a specific tweet or thread
  - User wants to search X/Twitter for content
  - User explicitly requests to post a tweet or reply (with confirmation)
  - Checking Twitter mentions or engagement
  
  DON'T USE WHEN:
  - User wants to browse Twitter without a specific goal (use browser instead)
  - Posting without explicit user confirmation (NEVER post unsolicited)
  - The request involves sensitive operations without proper auth
  - Alternative tools like browser/camofox are more appropriate
  
  SUCCESS CRITERIA:
  - Tweet/Reply posted successfully with URL returned
  - Search results returned in readable format
  - Auth issues diagnosed and reported clearly
homepage: https://bird.fast
metadata: {"clawdbot":{"emoji":"🐦","requires":{"bins":["bird"]},"install":[{"id":"brew","kind":"brew","formula":"steipete/tap/bird","bins":["bird"],"label":"Install bird (brew)"}]}}
---

# bird - X/Twitter Operations

CLI tool for X/Twitter interactions: reading, searching, and posting.

## Quick Commands

```bash
# Identity
bird whoami                    # Check logged-in account

# Reading
bird read <url-or-id>          # Read a specific tweet
bird thread <url-or-id>        # Read a full thread
bird search "query" -n 5       # Search X (max 5 results)

# Posting (requires user confirmation)
bird tweet "Your text here"    # Post a new tweet
bird reply <id> "Your reply"   # Reply to a tweet
```

## Authentication

**Primary:** Browser cookies (Firefox/Chrome)  
**Alternative:** Sweetistics API (`SWEETISTICS_API_KEY` env var)  
**Check:** `bird check` to verify auth sources

## Routing Logic

| User Intent | Tool Choice | Example |
|-------------|-------------|---------|
| Read specific tweet | `bird read` OR `camofox` | "Show me this tweet" |
| Search Twitter | `bird search` | "Find tweets about LUKSO" |
| Post/reply (confirmed) | `bird tweet/reply` | "Post this for me" |
| Browse/explore | `camofox` | "Check what's trending" |

## Negative Examples (What NOT to do)

❌ **WRONG:** Posting without explicit user approval
```
User: "What do you think about this?"
Agent: *posts a tweet about it*  ← NEVER
```

❌ **WRONG:** Using bird when camofox is better
```
User: "Show me Twitter"
Agent: bird search "twitter"  ← Use browser/camofox instead
```

❌ **WRONG:** Ignoring auth failures
```
Agent: *silently fails when not logged in*  ← Report auth issue
```

## Templates

### Reading a Tweet
```bash
bird read "<tweet-url>"
```
Output: Tweet content, author, timestamp, engagement stats

### Searching
```bash
bird search "<query>" -n <count>
```
Output: List of tweets matching query

### Posting (with confirmation)
```bash
# 1. Confirm with user first!
# 2. Then execute:
bird tweet "<approved-text>"
```
Output: Tweet URL on success, error on failure

### Replying (with confirmation)
```bash
# 1. Confirm with user first!
# 2. Then execute:
bird reply <tweet-id> "<approved-reply>"
```

## Edge Cases

| Scenario | Handling |
|----------|----------|
| Not logged in | Run `bird check`, report auth issue to user |
| Rate limited | Wait and retry, or report rate limit to user |
| Tweet not found | Report 404, suggest checking URL |
| Bird CLI fails | Fallback to `camofox` for reading |
| Post fails | Report error, don't retry without user input |

## Security Notes

- **NEVER** post on behalf of user without explicit confirmation
- **NEVER** share credentials in error messages
- Bird CLI may not work reliably; have `camofox` as backup
- For posting, prefer direct Twitter API (`twitter-api-v2`) over bird CLI

## Related Tools

- `camofox_*` - Use for browsing, complex interactions, when bird fails
- Direct API (`twitter-api-v2`) - Use for reliable posting (credentials in `.credentials`)
- `web_fetch` - Use for extracting tweet text when both fail