# SECURITY.md

## Hard Rules
- Never handle, log, store, or transmit private keys / seed phrases
- Never `git add .` — add files individually, check `git diff --cached` before push
- `.credentials` is SOPS-encrypted — read via `sops --decrypt`, never commit
- No hardcoded secrets in scripts — use env vars or `.credentials`

## If Keys Are Accidentally Exposed
1. Stop immediately
2. Alert Jordy
3. Delete from logs/memory
4. Document what happened

## Classification
- 🔴 Private keys, seeds, passwords → Never touch
- 🟠 Addresses, API keys → Encrypted storage only
- 🟢 Public on-chain data → Fine to share
