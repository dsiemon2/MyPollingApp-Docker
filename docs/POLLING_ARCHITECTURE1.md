# Polling System Architecture - FUTURE ROADMAP

> **Status: NOT YET IMPLEMENTED** - This document describes planned future enhancements to the polling system.
>
> **Current Implementation:** Basic single/multiple choice polls only. See `POLLCHAT_DOCUMENTATION.md` for current features.

---

## Overview

A flexible, scalable polling system that supports multiple question/poll types with optional templates for quick creation.

---

## Design Philosophy

**Keep it simple, but extensible.**

- No complex module/component system
- Poll Types define HOW users vote (input method, validation, scoring)
- Templates are optional presets for quick poll creation
- JSON config fields provide flexibility without schema changes

---

## Admin Pages

### 1. Poll Types (`/admin/poll-types`)

Manage the available poll/question types. Similar to Voting Types in the Voting app.

**Features:**
- List all poll types with icon, name, category
- Enable/disable poll types
- Edit default configuration for each type
- Create custom poll types (advanced)
- Reorder poll types

**UI Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│  Poll Types                                    [+ Add Type]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ☑ │ ◉ │ Yes / No              │ Choice  │ [Edit] [⋮]   │   │
│  │   │   │ Simple binary choice   │         │              │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ☑ │ ○ │ Single Choice          │ Choice  │ [Edit] [⋮]   │   │
│  │   │   │ Select one option       │         │              │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ☑ │ ☑ │ Multiple Choice        │ Choice  │ [Edit] [⋮]   │   │
│  │   │   │ Check all that apply    │         │              │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ☑ │ ★ │ Rating Scale           │ Rating  │ [Edit] [⋮]   │   │
│  │   │   │ Star/number rating      │         │              │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ☑ │ ⇅ │ Ranked Choice          │ Ranking │ [Edit] [⋮]   │   │
│  │   │   │ Rank in order           │         │              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Edit Poll Type Modal:**
```
┌─────────────────────────────────────────────────────────────────┐
│  Edit Poll Type: Multiple Choice                          [X]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Name:        [Multiple Choice_________________]                │
│  Description: [Check all that apply____________]                │
│  Icon:        [bi-ui-checks ▼]                                  │
│  Category:    [Choice ▼]                                        │
│                                                                 │
│  ─── Default Configuration ───                                  │
│                                                                 │
│  Min Selections:    [1____]                                     │
│  Max Selections:    [_____] (blank = unlimited)                 │
│  Randomize Order:   ☐                                           │
│  Show as Cards:     ☐                                           │
│  Allow "Other":     ☐                                           │
│  Columns:           [1 ▼]                                       │
│                                                                 │
│  Status:  ● Active  ○ Inactive                                  │
│                                                                 │
│                              [Cancel] [Save Changes]            │
└─────────────────────────────────────────────────────────────────┘
```

---

### 2. Poll Templates (`/admin/poll-templates`)

Pre-configured poll setups for quick creation. Similar to Event Templates in the Voting app.

**Features:**
- List all templates with icon, name, category, linked poll type
- Create/edit/delete templates
- Set default title, description, options
- Configure default settings for the poll type
- Enable/disable templates

