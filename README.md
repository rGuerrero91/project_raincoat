# Raincoat

Raincoat is a privacy first, Machine learning powered, weather based outfit recommendation app. Upload your closet with client-side visual processing, get smart outfit suggestions based on weather conditions, and organize your clothing with intelligent collections.

## Features

- **Client-Side Processing**: All image processing happens locally - your photos never leave your device
- **Smart Auto-Tagging**: AI-powered clothing categorization, color detection, and automatic tagging
- **Weather-Based Recommendations**: Hybrid AI + rule-based outfit suggestions tailored to weather conditions
- **Smart Closet Management**: Upload and organize clothing pieces with intelligent similarity search
- **Closet Collections**: Create custom collections (Work, Casual, Travel, etc.)
- **Outfit Creation**: Build and save favorite outfits with intelligent category constraints
- **Multi-Location Support**: Manage closets for different locations
- **Vector Similarity Search**: Find similar items in your closet using AI embeddings

## Architecture

**Frontend**: Next.js 15 with TypeScript and Tailwind CSS
**Backend**: Ruby on Rails 8 (API-only)
**Database**: PostgreSQL 15 with pgvector for AI embeddings
**Image Storage**: Active Storage with direct uploads
**Authentication**: JWT with Devise
**Caching**: Redis
**AI Processing**: Client-side ONNX models (U2-Net, YOLOv8, FashionCLIP)
**Weather Data**: WeatherAPI.com

### Privacy-First Design

```
USER DEVICE (Browser)
====================
Photo Attachment
    ↓
YOLOv8 ONNX (object detection & cropping)
    ↓
User Category Selection
    ↓
U2-Net ONNX (background removal)
    ↓
FashionCLIP ONNX (embedding generation)
    ↓
Auto-Tagging (label matching)
    ↓
User Validation
    ↓
Upload ONLY: [512D embedding + tags]

SERVER (Rails API)
==================
Receives: Vector embeddings + metadata
Stores: PostgreSQL with pgvector
Returns: Recommendations + similar items
```

Photos never leave your device. Only vector embeddings and user-validated tags are sent to the server.

## Quick Start

### Prerequisites

- Ruby 3.4.5 (use rbenv, rvm, or asdf)
- Node.js 18+ and npm (for Next.js frontend)
- Docker Desktop
- Git
- Python 3.11+ (for AI model preparation)

### Ruby Installation

Using rbenv:

```bash
rbenv install 3.4.5
rbenv local 3.4.5
```

Using rvm:

```bash
rvm install 3.4.5
rvm use 3.4.5
```

### Development Setup (Hybrid Approach)

1. **Clone the repository**

   ```bash
   git clone github.com/rGuerrero91/project_raincoat
   cd project_raincoat
   ```

2. **Start services (PostgreSQL + Redis)**

   ```bash
   docker compose -f docker-compose.services.yaml up -d
   ```

3. **Setup Rails API**

   ```bash
   cd raincoat_api
   bundle install
   bundle exec rails db:create
   bundle exec rails db:migrate
   bundle exec rails db:seed
   ```

4. **Prepare AI Models** (one-time setup)

   ```bash
   cd scripts/model_extractions

   # Install Python dependencies
   pip install torch transformers

   # Extract U2-Net, export FashionCLIP, and YOLO
   python extract_u2net_onnx.py
   python export_fashionclip_onnx.py
   python export_yolo_onnx.py

   # Generate label embeddings
   python generate_label_embeddings.py

   # Copy models to Rails public directory
   cp models/*.onnx ../../raincoat_api/public/models/
   cp models/*.json ../../raincoat_api/public/models/
   ```

5. **Setup Next.js Frontend**

   ```bash
   cd raincoat_frontend
   npm install

   # Copy WASM files to Next.js public directory
   cp ../raincoat_api/public/js/onnx/ort-wasm.wasm public/
   cp ../raincoat_api/public/js/onnx/ort-wasm-simd.wasm public/
   ```

