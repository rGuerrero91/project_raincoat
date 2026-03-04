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
ActiveStorage::Attachment.where(record_type: 'ClothingItem').delete_all
ActiveStorage::Blob.where.missing(:attachments).delete_all

ClothingItem.destroy_all
User.destroy_all

# Create test users
puts "Creating users..."

rudy_user = User.create!(
  name: "Rudy Rudo",
  email: "rudy@email.com",
  password: "password123",
  password_confirmation: "password123"
)

test_user = User.create!(
  name: "Test User2",
  email: "test@example.com",
  password: "password123",
  password_confirmation: "password123"
)

demo_user = User.create!(
  name: "Demo User",
  email: "demo@sample.com",
  password: "password123",
  password_confirmation: "password123"
)

puts "Created #{User.count} users"

# Create clothing items for test user
puts "Creating clothing items..."

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
test_user.clothing_items.create!([
  {
    name: "Blue Cotton T-Shirt",
    description: "Classic navy blue cotton t-shirt, casual wear",
    category: "tops",
    brand: "Uniqlo",
    colors: [ "blue", "navy" ],
    materials: [ "cotton" ],
    ai_tags: [ "casual", "regular", "short-sleeve", "summer" ],
    user_tags: [ "casual", "weekend", "summer" ]
  },
  {
    name: "White Button-Down Shirt",
    description: "Crisp white dress shirt for professional settings",
    category: "tops",
    brand: "Brooks Brothers",
    colors: [ "white" ],
    materials: [ "cotton" ],
    ai_tags: [ "formal", "tailored", "spread-collar", "dress-shirt" ],
    user_tags: [ "work", "formal", "all-season" ]
  },
  {
    name: "Red Wool Sweater",
    description: "Cozy red merino wool pullover sweater",
    category: "tops",
    brand: "J.Crew",
    colors: [ "red", "burgundy" ],
    materials: [ "wool", "merino" ],
    ai_tags: [ "casual", "relaxed", "warm", "pullover" ],
    user_tags: [ "casual", "date", "winter" ]
  },
  {
    name: "Black Hoodie",
    description: "Comfortable black cotton hoodie with kangaroo pocket",
    category: "tops",
    brand: "Nike",
    colors: [ "black" ],
    materials: [ "cotton", "polyester" ],
    ai_tags: [ "athletic", "loose", "hooded", "casual" ],
    user_tags: [ "gym", "casual", "fall" ]
  }
])

# Bottoms
test_user.clothing_items.create!([
  {
    name: "Dark Wash Jeans",
    description: "Classic dark wash denim jeans, straight fit",
    category: "bottoms",
    brand: "Levi's",
    colors: [ "blue", "indigo" ],
    materials: [ "denim", "cotton" ],
    ai_tags: [ "casual", "straight-fit", "dark-wash", "denim" ],
    user_tags: [ "casual", "everyday", "all-season" ]
  },
  {
    name: "Black Dress Pants",
    description: "Formal black trousers for business attire",
    category: "bottoms",
    brand: "Hugo Boss",
    colors: [ "black" ],
    materials: [ "wool", "polyester" ],
    ai_tags: [ "formal", "tailored", "flat-front", "dress-pants" ],
    user_tags: [ "work", "formal", "all-season" ]
  },
  {
    name: "Khaki Chinos",
    description: "Casual khaki cotton chino pants",
    category: "bottoms",
    brand: "Dockers",
    colors: [ "tan", "khaki" ],
    materials: [ "cotton" ],
    ai_tags: [ "casual", "slim-fit", "regular-length", "chinos" ],
    user_tags: [ "casual", "weekend", "spring" ]
  }
])

# Outerwear
test_user.clothing_items.create!([
  {
    name: "Navy Wool Coat",
    description: "Classic navy blue wool overcoat for cold weather",
    category: "outerwear",
    brand: "Burberry",
    colors: [ "navy", "blue" ],
    materials: [ "wool", "cashmere" ],
    ai_tags: [ "formal", "tailored", "warm", "overcoat" ],
    user_tags: [ "work", "formal", "winter" ]
  },
  {
    name: "Denim Jacket",
    description: "Light blue denim jacket, vintage style",
    category: "outerwear",
    brand: "Wrangler",
    colors: [ "blue", "light blue" ],
    materials: [ "denim", "cotton" ],
    ai_tags: [ "casual", "regular-fit", "vintage", "denim-jacket" ],
    user_tags: [ "casual", "weekend", "spring" ]
  }
])

