# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Example:
#
#   ["Action", "Comedy", "Drama", "Horror"].each do |genre_name|
#     MovieGenre.find_or_create_by!(name: genre_name)
#   end


# Clear existing data
puts "Clearing existing data..."
WeatherSnapshot.destroy_all
Location.destroy_all
ClothingEmbedding.destroy_all
ClothingPiece.destroy_all
User.destroy_all

# Create test users
puts "Creating users..."

rudy_user = User.create!(
  name: "Rudy Rudo",
  email: "rudy@email.com"
)

test_user = User.create!(
  name: "Test User",
  email: "test@example.com"
)

demo_user = User.create!(
  name: "Demo User", 
  email: "demo@example.com"
)

puts "Created #{User.count} users"

# Create clothing pieces for test user
puts "Creating clothing pieces..."

# Tops
test_user.clothing_pieces.create!([
  {
    name: "Blue Cotton T-Shirt",
    description: "Classic navy blue cotton t-shirt, casual wear",
    category: "tops",
    brand: "Uniqlo",
    colors: ["blue", "navy"],
    materials: ["cotton"],
    ai_tags: { "style": "casual", "fit": "regular", "sleeve": "short" },
    user_tags: { "occasions": ["casual", "weekend"], "season": "summer" }
  },
  {
    name: "White Button-Down Shirt", 
    description: "Crisp white dress shirt for professional settings",
    category: "tops",
    brand: "Brooks Brothers",
    colors: ["white"],
    materials: ["cotton"],
    ai_tags: { "style": "formal", "fit": "tailored", "collar": "spread" },
    user_tags: { "occasions": ["work", "formal"], "season": "all" }
  },
  {
    name: "Red Wool Sweater",
    description: "Cozy red merino wool pullover sweater", 
    category: "tops",
    brand: "J.Crew",
    colors: ["red", "burgundy"],
    materials: ["wool", "merino"],
    ai_tags: { "style": "casual", "fit": "relaxed", "warmth": "high" },
    user_tags: { "occasions": ["casual", "date"], "season": "winter" }
  },
  {
    name: "Black Hoodie",
    description: "Comfortable black cotton hoodie with kangaroo pocket",
    category: "tops", 
    brand: "Nike",
    colors: ["black"],
    materials: ["cotton", "polyester"],
    ai_tags: { "style": "athletic", "fit": "loose", "hood": true },
    user_tags: { "occasions": ["gym", "casual"], "season": "fall" }
  }
])

# Bottoms
test_user.clothing_pieces.create!([
  {
    name: "Dark Wash Jeans",
    description: "Classic dark wash denim jeans, straight fit",
    category: "bottoms",
    brand: "Levi's",
    colors: ["blue", "indigo"],
    materials: ["denim", "cotton"],
    ai_tags: { "style": "casual", "fit": "straight", "wash": "dark" },
    user_tags: { "occasions": ["casual", "everyday"], "season": "all" }
  },
  {
    name: "Black Dress Pants",
    description: "Formal black trousers for business attire",
    category: "bottoms",
    brand: "Hugo Boss", 
    colors: ["black"],
    materials: ["wool", "polyester"],
    ai_tags: { "style": "formal", "fit": "tailored", "pleat": false },
    user_tags: { "occasions": ["work", "formal"], "season": "all" }
  },
  {
    name: "Khaki Chinos",
    description: "Casual khaki cotton chino pants",
    category: "bottoms",
    brand: "Dockers",
    colors: ["tan", "khaki"],
    materials: ["cotton"],
    ai_tags: { "style": "casual", "fit": "slim", "length": "regular" },
    user_tags: { "occasions": ["casual", "weekend"], "season": "spring" }
  }
])

# Outerwear
test_user.clothing_pieces.create!([
  {
    name: "Navy Wool Coat",
    description: "Classic navy blue wool overcoat for cold weather",
    category: "outerwear",
    brand: "Burberry",
    colors: ["navy", "blue"],
    materials: ["wool", "cashmere"],
    ai_tags: { "style": "formal", "fit": "tailored", "warmth": "high" },
    user_tags: { "occasions": ["work", "formal"], "season": "winter" }
  },
  {
    name: "Denim Jacket",
    description: "Light blue denim jacket, vintage style", 
    category: "outerwear",
    brand: "Wrangler",
    colors: ["blue", "light blue"],
    materials: ["denim", "cotton"],
    ai_tags: { "style": "casual", "fit": "regular", "vintage": true },
    user_tags: { "occasions": ["casual", "weekend"], "season": "spring" }
  }
])

# Shoes
test_user.clothing_pieces.create!([
  {
    name: "White Sneakers",
    description: "Clean white leather sneakers for everyday wear",
    category: "shoes",
    brand: "Adidas",
    colors: ["white"],
    materials: ["leather", "rubber"],
    ai_tags: { "style": "casual", "type": "sneaker", "sole": "rubber" },
    user_tags: { "occasions": ["casual", "gym"], "season": "all" }
  },
  {
    name: "Black Dress Shoes",
    description: "Formal black leather oxford shoes",
    category: "shoes", 
    brand: "Cole Haan",
    colors: ["black"],
    materials: ["leather"],
    ai_tags: { "style": "formal", "type": "oxford", "toe": "cap" },
    user_tags: { "occasions": ["work", "formal"], "season": "all" }
  }
])

