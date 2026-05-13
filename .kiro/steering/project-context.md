---
inclusion: always
---

# CRM Broadcast — Project Context

## What This App Does
A WhatsApp Business broadcast platform. Users log in, create campaigns, pick templates, select an audience, schedule or immediately send bulk WhatsApp messages via the Meta Cloud API. There is also a standalone Template Manager where users can build and register WhatsApp message templates directly with Meta.

---

## Tech Stack
- **Framework:** React 19 (Create React App)
- **UI:** MUI v7 (`@mui/material`, `@mui/x-data-grid`)
- **Icons:** `lucide-react`
- **Styling:** SCSS Modules (`*.module.scss`) + global `src/global.scss` (SCSS variables)
- **HTTP:** `axios`
- **Routing:** `react-router-dom` v7
- **Toasts:** `react-hot-toast` (Toaster mounted in `src/index.js`)
- **Rich text:** `quill` / `react-quilljs`
- **Animations:** `lottie-react`, `canvas-confetti`
- **Build:** `react-scripts` 5

---

## Environment Variables (`.env`)
```
REACT_APP_API_PRODUCTION_URL   = https://apilx.optigoapps.com/api
REACT_APP_API_NXT_URL          = https://nxt22.optigoapps.com/api
REACT_APP_API_DEVELOPMENT_URL  = http://192.168.1.71:3001/api
REACT_APP_API_WEB_DEVELOPMENT_URL = http://newnextjs.web/api
REACT_APP_MEDIA_BASE_URL       = https://crmapp.mpillarapi.com/api/meta/v19.0/622385334300738/Media/
```
`API_BASE_URL` is resolved in `src/API/InitialApi/Config.js` based on `window.location.hostname`.

---

## Authentication
- Token arrives as an encrypted URL param, decrypted with `crypto-js` in `useAuthToken` hook.
- Stored in `sessionStorage` as `userToken` (JSON string).
- Key fields on `userToken`: `userId` (numeric), `username` (email), `yc` (YearCode), `sv`, `phoneNumberId`.
- All API calls use `getHeaders()` from `Config.js` which reads `userToken` from sessionStorage.

---

## API Layer (`src/API/`)

### Base config — `src/API/InitialApi/Config.js`
Exports all URL constants and two header helpers:
- `getHeaders()` — standard authenticated headers (`Yearcode`, `Version`, `sv`, `sp`)
- `getLoginHeaders()` — unauthenticated headers

### Common pattern
Most APIs use `CommonAPI` (POST to `/report`) with a `con` / `p` / `f` body:
```js
{ con: '{"id":"","mode":"<mode>","appuserid":"<userId>"}', p: '{}', f: "Description" }
```

### Key API files
| File | Mode / Endpoint | Purpose |
|---|---|---|
| `CampaignList/CampaignList.js` | `broadcast_camp_list` | Fetch campaigns with templates |
| `CampaignList/CampaignStatusApi.js` | — | Campaign send status grid |
| `AddCampaign/AddCampaign.js` | `broadcast_camp_bind_temp` | Bind template to campaign |
| `TemplateList/TemplateList.js` | `broadcast_temp_list` | Fetch approved templates (session) |
| `TemplateList/FetchCrmTemplates.js` | `broadcast_crm_temp_list` | Fetch all CRM templates for Templates page |
| `TemplateList/CreateTemplate.js` | `POST /whatsapp/templates/manage/create` | Create WhatsApp template via Meta |
| `InitialApi/UploadMetaMedia.js` | `POST /meta/v19.0/{phoneNumberId}/media` | Upload media to Meta, returns handle `id` |
| `InitialApi/UploadMedia.js` | `POST /whatsapp/brodcast/excel-import` | Excel audience import |
| `SendBullk/SendBulk.js` | `POST /whatsapp/brodcast/send-bulk` | Immediate bulk send |
| `Scheduler/Scheduler.js` | `wa_add_schedule` | Schedule a campaign |
| `startCron/startCron.js` | — | Launch scheduled campaign |
| `getInbound/GetInbound.js` | — | Inbound messages |
| `getOutbound/GetOutbound.js` | — | Outbound message history |

---

## Routing (`src/App.js`)
```
/           → Home (campaign stepper)
/inbound    → Inbound messages
/outbound   → Outbound history
/campaigns  → CampaignGrid (send status)
/templates  → Templates page (list + create)
/filter     → FilterDrawer
```

---

## Main Pages & Components

### Home (`src/components/Home.js`)
Multi-step campaign wizard using `StepperContext`. Steps:
1. **MessageComposer** — pick campaign + template
2. **AudienceSection** — pick audience (Excel / Group / Filter)
3. **ScheduleDate** — send now or schedule with recurrence
4. **LaunchCampaign** — final launch

