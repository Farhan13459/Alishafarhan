// Daraz Product Scraper
// This scraper extracts product information and images from Daraz product pages

const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Scrape Daraz product page
 * @param {string} productUrl - Daraz product URL
 * @returns {Promise<Object>} Product data with images
 */
async function scrapeDarazProduct(productUrl) {
  try {
    // Validate URL
    if (!productUrl || !productUrl.includes('daraz')) {
      throw new Error('Invalid Daraz URL');
    }

    // Add headers to mimic browser request
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    };

    // Fetch the page
    const response = await axios.get(productUrl, { headers, timeout: 10000 });
    const html = response.data;
    const $ = cheerio.load(html);

    // Extract product name
    const name = $('h1.pdp-product-name, h1.pdp-mod-product-badge-title, [data-qa-locator="product-title"]').first().text().trim() ||
                 $('h1').first().text().trim() ||
                 'Product Name Not Found';

    // Extract price
    const price = $('.pdp-price, .pdp-product-price, [class*="price"]').first().text().trim() ||
                  $('[data-qa-locator="product-price"]').first().text().trim() ||
                  'Price Not Available';

    // Extract images - Daraz uses various selectors
    const images = [];
    
    // Method 1: Try to find image gallery - multiple selectors for different Daraz layouts
    const imageSelectors = [
      '.pdp-mod-common-image img',
      '.gallery-preview-panel img',
      '.product-images img',
      '.pdp-product-images img',
      '[class*="product-image"] img',
      '[class*="gallery"] img',
      '.image-gallery img',
      'img[class*="pdp"]',
      '.main-image img'
    ];
    
    imageSelectors.forEach(selector => {
      $(selector).each((i, elem) => {
        if (images.length >= 10) return false; // Stop if we have 10 images
        const imgSrc = $(elem).attr('src') || 
                       $(elem).attr('data-src') || 
                       $(elem).attr('data-lazy-src') ||
                       $(elem).attr('data-original');
        if (imgSrc) {
          // Clean up the URL
          let cleanUrl = imgSrc.replace(/\?.*$/, ''); // Remove query params that might limit image size
          // Convert relative URLs to absolute
          if (!cleanUrl.startsWith('http')) {
            if (cleanUrl.startsWith('//')) {
              cleanUrl = `https:${cleanUrl}`;
            } else if (cleanUrl.startsWith('/')) {
              cleanUrl = `https://www.daraz.pk${cleanUrl}`;
            } else {
              cleanUrl = `https://${cleanUrl}`;
            }
          }
          // Ensure it's a valid image URL
          if (cleanUrl.match(/\.(jpg|jpeg|png|webp|gif)/i) && !images.includes(cleanUrl)) {
            images.push(cleanUrl);
          }
        }
      });
    });

    // Method 2: Try to extract from JSON-LD or script tags
    $('script[type="application/ld+json"]').each((i, elem) => {
      try {
        const jsonData = JSON.parse($(elem).html());
        if (jsonData.image) {
          const imgArray = Array.isArray(jsonData.image) ? jsonData.image : [jsonData.image];
          imgArray.forEach(img => {
            if (images.length < 10 && !images.includes(img)) {
              images.push(img);
            }
          });
        }
      } catch (e) {
        // Ignore JSON parse errors
      }
    });

    // Method 3: Look for image URLs in script tags and JSON data
    const scriptContent = html.match(/"image":\s*\[(.*?)\]/gs);
    if (scriptContent) {
      scriptContent.forEach(match => {
        const urls = match.match(/https?:\/\/[^\s"']+\.(jpg|jpeg|png|webp|gif)/gi);
        if (urls) {
          urls.forEach(url => {
            if (images.length < 10 && !images.includes(url)) {
              images.push(url);
            }
          });
        }
      });
    }

    // Method 4: Extract from data attributes and lazy-loaded images
    $('img[data-src], img[data-lazy], img[data-original], [data-image]').each((i, elem) => {
      if (images.length >= 10) return false;
      const imgSrc = $(elem).attr('data-src') || 
                     $(elem).attr('data-lazy') || 
                     $(elem).attr('data-original') ||
                     $(elem).attr('data-image');
      if (imgSrc) {
        let cleanUrl = imgSrc.replace(/\?.*$/, '');
        if (!cleanUrl.startsWith('http')) {
          cleanUrl = cleanUrl.startsWith('//') ? `https:${cleanUrl}` : `https://www.daraz.pk${cleanUrl}`;
        }
        if (cleanUrl.match(/\.(jpg|jpeg|png|webp|gif)/i) && !images.includes(cleanUrl)) {
          images.push(cleanUrl);
        }
      }
    });

    // If we found some images but less than 10, try to find variations
    if (images.length > 0 && images.length < 10) {
      const firstImage = images[0];
      // Try to extract base URL and create variations
      const urlParts = firstImage.split('?')[0];
      const extMatch = urlParts.match(/\.(jpg|jpeg|png|webp|gif)$/i);
      const extension = extMatch ? extMatch[0] : '.jpg';
      const baseUrl = urlParts.replace(/_\d+\.(jpg|jpeg|png|webp|gif)$/i, extension).replace(/\.(jpg|jpeg|png|webp|gif)$/i, '');
      
      // Try different image variations (common Daraz pattern)
      for (let i = images.length; i < 10; i++) {
        const variantNum = i + 1;
        const patterns = [
          `${baseUrl}_${variantNum}${extension}`,
          `${baseUrl}-${variantNum}${extension}`,
          `${baseUrl}_${variantNum}.jpg`,
          `${baseUrl}_${variantNum}.png`
        ];
        
        // Add first valid pattern that doesn't exist
        for (const pattern of patterns) {
          if (!images.includes(pattern)) {
            images.push(pattern);
            break;
          }
        }
      }
    }
    
    // Fallback: Generate placeholder images if none found
    if (images.length === 0) {
      for (let i = 1; i <= 10; i++) {
        images.push(`https://via.placeholder.com/400?text=${encodeURIComponent(name.substring(0, 20))}+${i}`);
      }
    }

    // Ensure we have at least some images (up to 10)
    const finalImages = images.slice(0, 10);
    
    // If still less than 10, pad with placeholders
    while (finalImages.length < 10) {
      finalImages.push(`https://via.placeholder.com/400?text=${encodeURIComponent(name.substring(0, 20))}+Image+${finalImages.length + 1}`);
    }

    // Extract description
    const description = $('.pdp-product-detail, .product-description, [data-qa-locator="product-description"]').first().text().trim() ||
                       $('meta[name="description"]').attr('content') ||
                       '';

    // Extract category
    const category = $('.breadcrumb-item, .pdp-breadcrumb a').last().text().trim() || '';

    return {
      name: name || 'Daraz Product',
      price: price || '$0.00',
      images: finalImages,
      description: description,
      category: category,
      url: productUrl,
      scrapedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error scraping Daraz product:', error.message);
    throw new Error(`Failed to scrape product: ${error.message}`);
  }
}

/**
 * Scrape multiple Daraz products
 */
async function scrapeMultipleProducts(urls) {
  const results = [];
  for (const url of urls) {
    try {
      const product = await scrapeDarazProduct(url);
      results.push(product);
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error scraping ${url}:`, error.message);
      results.push({
        name: 'Failed to scrape',
        price: 'N/A',
        images: [],
        error: error.message,
        url: url
      });
    }
  }
  return results;
}

/**
 * Search Daraz and get product URLs from search results
 * @param {string} searchQuery - Product search query
 * @returns {Promise<Array>} Array of product URLs
 */
async function searchDarazProducts(searchQuery) {
  try {
    // Encode search query for URL
    const encodedQuery = encodeURIComponent(searchQuery);
    const searchUrl = `https://www.daraz.pk/catalog/?q=${encodedQuery}`;
    
    // Headers to mimic browser request
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9,ur;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Referer': 'https://www.daraz.pk/'
    };

    // Fetch search results page
    const response = await axios.get(searchUrl, { 
      headers, 
      timeout: 15000,
      maxRedirects: 5
    });
    
    const html = response.data;
    const $ = cheerio.load(html);

    const productUrls = [];
    
    // Method 1: Try common Daraz search result selectors
    const selectors = [
      'a[href*="/products/"]',
      'a[href*="/p/"]',
      '.c1_t2i a',
      '.c2prKC a',
      '[data-qa-locator="product-item"] a',
      '.product-item a',
      '.search-result-item a'
    ];

    selectors.forEach(selector => {
      $(selector).each((i, elem) => {
        if (productUrls.length >= 5) return false; // Get top 5 results
        const href = $(elem).attr('href');
        if (href) {
          let fullUrl = href;
          // Convert relative URLs to absolute
          if (href.startsWith('/')) {
            fullUrl = `https://www.daraz.pk${href}`;
          } else if (!href.startsWith('http')) {
            fullUrl = `https://www.daraz.pk/${href}`;
          }
          // Ensure it's a product URL
          if (fullUrl.includes('/products/') || fullUrl.includes('/p/') || fullUrl.includes('-i')) {
            if (!productUrls.includes(fullUrl)) {
              productUrls.push(fullUrl);
            }
          }
        }
      });
    });

    // Method 2: Extract from script tags (Daraz often loads products via JSON)
    const scriptTags = $('script').toArray();
    for (const script of scriptTags) {
      const scriptContent = $(script).html();
      if (scriptContent && (scriptContent.includes('productUrl') || scriptContent.includes('/products/') || scriptContent.includes('"link"'))) {
        // Try to extract URLs from JSON - multiple patterns
        const urlPatterns = [
          /https?:\/\/[^"'\s]+\/(products|p)\/[^"'\s"']+/g,
          /"link":\s*"([^"]+)"/g,
          /"url":\s*"([^"]+)"/g,
          /href["']?\s*:\s*["']([^"']+)/g
        ];
        
        urlPatterns.forEach(pattern => {
          const matches = scriptContent.match(pattern);
          if (matches) {
            matches.forEach(match => {
              // Extract URL from match
              let url = match.replace(/["']/g, '').replace(/(link|url|href):\s*/i, '');
              if (url.includes('/products/') || url.includes('/p/') || url.includes('-i')) {
                // Clean and normalize URL
                url = url.split('"')[0].split("'")[0].split(',')[0].split('}')[0];
                if (url.startsWith('/')) {
                  url = `https://www.daraz.pk${url}`;
                } else if (!url.startsWith('http')) {
                  url = `https://www.daraz.pk/${url}`;
                }
                if (productUrls.length < 5 && !productUrls.includes(url) && url.includes('daraz')) {
                  productUrls.push(url);
                }
              }
            });
          }
        });
      }
    }

    // Method 3: Look for data attributes
    $('[data-product-url], [data-url]').each((i, elem) => {
      if (productUrls.length >= 5) return false;
      const url = $(elem).attr('data-product-url') || $(elem).attr('data-url');
      if (url && (url.includes('daraz') || url.includes('/products/'))) {
        let fullUrl = url.startsWith('http') ? url : `https://www.daraz.pk${url}`;
        if (!productUrls.includes(fullUrl)) {
          productUrls.push(fullUrl);
        }
      }
    });

    return productUrls.slice(0, 5); // Return top 5 product URLs

  } catch (error) {
    console.error('Error searching Daraz:', error.message);
    throw new Error(`Failed to search Daraz: ${error.message}`);
  }
}

