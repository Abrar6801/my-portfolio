# Abrarullah Mohammed — Personal Portfolio

A personal portfolio website for Abrarullah Mohammed, AI/ML-focused Software Engineer. Built with vanilla HTML, CSS, and JavaScript — no frameworks, no build tools, no dependencies.

**Live site:** [your-vercel-url.vercel.app](https://your-vercel-url.vercel.app)

---

## Features

- Letter-by-letter hero name animation
- Typewriter role rotator
- Infinite scrolling skill carousel
- Animated metric counters
- Fade-in scroll animations via IntersectionObserver
- Resume dropdown with separate Software Engineer and AI/ML resumes
- Working contact form (mailto)
- Custom cursor that disappears when leaving the page
- Fully responsive — mobile, tablet, desktop
- Custom SVG favicon
- Content Security Policy headers

---

## Tech Stack

| Layer | Choice |
|---|---|
| Markup | HTML5 |
| Styling | CSS3 (custom properties, grid, flexbox, animations) |
| Scripting | Vanilla JavaScript (ES5-compatible) |
| Fonts | Syne + JetBrains Mono via Google Fonts |
| Hosting | Vercel |

---

## Project Structure

```
my-portfolio/
├── index.html              # Shell — navbar, footer, section placeholders
├── styles.css              # All styles
├── script.js               # Fetches sections, then initialises all features
├── favicon.svg             # SVG favicon (AM_ in accent colour)
├── photo.jpg               # Profile photo
├── resume-swe.pdf          # Software Engineer resume
├── resume-aiml.pdf         # AI / ML Engineer resume
└── sections/               # Section HTML fragments (loaded via fetch)
    ├── hero.html
    ├── skills.html
    ├── experience.html
    ├── projects.html
    ├── education.html
    ├── publications.html
    └── contact.html
```

Sections are kept in separate files and injected at runtime by `script.js` using `Promise.all` + `fetch`. This keeps `index.html` clean and each section independently editable.

---

## Running Locally

You need an HTTP server — `fetch()` does not work over `file://`.

**Python:**
```bash
python -m http.server 8080
```

**Node.js:**
```bash
npx serve .
```

Then open `http://localhost:8080` in your browser.

---

## Deployment

The site is deployed on **Vercel** and auto-deploys on every push to `main`.

```bash
git add .
git commit -m "your message"
git push
```

---

## Sections

| Section | File |
|---|---|
| Hero / About | `sections/hero.html` |
| Skills | `sections/skills.html` |
| Experience | `sections/experience.html` |
| Projects | `sections/projects.html` |
| Education | `sections/education.html` |
| Publications & Certifications | `sections/publications.html` |
| Contact | `sections/contact.html` |

---

## Contact

- Email: abrarullahm2001@gmail.com
- LinkedIn: [mohammed-abrarullah-92886a193](https://www.linkedin.com/in/mohammed-abrarullah-92886a193)
- GitHub: [Abrar6801](https://github.com/Abrar6801)
