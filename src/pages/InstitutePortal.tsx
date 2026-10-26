import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BadgeCheck, FileText, ImageIcon, LoaderCircle, LogOut, Upload, X } from 'lucide-react'
import { Mark } from '../components/NavRail'
import { ThemeToggle } from '../components/ThemeToggle'
import { StatusChip } from '../components/StatusChip'
import { useStore } from '../state/DemoStore'
import { useTitle } from '../lib/hooks'
import { fmtBytes, sha256OfFile } from '../lib/files'
import { fmtDate, fmtDateTime, shortHash } from '../lib/format'
import { deriveBundle } from '../lib/derive'
import { REGISTRY, verifyInstitution, type RegisteredInstitution } from '../data/registry'
import {
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
} from '../data/docs'
import type { AppBundle } from '../data/bundle'
import type { AppDocument, Category, DocType, Region } from '../lib/types'

const VERIFIED_KEY = 'pramaan-portal-verified'

interface Slot {
  key: string
  type: DocType
  label: string
  hint: string
  required: boolean
  image?: boolean
}

const SLOTS: Slot[] = [
  { key: 'fire', type: 'fire_noc', label: 'Fire NOC', hint: 'From the state fire service, valid on 1 Aug 2027', required: true },
  { key: 'bcc', type: 'building_completion', label: 'Building completion certificate', hint: 'From the municipal or planning authority, digitally signed', required: true },
  { key: 'consent', type: 'university_consent', label: 'University consent', hint: 'Consent of affiliation for 2027-28', required: true },
  { key: 'faculty', type: 'faculty_list', label: 'Faculty list', hint: 'Full-time teaching staff with AICTE faculty IDs', required: true },
  { key: 'ter', type: 'ter_receipt', label: 'TER receipt', hint: 'Processing fee receipt from Bharat Kosh', required: true },
  { key: 'dte', type: 'dte_noc', label: 'State DTE NOC', hint: 'No objection from the state directorate', required: true },
  { key: 'affidavit', type: 'affidavit', label: 'Affidavit', hint: 'Signed by the chairman and notarised', required: true },
  { key: 'land', type: 'land_document', label: 'Land document', hint: 'Only if land holdings changed since your last approval', required: false },
  { key: 'lab', type: 'infra_photo', label: 'Laboratory photo', hint: 'Taken in the last 12 months, location on', required: true, image: true },
  { key: 'classroom', type: 'infra_photo', label: 'Classroom photo', hint: 'Taken in the last 12 months, location on', required: false, image: true },
]

const MAX = 10 * 1024 * 1024

type Filled = { kind: 'file'; file: File; sha: string } | { kind: 'sample' }

const OFFICER_FOR: Record<Region, string> = {
  Western: 'K. Sharma',
  Central: 'A. Qureshi',
  Southern: 'P. Reddy',
  'South-Central': 'P. Reddy',
  'South-Western': 'S. Menon',
  Northern: 'R. Bansal',
  'North-West': 'R. Bansal',
}

const UNIVERSITY: Record<string, string> = {
  'Madhya Pradesh': 'Rajiv Gandhi Proudyogiki Vishwavidyalaya',
  Chhattisgarh: 'Chhattisgarh Swami Vivekanand Technical University',
  Maharashtra: 'Shivaji University',
  'Tamil Nadu': 'Anna University',
}

function readVerified(): RegisteredInstitution | null {
  try {
    const id = sessionStorage.getItem(VERIFIED_KEY)
    return REGISTRY.find((r) => r.permanentId === id) ?? null
  } catch {
    return null
  }
}

