# app/models/user.rb
class User < ApplicationRecord
  has_many :clothing_pieces, dependent: :destroy
  
  validates :email, presence: true, uniqueness: { case_sensitive: false }
  validates :name, presence: true
  
  before_save :normalize_email
  
  private
  
  def normalize_email
    self.email = email.downcase.strip if email.present?
  end
end