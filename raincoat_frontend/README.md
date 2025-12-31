# Raincoat Frontend

Lightweight Next.js frontend demo for the Raincoat weather-smart wardrobe application.

## Overview

This is a mobile-first demo experience that showcases:

- Privacy-first photo processing (client-side AI)
- Smart auto-tagging with ONNX models
- Weather-based outfit recommendations
- Closet organization and management

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI Processing**: ONNX Runtime Web
- **API Client**: Fetch with custom wrapper

## Design System

Based on `docs/Demo_Design_Expectations_Full.md`:

### Colors

- **Primary**: Fresh Green (#e1f5e1), Sky Blue (#e3f2fd), Warm Amber (#fff3e0)
- **Accent**: Success Green (#c8e6c9), Warning Orange (#f57c00), Info Blue (#1976d2)
- **Neutrals**: Dark (#212121), Medium (#757575), Light (#fafafa)

### Typography

- Headlines: 28-32px, medium weight
- Body: 16px, 1.5-1.6 line height
- Mobile-first, 320px minimum width

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Rails API running on port 3000

### Installation

```bash
cd raincoat_frontend
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
raincoat_frontend/
├── app/
│   ├── demo/              # Demo flow screens
│   │   ├── WelcomeScreen.tsx
│   │   ├── PrivacyScreen.tsx
│   │   ├── AddItemScreen.tsx
│   │   ├── CategoryScreen.tsx
│   │   ├── ProcessingScreen.tsx
│   │   ├── TagsScreen.tsx
│   │   ├── ClosetScreen.tsx
│   │   ├── LocationScreen.tsx
│   │   ├── WeatherScreen.tsx
│   │   ├── RecommendationsScreen.tsx
│   │   └── CompleteScreen.tsx
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Main demo orchestrator
│   └── globals.css        # Global styles + design system
├── components/            # Reusable UI components
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Container.tsx
│   └── Tag.tsx
├── lib/                   # Utilities and services
│   ├── api.ts            # Rails API client
│   └── onnx-processor.ts # Client-side AI processing
└── public/               # Static assets
```

## Demo Flow

The demo follows this 11-screen journey:

1. **Welcome** - Introduction to Raincoat
2. **Privacy Promise** - Privacy-first messaging
3. **Add Item** - Photo upload
4. **Category** - Select clothing category
5. **Processing** - Client-side AI processing (3-4s)
6. **Tags** - Review and edit auto-generated tags
7. **Closet** - View uploaded items
8. **Location** - Select city for weather
9. **Weather** - Display current weather
10. **Recommendations** - AI outfit suggestions
11. **Complete** - Demo summary

## API Integration

The frontend communicates with the Rails API at `http://localhost:3000`:

### Key Endpoints

- `POST /signup` - User registration
- `POST /login` - User login
- `GET /api/v1/clothing_items` - List closet items
- `POST /api/v1/clothing_items` - Create item
- `GET /api/v1/locations` - List locations
- `GET /api/v1/weather/current` - Current weather
- `GET /api/v1/weather/recommendations` - Outfit suggestions

See `lib/api.ts` for full API client implementation.

## Client-Side AI

### ONNX Models

The frontend loads and runs AI models directly in the browser:

- **U2-Net** (~167MB) - Background removal
- **FashionCLIP** (~150MB) - Image embeddings
- **Label Embeddings** (~50KB) - Auto-tagging

Models are served from the Rails API at `/models/*.onnx`.

### Processing Pipeline

1. Load image from file input
2. Remove background with U2-Net
3. Generate 512D embedding with FashionCLIP
4. Match embedding to fashion labels
5. Return processed image + tags + embedding

Only the embedding and tags are sent to the server - **photos never leave the device**.

## Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Design Principles

From the design doc:

- **Privacy-First Transparency**: Make local processing visible
- **Effortless Intelligence**: AI works quietly in background
- **Progressive Discovery**: Introduce features naturally
- **Weather-Aware Context**: Weather drives the narrative

## Mobile-First

- Minimum width: 320px
- Primary target: 375px (iPhone SE)
- Touch targets: Minimum 44x44px
- Safe areas respected for iOS notch/Dynamic Island

## Accessibility

- ARIA labels on all interactive elements
- Keyboard navigation support
- 4.5:1 contrast ratio for text
- Focus management in modals

## Performance

- Models cached in IndexedDB after first load
- Image processing: 3-4 seconds
- Weather fetch: < 1 second
- Smooth 300ms transitions between screens

## Browser Support

- Chrome/Edge (WebGPU acceleration)
- Safari (WASM fallback)
- Firefox (WASM fallback)
- Requires modern browser with ES2020 support

## Testing

```bash
npm run lint
```

## Contributing

This is a demo interface. For production features, see the main project README.

## License

Private and proprietary - part of the Raincoat project.

---

Built for weather-conscious fashion lovers who value privacy
