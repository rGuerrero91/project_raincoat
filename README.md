# Raincoat

A modern, AI-powered weather-based outfit recommendation app. Upload your wardrobe, get smart outfit suggestions based on weather conditions, and organize your clothing with intelligent collections.

## Features

- **Smart Wardrobe Management**: Upload and organize clothing pieces with AI-powered automatic tagging
- **Weather-Based Recommendations**: Get outfit suggestions tailored to current weather conditions
- **Closet Collections**: Create custom collections to organize your wardrobe (Work, Casual, Travel, etc.)
- **Outfit Creation**: Build and save favorite outfits with intelligent category constraints
- **Multi-Location Support**: Manage wardrobes for different locations (Home, Office, Travel)
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
- Docker Desktop
- Git

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd project_raincoat
   ```

2. **Start the development environment**
   ```bash
   docker compose -f docker-compose.dev.yaml up
   ```

3. **Set up the database** (first time only)
   ```bash
   docker compose -f docker-compose.dev.yaml exec rails bundle exec rails db:create
   docker compose -f docker-compose.dev.yaml exec rails db:migrate
   docker compose -f docker-compose.dev.yaml exec rails db:seed
   ```

4. **Access the application**
   - Rails API: http://localhost:3000
   - PostgreSQL: localhost:5432
   - Redis: localhost:6379

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

## Project Structure

```
project_raincoat/
├── raincoat_api/           # Rails API backend
│   ├── app/
│   │   ├── models/         # Data models
│   │   ├── controllers/    # API controllers
│   │   └── services/       # Business logic
│   ├── config/             # Rails configuration
│   ├── db/                 # Database migrations & seeds
│   └── Dockerfile.dev      # Development Docker image
├── raincoat_frontend/      # Next.js frontend (planned)
├── scripts/                # Utility scripts
│   ├── reset_docker.ps1    # Windows Docker reset
│   └── reset_docker.sh     # Unix Docker reset
├── init.sql               # PostgreSQL initialization
├── docker-compose.dev.yaml # Development environment
└── README.md              # This file
```

## Data Models

- **Users**: Authentication and profile management
- **Locations**: Multiple location support for weather
- **Closets**: Custom collections of clothing pieces
- **ClothingPieces**: Individual wardrobe items with AI tagging
- **Outfits**: Saved outfit combinations
- **WeatherSnapshots**: Cached weather data
- **ClothingEmbeddings**: AI vector representations for recommendations

## Development Commands

### Rails Commands
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
# Start services
docker compose -f docker-compose.dev.yaml up

# Start in background
docker compose -f docker-compose.dev.yaml up -d

# Stop services
docker compose -f docker-compose.dev.yaml down

# View logs
docker compose -f docker-compose.dev.yaml logs rails

# Rebuild after Gemfile changes
docker compose -f docker-compose.dev.yaml up --build
```

## Testing

```bash
# Run full test suite
docker compose -f docker-compose.dev.yaml exec rails bundle exec rspec

# Run specific test file
docker compose -f docker-compose.dev.yaml exec rails bundle exec rspec spec/models/user_spec.rb

# Run with coverage
docker compose -f docker-compose.dev.yaml exec rails bundle exec rspec --format documentation
```

## Environment Variables

### Required for Development
```env
DATABASE_URL=postgresql://postgres:password@db:5432/raincoat_development
REDIS_URL=redis://redis:6379/0
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

### Wardrobe Management
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
- Project setup and Docker environment
- Rails API scaffolding and database setup
- Authentication system implementation
- Core data models and migrations

### Phase 2: Core Features
- User management and profile system
- Wardrobe CRUD operations and image handling
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

**Database connection errors:**
```bash
# Check if database is running
docker compose -f docker-compose.dev.yaml ps

# Reset database
./scripts/reset_docker.sh  # or .ps1 for Windows
```

**Gem installation issues:**
```bash
# Clear bundle cache and rebuild
docker compose -f docker-compose.dev.yaml down
docker volume rm project_raincoat_bundle_cache
docker compose -f docker-compose.dev.yaml up --build
```

**Port conflicts:**
Edit `docker-compose.dev.yaml` to change port mappings if 3000, 5432, or 6379 are in use.

### Getting Help

- Check the Docker logs: `docker compose -f docker-compose.dev.yaml logs [service-name]`
- Verify all containers are healthy: `docker compose -f docker-compose.dev.yaml ps`
- Use the reset scripts for a fresh start

---

Built for weather-conscious fashion lovers
Docker Commands for a fresh Container:
# When you need a completely fresh environment:
./scripts/reset_docker.sh  # or .\scripts\reset_docker.ps1
# Regular development restart:
docker compose -f docker-compose.dev.yaml down
docker compose -f docker-compose.dev.yaml up