/**
 * Product version — single source of truth: `frontend/package.json` → `"version"`.
 * Do not hard-code V5.x in layouts/landing; bump package.json on release.
 */
import pkg from '../../package.json';

export const APP_VERSION: string = pkg.version;
/** Watermark / chrome label, e.g. `V5.0.0` */
export const APP_VERSION_LABEL = `V${APP_VERSION}`;