**UI Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│  Poll Templates                              [+ Add Template]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Filter: [All Categories ▼]  [All Types ▼]  [Search...]        │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  ⚡ Quick Poll                                           │   │
│  │  Simple yes/no or single choice poll                     │   │
│  │  Type: Single Choice │ Category: General                 │   │
│  │                                      [Edit] [Duplicate]  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  😊 Customer Satisfaction                                │   │
│  │  5-star rating for feedback                              │   │
│  │  Type: Rating Scale │ Category: Feedback                 │   │
│  │                                      [Edit] [Duplicate]  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  📅 Event RSVP                                           │   │
│  │  Yes/No/Maybe attendance poll                            │   │
│  │  Type: Yes/No │ Category: Events                         │   │
│  │                                      [Edit] [Duplicate]  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  🏆 Ranked Voting                                        │   │
│  │  Rank your top 3 choices (3-2-1 points)                  │   │
│  │  Type: Ranked Choice │ Category: Contests                │   │
│  │                                      [Edit] [Duplicate]  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Edit Template Modal:**
```
┌─────────────────────────────────────────────────────────────────┐
│  Edit Template: Customer Satisfaction                     [X]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ─── Template Info ───                                          │
│  Name:        [Customer Satisfaction___________]                │
│  Description: [5-star rating for feedback______]                │
│  Icon:        [bi-emoji-smile ▼]                                │
│  Category:    [Feedback ▼]                                      │
│                                                                 │
│  ─── Poll Type ───                                              │
│  Type:        [Rating Scale ▼]                                  │
│                                                                 │
│  ─── Default Poll Content ───                                   │
│  Default Title:       [How satisfied are you with our service?] │
│  Default Description: [____________________________________]    │
│                                                                 │
│  Default Options: (leave empty for types that don't need them)  │
│  [_________________________________] [X]                        │
│  [+ Add Default Option]                                         │
│                                                                 │
│  ─── Type Configuration Overrides ───                           │
│  (Override default settings for this template)                  │
│                                                                 │
│  Rating Style:    [Stars ▼]                                     │
│  Max Value:       [5____]                                       │
│  Show Labels:     ☑                                             │
│  Low Label:       [Poor_________]                               │
│  High Label:      [Excellent____]                               │
│                                                                 │
│  Status:  ● Active  ○ Inactive                                  │
│                                                                 │
│                              [Cancel] [Save Changes]            │
└─────────────────────────────────────────────────────────────────┘
```

---

### 3. Create Poll Flow (`/admin/polls/create`)

When creating a poll, user can start from scratch OR use a template.

```
┌─────────────────────────────────────────────────────────────────┐
│  Create New Poll                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  How would you like to start?                                   │
│                                                                 │
│  ┌───────────────────────┐  ┌───────────────────────┐          │
│  │                       │  │                       │          │
│  │   📝 From Scratch     │  │   📋 Use Template     │          │
│  │                       │  │                       │          │
│  │   Select a poll type  │  │   Start with preset   │          │
│  │   and configure       │  │   configuration       │          │
│  │   everything          │  │                       │          │
│  │                       │  │                       │          │
│  └───────────────────────┘  └───────────────────────┘          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

─── If "From Scratch" selected ───

┌─────────────────────────────────────────────────────────────────┐
│  Select Poll Type                                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Choice Types:                                                  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐              │
│  │  ◉  ○   │ │  ○      │ │  ☑  ☑   │ │  ▢  ▢   │              │
│  │ Yes/No  │ │ Single  │ │Multiple │ │ Cards   │              │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘              │
│                                                                 │
│  Rating Types:                                                  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                          │
│  │  ★★★★☆  │ │  ──●──  │ │  0-10   │                          │
│  │ Rating  │ │ Slider  │ │  NPS    │                          │
│  └─────────┘ └─────────┘ └─────────┘                          │
│                                                                 │
│  Other Types:                                                   │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                          │
│  │  1 2 3  │ │  📷     │ │  💬     │                          │
│  │ Ranked  │ │ Image   │ │ Text    │                          │
│  └─────────┘ └─────────┘ └─────────┘                          │
│                                                                 │
│                                              [Next →]           │
└─────────────────────────────────────────────────────────────────┘

─── If "Use Template" selected ───

┌─────────────────────────────────────────────────────────────────┐
│  Select Template                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Filter: [All Categories ▼]                                     │
│                                                                 │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │  ⚡              │ │  😊              │ │  📅              │   │
│  │  Quick Poll     │ │  Customer       │ │  Event RSVP     │   │
│  │                 │ │  Satisfaction   │ │                 │   │
│  │  Single Choice  │ │  Rating Scale   │ │  Yes/No         │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
│                                                                 │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │  🏆              │ │  📷              │ │  📊              │   │
│  │  Ranked Voting  │ │  Photo Contest  │ │  NPS Survey     │   │
│  │                 │ │                 │ │                 │   │
│  │  Ranked Choice  │ │  Image Choice   │ │  NPS            │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
│                                                                 │
│                                              [Next →]           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Poll Types (Question Types)

### Core Types

| Type Code | Name | Input Method | Description |
|-----------|------|--------------|-------------|
| `yes_no` | Yes/No | Radio buttons | Simple binary choice |
| `single_choice` | Single Choice | Radio buttons | Select one from multiple options |
| `multiple_choice` | Multiple Choice | Checkboxes | Select multiple (check all that apply) |
| `clickable_cards` | Clickable Cards | Visual cards | Click to select (single or multi) |
| `ranked` | Ranked Choice | Drag & drop / Number inputs | Rank options in order of preference |
| `rating_scale` | Rating Scale | Stars / Slider / Numbers | Rate on a scale (1-5, 1-10, etc.) |
| `slider` | Slider | Range slider | Select value on continuous scale |
| `image_choice` | Image Choice | Clickable images | Vote on images |
| `open_text` | Open Text | Text input | Free-form text response |
| `dropdown` | Dropdown | Select menu | Single choice from dropdown |

### Type Configuration (JSON)

Each poll type has configurable settings stored in a `config` JSON field:

```json
// yes_no
{
  "yesLabel": "Yes",
  "noLabel": "No",
  "allowNeutral": false,
  "neutralLabel": "Not Sure"
}