# Shoes
test_user.clothing_items.create!([
  {
    name: "White Sneakers",
    description: "Clean white leather sneakers for everyday wear",
    category: "shoes",
    brand: "Adidas",
    colors: [ "white" ],
    materials: [ "leather", "rubber" ],
    ai_tags: [ "casual", "sneaker", "rubber-sole", "athletic" ],
    user_tags: [ "casual", "gym", "all-season" ]
  },
  {
    name: "Black Dress Shoes",
    description: "Formal black leather oxford shoes",
    category: "shoes",
    brand: "Cole Haan",
    colors: [ "black" ],
    materials: [ "leather" ],
    ai_tags: [ "formal", "oxford", "cap-toe", "dress-shoes" ],
    user_tags: [ "work", "formal", "all-season" ]
  }
])

# Accessories
test_user.clothing_items.create!([
  {
    name: "Brown Leather Belt",
    description: "Classic brown leather belt with silver buckle",
    category: "accessories",
    brand: "Coach",
    colors: [ "brown", "cognac" ],
    materials: [ "leather" ],
    ai_tags: [ "classic", "silver-buckle", "standard-width", "leather-belt" ],
    user_tags: [ "work", "casual", "all-season" ]
  },
  {
    name: "Black Wool Beanie",
    description: "Warm black wool beanie for cold weather",
    category: "accessories",
    brand: "Patagonia",
    colors: [ "black" ],
    materials: [ "wool" ],
    ai_tags: [ "casual", "warm", "snug-fit", "winter-hat" ],
    user_tags: [ "casual", "outdoor", "winter" ]
  }
])

