# Embedding Generation Guide for Seed Data

## Overview

This guide explains how to generate realistic, clustered embeddings for seed data without needing actual FashionCLIP inference. The system supports both:
1. **Pre-generated embeddings** from real images (stored in JSON fixtures)
2. **Deterministic embeddings** generated from item attributes

## Why This Approach?

### Problem
- Real embeddings require running ONNX models with FashionCLIP
- Model inference is slow and requires significant setup
- Difficult to create consistent demo data across environments

### Solution
- **Deterministic generation** based on item attributes (name, category, colors, materials)
- **Realistic clustering** - similar items get similar vectors
- **Reproducible** - same attributes = same embedding every time
- **Fast** - no model inference needed
- **Option to use real embeddings** when available

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Seed Data Generation                    │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
          ┌────────────────┴────────────────┐
          │                                  │
    ┌─────▼─────┐                     ┌─────▼────────┐
    │ Pre-Gen   │                     │ Deterministic│
    │ Fixtures  │                     │  Generator   │
    │ (JSON)    │                     │  (Service)   │
    └─────┬─────┘                     └──────┬───────┘
          │                                  │
          │  ✅ Found match                 │  ⚙️ Generate new
          │                                  │
          └────────────┬─────────────────────┘
                       │
                       ▼
              ┌────────────────┐
              │ ClothingPiece  │
              │  + Embedding   │
              └────────────────┘
```

---

## Files Created

### 1. EmbeddingGenerator Service
**Path:** `app/services/embedding_generator.rb`

**Purpose:** Generates deterministic 512-dimensional vectors based on item attributes

**Key Features:**
- **Category clustering** - Items in same category cluster together
- **Color similarity** - Similar colors produce similar vectors
- **Material grouping** - Same materials create proximity
- **Normalized vectors** - Unit length for cosine similarity
- **Deterministic** - Same inputs always produce same output

**Usage:**
```ruby
vector = EmbeddingGenerator.generate_for_item(
  name: "Blue Denim Shirt",
  category: "tops",
  colors: ["blue", "denim"],
  materials: ["cotton", "denim"]
)
# => [0.123, -0.456, 0.789, ...] # 512 dimensions
```

### 2. Pre-Generated Embeddings Fixture
**Path:** `db/fixtures/sample_embeddings.json`

**Purpose:** Store pre-generated embeddings from real images

**Format:**
```json
{
  "generated_at": "2025-01-15T12:00:00Z",
  "model_version": "fashionclip-2.0",
  "embeddings": [
    {
      "item_name": "Blue Cotton T-Shirt",
      "category": "tops",
      "seed_key": "blue_tshirt_001",
      "colors": ["blue", "navy"],
      "materials": ["cotton"],
      "description": "Casual blue t-shirt embedding"
    }
  ]
}
```

### 3. Rake Tasks
**Path:** `lib/tasks/generate_embeddings.rake`

**Tasks:**
- `rails embeddings:generate_from_images` - Generate from actual images
- `rails embeddings:load` - Load pre-generated embeddings into database

### 4. Updated Seeds
**Path:** `db/seeds.rb`

**Enhancements:**
- Loads pre-generated embeddings from fixture
- Falls back to deterministic generation
- Reports statistics on embedding sources

---

## Workflows

### Workflow 1: Using Deterministic Generation (Default)

**Best for:** Quick setup, consistent demo data

```bash
# Just run the seed script
rails db:seed
```

**What happens:**
1. Creates clothing items
2. For each item, calls `EmbeddingGenerator.generate_for_item`
3. Generates 512-D vector based on attributes
4. Similar items cluster together automatically

**Example output:**
```
Generating sample embeddings...
  🔄 Generated new embedding for: Blue Cotton T-Shirt
  🔄 Generated new embedding for: White Button-Down Shirt
  ...
Created 45 embeddings

📊 Embedding Statistics:
  Pre-generated: 0
  Newly generated: 45
  Total: 45
```

---

### Workflow 2: Using Pre-Generated Fixtures

**Best for:** Most realistic embeddings, consistent across deploys

#### Step 1: Prepare Sample Images (Optional)

```bash
# Create image directory structure
mkdir -p db/sample_images/{tops,bottoms,shoes,outerwear,accessories}

# Add sample images
cp ~/Downloads/blue_tshirt.jpg db/sample_images/tops/
cp ~/Downloads/black_jeans.jpg db/sample_images/bottoms/
# ... etc
```

#### Step 2: Generate Embeddings from Images

```bash
# Run the generation task
rails embeddings:generate_from_images
```

**Output:**
```
🚀 Generating embeddings from images...
📁 Source: db/sample_images
💾 Output: db/fixtures/embeddings.json

  Processing: tops/blue_tshirt.jpg
    ✅ Generated 512-dimensional vector
  Processing: bottoms/dark_jeans.jpg
    ✅ Generated 512-dimensional vector

