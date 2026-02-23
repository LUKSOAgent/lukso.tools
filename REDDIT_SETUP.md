# Reddit-lezen en -posten voor OpenClaw

Je bot kan Reddit gebruiken via de **mcporter**-skill en de **reddit-mcp-server**. Volg deze stappen.

## 1. Reddit-app aanmaken

### Responsible Builder Policy (eerste keer)

Als je naar de app-pagina gaat, kan Reddit je eerst naar de **Responsible Builder Policy** sturen:  
https://support.reddithelp.com/hc/en-us/articles/42728983564564-Responsible-Builder-Policy

- **Dat is normaal.** Reddit vraagt nu dat je hun beleid voor API-gebruik leest en accepteert.
- Lees de pagina, zoek de knop om **akkoord te gaan** of **door te gaan** (bijv. “I agree”, “Continue”, “Accept”).
- Na accepteren zou je doorgestuurd moeten worden naar de pagina waar je een app kunt aanmaken. Soms kom je daar door opnieuw naar **https://www.reddit.com/prefs/apps** te gaan (of **https://old.reddit.com/prefs/apps**).

Als je na accepteren nog steeds geen “Create app” ziet, probeer dan **old.reddit.com** (klassieke interface):  
**https://old.reddit.com/prefs/apps** — daar staat vaak nog de oude “create application” / “Create another app”-flow.

### App aanmaken

1. Ga naar **https://www.reddit.com/prefs/apps** (of **https://old.reddit.com/prefs/apps** als de nieuwe site blijft doorverwijzen).
2. Klik op **“Create app”** of **“Create another app”**.
3. Vul in:
   - **Name:** bijv. `OpenClaw Bot`
   - **Type:** kies **“script”** (voor één account, jouw account).
   - **Description:** optioneel.
   - **Redirect URI:** `http://localhost:8080` (mag leeg of deze waarde).
4. Klik **Create app**.
5. Noteer:
   - **Client ID** (onder de appnaam, korte string).
   - **Secret** (geheim wachtwoord van de app).

## 2. mcporter-skill installeren

Zodat de bot MCP-servers (zoals Reddit) kan aanroepen:

```bash
npx playbooks add skill openclaw/openclaw --skill mcporter
```

Zorg dat de **mcporter** CLI beschikbaar is (de skill kan deze ook installeren).

## 3. Gegevens in environment zetten

Zet je Reddit-gegevens in **`~/.openclaw/.env`** (aanmaken als het bestand nog niet bestaat):

```bash
# Reddit (voor lezen + posten)
REDDIT_CLIENT_ID=jouw_client_id
REDDIT_CLIENT_SECRET=jouw_client_secret
REDDIT_USERNAME=jouw_reddit_gebruikersnaam
REDDIT_PASSWORD=jouw_reddit_wachtwoord
REDDIT_USER_AGENT=openclaw-bot:1.0 (by /u/jouw_reddit_gebruikersnaam)
```

- Vervang `jouw_client_id`, `jouw_client_secret`, `jouw_reddit_gebruikersnaam`, `jouw_reddit_wachtwoord` en in de user agent `jouw_reddit_gebruikersnaam` door je echte waarden.
- **Let op:** als je account 2FA heeft, werkt username/password-login niet; dan moet je OAuth met een browser-flow gebruiken (reddit-mcp-server ondersteunt dat indien geïmplementeerd).

## 4. User agent in config (optioneel)

In **`workspace/config/mcporter.json`** staat al een Reddit MCP-server. Als je `REDDIT_USER_AGENT` in `.env` zet, hoeft hier niets meer. Anders kun je in `mcporter.json` bij de `reddit`-server in `env` de waarde van `REDDIT_USER_AGENT` aanpassen (vervang `YOUR_REDDIT_USERNAME` door je Reddit-gebruikersnaam).

## 5. Gateway herstarten

Na het aanpassen van `.env`:

```bash
openclaw gateway restart
# of als je clawdbot gebruikt:
clawdbot gateway restart
```

## Wat de bot kan doen

Via de Reddit MCP-server kan de bot o.a.:

- **Lezen:** posts zoeken, post-details, subreddit-info, hot/trending, comments, user posts/comments.
- **Posten:** nieuwe post in een subreddit, reply op post of comment, bewerken/verwijderen van eigen posts en comments.

De bot gebruikt hiervoor de mcporter-tools (bijv. `mcporter call reddit.search_reddit ...`). Safe mode staat op `standard` om spam te beperken.

## Problemen?

- **Responsible Builder Policy / geen “Create app”:** Zie de sectie hierboven. Probeer na accepteren expliciet **https://old.reddit.com/prefs/apps**. Als je helemaal geen app kunt aanmaken, kun je API-toegang vragen via: https://reddithelp.com/hc/en-us/requests/new (kies het formulier voor Data API / developer access).
- **Rate limits:** Reddit beperkt het aantal requests; bij veel acties even wachten.
- **2FA:** met 2FA moet je mogelijk OAuth in de browser doen; controleer de documentatie van `reddit-mcp-server`.
- **Logs:** `openclaw gateway logs` of `clawdbot gateway logs` om fouten te zien.
