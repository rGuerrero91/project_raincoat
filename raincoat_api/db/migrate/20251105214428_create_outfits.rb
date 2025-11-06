class CreateOutfits < ActiveRecord::Migration[8.0]
  def change
    create_table :outfits do |t|
      t.references :user, null: false, foreign_key: true
      t.decimal :weather_temperature, precision: 4, scale: 1
      t.string :weather_condition
      t.string :season
      t.text :description
      t.json :style_tags, default: []
      t.json :metadata

      t.timestamps
    end

    add_index :outfits, [:user_id, :created_at]
    add_index :outfits, :weather_condition
  end
end
