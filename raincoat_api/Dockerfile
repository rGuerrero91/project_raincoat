# Dockerfile
FROM ruby:3.4.5-slim

# Install system dependencies
RUN apt-get update -qq && apt-get install -y \
    postgresql-client \
    imagemagick \
    libvips42 \
    nodejs \
    yarn \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install bundler
RUN gem install bundler:2.4.10

ENV RAILS_ENV=development 

# Copy Gemfile and install gems
COPY Gemfile Gemfile.lock ./
RUN bundle install

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Default command
CMD ["bundle", "exec", "rails", "server", "-b", "0.0.0.0", "-p", "3000"]