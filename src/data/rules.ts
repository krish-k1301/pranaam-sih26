import type { Rule } from '../lib/types'

const ED = 'APH 2024-27'
const ADMIN = 'R. Venkataraman, Rule administrator'

export const RULES: Rule[] = [
  {
    id: 'R-NOC-001',
    title: 'Fire NOC valid on the first day of the academic year',
    clause: 'Clause 2.4.3(f)',
    edition: ED,
    appliesTo: 'Fire NOC',
    versions: [
      {
        version: 1,
        severity: 'major',
        status: 'Retired',
        message: 'Fire NOC {noc_number} has expired on {valid_until}.',
        logic: `{"<": [{"var": "doc.fire_noc.valid_until"}, {"var": "application.submitted_at"}]}`,
        change: 'First version: compared validity with the submission date.',
        approvedBy: ADMIN,
        approvedAt: '2025-01-14',
      },
      {
        version: 2,
        severity: 'major',
        status: 'Live',
        message: 'Fire NOC {noc_number} is valid until {valid_until}, before the academic year starts on {academic_year_start}.',
        logic: `{"<": [
  {"var": "doc.fire_noc.valid_until"},
  {"var": "application.academic_year_start"}
]}`,
        change: 'Compares validity with the start of the academic year, not the submission date (APH 2024-27 corrigendum 2).',
        approvedBy: ADMIN,
        approvedAt: '2026-09-02',
      },
    ],
  },
  {
    id: 'R-BCC-002',
    title: 'Building completion certificate present',
    clause: 'Clause 2.4.3(c)',
    edition: ED,
    appliesTo: 'Building completion certificate',
    versions: [
      {
        version: 1,
        severity: 'major',
        status: 'Live',
        message: 'No building completion certificate was uploaded for the declared built-up area of {builtup_area}.',
        logic: `{"!": {"some": [{"var": "documents"}, {"==": [{"var": "type"}, "building_completion"]}]}}`,
        change: 'First version.',
        approvedBy: ADMIN,
        approvedAt: '2025-01-14',
      },
    ],
  },
  {
    id: 'R-UNI-003',
    title: 'University consent for the year being applied for',
    clause: 'Clause 2.5.1',
    edition: ED,
    appliesTo: 'University consent',
    versions: [
      {
        version: 1,
        severity: 'major',
        status: 'Live',
        message: 'University consent is for {consent_year}, not {academic_year}.',
        logic: `{"!=": [{"var": "doc.university_consent.consent_year"}, {"var": "application.academic_year"}]}`,
        change: 'First version.',
        approvedBy: ADMIN,
        approvedAt: '2025-01-14',
      },
    ],
  },
  {
    id: 'R-ACC-004',
    title: 'Accreditation valid through the academic year',
    clause: 'Clause 1.3.2',
    edition: ED,
    appliesTo: 'Accreditation certificate',
    versions: [
      {
        version: 1,
        severity: 'minor',
        status: 'Live',
        message: 'Accreditation {cert_number} lapses on {valid_until}, during the academic year.',
        logic: `{"<": [{"var": "doc.accreditation.valid_until"}, {"var": "application.academic_year_end"}]}`,
        change: 'First version.',
        approvedBy: ADMIN,
        approvedAt: '2025-01-14',
      },
    ],
  },
  {
    id: 'R-FSR-005',
    title: 'Faculty to student ratio at least 1:20',
    clause: 'Clause 5.1, Table 5.1',
    edition: ED,
    appliesTo: 'Faculty list',
    versions: [
      {
        version: 1,
        severity: 'major',
        status: 'Retired',
        message: 'Faculty strength {faculty} is below the required {required} for intake {intake}.',
        logic: `{"<": [{"var": "faculty_count"}, {"/": [{"var": "intake"}, 15]}]}`,
        change: 'First version used 1:15.',
        approvedBy: ADMIN,
        approvedAt: '2024-12-02',
      },
      {
        version: 2,
        severity: 'major',
        status: 'Live',
        message: 'Faculty strength {faculty} is below the {required} required for an intake of {intake} at 1:20.',
        logic: `{"<": [
  {"var": "doc.faculty_list.count"},
  {"ceil": {"/": [{"var": "application.intake"}, 20]}}
]}`,
        change: 'Ratio changed from 1:15 to 1:20, as in APH 2024-27.',
        approvedBy: ADMIN,
        approvedAt: '2025-03-18',
      },
    ],
  },
  {
    id: 'R-PRN-006',
    title: 'Principal holds the prescribed qualification',
    clause: 'Clause 5.6',
    edition: ED,
    appliesTo: 'Faculty list',
    versions: [
      {
        version: 1,
        severity: 'major',
        status: 'Live',
        message: 'The principal listed, {name}, does not show a Ph.D. in the faculty list.',
        logic: `{"!": {"in": ["Ph.D.", {"var": "doc.faculty_list.principal.qualification"}]}}`,
        change: 'First version.',
        approvedBy: ADMIN,
        approvedAt: '2025-01-14',
      },
    ],
  },
  {
    id: 'R-TER-007',
    title: 'Processing fee matches AICTE payment records',
    clause: 'Clause 2.2, Appendix 2',
    edition: ED,
    appliesTo: 'TER receipt',
    versions: [
      {
        version: 1,
        severity: 'major',
        status: 'Live',
        message: 'Receipt shows {amount}; AICTE payment records show {recorded_amount} for transaction {txn_ref}.',
        logic: `{"!=": [{"var": "doc.ter_receipt.amount"}, {"var": "records.payments.amount"}]}`,
        change: 'First version.',
        approvedBy: ADMIN,
        approvedAt: '2025-01-14',
      },
    ],
  },
  {
    id: 'R-INT-008',
    title: 'Intake consistent with last approval',
    clause: 'Clause 3.1',
    edition: ED,
    appliesTo: 'Application, university consent',
    versions: [
      {
        version: 1,
        severity: 'major',
        status: 'Live',
        message: 'Declared intake {intake} differs from the {approved} approved last year without an increase-in-intake request.',
        logic: `{"and": [
  {"!=": [{"var": "application.intake"}, {"var": "records.last_approval.intake"}]},
  {"!=": [{"var": "application.category"}, "Increase in intake"]}
]}`,
        change: 'First version.',
        approvedBy: ADMIN,
        approvedAt: '2025-01-14',
      },
    ],
  },
  {
    id: 'R-COM-009',
    title: 'Mandatory committees constituted',
    clause: 'Clause 6.2',
    edition: ED,
    appliesTo: 'Affidavit',
    versions: [
      {
        version: 1,
        severity: 'minor',
        status: 'Live',
        message: 'The affidavit does not list the {missing} committee.',
        logic: `{"!": {"all": [
  ["Anti-ragging", "Internal Complaints", "SC/ST", "Grievance redressal"],
  {"in": [{"var": ""}, {"var": "doc.affidavit.committees"}]}
]}}`,
        change: 'First version.',
        approvedBy: ADMIN,
        approvedAt: '2025-01-14',
      },
      {
        version: 2,
        severity: 'minor',
        status: 'Draft',
        message: 'The affidavit does not list the {missing} committee, required under clause 6.2.',
        logic: `{"!": {"all": [
  ["Anti-ragging", "Internal Complaints", "SC/ST", "Grievance redressal", "Student welfare"],
  {"in": [{"var": ""}, {"var": "doc.affidavit.committees"}]}
]}}`,
        change: 'Adds the student welfare committee. Awaiting approval.',
      },
    ],
  },
  {
    id: 'R-CLS-010',
    title: 'Classroom area per student',
    clause: 'Clause 4.3, Table 4.2',
    edition: ED,
    appliesTo: 'Infrastructure declaration',
    versions: [
      {
        version: 1,
        severity: 'minor',
        status: 'Live',
        message: 'Declared classroom area gives {per_student} sq m per student, below the 1.1 sq m required.',
        logic: `{"<": [{"/": [{"var": "infra.classroom_area"}, {"var": "application.intake"}]}, 1.1]}`,
        change: 'First version.',
        approvedBy: ADMIN,
        approvedAt: '2025-01-14',
      },
    ],
  },
  {
    id: 'R-LAB-011',
    title: 'Laboratories per programme',
    clause: 'Clause 4.4',
    edition: ED,
    appliesTo: 'Infrastructure declaration',
    versions: [
      {
        version: 1,
        severity: 'minor',
        status: 'Live',
        message: '{programme} declares {labs} laboratories; at least {required} are required.',
        logic: `{"some": [{"var": "programmes"}, {"<": [{"var": "labs"}, {"var": "required_labs"}]}]}`,
        change: 'First version.',
        approvedBy: ADMIN,
        approvedAt: '2025-01-14',
      },
    ],
  },
  {
    id: 'R-LND-012',
    title: 'Land documents present',
    clause: 'Clause 2.4.3(a)',
    edition: ED,
    appliesTo: 'Land document',
    versions: [
      {
        version: 1,
        severity: 'major',
        status: 'Live',
        message: 'No land ownership or lease document was uploaded.',
        logic: `{"!": {"some": [{"var": "documents"}, {"==": [{"var": "type"}, "land_document"]}]}}`,
        change: 'First version.',
        approvedBy: ADMIN,
        approvedAt: '2025-01-14',
      },
    ],
  },
  {
    id: 'R-AFF-013',
    title: 'Affidavit signed and notarised',
    clause: 'Clause 2.4.4',
    edition: ED,
    appliesTo: 'Affidavit',
    versions: [
      {
        version: 1,
        severity: 'minor',
        status: 'Live',
        message: 'The deponent signature space on the affidavit is blank.',
        logic: `{"or": [
  {"!": {"var": "doc.affidavit.deponent_signature"}},
  {"!": {"var": "doc.affidavit.notary_seal"}}
]}`,
        change: 'First version.',
        approvedBy: ADMIN,
        approvedAt: '2025-01-14',
      },
    ],
  },
  {
    id: 'R-WEB-014',
    title: 'Mandatory disclosure published on the website',
    clause: 'Clause 7.1',
    edition: ED,
    appliesTo: 'Affidavit, website',
    versions: [
      {
        version: 1,
        severity: 'minor',
        status: 'Live',
        message: 'The disclosure page {website} did not respond or did not list the fee structure.',
        logic: `{"or": [
  {"!=": [{"var": "web.disclosure.status"}, 200]},
  {"!": {"in": ["fee", {"var": "web.disclosure.sections"}]}}
]}`,
        change: 'First version.',
        approvedBy: ADMIN,
        approvedAt: '2025-01-14',
      },
    ],
  },
  {
    id: 'R-DTE-015',
    title: 'State government NOC within the intake applied for',
    clause: 'Clause 2.5.2',
    edition: ED,
    appliesTo: 'State DTE NOC',
    versions: [
      {
        version: 1,
        severity: 'major',
        status: 'Live',
        message: 'State NOC caps intake at {intake_cap}; the application declares {intake}.',
        logic: `{"<": [{"var": "doc.dte_noc.intake_cap"}, {"var": "application.intake"}]}`,
        change: 'First version.',
        approvedBy: ADMIN,
        approvedAt: '2025-01-14',
      },
    ],
  },
]

export const RULE_ADMIN = ADMIN
