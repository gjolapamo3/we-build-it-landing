-- Lead capture table
CREATE TABLE IF NOT EXISTS public.inquiries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    full_name TEXT NOT NULL,
    work_email TEXT NOT NULL,
    company_name TEXT,
    service_interest TEXT DEFAULT 'Discovery Assessment',
    message TEXT,
    status TEXT DEFAULT 'new'
);

ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert to inquiries" ON public.inquiries;

CREATE POLICY "Allow public insert to inquiries"
ON public.inquiries
FOR INSERT
TO anon
WITH CHECK (true);

-- Optional content tables for landing page copy managed through Supabase.
CREATE TABLE IF NOT EXISTS public.site_content (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.service_capabilities (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    display_order INT NOT NULL DEFAULT 0,
    name TEXT NOT NULL,
    description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.engagement_models (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    display_order INT NOT NULL DEFAULT 0,
    name TEXT NOT NULL,
    price TEXT NOT NULL,
    cadence TEXT NOT NULL,
    highlights JSONB NOT NULL DEFAULT '[]'::jsonb
);

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_models ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read site content" ON public.site_content;
DROP POLICY IF EXISTS "Allow public read service capabilities" ON public.service_capabilities;
DROP POLICY IF EXISTS "Allow public read engagement models" ON public.engagement_models;

CREATE POLICY "Allow public read site content"
ON public.site_content
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow public read service capabilities"
ON public.service_capabilities
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow public read engagement models"
ON public.engagement_models
FOR SELECT
TO anon
USING (true);

INSERT INTO public.site_content (key, value)
VALUES
    ('banner', 'We Build-IT LLC · Cybersecurity & Platform Engineering Consulting'),
    ('badge', 'Secure systems. Streamlined delivery. Measurable resilience.'),
    ('heroTitle', 'Technical security assessments that strengthen your platform, controls, and engineering velocity.'),
    ('heroDescription', 'We Build-IT LLC helps teams modernize security operations, map compliance to real engineering practices, and build reliable internal platforms that scale with the business.'),
    ('deliveryLabel', 'Delivery focus'),
    ('deliveryTitle', 'Assessment-led security and platform improvements'),
    ('outcomesLabel', 'Primary outcomes'),
    ('outcomesText', 'Lower risk, faster release confidence'),
    ('engagementStyleLabel', 'Engagement style'),
    ('engagementStyleText', 'Fractional advisory and embedded execution'),
    ('capabilitiesEyebrow', 'Core capabilities'),
    ('capabilitiesTitle', 'Built for teams that need security depth and platform momentum.'),
    ('engagementsEyebrow', 'Flexible engagement models'),
    ('engagementsTitle', 'Choose the operating model that fits your team and timeline.'),
    ('contactEyebrow', 'Technical security assessments'),
    ('contactTitle', 'Book time with a consultant and scope your next initiative.'),
    ('contactDescription', 'Share your environment, compliance drivers, or platform goals and we will recommend the right starting engagement.'),
    ('discoverySessionText', '30-minute discovery sessions for security assessments'),
    ('contactEmail', 'hello@webuild-itllc.com')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO public.service_capabilities (display_order, name, description)
VALUES
    (1, 'SIEM / SOC', 'Detection engineering, telemetry design, alert tuning, and incident-ready monitoring for cloud and hybrid estates.'),
    (2, 'GRC Compliance', 'Control mapping, audit readiness, policy development, and evidence workflows aligned to real operational risk.'),
    (3, 'Platform Engineering', 'Secure developer platforms, hardened CI/CD, IaC guardrails, and paved-road automation for reliable delivery.')
ON CONFLICT DO NOTHING;

INSERT INTO public.engagement_models (display_order, name, price, cadence, highlights)
VALUES
    (1, 'Assessment Sprint', '$4,500', 'Fixed scope · 2 weeks', '["Architecture and control review", "Priority-ranked findings", "Leadership readout with next steps"]'::jsonb),
    (2, 'Fractional Security Partner', '$8,500', 'Monthly advisory retainer', '["Virtual security leadership", "Roadmap tracking and governance support", "Recurring stakeholder and engineering sessions"]'::jsonb),
    (3, 'Platform Delivery Pod', '$12,000', 'Monthly engineering engagement', '["Secure platform backlog execution", "Automation and reliability improvements", "Embedded enablement for internal teams"]'::jsonb)
ON CONFLICT DO NOTHING;