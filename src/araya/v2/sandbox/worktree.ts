import { resolve, relative } from "node:path";
import { existsSync, statSync } from "node:fs";
import { execSync } from "node:child_process";

export class WorktreeSandboxManager {
  private workspaceRoot: string;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = resolve(workspaceRoot);
  }

  private validateIdentifier(id: string, name: string): void {
    const regex = /^[a-zA-Z0-9_-]+$/;
    if (!regex.test(id)) {
      throw new Error(`Invalid identifier: "${name}" must only contain alphanumeric characters, hyphens, or underscores.`);
    }
    if (id === "main" || id === "dev-mahg") {
      throw new Error(`Security violation: "${name}" cannot be "main" or "dev-mahg".`);
    }
  }

  async createWorktree(runId: string, agentName: string): Promise<{ path: string; branch: string }> {
    this.validateIdentifier(runId, "runId");
    this.validateIdentifier(agentName, "agentName");

    const branch = `araya-run/${runId}/agent/${agentName}`;
    const worktreePath = resolve(this.workspaceRoot, ".araya", "worktrees", runId, agentName);

    // Verify path constraints
    const allowedRoot = resolve(this.workspaceRoot, ".araya", "worktrees");
    const relativePath = relative(allowedRoot, worktreePath);
    if (relativePath.startsWith("..") || worktreePath === allowedRoot) {
      throw new Error("Security violation: Worktree path must stay inside .araya/worktrees/.");
    }

    // Git worktree add command from current HEAD
    try {
      execSync(`git worktree add -b "${branch}" "${worktreePath}" HEAD`, {
        cwd: this.workspaceRoot,
        stdio: "pipe",
      });
    } catch (err: any) {
      throw new Error(`Failed to create git worktree: ${err.stderr || err.message}`);
    }

    return { path: worktreePath, branch };
  }

  async listWorktrees(): Promise<Array<{ path: string; branch: string; ageMs: number }>> {
    try {
      const output = execSync("git worktree list --porcelain", {
        cwd: this.workspaceRoot,
        encoding: "utf-8",
      });

      const lines = output.split("\n");
      const worktrees: Array<{ path: string; branch: string; ageMs: number }> = [];
      let currentPath = "";
      let currentBranch = "";

      for (const line of lines) {
        if (line.startsWith("worktree ")) {
          currentPath = line.substring("worktree ".length).trim();
        } else if (line.startsWith("branch ")) {
          const ref = line.substring("branch ".length).trim();
          currentBranch = ref.replace("refs/heads/", "");
        } else if (line === "") {
          // Only check worktrees in .araya/worktrees/
          if (currentPath && currentPath.replace(/\\/g, "/").includes(".araya/worktrees")) {
            let ageMs = 0;
            try {
              const stats = statSync(currentPath);
              ageMs = Date.now() - stats.mtime.getTime();
            } catch {}
            worktrees.push({
              path: currentPath,
              branch: currentBranch,
              ageMs,
            });
          }
          currentPath = "";
          currentBranch = "";
        }
      }
      return worktrees;
    } catch (err: any) {
      throw new Error(`Failed to list git worktrees: ${err.message}`);
    }
  }

  async cleanupWorktree(runId: string, agentName: string, isSuccessful: boolean = true): Promise<void> {
    this.validateIdentifier(runId, "runId");
    this.validateIdentifier(agentName, "agentName");

    const branch = `araya-run/${runId}/agent/${agentName}`;
    const worktreePath = resolve(this.workspaceRoot, ".araya", "worktrees", runId, agentName);

    if (!isSuccessful) {
      console.log(`[WorktreeSandboxManager] Preserving aborted/failed worktree at: ${worktreePath}`);
      return;
    }

    // 1. Remove the worktree
    if (existsSync(worktreePath)) {
      try {
        execSync(`git worktree remove --force "${worktreePath}"`, {
          cwd: this.workspaceRoot,
          stdio: "pipe",
        });
      } catch (err: any) {
        throw new Error(`Failed to remove git worktree at "${worktreePath}": ${err.stderr || err.message}`);
      }
    }

    // 2. Delete the temporary branch only after worktree is removed
    try {
      execSync(`git branch -D "${branch}"`, {
        cwd: this.workspaceRoot,
        stdio: "pipe",
      });
    } catch (err: any) {
      // Ignore if branch doesn't exist
    }
  }

  async detectStaleWorktrees(maxAgeMs: number = 86400000): Promise<Array<{ path: string; branch: string }>> {
    const list = await this.listWorktrees();
    return list.filter(w => w.ageMs > maxAgeMs).map(w => ({ path: w.path, branch: w.branch }));
  }

  async pruneStaleWorktree(worktreePath: string, branch: string): Promise<void> {
    if (existsSync(worktreePath)) {
      try {
        execSync(`git worktree remove --force "${worktreePath}"`, {
          cwd: this.workspaceRoot,
          stdio: "pipe",
        });
      } catch (err: any) {
        throw new Error(`Failed to prune stale git worktree at "${worktreePath}": ${err.stderr || err.message}`);
      }
    }

    try {
      execSync(`git branch -D "${branch}"`, {
        cwd: this.workspaceRoot,
        stdio: "pipe",
      });
    } catch (err: any) {
      // Ignore if branch doesn't exist
    }
  }
}