# Create some items for demo user too
demo_user.clothing_items.create!([
  {
    name: "Gray Sweatshirt",
    description: "Comfortable gray cotton sweatshirt",
    category: "tops",
    brand: "Champion",
    colors: [ "gray" ],
    materials: [ "cotton" ],
    ai_tags: [ "casual", "relaxed-fit", "sweatshirt" ],
    user_tags: [ "casual", "fall" ]
  },
  {
    name: "Blue Jeans",
    description: "Medium wash blue denim jeans",
    category: "bottoms",
    brand: "Gap",
    colors: [ "blue" ],
    materials: [ "denim" ],
    ai_tags: [ "casual", "medium-wash", "denim" ],
    user_tags: [ "everyday", "all-season" ]
  },
  # New hot weather tops
  {
    name: "White Linen Button-Up",
    description: "Lightweight white linen shirt perfect for hot weather",
    category: "tops",
    brand: "J.Crew",
    colors: [ "white" ],
    materials: [ "linen" ],
    ai_tags: [ "lightweight", "breathable", "summer", "long-sleeve", "casual" ],
    user_tags: [ "summer", "vacation", "casual" ]
  },
  {
    name: "Striped Cotton Tank Top",
    description: "Navy and white striped cotton tank top",
    category: "tops",
    brand: "Old Navy",
    colors: [ "navy", "white" ],
    materials: [ "cotton" ],
    ai_tags: [ "sleeveless", "breathable", "summer", "casual", "striped" ],
    user_tags: [ "summer", "beach", "casual" ]
  },
  {
    name: "Light Blue Chambray Shirt",
    description: "Casual light blue chambray button-down",
    category: "tops",
    brand: "Gap",
    colors: [ "light blue" ],
    materials: [ "cotton" ],
    ai_tags: [ "casual", "breathable", "summer", "long-sleeve", "button-down" ],
    user_tags: [ "casual", "spring", "versatile" ]
  },
  {
    name: "Pale Yellow T-Shirt",
    description: "Soft pale yellow cotton t-shirt",
    category: "tops",
    brand: "Uniqlo",
    colors: [ "yellow" ],
    materials: [ "cotton" ],
    ai_tags: [ "casual", "short-sleeve", "summer", "lightweight" ],
    user_tags: [ "casual", "summer", "everyday" ]
  },
  # Cold weather tops
  {
    name: "Charcoal Turtleneck Sweater",
    description: "Warm charcoal gray wool turtleneck",
    category: "tops",
    brand: "Banana Republic",
    colors: [ "charcoal", "gray" ],
    materials: [ "wool" ],
    ai_tags: [ "warm", "winter", "turtleneck", "formal", "long-sleeve" ],
    user_tags: [ "winter", "work", "formal" ]
  },
  {
    name: "Navy Fleece Pullover",
    description: "Cozy navy blue fleece pullover",
    category: "tops",
    brand: "Patagonia",
    colors: [ "navy" ],
    materials: [ "fleece", "polyester" ],
    ai_tags: [ "warm", "winter", "casual", "pullover", "fleece" ],
    user_tags: [ "winter", "outdoor", "casual" ]
  },
  {
    name: "Burgundy Cardigan",
    description: "Classic burgundy wool cardigan sweater",
    category: "tops",
    brand: "L.L.Bean",
    colors: [ "burgundy", "red" ],
    materials: [ "wool" ],
    ai_tags: [ "warm", "winter", "cardigan", "casual", "button-up" ],
    user_tags: [ "fall", "winter", "casual" ]
  },
  # All-season tops
  {
    name: "Olive Green Henley",
    description: "Casual olive green cotton henley shirt",
    category: "tops",
    brand: "J.Crew",
    colors: [ "olive", "green" ],
    materials: [ "cotton" ],
    ai_tags: [ "casual", "long-sleeve", "henley", "versatile" ],
    user_tags: [ "casual", "fall", "spring" ]
  },
  {
    name: "Gray V-Neck T-Shirt",
    description: "Simple gray v-neck cotton t-shirt",
    category: "tops",
    brand: "Everlane",
    colors: [ "gray" ],
    materials: [ "cotton" ],
    ai_tags: [ "casual", "short-sleeve", "v-neck", "basic" ],
    user_tags: [ "casual", "everyday", "all-season" ]
  },
  {
    name: "Plaid Flannel Shirt",
    description: "Red and black plaid flannel button-down",
    category: "tops",
    brand: "Pendleton",
    colors: [ "red", "black" ],
    materials: [ "cotton", "flannel" ],
    ai_tags: [ "casual", "warm", "plaid", "long-sleeve", "flannel" ],
    user_tags: [ "fall", "casual", "outdoor" ]
  },
  {
    name: "White Oxford Shirt",
    description: "Classic white oxford cloth button-down",
    category: "tops",
    brand: "Brooks Brothers",
    colors: [ "white" ],
    materials: [ "cotton" ],
    ai_tags: [ "formal", "button-down", "oxford", "long-sleeve", "dress-shirt" ],
    user_tags: [ "work", "formal", "all-season" ]
  },
  {
    name: "Black Polo Shirt",
    description: "Black cotton piqué polo shirt",
    category: "tops",
    brand: "Lacoste",
    colors: [ "black" ],
    materials: [ "cotton" ],
    ai_tags: [ "casual", "polo", "short-sleeve", "collar" ],
    user_tags: [ "casual", "golf", "spring" ]
  },
  # New bottoms - summer
  {
    name: "Khaki Shorts",
    description: "Classic khaki cotton chino shorts",
    category: "bottoms",
    brand: "Bonobos",
    colors: [ "khaki", "tan" ],
    materials: [ "cotton" ],
    ai_tags: [ "casual", "summer", "lightweight", "shorts", "breathable" ],
    user_tags: [ "summer", "casual", "vacation" ]
  },
  {
    name: "Navy Chino Shorts",
    description: "Navy blue cotton chino shorts",
    category: "bottoms",
    brand: "J.Crew",
    colors: [ "navy" ],
    materials: [ "cotton" ],
    ai_tags: [ "casual", "summer", "shorts", "breathable" ],
    user_tags: [ "summer", "casual", "weekend" ]
  },
  # All-season bottoms
  {
    name: "Light Wash Jeans",
    description: "Light wash blue denim jeans",
    category: "bottoms",
    brand: "Levi's",
    colors: [ "light blue" ],
    materials: [ "denim", "cotton" ],
    ai_tags: [ "casual", "jeans", "light-wash", "denim" ],
    user_tags: [ "casual", "spring", "summer" ]
  },
  {
    name: "Gray Joggers",
    description: "Comfortable gray athletic joggers",
    category: "bottoms",
    brand: "Nike",
    colors: [ "gray" ],
    materials: [ "cotton", "polyester" ],
    ai_tags: [ "athletic", "casual", "joggers", "elastic-waist" ],
    user_tags: [ "gym", "casual", "all-season" ]
  },
  {
    name: "Olive Cargo Pants",
    description: "Olive green cotton cargo pants",
    category: "bottoms",
    brand: "Carhartt",
    colors: [ "olive", "green" ],
    materials: [ "cotton" ],
    ai_tags: [ "casual", "cargo", "utilitarian", "pockets" ],
    user_tags: [ "casual", "outdoor", "fall" ]
  },
  {
    name: "Charcoal Dress Pants",
    description: "Charcoal gray wool dress trousers",
    category: "bottoms",
    brand: "Hugo Boss",
    colors: [ "charcoal", "gray" ],
    materials: [ "wool", "polyester" ],
    ai_tags: [ "formal", "dress-pants", "tailored", "business" ],
    user_tags: [ "work", "formal", "all-season" ]
  },
  {
    name: "Navy Corduroy Pants",
    description: "Navy blue corduroy pants",
    category: "bottoms",
    brand: "Dockers",
    colors: [ "navy" ],
    materials: [ "corduroy", "cotton" ],
    ai_tags: [ "casual", "warm", "corduroy", "textured" ],
    user_tags: [ "fall", "winter", "casual" ]
  },
  {
    name: "Black Athletic Leggings",
    description: "Black moisture-wicking athletic leggings",
    category: "bottoms",
    brand: "Under Armour",
    colors: [ "black" ],
    materials: [ "polyester", "spandex" ],
    ai_tags: [ "athletic", "fitted", "moisture-wicking", "stretchy" ],
    user_tags: [ "gym", "running", "all-season" ]
  },
  # New outerwear
  {
    name: "Yellow Rain Jacket",
    description: "Bright yellow waterproof rain jacket",
    category: "outerwear",
    brand: "Columbia",
    colors: [ "yellow" ],
    materials: [ "nylon", "waterproof" ],
    ai_tags: [ "waterproof", "rain", "lightweight", "hooded" ],
    user_tags: [ "rainy", "spring", "outdoor" ]
  },
  {
    name: "Black Windbreaker",
    description: "Lightweight black nylon windbreaker",
    category: "outerwear",
    brand: "The North Face",
    colors: [ "black" ],
    materials: [ "nylon", "polyester" ],
    ai_tags: [ "lightweight", "wind-resistant", "athletic", "packable" ],
    user_tags: [ "running", "spring", "fall" ]
  },
  {
    name: "Camel Wool Overcoat",
    description: "Luxurious camel-colored wool overcoat",
    category: "outerwear",
    brand: "Burberry",
    colors: [ "camel", "tan" ],
    materials: [ "wool", "cashmere" ],
    ai_tags: [ "formal", "warm", "winter", "overcoat", "tailored" ],
    user_tags: [ "winter", "formal", "dressy" ]
  },
  {
    name: "Gray Puffer Jacket",
    description: "Warm gray down puffer jacket",
    category: "outerwear",
    brand: "Uniqlo",
    colors: [ "gray" ],
    materials: [ "down", "nylon" ],
    ai_tags: [ "warm", "winter", "puffer", "insulated", "down" ],
    user_tags: [ "winter", "cold", "casual" ]
  },
  {
    name: "Black Pea Coat",
    description: "Classic black wool pea coat",
    category: "outerwear",
    brand: "Schott NYC",
    colors: [ "black" ],
    materials: [ "wool" ],
    ai_tags: [ "warm", "winter", "pea-coat", "double-breasted", "formal" ],
    user_tags: [ "winter", "formal", "classic" ]
  },
  {
    name: "Olive Bomber Jacket",
    description: "Olive green bomber jacket with ribbed cuffs",
    category: "outerwear",
    brand: "Alpha Industries",
    colors: [ "olive", "green" ],
    materials: [ "nylon", "polyester" ],
    ai_tags: [ "casual", "bomber", "lightweight", "spring" ],
    user_tags: [ "spring", "fall", "casual" ]
  },
  {
    name: "Brown Leather Jacket",
    description: "Classic brown leather moto jacket",
    category: "outerwear",
    brand: "Schott",
    colors: [ "brown" ],
    materials: [ "leather" ],
    ai_tags: [ "casual", "leather", "moto", "edgy", "warm" ],
    user_tags: [ "fall", "spring", "style" ]
  },
  {
    name: "Gray Zip-Up Hoodie",
    description: "Comfortable gray cotton zip-up hoodie",
    category: "outerwear",
    brand: "Champion",
    colors: [ "gray" ],
    materials: [ "cotton", "polyester" ],
    ai_tags: [ "casual", "athletic", "hoodie", "zip-up", "comfortable" ],
    user_tags: [ "casual", "gym", "all-season" ]
  },
  # New shoes
  {
    name: "Brown Leather Boots",
    description: "Brown leather Chelsea boots",
    category: "shoes",
    brand: "Clarks",
    colors: [ "brown" ],
    materials: [ "leather" ],
    ai_tags: [ "boots", "casual", "leather", "chelsea" ],
    user_tags: [ "fall", "winter", "casual" ]
  },
  {
    name: "Navy Canvas Sneakers",
    description: "Navy canvas low-top sneakers",
    category: "shoes",
    brand: "Vans",
    colors: [ "navy" ],
    materials: [ "canvas", "rubber" ],
    ai_tags: [ "casual", "sneaker", "canvas", "low-top" ],
    user_tags: [ "casual", "everyday", "all-season" ]
  },
  {
    name: "Black Running Shoes",
    description: "Black mesh athletic running shoes",
    category: "shoes",
    brand: "Nike",
    colors: [ "black" ],
    materials: [ "mesh", "rubber", "synthetic" ],
    ai_tags: [ "athletic", "running", "breathable", "sneaker" ],
    user_tags: [ "gym", "running", "all-season" ]
  },
  {
    name: "Tan Boat Shoes",
    description: "Tan leather boat shoes",
    category: "shoes",
    brand: "Sperry",
    colors: [ "tan", "brown" ],
    materials: [ "leather", "rubber" ],
    ai_tags: [ "casual", "summer", "boat-shoes", "preppy" ],
    user_tags: [ "summer", "casual", "beach" ]
  },
  {
    name: "Gray Slip-On Sneakers",
    description: "Gray canvas slip-on sneakers",
    category: "shoes",
    brand: "Vans",
    colors: [ "gray" ],
    materials: [ "canvas", "rubber" ],
    ai_tags: [ "casual", "slip-on", "sneaker", "easy" ],
    user_tags: [ "casual", "everyday", "all-season" ]
  },
  {
    name: "Burgundy Loafers",
    description: "Burgundy leather penny loafers",
    category: "shoes",
    brand: "Cole Haan",
    colors: [ "burgundy", "red" ],
    materials: [ "leather" ],
    ai_tags: [ "formal", "loafer", "leather", "dressy" ],
    user_tags: [ "work", "formal", "dressy" ]
  },
  # New accessories
  {
    name: "Navy Baseball Cap",
    description: "Navy cotton baseball cap",
    category: "accessories",
    brand: "New Era",
    colors: [ "navy" ],
    materials: [ "cotton" ],
    ai_tags: [ "casual", "hat", "baseball-cap", "sun-protection" ],
    user_tags: [ "casual", "summer", "outdoor" ]
  },
  {
    name: "Black Sunglasses",
    description: "Black frame aviator sunglasses",
    category: "accessories",
    brand: "Ray-Ban",
    colors: [ "black" ],
    materials: [ "metal", "glass" ],
    ai_tags: [ "accessories", "sunglasses", "sun-protection", "aviator" ],
    user_tags: [ "summer", "driving", "all-season" ]
  },
  {
    name: "Gray Knit Scarf",
    description: "Soft gray wool knit scarf",
    category: "accessories",
    brand: "Banana Republic",
    colors: [ "gray" ],
    materials: [ "wool" ],
    ai_tags: [ "warm", "winter", "scarf", "knit" ],
    user_tags: [ "winter", "cold", "dressy" ]
  },
  {
    name: "Brown Leather Watch",
    description: "Classic brown leather strap watch",
    category: "accessories",
    brand: "Timex",
    colors: [ "brown" ],
    materials: [ "leather", "metal" ],
    ai_tags: [ "accessories", "watch", "classic", "leather" ],
    user_tags: [ "everyday", "work", "all-season" ]
  },
  {
    name: "Black Backpack",
    description: "Black nylon backpack with laptop compartment",
    category: "accessories",
    brand: "Herschel",
    colors: [ "black" ],
    materials: [ "nylon", "polyester" ],
    ai_tags: [ "accessories", "backpack", "practical", "laptop" ],
    user_tags: [ "work", "school", "all-season" ]
  }
])

