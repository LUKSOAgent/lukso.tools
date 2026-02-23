# Cron Failure Log

**Date:** 2026-02-16
**Job:** daily-community-report
**Error:** GrammyError: Call to 'sendMessage' failed! (400: Bad Request: message is too long)

**Issue:**
The daily community report cron generated content that exceeded Telegram's message length limit (4096 characters). The report ran for ~4 minutes before failing.

**Root Cause:**
The agent generating the report didn't limit output length when compiling the comprehensive daily report.

**Fix Required:**
Update the cron payload to:
1. Add explicit character limit (max 3500 chars for safety margin)
2. Truncate long sections with "..." and note the truncation
3. Or split into multiple messages if content is extensive
4. Prioritize brevity - "extensive detail" in the prompt may be causing bloat

**Impact:**
- Daily report not delivered to JordyDutch
- 233 seconds of API time wasted
- Will fail again tomorrow if not fixed

**Suggested prompt change:**
Change "Extensive detail on worthy items" to "Brief but informative detail on worthy items, max 3000 characters total" in the daily report cron payload.