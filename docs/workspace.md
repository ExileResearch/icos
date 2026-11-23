# The ICOS Data Folder

Everything the running system reads or writes at runtime lives here — databases,
auth material, the persona core, the agent workspace, and the runtime skills
copy. The repository ships code and development material only: planning notes
and scratch never ship, and no shipped file or test may depend on one.

## Index

```shell
.icos/   # Root of project.
│
├── auth/                   # Authentication material, keys, and audit history
│     ├── audit.log         #
│     ├── session.key       #
│     ├── token             # Web UI auth token.
│     └── vault.key         #
│
├── data/                   # Structured, persistent state across sessions.
│     ├── attachments/      # User-uploaded message attachments.
│     │
│     ├── channels.db       # Discord channel or integration state (?)
│     ├── claims-vector.db  # Vector-associated claims or epistemic retrieval (?)
│     ├── memories.db       # Stored memories
│     ├── persona.db        # Structured persona state
│     └── sessions.db       # Conversation/session persistence
│
├── models/                 # Vector-memory model assets.
│     └── .ruvector/        # RuVector model assets.
│
├── persona/                # ICOS instance identity definition.
│     └── core.md           # Core identity definition file.
│
├── skills/                 # Agent skills catalog. (duplicate)
│
├── verifier/               # Verifier decision model assets.
│
├── workspace/              # Mutable environment for user and agent activity.
│     ├── browser/          # Browser-related artifacts from headless browser (?)
│     ├── journal/          # Agent's daily journal entries (if used)
│     ├── kb/               # Persistent knowledge and user-maintained material.
│     │     ├── ...             # Assorted assets and folders created by user and agent.
│     │     │
│     │     ├── _deprecated/    # Archived files and folders.
│     │     ├── .git/           # Git config for KB file versioning.
│     │     ├── AGENTS.md       # Instructions for the KB and conventions used.
│     │     ├── INDEX.md        # KB INDEX map.
│     │     ├── PRIORITIES.md   # User-configurable "priorities" for the ICOS agent.
│     │     └── .gitignore      # Configurable ignorelist for Git versioning.
│     │     └── .kbignore       # Configurable ignorelist for KB steward.
│     ├── notes/            # Working notes and temporary reasoning artifacts
│     ├── skills/           # Agent skills catalog. (duplicate)
│     ├── src/              # Source repositories the agent can work with.
│     └── ...               #
│
└── mcp-servers.json        # External tool integration configuration.
```

- /src
- /kb
- /skills

---

- /notes
- /browser
