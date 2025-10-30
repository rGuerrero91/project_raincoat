class WeatherCacheService
  CACHE_DURATION = 30.minutes

  def initialize
    @redis = Redis.new(url: ENV['REDIS_URL'] || 'redis://localhost:6379/0')
  end

  # Get cached weather for location
  def get(location_id)
    key = cache_key(location_id)
    cached_data = @redis.get(key)

    if cached_data
      JSON.parse(cached_data, symbolize_names: true)
    else
      nil
    end
  end

  # Cache weather snapshot
  def set(location_id, weather_data)
    key = cache_key(location_id)
    @redis.setex(key, CACHE_DURATION.to_i, weather_data.to_json)
  end

  # Invalidate cache for location
  def invalidate(location_id)
    @redis.del(cache_key(location_id))
  end

  # Fetch weather with cache fallback
  def fetch_or_cache(location)
    cached = get(location.id)
    return cached if cached

    # Fetch from WeatherService
    weather_service = WeatherService.new
    snapshot = weather_service.fetch_current_weather(location)

    if snapshot
      # Cache the snapshot
      set(location.id, serialize_snapshot(snapshot))
      serialize_snapshot(snapshot)
    end
  end

  private

  def cache_key(location_id)
    "weather:location:#{location_id}"
  end

  def serialize_snapshot(snapshot)
    {
      id: snapshot.id,
      location_id: snapshot.location_id,
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
      recorded_at: snapshot.recorded_at.iso8601,
      fresh: snapshot.fresh?
    }
  end
end
