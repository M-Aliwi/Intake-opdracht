# Presentatiegids — Soepfabriek verkoopapp (~20 min)

Stap-voor-stap demo + wat je kunt zeggen tijdens het vervolggesprek.

**Voorbereiding (5 min van tevoren):**
- [ ] `npm run dev` draait → meestal `http://localhost:5173`
- [ ] Ingelogd testaccount klaar, of plan live registratie
- [ ] Minimaal 1 organisatie, 1 contact, 1 actief artikel (of maak live aan)
- [ ] Chrome/Edge DevTools open (F12)
- [ ] Xano auth op CRUD-endpoints aangezet (voor demo “zonder token”)
- [ ] Tabbladen: app + Xano dashboard (datamodel) optioneel

---

## 1. Register + login flow (~3 min)

### Registreren

1. Open **`http://localhost:5173/register`**
2. Vul in: naam, e-mail, wachtwoord (min. 8 tekens)
3. Klik **Registreren**
4. Je wordt doorgestuurd naar het **dashboard** (`/`)

**Wat je zegt:**
> “Nieuwe gebruikers registreren via Xano auth. Na signup krijg ik direct een token en ben ik ingelogd.”

### Uitloggen + opnieuw inloggen

5. Klik **Uitloggen** (in de navigatiebalk)
6. Je landt op **`/login`**
7. Log in met hetzelfde e-mailadres en wachtwoord
8. Dashboard verschijnt weer

**Wat je zegt:**
> “Uitloggen wist het token uit localStorage. Inloggen haalt een nieuw token op via `POST /auth/login`.”

### Sessie behouden (refresh)

9. Druk **F5** (pagina vernieuwen)
10. Je blijft ingelogd

**Wat je zegt:**
> “Bij laden leest de app het token uit localStorage en roept `GET /auth/me` aan om de sessie te herstellen.”

---

## 2. Token tonen in DevTools (~2 min)

1. Open **DevTools** (F12)
2. Tab **Application** (Chrome) of **Opslag** (Firefox)
3. Links: **Local Storage** → `http://localhost:5173`
4. Toon sleutel: **`soepfabriek_auth_token`**
5. Waarde = JWT / auth token van Xano

**Alternatief — Network tab:**

6. Tab **Network** → filter op **Fetch/XHR**
7. Vernieuw pagina of klik **Organisaties**
8. Klik een request naar Xano (bijv. `organisations`)
9. Tab **Headers** → **Request Headers** → **`Authorization: Bearer eyJ...`**

**Wat je zegt:**
> “Het token wordt opgeslagen onder `soepfabriek_auth_token`. Bij elke API-call stuurt `src/api/client.ts` de header `Authorization: Bearer <token>` mee.”

**Optioneel — code tonen (1 regel):**
- `src/utils/helpers.ts` → token opslag
- `src/api/client.ts` → Bearer header

---

## 3. Beveiligd endpoint zonder token → geweigerd (~2 min)

**Vereist:** Bearer auth aan op data-endpoints in Xano (organisations, contacts, orders, lines).

### Methode A — Incognito (makkelijkst)

1. Open **nieuw incognito/privévenster**
2. Plak in adresbalk (pas aan indien nodig):

```
https://x8ki-letl-twmt.n7.xano.io/api:organisations/organisations
```

3. **Geen** Authorization header → verwacht **`401 Unauthorized`**

### Methode B — DevTools zonder token

1. DevTools → **Application** → Local Storage
2. Verwijder **`soepfabriek_auth_token`**
3. In de app: ga naar **Organisaties**
4. App toont foutmelding / stuurt naar login (401 afhandeling)

### Methode C — curl (voor technische jury)

```powershell
Invoke-WebRequest -Uri "https://x8ki-letl-twmt.n7.xano.io/api:organisations/organisations" -UseBasicParsing
```

Verwacht: status **401** (na auth fix). Vóór fix was dit **200** — leg uit dat je auth hebt aangezet.

