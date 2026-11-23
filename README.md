# RAAVE — Modern Reading Community & Book Discovery Platform

> An editorial, high-performance book discovery and reading community platform inspired by Goodreads, Letterboxd, Pinterest, and Notion.

---

## 🌟 Overview

**RAAVE** is a full-stack reading community platform designed to replace legacy book cataloguing software with an elegant, responsive, and distraction-free experience. Built with **React 18 + Vite + Tailwind CSS** on the frontend, **Node.js + Express** on the backend, and **Supabase (PostgreSQL)** for robust relational data persistence and authentication.

### Key Highlights
- **Goodreads-grade Functionality**: 3 default shelves (*Want to Read*, *Currently Reading*, *Read*), custom shelves, reading challenge tracker, and CSV import/export.
- **Letterboxd-style Social Dynamics**: Follow readers, activity feeds, spoiler-flagged reviews, like/comment threads, and top-4 all-time favorites showcase.
- **Pinterest-grade Visual Discovery**: Real-time integration with **Google Books API** and **Open Library API** with rich book spine depth, rating filters, and genre carousels.
- **Notion-inspired Reading Journal**: Private chapter logs, thought annotations, and a dedicated **Favorite Quotes Collection** across all shelved books.
- **Side-by-Side Book Comparison**: Compare page counts, publication dates, publishers, average ratings, and community reviews.
- **Dark Mode Support**: Seamless toggle between warm off-white parchment and obsidian night themes.

---

## 🏗️ Architecture & Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide React, Framer Motion, Zustand, Canvas Confetti |
| **Backend** | Node.js, Express, Better-SQLite3 / Supabase JS Client, REST API |
| **Database** | Supabase (PostgreSQL 15+) with full SQLite parity engine for zero-config offline execution |
| **APIs** | Google Books API & Open Library Search API with automatic caching and cover resolution |
| **State Management** | Zustand (`useAuthStore`, `useThemeStore`) |

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js `v18+` or `v20+` (Tested on `v24.19.0`)
- npm `v9+` or `v11+`

### 1. Clone & Install Dependencies
```bash
# Install root, server, and client packages
npm run install:all
```

### 2. Run the Full-Stack Application
```bash
# Starts both Express backend (port 5001) and Vite client (port 5173)
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.
*(Alternatively, [http://localhost:5001](http://localhost:5001) serves the built production bundle directly!)*

### 3. Demo Reader Personas (One-Click Testing)
The application includes pre-seeded profiles to test multi-user interactions:
- **Elena Rostova** (`elena_reads`): Speculative fiction & philosophy enthusiast (Active reading challenge: 24/36).
- **Marcus Vance** (`marcus_aurelius_club`): Stoicism, ancient history, and non-fiction.
- **Sophia Chen** (`sophia_reads`): High fantasy, cyberpunk, and mystery.
- **Alex Wright** (`alex_wright`): Behavioral economics and productivity.

*Use the active persona dropdown in the top navbar to switch between users in 1 click!*

---

## 🗄️ Database Architecture & Setup

### Supabase / PostgreSQL Setup
1. Create a project in [Supabase](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Run the complete migration script located at:
   ```
   supabase/migrations/20240101000000_raave_schema.sql
   ```
4. Copy your project URL and `anon` / `service_role` key into `.env`:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your-anon-or-service-key
   PORT=5001
   ```

---



---

## 📜 License
MIT License. Crafted with care for the global reading community.
