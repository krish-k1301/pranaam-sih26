// Templates for the documents colleges upload. Each template lays its text out as fields with
// normalised bounding boxes, the same shape an extraction service would return.
import type { AppDocument, DocType, ExtractedField, FieldKind, PhotoSpec } from '../lib/types'
import { DESIGNATIONS, QUALS, fakeSha, int, personName, pick, rngFor } from './seed'

export interface InstCtx {
  appId: string
  institution: string
  city: string
  state: string
  address: string
  permanentId: string
  intake: number
  faculty: number
}

interface Line {
  key: string
  kind: FieldKind
  label?: string
  value: string
  cells?: string[]
  x?: number
  w?: number
  h?: number
  /** Sit on the same line as the previous entry instead of below it. */
  inline?: boolean
}

const HEIGHT: Record<FieldKind, number> = {
  title: 0.042,
  subtitle: 0.026,
  ref: 0.026,
  para: 0,
  kv: 0.028,
  thead: 0.03,
  row: 0.028,
  sign: 0.075,
  stamp: 0.105,
  qr: 0.125,
  note: 0.024,
}

const GAP: Partial<Record<FieldKind, number>> = { title: 0.012, para: 0.014, thead: 0.002, row: 0.002, kv: 0.006 }

/** Assign each line a bounding box, top to bottom, inside the page margins. */
export function layoutPage(page: number, lines: Line[], startY = 0.17): ExtractedField[] {
  const out: ExtractedField[] = []
  let y = startY
  let prevY = startY
  for (const l of lines) {
    const x = l.x ?? 0.09
    const w = l.w ?? 0.82
    const h = l.h ?? (l.kind === 'para' ? Math.ceil(l.value.length / Math.floor(78 * w / 0.82)) * 0.0215 + 0.004 : HEIGHT[l.kind])
    const top = l.inline ? prevY : y
    out.push({
      key: l.key,
      kind: l.kind,
      label: l.label,
      value: l.value,
      cells: l.cells,
      page,
      bbox: { x, y: round(top), w, h: round(h) },
    })
    prevY = top
    y = Math.max(y, top + h + (GAP[l.kind] ?? 0.008))
  }
  return out
}

const round = (n: number) => Math.round(n * 10000) / 10000

function doc(
  ctx: InstCtx,
  type: DocType,
  n: number,
  parts: Omit<AppDocument, 'id' | 'appId' | 'type' | 'sha256' | 'uploadedAt'> & { uploadedAt: string },
): AppDocument {
  const id = `${ctx.appId}-D${n}`
  return { id, appId: ctx.appId, type, sha256: fakeSha(id), ...parts }
}

const fmt = (d: Date) =>
  `${String(d.getUTCDate()).padStart(2, '0')}.${String(d.getUTCMonth() + 1).padStart(2, '0')}.${d.getUTCFullYear()}`

export function fireNoc(
  ctx: InstCtx,
  n: number,
  o: { authority: string; authorityLine: string; nocNo: string; issued: string; validUntil: string; uploadedAt: string; area: string; floors: string },
): AppDocument {
  const fields = layoutPage(1, [
    { key: 'title', kind: 'title', value: 'Fire No Objection Certificate' },
    { key: 'noc_number', kind: 'ref', label: 'noc_number', value: `NOC No. ${o.nocNo}` },
    { key: 'issue_date', kind: 'ref', label: 'issue_date', value: `Date: ${o.issued}`, x: 0.6, w: 0.31, inline: true },
    {
      key: 'body',
      kind: 'para',
      value:
        'This is to certify that the premises described below were inspected by this office and found to comply with the fire prevention and life safety measures required for the stated occupancy, subject to the conditions overleaf.',
    },
    { key: 'occupier', kind: 'kv', label: 'Name of occupier', value: ctx.institution },
    { key: 'address', kind: 'kv', label: 'Premises', value: ctx.address },
    { key: 'occupancy', kind: 'kv', label: 'Occupancy', value: 'Educational, Group B' },
    { key: 'builtup_area', kind: 'kv', label: 'Built-up area', value: o.area },
    { key: 'floors', kind: 'kv', label: 'Floors', value: o.floors },
    { key: 'valid_until', kind: 'kv', label: 'Valid until', value: o.validUntil },
    {
      key: 'conditions',
      kind: 'para',
      value:
        'Conditions: fire extinguishers and hydrant system to be maintained in working order; evacuation drill to be held twice a year; this certificate must be renewed before the date of expiry.',
    },
    { key: 'signatory', kind: 'sign', label: 'signatory', value: 'Chief Fire Officer', x: 0.56, w: 0.35 },
    { key: 'seal', kind: 'stamp', value: o.authority, x: 0.12, w: 0.2, inline: true },
  ])
  return doc(ctx, 'fire_noc', n, {
    typeLabel: 'Fire NOC',
    filename: `fire_noc_${o.nocNo.split('/').pop()}.pdf`,
    issuer: o.authority,
    issuerLine: o.authorityLine,
    pages: 1,
    uploadedAt: o.uploadedAt,
    fields,
  })
}

