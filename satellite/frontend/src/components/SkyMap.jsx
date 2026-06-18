import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";

/**
 * Tactical Sky Map
 * Renders a 3D celestial sphere.
 * Focuses on Spatial Context.
 */
export default function SkyMap({ events = [], selectedId = null }) {
  const mountRef = useRef();
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const animationRef = useRef(null);
  const sphereGroupRef = useRef(null); // Rotates

  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    if (!mountRef.current) return;

    // Check WebGL
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) throw new Error("WebGL not supported");
    } catch (e) {
      setHasWebGL(false);
      return;
    }

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 2000);
    camera.position.z = 450;
    camera.position.y = 100;
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // --- Content ---
    const group = new THREE.Group();
    scene.add(group);
    sphereGroupRef.current = group;

    // 1. Starfield
    const starGeo = new THREE.BufferGeometry();
    const starCount = 2000;
    const posArray = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 1500;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const starMat = new THREE.PointsMaterial({ color: 0x607a90, size: 1.5, transparent: true, opacity: 0.8 });
    const starMesh = new THREE.Points(starGeo, starMat);
    group.add(starMesh);

    // 2. Celestial Grid
    const gridHelper = new THREE.PolarGridHelper(200, 16, 8, 64, 0x1a2a40, 0x1a2a40);
    group.add(gridHelper);

    const sphereGrid = new THREE.Mesh(
      new THREE.SphereGeometry(200, 24, 24),
      new THREE.MeshBasicMaterial({ color: 0x00d4ff, wireframe: true, transparent: true, opacity: 0.05 })
    );
    group.add(sphereGrid);

    // Animation Loop
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);

      // Idle Rotation
      if (group) {
        group.rotation.y += 0.001;
      }

      // Pulse effects
      scene.children.forEach(c => {
        if (c.userData?.pulse) {
          c.scale.multiplyScalar(1.01);
          c.material.opacity -= 0.02;
          if (c.material.opacity <= 0) scene.remove(c);
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const onResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      rendererRef.current.setSize(w, h);
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (rendererRef.current) {
        rendererRef.current.dispose();
        mountRef.current?.removeChild(rendererRef.current.domElement);
      }
    };
  }, []);

  // Sync Data
  useEffect(() => {
    if (!sceneRef.current || !sphereGroupRef.current) return;
    const group = sphereGroupRef.current;

    // Clear old markers
    const markers = group.children.filter(c => c.name === 'marker');
    markers.forEach(m => group.remove(m));

    // Add new markers
    events.forEach(e => {
      const isSelected = (e.id === selectedId);

      // Calculate 3D Pos from RA/Dec
      const r = 200;
      const ra = (e.ra || 0) * (Math.PI / 180);
      const dec = (e.dec || 0) * (Math.PI / 180);

      const x = r * Math.cos(dec) * Math.cos(ra);
      const y = r * Math.sin(dec);
      const z = r * Math.cos(dec) * Math.sin(ra);

      const colorHex = {
        spaceweather: 0xFFD700,
        frb: 0xFF9500,
        neutrino: 0x00FFFF,
        fusion: 0xFF00FF,
        gw: 0x9933FF,
        unknown: 0x888888
      }[e.channel] || 0x888888;

      // FOCUS MODE: Dim non-selected events
      const dimFactor = (selectedId && !isSelected) ? 0.3 : 1.0;

      // Marker Mesh
      const size = isSelected ? 8 : 3;
      const geo = new THREE.SphereGeometry(size, 8, 8);
      const mat = new THREE.MeshBasicMaterial({
        color: isSelected ? 0xffffff : colorHex,
        transparent: true,
        opacity: dimFactor
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      mesh.name = 'marker';
      group.add(mesh);

      // Selection Highlight
      if (isSelected) {
        // Add a Vector Line from center
        const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(x, y, z)]);
        const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 });
        const line = new THREE.Line(lineGeo, lineMat);
        line.name = 'marker';
        group.add(line);

        // Add a Ring
        const ringGeo = new THREE.RingGeometry(12, 15, 32);
        const ringMat = new THREE.MeshBasicMaterial({ color: colorHex, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.set(x, y, z);
        ring.lookAt(0, 0, 0);
        ring.name = 'marker';
        group.add(ring);
      }
    });
  }, [events, selectedId]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden" }}>
      <div className="panel-title">
        <span>🌌</span> SPATIAL CONTEXT
      </div>
      <div ref={mountRef} style={{ width: "100%", height: "100%" }} />
      {/* Overlay Info */}
      <div style={{ position: "absolute", bottom: 5, right: 5, fontSize: "9px", color: "rgba(255,255,255,0.3)" }}>
        CELESTIAL SPHERE // RELATIVE FRAME
      </div>
    </div>
  );
}
