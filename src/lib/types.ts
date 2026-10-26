// Domain types for Pramaan. Everything the UI shows is derived from these.

export type DocStatus =
  | 'verified'
  | 'mismatch'
  | 'expired'
  | 'pending'
  | 'source_unavailable'
  | 'manual_review'

export type Severity = 'info' | 'minor' | 'major' | 'critical'

export type FindingCategory =
  | 'Missing'
  | 'Expired'
  | 'Inconsistent'
  | 'Anomaly'
  | 'Non-compliant'
  | 'Verification'

export type ReviewState =
  | 'open'
  | 'confirmed'
  | 'dismissed'
  | 'rectification_requested'
  | 'inspection_recommended'

export type ReviewAction = 'confirm' | 'dismiss' | 'rectify' | 'inspect'

export type Region = 'Western' | 'Southern' | 'Northern' | 'Central' | 'South-Western' | 'South-Central' | 'North-West'

export type Category = 'Extension of approval' | 'Increase in intake' | 'New course'

/** Normalised 0–1 coordinates on the page. */
export interface BBox {
  x: number
  y: number
  w: number
  h: number
}

export type FieldKind = 'title' | 'subtitle' | 'ref' | 'para' | 'kv' | 'thead' | 'row' | 'sign' | 'stamp' | 'qr' | 'note'

export interface ExtractedField {
  key: string
  kind: FieldKind
  label?: string
  value: string
  cells?: string[]
  page: number
  bbox: BBox
}

export interface PhotoSpec {
  caption: string
  institution: string
  year: string
  mirrored?: boolean
  hueShift?: number
  rows: number
}

export type DocType =
  | 'fire_noc'
  | 'building_completion'
  | 'accreditation'
  | 'faculty_list'
  | 'university_consent'
  | 'ter_receipt'
  | 'dte_noc'
  | 'infra_photo'
  | 'land_document'
  | 'affidavit'

export interface AppDocument {
  id: string
  appId: string
  type: DocType
  typeLabel: string
  filename: string
  issuer: string
  issuerLine: string
  pages: number
  uploadedAt: string
  sha256: string
  fields: ExtractedField[]
  photo?: PhotoSpec
  /** A real file an institution uploaded through the portal (kept in IndexedDB under the document id). */
  upload?: { name: string; size: number; mime: string }
}

export type CheckKind =
  | 'Rule'
  | 'Reconciliation'
  | 'Authenticity'
  | 'Source verification'
  | 'Cross-application'
  | 'Infrastructure'

export type CheckOutcome = 'pass' | 'fail' | 'na' | 'error'

export interface CheckResult {
  id: string
  appId: string
  checkId: string
  version: number
  kind: CheckKind
  title: string
  outcome: CheckOutcome
  documentId?: string
  durationMs: number
  /** When this check raised a finding, the finding decides the document status instead of the check. */
  findingId?: string
}

export type Evidence =
  | { kind: 'region'; documentId: string; page: number; fieldKey: string; observed: string }
  | { kind: 'record'; source: string; recordId: string; statement: string; asOf: string }
  | {
      kind: 'issuer'
      sourceName: string
      requestRef: string
      summary: string
      at: string
      responseHash: string
      outcome: 'Confirmed' | 'Timed out' | 'Error' | 'Differs'
    }
  | {
      kind: 'cross'
      otherAppId: string
      otherInstitution: string
      otherDocumentId?: string
      otherPhoto?: PhotoSpec
      matched: string
      similarity: number
    }
  | { kind: 'structural'; fact: string; values: [string, string][] }

export type ViewerMode = 'document' | 'cross' | 'photo' | 'revision'

export interface Finding {
  id: string
  appId: string
  documentId: string
  title: string
  reason: string
  category: FindingCategory
  severity: Severity
  confidence: number
  checkId: string
  checkVersion: number
  aphClause?: string
  /** The document status this finding argues for while it is active. */
  statusEffect?: Exclude<DocStatus, 'verified' | 'pending'>
  viewer: ViewerMode
  page: number
  fieldKeys: string[]
  evidence: Evidence[]
  createdAt: string
  revision?: { signedBytes: number; addedBytes: number }
}

export interface Application {
  id: string
  institution: string
  city: string
  state: string
  region: Region
  permanentId: string
  category: Category
  academicYear: string
  submittedAt: string
  assignedOfficer: string
  intake: number
  faculty: number
}

export type AlertType =
  | 'Missing information'
  | 'Expired document'
  | 'Pending source verification'
  | 'Suspected anomaly'
  | 'Cross-application match'

export interface Alert {
  id: string
  appId: string
  type: AlertType
  text: string
  at: string
}

export interface RuleVersion {
  version: number
  severity: Severity
  message: string
  logic: string
  change: string
  approvedBy?: string
  approvedAt?: string
  status: 'Live' | 'Draft' | 'Retired'
}

export interface Rule {
  id: string
  title: string
  clause: string
  edition: string
  appliesTo: string
  versions: RuleVersion[]
}

export type AuditType =
  | 'Application received'
  | 'Document ingested'
  | 'Rule applied'
  | 'Record checked'
  | 'Source response'
  | 'Finding created'
  | 'Alert raised'
  | 'Review action'
  | 'Rule published'

export interface AuditEventBody {
  seq: number
  at: string
  actor: string
  role: string
  type: AuditType
  subjectId: string
  appId?: string
  summary: string
}

export interface AuditEvent extends AuditEventBody {
  prevHash: string
  hash: string
}

export interface Review {
  state: ReviewState
  reason?: string
  message?: string
  at: string
  actor: string
}

export type Role = 'Scrutiny officer' | 'Rule administrator'
