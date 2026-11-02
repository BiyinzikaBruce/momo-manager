# MoMo Manager — Design Style Guide

> Dark mode: SUPPORTED (default dark). All tokens include both light and dark variants.

---

## Visual Reference

The design is anchored to a dark fintech mobile app aesthetic featuring a deep near-black charcoal background (`#0D0D12`), a dramatic pink-to-orange hero gradient (`#E040A0` → `#FF6B35`) used on balance and float cards, and soft purple ambient glows in the background. Cards use a glassmorphism treatment — semi-transparent dark surfaces with low-opacity borders. Typography is Inter at heavy weights (800) for financial figures and 400 for body text. Buttons are pill-shaped with gradient fills for primary CTAs and frosted-glass dark fills for secondary actions. Spacing is generous. The overall energy is: **premium · dark · bold fintech**.

---

## 1. Brand Identity

**Product Name:** MoMo Manager
**Tagline:** Mobile money, managed.
**Brand Voice:** Confident, precise, trustworthy — built for operators who move money daily.

---

## 2. Color Palette

### Tailwind v4 CSS-first config (`app/globals.css`)

```css
@import "tailwindcss";

@theme {
  /* === PRIMARY GRADIENT === */
  --color-primary-from: #E040A0;
  --color-primary-to: #FF6B35;
  --color-primary: #E040A0;
  --color-primary-foreground: #FFFFFF;

  /* === PURPLE ACCENT === */
  --color-accent: #7B2FBE;
  --color-accent-light: #9B4FDE;
  --color-accent-foreground: #FFFFFF;

  /* === BACKGROUNDS === */
  --color-background: #0D0D12;
  --color-background-secondary: #13131A;
  --color-background-tertiary: #1A1A24;
  --color-surface: rgba(255, 255, 255, 0.04);
  --color-surface-hover: rgba(255, 255, 255, 0.07);
  --color-surface-border: rgba(255, 255, 255, 0.08);

  /* === TEXT === */
  --color-foreground: #FFFFFF;
  --color-muted-foreground: rgba(255, 255, 255, 0.55);
  --color-subtle: rgba(255, 255, 255, 0.3);

  /* === SEMANTIC === */
  --color-success: #22C55E;
  --color-success-bg: rgba(34, 197, 94, 0.12);
  --color-warning: #F59E0B;
  --color-warning-bg: rgba(245, 158, 11, 0.12);
  --color-danger: #EF4444;
  --color-danger-bg: rgba(239, 68, 68, 0.12);
  --color-info: #3B82F6;
  --color-info-bg: rgba(59, 130, 246, 0.12);

  /* === MOBILE LINE COLORS (per network) === */
  --color-mtn: #FFCC00;
  --color-airtel: #FF0000;
  --color-vodacom: #E60026;
  --color-tigo: #003DA5;
  --color-safaricom: #4CAF50;
  --color-orange: #FF6600;

  /* === BORDERS === */
  --color-border: rgba(255, 255, 255, 0.08);
  --color-border-strong: rgba(255, 255, 255, 0.15);

  /* === RADIUS === */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 20px;
  --radius-pill: 9999px;

  /* === SHADOWS === */
  --shadow-card: 0 4px 24px rgba(0, 0, 0, 0.4);
  --shadow-glow-pink: 0 0 40px rgba(224, 64, 160, 0.2);
  --shadow-glow-orange: 0 0 40px rgba(255, 107, 53, 0.15);
}

/* Light mode overrides */
.light {
  --color-background: #F5F5F8;
  --color-background-secondary: #FFFFFF;
  --color-background-tertiary: #EBEBF0;
  --color-surface: rgba(0, 0, 0, 0.03);
  --color-surface-hover: rgba(0, 0, 0, 0.06);
  --color-surface-border: rgba(0, 0, 0, 0.08);
  --color-foreground: #0D0D12;
  --color-muted-foreground: rgba(13, 13, 18, 0.55);
  --color-border: rgba(0, 0, 0, 0.08);
  --color-border-strong: rgba(0, 0, 0, 0.15);
  --shadow-card: 0 4px 16px rgba(0, 0, 0, 0.08);
}
```

### Named Roles

