import { useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  BadgeCheck,
  CalendarRange,
  CheckCircle2,
  CloudCog,
  Mail,
  Shield,
  Waypoints,
} from 'lucide-react'
import { isSupabaseConfigured, supabase, supabaseConfigError } from './lib/supabase'

const fallbackContent = {
  banner: 'We Build-IT LLC · Cybersecurity & Platform Engineering Consulting',
  badge: 'Secure systems. Streamlined delivery. Measurable resilience.',
  heroTitle:
    'Technical security assessments that strengthen your platform, controls, and engineering velocity.',
  heroDescription:
    'We Build-IT LLC helps teams modernize security operations, map compliance to real engineering practices, and build reliable internal platforms that scale with the business.',
  deliveryLabel: 'Delivery focus',
  deliveryTitle: 'Assessment-led security and platform improvements',
  outcomesLabel: 'Primary outcomes',
  outcomesText: 'Lower risk, faster release confidence',
  engagementStyleLabel: 'Engagement style',
  engagementStyleText: 'Fractional advisory and embedded execution',
  capabilitiesEyebrow: 'Core capabilities',
  capabilitiesTitle:
    'Built for teams that need security depth and platform momentum.',
  engagementsEyebrow: 'Flexible engagement models',
  engagementsTitle:
    'Choose the operating model that fits your team and timeline.',
  contactEyebrow: 'Technical security assessments',
  contactTitle:
    'Book time with a consultant and scope your next initiative.',
  contactDescription:
    'Share your environment, compliance drivers, or platform goals and we will recommend the right starting engagement.',
  discoverySessionText:
    '30-minute discovery sessions for security assessments',
  contactEmail: 'hello@webuild-itllc.com',
}

const fallbackCapabilities = [
  {
    name: 'SIEM / SOC',
    description:
      'Detection engineering, telemetry design, alert tuning, and incident-ready monitoring for cloud and hybrid estates.',
    icon: Shield,
  },
  {
    name: 'GRC Compliance',
    description:
      'Control mapping, audit readiness, policy development, and evidence workflows aligned to real operational risk.',
    icon: BadgeCheck,
  },
  {
    name: 'Platform Engineering',
    description:
      'Secure developer platforms, hardened CI/CD, IaC guardrails, and paved-road automation for reliable delivery.',
    icon: CloudCog,
  },
]

const fallbackEngagementModels = [
  {
    name: 'Assessment Sprint',
    price: '$4,500',
    cadence: 'Fixed scope · 2 weeks',
    highlights: [
      'Architecture and control review',
      'Priority-ranked findings',
      'Leadership readout with next steps',
    ],
  },
  {
    name: 'Fractional Security Partner',
    price: '$8,500',
    cadence: 'Monthly advisory retainer',
    highlights: [
      'Virtual security leadership',
      'Roadmap tracking and governance support',
      'Recurring stakeholder and engineering sessions',
    ],
  },
  {
    name: 'Platform Delivery Pod',
    price: '$12,000',
    cadence: 'Monthly engineering engagement',
    highlights: [
      'Secure platform backlog execution',
      'Automation and reliability improvements',
      'Embedded enablement for internal teams',
    ],
  },
]

function normalizeContentRows(rows) {
  return rows.reduce((content, row) => {
    if (row.key && typeof row.value === 'string') {
      content[row.key] = row.value
    }

    return content
  }, {})
}

function normalizeCapabilities(rows) {
  return rows.map((row) => ({
    name: row.name,
    description: row.description,
    icon: fallbackCapabilities.find((item) => item.name === row.name)?.icon ?? Shield,
  }))
}

function normalizeEngagements(rows) {
  return rows.map((row) => ({
    name: row.name,
    price: row.price,
    cadence: row.cadence,
    highlights: Array.isArray(row.highlights) ? row.highlights : [],
  }))
}

