// Seeded generation of the rest of the queue, the audit history and the alerts.
// Each application is described by a short spec; "plants" decide which findings it carries.
import type {
  Alert,
  AlertType,
  AppDocument,
  Application,
  AuditEventBody,
  Category,
  CheckKind,
  CheckOutcome,
  CheckResult,
  DocType,
  Evidence,
  Finding,
  Region,
} from '../lib/types'
import { durationFor, type AppBundle } from './bundle'
import {
  accreditation,
  affidavit,
  buildingCompletion,
  dteNoc,
  facultyList,
  fireNoc,
  infraPhoto,
  landDocument,
  makeFaculty,
  terReceipt,
  universityConsent,
  type InstCtx,
} from './docs'
import { DECCAN_APP_ID, DECCAN_NAME, DECCAN_PID, FLAGSHIP, SHARED_FACULTY } from './flagship'
import { int, rngFor } from './seed'

type Plant =
  | 'expired-noc'
  | 'intake-mismatch'
  | 'fsr'
  | 'ter-mismatch'
  | 'affidavit-unsigned'
  | 'qr-mismatch'
  | 'source-unavailable'
  | 'dte-cap'
  | 'committees'
  | 'classroom'
  | 'photo-reuse'
  | 'website'
  | 'principal'
  | 'lab-count'
  | 'info-accreditation'
  | 'xapp-faculty-mirror'

type Extra = 'affidavit' | 'accreditation' | 'land' | 'photo' | 'photo2'

interface Spec {
  id: string
  name: string
  city: string
  state: keyof typeof STATES
  region: Region
  pid: string
  category: Category
  submitted: string
  officer: string
  intake: number
  faculty: number
  address: string
  university?: [string, string]
  plants: Plant[]
  extras: Extra[]
  /** The last photo was uploaded after the automated run, so nothing has checked it yet. */
  pendingPhoto?: boolean
}

const STATES = {
  Maharashtra: { fire: 'Maharashtra Fire Services', dte: 'Directorate of Technical Education, Maharashtra', dteLine: '3 Mahapalika Marg, Mumbai', uni: ['Savitribai Phule Pune University', 'Board of College and University Development, Pune'], code: 'MH' },
  Gujarat: { fire: 'Gujarat Fire and Emergency Services', dte: 'Directorate of Technical Education, Gujarat', dteLine: 'Block 2, Karmayogi Bhavan, Gandhinagar', uni: ['Gujarat Technological University', 'Affiliation section, Ahmedabad'], code: 'GJ' },
  Karnataka: { fire: 'Karnataka State Fire and Emergency Services', dte: 'Department of Technical Education, Karnataka', dteLine: 'Palace Road, Bengaluru', uni: ['Visvesvaraya Technological University', 'Affiliation section, Belagavi'], code: 'KA' },
  'Tamil Nadu': { fire: 'Tamil Nadu Fire and Rescue Services', dte: 'Directorate of Technical Education, Tamil Nadu', dteLine: 'Guindy, Chennai', uni: ['Anna University', 'Centre for Affiliation of Institutions, Chennai'], code: 'TN' },
  'Uttar Pradesh': { fire: 'Uttar Pradesh Fire and Emergency Services', dte: 'Directorate of Technical Education, Uttar Pradesh', dteLine: 'Vikas Nagar, Kanpur', uni: ['Dr. A.P.J. Abdul Kalam Technical University', 'Affiliation section, Lucknow'], code: 'UP' },
  Rajasthan: { fire: 'Rajasthan Fire and Emergency Services', dte: 'Department of Technical Education, Rajasthan', dteLine: 'Jodhpur', uni: ['Rajasthan Technical University', 'Affiliation section, Kota'], code: 'RJ' },
  Telangana: { fire: 'Telangana State Disaster Response and Fire Services', dte: 'Department of Technical Education, Telangana', dteLine: 'Masab Tank, Hyderabad', uni: ['Jawaharlal Nehru Technological University Hyderabad', 'Directorate of Affiliations and Academic Audit'], code: 'TS' },
} as const

