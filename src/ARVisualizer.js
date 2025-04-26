import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { sampleObjects } from './sampleData';

const ARVisualizer = () => {
  const mountRef = useRef(null);
  const [objects, setObjects] = useState([]);
  const [selectedObject, setSelectedObject] = useState(null);
  const [showDataPanel, setShowDataPanel] = useState(false);
  
  // Scene setup
  useEffect(() => {
    // Scene, camera, and renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);
    
    const camera = new THREE.PerspectiveCamera(
      75, 
      window.innerWidth / window.innerHeight, 
      0.1, 
      1000
    );
    camera.position.z = 5;
    
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);
    
    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    
    // Grid helper for spatial reference
    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
    scene.add(gridHelper);
    
    // Create 3D objects
    const objectsInScene = [];
    
    sampleObjects.forEach(objectData => {
      // Create marker mesh
      const geometry = new THREE.SphereGeometry(0.2, 16, 16);
      const material = new THREE.MeshStandardMaterial({ 
        color: objectData.color,
        emissive: objectData.color,
        emissiveIntensity: 0.3
      });
      const mesh = new THREE.Mesh(geometry, material);
      
      // Position based on data
      mesh.position.set(
        objectData.position.x,
        objectData.position.y,
        objectData.position.z
      );
      
      // Add pulse effect
      const pulseGeometry = new THREE.SphereGeometry(0.25, 16, 16);
      const pulseMaterial = new THREE.MeshBasicMaterial({
        color: objectData.color,
        transparent: true,
        opacity: 0.3
      });
      const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial);
      pulse.scale.set(1, 1, 1);
      pulse.userData = { pulseDirection: 1, minScale: 1, maxScale: 1.5 };
      mesh.add(pulse);
      
      // Add label
      const labelDiv = document.createElement('div');
      labelDiv.className = 'object-label';
      labelDiv.textContent = objectData.name;
      labelDiv.style.display = 'none';
      
      // Store the object with its metadata
      const objectWithMeta = {
        mesh,
        data: objectData,
        label: labelDiv
      };
      
      scene.add(mesh);
      objectsInScene.push(objectWithMeta);
    });
    
    setObjects(objectsInScene);
    
    // Raycaster for object selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    // Handle mouse click
    const handleMouseClick = (event) => {
      // Calculate mouse position in normalized device coordinates
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      
      // Update the raycaster
      raycaster.setFromCamera(mouse, camera);
      
      // Find intersections
      const meshes = objectsInScene.map(obj => obj.mesh);
      const intersects = raycaster.intersectObjects(meshes);
      
      // If we intersected with something
      if (intersects.length > 0) {
        const selectedMesh = intersects[0].object;
        const selectedObj = objectsInScene.find(obj => obj.mesh === selectedMesh);
        
        // Set the selected object
        setSelectedObject(selectedObj);
        setShowDataPanel(true);
        
        // Update visuals for the selected object
        objectsInScene.forEach(obj => {
          if (obj.mesh === selectedMesh) {
            // Highlight the selected object
            obj.mesh.scale.set(1.3, 1.3, 1.3);
            
            // Make pulse more prominent
            const pulse = obj.mesh.children[0];
            pulse.userData.minScale = 1.2;
            pulse.userData.maxScale = 2.5;
            pulse.userData.pulseSpeed = 0.02;
          } else {
            // Reset others
            obj.mesh.scale.set(1, 1, 1);
            
            // Reset pulse
            const pulse = obj.mesh.children[0];
            pulse.userData.minScale = 1;
            pulse.userData.maxScale = 1.5;
            pulse.userData.pulseSpeed = 0.01;
          }
        });
      } else {
        // If clicking on empty space, deselect
        setSelectedObject(null);
        setShowDataPanel(false);
        
        // Reset all objects
        objectsInScene.forEach(obj => {
          obj.mesh.scale.set(1, 1, 1);
          
          // Reset pulse
          const pulse = obj.mesh.children[0];
          pulse.userData.minScale = 1;
          pulse.userData.maxScale = 1.5;
          pulse.userData.pulseSpeed = 0.01;
        });
      }
    };
    
    // Handle mouse move for hover effects
    const handleMouseMove = (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      const meshes = objectsInScene.map(obj => obj.mesh);
      const intersects = raycaster.intersectObjects(meshes);
      
      // Show/hide labels based on hover
      objectsInScene.forEach(obj => {
        // Hide all labels by default
        obj.label.style.display = 'none';
        obj.mesh.material.emissiveIntensity = 0.3;
      });
      
      // Show label for hovered object
      if (intersects.length > 0) {
        const hoveredMesh = intersects[0].object;
        const hoveredObj = objectsInScene.find(obj => obj.mesh === hoveredMesh);
        
        if (hoveredObj) {
          // Position and show the label
          const vector = new THREE.Vector3();
          vector.setFromMatrixPosition(hoveredObj.mesh.matrixWorld);
          vector.project(camera);
          
          const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
          const y = (-(vector.y * 0.5) + 0.5) * window.innerHeight;
          
          hoveredObj.label.style.display = 'block';
          hoveredObj.label.style.left = `${x}px`;
          hoveredObj.label.style.top = `${y - 30}px`;
          
          // Enhance glow effect
          hoveredObj.mesh.material.emissiveIntensity = 0.7;
        }
      }
    };
    
    window.addEventListener('click', handleMouseClick);
    window.addEventListener('mousemove', handleMouseMove);
    
    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Update pulse animations
      objectsInScene.forEach(obj => {
        const pulse = obj.mesh.children[0];
        
        // Default pulse speed
        const pulseSpeed = pulse.userData.pulseSpeed || 0.01;
        
        // Update pulse scale
        if (pulse.userData.pulseDirection === 1) {
          pulse.scale.x += pulseSpeed;
          pulse.scale.y += pulseSpeed;
          pulse.scale.z += pulseSpeed;
          
          if (pulse.scale.x >= pulse.userData.maxScale) {
            pulse.userData.pulseDirection = -1;
          }
        } else {
          pulse.scale.x -= pulseSpeed;
          pulse.scale.y -= pulseSpeed;
          pulse.scale.z -= pulseSpeed;
          
          if (pulse.scale.x <= pulse.userData.minScale) {
            pulse.userData.pulseDirection = 1;
          }
        }
        
        // Update opacity based on scale
        pulse.material.opacity = 0.5 - ((pulse.scale.x - pulse.userData.minScale) / 
          (pulse.userData.maxScale - pulse.userData.minScale)) * 0.4;
      });
      
      controls.update();
      renderer.render(scene, camera);
    };
    
    animate();
    
    // Add HTML overlays to the DOM
    objectsInScene.forEach(obj => {
      document.body.appendChild(obj.label);
    });
    
    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup function
    return () => {
      window.removeEventListener('click', handleMouseClick);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      
      objectsInScene.forEach(obj => {
        if (obj.label.parentNode) {
          obj.label.parentNode.removeChild(obj.label);
        }
      });
      
      if (mountRef.current && mountRef.current.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);
  
  // Render data panel
  const renderDataPanel = () => {
    if (!selectedObject || !showDataPanel) return null;
    
    const { data } = selectedObject;
    
    return (
      <div className="data-panel">
        <div className="panel-header" style={{ backgroundColor: `#${data.color.toString(16)}` }}>
          <h3>{data.name}</h3>
          <button className="close-button" onClick={() => setShowDataPanel(false)}>×</button>
        </div>
        
        <div className="panel-content">
          <div className="data-section">
            <h4>Location</h4>
            <p>X: {data.position.x.toFixed(2)} m</p>
            <p>Y: {data.position.y.toFixed(2)} m</p>
            <p>Z: {data.position.z.toFixed(2)} m</p>
          </div>
          
          <div className="data-section">
            <h4>Properties</h4>
            <p>Type: {data.type}</p>
            <p>Status: {data.status}</p>
            <p>Last Updated: {data.lastUpdated}</p>
          </div>
          
          <div className="data-section">
            <h4>Recent Readings</h4>
            <div className="mini-chart">
              {data.readings.map((value, index) => (
                <div 
                  key={index} 
                  className="chart-bar"
                  style={{ 
                    height: `${value}%`,
                    backgroundColor: index === data.readings.length - 1 ? 
                      `#${data.color.toString(16)}` : '#3498db'
                  }}
                ></div>
              ))}
            </div>
          </div>
          
          <div className="action-buttons">
            <button className="action-button">Details</button>
            <button className="action-button">History</button>
            <button className="action-button">Share</button>
          </div>
        </div>
      </div>
    );
  };
  
  // Render minimap
  const renderMinimap = () => {
    return (
      <div className="minimap">
        <div className="minimap-header">
          <span>Map</span>
        </div>
        <div className="minimap-content">
          {objects.map(obj => (
            <div 
              key={obj.data.id}
              className={`map-marker ${selectedObject?.data.id === obj.data.id ? 'selected' : ''}`}
              style={{
                backgroundColor: `#${obj.data.color.toString(16)}`,
                left: `${(obj.data.position.x + 10) / 20 * 100}%`,
                top: `${(obj.data.position.z + 10) / 20 * 100}%`,
              }}
              onClick={() => {
                setSelectedObject(obj);
                setShowDataPanel(true);
              }}
            ></div>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <div className="ar-container">
      <div ref={mountRef} className="ar-scene"></div>
      
      {/* Render UI components */}
      {renderDataPanel()}
      {renderMinimap()}
      
      {/* Controls */}
      <div className="action-menu">
        <button className="menu-button add-button">+</button>
        <button className="menu-button search-button">🔍</button>
        <button className="menu-button voice-button">🎤</button>
      </div>
      
      {/* Status bar */}
      <div className="status-bar">
        <span>{objects.length} Objects Detected</span>
        <div className="status-indicator"></div>
      </div>
      
      {/* Instructions */}
      <div className="instructions">
        <p>Click on objects to view details. Drag to rotate camera.</p>
      </div>
    </div>
  );
};

export default ARVisualizer;