| Token | Dark Value | Light Value | Usage |
|---|---|---|---|
| `--color-background` | `#0D0D12` | `#F5F5F8` | Page background |
| `--color-background-secondary` | `#13131A` | `#FFFFFF` | Card/panel background |
| `--color-background-tertiary` | `#1A1A24` | `#EBEBF0` | Nested sections |
| `--color-surface` | `rgba(255,255,255,0.04)` | `rgba(0,0,0,0.03)` | Glassmorphism card fill |
| `--color-primary` | `#E040A0` | `#E040A0` | Brand pink |
| `--color-primary-to` | `#FF6B35` | `#FF6B35` | Gradient end orange |
| `--color-accent` | `#7B2FBE` | `#7B2FBE` | Purple glow/accent |
| `--color-foreground` | `#FFFFFF` | `#0D0D12` | Primary text |
| `--color-muted-foreground` | `rgba(255,255,255,0.55)` | `rgba(13,13,18,0.55)` | Secondary text |
| `--color-success` | `#22C55E` | `#16A34A` | Deposit / positive |
| `--color-warning` | `#F59E0B` | `#D97706` | Low float / warning |
| `--color-danger` | `#EF4444` | `#DC2626` | Withdrawal / error |

---

## 3. Typography

**Font:** Inter (Google Fonts)
**Weights loaded:** 400 (Regular), 700 (Bold), 800 (ExtraBold)

```html
<!-- In layout.tsx -->
import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'], weight: ['400', '700', '800'] });
```

### Type Scale

| Role | Size | Weight | Usage |
|---|---|---|---|
| Display / Amount | 32–48px | 800 | Balance cards, float totals |
| Heading 1 | 24px | 700 | Page titles |
| Heading 2 | 18px | 700 | Section headers, card titles |
| Heading 3 | 14px | 700 | Table headers, labels |
| Body | 14px | 400 | Standard text, descriptions |
| Caption | 12px | 400 | Timestamps, meta info |
| Badge | 11px | 700 | Status pills |

### Tailwind utility usage
```html
<!-- Financial amount display -->
<p class="text-4xl font-extrabold tracking-tight text-white">UGX 2,450,000</p>

<!-- Card title -->
<h3 class="text-sm font-bold uppercase tracking-widest text-white/50">Available Float</h3>

<!-- Body text -->
<p class="text-sm font-normal text-white/55">Last updated 3 minutes ago</p>
```

---

## 4. Aesthetic Philosophy

MoMo Manager uses a **dark-first glassmorphism** design language. The visual hierarchy is built around:

1. **Gradient hero elements** — Float and bank balance cards use the pink-orange gradient as a full-card background, establishing them as the most important data on screen.
2. **Glass-surface cards** — Secondary content sits on `rgba(255,255,255,0.04)` panels with `1px rgba(255,255,255,0.08)` borders, giving depth without distraction.
3. **Colour-coded mobile lines** — Each telecom operator has a branded accent colour used on line badges and float bars.
4. **Semantic transaction colours** — Deposits are green, withdrawals are red, transfers are blue — consistent everywhere.
5. **Generous whitespace** — Dashboards breathe. No cramped tables. Padding 24px minimum inside cards.

---

## 5. Component Specifications

### Gradient Hero Card (Float / Balance display)
```tsx
// components/ui/gradient-card.tsx
<div className="relative overflow-hidden rounded-[20px] p-6"
     style={{ background: 'linear-gradient(135deg, #E040A0 0%, #FF6B35 100%)' }}>
  <p className="text-xs font-bold uppercase tracking-widest text-white/70 mb-1">Available Float</p>
  <p className="text-4xl font-extrabold text-white tracking-tight">UGX 4,250,000</p>
  <p className="text-xs text-white/60 mt-2">MTN Uganda · Kampala Main</p>
  {/* Subtle glow overlay */}
  <div className="absolute inset-0 rounded-[20px]"
       style={{ background: 'radial-gradient(ellipse at top left, rgba(255,255,255,0.12) 0%, transparent 60%)' }}/>
</div>
```

### Glass Card (Secondary content)
```tsx
<div className="rounded-[16px] border border-white/8 bg-white/4 backdrop-blur-md p-5 shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
  {/* content */}
</div>
```

### Stat Card (Dashboard KPI)
```tsx
<div className="rounded-[16px] border border-white/8 bg-[#13131A] p-5">
  <div className="flex items-center justify-between mb-3">
    <span className="text-xs font-bold uppercase tracking-widest text-white/50">Transactions Today</span>
    <div className="w-8 h-8 rounded-full bg-white/6 flex items-center justify-center">
      <i className="ti ti-arrows-exchange text-pink-400 text-base" aria-hidden="true"/>
    </div>
  </div>
  <p className="text-3xl font-extrabold text-white">1,247</p>
  <p className="text-xs text-success mt-1">↑ 12% from yesterday</p>
</div>
```

### Primary Button (Gradient Pill)
```tsx
<button className="px-6 py-3 rounded-full font-bold text-sm text-white
  bg-gradient-to-r from-[#E040A0] to-[#FF6B35]
  hover:opacity-90 active:scale-95 transition-all duration-150 shadow-lg">
  Record Transaction
</button>
```

