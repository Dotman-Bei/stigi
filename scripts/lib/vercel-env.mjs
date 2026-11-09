export const REQUIRED_PRODUCTION_ENV = [
  "DATABASE_URL",
  "BETTER_AUTH_SECRET",
  "CRON_SECRET",
  "OPENROUTER_API_KEY",
  "AGENT_ENGINE",
  "AGENT_MODEL",
  "AGENT_ENGINE_PREFER_BYO_KEY",
  "AUTH_REQUIRE_EMAIL_VERIFICATION",
  "STIGI_DAILY_AGENT_TURNS",
  "AGENT_NATIVE_RELEASE_MIGRATIONS",
];
export const PROBE_FLAG = "STIGI_ENABLE_PROBE";
export const FORBIDDEN_PRODUCTION_ENV = ["AUTH_DISABLED"];

/** Names from `vercel env ls` output; values are shown as "Encrypted" and are never parsed. */
export function parseEnvNames(stdout) {
  const names = new Set();
  for (const line of String(stdout).split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z][A-Z0-9_]{2,})\s{2,}\S/);
    if (match && match[1]) names.add(match[1]);
  }
  return names;
}

export function checkEnvNames(names, { allowProbe = false, requireProbe = false } = {}) {
  const problems = [];
  for (const name of REQUIRED_PRODUCTION_ENV) {
    if (!names.has(name)) problems.push(`missing ${name}`);
  }
  for (const name of FORBIDDEN_PRODUCTION_ENV) {
    if (names.has(name)) problems.push(`forbidden ${name} (sign-in must stay required)`);
  }
  if (!allowProbe && names.has(PROBE_FLAG)) problems.push(`${PROBE_FLAG} must be removed after the probe check`);
  if (requireProbe && !names.has(PROBE_FLAG)) problems.push(`missing ${PROBE_FLAG} (set it for the skeleton probe step)`);
  return problems;
}
