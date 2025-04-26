/**
 * app.js
 * Indoor AR Navigation App
 * Main application logic
 */

// Custom A-Frame component for clickable entities
AFRAME.registerComponent('clickable', {
    init: function() {
        const el = this.el;
        
        // Add event listener for click
        el.addEventListener('click', function() {
            const id = el.getAttribute('data-id');
            const name = el.getAttribute('data-name');
            const description = el.getAttribute('data-description');
            
            // Show details panel
            showPointDetails(id, name, description);
        });
    }
});

// Custom component for always facing the camera
AFRAME.registerComponent('look-at-camera', {
    tick: function() {
        const cameraEl = document.querySelector('a-camera');
        if (cameraEl) {
            const worldPos = new THREE.Vector3();
            cameraEl.object3D.getWorldPosition(worldPos);
            this.el.object3D.lookAt(worldPos);
        }
    }
});

// DOM elements
const loadingIndicator = document.getElementById('loading-indicator');
const locateBtn = document.getElementById('locate-btn');
const categoryFilter = document.getElementById('category-filter');
const detailsPanel = document.getElementById('place-details');
const placeName = document.getElementById('place-name');
const placeDescription = document.getElementById('place-description');
const closeDetailsBtn = document.getElementById('close-details');
const debugBtn = document.getElementById('debug-btn');
const debugInfo = document.getElementById('debug-info');
const debugContent = document.getElementById('debug-content');

// Application state
let currentPOIs = [];
let selectedCategory = 'all';
let debugMode = false; // Can be toggled for testing

// Initialize the application
function init() {
    // Initialize indoor mapping system
    IndoorMapping.init();
    
    // Set up event listeners
    setupEventListeners();
    
    // Register position update callback
    IndoorMapping.onPositionUpdate(function(position) {
        // When position is updated, refresh nearby points
        refreshNearbyPoints();
        
        // Update debug info if in debug mode
        if (debugMode) {
            updateDebugInfo();
        }
    });
    
    // Initial loading of POIs
    setTimeout(refreshNearbyPoints, 2000);
    
    // Set up regular debug info updates
    setInterval(function() {
        if (debugMode) {
            updateDebugInfo();
        }
    }, 2000); // Update every 2 seconds
}

// Set up event listeners
function setupEventListeners() {
    // Locate button click
    locateBtn.addEventListener('click', function() {
        refreshNearbyPoints();
    });
    
    // Category filter change
    categoryFilter.addEventListener('change', function() {
        selectedCategory = this.value;
        updateVisiblePOIs();
    });
    
    // Close details button
    closeDetailsBtn.addEventListener('click', function() {
        hidePointDetails();
    });
    
    // Debug button toggle
    debugBtn.addEventListener('click', function() {
        debugMode = !debugMode;
        
        if (debugMode) {
            debugBtn.classList.add('active');
            debugInfo.classList.add('active');
            updateDebugInfo();
        } else {
            debugBtn.classList.remove('active');
            debugInfo.classList.remove('active');
        }
    });
}

// Refresh nearby points of interest
function refreshNearbyPoints() {
    showLoading();
    
    // Use our data loader to get points near the current position
    DataLoader.loadNearbyPoints(50)
        .then(pois => {
            currentPOIs = pois;
            
            // If no POIs were found, fall back to generated sample data
            if (pois.length === 0) {
                console.log('No POIs found in data file, generating samples');
                currentPOIs = IndoorMapping.generateSamplePOIs();
            }
            
            // Update AR scene with new POIs
            updateARScene();
            
            hideLoading();
        })
        .catch(error => {
            console.error('Error loading nearby points:', error);
            
            // Fall back to generated sample data
            currentPOIs = IndoorMapping.generateSamplePOIs();
            updateARScene();
            
            hideLoading();
        });
}

// Update AR scene with points of interest
function updateARScene() {
    // Clear existing entities
    clearAREntities();
    
    // Create new entities
    currentPOIs.forEach(poi => {
        createAREntity(poi);
    });
    
    // Update visibility based on category filter
    updateVisiblePOIs();
}

