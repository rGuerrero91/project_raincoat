class OutfitItem < ApplicationRecord
  belongs_to :outfit
  belongs_to :clothing_piece

  # Validations
  validates :slot, presence: true, inclusion: { in: %w[top bottom shoes outerwear accessories] }
  validates :clothing_piece_id, uniqueness: { scope: :outfit_id, message: "cannot be added to the same outfit twice" }

  # Scopes
  scope :by_position, -> { order(:position) }
end
