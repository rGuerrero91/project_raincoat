class CreateClothingPieces < ActiveRecord::Migration[8.0]
  def change
    create_table :clothing_pieces do |t|
      t.references :user, null: false, foreign_key: true
      t.string :name
      t.text :description
      t.string :category
      t.json :colors
      t.json :materials
      t.json :weather_suitability
      t.json :ai_tags
      t.json :user_tags
      t.date :purchase_date
      t.string :brand

      t.timestamps
    end
  end
end
