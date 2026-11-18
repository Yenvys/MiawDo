# DESIGN.md: MiawDo (Clean & Cozy Cat Productivity App)

## 1. Identity & Character
- **Product Name:** MiawDo
- **Category:** Native Mobile To-Do List & Productivity Tracker
- **Design Persona:** Clean Minimalist meets Cozy Feline. Functional, calm, high-legibility layout with deliberate cat-inspired accents (paw-print completion stamps, dynamic morning/evening cat greetings, ear-silhouette floating action button).
- **Tone of Voice:** Warm, concise Indonesian with subtle feline charm (*"Miaw! Semua tugas hari ini selesai."*). No em dashes, no filler buzzwords.

## 2. Color Palettes (Dual Theme)

### Morning Mode: Sunlit Catnap (Light)
- **Background Primary:** `#FAF7F2` (Warm Cream)
- **Background Elevated / Card:** `#FFFFFF` (Pure Ivory)
- **Surface Muted / Chip:** `#F2ECE1` (Soft Oat)
- **Border:** `#E6DEC8` (Warm Sand)
- **Text Primary:** `#231F20` (Espresso Charcoal, contrast > 12:1 on `#FAF7F2`)
- **Text Secondary:** `#655D57` (Mocha Muted, contrast > 5.2:1 on `#FAF7F2`)
- **Primary Accent:** `#D96B43` (Ginger Terracotta, used selectively on primary CTA, active tab, and progress bar)
- **Accent Soft Surface:** `#FCEEE8`

### Night Mode: Midnight Purr (Dark)
- **Background Primary:** `#12151E` (Deep Midnight Slate)
- **Background Elevated / Card:** `#1B202E` (Charcoal Coat)
- **Surface Muted / Chip:** `#252B3D` (Dusk Slate)
- **Border:** `#2E364D` (Muted Slate Border)
- **Text Primary:** `#F4F1EA` (Soft Whiskers, contrast > 13:1 on `#12151E`)
- **Text Secondary:** `#9CA3B5` (Cool Ash, contrast > 5.5:1 on `#12151E`)
- **Primary Accent:** `#F09A4B` (Moonlight Amber)
- **Accent Soft Surface:** `#2E241E`

### Semantic Status & Priority Colors
- **Priority High / Overdue:** `#D94E4E` (Coral Red), Soft bg: `#FDECEC` (Light) / `#3A1D22` (Dark)
- **Priority Medium / In Progress:** `#D18224` (Warm Amber), Soft bg: `#FEF5E7` (Light) / `#362919` (Dark)
- **Priority Low / Upcoming:** `#3B7496` (Calm Slate Blue), Soft bg: `#EBF4FA` (Light) / `#1A2B38` (Dark)
- **Completed:** `#2E8B63` (Mint Leaf), Soft bg: `#E8F6EF` (Light) / `#183328` (Dark)
- **Cancelled:** `#7A7571` (Neutral Stone)

## 3. Typography & Hierarchy
- **Headings:** System Sans Bold (`700` / `800`), tight tracking (`-0.3px`) for dashboard counters and screen titles.
- **Body & Task Titles:** System Sans Medium (`500` / `600`), `15px-16px` for comfortable reading on mobile screens.
- **Metadata & Badges:** System Sans SemiBold (`600`), `12px` with clear contrast.
- **Minimum Tap Target:** `44px x 44px` across all buttons, checkboxes, and filter chips.

## 4. Liveliness Dials
- **ENERGY:** 2 (Warm, inviting tactile surfaces with cat motifs on key moments).
- **RHYTHM:** 2 (Structured variation between summary hero card, horizontal filter strips, and task cards).
- **MOTION:** 2 (Purposeful micro-interactions: paw stamp completion toggle, smooth tab switching, modal slide).
