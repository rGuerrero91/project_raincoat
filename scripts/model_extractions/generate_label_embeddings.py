#!/usr/bin/env python3
"""
Generate pre-computed text embeddings for fashion labels and weather terms.
Hybrid approach: embeddings for AI suggestions + rule-based transitional mappings.
"""

import json
import torch
from pathlib import Path
from transformers import CLIPModel, CLIPProcessor

WEATHER_API_CATEGORIES = [
    "clear", "sunny", "partly cloudy", "cloudy", "overcast",
    "rain", "light rain", "heavy rain", "showers",
    "drizzle", "thunderstorm",
    "snow", "light snow", "heavy snow", "sleet", "blizzard",
    "mist", "fog", "haze",
    "windy", "breezy", "gusty",
    "tornado", "hurricane",
    "smoke", "dust", "sandstorm",
    "extreme heat", "extreme cold"
]

TRANSITIONAL_LABELS = {
    "clear": ["sunny", "bright"],
    "sunny": ["sunny", "hot"],
    "partly cloudy": ["mild", "breezy"],
    "cloudy": ["cool", "overcast"],
    "overcast": ["cool", "gloomy"],
    
    "rain": ["rainy", "wet", "cool"],
    "light rain": ["drizzly", "wet", "cool"],
    "heavy rain": ["stormy", "wet", "cold"],
    "showers": ["rainy", "damp"],
    "drizzle": ["light rain", "humid"],

    "thunderstorm": ["stormy", "wet", "humid"],
    
    "snow": ["snowy", "chilly", "cozy"],
    "light snow": ["snowy", "chilly"],
    "heavy snow": ["blizzard", "freezing", "layered"],
    "sleet": ["icy", "wet", "cold"],
    "blizzard": ["extreme cold", "snowy", "windy"],

    "mist": ["damp", "humid"],
    "fog": ["foggy", "damp", "cold"],
    "haze": ["hazy", "warm"],
    
    "windy": ["windy", "chilly"],
    "breezy": ["breezy", "mild"],
    "gusty": ["windy", "cold"],
    
    "tornado": ["extreme", "windproof"],
    "hurricane": ["extreme", "waterproof"],

    "smoke": ["hazy", "dry"],
    "dust": ["dusty", "dry"],
    "sandstorm": ["dusty", "protective"],

    "extreme heat": ["scorching", "hot", "lightwear"],
    "extreme cold": ["freezing", "layered", "insulated"]
}

FASHION_LABELS = [
    # Colors
    "red", "blue", "green", "yellow", "black", "white", "gray", "brown",
    "pink", "purple", "orange", "navy", "beige", "tan",
    
    # Clothing Types - Tops
    "t-shirt", "shirt", "blouse", "sweater", "hoodie", "jacket", "coat",
    "blazer", "cardigan", "tank top", "polo shirt", "dress shirt",
    
    # Clothing Types - Bottoms
    "jeans", "pants", "shorts", "skirt", "leggings", "trousers",
    "cargo pants", "sweatpants", "dress pants",
    
    # Clothing Types - Dresses/Full
    "dress", "jumpsuit", "romper", "gown", "sundress",
    
    # Outerwear
    "winter coat", "rain jacket", "parka", "windbreaker", "trench coat",
    "bomber jacket", "leather jacket", "denim jacket", "puffer jacket",
    
    # Footwear
    "sneakers", "boots", "sandals", "heels", "flats", "loafers",
    "running shoes", "dress shoes", "ankle boots", "hiking boots",
    
    # Accessories
    "hat", "cap", "beanie", "scarf", "gloves", "belt", "tie",
    "sunglasses", "watch", "bag", "backpack", "purse", "umbrella",
    
    # Materials
    "cotton", "denim", "leather", "wool", "silk", "polyester",
    "linen", "fleece", "cashmere", "down", "nylon",
    
    # Patterns
    "striped", "plaid", "floral", "solid", "checkered", "dotted",
    
    # Styles
    "casual", "formal", "athletic", "business", "vintage",
    "streetwear", "bohemian", "preppy", "outdoor", "protective",
    
    # Seasons
    "summer", "winter", "fall", "spring", "all-season",
    
    # Weather-Aligned
    "sunny", "bright", "hot", "lightwear",
    "rainy", "wet", "stormy", "waterproof",
    "snowy", "chilly", "cozy", "layered", "insulated",
    "windy", "breezy", "cold", "windproof",
    "foggy", "humid", "damp", "hazy",
    "scorching", "freezing", "extreme cold", "extreme heat",
    "dusty", "dry", "protective", "mild", "cool", "gloomy",
    "drizzly", "icy", "extreme", "overcast", "warm"
]

