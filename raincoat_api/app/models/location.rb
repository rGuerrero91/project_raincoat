class Location < ApplicationRecord
  belongs_to :user
  has_many :weather_snapshots, dependent: :destroy

  validates :name, presence: true
  validates :city, presence: true
  validates :country, presence: true
  validates :latitude, presence: true, numericality: { greater_than_or_equal_to: -90, less_than_or_equal_to: 90 }
  validates :longitude, presence: true, numericality: { greater_than_or_equal_to: -180, less_than_or_equal_to: 180 }

  scope :active, -> { where(is_default: true).or(where(is_default: false)) }

  def coordinates
    "#{latitude},#{longitude}"
  end

  def display_name
    "#{name} (#{city}, #{country})"
  end
end