### Secondary Button (Glass)
```tsx
<button className="px-5 py-2.5 rounded-full font-semibold text-sm text-white/80
  border border-white/10 bg-white/5 hover:bg-white/10
  transition-colors duration-150">
  Export
</button>
```

### Form Input
```tsx
<input className="w-full rounded-[12px] border border-white/10 bg-white/5
  px-4 py-3 text-sm text-white placeholder:text-white/30
  focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/30
  transition-colors duration-150"/>
```

---

## 6. Status Badges

```tsx
// Transaction type badges
const typeConfig = {
  DEPOSIT:    { label: 'Deposit',    class: 'bg-success/12 text-success border-success/20' },
  WITHDRAWAL: { label: 'Withdrawal', class: 'bg-danger/12 text-danger border-danger/20' },
  TRANSFER:   { label: 'Transfer',   class: 'bg-info/12 text-info border-info/20' },
}

// Shift status badges
const shiftConfig = {
  OPEN:   { label: 'Open',   class: 'bg-success/12 text-success border-success/20' },
  CLOSED: { label: 'Closed', class: 'bg-white/8 text-white/50 border-white/10' },
}

// Float health badges
const floatConfig = {
  HEALTHY:  { label: 'Healthy',  class: 'bg-success/12 text-success' },
  LOW:      { label: 'Low',      class: 'bg-warning/12 text-warning' },
  CRITICAL: { label: 'Critical', class: 'bg-danger/12 text-danger' },
}

// Base badge class
const badge = "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border"
```

---

## 7. Mobile Line Badge

Each telecom line gets a branded chip with its network colour:

```tsx
const lineColors = {
  MTN_UG:      { bg: 'bg-yellow-400/15', text: 'text-yellow-400', dot: '#FFCC00' },
  AIRTEL_UG:   { bg: 'bg-red-500/15',    text: 'text-red-400',    dot: '#FF0000' },
  VODACOM_TZ:  { bg: 'bg-red-600/15',    text: 'text-red-400',    dot: '#E60026' },
  TIGO_TZ:     { bg: 'bg-blue-600/15',   text: 'text-blue-400',   dot: '#003DA5' },
  SAFARICOM_KE:{ bg: 'bg-green-500/15',  text: 'text-green-400',  dot: '#4CAF50' },
  AIRTEL_KE:   { bg: 'bg-red-500/15',    text: 'text-red-400',    dot: '#FF0000' },
  ORANGE_CD:   { bg: 'bg-orange-500/15', text: 'text-orange-400', dot: '#FF6600' },
  VODACOM_CD:  { bg: 'bg-red-600/15',    text: 'text-red-400',    dot: '#E60026' },
  AIRTEL_CD:   { bg: 'bg-red-500/15',    text: 'text-red-400',    dot: '#FF0000' },
}

// Usage
<span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${lineColors[operator].bg} ${lineColors[operator].text}`}>
  <span className="w-1.5 h-1.5 rounded-full" style={{ background: lineColors[operator].dot }}/>
  MTN Uganda
</span>
```

---

## 8. Data Table Styling

```tsx
// Table wrapper
<div className="rounded-[16px] border border-white/8 overflow-hidden">
  <table className="w-full text-sm">
    <thead>
      <tr className="border-b border-white/8 bg-white/3">
        <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-white/40">
          Customer
        </th>
      </tr>
    </thead>
    <tbody>
      <tr className="border-b border-white/5 hover:bg-white/3 transition-colors">
        <td className="px-4 py-3.5 text-white/90">John Mukasa</td>
      </tr>
    </tbody>
  </table>
</div>
```

---

## 9. Sidebar Navigation

```
Sidebar width: 240px (expanded), 64px (collapsed)
Background: #13131A (slightly lighter than page bg)
Border right: 1px rgba(255,255,255,0.06)

Nav item (default):
  padding: 10px 12px
  border-radius: 10px
  text: rgba(255,255,255,0.55), 13px, weight 500
  icon: 18px, same color

Nav item (active):
  background: linear-gradient(135deg, rgba(224,64,160,0.15), rgba(255,107,53,0.1))
  border: 1px solid rgba(224,64,160,0.2)
  text: #FFFFFF
  icon: #E040A0

Nav item (hover):
  background: rgba(255,255,255,0.05)
  text: rgba(255,255,255,0.85)
```

---

## 10. Layout & Spacing

| Token | Value | Usage |
|---|---|---|
| Page padding | `24px` | Outer page content padding |
| Card padding | `20px–24px` | Inside all cards |
| Section gap | `16px–24px` | Between cards in a grid |
| Input padding | `12px 16px` | Inside form inputs |
| Table cell | `14px 16px` | Table cell padding |

**Grid system:**
- Dashboard KPI row: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4`
- Float overview: `grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4`
- Full-width table: `w-full` with container `max-w-screen-xl mx-auto`