6. **Start development servers**

   ```bash
   # Terminal 1: Start Rails API
   cd raincoat_api
   bundle exec rails server

   # Terminal 2: Start Next.js frontend
   cd raincoat_frontend
   npm run dev
   ```

7. **Access the application**
   - Next.js Frontend: http://localhost:3001
   - Rails API: http://localhost:3000
   - Rails Test Page: http://localhost:3000/clothing_pieces/new
   - PostgreSQL: localhost:5432
   - Redis: localhost:6379

### Full Docker Setup (Alternative)

For consistent environments across machines or when you prefer full containerization:

1. **Start the full development environment**

   ```bash
   docker compose -f docker-compose.dev.yaml up
   ```

2. **Set up the database** (first time only)
   ```bash
   docker compose -f docker-compose.dev.yaml exec rails bundle exec rails db:create
   docker compose -f docker-compose.dev.yaml exec rails db:migrate
   docker compose -f docker-compose.dev.yaml exec rails db:seed
   ```

### Environment Reset

If you encounter issues or need a fresh start:

**Windows:**

```powershell
.\scripts\reset_docker.ps1
```

**Mac/Linux:**

```bash
./scripts/reset_docker.sh
```

## Structure

```
project_raincoat/
├── raincoat_api/           # Rails API backend
│   ├── app/
│   │   ├── models/         # Data models
│   │   ├── controllers/    # API controllers
│   │   └── services/       # Business logic
│   ├── config/             # Rails configuration
│   ├── db/                 # Database migrations & seeds
│   ├── public/             # Static assets & AI models
│   │   ├── js/
│   │   │   ├── onnx/       # ONNX runtime WASM files
│   │   │   ├── yolo_handler.js      # YOLOv8 detection handler
│   │   │   ├── pipeline_handler.js  # Full processing pipeline
│   │   │   └── model_cache.js       # Model caching logic
│   │   └── models/         # AI model files
│   │       ├── u2net.onnx  # Background removal (~167 MB)
│   │       ├── fashionclip_image_encoder.onnx  # Image embeddings (~150 MB)
│   │       ├── yolo_raincoat.onnx  # Object detection (~6 MB)
│   │       ├── yolo_config.json    # YOLO configuration
│   │       ├── label_embeddings.json  # Fashion/weather labels (~50 KB)
│   │       └── weather_rules.json  # Transitional mappings (~2 KB)
│   ├── Gemfile            # Ruby dependencies
│   └── Dockerfile.dev      # Development Docker image
├── raincoat_frontend/      # Next.js 15 frontend
│   ├── app/                # Next.js App Router
│   │   ├── demo/           # Demo flow screens
│   │   │   ├── WelcomeScreen.tsx
│   │   │   ├── PrivacyScreen.tsx
│   │   │   ├── AddItemScreen.tsx
│   │   │   ├── ObjectDetectionScreen.tsx
│   │   │   ├── CategoryScreen.tsx
│   │   │   ├── ProcessingScreen.tsx
│   │   │   ├── TagsScreen.tsx
│   │   │   ├── ClosetScreen.tsx
│   │   │   ├── LocationScreen.tsx
│   │   │   ├── WeatherScreen.tsx
│   │   │   ├── RecommendationsScreen.tsx
│   │   │   └── CompleteScreen.tsx
│   │   └── page.tsx        # Demo orchestrator
│   ├── components/         # Reusable React components
│   ├── lib/                # Utilities and AI handlers
│   │   ├── yolo-detector.ts      # YOLOv8 TypeScript wrapper
│   │   ├── onnx-processor.ts     # U2-Net & FashionCLIP processor
│   │   └── api.ts                # API client
│   ├── public/             # Static files
│   │   ├── ort-wasm.wasm          # ONNX Runtime WASM
│   │   └── ort-wasm-simd.wasm    # ONNX Runtime SIMD WASM
│   └── package.json        # Node dependencies
├── scripts/                # Utility scripts
│   ├── model_extractions/  # AI model preparation
│   │   ├── extract_u2net_onnx.py
│   │   ├── export_fashionclip_onnx.py
│   │   ├── export_yolo_onnx.py
│   │   └── generate_label_embeddings.py
│   ├── reset_docker.ps1    # Windows Docker reset
│   └── reset_docker.sh     # Unix Docker reset
├── init.sql               # PostgreSQL initialization
├── .ruby-version          # Ruby version specification
├── docker-compose.dev.yaml      # Full Docker development
├── docker-compose.services.yaml # Services-only Docker
└── README.md              # This file
```

