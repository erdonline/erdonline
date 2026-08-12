/**
 * Emits frontend/config/routes.ts as JSON for scripts/check-routes.mjs.
 * Run: npx --yes tsx scripts/load-routes-for-check.ts
 */
import routes from '../frontend/config/routes.ts';

process.stdout.write(JSON.stringify(routes));