### Templates (`src/components/Templates/`)
- `Templates.js` — card grid of all CRM templates. Filter by status (APPROVED / PENDING / REJECTED). "Create Template" button opens `CreateTemplateModal`.
- `CreateTemplateModal.js` — 2-step modal:
  - Step 1: Template Name (spaces → `_`), Language, Category
  - Step 2: WhatsApp Template Builder (Template Type chips, Header None/Text/Media, Body with variables, Footer, Buttons) + live phone preview
- `CreateTemplateModal.module.scss` — dedicated styles (Meta-style UI)

### MessageComposer (`src/components/MessageComposer/`)
- `MessageComposer.js` — campaign list with template selection (checkbox). "Create Campaign" opens `OptionalModal1`.
- `OptionalModal1.js` — 3-step modal: Choose Type → Template Details → Builder. Same builder logic as `CreateTemplateModal` but embedded in the campaign flow.
- `HeaderMediaConfig.js` — media type picker (Image/Video/Document/Location). Location is "coming soon".
- `ComposedMessage.js` — WhatsApp preview panel with Quill editor.
- `ComposedMessage1.js` — simplified campaign name + template selector.

### Audience (`src/components/Audience/`)
- `AudienceSection.js` — main audience picker. Supports Excel upload, Group selection, Filter-based selection.
- `FilterDrawer.js`, `FilterSelectionDialog.js` — filter by company/branch.
- `GroupDropdown.js` — group-based audience.

### Other
- `CampaignGrid.js` — MUI DataGrid showing campaign send status.
- `Inbound.js` / `Outbound.js` — message history grids.
- `ScheduleDate.js` — send now vs schedule picker with recurrence (1–5, sends same message N times, once per 24h).
- `LaunchCampaign.js` — final step, calls `sendBulk` or `SetScheduler`.

---

## Template Creation Flow (Meta API)

```
User fills Step 1 (name, language, category)
  ↓
User fills Step 2 (header, body, footer, buttons)
  ↓
If Media header selected:
  → Upload file to Meta via UploadMetaMedia.js
  → Receive media handle (id string)
  ↓
Build Components array per Meta spec:
  HEADER  → { type, format, text/example }
  BODY    → { type, text, example: { body_text: [[...]] } }
  FOOTER  → { type, text }
  BUTTONS → { type, buttons: [{ type: QUICK_REPLY, text }] }
  ↓
POST to /whatsapp/templates/manage/create
  Payload: { TemplateName, TemplateType, CreatedBy (userId), UserId (username/email), Language, Components }
  ↓
Response: { success, data: { data: { rd: [{ stat, stat_msg, stat_code }] } } }
  stat_code 1000 / stat 1 = success → toast.success
```

### Meta Rules enforced
- `TemplateName`: lowercase, spaces → `_`, special chars stripped, max 512
- Body cannot end with `{{n}}`
- All variable `{{n}}` must have sample values
- Header `{{1}}` must have `example.header_text`
- Body variables use `example.body_text: [[val1, val2, ...]]`
- Footer: no variables, max 60 chars
- Media: file upload only (no raw URLs) → Meta handle required

---

## Global SCSS Variables (`src/global.scss`)
Key variables used across all SCSS modules:
```scss
$primary-main: #7367f0
$secondaryColor: #7D7f85
$titleColor: #444050
$text2ndColor: #6D6B77
$font-family: 'Poppins', ...
$error-main: #d32f2f
$success-main: #28C76F
```
Global button classes: `.buttonClassname`, `.secondaryBtnClassname`, `.dangerbtnClassName`

---

## State Management
- No Redux. State is local (`useState`) + `StepperContext` (React Context) for the campaign wizard.
- `StepperContext` holds: `selectedTemplates`, `audience`, `datasource`, `sendDate`, `sendTime`, `sendOption`, `distributeDays`.
- Campaign wizard state also persisted to `sessionStorage` as `campaignStepperState`.
- `userToken` read from `sessionStorage` directly in API files (not passed as prop).

---

## Naming Conventions
- API response fields are PascalCase (`TemplateName`, `TemplateType`, `WabaStatus`, `EntryDate`)
- Component props and state are camelCase
- Template field mapping: `TemplateName || Name`, `TemplateType || Type` (legacy fallback)
- SCSS: BEM-like with camelCase module classes

---

## Known Patterns
- All API calls return `{ data: [] }` on error (never throw to UI)
- `CommonAPI` wraps all report-mode calls; direct `axios` for non-report endpoints
- `useAuthToken` returns a new object reference each render — always depend on `userToken?.username` (primitive) not `userToken` (object) in `useEffect` deps
- Carousel, LTO, Catalog, MPM template types → "Coming soon" toast, not implemented
- Location header → "Coming soon" toast, not implemented