## AI Model Pipeline

### Client-Side Models (Browser)

**YOLOv8n (Object Detection)**

- Size: ~6 MB
- Input: 640x640 RGB image with letterboxing
- Output: Bounding boxes with category classifications
- Categories: top, bottom, outerwear, shoes, accessories
- Purpose: Detect and crop clothing items from photos
- Features: Multi-object detection, auto-cropping with padding

**U2-Net (Background Removal)**

- Size: ~167 MB
- Input: 320x320 RGB image (auto-resized from max 800px for performance)
- Output: Segmentation mask
- Purpose: Remove distracting backgrounds from clothing photos
- Optimization: Images resized to max 800x800 before processing

**FashionCLIP (Image Encoder)**

- Size: ~150 MB
- Input: 224x224 RGB image
- Output: 512-dimensional embedding
- Purpose: Generate semantic representations of clothing items

**Label Embeddings (Auto-Tagging)**

- Size: ~50 KB
- Contains: Pre-computed embeddings for 100+ fashion/weather terms
- Purpose: Match image embeddings to tags via cosine similarity

**Weather Rules (Hybrid Matching)**

- Size: ~2 KB
- Contains: Weather condition → fashion descriptor mappings
- Purpose: Rule-based boosts for weather-appropriate recommendations

### Model Preparation

Models are extracted/exported once and served as static assets:

```bash
# Extract U2-Net from rembg cache
python extract_u2net_onnx.py

# Export FashionCLIP from HuggingFace
python export_fashionclip_onnx.py

# Generate label embeddings (fashion + weather terms)
python generate_label_embeddings.py
```

Output files are copied to `raincoat_api/public/models/` and served via CDN.

## Data Models

- **Users**: Authentication and profile management
- **Locations**: Multiple location support for weather
- **Closets**: Custom collections of clothing pieces
- **ClothingPieces**: Individual closet items with AI embeddings and tags
  - `ai_tags` (JSON): Auto-generated tags from image similarity
  - `user_tags` (JSON): User-added manual tags
  - `colors`, `materials`, `weather_suitability` (JSON): Structured attributes
- **ClothingEmbeddings**: 512D vector representations for similarity search
- **Outfits**: Saved outfit combinations
- **WeatherSnapshots**: Cached weather data

## Development Commands

### Rails Commands (Hybrid Approach)

```bash
# Navigate to Rails directory
cd raincoat_api

# Generate models, controllers, etc.
bundle exec rails generate model User

# Run migrations
bundle exec rails db:migrate

# Rails console
bundle exec rails console

# Run tests
bundle exec rspec

# Start server
bundle exec rails server
```

### Rails Commands (Full Docker)

```bash
# Generate models, controllers, etc.
docker compose -f docker-compose.dev.yaml exec rails bundle exec rails generate model User

# Run migrations
docker compose -f docker-compose.dev.yaml exec rails bundle exec rails db:migrate

# Rails console
docker compose -f docker-compose.dev.yaml exec rails bundle exec rails console

# Run tests
docker compose -f docker-compose.dev.yaml exec rails bundle exec rspec
```

### Docker Commands

