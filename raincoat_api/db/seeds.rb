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
OutfitItem.destroy_all
Outfit.destroy_all
WeatherSnapshot.destroy_all
Location.destroy_all
ClothingEmbedding.destroy_all

# Delete Active Storage attachments and blobs directly to avoid enqueuing purge jobs
ActiveStorage::Attachment.where(record_type: 'ClothingPiece').delete_all
ActiveStorage::Blob.where.missing(:attachments).delete_all

ClothingPiece.destroy_all
User.destroy_all

# Create test users
puts "Creating users..."

rudy_user = User.create!(
  name: "Rudy Rudo",
  email: "rudy@email.com"
)

test_user = User.create!(
  name: "Test User2",
  email: "test@example.com"
)

demo_user = User.create!(
  name: "Demo User", 
  email: "demo@sample.com"
)

puts "Created #{User.count} users"

# Create clothing pieces for test user
puts "Creating clothing pieces..."

# Helper method to create a placeholder image
def create_placeholder_image(color, category)
  # Create a simple SVG placeholder image
  svg_content = <<~SVG
    <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="400" fill="#{color}"/>
      <text x="50%" y="50%" font-family="Arial" font-size="24" fill="white" text-anchor="middle" dy=".3em">#{category.titleize}</text>
    </svg>
  SVG

  # Create a StringIO object to simulate a file
  require 'stringio'
  StringIO.new(svg_content)
end