export default function InstitutePortal() {
  const { user, signOut, bundles } = useStore()
  const nav = useNavigate()
  const [inst, setInst] = useState<RegisteredInstitution | null>(readVerified)
  const [submittedId, setSubmittedId] = useState<string | null>(null)
  const existing = useMemo(() => (inst ? bundles.find((b) => b.app.permanentId === inst.permanentId && b.app.academicYear === '2027-28') : undefined), [inst, bundles])

  const setVerified = (r: RegisteredInstitution | null) => {
    try {
      if (r) sessionStorage.setItem(VERIFIED_KEY, r.permanentId)
      else sessionStorage.removeItem(VERIFIED_KEY)
    } catch {
      /* storage unavailable */
    }
    setInst(r)
    setSubmittedId(null)
  }

  const title = !inst ? 'Verify your institution' : submittedId ? 'Application submitted' : existing ? 'Your application' : 'Extension of approval, 2027-28'
  useTitle(title)

  return (
    <div className="min-h-dvh bg-page">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-14 max-w-[1040px] items-center gap-3 px-4 sm:px-6">
          <Mark className="size-7" />
          <span className="leading-4">
            <span translate="no" className="block font-semibold">
              Pramaan
            </span>
            <span className="block text-[12px] text-muted">Institution portal</span>
          </span>
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle className="text-muted hover:bg-active hover:text-ink" />
            <span className="mx-2 hidden text-[13px] text-muted sm:block">{inst ? inst.name : user?.name}</span>
            <button
              onClick={() => {
                setVerified(null)
                signOut()
                nav('/login', { replace: true })
              }}
              className="flex h-9 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium hover:bg-active"
            >
              <LogOut size={15} aria-hidden />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-[1040px] px-4 pb-16 pt-8 sm:px-6">
        <Progress at={!inst ? 0 : submittedId || existing ? 2 : 1} />
        <h1 className="mt-5 text-[24px] font-semibold leading-8">{title}</h1>
        {!inst && <VerifyForm onVerified={setVerified} />}
        {inst && !submittedId && !existing && <ApplicationForm inst={inst} onChange={() => setVerified(null)} onSubmitted={setSubmittedId} />}
        {inst && (submittedId || existing) && <StatusView bundle={existing!} justSubmitted={Boolean(submittedId)} onChange={() => setVerified(null)} />}
      </main>
    </div>
  )
}

function Progress({ at }: { at: number }) {
  const steps = ['Verify institution', 'Application & documents', 'With AICTE']
  return (
    <ol aria-label="Progress" className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
      {steps.map((s, i) => (
        <li key={s} aria-current={i === at ? 'step' : undefined} className="flex items-center gap-2">
          <span className={`size-2 rounded-full ${i < at ? 'bg-st-verified' : i === at ? 'bg-action' : 'bg-control'}`} aria-hidden />
          <span className={i === at ? 'font-medium text-ink' : 'text-muted'}>
            {s}
            {i < at && <span className="sr-only"> (done)</span>}
          </span>
          {i < steps.length - 1 && <span aria-hidden className="mx-1 h-px w-6 bg-control" />}
        </li>
      ))}
    </ol>
  )
}

