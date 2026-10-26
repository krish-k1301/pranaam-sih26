// The AICTE institution register the portal verifies against: name and permanent ID must both match.
import type { Region } from '../lib/types'
import { BUNDLES } from './generate'

export interface RegisteredInstitution {
  permanentId: string
  name: string
  city: string
  state: string
  region: Region
  address: string
}

/** Institutions that have not yet applied for 2027-28. */
const NOT_YET_APPLIED: RegisteredInstitution[] = [
  { permanentId: '1-4410084461', name: 'Vindhya Institute of Technology', city: 'Indore', state: 'Madhya Pradesh', region: 'Central', address: 'AB Road, Rau, Indore 453331' },
  { permanentId: '1-4410029915', name: 'Krishna Valley College of Engineering', city: 'Karad', state: 'Maharashtra', region: 'Western', address: 'Vidyanagar, Karad 415124' },
  { permanentId: '1-4410090374', name: 'Mahanadi Institute of Engineering', city: 'Raipur', state: 'Chhattisgarh', region: 'Central', address: 'Old Dhamtari Road, Raipur 492015' },
  { permanentId: '1-4410078823', name: 'Periyar College of Technology', city: 'Salem', state: 'Tamil Nadu', region: 'Southern', address: 'Omalur Main Road, Salem 636011' },
]

export const REGISTRY: RegisteredInstitution[] = [
  ...BUNDLES.map((b) => ({
    permanentId: b.app.permanentId,
    name: b.app.institution,
    city: b.app.city,
    state: b.app.state,
    region: b.app.region,
    address: `${b.app.city}, ${b.app.state}`,
  })),
  ...NOT_YET_APPLIED,
]

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b(the|of|and)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

export type Verification =
  | { ok: true; institution: RegisteredInstitution }
  | { ok: false; field: 'name' | 'code'; message: string }

/** Both must match one register entry. Messages say what to fix, without revealing other institutions' IDs. */
export function verifyInstitution(name: string, code: string): Verification {
  const n = norm(name.replace(/,.*$/, ''))
  const c = code.trim().replace(/\s+/g, '')
  if (!n) return { ok: false, field: 'name', message: 'Enter the institution name as it appears on your AICTE approval letter.' }
  if (!/^1-\d{10}$/.test(c)) return { ok: false, field: 'code', message: 'Enter the AICTE permanent ID in the form 1-4410023317.' }
  const byCode = REGISTRY.find((r) => r.permanentId === c)
  if (!byCode) return { ok: false, field: 'code', message: 'No institution in the AICTE register has this permanent ID. Check it against your approval letter.' }
  if (norm(byCode.name) !== n) return { ok: false, field: 'name', message: 'This name does not match the register entry for that permanent ID. Use the name exactly as on your approval letter.' }
  return { ok: true, institution: byCode }
}