rudy_user.clothing_items.create!([
  {
    name: "Blue Cotton T-Shirt",
    description: "Classic navy blue cotton t-shirt, casual wear",
    category: "tops",
    brand: "Uniqlo",
    colors: [ "blue", "navy" ],
    materials: [ "cotton" ],
    ai_tags: [ "casual", "regular", "short-sleeve", "summer" ],
    user_tags: [ "casual", "weekend", "summer" ]
  },
  {
    name: "White Button-Down Shirt",
    description: "Crisp white dress shirt for professional settings",
    category: "tops",
    brand: "Brooks Brothers",
    colors: [ "white" ],
    materials: [ "cotton" ],
    ai_tags: [ "formal", "tailored", "spread-collar", "dress-shirt" ],
    user_tags: [ "work", "formal", "all-season" ]
  },
  {
    name: "Red Wool Sweater",
    description: "Cozy red merino wool pullover sweater",
    category: "tops",
    brand: "J.Crew",
    colors: [ "red", "burgundy" ],
    materials: [ "wool", "merino" ],
    ai_tags: [ "casual", "relaxed", "warm", "pullover" ],
    user_tags: [ "casual", "date", "winter" ]
  },
  {
    name: "Black Hoodie",
    description: "Comfortable black cotton hoodie with kangaroo pocket",
    category: "tops",
    brand: "Nike",
    colors: [ "black" ],
    materials: [ "cotton", "polyester" ],
    ai_tags: [ "athletic", "loose", "hooded", "casual" ],
    user_tags: [ "gym", "casual", "fall" ]
  }
])