/**
 * Search and scrape product from Daraz based on query
 * @param {string} query - Product search query (can be in Urdu/English/Arabic/mixed)
 * @param {Function} translateFunction - Function to translate query to English
 * @returns {Promise<Object>} Scraped product data
 */
async function searchAndScrapeDarazProduct(query, translateFunction) {
  try {
    if (!query || query.trim() === '') {
      throw new Error('Query cannot be empty');
    }

    // Translate and extract product keyword from natural language query
    let searchQuery = query.trim();
    if (translateFunction) {
      try {
        const translated = translateFunction(query);
        // Always use translated result if it's meaningful (even if same, it might have been processed)
        if (translated && translated.trim().length > 0) {
          searchQuery = translated.trim();
        }
      } catch (error) {
        console.warn(`[Daraz Scraper] Translation function error: ${error.message}, using original query`);
      }
    }

    // Clean up the search query - remove extra spaces
    searchQuery = searchQuery.replace(/\s+/g, ' ').trim();

    console.log(`[Daraz Scraper] Original query: "${query}"`);
    console.log(`[Daraz Scraper] Processed query: "${searchQuery}"`);

    if (!searchQuery || searchQuery.length < 2) {
      throw new Error(`Invalid search query extracted from: "${query}"`);
    }

    // Search for products
    console.log(`[Daraz Scraper] Searching Daraz for: "${searchQuery}"`);
    const productUrls = await searchDarazProducts(searchQuery);

    if (!productUrls || productUrls.length === 0) {
      // Try a more generic search by removing common words
      const words = searchQuery.split(' ').filter(w => w.length > 3);
      if (words.length > 0) {
        const fallbackQuery = words[0];
        console.log(`[Daraz Scraper] Trying fallback search with: "${fallbackQuery}"`);
        const fallbackUrls = await searchDarazProducts(fallbackQuery);
        if (fallbackUrls && fallbackUrls.length > 0) {
          console.log(`[Daraz Scraper] Fallback search found ${fallbackUrls.length} products`);
          const productUrl = fallbackUrls[0];
          const product = await scrapeDarazProduct(productUrl);
          return {
            ...product,
            searchQuery: query,
            translatedQuery: fallbackQuery,
            foundUrls: fallbackUrls.length
          };
        }
      }
      throw new Error(`No products found for "${query}". Try a different search term or check if Daraz is accessible.`);
    }

    console.log(`[Daraz Scraper] Found ${productUrls.length} products, scraping the first one...`);

    // Scrape the first (top) product
    const productUrl = productUrls[0];
    console.log(`[Daraz Scraper] Scraping product from: ${productUrl}`);
    const product = await scrapeDarazProduct(productUrl);

    if (!product || !product.name || product.name === 'Product Name Not Found') {
      throw new Error('Failed to extract product information from Daraz page');
    }

    console.log(`[Daraz Scraper] Successfully scraped: ${product.name}`);

    return {
      ...product,
      searchQuery: query,
      translatedQuery: searchQuery,
      foundUrls: productUrls.length
    };

  } catch (error) {
    console.error('[Daraz Scraper] Error in search and scrape:', error.message);
    console.error('[Daraz Scraper] Stack trace:', error.stack);
    throw error;
  }
}

module.exports = {
  scrapeDarazProduct,
  scrapeMultipleProducts,
  searchDarazProducts,
  searchAndScrapeDarazProduct
};

































