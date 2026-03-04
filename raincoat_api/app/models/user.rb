class User < ApplicationRecord
  devise :database_authenticatable,
         :registerable,
         :validatable,
         :jwt_authenticatable,
         jwt_revocation_strategy: JwtDenylist

  has_many :clothing_items, dependent: :destroy
  has_many :locations, dependent: :destroy
  has_many :weather_snapshots, through: :locations
  has_many :outfits, dependent: :destroy

  validates :name, presence: true

  before_create { self.jti = SecureRandom.uuid }
  before_save :normalize_email

  def default_location
    locations.find_by(is_default: true) || locations.first
  end

  private

  def normalize_email
    self.email = email.downcase.strip if email.present?
  end
end