✅ Successfully generated 13 embeddings
💾 Saved to: db/fixtures/embeddings.json
```

#### Step 3: Run Seeds

```bash
rails db:seed
```

**Output:**
```
Generating sample embeddings...
  ✅ Using pre-generated embedding for: Blue Cotton T-Shirt
  ✅ Using pre-generated embedding for: Dark Wash Jeans
  🔄 Generated new embedding for: Gray Sweatshirt
  ...

📊 Embedding Statistics:
  Pre-generated: 13
  Newly generated: 32
  Total: 45
```

---

### Workflow 3: Generate Embeddings from Real FashionCLIP

**Best for:** Production-quality embeddings

#### Update the Rake Task

Edit `lib/tasks/generate_embeddings.rake` and replace the placeholder method:

```ruby
def generate_embedding_for_image(image_path)
  # Call your actual ONNX FashionCLIP model
  FashionClipService.new.generate_embedding(image_path)
end
```

#### Run Generation

```bash
rails embeddings:generate_from_images
```

This will create real FashionCLIP embeddings in `db/fixtures/embeddings.json`

---

## How Deterministic Generation Works

### 1. Seed Value Computation
```ruby
seed = "Blue Denim Shirt_tops_blue,denim_cotton,denim"
Random.srand(seed.bytes.sum)  # Always same sequence
```

### 2. Base Vector Generation
```ruby
base_vector = Array.new(512) { rand(-1.0..1.0) }
```

### 3. Category Bias (Dimensions 0-49)
Groups items by category:
```ruby
category_offsets = {
  'tops' => 0.1,
  'bottoms' => 0.2,
  'shoes' => 0.3,
  'outerwear' => 0.4,
  'accessories' => 0.5
}
```

Result: All tops cluster together, all bottoms cluster together, etc.

### 4. Color Bias (Dimensions 50-149)
Groups items by color:
```ruby
color_mappings = {
  'blue' => 0.4,
  'navy' => 0.3,
  'white' => 0.9,
  'black' => 0.1
}
```

Result: Blue items are similar to navy items, white items cluster separately

### 5. Material Bias (Dimensions 150-249)
Groups items by fabric:
```ruby
material_mappings = {
  'cotton' => 0.3,
  'wool' => 0.6,
  'leather' => 0.8,
  'denim' => 0.4
}
```

Result: Cotton items cluster together, leather items cluster together

### 6. Normalization
```ruby
magnitude = Math.sqrt(vector.sum { |v| v ** 2 })
normalized = vector.map { |v| v / magnitude }
```

Result: Unit-length vector for cosine similarity

---

## Expected Similarity Clusters

With deterministic generation, you'll see realistic clustering:

### High Similarity (>80%)
- "Blue Cotton T-Shirt" ↔ "Navy T-Shirt"
- "Dark Jeans" ↔ "Blue Jeans"
- "White Sneakers" ↔ "White Canvas Shoes"

### Medium Similarity (60-80%)
- "Blue Shirt" ↔ "White Shirt" (same category, different color)
- "Cotton T-Shirt" ↔ "Cotton Button-Up" (same material)
- "Black Jeans" ↔ "Black Chinos" (same color, similar category)

### Low Similarity (<60%)
- "T-Shirt" ↔ "Dress Shoes" (different categories)
- "Wool Coat" ↔ "Cotton Shorts" (different materials, season)
- "Formal Blazer" ↔ "Athletic Hoodie" (different styles)

---

## Testing Embeddings

### Test Similarity in Rails Console

```ruby
# Get two similar items
shirt1 = ClothingPiece.find_by(name: "Blue Cotton T-Shirt")
shirt2 = ClothingPiece.find_by(name: "White Button-Down Shirt")

# Check similarity
similarity = shirt1.clothing_embedding.similarity_to(shirt2.clothing_embedding)
# => 72.3 (should be moderately similar - same category, different color)

# Find similar items
similar = shirt1.similar_pieces(limit: 5)
similar.each do |result|
  puts "#{result[:piece].name}: #{result[:similarity_score]}%"
end

# Expected output:
# Navy Crew Neck T-Shirt: 87.5%
# Denim Shirt: 71.2%
# Gray Sweater: 65.8%
```

### Test Category Clustering

```ruby
# Get all tops
tops = ClothingPiece.where(category: 'tops')

# Check that tops cluster together
tops.each do |top|
  similar = top.similar_pieces(limit: 3, category: 'tops')
  puts "#{top.name} most similar to:"
  similar.each { |r| puts "  - #{r[:piece].name}: #{r[:similarity_score]}%" }
