# Frontend Quick Start Guide

## What Was Built

A complete, mobile-first Next.js demo for Raincoat following all specifications in `Demo_Design_Expectations_Full.md`.

## Quick Start

### 1. Services Already Running

The Docker services are already up:

- PostgreSQL (port 5432)
- Redis (port 6379)
- Rails API (port 3000)
- Next.js Frontend (port 3001)

### 2. Access the Demo

Open your browser to:

```
http://localhost:3001
```

### 3. Demo Flow (11 Screens)

1. **Welcome** - Click "Start Demo"
2. **Privacy** - Click "Got It"
3. **Upload** - Select a photo of clothing
4. **Category** - Choose TOP/BOTTOM/etc
5. **Processing** - Watch AI work (3-4 seconds)
6. **Tags** - Review auto-generated tags (edit or confirm)
7. **Closet** - See your uploaded item
8. **Location** - Select a city
9. **Weather** - See current conditions
10. **Recommendations** - View outfit suggestions
11. **Complete** - Demo summary

## What Was Created

### New Files (62 files total)

```
raincoat_frontend/
├── app/
│   ├── demo/
│   │   ├── WelcomeScreen.tsx          Welcome screen
│   │   ├── PrivacyScreen.tsx          Privacy messaging
│   │   ├── AddItemScreen.tsx          Photo upload
│   │   ├── CategoryScreen.tsx        🏷️  Category selection
│   │   ├── ProcessingScreen.tsx      ⚙️  AI processing
│   │   ├── TagsScreen.tsx            🏷️  Tag review/edit
│   │   ├── ClosetScreen.tsx           Closet grid
│   │   ├── LocationScreen.tsx         City selection
│   │   ├── WeatherScreen.tsx         🌤️  Weather display
│   │   ├── RecommendationsScreen.tsx  Outfit ideas
│   │   └── CompleteScreen.tsx         Demo summary
│   ├── layout.tsx                     Root layout
│   ├── page.tsx                       Main orchestrator
│   └── globals.css                    Design system
├── components/
│   ├── Button.tsx                     3 button variants
│   ├── Card.tsx                       Reusable cards
│   ├── Container.tsx                  Max-width wrapper
│   └── Tag.tsx                       🏷️  Tag chips
├── lib/
│   ├── api.ts                         Rails API client
│   └── onnx-processor.ts              AI processing
├── package.json                       Dependencies
├── tsconfig.json                     ⚙️  TypeScript config
├── tailwind.config.ts                 Design tokens
├── next.config.ts                    ⚙️  Next.js config
├── .env.example                       Environment template
└── README.md                          Frontend docs
```

### Modified Files

```
raincoat_api/config/initializers/cors.rb   # CORS for frontend
README.md                                   # Updated with frontend info
```

### Documentation

```
docs/
├── FRONTEND_IMPLEMENTATION.md              # Complete technical docs
└── FRONTEND_QUICK_START.md                 # This file
```

## Design System

### Colors (from design doc)

