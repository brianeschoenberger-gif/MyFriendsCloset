# Hosted stylist preparation (not part of the public app)

This directory contains a server-side proof of concept. Nothing in it is registered as a route, deployed, connected to GitHub Pages, or provisioned with credentials. Unit tests use in-process fake accounts and fake model transport. The public app still uses local matching and a user-managed ChatGPT handoff.

## Implemented boundary

1. Verify a session using a trusted auth adapter. Accept a styling request only if the account's stored consent and this request use the supported metadata-consent version.
2. Query the verified owner's wardrobe metadata. Check the owner again in the handler. Pass only the occasion controls and garment names, categories and colors, linked with temporary codes. The model does not receive photos, owner or garment IDs, private notes, contact details, storage URLs or credentials.
3. Reserve an account request allowance before invoking the model. The optional OpenAI provider uses Structured Outputs, a fixed API host, no tools, no retries, a timeout and an output budget.
4. Independently validate every suggested code and outfit shape, enforce the anchor, then map back to the authorized clothes. Use a generic fallback when the model is unavailable, refuses or sends unusable output. No handler logs contain wardrobe data.

The provider sets `store: false` for response storage; this does not imply zero provider retention. Review the current data controls and give users accurate notice before any real inference.

See the separate [owner-only database rehearsal](db/README.md).

## Must be verified before exposure

- Choose an approved private hosting account and model connection. Keep keys in server secrets only. A GitHub Pages bundle must not contain server code, an API key or a configured endpoint.
- Wire session verification using verified issuer, audience, expiry, and trusted session revocation. Store consent by account and support revocation. Reject oversized requests before parsing; forbid cross-origin calls and require CSRF protections if using cookie sessions.
- Verify owner-only database policies with two accounts and a signed-out session, including direct REST and image access. Do not use unrestricted service-role reads for user-facing closet operations. Keep this endpoint metadata-only.
- Use an atomic, per-account and global budget with limits on concurrency and spend. Verify revocation and consent are still valid when reserving a request. Propagate overload/failure as the local-matcher fallback; do not auto-retry.
- Evaluate with synthetic wardrobes first, then opt-in pilot participants. Compare with the existing local matcher before shipping; a model response that passed validation is not proof that someone would wear it.

References: [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs), [production API key guidance](https://developers.openai.com/api/docs/guides/production-best-practices), [data controls](https://developers.openai.com/api/docs/guides/your-data).
