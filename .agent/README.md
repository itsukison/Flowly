# Flowly - Japan-First CRM Platform

A modern, responsive CRM platform built with Next.js 16, Tailwind CSS, Supabase, and Framer Motion. Flowly is a Japanese-first CRM that automatically enriches customer data, eliminates duplicates, and adapts to how Japanese businesses actually work.

**Current Phase**: Phase 1 - Landing Page Rebrand + Supabase Auth Setup

## Core Features (Planned)

### MVP Features
- **Smart Data Import**: Drag-and-drop Excel/CSV with AI column mapping
- **Automatic Deduplication**: Real-time duplicate detection with merge suggestions
- **Contact Enrichment**: One-click enrichment for missing emails, phone numbers
- **Customer Status Tracking**: Visual kanban board with customizable stages
- **Flexible Custom Forms**: Add/remove fields without IT help
- **Simple Search & Filters**: Universal search with saved filter combinations

### Current Implementation
- **Responsive Landing Page**: Fully responsive layout that works on mobile, tablet, and desktop
- **Internationalization**: Built-in language toggle supporting English and Japanese
- **Custom Animations**: Slideshow, ticker, and noise effect components
- **Modern UI**: Clean design following styling.md guidelines
- **Supabase Auth**: Sign up, login, logout functionality (Phase 1)

## Tech Stack

### Frontend
- **Next.js 16**: React framework with App Router
- **React 19**: Latest React features
- **TypeScript**: Type-safe development
- **Tailwind CSS 4**: Utility-first CSS framework
- **Framer Motion**: Animation library
- **Geist Font**: Modern, clean typography

### Backend (Phase 1+)
- **Supabase**: Postgres + Auth + Storage + Edge Functions
- **PostgreSQL**: Database with Row-Level Security (RLS)
- **pg_trgm**: Fuzzy matching for Japanese text (Phase 2+)

### Future Stack
- **Inngest/Upstash**: Queue system for enrichment jobs
- **SheetJS**: Excel/CSV parsing
- **Sentry**: Error tracking
- **Vercel Analytics**: Performance monitoring

## Getting Started

First, install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
app/
├── app/
│   ├── page.tsx          # Main landing page
│   ├── layout.tsx        # Root layout with fonts and metadata
│   └── globals.css       # Global styles and animations
├── components/
│   ├── Header.tsx        # Header with language toggle
│   ├── Slideshow.tsx     # Image slideshow component
│   ├── Ticker.tsx        # Text ticker component
│   └── Noise.tsx         # Canvas noise effect
├── contexts/
│   └── LanguageContext.tsx  # Language state management
├── lib/
│   └── translations.ts   # Translation dictionary (EN/JP)
└── public/
    ├── slideshow-img*.png
    ├── avatar*.png
    └── noise.svg
```

## Components

### Header
Navigation header with language toggle button (EN/JP) and responsive menu.

### Slideshow
Auto-rotating image carousel with smooth transitions.

### Ticker
Vertical scrolling text animation for displaying services.

### Noise
Canvas-based grain effect for adding texture to backgrounds.

## Internationalization

The site supports English and Japanese languages:
- Language toggle in header
- All content translated using React Context
- Maintains layout integrity across both languages
- Translation keys stored in `lib/translations.ts`

## Customization

Colors are defined in `globals.css` using CSS variables:
- `--woodsmoke`: #09090B (primary dark)
- `--alabaster`: #FAFAFA (light background)
- `--storm-gray`: #71717B (text secondary)
- `--iron`: #E4E4E7 (borders)

## Build for Production

```bash
npm run build
npm start
```

## Deploy on Vercel

The easiest way to deploy is using [Vercel](https://vercel.com/new).