# Bottoms
rudy_user.clothing_items.create!([
  {
    name: "Dark Wash Jeans",
    description: "Classic dark wash denim jeans, straight fit",
    category: "bottoms",
    brand: "Levi's",
    colors: [ "blue", "indigo" ],
    materials: [ "denim", "cotton" ],
    ai_tags: [ "casual", "straight-fit", "dark-wash", "denim" ],
    user_tags: [ "casual", "everyday", "all-season" ]
  },
  {
    name: "Black Dress Pants",
    description: "Formal black trousers for business attire",
    category: "bottoms",
    brand: "Hugo Boss",
    colors: [ "black" ],
    materials: [ "wool", "polyester" ],
    ai_tags: [ "formal", "tailored", "flat-front", "dress-pants" ],
    user_tags: [ "work", "formal", "all-season" ]
  },
  {
    name: "Khaki Chinos",
    description: "Casual khaki cotton chino pants",
    category: "bottoms",
    brand: "Dockers",
    colors: [ "tan", "khaki" ],
    materials: [ "cotton" ],
    ai_tags: [ "casual", "slim-fit", "regular-length", "chinos" ],
    user_tags: [ "casual", "weekend", "spring" ]
  }
])

# Outerwear
rudy_user.clothing_items.create!([
  {
    name: "Navy Wool Coat",
    description: "Classic navy blue wool overcoat for cold weather",
    category: "outerwear",
    brand: "Burberry",
    colors: [ "navy", "blue" ],
    materials: [ "wool", "cashmere" ],
    ai_tags: [ "formal", "tailored", "warm", "overcoat" ],
    user_tags: [ "work", "formal", "winter" ]
  },
  {
    name: "Denim Jacket",
    description: "Light blue denim jacket, vintage style",
    category: "outerwear",
    brand: "Wrangler",
    colors: [ "blue", "light blue" ],
    materials: [ "denim", "cotton" ],
    ai_tags: [ "casual", "regular-fit", "vintage", "denim-jacket" ],
    user_tags: [ "casual", "weekend", "spring" ]
  }
])