**Wat je zegt:**
> “Alleen ingelogde gebruikers mogen CRUD-data ophalen. Zonder geldig token weigert Xano de request. De frontend stuurt niet-ingelogde gebruikers naar `/login`.”

---

## 4. Org → contacts → order met regels + totalen (~5 min)

### Organisatie

1. **Organisaties** → **Nieuwe organisatie**
2. Vul naam (verplicht), optioneel adres/e-mail
3. **Opslaan** → organisatiedetail

**Wat je zegt:**
> “Data gaat via REST naar Xano API-groep `organisations`.”

### Contactpersonen

4. Op organisatiedetail → **Contact toevoegen**
5. Vul voornaam, achternaam, e-mail, functie
6. Organisatie staat al gekoppeld → **Opslaan**
7. Contact verschijnt in de lijst op de detailpagina

### Artikel (als nog geen actief artikel)

8. **Artikelen** → **Nieuw artikel**
9. Vul nummer, naam, prijs, voorraad, **Beschikbaar = Ja**
10. **Opslaan**

### Verkooporder

11. **Orders** → **Nieuwe order** (of via org-detail **Nieuwe order**)
12. **Stap 1:** kies **organisatie** (belangrijk — briefing)
13. **Stap 2:** contactpersonen-dropdown vult zich → kies contact
14. Vul orderdatum / leverdatum
15. **Orderregel:** kies actief artikel, aantal, prijs per stuk
16. Optioneel: tweede regel toevoegen
17. Toon **regelbedrag** en **totaal** onderaan het formulier
18. **Order opslaan**
19. Open order **detail** → regels + totaal zichtbaar
20. Ga naar **Orders** overzicht → kolom **Totaal** toont bedrag

**Wat je zegt:**
> “Een order hoort bij één organisatie en één contactpersoon. De order bestaat uit meerdere regels; elke regel koppelt een artikel met aantal en prijs.”

---

## 5. Uitleg: totaal in Xano vs regelbedragen (~2 min)

**Wat je zegt (voorbeeldscript):**

> “**Regelbedrag** bereken ik als `aantal × prijs per stuk`. Dat staat op elke orderregel in Xano (`amount` of afgeleid uit `quantity` en `unit_price`).
>
> Het **totaal van de order** sla ik op in `sales_orders.total_amount`. In Xano heb ik een functie `recalculate_order_total` die na het toevoegen van een regel alle regels optelt en het orderrecord bijwerkt.
>
> De **frontend** toont `total_amount` op het orders-overzicht. Op de detailpagina kan het totaal ook uit de regels worden berekend als fallback — maar Xano is de bron voor het overzicht.
>
> Zo scheid ik **regelniveau** (elke regel apart) van **orderniveau** (som voor rapportage en lijstweergave).”

**Optioneel tonen:**
- Xano database: `sales_order_lines` + `sales_orders.total_amount`
- Network: GET `/sales_orders` met `"total_amount": 15`

---

## 6. Uitleg: contact gefilterd op organisatie (~1 min)

**Live demo:**

1. **Nieuwe order** → kies **organisatie A**
2. Contactdropdown toont **alleen contacten van A**
3. Wissel naar **organisatie B** → contactlijst verandert; vorige selectie wordt gewist

**Wat je zegt:**

> “Bij het aanmaken van een order moet eerst een organisatie worden gekozen. Daarna roept de frontend `GET /contact_persons?organisation_id=…` aan. Zo kan de gebruiker geen contact van organisatie B koppelen aan een order van organisatie A. In Xano moet dezelfde relatie server-side gevalideerd worden.”

**Code (optioneel):**
- `OrderFormPage.tsx` → `listContactsForOrganisation(organisationId)`
- `src/api/contacts.ts` → query parameter

---

## 7. Eén bug + oplossing (~2 min)

Kies **één** verhaal dat je echt hebt meegemaakt. Voorbeelden uit dit project:

