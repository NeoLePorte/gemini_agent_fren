import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import * as THREE from 'three';

const VizContainer = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;

  canvas {
    width: 100% !important;
    height: 100% !important;
    position: absolute;
    top: 0;
    left: 0;
  }
`;

interface AudioVizProps {
  volume: number;
  isActive: boolean;
}

const AudioViz: React.FC<AudioVizProps> = ({ volume, isActive }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const geometriesRef = useRef<THREE.Mesh<THREE.BufferGeometry, THREE.Material>[]>([]);
  const frameRef = useRef<number>(0);
  const lightsRef = useRef<THREE.PointLight[]>([]);

  // Initialize Three.js scene
  useEffect(() => {
    console.log('AudioViz mounting, container:', containerRef.current, 'THREE:', THREE);
    if (!containerRef.current) return;

    try {
      // Scene setup
      const scene = new THREE.Scene();
      sceneRef.current = scene;
      console.log('Scene created');

      // Camera setup
      const camera = new THREE.PerspectiveCamera(
        75,
        containerRef.current.clientWidth / containerRef.current.clientHeight,
        0.1,
        1000
      );
      camera.position.z = 5;
      cameraRef.current = camera;
      console.log('Camera set up, aspect ratio:', camera.aspect);

      // Renderer setup
      const renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true
      });
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      renderer.setClearColor(0x000000, 0);
      containerRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;
      console.log('Renderer initialized, size:', renderer.domElement.width, 'x', renderer.domElement.height);

      // Create geometric shapes representing Gemini
      const shapes: THREE.Mesh<THREE.BufferGeometry, THREE.Material>[] = [];
      const material = new THREE.MeshPhongMaterial({
        color: 0x00ffff,
        emissive: 0x0088ff,
        shininess: 200,
        transparent: true,
        opacity: 0.9,
        wireframe: true
      });

      // Core icosahedron
      const coreGeometry = new THREE.IcosahedronGeometry(1.2, 2);
      const core = new THREE.Mesh(coreGeometry, material);
      shapes.push(core);
      scene.add(core);
      console.log('Core geometry added');

      // Outer rings
      for (let i = 0; i < 3; i++) {
        const ringGeometry = new THREE.TorusGeometry(2 + i * 0.8, 0.08, 16, 100);
        const ring = new THREE.Mesh(ringGeometry, material);
        ring.rotation.x = Math.PI * 0.5;
        ring.rotation.y = i * Math.PI / 3;
        shapes.push(ring);
        scene.add(ring);
      }
      console.log('Rings added');

      // Add ambient light
      const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
      scene.add(ambientLight);

      // Add point lights
      const lights = [
        new THREE.PointLight(0x00ffff, 2, 15),
        new THREE.PointLight(0x0088ff, 2, 15),
        new THREE.PointLight(0x4444ff, 2, 15)
      ];

      lights[0].position.set(3, 3, 3);
      lights[1].position.set(-3, -3, -3);
      lights[2].position.set(0, 0, 3);

      lights.forEach(light => scene.add(light));
      lightsRef.current = lights;
      console.log('Lights added');

      geometriesRef.current = shapes;

      // Animation function
      const animate = () => {
        if (!rendererRef.current || !sceneRef.current || !cameraRef.current) {
          console.log('Missing refs in animation loop:', {
            renderer: !!rendererRef.current,
            scene: !!sceneRef.current,
            camera: !!cameraRef.current
          });
          return;
        }
        
        frameRef.current = requestAnimationFrame(animate);

        if (isActive) {
          // Rotate core with more dynamic movement
          core.rotation.x += 0.01;
          core.rotation.y += 0.015;
          core.rotation.z += 0.005 * Math.sin(Date.now() * 0.001);

          // Pulse core scale based on volume
          const scale = 1 + volume * 1.0;
          core.scale.set(scale, scale, scale);

          // Animate rings with more variation
          shapes.forEach((shape, i) => {
            if (i > 0) { // Skip core
              shape.rotation.x += 0.02 * (i + 1);
              shape.rotation.y += 0.03 / (i + 1);
              shape.rotation.z += 0.01 * Math.sin(Date.now() * 0.001 + i);
              
              // Modulate ring scale with volume
              const ringScale = 1 + volume * 0.5 * Math.sin(Date.now() * 0.002 + i * Math.PI / 2);
              shape.scale.set(ringScale, ringScale, ringScale);
            }
          });

          // Pulse light intensity with volume
          lights.forEach((light, i) => {
            light.intensity = 2 + volume * 2 * Math.sin(Date.now() * 0.003 + i * Math.PI / 3);
          });
        } else {
          // Slow idle animation when inactive
          core.rotation.y += 0.002;
          shapes.forEach((shape, i) => {
            if (i > 0) {
              shape.rotation.y += 0.001 * (i + 1);
            }
          });
        }

        rendererRef.current.render(sceneRef.current, cameraRef.current);
      };

      animate();
      console.log('Animation loop started');

    } catch (error) {
      console.error('Error initializing Three.js:', error);
    }

    // Cleanup function
    return () => {
      console.log('AudioViz cleanup');
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      if (containerRef.current && rendererRef.current?.domElement) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      geometriesRef.current.forEach(mesh => {
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      });
      rendererRef.current?.dispose();
    };
  }, []); // Only run on mount/unmount

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      
      rendererRef.current.setSize(width, height);
      console.log('Resized renderer:', width, 'x', height);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle volume and active state changes
  useEffect(() => {
    console.log('Volume or active state changed:', { volume, isActive });
    
    // Update core scale immediately when volume changes
    if (geometriesRef.current.length > 0) {
      const [core, ...rings] = geometriesRef.current;
      const scale = 1 + volume * 1.0;
      core.scale.set(scale, scale, scale);
      
      // Update ring scales
      rings.forEach((ring, i) => {
        const ringScale = 1 + volume * 0.5 * Math.sin(Date.now() * 0.002 + i * Math.PI / 2);
        ring.scale.set(ringScale, ringScale, ringScale);
      });
      
      // Update light intensities
      lightsRef.current.forEach((light, i) => {
        light.intensity = 2 + volume * 2 * Math.sin(Date.now() * 0.003 + i * Math.PI / 3);
      });
    }
  }, [volume, isActive]);

  console.log('AudioViz render, isActive:', isActive, 'volume:', volume);
  return <VizContainer ref={containerRef} />;
};

export default AudioViz; 