function VerifyForm({ onVerified }: { onVerified: (r: RegisteredInstitution) => void }) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [err, setErr] = useState<{ field: 'name' | 'code'; message: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)
  const codeRef = useRef<HTMLInputElement>(null)
  const id = useId()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    // A short, honest pause for the register lookup, so the result never flickers in.
    await new Promise((r) => setTimeout(r, 450))
    const v = verifyInstitution(name, code)
    setBusy(false)
    if (!v.ok) {
      setErr({ field: v.field, message: v.message })
      ;(v.field === 'name' ? nameRef : codeRef).current?.focus()
      return
    }
    setErr(null)
    onVerified(v.institution)
  }

  const demo = REGISTRY.find((r) => r.permanentId === '1-4410084461')!

  return (
    <div className="mt-2 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <form onSubmit={submit} noValidate className="rounded-lg border border-line bg-surface p-5 sm:p-6">
        <p className="max-w-[560px] text-muted">The application form opens once your institution’s name & AICTE permanent ID match the AICTE register.</p>
        <div className="mt-5">
          <label htmlFor={`${id}-n`} className="block font-medium">
            Institution name
          </label>
          <input
            id={`${id}-n`}
            ref={nameRef}
            name="organization"
            autoComplete="organization"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Vindhya Institute of Technology…"
            aria-invalid={err?.field === 'name'}
            aria-describedby={`${id}-nh${err?.field === 'name' ? ` ${id}-err` : ''}`}
            className={`mt-2 h-10 w-full rounded-md border bg-surface px-3 text-[15px] outline-none placeholder:text-faint hover:border-ink-2 focus:border-action focus:ring-2 focus:ring-action/25 ${err?.field === 'name' ? 'border-stamp' : 'border-control'}`}
          />
          <p id={`${id}-nh`} className="mt-1 text-[12px] text-muted">
            As printed on your AICTE approval letter.
          </p>
          {err?.field === 'name' && (
            <p id={`${id}-err`} aria-live="polite" className="mt-1 text-[13px] text-stamp">
              {err.message}
            </p>
          )}
        </div>
        <div className="mt-4">
          <label htmlFor={`${id}-c`} className="block font-medium">
            AICTE permanent ID
          </label>
          <input
            id={`${id}-c`}
            ref={codeRef}
            name="permanent-id"
            autoComplete="off"
            spellCheck={false}
            inputMode="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="1-4410023317…"
            aria-invalid={err?.field === 'code'}
            aria-describedby={`${id}-ch${err?.field === 'code' ? ` ${id}-err` : ''}`}
            className={`mt-2 h-10 w-full max-w-[280px] rounded-md border bg-surface px-3 font-mono text-[15px] outline-none placeholder:font-sans placeholder:text-faint hover:border-ink-2 focus:border-action focus:ring-2 focus:ring-action/25 ${err?.field === 'code' ? 'border-stamp' : 'border-control'}`}
          />
          <p id={`${id}-ch`} className="mt-1 text-[12px] text-muted">
            The unique code AICTE issued your institution: “1-” followed by 10 digits.
          </p>
          {err?.field === 'code' && (
            <p id={`${id}-err`} aria-live="polite" className="mt-1 text-[13px] text-stamp">
              {err.message}
            </p>
          )}
        </div>
        <button type="submit" disabled={busy} aria-busy={busy} className="mt-6 flex h-10 items-center gap-2 rounded-md bg-action px-5 font-medium text-white hover:bg-action-dark disabled:opacity-70 active:translate-y-px">
          {busy && <LoaderCircle size={16} className="animate-spin motion-reduce:animate-none" aria-hidden />}
          Verify institution
        </button>
      </form>
      <aside className="self-start rounded-lg border border-line bg-raised p-5">
        <h2 className="font-medium">Trying the demo?</h2>
        <p className="mt-1 text-[13px] leading-5 text-muted">
          {demo.name}, {demo.city} has not applied for 2027-28 yet. Institutions already in the queue, such as Sahyadri Institute of Technology (1-4410023317), open their application status instead.
        </p>
        <button
          type="button"
          onClick={() => {
            setName(demo.name)
            setCode(demo.permanentId)
            setErr(null)
          }}
          className="mt-3 h-9 rounded-md border border-control bg-surface px-3 text-[13px] font-medium hover:border-ink-2 hover:bg-raised"
        >
          Fill with {demo.name.split(' ')[0]}’s details
        </button>
      </aside>
    </div>
  )
}

function VerifiedCard({ inst, onChange }: { inst: RegisteredInstitution; onChange: () => void }) {
  return (
    <section aria-label="Verified institution" className="mt-4 flex flex-wrap items-start gap-x-6 gap-y-2 rounded-lg border border-line bg-surface p-4">
      <BadgeCheck size={20} className="mt-0.5 flex-none text-st-verified" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="font-medium">{inst.name}</p>
        <p className="text-[13px] text-muted">
          <span translate="no" className="font-mono text-[12px]">
            {inst.permanentId}
          </span>{' '}
          · {inst.city}, {inst.state} · {inst.region} region
        </p>
        <p className="mt-1 text-[12px] text-st-verified">Verified against the AICTE register</p>
      </div>
      <button onClick={onChange} className="text-[13px] font-medium text-link hover:underline">
        Not your institution? Change
      </button>
    </section>
  )
}

