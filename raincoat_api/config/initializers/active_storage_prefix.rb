# This initializer intercepts the key generation to add a custom prefix.

ActiveSupport.on_load(:active_storage_blob) do
  # Define the desired prefix, perhaps using an environment variable
  # Ensure the prefix matches what you had in storage.yml
  S3_PREFIX = ENV['S3_PREFIX'] || 'clothing/stock_images'

  if S3_PREFIX.present?
    # Override the default key method to prepend the prefix
    def key
      # Only prepend the prefix if the key hasn't been set yet (for new records)
      if self[:key].nil?
        self[:key] = File.join(S3_PREFIX, self.class.generate_unique_secure_token)
      end
      self[:key]
    end
  end
end

