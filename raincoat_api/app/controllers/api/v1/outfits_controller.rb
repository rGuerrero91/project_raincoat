class Api::V1::OutfitsController < ApplicationController
  before_action :set_user
  before_action :set_outfit, only: [:show, :destroy]

  # GET /api/v1/outfits
  # Get all saved outfits for the user
  def index
    @outfits = @user.outfits.recent.includes(outfit_items: :clothing_piece)

    # Optional filtering
    if params[:weather_condition].present?
      @outfits = @outfits.for_weather(params[:weather_condition])
    end

    render json: @outfits, include: {
      outfit_items: {
        include: {
          clothing_piece: {
            methods: [:image_url],
            only: [:id, :name, :category, :colors, :materials, :ai_tags, :user_tags]
          }
        }
      }
    }
  end

  # POST /outfits/generate
  # Generate new outfit recommendations based on weather
  def generate
    weather_data = fetch_weather_data

    # Get user's clothing items grouped by category
    items_by_category = fetch_user_clothing_by_category

    # Generate outfits using the stylist model
    stylist = StylistModel.new(
      weather: weather_data,
      items: items_by_category
    )

    outfit_recommendations = stylist.generate_outfits

    # Serialize outfits with full clothing piece data including images
    serialized_outfits = outfit_recommendations.map do |outfit|
      serialized_items = {}

      outfit["items"]&.each do |slot, item_name|
        # Find the clothing piece by name
        piece = items_by_category.values.flatten.find { |p| p.name == item_name }

        if piece
          serialized_items[slot] = serialize_clothing_piece(piece)
        end
      end

      {
        description: outfit["description"],
        items: serialized_items,
        style_tags: outfit["style_tags"]
      }
    end

    render json: {
      weather: weather_data,
      recommendations: serialized_outfits,
      available_items: items_by_category.transform_values(&:count)
    }
  rescue => e
    Rails.logger.error "Outfit generation failed: #{e.message}"
    Rails.logger.error e.backtrace.join("\n")
    render json: { error: "Failed to generate outfits: #{e.message}" }, status: :unprocessable_entity
  end

  # POST /outfits
  # Save a generated outfit
  def create
    @outfit = @user.outfits.build(outfit_params)

    if @outfit.save
      # Add clothing items to the outfit
      if params[:items].present?
        params[:items].each do |slot, piece_data|
          piece_id = piece_data.is_a?(Hash) ? piece_data[:id] : piece_data
          clothing_piece = @user.clothing_pieces.find_by(id: piece_id)

          if clothing_piece
            @outfit.outfit_items.create!(
              clothing_piece: clothing_piece,
              slot: slot,
              position: 0
            )
          end
        end
      end

      render json: @outfit, status: :created
    else
      render json: @outfit.errors, status: :unprocessable_entity
    end
  end

  # GET /outfits/:id
  def show
    render json: @outfit
  end

  # DELETE /outfits/:id
  def destroy
    @outfit.destroy
    head :no_content
  end

  private

  def set_user
    # For now, use the first user or user from params
    @user = if params[:user_id].present?
              User.find(params[:user_id])
            else
              User.first
            end

    unless @user
      render json: { error: "User not found" }, status: :not_found
    end
  end

  def set_outfit
    @outfit = @user.outfits.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Outfit not found" }, status: :not_found
  end

  def fetch_weather_data
    # Check if weather data is provided in params
    if params[:weather].present?
      weather_params = params[:weather].permit(:temperature_c, :temperature_f, :condition_text, :humidity, :precipitation_mm)
      # Convert string params to numeric types (required in Ruby 3.4+)
      return {
        temperature_c: weather_params[:temperature_c].to_f,
        temperature_f: weather_params[:temperature_f]&.to_f,
        condition_text: weather_params[:condition_text],
        humidity: weather_params[:humidity]&.to_i,
        precipitation_mm: weather_params[:precipitation_mm]&.to_f
      }
    end

    # Otherwise, fetch from user's default location
    location = @user.default_location

    if location
      # Only use cached weather if it's less than 6 hours old
      six_hours_ago = 6.hours.ago
      latest_weather = location.weather_snapshots
                               .where('recorded_at > ?', six_hours_ago)
                               .order(recorded_at: :desc)
                               .first

      # If we have fresh cached weather, use it
      if latest_weather
        {
          temperature_c: latest_weather.temperature_c,
          temperature_f: latest_weather.temperature_f,
          condition_text: latest_weather.condition_text,
          humidity: latest_weather.humidity,
          precipitation_mm: latest_weather.precipitation_mm
        }
      else
        # Otherwise fetch fresh weather from API
        weather_service = WeatherService.new
        snapshot = weather_service.fetch_current_weather(location)

        if snapshot
          {
            temperature_c: snapshot.temperature_c,
            temperature_f: snapshot.temperature_f,
            condition_text: snapshot.condition_text,
            humidity: snapshot.humidity,
            precipitation_mm: snapshot.precipitation_mm
          }
        else
          # Fallback to default weather if API fails
          { temperature_c: 20, condition_text: "Clear", humidity: 50, precipitation_mm: 0 }
        end
      end
    else
      # Default weather if no location
      { temperature_c: 20, condition_text: "Clear", humidity: 50, precipitation_mm: 0 }
    end
  end

  def fetch_user_clothing_by_category
    categories = %w[tops bottoms shoes outerwear accessories]
    items = {}

    categories.each do |category|
      items[category] = @user.clothing_pieces.where(category: category).to_a
    end

    items
  end

  def outfit_params
    params.require(:outfit).permit(
      :weather_temperature,
      :weather_condition,
      :season,
      :description,
      style_tags: [],
      metadata: {}
    )
  end

  def serialize_clothing_piece(piece)
    {
      id: piece.id,
      name: piece.name,
      description: piece.description,
      category: piece.category,
      brand: piece.brand,
      colors: piece.colors,
      materials: piece.materials,
      ai_tags: piece.ai_tags,
      user_tags: piece.user_tags,
      has_embedding: piece.clothing_embedding.present?,
      images: piece.images.attached? ? piece.images.map { |img| url_for(img) } : []
    }
  end
end
