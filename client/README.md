# ✈️ SkyRoute Web (`skyroute-web`)

> **Next-Generation Fare Intelligence & Multi-Origin Flight Aggregator**  
> Built with Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui, and TanStack Query v5.

[![Next.js](https://img.shields.io/badge/Next.js-15.0-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Backend](https://img.shields.io/badge/Backend-Spring_Boot_3.4_(Java_21)-6DB33F?logo=springboot&logoColor=white)](#backend-integration)

---

## 📖 Overview

**SkyRoute** is a high-concurrency flight search and fare intelligence platform designed to solve the four biggest blind spots of legacy flight aggregators (Google Flights, Skyscanner):

1. **🧳 TrueCost™ Baggage Normalizer:** Dynamically unbundles and recalculates flight prices in real time based on your actual luggage needs (Personal Item vs. Overhead Carry-On vs. Checked Bags), exposing hidden ULCC drip pricing (Ryanair, Wizz, Spirit) alongside full-service carriers (Emirates, British Airways, Delta).
2. **🌍 Group Rendezvous™ Multi-Origin Matrix:** Enter up to 10 different origin airports (`DXB`, `LHR`, `JFK`) for distributed teams or friend groups and rank the best mutual destination hubs by **Minimum Total Spend**, **Fairest Price Split (Lowest Variance)**, or **Balanced Flight Duration**.
3. **☀️ Intentional Stopover™ Explorer:** Highlights layovers with **8–20 hours of local daylight (`08:00–22:00`)** at airports with fast downtown transit, turning connections into free mini day-trips.
4. **🎯 Sniper™ Mistake-Fare Tracker:** Configure custom price ceilings and statistical drop alerts (`>30%` below the 90-day moving average) delivered instantly via **Telegram Bot** and **Email**.

---

## 🏗️ Tech Stack & Architecture

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | **Next.js 15 (App Router)** | Server Components (RSC), URL-driven search state, Edge middleware |
| **UI Library** | **React 19 + TypeScript 5** | Strict type-safety, optimistic UI updates (`useOptimistic`, `useTransition`) |
| **Styling & Components** | **Tailwind CSS + shadcn/ui** | Accessible Radix UI primitives, dark-mode-first aviation dashboard aesthetic |
| **Server State & Caching** | **TanStack Query v5** | Request deduplication, stale-while-revalidate caching, optimistic baggage toggles |
| **URL State Management** | **`nuqs`** | Type-safe URL query string synchronization for shareable flight & group searches |
| **Data Visualization** | **Recharts** | 30/90-day rolling price history charts, Z-score anomaly bands, group cost breakdowns |
| **Authentication** | **Supabase Auth (`@supabase/ssr`)** | JWT session management passed via `Authorization: Bearer` to the Spring Boot API |
| **Icons** | **Lucide React** | Clean, consistent iconography for baggage tiers, transit badges, and airline metadata |

---

## 📂 Project Directory Structure

```text
skyroute-web/
├── public/
│   └── airlines/                  # SVG/PNG carrier logos indexed by 2-letter IATA code (EK.svg, BA.svg)
├── src/
│   ├── app/                       # Next.js 15 App Router
│   │   ├── (auth)/                # Login / OAuth callback routes (Supabase SSR)
│   │   ├── (main)/
│   │   │   ├── page.tsx           # Landing page + Unified Command Search Bar
│   │   │   ├── search/
│   │   │   │   └── page.tsx       # Core Flight Search + TrueCost Interactive Results
│   │   │   ├── rendezvous/
│   │   │   │   └── page.tsx       # Multi-Origin Group Rendezvous Matrix & Map View
│   │   │   └── alerts/
│   │   │       └── page.tsx       # Authenticated "Sniper" Price Tracker Dashboard
│   │   ├── layout.tsx             # Root providers (QueryClient, ThemeProvider, NuqsAdapter)
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                    # shadcn/ui primitives (Button, Dialog, Popover, Command, Slider)
│   │   ├── search/
│   │   │   ├── AirportCombobox.tsx        # Sub-5ms debounced autocomplete (hits /api/v1/airports/autocomplete)
│   │   │   ├── BaggageControlBar.tsx      # Instant Carry-On & Checked Bag counter toggles
│   │   │   ├── FlightOfferCard.tsx        # Offer card with TrueCost breakdown tooltip & Stopover badge
│   │   │   ├── IntentionalStopoverTag.tsx # Daylight window & net downtown exploration time pill
│   │   │   └── PriceVerifyModal.tsx       # Two-phase pre-checkout live price lock modal
│   │   ├── rendezvous/
│   │   │   ├── MultiOriginBuilder.tsx     # Dynamic N-origin airport + traveler count input list
│   │   │   ├── OptimizationModeTabs.tsx   # Switch between Min Total Cost, Fair Split, Duration Balance
│   │   │   └── HubComparisonCard.tsx      # Per-origin cost & flight time breakdown matrix
│   │   └── charts/
│   │       └── PriceHistoryChart.tsx      # Recharts 90-day rolling trendline & mistake-fare threshold
│   ├── hooks/
│   │   ├── useFlightSearch.ts     # TanStack Query hook for POST /api/v1/flights/search
│   │   ├── useRendezvousSearch.ts # TanStack Query hook for POST /api/v1/flights/rendezvous
│   │   ├── useAirportSearch.ts    # Debounced hook for GET /api/v1/airports/autocomplete
│   │   └── useSniperAlerts.ts     # CRUD mutations for /api/v1/alerts
│   ├── lib/
│   │   ├── api-client.ts          # Typed fetch wrapper injecting Supabase JWT & error interceptors
│   │   ├── truecost-client.ts     # Client-side optimistic baggage recalculation helper
│   │   ├── supabase/              # Supabase browser & server clients
│   │   └── utils.ts               # Currency formatters, duration helpers (435m -> "7h 15m")
│   └── types/
│       └── skyroute.types.ts      # TypeScript interfaces mirroring Spring Boot Java 21 DTO Records
├── .env.example
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json