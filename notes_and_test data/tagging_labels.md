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

FASHION_LABELS = [ # Colors
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
    "dusty", "dry", "protective"

]
