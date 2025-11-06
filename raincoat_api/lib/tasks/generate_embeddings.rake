# lib/tasks/generate_embeddings.rake
namespace :embeddings do
  desc "Generate embeddings from sample images and save to JSON file"
  task :generate_from_images => :environment do
    require 'json'
    require 'fileutils'

    # Directory containing sample clothing images
    images_dir = Rails.root.join('db', 'sample_images')
    output_file = Rails.root.join('db', 'fixtures', 'embeddings.json')

    unless Dir.exist?(images_dir)
      puts "Error: Sample images directory not found at #{images_dir}"
      puts "Please create the directory and add sample clothing images"
      puts ""
      puts "Expected structure:"
      puts "  db/sample_images/"
      puts "    ├── tops/"
      puts "    │   ├── blue_tshirt.jpg"
      puts "    │   ├── white_shirt.jpg"
      puts "    ├── bottoms/"
      puts "    │   ├── dark_jeans.jpg"
      puts "    │   ├── khaki_chinos.jpg"
      puts "    └── shoes/"
      puts "        ├── white_sneakers.jpg"
      exit 1
    end

    # Ensure fixtures directory exists
    FileUtils.mkdir_p(Rails.root.join('db', 'fixtures'))

    embeddings_data = {
      generated_at: Time.current.iso8601,
      model_version: "fashionclip-2.0",
      embeddings: []
    }

    puts "Generating embeddings from images..."
    puts "Source: #{images_dir}"
    puts "Output: #{output_file}"
    puts ""

    # Process each category directory
    %w[tops bottoms shoes outerwear accessories].each do |category|
      category_dir = images_dir.join(category)
      next unless Dir.exist?(category_dir)

      Dir.glob(category_dir.join('*.{jpg,jpeg,png,webp}')).each do |image_path|
        filename = File.basename(image_path, '.*')

        puts "  Processing: #{category}/#{File.basename(image_path)}"

        begin
          # Generate embedding (this would call your actual embedding generation service)
          # For now, we'll create a placeholder - you'll replace this with actual logic
          embedding_vector = generate_embedding_for_image(image_path)

          embeddings_data[:embeddings] << {
            filename: filename,
            category: category,
            image_path: "sample_images/#{category}/#{File.basename(image_path)}",
            vector_data: embedding_vector,
            metadata: {
              dimensions: embedding_vector.length,
              generated_at: Time.current.iso8601
            }
          }

          puts "    ✅ Generated #{embedding_vector.length}-dimensional vector"

        rescue => e
          puts "    ❌ Error: #{e.message}"
        end
      end
    end

    # Save to JSON file
    File.write(output_file, JSON.pretty_generate(embeddings_data))

    puts ""
    puts "✅ Successfully generated #{embeddings_data[:embeddings].count} embeddings"
    puts "💾 Saved to: #{output_file}"
    puts ""
    puts "📝 Next steps:"
    puts "  1. Review the generated embeddings file"
    puts "  2. Run: rails db:seed:embeddings to load them into the database"
  end

  desc "Load pre-generated embeddings from JSON file into database"
  task :load => :environment do
    embeddings_file = Rails.root.join('db', 'fixtures', 'embeddings.json')

    unless File.exist?(embeddings_file)
      puts "❌ Error: Embeddings file not found at #{embeddings_file}"
      puts "📝 Run 'rails embeddings:generate_from_images' first"
      exit 1
    end

    puts "📂 Loading embeddings from: #{embeddings_file}"

    data = JSON.parse(File.read(embeddings_file))

    puts "📊 File info:"
    puts "  Generated: #{data['generated_at']}"
    puts "  Model: #{data['model_version']}"
    puts "  Count: #{data['embeddings'].count}"
    puts ""

    loaded_count = 0
    skipped_count = 0

    data['embeddings'].each do |embedding_data|
      # Find or create matching clothing piece by filename
      piece = ClothingPiece.find_by(
        name: embedding_data['filename'].titleize.gsub('_', ' ')
      )

      if piece.nil?
        puts "  ⚠️  Skipping #{embedding_data['filename']} - no matching clothing piece found"
        skipped_count += 1
        next
      end

      # Create or update embedding
      ce = piece.clothing_embedding || piece.build_clothing_embedding

      ce.assign_attributes(
        vector_data: embedding_data['vector_data'],
        model_version: data['model_version'],
        preprocessing_metadata: embedding_data['metadata']
      )

      if ce.save
        puts "  ✅ Loaded: #{piece.name}"
        loaded_count += 1
      else
        puts "  ❌ Failed: #{piece.name} - #{ce.errors.full_messages.join(', ')}"
        skipped_count += 1
      end
    end

    puts ""
    puts "✅ Successfully loaded #{loaded_count} embeddings"
    puts "⚠️  Skipped #{skipped_count} items"
  end

  private

  def generate_embedding_for_image(image_path)
    # PLACEHOLDER: Replace this with actual embedding generation
    # This would integrate with your FashionCLIP ONNX model

    # For now, generate deterministic random vectors based on filename
    # This ensures same file always gets same embedding
    filename = File.basename(image_path)
    Random.srand(filename.bytes.sum)

    # Generate 512-dimensional vector
    vector = Array.new(512) { rand(-1.0..1.0).round(4) }

    # Normalize to unit length (important for cosine similarity)
    magnitude = Math.sqrt(vector.map { |v| v * v }.sum)
    vector.map { |v| (v / magnitude).round(4) }
  end
end
