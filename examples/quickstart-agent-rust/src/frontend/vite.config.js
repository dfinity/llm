import { defineConfig } from 'vite';
import { icpBindgen } from '@icp-sdk/bindgen/plugins/vite';
import { execSync } from 'node:child_process';

// `ICP_ENVIRONMENT=ic pnpm start` to develop against a deployed mainnet backend.
const environment = process.env.ICP_ENVIRONMENT || 'local';
const BACKEND_CANISTER = 'agent-backend';

export default defineConfig(({ command }) => {
  const base = {
    build: { emptyOutDir: true },
    publicDir: 'assets',
    plugins: [
      icpBindgen({
        didFile: '../backend/backend.did',
        outDir: './src/bindings',
      }),
    ],
  };

  // Asset canister sets the ic_env cookie in production; the dev server has to mimic it.
  if (command !== 'serve') {
    return base;
  }

  let networkStatus;
  try {
    networkStatus = JSON.parse(
      execSync(`icp network status -e ${environment} --json`, { encoding: 'utf-8' }),
    );
  } catch {
    console.error(
      `\n❌ Could not query network status for "${environment}".` +
        `\n   Is the icp CLI installed? Try running \`pnpm install\` at the repo root.` +
        `\n   If installed, start the network with: icp network start\n`,
    );
    process.exit(1);
  }

  let canisterId;
  try {
    canisterId = execSync(`icp canister status ${BACKEND_CANISTER} -e ${environment} -i`, {
      encoding: 'utf-8',
    }).trim();
  } catch {
    console.error(
      `\n❌ Backend canister "${BACKEND_CANISTER}" not found in "${environment}".` +
        `\n   Deploy it first: icp deploy ${BACKEND_CANISTER} -e ${environment}\n`,
    );
    process.exit(1);
  }

  return {
    ...base,
    server: {
      headers: {
        'Set-Cookie': `ic_env=${encodeURIComponent(
          `PUBLIC_CANISTER_ID:${BACKEND_CANISTER}=${canisterId}&ic_root_key=${networkStatus.root_key}`,
        )}; SameSite=Lax;`,
      },
      proxy: {
        '/api': { target: networkStatus.api_url, changeOrigin: true },
      },
    },
  };
});
