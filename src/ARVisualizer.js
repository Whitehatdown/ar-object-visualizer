import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { sampleObjects } from './sampleData';

const ImprovedARVisualizer = () => {
  const mountRef = useRef(null);
  const videoRef = useRef(null);
  const [objects, setObjects] = useState([]);
  const [selectedObject, setSelectedObject] = useState(null);
  const [showDataPanel, setShowDataPanel] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [videoStream, setVideoStream] = useState(null);
  const [isArSupported, setIsArSupported] = useState(false);
  
  // References for tracking
  const positionRef = useRef({ x: 0, y: 0, z: 0 });
  const rotationRef = useRef({ x: 0, y: 0, z: 0 });
  const lastAcceleration = useRef({ x: 0, y: 0, z: 0 });
  const velocity = useRef({ x: 0, y: 0, z: 0 });
  const lastTimestamp = useRef(0);
  const arSessionRef = useRef(null);
  
  // Check for WebXR support on component mount
  useEffect(() => {
    // Check for WebXR support
    if ('xr' in navigator) {
      navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
        setIsArSupported(supported);
      });
    }
    
    // Fallback to DeviceMotion/Orientation if WebXR is not available
    if (window.DeviceMotionEvent && window.DeviceOrientationEvent) {
      setIsArSupported(true);
    }
    
    // Request camera access
    requestCameraAccess();
    
    // Request motion and orientation permissions
    requestSensorPermissions();
    
    return () => {
      if (arSessionRef.current) {
        arSessionRef.current.end();
      }
      stopCameraStream();
    };
  }, []);
  
  // Request sensor permissions
  const requestSensorPermissions = async () => {
    // Request DeviceOrientation permission on iOS 13+
    if (typeof DeviceOrientationEvent !== 'undefined' && 
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const permissionState = await DeviceOrientationEvent.requestPermission();
        if (permissionState === 'granted') {
          window.addEventListener('deviceorientation', handleOrientation);
        }
      } catch (error) {
        console.error("Error requesting orientation permission:", error);
      }
    } else {
      // Non-iOS or older iOS devices don't need explicit permission
      window.addEventListener('deviceorientation', handleOrientation);
    }
    
    // Request DeviceMotion permission on iOS 13+
    if (typeof DeviceMotionEvent !== 'undefined' && 
        typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        const permissionState = await DeviceMotionEvent.requestPermission();
        if (permissionState === 'granted') {
          window.addEventListener('devicemotion', handleMotion);
        }
      } catch (error) {
        console.error("Error requesting motion permission:", error);
      }
    } else {
      // Non-iOS or older iOS devices don't need explicit permission
      window.addEventListener('devicemotion', handleMotion);
    }
  };
  
  // Handle device orientation
  const handleOrientation = (event) => {
    // Update rotation reference with device orientation data
    rotationRef.current = {
      x: THREE.MathUtils.degToRad(event.beta || 0),  // x-axis rotation [deg]
      y: THREE.MathUtils.degToRad(event.alpha || 0), // y-axis rotation [deg]
      z: THREE.MathUtils.degToRad(event.gamma || 0)  // z-axis rotation [deg]
    };
  };
  
  // Handle device motion for position tracking
  const handleMotion = (event) => {
    if (!event.accelerationIncludingGravity) return;
    
    const now = performance.now();
    const dt = (now - lastTimestamp.current) / 1000; // time delta in seconds
    lastTimestamp.current = now;
    
    if (dt === 0) return; // Avoid division by zero
    
    // Simple high-pass filter to remove gravity and get linear acceleration
    const accel = {
      x: event.accelerationIncludingGravity.x - lastAcceleration.current.x,
      y: event.accelerationIncludingGravity.y - lastAcceleration.current.y,
      z: event.accelerationIncludingGravity.z - lastAcceleration.current.z
    };
    
    // Apply low-pass filter to reduce noise
    const alpha = 0.8;
    accel.x = accel.x * alpha + lastAcceleration.current.x * (1 - alpha);
    accel.y = accel.y * alpha + lastAcceleration.current.y * (1 - alpha);
    accel.z = accel.z * alpha + lastAcceleration.current.z * (1 - alpha);
    
    // Update last acceleration values
    lastAcceleration.current = { ...accel };
    
    // Apply a dead zone to filter out tiny movements (noise)
    const deadZone = 0.1;
    if (Math.abs(accel.x) < deadZone) accel.x = 0;
    if (Math.abs(accel.y) < deadZone) accel.y = 0;
    if (Math.abs(accel.z) < deadZone) accel.z = 0;
    
    // Update velocity using acceleration
    velocity.current.x += accel.x * dt;
    velocity.current.y += accel.y * dt;
    velocity.current.z += accel.z * dt;
    
    // Apply damping to velocity to prevent drift
    const damping = 0.95;
    velocity.current.x *= damping;
    velocity.current.y *= damping;
    velocity.current.z *= damping;
    
    // Update position based on velocity
    positionRef.current.x += velocity.current.x * dt * 0.1; // Scale factor to control movement speed
    positionRef.current.y += velocity.current.y * dt * 0.1;
    positionRef.current.z += velocity.current.z * dt * 0.1;
  };
  
  // Start a WebXR session if available
  const startARSession = async () => {
    if (!navigator.xr) {
      console.log("WebXR not supported in this browser");
      return;
    }
    
    try {
      const session = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['local-floor'], // Use real-world floor as reference
        optionalFeatures: ['dom-overlay'],
        domOverlay: { root: document.getElementById('ar-overlay') }
      });
      
      arSessionRef.current = session;
      
      // Set up WebXR session
      // This is a simplified version; a full implementation would need more setup
      session.addEventListener('end', () => {
        arSessionRef.current = null;
      });
      
      console.log("WebXR AR session started");
    } catch (error) {
      console.error("Error starting AR session:", error);
    }
  };
  
  // Request camera access
  const requestCameraAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: "environment", 
          width: { ideal: window.innerWidth },
          height: { ideal: window.innerHeight }
        } 
      });
      
      setVideoStream(stream);
      setCameraActive(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("Could not access the camera. Please check permissions.");
    }
  };
  
  // Stop camera stream
  const stopCameraStream = () => {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      setVideoStream(null);
      setCameraActive(false);
    }
  };
  
  // Scene setup
  useEffect(() => {
    if (!cameraActive) return;
    
    // Scene setup
    const scene = new THREE.Scene();
    
    const camera = new THREE.PerspectiveCamera(
      75, 
      window.innerWidth / window.innerHeight, 
      0.1, 
      1000
    );
    
    // Initial camera position
    camera.position.set(0, 1.6, 0); // Approximate standing eye height
    
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0); // Transparent background
    
    // Add renderer to DOM
    mountRef.current.appendChild(renderer.domElement);
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    
    // Add ground grid for reference
    const gridHelper = new THREE.GridHelper(20, 20, 0x555555, 0x333333);
    gridHelper.position.y = -0.1; // Just below eye level
    gridHelper.material.opacity = 0.4;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);
    
    // Factory floor markers - create a more realistic factory environment
    createFactoryEnvironment(scene);
    
    // Create sensor objects based on sampleData
    const objectsInScene = [];
    
    sampleObjects.forEach(objectData => {
      // Create sensor object
      const sensorObject = createSensorObject(objectData);
      scene.add(sensorObject.mesh);
      objectsInScene.push(sensorObject);
    });
    
    setObjects(objectsInScene);
    
    // Raycaster for object selection
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    
    // Handle tap/click
    const handleTap = (event) => {
      // Calculate pointer position in normalized device coordinates (-1 to +1)
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
      
      // Update the raycaster with the camera and pointer position
      raycaster.setFromCamera(pointer, camera);
      
      // Get list of intersected objects
      const intersects = raycaster.intersectObjects(scene.children, true);
      
      // Check if we hit something
      if (intersects.length > 0) {
        // Find the sensor object from our intersected object
        let found = false;
        
        for (let i = 0; i < intersects.length; i++) {
          const intersectedObject = intersects[i].object;
          
          // Find the root object (the sensor)
          let rootObject = intersectedObject;
          while (rootObject.parent && rootObject.parent !== scene) {
            rootObject = rootObject.parent;
          }
          
          // Find this object in our list
          const selectedObj = objectsInScene.find(obj => obj.mesh === rootObject);
          
          if (selectedObj) {
            setSelectedObject(selectedObj);
            setShowDataPanel(true);
            found = true;
            
            // Hide all label sprites
            objectsInScene.forEach(obj => {
              if (obj.labelSprite) {
                obj.labelSprite.visible = obj === selectedObj;
              }
            });
            
            break;
          }
        }
        
        // If we didn't find a sensor, hide the data panel
        if (!found) {
          setShowDataPanel(false);
          
          // Hide all label sprites
          objectsInScene.forEach(obj => {
            if (obj.labelSprite) {
              obj.labelSprite.visible = false;
            }
          });
        }
      } else {
        // Clear selection if we hit nothing
        setShowDataPanel(false);
        
        // Hide all label sprites
        objectsInScene.forEach(obj => {
          if (obj.labelSprite) {
            obj.labelSprite.visible = false;
          }
        });
      }
    };
    
    // Add event listeners
    window.addEventListener('click', handleTap);
    window.addEventListener('touchend', (e) => handleTap(e.changedTouches[0]));
    
    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Update camera rotation from device orientation
      if (rotationRef.current) {
        // Create a rotation quaternion from Euler angles
        const quaternion = new THREE.Quaternion();
        const euler = new THREE.Euler(
          rotationRef.current.x,
          rotationRef.current.y, 
          rotationRef.current.z,
          'YXZ' // This order matters for mobile orientation
        );
        quaternion.setFromEuler(euler);
        
        // Apply rotation to camera
        camera.quaternion.copy(quaternion);
      }
      
      // Update camera position from estimated movement
      if (positionRef.current) {
        // Convert device movement to camera movement
        // We need to apply camera's rotation to the movement vector
        
        // Create direction vector from our position reference
        const movement = new THREE.Vector3(
          positionRef.current.x,
          positionRef.current.y,
          positionRef.current.z
        );
        
        // Apply movement based on camera's rotation
        movement.applyQuaternion(camera.quaternion);
        
        // Update camera position
        camera.position.add(movement);
      }
      
      // Update all objects
      objectsInScene.forEach(obj => {
        // Make labels always face the camera
        if (obj.labelSprite) {
          obj.labelSprite.lookAt(camera.position);
        }
        
        // Update pulse animations
        if (obj.pulse) {
          const pulse = obj.pulse;
          const pulseData = pulse.userData;
          
          // Update scale based on pulse direction
          if (pulseData.pulseDirection === 1) {
            pulse.scale.x += pulseData.pulseSpeed;
            pulse.scale.y += pulseData.pulseSpeed;
            pulse.scale.z += pulseData.pulseSpeed;
            
            if (pulse.scale.x >= pulseData.maxScale) {
              pulseData.pulseDirection = -1;
            }
          } else {
            pulse.scale.x -= pulseData.pulseSpeed;
            pulse.scale.y -= pulseData.pulseSpeed;
            pulse.scale.z -= pulseData.pulseSpeed;
            
            if (pulse.scale.x <= pulseData.minScale) {
              pulseData.pulseDirection = 1;
            }
          }
          
          // Update opacity
          pulse.material.opacity = 0.5 - ((pulse.scale.x - pulseData.minScale) / 
            (pulseData.maxScale - pulseData.minScale)) * 0.4;
        }
        
        // Rotate status indicators
        if (obj.statusIndicator) {
          obj.statusIndicator.rotation.y += 0.01;
        }
      });
      
      // Render the scene
      renderer.render(scene, camera);
    };
    
    // Start animation loop
    const animationId = requestAnimationFrame(animate);
    
    // Cleanup function
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('click', handleTap);
      window.removeEventListener('touchend', handleTap);
      window.removeEventListener('resize', handleResize);
      
      // Clean up Three.js resources
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
      
      if (mountRef.current && mountRef.current.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      // Remove event listeners
      window.removeEventListener('deviceorientation', handleOrientation);
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [cameraActive]);
  
  // Create a sensor visualization object
  const createSensorObject = (sensorData) => {
    // Main group for the sensor
    const sensorGroup = new THREE.Group();
    
    // Create the main sensor body
    const geometry = new THREE.SphereGeometry(0.2, 32, 32);
    const material = new THREE.MeshStandardMaterial({ 
      color: sensorData.color,
      emissive: sensorData.color,
      emissiveIntensity: 0.4,
      roughness: 0.3,
      metalness: 0.8
    });
    const sensorMesh = new THREE.Mesh(geometry, material);
    
    // Position the sensor at its specified location
    sensorMesh.position.set(
      sensorData.position.x,
      sensorData.position.y,
      sensorData.position.z
    );
    
    // Add the sensor to the group
    sensorGroup.add(sensorMesh);
    
    // Add pulse effect
    const pulseGeometry = new THREE.SphereGeometry(0.25, 32, 32);
    const pulseMaterial = new THREE.MeshBasicMaterial({
      color: sensorData.color,
      transparent: true,
      opacity: 0.4
    });
    const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial);
    
    // Configure pulse based on sensor status
    let pulseSpeed = 0.01;
    let maxScale = 1.5;
    
    switch(sensorData.status) {
      case "Critical":
        pulseSpeed = 0.03;
        maxScale = 2.0;
        break;
      case "Warning":
        pulseSpeed = 0.02;
        maxScale = 1.8;
        break;
      case "Offline":
        pulseSpeed = 0.005;
        maxScale = 1.2;
        break;
      default: // Active
        pulseSpeed = 0.01;
        maxScale = 1.5;
    }
    
    pulse.userData = { 
      pulseDirection: 1, 
      minScale: 1, 
      maxScale: maxScale,
      pulseSpeed: pulseSpeed
    };
    
    sensorMesh.add(pulse);
    
    // Add status indicator
    const statusGeometry = new THREE.BoxGeometry(0.05, 0.05, 0.05);
    const statusColor = getStatusColor(sensorData.status);
    const statusMaterial = new THREE.MeshBasicMaterial({ color: statusColor });
    const statusIndicator = new THREE.Mesh(statusGeometry, statusMaterial);
    statusIndicator.position.set(0, 0.3, 0);
    sensorMesh.add(statusIndicator);
    
    // Create a text sprite for the label
    const labelSprite = createLabelSprite(sensorData.name, sensorData.status);
    labelSprite.position.set(0, 0.5, 0);
    labelSprite.visible = false; // Hidden by default
    sensorMesh.add(labelSprite);
    
    // Add an optional cable/pipe connecting to the ground
    if (sensorData.position.y > 0.3) {
      const cableGeometry = new THREE.CylinderGeometry(0.02, 0.02, sensorData.position.y, 8);
      const cableMaterial = new THREE.MeshStandardMaterial({
        color: 0x444444,
        roughness: 0.8,
        metalness: 0.3
      });
      const cable = new THREE.Mesh(cableGeometry, cableMaterial);
      cable.position.set(0, -sensorData.position.y/2, 0);
      sensorMesh.add(cable);
    }
    
    return {
      mesh: sensorGroup,
      data: sensorData,
      pulse: pulse,
      statusIndicator: statusIndicator,
      labelSprite: labelSprite
    };
  };
  
  // Create a label sprite with status indicator
  const createLabelSprite = (name, status) => {
    // Create canvas for the sprite texture
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 128;
    
    // Colors based on status
    let statusColor;
    switch(status) {
      case "Critical": statusColor = "#e74c3c"; break;
      case "Warning": statusColor = "#f39c12"; break;
      case "Offline": statusColor = "#7f8c8d"; break;
      default: statusColor = "#2ecc71"; // Active
    }
    
    // Background with rounded corners
    context.fillStyle = 'rgba(25, 28, 36, 0.85)';
    context.strokeStyle = statusColor;
    context.lineWidth = 3;
    
    const rectWidth = 210;
    const rectHeight = 50;
    const cornerRadius = 8;
    
    // Draw rounded rectangle
    context.beginPath();
    context.moveTo(20 + cornerRadius, 10);
    context.lineTo(20 + rectWidth - cornerRadius, 10);
    context.quadraticCurveTo(20 + rectWidth, 10, 20 + rectWidth, 10 + cornerRadius);
    context.lineTo(20 + rectWidth, 10 + rectHeight - cornerRadius);
    context.quadraticCurveTo(20 + rectWidth, 10 + rectHeight, 20 + rectWidth - cornerRadius, 10 + rectHeight);
    context.lineTo(20 + cornerRadius, 10 + rectHeight);
    context.quadraticCurveTo(20, 10 + rectHeight, 20, 10 + rectHeight - cornerRadius);
    context.lineTo(20, 10 + cornerRadius);
    context.quadraticCurveTo(20, 10, 20 + cornerRadius, 10);
    context.closePath();
    
    // Fill and stroke
    context.fill();
    context.stroke();
    
    // Add status indicator
    context.fillStyle = statusColor;
    context.beginPath();
    context.arc(35, 35, 6, 0, Math.PI * 2);
    context.fill();
    
    // Add text
    context.font = 'bold 20px Arial';
    context.fillStyle = 'white';
    context.textAlign = 'left';
    context.textBaseline = 'middle';
    context.fillText(name, 50, 35);
    
    // Create sprite from texture
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ 
      map: texture,
      transparent: true
    });
    
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(1.0, 0.5, 1);
    
    return sprite;
  };
  
  // Create a factory environment with visual markers
  const createFactoryEnvironment = (scene) => {
    // Add walls to create a factory-like space
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.8,
      metalness: 0.2
    });
    
    // Floor
    const floorGeometry = new THREE.PlaneGeometry(20, 20);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x666666,
      roughness: 0.9,
      metalness: 0.1
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.1;
    scene.add(floor);
    
    // Add some factory equipment (simplified shapes)
    
    // Machine 1 - Box shape
    const machine1Geometry = new THREE.BoxGeometry(1.5, 1.2, 0.8);
    const machine1Material = new THREE.MeshStandardMaterial({
      color: 0x3498db,
      roughness: 0.7,
      metalness: 0.3
    });
    const machine1 = new THREE.Mesh(machine1Geometry, machine1Material);
    machine1.position.set(-3, 0.6, -2);
    scene.add(machine1);
    
    // Machine 2 - Cylinder shape
    const machine2Geometry = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 16);
    const machine2Material = new THREE.MeshStandardMaterial({
      color: 0xe74c3c,
      roughness: 0.6,
      metalness: 0.4
    });
    const machine2 = new THREE.Mesh(machine2Geometry, machine2Material);
    machine2.position.set(3, 0.75, -1);
    scene.add(machine2);
    
    // Workbench
    const workbenchGeometry = new THREE.BoxGeometry(2, 0.1, 1);
    const workbenchLegsGeometry = new THREE.BoxGeometry(0.1, 0.7, 0.1);
    const workbenchMaterial = new THREE.MeshStandardMaterial({
      color: 0x795548,
      roughness: 0.9,
      metalness: 0.1
    });
    
    const workbenchGroup = new THREE.Group();
    
    const workbenchTop = new THREE.Mesh(workbenchGeometry, workbenchMaterial);
    workbenchTop.position.set(0, 0.7, 0);
    workbenchGroup.add(workbenchTop);
    
    // Add legs
    const leg1 = new THREE.Mesh(workbenchLegsGeometry, workbenchMaterial);
    leg1.position.set(-0.9, 0.35, -0.4);
    workbenchGroup.add(leg1);
    
    const leg2 = new THREE.Mesh(workbenchLegsGeometry, workbenchMaterial);
    leg2.position.set(-0.9, 0.35, 0.4);
    workbenchGroup.add(leg2);
    
    const leg3 = new THREE.Mesh(workbenchLegsGeometry, workbenchMaterial);
    leg3.position.set(0.9, 0.35, -0.4);
    workbenchGroup.add(leg3);
    
    const leg4 = new THREE.Mesh(workbenchLegsGeometry, workbenchMaterial);
    leg4.position.set(0.9, 0.35, 0.4);
    workbenchGroup.add(leg4);
    
    workbenchGroup.position.set(0, 0, 2);
    scene.add(workbenchGroup);
    
    // Add safety/zone markings on floor
    const createFloorMarking = (width, depth, color, position) => {
      const markingGeometry = new THREE.PlaneGeometry(width, depth);
      const markingMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
      });
      const marking = new THREE.Mesh(markingGeometry, markingMaterial);
      marking.rotation.x = -Math.PI / 2;
      marking.position.set(position.x, 0.01, position.z); // Slightly above floor
      scene.add(marking);
    };
    
    // Add zone markings
    createFloorMarking(2, 2, 0xf1c40f, { x: -3, z: -2 }); // Yellow zone around machine 1
    createFloorMarking(1.5, 1.5, 0xe74c3c, { x: 3, z: -1 }); // Red zone around machine 2
    createFloorMarking(2.5, 1.5, 0x2ecc71, { x: 0, z: 2 }); // Green zone around workbench
    
    // Add some pipes along walls or ceiling
    const createPipe = (start, end, radius, color) => {
      // Calculate pipe length and orientation
      const direction = new THREE.Vector3().subVectors(end, start);
      const length = direction.length();
      
      // Create pipe geometry
      const pipeGeometry = new THREE.CylinderGeometry(radius, radius, length, 8);
      const pipeMaterial = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.7,
        metalness: 0.3
      });
      
      // Position and orient the pipe
      const pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
      
      // Position at midpoint
      pipe.position.copy(start).add(direction.multiplyScalar(0.5));
      
      // Orient along direction
      pipe.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0), // Default cylinder orientation is along Y
        direction.clone().normalize()
      );
      
      scene.add(pipe);
    };
    
    // Add some pipes
    createPipe(
      new THREE.Vector3(-4, 2, -3),
      new THREE.Vector3(4, 2, -3),
      0.05,
      0x3498db
    ); // Blue pipe
    
    createPipe(
      new THREE.Vector3(-4, 2, 3),
      new THREE.Vector3(4, 2, 3),
      0.05,
      0xe74c3c
    ); // Red pipe
    
    createPipe(
      new THREE.Vector3(-4, 2, -3),
      new THREE.Vector3(-4, 2, 3),
      0.05, 
      0x2ecc71
    ); // Green pipe
    
    return {
      floor,
      machine1,
      machine2,
      workbenchGroup
    };
  };
  
  // Helper function to get status color
  const getStatusColor = (status) => {
    switch(status) {
      case "Critical": return 0xff0000;
      case "Warning": return 0xffcc00;
      case "Offline": return 0x888888;
      default: return 0x00ff00; // Active
    }
  };
  
  // Format date string nicely
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Get status indicator class
  const getStatusClass = (status) => {
    switch(status) {
      case "Critical": return "status-critical";
      case "Warning": return "status-warning";
      case "Offline": return "status-offline";
      default: return "status-active";
    }
  };
  
  // Reset position tracking
  const resetTracking = () => {
    positionRef.current = { x: 0, y: 0, z: 0 };
    velocity.current = { x: 0, y: 0, z: 0 };
    lastAcceleration.current = { x: 0, y: 0, z: 0 };
  };
  
  // Render data panel for selected sensor
  const renderDataPanel = () => {
    if (!selectedObject || !showDataPanel) return null;
    
    const { data } = selectedObject;
    const statusClass = getStatusClass(data.status);
    
    return (
      <div className="data-panel card-ui">
        <div className="panel-header" style={{ backgroundColor: `#${data.color.toString(16)}` }}>
          <div className="header-content">
            <div className={`status-indicator ${statusClass}`}></div>
            <h3>{data.name}</h3>
          </div>
          <button className="close-button" onClick={() => setShowDataPanel(false)}>×</button>
        </div>
        
        <div className="panel-content">
          <div className="data-grid">
            <div className="data-section location-section">
              <h4>Location</h4>
              <div className="data-grid-row">
                <div className="data-grid-cell">
                  <span className="data-label">X:</span>
                  <span className="data-value">{data.position.x.toFixed(2)} m</span>
                </div>
                <div className="data-grid-cell">
                  <span className="data-label">Y:</span>
                  <span className="data-value">{data.position.y.toFixed(2)} m</span>
                </div>
                <div className="data-grid-cell">
                  <span className="data-label">Z:</span>
                  <span className="data-value">{data.position.z.toFixed(2)} m</span>
                </div>
              </div>
            </div>
            
            <div className="data-section properties-section">
              <h4>Properties</h4>
              <div className="data-grid-row">
                <div className="data-grid-cell">
                  <span className="data-label">Type:</span>
                  <span className="data-value">{data.type}</span>
                </div>
                <div className="data-grid-cell">
                  <span className="data-label">Status:</span>
                  <span className={`data-value ${statusClass}`}>{data.status}</span>
                </div>
              </div>
              <div className="data-grid-row">
                <div className="data-grid-cell full-width">
                  <span className="data-label">Last Updated:</span>
                  <span className="data-value">{formatDate(data.lastUpdated)}</span>
                </div>
              </div>
              <div className="data-grid-row">
                <div className="data-grid-cell full-width">
                  <span className="data-label">Description:</span>
                  <span className="data-value description">{data.description}</span>
                </div>
              </div>
            </div>
            
            <div className="data-section readings-section">
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
                  >
                    <span className="tooltip">{value}</span>
                  </div>
                ))}
              </div>
              <div className="chart-legend">
                <span>Past</span>
                <span>Present</span>
              </div>
            </div>
          </div>
          
          <div className="action-buttons">
            <button className="action-button">
              <i className="icon-details"></i>
              <span>Details</span>
            </button>
            <button className="action-button">
              <i className="icon-history"></i>
              <span>History</span>
            </button>
            <button className="action-button">
              <i className="icon-share"></i>
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // Render status bar
  const renderStatusBar = () => {
    if (!objects.length) return null;
    
    const activeObjects = objects.filter(obj => obj.data.status === "Active").length;
    const warningObjects = objects.filter(obj => obj.data.status === "Warning").length;
    const criticalObjects = objects.filter(obj => obj.data.status === "Critical").length;
    
    return (
      <div className="status-bar card-ui">
        <div className="status-content">
          <div className="object-count">
            <span className="count-number">{objects.length}</span>
            <span className="count-label">Sensors</span>
          </div>
          <div className="status-indicators">
            <div className="status-group">
              <div className="status-dot status-active"></div>
              <span>{activeObjects}</span>
            </div>
            <div className="status-group">
              <div className="status-dot status-warning"></div>
              <span>{warningObjects}</span>
            </div>
            <div className="status-group">
              <div className="status-dot status-critical"></div>
              <span>{criticalObjects}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Render compass for orientation
  const renderCompass = () => {
    return (
      <div className="compass-container card-ui">
        <div className="compass">
          <div className="compass-north">N</div>
          <div className="compass-east">E</div>
          <div className="compass-south">S</div>
          <div className="compass-west">W</div>
          <div className="compass-needle"></div>
        </div>
      </div>
    );
  };
  
  // Render control buttons
  const renderControls = () => {
    return (
      <div className="controls-container card-ui">
        <button 
          className="control-button" 
          onClick={resetTracking}
          title="Reset Tracking"
        >
          <i className="icon-reset"></i>
        </button>
        <button 
          className="control-button" 
          onClick={() => setShowDataPanel(false)}
          title="Close All Panels"
        >
          <i className="icon-close-all"></i>
        </button>
      </div>
    );
  };
  
  // Render AR permissions view
  const renderPermissionsView = () => {
    if (cameraActive) return null;
    
    return (
      <div className="permissions-view">
        <div className="permissions-card card-ui">
          <h2>AR Factory Visualizer</h2>
          <p>This application uses augmented reality to visualize and interact with sensors and equipment in your factory space.</p>
          
          <div className="permissions-item">
            <div className="permission-icon camera-icon">📷</div>
            <div className="permission-info">
              <h3>Camera Access</h3>
              <p>Required to display virtual objects in your real environment</p>
              <button className="permission-button" onClick={requestCameraAccess}>
                Grant Camera Access
              </button>
            </div>
          </div>
          
          <div className="permissions-item">
            <div className="permission-icon motion-icon">📱</div>
            <div className="permission-info">
              <h3>Motion Sensors</h3>
              <p>Required to track your position in the factory</p>
              <button className="permission-button" onClick={requestSensorPermissions}>
                Grant Motion Access
              </button>
            </div>
          </div>
          
          <div className="permissions-note">
            <p><strong>Note:</strong> For the best experience, please hold your device upright and move slowly through your space.</p>
          </div>
        </div>
      </div>
    );
  };
  
  // Main render function
  return (
    <div className="ar-container">
      {/* Camera feed for AR background */}
      {cameraActive && (
        <video 
          ref={videoRef}
          className="camera-feed"
          autoPlay
          playsInline
          muted
        />
      )}
      
      {/* Three.js scene */}
      <div ref={mountRef} className="ar-scene"></div>
      
      {/* AR Overlay - this div is used for WebXR DOM overlay */}
      <div id="ar-overlay" className="ar-overlay">
        {/* UI Components */}
        <div className="ui-layer">
          {renderDataPanel()}
          {renderStatusBar()}
          {renderCompass()}
          {renderControls()}
          
          {/* Instructions overlay */}
          {cameraActive && (
            <div className="instructions card-ui">
              <p>Walk around to explore the factory. Tap on sensors to view details.</p>
              <button className="dismiss-button">✕</button>
            </div>
          )}
        </div>
      </div>
      
      {/* Permissions view */}
      {renderPermissionsView()}
    </div>
  );
};

export default ImprovedARVisualizer;