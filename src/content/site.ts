/**
 * All site copy and configuration lives here. Layout code reads from this file
 * and never hardcodes words, prices, hostnames, or contact details.
 *
 * Bracketed values like [EMAIL] are unfilled placeholders. They render visibly
 * in preview builds on purpose. `npm run prelaunch` fails while any remain, so
 * production cannot ship with one. Never replace a bracket with a guess.
 *
 * Copy rules (from the build spec, Section 2): no em-dashes, no "expert",
 * "guru", "leading", "world-class", "cutting-edge", "unlock", "seamless",
 * "leverage", "game-changer". No invented numbers, clients, or results.
 */

// ---------------------------------------------------------------------------
// Section 0 values. Fill these, then run `npm run build && npm run prelaunch`.
// ---------------------------------------------------------------------------

export const config = {
  businessName: '[BUSINESS_NAME]',
  entityName: '[ENTITY_NAME], LLC',
  /** Bare hostname, no protocol, no trailing slash. Example shape: name.com */
  domain: '[DOMAIN]',
  email: '[EMAIL]',
  bookingUrl: '[BOOKING_URL]',
  serviceArea: 'Western Massachusetts and remote',

  /**
   * Published prices. Set a value to null or '' to omit that price line.
   * Never write "contact for pricing".
   */
  prices: {
    install: '[INSTALL_PRICE]' as string | null,
    site: '[SITE_PRICE]' as string | null,
    care: '[CARE_PRICE]' as string | null,
  },

  caseStudy: {
    /** Set to false to remove the Proof section entirely. */
    show: true,
    /** 'YES' only if the client gave permission in writing. */
    permissionInWriting: '[YES/NO]' as 'YES' | 'NO' | string,
    /** Used only when permission is 'YES'. */
    displayName: '[CLIENT_DISPLAY_NAME]',
    /** Shown when permission is 'NO'. No firm name, logo, or screenshots. */
    anonymizedName: 'A Western Massachusetts law firm',
    bullets: [
      { label: 'Before', text: '[TODO] What existed before.' },
      { label: 'Installed', text: '[TODO] What was installed.' },
      { label: 'After', text: '[TODO] What changed.' },
    ],
  },

  /**
   * FAQ 4 insurance clause. Leave false until the professional liability and
   * cyber policy is actually bound.
   */
  insurancePolicyBound: false,
};

/** One place the canonical origin is built. Nothing else hardcodes a host. */
export const siteUrl = `https://${config.domain}`;

export const year = new Date().getFullYear();

// ---------------------------------------------------------------------------
// Page metadata
// ---------------------------------------------------------------------------

export const meta = {
  home: {
    title: `${config.businessName} | Office systems that answer, follow up, and schedule`,
    description:
      'I install the systems that answer, follow up, schedule, and ask for the review, so a small office stops losing work it already earned.',
  },
  privacy: {
    title: `Privacy policy | ${config.businessName}`,
    description: `How ${config.businessName} handles information sent through this site.`,
  },
  terms: {
    title: `Terms | ${config.businessName}`,
    description: `Site terms and service disclaimers for ${config.businessName}.`,
  },
  thanks: {
    title: `Message received | ${config.businessName}`,
    description: 'Your inquiry was sent.',
  },
  notFound: {
    title: `Page not found | ${config.businessName}`,
    description: 'That page does not exist.',
  },
};

// ---------------------------------------------------------------------------
// Home page sections, in page order
// ---------------------------------------------------------------------------

export const nav = {
  links: [
    { label: 'What I install', href: '#install' },
    { label: 'How it works', href: '#process' },
    { label: 'Pricing', href: '#pricing' },
  ],
  cta: 'Book a call',
};

export const hero = {
  h1: 'Your office is losing work it already earned.',
  subhead:
    'Missed calls, slow follow-up, and reviews nobody asked for. I install the systems that handle all three, then keep them running.',
  primary: 'Book a 20-minute call',
  secondary: { label: 'See what I install', href: '#install' },
};

export const problem = {
  heading: 'Where the work goes',
  cards: [
    {
      title: 'The missed call.',
      body: 'A new customer calls at 6:40 pm. Nobody answers. They call the next name on the list.',
    },
    {
      title: 'The slow follow-up.',
      body: 'An inquiry sits in an inbox for two days. The customer already hired someone.',
    },
    {
      title: 'The review that never came.',
      body: 'A happy client leaves. Nobody asks. Your competitor has 200 reviews and you have 14.',
    },
  ],
};

