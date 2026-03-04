class AddDeviseToUsers < ActiveRecord::Migration[8.0]
  def change
    change_table :users, bulk: true do |t|
      ## Database authenticatable
      t.string :encrypted_password, null: false, default: ""

      ## Recoverable
      t.string   :reset_password_token
      t.datetime :reset_password_sent_at

      ## Rememberable
      t.datetime :remember_created_at

      ## JWT revocation — allow null initially so we can populate before indexing
      t.string :jti
    end

    # Populate jti with unique UUIDs for existing users before adding the unique index
    execute("UPDATE users SET jti = gen_random_uuid()::text WHERE jti IS NULL")

    # Now enforce not-null and uniqueness
    change_column_null :users, :jti, false
    add_index :users, :reset_password_token, unique: true
    add_index :users, :jti, unique: true
  end
end