### Optie A — Orderstatus enum (aanbevolen)

**Probleem:**
> “Bij het bevestigen van een order kreeg ik: `Input 'in_behandeling' is not one of the allowable values`.”

**Onderzoek:**
> “Ik keek in Network tab naar de PATCH/POST body en vergeleek met de Xano OpenAPI spec. Xano verwacht `In behandeling` (hoofdletters, spatie), de frontend stuurde `in_behandeling`.”

**Oplossing:**
> “Ik heb in `mappers.ts` een mapping toegevoegd: UI-slugs ↔ Xano enum. Lezen en schrijven gaan nu via `normalizeOrderStatus` en `toXanoOrderStatus`.”

### Optie B — Organisatiespagina blank

**Probleem:** Pagina crashte na laden organisaties.  
**Oorzaak:** Xano stuurde `created_at` als getal; `formatDate()` riep `.slice()` aan op een number.  
**Fix:** `formatDate()` accepteert nu ook Unix timestamps.

### Optie C — Totaal niet op orders-lijst

**Probleem:** Kolom Totaal toonde `—`.  
**Oorzaak:** `GET /sales_orders` had geen `total_amount`.  
**Fix:** Kolom + recalc-functie in Xano; frontend leest veld uit API.

**Tip:** Wees eerlijk: “Ik zag de foutmelding → DevTools → spec → mapper fix.”

---

## 8. Waar je AI hebt gebruikt (~2 min)

Wees **eerlijk en concreet** (briefing vereist dit). Voorbeeld dat past bij dit project:

### Geholpen bij

- “Structuur React-app: pages, API-laag, auth context”
- “Xano field mapping (`phone_number` ↔ `telephone`, status enum)”
- “OpenAPI spec lezen en endpoints koppelen aan `.env` API-groepen”
- “Documentatie voor Xano-functies (`recalculate_order_total`, articles/active)”

### Aangepast / afgewezen

- “AI stelde één `VITE_XANO_DATA_API` voor; ik koos meerdere API-groepen omdat Xano aparte groups heeft”
- “AI-generated orderstatussen in het Engels; briefing vereist Nederlands — enum in Xano + mapper”
- “Ik controleerde alle gegenereerde code in DevTools en met `npm run build`”

**Wat je zegt:**

> “AI gebruikte ik als sparringpartner voor structuur en mapping. Ik heb zelf getest tegen mijn Xano-endpoints en dingen aangepast waar de spec afwijkte. Code die ik niet kan uitleggen heb ik niet overgenomen.”

---

## Tijdsverdeling (20 min totaal)

| Onderdeel | Min |
|-----------|-----|
| Register + login + refresh | 3 |
| Token in DevTools | 2 |
| Zonder token → 401 | 2 |
| Org → contact → order demo | 5 |
| Uitleg totaal vs regels | 2 |
| Uitleg contact filter | 1 |
| Bug story | 2 |
| AI-gebruik | 2 |
| Buffer / vragen jury | 3 |

---

## Snelle checklist vóór presentatie

- [ ] App draait lokaal
- [ ] Testdata of plan om live aan te maken
- [ ] Xano auth aan op CRUD
- [ ] `total_amount` werkt op orders-lijst
- [ ] Order bewerken werkt (PATCH in Xano)
- [ ] DevTools weten waar token staat
- [ ] Incognito-test voor 401 klaar
- [ ] Bug-verhaal geoefend (1 minuut)
- [ ] AI-verhaal geoefend (1 minuut)

---

## Handige URLs

| Doel | URL |
|------|-----|
| App login | `http://localhost:5173/login` |
| App register | `http://localhost:5173/register` |
| Xano orgs (test zonder token) | `https://x8ki-letl-twmt.n7.xano.io/api:organisations/organisations` |
| OpenAPI workspace | `https://x8ki-letl-twmt.n7.xano.io/apispec:workspace:H9Zs_69j?type=json` |
