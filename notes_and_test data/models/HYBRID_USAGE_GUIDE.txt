
HYBRID WEATHER-FASHION MATCHING
================================

FILES GENERATED:
- label_embeddings.json (~50-80 KB) - All term embeddings
- weather_rules.json (~2 KB) - Rule-based transitional mappings

DEPLOYMENT:
Upload both JSON files to CDN alongside ONNX models

BROWSER USAGE:

// Load both files
const embeddings = await fetch('/models/label_embeddings.json').then(r => r.json());
const weatherRules = await fetch('/models/weather_rules.json').then(r => r.json());

// Hybrid matching function
async function getWeatherAppropriateItems(weatherCondition, userWardrobe) {
  // Step 1: AI suggestions via cosine similarity
  const weatherEmbed = embeddings[weatherCondition];
  const aiSuggestions = [];
  
  for (const item of userWardrobe) {
    const similarity = cosineSimilarity(weatherEmbed, item.embedding);
    aiSuggestions.push({ item, similarity });
  }
  
  // Step 2: Apply rule-based boosts if available
  if (weatherRules[weatherCondition]) {
    const requiredTags = weatherRules[weatherCondition];
    
    aiSuggestions.forEach(suggestion => {
      // Boost items that match transitional rules
      const hasRequiredTag = suggestion.item.tags.some(tag => 
        requiredTags.includes(tag)
      );
      if (hasRequiredTag) {
        suggestion.similarity *= 1.3; // Boost by 30%
      }
    });
  }
  
  // Step 3: Sort and return top matches
  return aiSuggestions
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 10);
}

UPDATING:
Edit Python script arrays, re-run, re-deploy JSON files
