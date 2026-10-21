# LYCHO — on-device Android app

The full LYCHO platform rebuilt as a personal Android app. No servers: every account, agent, chat and setting lives in a SQLite database on the phone, and AI runs through your own Gemini, Groq and OpenRouter keys.

## Getting the APK

Every push to `main` that touches `lycho-app/` runs **Build LYCHO APK** (`.github/workflows/build.yml`). When it finishes:

- **Releases** → latest `LYCHO build N` → download `LYCHO-N.apk`, or
- **Actions** → the run → **Artifacts**.

All builds are signed with the same key (`signing/lycho.keystore`), so a new APK installs over the old one and keeps your data.

## What's inside (Phase 1)

| Area | Details |
|---|---|
| Accounts | Local sign-up / sign-in, salted + iterated password hashes, recovery codes, fingerprint lock with auto re-lock |
| Master Panel | First account is the owner. PIN + fingerprint gate, system stats, AI ops, router and audit logs, account management, SQL console, backup/restore, wipe |
| AI keys | Gemini, Groq, OpenRouter — stored in the Android keystore (never in the DB, backups or git), tested on save |
| Smart router | Classifies each message (fast / balanced / heavy / long), picks the best live model per provider, falls back on errors and rate limits, logs every call |
| Agents | 7 core agents + LYCHO Prime + 370 specialists across 20 sectors, favourites, Agent Studio with AI-written prompts |
| Chat | Per-agent conversations, markdown replies, per-chat model override, retry, auto titles |
| Data | Full JSON backup/restore (keys excluded) |

## Roadmap

2. Knowledge base, memory graph, personas, marketplace
3. Forge, Orion, Evolve, Heal, Oracle, Predict, Syndicate, Swarm, Nexus, workflows
4. Scout, Sense, voice, analytics, A/B lab, training, simulate, compete, economy, society, channels, gateway/MCP
5. LYCHO World, portal, audit & observe

## Structure

```
src/app/        screens (Expo Router)
src/lib/        db, auth, session, vault, backup, ai/router, ai/providers
src/data/       agent catalogue (generated from ../lib/agents/all-agents.ts)
src/components/ UI kit, logo, markdown
```

Built with Expo SDK 58 / React Native 0.88.
