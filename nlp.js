// Fuzzy Dictionary for common misspellings
function fuzzyDictionary() {
  return {
    // Shoes misspellings
    'shoes': ['shoes', 'shoe', 'shoos', 'shose', 'shues', 'shoess', 'shoee', 'shooe', 'shoes', 'shoess'],
    'shoe': ['shoes', 'shoe', 'shoos', 'shose', 'shues', 'shoee', 'shooe'],
    
    // Mobile/Phone misspellings
    'mobile': ['mobile', 'mobail', 'mobail', 'mobiel', 'moblie', 'moble', 'mobyle', 'mobail', 'mobiel', 'moblie'],
    'phone': ['phone', 'fone', 'phne', 'phoen', 'phon', 'phoen', 'fone', 'phoen'],
    'smartphone': ['smartphone', 'smartfone', 'smartphne', 'smartphoen', 'smartphon'],
    
    // Laptop misspellings
    'laptop': ['laptop', 'laptp', 'laptpo', 'laptoop', 'lapto', 'laptopp', 'laptp', 'laptpo'],
    'computer': ['computer', 'computr', 'compter', 'comuter', 'computor', 'compueter'],
    
    // Headphone misspellings
    'headphone': ['headphone', 'hedphone', 'headfone', 'headphne', 'hedfone', 'headphoen', 'headphon'],
    'headphones': ['headphones', 'hedphones', 'headfones', 'headphnes', 'hedfones', 'headphoens'],
    'earphone': ['earphone', 'earfone', 'earphne', 'earphoen', 'earphon'],
    
    // Camera misspellings
    'camera': ['camera', 'camra', 'camrea', 'camer', 'camara', 'cameera', 'camra'],
    'cam': ['cam', 'camera', 'camra'],
    
    // Watch misspellings
    'watch': ['watch', 'wach', 'watc', 'wathc', 'watche', 'wath'],
    'smartwatch': ['smartwatch', 'smartwach', 'smartwatc', 'smartwathc'],
    
    // TV misspellings
    'tv': ['tv', 'television', 't.v', 't v', 'televison', 'televsion'],
    'television': ['television', 'televison', 'televsion', 'televison'],
    
    // Speaker misspellings
    'speaker': ['speaker', 'speker', 'speakr', 'speakar', 'speekr', 'speakre'],
    'speakers': ['speakers', 'spekers', 'speakrs', 'speakars', 'speekrs'],
    
    // Jeans misspellings
    'jeans': ['jeans', 'jean', 'jeens', 'jeanz', 'jeanss', 'jean'],
    'jean': ['jeans', 'jean', 'jeens', 'jeanz'],
    
    // Shirt misspellings
    'shirt': ['shirt', 'shrt', 'shrit', 'shirt', 'shirtt', 'shrt'],
    'shirts': ['shirts', 'shrts', 'shrits', 'shirtss', 'shirts'],
    'tshirt': ['tshirt', 't-shirt', 'tshrt', 'tshrit', 't shirt', 't-shirt'],
    
    // Refrigerator misspellings
    'refrigerator': ['refrigerator', 'refrigrator', 'refrigirator', 'refrigeratr', 'refrigrator', 'fridge'],
    'fridge': ['fridge', 'frige', 'frigde', 'fridg', 'refrigerator']
  };
}

// Levenshtein distance for fuzzy matching
function levenshteinDistance(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = [];

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,     // deletion
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j - 1] + 1  // substitution
        );
      }
    }
  }

  return matrix[len1][len2];
}

// Find closest match using fuzzy dictionary and Levenshtein distance
function correctMisspelling(word) {
  const fuzzyDict = fuzzyDictionary();
  const lowerWord = word.toLowerCase();
  
  // First, check exact match in fuzzy dictionary
  for (const [correct, variations] of Object.entries(fuzzyDict)) {
    if (variations.includes(lowerWord)) {
      console.log(`✅ Corrected "${word}" → "${correct}" (exact match)`);
      return correct;
    }
  }
  
  // If no exact match, use Levenshtein distance
  let bestMatch = null;
  let minDistance = Infinity;
  const maxDistance = Math.max(2, Math.floor(word.length / 3)); // Allow up to 1/3 of word length as distance
  
  for (const [correct, variations] of Object.entries(fuzzyDict)) {
    for (const variation of variations) {
      const distance = levenshteinDistance(lowerWord, variation);
      if (distance < minDistance && distance <= maxDistance) {
        minDistance = distance;
        bestMatch = correct;
      }
    }
    
    // Also check distance to the correct word itself
    const distanceToCorrect = levenshteinDistance(lowerWord, correct);
    if (distanceToCorrect < minDistance && distanceToCorrect <= maxDistance) {
      minDistance = distanceToCorrect;
      bestMatch = correct;
    }
  }
  
  if (bestMatch && minDistance <= maxDistance) {
    console.log(`✅ Corrected "${word}" → "${bestMatch}" (distance: ${minDistance})`);
    return bestMatch;
  }
  
  return word; // Return original if no good match found
}