# Tops
test_user.clothing_pieces.create!([
  {
    name: "Blue Cotton T-Shirt",
    description: "Classic navy blue cotton t-shirt, casual wear",
    category: "tops",
    brand: "Uniqlo",
    colors: ["blue", "navy"],
    materials: ["cotton"],
    ai_tags: ["casual", "regular", "short-sleeve", "summer"],
    user_tags: ["casual", "weekend", "summer"]
  },
  {
    name: "White Button-Down Shirt",
    description: "Crisp white dress shirt for professional settings",
    category: "tops",
    brand: "Brooks Brothers",
    colors: ["white"],
    materials: ["cotton"],
    ai_tags: ["formal", "tailored", "spread-collar", "dress-shirt"],
    user_tags: ["work", "formal", "all-season"]
  },
  {
    name: "Red Wool Sweater",
    description: "Cozy red merino wool pullover sweater",
    category: "tops",
    brand: "J.Crew",
    colors: ["red", "burgundy"],
    materials: ["wool", "merino"],
    ai_tags: ["casual", "relaxed", "warm", "pullover"],
    user_tags: ["casual", "date", "winter"]
  },
  {
    name: "Black Hoodie",
    description: "Comfortable black cotton hoodie with kangaroo pocket",
    category: "tops",
    brand: "Nike",
    colors: ["black"],
    materials: ["cotton", "polyester"],
    ai_tags: ["athletic", "loose", "hooded", "casual"],
    user_tags: ["gym", "casual", "fall"]
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
    ai_tags: ["casual", "straight-fit", "dark-wash", "denim"],
    user_tags: ["casual", "everyday", "all-season"]
  },
  {
    name: "Black Dress Pants",
    description: "Formal black trousers for business attire",
    category: "bottoms",
    brand: "Hugo Boss",
    colors: ["black"],
    materials: ["wool", "polyester"],
    ai_tags: ["formal", "tailored", "flat-front", "dress-pants"],
    user_tags: ["work", "formal", "all-season"]
  },
  {
    name: "Khaki Chinos",
    description: "Casual khaki cotton chino pants",
    category: "bottoms",
    brand: "Dockers",
    colors: ["tan", "khaki"],
    materials: ["cotton"],
    ai_tags: ["casual", "slim-fit", "regular-length", "chinos"],
    user_tags: ["casual", "weekend", "spring"]
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
    ai_tags: ["formal", "tailored", "warm", "overcoat"],
    user_tags: ["work", "formal", "winter"]
  },
  {
    name: "Denim Jacket",
    description: "Light blue denim jacket, vintage style",
    category: "outerwear",
    brand: "Wrangler",
    colors: ["blue", "light blue"],
    materials: ["denim", "cotton"],
    ai_tags: ["casual", "regular-fit", "vintage", "denim-jacket"],
    user_tags: ["casual", "weekend", "spring"]
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
    ai_tags: ["casual", "sneaker", "rubber-sole", "athletic"],
    user_tags: ["casual", "gym", "all-season"]
  },
  {
    name: "Black Dress Shoes",
    description: "Formal black leather oxford shoes",
    category: "shoes",
    brand: "Cole Haan",
    colors: ["black"],
    materials: ["leather"],
    ai_tags: ["formal", "oxford", "cap-toe", "dress-shoes"],
    user_tags: ["work", "formal", "all-season"]
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
    ai_tags: ["classic", "silver-buckle", "standard-width", "leather-belt"],
    user_tags: ["work", "casual", "all-season"]
  },
  {
    name: "Black Wool Beanie",
    description: "Warm black wool beanie for cold weather",
    category: "accessories",
    brand: "Patagonia",
    colors: ["black"],
    materials: ["wool"],
    ai_tags: ["casual", "warm", "snug-fit", "winter-hat"],
    user_tags: ["casual", "outdoor", "winter"]
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
    ai_tags: ["casual", "relaxed-fit", "sweatshirt"],
    user_tags: ["casual", "fall"]
  },
  {
    name: "Blue Jeans",
    description: "Medium wash blue denim jeans",
    category: "bottoms",
    brand: "Gap",
    colors: ["blue"],
    materials: ["denim"],
    ai_tags: ["casual", "medium-wash", "denim"],
    user_tags: ["everyday", "all-season"]
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
    ai_tags: ["casual", "regular", "short-sleeve", "summer"],
    user_tags: ["casual", "weekend", "summer"]
  },
  {
    name: "White Button-Down Shirt",
    description: "Crisp white dress shirt for professional settings",
    category: "tops",
    brand: "Brooks Brothers",
    colors: ["white"],
    materials: ["cotton"],
    ai_tags: ["formal", "tailored", "spread-collar", "dress-shirt"],
    user_tags: ["work", "formal", "all-season"]
  },
  {
    name: "Red Wool Sweater",
    description: "Cozy red merino wool pullover sweater",
    category: "tops",
    brand: "J.Crew",
    colors: ["red", "burgundy"],
    materials: ["wool", "merino"],
    ai_tags: ["casual", "relaxed", "warm", "pullover"],
    user_tags: ["casual", "date", "winter"]
  },
  {
    name: "Black Hoodie",
    description: "Comfortable black cotton hoodie with kangaroo pocket",
    category: "tops",
    brand: "Nike",
    colors: ["black"],
    materials: ["cotton", "polyester"],
    ai_tags: ["athletic", "loose", "hooded", "casual"],
    user_tags: ["gym", "casual", "fall"]
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
    ai_tags: ["casual", "straight-fit", "dark-wash", "denim"],
    user_tags: ["casual", "everyday", "all-season"]
  },
  {
    name: "Black Dress Pants",
    description: "Formal black trousers for business attire",
    category: "bottoms",
    brand: "Hugo Boss",
    colors: ["black"],
    materials: ["wool", "polyester"],
    ai_tags: ["formal", "tailored", "flat-front", "dress-pants"],
    user_tags: ["work", "formal", "all-season"]
  },
  {
    name: "Khaki Chinos",
    description: "Casual khaki cotton chino pants",
    category: "bottoms",
    brand: "Dockers",
    colors: ["tan", "khaki"],
    materials: ["cotton"],
    ai_tags: ["casual", "slim-fit", "regular-length", "chinos"],
    user_tags: ["casual", "weekend", "spring"]
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
    ai_tags: ["formal", "tailored", "warm", "overcoat"],
    user_tags: ["work", "formal", "winter"]
  },
  {
    name: "Denim Jacket",
    description: "Light blue denim jacket, vintage style",
    category: "outerwear",
    brand: "Wrangler",
    colors: ["blue", "light blue"],
    materials: ["denim", "cotton"],
    ai_tags: ["casual", "regular-fit", "vintage", "denim-jacket"],
    user_tags: ["casual", "weekend", "spring"]
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
    ai_tags: ["casual", "sneaker", "rubber-sole", "athletic"],
    user_tags: ["casual", "gym", "all-season"]
  },
  {
    name: "Black Dress Shoes",
    description: "Formal black leather oxford shoes",
    category: "shoes",
    brand: "Cole Haan",
    colors: ["black"],
    materials: ["leather"],
    ai_tags: ["formal", "oxford", "cap-toe", "dress-shoes"],
    user_tags: ["work", "formal", "all-season"]
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
    ai_tags: ["classic", "silver-buckle", "standard-width", "leather-belt"],
    user_tags: ["work", "casual", "all-season"]
  },
  {
    name: "Black Wool Beanie",
    description: "Warm black wool beanie for cold weather",
    category: "accessories",
    brand: "Patagonia",
    colors: ["black"],
    materials: ["wool"],
    ai_tags: ["casual", "warm", "snug-fit", "winter-hat"],
    user_tags: ["casual", "outdoor", "winter"]
  }
])

puts "Created #{ClothingPiece.count} clothing pieces"

# Attach images to clothing pieces
puts "Attaching images to clothing pieces..."

