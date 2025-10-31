class Api::V1::WeatherController < Api::V1::BaseController

  # GET /api/v1/weather/current
  # Returns weather for user's default location
  def current
    location = current_user.default_location

    unless location
      return render_error('No default location set. Please create a location first.')
    end

    cache_service = WeatherCacheService.new
    weather_data = cache_service.fetch_or_cache(location)

    if weather_data
      render json: {
        success: true,
        data: {
          location: {
            id: location.id,
            name: location.name,
            city: location.city
          },
          weather: weather_data
        }
      }
    else
      render_error('Failed to fetch weather data')
    end
  end

  # GET /api/v1/weather/recommendations
  # Returns clothing recommendations based on current weather
  def recommendations
    location = current_user.default_location
    unless location
      return render_error('No default location set')
    end

    weather_service = WeatherService.new
    snapshot = weather_service.fetch_current_weather(location)

    unless snapshot
      return render_error('Failed to fetch weather data')
    end

    # Get fashion descriptors from weather
    descriptors = snapshot.fashion_descriptors

    # Find clothing pieces matching weather conditions
    recommended_pieces = find_weather_appropriate_clothing(descriptors, snapshot.temperature_category)

    render json: {
      success: true,
      data: {
        weather: serialize_weather_snapshot(snapshot),
        recommendations: {
          descriptors: descriptors,
          temperature_category: snapshot.temperature_category,
          suggested_pieces: recommended_pieces.map { |piece| serialize_clothing_piece(piece) }
        }
      }
    }
  end

  # POST /api/v1/weather/refresh
  # Force refresh weather data for default location
  def refresh
    location = current_user.default_location
    unless location
      return render_error('No default location set')
    end

    # Invalidate cache
    cache_service = WeatherCacheService.new
    cache_service.invalidate(location.id)

    # Fetch fresh data
    weather_service = WeatherService.new
    snapshot = weather_service.fetch_current_weather(location)

    if snapshot
      render json: {
        success: true,
        message: 'Weather data refreshed',
        data: serialize_weather_snapshot(snapshot)
      }
    else
      render_error('Failed to refresh weather data')
    end
  end

  private

  def find_weather_appropriate_clothing(descriptors, temperature_category)
    # Search through user's clothing for matching tags
    pieces = current_user.clothing_pieces.includes(:clothing_embedding)

    matching_pieces = pieces.select do |piece|
      tags = (piece.ai_tags.values.flatten + piece.user_tags.values.flatten).map(&:to_s).map(&:downcase)

      # Check if any descriptor matches tags
      descriptors.any? { |descriptor| tags.include?(descriptor.downcase) } ||
      tags.include?(temperature_category)
    end

    # Return top 20 matches
    matching_pieces.first(20)
  end

  def serialize_weather_snapshot(snapshot)
    {
      id: snapshot.id,
      temperature_c: snapshot.temperature_c,
      temperature_f: snapshot.temperature_f,
      feels_like_c: snapshot.feels_like_c,
      condition_text: snapshot.condition_text,
      condition_icon_url: snapshot.condition_icon_url,
      humidity: snapshot.humidity,
      wind_kph: snapshot.wind_kph,
      precipitation_mm: snapshot.precipitation_mm,
      fashion_descriptors: snapshot.fashion_descriptors,
      temperature_category: snapshot.temperature_category,
      recorded_at: snapshot.recorded_at,
      is_fresh: snapshot.fresh?
    }
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