function ApplicationForm({ inst, onChange, onSubmitted }: { inst: RegisteredInstitution; onChange: () => void; onSubmitted: (id: string) => void }) {
  const { submitApplication } = useStore()
  const [category, setCategory] = useState<Category>('Extension of approval')
  const [intake, setIntake] = useState('')
  const [faculty, setFaculty] = useState('')
  const [contact, setContact] = useState('')
  const [email, setEmail] = useState('')
  const [declared, setDeclared] = useState(false)
  const [files, setFiles] = useState<Record<string, Filled>>({})
  const [slotErr, setSlotErr] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [tried, setTried] = useState(false)
  const done = useRef(false)
  const id = useId()

  const dirty = Boolean(intake || faculty || contact || email || Object.keys(files).length)
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty && !done.current) e.preventDefault()
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const pick = async (slot: Slot, file: File | undefined) => {
    if (!file) return
    const okType = slot.image ? /^image\/(jpeg|png)$/.test(file.type) : file.type === 'application/pdf'
    if (!okType) return setSlotErr((s) => ({ ...s, [slot.key]: slot.image ? 'Choose a JPG or PNG photo.' : 'Choose a PDF file. Scan paper documents to PDF first.' }))
    if (file.size > MAX) return setSlotErr((s) => ({ ...s, [slot.key]: `This file is ${fmtBytes(file.size)}. Keep each file under 10 MB.` }))
    const sha = await sha256OfFile(file)
    setSlotErr(({ [slot.key]: _, ...rest }) => rest)
    setErrors(({ [slot.key]: _, ...rest }) => rest)
    setFiles((f) => ({ ...f, [slot.key]: { kind: 'file', file, sha } }))
  }

  const applySample = (keys: string[]) => {
    setFiles((f) => ({ ...f, ...Object.fromEntries(keys.map((k) => [k, { kind: 'sample' } as Filled])) }))
    setErrors((e) => Object.fromEntries(Object.entries(e).filter(([k]) => !keys.includes(k))))
    setSlotErr((e) => Object.fromEntries(Object.entries(e).filter(([k]) => !keys.includes(k))))
  }

  const fillDemo = () => {
    setIntake('420')
    setFaculty('28')
    setContact('Dr. Meera Joshi')
    setEmail('principal@vindhya.example')
    applySample(SLOTS.filter((s) => s.required && !files[s.key]).map((s) => s.key))
    setDeclared(true)
  }

  const validate = () => {
    const e: Record<string, string> = {}
    const n = Number(intake.trim())
    if (!/^\d+$/.test(intake.trim()) || n < 30 || n > 3000) e.intake = 'Enter the total intake as a whole number between 30 and 3,000.'
    const fNum = Number(faculty.trim())
    if (!/^\d+$/.test(faculty.trim()) || fNum < 1) e.faculty = 'Enter the number of full-time faculty as a whole number.'
    if (!contact.trim()) e.contact = 'Enter the name of the person AICTE should contact.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = 'Enter an email address such as principal@college.edu.in.'
    for (const s of SLOTS) if (s.required && !files[s.key]) e[s.key] = `Upload the ${s.label.toLowerCase()}, or use a sample document.`
    if (!declared) e.declared = 'Confirm the declaration to submit.'
    return e
  }

  // After the first attempt, errors update as fields are fixed, so a corrected field never keeps a stale message.
  useEffect(() => {
    if (tried) setErrors(validate())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tried, intake, faculty, contact, email, declared, files])

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    setTried(true)
    const e = validate()
    setErrors(e)
    const first = Object.keys(e)[0]
    if (first) {
      document.getElementById(`${id}-${first}`)?.focus()
      return
    }
    setBusy(true)
    const newId = await submitApplication((appId, at) => {
      const ctx: InstCtx = {
        appId,
        institution: `${inst.name}, ${inst.city}`,
        city: inst.city,
        state: inst.state,
        address: inst.address,
        permanentId: inst.permanentId,
        intake: Number(intake),
        faculty: Number(faculty),
      }
      const docs: AppDocument[] = []
      const blobs: Record<string, File> = {}
      let n = 0
      for (const s of SLOTS) {
        const f = files[s.key]
        if (!f) continue
        n++
        if (f.kind === 'file') {
          const docId = `${appId}-D${n}`
          blobs[docId] = f.file
          docs.push({
            id: docId,
            appId,
            type: s.type,
            typeLabel: s.label,
            filename: f.file.name,
            issuer: 'Uploaded by the institution',
            issuerLine: '',
            pages: 1,
            uploadedAt: at,
            sha256: f.sha,
            fields: [],
            upload: { name: f.file.name, size: f.file.size, mime: f.file.type },
          })
        } else {
          docs.push({ ...sampleDoc(s, ctx, n, inst, at), uploadedAt: at, typeLabel: s.label })
        }
      }
      const bundle: AppBundle = {
        app: {
          id: appId,
          institution: inst.name,
          city: inst.city,
          state: inst.state,
          region: inst.region,
          permanentId: inst.permanentId,
          category,
          academicYear: '2027-28',
          submittedAt: at,
          assignedOfficer: OFFICER_FOR[inst.region],
          intake: Number(intake),
          faculty: Number(faculty),
        },
        documents: docs,
        checks: [],
        findings: [],
      }
      return { bundle, files: blobs }
    })
    done.current = true
    setBusy(false)
    onSubmitted(newId)
  }

  const errorCount = Object.keys(errors).length
  const field = 'mt-2 h-10 w-full rounded-md border bg-surface px-3 text-[15px] outline-none placeholder:text-faint hover:border-ink-2 focus:border-action focus:ring-2 focus:ring-action/25'
  const err = (k: string) =>
    errors[k] ? (
      <p id={`${id}-${k}-e`} className="mt-1 text-[13px] text-stamp">
        {errors[k]}
      </p>
    ) : null

  return (
    <>
      <VerifiedCard inst={inst} onChange={onChange} />
      <form onSubmit={submit} noValidate className="mt-4 flex flex-col gap-4">
        <section aria-labelledby={`${id}-details`} className="rounded-lg border border-line bg-surface p-5 sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 id={`${id}-details`} className="text-[16px] font-semibold">
              Application details
            </h2>
            <button type="button" onClick={fillDemo} className="text-[13px] font-medium text-link hover:underline">
              Fill with demo values
            </button>
          </div>
          <div className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">
            <div>
              <label htmlFor={`${id}-category`} className="block font-medium">
                Category
              </label>
              <select id={`${id}-category`} name="category" value={category} onChange={(e) => setCategory(e.target.value as Category)} className={`${field} border-control`}>
                <option>Extension of approval</option>
                <option>Increase in intake</option>
                <option>New course</option>
              </select>
            </div>
            <div>
              <span className="block font-medium">Academic year</span>
              <p className="mt-2 flex h-10 items-center rounded-md bg-raised px-3 text-[15px]">2027-28</p>
            </div>
            <div>
              <label htmlFor={`${id}-intake`} className="block font-medium">
                Total intake
              </label>
              <input id={`${id}-intake`} name="intake" inputMode="numeric" autoComplete="off" value={intake} onChange={(e) => setIntake(e.target.value)} placeholder="420…" aria-invalid={Boolean(errors.intake)} aria-describedby={errors.intake ? `${id}-intake-e` : undefined} className={`${field} ${errors.intake ? 'border-stamp' : 'border-control'}`} />
              {err('intake')}
            </div>
            <div>
              <label htmlFor={`${id}-faculty`} className="block font-medium">
                Full-time faculty
              </label>
              <input id={`${id}-faculty`} name="faculty" inputMode="numeric" autoComplete="off" value={faculty} onChange={(e) => setFaculty(e.target.value)} placeholder="28…" aria-invalid={Boolean(errors.faculty)} aria-describedby={errors.faculty ? `${id}-faculty-e` : undefined} className={`${field} ${errors.faculty ? 'border-stamp' : 'border-control'}`} />
              {err('faculty')}
            </div>
            <div>
              <label htmlFor={`${id}-contact`} className="block font-medium">
                Contact person
              </label>
              <input id={`${id}-contact`} name="name" autoComplete="name" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Dr. Meera Joshi…" aria-invalid={Boolean(errors.contact)} aria-describedby={errors.contact ? `${id}-contact-e` : undefined} className={`${field} ${errors.contact ? 'border-stamp' : 'border-control'}`} />
              {err('contact')}
            </div>
            <div>
              <label htmlFor={`${id}-email`} className="block font-medium">
                Contact email
              </label>
              <input id={`${id}-email`} name="email" type="email" autoComplete="email" spellCheck={false} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="principal@college.edu.in…" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? `${id}-email-e` : undefined} className={`${field} ${errors.email ? 'border-stamp' : 'border-control'}`} />
              {err('email')}
            </div>
          </div>
        </section>

        <section aria-labelledby={`${id}-docs`} className="rounded-lg border border-line bg-surface">
          <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-rule px-5 py-4 sm:px-6">
            <div>
              <h2 id={`${id}-docs`} className="text-[16px] font-semibold">
                Documents
              </h2>
              <p className="mt-0.5 text-[13px] text-muted">
                PDF for documents, JPG or PNG for photos, up to 10&nbsp;MB each. {Object.keys(files).length} of {SLOTS.length} added.
              </p>
            </div>
            <button type="button" onClick={() => applySample(SLOTS.filter((s) => !files[s.key]).map((s) => s.key))} className="text-[13px] font-medium text-link hover:underline">
              Use sample documents for the rest
            </button>
          </div>
          <ul>
            {SLOTS.map((s) => (
              <SlotRow key={s.key} slot={s} formId={id} filled={files[s.key]} error={errors[s.key] ?? slotErr[s.key]} onPick={(f) => pick(s, f)} onSample={() => applySample([s.key])} onRemove={() => setFiles(({ [s.key]: _, ...rest }) => rest)} />
            ))}
          </ul>
        </section>

        <section aria-label="Declaration & submit" className="rounded-lg border border-line bg-surface p-5 sm:p-6">
          <label className="flex cursor-pointer items-start gap-3">
            <input id={`${id}-declared`} type="checkbox" checked={declared} onChange={(e) => setDeclared(e.target.checked)} aria-describedby={errors.declared ? `${id}-declared-e` : undefined} className="mt-0.5 size-4 flex-none accent-action" />
            <span className="leading-5">I confirm that every document is a true copy of the original and that the details above are correct. I understand AICTE will verify them with the issuing authorities.</span>
          </label>
          {err('declared')}
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <button type="submit" disabled={busy} aria-busy={busy} className="flex h-10 items-center gap-2 rounded-md bg-action px-5 font-medium text-white hover:bg-action-dark disabled:opacity-70 active:translate-y-px">
              {busy && <LoaderCircle size={16} className="animate-spin motion-reduce:animate-none" aria-hidden />}
              Submit application
            </button>
            <p aria-live="polite" className={`text-[13px] ${errorCount ? 'text-stamp' : 'text-muted'}`}>
              {errorCount ? `${errorCount} ${errorCount === 1 ? 'item needs' : 'items need'} attention above.` : 'Your application goes straight into the AICTE scrutiny queue.'}
            </p>
          </div>
        </section>
      </form>
    </>
  )
}