export function buildingCompletion(
  ctx: InstCtx,
  n: number,
  o: { authority: string; authorityLine: string; certNo: string; issued: string; uploadedAt: string; area: string; floors: string; addedFloors?: boolean; classroomArea?: number },
): AppDocument {
  const p1 = layoutPage(1, [
    { key: 'title', kind: 'title', value: 'Building Completion Certificate' },
    { key: 'cert_number', kind: 'ref', label: 'cert_number', value: `Certificate No. ${o.certNo}` },
    { key: 'issue_date', kind: 'ref', label: 'issue_date', value: `Date: ${o.issued}`, x: 0.6, w: 0.31, inline: true },
    {
      key: 'body',
      kind: 'para',
      value:
        'Certified that the building described below has been completed in accordance with the sanctioned plan and the development control regulations in force, and is fit for occupation for the purpose stated.',
    },
    { key: 'owner', kind: 'kv', label: 'Owner', value: `${ctx.institution} (through its trust)` },
    { key: 'site', kind: 'kv', label: 'Site', value: ctx.address },
    { key: 'use', kind: 'kv', label: 'Permitted use', value: 'Educational institution' },
    { key: 'builtup_area', kind: 'kv', label: 'Built-up area', value: o.area },
    { key: 'floors', kind: 'kv', label: 'Floors', value: o.floors },
    { key: 'plan_ref', kind: 'kv', label: 'Sanctioned plan', value: `BP/${ctx.city.slice(0, 3).toUpperCase()}/2019/1187` },
  ])
  const p2Lines: Line[] = [
    { key: 'schedule_title', kind: 'subtitle', value: 'Schedule of floors' },
    { key: 'sched_head', kind: 'thead', value: '', cells: ['Floor', 'Use', 'Area (sq m)'] },
    { key: 'sched_g', kind: 'row', value: '', cells: ['Ground', 'Administration, library', '3,920'] },
    { key: 'sched_1', kind: 'row', label: 'classroom_area', value: '', cells: ['First', 'Classrooms', (o.classroomArea ?? 3840).toLocaleString('en-IN')] },
    { key: 'sched_2', kind: 'row', value: '', cells: ['Second', 'Laboratories', '3,840'] },
    { key: 'sched_3', kind: 'row', value: '', cells: ['Third', 'Laboratories, drawing hall', '3,520'] },
  ]
  if (o.addedFloors) {
    p2Lines.push({ key: 'added_floor', kind: 'row', label: 'added_after_signing', value: '', cells: ['Fourth', 'Seminar hall, classrooms', '3,520'] })
  }
  p2Lines.push(
    { key: 'p2_note', kind: 'para', value: 'This certificate is issued on the basis of the site inspection report and the structural stability certificate submitted by the licensed engineer.' },
    { key: 'signatory', kind: 'sign', label: 'signatory', value: 'Executive Engineer, Building Permission', x: 0.5, w: 0.41 },
    { key: 'seal', kind: 'stamp', value: o.authority, x: 0.12, w: 0.2, inline: true },
  )
  return doc(ctx, 'building_completion', n, {
    typeLabel: 'Building completion certificate',
    filename: `building_completion_${o.certNo.replace(/\//g, '_')}.pdf`,
    issuer: o.authority,
    issuerLine: o.authorityLine,
    pages: 2,
    uploadedAt: o.uploadedAt,
    fields: [...p1, ...layoutPage(2, p2Lines, 0.1)],
  })
}

