# ♾️ Infinite

> *Drop in a PDF or a question, and get an interactive study page back.*

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-412991?logo=openai)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?logo=firebase&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)


## 🌟 Highlights

- 📁 **Files, prompts, or both** — upload PDFs, DOCX or TXT files, type a prompt, or combine them in one screen
- 🤖 **AI-written learning pages** — GPT-4o reads your documents and produces structured, well-formatted content
- 🧩 **Rich building blocks** — diagrams (arrow, loop, matrix, pyramid), callouts, toggles, image galleries and page cards
- ✏️ **Edit in place** — switch between a block-based editor and full-text editing, with live preview
- ☁️ **Saved to the cloud** — pages are stored in Firebase with Google sign-in
- 🏷️ **Zero-friction titles** — titles are generated from your files or prompt automatically


## ℹ️ Overview

Infinite turns raw material into study material. Upload lecture slides or a paper and optionally tell it what to focus on. Infinite sends the files to OpenAI's file-input API and gets back a document built from MDX components. You can then open that page, reorganize it, edit it and keep building on it.

Every generated page can link to new pages, so a topic can branch out as far as you want to take it. That's where the name comes from.


### ✍️ Author

Built by [Yuki Ishihara](https://github.com/pe-tanman). More projects on my [portfolio](https://portfolio-pe-tanmans-projects.vercel.app).


## 🚀 Usage

Go to **`/new`** and choose how to start:

| Mode | What you do | What you get |
| --- | --- | --- |
| **Files only** | Drag in PDFs or documents | A page summarizing and explaining them |
| **Prompt only** | Describe a topic (quick templates available) | A page generated from scratch |
| **Files + prompt** | Upload files *and* say what to focus on | A page tailored to your question |

Limits: up to **5 files**, **32 MB each**. If the OpenAI upload fails, Infinite falls back to base64 processing.


## ⬇️ Installation

Requirements: **Node.js 18+**, an **OpenAI API key**, and a **Firebase** project with Firestore and Authentication enabled.

```bash
git clone https://github.com/pe-tanman/infinite.git
cd infinite
npm install
```

Create a `.env.local` file in the project root:

```bash
OPENAI_API_KEY=sk-...
UNSPLASH_ACCESS_KEY=...        # optional: cover images
UNSPLASH_SECRET_KEY=...        # optional
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

Put your Firebase web config in `lib/firebase/clientApp.js` (see [FIRESTORE_SETUP.md](FIRESTORE_SETUP.md) for the setup steps). Then run:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Stack: Next.js 15 (App Router) · React 19 · Tailwind CSS 4 · OpenAI SDK · Firebase · next-mdx-remote.