---

## 11. Animations

Use **Framer Motion** for all animations. Animate `transform` and `opacity` only.

```tsx
// Card entrance
const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }
}

// Staggered dashboard cards
const containerVariants = {
  visible: { transition: { staggerChildren: 0.06 } }
}

// Balance number count-up
// Use framer-motion's useMotionValue + useSpring for financial figures

// Transaction row slide-in
const rowVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.2 } }
}
```

All animations respect `prefers-reduced-motion` via Framer Motion's built-in support.

---

## 12. Loading Skeletons

```tsx
// Skeleton base
<div className="animate-pulse rounded-[12px] bg-white/6 h-[height]px w-full"/>

// Gradient card skeleton
<div className="rounded-[20px] bg-white/6 animate-pulse h-32 w-full"/>

// Stat card skeleton
<div className="rounded-[16px] border border-white/5 bg-[#13131A] p-5 animate-pulse">
  <div className="h-3 w-24 bg-white/8 rounded mb-4"/>
  <div className="h-8 w-32 bg-white/10 rounded mb-2"/>
  <div className="h-3 w-20 bg-white/6 rounded"/>
</div>

// Table row skeleton
<tr>
  <td className="px-4 py-3.5"><div className="h-4 w-32 bg-white/6 rounded animate-pulse"/></td>
  <td className="px-4 py-3.5"><div className="h-4 w-20 bg-white/6 rounded animate-pulse"/></td>
</tr>
```

---

## 13. Page Header Component

```tsx
// components/ui/page-header.tsx
<div className="flex items-center justify-between mb-6">
  <div>
    {/* Breadcrumb */}
    <p className="text-xs text-white/40 mb-1">Dashboard / Transactions</p>
    <h1 className="text-2xl font-bold text-white">Transactions</h1>
  </div>
  <div className="flex items-center gap-3">
    {/* Action slot — passed as children */}
    {children}
  </div>
</div>
```

---

## 14. Currency Display Convention

All monetary amounts formatted per country currency:

```tsx
const currencyMap = {
  UG: { code: 'UGX', locale: 'en-UG', decimals: 0 },
  TZ: { code: 'TZS', locale: 'en-TZ', decimals: 0 },
  KE: { code: 'KES', locale: 'en-KE', decimals: 2 },
  CD: { code: 'CDF', locale: 'fr-CD', decimals: 2 },
}

// Format helper
function formatCurrency(amount: number, countryCode: string): string {
  const { code, locale, decimals } = currencyMap[countryCode]
  return new Intl.NumberFormat(locale, {
    style: 'currency', currency: code,
    minimumFractionDigits: decimals, maximumFractionDigits: decimals
  }).format(amount)
}
// Output: "UGX 2,450,000" or "KES 12,500.00"
```

---

## 15. PDF & Excel Export Styling

### PDF (`@react-pdf/renderer`)
```tsx
const pdfStyles = StyleSheet.create({
  page: { backgroundColor: '#FFFFFF', padding: 40, fontFamily: 'Helvetica' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24,
             borderBottom: '2px solid #E040A0', paddingBottom: 12 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#0D0D12' },
  subtitle: { fontSize: 10, color: '#666', marginTop: 2 },
  table: { marginTop: 16 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#F5F5F8', padding: '8 12',
                  borderRadius: 4 },
  tableHeaderCell: { fontSize: 9, fontWeight: 'bold', color: '#666', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', padding: '7 12', borderBottom: '1px solid #EBEBF0' },
  tableCell: { fontSize: 10, color: '#0D0D12' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100, fontSize: 9 },
})
```

### Excel (`xlsx`)
- Header row: bold, pink fill (`#E040A0`), white text
- Alternating data rows: white / `#F9F9FB`
- Amount columns: right-aligned, number format with currency symbol
- Column widths: auto-fitted with minimum 12, maximum 30

---

## 16. Email Templates (React Email)

```tsx
// Consistent email design
const emailTheme = {
  background: '#F5F5F8',
  card: '#FFFFFF',
  border: '#E5E5EA',
  primary: '#E040A0',
  text: '#0D0D12',
  muted: '#6B6B6B',
  success: '#16A34A',
  danger: '#DC2626',
  warning: '#D97706',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
}
// Header: white logo on pink-orange gradient banner
// Body: white card on light gray background
// CTA button: pink-orange gradient pill, centered
// Footer: muted gray text, unsubscribe link
```
