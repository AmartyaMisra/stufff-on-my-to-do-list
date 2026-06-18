import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
// @ts-ignore
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import type { Station } from '../types';
import { type SatelliteData, getSatellitePosition, type SatelliteType } from '../lib/satelliteUtils';

interface TacticalGlobeProps {
    stations: Station[];
    satellites: SatelliteData[];
    selectedStation: Station | null;
    onSelect: (station: Station) => void;
    selectedSatellite: SatelliteData | null;
    onSelectSatellite: (satellite: SatelliteData | null) => void;
}

export const TacticalGlobe: React.FC<TacticalGlobeProps> = ({
    stations,
    satellites,
    selectedStation,
    onSelect,
    selectedSatellite,
    onSelectSatellite,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const globeRef = useRef<THREE.Mesh | null>(null);
    const markersRef = useRef<THREE.Group | null>(null);
    const satMarkersRef = useRef<THREE.Group | null>(null);
    const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
    const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
    const [clickFeedback, setClickFeedback] = useState(false);

    // Helper to get color by satellite type
    const getTypeColor = (type: SatelliteType) => {
        switch (type) {
            case 'MIL': return 0xff3333; // Red
            case 'GPS': return 0x33ff33; // Green
            case 'COMM': return 0x33ccff; // Cyan
            case 'WX': return 0xffffff; // White
            default: return 0xffaa00; // Yellow/Gold
        }
    };

    // Helper to create a small tactical satellite model
    const createSatelliteModel = (sat: SatelliteData, isSelected: boolean) => {
        const typeColor = getTypeColor(sat.type);
        const satGroup = new THREE.Group();

        // Main Body
        const bodyGeo = new THREE.BoxGeometry(0.015, 0.015, 0.025);
        const bodyMat = new THREE.MeshPhongMaterial({
            color: 0x111111, // Dark body
            emissive: isSelected ? typeColor : 0x111111,
            emissiveIntensity: isSelected ? 0.8 : 0.2,
            shininess: 50,
        });
        satGroup.add(new THREE.Mesh(bodyGeo, bodyMat));

        // Solar Panels
        const panelGeo = new THREE.BoxGeometry(0.04, 0.02, 0.002);
        const panelMat = new THREE.MeshPhongMaterial({
            color: typeColor,
            emissive: typeColor,
            emissiveIntensity: 0.4,
            shininess: 80,
        });

        const panel1 = new THREE.Mesh(panelGeo, panelMat);
        panel1.position.set(-0.0275, 0, 0);
        const panel2 = new THREE.Mesh(panelGeo, panelMat);
        panel2.position.set(0.0275, 0, 0);
        satGroup.add(panel1);
        satGroup.add(panel2);

        // Hit box
        const hitGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
        const hitMat = new THREE.MeshBasicMaterial({ visible: false });
        satGroup.add(new THREE.Mesh(hitGeo, hitMat));

        return satGroup;
    };

    // Initialise Three.js scene once
    useEffect(() => {
        if (!containerRef.current) return;

        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;

        const scene = new THREE.Scene();
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        camera.position.z = 4.5; // Zoomed out significantly
        cameraRef.current = camera;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 1);
        containerRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;
        renderer.domElement.style.cursor = 'crosshair';

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.enableZoom = true;
        controls.minDistance = 2.5;
        controls.maxDistance = 8.0;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.3;
        controlsRef.current = controls;

        // Lights
        const ambient = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambient);
        const sun = new THREE.DirectionalLight(0xffffff, 1.0);
        sun.position.set(5, 3, 5);
        scene.add(sun);

        // Starfield
        const starGeo = new THREE.BufferGeometry();
        const starCount = 2000;
        const starPos = new Float32Array(starCount * 3);
        for (let i = 0; i < starCount * 3; i++) {
            starPos[i] = (Math.random() - 0.5) * 100;
        }
        starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
        const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.08, transparent: true, opacity: 0.6 });
        const stars = new THREE.Points(starGeo, starMat);
        scene.add(stars);

        // Globe
        const globeGeo = new THREE.SphereGeometry(1, 48, 48);
        const globeMat = new THREE.MeshPhongMaterial({
            color: 0x051505,
            emissive: 0x000500,
            specular: 0x222222,
            shininess: 30,
            wireframe: false,
        });
        const globe = new THREE.Mesh(globeGeo, globeMat);
        scene.add(globe);
        globeRef.current = globe;

        // Wireframe overlay
        const wireGeo = new THREE.SphereGeometry(1.001, 32, 32);
        const wireMat = new THREE.MeshBasicMaterial({
            color: 0x004400,
            wireframe: true,
            transparent: true,
            opacity: 0.1,
        });
        scene.add(new THREE.Mesh(wireGeo, wireMat));

        // Texture
        const texLoader = new THREE.TextureLoader();
        texLoader.load(
            'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg',
            tex => {
                globeMat.map = tex;
                globeMat.color.setHex(0x888888);
                globeMat.needsUpdate = true;
            },
            undefined,
            err => console.log('Texture load error', err)
        );

        // Atmosphere glow
        const atmosGeo = new THREE.SphereGeometry(1.02, 32, 32);
        const atmosMat = new THREE.MeshPhongMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.08,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
        });
        scene.add(new THREE.Mesh(atmosGeo, atmosMat));

        // Marker groups
        const stationGroup = new THREE.Group();
        globe.add(stationGroup);
        markersRef.current = stationGroup;

        const satelliteGroup = new THREE.Group();
        scene.add(satelliteGroup);
        satMarkersRef.current = satelliteGroup;

        // Resize Observer
        const resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                camera.aspect = width / height;
                camera.updateProjectionMatrix();
                renderer.setSize(width, height);
            }
        });
        resizeObserver.observe(containerRef.current);

        // Click handling
        const onClick = (event: MouseEvent) => {
            if (!containerRef.current || !markersRef.current || !satMarkersRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            raycasterRef.current.setFromCamera(mouseRef.current, camera);

            // Check satellites
            const satHits = raycasterRef.current.intersectObjects(satMarkersRef.current.children, true);
            if (satHits.length > 0) {
                let obj: THREE.Object3D | null = satHits[0].object;
                while (obj && !obj.userData.satellite) {
                    obj = obj.parent as THREE.Object3D;
                }
                if (obj && obj.userData.satellite) {
                    onSelectSatellite(obj.userData.satellite);
                    setClickFeedback(true);
                    setTimeout(() => setClickFeedback(false), 200);
                    return;
                }
            }

            // Check stations
            const stationHits = raycasterRef.current.intersectObjects(markersRef.current.children);
            if (stationHits.length > 0) {
                const obj = stationHits[0].object;
                if (obj.userData.station) {
                    onSelect(obj.userData.station);
                    onSelectSatellite(null);
                    setClickFeedback(true);
                    setTimeout(() => setClickFeedback(false), 200);
                    return;
                }
            }

            onSelectSatellite(null);
            setClickFeedback(true);
            setTimeout(() => setClickFeedback(false), 200);
        };
        renderer.domElement.addEventListener('click', onClick);

        // Animation loop
        let lastTime = 0;
        const animate = (time: number) => {
            requestAnimationFrame(animate);
            controls.update();

            // Throttle satellite updates to ~30 FPS (33ms) to save CPU
            if (time - lastTime > 33) {
                lastTime = time;

                if (satMarkersRef.current && satMarkersRef.current.children.length > 0) {
                    const now = new Date();
                    const timeScale = 1.0;
                    const simulatedTime = new Date(now.getTime() + performance.now() * timeScale);

                    satMarkersRef.current.children.forEach(satGroup => {
                        const sat = (satGroup as any).userData?.satellite as SatelliteData | undefined;
                        if (!sat) return;

                        const pos = getSatellitePosition(sat, simulatedTime);
                        if (pos) {
                            const altScale = 1 + pos.alt / 6371;
                            const phi = (90 - pos.lat) * (Math.PI / 180);
                            const theta = (pos.lng + 180) * (Math.PI / 180);

                            const x = -(altScale * Math.sin(phi) * Math.cos(theta));
                            const y = altScale * Math.cos(phi);
                            const z = altScale * Math.sin(phi) * Math.sin(theta);

                            satGroup.position.set(x, y, z);
                            satGroup.lookAt(0, 0, 0);
                            satGroup.rotateX(Math.PI / 2);
                            satGroup.rotation.z += 0.05;
                        }
                    });
                }
            }

            renderer.render(scene, camera);
        };
        requestAnimationFrame(animate);

        return () => {
            resizeObserver.disconnect();
            renderer.domElement.removeEventListener('click', onClick);
            if (containerRef.current && renderer.domElement) {
                containerRef.current.removeChild(renderer.domElement);
            }
            renderer.dispose();
        };
    }, []);

    // Update station markers
    useEffect(() => {
        if (!markersRef.current || !globeRef.current) return;
        while (markersRef.current.children.length) {
            markersRef.current.remove(markersRef.current.children[0]);
        }
        stations.forEach(station => {
            const lat = station.coordinates.lat;
            const lng = station.coordinates.lng;

            const phi = (90 - lat) * (Math.PI / 180);
            const theta = (lng + 90) * (Math.PI / 180);

            const x = Math.sin(phi) * Math.cos(theta);
            const y = Math.cos(phi);
            const z = Math.sin(phi) * Math.sin(theta);

            const isSel = selectedStation?.id === station.id;

            const markerGeo = new THREE.SphereGeometry(0.01, 8, 8);
            const markerMat = new THREE.MeshBasicMaterial({
                color: isSel ? 0xffffff : 0x00ff00,
                transparent: true,
                opacity: isSel ? 1.0 : 0.6,
            });
            const marker = new THREE.Mesh(markerGeo, markerMat);
            marker.position.set(x, y, z);
            marker.userData = { station: station };
            markersRef.current!.add(marker);

            if (isSel) {
                const glowGeo = new THREE.SphereGeometry(0.02, 8, 8);
                const glowMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
                const glow = new THREE.Mesh(glowGeo, glowMat);
                glow.position.set(x, y, z);
                markersRef.current?.add(glow);
            }
        });
    }, [stations, selectedStation]);

    // Update satellite models
    useEffect(() => {
        if (!satMarkersRef.current) return;
        while (satMarkersRef.current.children.length) {
            satMarkersRef.current.remove(satMarkersRef.current.children[0]);
        }
        satellites.forEach(sat => {
            const isSel = selectedSatellite?.id === sat.id;
            const model = createSatelliteModel(sat, isSel);
            model.userData = { satellite: sat };
            satMarkersRef.current?.add(model);
        });
    }, [satellites, selectedSatellite]);

    return (
        <div className="relative w-full h-full bg-black border border-tactical-dim overflow-hidden">
            {/* Top‑left info */}
            <div className="absolute top-4 left-4 z-10 pointer-events-none space-y-1">
                <div className="text-xs text-tactical-dim">TARGET TRACKING</div>
                <div className="text-xl font-bold text-tactical-highlight">
                    {selectedStation ? selectedStation.coordinates.lat.toFixed(4) : '00.0000'} N
                </div>
                <div className="text-xl font-bold text-tactical-highlight">
                    {selectedStation ? selectedStation.coordinates.lng.toFixed(4) : '00.0000'} E
                </div>
                {selectedSatellite && (
                    <div className="pt-2 border-t border-tactical-dim/30 mt-2">
                        <div className="text-[10px] text-tactical-dim">ORBITAL TELEMETRY</div>
                        <div className="text-xs font-mono text-tactical-highlight">
                            ALT: 420.5 KM <br />
                            VEL: 7.66 KM/S <br />
                            INC: 51.64°
                        </div>
                    </div>
                )}
            </div>

            {/* Three.js canvas container */}
            <div ref={containerRef} className="w-full h-full" />

            {/* Bottom‑right satellite count */}
            <div className="absolute bottom-4 right-4 text-xs text-tactical-dim pointer-events-none text-right">
                <div>ORBITAL NETWORK // ACTIVE</div>
                <div className="text-tactical-highlight">{satellites.length} ASSETS TRACKED</div>
            </div>

            {/* Click feedback overlay */}
            {clickFeedback && (
                <div
                    className="absolute inset-0 bg-white opacity-10 pointer-events-none"
                    style={{ animation: 'fadeOut 0.2s forwards' }}
                />
            )}
        </div>
    );
};

/* Simple fade‑out keyframes */
const style = document.createElement('style');
style.innerHTML = `
@keyframes fadeOut {
  from { opacity: 0.1; }
  to { opacity: 0; }
}
`;
document.head.appendChild(style);
