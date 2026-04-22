#!/bin/bash
# Cron-friendly refresher — calls Claude Code headless to repopulate
# data/*.json from your MCPs.
#
# ⚠️  This is a TEMPLATE. Copy it to scripts/refresh.local.sh
#     (which is gitignored) and edit the placeholders there.
#
#   Placeholders you must set:
#     GH_USER       — your GitHub username (for the "is:open author:..." PR query)
#     SLACK_HANDLE  — your Slack handle (for mentions/DM queries)
#     DESK_DIR      — absolute path to this repo on your machine
#
# Install (every minute during work hours; the script self-gates):
#   crontab -e
#   * * * * * /ABSOLUTE/PATH/TO/postcard-desk/scripts/refresh.local.sh
set -u
export PATH=/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin

# === edit these ===============================================================
GH_USER="your-github-username"
SLACK_HANDLE="your.slack.handle"
DESK_DIR="$HOME/github/postcard-desk"
# =============================================================================

LOG="$HOME/Library/Logs/postcard-desk-refresh.log"
DOW=$(date +%u); HOUR=$(date +%H)
echo "[$(date -Iseconds)] tick dow=$DOW hour=$HOUR" >> "$LOG"
if [ "$DOW" -gt 5 ]; then echo "[$(date -Iseconds)] skip: weekend" >> "$LOG"; exit 0; fi
if [ "$HOUR" -lt 9 ] || [ "$HOUR" -gt 21 ]; then echo "[$(date -Iseconds)] skip: off-hours" >> "$LOG"; exit 0; fi
cd "$DESK_DIR" || exit 1

PROMPT="Refresh the postcard desk data by running MCPs in parallel, then write JSON files. No preamble, no commentary — just fetch, write, exit.

Targets (overwrite these files exactly):
- data/slack.json — top 6 direct mentions / DMs in the past 18h. Use the Slack MCP search with query \"mentions:${SLACK_HANDLE} OR to:${SLACK_HANDLE} after:YESTERDAY\". Fields per item: {id, who, channel, msg (truncate to 140 chars), ago (e.g. \"3h\"), urgent (true if unread/tagged)}.
- data/prs.json — open PRs authored by ${GH_USER} via the GitHub MCP search_pull_requests with query \"is:open author:${GH_USER} archived:false\". Fields: {id, num, repo (org/name), title, age (e.g. \"3d\"), stale (true if >14d), reviewers}.
- data/jira.json — my open Jira via the Atlassian MCP searchJiraIssuesUsingJql with JQL \"assignee = currentUser() AND statusCategory != Done ORDER BY updated DESC\". If the MCP errors, write [] and move on. Fields: {id, key, title, status (one of \"To Do\"|\"In Progress\"|\"Review\"|\"Blocked\"|\"Done\")}.
- data/confluence.json — up to 10 Confluence pages contributed by me via the Atlassian MCP searchConfluenceUsingCql with CQL \"contributor = currentUser() AND type = page ORDER BY lastmodified DESC\". Fields: {id, space, title, by: \"you\", ago, kind: \"edited\"}.
- data/calendar.json — today's events via the Google Calendar MCP list_events (calendar_id=primary, time_min=today 00:00 local, time_max=today 23:59 local). Fields: {id, time (HH:MM 24h local), end (HH:MM), title, loc, kind (one of \"recurring\"|\"focus\"|\"meeting\")}.
- data/gdocs.json — top 8 recently-modified Google Drive files via the Google Drive MCP search (order by modifiedTime desc). Fields: {id, title, kind (one of \"doc\"|\"sheet\"|\"slide\"|\"pdf\"|\"other\" — infer from mimeType), by (last modifier display name or \"you\"), ago (e.g. \"2h\", \"1d\"), url (webViewLink)}. If the MCP fails or is unauthorized, write [].
- data/last_synced.json — {\"iso\": <current UTC ISO8601>, \"label\": <current time as \"h:mm AM/PM\">, \"sources\": {<per-file iso>}}.

Do not touch data/intention.json. Do not touch TASKS.md. Use the Write tool. If any MCP fails, write [] for that file. Exit immediately after all writes."

claude -p "$PROMPT" --permission-mode acceptEdits --output-format text >> "$LOG" 2>&1
echo "[$(date -Iseconds)] done exit=$?" >> "$LOG"
