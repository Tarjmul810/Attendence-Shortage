const features = [
  'Nothing Dot font as central typography',
  'Light mode default with dark mode toggle',
  'Custom cursor (dot or crosshair)',
  'About section with mid-thought opener',
  'Projects panel with story-driven case studies',
  'Notes section (public second brain)',
  'Platform links written in your voice',
  'Version history of self (retrospective changelog)',
  'Guestbook (physical guestbook feeling)',
  "Now page (what you're currently into)",
  'Reading / listening shelf',
  'Uses / stack page',
  'Site manifesto',
  'Micro-interactions throughout',
  'Time-aware greetings',
  'Intentional load experience',
  'Open graph image',
  '404 page as a feature',
  'Colophon',
  'Footer personality line',
  'Quiet visitor counter',
  'Contact without a form',
  'Honest incompleteness (living document feeling)'
];

const stack = [
  ['Framework', 'Next.js 14 App Router + TypeScript'],
  ['Styling', 'Tailwind CSS'],
  ['Animation', 'Framer Motion with LazyMotion/domAnimation'],
  ['Database', 'Supabase (guestbook)'],
  ['Cache / Counter', 'Upstash Redis'],
  ['Content', 'Velite or next-mdx-remote for MDX'],
  ['Deployment', 'Vercel'],
  ['OG Images', '@vercel/og on edge runtime'],
  ['Theme', 'next-themes with cookie storage'],
  ['Validation', 'Zod on all API routes']
];

const problems = [
  {
    title: 'Load Experience Hurting Core Web Vitals',
    solution: 'Load and parse all content first; reveal using CSS animation only. Never gate DOM render behind JavaScript.'
  },
  {
    title: 'Framer Motion Bundle Size',
    solution: 'Use LazyMotion + domAnimation and reserve JS animation for route transitions only.'
  },
  {
    title: 'Guestbook on Critical Render Path',
    solution: "Use ISR and revalidatePath('/guestbook') from POST to keep data fresh without SSR cost."
  },
  {
    title: 'Guestbook as Attack Surface',
    solution: 'Validate with Zod, cap length to 280, sanitize server-side, normalize Unicode, and rate-limit by IP.'
  },
  {
    title: 'Visitor Counter Bot Inflation',
    solution: 'Increment once per IP per 24 hours via Upstash middleware.'
  },
  {
    title: 'Dark Mode Flash on Reload',
    solution: 'Use cookie-backed theme state so server can render correct mode immediately.'
  },
  {
    title: 'MDX Build Time Scaling',
    solution: 'Compile only published content and keep drafts out of build globs.'
  },
  {
    title: 'Micro-Interactions Performance Death',
    solution: 'Use CSS transitions broadly; if JS animation is needed, animate only transform/opacity.'
  }
];

const principles = [
  'Thin air movement — transitions feel like air, never page flips',
  'Honest incompleteness — living document, never “finished”',
  'Voice over polish — personality first',
  'Intentional whitespace — emptiness is a decision',
  'Quiet, never loud — no visual shouting',
  'Static by default — dynamic only where needed'
];

const THEME_KEY = 'portfolio_theme_v1';

function render() {
  document.getElementById('feature-list').innerHTML = features.map((item) => `<li>${item}</li>`).join('');
  document.getElementById('stack-table').innerHTML = stack.map(([layer, decision]) => `<tr><td>${layer}</td><td>${decision}</td></tr>`).join('');
  document.getElementById('problems-list').innerHTML = problems.map((item, idx) => `
    <details ${idx === 0 ? 'open' : ''}>
      <summary>${item.title}</summary>
      <p class="problem-content">${item.solution}</p>
    </details>
  `).join('');
  document.getElementById('principles-list').innerHTML = principles.map((item) => `<li>${item}</li>`).join('');
}

function applyGreeting() {
  const hour = new Date().getHours();
  const message = hour < 12 ? 'Good morning.' : hour < 17 ? 'Good afternoon.' : 'Good evening.';
  document.getElementById('greeting').textContent = message;
}

function setupThemeToggle() {
  const root = document.documentElement;
  const button = document.getElementById('theme-toggle');

  const setTheme = (theme) => {
    root.setAttribute('data-theme', theme);
    button.textContent = theme === 'light' ? 'DARK' : 'LIGHT';
    localStorage.setItem(THEME_KEY, theme);
  };

  setTheme(localStorage.getItem(THEME_KEY) || 'light');
  button.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    setTheme(next);
  });
}

function setupCursor() {
  if (!window.matchMedia('(pointer: fine)').matches) return;
  const cursor = document.getElementById('cursor');

  window.addEventListener('mousemove', (event) => {
    cursor.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`;
  });

  document.querySelectorAll('button, summary').forEach((el) => {
    el.addEventListener('mouseenter', () => cursor.style.scale = '1.2');
    el.addEventListener('mouseleave', () => cursor.style.scale = '1');
  });
}

render();
applyGreeting();
setupThemeToggle();
setupCursor();