const SPECS: Spec[] = [
  {
    id: DECCAN_APP_ID, name: 'Deccan College of Engineering', city: 'Satara', state: 'Maharashtra', region: 'Western', pid: DECCAN_PID,
    category: 'Extension of approval', submitted: '2027-01-11T16:05', officer: 'K. Sharma', intake: 360, faculty: 30,
    address: 'Plot 7, MIDC Area, Satara 415004', university: ['Shivaji University', 'Affiliation section, Kolhapur'],
    plants: ['xapp-faculty-mirror', 'website'], extras: ['affidavit', 'photo'],
  },
  {
    id: 'A-2027-000412', name: 'Narmada Valley Institute of Technology', city: 'Vadodara', state: 'Gujarat', region: 'Central', pid: '1-4410051290',
    category: 'Increase in intake', submitted: '2027-01-09T12:40', officer: 'A. Qureshi', intake: 600, faculty: 26,
    address: 'Waghodia Road, Vadodara 391760',
    plants: ['intake-mismatch', 'fsr', 'ter-mismatch'], extras: ['affidavit', 'land', 'photo'],
  },
  {
    id: 'A-2027-000231', name: 'Kaveri College of Engineering', city: 'Mysuru', state: 'Karnataka', region: 'South-Western', pid: '1-4410038871',
    category: 'Extension of approval', submitted: '2027-01-14T11:18', officer: 'S. Menon', intake: 420, faculty: 28,
    address: 'Hunsur Road, Mysuru 570017',
    plants: ['expired-noc', 'affidavit-unsigned'], extras: ['affidavit', 'accreditation', 'photo'],
  },
  {
    id: 'A-2027-000958', name: 'Coromandel Institute of Technology', city: 'Chennai', state: 'Tamil Nadu', region: 'Southern', pid: '1-4410077346',
    category: 'New course', submitted: '2027-01-20T09:52', officer: 'P. Reddy', intake: 480, faculty: 33,
    address: 'Old Mahabalipuram Road, Chennai 600119',
    plants: ['qr-mismatch', 'source-unavailable'], extras: ['accreditation', 'affidavit', 'photo'],
  },
  {
    id: 'A-2027-000644', name: 'Ganga-Yamuna Institute of Engineering', city: 'Prayagraj', state: 'Uttar Pradesh', region: 'Northern', pid: '1-4410062118',
    category: 'Extension of approval', submitted: '2027-01-12T14:27', officer: 'R. Bansal', intake: 540, faculty: 38,
    address: 'Naini Industrial Area, Prayagraj 211008',
    plants: ['dte-cap', 'committees', 'classroom'], extras: ['affidavit', 'land'],
  },
  {
    id: 'A-2027-000715', name: 'Aravalli College of Engineering', city: 'Udaipur', state: 'Rajasthan', region: 'North-West', pid: '1-4410069930',
    category: 'Extension of approval', submitted: '2027-01-16T10:03', officer: 'R. Bansal', intake: 300, faculty: 22,
    address: 'Debari Road, Udaipur 313024',
    plants: ['photo-reuse', 'website'], extras: ['affidavit', 'photo', 'photo2'],
  },
  {
    id: 'A-2027-000389', name: 'Musi Institute of Engineering', city: 'Hyderabad', state: 'Telangana', region: 'South-Central', pid: '1-4410045507',
    category: 'Increase in intake', submitted: '2027-01-10T15:36', officer: 'P. Reddy', intake: 660, faculty: 40,
    address: 'Ibrahimpatnam, Hyderabad 501506',
    plants: ['principal', 'lab-count', 'info-accreditation'], extras: ['accreditation', 'photo'],
  },
  {
    id: 'A-2027-000507', name: 'Tapi Institute of Engineering', city: 'Surat', state: 'Gujarat', region: 'Central', pid: '1-4410054431',
    category: 'Extension of approval', submitted: '2027-01-08T11:10', officer: 'A. Qureshi', intake: 360, faculty: 24,
    address: 'Ichchhanath, Surat 395007',
    plants: [], extras: ['affidavit', 'photo'],
  },
  {
    id: 'A-2027-000276', name: 'Malnad College of Technology', city: 'Shivamogga', state: 'Karnataka', region: 'South-Western', pid: '1-4410040062',
    category: 'Extension of approval', submitted: '2027-01-13T13:45', officer: 'S. Menon', intake: 300, faculty: 21,
    address: 'Sagar Road, Shivamogga 577205',
    plants: ['source-unavailable'], extras: ['affidavit'], pendingPhoto: false,
  },
  {
    id: 'A-2027-001032', name: 'Nilgiri Institute of Engineering', city: 'Coimbatore', state: 'Tamil Nadu', region: 'Southern', pid: '1-4410080915',
    category: 'New course', submitted: '2027-01-22T10:31', officer: 'P. Reddy', intake: 420, faculty: 29,
    address: 'Avinashi Road, Coimbatore 641062',
    plants: ['info-accreditation'], extras: ['accreditation', 'photo'], pendingPhoto: true,
  },
  {
    id: 'A-2027-000673', name: 'Awadh Institute of Technology', city: 'Lucknow', state: 'Uttar Pradesh', region: 'Northern', pid: '1-4410063374',
    category: 'Extension of approval', submitted: '2027-01-15T12:02', officer: 'R. Bansal', intake: 480, faculty: 31,
    address: 'Faizabad Road, Lucknow 226028',
    plants: ['affidavit-unsigned', 'website'], extras: ['affidavit', 'land', 'photo'],
  },
  {
    id: 'A-2027-000741', name: 'Thar Institute of Engineering', city: 'Jodhpur', state: 'Rajasthan', region: 'North-West', pid: '1-4410070288',
    category: 'Extension of approval', submitted: '2027-01-17T09:20', officer: 'R. Bansal', intake: 240, faculty: 17,
    address: 'Pali Road, Jodhpur 342005',
    plants: [], extras: ['affidavit'],
  },
  {
    id: 'A-2027-000188', name: 'Godavari College of Engineering', city: 'Nashik', state: 'Maharashtra', region: 'Western', pid: '1-4410027759',
    category: 'Extension of approval', submitted: '2027-01-19T14:50', officer: 'K. Sharma', intake: 480, faculty: 30,
    address: 'Gangapur Road, Nashik 422013',
    plants: ['classroom'], extras: ['affidavit', 'photo'], pendingPhoto: true,
  },
]

