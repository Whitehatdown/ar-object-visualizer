/**
 * data-loader.js
 * 
 * Utility for loading points of interest from different sources
 * This can load data from static JSON files or remote APIs
 */

const DataLoader = (function() {
    // Cache for loaded data
    let cachedData = null;
    
    /**
     * Load points of interest from a local JSON file
     * @param {string} filePath - Path to the JSON file
     * @returns {Promise} - Promise resolving to the loaded data
     */
    async function loadFromJsonFile(filePath = 'sample-data.json') {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`Failed to load data: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            cachedData = data;
            
            // Update reference points in the mapping system
            if (data.metadata && data.metadata.store_location && data.metadata.store_location.reference_points) {
                updateReferencePoints(data.metadata.store_location.reference_points);
            }
            
            return data.points_of_interest || [];
        } catch (error) {
            console.error('Error loading JSON data:', error);
            return [];
        }
    }
    
    /**
     * Update reference points in the indoor mapping system
     * @param {Object} referencePoints - Reference points object from the data file
     */
    function updateReferencePoints(referencePoints) {
        if (!referencePoints || typeof referencePoints !== 'object' || !IndoorMapping) {
            return;
        }
        
        // For each reference point, update the IndoorMapping system
        Object.keys(referencePoints).forEach(id => {
            const point = referencePoints[id];
            if (point && point.lat && point.lng) {
                // This will depend on your IndoorMapping implementation
                // Assuming it has a method to add or update reference points
                if (typeof IndoorMapping.addReferencePoint === 'function') {
                    IndoorMapping.addReferencePoint(id, {
                        lat: point.lat,
                        lng: point.lng,
                        name: point.name || id
                    });
                }
            }
        });
    }
    
    /**
     * Load points of interest from a remote API
     * @param {Object} options - Options for the API request
     * @returns {Promise} - Promise resolving to the loaded data
     */
    async function loadFromAPI(options = {}) {
        const {
            endpoint = 'https://api.example.com/pois',
            latitude,
            longitude,
            radius = 100,
            apiKey = null
        } = options;
        
        try {
            // Build the API URL with query parameters
            const url = new URL(endpoint);
            
            if (latitude && longitude) {
                url.searchParams.append('lat', latitude);
                url.searchParams.append('lng', longitude);
                url.searchParams.append('radius', radius);
            }
            
            if (apiKey) {
                url.searchParams.append('key', apiKey);
            }
            
            // Make the API request
            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Format the data to match our expected structure
            // This will depend on the API response format
            const formattedData = formatAPIResponse(data);
            
            return formattedData;
        } catch (error) {
            console.error('Error loading data from API:', error);
            return [];
        }
    }
    
    /**
     * Format API response to match our expected structure
     * @param {Object} apiResponse - Raw API response
     * @returns {Array} - Formatted points of interest
     */
    function formatAPIResponse(apiResponse) {
        // This will depend on the specific API you're using
        // Here's a generic example that assumes the API returns
        // an array of POIs in a different format
        
        if (!apiResponse || !apiResponse.data) {
            return [];
        }
        
        return apiResponse.data.map(item => {
            return {
                id: item.id || `api-${Math.random().toString(36).substr(2, 9)}`,
                name: item.name || item.title || 'Unknown',
                description: item.description || item.details || '',
                category: mapAPICategory(item.type || item.category),
                icon: mapAPIIcon(item.type || item.category),
                latitude: parseFloat(item.lat || item.latitude),
                longitude: parseFloat(item.lng || item.longitude),
                floor: item.floor || item.level || 1
            };
        }).filter(poi => {
            // Filter out items with invalid coordinates
            return !isNaN(poi.latitude) && !isNaN(poi.longitude);
        });
    }
    
    /**
     * Map API category to our internal categories
     * @param {string} apiCategory - Category from the API
     * @returns {string} - Internal category
     */
    function mapAPICategory(apiCategory) {
        // Map external categories to our internal ones
        const categoryMap = {
            'product': 'products',
            'products': 'products',
            'item': 'products',
            'items': 'products',
            'promo': 'promotions',
            'promotion': 'promotions',
            'deal': 'promotions',
            'deals': 'promotions',
            'special': 'promotions',
            'specials': 'promotions',
            'exit': 'exits',
            'exits': 'exits',
            'door': 'exits',
            'doors': 'exits',
            'facility': 'facilities',
            'facilities': 'facilities',
            'amenity': 'facilities',
            'amenities': 'facilities'
        };
        
        return categoryMap[apiCategory.toLowerCase()] || 'other';
    }
    
    /**
     * Map API category to an icon
     * @param {string} apiCategory - Category from the API
     * @returns {string} - Icon name
     */
    function mapAPIIcon(apiCategory) {
        // Map categories to icons
        const iconMap = {
            'products': 'shopping-cart',
            'promotions': 'tag',
            'exits': 'door-open',
            'facilities': 'info-sign'
        };
        
        const category = mapAPICategory(apiCategory);
        return iconMap[category] || 'question-sign';
    }
    
    /**
     * Load points near the current position
     * @param {number} radius - Radius in meters to search for points
     * @returns {Promise} - Promise resolving to nearby points
     */
    async function loadNearbyPoints(radius = 50) {
        // Get current position from the mapping system
        const currentPosition = IndoorMapping.getCurrentPosition();
        
        if (!currentPosition) {
            console.warn('No current position available');
            return [];
        }
        
        // If we have cached data, filter it by distance
        if (cachedData && cachedData.points_of_interest) {
            return cachedData.points_of_interest.filter(poi => {
                const distance = calculateDistance(
                    currentPosition.lat, currentPosition.lng,
                    poi.latitude, poi.longitude
                );
                return distance <= radius;
            });
        }
        
        // Otherwise, load from file first
        const allPoints = await loadFromJsonFile();
        
        // Then filter by distance
        return allPoints.filter(poi => {
            const distance = calculateDistance(
                currentPosition.lat, currentPosition.lng,
                poi.latitude, poi.longitude
            );
            return distance <= radius;
        });
    }
    
    /**
     * Calculate distance between two points (Haversine formula)
     * @param {number} lat1 - Latitude of point 1
     * @param {number} lon1 - Longitude of point 1
     * @param {number} lat2 - Latitude of point 2
     * @param {number} lon2 - Longitude of point 2
     * @returns {number} - Distance in meters
     */
    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of the earth in km
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1); 
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2); 
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        const d = R * c; // Distance in km
        return d * 1000; // Distance in meters
    }
    
    function deg2rad(deg) {
        return deg * (Math.PI/180);
    }
    
    // Public API
    return {
        loadFromJsonFile,
        loadFromAPI,
        loadNearbyPoints
    };
})();