export function accreditation(
  ctx: InstCtx,
  n: number,
  o: { certNo: string; printedValid: string; qrValid: string; programmes: string[]; uploadedAt: string },
): AppDocument {
  const fields = layoutPage(1, [
    { key: 'title', kind: 'title', value: 'Certificate of Accreditation' },
    { key: 'cert_number', kind: 'ref', label: 'cert_number', value: `Ref. ${o.certNo}` },
    {
      key: 'body',
      kind: 'para',
      value: `The programmes listed below offered by ${ctx.institution} are accredited under the Tier I framework, on the recommendation of the evaluation team and the decision of the accreditation committee.`,
    },
    { key: 'prog_head', kind: 'thead', value: '', cells: ['Programme', 'Level', 'Status'] },
    ...o.programmes.map((p, i) => ({ key: `prog_${i}`, kind: 'row' as const, value: '', cells: [p, 'UG', 'Accredited'] })),
    { key: 'valid_until_printed', kind: 'kv', label: 'Valid till', value: o.printedValid },
    { key: 'signatory', kind: 'sign', label: 'signatory', value: 'Member Secretary', x: 0.56, w: 0.35 },
    { key: 'qr_payload', kind: 'qr', label: 'qr_payload', value: `valid_to=${o.qrValid}`, x: 0.09, w: 0.17, inline: true },
  ])
  return doc(ctx, 'accreditation', n, {
    typeLabel: 'Accreditation certificate',
    filename: `nba_accreditation_${o.certNo.split('/').pop()}.pdf`,
    issuer: 'National Board of Accreditation',
    issuerLine: 'New Delhi',
    pages: 1,
    uploadedAt: o.uploadedAt,
    fields,
  })
}

export interface FacultyMember {
  id: string
  name: string
  designation: string
  qual: string
  joined: string
}

export function makeFaculty(key: string, count: number, idBase: number): FacultyMember[] {
  const rng = rngFor(`fac:${key}`)
  return Array.from({ length: count }, (_, i) => ({
    id: `1-FAC-${idBase + i * 7 + int(rng, 0, 5)}`,
    name: `${i < 2 ? 'Dr. ' : rng() > 0.6 ? 'Dr. ' : ''}${personName(rng)}`,
    designation: i === 0 ? 'Principal' : pick(rng, DESIGNATIONS),
    qual: i < 2 ? 'Ph.D.' : pick(rng, QUALS),
    joined: fmt(new Date(Date.UTC(int(rng, 2009, 2025), int(rng, 0, 11), int(rng, 1, 28)))),
  }))
}

export function facultyList(ctx: InstCtx, n: number, members: FacultyMember[], uploadedAt: string): AppDocument {
  const perPage = 9
  const pages = Math.max(1, Math.ceil(members.length / perPage))
  const fields: ExtractedField[] = []
  for (let p = 0; p < pages; p++) {
    const slice = members.slice(p * perPage, (p + 1) * perPage)
    const lines: Line[] = []
    if (p === 0) {
      lines.push(
        { key: 'title', kind: 'title', value: 'Faculty List, Full-time Teaching Staff' },
        { key: 'year', kind: 'ref', label: 'academic_year', value: 'Academic year 2027-28' },
        { key: 'declared_count', kind: 'ref', label: 'declared_count', value: `Declared strength: ${members.length}`, x: 0.6, w: 0.31, inline: true },
      )
    } else {
      lines.push({ key: `cont_${p}`, kind: 'subtitle', value: `Faculty list, continued (page ${p + 1})` })
    }
    lines.push({ key: `head_${p}`, kind: 'thead', value: '', cells: ['Faculty ID', 'Name', 'Designation', 'Qual.', 'Joined'] })
    for (const m of slice) {
      lines.push({ key: `row_${m.id}`, kind: 'row', label: 'faculty_id', value: m.id, cells: [m.id, m.name, m.designation, m.qual, m.joined] })
    }
    if (p === pages - 1) {
      lines.push({ key: 'certify', kind: 'para', value: 'Certified that the above faculty members are on the full-time rolls of the institution and are not employed full-time elsewhere.' })
      lines.push({ key: 'signatory', kind: 'sign', label: 'signatory', value: 'Principal', x: 0.6, w: 0.31 })
    }
    fields.push(...layoutPage(p + 1, lines, p === 0 ? 0.17 : 0.1))
  }
  return doc(ctx, 'faculty_list', n, {
    typeLabel: 'Faculty list',
    filename: 'faculty_list_2027-28.pdf',
    issuer: ctx.institution,
    issuerLine: `${ctx.city}, ${ctx.state} · AICTE permanent ID ${ctx.permanentId}`,
    pages,
    uploadedAt,
    fields,
  })
}

