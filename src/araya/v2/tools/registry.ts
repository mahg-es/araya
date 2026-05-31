import { resolve, relative } from "node:path";
import { existsSync, readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { execSync } from "node:child_process";

export interface ToolResult {
  success: boolean;
  output: string;
  error?: string;
}

export class ToolRegistry {
  private workspaceRoot: string;
  private allowedTestAliases: string[] = ["npm test", "npm run test", "jest", "npm run build"];
  private allowPackageLock: boolean;

  constructor(workspaceRoot: string, allowedTestAliases?: string[], allowPackageLock: boolean = false) {
    this.workspaceRoot = resolve(workspaceRoot);
    if (allowedTestAliases) {
      this.allowedTestAliases = allowedTestAliases;
    }
    this.allowPackageLock = allowPackageLock;
  }

  private resolveSafePath(userPath: string): string {
    const canonicalWorkspace = this.workspaceRoot;
    const resolvedPath = resolve(canonicalWorkspace, userPath);
    
    // Check path traversal
    const rel = relative(canonicalWorkspace, resolvedPath);
    if (rel.startsWith("..") || resolve(resolvedPath) === resolve(canonicalWorkspace, "..")) {
      throw new Error(`Path traversal blocked: "${userPath}" resolves outside workspace root.`);
    }
    return resolvedPath;
  }

  private isProtectedPath(resolvedPath: string): boolean {
    const rel = relative(this.workspaceRoot, resolvedPath).replace(/\\/g, "/");
    
    if (rel === "package-lock.json" && this.allowPackageLock) {
      return false;
    }

    const protectedPatterns = [
      /^\.git(\/|$)/,
      /^\.env$/,
      /^node_modules(\/|$)/,
      /^package-lock\.json$/
    ];

    return protectedPatterns.some(pattern => pattern.test(rel));
  }

  async executeTool(name: string, args: Record<string, any>): Promise<ToolResult> {
    try {
      switch (name) {
        case "read_file": {
          const pathArg = args.path;
          if (!pathArg) throw new Error("Missing 'path' argument.");
          const safePath = this.resolveSafePath(pathArg);
          if (!existsSync(safePath)) {
            throw new Error(`File not found: "${pathArg}"`);
          }
          if (statSync(safePath).isDirectory()) {
            throw new Error(`Path is a directory, not a file: "${pathArg}"`);
          }
          const content = readFileSync(safePath, "utf-8");
          return { success: true, output: content };
        }

        case "write_file": {
          const pathArg = args.path;
          const contentArg = args.content ?? "";
          if (!pathArg) throw new Error("Missing 'path' argument.");
          const safePath = this.resolveSafePath(pathArg);
          if (this.isProtectedPath(safePath)) {
            throw new Error(`Access denied: Writing to protected path "${pathArg}" is blocked.`);
          }
          writeFileSync(safePath, contentArg, "utf-8");
          return { success: true, output: `File written successfully to "${pathArg}".` };
        }

        case "list_directory": {
          const pathArg = args.path ?? ".";
          const safePath = this.resolveSafePath(pathArg);
          if (!existsSync(safePath)) {
            throw new Error(`Directory not found: "${pathArg}"`);
          }
          if (!statSync(safePath).isDirectory()) {
            throw new Error(`Path is a file, not a directory: "${pathArg}"`);
          }
          const files = readdirSync(safePath);
          return { success: true, output: JSON.stringify(files, null, 2) };
        }

        case "run_tests": {
          const commandArg = args.command;
          if (!commandArg) throw new Error("Missing 'command' argument.");
          
          const trimmedCommand = commandArg.trim();
          if (!this.allowedTestAliases.includes(trimmedCommand)) {
            throw new Error(`Security violation: Test command "${trimmedCommand}" is not an allowed test alias.`);
          }
          
          const output = execSync(trimmedCommand, {
            cwd: this.workspaceRoot,
            encoding: "utf-8",
            stdio: "pipe"
          });
          
          return { success: true, output };
        }

        default:
          throw new Error(`Unknown tool: "${name}"`);
      }
    } catch (err) {
      return { success: false, output: "", error: (err as Error).message };
    }
  }
}
