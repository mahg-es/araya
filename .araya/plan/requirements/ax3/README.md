## How AX3 works

AX3 is a tiny "AX3.md" framework that gives an AI agent precise project context.

The agent keeps a hierarchy of "AX3.md" files as the project changes:

- root "AX3.md" contains project-wide instructions and the top-level index
- child "AX3.md" files contain local instructions for specific areas
- before any edit, the agent walks the docs tree from the root to the area it will touch
- the relevant docs give it exact local guidelines, so it does not edit blindly
- after meaningful changes, it updates the affected "AX3.md" files

The result is simple: traverse the docs, understand the local rules, make precise edits, keep the docs current. Less guessing. Less drift. Less "why did it touch that file?"

## How to use

1. Copy the contents of "AX3.md" into your project's "AX3.md" file.

That's it. No installation, no dependencies, no package, no runtime. AX3 is just a Markdown instruction for AI agents.

It works with any AI agent that supports "AX3.md" files, including Codex, Claude Code, OpenCode, and similar tools.

No "AX3.md" yet? Copy the file into your project root. The agent will see these instructions and will start building the AX3 tree.

For an existing project, you can tell your agent: `Initialize AX3 tree for this project now.` It will create all the child "AX3.md" files and indexes.
