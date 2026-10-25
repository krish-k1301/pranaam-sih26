# Pramaan

**प्रमाण, "proof"**: a decision-support workbench for AICTE scrutiny officers reviewing Extension of Approval applications. Prototype for Smart India Hackathon problem statement **SIH26261** (AICTE, Ministry of Education).

> **All data in this prototype is synthetic.** Institutions, people, faculty IDs, certificate numbers, hashes and issuer responses are generated for demonstration. Real authority names appear only as the issuers of sample documents, and every rendered document is marked "Synthetic sample".

This is a frontend-only prototype. It has no backend, and everything runs in the browser from mock data in `src/data/`.

## What it shows

- **Queue (`/`)**: applications sorted by risk score, with a summary strip, filters (risk band, region, category, cross-application match), text search, a document-status mini-bar per application and an alerts panel.
- **Application review (`/applications/:id`)**: findings grouped by severity, a **document evidence viewer** and an evidence and action panel.
  - The viewer renders the uploaded document as a sheet of paper and outlines the flagged fields from their bounding boxes.
  - Some findings get a different view: two faculty lists side by side for cross-application matches, two lab photos for reused images, and a revision timeline for PDFs edited after signing.
  - Officers can Confirm, Dismiss (a written reason is required), Request rectification or Recommend inspection. Each action recomputes document statuses and the risk score immediately and appends an audit entry.
  - Further tabs: Documents, Checks run, Audit trail.
- **Rules (`/rules`)**: 15 APH 2024-27 rules, each with its JSON-Logic expression, message template and version history. Switch to the **Rule administrator** role from the user menu to draft a new version and approve and publish it.
- **Audit log (`/audit`)**: every event, hash-chained with SHA-256 in the browser (`crypto.subtle`). **Verify chain** recomputes every hash. **Simulate tampering (demo)** edits one stored event so you can watch verification fail at that exact event. Switch it off to restore the event.

### Product rules the UI enforces

1. Every document has one of six statuses: Verified, Mismatch detected, Expired, Verification pending, Source unavailable, Manual review required.
2. A document's status is derived from its active findings and check results. The most serious status wins, in this order: mismatch > expired > manual review > source unavailable > pending > verified. Dismissed findings don't count. The logic is in `src/lib/status.ts`.
3. Every finding links to its evidence: the document, page and field, the rule or check (ID and version), and a plain one-sentence reason.
4. Findings are advisory and describe what was observed. They never conclude anything.
5. Only officers act on findings, and every action is audited.
6. Risk score is the sum of severity weights of active findings: info 0, minor 1, major 3, critical 8. The bands are low < 3, medium 3–7, high ≥ 8. The breakdown is always one click away.

### Demo script (about 2 minutes)

1. Open the queue. **Sahyadri Institute of Technology, Pune (`A-2027-000123`)** leads with a score of 22.
2. Open it. Click through the findings:
   - the critical faculty match (side by side with Deccan College, Satara)
   - the PDF edited after signing (revision timeline)
   - the reused lab photo
   - the expired fire NOC
3. Select **Printed validity differs from the QR code** and click **Dismiss**. Submitting without a reason is blocked. Add a reason and submit. The accreditation certificate changes from *Mismatch detected* to *Verified*, and the risk score drops to 19.
4. Open **Audit trail**, then **Audit log**, and press **Verify chain**. Turn on **Simulate tampering**, verify again, and watch it fail at the edited event.
5. Use **Reset demo data** in the user menu (top right) to start over.

Reviews, rule edits and audit entries are kept in `localStorage`, so a demo survives a refresh. The demo clock runs in January 2027, the scrutiny window for academic year 2027-28. New actions are stamped after the last seeded event.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check and production build into dist/
npm run preview    # serve the production build
```

Requires Node 20 or later. The stack is Vite, React 18, TypeScript (strict), Tailwind CSS v4, react-router-dom v6 and lucide-react.

## Deploy to Vercel

```bash
npm i -g vercel
vercel        # first time: link/create project, accept defaults (Vite is auto-detected)
vercel --prod
```

Or push the repository to GitHub, then go to vercel.com → Add New Project → import the repo → Deploy.

`vercel.json` rewrites every path to `index.html`, so deep links such as `/applications/A-2027-000123` work.

## Code map

```
src/lib/types.ts        domain types
src/lib/status.ts       deriveDocumentStatus, riskScore (pure)
src/lib/audit.ts        canonical JSON, SHA-256 chain, verify
src/data/flagship.ts    hand-written flagship application A-2027-000123
src/data/generate.ts    seeded generation of 13 more applications, alerts, audit history
src/data/docs.ts        document templates with normalised bounding boxes
src/data/rules.ts       15 APH rules with versions
src/state/DemoStore.tsx reviews, rule drafts, audit appends, role, reset (localStorage)
src/components/         StatusChip, RiskBadge, StatusMiniBar, DocumentPaper, SideBySide,
                        PhotoPair, RevisionTimeline, EvidenceCard, ReviewDialog, Viewer, ...
src/pages/              Queue, ApplicationReview, Rules, AuditLog, NotFound
```

## Choices made for the prototype

- **Regions.** Gujarat sits in the Central region and Rajasthan in the North-West region, which matches AICTE's regional office structure as far as we know. Confirm these against current AICTE mappings.
- **Photos.** The infrastructure photos are drawn in SVG. They stand in for real uploads.
- **Applications and records.** The "Konkan Institute" and "Bundelkhand Institute" photo matches refer to closed 2026-27 applications, which are not part of this year's queue. The AICTE faculty roster, payment records and issuer services are simulated. Each evidence card shows what such a response would contain.
- **Hash chain.** Audit hashes are recomputed on every load from the seeded events plus your stored actions. Because the seed is deterministic, the chain head is stable across visits.