export function universityConsent(
  ctx: InstCtx,
  n: number,
  o: { university: string; universityLine: string; refNo: string; year: string; intakeConsented: number; uploadedAt: string },
): AppDocument {
  const fields = layoutPage(1, [
    { key: 'title', kind: 'title', value: 'Consent of Affiliation' },
    { key: 'ref_number', kind: 'ref', label: 'ref_number', value: `No. ${o.refNo}` },
    {
      key: 'body',
      kind: 'para',
      value: `The University conveys its consent to continue the affiliation of ${ctx.institution}, ${ctx.city}, for the programmes and intake below, subject to approval by the All India Council for Technical Education.`,
    },
    { key: 'consent_year', kind: 'kv', label: 'Academic year', value: o.year },
    { key: 'consented_intake', kind: 'kv', label: 'Total intake consented', value: String(o.intakeConsented) },
    { key: 'conditions', kind: 'para', value: 'The college shall maintain the faculty, infrastructure and fee norms prescribed by the University and the Council throughout the period of affiliation.' },
    { key: 'signatory', kind: 'sign', label: 'signatory', value: 'Registrar', x: 0.6, w: 0.31 },
    { key: 'seal', kind: 'stamp', value: o.university, x: 0.12, w: 0.2, inline: true },
  ])
  return doc(ctx, 'university_consent', n, {
    typeLabel: 'University consent',
    filename: `university_consent_${o.year}.pdf`,
    issuer: o.university,
    issuerLine: o.universityLine,
    pages: 1,
    uploadedAt: o.uploadedAt,
    fields,
  })
}

export function terReceipt(ctx: InstCtx, n: number, o: { txn: string; amount: string; paidOn: string; uploadedAt: string }): AppDocument {
  const fields = layoutPage(1, [
    { key: 'title', kind: 'title', value: 'Payment Receipt' },
    { key: 'txn_ref', kind: 'ref', label: 'txn_ref', value: `Transaction ${o.txn}` },
    { key: 'payer', kind: 'kv', label: 'Received from', value: ctx.institution },
    { key: 'pid', kind: 'kv', label: 'Permanent ID', value: ctx.permanentId },
    { key: 'purpose', kind: 'kv', label: 'Towards', value: 'Processing fee, extension of approval 2027-28' },
    { key: 'amount', kind: 'kv', label: 'Amount', value: o.amount },
    { key: 'paid_on', kind: 'kv', label: 'Paid on', value: o.paidOn },
    { key: 'mode', kind: 'kv', label: 'Mode', value: 'Online, Bharat Kosh' },
    { key: 'note', kind: 'note', value: 'This is a system generated receipt and does not require a signature.' },
  ])
  return doc(ctx, 'ter_receipt', n, {
    typeLabel: 'TER receipt',
    filename: `ter_receipt_${o.txn}.pdf`,
    issuer: 'All India Council for Technical Education',
    issuerLine: 'Accounts division · New Delhi',
    pages: 1,
    uploadedAt: o.uploadedAt,
    fields,
  })
}