// Smart Search Function with proper product matching and fuzzy matching
function smartSearch(query, products) {
  if (!query || typeof query !== 'string') {
    return {
      found: false,
      message: "Please enter a search query",
      products: [],
      count: 0
    };
  }

  const searchQuery = query.trim().toLowerCase();
  
  // If query is empty, return all products
  if (!searchQuery) {
    return {
      found: true,
      message: `Showing all ${products.length} products`,
      products: products,
      count: products.length
    };
  }

  // Extract product keywords - remove common words
  const commonWords = ['i', 'am', 'looking', 'for', 'want', 'need', 'search', 'find', 'show', 'me', 'the', 'a', 'an', 'some', 'any'];
  const words = searchQuery.split(/\s+/).filter(word => 
    word.length > 2 && !commonWords.includes(word)
  );
  
  // If no meaningful words after filtering, use the original query
  let keywords = words.length > 0 ? words : [searchQuery];
  
  // Apply fuzzy matching to correct misspellings
  keywords = keywords.map(word => correctMisspelling(word));
  
  console.log(`🔍 Search query: "${query}"`);
  console.log(`🔑 Extracted keywords:`, keywords);

  // Category mapping for better matching
  const categoryMap = {
    'shoe': 'shoes',
    'shoes': 'shoes',
    'footwear': 'shoes',
    'sneaker': 'shoes',
    'sneakers': 'shoes',
    'mobile': 'mobile',
    'phone': 'mobile',
    'smartphone': 'mobile',
    'cellphone': 'mobile',
    'laptop': 'laptop',
    'computer': 'laptop',
    'notebook': 'laptop',
    'headphone': 'headphone',
    'headphones': 'headphone',
    'earphone': 'headphone',
    'earphones': 'headphone',
    'camera': 'camera',
    'cam': 'camera',
    'watch': 'watch',
    'smartwatch': 'watch',
    'tv': 'tv',
    'television': 'tv',
    'speaker': 'speaker',
    'speakers': 'speaker',
    'jeans': 'jeans',
    'jean': 'jeans',
    'shirt': 'shirts',
    'shirts': 'shirts',
    'tshirt': 'shirts',
    't-shirt': 'shirts',
    'refrigerator': 'refrigerator',
    'fridge': 'refrigerator'
  };

  // Find matching category using corrected keywords
  let matchedCategory = null;
  for (const keyword of keywords) {
    if (categoryMap[keyword]) {
      matchedCategory = categoryMap[keyword];
      break;
    }
  }

  // Also check if the full query contains category keywords (with fuzzy matching)
  if (!matchedCategory) {
    // First try exact matches
    for (const [key, category] of Object.entries(categoryMap)) {
      if (searchQuery.includes(key)) {
        matchedCategory = category;
        break;
      }
    }
    
    // If still no match, try fuzzy matching on the full query
    if (!matchedCategory) {
      const correctedQuery = correctMisspelling(searchQuery);
      for (const [key, category] of Object.entries(categoryMap)) {
        if (correctedQuery.includes(key) || searchQuery.includes(key)) {
          matchedCategory = category;
          break;
        }
      }
    }
  }

  console.log(`📂 Matched category: ${matchedCategory || 'none'}`);

  // Score products based on relevance (with fuzzy matching support)
  const scoredProducts = products.map(product => {
    let score = 0;
    const productName = (product.name || '').toLowerCase();
    const productCategory = (product.category || '').toLowerCase();
    const productDescription = (product.description || '').toLowerCase();
    const searchText = `${productName} ${productCategory} ${productDescription}`;

    // Exact category match gets highest priority
    if (matchedCategory && productCategory === matchedCategory) {
      score += 1000;
    }

    // Check for exact keyword matches in category
    for (const keyword of keywords) {
      if (productCategory === keyword || productCategory.includes(keyword)) {
        score += 500;
      }
    }

    // Check for exact keyword matches in name
    for (const keyword of keywords) {
      if (productName === keyword) {
        score += 300;
      } else if (productName.includes(keyword)) {
        score += 200;
      }
    }

    // Check for keyword matches in description (lower priority)
    for (const keyword of keywords) {
      if (productDescription.includes(keyword)) {
        score += 50;
      }
    }

    // Check if any keyword appears in the search text
    for (const keyword of keywords) {
      if (searchText.includes(keyword)) {
        score += 10;
      }
    }
    
    // Fuzzy matching: Check if corrected keywords match product fields
    // This helps catch products even with slight variations
    for (const keyword of keywords) {
      // Check fuzzy match in category (using Levenshtein distance)
      const categoryWords = productCategory.split(/\s+/);
      for (const catWord of categoryWords) {
        if (catWord.length > 3) { // Only check words longer than 3 chars
          const distance = levenshteinDistance(keyword, catWord);
          if (distance <= 2 && distance < catWord.length / 2) {
            score += 100; // Bonus for fuzzy category match
          }
        }
      }
      
      // Check fuzzy match in product name
      const nameWords = productName.split(/\s+/);
      for (const nameWord of nameWords) {
        if (nameWord.length > 3) {
          const distance = levenshteinDistance(keyword, nameWord);
          if (distance <= 2 && distance < nameWord.length / 2) {
            score += 75; // Bonus for fuzzy name match
          }
        }
      }
    }

    return { product, score };
  });

  // Filter products with score > 0 and sort by score (highest first)
  const matchedProducts = scoredProducts
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.product);

  console.log(`✅ Found ${matchedProducts.length} matching products`);

  if (matchedProducts.length > 0) {
    return {
      found: true,
      message: `Found ${matchedProducts.length} matching product${matchedProducts.length > 1 ? 's' : ''} for "${query}"`,
      products: matchedProducts,
      count: matchedProducts.length
    };
  } else {
    return {
      found: false,
      message: `No products found matching "${query}". Try searching for: shoes, mobile, laptop, headphones, camera, watch, tv, speaker, jeans, shirts, or refrigerator.`,
      products: [],
      count: 0
    };
  }
}