const IST = '+05:30'
const toIst = (ms: number) => {
  const d = new Date(ms + 5.5 * 3600_000)
  return `${d.toISOString().slice(0, 19)}${IST}`
}
const msOf = (local: string) => Date.parse(`${local}:00${IST}`)

const LAB_SCENES = ['CSE Lab 2', 'Electronics laboratory', 'Drawing hall', 'Machine shop', 'Physics laboratory', 'Library reading hall']

function buildApp(s: Spec): AppBundle {
  const rng = rngFor(s.id)
  const st = STATES[s.state]
  const has = (p: Plant) => s.plants.includes(p)
  const app: Application = {
    id: s.id,
    institution: s.name,
    city: s.city,
    state: s.state,
    region: s.region,
    permanentId: s.pid,
    category: s.category,
    academicYear: '2027-28',
    submittedAt: toIst(msOf(s.submitted)),
    assignedOfficer: s.officer,
    intake: s.intake,
    faculty: s.faculty,
  }
  const ctx: InstCtx = {
    appId: s.id,
    institution: `${s.name}, ${s.city}`,
    city: s.city,
    state: s.state,
    address: s.address,
    permanentId: s.pid,
    intake: s.intake,
    faculty: s.faculty,
  }
  const sub = msOf(s.submitted)
  const up = (minsBefore: number) => toIst(sub - minsBefore * 60_000)
  const code = st.code
  const uni = s.university ?? st.uni

  const docs: AppDocument[] = []
  let n = 0
  const add = (d: AppDocument) => {
    docs.push(d)
    return d
  }
  const fire = add(
    fireNoc(ctx, ++n, {
      authority: st.fire,
      authorityLine: `Office of the Chief Fire Officer, ${s.city}`,
      nocNo: `${code}FS/${s.city.slice(0, 3).toUpperCase()}/2025/${int(rng, 1000, 9999)}`,
      issued: '18.07.2025',
      validUntil: has('expired-noc') ? '30.06.2027' : '31.03.2029',
      uploadedAt: up(2900),
      area: `${(int(rng, 120, 210) * 100).toLocaleString('en-IN')} sq m`,
      floors: 'Ground + 3',
    }),
  )
  const bcc = add(
    buildingCompletion(ctx, ++n, {
      authority: `${s.city} Municipal Corporation`,
      authorityLine: 'Building Permission Department',
      certNo: `${s.city.slice(0, 3).toUpperCase()}MC/CC/${int(rng, 2012, 2020)}/${int(rng, 100, 4999)}`,
      issued: '22.11.2018',
      uploadedAt: up(2880),
      area: `${(int(rng, 120, 210) * 100).toLocaleString('en-IN')} sq m`,
      floors: 'Ground + 3',
      classroomArea: has('classroom') ? Math.round(s.intake * 0.94) : undefined,
    }),
  )
  const consentIntake = has('intake-mismatch') ? s.intake - 120 : s.intake
  const consent = add(
    universityConsent(ctx, ++n, {
      university: uni[0],
      universityLine: uni[1],
      refNo: `AFF/${code}/2027/${int(rng, 1000, 9999)}`,
      year: '2027-28',
      intakeConsented: consentIntake,
      uploadedAt: up(2700),
    }),
  )
  const members = makeFaculty(s.id, s.faculty, 88130000 + int(rng, 0, 9000) * 10)
  if (has('principal')) members[0] = { ...members[0], name: members[0].name.replace('Dr. ', ''), qual: 'M.Tech.' }
  if (has('xapp-faculty-mirror')) members[12] = SHARED_FACULTY
  const faculty = add(facultyList(ctx, ++n, members, up(2500)))
  const txn = `BKS2701${int(rng, 10000000, 99999999)}`
  const ter = add(terReceipt(ctx, ++n, { txn, amount: '₹1,90,000.00', paidOn: '05.01.2027', uploadedAt: up(2400) }))
  const dteCap = has('dte-cap') ? s.intake - 60 : s.intake
  const dte = add(
    dteNoc(ctx, ++n, {
      directorate: st.dte,
      directorateLine: st.dteLine,
      refNo: `DTE/${code}/NOC/2027/${int(rng, 1000, 9999)}`,
      issued: '06.01.2027',
      uploadedAt: up(2300),
      cap: dteCap,
    }),
  )
  let aff: AppDocument | undefined
  let acc: AppDocument | undefined
  let photo: AppDocument | undefined
  let photo2: AppDocument | undefined
  const website = `www.${s.name.toLowerCase().split(' ')[0].replace(/[^a-z]/g, '')}${code.toLowerCase()}.edu.in/disclosure`
  for (const e of s.extras) {
    if (e === 'affidavit') {
      aff = add(
        affidavit(ctx, ++n, {
          committees: has('committees')
            ? ['Anti-ragging', 'SC/ST', 'Grievance redressal']
            : ['Anti-ragging', 'Internal Complaints', 'SC/ST', 'Grievance redressal'],
          website,
          signed: !has('affidavit-unsigned'),
          uploadedAt: up(2200),
        }),
      )
    } else if (e === 'accreditation') {
      acc = add(
        accreditation(ctx, ++n, {
          certNo: `NBA/ACCR/${int(rng, 2023, 2025)}/${int(rng, 10000, 19999)}`,
          printedValid: has('qr-mismatch') ? '30.06.2030' : has('info-accreditation') ? '31.12.2028' : '30.06.2029',
          qrValid: has('qr-mismatch') ? '2027-12-31' : has('info-accreditation') ? '2028-12-31' : '2029-06-30',
          programmes: ['B.E. Computer Science and Engineering', 'B.E. Civil Engineering'],
          uploadedAt: up(2100),
        }),
      )
    } else if (e === 'land') {
      add(landDocument(ctx, ++n, { surveyNo: `${int(rng, 10, 400)}/${int(rng, 1, 9)}`, area: `${int(rng, 8, 22)}.${int(rng, 0, 9)} acres`, uploadedAt: up(2000) }))
    } else if (e === 'photo') {
      photo = add(infraPhoto(ctx, ++n, { caption: 'CSE Lab 1', institution: ctx.institution, year: '2027-28', rows: int(rng, 2, 3), hueShift: int(rng, -12, 12) }, up(1900)))
    } else if (e === 'photo2') {
      photo2 = add(
        infraPhoto(ctx, ++n, { caption: LAB_SCENES[int(rng, 0, LAB_SCENES.length - 1)], institution: ctx.institution, year: '2027-28', rows: 2, hueShift: int(rng, -12, 12) }, up(s.pendingPhoto ? -90 : 1800)),
      )
    }
  }
  if (s.pendingPhoto && !photo2) {
    photo2 = add(infraPhoto(ctx, ++n, { caption: 'Seminar hall', institution: ctx.institution, year: '2027-28', rows: 2, hueShift: 6 }, up(-90)))
  }

  // Findings
  const findings: Finding[] = []
  const failing = new Map<string, { findingId: string; outcome: CheckOutcome }>()
  const createdAt = toIst(sub + 3 * 60_000)
  const plant = (docId: string, checkId: string, outcome: CheckOutcome, f: Omit<Finding, 'id' | 'appId' | 'documentId' | 'checkId' | 'createdAt'>) => {
    const id = `${s.id}-F${findings.length + 1}`
    findings.push({ id, appId: s.id, documentId: docId, checkId, createdAt, ...f })
    if (outcome !== 'pass') failing.set(`${docId}|${checkId}`, { findingId: id, outcome })
  }
  const region = (d: AppDocument, fieldKey: string): Evidence => {
    const fld = d.fields.find((x) => x.key === fieldKey)
    return { kind: 'region', documentId: d.id, page: fld?.page ?? 1, fieldKey, observed: fld?.cells?.join(' · ') || fld?.value || '' }
  }

  for (const p of s.plants) {
    switch (p) {
      case 'expired-noc':
        plant(fire.id, 'R-NOC-001', 'fail', {
          title: 'Fire NOC expires before the academic year starts',
          reason: 'The NOC is valid until 30 Jun 2027, which is 32 days before the 2027-28 academic year starts on 1 Aug 2027.',
          category: 'Expired', severity: 'major', confidence: 0.99, checkVersion: 2, aphClause: 'APH 2024-27, clause 2.4.3(f)',
          statusEffect: 'expired', viewer: 'document', page: 1, fieldKeys: ['valid_until'],
          evidence: [region(fire, 'valid_until'), { kind: 'structural', fact: 'Validity compared with the academic calendar', values: [['Valid until', '30 Jun 2027'], ['Academic year starts', '1 Aug 2027'], ['Gap', '32 days']] }],
        })
        break
      case 'intake-mismatch':
        plant(consent.id, 'R-INT-008', 'fail', {
          title: 'University consent covers fewer seats than declared',
          reason: `The university consented to ${consentIntake} seats for 2027-28, but the application declares an intake of ${s.intake}.`,
          category: 'Inconsistent', severity: 'major', confidence: 0.99, checkVersion: 1, aphClause: 'APH 2024-27, clause 3.1',
          statusEffect: 'mismatch', viewer: 'document', page: 1, fieldKeys: ['consented_intake'],
          evidence: [region(consent, 'consented_intake'), { kind: 'record', source: 'AICTE approval register', recordId: `EoA ${s.pid} 2026-27`, statement: `Approved intake for 2026-27: ${consentIntake}. Increase requested: ${s.intake - consentIntake}.`, asOf: '15 Jun 2026' }],
        })
        break
      case 'fsr': {
        const req = Math.ceil(s.intake / 20)
        plant(faculty.id, 'R-FSR-005', 'fail', {
          title: 'Faculty strength below 1:20 for the declared intake',
          reason: `${s.faculty} full-time faculty are listed; an intake of ${s.intake} needs at least ${req} at 1:20.`,
          category: 'Non-compliant', severity: 'major', confidence: 1, checkVersion: 2, aphClause: 'APH 2024-27, clause 5.1',
          statusEffect: 'manual_review', viewer: 'document', page: 1, fieldKeys: ['declared_count'],
          evidence: [region(faculty, 'declared_count'), { kind: 'structural', fact: 'Ratio worked out from the declared figures', values: [['Faculty listed', String(s.faculty)], ['Intake', String(s.intake)], ['Required at 1:20', String(req)], ['Short by', String(req - s.faculty)]] }],
        })
        break
      }
      case 'ter-mismatch':
        plant(ter.id, 'R-TER-007', 'fail', {
          title: 'Fee on receipt differs from AICTE payment records',
          reason: `The receipt shows ₹1,90,000.00, but AICTE payment records show ₹1,50,000.00 settled against transaction ${txn}.`,
          category: 'Inconsistent', severity: 'major', confidence: 0.97, checkVersion: 1, aphClause: 'APH 2024-27, Appendix 2',
          statusEffect: 'mismatch', viewer: 'document', page: 1, fieldKeys: ['amount'],
          evidence: [region(ter, 'amount'), { kind: 'record', source: 'AICTE payment records (Bharat Kosh)', recordId: txn, statement: 'Settled amount ₹1,50,000.00 on 05.01.2027 for this permanent ID.', asOf: '08 Jan 2027' }],
        })
        break
      case 'affidavit-unsigned':
        if (aff)
          plant(aff.id, 'R-AFF-013', 'fail', {
            title: 'Affidavit signature space is blank',
            reason: 'The deponent signature space on page 1 of the affidavit has no signature, although the notary seal is present.',
            category: 'Missing', severity: 'minor', confidence: 0.91, checkVersion: 1, aphClause: 'APH 2024-27, clause 2.4.4',
            statusEffect: 'manual_review', viewer: 'document', page: 1, fieldKeys: ['deponent_sign'],
            evidence: [region(aff, 'deponent_sign')],
          })
        break
      case 'qr-mismatch':
        if (acc)
          plant(acc.id, 'AUTH-QR-MATCH', 'fail', {
            title: 'Printed validity differs from the QR code',
            reason: 'The certificate prints "valid till 30.06.2030", but its QR code payload gives a validity of 31 Dec 2027.',
            category: 'Inconsistent', severity: 'major', confidence: 0.98, checkVersion: 1,
            statusEffect: 'mismatch', viewer: 'document', page: 1, fieldKeys: ['valid_until_printed', 'qr_payload'],
            evidence: [region(acc, 'valid_until_printed'), region(acc, 'qr_payload'), { kind: 'structural', fact: 'Printed text compared with the decoded QR payload', values: [['Printed', '30 Jun 2030'], ['QR payload', '31 Dec 2027'], ['Difference', '2 years 6 months']] }],
          })
        break
      case 'source-unavailable':
        plant(dte.id, 'SRC-DTE', 'error', {
          title: 'State directorate service did not respond',
          reason: `The ${st.dte} verification service timed out, so the NOC reference could not be confirmed.`,
          category: 'Verification', severity: 'minor', confidence: 1, checkVersion: 1,
          statusEffect: 'source_unavailable', viewer: 'document', page: 1, fieldKeys: ['ref_number'],
          evidence: [region(dte, 'ref_number'), { kind: 'issuer', sourceName: st.dte, requestRef: `VRQ-${s.id.slice(2, 6)}-${int(rng, 10000, 99999)}`, summary: 'No response within 30 s. Next automatic retry at 18:00.', at: toIst(sub + 2 * 60_000), responseHash: '', outcome: 'Timed out' }],
        })
        break
      case 'dte-cap':
        plant(dte.id, 'R-DTE-015', 'fail', {
          title: 'State NOC allows fewer seats than declared',
          reason: `The state NOC caps intake at ${dteCap}; the application declares ${s.intake}.`,
          category: 'Inconsistent', severity: 'major', confidence: 0.99, checkVersion: 1, aphClause: 'APH 2024-27, clause 2.5.2',
          statusEffect: 'mismatch', viewer: 'document', page: 1, fieldKeys: ['intake_cap'],
          evidence: [region(dte, 'intake_cap'), { kind: 'structural', fact: 'Figures compared', values: [['NOC cap', String(dteCap)], ['Declared intake', String(s.intake)], ['Excess', String(s.intake - dteCap)]] }],
        })
        break
      case 'committees':
        if (aff)
          plant(aff.id, 'R-COM-009', 'fail', {
            title: 'Internal Complaints Committee not listed',
            reason: 'The affidavit lists anti-ragging, SC/ST and grievance committees but no Internal Complaints Committee.',
            category: 'Missing', severity: 'minor', confidence: 0.95, checkVersion: 1, aphClause: 'APH 2024-27, clause 6.2',
            statusEffect: 'manual_review', viewer: 'document', page: 1, fieldKeys: ['committees'],
            evidence: [region(aff, 'committees')],
          })
        break
      case 'classroom': {
        const area = Math.round(s.intake * 0.94)
        plant(bcc.id, 'R-CLS-010', 'fail', {
          title: 'Classroom area below 1.1 sq m per student',
          reason: `The building schedule shows ${area.toLocaleString('en-IN')} sq m of classrooms for an intake of ${s.intake}, which is 0.94 sq m per student.`,
          category: 'Non-compliant', severity: 'minor', confidence: 0.88, checkVersion: 1, aphClause: 'APH 2024-27, clause 4.3',
          statusEffect: 'manual_review', viewer: 'document', page: 2, fieldKeys: ['sched_1'],
          evidence: [region(bcc, 'sched_1'), { kind: 'structural', fact: 'Area per student', values: [['Classroom area', `${area.toLocaleString('en-IN')} sq m`], ['Intake', String(s.intake)], ['Per student', '0.94 sq m'], ['Required', '1.1 sq m']] }],
        })
        break
      }
      case 'photo-reuse':
        if (photo)
          plant(photo.id, 'XAPP-PHOTO', 'fail', {
            title: 'Lab photo nearly identical to another institution’s',
            reason: 'The "CSE Lab 1" photo matches a photo submitted by Bundelkhand Institute of Technology, Jhansi for 2026-27 at 0.94 perceptual similarity.',
            category: 'Anomaly', severity: 'major', confidence: 0.9, checkVersion: 1,
            statusEffect: 'manual_review', viewer: 'photo', page: 1, fieldKeys: [],
            evidence: [
              { kind: 'cross', otherAppId: 'A-2026-003127', otherInstitution: 'Bundelkhand Institute of Technology, Jhansi', otherPhoto: { caption: 'Computer laboratory', institution: 'Bundelkhand Institute of Technology, Jhansi', year: '2026-27', rows: photo.photo?.rows ?? 3, hueShift: (photo.photo?.hueShift ?? 0) + 18 }, matched: 'Perceptual hash', similarity: 0.94 },
              { kind: 'structural', fact: 'Image fingerprints', values: [['This photo', '7e10 a4c2 59bd 0f63'], ['2026-27 photo', '7e10 a4c6 59bd 0e63'], ['Bits that differ', '4 of 64'], ['Mirrored', 'No']] },
            ],
          })
        break
      case 'website':
        if (aff)
          plant(aff.id, 'R-WEB-014', 'fail', {
            title: 'Mandatory disclosure page not reachable',
            reason: `The disclosure address given in the affidavit, ${website}, returned HTTP 404 on two attempts.`,
            category: 'Non-compliant', severity: 'minor', confidence: 0.86, checkVersion: 1, aphClause: 'APH 2024-27, clause 7.1',
            statusEffect: 'manual_review', viewer: 'document', page: 1, fieldKeys: ['website'],
            evidence: [region(aff, 'website'), { kind: 'structural', fact: 'Website check', values: [['Address', website], ['Response', 'HTTP 404 Not Found'], ['Attempts', '2, an hour apart']] }],
          })
        break
      case 'principal':
        plant(faculty.id, 'R-PRN-006', 'fail', {
          title: 'Principal does not show a Ph.D.',
          reason: `The faculty list names ${members[0].name} as principal with an M.Tech.; the APH requires a Ph.D. for the post.`,
          category: 'Non-compliant', severity: 'major', confidence: 0.94, checkVersion: 1, aphClause: 'APH 2024-27, clause 5.6',
          statusEffect: 'manual_review', viewer: 'document', page: 1, fieldKeys: [`row_${members[0].id}`],
          evidence: [region(faculty, `row_${members[0].id}`), { kind: 'record', source: 'AICTE faculty roster', recordId: members[0].id, statement: 'Highest qualification on record: M.Tech. (2008).', asOf: '30 Nov 2026' }],
        })
        break
      case 'lab-count':
        if (photo)
          plant(photo.id, 'R-LAB-011', 'fail', {
            title: 'Fewer laboratories declared than required',
            reason: 'B.Tech. Civil Engineering declares 4 laboratories with photos; the APH requires at least 6 for the programme.',
            category: 'Non-compliant', severity: 'minor', confidence: 0.82, checkVersion: 1, aphClause: 'APH 2024-27, clause 4.4',
            statusEffect: 'manual_review', viewer: 'document', page: 1, fieldKeys: [],
            evidence: [{ kind: 'structural', fact: 'Laboratories declared against the norm', values: [['Programme', 'B.Tech. Civil Engineering'], ['Declared', '4'], ['Required', '6']] }],
          })
        break
      case 'info-accreditation':
        if (acc)
          plant(acc.id, 'R-ACC-004', 'pass', {
            title: 'Accreditation lapses before the next cycle',
            reason: 'Accreditation is valid until 31 Dec 2028, so it will need renewal before the 2029-30 application.',
            category: 'Verification', severity: 'info', confidence: 1, checkVersion: 1,
            viewer: 'document', page: 1, fieldKeys: ['valid_until_printed'],
            evidence: [region(acc, 'valid_until_printed')],
          })
        break
      case 'xapp-faculty-mirror':
        plant(faculty.id, 'XAPP-FACULTY', 'fail', {
          title: 'Faculty member also listed by another institution',
          reason: `Faculty ID ${SHARED_FACULTY.id} on page 2 is also listed full-time by Sahyadri Institute of Technology, Pune. The AICTE roster shows this institution as the registered employer.`,
          category: 'Anomaly', severity: 'critical', confidence: 0.99, checkVersion: 1, aphClause: 'APH 2024-27, clause 5.1(d)',
          statusEffect: 'manual_review', viewer: 'cross', page: 2, fieldKeys: [`row_${SHARED_FACULTY.id}`],
          evidence: [
            region(faculty, `row_${SHARED_FACULTY.id}`),
            { kind: 'cross', otherAppId: FLAGSHIP.app.id, otherInstitution: 'Sahyadri Institute of Technology, Pune', otherDocumentId: `${FLAGSHIP.app.id}-D4`, matched: 'Faculty ID and name', similarity: 1 },
            { kind: 'record', source: 'AICTE faculty roster', recordId: SHARED_FACULTY.id, statement: `Registered full-time at ${DECCAN_NAME} (${DECCAN_PID}) since 12 Jul 2021.`, asOf: '30 Nov 2026' },
          ],
        })
        break
    }
  }

  // Checks
  const STD: Record<DocType, [string, number, CheckKind, string][]> = {
    fire_noc: [
      ['R-NOC-001', 2, 'Rule', 'Fire NOC valid on the first day of the academic year'],
      ['SRC-FIRE', 1, 'Source verification', `Confirm NOC number with ${st.fire}`],
      ['AUTH-PDF-SIG', 1, 'Authenticity', 'Digital signature valid'],
      ['AUTH-META', 1, 'Authenticity', 'File metadata consistent with issuer'],
    ],
    building_completion: [
      ['R-BCC-002', 1, 'Rule', 'Building completion certificate present'],
      ['R-CLS-010', 1, 'Rule', 'Classroom area per student'],
      ['AUTH-PDF-SIG', 1, 'Authenticity', 'Digital signature valid'],
      ['AUTH-PDF-INCREMENTAL', 1, 'Authenticity', 'No content added after signing'],
    ],
    accreditation: [
      ['R-ACC-004', 1, 'Rule', 'Accreditation valid through the academic year'],
      ['AUTH-QR-MATCH', 1, 'Authenticity', 'Printed values match QR payload'],
      ['AUTH-PDF-SIG', 1, 'Authenticity', 'Digital signature valid'],
    ],
    faculty_list: [
      ['R-FSR-005', 2, 'Rule', 'Faculty to student ratio at least 1:20'],
      ['R-PRN-006', 1, 'Rule', 'Principal holds the prescribed qualification'],
      ['XAPP-FACULTY', 1, 'Cross-application', 'Faculty IDs not listed by another application'],
      ['REC-FAC-ROSTER', 1, 'Reconciliation', 'Faculty IDs registered to this institution in the roster'],
    ],
    university_consent: [
      ['R-UNI-003', 1, 'Rule', 'University consent for the year being applied for'],
      ['R-INT-008', 1, 'Rule', 'Intake consistent with last approval'],
      ['SRC-UNIV', 1, 'Source verification', `Confirm consent with ${uni[0]}`],
      ['AUTH-PDF-SIG', 1, 'Authenticity', 'Digital signature valid'],
    ],
    ter_receipt: [
      ['R-TER-007', 1, 'Rule', 'Processing fee matches AICTE payment records'],
      ['REC-PAY', 1, 'Reconciliation', 'Transaction found in Bharat Kosh settlement file'],
    ],
    dte_noc: [
      ['R-DTE-015', 1, 'Rule', 'State government NOC within the intake applied for'],
      ['SRC-DTE', 1, 'Source verification', `Confirm NOC with ${st.dte}`],
      ['AUTH-PDF-SIG', 1, 'Authenticity', 'Digital signature valid'],
    ],
    affidavit: [
      ['R-AFF-013', 1, 'Rule', 'Affidavit signed and notarised'],
      ['R-COM-009', 1, 'Rule', 'Mandatory committees constituted'],
      ['R-WEB-014', 1, 'Rule', 'Mandatory disclosure published on the website'],
    ],
    land_document: [
      ['R-LND-012', 1, 'Rule', 'Land documents present'],
      ['SRC-LAND', 1, 'Source verification', `Confirm record with the ${s.state} land records service`],
    ],
    infra_photo: [
      ['XAPP-PHOTO', 1, 'Cross-application', 'Photo not reused from another application'],
      ['INFRA-EXIF', 1, 'Infrastructure', 'Photo taken within the last 12 months'],
      ['INFRA-GEO', 1, 'Infrastructure', 'Photo location inside the campus boundary'],
      ['R-LAB-011', 1, 'Rule', 'Laboratories per programme'],
    ],
  }
  const checks: CheckResult[] = []
  const push = (checkId: string, version: number, kind: CheckKind, title: string, outcome: CheckOutcome, documentId?: string, findingId?: string) => {
    checks.push({ id: `${s.id}-C${checks.length + 1}`, appId: s.id, checkId, version, kind, title, outcome, documentId, findingId, durationMs: durationFor(kind, outcome, rng) })
  }
  for (const d of docs) {
    if (s.pendingPhoto && d === photo2) continue
    for (const [checkId, version, kind, title] of STD[d.type]) {
      const hit = failing.get(`${d.id}|${checkId}`)
      if (hit) push(checkId, version, kind, title, hit.outcome, d.id, hit.findingId)
      else push(checkId, version, kind, title, 'pass', d.id)
    }
  }
  if (!acc) push('R-ACC-004', 1, 'Rule', 'Accreditation valid through the academic year (no accredited programmes declared)', 'na')
  if (!docs.some((d) => d.type === 'land_document')) push('R-LND-012', 1, 'Rule', 'Land documents present (on record since an earlier approval)', 'na')
  push('REC-PID', 1, 'Reconciliation', 'Permanent ID matches the AICTE institution register', 'pass')
  push('REC-LAST-APPROVAL', 1, 'Reconciliation', 'Programmes match the 2026-27 approval letter', 'pass')
  push('AUTH-DUP-HASH', 1, 'Authenticity', 'No file reused from another application', 'pass')

  return { app, documents: docs, checks, findings }
}

