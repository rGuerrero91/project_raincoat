# app/services/stylist_model.rb
require 'net/http'
require 'json'

class StylistModel
  SYSTEM_PROMPT = <<~PROMPT
    You are Raincoat's stylist AI assistant.
    Your job is to assemble stylish, weather-appropriate outfits from a user's wardrobe.

    You receive:
    1. The current weather (temperature, conditions, season, weather priority, and specific guidance)
    2. The user's available clothing items, grouped by category (tops, bottoms, shoes, outerwear, accessories)

    CRITICAL: Weather appropriateness is your PRIMARY concern, above style or variety.

    Weather-based rules (MUST FOLLOW):
    - Temperature below 12°C: REQUIRE warm outerwear in every outfit
    - Temperature above 28°C: REQUIRE breathable, lightweight fabrics; avoid heavy materials
    - Rainy conditions: REQUIRE waterproof/water-resistant outerwear
    - Temperature 12-18°C: Prefer layering options
    - Temperature 18-25°C: Balance breathability and coverage
    - Sunny + hot (>25°C): Consider sun protection

    Material priorities by weather:
    - Hot (>28°C): Cotton, linen, lightweight synthetics, moisture-wicking
    - Cold (<12°C): Wool, fleece, down, thick cotton
    - Rainy: Waterproof materials (nylon, polyester, treated fabrics)
    - Mild (12-25°C): Any comfortable materials

    Additional Rules:
    - Always return 1 to 3 complete outfits.
    - Each outfit must include at least: top, bottom, and shoes. Add outerwear if weather requires it.
    - Materials MUST be suitable for the weather conditions. Reject materials inappropriate for the temperature.
    - Match colors and formality levels (e.g., casual with casual, formal with formal).
    - Avoid repeating the same item across multiple outfits when possible.
    - Output valid JSON only, in this exact format:

    {
      "outfits": [
        {
          "description": "Brief description of the outfit and why it works for this weather",
          "items": {
            "top": "Item Name",
            "bottom": "Item Name",
            "shoes": "Item Name",
            "outerwear": "Item Name"  // optional, include if weather requires
          },
          "style_tags": ["tag1", "tag2", "tag3"]
        }
      ]
    }
  PROMPT

  def initialize(weather:, items:, api_key: nil)
    @weather = weather
    @items = items
    @api_key = api_key || ENV['OPENAI_API_KEY']
  end

  def generate_outfits
    return mock_outfits unless @api_key.present?

    prompt = build_prompt
    response = call_model(prompt)

    begin
      parsed = JSON.parse(response)
      parsed['outfits'] || []
    rescue JSON::ParserError => e
      Rails.logger.error "Failed to parse stylist response: #{e.message}"
      mock_outfits
    end
  end

  private

  def build_prompt
    temp = @weather[:temperature_c] || @weather['temperature_c']
    conditions = @weather[:condition_text] || @weather['condition_text'] || 'clear'

    {
      weather: format_weather,
      items: format_items,
      context: build_weather_context(temp, conditions)
    }.to_json
  end

  def format_weather
    temp = @weather[:temperature_c] || @weather['temperature_c']
    conditions = @weather[:condition_text] || @weather['condition_text'] || 'clear'

    {
      temperature: temp,
      conditions: conditions,
      season: determine_season,
      weather_priority: determine_weather_priority(temp, conditions),
      clothing_guidance: generate_clothing_guidance(temp, conditions)
    }
  end

  def determine_weather_priority(temp, conditions)
    return 'extreme_heat' if temp && temp >= 30
    return 'cold_protection' if temp && temp <= 10
    return 'rain_protection' if conditions.to_s.downcase.include?('rain')
    'moderate'
  end

  def generate_clothing_guidance(temp, conditions)
    guidance = []

    # Temperature guidance
    if temp
      guidance << 'Require breathable, lightweight fabrics' if temp >= 28
      guidance << 'Strongly prefer short sleeves or sleeveless' if temp >= 26
      guidance << 'Require outerwear for warmth' if temp <= 12
      guidance << 'Prefer long sleeves' if temp <= 15
    end

    # Condition guidance
    if conditions.to_s.downcase.include?('rain')
      guidance << 'Require waterproof or water-resistant outerwear'
    end
    if conditions.to_s.downcase.include?('sun') && temp && temp >= 25
      guidance << 'Consider sun protection accessories'
    end

    guidance
  end

  def build_weather_context(temp, conditions)
    parts = []

    if temp
      if temp >= 30
        parts << 'Very hot weather - prioritize cooling and sun protection'
      elsif temp >= 25
        parts << 'Hot weather - focus on breathable, light fabrics'
      elsif temp <= 10
        parts << 'Cold weather - warmth is essential, require outerwear'
      elsif temp <= 15
        parts << 'Cool weather - consider layering'
      else
        parts << 'Moderate weather - comfortable clothing focus'
      end
    end

    if conditions.to_s.downcase.include?('rain')
      parts << 'Rain protection is mandatory'
    end

    parts.join('. ')
  end

  def format_items
    formatted = {}
    @items.each do |category, items|
      formatted[category] = items.map do |item|
        {
          name: item.name,
          colors: item.colors || [],
          materials: item.materials || [],
          tags: combine_tags(item)
        }
      end
    end
    formatted
  end

  def combine_tags(item)
    tags = []
    tags += item.ai_tags.values.flatten if item.ai_tags.is_a?(Hash)
    tags += item.ai_tags if item.ai_tags.is_a?(Array)
    tags += item.user_tags.values.flatten if item.user_tags.is_a?(Hash)
    tags += item.user_tags if item.user_tags.is_a?(Array)
    tags.flatten.compact.uniq
  end

  def determine_season
    temp = @weather[:temperature_c] || @weather['temperature_c'] || 20
    case temp
    when 0..5 then 'cold winter'
    when 6..10 then 'winter'
    when 11..15 then 'cool spring/fall'
    when 16..20 then 'mild spring/fall'
    when 21..25 then 'warm spring/summer'
    when 26..30 then 'hot summer'
    when 31..Float::INFINITY then 'very hot summer'
    else 'mild'
    end
  end

  def call_model(prompt)
    uri = URI('https://api.openai.com/v1/chat/completions')
    req = Net::HTTP::Post.new(uri)
    req['Authorization'] = "Bearer #{@api_key}"
    req['Content-Type'] = 'application/json'

    req.body = {
      model: 'gpt-4o-mini',
      temperature: 0.7,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ]
    }.to_json

    res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
      http.request(req)
    end

    response_body = JSON.parse(res.body)

    if res.code.to_i >= 400
      Rails.logger.error "OpenAI API error: #{response_body}"
      raise "API request failed: #{response_body['error']&.[]('message') || 'Unknown error'}"
    end

    response_body['choices'][0]['message']['content']
  end

  # Fallback mock outfits when API is not available
  def mock_outfits
    temp = @weather[:temperature_c] || @weather['temperature_c'] || 20
    condition = (@weather[:condition_text] || @weather['condition_text'] || '').downcase

    outfits = []

    # Get available items
    tops = @items['tops'] || @items[:tops] || []
    bottoms = @items['bottoms'] || @items[:bottoms] || []
    shoes = @items['shoes'] || @items[:shoes] || []
    outerwear = @items['outerwear'] || @items[:outerwear] || []

    # Filter items by weather appropriateness
    filtered_tops = filter_by_weather(tops, temp, condition)
    filtered_bottoms = filter_by_weather(bottoms, temp, condition)
    filtered_shoes = filter_by_weather(shoes, temp, condition)
    filtered_outerwear = filter_by_weather(outerwear, temp, condition)

    # Fallback to all items if filtered list is empty
    filtered_tops = tops if filtered_tops.empty?
    filtered_bottoms = bottoms if filtered_bottoms.empty?
    filtered_shoes = shoes if filtered_shoes.empty?

    # Generate weather-appropriate outfits
    if temp < 12 && outerwear.any?
      # Cold weather - require outerwear
      warm_outerwear = filtered_outerwear.find { |o| has_tag?(o, [ 'warm', 'winter', 'wool', 'fleece', 'down' ]) } || filtered_outerwear.first

      outfits << {
        'description' => "Warm layered outfit for cold weather (#{temp}°C) — stay cozy and protected.",
        'items' => {
          'top' => select_item(filtered_tops, 0)&.name || 'Top',
          'bottom' => select_item(filtered_bottoms, 0)&.name || 'Bottom',
          'shoes' => select_item(filtered_shoes, 0)&.name || 'Shoes',
          'outerwear' => warm_outerwear&.name
        },
        'style_tags' => [ 'warm', 'layered', 'winter', determine_season ]
      }
    elsif temp >= 28
      # Hot weather - prefer breathable fabrics
      outfits << {
        'description' => "Light and breathable outfit for hot weather (#{temp}°C) — stay cool and comfortable.",
        'items' => {
          'top' => select_item(filtered_tops, 0)&.name || 'Top',
          'bottom' => select_item(filtered_bottoms, 0)&.name || 'Bottom',
          'shoes' => select_item(filtered_shoes, 0)&.name || 'Shoes'
        },
        'style_tags' => [ 'breathable', 'lightweight', 'summer', determine_season ]
      }
    elsif condition.include?('rain') && outerwear.any?
      # Rainy weather - require waterproof outerwear
      waterproof = filtered_outerwear.find { |o| has_material?(o, [ 'waterproof', 'nylon', 'polyester', 'rain' ]) }
      outfits << {
        'description' => 'Weather-resistant outfit for rainy conditions — stay dry and stylish.',
        'items' => {
          'top' => select_item(filtered_tops, 0)&.name || 'Top',
          'bottom' => select_item(filtered_bottoms, 0)&.name || 'Bottom',
          'shoes' => select_item(filtered_shoes, 0)&.name || 'Shoes',
          'outerwear' => (waterproof || filtered_outerwear.first)&.name
        },
        'style_tags' => [ 'waterproof', 'practical', 'rainy-day' ]
      }
    else
      # Moderate weather
      outfits << {
        'description' => "Comfortable outfit for pleasant #{temp}°C weather — perfect for the day.",
        'items' => {
          'top' => select_item(filtered_tops, 0)&.name || 'Top',
          'bottom' => select_item(filtered_bottoms, 0)&.name || 'Bottom',
          'shoes' => select_item(filtered_shoes, 0)&.name || 'Shoes'
        },
        'style_tags' => [ 'comfortable', 'versatile', determine_season ]
      }
    end

    # Add a second outfit with variety
    if filtered_tops.length > 1 && filtered_bottoms.length > 1 && filtered_shoes.length > 1
      outfits << {
        'description' => "Alternative look with different items for #{temp}°C weather.",
        'items' => {
          'top' => select_item(filtered_tops, 1)&.name || filtered_tops.first&.name,
          'bottom' => select_item(filtered_bottoms, 1)&.name || filtered_bottoms.first&.name,
          'shoes' => select_item(filtered_shoes, 1)&.name || filtered_shoes.first&.name
        },
        'style_tags' => [ 'alternative', 'stylish', determine_season ]
      }
    end

    outfits
  end

  # Filter items by weather appropriateness
  def filter_by_weather(items, temp, condition)
    return items if items.empty?

    weather_appropriate = items.select do |item|
      if temp >= 28
        # Hot weather - prefer lightweight, breathable
        has_tag?(item, [ 'lightweight', 'breathable', 'summer', 'short-sleeve', 'sleeveless', 'cotton', 'linen' ]) ||
        has_material?(item, [ 'cotton', 'linen' ])
      elsif temp <= 12
        # Cold weather - prefer warm materials
        has_tag?(item, [ 'warm', 'winter', 'wool', 'fleece', 'long-sleeve', 'thermal' ]) ||
        has_material?(item, [ 'wool', 'fleece', 'down', 'cashmere' ])
      elsif condition.include?('rain')
        # Rainy - waterproof items
        has_tag?(item, [ 'waterproof', 'water-resistant', 'rain' ]) ||
        has_material?(item, [ 'waterproof', 'nylon', 'polyester' ])
      else
        # Moderate weather - all items suitable
        true
      end
    end

    # Return filtered items, or all items if filter is too restrictive
    weather_appropriate.any? ? weather_appropriate : items
  end

  # Select item from array with rotation
  def select_item(items, index)
    return nil if items.empty?
    items[index % items.length]
  end

  # Check if item has any of the specified tags
  def has_tag?(item, tags_to_check)
    return false unless item

    all_tags = combine_tags(item).map(&:to_s).map(&:downcase)
    tags_to_check.any? { |tag| all_tags.include?(tag.downcase) }
  end

  # Check if item has any of the specified materials
  def has_material?(item, materials_to_check)
    return false unless item && item.materials

    item_materials = (item.materials || []).map(&:to_s).map(&:downcase)
    materials_to_check.any? { |mat| item_materials.any? { |im| im.include?(mat.downcase) } }
  end
end
