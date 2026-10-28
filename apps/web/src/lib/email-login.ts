/**
 * Email/password accounts stay off until the app can send email: there's no
 * password reset (a forgotten password locks the account) and no address
 * verification (anyone can register someone else's email). With this unset,
 * the `credentials` provider isn't registered — so the login card hides the
 * Log in / Sign up buttons, the same way it hides unconfigured OAuth providers
 * — and /api/auth/register and /api/auth/login-check 404. Set
 * ENABLE_EMAIL_LOGIN=true to turn it back on (e.g. locally).
 */
export function isEmailLoginEnabled(): boolean {
  return process.env.ENABLE_EMAIL_LOGIN === "true";
}
