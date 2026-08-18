# Soepfabriek — Verkoopapplicatie

Frontend voor de Soepfabriek mini-app (proeve van bekwaamheid). React + Vite, gekoppeld aan Xano.

**Broncode:** [github.com/M-Aliwi/Intake-opdracht](https://github.com/M-Aliwi/Intake-opdracht)

## Frontendtechniek

- **Stack:** React 19, TypeScript, Vite, React Router
- **Waarom:** snelle setup, componenten voor CRUD-formulieren, duidelijke structuur voor het vervolggesprek

## Starten

```bash
npm install
cp .env.example .env
npm run dev
```

Open de URL die Vite toont (meestal `http://localhost:5173`).

## Xano API-groepen

| `.env` variabele | Standaard slug | Doel |
|------------------|----------------|------|
| `VITE_XANO_AUTH_API` | `fZ6YL3Gi` | Login, signup, `/auth/me` |
| `VITE_XANO_ORGANISATIONS_API` | `organisations` | Organisaties |
| `VITE_XANO_CONTACTS_API` | `mvWpTZBG` | Contactpersonen |
| `VITE_XANO_ARTICLES_API` | `rl8ZfRw1` | Artikelen |
| `VITE_XANO_ORDERS_API` | `3YeASv8x` | Verkooporders |
| `VITE_XANO_LINES_API` | `lines` | Orderregels |

## Datamodel (Xano)

Tabellen volgens briefing:

| Tabel | Belangrijkste velden |
|-------|----------------------|
| **Users** | naam, e-mail, wachtwoord (Xano auth), created_at |
| **Organisations** | name, address, postcode, city, email, phone_number |
| **Contact persons** | first_name, last_name, function, email, phone_number, organization_id |
| **Articles** | article_number, article_name, description, sales_price, stock, availability/status |
| **Sales orders** | order_number, organization, contact_person, order_date, delivery_date, status, notes, total_amount |
| **Sales order lines** | order, article, quantity, unit_price, amount (regelbedrag) |

### Relaties

- Organisatie → meerdere contactpersonen
- Organisatie → meerdere verkooporders
- Contactpersoon → één organisatie
- Verkooporder → één organisatie + één contactpersoon (van die organisatie)
- Verkooporder → meerdere orderregels
- Orderregel → één artikel

De frontend filtert contactpersonen op organisatie bij orders. Xano moet de relatie ook server-side valideren.

## API-endpoints (Xano)

Base URL: `https://x8ki-letl-twmt.n7.xano.io`

| Groep | Method | Pad | Gebruik in app |
|-------|--------|-----|----------------|
| Auth | POST | `/api:fZ6YL3Gi/auth/signup` | Registreren |
| Auth | POST | `/api:fZ6YL3Gi/auth/login` | Inloggen |
| Auth | GET | `/api:fZ6YL3Gi/auth/me` | Sessie herstellen |
| Organisations | GET/POST | `/api:organisations/organisations` | Lijst / aanmaken |
| Organisations | GET/PATCH | `/api:organisations/organisation/{id}` | Detail / bewerken |
| Contacts | GET | `/api:mvWpTZBG/contact_persons?organisation_id=` | Contacten per org |
| Contacts | GET | `/api:mvWpTZBG/contact_person/{id}` | Contact laden *(auth)* |
| Contacts | POST | `/api:mvWpTZBG/contact_person` | Contact aanmaken |
| Contacts | PATCH | `/api:mvWpTZBG/contact_person/{id}` | Contact bewerken |
| Articles | GET | `/api:rl8ZfRw1/v1/articles/list` | Lijst *(auth)* |
| Articles | GET | `/api:rl8ZfRw1/v1/articles/active` | Actieve artikelen *(auth)* |
| Articles | POST | `/api:rl8ZfRw1/v1/articles/create` | Aanmaken *(auth)* |
| Articles | GET/PATCH/DELETE | `/api:rl8ZfRw1/v1/articles/id/{id}` | Detail / bewerken *(auth)* |
| Orders | GET/POST | `/api:3YeASv8x/sales_order(s)` | Lijst / aanmaken *(auth)* |
| Orders | GET/PATCH | `/api:3YeASv8x/sales_order/{id}` | Detail / bewerken *(auth)* |
| Lines | GET | `/api:lines/sales_order_lines?sales_order_id=` | Orderregels |
| Lines | POST | `/api:lines/sales_order_line` | Regel toevoegen |

OpenAPI workspace: `https://x8ki-letl-twmt.n7.xano.io/apispec:workspace:H9Zs_69j?type=json`

## Koppeling frontend ↔ Xano

- REST via `fetch` in `src/api/client.ts` — geen lokale mockdata
- Meerdere API-groepen via `.env` (zie tabel hierboven)
- Veldmapping in `src/api/mappers.ts`, o.a.:
  - `telephone` ↔ `phone_number`
  - `organisation_id` ↔ `organization_id` / `organization`
  - `name` ↔ `article_name`, `price` ↔ `sales_price`
  - orderstatus: UI-slug ↔ Xano enum (`in_behandeling` ↔ `In behandeling`)
  - regel: `article_id` ↔ `article`, `sales_order_id` ↔ `order`

## Authenticatie

| Onderdeel | Implementatie |
|-----------|---------------|
| Token opslag | `localStorage` onder sleutel `soepfabriek_auth_token` |
| API-aanroepen | Header `Authorization: Bearer <token>` in `src/api/client.ts` |
| Sessie na refresh | Bij laden: token aanwezig → `GET /auth/me` |
| Beveiligde pagina's | `ProtectedRoute` stuurt niet-ingelogde gebruikers naar `/login` |
| Uitloggen | Token verwijderen uit `localStorage` |
| Verlopen token | 401 → token gewist + duidelijke melding |

## Orderstatussen (briefing)

`concept` · `bevestigd` · `in_behandeling` · `gereed` · `geannuleerd`

De UI gebruikt slugs (`concept`, `in_behandeling`, …); naar Xano wordt gemapt naar de enum (`Concept`, `In behandeling`, …). Oudere Engelse waarden (`pending`, `confirmed`, …) worden bij lezen ook herkend.

## Orderbedragen

- **Regelbedrag:** `aantal × prijs per stuk` (per orderregel)
- **Totaal:** kolom `total_amount` op `sales_orders` in Xano (som van regelbedragen)
- **Frontend:** toont `total_amount` uit de API op overzichtspagina’s; detailpagina valt terug op som van regels als het veld nog leeg is (bijv. vóór herberekening in Xano)
- Zorg in Xano dat `total_amount` wordt bijgewerkt wanneer orderregels worden toegevoegd of gewijzigd

## Validatie

| Waar | Wat |
|------|-----|
| Frontend | Formulieren in `src/utils/validation.ts` — snelle UX-feedback |
| Xano | Verplichte velden, unieke e-mail, relatie-checks, server-side regels |

## Schermen

- Registratie / inloggen / uitloggen / dashboard
- Organisaties: overzicht, detail (contacten + orders), formulier
- Contactpersonen: formulier met functie + organisatie
- Artikelen: overzicht, formulier (incl. voorraad)
- Orders: overzicht + statusfilter, aanmaken, detail, **bewerken**

## Bekende beperkingen / Xano-acties

### Nog te doen

1. **`total_amount`** — kolom bestaat; verifieer dat GET orders het teruggeeft + herbereken na POST orderregel (OpenAPI documenteert het veld nog niet)
2. **`GET /contact_person/{contact_id}`** — ontbreekt weer (alleen PATCH); app valt terug op contactenlijst bij bewerken

### Afgerond (laatste backend-update)

- **`PATCH /sales_order/{order_id}`** — toegevoegd met auth + status enum (`Concept` … `Geannuleerd`)
- **Artikelen v1 API** — `/v1/articles/list|active|create|id/{id}`; frontend hierop aangesloten; alle routes vereisen auth
- Bearer auth op organisations, contacts, orders, order lines, articles v1
- **`stock`** op artikelen
- Oude paden `/articles`, `/articles/active` → **404** (vervangen door v1)

## Extra documentatie

| Bestand | Inhoud |
|---------|--------|
| `docs/oplevering-stappenplan.md` | **Alle resterende stappen** (Xano, git, README, presentatie) |
| `docs/presentatie-gids.md` | Demo-script vervolggesprek |

## Oplevering checklist

- [x] Frontend URL of lokale startinstructies (hierboven)
- [x] GitHub / broncode — https://github.com/M-Aliwi/Intake-opdracht
- [ ] Xano-toegang of screenshots datamodel + endpoints
- [x] Deze README ingevuld (onderstaande secties)

---

## Reflectie

### Tijdsbesteding

_Geschat: ___ uur_

### Volledig af

- Authenticatie: register, login, logout, protected routes, token in `localStorage`, sessie via `GET /auth/me`
- Organisaties, contactpersonen, artikelen en orders CRUD in de frontend
- Orderregels + Nederlandse statusmapping (`in_behandeling` ↔ `In behandeling`)
- Koppeling met meerdere Xano API-groepen via `.env`
- Order bewerken via `PATCH /sales_order/{id}`

### Gedeeltelijk af

- `total_amount` — frontend toont het veld; herberekening in Xano na een nieuwe orderregel is nog niet geverifieerd
- `GET /contact_person/{id}` — ontbreekt in Xano; de app valt terug op de contactenlijst
- `GET /v1/articles/active` — fallback naar de volledige lijst + filter
- Server-side validatie in Xano (contact bij organisatie, min. 1 regel)

### Niet af / vastgelopen

- Geen deployed frontend (alleen `npm run dev`)
- Geen Xano-screenshots of assessor-toegang in deze repo
- Volgende stap: in Xano `total_amount` teruggeven + herberekenen, en `GET /contact_person/{id}` opnieuw publiceren

### Problemen onderzocht en opgelost

- Orderstatus `in_behandeling` vs `In behandeling` — Network tab + OpenAPI + mapper in `mappers.ts`
- Organisatiepagina crashte op `created_at` als getal — `formatDate()` uitgebreid
- Xano heeft aparte API-groepen i.p.v. één slug — meerdere `VITE_XANO_*_API` variabelen
- Artikelen-API verhuisd naar `/v1/articles/...` — frontend daarop aangesloten

### AI-gebruik

- **Geholpen bij:** frontendstructuur (pages, API-laag, auth), veldmapping, Xano-stappenplan en presentatiegids
- **Aangepast/afgewezen:** één API-slug → meerdere Xano-groepen; Engelse statussen → Nederlandse enum; fallbacks waar endpoints ontbraken

### Verbeteringen met meer tijd

- Frontend deployen
- `total_amount` in Xano betrouwbaar herberekenen
- `GET /contact_person/{id}` herstellen
- Server-side validatie afdwingen
- Orderregels kunnen wijzigen of verwijderen
- Screenshots van datamodel, API-groepen en auth (401)
