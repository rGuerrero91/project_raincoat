class CreateWeatherSnapshots < ActiveRecord::Migration[8.0]
  def change
    create_table :weather_snapshots do |t|
      t.references :location, null: false, foreign_key: true

      # Core weather data
      t.decimal :temperature_c, precision: 4, scale: 1, null: false
      t.decimal :temperature_f, precision: 4, scale: 1
      t.decimal :feels_like_c, precision: 4, scale: 1
      t.decimal :feels_like_f, precision: 4, scale: 1

      # Condition
      t.string :condition_text, null: false
      t.string :condition_code
      t.string :condition_icon_url

      # Additional metrics
      t.integer :humidity
      t.decimal :wind_kph, precision: 5, scale: 2
      t.decimal :wind_mph, precision: 5, scale: 2
      t.string :wind_direction
      t.decimal :precipitation_mm, precision: 5, scale: 2
      t.decimal :uv_index, precision: 3, scale: 1
      t.integer :cloud_coverage

      # Timestamps
      t.datetime :recorded_at, null: false
      t.datetime :fetched_at

      # Raw API response
      t.json :raw_response

      t.timestamps
    end

    add_index :weather_snapshots, [:location_id, :recorded_at]
    add_index :weather_snapshots, :condition_text
  end
end
