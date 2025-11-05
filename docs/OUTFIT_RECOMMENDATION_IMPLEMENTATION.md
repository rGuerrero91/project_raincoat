# Outfit Recommendation System - Implementation Guide

## Overview

We've implemented a complete outfit recommendation system for Raincoat that combines weather data, user clothing inventory, and AI-powered styling logic to generate personalized outfit suggestions.

## Architecture

Based on the **Hybrid Approach (Option C)** from the recommendation logic documentation, combining:
1. **Rule-based filtering** - Weather suitability and basic matching
2. **LLM reasoning** - OpenAI GPT-4o-mini for intelligent outfit composition
3. **Fallback logic** - Mock outfit generation when API is unavailable

## Components Created

### 1. Database Models

#### `Outfit` Model
- **Purpose**: Stores generated outfit recommendations
- **Fields**:
  - `user_id` - Owner of the outfit
  - `weather_temperature` - Temperature (°C) when outfit was created
  - `weather_condition` - Weather condition (e.g., "Sunny", "Rainy")
  - `season` - Season context
  - `description` - Human-readable outfit description
  - `style_tags` - Array of style descriptors (JSON)
  - `metadata` - Additional data (JSON)

#### `OutfitItem` Model
- **Purpose**: Join table connecting outfits to clothing pieces
- **Fields**:
  - `outfit_id` - The outfit this item belongs to
  - `clothing_piece_id` - The clothing item
  - `slot` - Category slot ("top", "bottom", "shoes", "outerwear", "accessories")
  - `position` - Order within the outfit

### 2. Service Layer

#### `StylistModel` Service (`app/services/stylist_model.rb`)

**Responsibilities**:
- Format weather data and clothing items for LLM consumption
- Call OpenAI API with structured prompts
- Parse and validate LLM responses
- Provide fallback mock outfits when API unavailable

**Key Features**:
- Combines AI tags and user tags for comprehensive item description
- Determines season based on temperature
- Returns outfits in standardized JSON format
- Error handling with graceful degradation

**Usage**:
```ruby
stylist = StylistModel.new(
  weather: { temperature_c: 18, condition_text: "Cloudy" },
  items: {
    tops: [shirt1, shirt2],
    bottoms: [pants1, pants2],
    shoes: [shoes1],
    outerwear: [jacket1]
  }
)

outfits = stylist.generate_outfits
# Returns: Array of outfit hashes with description, items, and style_tags
```

### 3. API Endpoints

#### `POST /api/v1/outfits/generate`
Generate new outfit recommendations based on current weather.

**Parameters**:
- `user_id` (optional) - User ID, defaults to first user
- `weather` (optional) - Manual weather override
  - `temperature_c`
  - `condition_text`
  - `humidity`
  - `precipitation_mm`

**Response**:
```json
{
  "weather": {
    "temperature_c": 18,
    "condition_text": "Cloudy",
    "humidity": 65
  },
  "recommendations": [
    {
      "description": "Casual and comfortable outfit for mild rain",
      "items": {
        "top": "Denim Shirt",
        "bottom": "Beige Chinos",
        "shoes": "White Sneakers",
        "outerwear": "Navy Raincoat"
      },
      "style_tags": ["casual", "spring", "light rain", "neutral palette"]
    }
  ],
  "available_items": {
    "tops": 5,
    "bottoms": 4,
    "shoes": 4,
    "outerwear": 4
  }
}
```

#### `POST /api/v1/outfits`
Save a generated outfit recommendation.

**Parameters**:
```json
{
  "outfit": {
    "weather_temperature": 18,
    "weather_condition": "Cloudy",
    "season": "Spring",
    "description": "Casual outfit for mild weather",
    "style_tags": ["casual", "comfortable"]
  },
  "items": {
    "top": {"id": 1},
    "bottom": {"id": 2},
    "shoes": {"id": 3},
    "outerwear": {"id": 4}
  }
}
```

#### `GET /api/v1/outfits`
List all saved outfits for the user.

**Query Parameters**:
- `weather_condition` (optional) - Filter by weather condition

#### `GET /api/v1/outfits/:id`
Get a specific outfit with all items.

#### `DELETE /api/v1/outfits/:id`
Delete a saved outfit.

## Seed Data

The seed file (`db/seeds.rb`) now includes:
- 3 demo users (test@example.com, demo@example.com, rudy@email.com)
- Comprehensive clothing inventory:
  - 4-5 tops per user (t-shirts, button-ups, sweaters, hoodies)
  - 3 bottoms (jeans, chinos, dress pants)
  - 2-4 shoes (sneakers, boots, dress shoes)
  - 2-4 outerwear pieces (coats, jackets)
  - 2 accessories
- Weather snapshots for testing
- Sample embeddings for similarity search

Each item includes:
- `colors` - Array of color names
- `materials` - Array of fabric types
- `weather_suitability` - Min/max temperature and suitable conditions
- `ai_tags` - AI-detected attributes
- `user_tags` - User-provided tags

## Recommendation Logic

### Weather-Based Filtering
1. Fetch current weather from user's default location
2. Filter clothing items by weather suitability
3. Group items by category (tops, bottoms, shoes, outerwear)

### LLM Styling
The StylistModel sends structured data to GPT-4o-mini:

**System Prompt**:
```
You are Raincoat's stylist AI assistant.
Your job is to assemble stylish, weather-appropriate outfits.

Rules:
- Return 1-3 complete outfits
- Each outfit must include: top, bottom, shoes (+ outerwear if needed)
- Match colors and formality levels
- Consider materials and weather suitability
- Avoid repeating items across outfits
```