def generate_embeddings(output_dir="./"):
    """Generate embeddings for fashion labels and weather categories."""
    
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    print("Loading FashionCLIP text encoder...")
    model = CLIPModel.from_pretrained("patrickjohncyh/fashion-clip")
    processor = CLIPProcessor.from_pretrained("patrickjohncyh/fashion-clip")
    
    # Combine all terms that need embeddings
    all_terms = list(set(FASHION_LABELS + WEATHER_API_CATEGORIES))
    
    embeddings_dict = {}
    
    print(f"\nGenerating embeddings for {len(all_terms)} terms...")
    
    with torch.no_grad():
        for i, term in enumerate(all_terms):
            inputs = processor(text=[term], return_tensors="pt", padding=True)
            text_features = model.get_text_features(**inputs)
            text_features = text_features / text_features.norm(dim=-1, keepdim=True)
            embedding = text_features[0].tolist()
            embeddings_dict[term] = embedding
            
            if (i + 1) % 20 == 0:
                print(f"  Processed {i + 1}/{len(all_terms)} terms")
    
    # Save embeddings
    embeddings_file = output_path / "label_embeddings.json"
    with open(embeddings_file, 'w') as f:
        json.dump(embeddings_dict, f, indent=2)
    
    embeddings_size_kb = embeddings_file.stat().st_size / 1024
    
    # Save transitional rules
    rules_file = output_path / "weather_rules.json"
    with open(rules_file, 'w') as f:
        json.dump(TRANSITIONAL_LABELS, f, indent=2)
    
    rules_size_kb = rules_file.stat().st_size / 1024
    
    print(f"\nSuccess!")
    print(f"Embeddings: {embeddings_file} ({embeddings_size_kb:.2f} KB)")
    print(f"Weather rules: {rules_file} ({rules_size_kb:.2f} KB)")
    print(f"Total terms: {len(embeddings_dict)}")
    print(f"Embedding dimension: {len(list(embeddings_dict.values())[0])}")
    
    return embeddings_dict

def create_usage_guide():
    """Create hybrid approach usage guide."""
    guide = """
HYBRID WEATHER-FASHION MATCHING
================================

FILES GENERATED:
- label_embeddings.json (~50-80 KB) - All term embeddings
- weather_rules.json (~2 KB) - Rule-based transitional mappings

DEPLOYMENT:
Upload both JSON files to CDN alongside ONNX models

BROWSER USAGE:

// Load both files
const embeddings = await fetch('/models/label_embeddings.json').then(r => r.json());
const weatherRules = await fetch('/models/weather_rules.json').then(r => r.json());

// Hybrid matching function
async function getWeatherAppropriateItems(weatherCondition, userWardrobe) {
  // Step 1: AI suggestions via cosine similarity
  const weatherEmbed = embeddings[weatherCondition];
  const aiSuggestions = [];
  
  for (const item of userWardrobe) {
    const similarity = cosineSimilarity(weatherEmbed, item.embedding);
    aiSuggestions.push({ item, similarity });
  }
  
  // Step 2: Apply rule-based boosts if available
  if (weatherRules[weatherCondition]) {
    const requiredTags = weatherRules[weatherCondition];
    
    aiSuggestions.forEach(suggestion => {
      // Boost items that match transitional rules
      const hasRequiredTag = suggestion.item.tags.some(tag => 
        requiredTags.includes(tag)
      );
      if (hasRequiredTag) {
        suggestion.similarity *= 1.3; // Boost by 30%
      }
    });
  }
  
  // Step 3: Sort and return top matches
  return aiSuggestions
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 10);
}

UPDATING:
Edit Python script arrays, re-run, re-deploy JSON files
"""
    
    with open("HYBRID_USAGE_GUIDE.txt", 'w') as f:
        f.write(guide)
    print("\nCreated: HYBRID_USAGE_GUIDE.txt")

if __name__ == "__main__":
    print("=" * 60)
    print("Fashion + Weather Embeddings Generator (Hybrid Approach)")
    print("=" * 60)
    
    try:
        embeddings = generate_embeddings()
        create_usage_guide()
        
        print("\nNext steps:")
        print("1. Upload label_embeddings.json to CDN")
        print("2. Upload weather_rules.json to CDN")
        print("3. Implement hybrid matching in browser")
        
    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()