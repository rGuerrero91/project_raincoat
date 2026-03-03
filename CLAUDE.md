# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Raincoat is a privacy-first, ML-powered weather-based outfit recommendation app. It's a monorepo containing:
- **raincoat_frontend**: Next.js 15.5+ TypeScript frontend with client-side AI processing
- **raincoat_api**: Ruby on Rails 8.0.2 API backend with PostgreSQL/pgvector

## Development Commands

### Frontend (raincoat_frontend)
```bash
npm run dev              # Start dev server (localhost:3001)
npm run lint             # ESLint
npm run test             # Jest tests (watch mode)
npm run test:ci          # Jest with coverage
npm run build            # Production build
```

### Backend (raincoat_api)
```bash
bundle exec rails server              # Start server (localhost:3000)
bundle exec rspec                     # Run all tests
bundle exec rspec spec/models/user_spec.rb  # Single test file
bundle exec rails db:migrate          # Run migrations
bundle exec rails console             # Rails console
bundle exec rubocop -A                # Lint and auto-fix Ruby
```

### Docker (services only - recommended for development)
```bash
docker compose -f docker-compose.services.yaml up -d   # Start PostgreSQL + Redis
docker compose -f docker-compose.services.yaml down    # Stop services
```

### Full Docker Development
```bash
docker compose -f docker-compose.dev.yaml up           # Full environment
docker compose -f docker-compose.dev.yaml exec rails bundle exec rspec  # Run tests
```

## Architecture

### Privacy-First Design
Images never leave the user's device. The client-side pipeline:
1. **YOLOv8** (object detection) → crops clothing items
2. **U2-Net** (segmentation) → removes background
3. **FashionCLIP** (embeddings) → generates 512D vectors
4. Only embeddings + user-validated tags are sent to the server

### Key Technology Stack
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, ONNX Runtime Web
- **Backend**: Rails 8 API-only, PostgreSQL 16 with pgvector, Redis
- **AI Models**: Client-side ONNX (YOLOv8, U2-Net, FashionCLIP)
- **Auth**: Devise with devise-jwt

### Database
- Uses pgvector extension for 512-dimensional embedding similarity search
- `neighbor` gem handles vector operations in Rails

### Frontend Structure
- `app/demo/` - 11-screen demo flow components
- `lib/` - AI handlers (yolo-detector.ts, onnx-processor.ts, api.ts)
- WASM files for ONNX runtime must be in `public/`

### Backend Structure
- `app/services/` - Business logic
- `app/controllers/api/v1/` - JSON API endpoints
- AI models served from `public/models/`

## Code Style

### Pre-commit Hooks
Husky + lint-staged runs automatically on commit:
- Frontend: ESLint + Prettier
- Backend: RuboCop with auto-fix
- Config files: Prettier

### Manual Formatting
```bash
# Frontend
cd raincoat_frontend && npx eslint --fix .
prettier --write "raincoat_frontend/**/*.{ts,tsx,js,jsx,css,json}"

# Backend
cd raincoat_api && bundle exec rubocop -A
```

## API Endpoints

### Main JSON API (used by frontend)
- `GET/POST /api/v1/clothing_items` - CRUD for clothing items
- `POST /api/v1/clothing_items/:id/embedding` - Store embedding vector
- `GET /api/v1/clothing_items/:id/similar` - Find similar items
- `POST /api/v1/embeddings/search` - Vector similarity search
- `GET /api/v1/weather?location=...` - Weather data
- `GET /api/v1/recommendations` - Outfit recommendations

## AI Model Preparation (one-time)

Models are pre-exported with FP16 quantization. If regeneration is needed:
```bash
cd scripts/model_extraction_scripts

# Export models (requires Python 3.11+ with torch, onnx, ultralytics)
cd u2net_quantized && python u2net_onnx_export_v2.py
cd ../FCLIP_quantized && python FCLIP_onnx_export_V2.py
cd .. && python yolo_export_only.py && python fclip_generate_label_embeddings.py

# Copy to Rails public directory
cp u2net_quantized/models/*.onnx ../../raincoat_api/public/models/
cp FCLIP_quantized/models/*.onnx ../../raincoat_api/public/models/
cp models/*.onnx ../../raincoat_api/public/models/
cp models/*.json ../../raincoat_api/public/models/
```

## Environment Variables

### Development
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/raincoat_development
REDIS_URL=redis://localhost:6379/0
```

### Production (additional)
```env
SECRET_KEY_BASE=<secret>
WEATHER_API_KEY=<weatherapi.com key>
```