```bash
# Start services only (hybrid approach)
docker compose -f docker-compose.services.yaml up -d

# Start full environment
docker compose -f docker-compose.dev.yaml up

# Stop services
docker compose -f docker-compose.services.yaml down
docker compose -f docker-compose.dev.yaml down

# View logs
docker compose -f docker-compose.dev.yaml logs rails

# Rebuild after Dockerfile changes
docker compose -f docker-compose.dev.yaml up --build
```

### AI Model Commands

```bash
# One-time setup: prepare all AI models
cd scripts/model_extractions

# Install dependencies
pip install torch transformers ultralytics

# Extract and export models
python extract_u2net_onnx.py
python export_fashionclip_onnx.py
python export_yolo_onnx.py
python generate_label_embeddings.py

# Deploy to public directory
cp models/*.onnx ../../raincoat_api/public/models/
cp models/*.json ../../raincoat_api/public/models/
```

### Frontend Commands

```bash
# Navigate to frontend directory
cd raincoat_frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run type-check

# Linting
npm run lint
```

## Testing

### Hybrid Approach

```bash
cd raincoat_api

# Run full test suite
bundle exec rspec

# Run specific test file
bundle exec rspec spec/models/user_spec.rb

# Run with coverage
bundle exec rspec --format documentation
```

### Full Docker

```bash
# Run full test suite
docker compose -f docker-compose.dev.yaml exec rails bundle exec rspec

# Run specific test file
docker compose -f docker-compose.dev.yaml exec rails bundle exec rspec spec/models/user_spec.rb
```

## Environment Variables

