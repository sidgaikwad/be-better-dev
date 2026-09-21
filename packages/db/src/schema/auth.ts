import { relations } from "drizzle-orm"
import { boolean, index, integer, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core"

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  role: text("role").default("user"),
  roleSetAt: timestamp("role_set_at"),
  // Owned by the two-factor plugin, which declares it `input: false`: it flips only through
  // /two-factor/enable and /two-factor/disable, never from a user-supplied field. Mirrors
  // emailVerified's shape rather than the plugin's `required: false`, because a null here would
  // read as "unknown" at exactly the moment the gate has to decide, and the default covers every
  // insert the adapter makes.
  twoFactorEnabled: boolean("two_factor_enabled").default(false).notNull(),
  banned: boolean("banned"),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
})

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    activeOrganizationId: text("active_organization_id"),
    activeTeamId: text("active_team_id"),
    impersonatedBy: text("impersonated_by"),
    // How this session authenticated: "github", "google", "passkey", later "sso". Better Auth has
    // no equivalent of an OIDC `amr` claim, and the question a gate has to answer is about THIS
    // session, not about which identities the account has linked: once an SSO account is linked
    // its provider row is permanent, so asking the account would let a later magic-link login
    // wear the SSO exemption. Nullable, and null means unknown, which every gate must read as the
    // non-exempt path. Nothing writes it yet; the session hook lands with the plugin.
    signInMethod: text("sign_in_method"),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
)

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
)

export const passkey = pgTable(
  "passkey",
  {
    id: text("id").primaryKey(),
    name: text("name"),
    publicKey: text("public_key").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // Unique, not merely indexed: Better Auth resolves the signing user by this column at sign-in,
    // and a WebAuthn credential id is globally unique by construction, so a duplicate row would
    // make that lookup ambiguous. Mirrors session.token.
    credentialID: text("credential_id").notNull(),
    counter: integer("counter").notNull(),
    deviceType: text("device_type").notNull(),
    backedUp: boolean("backed_up").notNull(),
    transports: text("transports"),
    aaguid: text("aaguid"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("passkey_userId_idx").on(table.userId),
    uniqueIndex("passkey_credentialId_uidx").on(table.credentialID),
  ],
)

// Credential material, exactly like passkey.public_key. Better Auth marks both columns
// `returned: false` so its own endpoints never serialise them; nothing here may either. No console
// read surface, no logging, and no inclusion in an admin user dump.
export const twoFactor = pgTable(
  "two_factor",
  {
    id: text("id").primaryKey(),
    // The TOTP shared secret, encrypted with BETTER_AUTH_SECRET: the plugin runs it through
    // symmetricDecrypt on every verify, so this column never holds a usable secret on its own.
    secret: text("secret").notNull(),
    // The whole set, one encoded string, not a row per code. The plugin owns the encoding.
    backupCodes: text("backup_codes").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // False only while an enrolment is mid-ceremony. Defaults true because the plugin writes the
    // row verified unless skipVerificationOnEnable put it there early.
    verified: boolean("verified").default(true).notNull(),
    // The account-level lockout budget. The plugin increments it atomically on a failed sign-in
    // challenge and clears it on a success, so it counts consecutive failures rather than lifetime
    // ones, and caps guesses at a six-digit code. accountLockout defaults to 10 failures and a
    // 900s lock; without these two columns that cap silently does not exist.
    failedVerificationCount: integer("failed_verification_count").default(0).notNull(),
    // Set when the budget is spent, checked on every challenge, lazily cleared once it has passed.
    lockedUntil: timestamp("locked_until"),
    // Ours, not the plugin's. The settings screen has to say when a factor was enrolled, and a
    // reset in the console is worth dating. Defaulted, so the plugin's inserts stay valid.
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  // userId only. The plugin declares `index: true` on secret, but every lookup it makes is by id
  // (5) or userId (4) and none by secret, so that index would buy nothing and copy the secret into
  // a second place on disk.
  (table) => [index("twoFactor_userId_idx").on(table.userId)],
)

// One registered identity provider. Better Auth keeps this as a single flat table where carbon uses
// two (a connection plus its claimed domains), which is the one place their model is better: a row
// here holds exactly one `domain`, so "three verified domains and one pending" cannot be expressed.
// Live with it while registration is console-only and a handful of rows; revisit if this ever goes
// self-serve.
export const ssoProvider = pgTable(
  "sso_provider",
  {
    id: text("id").primaryKey(),
    // The IdP's own identifier, from its discovery document.
    issuer: text("issuer").notNull(),
    // Both are JSON serialised by the plugin, not columns we read. Exactly one is set per row, and
    // samlConfig stays null here because only OIDC is enabled: see the sso() options.
    oidcConfig: text("oidc_config"),
    samlConfig: text("saml_config"),
    // Who registered it, and nothing more. set null rather than cascade, deliberately: deleting the
    // admin who set up SSO must not delete the connection and lock out everyone on that domain.
    // The row outlives the reference, so the column is provenance, which is the same call
    // console.ts makes for actor_id. No index: nothing queries by it and the table is tiny.
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    // Unique because the plugin resolves a provider by this at callback time, and a duplicate would
    // make that lookup ambiguous. Same reasoning as passkey.credential_id.
    providerId: text("provider_id").notNull(),
    // The organization plugin is registered but has almost no UI, so organizationProvisioning stays
    // disabled and this stays null. The column exists because the plugin declares it.
    organizationId: text("organization_id"),
    // The email domain this provider answers for. The sign-in lookup drives off it, hence the index.
    domain: text("domain").notNull(),
    // Present only because domainVerification is enabled. A provider routes nothing until this is
    // true, so a registered-but-unproven domain is inert.
    domainVerified: boolean("domain_verified").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("ssoProvider_providerId_uidx").on(table.providerId),
    index("ssoProvider_domain_idx").on(table.domain),
  ],
)

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
)

export const organization = pgTable(
  "organization",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    logo: text("logo"),
    createdAt: timestamp("created_at").notNull(),
    metadata: text("metadata"),
  },
  (table) => [uniqueIndex("organization_slug_uidx").on(table.slug)],
)