// single_choice / multiple_choice
{
  "minSelections": 1,
  "maxSelections": 3,        // null = unlimited for multiple_choice
  "randomizeOrder": false,
  "showAsCards": false,      // visual card style vs standard list
  "allowOther": false,       // "Other" option with text input
  "columns": 1               // 1, 2, 3 column layout
}

// clickable_cards
{
  "selectionMode": "single", // "single" or "multiple"
  "maxSelections": null,
  "showImages": true,
  "showDescriptions": true,
  "cardSize": "medium"       // "small", "medium", "large"
}

// ranked
{
  "maxRankings": 3,          // How many items to rank (null = all)
  "pointSystem": [3, 2, 1],  // Points per position
  "inputMethod": "dropdown"  // "dropdown", "drag", "number"
}

// rating_scale
{
  "minValue": 1,
  "maxValue": 5,
  "step": 1,
  "style": "stars",          // "stars", "numbers", "slider", "emoji"
  "lowLabel": "Poor",
  "highLabel": "Excellent",
  "showLabels": true
}

// slider
{
  "minValue": 0,
  "maxValue": 100,
  "step": 1,
  "showValue": true,
  "unit": "%",
  "leftLabel": "Not at all",
  "rightLabel": "Extremely"
}

// image_choice
{
  "selectionMode": "single",
  "maxSelections": null,
  "imageSize": "medium",
  "showCaptions": true
}

// open_text
{
  "multiline": false,
  "maxLength": 500,
  "placeholder": "Enter your response...",
  "required": true
}
```

---

## Database Schema

### Tables

```prisma
// ============================================
// POLL TYPES - Define how voting works
// ============================================

