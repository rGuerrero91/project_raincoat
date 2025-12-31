class Outfit < ApplicationRecord
  belongs_to :user
  has_many :outfit_items, dependent: :destroy
  has_many :clothing_items, through: :outfit_items

  # Scopes
  scope :for_weather, ->(condition) { where(weather_condition: condition) }
  scope :for_temperature_range, ->(min, max) { where(weather_temperature: min..max) }
  scope :recent, -> { order(created_at: :desc) }

  # Validations
  validates :weather_condition, presence: true
  validates :description, length: { maximum: 500 }

  # Methods
  def as_json(options = {})
    super(options.merge(
      include: {
        outfit_items: {
          include: {
            clothing_item: {
              methods: [ :image_url ],
              only: [ :id, :name, :category, :colors, :materials, :ai_tags, :user_tags ]
            }
          }
        }
      }
    ))
  end

  def items_by_slot
    outfit_items.includes(:clothing_item).group_by(&:slot).transform_values do |items|
      items.map(&:clothing_item)
    end
  end
end
