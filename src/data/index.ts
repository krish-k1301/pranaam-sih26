import type { AppDocument } from '../lib/types'
import type { AppBundle } from './bundle'
import { ALERTS, BASE_AUDIT, BUNDLES } from './generate'
import { RULES } from './rules'

export { ALERTS, BASE_AUDIT, BUNDLES, RULES }
export type { AppBundle }

const byId = new Map(BUNDLES.map((b) => [b.app.id, b]))
const docs = new Map<string, AppDocument>(BUNDLES.flatMap((b) => b.documents.map((d) => [d.id, d] as const)))

export const getBundle = (id: string) => byId.get(id)
export const getDocument = (id: string) => docs.get(id)