# Accessories
test_user.clothing_pieces.create!([
  {
    name: "Brown Leather Belt",
    description: "Classic brown leather belt with silver buckle",
    category: "accessories",
    brand: "Coach",
    colors: ["brown", "cognac"],
    materials: ["leather"],
    ai_tags: { "style": "classic", "buckle": "silver", "width": "standard" },
    user_tags: { "occasions": ["work", "casual"], "season": "all" }
  },
  {
    name: "Black Wool Beanie",
    description: "Warm black wool beanie for cold weather",
    category: "accessories",
    brand: "Patagonia", 
    colors: ["black"],
    materials: ["wool"],
    ai_tags: { "style": "casual", "warmth": "high", "fit": "snug" },
    user_tags: { "occasions": ["casual", "outdoor"], "season": "winter" }
  }
])

# Create some pieces for demo user too
demo_user.clothing_pieces.create!([
  {
    name: "Gray Sweatshirt",
    description: "Comfortable gray cotton sweatshirt",
    category: "tops",
    brand: "Champion",
    colors: ["gray"],
    materials: ["cotton"],
    ai_tags: { "style": "casual", "fit": "relaxed" },
    user_tags: { "occasions": ["casual"], "season": "fall" }
  },
  {
    name: "Blue Jeans",
    description: "Medium wash blue denim jeans",
    category: "bottoms", 
    brand: "Gap",
    colors: ["blue"],
    materials: ["denim"],
    ai_tags: { "style": "casual", "wash": "medium" },
    user_tags: { "occasions": ["everyday"], "season": "all" }
  }
])

rudy_user.clothing_pieces.create!([
  {
    name: "Blue Cotton T-Shirt",
    description: "Classic navy blue cotton t-shirt, casual wear",
    category: "tops",
    brand: "Uniqlo",
    colors: ["blue", "navy"],
    materials: ["cotton"],
    ai_tags: { "style": "casual", "fit": "regular", "sleeve": "short" },
    user_tags: { "occasions": ["casual", "weekend"], "season": "summer" }
  },
  {
    name: "White Button-Down Shirt", 
    description: "Crisp white dress shirt for professional settings",
    category: "tops",
    brand: "Brooks Brothers",
    colors: ["white"],
    materials: ["cotton"],
    ai_tags: { "style": "formal", "fit": "tailored", "collar": "spread" },
    user_tags: { "occasions": ["work", "formal"], "season": "all" }
  },
  {
    name: "Red Wool Sweater",
    description: "Cozy red merino wool pullover sweater", 
    category: "tops",
    brand: "J.Crew",
    colors: ["red", "burgundy"],
    materials: ["wool", "merino"],
    ai_tags: { "style": "casual", "fit": "relaxed", "warmth": "high" },
    user_tags: { "occasions": ["casual", "date"], "season": "winter" }
  },
  {
    name: "Black Hoodie",
    description: "Comfortable black cotton hoodie with kangaroo pocket",
    category: "tops", 
    brand: "Nike",
    colors: ["black"],
    materials: ["cotton", "polyester"],
    ai_tags: { "style": "athletic", "fit": "loose", "hood": true },
    user_tags: { "occasions": ["gym", "casual"], "season": "fall" }
  }
])

# Bottoms
rudy_user.clothing_pieces.create!([
  {
    name: "Dark Wash Jeans",
    description: "Classic dark wash denim jeans, straight fit",
    category: "bottoms",
    brand: "Levi's",
    colors: ["blue", "indigo"],
    materials: ["denim", "cotton"],
    ai_tags: { "style": "casual", "fit": "straight", "wash": "dark" },
    user_tags: { "occasions": ["casual", "everyday"], "season": "all" }
  },
  {
    name: "Black Dress Pants",
    description: "Formal black trousers for business attire",
    category: "bottoms",
    brand: "Hugo Boss", 
    colors: ["black"],
    materials: ["wool", "polyester"],
    ai_tags: { "style": "formal", "fit": "tailored", "pleat": false },
    user_tags: { "occasions": ["work", "formal"], "season": "all" }
  },
  {
    name: "Khaki Chinos",
    description: "Casual khaki cotton chino pants",
    category: "bottoms",
    brand: "Dockers",
    colors: ["tan", "khaki"],
    materials: ["cotton"],
    ai_tags: { "style": "casual", "fit": "slim", "length": "regular" },
    user_tags: { "occasions": ["casual", "weekend"], "season": "spring" }
  }
])

# Outerwear
rudy_user.clothing_pieces.create!([
  {
    name: "Navy Wool Coat",
    description: "Classic navy blue wool overcoat for cold weather",
    category: "outerwear",
    brand: "Burberry",
    colors: ["navy", "blue"],
    materials: ["wool", "cashmere"],
    ai_tags: { "style": "formal", "fit": "tailored", "warmth": "high" },
    user_tags: { "occasions": ["work", "formal"], "season": "winter" }
  },
  {
    name: "Denim Jacket",
    description: "Light blue denim jacket, vintage style", 
    category: "outerwear",
    brand: "Wrangler",
    colors: ["blue", "light blue"],
    materials: ["denim", "cotton"],
    ai_tags: { "style": "casual", "fit": "regular", "vintage": true },
    user_tags: { "occasions": ["casual", "weekend"], "season": "spring" }
  }
])