export const BUNDLES: AppBundle[] = [FLAGSHIP, ...SPECS.map(buildApp)]

// Alerts and audit history

const ALERT_FOR: Record<string, AlertType> = {
  Expired: 'Expired document',
  Verification: 'Pending source verification',
  Missing: 'Missing information',
}

export function alertTypeOf(f: Finding): AlertType | null {
  if (f.severity === 'info') return null
  if (f.checkId.startsWith('XAPP')) return 'Cross-application match'
  if (f.category === 'Anomaly' || f.category === 'Inconsistent') return 'Suspected anomaly'
  return ALERT_FOR[f.category] ?? null
}

export const ALERTS: Alert[] = BUNDLES.flatMap((b) =>
  b.findings.flatMap((f) => {
    const type = alertTypeOf(f)
    if (!type) return []
    const at = toIst(Date.parse(f.createdAt) + 60_000)
    return [{ id: `AL-${f.id}`, appId: b.app.id, type, text: f.title, at }]
  }),
).sort((a, b) => b.at.localeCompare(a.at))

const SYSTEM = { actor: 'Pramaan automated checks', role: 'System' }

function historyFor(b: AppBundle): Omit<AuditEventBody, 'seq'>[] {
  const out: Omit<AuditEventBody, 'seq'>[] = []
  const id = b.app.id
  const sub = Date.parse(b.app.submittedAt)
  out.push({ at: b.app.submittedAt, actor: 'Institution portal', role: 'Applicant', type: 'Application received', subjectId: id, appId: id, summary: `${b.app.category}, ${b.app.academicYear}, ${b.documents.length} documents, declared intake ${b.app.intake}` })
  b.documents.forEach((d, i) => {
    const late = Date.parse(d.uploadedAt) > sub
    out.push({
      at: late ? d.uploadedAt : toIst(sub + (i + 1) * 4000),
      actor: 'Pramaan ingestion',
      role: 'System',
      type: 'Document ingested',
      subjectId: d.id,
      appId: id,
      summary: `${d.typeLabel}, ${d.pages} ${d.pages === 1 ? 'page' : 'pages'}, sha256 ${d.sha256.slice(0, 12)}`,
    })
  })
  const t0 = sub + 70_000
  b.documents.forEach((doc, i) => {
    const cs = b.checks.filter((c) => c.documentId === doc.id && c.outcome !== 'na')
    if (!cs.length) return
    const failed = cs.filter((c) => c.outcome === 'fail' || c.outcome === 'error').length
    out.push({ at: toIst(t0 + i * 700), ...SYSTEM, type: 'Rule applied', subjectId: doc.id, appId: id, summary: `${doc.typeLabel}: ${cs.length} checks run, ${failed === 0 ? 'all passed' : `${failed} did not pass`}` })
  })
  const recs = b.checks.filter((c) => c.kind === 'Reconciliation')
  out.push({ at: toIst(t0 + 9000), ...SYSTEM, type: 'Record checked', subjectId: id, appId: id, summary: `${recs.length} AICTE records compared, ${recs.filter((c) => c.outcome === 'fail').length} differ` })
  b.checks
    .filter((c) => c.kind === 'Source verification' && c.outcome !== 'na')
    .forEach((c, i) => {
      const outcome = c.outcome === 'pass' ? 'confirmed' : c.outcome === 'error' ? 'no answer' : 'differs'
      out.push({ at: toIst(t0 + 15000 + i * 6000), actor: c.title.replace(/^Confirm .* with /, ''), role: 'Issuing authority', type: 'Source response', subjectId: c.documentId ?? id, appId: id, summary: `${c.checkId}: ${outcome}` })
    })
  b.findings.forEach((f) => {
    out.push({ at: f.createdAt, ...SYSTEM, type: 'Finding created', subjectId: f.id, appId: id, summary: `${f.severity}, ${f.checkId} v${f.checkVersion}: ${f.title}` })
  })
  ALERTS.filter((a) => a.appId === id).forEach((a) => {
    out.push({ at: a.at, ...SYSTEM, type: 'Alert raised', subjectId: a.id, appId: id, summary: `${a.type}: ${a.text}` })
  })
  return out
}

const RULE_EVENTS: Omit<AuditEventBody, 'seq'>[] = [
  { at: '2026-09-02T17:12:00+05:30', actor: 'R. Venkataraman', role: 'Rule administrator', type: 'Rule published', subjectId: 'R-NOC-001', summary: 'R-NOC-001 v2 published: compares validity with the start of the academic year' },
  { at: '2026-11-30T23:55:00+05:30', actor: 'AICTE faculty roster', role: 'System of record', type: 'Record checked', subjectId: 'ROSTER-2026-11-30', summary: 'Faculty roster snapshot loaded, 4,18,226 faculty IDs' },
]

export const BASE_AUDIT: AuditEventBody[] = [...RULE_EVENTS, ...BUNDLES.flatMap(historyFor)]
  .sort((a, b) => a.at.localeCompare(b.at))
  .map((e, i) => ({ ...e, seq: i + 1 }))