### Required for Development

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/raincoat_development
REDIS_URL=redis://localhost:6379/0
RAILS_ENV=development
```

### Required for Production

```env
SECRET_KEY_BASE=<your-secret-key>
WEATHER_API_KEY=<weatherapi-key>
DATABASE_URL=<production-db-url>
REDIS_URL=<production-redis-url>
```

## API Endpoints

### Authentication

- `POST /signup` - User registration
- `POST /login` - User login
- `GET /logout` - User logout

### Closet Management

- `GET /closet` - List user's clothing items
- `GET /clothing_pieces/new` - Rails test page (with AI processing)
- `POST /closet` - Create clothing item (with embedding)
- `GET /closet/:id` - Show clothing item details
- `GET /closet/:id/similar` - Find similar items

### API v1 (JSON) - Used by Next.js Frontend

- `GET /api/v1/clothing_pieces` - List items
- `POST /api/v1/clothing_pieces` - Create item
- `POST /api/v1/clothing_pieces/:id/embedding` - Upload embedding
- `GET /api/v1/clothing_pieces/:id/similar` - Similar items
- `POST /api/v1/embeddings/search` - Vector similarity search
- `GET /api/v1/embeddings/stats` - Embedding statistics
- `GET /api/v1/weather?location=...` - Get weather data
- `GET /api/v1/recommendations?location=...&closet_items=...` - Get outfit recommendations

### Static Assets (Served by Rails)

- `/models/*.onnx` - AI model files
- `/models/*.json` - Model configurations and embeddings
- `/js/onnx/*.wasm` - ONNX Runtime WebAssembly files
- `/js/*.js` - Client-side JavaScript handlers

## Development Roadmap

### Phase 1: Foundation (COMPLETED)

- [x] Project setup and development environment
- [x] Rails API scaffolding and database setup
- [x] Authentication system implementation
- [x] Core data models and migrations

### Phase 2: Core Features (COMPLETED)

- [x] User management and profile system
- [x] Closet CRUD operations and image handling
- [x] Weather integration and location management
- [x] Clothing categorization and tagging

### Phase 3: Smart Features (COMPLETED)

- [x] YOLOv8 object detection and auto-cropping (client-side)
- [x] U2-Net background removal (client-side)
- [x] FashionCLIP embedding generation (client-side)
- [x] AI automatic tagging with label embeddings
- [x] Weather-to-outfit matching (hybrid AI + rules)
- [x] Vector similarity search with pgvector
- [x] Next.js frontend demo with full pipeline

### Phase 4: Frontend Polish (IN PROGRESS)

- [x] Interactive demo flow with 12 screens
- [x] Live crop preview with category selection
- [ ] Combine object detection and category screens
- [ ] Enhanced UI/UX and responsive design
- [ ] Error handling and user feedback
- [ ] Loading states and animations

### Phase 5: Advanced Features (PLANNED)

- [ ] Enhanced recommendation algorithms
- [ ] Outfit builder with smart suggestions
- [ ] Advanced analytics and user insights
- [ ] Mobile-optimized progressive web app

### Phase 6: Production Ready (PLANNED)

- [ ] Comprehensive testing and security audit
- [ ] Production deployment and monitoring
- [ ] Performance optimization
- [ ] Beta launch and user feedback integration

## Technical Highlights

### Client-Side AI Processing

- **Complete Privacy**: Images never leave the device - only embeddings and tags are uploaded
- **ONNX Runtime**: Efficient browser-based inference with WASM backend
- **Multi-Model Pipeline**: YOLOv8 → U2-Net → FashionCLIP → Auto-Tagging
- **Performance Optimized**:
  - Images resized to max 800x800 before processing
  - Model caching with IndexedDB
  - Singleton pattern prevents duplicate model loading
  - React Strict Mode guards prevent double-processing

### Hybrid Intelligence

- **AI Embeddings**: FashionCLIP generates 512D semantic representations
- **Rule-Based Boosts**: Weather-specific logic ensures appropriate recommendations
- **Label Matching**: Cosine similarity between image and text embeddings
- **Best of Both**: Flexible AI discovery + controlled business rules

### Vector Similarity Search

- **PostgreSQL + pgvector**: Native vector operations in the database
- **512-Dimensional Embeddings**: Rich semantic representations
- **Cosine Similarity**: Find related items by semantic meaning
- **Efficient Queries**: Nearest-neighbor search with proper indexing

### Weather Integration

- **API Integration**: Real-time weather data from WeatherAPI.com
- **Semantic Mapping**: Weather conditions → fashion descriptors
- **Hybrid Matching**: AI embeddings + rule-based overrides
- **Location Support**: Multiple locations with cached weather data

### Next.js Frontend Architecture

- **App Router**: Modern Next.js 15 with TypeScript
- **Component-Based**: Reusable UI components with Tailwind CSS
- **State Management**: React hooks for demo flow orchestration
- **Type Safety**: Full TypeScript coverage with proper interfaces
- **API Integration**: Clean separation between frontend and Rails backend

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary.

## Troubleshooting

### Common Issues

**Ruby version mismatch:**

```bash
# Check current Ruby version
ruby --version

# Install correct version with rbenv
rbenv install 3.4.5
rbenv local 3.4.5

# Or with rvm
rvm install 3.4.5
rvm use 3.4.5
```

**Database connection errors:**

```bash
# Check if services are running
docker compose -f docker-compose.services.yaml ps

# Restart services
docker compose -f docker-compose.services.yaml restart
```

**Gem installation issues:**

```bash
cd raincoat_api
bundle install
```

**AI model loading errors:**

```bash
# Verify models exist
ls -lh raincoat_api/public/models/

# Re-extract if needed
cd scripts/model_extractions
python extract_u2net_onnx.py
python export_fashionclip_onnx.py
```

**ONNX runtime errors in browser:**

- Check browser console for specific input name errors
- Verify WASM files are accessible: http://localhost:3000/js/onnx/
- Ensure models are in public/models/ directory

**Port conflicts:**
Edit `docker-compose.services.yaml` to change port mappings if 5432 or 6379 are in use.

### Getting Help

- Check service logs: `docker compose -f docker-compose.services.yaml logs db`
- Verify containers are healthy: `docker compose -f docker-compose.services.yaml ps`
- Use the reset scripts for a fresh start
- Check browser console for client-side AI errors

---

Built for weather-conscious fashion lovers who value privacy