# Shoes
rudy_user.clothing_pieces.create!([
  {
    name: "White Sneakers",
    description: "Clean white leather sneakers for everyday wear",
    category: "shoes",
    brand: "Adidas",
    colors: ["white"],
    materials: ["leather", "rubber"],
    ai_tags: { "style": "casual", "type": "sneaker", "sole": "rubber" },
    user_tags: { "occasions": ["casual", "gym"], "season": "all" }
  },
  {
    name: "Black Dress Shoes",
    description: "Formal black leather oxford shoes",
    category: "shoes", 
    brand: "Cole Haan",
    colors: ["black"],
    materials: ["leather"],
    ai_tags: { "style": "formal", "type": "oxford", "toe": "cap" },
    user_tags: { "occasions": ["work", "formal"], "season": "all" }
  }
])

# Accessories
rudy_user.clothing_pieces.create!([
  {
    name: "Brown Leather Belt",
    description: "Classic brown leather belt with silver buckle",
    category: "accessories",
    brand: "Coach",
    colors: ["brown", "cognac"],
    materials: ["leather"],
    ai_tags: { "style": "classic", "buckle": "silver", "width": "standard" },
    user_tags: { "occasions": ["work", "casual"], "season": "all" }
  },
  {
    name: "Black Wool Beanie",
    description: "Warm black wool beanie for cold weather",
    category: "accessories",
    brand: "Patagonia", 
    colors: ["black"],
    materials: ["wool"],
    ai_tags: { "style": "casual", "warmth": "high", "fit": "snug" },
    user_tags: { "occasions": ["casual", "outdoor"], "season": "winter" }
  }
])

puts "Created #{ClothingPiece.count} clothing pieces"

# Generate sample embeddings for some pieces (random vectors for testing)
puts "Generating sample embeddings..."

sample_pieces = ClothingPiece.limit(10)
sample_pieces.each_with_index do |piece, index|
  # Generate deterministic but varied random vectors
  Random.srand(index + 1000) # Use seed for consistency
  vector_data = Array.new(512) { rand(-1.0..1.0).round(4) }
  
  piece.create_clothing_embedding!(
    vector_data: vector_data,
    model_version: "tinyclip-1.0",
    # confidence_score: rand(0.7..0.95).round(3)
  )
  
  puts "  Generated embedding for: #{piece.name}"
end

puts "Created #{ClothingEmbedding.count} embeddings"

# Create locations for users
puts "Creating locations..."

test_user.locations.create!([
  {
    name: "Home",
    city: "New York",
    state: "NY",
    country: "United States",
    latitude: 40.7128,
    longitude: -74.0060,
    timezone: "America/New_York",
    is_default: true
  },
  {
    name: "Office",
    city: "Brooklyn",
    state: "NY",
    country: "United States",
    latitude: 40.6782,
    longitude: -73.9442,
    timezone: "America/New_York",
    is_default: false
  }
])

demo_user.locations.create!({
  name: "Home",
  city: "San Francisco",
  state: "CA",
  country: "United States",
  latitude: 37.7749,
  longitude: -122.4194,
  timezone: "America/Los_Angeles",
  is_default: true
})

rudy_user.locations.create!({
  name: "Home",
  city: "London",
  country: "United Kingdom",
  latitude: 51.5074,
  longitude: -0.1278,
  timezone: "Europe/London",
  is_default: true
})

puts "Created #{Location.count} locations"

# Fetch initial weather data (if API key is configured)
if ENV['WEATHER_API_KEY'].present?
  puts "Fetching initial weather data..."
  weather_service = WeatherService.new

  Location.find_each do |location|
    begin
      snapshot = weather_service.fetch_current_weather(location)
      puts "  Fetched weather for: #{location.display_name}" if snapshot
    rescue => e
      puts "  Failed to fetch weather for #{location.display_name}: #{e.message}"
    end
  end

  puts "Created #{WeatherSnapshot.count} weather snapshots"
else
  puts "Skipping weather fetch (WEATHER_API_KEY not set)"
end

puts "\n=== Seed Data Summary ==="
puts "Users: #{User.count}"
puts "Clothing Pieces: #{ClothingPiece.count}"
puts "Embeddings: #{ClothingEmbedding.count}"
puts "Locations: #{Location.count}"
puts "Weather Snapshots: #{WeatherSnapshot.count}"

puts "\n=== Test Accounts ==="
puts "Email: test@example.com (#{test_user.clothing_pieces.count} items, #{test_user.locations.count} locations)"
puts "Email: demo@example.com (#{demo_user.clothing_pieces.count} items, #{demo_user.locations.count} locations)"
puts "Email: rudy@email.com (#{rudy_user.clothing_pieces.count} items, #{rudy_user.locations.count} locations)"

puts "\nSeed data complete! "