function SlotRow({
  slot,
  formId,
  filled,
  error,
  onPick,
  onSample,
  onRemove,
}: {
  slot: Slot
  formId: string
  filled?: Filled
  error?: string
  onPick: (f: File | undefined) => void
  onSample: () => void
  onRemove: () => void
}) {
  const input = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const Icon = slot.image ? ImageIcon : FileText
  return (
    <li
      className={`grid gap-3 border-b border-rule px-5 py-4 last:border-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,300px)] sm:px-6 ${over ? 'bg-tint-action' : ''}`}
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        onPick(e.dataTransfer.files[0])
      }}
    >
      <div className="flex gap-3">
        <Icon size={18} className="mt-0.5 flex-none text-muted" aria-hidden />
        <div>
          <p className="font-medium leading-5">
            {slot.label} <span className="font-normal text-muted">{slot.required ? '' : '(optional)'}</span>
          </p>
          <p className="text-[13px] leading-5 text-muted">{slot.hint}</p>
          {error && (
            <p id={`${formId}-${slot.key}-e`} className="mt-1 text-[13px] text-stamp">
              {error}
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-col justify-center gap-1.5 sm:items-end">
        {filled ? (
          <div className="flex w-full items-center gap-3 rounded-md bg-raised px-3 py-2 sm:max-w-[300px]">
            <div className="min-w-0 flex-1 text-[13px] leading-[18px]">
              {filled.kind === 'file' ? (
                <>
                  <p className="truncate font-medium">{filled.file.name}</p>
                  <p className="text-muted">
                    {fmtBytes(filled.file.size)} ·{' '}
                    <span translate="no" className="font-mono text-[12px]" title={filled.sha}>
                      {shortHash(filled.sha, 10)}
                    </span>
                  </p>
                </>
              ) : (
                <>
                  <p className="font-medium">Sample document</p>
                  <p className="text-muted">Generated for the demo</p>
                </>
              )}
            </div>
            <button type="button" onClick={onRemove} aria-label={`Remove ${slot.label.toLowerCase()}`} className="flex size-8 flex-none items-center justify-center rounded text-muted hover:bg-active hover:text-ink">
              <X size={16} aria-hidden />
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3 sm:justify-end">
            <input
              ref={input}
              id={`${formId}-${slot.key}`}
              type="file"
              accept={slot.image ? 'image/jpeg,image/png' : 'application/pdf'}
              className="sr-only"
              aria-describedby={error ? `${formId}-${slot.key}-e` : undefined}
              onChange={(e) => {
                onPick(e.target.files?.[0])
                e.target.value = ''
              }}
            />
            <label htmlFor={`${formId}-${slot.key}`} className="control flex h-9 cursor-pointer items-center gap-2 rounded-md border border-control bg-surface px-3 text-[13px] font-medium hover:border-ink-2 hover:bg-raised has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-action">
              <Upload size={15} aria-hidden />
              Choose file…
            </label>
            <button type="button" onClick={onSample} className="text-[13px] font-medium text-link hover:underline">
              Use sample
            </button>
          </div>
        )}
      </div>
    </li>
  )
}