# Map piece names to processed image filenames
image_mapping = {
  "Blue Cotton T-Shirt" => "blue-cotton-t-shirt.png",
  "White Button-Down Shirt" => "white-button-down-shirt.png",
  "Red Wool Sweater" => "red-wool-sweater.png",
  "Black Hoodie" => "black-hoodie.png",
  "Dark Wash Jeans" => "dark-wash-jeans.png",
  "Black Dress Pants" => "black-dress-pants.png",
  "Khaki Chinos" => "khaki-chinos.png",
  "Navy Wool Coat" => "navy-wool-coat.png",
  "Denim Jacket" => "denim-jacket.png",
  "White Sneakers" => "white-sneakers.png",
  "Black Dress Shoes" => "black-dress-shoes.png",
  "Brown Leather Belt" => "brown-leather-belt.png",
  "Black Wool Beanie" => "black-wool-beanie.png",
  "Gray Sweatshirt" => "gray-sweatshirt.png",
  "Blue Jeans" => "blue-jeans.png"
}

processed_images_dir = Rails.root.join('db', 'seed_images', 'processed')

# Temporarily disable Active Storage analysis to avoid SolidQueue dependency
# We'll use perform_enqueued_jobs to suppress job enqueueing
ActiveJob::Base.queue_adapter = ActiveJob::QueueAdapters::InlineAdapter.new
ActiveJob::Base.queue_adapter.perform_enqueued_jobs = false

ClothingPiece.find_each do |piece|
  image_filename = image_mapping[piece.name]

  if image_filename
    image_path = processed_images_dir.join(image_filename)

    if File.exist?(image_path)
      # Attach without triggering analyze job
      piece.images.attach(
        io: File.open(image_path),
        filename: image_filename,
        content_type: "image/png"
      )
      puts "Attached image: #{piece.name}"
    else
      # Fallback to SVG placeholder if processed image not found
      puts "Image not found for #{piece.name}, using placeholder"
      primary_color = piece.colors&.first || "#CCCCCC"

      color_map = {
        "blue" => "#4A90E2", "navy" => "#001F3F", "white" => "#FFFFFF",
        "red" => "#E74C3C", "burgundy" => "#8B0000", "black" => "#2C3E50",
        "gray" => "#95A5A6", "grey" => "#95A5A6", "tan" => "#D2B48C",
        "khaki" => "#C3B091", "indigo" => "#4B0082", "brown" => "#8B4513",
        "cognac" => "#9A463D", "light blue" => "#ADD8E6"
      }

      hex_color = color_map[primary_color.downcase] || primary_color
      image_io = create_placeholder_image(hex_color, piece.category)

      piece.images.attach(
        io: image_io,
        filename: "#{piece.name.parameterize}.svg",
        content_type: "image/svg+xml"
      )
    end
  else
    puts "No mapping found for: #{piece.name}"
  end
end

puts "Attached images to #{ClothingPiece.count} pieces"

# Generate sample embeddings using realistic, deterministic vectors
puts "Generating sample embeddings..."

# Load pre-generated embeddings from fixture (if available)
pregenerated_embeddings = EmbeddingGenerator.load_from_fixture('embeddings') || EmbeddingGenerator.load_from_fixture('sample_embeddings')

ClothingPiece.find_each do |piece|
  # Try to find matching pre-generated embedding
  embedding_data = pregenerated_embeddings[piece.name]

  if embedding_data
    # Use pre-generated embedding
    vector_data = embedding_data[:vector_data]
    model_version = embedding_data[:model_version]
    preprocessing_metadata = embedding_data[:preprocessing_metadata]
    puts "Using pre-generated embedding for: #{piece.name}"
  else
    # Generate new embedding based on item attributes
    vector_data = EmbeddingGenerator.generate_for_item(
      name: piece.name,
      category: piece.category,
      colors: piece.colors || [],
      materials: piece.materials || []
    )
    model_version = "fashionclip-2.0"
    preprocessing_metadata = {
      generated_method: "deterministic_seed",
      attributes_used: ["name", "category", "colors", "materials"]
    }
    puts "Generated new embedding for: #{piece.name}"
  end

  piece.create_clothing_embedding!(
    vector_data: vector_data,
    model_version: model_version,
    preprocessing_metadata: preprocessing_metadata
  )
end

puts "Created #{ClothingEmbedding.count} embeddings"
puts ""
puts "Embedding Statistics:"
puts "  Pre-generated: #{pregenerated_embeddings.count}"
puts "  Newly generated: #{ClothingEmbedding.count - pregenerated_embeddings.count}"
puts "  Total: #{ClothingEmbedding.count}"

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

puts "\nSeed data complete!"