<div align="center">
  <img src="./public/logo.png" alt="QueryLoop Logo" width="120" />
</div>

<h3 align="center">QueryLoop</h3>

<div align="center">

[![Status](https://img.shields.io/badge/status-active-success.svg)]()
[![CI](https://img.shields.io/badge/CI-passing-brightgreen)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)]()
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](/LICENSE)

</div>

---

<p align="center">
QueryLoop is a modern full-stack Q&A platform built with Next.js and Supabase.  
It enables developers and IT enthusiasts to ask questions, share answers, vote on content, and build reputation within a structured and moderated community environment.
</p>

---

## 📝 Table of Contents

- [About](#about)
- [Features](#features)
- [Testing & Code Quality](#testing--code-quality)
- [Usage](#usage)
- [Deployment](#deployment)
- [Built Using](#built-using)
- [Project Structure](#project-structure)
- [Authors](#authors)
- [Acknowledgements](#acknowledgements)

---

## 🧐 About

QueryLoop is a community-driven Q&A platform inspired by developer knowledge-sharing ecosystems.  
It focuses on:

- Clean UI/UX
- Secure authentication
- Structured question-tag relationships
- Community moderation
- Maintainable and type-safe codebase

The project was refactored to follow modern React, Next.js App Router, and TypeScript best practices.

---

## ✨ Features

- 🔐 User authentication (Supabase Auth)
- ❓ Ask and answer questions
- 👍 Upvote / 👎 Downvote system
- 🏷️ Tag-based filtering
- 👤 User profiles
- 🛠️ Admin moderation panel
- 🔎 Search functionality with instant clear ("X") option
- 🔙 Back-to-all-questions navigation button
- 🚀 Optimized image handling via Next.js `<Image />`

---

## 🧪 Testing & Code Quality

This project includes both **component tests** and **end-to-end (E2E) tests**:

### Component Tests (Jest + React Testing Library)
- Header rendering
- Homepage rendering
- Error state components

### E2E Tests (Playwright)
- Page routing
- Authentication redirects
- Protected admin access
- Page visibility and navigation

### Code Quality Improvements

- All ESLint errors resolved
- React Hooks dependency issues fixed
- Removed all `any` types (strict TypeScript compliance)
- Correct handling of Supabase relational array data
- Proper error narrowing (`unknown` + type guards)
- Removed unused variables and improved const usage
- Added ESLint ignore rules for generated folders
- CI pipeline configured (test → deploy)

The project builds successfully and passes all tests.

---

## 🎈 Usage

### Local Development

```bash
npm install
npm run dev
```

### Run Tests

```bash
npm run test
npm run test:e2e
```

### Run Lint

```bash
npm run lint
```

---

## 🚀 Deployment

QueryLoop is deployed using:

- **Vercel** for hosting
- **Supabase** for:
  - Authentication
  - PostgreSQL database
  - Storage

CI/CD pipeline automatically:
1. Runs tests
2. Builds project
3. Deploys to Vercel (main branch only)

---

## ⛏️ Built Using

- [Next.js](https://nextjs.org/) – React framework (App Router)
- [Supabase](https://supabase.com/) – Auth & Database
- [TypeScript](https://www.typescriptlang.org/) – Type safety
- [TailwindCSS](https://tailwindcss.com/) – Styling
- [Playwright](https://playwright.dev/) – E2E testing
- [Jest](https://jestjs.io/) – Component testing

---

## 📁 Project Structure (Simplified)

```
app/
  ├── admin/
  ├── auth/
  ├── question/
  ├── profile/
  ├── components/
tests/
  ├── components/
  ├── e2e/
scripts/
```

---

## ✍️ Author

**rosko112**  
Idea, design, development, testing, CI configuration and refactoring.  
https://github.com/rosko112

---

## 🎉 Acknowledgements

- Inspiration from community-driven developer platforms
- Open-source ecosystem
- Next.js & Supabase communities