# OpenClaw Skills Reference

This directory contains a copy of the OpenClaw workspace skills from `~/.openclaw/workspace/` for reference and documentation purposes.

## What Are These Files?

These are **OpenClaw system skills** that define how the OpenClaw agent operates and integrates with your environment. They are markdown files containing instructions, patterns, and behaviors.

## Available Skills

| File | Purpose |
|------|---------|
| `AGENTS.md` | Agent management, session handling, and coordination patterns |
| `BOOTSTRAP.md` | Initialization and startup procedures |
| `HEARTBEAT.md` | Health monitoring and status checks |
| `IDENTITY.md` | Identity management and authentication |
| `SOUL.md` | Core personality, behavior patterns, and decision-making |
| `TOOLS.md` | Tool integration and command execution |
| `USER.md` | User preferences and customization |

## Integration with Synthesis Engine

Our OpenClaw integration in `src/lib/services/openclaw-bridge.ts` and `src/lib/services/openclaw-adapter.ts` communicates with the OpenClaw Gateway daemon that uses these skills.

## Sync Status

These files are **reference copies** from your local OpenClaw installation. If you modify OpenClaw skills in `~/.openclaw/workspace/`, you'll need to recopy them here:

```bash
cp ~/.openclaw/workspace/*.md openclaw-skills/
```

## Last Synced
2026-02-11T04:40:36+08:00
