# Chatbase Landing Page - Next.js

A modern, responsive landing page for Chatbase built with Next.js 16, Tailwind CSS, and Framer Motion.

## Features

- **Responsive Design**: Fully responsive layout that works on mobile, tablet, and desktop
- **Custom Animations**: 
  - Slideshow component with auto-rotating images
  - Ticker component with scrolling text
  - Noise effect background using canvas
- **Modern UI**: Clean design with gradient backgrounds, glassmorphism effects, and smooth transitions
- **Optimized Performance**: Built with Next.js for optimal loading and SEO

## Tech Stack

- **Next.js 16**: React framework with App Router
- **Tailwind CSS 4**: Utility-first CSS framework
- **Framer Motion**: Animation library
- **TypeScript**: Type-safe development
- **Inter Font**: Modern, clean typography

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
│   ├── Slideshow.tsx     # Image slideshow component
│   ├── Ticker.tsx        # Text ticker component
│   └── Noise.tsx         # Canvas noise effect
└── public/
    ├── slideshow-img*.png
    ├── avatar*.png
    └── noise.svg
```

## Components

### Slideshow
Auto-rotating image carousel with smooth transitions.

### Ticker
Vertical scrolling text animation for displaying services.

### Noise
Canvas-based grain effect for adding texture to backgrounds.

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
