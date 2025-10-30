class WeatherSnapshot < ApplicationRecord
  belongs_to :location

  validates :location_id, presence: true
  validates :temperature_c, presence: true
  validates :condition_text, presence: true
  validates :recorded_at, presence: true

  scope :recent, -> { where('recorded_at > ?', 1.hour.ago) }
  scope :for_location, ->(location_id) { where(location_id: location_id) }

  # Check if snapshot is still fresh (within 30 minutes)
  def fresh?
    recorded_at > 30.minutes.ago
  end

  # Get fashion descriptors based on weather rules
  def fashion_descriptors
    weather_rules = load_weather_rules
    # Normalize condition text for matching (lowercase, handle variations)
    normalized_condition = condition_text.downcase

    # Try exact match first
    descriptors = weather_rules[normalized_condition] || []

    # If no exact match, try partial matching
    if descriptors.empty?
      weather_rules.each do |condition, tags|
        if normalized_condition.include?(condition) || condition.include?(normalized_condition)
          descriptors = tags
          break
        end
      end
    end

    descriptors
  end

  # Temperature category
  def temperature_category
    case temperature_c
    when -Float::INFINITY...0 then 'freezing'
    when 0...10 then 'cold'
    when 10...20 then 'cool'
    when 20...25 then 'mild'
    when 25...30 then 'warm'
    when 30...35 then 'hot'
    else 'very_hot'
    end
  end

  private

  def load_weather_rules
    @weather_rules ||= JSON.parse(
      File.read(Rails.root.join('public', 'models', 'weather_rules.json'))
    )
  rescue => e
    Rails.logger.error "Failed to load weather rules: #{e.message}"
    {}
  end
end