**Input Format**:
```json
{
  "weather": {
    "temperature": 18,
    "conditions": "cloudy with light rain",
    "season": "spring"
  },
  "items": {
    "tops": [
      {"name": "Denim Shirt", "colors": ["blue"], "tags": ["casual", "cotton"]}
    ],
    ...
  }
}
```

### Fallback Logic
When OpenAI API is unavailable:
1. **Cold weather** (< 15°C) - Prioritize warm items + outerwear
2. **Rainy** - Select waterproof outerwear if available
3. **Default** - Create casual outfit with available items
4. Generate 2nd outfit if enough variety exists

## Frontend Integration

### Recommended Flow
1. User opens app
2. Frontend fetches weather from device location
3. Call `POST /api/v1/outfits/generate` with optional weather override
4. Display outfit recommendations with images
5. User can save favorite outfits (call `POST /api/v1/outfits`)
6. View saved outfits (call `GET /api/v1/outfits`)

### Example Frontend Code
```typescript
// Generate outfit recommendations
const response = await fetch('/api/v1/outfits/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: currentUserId,
    weather: {
      temperature_c: 18,
      condition_text: "Cloudy",
      humidity: 65
    }
  })
});

const data = await response.json();
// data.recommendations contains outfit array
```

## Configuration

### Environment Variables
```bash
# Required for LLM-powered recommendations
OPENAI_API_KEY=sk-...

# Falls back to mock recommendations if not set
```

### Model Configuration
Current model: `gpt-4o-mini`
- Fast response times
- Cost-effective
- Good style reasoning
- JSON output support

**Alternative Options**:
- `gpt-4o` - Better reasoning, higher cost
- Local LLM (future) - Phi-3-mini, LLaMA 3.2 1B for privacy

## Testing

### Manual Testing via Rails Console
```ruby
# Create test data
user = User.first
weather = { temperature_c: 18, condition_text: "Cloudy" }
items = {
  tops: user.clothing_pieces.where(category: 'tops'),
  bottoms: user.clothing_pieces.where(category: 'bottoms'),
  shoes: user.clothing_pieces.where(category: 'shoes'),
  outerwear: user.clothing_pieces.where(category: 'outerwear')
}

# Generate outfits
stylist = StylistModel.new(weather: weather, items: items)
outfits = stylist.generate_outfits

# Save an outfit
outfit = user.outfits.create!(
  weather_temperature: 18,
  weather_condition: "Cloudy",
  description: outfits.first["description"],
  style_tags: outfits.first["style_tags"]
)

# Add items to outfit
outfits.first["items"].each do |slot, item_name|
  piece = user.clothing_pieces.find_by(name: item_name)
  outfit.outfit_items.create!(clothing_piece: piece, slot: slot) if piece
end
```

### API Testing with cURL
```bash
# Generate outfits
curl -X POST http://localhost:3000/api/v1/outfits/generate \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1}'

# List saved outfits
curl http://localhost:3000/api/v1/outfits?user_id=1

# Save an outfit
curl -X POST http://localhost:3000/api/v1/outfits \
  -H "Content-Type: application/json" \
  -d '{
    "outfit": {
      "weather_temperature": 18,
      "weather_condition": "Cloudy",
      "description": "Casual spring outfit",
      "style_tags": ["casual", "comfortable"]
    },
    "items": {
      "top": {"id": 1},
      "bottom": {"id": 2},
      "shoes": {"id": 3}
    }
  }'
```

## Future Enhancements

### Phase 2 - FashionCLIP Integration
- Calculate visual cohesion scores using embeddings
- Rank LLM suggestions by aesthetic compatibility
- Filter out visually clashing combinations

### Phase 3 - Learning System
- Track user outfit saves/likes
- Learn style preferences over time
- Personalize recommendations based on history

### Phase 4 - Local LLM
- Deploy on-device model (Phi-3-mini quantized)
- Maintain privacy-first approach
- Reduce API costs

### Phase 5 - Advanced Features
- Multi-day outfit planning
- Event-specific styling (work, date, gym)
- Packing list generator for travel
- Outfit rotation tracking

## Files Modified/Created

### New Files
- `db/migrate/XXXXXX_create_outfits.rb`
- `db/migrate/XXXXXX_create_outfit_items.rb`
- `app/models/outfit.rb`
- `app/models/outfit_item.rb`
- `app/services/stylist_model.rb`
- `app/controllers/api/v1/outfits_controller.rb`
- `docs/OUTFIT_RECOMMENDATION_IMPLEMENTATION.md`

### Modified Files
- `app/models/user.rb` - Added `has_many :outfits`
- `app/models/clothing_piece.rb` - Added outfit associations
- `config/routes.rb` - Added outfit endpoints
- `db/seeds.rb` - Updated to include outfits cleanup

## Deployment Notes

### Database Migration
```bash
rails db:migrate
```

### Seed Database
```bash
rails db:seed
```

### Environment Setup
Ensure `OPENAI_API_KEY` is set in production environment on Render.

---

## Summary

You now have a complete, production-ready outfit recommendation system that:
- ✅ Generates weather-appropriate outfits
- ✅ Uses AI for intelligent style composition
- ✅ Has fallback logic for offline/API-free operation
- ✅ Supports saving and managing outfit history
- ✅ Includes comprehensive seed data for testing
- ✅ Provides RESTful API endpoints for frontend integration

The system is extensible and ready for future enhancements like visual similarity scoring and on-device LLM integration!
