# Stappenplan — resterende taken Soepfabriek app

Alles wat nog open staat na de laatste backend-audit, in volgorde van prioriteit.

**Base URL:** `https://x8ki-letl-twmt.n7.xano.io`

---

# Deel A — Xano (backend)

---

## A1. `PATCH /sales_order/{order_id}` toevoegen

**Waarom:** Order bewerken (`/orders/:id/edit`) faalt nu met **404**.

**Frontend stuurt (via `toXanoOrderUpdate`):**

| JSON veld | Bron in app |
|-----------|-------------|
| `order_number` | optioneel |
| `organization` | organisatie-id |
| `contact_person` | contact-id |
| `order_date` | datum |
| `delivery_date` | datum |
| `status` | Xano enum: `Concept`, `Bevestigd`, `In behandeling`, `Gereed`, `Geannuleerd` |
| `notes` | opmerkingen |

### Stappen

1. Xano → **API** → groep **Orders** (`3YeASv8x`)
2. **Add API endpoint**
   - Method: **PATCH**
   - Path: `sales_order/{order_id}`
   - Authentication: **Required** (Bearer)
3. **Input**
   - Path: `order_id` (integer)
   - Body (alle optioneel behalve wat je wilt afdwingen):
     - `order_number`, `organization`, `contact_person`, `order_date`, `delivery_date`, `status`, `notes`
4. **Function stack**
   - **Get record** — `sales_orders` where `id` = `order_id`
   - **Conditional** — if not found → return **404**
   - *(Optioneel)* **Validate** — contact belongs to organization (server-side briefing)
   - **Edit record** — update only provided fields
   - **Return** — updated order record (incl. `total_amount` if column exists)
5. **Publish**
6. **Test** (Postman of Run & debug):
   ```http
   PATCH /api:3YeASv8x/sales_order/1
   Authorization: Bearer <token>
   Content-Type: application/json

   { "status": "Bevestigd" }
   ```
7. **App-test:** `/orders/1/edit` → status wijzigen → **Opslaan** → geen fout

---

## A2. `total_amount` — GET tonen + herberekenen

**Waarom:** Kolom bestaat; orders-overzicht toont **—** als GET het veld niet teruggeeft of waarde leeg is.

### A2a. Zorg dat GET orders `total_amount` retourneert

1. Open **`GET /sales_orders`**
2. Controleer query/output — veld **`total_amount`** mag niet worden weggelaten
3. Herhaal voor **`GET /sales_order/{order_id}`**
4. Test met token:
   ```http
   GET /api:3YeASv8x/sales_orders
   Authorization: Bearer <token>
   ```
   Verwacht in `items[]`: `"total_amount": 15`

### A2b. Functie `recalculate_order_total`

1. **Logic** → **Add function** → `recalculate_order_total`
2. **Input:** `order_id` (integer)
3. **Stack:**
   1. **Query records** — `sales_order_lines` where `order` = `order_id`
   2. **Variable** `total` = `0`
   3. **For each** line → `total` = `total + (quantity * unit_price)` *(of `+ amount`)*
   4. **Edit record** — `sales_orders` where `id` = `order_id` → set `total_amount` = `total`
   5. **Return** updated order
4. **Run & debug** met een order die regels heeft

### A2c. Roep recalc aan na nieuwe regel

1. Open **Lines** → **`POST /sales_order_line`**
2. Na **Create record** → **Function** → `recalculate_order_total(order_id)`  
   - `order_id` = `order` uit request body
3. Save & publish
4. Test: nieuwe regel toevoegen → parent order `total_amount` stijgt in database

### A2d. Backfill bestaande orders

**Optie 1 — handmatig:** Database → order rij → `total_amount` = som van regels

**Optie 2 — functie `backfill_all_order_totals`:**
1. Query all `sales_orders`
2. For each → call `recalculate_order_total(id)`
3. Run once

### A2e. App-test

- **`/orders`** → kolom **Totaal** toont bedrag
- Organisatiedetail → orders tonen totaal

---

## A3. Fix `GET /articles/active`

**Waarom:** Geeft nog **400**. App heeft fallback, maar endpoint moet kloppen voor briefing.

### Stappen

1. **API** → **Articles** (`rl8ZfRw1`) → **`GET articles/active`**
2. Vervang lege/kapotte stack door:
   - **Query all records** — table `articles`
   - **Filter:** `availability` **equals** `true`  
     *(optioneel OR: `status` equals `published`)*
3. **Return** zelfde paginated formaat als `GET /articles` (`items` array)
4. **Tip:** Kopieer de hele stack van `GET /articles` en voeg alleen het filter toe
5. Test:
   ```http
   GET /api:rl8ZfRw1/articles/active
   Authorization: Bearer <token>
   ```
   Verwacht: **200** + alleen actieve artikelen
6. App: **Nieuwe order** → dropdown laadt via `/articles/active`

---

## A4. Auth op open article GET-endpoints (optioneel, briefing)

**Nog open in OpenAPI:**
- `GET /articles`
- `GET /articles/active`
- `GET /articles/{article_id}`

### Stappen (per endpoint)

1. Open endpoint in Xano
2. **Settings** → **Authentication** → **Require authentication**
3. Save & publish
4. Test zonder token → **401**
5. Test in app (ingelogd) → werkt nog normaal

