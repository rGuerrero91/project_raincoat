# app/services/embedding_generator.rb
class EmbeddingGenerator
  VECTOR_DIMENSIONS = 512

  # Generate a deterministic embedding based on item attributes
  # This creates realistic clusters - similar items get similar vectors
  def self.generate_for_item(name:, category:, colors: [], materials: [], seed_key: nil)
    # Use seed_key for deterministic generation, or create from attributes
    seed_value = seed_key || compute_seed(name, category, colors, materials)

    # Generate base vector with controlled randomness
    Random.srand(seed_value.bytes.sum)
    base_vector = Array.new(VECTOR_DIMENSIONS) { rand(-1.0..1.0) }

    # Apply category-specific transformations
    category_vector = apply_category_bias(base_vector, category)

    # Apply color-specific transformations
    color_vector = apply_color_bias(category_vector, colors)

    # Apply material-specific transformations
    material_vector = apply_material_bias(color_vector, materials)

    # Normalize to unit length (required for cosine similarity)
    normalize_vector(material_vector)
  end

  # Load pre-generated embeddings from JSON fixture
  def self.load_from_fixture(fixture_name = 'sample_embeddings')
    fixture_path = Rails.root.join('db', 'fixtures', "#{fixture_name}.json")

    unless File.exist?(fixture_path)
      Rails.logger.warn "Embedding fixture not found: #{fixture_path}"
      return {}
    end

    data = JSON.parse(File.read(fixture_path))
    embeddings = {}

    data['embeddings'].each do |embedding_data|
      key = embedding_data['item_name'] || embedding_data['seed_key']

      # Generate the actual vector if not already included
      if embedding_data['vector_data']
        vector = embedding_data['vector_data']
      else
        vector = generate_for_item(
          name: embedding_data['item_name'],
          category: embedding_data['category'],
          colors: embedding_data['colors'] || [],
          materials: embedding_data['materials'] || [],
          seed_key: embedding_data['seed_key']
        )
      end

      embeddings[key] = {
        vector_data: vector,
        model_version: data['model_version'],
        preprocessing_metadata: embedding_data.except('vector_data')
      }
    end

    embeddings
  end

  private

  def self.compute_seed(name, category, colors, materials)
    # Create consistent seed from attributes
    [ name, category, colors.sort.join, materials.sort.join ].join('_')
  end

  def self.apply_category_bias(vector, category)
    # Apply subtle bias to cluster similar categories together
    category_offsets = {
      'tops' => 0.1,
      'bottoms' => 0.2,
      'shoes' => 0.3,
      'outerwear' => 0.4,
      'accessories' => 0.5
    }

    offset = category_offsets[category] || 0.0

    # Shift first 50 dimensions based on category
    vector.map.with_index do |v, i|
      if i < 50
        (v + offset * (i.even? ? 1 : -1)).clamp(-1.0, 1.0)
      else
        v
      end
    end
  end

  def self.apply_color_bias(vector, colors)
    return vector if colors.empty?

    # Map common colors to vector space regions
    color_mappings = {
      'black' => 0.1,
      'white' => 0.9,
      'blue' => 0.4,
      'navy' => 0.3,
      'red' => 0.6,
      'green' => 0.5,
      'yellow' => 0.8,
      'brown' => 0.2,
      'gray' => 0.45,
      'beige' => 0.7,
      'tan' => 0.65
    }

    # Get average color value
    color_values = colors.map { |c| color_mappings[c.downcase] || 0.5 }
    avg_color = color_values.sum / color_values.length.to_f

    # Apply to color-related dimensions (50-150)
    vector.map.with_index do |v, i|
      if i >= 50 && i < 150
        influence = (avg_color - 0.5) * 0.3
        (v + influence).clamp(-1.0, 1.0)
      else
        v
      end
    end
  end

  def self.apply_material_bias(vector, materials)
    return vector if materials.empty?

    # Map materials to texture/formality dimensions
    material_mappings = {
      'cotton' => 0.3,
      'wool' => 0.6,
      'leather' => 0.8,
      'denim' => 0.4,
      'polyester' => 0.2,
      'silk' => 0.9,
      'linen' => 0.5,
      'cashmere' => 0.95,
      'nylon' => 0.15
    }

    # Get average material value
    material_values = materials.map { |m| material_mappings[m.downcase] || 0.5 }
    avg_material = material_values.sum / material_values.length.to_f

    # Apply to material-related dimensions (150-250)
    vector.map.with_index do |v, i|
      if i >= 150 && i < 250
        influence = (avg_material - 0.5) * 0.25
        (v + influence).clamp(-1.0, 1.0)
      else
        v
      end
    end
  end

  def self.normalize_vector(vector)
    # Normalize to unit length for cosine similarity
    magnitude = Math.sqrt(vector.map { |v| v * v }.sum)
    return vector if magnitude == 0.0

    vector.map { |v| (v / magnitude).round(6) }
  end
end
