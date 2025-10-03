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
    # === COLORS ===
    # Basic colors
    "red", "dark red", "bright red", "burgundy", "maroon",
    "blue", "light blue", "dark blue", "navy blue", "royal blue", "sky blue", "turquoise",
    "green", "dark green", "olive green", "forest green", "mint green", "lime green",
    "yellow", "bright yellow", "mustard yellow", "golden yellow",
    "black", "charcoal black", "jet black",
    "white", "off-white", "cream", "ivory",
    "gray", "light gray", "dark gray", "charcoal gray", "heather gray",
    "brown", "dark brown", "tan", "camel", "chocolate brown",
    "pink", "light pink", "hot pink", "blush pink", "rose",
    "purple", "dark purple", "lavender", "violet", "plum",
    "orange", "burnt orange", "coral",
    "beige", "khaki", "taupe",
    
    # === TOPS ===
    # T-shirts
    "t-shirt", "plain t-shirt", "graphic t-shirt", "v-neck t-shirt", "crew neck t-shirt",
    "black t-shirt", "white t-shirt", "oversized t-shirt", "fitted t-shirt",
    "long sleeve t-shirt", "short sleeve t-shirt",
    
    # Shirts
    "shirt", "button-up shirt", "dress shirt", "casual shirt", "flannel shirt",
    "white dress shirt", "blue dress shirt", "plaid shirt", "chambray shirt",
    "oxford shirt", "linen shirt", "denim shirt",
    
    # Blouses
    "blouse", "silk blouse", "flowy blouse", "fitted blouse", "peasant blouse",
    "white blouse", "ruffled blouse",
    
    # Sweaters & Knits
    "sweater", "pullover sweater", "knit sweater", "cable knit sweater",
    "wool sweater", "cashmere sweater", "chunky sweater", "lightweight sweater",
    "turtleneck sweater", "v-neck sweater", "crew neck sweater",
    "cardigan", "button cardigan", "long cardigan", "cropped cardigan",
    
    # Hoodies & Sweatshirts
    "hoodie", "pullover hoodie", "zip-up hoodie", "oversized hoodie",
    "sweatshirt", "crew neck sweatshirt", "athletic sweatshirt",
    
    # Tank Tops & Camisoles
    "tank top", "athletic tank top", "ribbed tank top", "racerback tank",
    "camisole", "silk camisole",
    
    # Polo & Specialty
    "polo shirt", "striped polo", "athletic polo",
    
    # === BOTTOMS ===
    # Jeans
    "jeans", "blue jeans", "black jeans", "light wash jeans", "dark wash jeans",
    "skinny jeans", "straight leg jeans", "bootcut jeans", "wide leg jeans",
    "ripped jeans", "distressed jeans", "high-waisted jeans", "mom jeans",
    "boyfriend jeans", "cropped jeans", "flared jeans",
    
    # Pants
    "pants", "dress pants", "casual pants", "work pants",
    "black pants", "khaki pants", "chino pants", "cargo pants",
    "wide leg pants", "straight leg pants", "tapered pants",
    "sweatpants", "joggers", "track pants",
    "corduroy pants", "linen pants",
    
    # Trousers
    "trousers", "pleated trousers", "flat front trousers", "cropped trousers",
    
    # Shorts
    "shorts", "denim shorts", "athletic shorts", "running shorts",
    "cargo shorts", "bermuda shorts", "bike shorts", "high-waisted shorts",
    
    # Skirts
    "skirt", "mini skirt", "midi skirt", "maxi skirt", "pencil skirt",
    "pleated skirt", "a-line skirt", "wrap skirt", "denim skirt",
    
    # Leggings
    "leggings", "black leggings", "athletic leggings", "yoga pants",
    
    # === DRESSES & JUMPSUITS ===
    "dress", "casual dress", "formal dress", "cocktail dress",
    "maxi dress", "midi dress", "mini dress", "sundress",
    "wrap dress", "shift dress", "shirt dress", "sweater dress",
    "little black dress", "floral dress", "summer dress", "winter dress",
    "jumpsuit", "casual jumpsuit", "formal jumpsuit",
    "romper", "summer romper",
    "gown", "evening gown", "formal gown",
    
    # === OUTERWEAR ===
    # Jackets
    "jacket", "casual jacket", "formal jacket",
    "denim jacket", "blue denim jacket", "black denim jacket",
    "leather jacket", "black leather jacket", "brown leather jacket",
    "bomber jacket", "varsity jacket", "trucker jacket",
    "jean jacket", "utility jacket", "field jacket",
    
    # Blazers
    "blazer", "black blazer", "navy blazer", "fitted blazer",
    "oversized blazer", "casual blazer", "work blazer",
    
    # Coats
    "coat", "winter coat", "heavy coat", "lightweight coat",
    "trench coat", "beige trench coat", "classic trench coat",
    "pea coat", "wool coat", "cashmere coat",
    "puffer jacket", "down jacket", "quilted jacket",
    "parka", "hooded parka", "winter parka",
    "rain jacket", "waterproof jacket", "windbreaker",
    "overcoat", "long coat", "car coat",
    
    # === FOOTWEAR ===
    # Sneakers
    "sneakers", "white sneakers", "black sneakers", "athletic sneakers",
    "running shoes", "training shoes", "casual sneakers",
    "canvas sneakers", "leather sneakers", "high-top sneakers", "low-top sneakers",
    
    # Boots
    "boots", "ankle boots", "knee-high boots", "combat boots",
    "chelsea boots", "leather boots", "suede boots",
    "winter boots", "rain boots", "hiking boots", "work boots",
    
    # Dress Shoes
    "dress shoes", "oxford shoes", "loafers", "monk strap shoes",
    "leather dress shoes", "black dress shoes", "brown dress shoes",
    
    # Heels
    "heels", "high heels", "stiletto heels", "block heels",
    "pumps", "black pumps", "nude pumps",
    "wedges", "platform heels",
    
    # Sandals & Flats
    "sandals", "flat sandals", "heeled sandals", "gladiator sandals",
    "slides", "flip flops",
    "flats", "ballet flats", "pointed flats", "loafer flats",
    
    # === ACCESSORIES ===
    # Headwear
    "hat", "baseball cap", "snapback cap", "dad hat",
    "beanie", "knit beanie", "winter beanie",
    "sun hat", "wide brim hat", "fedora", "bucket hat",
    
    # Neckwear & Scarves
    "scarf", "wool scarf", "silk scarf", "infinity scarf", "winter scarf",
    "tie", "necktie", "bow tie",
    
    # Bags
    "bag", "tote bag", "shoulder bag", "crossbody bag",
    "handbag", "leather handbag", "designer bag",
    "backpack", "leather backpack", "canvas backpack", "laptop backpack",
    "purse", "clutch", "evening bag",
    "messenger bag", "duffel bag",
    
    # Other Accessories
    "belt", "leather belt", "dress belt", "casual belt",
    "gloves", "leather gloves", "winter gloves", "knit gloves",
    "sunglasses", "aviator sunglasses", "wayfarer sunglasses",
    "watch", "dress watch", "sports watch",
    "umbrella", "compact umbrella", "golf umbrella",
    
    # === MATERIALS ===
    "cotton", "100% cotton", "organic cotton",
    "denim", "stretch denim", "raw denim",
    "leather", "genuine leather", "faux leather", "suede",
    "wool", "merino wool", "wool blend",
    "silk", "pure silk", "silk blend",
    "polyester", "polyester blend",
    "linen", "100% linen",
    "fleece", "polar fleece",
    "cashmere", "cashmere blend",
    "down", "down filled", "down insulated",
    "nylon", "ripstop nylon",
    "velvet", "corduroy", "tweed",
    
    # === PATTERNS & TEXTURES ===
    "solid color", "plain", "textured",
    "striped", "horizontal stripes", "vertical stripes", "pinstripe",
    "plaid", "checkered", "gingham", "tartan",
    "floral", "floral print", "botanical print",
    "polka dot", "dotted", "spotted",
    "camouflage", "camo print",
    "animal print", "leopard print", "zebra print",
    "geometric", "abstract print",
    
    # === STYLES & AESTHETICS ===
    "casual", "business casual", "smart casual",
    "formal", "semi-formal", "black tie",
    "athletic", "activewear", "sportswear", "athleisure",
    "business", "professional", "work appropriate",
    "vintage", "retro", "classic",
    "streetwear", "urban", "hypebeast",
    "bohemian", "boho", "hippie",
    "preppy", "ivy league", "collegiate",
    "minimalist", "modern", "contemporary",
    "edgy", "punk", "grunge",
    "elegant", "sophisticated", "chic",
    "outdoor", "hiking", "camping",
    
    # === FIT & SILHOUETTE ===
    "oversized", "baggy", "loose fit",
    "fitted", "slim fit", "tailored",
    "regular fit", "relaxed fit", "comfortable fit",
    "cropped", "ankle length", "full length",
    "high-waisted", "mid-rise", "low-rise",
    
    # === SEASONS & OCCASIONS ===
    "summer", "spring", "fall", "winter", "all-season",
    "transitional", "lightweight", "heavyweight",
    "everyday", "weekend", "vacation",
    "office", "work", "meeting",
    "party", "evening", "date night",
    "gym", "workout", "exercise",
    
    # === WEATHER-ALIGNED ===
    "sunny", "bright", "hot weather", "warm weather",
    "rainy", "wet weather", "stormy", "waterproof", "water-resistant",
    "snowy", "cold weather", "chilly", "cozy", "layered", "insulated",
    "windy", "breezy", "windproof", "wind-resistant",
    "foggy", "humid", "damp", "hazy",
    "freezing", "extreme cold", "sub-zero",
    "scorching", "extreme heat", "very hot",
    "mild", "cool", "temperate",
    "drizzly", "light rain", "heavy rain",
    "icy", "sleet", "blizzard",
    "overcast", "cloudy", "gloomy",
    "dusty", "dry", "arid",
    
    # === COMPOUND DESCRIPTORS (High-Value) ===
    # Color + Type
    "black leather jacket", "white cotton shirt", "blue denim jeans",
    "gray wool sweater", "black dress pants", "white sneakers",
    "navy blazer", "khaki chinos", "burgundy sweater",
    
    # Style + Type
    "casual t-shirt", "formal blazer", "athletic shorts",
    "business shirt", "vintage jacket", "modern coat",
    
    # Material + Type
    "wool sweater", "silk blouse", "cotton dress",
    "leather boots", "denim jacket", "fleece hoodie",
    
    # Fit + Type
    "slim fit pants", "oversized hoodie", "fitted blazer",
    "baggy jeans", "tailored trousers", "cropped jacket",
    
    # Season + Type
    "summer dress", "winter coat", "fall jacket",
    "spring cardigan", "transitional jacket",
    
    # Occasion + Type
    "work blazer", "gym shorts", "party dress",
    "casual sneakers", "dress shoes", "weekend jeans",
]

def generate_embeddings(output_dir="../../raincoat_api/public/models"):
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

if __name__ == "__main__":
    print("=" * 60)
    print("Fashion + Weather Embeddings Generator")
    print("=" * 60)
    
    try:
        embeddings = generate_embeddings()
        
        print("\nEmbeddings generated and saved to raincoat_api/public/models directory.")
        
    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()