*Frontend stuurt al Bearer token mee — geen codewijziging nodig.*

---

## A5. Server-side validatie (optioneel, briefing)

Voeg toe in Xano waar mogelijk:

| Regel | Waar |
|-------|------|
| Contact hoort bij organisatie op order | POST/PATCH `sales_order` |
| Min. 1 orderregel | POST `sales_order` of aparte check |
| Leverdatum ≥ orderdatum | POST/PATCH order |
| Uniek e-mail bij signup | Auth signup |
| Verplichte velden | Create endpoints |

---

# Deel B — Frontend verificatie (geen code nodig tenzij iets faalt)

Checklist na Xano-wijzigingen:

- [ ] `npm run dev` — app start
- [ ] Registreren / inloggen / refresh blijft ingelogd
- [ ] Organisatie + contact + artikel (met stock) aanmaken
- [ ] Order met regels → totaal op lijst + detail
- [ ] Order bewerken (status → Bevestigd)
- [ ] Uitloggen → geen toegang tot pagina's

---

# Deel C — Git & GitHub

## C1. Eerste commit

In PowerShell, projectmap:

```powershell
cd C:\Users\Gebruiker\Projects\soepfabriek-app

git add .
git status
git commit -m "Soepfabriek verkoopapp: React frontend gekoppeld aan Xano"
```

**Niet committen:** `.env` (staat in `.gitignore` — controleer met `git status`)

## C2. GitHub repository

1. Maak repo op GitHub (bijv. `soepfabriek-app`)
2. Koppel remote:
   ```powershell
   git remote add origin https://github.com/JOUW-GEBRUIKERSNAAM/soepfabriek-app.git
   git branch -M main
   git push -u origin main
   ```
3. Zet URL in README onder oplevering

---

# Deel D — README reflectie invullen

Open `README.md` → sectie **Reflectie**. Vul eerlijk in (voorbeelden — pas aan):

### Tijdsbesteding
_Geschat: 14 uur_

### Volledig af
- Authenticatie (register, login, logout, protected routes)
- Organisaties, contactpersonen, artikelen, orders CRUD in frontend
- Orderregels + statusmapping NL ↔ Xano
- Koppeling met meerdere Xano API-groepen

### Gedeeltelijk af
- Server-side validatie in Xano
- `GET /articles/active` (fallback in frontend)

### Problemen opgelost
- Orderstatus `in_behandeling` vs `In behandeling` → mapper in `mappers.ts`
- Organisatiepagina crash op numerieke `created_at` → `formatDate()`
- Totaal op orders-lijst → `total_amount` in Xano

### AI-gebruik
- **Geholpen bij:** projectstructuur, API mapping, Xano-stappenplannen, presentatiegids
- **Aangepast:** meerdere API-groepen i.p.v. één slug; status enum; zelf getest in DevTools

### Verbeteringen met meer tijd
- PATCH order earlier in Xano; deployed frontend; delete orderregels

---

# Deel E — Oplevering checklist

- [x] Lokale startinstructies (README)
- [ ] GitHub URL in README
- [ ] Xano: assessor toegang **of** screenshots (datamodel + API groups + auth settings)
- [ ] Reflectie ingevuld
- [ ] OpenAPI link in README (zonder token in publieke repo — gebruik workspace link zonder `token=`)

**Screenshots Xano (minimaal):**
1. Database — alle 6 tabellen + relaties
2. API group overzicht
3. Auth endpoint + één beveiligd CRUD endpoint (401 demo)
4. `recalculate_order_total` functie (optioneel)

---

# Deel F — Presentatie oefenen (~20 min)

Volledige demo-script: **`docs/presentatie-gids.md`**

### Korte oefenvolgorde

1. Register → login → F5 (sessie)
2. DevTools → `soepfabriek_auth_token` + Bearer header
3. Incognito → API URL zonder token → **401**
4. Org → contact → artikel → order met 2 regels
5. Leg uit: totaal Xano vs regelbedragen; contact filter op org
6. Vertel 1 bug (status enum) + AI-gebruik

---

# Master checklist (alles)

## Xano
- [ ] A1 — PATCH `sales_order/{order_id}`
- [ ] A2a — GET orders retourneert `total_amount`
- [ ] A2b — functie `recalculate_order_total`
- [ ] A2c — recalc na POST orderregel
- [ ] A2d — backfill bestaande orders
- [ ] A3 — `GET /articles/active` → 200
- [ ] A4 — auth op article GETs *(optioneel)*
- [ ] A5 — server-side validatie *(optioneel)*

## App
- [ ] Deel B — end-to-end test

## Oplevering
- [ ] C — git commit + GitHub push
- [ ] D — README reflectie
- [ ] E — screenshots / Xano toegang
- [ ] F — presentatie geoefend

---

# Geschatte tijd

| Deel | Tijd |
|------|------|
| A1 PATCH order | 20–30 min |
| A2 total_amount | 30–45 min |
| A3 articles/active | 15 min |
| A4 auth article GETs | 10 min |
| C GitHub | 15 min |
| D README | 30 min |
| F Presentatie oefenen | 30 min |
| **Totaal** | **~3 uur** |
