# Poll Sharing & Embedding Feature ✅ IMPLEMENTED

> **Status: COMPLETE** - All 3 phases have been fully implemented (January 2026)

## Overview

This document describes the poll sharing and embedding features that allow users to share polls on social media platforms (Facebook, Instagram, X/Twitter) and embed them in CMS platforms (WordPress, Joomla, any website).

---

## Feature Requirements

1. **Copy Poll Link** - Quick share URL
2. **Social Media Sharing** - FB, Instagram, X
3. **Embeddable Widget** - For WordPress, Joomla, any website
4. **API Access** - JSON endpoint for developers

---

## Recommended Approach

### Option A: Multi-Modal Share System (RECOMMENDED)

A share modal that appears when clicking "Share Poll" with multiple options:

```
┌─────────────────────────────────────────────┐
│           Share This Poll                    │
├─────────────────────────────────────────────┤
│  🔗 Copy Link        [Copy]                 │
│                                             │
│  📱 Social Media:                           │
│     [Facebook] [X/Twitter] [LinkedIn]       │
│                                             │
│  📋 Embed Code:                             │
│     ┌─────────────────────────────┐         │
│     │ <iframe src="..."></iframe> │ [Copy]  │
│     └─────────────────────────────┘         │
│                                             │
│  🔌 WordPress Shortcode:                    │
│     [pollchat id="123"]            [Copy]   │
│                                             │
│  📊 API Endpoint:                           │
│     /api/polls/123/embed           [Copy]   │
└─────────────────────────────────────────────┘
```

---

## Implementation Components

### 1. Share URL System

**Simple share URLs:**
```
https://yourdomain.com/polls/[poll-id]
https://yourdomain.com/p/[short-code]  (optional short URLs)
```

**Implementation:**
- Already exists: `/polls/[id]` page
- Add Open Graph meta tags for rich previews
- Add Twitter Card meta tags

### 2. Social Media Integration

#### Facebook
- **Method:** Facebook Share Dialog
- **URL Format:** `https://www.facebook.com/sharer/sharer.php?u={url}`
- **Requirements:** Open Graph meta tags for rich preview

#### X (Twitter)
- **Method:** Twitter Web Intent
- **URL Format:** `https://twitter.com/intent/tweet?url={url}&text={title}`
- **Requirements:** Twitter Card meta tags

#### Instagram
- **Limitation:** No direct web share API
- **Workaround:**
  - Copy link to clipboard with "Share to Instagram" button
  - Generate shareable image with poll question
  - QR code generation for mobile scanning

#### LinkedIn
- **Method:** LinkedIn Share URL
- **URL Format:** `https://www.linkedin.com/sharing/share-offsite/?url={url}`

### 3. Embeddable Widget (iframe)

**Create a standalone embed page:**
```
/embed/polls/[id]
```

**Features:**
- Minimal UI (no header/footer)
- Responsive design
- Customizable via URL params:
  - `?theme=light|dark`
  - `?showResults=true|false`
  - `?allowVote=true|false`

**Embed Code:**
```html
<iframe
  src="https://yourdomain.com/embed/polls/123?theme=light"
  width="100%"
  height="400"
  frameborder="0"
  style="border-radius: 8px; max-width: 500px;">
</iframe>
```

### 4. JavaScript Widget (Advanced)

For sites that prefer JS over iframes:

```html
<div id="pollchat-poll-123"></div>
<script src="https://yourdomain.com/widget.js"></script>
<script>
  PollChat.render({
    container: '#pollchat-poll-123',
    pollId: '123',
    theme: 'light',
    onVote: function(choice) { console.log('Voted:', choice); }
  });
</script>
```

### 5. API Endpoints

#### Get Poll Data (JSON)
```
GET /api/polls/[id]/embed
```

**Response:**
```json
{
  "id": "123",
  "question": "What is your favorite color?",
  "options": [
    { "id": "1", "text": "Red", "votes": 45 },
    { "id": "2", "text": "Blue", "votes": 32 },
    { "id": "3", "text": "Green", "votes": 23 }
  ],
  "totalVotes": 100,
  "createdAt": "2024-01-15T10:00:00Z",
  "embedUrl": "https://yourdomain.com/embed/polls/123",
  "shareUrl": "https://yourdomain.com/polls/123"
}
```

#### Vote via API
```
POST /api/polls/[id]/vote
Content-Type: application/json

{ "optionId": "1" }
```

### 6. WordPress Plugin Support

**oEmbed Support:**
WordPress can automatically embed URLs if you implement oEmbed:

```
GET /api/oembed?url=https://yourdomain.com/polls/123
```

**Response:**
```json
{
  "version": "1.0",
  "type": "rich",
  "title": "Poll: What is your favorite color?",
  "html": "<iframe src='...'></iframe>",
  "width": 500,
  "height": 400,
  "provider_name": "PollChat",
  "provider_url": "https://yourdomain.com"
}
```

### 7. Joomla Integration

**Options:**
1. Use iframe embed code (works immediately)
2. Create a Joomla module/plugin that fetches via API
3. Shortcode-style syntax in articles: `{pollchat id=123}`