# Shoes
rudy_user.clothing_items.create!([
  {
    name: "White Sneakers",
    description: "Clean white leather sneakers for everyday wear",
    category: "shoes",
    brand: "Adidas",
    colors: [ "white" ],
    materials: [ "leather", "rubber" ],
    ai_tags: [ "casual", "sneaker", "rubber-sole", "athletic" ],
    user_tags: [ "casual", "gym", "all-season" ]
  },
  {
    name: "Black Dress Shoes",
    description: "Formal black leather oxford shoes",
    category: "shoes",
    brand: "Cole Haan",
    colors: [ "black" ],
    materials: [ "leather" ],
    ai_tags: [ "formal", "oxford", "cap-toe", "dress-shoes" ],
    user_tags: [ "work", "formal", "all-season" ]
  }
])

# Accessories
rudy_user.clothing_items.create!([
  {
    name: "Brown Leather Belt",
    description: "Classic brown leather belt with silver buckle",
    category: "accessories",
    brand: "Coach",
    colors: [ "brown", "cognac" ],
    materials: [ "leather" ],
    ai_tags: [ "classic", "silver-buckle", "standard-width", "leather-belt" ],
    user_tags: [ "work", "casual", "all-season" ]
  },
  {
    name: "Black Wool Beanie",
    description: "Warm black wool beanie for cold weather",
    category: "accessories",
    brand: "Patagonia",
    colors: [ "black" ],
    materials: [ "wool" ],
    ai_tags: [ "casual", "warm", "snug-fit", "winter-hat" ],
    user_tags: [ "casual", "outdoor", "winter" ]
  }
])