function sampleDoc(s: Slot, ctx: InstCtx, n: number, inst: RegisteredInstitution, at: string): AppDocument {
  const day = `${at.slice(8, 10)}.${at.slice(5, 7)}.${at.slice(0, 4)}`
  switch (s.type) {
    case 'fire_noc':
      return fireNoc(ctx, n, { authority: `${inst.state} Fire and Emergency Services`, authorityLine: `Office of the Chief Fire Officer, ${inst.city}`, nocNo: `FS/${inst.city.slice(0, 3).toUpperCase()}/2026/${1000 + n * 37}`, issued: '14.08.2026', validUntil: '31.07.2029', uploadedAt: at, area: '14,200 sq m', floors: 'Ground + 3' })
    case 'building_completion':
      return buildingCompletion(ctx, n, { authority: `${inst.city} Municipal Corporation`, authorityLine: 'Building Permission Department', certNo: `${inst.city.slice(0, 3).toUpperCase()}MC/CC/2017/${400 + n}`, issued: '09.03.2017', uploadedAt: at, area: '14,200 sq m', floors: 'Ground + 3' })
    case 'university_consent':
      return universityConsent(ctx, n, { university: UNIVERSITY[inst.state] ?? `Affiliating university, ${inst.state}`, universityLine: 'Affiliation section', refNo: `AFF/2027/${3000 + n * 11}`, year: '2027-28', intakeConsented: ctx.intake, uploadedAt: at })
    case 'faculty_list':
      return facultyList(ctx, n, makeFaculty(ctx.appId, ctx.faculty, 88140000 + n * 1000), at)
    case 'ter_receipt':
      return terReceipt(ctx, n, { txn: `BKS2701${ctx.permanentId.slice(-8)}`, amount: '₹1,90,000.00', paidOn: day, uploadedAt: at })
    case 'dte_noc':
      return dteNoc(ctx, n, { directorate: `Directorate of Technical Education, ${inst.state}`, directorateLine: inst.state, refNo: `DTE/NOC/2027/${2000 + n * 13}`, issued: day, uploadedAt: at })
    case 'affidavit':
      return affidavit(ctx, n, { committees: ['Anti-ragging', 'Internal Complaints', 'SC/ST', 'Grievance redressal'], website: `www.${inst.name.split(' ')[0].toLowerCase()}.example/disclosure`, signed: true, uploadedAt: at })
    case 'land_document':
      return landDocument(ctx, n, { surveyNo: `${100 + n}/2`, area: '12.4 acres', uploadedAt: at })
    default:
      return infraPhoto(ctx, n, { caption: s.label.replace(' photo', ''), institution: ctx.institution, year: '2027-28', rows: s.key === 'lab' ? 3 : 2, hueShift: s.key === 'lab' ? 4 : -6 }, at)
  }
}

