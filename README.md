# Raincoat

Raincoat is a privacy first, Machine learning powered, weather based outfit recommendation app. Upload your closet with client-side visual processing, get smart outfit suggestions based on weather conditions, and organize your clothing with intelligent collections.

## Features

- **Client-Side Processing**: All image processing happens locally - your photos never leave your device
- **Smart Auto-Tagging**: AI-powered clothing categorization, color detection, and automatic tagging
- **Weather-Based Recommendations**: Hybrid AI + rule-based outfit suggestions tailored to weather conditions
- **Smart Closet Management**: Upload and organize clothing items with intelligent similarity search
- **Closet Collections**: Create custom collections (Work, Casual, Travel, etc.)
- **Outfit Creation**: Build and save favorite outfits with intelligent category constraints
- **Multi-Location Support**: Manage closets for different locations
- **Vector Similarity Search**: Find similar items in your closet using AI embeddings

## Architecture

**Frontend**: Next.js 15.5+ with TypeScript and Tailwind CSS
**Backend**: Ruby on Rails 8.0.2 (API-only)
**Database**: PostgreSQL 16 with pgvector for AI embeddings
**Image Storage**: Active Storage with direct uploads
**Authentication**: Devise with session/token auth (JWT planned)
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
- Node.js 18+ and npm (recommended: create .nvmrc with version 18 or higher)
- Docker Desktop
- Git
- Python 3.11+ (for one-time AI model preparation only)

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
   # Export U2Net (quantized, optimized for browser)
   cd scripts/model_extraction_scripts/u2net_quantized
   python u2net_onnx_export_v2.py

   # Export FashionCLIP (quantized with FP16)
   cd ../FCLIP_quantized
   python FCLIP_onnx_export_V2.py

   # Export YOLO and generate label embeddings
   cd ..
   python yolo_export_only.py
   python fclip_generate_label_embeddings.py

   # Copy models to Rails public directory
   cp u2net_quantized/models/*.onnx ../../raincoat_api/public/models/
   cp FCLIP_quantized/models/*.onnx ../../raincoat_api/public/models/
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
   - Rails Test Page: http://localhost:3000/clothing_items/new
   - PostgreSQL: localhost:5432
   - Redis: localhost:6379

### Alternative: Full Docker Development


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

For services-only (PostgreSQL + Redis), use `docker-compose.services.yaml` instead.

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
├── raincoat_frontend/      # Next.js 15.5+ frontend
│   ├── app/                # Next.js App Router
│   │   ├── demo/           # Demo flow (11 screens)
│   │   │   ├── WelcomeScreen.tsx
│   │   │   ├── PrivacyScreen.tsx
│   │   │   ├── AddItemScreen.tsx
│   │   │   ├── ObjectDetectionAndCategoryScreen.tsx  # Combined detection + category
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
│   ├── model_extraction_scripts/  # AI model preparation
│   │   ├── u2net_quantized/       # U2Net FP16 quantized export
│   │   │   └── u2net_onnx_export_v2.py
│   │   ├── FCLIP_quantized/       # FashionCLIP FP16 quantized export
│   │   │   └── FCLIP_onnx_export_V2.py
│   │   ├── yolo_export_only.py
│   │   ├── yolo_full_process.py
│   │   ├── fclip_generate_label_embeddings.py
│   │   └── test_exported_models.py
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

- Size: ~88 MB (FP16 quantized from 176 MB)
- Input: 320x320 RGB image (auto-resized from max 800px for performance)
- Output: Segmentation mask
- Purpose: Remove distracting backgrounds from clothing photos
- Optimization: FP16 quantization for 50% size reduction with minimal quality loss

**FashionCLIP (Image Encoder)**

- Size: ~75 MB (FP16 quantized from 150 MB)
- Input: 224x224 RGB image
- Output: 512-dimensional embedding
- Purpose: Generate semantic representations of clothing items
- Optimization: FP16 quantization optimized for browser/mobile performance

**Label Embeddings (Auto-Tagging)**

- Size: ~50 KB
- Contains: Pre-computed embeddings for 100+ fashion/weather terms
- Purpose: Match image embeddings to tags via cosine similarity

**Weather Rules (Hybrid Matching)**

- Size: ~2 KB
- Contains: Weather condition → fashion descriptor mappings
- Purpose: Rule-based boosts for weather-appropriate recommendations

### Model Preparation

Models are exported with FP16 quantization for optimized browser performance:

```bash
# Export U2Net (FP16 quantized v2)
cd scripts/model_extraction_scripts/u2net_quantized
python u2net_onnx_export_v2.py

# Export FashionCLIP (FP16 quantized v2)
cd ../FCLIP_quantized
python FCLIP_onnx_export_V2.py

# Export YOLO and generate label embeddings
cd ..
python yolo_export_only.py
python fclip_generate_label_embeddings.py
```

Output files are copied to `raincoat_api/public/models/` and served as static assets. The v2 quantized scripts automatically handle dependencies and produce browser-optimized models with 50% size reduction.

## Data Models

- **Users**: Authentication and profile management
- **Locations**: Multiple location support for weather
- **Closets**: Custom collections of clothing items
- **ClothingItems**: Individual closet items with AI embeddings and tags
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
cd scripts/model_extraction_scripts

# Export U2Net (quantized v2 script handles dependencies)
cd u2net_quantized
python u2net_onnx_export_v2.py

# Export FashionCLIP (quantized v2 script handles dependencies)
cd ../FCLIP_quantized
python FCLIP_onnx_export_V2.py

# Export YOLO and generate label embeddings
cd ..
python yolo_export_only.py
python fclip_generate_label_embeddings.py

# Deploy to public directory
cp u2net_quantized/models/*.onnx ../../raincoat_api/public/models/
cp FCLIP_quantized/models/*.onnx ../../raincoat_api/public/models/
cp models/*.onnx ../../raincoat_api/public/models/
cp models/*.json ../../raincoat_api/public/models/
```

### Generating Seed Items with Real Embeddings

By default, seed data uses synthetic embeddings generated from item attributes (category, colors, materials). For production-quality similarity search, you should generate real FashionCLIP embeddings from actual images.

#### Why Real Embeddings Matter

- **Synthetic embeddings** (from `EmbeddingGenerator`) are deterministic and heuristic-based, but lack visual nuance
- **Real embeddings** (from FashionCLIP) capture actual visual features like patterns, textures, and style
- Mixing both types creates an **embedding space mismatch** - similarity search won't work correctly
- User uploads always use real FashionCLIP embeddings, so seed data should too

#### Prerequisites

```bash
# Install Python dependencies
pip install torch torchvision pillow numpy onnxruntime ultralytics rembg

# Verify required models exist
ls raincoat_api/public/models/fashionclip_image_encoder.onnx  # FashionCLIP
ls scripts/model_extractions/models/yolo_raincoat.onnx        # YOLO (if not in public/models)
```

#### Processing Pipeline

The `process_seed_images.py` script performs a 2-step pipeline:

**Step 1: Image Processing**
1. YOLO object detection (finds clothing items in photos)
2. Automatic cropping with 10% padding
3. Resize to 320x320 for performance
4. Background removal using U2-Net (via rembg)
5. Save processed images to `raincoat_api/db/seed_images/processed/`

**Step 2: Embedding Generation**
1. Load processed images
2. Resize to 224x224 for FashionCLIP
3. Apply FashionCLIP preprocessing (same as frontend):
   - Mean normalization: `[0.48145466, 0.4578275, 0.40821073]`
   - Std normalization: `[0.26862954, 0.26130258, 0.27577711]`
   - CHW tensor format
4. Generate 512-dimensional embeddings via ONNX inference
5. Normalize to unit length (L2 norm)
6. Save to `raincoat_api/db/fixtures/seed_embeddings.json`

#### Usage

```bash
# Navigate to scripts directory
cd scripts

# Place original seed images in raincoat_api/db/seed_images/
# (Photos can contain multiple items - YOLO will detect and crop them)

# Run the full pipeline
python process_seed_images.py

# Output files:
# - raincoat_api/db/seed_images/processed/*.png  (cropped, background-removed)
# - raincoat_api/db/fixtures/seed_embeddings.json  (real embeddings)
```

#### Seed Embeddings Format

The generated `seed_embeddings.json` has this structure:

```json
{
  "generated_at": "2024-01-15T10:30:00Z",
  "model_version": "fashionclip-2.0",
  "embedding_dimensions": 512,
  "total_items": 25,
  "embeddings": [
    {
      "item_name": "Navy Blazer",
      "filename": "navy_blazer.png",
      "vector_data": [0.123, -0.456, ...],  // 512 values
      "category": "outerwear",
      "seed_key": "navy_blazer_formal",
      "colors": ["navy", "blue"],
      "materials": ["wool"],
      "description": "Classic navy blazer",
      "vector_magnitude": 1.0
    }
  ]
}
```

#### Using Real Embeddings in Seeds

The Rails seed file (`db/seeds.rb`) automatically prioritizes real embeddings:

```ruby
# Priority: seed_embeddings (real) > embeddings > sample_embeddings (synthetic)
pregenerated_embeddings = EmbeddingGenerator.load_from_fixture('seed_embeddings') ||
                          EmbeddingGenerator.load_from_fixture('embeddings') ||
                          EmbeddingGenerator.load_from_fixture('sample_embeddings')
```

After generating embeddings, run:

```bash
cd raincoat_api
bundle exec rails db:seed
```

This will populate the database with clothing items that have real FashionCLIP embeddings, enabling accurate similarity search with user-uploaded items.

#### Troubleshooting

**YOLO model not found:**
```bash
# Copy from model_extraction_scripts if needed
cp scripts/model_extraction_scripts/models/yolo_raincoat.onnx raincoat_api/public/models/
```

**FashionCLIP model not found:**
```bash
# Re-export from HuggingFace (using quantized v2)
cd scripts/model_extraction_scripts/FCLIP_quantized
python FCLIP_onnx_export_V2.py
cp models/fashionclip_image_encoder.onnx ../../../raincoat_api/public/models/
```

**Rembg background removal fails:**
```bash
# Reinstall with U2-Net model
pip install --upgrade rembg[gpu]  # or rembg for CPU-only
```

**Empty processed directory:**
- Check YOLO detected items: look for console output showing bounding boxes
- Verify confidence threshold (default: 0.25) isn't too high
- Ensure input images contain visible clothing items

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
- `GET /clothing_items/new` - Rails test page (with AI processing)
- `POST /closet` - Create clothing item (with embedding)
- `GET /closet/:id` - Show clothing item details
- `GET /closet/:id/similar` - Find similar items

### API v1 (JSON) - Used by Next.js Frontend

- `GET /api/v1/clothing_items` - List items
- `POST /api/v1/clothing_items` - Create item
- `POST /api/v1/clothing_items/:id/embedding` - Upload embedding
- `GET /api/v1/clothing_items/:id/similar` - Similar items
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

- [x] Interactive demo flow with 11 screens
- [x] Live crop preview with category selection
- [x] Combine object detection and category screens
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

# Re-export if needed (using quantized v2 scripts)
cd scripts/model_extraction_scripts/u2net_quantized
python u2net_onnx_export_v2.py

cd ../FCLIP_quantized
python FCLIP_onnx_export_V2.py
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
