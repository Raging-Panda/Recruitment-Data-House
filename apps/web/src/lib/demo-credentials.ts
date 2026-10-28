// The public demo login, shown prefilled on the login page. Kept apart from
// demo-mode.ts (which imports next/server) so the client login card can
// import it too, rather than holding its own copy that can drift.
// .example is reserved (RFC 2606), so this can never be a real mailbox.
export const DEMO_EMAIL = "demo@ipskill.example";
export const DEMO_PASSWORD = "view-demo";