function App() {
  const formRef = useRef(null)
  const [pageContent, setPageContent] = useState(fallbackContent)
  const [capabilities, setCapabilities] = useState(fallbackCapabilities)
  const [engagementModels, setEngagementModels] = useState(fallbackEngagementModels)
  const [isLoadingContent, setIsLoadingContent] = useState(true)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadContent() {
      if (!isSupabaseConfigured || !supabase) {
        console.warn(supabaseConfigError)
        setIsLoadingContent(false)
        return
      }

      try {
        const [contentResult, capabilitiesResult, engagementsResult] = await Promise.all([
          supabase
            .from('site_content')
            .select('key, value'),
          supabase
            .from('service_capabilities')
            .select('name, description')
            .order('display_order', { ascending: true }),
          supabase
            .from('engagement_models')
            .select('name, price, cadence, highlights')
            .order('display_order', { ascending: true }),
        ])

        if (!isMounted) {
          return
        }

        if (!contentResult.error && Array.isArray(contentResult.data) && contentResult.data.length > 0) {
          setPageContent((current) => ({
            ...current,
            ...normalizeContentRows(contentResult.data),
          }))
        }

        if (
          !capabilitiesResult.error &&
          Array.isArray(capabilitiesResult.data) &&
          capabilitiesResult.data.length > 0
        ) {
          setCapabilities(normalizeCapabilities(capabilitiesResult.data))
        }

        if (
          !engagementsResult.error &&
          Array.isArray(engagementsResult.data) &&
          engagementsResult.data.length > 0
        ) {
          setEngagementModels(normalizeEngagements(engagementsResult.data))
        }
      } catch (error) {
        console.error('Error loading Supabase content:', error)
      }

      setIsLoadingContent(false)
    }

    loadContent()

    return () => {
      isMounted = false
    }
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!isSupabaseConfigured || !supabase) {
      alert('Supabase is not configured. Set VITE_SUPABASE_URL and a public Supabase key, then reload.')
      return
    }

    const rawFormData = new FormData(event.currentTarget)
    const formData = {
      name: String(rawFormData.get('name') ?? '').trim(),
      email: String(rawFormData.get('email') ?? '').trim(),
      company: String(rawFormData.get('company') ?? '').trim(),
      message: String(rawFormData.get('message') ?? '').trim(),
    }

    try {
      const { error } = await supabase.from('inquiries').insert([
        {
          full_name: formData.name,
          work_email: formData.email,
          company_name: formData.company,
          message: formData.message,
        },
      ])

      if (error) {
        console.error('Submission error:', error.message)
        alert('There was an issue submitting your request. Please try again.')
      } else {
        setSubmitted(true)
        formRef.current?.reset()
      }
    } catch (error) {
      console.error('Submission exception:', error)
      alert('Supabase client is not ready. Check your environment variables and reload.')
    }
  }

  function handleReset() {
    setSubmitted(false)
    formRef.current?.reset()
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto flex max-w-7xl flex-col gap-16 px-6 py-10 sm:px-8 lg:px-10">
        <div className="rounded-full border border-cyan-500/20 bg-slate-900/80 px-4 py-2 text-sm font-medium text-cyan-200 shadow-lg shadow-cyan-950/30 backdrop-blur">
          {pageContent.banner}
        </div>

        <div className="grid gap-10 lg:grid-cols-[1.3fr_0.9fr] lg:items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/70 px-4 py-2 text-sm text-slate-300">
              <Waypoints className="h-4 w-4 text-cyan-300" />
              {pageContent.badge}
            </div>

            <div className="space-y-5">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                {pageContent.heroTitle}
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-300">
                {pageContent.heroDescription}
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <a
                href="#contact"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                Book an assessment
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#engagements"
                className="inline-flex items-center justify-center rounded-xl border border-slate-700 px-5 py-3 font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-900"
              >
                View engagement models
              </a>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6 shadow-2xl shadow-cyan-950/20">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:col-span-2">
                <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
                  {pageContent.deliveryLabel}
                </p>
                <p className="mt-3 text-2xl font-semibold text-white">
                  {pageContent.deliveryTitle}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
                <p className="text-sm text-slate-400">{pageContent.outcomesLabel}</p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {pageContent.outcomesText}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
                <p className="text-sm text-slate-400">{pageContent.engagementStyleLabel}</p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {pageContent.engagementStyleText}
                </p>
              </div>
            </div>
          </div>
        </div>

        <section className="grid gap-6" aria-labelledby="capabilities-heading">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
              {pageContent.capabilitiesEyebrow}
            </p>
            <h2
              id="capabilities-heading"
              className="text-3xl font-semibold text-white"
            >
              {pageContent.capabilitiesTitle}
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {capabilities.map(({ name, description, icon: Icon }) => (
              <article
                key={name}
                className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-slate-950/30"
              >
                <div className="mb-5 inline-flex rounded-2xl bg-cyan-400/10 p-3 text-cyan-300">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-white">{name}</h3>
                <p className="mt-3 leading-7 text-slate-300">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="engagements"
          className="grid gap-6"
          aria-labelledby="engagements-heading"
        >
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
              {pageContent.engagementsEyebrow}
            </p>
            <h2
              id="engagements-heading"
              className="text-3xl font-semibold text-white"
            >
              {pageContent.engagementsTitle}
            </h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {engagementModels.map(({ name, price, cadence, highlights }) => (
              <article
                key={name}
                className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6"
              >
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">
                  {cadence}
                </p>
                <h3 className="mt-4 text-2xl font-semibold text-white">
                  {name}
                </h3>
                <p className="mt-4 text-4xl font-semibold text-white">
                  {price}
                </p>
                <ul className="mt-6 space-y-3 text-slate-300">
                  {highlights.map((highlight) => (
                    <li key={highlight} className="flex gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section
          id="contact"
          className="grid gap-8 rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 lg:grid-cols-[0.9fr_1.1fr] lg:p-8"
        >
          <div className="space-y-5">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
              {pageContent.contactEyebrow}
            </p>
            <h2 className="text-3xl font-semibold text-white">
              {pageContent.contactTitle}
            </h2>
            <p className="leading-7 text-slate-300">
              {pageContent.contactDescription}
            </p>
            <div className="space-y-3 text-sm text-slate-300">
              <div className="flex items-center gap-3">
                <CalendarRange className="h-5 w-5 text-cyan-300" />
                {pageContent.discoverySessionText}
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-cyan-300" />
                {pageContent.contactEmail}
              </div>
            </div>
          </div>

          <form ref={formRef} className="grid gap-4" onSubmit={handleSubmit}>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-200">
                Full name
              </span>
              <input
                type="text"
                name="name"
                required
                placeholder="Jordan Lee"
                className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-200">Email</span>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="jordan@company.com"
                  className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-200">Company</span>
                <input
                  type="text"
                  name="company"
                  required
                  placeholder="Example Co."
                  className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
                />
              </label>
            </div>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-200">
                What do you need help with?
              </span>
              <textarea
                name="message"
                rows="5"
                required
                placeholder="Tell us about your security operations, compliance objectives, or platform engineering priorities."
                className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
              />
            </label>
            <button
              type="submit"
              disabled={submitted || isLoadingContent}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {submitted ? 'Request submitted' : 'Request assessment'}
              <ArrowRight className="h-4 w-4" />
            </button>
            {submitted ? (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-4 text-sm text-emerald-200">
                <p>
                  Thanks. Your assessment inquiry was submitted successfully.
                </p>
                <button
                  type="button"
                  onClick={handleReset}
                  className="mt-3 block font-semibold text-emerald-100 underline underline-offset-4"
                >
                  Send another request
                </button>
              </div>
            ) : null}
          </form>
        </section>
      </section>
    </main>
  )
}

export default App
