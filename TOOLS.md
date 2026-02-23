# TOOLS.md - Tool Configs & Local Notes

## Credentials (SOPS/Age)
```bash
sops --decrypt .credentials    # View
sops --edit .credentials       # Edit (auto-encrypt on save)
```
Key: `~/.config/sops/age/keys.txt` | Config: `.sops.yaml`

## LUKSO Envio Indexer
**Endpoint:** `https://envio.lukso-mainnet.universal.tech/v1/graphql`
```bash
# Resolve username → UP address
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"query": "query { Profile(where: {name: {_eq: \"USERNAME\"}}) { id name } }"}' \
  https://envio.lukso-mainnet.universal.tech/v1/graphql
```

## Twitter Formatting
- **X Premium active** — long-form tweets supported (up to ~25k chars). Never split into threads when a single long tweet will do.
- Double line breaks between paragraphs (single gets stripped)
- Bullet points: • or 🔹
- Min 10-15 min between tweets, ideally 30+

## Camofox Browser
```bash
curl -s http://localhost:9377/health   # health check
openclaw camofox status|start|configure
```

## AGENTPO Token
- **Contract:** `0x47568BC4DC7Fee1bB67f741BA927e2904B61f016` (LSP7, LUKSO)
- **Supply:** 800k (400k mine, 400k Jordy) | Pool on Universal Swaps

## Bankr / Polymarket Trader
- **Config:** `skills/bankr/config.json`
- **Active bot:** `skills/bankr/fastmarket_clob.py` (v5, $15/trade)
- **Logs:** `fastmarket_clob.log`, `fastmarket_pnl.jsonl`, `fastmarket_outcomes.jsonl`
- **Watchdog:** `fastmarket_watchdog.sh` (crontab, every minute)
- **Resolution checker:** `resolution_checker.py` (cron every 30 min)
- **Network:** Polygon
