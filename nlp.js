// AI Smart Search with Urdu and Natural Language Support

// Enhanced Urdu to English translation mapping
const urduTranslations = {
     'جوتے': 'shoes',
     'بوتل': 'bottle',
     'لپ ٹاپ': 'laptop',
     'کمپیوٹر': 'computer',
     'فون': 'phone',
     'موبائل': 'mobile',
     'ہیڈ فون': 'headphone',
     'ایربڈز': 'earbuds',
     'کیمرہ': 'camera',
     'گھڑی': 'watch',
     'ٹیبلٹ': 'tablet',
     'سپیکر': 'speaker',
     'ٹی وی': 'tv',
     'ریفریجریٹر': 'refrigerator',
     'واشنگ مشین': 'washing machine',
     'کتاب': 'book',
     'قلم': 'pen',
     'بستہ': 'bag',
     'کپڑے': 'clothes',
     'جینس': 'jeans',
     'شرٹ': 'shirt',
     'سستی': 'cheap',
     'مہنگی': 'expensive',
     'بہترین': 'best',
     'نئی': 'new',
     'پرانی': 'old',
     'بڑی': 'big',
     'چھوٹی': 'small',
     'سرخ': 'red',
     'نیلا': 'blue',
     'سبز': 'green',
     'سیاہ': 'black',
     'سفید': 'white',
     'دکھائیں': 'show',
     'خریدیں': 'buy',
     'تلاش': 'search'
   };
   
   // Enhanced Arabic to English translation mapping
   const arabicTranslations = {
     'حذاء': 'shoes',
     'حاسوب': 'laptop',
     'كمبيوتر': 'computer',
     'هاتف': 'phone',
     'جوال': 'mobile',
     'سماعات': 'headphone',
     'كاميرا': 'camera',
     'ساعة': 'watch',
     'تابلت': 'tablet',
     'سماعة': 'speaker',
     'تلفاز': 'tv',
     'ثلاجة': 'refrigerator',
     'غسالة': 'washing machine',
     'كتاب': 'book',
     'قلم': 'pen',
     'حقيبة': 'bag',
     'ملابس': 'clothes',
     'قميص': 'shirt',
     'أحمر': 'red',
     'أزرق': 'blue',
     'أخضر': 'green',
     'أسود': 'black',
     'أبيض': 'white',
     'عرض': 'show',
     'شراء': 'buy',
     'بحث': 'search'
   };
   
   // Enhanced product categories and keywords
   const productCategories = {
     'electronics': ['laptop', 'computer', 'phone', 'mobile', 'tablet', 'tv', 'speaker', 'headphone', 'earbuds', 'camera', 'gadget', 'device', 'electronic'],
     'footwear': ['shoes', 'sneakers', 'boots', 'sandals', 'footwear', 'جوتے', 'حذاء'],
     'clothing': ['shirt', 'jeans', 'pants', 'dress', 'clothes', 'clothing', 'apparel', 'کپڑے', 'ملابس'],
     'accessories': ['watch', 'bag', 'wallet', 'belt', 'accessory', 'گھڑی', 'بستہ', 'ساعة', 'حقيبة'],
     'home': ['refrigerator', 'washing machine', 'fan', 'ac', 'air conditioner', 'home', 'appliance']
   };
   
   // Enhanced product keywords (all product names we recognize)
   const productKeywords = [
     'laptop', 'computer', 'notebook', 'pc', 'desktop',
     'phone', 'mobile', 'smartphone', 'cellphone', 'iphone', 'android',
     'shoes', 'sneakers', 'boots', 'sandals', 'footwear',
     'headphone', 'earbuds', 'earphone', 'headset', 'airpods',
     'watch', 'smartwatch', 'clock',
     'camera', 'dslr', 'mirrorless',
     'tablet', 'ipad',
     'tv', 'television', 'smart tv',
     'speaker', 'bluetooth speaker',
     'bag', 'backpack', 'handbag',
     'shirt', 't-shirt', 'jeans', 'pants', 'dress', 'clothing',
     'refrigerator', 'fridge', 'washing machine', 'washing', 'machine',
     'book', 'pen', 'pencil'
   ];
   
   // Enhanced filler words to remove from natural language queries
   const fillerWords = new Set([
     'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours',
     'need', 'want', 'wants', 'wanted', 'looking', 'look', 'search', 'searching', 'find', 'finding',
     'for', 'a', 'an', 'the', 'this', 'that', 'these', 'those',
     'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
     'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing',
     'will', 'would', 'should', 'could', 'can', 'may', 'might',
     'to', 'of', 'in', 'on', 'at', 'by', 'with', 'from', 'about',
     'show', 'show me', 'give', 'give me', 'get', 'getting',
     'please', 'pls', 'buy', 'buying', 'purchase', 'purchasing',
     'best', 'cheap', 'affordable', 'good', 'nice', 'great',
     'some', 'any', 'all', 'every', 'each', 'both', 'either', 'neither',
     'very', 'really', 'quite', 'too', 'so', 'such', 'more', 'most'
   ]);
   
   // Enhanced natural language patterns
   const naturalLanguagePatterns = {
     'cheap': /(cheap|affordable|low price|budget|sasti|سستی)/i,
     'expensive': /(expensive|premium|high price|mehngi|مہنگی)/i,
     'best': /(best|top|rated|recommended|behtareen|بہترین)/i,
     'new': /(new|latest|recent|nayi|نئی)/i,
     'discount': /(discount|sale|offer|deal|on sale)/i,
     'red': /(red|surkh|سرخ|أحمر)/i,
     'blue': /(blue|neela|نیلا|أزرق)/i,
     'green': /(green|sabz|سبز|أخضر)/i,
     'black': /(black|siyah|سیاہ|أسود)/i,
     'white': /(white|safed|سفید|أبيض)/i,
     'under': /(under|less than|below|upto|کم|أقل)/i,
     'shipping': /(shipping|delivery|ship|deliver|کھپت|شپنگ|الشحن|التوصيل)/i
   };
   
   /**
    * Enhanced product keyword extraction with better NLP
    */
   function extractProductKeyword(query) {
     if (!query || query.trim() === '') {
       return '';
     }
   
     // First, translate Urdu/Arabic to English
     let processedQuery = translateToEnglish(query);
     const lowerQuery = processedQuery.toLowerCase().trim();
   
     // Remove common filler words and phrases
     let words = lowerQuery.split(/\s+/);
     
     // Enhanced filler word removal
     words = words.filter(word => {
       const cleaned = word.replace(/[.,!?;:()]/g, ''); // Remove punctuation
       return !fillerWords.has(cleaned) && cleaned.length > 1;
     });
   
     // Enhanced multi-word product matching
     const multiWordProducts = [
       'mobile phone', 'cell phone', 'smart phone', 'smartphone',
       'washing machine', 'air conditioner', 'air conditioning',
       'smart tv', 'smart watch', 'bluetooth speaker',
       'running shoes', 'sports shoes', 'formal shoes',
       'laptop computer', 'gaming laptop', 'digital camera'
     ];
     
     // Check for multi-word products first
     for (const product of multiWordProducts) {
       if (lowerQuery.includes(product)) {
         return product;
       }
     }
   
     // Enhanced single product keyword matching with context
     const foundKeywords = [];
     
     for (const keyword of productKeywords) {
       // Exact match gets highest priority
       if (lowerQuery === keyword) {
         return keyword;
       }
       
       // Word boundary matching for better accuracy
       const regex = new RegExp(`\\b${keyword}\\b`, 'i');
       if (regex.test(lowerQuery)) {
         foundKeywords.push(keyword);
       }
       // Partial match as fallback
       else if (lowerQuery.includes(keyword)) {
         foundKeywords.push(keyword);
       }
     }
   
     // Prioritize longer/more specific keywords
     if (foundKeywords.length > 0) {
       foundKeywords.sort((a, b) => {
         // Prioritize multi-word keywords
         if (a.includes(' ') && !b.includes(' ')) return -1;
         if (!a.includes(' ') && b.includes(' ')) return 1;
         // Then by length
         return b.length - a.length;
       });
       return foundKeywords[0];
     }
   
     // Enhanced fallback: extract meaningful words with context
     const meaningfulWords = words.filter(word => {
       const cleaned = word.toLowerCase();
       return cleaned.length > 2 && 
              !fillerWords.has(cleaned) &&
              !['the', 'and', 'or', 'but', 'with', 'from', 'like', 'that'].includes(cleaned);
     });
   
     if (meaningfulWords.length > 0) {
       // Return the most product-like word
       meaningfulWords.sort((a, b) => {
         const aScore = getProductLikelihoodScore(a);
         const bScore = getProductLikelihoodScore(b);
         return bScore - aScore;
       });
       return meaningfulWords[0];
     }
   
     // Final fallback
     return words.join(' ') || query;
   }
   
   /**
    * Score how likely a word is to be a product
    */
   function getProductLikelihoodScore(word) {
     let score = 0;
     
     // Common product endings
     const productEndings = ['phone', 'pad', 'pod', 'watch', 'top', 'book', 'case', 'bag'];
     productEndings.forEach(ending => {
       if (word.endsWith(ending)) score += 10;
     });
     
     // Common product prefixes
     const productPrefixes = ['smart', 'digital', 'wireless', 'bluetooth', 'gaming'];
     productPrefixes.forEach(prefix => {
       if (word.startsWith(prefix)) score += 10;
     });
     
     // Length-based scoring
     if (word.length >= 5) score += 5;
     if (word.length >= 7) score += 5;
     
     return score;
   }
   
   /**
    * Enhanced translation with better context handling
    */
   function translateToEnglish(text) {
     if (!text || text.trim() === '') {
       return '';
     }
   
     // First, translate Urdu/Arabic words with context
     const words = text.split(/\s+/);
     const translated = words.map(word => {
       const normalized = word.trim();
       
       // Check Urdu translations
       if (urduTranslations[normalized]) {
         return urduTranslations[normalized];
       }
       
       // Check Arabic translations
       if (arabicTranslations[normalized]) {
         return arabicTranslations[normalized];
       }
       
       // Return original word if no translation found
       return word;
     });
     
     let translatedText = translated.join(' ');
     
     // Enhanced product keyword extraction
     const productKeyword = extractProductKeyword(translatedText);
     
     // If we extracted a product keyword, use it; otherwise use the translated text
     if (productKeyword && productKeyword.length > 0) {
       return productKeyword;
     }
     
     return translatedText;
   }
   
   /**
    * Backward compatibility
    */
   function translateUrdu(urduText) {
     return translateToEnglish(urduText);
   }
   
   /**
    * Enhanced keyword extraction for chatbot
    */
   function extractKeywords(query) {
     const keywords = [];
     const lowerQuery = query.toLowerCase();
     
     // Extract main product keyword
     const productKeyword = extractProductKeyword(query);
     if (productKeyword) {
       keywords.push(productKeyword);
     }
     
     // Enhanced category detection
     for (const [category, terms] of Object.entries(productCategories)) {
       if (terms.some(term => {
         const regex = new RegExp(`\\b${term}\\b`, 'i');
         return regex.test(lowerQuery);
       })) {
         keywords.push(category);
       }
     }
     
     // Enhanced natural language pattern matching
     for (const [pattern, regex] of Object.entries(naturalLanguagePatterns)) {
       if (regex.test(query)) {
         keywords.push(pattern);
       }
     }
     
     // Enhanced individual word extraction
     const words = query.split(/\s+/).filter(word => {
       const cleaned = word.toLowerCase().replace(/[.,!?;:()]/g, '');
       return cleaned.length > 2 && !fillerWords.has(cleaned);
     });
     
     keywords.push(...words);
     
     return [...new Set(keywords)]; // Remove duplicates
   }
   
   /**
    * Enhanced similarity calculation for better matching
    */
   function calculateSimilarity(query, product) {
     let score = 0;
     const queryLower = query.toLowerCase();
     const productNameLower = product.name.toLowerCase();
     const productDescription = (product.description || '').toLowerCase();
     const productCategory = (product.category || '').toLowerCase();
     
     // Extract product keyword from query
     const queryKeyword = extractProductKeyword(query);
     const queryKeywordLower = queryKeyword.toLowerCase();
     
     // Enhanced exact matching
     if (productNameLower === queryKeywordLower) {
       score += 100;
     }
     
     // Enhanced partial matching
     if (queryKeywordLower && productNameLower.includes(queryKeywordLower)) {
       score += 50;
     }
     
     // Full query matching
     if (productNameLower === queryLower) {
       score += 100;
     }
     
     if (productNameLower.includes(queryLower)) {
       score += 50;
     }
     
     // Enhanced word-by-word matching
     const queryWords = queryLower.split(/\s+/);
     queryWords.forEach(word => {
       if (word.length > 2 && !fillerWords.has(word)) {
         // Word boundary matching for better accuracy
         const wordRegex = new RegExp(`\\b${word}\\b`, 'i');
         
         if (wordRegex.test(productNameLower)) {
           score += 25;
         }
         if (wordRegex.test(productDescription)) {
           score += 12;
         }
         if (wordRegex.test(productCategory)) {
           score += 18;
         }
       }
     });
     
     // Enhanced fuzzy matching with synonyms
     const synonyms = {
       'laptop': ['notebook', 'computer', 'pc', 'macbook', 'chromebook'],
       'phone': ['mobile', 'smartphone', 'cellphone', 'iphone', 'android'],
       'shoes': ['sneakers', 'footwear', 'boots', 'sandals', 'loafers'],
       'headphone': ['earphone', 'earbuds', 'headset', 'airpods', 'headphones'],
       'watch': ['smartwatch', 'timepiece', 'wristwatch'],
       'camera': ['dslr', 'mirrorless', 'digital camera', 'photography']
     };
     
     for (const [key, values] of Object.entries(synonyms)) {
       if (queryLower.includes(key) || queryKeywordLower.includes(key)) {
         values.forEach(variant => {
           if (productNameLower.includes(variant)) {
             score += 35;
           }
         });
       }
     }
     
     // Boost for exact category match
     const extractedKeywords = extractKeywords(query);
     if (extractedKeywords.some(kw => productCategory.includes(kw.toLowerCase()))) {
       score += 30;
     }
     
     return score;
   }
   
   /**
    * Enhanced smart search for chatbot
    */
   function smartSearch(query, products) {
     if (!query || query.trim() === '') {
       return products;
     }
     
     // Enhanced query processing
     const productKeyword = extractProductKeyword(query);
     let processedQuery = translateToEnglish(query);
     
     // Use extracted keyword if available
     if (productKeyword && productKeyword.length > 0) {
       processedQuery = productKeyword;
     }
     
     // Enhanced keyword extraction
     const keywords = extractKeywords(processedQuery);
     
     // Enhanced scoring with multiple strategies
     const scoredProducts = products.map(product => {
       let score = 0;
       
       // Multiple scoring strategies
       score += calculateSimilarity(productKeyword, product) * 1.5;
       score += calculateSimilarity(processedQuery, product);
       
       // Enhanced keyword scoring
       keywords.forEach(keyword => {
         score += calculateSimilarity(keyword, product) * 0.8;
       });
       
       // Category boost
       const productCategory = (product.category || '').toLowerCase();
       if (keywords.some(kw => productCategory.includes(kw.toLowerCase()))) {
         score += 35;
       }
       
       // Popularity/recency boost (if available)
       if (product.createdAt) {
         const daysOld = (Date.now() - new Date(product.createdAt).getTime()) / (1000 * 3600 * 24);
         if (daysOld < 30) score += 20; // Recent products
       }
       
       return { product, score };
     });
     
     // Enhanced filtering and sorting
     const filtered = scoredProducts
       .filter(item => item.score > 10) // Higher threshold for better quality
       .sort((a, b) => b.score - a.score)
       .map(item => item.product);
     
     // Enhanced fallback strategies
     if (filtered.length === 0 && productKeyword) {
       // Try fuzzy search with word boundaries
       const keywordRegex = new RegExp(`\\b${productKeyword}\\b`, 'i');
       return products.filter(product => 
         keywordRegex.test(product.name.toLowerCase()) ||
         (product.description && keywordRegex.test(product.description.toLowerCase()))
       );
     }
     
     // Final fallback: first meaningful word
     if (filtered.length === 0 && processedQuery.length > 0) {
       const words = processedQuery.split(/\s+/).filter(w => w.length > 2);
       if (words.length > 0) {
         const firstWord = words[0];
         const wordRegex = new RegExp(`\\b${firstWord}\\b`, 'i');
         return products.filter(product => 
           wordRegex.test(product.name.toLowerCase()) ||
           (product.description && wordRegex.test(product.description.toLowerCase()))
         );
       }
     }
     
     return filtered.length > 0 ? filtered : [];
   }
   
   /**
    * Detect if text contains Arabic or Urdu characters
    */
   function containsArabicOrUrdu(text) {
     return /[\u0600-\u06FF]/.test(text);
   }
   
   module.exports = {
     smartSearch,
     translateUrdu,
     translateToEnglish,
     extractKeywords,
     extractProductKeyword,
     calculateSimilarity,
     containsArabicOrUrdu
   };