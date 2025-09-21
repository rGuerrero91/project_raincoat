# Raincoat

A modern, AI-powered weather-based outfit recommendation app. Upload your closet, get smart outfit suggestions based on weather conditions, and organize your clothing with intelligent collections.

## Features

- **Smart Closet Management**: Upload and organize clothing pieces with AI-powered automatic tagging
- **Weather-Based Recommendations**: Get outfit suggestions tailored to current weather conditions
- **Closet Collections**: Create custom collections to organize your closet (Work, Casual, Travel, etc.)
- **Outfit Creation**: Build and save favorite outfits with intelligent category constraints
- **Multi-Location Support**: Manage closets for different locations (Home, Office, Travel)
- **AI Image Processing**: Automatic clothing categorization, color detection, and tagging

## Architecture

**Frontend**: Next.js 14 with TypeScript and Tailwind CSS  
**Backend**: Ruby on Rails 7 (API-only)  
**Database**: PostgreSQL 15 with pgvector for AI embeddings  
**Image Storage**: Active Storage with direct uploads  
**Authentication**: JWT with Devise  
**Caching**: Redis  
**AI Services**: Google Cloud Vision API  
**Weather Data**: WeatherAPI.com  

## Quick Start

### Prerequisites
- Ruby 3.4.5 (use rbenv, rvm, or asdf)
- Docker Desktop
- Git

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

4. **Start Rails server**
   ```bash
   bundle exec rails server
   ```

5. **Access the application**
   - Rails API: http://localhost:3000
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
│   ├── Gemfile            # Ruby dependencies
│   └── Dockerfile.dev      # Development Docker image
├── raincoat_frontend/      # Next.js frontend (planned)
├── scripts/                # Utility scripts
│   ├── reset_docker.ps1    # Windows Docker reset
│   └── reset_docker.sh     # Unix Docker reset
├── init.sql               # PostgreSQL initialization
├── .ruby-version          # Ruby version specification
├── docker-compose.dev.yaml      # Full Docker development
├── docker-compose.services.yaml # Services-only Docker
└── README.md              # This file
```

## Data Models

- **Users**: Authentication and profile management
- **Locations**: Multiple location support for weather
- **Closets**: Custom collections of clothing pieces
- **ClothingPieces**: Individual closet items with AI tagging
- **Outfits**: Saved outfit combinations
- **WeatherSnapshots**: Cached weather data
- **ClothingEmbeddings**: AI vector representations for recommendations

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
GOOGLE_CLOUD_CREDENTIALS=<service-account-json>
DATABASE_URL=<production-db-url>
REDIS_URL=<production-redis-url>
```

## API Endpoints (Planned)

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `DELETE /auth/logout` - User logout

### Closet Management
- `GET /api/clothing_pieces` - List user's clothing
- `POST /api/clothing_pieces` - Add new clothing item
- `PUT /api/clothing_pieces/:id` - Update clothing item
- `DELETE /api/clothing_pieces/:id` - Remove clothing item

### Closets & Collections
- `GET /api/closets` - List user's closets
- `POST /api/closets` - Create new closet
- `POST /api/closets/:id/pieces` - Add piece to closet

### Outfits
- `GET /api/outfits` - List saved outfits
- `POST /api/outfits` - Create new outfit
- `GET /api/outfits/recommend` - Get outfit recommendations

### Weather & Locations
- `GET /api/locations` - List user's locations
- `POST /api/locations` - Add new location
- `GET /api/weather/:location_id` - Get weather for location

## Development Roadmap

### Phase 1: Foundation
- Project setup and development environment
- Rails API scaffolding and database setup
- Authentication system implementation
- Core data models and migrations

### Phase 2: Core Features
- User management and profile system
- Closet CRUD operations and image handling
- Basic weather integration and location management
- Clothing categorization and tagging

### Phase 3: Smart Features  
- AI image processing and automatic tagging
- Basic outfit recommendation engine
- Weather-to-outfit matching algorithms
- Closet and collection management

### Phase 4: Advanced Features
- Vector embeddings for similarity matching
- Enhanced recommendation algorithms
- Monetization infrastructure and ad targeting
- Advanced analytics and user insights

### Phase 5: Production Ready
- UI/UX polish and responsive design
- Comprehensive testing and security audit
- Production deployment and monitoring
- Beta launch and user feedback integration

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

**Port conflicts:**
Edit `docker-compose.services.yaml` to change port mappings if 5432 or 6379 are in use.

### Getting Help

- Check service logs: `docker compose -f docker-compose.services.yaml logs db`
- Verify containers are healthy: `docker compose -f docker-compose.services.yaml ps`
- Use the reset scripts for a fresh start

---

Built for weather-conscious fashion lovers