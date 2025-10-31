class Api::V1::LocationsController < Api::V1::BaseController
  before_action :set_location, only: [:show, :update, :destroy, :set_default, :current_weather]

  # GET /api/v1/locations
  def index
    locations = current_user.locations.order(is_default: :desc, created_at: :desc)

    render json: {
      success: true,
      data: locations.map { |loc| serialize_location(loc) },
      meta: {
        total: locations.count,
        default_location_id: current_user.default_location&.id
      }
    }
  end

  # GET /api/v1/locations/:id
  def show
    render json: {
      success: true,
      data: serialize_location(@location, include_weather: true)
    }
  end

  # POST /api/v1/locations
  def create
    location = current_user.locations.build(location_params)

    # Set as default if first location
    location.is_default = true if current_user.locations.count == 0

    if location.save
      render json: {
        success: true,
        message: 'Location created successfully',
        data: serialize_location(location)
      }, status: :created
    else
      render json: {
        success: false,
        error: 'Failed to create location',
        details: location.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  # PATCH /api/v1/locations/:id
  def update
    if @location.update(location_params)
      render json: {
        success: true,
        message: 'Location updated successfully',
        data: serialize_location(@location)
      }
    else
      render_error('Failed to update location', :unprocessable_entity)
    end
  end

  # DELETE /api/v1/locations/:id
  def destroy
    @location.destroy
    render_success({}, 'Location deleted successfully')
  end

  # POST /api/v1/locations/:id/set_default
  def set_default
    # Unset all other defaults
    current_user.locations.update_all(is_default: false)
    @location.update(is_default: true)

    render_success({ location: serialize_location(@location) }, 'Default location updated')
  end

  # GET /api/v1/locations/:id/current_weather
  def current_weather
    weather_service = WeatherService.new
    snapshot = weather_service.fetch_current_weather(@location)

    if snapshot
      render json: {
        success: true,
        data: {
          location: serialize_location(@location),
          weather: serialize_weather_snapshot(snapshot)
        }
      }
    else
      render_error('Failed to fetch weather data')
    end
  end

  # GET /api/v1/locations/search?q=London
  def search
    query = params[:q]
    return render_error('Query parameter required') if query.blank?

    weather_service = WeatherService.new
    results = weather_service.search_location(query)

    render json: {
      success: true,
      data: results,
      meta: {
        query: query,
        results_count: results.length
      }
    }
  end

  private

  def set_location
    @location = current_user.locations.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render_error('Location not found', :not_found)
  end

  def location_params
    params.require(:location).permit(:name, :city, :state, :country,
                                     :latitude, :longitude, :timezone, :is_default)
  end

  def serialize_location(location, include_weather: false)
    data = {
      id: location.id,
      name: location.name,
      city: location.city,
      state: location.state,
      country: location.country,
      latitude: location.latitude,
      longitude: location.longitude,
      timezone: location.timezone,
      is_default: location.is_default,
      display_name: location.display_name,
      created_at: location.created_at,
      updated_at: location.updated_at
    }

    if include_weather
      recent_weather = location.weather_snapshots.order(recorded_at: :desc).first
      data[:current_weather] = recent_weather ? serialize_weather_snapshot(recent_weather) : nil
    end

    data
  end

  def serialize_weather_snapshot(snapshot)
    {
      id: snapshot.id,
      temperature_c: snapshot.temperature_c,
      temperature_f: snapshot.temperature_f,
      feels_like_c: snapshot.feels_like_c,
      feels_like_f: snapshot.feels_like_f,
      condition_text: snapshot.condition_text,
      condition_icon_url: snapshot.condition_icon_url,
      humidity: snapshot.humidity,
      wind_kph: snapshot.wind_kph,
      precipitation_mm: snapshot.precipitation_mm,
      uv_index: snapshot.uv_index,
      cloud_coverage: snapshot.cloud_coverage,
      fashion_descriptors: snapshot.fashion_descriptors,
      temperature_category: snapshot.temperature_category,
      recorded_at: snapshot.recorded_at,
      is_fresh: snapshot.fresh?
    }
  end
end
