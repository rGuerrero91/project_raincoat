class WeatherService
  include HTTParty
  base_uri 'http://api.weatherapi.com/v1'

  def initialize(api_key = nil)
    @api_key = api_key || ENV['WEATHER_API_KEY']
    raise 'WEATHER_API_KEY not configured' unless @api_key
  end

  # Fetch current weather for a location
  # @param location [Location] Location model instance
  # @return [WeatherSnapshot] Cached or newly created snapshot
  def fetch_current_weather(location)
    # Check cache first
    cached = location.weather_snapshots.recent.order(recorded_at: :desc).first
    return cached if cached&.fresh?

    # Fetch from API
    response = self.class.get('/current.json',
      query: {
        key: @api_key,
        q: location.coordinates,
        aqi: 'no'
      }
    )

    if response.success?
      create_snapshot_from_response(location, response)
    else
      Rails.logger.error "WeatherAPI error: #{response.code} - #{response.message}"
      # Return stale cache if available
      location.weather_snapshots.order(recorded_at: :desc).first
    end
  rescue StandardError => e
    Rails.logger.error "Weather fetch error: #{e.message}"
    # Return most recent snapshot as fallback
    location.weather_snapshots.order(recorded_at: :desc).first
  end

  # Fetch weather for multiple locations (batch)
  def fetch_for_user(user)
    user.locations.map { |location| fetch_current_weather(location) }.compact
  end

  # Search for location by name (for user setup)
  # @param query [String] City name or coordinates
  # @return [Array<Hash>] Array of location results
  def search_location(query)
    response = self.class.get('/search.json',
      query: {
        key: @api_key,
        q: query
      }
    )

    if response.success?
      response.parsed_response.map do |result|
        {
          name: result['name'],
          region: result['region'],
          country: result['country'],
          latitude: result['lat'],
          longitude: result['lon'],
          timezone: result['tz_id']
        }
      end
    else
      []
    end
  end

  private

  def create_snapshot_from_response(location, response)
    data = response.parsed_response
    current = data['current']

    location.weather_snapshots.create!(
      temperature_c: current['temp_c'],
      temperature_f: current['temp_f'],
      feels_like_c: current['feelslike_c'],
      feels_like_f: current['feelslike_f'],
      condition_text: current['condition']['text'],
      condition_code: current['condition']['code'],
      condition_icon_url: current['condition']['icon'],
      humidity: current['humidity'],
      wind_kph: current['wind_kph'],
      wind_mph: current['wind_mph'],
      wind_direction: current['wind_dir'],
      precipitation_mm: current['precip_mm'],
      uv_index: current['uv'],
      cloud_coverage: current['cloud'],
      recorded_at: Time.zone.parse(data['location']['localtime']),
      fetched_at: Time.current,
      raw_response: data
    )
  end
end