function StatusView({ bundle, justSubmitted, onChange }: { bundle: AppBundle; justSubmitted: boolean; onChange: () => void }) {
  const { reviews, appActions } = useStore()
  const d = deriveBundle(bundle, reviews)
  const a = bundle.app
  const requests = [
    ...(appActions[a.id] ?? []).filter((x) => x.action === 'rectify').map((x) => ({ at: x.at, text: x.message, about: 'The whole application' })),
    ...bundle.findings
      .filter((f) => reviews[f.id]?.state === 'rectification_requested' && reviews[f.id]?.message)
      .map((f) => ({ at: reviews[f.id].at, text: reviews[f.id].message!, about: bundle.documents.find((x) => x.id === f.documentId)?.typeLabel ?? '' })),
  ].sort((x, y) => y.at.localeCompare(x.at))

  return (
    <>
      <VerifiedCard inst={{ permanentId: a.permanentId, name: a.institution, city: a.city, state: a.state, region: a.region, address: '' }} onChange={onChange} />
      <section aria-label="Application summary" className="mt-4 rounded-lg border border-line bg-surface p-5 sm:p-6">
        {justSubmitted ? (
          <p className="text-[15px] leading-[22px]">
            Your application is in the AICTE scrutiny queue. Automated checks now run on each document with its issuing authority; documents show “Verification pending” until they finish.
          </p>
        ) : (
          <p className="text-[15px] leading-[22px]">An application from your institution for 2027-28 is already with AICTE. You can follow it here.</p>
        )}
        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-[13px] sm:grid-cols-4">
          <div>
            <dt className="text-muted">Application</dt>
            <dd translate="no" className="mt-0.5 font-mono text-[14px]">
              {a.id}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Category</dt>
            <dd className="mt-0.5">{a.category}</dd>
          </div>
          <div>
            <dt className="text-muted">Submitted</dt>
            <dd className="mt-0.5">{fmtDate(a.submittedAt)}</dd>
          </div>
          <div>
            <dt className="text-muted">Regional office</dt>
            <dd className="mt-0.5">{a.region}</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="req-h" className="mt-4 rounded-lg border border-line bg-surface">
        <h2 id="req-h" className="border-b border-rule px-5 py-3 text-[16px] font-semibold sm:px-6">
          Requests from AICTE
        </h2>
        {requests.length === 0 ? (
          <p className="px-5 py-4 text-muted sm:px-6">No requests yet. If a scrutiny officer needs a corrected document, the request appears here with what to change.</p>
        ) : (
          <ul>
            {requests.map((r) => (
              <li key={r.at + r.about} className="border-b border-rule px-5 py-3 last:border-0 sm:px-6">
                <p className="text-[12px] text-muted">
                  {r.about} · {fmtDateTime(r.at)}
                </p>
                <p className="mt-0.5 whitespace-pre-line leading-5">{r.text}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="docs-h" className="mt-4 rounded-lg border border-line bg-surface">
        <h2 id="docs-h" className="border-b border-rule px-5 py-3 text-[16px] font-semibold sm:px-6">
          Documents received ({bundle.documents.length})
        </h2>
        <ul>
          {bundle.documents.map((doc) => (
            <li key={doc.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-rule px-5 py-3 last:border-0 sm:px-6">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{doc.typeLabel}</p>
                <p className="truncate text-[13px] text-muted">
                  {doc.filename} ·{' '}
                  <span translate="no" className="font-mono text-[12px]">
                    {shortHash(doc.sha256, 10)}
                  </span>
                </p>
              </div>
              {justSubmitted || bundle.checks.length === 0 ? <StatusChip status={d.statuses[doc.id].status} /> : <span className="text-[13px] text-muted">Received {fmtDate(doc.uploadedAt)}</span>}
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
