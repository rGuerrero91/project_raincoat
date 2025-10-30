# Initialize Redis connection
$redis = Redis.new(url: ENV['REDIS_URL'] || 'redis://localhost:6379/0')

Rails.application.config.after_initialize do
  begin
    $redis.ping
    Rails.logger.info "Redis connection established: #{ENV['REDIS_URL'] || 'redis://localhost:6379/0'}"
  rescue Redis::CannotConnectError => e
    Rails.logger.error "Redis connection failed: #{e.message}"
  end
end
