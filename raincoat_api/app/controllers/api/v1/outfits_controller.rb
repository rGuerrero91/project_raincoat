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

    render json: {
      weather: weather_data,
      recommendations: outfit_recommendations,
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
      return params[:weather].permit(:temperature_c, :condition_text, :humidity, :precipitation_mm).to_h
    end

    # Otherwise, fetch from user's default location
    location = @user.default_location

    if location
      latest_weather = location.weather_snapshots.order(recorded_at: :desc).first

      if latest_weather
        {
          temperature_c: latest_weather.temperature_c,
          temperature_f: latest_weather.temperature_f,
          condition_text: latest_weather.condition_text,
          humidity: latest_weather.humidity,
          precipitation_mm: latest_weather.precipitation_mm
        }
      else
        # Default weather if no data available
        { temperature_c: 20, condition_text: "Clear", humidity: 50, precipitation_mm: 0 }
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
end
