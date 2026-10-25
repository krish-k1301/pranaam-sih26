// Deterministic randomness so the demo data is identical on every load.

export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type Rng = ReturnType<typeof mulberry32>

export function hashString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function rngFor(key: string): Rng {
  return mulberry32(hashString(key))
}

export function pick<T>(rng: Rng, list: readonly T[]): T {
  return list[Math.floor(rng() * list.length)]
}

export function int(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1))
}

/** A stable 64-character hex string that looks like a SHA-256 digest. */
export function fakeSha(key: string): string {
  const r = rngFor(`sha:${key}`)
  let out = ''
  for (let i = 0; i < 64; i++) out += Math.floor(r() * 16).toString(16)
  return out
}

const FIRST = [
  'Anand', 'Meera', 'Rohit', 'Sunita', 'Vikram', 'Kavita', 'Suresh', 'Priya', 'Nitin', 'Deepa',
  'Ajay', 'Swati', 'Rahul', 'Neha', 'Prakash', 'Asha', 'Manoj', 'Shreya', 'Sandeep', 'Pooja',
  'Ganesh', 'Lakshmi', 'Arvind', 'Rekha', 'Kiran', 'Varsha', 'Harish', 'Nandini', 'Mahesh', 'Rupali',
  'Venkat', 'Divya', 'Imran', 'Farah', 'Joseph', 'Anjali', 'Tushar', 'Gauri', 'Ramesh', 'Smita',
] as const
const LAST = [
  'Kulkarni', 'Deshmukh', 'Patil', 'Joshi', 'Iyer', 'Rao', 'Nair', 'Shah', 'Mehta', 'Reddy',
  'Gupta', 'Verma', 'Pillai', 'Chavan', 'Pawar', 'Bhat', 'Menon', 'Sinha', 'Khan', 'Desai',
  'Jadhav', 'Shinde', 'Naidu', 'Krishnan', 'Trivedi', 'Agarwal', 'Saxena', 'Gaikwad', 'Dsouza', 'Banerjee',
] as const

export function personName(rng: Rng): string {
  return `${pick(rng, FIRST)} ${pick(rng, LAST)}`
}

export const DESIGNATIONS = ['Professor', 'Associate Professor', 'Assistant Professor', 'Assistant Professor', 'Assistant Professor'] as const
export const QUALS = ['Ph.D.', 'M.Tech.', 'M.E.', 'Ph.D.', 'M.Tech.'] as const