export const install = {
  id: 'install',
  heading: 'What I install',
  systems: [
    {
      name: 'Intake',
      outcome: 'Every inquiry gets an answer.',
      description: 'Web forms, calls, and messages land in one place and get a same-day reply.',
    },
    {
      name: 'Follow-up',
      outcome: 'Nobody falls through.',
      description: 'Leads and open matters get scheduled nudges until someone closes the loop.',
    },
    {
      name: 'Scheduling',
      outcome: 'Fewer phone tags.',
      description: 'Clients book, confirm, and reschedule without a staff member in the middle.',
    },
    {
      name: 'Reviews',
      outcome: 'Ask every time.',
      description: 'A request goes out after the work is done, with a direct link.',
    },
  ],
  siteNote: {
    lead: 'Need a site too?',
    body: 'I build fast, secure sites you own outright, with these systems wired in.',
  },
};

export const process = {
  id: 'process',
  heading: 'How it works',
  steps: [
    { title: 'Call.', body: 'Twenty minutes. I ask how work reaches you and where it stalls.' },
    { title: 'Scope.', body: 'You get a written scope with a fixed price and a delivery date.' },
    { title: 'Install.', body: 'I build it, test it with your staff, and document it.' },
    { title: 'Care.', body: 'A monthly plan covers monitoring, fixes, and small changes.' },
  ],
  note: {
    lead: 'A person checks the work.',
    body: 'Every system ships with a manual fallback and a human review step for anything sent to your customers.',
  },
};

export const proof = {
  heading: 'Proof',
};

export const pricing = {
  id: 'pricing',
  heading: 'Pricing',
  plans: [
    {
      name: 'Systems install',
      priceKey: 'install' as const,
      prefix: 'From ',
      suffix: '',
      terms: 'Fixed fee, written scope',
      includes: 'Setup, staff walkthrough, documentation',
    },
    {
      name: 'Site build',
      priceKey: 'site' as const,
      prefix: 'From ',
      suffix: '',
      terms: 'Fixed fee, you own it',
      includes: 'Design, build, launch, handoff',
    },
    {
      name: 'Care plan',
      priceKey: 'care' as const,
      prefix: '',
      suffix: '/month',
      terms: 'Month to month',
      includes: 'Monitoring, fixes, small edits',
    },
  ],
  notes: [
    { lead: 'No hourly billing.', body: 'You know the price before work starts.' },
  ],
  guarantee: {
    lead: 'Delivery guarantee.',
    before: 'If I miss the delivery date in your scope, ',
    linkText: 'the terms in your agreement',
    after: ' apply.',
  },
};

export const about = {
  heading: 'Who does the work',
  // Blake must confirm every factual sentence here before production.
  body: [
    "I'm Blake. I work inside a law office, so I build for places where a missed deadline or a leaked file costs real money. Before law school I closed more than 50 real estate transactions and ran my own business. I build these systems for my own work first, then install what holds up.",
  ],
  disclaimer: {
    lead: 'Not a law firm.',
    body: `${config.businessName} provides technology services only and does not give legal advice.`,
  },
};

const insuranceClause = ' and I carry professional liability and cyber coverage';

export const faq = {
  heading: 'Questions',
  items: [
    {
      q: 'Do I need to replace my current software?',
      a: 'Usually not. I connect what you already use and replace only what blocks the work.',
    },
    {
      q: 'Who owns what you build?',
      a: 'You do. Accounts sit in your name, and you get the documentation.',
    },
    {
      q: 'What happens if a system goes down?',
      a: 'Each one has a manual fallback your staff can run. The care plan covers the fix.',
    },
    {
      q: 'Is my data safe?',
      a: config.insurancePolicyBound
        ? `Access is limited to what the scope requires, credentials live in your accounts,${insuranceClause}.`
        : 'Access is limited to what the scope requires, and credentials live in your accounts.',
    },
    {
      q: 'Do you guarantee more customers?',
      a: 'No. I guarantee the system gets delivered as scoped. What your market does with a faster office is outside my control.',
    },
    {
      q: 'Do you work with law firms?',
      a: 'Yes, on fixed fees only.',
    },
  ],
};

export const contact = {
  id: 'contact',
  heading: 'Start with a call',
  intro: 'Book a time that works for you, or tell me what is stalling and I will reply by email.',
  bookLabel: 'Book a 20-minute call',
  emailLabel: 'Or email',
  form: {
    heading: 'Send an inquiry',
    fields: {
      name: { label: 'Name', max: 100 },
      email: { label: 'Email', max: 254 },
      organization: { label: 'Organization', max: 150, optional: 'optional' },
      type: {
        label: 'Type',
        options: ['Business', 'Professional firm', 'Nonprofit', 'Individual'],
      },
      message: { label: "What's stalling?", max: 1000 },
    },
    warning: 'Do not send confidential or sensitive information through this form.',
    submit: 'Send inquiry',
    sending: 'Sending...',
    noscript: `This form needs JavaScript for spam protection. You can email ${config.email} instead.`,
    errorGeneric: `Your message did not send. Please email ${config.email} directly.`,
    errorTurnstile: 'Please complete the spam check above, then send again.',
  },
};

