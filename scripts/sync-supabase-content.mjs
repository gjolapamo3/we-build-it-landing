import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const contentFilePath = path.resolve(__dirname, '../content/landing-content.json')
const isDryRun = process.argv.includes('--dry-run')

function assertString(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${label} must be a non-empty string.`)
  }
}

function validateContentModel(content) {
  if (!content || typeof content !== 'object') {
    throw new Error('Content file must contain a JSON object.')
  }

  if (!content.siteContent || typeof content.siteContent !== 'object') {
    throw new Error('siteContent must be an object.')
  }

  if (!Array.isArray(content.serviceCapabilities)) {
    throw new Error('serviceCapabilities must be an array.')
  }

  if (!Array.isArray(content.engagementModels)) {
    throw new Error('engagementModels must be an array.')
  }

  for (const [key, value] of Object.entries(content.siteContent)) {
    assertString(key, 'siteContent key')
    assertString(value, `siteContent.${key}`)
  }

  for (const capability of content.serviceCapabilities) {
    if (!Number.isInteger(capability.displayOrder)) {
      throw new Error(`serviceCapabilities.${capability.name ?? 'unknown'}.displayOrder must be an integer.`)
    }

    assertString(capability.name, 'serviceCapabilities name')
    assertString(capability.description, `serviceCapabilities.${capability.name}.description`)
  }

  for (const model of content.engagementModels) {
    if (!Number.isInteger(model.displayOrder)) {
      throw new Error(`engagementModels.${model.name ?? 'unknown'}.displayOrder must be an integer.`)
    }

    assertString(model.name, 'engagementModels name')
    assertString(model.price, `engagementModels.${model.name}.price`)
    assertString(model.cadence, `engagementModels.${model.name}.cadence`)

    if (!Array.isArray(model.highlights) || model.highlights.some((item) => typeof item !== 'string' || item.trim() === '')) {
      throw new Error(`engagementModels.${model.name}.highlights must be an array of non-empty strings.`)
    }
  }
}

async function readContentFile() {
  const raw = await readFile(contentFilePath, 'utf8')
  const content = JSON.parse(raw)
  validateContentModel(content)
  return content
}

async function syncContent() {
  const content = await readContentFile()

  if (isDryRun) {
    console.log('Dry run passed. Content model is valid.')
    console.log(`siteContent entries: ${Object.keys(content.siteContent).length}`)
    console.log(`serviceCapabilities entries: ${content.serviceCapabilities.length}`)
    console.log(`engagementModels entries: ${content.engagementModels.length}`)
    return
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for sync.')
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const siteContentRows = Object.entries(content.siteContent).map(([key, value]) => ({
    key,
    value,
  }))

  const capabilityRows = content.serviceCapabilities.map((item) => ({
    display_order: item.displayOrder,
    name: item.name,
    description: item.description,
  }))

  const engagementRows = content.engagementModels.map((item) => ({
    display_order: item.displayOrder,
    name: item.name,
    price: item.price,
    cadence: item.cadence,
    highlights: item.highlights,
  }))

  const { error: siteContentError } = await supabase
    .from('site_content')
    .upsert(siteContentRows, { onConflict: 'key' })

  if (siteContentError) {
    throw siteContentError
  }

  const { error: capabilitiesDeleteError } = await supabase
    .from('service_capabilities')
    .delete()
    .gte('id', 0)

  if (capabilitiesDeleteError) {
    throw capabilitiesDeleteError
  }

  const { error: capabilitiesInsertError } = await supabase
    .from('service_capabilities')
    .insert(capabilityRows)

  if (capabilitiesInsertError) {
    throw capabilitiesInsertError
  }

  const { error: engagementsDeleteError } = await supabase
    .from('engagement_models')
    .delete()
    .gte('id', 0)

  if (engagementsDeleteError) {
    throw engagementsDeleteError
  }

  const { error: engagementsInsertError } = await supabase
    .from('engagement_models')
    .insert(engagementRows)

  if (engagementsInsertError) {
    throw engagementsInsertError
  }

  console.log('Supabase content sync complete.')
}

syncContent().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})