---

## File Structure

```
src/
├── pages/
│   ├── embed/
│   │   └── polls/
│   │       └── [id].tsx          # Embeddable poll page
│   └── api/
│       └── polls/
│           └── [id]/
│               ├── embed.ts      # JSON embed data
│               └── oembed.ts     # oEmbed endpoint
├── components/
│   ├── ShareModal.tsx            # Share dialog component
│   ├── EmbedPoll.tsx             # Minimal embed component
│   └── SocialShareButtons.tsx    # Social media buttons
└── public/
    └── widget.js                 # Optional JS widget
```

---

## Implementation Status

### Phase 1: Core Sharing ✅ COMPLETE
1. ✅ Share button added to poll page
2. ✅ ShareModal component created with:
   - ✅ Copy link functionality
   - ✅ Social media share buttons (FB, X, LinkedIn)
3. ✅ Open Graph & Twitter Card meta tags added

### Phase 2: Embedding ✅ COMPLETE
4. ✅ `/embed/polls/[id]` page created
5. ✅ Embed code copy added to ShareModal
6. ✅ `/api/polls/[id]/embed` endpoint created

### Phase 3: Advanced Integration ✅ COMPLETE
7. ✅ oEmbed implemented for WordPress (`/api/oembed.ts`)
8. ✅ JavaScript widget created (`public/widget.js`)
9. ✅ QR code generation implemented (`/api/polls/[id]/qrcode.ts`)
10. ✅ Preview image generation implemented (`/api/polls/[id]/preview.png.ts`)

---

## Technical Considerations

### Open Graph Meta Tags
```html
<meta property="og:title" content="Poll: What is your favorite color?" />
<meta property="og:description" content="Vote now! 100 votes so far." />
<meta property="og:image" content="https://yourdomain.com/api/polls/123/image" />
<meta property="og:url" content="https://yourdomain.com/polls/123" />
<meta property="og:type" content="website" />
```

### Twitter Card Meta Tags
```html
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Poll: What is your favorite color?" />
<meta name="twitter:description" content="Vote now! 100 votes so far." />
<meta name="twitter:image" content="https://yourdomain.com/api/polls/123/image" />
```

### CORS Configuration
For API/widget access from external sites:
```typescript
// next.config.js
headers: [
  {
    source: '/api/polls/:id/embed',
    headers: [
      { key: 'Access-Control-Allow-Origin', value: '*' },
    ],
  },
  {
    source: '/embed/:path*',
    headers: [
      { key: 'X-Frame-Options', value: 'ALLOWALL' },
    ],
  },
]
```

---

## Security Considerations

1. **Rate Limiting** - Prevent API abuse
2. **Vote Validation** - Prevent duplicate votes (IP, session, user)
3. **Domain Whitelist** (optional) - Restrict which domains can embed
4. **CSRF Protection** - For vote submissions

---

## Example User Flow

1. User creates a poll in PollChat
2. User clicks "Share" button on poll page
3. Share modal opens with options:
   - **Quick share:** Click Facebook/X/LinkedIn icons
   - **Copy link:** Click to copy URL
   - **Embed:** Copy iframe code for WordPress/Joomla
4. User pastes embed code in WordPress post
5. Visitors see interactive poll and can vote
6. Votes sync back to PollChat database

---

## Recommended First Implementation

Start with **Phase 1** which provides immediate value:

```typescript
// ShareModal.tsx - Core functionality
const shareOptions = {
  copyLink: () => navigator.clipboard.writeText(pollUrl),
  facebook: () => window.open(`https://facebook.com/sharer/sharer.php?u=${pollUrl}`),
  twitter: () => window.open(`https://twitter.com/intent/tweet?url=${pollUrl}&text=${title}`),
  linkedin: () => window.open(`https://linkedin.com/sharing/share-offsite/?url=${pollUrl}`),
  embedCode: () => navigator.clipboard.writeText(`<iframe src="${embedUrl}" ...></iframe>`)
};
```

This gives users 80% of the functionality with minimal development effort.

---

## Questions to Consider

1. Should embedded polls allow voting or be view-only?
2. Should we track which sites embed our polls (analytics)?
3. Do we want to generate preview images dynamically?
4. Should embeds update in real-time or refresh on page load?
5. Do we need authentication for API access?

---

## Implementation Files

| Feature | File Location |
|---------|---------------|
| ShareModal Component | `src/components/ShareModal.tsx` |
| Embed Page | `src/pages/embed/polls/[id].tsx` |
| Embed API | `src/pages/api/polls/[id]/embed.ts` |
| QR Code API | `src/pages/api/polls/[id]/qrcode.ts` |
| Preview Image API | `src/pages/api/polls/[id]/preview.png.ts` |
| oEmbed API | `src/pages/api/oembed.ts` |
| JavaScript Widget | `public/widget.js` |
| Test Page | `src/pages/test-embed.tsx` |

## Testing

Visit `/test-embed` to test all sharing features interactively.