// Clear existing AR entities
function clearAREntities() {
    const entities = document.querySelectorAll('.ar-point-entity');
    entities.forEach(entity => {
        entity.parentNode.removeChild(entity);
    });
}

// Create AR entity for a point of interest
function createAREntity(poi) {
    const scene = document.querySelector('a-scene');
    
    // Create main entity
    const entity = document.createElement('a-entity');
    entity.classList.add('ar-point-entity');
    entity.classList.add(`category-${poi.category}`);
    entity.setAttribute('gps-entity-place', `latitude: ${poi.latitude}; longitude: ${poi.longitude};`);
    entity.setAttribute('data-category', poi.category);
    entity.setAttribute('data-id', poi.id);
    entity.setAttribute('data-name', poi.name);
    entity.setAttribute('data-description', poi.description || '');
    
    // Create card-style entity instead of geometric shapes
    const card = document.createElement('a-entity');
    
    // Background panel
    let bgColor;
    switch (poi.category) {
        case 'products': bgColor = 'rgba(76, 175, 80, 0.9)'; break;
        case 'promotions': bgColor = 'rgba(255, 152, 0, 0.9)'; break;
        case 'exits': bgColor = 'rgba(244, 67, 54, 0.9)'; break;
        case 'facilities': bgColor = 'rgba(33, 150, 243, 0.9)'; break;
        default: bgColor = 'rgba(156, 39, 176, 0.9)';
    }
    
    // Create card panel
    const panel = document.createElement('a-plane');
    panel.setAttribute('width', '2');
    panel.setAttribute('height', '1.5');
    panel.setAttribute('color', '#FFFFFF');
    panel.setAttribute('material', 'opacity: 0.9; shader: flat;');
    panel.setAttribute('position', '0 0 0');
    panel.setAttribute('clickable', '');
    panel.setAttribute('data-id', poi.id);
    panel.setAttribute('data-name', poi.name);
    panel.setAttribute('data-description', poi.description || '');
    
    // Add header bar
    const header = document.createElement('a-plane');
    header.setAttribute('width', '2');
    header.setAttribute('height', '0.4');
    header.setAttribute('color', bgColor);
    header.setAttribute('position', '0 0.55 0.01');
    header.setAttribute('material', 'shader: flat;');
    
    // Add category icon
    const iconEntity = document.createElement('a-text');
    let iconSymbol;
    switch(poi.category) {
        case 'products': iconSymbol = '🛒'; break;
        case 'promotions': iconSymbol = '🏷️'; break;
        case 'exits': iconSymbol = '🚪'; break;
        case 'facilities': iconSymbol = 'ℹ️'; break;
        default: iconSymbol = '📍';
    }
    
    iconEntity.setAttribute('value', iconSymbol);
    iconEntity.setAttribute('align', 'center');
    iconEntity.setAttribute('width', '1.5');
    iconEntity.setAttribute('position', '-0.8 0.55 0.02');
    
    // Add item name to header
    const nameText = document.createElement('a-text');
    nameText.setAttribute('value', poi.name);
    nameText.setAttribute('align', 'center');
    nameText.setAttribute('color', '#FFFFFF');
    nameText.setAttribute('width', '1.8');
    nameText.setAttribute('position', '0.2 0.55 0.02');
    
    // Add description text
    const descText = document.createElement('a-text');
    let descValue = poi.description || 'No description available';
    // Limit description length to prevent overflow
    if (descValue.length > 75) {
        descValue = descValue.substring(0, 72) + '...';
    }
    descText.setAttribute('value', descValue);
    descText.setAttribute('align', 'left');
    descText.setAttribute('color', '#333333');
    descText.setAttribute('width', '1.8');
    descText.setAttribute('position', '-0.9 0.1 0.02');
    
    // Add distance info for reference
    const distanceText = document.createElement('a-text');
    const distanceValue = poi.distance ? `Distance: ~${poi.distance}m` : '';
    distanceText.setAttribute('value', distanceValue);
    distanceText.setAttribute('align', 'right');
    distanceText.setAttribute('color', '#555555');
    distanceText.setAttribute('width', '1.8');
    distanceText.setAttribute('position', '0.9 -0.5 0.02');
    
    // Footer bar with category
    const footer = document.createElement('a-plane');
    footer.setAttribute('width', '2');
    footer.setAttribute('height', '0.3');
    footer.setAttribute('color', bgColor);
    footer.setAttribute('position', '0 -0.6 0.01');
    footer.setAttribute('material', 'shader: flat; opacity: 0.7');
    
    const categoryText = document.createElement('a-text');
    categoryText.setAttribute('value', poi.category.charAt(0).toUpperCase() + poi.category.slice(1));
    categoryText.setAttribute('align', 'center');
    categoryText.setAttribute('color', '#FFFFFF');
    categoryText.setAttribute('width', '1.8');
    categoryText.setAttribute('position', '0 -0.6 0.02');
    
    // Make the card face the camera
    card.setAttribute('look-at-camera', '');
    
    // Add hover animation
    card.setAttribute('animation', 'property: position; to: 0 0.1 0; dur: 1000; easing: easeInOutQuad; loop: true; dir: alternate');
    
    // Add all elements to card
    card.appendChild(panel);
    card.appendChild(header);
    card.appendChild(iconEntity);
    card.appendChild(nameText);
    card.appendChild(descText);
    card.appendChild(distanceText);
    card.appendChild(footer);
    card.appendChild(categoryText);
    
    // Add card to main entity
    entity.appendChild(card);
    
    // Add to scene
    scene.appendChild(entity);
}