puts "Created #{ClothingItem.count} clothing items"

# Attach images to clothing items
puts "Attaching images to clothing items..."

# Map item names to processed image filenames
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
  "Blue Jeans" => "blue-jeans.png",
  "White Linen Button-Up" => "white-linen-button-up.png",
  "Striped Cotton Tank Top" => "striped-cotton-tank-top.png",
  "Light Blue Chambray Shirt" => "light-blue-chambray-shirt.png",
  "Pale Yellow T-Shirt" => "pale-yellow-t-shirt.png",
  "Charcoal Turtleneck Sweater" => "charcoal-turtleneck-sweater.png",
  "Navy Fleece Pullover" => "navy-fleece-pullover.png",
  "Burgundy Cardigan" => "burgundy-cardigan.png",
  "Olive Green Henley" => "olive-green-henley.png",
  "Gray V-Neck T-Shirt" => "gray-v-neck-t-shirt.png",
  "Plaid Flannel Shirt" => "plaid-flannel-shirt.png",
  "White Oxford Shirt" => "white-oxford-shirt.png",
  "Black Polo Shirt" => "black-polo-shirt.png",
  "Khaki Shorts" => "khaki-shorts.png",
  "Navy Chino Shorts" => "navy-chino-shorts.png",
  "Light Wash Jeans" => "light-wash-jeans.png",
  "Gray Joggers" => "gray-joggers.png",
  "Olive Cargo Pants" => "olive-cargo-pants.png",
  "Charcoal Dress Pants" => "charcoal-dress-pants.png",
  "Navy Corduroy Pants" => "navy-corduroy-pants.png",
  "Black Athletic Leggings" => "black-athletic-leggings.png",
  "Yellow Rain Jacket" => "yellow-rain-jacket.png",
  "Black Windbreaker" => "black-windbreaker.png",
  "Camel Wool Overcoat" => "camel-wool-overcoat.png",
  "Gray Puffer Jacket" => "gray-puffer-jacket.png",
  "Black Pea Coat" => "black-pea-coat.png",
  "Olive Bomber Jacket" => "olive-bomber-jacket.png",
  "Brown Leather Jacket" => "brown-leather-jacket.png",
  "Gray Zip-Up Hoodie" => "gray-zip-up-hoodie.png",
  "Brown Leather Boots" => "brown-leather-boots.png",
  "Navy Canvas Sneakers" => "navy-canvas-sneakers.png",
  "Black Running Shoes" => "black-running-shoes.png",
  "Tan Boat Shoes" => "tan-boat-shoes.png",
  "Gray Slip-On Sneakers" => "gray-slip-on-sneakers.png",
  "Burgundy Loafers" => "burgundy-loafers.png",
  "Navy Baseball Cap" => "navy-baseball-cap.png",
  "Black Sunglasses" => "black-sunglasses.png",
  "Gray Knit Scarf" => "gray-knit-scarf.png",
  "Brown Leather Watch" => "brown-leather-watch.png",
  "Black Backpack" => "black-backpack.png"
}

