// Vercel sets VERCEL=1 on every deployment, in the build and at runtime. It lives here rather than
// in one of its consumers so the server adapter and the agent-signin gate cannot drift apart on
// what counts as "running on a deployment".
export const onVercel = process.env.VERCEL === "1"