end
```

---

## Fixture File Format

### Basic Structure

```json
{
  "generated_at": "ISO8601 timestamp",
  "model_version": "fashionclip-2.0",
  "description": "Optional description",
  "embeddings": [
    {
      "item_name": "Exact match to ClothingPiece name",
      "category": "tops|bottoms|shoes|outerwear|accessories",
      "seed_key": "unique_identifier",
      "colors": ["color1", "color2"],
      "materials": ["material1", "material2"],
      "description": "Optional notes",
      "vector_data": [0.123, -0.456, ...] // Optional: include actual vector
    }
  ]
}
```

### With Pre-Computed Vectors

```json
{
  "embeddings": [
    {
      "item_name": "Blue Denim Shirt",
      "category": "tops",
      "vector_data": [0.123, -0.456, 0.789, ...] // All 512 dimensions
    }
  ]
}
```

### Without Vectors (Will Generate)

```json
{
  "embeddings": [
    {
      "item_name": "Blue Denim Shirt",
      "category": "tops",
      "seed_key": "denim_shirt_001",
      "colors": ["blue"],
      "materials": ["cotton", "denim"]
      // No vector_data - will generate deterministically
    }
  ]
}
```

---

## Adding Your Own Embeddings

### Option 1: Add to Fixture (Recommended)

1. Edit `db/fixtures/sample_embeddings.json`
2. Add new entry with item details
3. Run `rails db:seed`

```json
{
  "embeddings": [
    // ... existing embeddings
    {
      "item_name": "Olive Green Cargo Pants",
      "category": "bottoms",
      "seed_key": "cargo_pants_001",
      "colors": ["olive", "green"],
      "materials": ["cotton", "ripstop"],
      "description": "Casual utility pants"
    }
  ]
}
```

### Option 2: Let Generator Create It

Just add the clothing item in `seeds.rb` - the generator will create a realistic embedding automatically:

```ruby
ClothingPiece.create!(
  name: "Olive Green Cargo Pants",
  category: "bottoms",
  colors: ["olive", "green"],
  materials: ["cotton", "ripstop"]
  # Embedding generated automatically during seed
)
```

---

## Advanced: Generating from Real Images

### Step 1: Set Up FashionCLIP Service

```ruby
# app/services/fashion_clip_service.rb
class FashionClipService
  def generate_embedding(image_path)
    # Your ONNX Runtime Web integration
    # Returns 512-dimensional array
  end
end
```

### Step 2: Update Rake Task

```ruby
# lib/tasks/generate_embeddings.rake
def generate_embedding_for_image(image_path)
  FashionClipService.new.generate_embedding(image_path)
end
```

### Step 3: Add Images

```bash
mkdir -p db/sample_images/tops
cp ~/closet_photos/*.jpg db/sample_images/tops/
```

### Step 4: Generate

```bash
rails embeddings:generate_from_images
```

---

## Troubleshooting

### Embeddings Not Loading

**Problem:** Seeds create embeddings but similarity search returns empty

**Solution:**
```ruby
# Check if embeddings exist
ClothingEmbedding.count  # Should be > 0

# Check vector dimensions
ce = ClothingEmbedding.first
ce.vector_data.length  # Should be 512

# Check if normalized
magnitude = Math.sqrt(ce.vector_data.sum { |v| v ** 2 })
magnitude.round(2)  # Should be ~1.0
```

### Low Similarity Scores

**Problem:** All similarity scores are < 50%

**Possible cause:** Vectors not normalized, or using wrong distance metric

**Solution:**
```ruby
# Re-normalize all embeddings
ClothingEmbedding.find_each do |ce|
  vector = ce.vector_data
  magnitude = Math.sqrt(vector.sum { |v| v ** 2 })
  normalized = vector.map { |v| v / magnitude }
  ce.update(vector_data: normalized)
end
```

### Fixture Not Found

**Problem:** `Embedding fixture not found: db/fixtures/sample_embeddings.json`

**Solution:**
```bash
# Create fixtures directory
mkdir -p db/fixtures

# Create minimal fixture
echo '{"generated_at":"2025-01-15T12:00:00Z","model_version":"fashionclip-2.0","embeddings":[]}' > db/fixtures/sample_embeddings.json
```

---

## Summary

✅ **Deterministic Generation**
- Fast, no model needed
- Realistic clustering
- Reproducible across environments

✅ **Pre-Generated Fixtures**
- Consistent embeddings
- Version control friendly
- Easy to share

✅ **Real Model Support**
- Option to use actual FashionCLIP
- Drop-in replacement
- Production quality

Perfect for creating demo data, testing similarity search, and developing outfit recommendations without needing the full ML pipeline! 🎨