// Update visible POIs based on category filter
function updateVisiblePOIs() {
    const entities = document.querySelectorAll('.ar-point-entity');
    
    entities.forEach(entity => {
        const category = entity.getAttribute('data-category');
        
        if (selectedCategory === 'all' || category === selectedCategory) {
            entity.setAttribute('visible', true);
        } else {
            entity.setAttribute('visible', false);
        }
    });
}

// Show point details
function showPointDetails(id, name, description) {
    placeName.textContent = name || 'Unknown Point';
    placeDescription.textContent = description || 'No description available.';
    detailsPanel.classList.add('active');
}

// Hide point details
function hidePointDetails() {
    detailsPanel.classList.remove('active');
}

// Show loading indicator
function showLoading() {
    loadingIndicator.classList.add('active');
}

// Hide loading indicator
function hideLoading() {
    loadingIndicator.classList.remove('active');
}

// Update debug information display
function updateDebugInfo() {
    if (!debugMode) return;
    
    // Get current position
    const position = IndoorMapping.getCurrentPosition();
    const positionStr = position ? 
        `Lat: ${position.lat.toFixed(6)}, Lng: ${position.lng.toFixed(6)}` : 
        'Unknown';
    
    // Build debug content
    let html = `
        <p><strong>Current Position:</strong> ${positionStr}</p>
        <p><strong>Points of Interest:</strong> ${currentPOIs.length}</p>
        <p><strong>Selected Category:</strong> ${selectedCategory}</p>
        <hr>
        <p><strong>Nearby Points:</strong></p>
        <ul>
    `;
    
    // Sort POIs by distance for the list
    const sortedPOIs = [...currentPOIs].sort((a, b) => 
        (a.distance || 0) - (b.distance || 0)
    );
    
    // Add POIs to list
    sortedPOIs.forEach(poi => {
        const distance = poi.distance ? `~${poi.distance}m` : 'Unknown';
        html += `
            <li>
                <strong>${poi.name}</strong> (${poi.category})<br>
                Distance: ${distance}
            </li>
        `;
    });
    
    html += '</ul>';
    
    // Update debug content
    debugContent.innerHTML = html;
}

// Update debug info after AR scene updates
const originalUpdateARScene = updateARScene;
updateARScene = function() {
    originalUpdateARScene.apply(this, arguments);
    updateDebugInfo();
};

// Initialize the app once DOM is loaded
document.addEventListener('DOMContentLoaded', init);