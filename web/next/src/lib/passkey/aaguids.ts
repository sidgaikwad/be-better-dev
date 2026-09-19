// An AAGUID identifies an authenticator *model*, not a device and not a user, and is present only in
// the registration response. It is the only thing we can turn into a human label like "1Password"
// instead of a raw credential id.
//
// The list is small on purpose and is not authoritative. Privacy-preserving platforms report an
// all-zero AAGUID that matches nothing here, and Apple devices zero it under the default
// attestation: "none" flow we use, so "Passkey" is the common case rather than the exception.
// Full coverage: https://github.com/passkeydeveloper/passkey-authenticator-aaguids
//
// Mirrors @better-auth/passkey's own map, which lives in its server entry. Duplicated rather than
// imported because that entry pulls @simplewebauthn/server, which has no business in a browser bundle.
const AUTHENTICATOR_NAMES: Record<string, string> = {
  "08987058-cadc-4b81-b6e1-30de50dcbe96": "Windows Hello",
  "0ea242b4-43c4-4a1b-8b17-dd6d0b6baec6": "Keeper",
  "50726f74-6f6e-5061-7373-50726f746f6e": "Proton Pass",
  "531126d6-e717-415c-9320-3d9aa6981239": "Dashlane",
  "53414d53-554e-4700-0000-000000000000": "Samsung Pass",
  "6028b017-b1d4-4c02-b4b3-afcdafc96bb2": "Windows Hello",
  "9ddd1817-af5a-4672-a2b9-3e3dd95000a9": "Windows Hello",
  "b78a0a55-6ef8-d246-a042-ba0f6d55050c": "LastPass",
  "b84e4048-15dc-4dd0-8640-f4f60813c8af": "NordPass",
  "bada5566-a7aa-401f-bd96-45619a55120d": "1Password",
  "d548826e-79b4-db40-a3d8-11116f7e8349": "Bitwarden",
  "dd4ec289-e01d-41c9-bb89-70fa845d4bf2": "iCloud Keychain (Managed)",
  "ea9b8d66-4d01-1d21-3ce4-b6b48cb575d4": "Google Password Manager",
  "fbfc3007-154e-4ecc-8c0b-6e020557d7bd": "Apple Passwords",
}

/** A display label for a passkey: the user's own name if set, else the authenticator model, else "Passkey". */
export function passkeyLabel(name?: string | null, aaguid?: string | null): string {
  if (name) return name
  if (aaguid && AUTHENTICATOR_NAMES[aaguid]) return AUTHENTICATOR_NAMES[aaguid]
  return "Passkey"
}