processed_images_dir = Rails.root.join('db', 'seed_images', 'processed')

# Temporarily disable Active Storage analysis to avoid SolidQueue dependency
# Use TestAdapter which allows us to disable job execution
require 'active_job/queue_adapters/test_adapter'
ActiveJob::Base.queue_adapter = :test
ActiveJob::Base.queue_adapter.perform_enqueued_jobs = false

ClothingItem.find_each do |item|
  image_filename = image_mapping[item.name]

  if image_filename
    image_path = processed_images_dir.join(image_filename)

    if File.exist?(image_path)
      # Attach without triggering analyze job
      item.images.attach(
        io: File.open(image_path),
        filename: image_filename,
        content_type: "image/png"
      )
      puts "Attached image: #{item.name}"
    else
      # Fallback to SVG placeholder if processed image not found
      puts "Image not found for #{item.name}, using placeholder"
      primary_color = item.colors&.first || "#CCCCCC"

      color_map = {
        "blue" => "#4A90E2", "navy" => "#001F3F", "white" => "#FFFFFF",
        "red" => "#E74C3C", "burgundy" => "#8B0000", "black" => "#2C3E50",
        "gray" => "#95A5A6", "grey" => "#95A5A6", "tan" => "#D2B48C",
        "khaki" => "#C3B091", "indigo" => "#4B0082", "brown" => "#8B4513",
        "cognac" => "#9A463D", "light blue" => "#ADD8E6"
      }

      hex_color = color_map[primary_color.downcase] || primary_color
      image_io = create_placeholder_image(hex_color, item.category)

      item.images.attach(
        io: image_io,
        filename: "#{item.name.parameterize}.svg",
        content_type: "image/svg+xml"
      )
    end
  else
    puts "No mapping found for: #{item.name}"
  end
end

puts "Attached images to #{ClothingItem.count} items"

# Generate sample embeddings using realistic, deterministic vectors
puts "Generating sample embeddings..."

# Load pre-generated embeddings from fixture (if available)
# Priority: seed_embeddings (real FashionCLIP) > embeddings > sample_embeddings (synthetic)
pregenerated_embeddings = EmbeddingGenerator.load_from_fixture('seed_embeddings') || EmbeddingGenerator.load_from_fixture('embeddings') || EmbeddingGenerator.load_from_fixture('sample_embeddings')

ClothingItem.find_each do |item|
  # Try to find matching pre-generated embedding
  embedding_data = pregenerated_embeddings[item.name]

  if embedding_data
    # Use pre-generated embedding
    vector_data = embedding_data[:vector_data]
    model_version = embedding_data[:model_version]
    preprocessing_metadata = embedding_data[:preprocessing_metadata]
    puts "Using pre-generated embedding for: #{item.name}"
  else
    # Generate new embedding based on item attributes
    vector_data = EmbeddingGenerator.generate_for_item(
      name: item.name,
      category: item.category,
      colors: item.colors || [],
      materials: item.materials || []
    )
    model_version = "fashionclip-2.0"
    preprocessing_metadata = {
      generated_method: "deterministic_seed",
      attributes_used: [ "name", "category", "colors", "materials" ]
    }
    puts "Generated new embedding for: #{item.name}"
  end

  item.create_clothing_embedding!(
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
puts "Clothing Items: #{ClothingItem.count}"
puts "Embeddings: #{ClothingEmbedding.count}"
puts "Locations: #{Location.count}"
puts "Weather Snapshots: #{WeatherSnapshot.count}"

puts "\n=== Test Accounts ==="
puts "Email: test@example.com (#{test_user.clothing_items.count} items, #{test_user.locations.count} locations)"
puts "Email: demo@example.com (#{demo_user.clothing_items.count} items, #{demo_user.locations.count} locations)"
puts "Email: rudy@email.com (#{rudy_user.clothing_items.count} items, #{rudy_user.locations.count} locations)"

puts "\nSeed data complete!"
