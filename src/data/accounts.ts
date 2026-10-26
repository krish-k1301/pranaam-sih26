// Demo accounts. This prototype has no server: sign-in is checked in the browser and is for demonstration only.
import type { Role } from '../lib/types'

export type Power = Role | 'Institution'

export interface Account {
  username: string
  password: string
  name: string
  initials: string
  power: Power
  detail: string
}

export const ACCOUNTS: Account[] = [
  { username: 'ksharma', password: 'officer@2027', name: 'K. Sharma', initials: 'KS', power: 'Scrutiny officer', detail: 'Scrutiny officer, Western region' },
  { username: 'rvenkat', password: 'rules@2027', name: 'R. Venkataraman', initials: 'RV', power: 'Rule administrator', detail: 'Rule administrator' },
  { username: 'institute', password: 'portal@2027', name: 'Institution portal', initials: 'IP', power: 'Institution', detail: 'Applicant institution' },
]

export const homeFor = (power: Power) => (power === 'Institution' ? '/institute' : '/')