model PollType {
  id          String   @id @default(cuid())
  code        String   @unique  // yes_no, single_choice, multiple_choice, etc.
  name        String            // "Yes/No", "Single Choice", etc.
  description String?
  icon        String?           // Bootstrap icon name
  category    String   @default("choice")  // choice, rating, ranking, text

  // Default configuration for this type
  defaultConfig String @default("{}")  // JSON

  isSystem    Boolean  @default(true)   // System-provided vs custom
  isActive    Boolean  @default(true)
  sortOrder   Int      @default(0)

  // Relations
  polls       Poll[]
  templates   PollTemplate[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// ============================================
// POLL TEMPLATES - Quick-start presets (Optional)
// ============================================

model PollTemplate {
  id          String   @id @default(cuid())
  name        String            // "Customer Satisfaction", "Event RSVP", etc.
  description String?
  icon        String?

  // Template defaults
  pollTypeId  String            // Default poll type
  pollType    PollType @relation(fields: [pollTypeId], references: [id])

  // Pre-configured settings
  defaultTitle       String?
  defaultDescription String?
  defaultOptions     String  @default("[]")  // JSON array of default options
  defaultConfig      String  @default("{}")  // JSON overrides for poll type config

  // Template metadata
  category    String?           // "feedback", "events", "general", etc.
  isSystem    Boolean @default(true)
  isActive    Boolean @default(true)
  sortOrder   Int     @default(0)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// ============================================
// POLLS - The actual poll/question
// ============================================

model Poll {
  id          String   @id @default(cuid())
  slug        String   @unique  // Short URL-friendly identifier (e.g., "my-poll-2024")

  // Basic info
  title       String            // Max 200 chars
  description String?           // Max 2000 chars

  // Poll type
  pollTypeId  String
  pollType    PollType @relation(fields: [pollTypeId], references: [id])

  // Type-specific configuration (overrides PollType.defaultConfig)
  config      String   @default("{}")  // JSON

  // Status & timing
  status      String   @default("draft")  // draft, active, closed, archived
  startsAt    DateTime?
  endsAt      DateTime?

  // Visibility & access
  visibility        String  @default("public")  // public, unlisted, private
  password          String?                     // For password-protected polls

  // Settings
  allowAnonymous    Boolean @default(true)
  requireAuth       Boolean @default(false)
  showResults       String  @default("after_vote")  // never, after_vote, always, after_close
  allowRevote       Boolean @default(false)         // Can users change their vote?

  // Spam protection
  ipLimitEnabled    Boolean @default(false)
  ipLimitCount      Int     @default(1)
  captchaEnabled    Boolean @default(false)

  // Display
  resultsDisplay    String  @default("bar_chart")  // bar_chart, pie_chart, numbers, hidden

  // Relations
  options     PollOption[]
  votes       Vote[]

  // Metadata
  createdBy   String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// ============================================
// POLL OPTIONS - Choices/answers for a poll
// ============================================

model PollOption {
  id          String   @id @default(cuid())

  pollId      String
  poll        Poll     @relation(fields: [pollId], references: [id], onDelete: Cascade)

  // Option content
  text        String            // Option text/label
  description String?           // Optional description
  imageUrl    String?           // For image-based options
  color       String?           // For visual styling

  // Metadata
  sortOrder   Int      @default(0)
  isActive    Boolean  @default(true)
  metadata    String   @default("{}")  // JSON for extra data

  // Denormalized vote counts (updated on each vote)
  voteCount   Int      @default(0)
  votePoints  Float    @default(0)  // For ranked/weighted voting

  // Relations
  votes       Vote[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([pollId, sortOrder])
}

// ============================================
// VOTES - Individual vote records
// ============================================

model Vote {
  id          String   @id @default(cuid())

  pollId      String
  poll        Poll     @relation(fields: [pollId], references: [id], onDelete: Cascade)

  optionId    String?           // Null for open_text, slider types
  option      PollOption? @relation(fields: [optionId], references: [id], onDelete: Cascade)

  // Vote data (type-dependent)
  value       String?           // JSON: could be text, number, array of optionIds, etc.
  rank        Int?              // For ranked voting
  rating      Float?            // For rating/slider
  points      Float   @default(1)  // Calculated points for this vote

  // Voter info
  userId      String?           // Logged-in user
  voterIp     String?           // For anonymous tracking
  voterFingerprint String?      // Browser fingerprint

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([pollId, userId])    // One vote per user per poll
  @@index([pollId, userId])
  @@index([pollId, voterIp])
  @@index([optionId])
}
```

---

## System Poll Types (Seeded)

```typescript
const pollTypes = [
  // === CHOICE TYPES ===
  {
    code: 'yes_no',
    name: 'Yes / No',
    description: 'Simple binary choice with optional neutral option',
    icon: 'bi-toggle-on',
    category: 'choice',
    defaultConfig: {
      yesLabel: 'Yes',
      noLabel: 'No',
      allowNeutral: false,
      neutralLabel: 'Not Sure'
    }
  },
  {
    code: 'single_choice',
    name: 'Single Choice',
    description: 'Select one option from a list (radio buttons)',
    icon: 'bi-ui-radios',
    category: 'choice',
    defaultConfig: {
      minSelections: 1,
      maxSelections: 1,
      randomizeOrder: false,
      showAsCards: false,
      allowOther: false,
      columns: 1
    }
  },
  {
    code: 'multiple_choice',
    name: 'Multiple Choice',
    description: 'Select multiple options (checkboxes)',
    icon: 'bi-ui-checks',
    category: 'choice',
    defaultConfig: {
      minSelections: 1,
      maxSelections: null,
      randomizeOrder: false,
      showAsCards: false,
      allowOther: false,
      columns: 1
    }
  },
  {
    code: 'clickable_cards',
    name: 'Clickable Cards',
    description: 'Visual card-based selection',
    icon: 'bi-grid-3x3-gap',
    category: 'choice',
    defaultConfig: {
      selectionMode: 'single',
      maxSelections: null,
      showImages: true,
      showDescriptions: true,
      cardSize: 'medium'
    }
  },
  {
    code: 'dropdown',
    name: 'Dropdown',
    description: 'Select one option from dropdown menu',
    icon: 'bi-chevron-down',
    category: 'choice',
    defaultConfig: {
      placeholder: 'Select an option...',
      searchable: false
    }
  },
  {
    code: 'image_choice',
    name: 'Image Choice',
    description: 'Vote on images',
    icon: 'bi-images',
    category: 'choice',
    defaultConfig: {
      selectionMode: 'single',
      maxSelections: null,
      imageSize: 'medium',
      showCaptions: true
    }
  },

  // === RATING TYPES ===
  {
    code: 'rating_scale',
    name: 'Rating Scale',
    description: 'Rate on a numeric scale (stars, numbers, etc.)',
    icon: 'bi-star-half',
    category: 'rating',
    defaultConfig: {
      minValue: 1,
      maxValue: 5,
      step: 1,
      style: 'stars',
      lowLabel: 'Poor',
      highLabel: 'Excellent',
      showLabels: true
    }
  },
  {
    code: 'slider',
    name: 'Slider',
    description: 'Select value on a continuous scale',
    icon: 'bi-sliders',
    category: 'rating',
    defaultConfig: {
      minValue: 0,
      maxValue: 100,
      step: 1,
      showValue: true,
      unit: '',
      leftLabel: '',
      rightLabel: ''
    }
  },
  {
    code: 'nps',
    name: 'Net Promoter Score',
    description: 'How likely to recommend (0-10)',
    icon: 'bi-graph-up-arrow',
    category: 'rating',
    defaultConfig: {
      minValue: 0,
      maxValue: 10,
      lowLabel: 'Not at all likely',
      highLabel: 'Extremely likely'
    }
  },

  // === RANKING TYPES ===
  {
    code: 'ranked',
    name: 'Ranked Choice',
    description: 'Rank options in order of preference',
    icon: 'bi-sort-numeric-down',
    category: 'ranking',
    defaultConfig: {
      maxRankings: 3,
      pointSystem: [3, 2, 1],
      inputMethod: 'dropdown'
    }
  },

  // === TEXT TYPES ===
  {
    code: 'open_text',
    name: 'Open Text',
    description: 'Free-form text response',
    icon: 'bi-textarea-t',
    category: 'text',
    defaultConfig: {
      multiline: false,
      maxLength: 500,
      placeholder: 'Enter your response...',
      required: true
    }
  }
];
```

---

## Templates (Optional Presets)

Templates provide quick-start configurations but are NOT required. Users can always create polls from scratch.

```typescript
const pollTemplates = [
  {
    name: 'Quick Poll',
    description: 'Simple yes/no or single choice poll',
    icon: 'bi-lightning',
    category: 'general',
    pollTypeCode: 'single_choice',
    defaultTitle: '',
    defaultDescription: '',
    defaultOptions: [],
    defaultConfig: {}
  },
  {
    name: 'Customer Satisfaction',
    description: '5-star rating for feedback',
    icon: 'bi-emoji-smile',
    category: 'feedback',
    pollTypeCode: 'rating_scale',
    defaultTitle: 'How satisfied are you with our service?',
    defaultDescription: '',
    defaultOptions: [],
    defaultConfig: {
      style: 'stars',
      maxValue: 5
    }
  },
  {
    name: 'NPS Survey',
    description: 'Net Promoter Score question',
    icon: 'bi-graph-up',
    category: 'feedback',
    pollTypeCode: 'nps',
    defaultTitle: 'How likely are you to recommend us to a friend?',
    defaultDescription: '',
    defaultOptions: [],
    defaultConfig: {}
  },
  {
    name: 'Event RSVP',
    description: 'Yes/No/Maybe attendance poll',
    icon: 'bi-calendar-event',
    category: 'events',
    pollTypeCode: 'yes_no',
    defaultTitle: 'Will you attend?',
    defaultDescription: '',
    defaultOptions: [],
    defaultConfig: {
      allowNeutral: true,
      yesLabel: 'Yes, I will attend',
      noLabel: 'No, I cannot attend',
      neutralLabel: 'Maybe'
    }
  },
  {
    name: 'Multiple Choice Quiz',
    description: 'Select all that apply',
    icon: 'bi-list-check',
    category: 'general',
    pollTypeCode: 'multiple_choice',
    defaultTitle: '',
    defaultDescription: 'Select all that apply',
    defaultOptions: [],
    defaultConfig: {
      minSelections: 1,
      maxSelections: null
    }
  },
  {
    name: 'Photo Contest',
    description: 'Vote on images',
    icon: 'bi-camera',
    category: 'contests',
    pollTypeCode: 'image_choice',
    defaultTitle: 'Vote for your favorite',
    defaultDescription: '',
    defaultOptions: [],
    defaultConfig: {
      selectionMode: 'single',
      imageSize: 'large'
    }
  },
  {
    name: 'Ranked Voting',
    description: 'Rank your top choices',
    icon: 'bi-trophy',
    category: 'contests',
    pollTypeCode: 'ranked',
    defaultTitle: 'Rank your favorites',
    defaultDescription: 'Select your 1st, 2nd, and 3rd choices',
    defaultOptions: [],
    defaultConfig: {
      maxRankings: 3,
      pointSystem: [3, 2, 1]
    }
  },
  {
    name: 'Open Feedback',
    description: 'Collect text responses',
    icon: 'bi-chat-left-text',
    category: 'feedback',
    pollTypeCode: 'open_text',
    defaultTitle: 'Share your feedback',
    defaultDescription: '',
    defaultOptions: [],
    defaultConfig: {
      multiline: true,
      maxLength: 1000
    }
  }
];
```

---

## API Endpoints

### Poll Types
```
GET    /api/poll-types              # List all active poll types
GET    /api/poll-types/:code        # Get specific poll type with config
```

### Templates
```
GET    /api/templates               # List all active templates
GET    /api/templates/:id           # Get template details
```

### Polls
```
GET    /api/polls                   # List polls (with filters)
POST   /api/polls                   # Create poll
GET    /api/polls/:id               # Get poll details
PUT    /api/polls/:id               # Update poll
DELETE /api/polls/:id               # Delete poll
POST   /api/polls/:id/publish       # Publish draft poll
POST   /api/polls/:id/close         # Close poll
```

### Voting
```
POST   /api/polls/:id/vote          # Submit vote
GET    /api/polls/:id/results       # Get results
GET    /api/polls/:id/my-vote       # Get user's vote (if allowed)
```

### Admin Routes
```
# Polls CRUD
GET    /admin/polls                 # Poll management list
GET    /admin/polls/create          # Create poll form
POST   /admin/polls                 # Store new poll
GET    /admin/polls/:id/edit        # Edit poll form
PUT    /admin/polls/:id             # Update poll
DELETE /admin/polls/:id             # Delete poll
GET    /admin/polls/:id/results     # Detailed results view

# Poll Types Management
GET    /admin/poll-types                # List all poll types
PUT    /admin/poll-types/:id            # Update poll type settings
POST   /admin/poll-types/:id/toggle     # Enable/disable poll type
POST   /admin/poll-types/:id/reorder    # Change sort order

# Poll Templates Management
GET    /admin/poll-templates            # List all templates
GET    /admin/poll-templates/create     # Create template form
POST   /admin/poll-templates            # Store new template
GET    /admin/poll-templates/:id/edit   # Edit template form
PUT    /admin/poll-templates/:id        # Update template
DELETE /admin/poll-templates/:id        # Delete template
POST   /admin/poll-templates/:id/duplicate  # Duplicate template
```

---

## UI Components

### Poll Creation Flow

```
1. Select Poll Type (or Template)
   ┌─────────────────────────────────────────┐
   │  Create New Poll                        │
   │                                         │
   │  Start from:                            │
   │  ○ Blank Poll (select type below)       │
   │  ○ Template                             │
   │                                         │
   │  Poll Type:                             │
   │  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
   │  │ Yes/No  │ │ Single  │ │Multiple │   │
   │  │   ◉     │ │ Choice  │ │ Choice  │   │
   │  └─────────┘ └─────────┘ └─────────┘   │
   │  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
   │  │ Rating  │ │ Ranked  │ │ Slider  │   │
   │  │  ★★★★★  │ │ 1,2,3   │ │ ──●──   │   │
   │  └─────────┘ └─────────┘ └─────────┘   │
   └─────────────────────────────────────────┘

2. Configure Poll
   ┌─────────────────────────────────────────┐
   │  Poll Details                           │
   │                                         │
   │  Title: [________________________]      │
   │  Description: [__________________]      │
   │                                         │
   │  Options:                               │
   │  [Option 1                    ] [X]     │
   │  [Option 2                    ] [X]     │
   │  [Option 3                    ] [X]     │
   │  [+ Add Option]                         │
   │                                         │
   │  Settings:                              │
   │  ☑ Allow anonymous voting               │
   │  ☐ Require authentication               │
   │  Show results: [After voting ▼]         │
   └─────────────────────────────────────────┘

3. Publish
   ┌─────────────────────────────────────────┐
   │  Publishing Options                     │
   │                                         │
   │  Status: ○ Draft  ● Active  ○ Scheduled │
   │                                         │
   │  Schedule (optional):                   │
   │  Start: [__/__/____] [__:__]           │
   │  End:   [__/__/____] [__:__]           │
   │                                         │
   │  [Save as Draft] [Publish Now]          │
   └─────────────────────────────────────────┘
```

### Voting UI Examples

**Yes/No:**
```
┌─────────────────────────────────────────┐
│  Do you support this proposal?          │
│                                         │
│  ┌─────────────┐  ┌─────────────┐       │
│  │     YES     │  │      NO     │       │
│  │      ✓      │  │      ✗      │       │
│  └─────────────┘  └─────────────┘       │
└─────────────────────────────────────────┘
```

**Single/Multiple Choice:**
```
┌─────────────────────────────────────────┐
│  What's your favorite color?            │
│                                         │
│  ○ Red                                  │
│  ● Blue  ← selected                     │
│  ○ Green                                │
│  ○ Yellow                               │
│                                         │
│  [Submit Vote]                          │
└─────────────────────────────────────────┘
```

**Clickable Cards:**
```
┌─────────────────────────────────────────┐
│  Vote for your favorite design          │
│                                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │  [IMG]  │ │  [IMG]  │ │  [IMG]  │   │
│  │ Design A│ │ Design B│ │ Design C│   │
│  │         │ │    ✓    │ │         │   │
│  └─────────┘ └─────────┘ └─────────┘   │
└─────────────────────────────────────────┘
```

**Rating Scale:**
```
┌─────────────────────────────────────────┐
│  How would you rate our service?        │
│                                         │
│  ★ ★ ★ ★ ☆                              │
│  Poor                      Excellent    │
│                                         │
│  [Submit Rating]                        │
└─────────────────────────────────────────┘
```

**Ranked:**
```
┌─────────────────────────────────────────┐
│  Rank your top 3 choices                │
│                                         │
│  1st Place: [Option B        ▼]         │
│  2nd Place: [Option D        ▼]         │
│  3rd Place: [Option A        ▼]         │
│                                         │
│  [Submit Rankings]                      │
└─────────────────────────────────────────┘
```

---

## Results Display

### Bar Chart (Default)
```
┌─────────────────────────────────────────┐
│  Results (127 votes)                    │
│                                         │
│  Option A  ████████████████████  45%    │
│  Option B  ██████████████        32%    │
│  Option C  ████████              18%    │
│  Option D  ██                     5%    │
└─────────────────────────────────────────┘
```

### Pie Chart
```
┌─────────────────────────────────────────┐
│  Results (127 votes)                    │
│                                         │
│        ┌────────────┐                   │
│       /    45%      \                   │
│      │   Option A    │  ● Option A 45%  │
│       \    32%      /   ● Option B 32%  │
│        └────────────┘   ● Option C 18%  │
│                         ● Option D  5%  │
└─────────────────────────────────────────┘
```

### Open Text Responses
```
┌─────────────────────────────────────────┐
│  Responses (23 total)                   │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ "Great service, very helpful and   │  │
│  │  professional staff!"              │  │
│  │  - Anonymous • 2 hours ago         │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ "Could improve response time,      │  │
│  │  but overall satisfied."           │  │
│  │  - Anonymous • 5 hours ago         │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ "Excellent product quality."       │  │
│  │  - Anonymous • 1 day ago           │  │
│  └───────────────────────────────────┘  │
│                                         │
│  [Load More Responses]                  │
│                                         │
│  Export: [CSV] [PDF]                    │
└─────────────────────────────────────────┘
```

### NPS Score Display
```
┌─────────────────────────────────────────┐
│  Net Promoter Score                     │
│                                         │
│           ┌─────────────┐               │
│           │     +42     │               │
│           │     NPS     │               │
│           └─────────────┘               │
│                                         │
│  Detractors (0-6)    █████       23%    │
│  Passives (7-8)      ████        18%    │
│  Promoters (9-10)    ████████████ 59%   │
│                                         │
│  Based on 127 responses                 │
│  Score range: -100 to +100              │
└─────────────────────────────────────────┘
```

---

## Validation Rules

### Field Constraints

| Field | Type | Constraint |
|-------|------|------------|
| Poll.title | String | Required, 1-200 characters |
| Poll.description | String | Optional, max 2000 characters |
| Poll.slug | String | Auto-generated, 3-50 chars, URL-safe |
| PollOption.text | String | Required, 1-500 characters |
| PollOption.description | String | Optional, max 1000 characters |
| Vote.value (open_text) | String | Max length from poll config (default 500) |

### Business Rules

1. **Poll Creation**
   - Must have at least 2 options (except yes_no, rating_scale, slider, nps, open_text)
   - Slug must be unique, auto-generated from title if not provided
   - Start date must be before end date (if both provided)

2. **Voting**
   - One vote per user per poll (enforced by unique constraint)
   - Anonymous votes tracked by IP + fingerprint combination
   - Cannot vote on closed/draft polls
   - Cannot vote before start date or after end date

3. **Results Access**
   - Respect `showResults` setting: never, after_vote, always, after_close
   - Password-protected polls require password for both voting and results
   - Admin can always view results regardless of settings

---

## Implementation Roadmap

> **Note:** Embeddable polls (Phase 3 item) have already been implemented. See `POLL_SHARING_PLAN.md`.

### Phase 1: Advanced Poll Types (Priority)
- [ ] Add PollType model to schema
- [ ] Seed system poll types (yes_no, rating_scale, ranked, etc.)
- [ ] Create `/admin/poll-types` management page
- [ ] Build voting UI components for each type
- [ ] Update results display for different types

### Phase 2: Templates & Settings
- [ ] Add PollTemplate model to schema
- [ ] Create `/admin/poll-templates` management page
- [ ] Add poll scheduling (start/end dates)
- [ ] Add IP limit voting
- [ ] Add show results setting
- [ ] Add allow revote setting

### Phase 3: Advanced Features
- [ ] CAPTCHA protection
- [ ] Password-protected polls
- [ ] Pie chart results display
- [ ] NPS score calculation & display
- [ ] Export results (CSV/PDF)
- [ ] Branching/conditional questions
- [ ] Multi-question surveys
- [ ] Analytics dashboard

---

## File Structure

```
src/
├── routes/
│   ├── polls.ts              # Poll API routes
│   └── pollAdmin.ts          # Admin routes for polls, types, templates
├── services/
│   └── pollService.ts        # Voting logic, validation, results calculation
├── utils/
│   └── slugGenerator.ts      # Generate unique poll slugs
├── db/
│   └── prisma.ts
views/
├── admin/
│   ├── polls/
│   │   ├── index.ejs         # Poll list
│   │   ├── create.ejs        # Create poll
│   │   ├── edit.ejs          # Edit poll
│   │   └── results.ejs       # Results view
│   ├── poll_types.ejs        # Manage poll types
│   └── poll_templates.ejs    # Manage templates
├── polls/
│   ├── vote.ejs              # Public voting page
│   └── results.ejs           # Public results
├── partials/
│   └── poll_inputs/
│       ├── yes_no.ejs
│       ├── single_choice.ejs
│       ├── multiple_choice.ejs
│       ├── clickable_cards.ejs
│       ├── dropdown.ejs
│       ├── image_choice.ejs
│       ├── rating_scale.ejs
│       ├── slider.ejs
│       ├── nps.ejs
│       ├── ranked.ejs
│       └── open_text.ejs
prisma/
├── schema.prisma
└── seed.ts                   # Seed poll types and default templates
```

---

## Summary

| Feature | Priority | Status |
|---------|----------|--------|
| Poll Types | HIGH | Not implemented |
| Templates | MEDIUM | Not implemented |
| Advanced Settings | MEDIUM | Not implemented |
| Export Results | LOW | Not implemented |
| Embeddable Polls | HIGH | ✅ Already implemented |

This architecture describes a flexible, scalable polling system. Implementation should follow the phased roadmap above.

---

*Last Updated: January 2026*
