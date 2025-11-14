class Api::V1::WeatherController < Api::V1::BaseController

  # GET /api/v1/weather/current
  # Returns weather for user's default location, or specified city/country
  # Params: city (optional), country (optional)
  def current
    # If city/country params provided, find or use that location
    if params[:city].present?
      location = current_user.locations.find_by(
        city: params[:city],
        country: params[:country]
      )

      # If location doesn't exist in user's locations, still try to fetch weather
      unless location
        # Use WeatherService directly with city/country
        weather_service = WeatherService.new
        snapshot = weather_service.fetch_weather_by_city(params[:city], params[:country])

        if snapshot
          return render json: {
            success: true,
            data: {
              location: {
                city: params[:city],
                country: params[:country]
              },
              weather: serialize_weather_snapshot(snapshot)
            }
          }
        else
          return render_error('Failed to fetch weather data for specified location')
        end
      end
    else
      # Use default location
      location = current_user.default_location

      unless location
        return render_error('No default location set. Please create a location first.')
      end
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

    # Find clothing items matching weather conditions
    recommended_items = find_weather_appropriate_clothing(descriptors, snapshot.temperature_category)

    render json: {
      success: true,
      data: {
        weather: serialize_weather_snapshot(snapshot),
        recommendations: {
          descriptors: descriptors,
          temperature_category: snapshot.temperature_category,
          suggested_items: recommended_items.map { |item| serialize_clothing_item(item) }
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
    items = current_user.clothing_items.includes(:clothing_embedding)

    matching_items = items.select do |item|
      # Extract tags from both ai_tags and user_tags (handle nil and both hash/array formats)
      ai_tags_values = extract_tag_values(item.ai_tags)
      user_tags_values = extract_tag_values(item.user_tags)
      tags = (ai_tags_values + user_tags_values).map(&:to_s).map(&:downcase)

      # Check if any descriptor matches tags
      descriptors.any? { |descriptor| tags.include?(descriptor.downcase) } ||
      tags.include?(temperature_category.to_s.downcase)
    end

    # Return top 20 matches
    matching_items.first(20)
  end

  def extract_tag_values(tag_data)
    return [] if tag_data.nil?

    case tag_data
    when Hash
      # If it's a hash, get all values and flatten arrays
      tag_data.values.flatten
    when Array
      # If it's already an array, just flatten it
      tag_data.flatten
    else
      # If it's something else, convert to array and process again
      extract_tag_values([tag_data])
    end
  end

  def serialize_weather_snapshot(snapshot)
    # Handle both WeatherSnapshot models and hash responses
    if snapshot.is_a?(Hash)
      {
        temperature_c: snapshot[:temperature_c],
        temperature_f: snapshot[:temperature_f],
        feels_like_c: snapshot[:feels_like_c],
        condition_text: snapshot[:condition_text],
        condition_icon_url: snapshot[:condition_icon_url],
        humidity: snapshot[:humidity],
        wind_kph: snapshot[:wind_kph],
        precipitation_mm: snapshot[:precipitation_mm],
        recorded_at: snapshot[:recorded_at],
        fresh: snapshot[:fresh]
      }
    else
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
        fresh: snapshot.fresh?
      }
    end
  end

  def serialize_clothing_item(item)
    {
      id: item.id,
      name: item.name,
      description: item.description,
      category: item.category,
      brand: item.brand,
      colors: item.colors,
      materials: item.materials,
      ai_tags: item.ai_tags,
      user_tags: item.user_tags,
      has_embedding: item.clothing_embedding.present?,
      images: item.images.attached? ? item.images.map { |img| url_for(img) } : []
    }
  end
end
