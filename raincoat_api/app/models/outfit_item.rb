class OutfitItem < ApplicationRecord
  belongs_to :outfit
  belongs_to :clothing_item

  # Validations
  validates :slot, presence: true, inclusion: { in: %w[top bottom shoes outerwear accessories] }
  validates :clothing_item_id, uniqueness: { scope: :outfit_id, message: "cannot be added to the same outfit twice" }

  # Scopes
  scope :by_position, -> { order(:position) }
end
