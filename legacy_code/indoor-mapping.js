/**
 * indoor-mapping.js
 * 
 * Indoor Mapping System
 * 
 * This module provides functionality for indoor location tracking and navigation
 * without relying on GPS (which doesn't work well indoors).
 * 
 * It uses a combination of:
 * - Relative position tracking
 * - Pre-defined reference points
 * - User-initiated location confirmation
 */

const IndoorMapping = (function() {
    // Reference points with known coordinates (latitude, longitude)
    // These would be predefined for the specific supermarket/factory
    const referencePoints = {
        'entrance': { lat: 40.7128, lng: -74.0060, name: 'Main Entrance' },
        'checkout': { lat: 40.7130, lng: -74.0062, name: 'Checkout Area' },
        'exit': { lat: 40.7129, lng: -74.0063, name: 'Emergency Exit' }
    };
    
    // Current user position
    let currentPosition = null;
    
    // Store for points of interest
    let pointsOfInterest = [];
    
    // Callbacks
    let onPositionUpdateCallbacks = [];
    let onPositionErrorCallbacks = [];
    
    /**
     * Initialize the indoor mapping system
     */
    function init() {
        // Try to get initial position from browser geolocation
        // This won't be accurate indoors but gives us a starting point
        tryGetGeolocation();
        
        // Set up motion detection for relative positioning
        setupMotionTracking();
        
        console.log('Indoor mapping system initialized');
    }
    
    /**
     * Try to get geolocation from browser
     */
    function tryGetGeolocation() {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                position => {
                    currentPosition = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    
                    notifyPositionUpdate();
                    console.log('Initial position acquired:', currentPosition);
                },
                error => {
                    console.error('Error getting geolocation:', error);
                    // Fall back to a default position (e.g., building entrance)
                    currentPosition = { ...referencePoints.entrance };
                    notifyPositionUpdate();
                }
            );
        } else {
            console.error('Geolocation not available');
            // Fall back to a default position
            currentPosition = { ...referencePoints.entrance };
            notifyPositionUpdate();
        }
    }
    
    /**
     * Set up device motion tracking for relative positioning
     */
    function setupMotionTracking() {
        // Check if DeviceMotionEvent is available
        if (window.DeviceMotionEvent) {
            // Request permission for iOS 13+ devices
            if (typeof DeviceMotionEvent.requestPermission === 'function') {
                document.body.addEventListener('click', function requestMotionPermission() {
                    DeviceMotionEvent.requestPermission()
                        .then(permissionState => {
                            if (permissionState === 'granted') {
                                window.addEventListener('devicemotion', handleMotion);
                            }
                        })
                        .catch(console.error);
                    document.body.removeEventListener('click', requestMotionPermission);
                }, {once: true});
            } else {
                // For non-iOS devices
                window.addEventListener('devicemotion', handleMotion);
            }
        }
    }
    
    /**
     * Handle device motion events for relative positioning
     */
    function handleMotion(event) {
        // This is a simplified implementation
        // A real implementation would use more sophisticated algorithms
        
        if (!currentPosition) return;
        
        // Get acceleration data
        const acceleration = event.accelerationIncludingGravity;
        
        // Implement a simple dead reckoning algorithm
        // This is a placeholder - real implementation would be more complex
        if (Math.abs(acceleration.x) > 2 || Math.abs(acceleration.z) > 2) {
            // User is moving
            // Update position based on motion
            // This is drastically simplified - real systems use IMU fusion algorithms
            currentPosition.lat += (acceleration.x * 0.00000001);
            currentPosition.lng += (acceleration.z * 0.00000001);
            
            notifyPositionUpdate();
        }
    }
    
    /**
     * Manually set current position to a known reference point
     */
    function setPositionToReference(referenceId) {
        if (referencePoints[referenceId]) {
            currentPosition = { ...referencePoints[referenceId] };
            notifyPositionUpdate();
            return true;
        }
        return false;
    }
    
    /**
     * Add a temporary reference point at current location
     */
    function addReferencePoint(id, name) {
        if (currentPosition) {
            referencePoints[id] = {
                lat: currentPosition.lat,
                lng: currentPosition.lng,
                name: name || id
            };
            return true;
        }
        return false;
    }
    
    /**
     * Set points of interest
     */
    function setPointsOfInterest(points) {
        pointsOfInterest = points;
    }
    
    /**
     * Get points of interest within a certain radius
     */
    function getPointsOfInterestNearby(radius = 50) {
        if (!currentPosition) return [];
        
        return pointsOfInterest.filter(poi => {
            const distance = calculateDistance(
                currentPosition.lat, currentPosition.lng,
                poi.latitude, poi.longitude
            );
            return distance <= radius;
        });
    }
    
    /**
     * Calculate distance between two points (Haversine formula)
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
    
    /**
     * Register position update callback
     */
    function onPositionUpdate(callback) {
        if (typeof callback === 'function') {
            onPositionUpdateCallbacks.push(callback);
        }
    }
    
    /**
     * Register position error callback
     */
    function onPositionError(callback) {
        if (typeof callback === 'function') {
            onPositionErrorCallbacks.push(callback);
        }
    }
    
    /**
     * Notify all registered callbacks about position update
     */
    function notifyPositionUpdate() {
        onPositionUpdateCallbacks.forEach(callback => {
            callback(currentPosition);
        });
    }
    
    /**
     * Get current position
     */
    function getCurrentPosition() {
        return currentPosition;
    }
    
    /**
     * Generate sample points of interest for testing
     * In a real application, these would come from a backend
     */
    function generateSamplePOIs() {
        if (!currentPosition) return [];
        
        // Generate POIs around current position
        const pois = [];
        const categories = ['products', 'promotions', 'exits', 'facilities'];
        const icons = ['shopping-cart', 'tag', 'door-open', 'info-sign'];
        
        // Product names for more realistic data
        const productNames = [
            'Fresh Produce', 'Dairy Products', 'Frozen Foods', 'Breakfast Items',
            'Snack Corner', 'Beverages', 'Canned Goods', 'Bakery', 
            'Household Items', 'Personal Care', 'Electronics', 'Clothing',
            'Sporting Goods', 'Toys & Games', 'Garden Center', 'Home Decor'
        ];
        
        // Promotion names
        const promoNames = [
            'Weekly Special', 'Clearance Sale', 'Buy One Get One', 'Flash Deal',
            'Member Discount', 'Seasonal Promotion', 'New Arrivals', 'Limited Time Offer'
        ];
        
        // Exit names
        const exitNames = [
            'Main Exit', 'North Exit', 'Emergency Exit', 'Staff Exit',
            'Parking Exit', 'Loading Dock', 'Side Entrance'
        ];
        
        // Facility names
        const facilityNames = [
            'Restrooms', 'Customer Service', 'Information Desk', 'ATM',
            'Cafe', 'Water Fountain', 'Elevator', 'Escalator', 'Seating Area'
        ];
        
        // Name arrays by category
        const namesByCategory = {
            'products': productNames,
            'promotions': promoNames,
            'exits': exitNames,
            'facilities': facilityNames
        };
        
        // Description templates by category
        const descriptionTemplates = {
            'products': [
                'Find our selection of {name} in this aisle.',
                'Browse our quality {name} products.',
                '{name} section with various options available.',
                'Freshly stocked {name} ready for you.'
            ],
            'promotions': [
                '25% off all items in this section!',
                'Buy one get one free until this weekend.',
                'Members get an extra 10% discount.',
                'Limited time offer on selected items.'
            ],
            'exits': [
                'Exit to parking lot.',
                'Emergency exit - please keep clear.',
                'Exit to mall corridor.',
                'Staff and deliveries only.'
            ],
            'facilities': [
                'Public facility available during store hours.',
                'Please see staff for assistance.',
                'Open to all customers.',
                'Wheelchair accessible.'
            ]
        };
        
        // Strategy: Create a distribution of points in different directions from the user
        // We'll use angles and varying distances to ensure good coverage in all directions
        
        // Generate 20 POIs with good spatial distribution
        for (let i = 0; i < 20; i++) {
            // Determine category - weight more towards products and promotions
            let categoryIndex;
            const categoryRoll = Math.random();
            if (categoryRoll < 0.5) {
                categoryIndex = 0; // products (50% chance)
            } else if (categoryRoll < 0.75) {
                categoryIndex = 1; // promotions (25% chance)
            } else if (categoryRoll < 0.9) {
                categoryIndex = 2; // exits (15% chance)
            } else {
                categoryIndex = 3; // facilities (10% chance)
            }
            
            const category = categories[categoryIndex];
            
            // Use angles to distribute points around the user
            // This will create a more realistic "store layout" feeling
            const angle = (i / 20) * 2 * Math.PI; // Distribute in a full circle
            
            // Vary the distance from 5 to 40 meters
            // Close enough to be visible, far enough to create a sense of space
            const distance = 5 + (Math.random() * 35);
            
            // Convert polar coordinates (angle, distance) to lat/lng offsets
            // These constants approximate meters to lat/lng at most locations
            // More precise conversion would depend on the exact location
            const latMetersPerDegree = 111111; // meters per degree latitude
            const lngMetersPerDegree = 111111 * Math.cos(currentPosition.lat * (Math.PI / 180));
            
            const latOffset = (distance * Math.sin(angle)) / latMetersPerDegree;
            const lngOffset = (distance * Math.cos(angle)) / lngMetersPerDegree;
            
            // Choose a name from the appropriate category
            const names = namesByCategory[category];
            const nameIndex = Math.floor(Math.random() * names.length);
            const name = names[nameIndex];
            
            // Choose a description template and fill it
            const templates = descriptionTemplates[category];
            const templateIndex = Math.floor(Math.random() * templates.length);
            let description = templates[templateIndex].replace('{name}', name.toLowerCase());
            
            pois.push({
                id: `poi-${i}`,
                name: name,
                description: description,
                category: category,
                icon: icons[categoryIndex],
                latitude: currentPosition.lat + latOffset,
                longitude: currentPosition.lng + lngOffset,
                // Add distance for debugging
                distance: Math.round(distance)
            });
        }
        
        // Sort by distance for easier debugging
        pois.sort((a, b) => a.distance - b.distance);
        
        console.log(`Generated ${pois.length} sample POIs around position:`, currentPosition);
        
        return pois;
    }
    
    // Public API
    return {
        init,
        getCurrentPosition,
        setPositionToReference,
        addReferencePoint,
        getPointsOfInterestNearby,
        setPointsOfInterest,
        generateSamplePOIs,
        onPositionUpdate,
        onPositionError
    };
})();