// Translation function (placeholder - can be enhanced)
function translateToEnglish(text) {
  // Simple keyword extraction
  const urduToEnglish = {
    'جوتے': 'shoes',
    'موبائل': 'mobile',
    'فون': 'mobile',
    'لیپ ٹاپ': 'laptop',
    'ہیڈ فون': 'headphone',
    'کیمرہ': 'camera',
    'گھڑی': 'watch',
    'ٹی وی': 'tv',
    'اسپیکر': 'speaker',
    'جینز': 'jeans',
    'شرٹ': 'shirt',
    'ریفریجریٹر': 'refrigerator'
  };

  const lowerText = text.toLowerCase();
  for (const [urdu, english] of Object.entries(urduToEnglish)) {
    if (lowerText.includes(urdu)) {
      return english;
    }
  }

  return text;
}

// Extract product keyword from query with fuzzy matching
function extractProductKeyword(query) {
  const lowerQuery = query.toLowerCase();
  
  // First, try to correct the query using fuzzy matching
  const correctedQuery = correctMisspelling(lowerQuery);
  
  const keywords = [
    'shoes', 'shoe', 'footwear', 'sneaker', 'sneakers',
    'mobile', 'phone', 'smartphone', 'cellphone',
    'laptop', 'computer', 'notebook',
    'headphone', 'headphones', 'earphone', 'earphones',
    'camera', 'cam',
    'watch', 'smartwatch',
    'tv', 'television',
    'speaker', 'speakers',
    'jeans', 'jean',
    'shirt', 'shirts', 'tshirt', 't-shirt',
    'refrigerator', 'fridge'
  ];

  // Check both original and corrected query
  for (const keyword of keywords) {
    if (lowerQuery.includes(keyword) || correctedQuery.includes(keyword)) {
      return keyword;
    }
  }
  
  // Also check if corrected query itself is a keyword
  if (keywords.includes(correctedQuery)) {
    return correctedQuery;
  }

  return null;
}

module.exports = {
  smartSearch,
  translateToEnglish,
  extractProductKeyword
};