export const footer = {
  copyright: `© ${year} ${config.entityName}`,
  links: [
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
  ],
  line: 'Technology services only. Not a law firm. No legal advice.',
};

export const thanks = {
  h1: 'Got it. Your message is on its way.',
  body: 'You will get a reply by email.',
  bookPrompt: 'Want to skip the back and forth?',
  back: 'Back to the home page',
};

export const notFound = {
  h1: 'That page does not exist.',
  back: 'Go to the home page',
};

// ---------------------------------------------------------------------------
// Legal pages. DRAFTS. Blake reviews and edits both before launch.
// ---------------------------------------------------------------------------

export const legalDraftBanner = 'DRAFT, review before publishing';

export const privacy = {
  h1: 'Privacy policy',
  updated: '[PRIVACY_EFFECTIVE_DATE]',
  sections: [
    {
      heading: 'What this site collects',
      body: [
        'The inquiry form asks for your name, email address, organization, organization type, and a short description of what is stalling. Organization is optional.',
        'Please do not send confidential or sensitive information through the form.',
      ],
    },
    {
      heading: 'How your inquiry is handled',
      body: [
        `When you submit the form, its contents are sent as one email to ${config.email}. The form contents are not stored in a database on this site, and message bodies are not logged.`,
        'The email is delivered through a third-party email delivery provider, which processes the message to send it.',
        'Email messages are kept in the inbox they are sent to until deleted.',
      ],
    },
    {
      heading: 'Spam protection',
      body: [
        'The form uses Cloudflare Turnstile to check that a person, not a bot, is sending it. Turnstile processes technical signals from your browser to make that check.',
        'To limit abuse, the site keeps a one-way hash of your IP address with a submission count for up to one hour, then deletes it automatically. The hash cannot be turned back into your IP address.',
      ],
    },
    {
      heading: 'Analytics',
      body: [
        'This site uses Cloudflare Web Analytics, which does not use cookies and does not track you across other sites. It counts page views and basic performance data.',
        'There is no advertising tracking, no social media pixels, and no Google Analytics.',
      ],
    },
    {
      heading: 'Sharing and sale',
      body: [`${config.businessName} does not sell or rent your information.`],
    },
    {
      heading: 'Deleting your information',
      body: [
        `To ask that your inquiry email be deleted, write to ${config.email}. You will get a confirmation once it is done.`,
      ],
    },
    {
      heading: 'Changes',
      body: ['If this policy changes, the updated version will be posted on this page with a new date.'],
    },
  ],
};

export const terms = {
  h1: 'Terms',
  updated: '[TERMS_EFFECTIVE_DATE]',
  sections: [
    {
      heading: 'Who operates this site',
      body: [`This site is operated by ${config.entityName} ("${config.businessName}").`],
    },
    {
      heading: 'Technology services only',
      body: [
        `${config.businessName} provides technology services. It is not a law firm and does not provide legal advice. Nothing on this site is legal advice.`,
      ],
    },
    {
      heading: 'No attorney-client relationship',
      body: [
        'Using this site, booking a call, or sending an inquiry does not create an attorney-client relationship with anyone.',
      ],
    },
    {
      heading: 'No promise of results',
      body: [
        `${config.businessName} does not promise any particular result, including more leads, revenue, search rankings, reviews, or case volume. Descriptions of systems on this site explain what they do, not what they will produce for your business.`,
      ],
    },
    {
      heading: 'Your service agreement controls',
      body: [
        'Any engagement is governed by a written, signed service agreement. If anything on this site conflicts with that agreement, the agreement controls. This includes delivery dates and what happens if a delivery date is missed.',
      ],
    },
    {
      heading: 'Limitation of liability',
      body: [
        `This site and its content are provided as is. To the extent the law allows, ${config.entityName} is not liable for any indirect, incidental, or consequential damages arising from use of this site.`,
      ],
    },
    {
      heading: 'Governing law',
      body: ['These terms are governed by the laws of the Commonwealth of Massachusetts.'],
    },
    {
      heading: 'Contact',
      body: [`Questions about these terms: ${config.email}.`],
    },
  ],
};