- **Primary Green** (#e1f5e1) - Trust, eco-friendly
- **Sky Blue** (#e3f2fd) - Calm, clarity
- **Warm Amber** (#fff3e0) - Processing, activity
- **Success Green** (#c8e6c9) - Success states
- **Warning Orange** (#f57c00) - Alerts
- **Info Blue** (#1976d2) - Primary actions

### Typography

- Headlines: 28-32px, medium weight
- Body: 16px, 1.5 line height
- Mobile-first: 320px minimum width

## Technical Stack

- **Next.js**: 15.0.3 (App Router)
- **React**: 18.3.1
- **TypeScript**: 5.x
- **Tailwind CSS**: 3.4.1
- **ONNX Runtime**: 1.20.1

## What Works

- [x] Complete 11-screen demo flow
- [x] Mobile-optimized design
- [x] Smooth transitions (300ms)
- [x] Privacy-first messaging
- [x] Tag editing interface
- [x] Closet grid view
- [x] Weather integration (mock)
- [x] Outfit recommendations (mock)
- [x] Restart demo functionality
- [x] Responsive layout
- [x] Accessibility features
- [x] API client ready

## ⚠️ Current Limitations (Demo Mode)

- **Mock Data**: Processing uses simulated results
- **Static Weather**: Not calling live weather API yet
- **No Persistence**: State resets on page refresh
- **Single User**: No authentication flow
- **Happy Path**: Limited error handling

## API Integration

### Rails Backend Expected at:

```
http://localhost:3000
```

### Endpoints Used:

```typescript
// Clothing
POST /api/v1/clothing_pieces
POST /api/v1/clothing_pieces/:id/embedding
GET  /api/v1/clothing_pieces/:id/similar

// Locations
GET  /api/v1/locations
POST /api/v1/locations
GET  /api/v1/locations/search

// Weather
GET  /api/v1/weather/current
GET  /api/v1/weather/recommendations
```

## Mobile-First

- Primary target: 375px (iPhone SE)
- Minimum width: 320px
- Touch targets: 44x44px minimum
- Portrait-optimized
- Safe area insets respected

## Testing Checklist

Run through the demo and verify:

- [ ] Welcome screen loads
- [ ] Privacy messaging is clear
- [ ] File upload works
- [ ] Category buttons are clickable
- [ ] Processing animation runs
- [ ] Tags appear correctly
- [ ] Can edit tags
- [ ] Closet shows uploaded items
- [ ] Location selection works
- [ ] Weather screen displays
- [ ] Recommendations show outfits
- [ ] Complete screen appears
- [ ] Restart button works

## Troubleshooting

### Frontend won't start

```bash
cd raincoat_frontend
npm install
npm run dev
```

### Rails API not responding

```bash
docker compose -f docker-compose.dev.yaml ps
# Should show all services healthy
```

### CORS errors

Check that CORS is configured in:

```
raincoat_api/config/initializers/cors.rb
```

### Port conflicts

- Frontend: 3001
- Rails API: 3000
- PostgreSQL: 5432
- Redis: 6379

## Documentation

### Detailed Docs

- [FRONTEND_IMPLEMENTATION.md](./FRONTEND_IMPLEMENTATION.md) - Complete technical documentation
- [Demo_Design_Expectations_Full.md](./Demo_Design_Expectations_Full.md) - Design specifications
- [raincoat_frontend/README.md](../raincoat_frontend/README.md) - Frontend-specific docs

### Design System

- Color palette: `raincoat_frontend/tailwind.config.ts`
- Component styles: `raincoat_frontend/app/globals.css`
- Button variants: `raincoat_frontend/components/Button.tsx`

## Next Steps

### Immediate

1. Test the demo flow
2. Provide feedback on UX
3. Test on different devices/browsers

### Short-term

1. Integrate real ONNX models
2. Connect to live weather API
3. Add authentication
4. Add error handling

### Future

1. Additional demo screens (15-18)
2. Dark mode
3. Animations with Framer Motion
4. Production deployment

## Integration with Existing Code

### Weather API

The frontend expects the weather integration we built earlier:

- Uses `/api/v1/weather/current` endpoint
- Displays temperature, condition, location
- Generates recommendations based on weather

### AI Models

Frontend is ready for ONNX models:

- U2-Net for background removal
- FashionCLIP for embeddings
- Currently uses mock processing

### Rails Backend

All endpoints match the API structure:

- Locations controller (8 endpoints)
- Weather controller (3 endpoints)
- Clothing pieces endpoints

## Project Status

### Completed

- [x] Next.js project setup
- [x] Design system implementation
- [x] All 11 demo screens
- [x] Component library
- [x] API client
- [x] CORS configuration
- [x] Documentation

### In Progress

- [ ] Real ONNX integration
- [ ] Live weather API
- [ ] Authentication flow

### Planned

- [ ] Additional screens
- [ ] Error handling
- [ ] State persistence
- [ ] Analytics

## URLs

- **Demo**: http://localhost:3001
- **Rails API**: http://localhost:3000
- **API Docs**: http://localhost:3000/api/v1 (if implemented)

## Tips

1. **Fast Iteration**: Edit files and see changes instantly (Hot Module Reload)
2. **Inspect Components**: Open React DevTools in browser
3. **Check Network**: Open browser DevTools → Network tab
4. **View Logs**: Terminal shows Next.js compilation output
5. **Test Mobile**: Use browser DevTools → Device Mode

## Customization

### Change Colors

Edit `raincoat_frontend/tailwind.config.ts`:

```typescript
colors: {
  primary: {
    green: "#your-color",
    // ...
  }
}
```

### Modify Screens

Each screen is a standalone component in `app/demo/`

### Add New Screen

1. Create `app/demo/NewScreen.tsx`
2. Add to step array in `app/page.tsx`
3. Add navigation logic

## Support

If you encounter issues:

1. Check browser console for errors
2. Check terminal for build errors
3. Verify services are running: `docker compose ps`
4. Review documentation files
5. Check git status for any conflicts

---

**Built**: October 30, 2025
**Status**: Complete and Running
**Demo URL**: http://localhost:3001

**Ready to test!**
