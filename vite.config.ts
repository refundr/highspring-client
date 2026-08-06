/**
 * Vite config for the Remix app.
 *
 * Plugin order matters a little:
 * 1. `@tailwindcss/vite` — scans classNames and builds CSS
 * 2. Remix plugin — file-based routes under app/routes
 * 3. tsconfigPaths — lets us `import "~/…"` instead of relative `../../`
 *
 * Dev server listens on port 3000 (API is usually 8090).
 */
import { execSync } from "node:child_process";
import { vitePlugin as remix } from "@remix-run/dev";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

/** Prefer CI env, else local `git rev-parse`. Baked into the client at build/dev time. */
function gitCommitSha(): string {
  const fromEnv = process.env.GITHUB_SHA || process.env.GIT_COMMIT_SHA;
  if (fromEnv && fromEnv.trim()) {
    return fromEnv.trim();
  }
  try {
    return execSync("git rev-parse HEAD", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "unknown";
  }
}

const commitSha = gitCommitSha();

export default defineConfig({
  define: {
    __COMMIT_SHA__: JSON.stringify(commitSha),
  },
  plugins: [
    tailwindcss(),
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
      },
    }),
    tsconfigPaths(),
  ],
  server: {
    // Prefer localhost so the printed URL matches Google OAuth redirect
    // (http://localhost:3000/auth/callback) — 127.0.0.1 is a different origin.
    host: "localhost",
    port: Number(process.env.PORT) || 3000,
    strictPort: true, // fail if port is already in use
  },
});
