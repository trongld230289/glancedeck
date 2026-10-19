# glancedeck

A Claude Code mod: one pane beside the transcript with four blocks.

- **QUEUE**: prompts for this project, sent one at a time when Claude is free, as your own words.
- **SESSIONS**: every other Claude Code session on this machine, across all accounts (`CLAUDE_CONFIG_DIR`). Whoever waits on you sits on top in yellow.
- **TURN**: the main model's turn as it runs (spinner, clock, edits, errors, agents), then a receipt for it.
- **AGENTS**: the newest subagents, newest on top, with a spinner and clock while running; a number key opens one's tokens, tools and answer.
- **SESSION LOG**: prompts, edits, commands and questions, newest on top; `all` merges the other sessions' logs.

Tested on Claude Code **2.1.302** (Windows 11). Mods are early access: the API can change between releases.

## Install

At the prompt of a Claude Code terminal session:

```
/plugin install glancedeck --marketplace trongld230289/glancedeck
```

Answer `y` to add the marketplace, then pick a scope (user: every project). From a shell:

```sh
claude plugin install glancedeck --marketplace trongld230289/glancedeck
```

In the desktop app, where `/plugin` does not run: click + next to the prompt box, then Plugins, Add marketplace with `trongld230289/glancedeck`, then Add plugin.

**Several accounts** (`CLAUDE_CONFIG_DIR=~/.claude-acc2`, ...): each account keeps its own plugins, so run the install once per account. Sessions that were already open load it only after they restart (`/exit`, then `claude --continue`).

## Commands

| Command | Does |
|---|---|
| `/q <text>` | add to the end of the queue (works while Claude is busy) |
| `/q --if-ok <text>` | send only if the turn before ended with no failed tool call |
| `/q list` · `clear` · `pause` · `resume` | |
| `/glancedeck` · `/glancedeck close` | open or close the pane |

## Keys

Focus the pane with `ctrl+x tab`; Tab and the arrows walk the rows, Enter presses.

With the mouse: click a block's title to fold or unfold it; click **+ add** in QUEUE to add an item; click another session's row to message it (click again to close).

| Key | Does |
|---|---|
| `q` | add an item |
| `k` / `j` | move the selected item up / down |
| `e` · `d` · `p` | edit · delete · pause or resume |
| `n` | send the head item now |
| `m` | move the selected item to another session's queue |
| `1`–`9` | expand an agent card |
| Enter on an Edit row in the log | open the file in VS Code (`code` on PATH) |

## How the queue sends

The next item starts a 5-second countdown when the main turn has ended, no background subagent of this session is running, and Claude is not asking you a question. The band above the prompt then shows **[Send now]** (`n`) and **[Cancel]** (`x`, also pauses the queue). Typing anything in the prompt box cancels that send; the item stays and the queue goes on after your turn.

- `--if-ok` after a failed turn: the item is held, the queue pauses, a toast says why.
- Over 90% of this account's 5-hour window: the queue holds and goes on by itself when the window resets.
- A reopened session does not start sending on its own: it waits for its first turn to end, or `/q resume`.
- Two sessions on one repo share its queue file, but each item is sent by the session it was queued in; if that session is gone, the one that started first sends it.

## Files

Everything shared lives in `~/.glancedeck/`: `queues/<project>.json` (the queue and today's sent history), `sessions/<id>.json` (each session's heartbeat, every 5 s; older than 30 s is hidden), `alerts/` (so a 3-minute wait alerts once, not once per session). The mod cannot delete files, so old heartbeats stay there; each is a few KB.

## Develop

```sh
claude plugin validate glancedeck
claude plugin test glancedeck
```