export function dteNoc(ctx: InstCtx, n: number, o: { directorate: string; directorateLine: string; refNo: string; issued: string; uploadedAt: string; cap?: number }): AppDocument {
  const fields = layoutPage(1, [
    { key: 'title', kind: 'title', value: 'No Objection Certificate' },
    { key: 'ref_number', kind: 'ref', label: 'ref_number', value: `No. ${o.refNo}` },
    { key: 'issue_date', kind: 'ref', label: 'issue_date', value: `Date: ${o.issued}`, x: 0.6, w: 0.31, inline: true },
    { key: 'subject', kind: 'kv', label: 'Subject', value: 'Extension of approval for 2027-28' },
    {
      key: 'body',
      kind: 'para',
      value: `The State Government has no objection to the continuation of ${ctx.institution}, ${ctx.city}, for the academic year 2027-28 with the existing programmes and an intake not exceeding ${o.cap ?? ctx.intake}.`,
    },
    { key: 'intake_cap', kind: 'kv', label: 'intake_cap', value: String(o.cap ?? ctx.intake) },
    { key: 'signatory', kind: 'sign', label: 'signatory', value: 'Joint Director', x: 0.6, w: 0.31 },
    { key: 'seal', kind: 'stamp', value: o.directorate, x: 0.12, w: 0.2, inline: true },
  ])
  return doc(ctx, 'dte_noc', n, {
    typeLabel: 'State DTE NOC',
    filename: `dte_noc_${o.refNo.split('/').pop()}.pdf`,
    issuer: o.directorate,
    issuerLine: o.directorateLine,
    pages: 1,
    uploadedAt: o.uploadedAt,
    fields,
  })
}

export function landDocument(ctx: InstCtx, n: number, o: { surveyNo: string; area: string; uploadedAt: string }): AppDocument {
  const fields = layoutPage(1, [
    { key: 'title', kind: 'title', value: 'Record of Rights, Land Extract' },
    { key: 'survey', kind: 'ref', label: 'survey_number', value: `Survey No. ${o.surveyNo}` },
    { key: 'village', kind: 'kv', label: 'Village / taluka', value: ctx.city },
    { key: 'holder', kind: 'kv', label: 'Holder', value: `Trust managing ${ctx.institution}` },
    { key: 'land_area', kind: 'kv', label: 'Area', value: o.area },
    { key: 'tenure', kind: 'kv', label: 'Tenure', value: 'Freehold, non-agricultural use permitted' },
    { key: 'encumbrance', kind: 'kv', label: 'Encumbrance', value: 'Nil' },
    { key: 'signatory', kind: 'sign', label: 'signatory', value: 'Talathi / Revenue officer', x: 0.56, w: 0.35 },
  ])
  return doc(ctx, 'land_document', n, {
    typeLabel: 'Land document',
    filename: `land_record_${o.surveyNo.replace(/\//g, '-')}.pdf`,
    issuer: 'Revenue Department',
    issuerLine: `Government of ${ctx.state}`,
    pages: 1,
    uploadedAt: o.uploadedAt,
    fields,
  })
}

export function affidavit(
  ctx: InstCtx,
  n: number,
  o: { committees: string[]; website: string; signed: boolean; uploadedAt: string },
): AppDocument {
  const fields = layoutPage(1, [
    { key: 'title', kind: 'title', value: 'Affidavit' },
    { key: 'stamp_paper', kind: 'ref', label: 'stamp_paper', value: 'On non-judicial stamp paper of ₹100' },
    {
      key: 'body',
      kind: 'para',
      value: `I, the Chairman of the trust managing ${ctx.institution}, solemnly affirm that the information submitted in the application for extension of approval for 2027-28 is true, and that the institution complies with the norms of the Approval Process Handbook.`,
    },
    { key: 'committees', kind: 'kv', label: 'Committees constituted', value: o.committees.join(', ') },
    { key: 'website', kind: 'kv', label: 'Mandatory disclosure at', value: o.website },
    { key: 'deponent_sign', kind: 'sign', label: 'deponent_signature', value: o.signed ? 'Chairman, deponent' : '(signature space blank)', x: 0.56, w: 0.35 },
    { key: 'notary', kind: 'stamp', value: 'Notary Public', x: 0.12, w: 0.2, inline: true },
  ])
  return doc(ctx, 'affidavit', n, {
    typeLabel: 'Affidavit',
    filename: 'affidavit_2027-28.pdf',
    issuer: 'Before the Notary Public',
    issuerLine: `${ctx.city}, ${ctx.state}`,
    pages: 1,
    uploadedAt: o.uploadedAt,
    fields,
  })
}

export function infraPhoto(ctx: InstCtx, n: number, photo: PhotoSpec, uploadedAt: string): AppDocument {
  return doc(ctx, 'infra_photo', n, {
    typeLabel: 'Infrastructure photo',
    filename: `${photo.caption.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.jpg`,
    issuer: ctx.institution,
    issuerLine: 'Uploaded by the institution',
    pages: 1,
    uploadedAt,
    fields: [],
    photo,
  })
}
