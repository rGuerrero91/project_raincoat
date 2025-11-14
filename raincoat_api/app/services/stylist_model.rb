# app/services/stylist_model.rb
require 'net/http'
require 'json'

class StylistModel
  SYSTEM_PROMPT = <<~PROMPT
    You are Raincoat's stylist AI assistant.
    Your job is to assemble stylish, weather-appropriate outfits from a user's wardrobe.

    You receive:
    1. The current weather (temperature, conditions, season)
    2. The user's available clothing items, grouped by category (tops, bottoms, shoes, outerwear, accessories)

    Rules:
    - Always return 1 to 3 complete outfits.
    - Each outfit must include at least: top, bottom, and shoes. Add outerwear if weather requires it.
    - Prefer items that are water-resistant, warm, or breathable depending on the weather.
    - Match colors and formality levels (e.g., casual with casual, formal with formal).
    - Avoid repeating the same item across multiple outfits when possible.
    - Consider the materials and their suitability for the weather conditions.
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
      parsed["outfits"] || []
    rescue JSON::ParserError => e
      Rails.logger.error "Failed to parse stylist response: #{e.message}"
      mock_outfits
    end
  end

  private

  def build_prompt
    {
      weather: format_weather,
      items: format_items
    }.to_json
  end

  def format_weather
    {
      temperature: @weather[:temperature_c] || @weather["temperature_c"],
      conditions: @weather[:condition_text] || @weather["condition_text"] || "clear",
      season: determine_season
    }
  end

  def format_items
    formatted = {}
    @items.each do |category, pieces|
      formatted[category] = pieces.map do |piece|
        {
          name: piece.name,
          colors: piece.colors || [],
          materials: piece.materials || [],
          tags: combine_tags(piece)
        }
      end
    end
    formatted
  end

  def combine_tags(piece)
    tags = []
    tags += piece.ai_tags.values.flatten if piece.ai_tags.is_a?(Hash)
    tags += piece.ai_tags if piece.ai_tags.is_a?(Array)
    tags += piece.user_tags.values.flatten if piece.user_tags.is_a?(Hash)
    tags += piece.user_tags if piece.user_tags.is_a?(Array)
    tags.flatten.compact.uniq
  end

  def determine_season
    temp = @weather[:temperature_c] || @weather["temperature_c"] || 20
    case temp
    when 0..10 then "winter"
    when 11..18 then "spring/fall"
    when 19..Float::INFINITY then "summer"
    else "spring/fall"
    end
  end

  def call_model(prompt)
    uri = URI("https://api.openai.com/v1/chat/completions")
    req = Net::HTTP::Post.new(uri)
    req['Authorization'] = "Bearer #{@api_key}"
    req['Content-Type'] = 'application/json'

    req.body = {
      model: "gpt-4o-mini",
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt }
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

    response_body["choices"][0]["message"]["content"]
  end

  # Fallback mock outfits when API is not available
  def mock_outfits
    temp = @weather[:temperature_c] || @weather["temperature_c"] || 20
    condition = (@weather[:condition_text] || @weather["condition_text"] || "").downcase

    outfits = []

    # Get available items
    tops = @items["tops"] || @items[:tops] || []
    bottoms = @items["bottoms"] || @items[:bottoms] || []
    shoes = @items["shoes"] || @items[:shoes] || []
    outerwear = @items["outerwear"] || @items[:outerwear] || []

    # Generate outfit based on weather
    if temp < 15 && outerwear.any?
      # Cold weather outfit
      outfits << {
        "description" => "Warm layered outfit for cool weather — cozy and practical.",
        "items" => {
          "top" => tops.first&.name || "Top",
          "bottom" => bottoms.first&.name || "Bottom",
          "shoes" => shoes.first&.name || "Shoes",
          "outerwear" => outerwear.first&.name
        },
        "style_tags" => ["warm", "layered", "practical", determine_season]
      }
    elsif condition.include?("rain") && outerwear.any?
      # Rainy weather outfit
      waterproof = outerwear.find { |o| o.materials&.any? { |m| m.downcase.include?("waterproof") || m.downcase.include?("nylon") } }
      outfits << {
        "description" => "Weather-resistant outfit for rainy conditions.",
        "items" => {
          "top" => tops.first&.name || "Top",
          "bottom" => bottoms.first&.name || "Bottom",
          "shoes" => shoes.first&.name || "Shoes",
          "outerwear" => (waterproof || outerwear.first)&.name
        },
        "style_tags" => ["waterproof", "practical", "rainy-day"]
      }
    else
      # Default casual outfit
      outfits << {
        "description" => "Comfortable casual outfit for mild weather.",
        "items" => {
          "top" => tops.first&.name || "Top",
          "bottom" => bottoms.first&.name || "Bottom",
          "shoes" => shoes.first&.name || "Shoes"
        },
        "style_tags" => ["casual", "comfortable", determine_season]
      }
    end

    # Add a second outfit if we have enough items
    if tops.length > 1 && bottoms.length > 1 && shoes.length > 1
      outfits << {
        "description" => "Alternative stylish look with different pieces.",
        "items" => {
          "top" => tops[1]&.name || tops.first&.name,
          "bottom" => bottoms[1]&.name || bottoms.first&.name,
          "shoes" => shoes[1]&.name || shoes.first&.name
        },
        "style_tags" => ["versatile", "alternative", determine_season]
      }
    end

    outfits
  end
end