export const team = pgTable(
  "team",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    // Denormalised, and the plugin owns it: it increments and re-syncs this rather than counting
    // team_member on read. `input: false` upstream, so nothing but the plugin writes it. Added in
    // better-auth 1.7; without it the adapter logs a Drizzle schema mismatch at startup.
    memberCount: integer("member_count").default(0).notNull(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => /* @__PURE__ */ new Date()),
  },
  (table) => [index("team_organizationId_idx").on(table.organizationId)],
)

export const teamMember = pgTable(
  "team_member",
  {
    id: text("id").primaryKey(),
    teamId: text("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // The plugin's idempotency key for adding someone to a team: it looks a membership up by this
    // first and falls back to the (teamId, userId) pair, so a retried add finds the existing row
    // instead of inserting a second. Unique for that to mean anything, and nullable because every
    // row written before 1.7 has none.
    membershipKey: text("membership_key"),
    createdAt: timestamp("created_at"),
  },
  (table) => [
    index("teamMember_teamId_idx").on(table.teamId),
    index("teamMember_userId_idx").on(table.userId),
    uniqueIndex("teamMember_membershipKey_uidx").on(table.membershipKey),
  ],
)

export const member = pgTable(
  "member",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role").default("member").notNull(),
    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [
    index("member_organizationId_idx").on(table.organizationId),
    index("member_userId_idx").on(table.userId),
  ],
)

export const invitation = pgTable(
  "invitation",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role"),
    teamId: text("team_id"),
    status: text("status").default("pending").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    inviterId: text("inviter_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("invitation_organizationId_idx").on(table.organizationId),
    index("invitation_email_idx").on(table.email),
  ],
)

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  passkeys: many(passkey),
  twoFactors: many(twoFactor),
  teamMembers: many(teamMember),
  members: many(member),
  invitations: many(invitation),
}))

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}))

export const passkeyRelations = relations(passkey, ({ one }) => ({
  user: one(user, {
    fields: [passkey.userId],
    references: [user.id],
  }),
}))

export const ssoProviderRelations = relations(ssoProvider, ({ one }) => ({
  user: one(user, {
    fields: [ssoProvider.userId],
    references: [user.id],
  }),
}))

export const twoFactorRelations = relations(twoFactor, ({ one }) => ({
  user: one(user, {
    fields: [twoFactor.userId],
    references: [user.id],
  }),
}))

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}))

export const organizationRelations = relations(organization, ({ many }) => ({
  teams: many(team),
  members: many(member),
  invitations: many(invitation),
}))

export const teamRelations = relations(team, ({ one, many }) => ({
  organization: one(organization, {
    fields: [team.organizationId],
    references: [organization.id],
  }),
  teamMembers: many(teamMember),
}))

export const teamMemberRelations = relations(teamMember, ({ one }) => ({
  team: one(team, {
    fields: [teamMember.teamId],
    references: [team.id],
  }),
  user: one(user, {
    fields: [teamMember.userId],
    references: [user.id],
  }),
}))

export const memberRelations = relations(member, ({ one }) => ({
  organization: one(organization, {
    fields: [member.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [member.userId],
    references: [user.id],
  }),
}))

export const invitationRelations = relations(invitation, ({ one }) => ({
  organization: one(organization, {
    fields: [invitation.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [invitation.inviterId],
    references: [user.id],
  }),
}))
