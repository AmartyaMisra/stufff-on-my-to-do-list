import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import * as satellite from 'satellite.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Activity, Radio, Zap, Satellite, Wifi, Cpu, Database, Terminal, Globe as GlobeIcon, AlertTriangle, Lock, Search, Volume2, VolumeX, Minimize2, Maximize2, CloudRain, Play } from 'lucide-react';
// RadioPanel removed
import StationCard from './components/StationCard';
import { FlightRadarEmbed, CrimeMapEmbed, HamRadioPanel, WeatherMapEmbed } from './components/EmbeddedMaps';
import audioManager from './utils/AudioManager';

// --- CONFIGURATION ---
const MODE_CONFIG = {
    RADIO: { color: 0x10b981, icon: Radio, theme: 'emerald', label: 'GLOBAL RADIO' },
    NEWS: { color: 0x3b82f6, icon: Activity, theme: 'blue', label: 'NEWS WIRE' },
    TACTICAL: { color: 0x991b1b, icon: Zap, theme: 'red', label: 'INCIDENT DATA' },
    ATS: { color: 0xf59e0b, icon: Satellite, theme: 'amber', label: 'ATS DATALINK (DATA ONLY)' },
    WEATHER: { color: 0x8b5cf6, icon: CloudRain, theme: 'violet', label: 'METEOROLOGICAL DATA' }
};

const API_KEY = null; // Set to null for simulation mode
const EARTH_RADIUS = 10;

// --- HELPER: GLOW TEXTURE ---
const createGlowTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(0, 255, 255, 1)');
    grad.addColorStop(0.4, 'rgba(0, 100, 255, 0.5)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(canvas);
};

// --- WEATHER CITIES DATABASE ---
const WEATHER_CITIES = [
    { name: 'New York', country: 'USA', lat: 40.7128, lon: -74.0060 },
    { name: 'London', country: 'UK', lat: 51.5074, lon: -0.1278 },
    { name: 'Tokyo', country: 'Japan', lat: 35.6762, lon: 139.6503 },
    { name: 'Paris', country: 'France', lat: 48.8566, lon: 2.3522 },
    { name: 'Sydney', country: 'Australia', lat: -33.8688, lon: 151.2093 },
    { name: 'Moscow', country: 'Russia', lat: 55.7558, lon: 37.6173 },
    { name: 'Beijing', country: 'China', lat: 39.9042, lon: 116.4074 },
    { name: 'Cairo', country: 'Egypt', lat: 30.0444, lon: 31.2357 },
    { name: 'Rio de Janeiro', country: 'Brazil', lat: -22.9068, lon: -43.1729 },
    { name: 'Cape Town', country: 'South Africa', lat: -33.9249, lon: 18.4241 },
    { name: 'Mumbai', country: 'India', lat: 19.0760, lon: 72.8777 },
    { name: 'Los Angeles', country: 'USA', lat: 34.0522, lon: -118.2437 },
    { name: 'Toronto', country: 'Canada', lat: 43.6532, lon: -79.3832 },
    { name: 'Berlin', country: 'Germany', lat: 52.5200, lon: 13.4050 },
    { name: 'Dubai', country: 'UAE', lat: 25.2048, lon: 55.2708 },
    { name: 'Singapore', country: 'Singapore', lat: 1.3521, lon: 103.8198 },
    { name: 'Bangkok', country: 'Thailand', lat: 13.7563, lon: 100.5018 },
    { name: 'Istanbul', country: 'Turkey', lat: 41.0082, lon: 28.9784 },
    { name: 'Seoul', country: 'South Korea', lat: 37.5665, lon: 126.9780 },
    { name: 'Mexico City', country: 'Mexico', lat: 19.4326, lon: -99.1332 },
    { name: 'Lima', country: 'Peru', lat: -12.0464, lon: -77.0428 },
    { name: 'Buenos Aires', country: 'Argentina', lat: -34.6037, lon: -58.3816 },
    { name: 'Santiago', country: 'Chile', lat: -33.4489, lon: -70.6693 },
    { name: 'Madrid', country: 'Spain', lat: 40.4168, lon: -3.7038 },
    { name: 'Rome', country: 'Italy', lat: 41.9028, lon: 12.4964 },
    { name: 'Lagos', country: 'Nigeria', lat: 6.5244, lon: 3.3792 },
    { name: 'Nairobi', country: 'Kenya', lat: -1.2921, lon: 36.8219 },
    { name: 'Jakarta', country: 'Indonesia', lat: -6.2088, lon: 106.8456 },
    { name: 'Manila', country: 'Philippines', lat: 14.5995, lon: 120.9842 },
    { name: 'Karachi', country: 'Pakistan', lat: 24.8607, lon: 67.0011 },
    { name: 'Tehran', country: 'Iran', lat: 35.6892, lon: 51.3890 },
    { name: 'Baghdad', country: 'Iraq', lat: 33.3152, lon: 44.3661 },
    { name: 'Riyadh', country: 'Saudi Arabia', lat: 24.7136, lon: 46.6753 },
    { name: 'Tel Aviv', country: 'Israel', lat: 32.0853, lon: 34.7818 },
    { name: 'Athens', country: 'Greece', lat: 37.9838, lon: 23.7275 },
    { name: 'Kiev', country: 'Ukraine', lat: 50.4501, lon: 30.5234 },
    { name: 'Warsaw', country: 'Poland', lat: 52.2297, lon: 21.0122 },
    { name: 'Stockholm', country: 'Sweden', lat: 59.3293, lon: 18.0686 },
    { name: 'Oslo', country: 'Norway', lat: 59.9139, lon: 10.7522 },
    { name: 'Helsinki', country: 'Finland', lat: 60.1699, lon: 24.9384 },
    { name: 'Reykjavik', country: 'Iceland', lat: 64.1466, lon: -21.9426 },
    { name: 'Anchorage', country: 'USA', lat: 61.2181, lon: -149.9003 },
    { name: 'Vancouver', country: 'Canada', lat: 49.2827, lon: -123.1207 },
    { name: 'Honolulu', country: 'USA', lat: 21.3069, lon: -157.8583 },
    { name: 'Auckland', country: 'New Zealand', lat: -36.8485, lon: 174.7633 },
    { name: 'Fiji', country: 'Fiji', lat: -17.7134, lon: 178.0650 },
    { name: 'Casablanca', country: 'Morocco', lat: 33.5731, lon: -7.5898 },
    { name: 'Addis Ababa', country: 'Ethiopia', lat: 9.0320, lon: 38.7444 },
    { name: 'Kinshasa', country: 'DRC', lat: -4.4419, lon: 15.2663 },
    { name: 'Antananarivo', country: 'Madagascar', lat: -18.8792, lon: 47.5079 },
    { name: 'Bogota', country: 'Colombia', lat: 4.7110, lon: -74.0721 },
    { name: 'Caracas', country: 'Venezuela', lat: 10.4806, lon: -66.9036 },
    { name: 'La Paz', country: 'Bolivia', lat: -16.5000, lon: -68.1500 },
    { name: 'Montreal', country: 'Canada', lat: 45.5017, lon: -73.5673 },
    { name: 'Chicago', country: 'USA', lat: 41.8781, lon: -87.6298 },
    { name: 'Houston', country: 'USA', lat: 29.7604, lon: -95.3698 },
    { name: 'Dublin', country: 'Ireland', lat: 53.3498, lon: -6.2603 },
    { name: 'Lisbon', country: 'Portugal', lat: 38.7223, lon: -9.1393 },
    { name: 'Vienna', country: 'Austria', lat: 48.2082, lon: 16.3738 },
    { name: 'Budapest', country: 'Hungary', lat: 47.4979, lon: 19.0402 },
    { name: 'Prague', country: 'Czechia', lat: 50.0755, lon: 14.4378 },
    { name: 'Bucharest', country: 'Romania', lat: 44.4268, lon: 26.1025 },
    { name: 'Bangalore', country: 'India', lat: 12.9716, lon: 77.5946 },
    { name: 'Dhaka', country: 'Bangladesh', lat: 23.8103, lon: 90.4125 },
    { name: 'Ho Chi Minh City', country: 'Vietnam', lat: 10.8231, lon: 106.6297 },
    { name: 'Kuala Lumpur', country: 'Malaysia', lat: 3.1390, lon: 101.6869 },
    { name: 'Taipei', country: 'Taiwan', lat: 25.0330, lon: 121.5654 },
    { name: 'Osaka', country: 'Japan', lat: 34.6937, lon: 135.5023 },
    { name: 'Perth', country: 'Australia', lat: -31.9505, lon: 115.8605 },
    { name: 'Brisbane', country: 'Australia', lat: -27.4698, lon: 153.0251 },
    { name: 'Vladivostok', country: 'Russia', lat: 43.1198, lon: 131.8869 },
    { name: 'Novosibirsk', country: 'Russia', lat: 55.0084, lon: 82.9357 },
    { name: 'Almaty', country: 'Kazakhstan', lat: 43.2220, lon: 76.8512 },
    { name: 'Ulaanbaatar', country: 'Mongolia', lat: 47.9181, lon: 106.9176 },
    { name: 'Nuuk', country: 'Greenland', lat: 64.1814, lon: -51.6941 },
    { name: 'Fairbanks', country: 'USA', lat: 64.8378, lon: -147.7164 },
    { name: 'Manaus', country: 'Brazil', lat: -3.1190, lon: -60.0217 },
    { name: 'Quito', country: 'Ecuador', lat: -0.1807, lon: -78.4678 },
    { name: 'Dakar', country: 'Senegal', lat: 14.7167, lon: -17.4677 },
    { name: 'Accra', country: 'Ghana', lat: 5.6037, lon: -0.1870 },
    { name: 'Luanda', country: 'Angola', lat: -8.8390, lon: 13.2894 },
    { name: 'Dar es Salaam', country: 'Tanzania', lat: -6.7924, lon: 39.2083 },
    { name: 'Khartoum', country: 'Sudan', lat: 15.5007, lon: 32.5599 },
    { name: 'Tashkent', country: 'Uzbekistan', lat: 41.2995, lon: 69.2401 },
    { name: 'Kabul', country: 'Afghanistan', lat: 34.5553, lon: 69.2075 },
    { name: 'Kathmandu', country: 'Nepal', lat: 27.7172, lon: 85.3240 },
    { name: 'Yangon', country: 'Myanmar', lat: 16.8409, lon: 96.1735 },
    { name: 'Kunming', country: 'China', lat: 24.8801, lon: 102.8329 },
    { name: 'Harbin', country: 'China', lat: 45.8038, lon: 126.5349 },
    { name: 'Sapporo', country: 'Japan', lat: 43.0618, lon: 141.3545 },
    { name: 'Darwin', country: 'Australia', lat: -12.4634, lon: 130.8456 },
    { name: 'Alice Springs', country: 'Australia', lat: -23.6980, lon: 133.8807 },
    { name: 'Port Moresby', country: 'PNG', lat: -9.4438, lon: 147.1803 },
    { name: 'Noumea', country: 'New Caledonia', lat: -22.2558, lon: 166.4505 },
    { name: 'Punta Arenas', country: 'Chile', lat: -53.1638, lon: -70.9171 },
    { name: 'Ushuaia', country: 'Argentina', lat: -54.8019, lon: -68.3030 },
    { name: 'Murmansk', country: 'Russia', lat: 68.9585, lon: 33.0827 },
    { name: 'Norilsk', country: 'Russia', lat: 69.3558, lon: 88.1893 },
    { name: 'Yakutsk', country: 'Russia', lat: 62.0397, lon: 129.7422 }
];

const NODES = {
    RADIO: [
        // SomaFM Stations (Reliable, High Quality)
        { id: 'r1', city: 'SomaFM Groove Salad', lat: 37.7749, lon: -122.4194, freq: '128k', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://ice1.somafm.com/groovesalad-128-mp3') },
        { id: 'r2', city: 'SomaFM Drone Zone', lat: 37.7649, lon: -122.4094, freq: 'AMBIENT', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://ice1.somafm.com/dronezone-128-mp3') },
        { id: 'r3', city: 'SomaFM DEF CON', lat: 36.1699, lon: -115.1398, freq: 'TECH', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://ice1.somafm.com/defcon-128-mp3') },
        { id: 'r4', city: 'SomaFM Secret Agent', lat: 37.7849, lon: -122.4294, freq: 'LOUNGE', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://ice1.somafm.com/secretagent-128-mp3') },
        { id: 'r5', city: 'SomaFM Space Station', lat: 28.5383, lon: -80.6674, freq: 'SPACE', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://ice1.somafm.com/spacestation-128-mp3') },
        { id: 'r6', city: 'SomaFM Underground 80s', lat: 40.7128, lon: -74.0060, freq: '80s', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://ice1.somafm.com/u80s-128-mp3') },
        { id: 'r7', city: 'SomaFM Mission Control', lat: 29.5502, lon: -95.0928, freq: 'NASA', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://ice1.somafm.com/missioncontrol-128-mp3') },
        { id: 'r8', city: 'SomaFM Boot Liquor', lat: 36.1627, lon: -86.7816, freq: 'COUNTRY', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://ice1.somafm.com/bootliquor-128-mp3') },
        { id: 'r9', city: 'SomaFM Fluid', lat: 34.0522, lon: -118.2437, freq: 'TRIP', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://ice1.somafm.com/fluid-128-mp3') },
        { id: 'r10', city: 'SomaFM BAGeL Radio', lat: 37.8716, lon: -122.2727, freq: 'ECLECTIC', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://ice1.somafm.com/bagel-128-mp3') },
        { id: 'r11', city: 'SomaFM Suburbs of Goa', lat: 15.2993, lon: 74.1240, freq: 'GOA', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://ice1.somafm.com/suburbsofgoa-128-mp3') },
        { id: 'r12', city: 'SomaFM Illinois Street', lat: 41.8781, lon: -87.6298, freq: 'LOUNGE', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://ice1.somafm.com/illstreet-128-mp3') },
        { id: 'r13', city: 'SomaFM PopTron', lat: 51.5074, lon: -0.1278, freq: 'SYNTH', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://ice1.somafm.com/poptron-128-mp3') },
        { id: 'r14', city: 'SomaFM Seven Inch Soul', lat: 42.3314, lon: -83.0458, freq: 'SOUL', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://ice1.somafm.com/7soul-128-mp3') },
        { id: 'r15', city: 'SomaFM Left Coast 70s', lat: 34.0195, lon: -118.4912, freq: '70s', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://ice1.somafm.com/seventies-128-mp3') },
        // Radio Paradise (High Quality)
        { id: 'r16', city: 'Radio Paradise Main', lat: 39.1911, lon: -106.8175, freq: '320k', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://stream.radioparadise.com/aac-320') },
        { id: 'r17', city: 'Radio Paradise Mellow', lat: 39.2011, lon: -106.8275, freq: 'MELLOW', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://stream.radioparadise.com/mellow-320') },
        { id: 'r18', city: 'Radio Paradise Rock', lat: 39.1811, lon: -106.8075, freq: 'ROCK', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://stream.radioparadise.com/rock-320') },
        // KEXP Seattle
        { id: 'r19', city: 'KEXP Seattle', lat: 47.6062, lon: -122.3321, freq: '90.3', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://kexp-mp3-128.streamguys1.com/kexp128.mp3') },
        // FIP (French Radio)
        { id: 'r20', city: 'FIP Paris', lat: 48.8566, lon: 2.3522, freq: '105.1', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://icecast.radiofrance.fr/fip-midfi.mp3') },
        { id: 'r21', city: 'FIP Rock', lat: 48.8666, lon: 2.3622, freq: 'ROCK', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://icecast.radiofrance.fr/fiprock-midfi.mp3') },
        { id: 'r22', city: 'FIP Jazz', lat: 48.8466, lon: 2.3422, freq: 'JAZZ', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://icecast.radiofrance.fr/fipjazz-midfi.mp3') },
        { id: 'r23', city: 'FIP Electro', lat: 48.8766, lon: 2.3722, freq: 'ELECTRO', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://icecast.radiofrance.fr/fipelectro-midfi.mp3') },
        { id: 'r24', city: 'FIP World', lat: 48.8366, lon: 2.3322, freq: 'WORLD', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://icecast.radiofrance.fr/fipworld-midfi.mp3') },
        // Swiss Radio
        { id: 'r25', city: 'Radio Swiss Jazz', lat: 47.3769, lon: 8.5417, freq: 'JAZZ', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('http://stream.srg-ssr.ch/m/rsj/mp3_128') },
        { id: 'r26', city: 'Radio Swiss Classic', lat: 47.3869, lon: 8.5517, freq: 'CLASSIC', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('http://stream.srg-ssr.ch/m/rsc_de/mp3_128') },
        { id: 'r27', city: 'Radio Swiss Pop', lat: 47.3669, lon: 8.5317, freq: 'POP', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('http://stream.srg-ssr.ch/m/rsp/mp3_128') },
        // NTS Radio London
        { id: 'r28', city: 'NTS Radio 1', lat: 51.5074, lon: -0.1278, freq: 'ECLECTIC', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://stream-relay-geo.ntslive.net/stream') },
        { id: 'r29', city: 'NTS Radio 2', lat: 51.5174, lon: -0.1378, freq: 'ECLECTIC', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://stream-relay-geo.ntslive.net/stream2') },
        // Jazz24
        { id: 'r30', city: 'Jazz24 Seattle', lat: 47.6162, lon: -122.3421, freq: 'JAZZ', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://live.wostreaming.net/direct/ppm-jazz24mp3-ibc1') },
        // More International
        { id: 'r31', city: 'Radio Caprice Ambient', lat: 55.7558, lon: 37.6173, freq: 'AMBIENT', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('http://79.111.14.76:8000/ambient') },
        { id: 'r32', city: 'Chillout Zone Berlin', lat: 52.5200, lon: 13.4050, freq: 'CHILL', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('http://radio.stereoscenic.com/asp-s') },
        { id: 'r33', city: 'Lounge FM Vienna', lat: 48.2082, lon: 16.3738, freq: 'LOUNGE', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('http://stream.laut.fm/lounge') },
        { id: 'r34', city: 'Deep House Amsterdam', lat: 52.3676, lon: 4.9041, freq: 'HOUSE', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('http://stream.laut.fm/deephouse') },
        { id: 'r35', city: 'Techno FM Tokyo', lat: 35.6762, lon: 139.6503, freq: 'TECHNO', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://ice1.somafm.com/thetrip-128-mp3') },
        // Additional Global Stations
        { id: 'r36', city: 'ABC Jazz Sydney', lat: -33.8688, lon: 151.2093, freq: 'JAZZ', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('http://live-radio01.mediahubaustralia.com/JAZW/mp3/') },
        { id: 'r37', city: 'Classic FM London', lat: 51.5274, lon: -0.1478, freq: 'CLASSIC', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://media-ice.musicradio.com/ClassicFMMP3') },
        { id: 'r38', city: 'Smooth Jazz Florida', lat: 25.7617, lon: -80.1918, freq: 'JAZZ', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://ice1.somafm.com/secretagent-128-mp3') },
        { id: 'r39', city: 'Electronic Paris', lat: 48.8766, lon: 2.3222, freq: 'ELECTRO', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://icecast.radiofrance.fr/fipelectro-midfi.mp3') },
        { id: 'r40', city: 'Reggae Riddim Kingston', lat: 18.0179, lon: -76.8099, freq: 'REGGAE', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('http://stream.laut.fm/reggae') },
        // More SomaFM variants for global coverage
        { id: 'r41', city: 'Metal Detroit', lat: 42.3314, lon: -83.0458, freq: 'METAL', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://ice1.somafm.com/metal-128-mp3') },
        { id: 'r42', city: 'Folk Forward', lat: 42.3601, lon: -71.0589, freq: 'FOLK', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://ice1.somafm.com/folkfwd-128-mp3') },
        { id: 'r43', city: 'Indie Pop', lat: 45.5017, lon: -73.5673, freq: 'INDIE', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://ice1.somafm.com/indiepop-128-mp3') },
        { id: 'r44', city: 'Deep Space One', lat: 34.0522, lon: -118.2437, freq: 'SPACE', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://ice1.somafm.com/deepspaceone-128-mp3') },
        { id: 'r45', city: 'Cliq Hop IDM', lat: 51.0504, lon: -114.0714, freq: 'IDM', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://ice1.somafm.com/cliqhop-128-mp3') },
        { id: 'r46', city: 'Beat Blender', lat: 33.4484, lon: -112.0740, freq: 'BEATS', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://ice1.somafm.com/beatblender-128-mp3') },
        { id: 'r47', city: 'Covers', lat: 32.7157, lon: -117.1611, freq: 'COVERS', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://ice1.somafm.com/covers-128-mp3') },
        { id: 'r48', city: 'Lush', lat: 47.6062, lon: -122.3321, freq: 'LUSH', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://ice1.somafm.com/lush-128-mp3') },
        { id: 'r49', city: 'SonicUniverse', lat: 40.7128, lon: -74.0060, freq: 'SONIC', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://ice1.somafm.com/sonicuniverse-128-mp3') },
        { id: 'r50', city: 'Digitalis', lat: 38.9072, lon: -77.0369, freq: 'DIGITAL', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://ice1.somafm.com/digitalis-128-mp3') },
        // Continue adding more for global coverage
        ...Array.from({ length: 50 }, (_, i) => ({
            id: `r${51 + i}`,
            city: `Global Radio ${i + 1}`,
            lat: (Math.random() * 140) - 70,
            lon: (Math.random() * 360) - 180,
            freq: ['AMBIENT', 'JAZZ', 'ROCK', 'ELECTRO', 'CHILL', 'CLASSIC', 'POP', 'WORLD'][i % 8],
            isOnline: true,
            stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent(['https://ice1.somafm.com/groovesalad-128-mp3', 'https://ice1.somafm.com/dronezone-128-mp3', 'https://ice1.somafm.com/secretagent-128-mp3', 'https://ice1.somafm.com/spacestation-128-mp3'][i % 4])
        }))
    ],
    TACTICAL: [
        // NOAA All-Hazards Weather Radio
        { id: 't1', city: 'NOAA Mobile AL', lat: 30.6954, lon: -88.0399, freq: '162.550', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://radio.weatherusa.net/NWR/KEC61_2.mp3'), type: 'WEATHER' },
        { id: 't2', city: 'NOAA New York', lat: 40.7128, lon: -74.0060, freq: '162.550', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://radio.weatherusa.net/NWR/KHB31.mp3'), type: 'WEATHER' },
        { id: 't3', city: 'NOAA Chicago', lat: 41.8781, lon: -87.6298, freq: '162.550', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://radio.weatherusa.net/NWR/KEC63.mp3'), type: 'WEATHER' },
        // Police/Fire Scanners
        { id: 'p1', city: 'LAPD Central', lat: 34.0522, lon: -118.2437, freq: 'POLICE', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://broadcastify.cdnstream1.com/20296'), type: 'TACTICAL' },
        { id: 'p2', city: 'Chicago Fire/EMS', lat: 41.8781, lon: -87.6298, freq: 'FIRE', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://broadcastify.cdnstream1.com/26451'), type: 'TACTICAL' },
        { id: 'p3', city: 'FDNY Manhattan', lat: 40.7128, lon: -74.0060, freq: 'FIRE', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://broadcastify.cdnstream1.com/9358'), type: 'TACTICAL' },
        { id: 'p4', city: 'NYPD Citywide', lat: 40.7328, lon: -73.9860, freq: 'POLICE', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://broadcastify.cdnstream1.com/32480'), type: 'TACTICAL' },
        { id: 'p5', city: 'Houston PD', lat: 29.7604, lon: -95.3698, freq: 'POLICE', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://broadcastify.cdnstream1.com/14439'), type: 'TACTICAL' },
        { id: 'p6', city: 'Miami-Dade PD', lat: 25.7617, lon: -80.1918, freq: 'POLICE', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://broadcastify.cdnstream1.com/4334'), type: 'TACTICAL' }
    ],
    ATS: [
        // Major US Airports (LiveATC)
        { id: 'atc1', city: 'LAX Tower', lat: 33.9416, lon: -118.4085, freq: '133.900', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://s1-fmt2.liveatc.net/klax_twr'), type: 'ATS' },
        { id: 'atc2', city: 'JFK Approach', lat: 40.6413, lon: -73.7781, freq: '127.400', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://s1-fmt2.liveatc.net/kjfk_app'), type: 'ATS' },
        { id: 'atc3', city: 'ORD Tower', lat: 41.9742, lon: -87.9073, freq: '120.750', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://s1-fmt2.liveatc.net/kord_twr'), type: 'ATS' },
        { id: 'atc4', city: 'ATL Ground', lat: 33.6407, lon: -84.4277, freq: '121.900', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://s1-fmt2.liveatc.net/katl_gnd'), type: 'ATS' },
        { id: 'atc5', city: 'DFW Tower', lat: 32.8998, lon: -97.0403, freq: '126.550', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://s1-fmt2.liveatc.net/kdfw_twr'), type: 'ATS' },
        { id: 'atc6', city: 'SFO Tower', lat: 37.6213, lon: -122.3790, freq: '120.500', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://s1-fmt2.liveatc.net/ksfo_twr'), type: 'ATS' },
        { id: 'atc7', city: 'MIA Tower', lat: 25.7959, lon: -80.2870, freq: '118.300', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://s1-fmt2.liveatc.net/kmia_twr'), type: 'ATS' },
        { id: 'atc8', city: 'DEN Approach', lat: 39.8561, lon: -104.6737, freq: '119.300', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://s1-fmt2.liveatc.net/kden_app'), type: 'ATS' },
        // International
        { id: 'atc9', city: 'Heathrow Tower', lat: 51.4700, lon: -0.4543, freq: '118.500', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://s1-fmt2.liveatc.net/egll_twr'), type: 'ATS' },
        { id: 'atc10', city: 'Dubai Approach', lat: 25.2528, lon: 55.3644, freq: '124.900', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://s1-fmt2.liveatc.net/omdb_app'), type: 'ATS' },
        { id: 'atc11', city: 'Frankfurt Tower', lat: 50.0379, lon: 8.5622, freq: '119.900', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://s1-fmt2.liveatc.net/eddf_twr'), type: 'ATS' },
        { id: 'atc12', city: 'Tokyo Narita', lat: 35.7720, lon: 140.3929, freq: '118.200', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://s1-fmt2.liveatc.net/rjaa_twr'), type: 'ATS' },
        { id: 'atc13', city: 'Sydney Tower', lat: -33.9399, lon: 151.1753, freq: '120.500', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://s1-fmt2.liveatc.net/yssy_twr'), type: 'ATS' },
        { id: 'atc14', city: 'Paris CDG', lat: 49.0097, lon: 2.5479, freq: '119.250', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://s1-fmt2.liveatc.net/lfpg_twr'), type: 'ATS' }
    ],
    NEWS: [
        // Major News Networks
        { id: 'n1', city: 'BBC World Service', lat: 51.5074, lon: -0.1278, freq: 'WEB', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://stream.live.vc.bbcmedia.co.uk/bbc_world_service') },
        { id: 'n2', city: 'NPR News', lat: 38.8951, lon: -77.0364, freq: 'WEB', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://npr-ice.streamguys1.com/live.mp3') },
        { id: 'n3', city: 'CBC News', lat: 43.6532, lon: -79.3832, freq: 'WEB', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://cbc_r1_tor.akacast.akamaistream.net/7/632/451661/v1/rc.akacast.akamaistream.net/cbc_r1_tor') },
        { id: 'n4', city: 'ABC News Australia', lat: -33.8688, lon: 151.2093, freq: 'WEB', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('http://live-radio01.mediahubaustralia.com/2LRW/mp3/') },
        { id: 'n5', city: 'Deutsche Welle', lat: 50.7374, lon: 7.0982, freq: 'WEB', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://dw.litecastplus.com/mpegaudio') },
        { id: 'n6', city: 'Voice of America', lat: 38.8951, lon: -77.0464, freq: 'WEB', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://voa-ingest.akamaized.net/hls/live/2035200/161_352R/chunklist.m3u8') },
        { id: 'n7', city: 'Radio France Info', lat: 48.8566, lon: 2.3522, freq: 'WEB', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://icecast.radiofrance.fr/franceinfo-midfi.mp3') },
        { id: 'n8', city: 'RNZ New Zealand', lat: -41.2865, lon: 174.7762, freq: 'WEB', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://radionz.streamguys1.com/national') },
        // More News Sources
        { id: 'n9', city: 'WNYC New York', lat: 40.7528, lon: -73.9760, freq: '93.9', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://fm939.wnyc.org/wnycfm') },
        { id: 'n10', city: 'KCRW Los Angeles', lat: 34.0195, lon: -118.4912, freq: '89.9', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://kcrw.streamguys1.com/kcrw_192k_mp3_on_air') },
        { id: 'n11', city: 'WBEZ Chicago', lat: 41.8819, lon: -87.6278, freq: '91.5', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://stream.wbez.org/wbez128.mp3') },
        { id: 'n12', city: 'WHYY Philadelphia', lat: 39.9496, lon: -75.1503, freq: '90.9', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://whyy.streamguys1.com/whyy-hd1') },
        { id: 'n13', city: 'KQED San Francisco', lat: 37.7849, lon: -122.3994, freq: '88.5', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://streams.kqed.org/kqedradio') },
        // Generate more news stations globally
        ...Array.from({ length: 87 }, (_, i) => ({
            id: `n${14 + i}`,
            city: `News Radio ${['London', 'Paris', 'Berlin', 'Tokyo', 'Sydney', 'Mumbai', 'Dubai', 'Moscow', 'Beijing', 'Seoul'][i % 10]} ${Math.floor(i / 10) + 1}`,
            lat: [51.5, 48.8, 52.5, 35.6, -33.8, 19.0, 25.2, 55.7, 39.9, 37.5][i % 10],
            lon: [-0.1, 2.3, 13.4, 139.6, 151.2, 72.8, 55.2, 37.6, 116.4, 127.0][i % 10],
            freq: 'WEB',
            isOnline: true,
            stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://stream.live.vc.bbcmedia.co.uk/bbc_world_service')
        }))
    ],
    WEATHER: [
        // NOAA Weather Radio Stations
        { id: 'w1', city: 'NOAA Boston', lat: 42.3601, lon: -71.0589, freq: '162.475', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://radio.weatherusa.net/NWR/WXL58.mp3'), type: 'WEATHER' },
        { id: 'w2', city: 'NOAA Miami', lat: 25.7617, lon: -80.1918, freq: '162.550', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://radio.weatherusa.net/NWR/KEC61_2.mp3'), type: 'WEATHER' },
        { id: 'w3', city: 'NOAA Los Angeles', lat: 34.0522, lon: -118.2437, freq: '162.400', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://radio.weatherusa.net/NWR/KWO37.mp3'), type: 'WEATHER' },
        { id: 'w4', city: 'NOAA Seattle', lat: 47.6062, lon: -122.3321, freq: '162.550', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://radio.weatherusa.net/NWR/KIG77.mp3'), type: 'WEATHER' },
        { id: 'w5', city: 'NOAA Denver', lat: 39.7392, lon: -104.9903, freq: '162.475', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://radio.weatherusa.net/NWR/KHB33.mp3'), type: 'WEATHER' },
        { id: 'w6', city: 'NOAA Houston', lat: 29.7604, lon: -95.3698, freq: '162.400', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://radio.weatherusa.net/NWR/WXK91.mp3'), type: 'WEATHER' },
        { id: 'w7', city: 'NOAA Atlanta', lat: 33.7490, lon: -84.3880, freq: '162.550', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://radio.weatherusa.net/NWR/KEC57.mp3'), type: 'WEATHER' },
        { id: 'w8', city: 'NOAA Phoenix', lat: 33.4484, lon: -112.0740, freq: '162.400', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://radio.weatherusa.net/NWR/KJY96.mp3'), type: 'WEATHER' },
        { id: 'w9', city: 'NOAA Dallas', lat: 32.7767, lon: -96.7970, freq: '162.475', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://radio.weatherusa.net/NWR/WXL53.mp3'), type: 'WEATHER' },
        { id: 'w10', city: 'NOAA San Francisco', lat: 37.7749, lon: -122.4194, freq: '162.400', isOnline: true, stream: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://radio.weatherusa.net/NWR/KWO35.mp3'), type: 'WEATHER' }
    ]
};


const AudioVisualizer = ({ isPlaying }) => {
    return (
        <div className="flex items-end gap-[2px] h-8 w-full opacity-80">
            {Array.from({ length: 20 }).map((_, i) => (
                <div
                    key={i}
                    className={`w-1 bg-current transition-all duration-75 ease-in-out ${isPlaying ? 'animate-pulse' : ''}`}
                    style={{
                        height: isPlaying ? `${Math.random() * 100}% ` : '20%',
                        animationDelay: `${i * 0.05} s`
                    }}
                />
            ))}
        </div>
    );
};

const TerminalLog = ({ logs }) => {
    const endRef = useRef(null);
    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    return (
        <div className="font-mono text-[10px] h-full overflow-y-auto p-2 bg-black/50 border border-slate-800 rounded text-green-500/80">
            {logs.map((log, i) => (
                <div key={i} className="mb-1">
                    <span className="text-slate-500">[{log.time}]</span> {log.msg}
                </div>
            ))}
            <div ref={endRef} />
        </div>
    );
};

const DraggablePanel = ({ title, icon: Icon, children, className = "", isMinimized, onToggleMinimize }) => {
    if (isMinimized) {
        return (
            <div className="bg-black/90 border border-slate-800 p-2 rounded-sm flex items-center justify-between pointer-events-auto w-48">
                <div className="flex items-center gap-2 text-slate-400">
                    <Icon className="w-3 h-3" />
                    <span className="text-[10px] font-bold tracking-wider truncate">{title}</span>
                </div>
                <button onClick={onToggleMinimize} className="text-slate-500 hover:text-white">
                    <Maximize2 className="w-3 h-3" />
                </button>
            </div>
        );
    }

    return (
        <div className={`bg-black/90 border border-slate-800 p-4 rounded-sm flex flex-col gap-4 pointer-events-auto transition-all duration-300 ${className}`}>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2 text-slate-400">
                    <Icon className="w-4 h-4" />
                    <span className="text-xs font-bold tracking-wider">{title}</span>
                </div>
                <button onClick={onToggleMinimize} className="text-slate-500 hover:text-white">
                    <Minimize2 className="w-3 h-3" />
                </button>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                {children}
            </div>
        </div>
    );
};

const NodeRegistryPanel = ({ appMode, searchQuery, setSearchQuery, selectedStation, handleNodeSelect, selectedCity, setSelectedCity, weatherData, setWeatherData, isPlaying, onStopAudio, aircraftData }) => {
    const currentConfig = MODE_CONFIG[appMode];

    // For WEATHER mode, show cities instead of nodes
    if (appMode === 'WEATHER') {
        const filteredCities = WEATHER_CITIES.filter(c =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.country.toLowerCase().includes(searchQuery.toLowerCase())
        );

        const fetchWeather = async (city) => {
            setSelectedCity(city);
            try {
                const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current_weather=true&hourly=relativehumidity_2m,precipitation_probability`;
                const res = await fetch(url);
                const data = await res.json();
                if (data.current_weather) {
                    setWeatherData({
                        temp: data.current_weather.temperature,
                        windSpeed: data.current_weather.windspeed,
                        windDir: data.current_weather.winddirection,
                        weatherCode: data.current_weather.weathercode,
                        humidity: data.hourly?.relativehumidity_2m?.[0] || 'N/A',
                        precipitation: data.hourly?.precipitation_probability?.[0] || 0
                    });
                }
            } catch (e) {
                console.error('Weather fetch failed:', e);
                setWeatherData(null);
            }
        };

        return (
            <div className="flex flex-col h-full gap-2">
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 w-3 h-3 text-slate-500" />
                    <input
                        type="text"
                        placeholder="SEARCH CITY..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-900/50 border border-slate-700 rounded p-2 pl-8 text-xs text-white focus:border-amber-500 outline-none font-mono"
                    />
                </div>

                {/* Weather Data Display */}
                {selectedCity && weatherData && (
                    <div className="bg-amber-900/30 border border-amber-500/50 p-2 rounded">
                        <div className="text-xs font-bold text-amber-400 mb-1">🌤 {selectedCity.name}, {selectedCity.country}</div>
                        <div className="grid grid-cols-2 gap-1 text-[10px] font-mono">
                            <div>TEMP: <span className="text-cyan-400">{weatherData.temp}°C</span></div>
                            <div>WIND: <span className="text-green-400">{weatherData.windSpeed} km/h</span></div>
                            <div>HUMIDITY: <span className="text-blue-400">{weatherData.humidity}%</span></div>
                            <div>RAIN: <span className="text-purple-400">{weatherData.precipitation}%</span></div>
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700 space-y-1">
                    {filteredCities.map(city => (
                        <div
                            key={city.name}
                            className={`p-2 rounded border cursor-pointer transition-all ${selectedCity?.name === city.name
                                ? 'bg-amber-900/30 border-amber-500/50'
                                : 'bg-black/40 border-slate-800 hover:border-slate-600'
                                }`}
                            onClick={() => fetchWeather(city)}
                        >
                            <div className="flex flex-col">
                                <span className={`text-xs font-bold ${selectedCity?.name === city.name ? 'text-amber-400' : 'text-slate-300'}`}>
                                    {city.name}
                                </span>
                                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                                    <span>{city.country}</span>
                                    <span>{city.lat.toFixed(2)}°, {city.lon.toFixed(2)}°</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Default: Radio/News/Tactical/ATS nodes
    let nodes = NODES[appMode] || [];
    if (appMode === 'ATS' && aircraftData) {
        const planes = aircraftData.map(ac => ({
            id: ac.icao24,
            city: `${ac.callsign || 'UNK'} (${Math.round(ac.alt || 0)}m)`,
            lat: ac.lat,
            lon: ac.lon,
            type: 'PLANE',
            isOnline: true,
            freq: `${Math.round(ac.velocity || 0)}m/s`,
            alt: ac.alt
        }));
        nodes = [...nodes, ...planes];
    }
    const filteredNodes = nodes.filter(n => n.city.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="flex flex-col h-full gap-2">
            <div className="relative">
                <Search className="absolute left-2 top-2.5 w-3 h-3 text-slate-500" />
                <input
                    type="text"
                    placeholder="SEARCH FREQUENCY..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded p-2 pl-8 text-xs text-white focus:border-cyan-500 outline-none font-mono"
                />
            </div>
            <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700 space-y-1">
                {filteredNodes.map(node => (
                    <StationCard
                        key={node.id}
                        station={{
                            ...node,
                            name: node.city,
                            country: node.freq, // Using country prop for freq display context
                            description: node.type,
                            active: node.isOnline
                        }}
                        isPlaying={isPlaying && selectedStation?.id === node.id}
                        isCurrent={selectedStation?.id === node.id}
                        onPlay={() => handleNodeSelect(node, true)}
                        onStop={onStopAudio}
                        theme={currentConfig.theme}
                    />
                ))}
            </div>
        </div>
    );
};

const SystemLogPanel = ({ activeLogs }) => (
    <TerminalLog logs={activeLogs} />
);

const AnalyzerPanel = ({ appMode, selectedStation, isPlaying, isBuffering, error, setIsPlaying, setError, setActiveLogs, handleAnalyzeSignal, analysisResult, analysisLoading, analysisError }) => {
    const currentConfig = MODE_CONFIG[appMode];
    const [manualUrl, setManualUrl] = useState('');

    const handleManualPlay = () => {
        if (!manualUrl) return;
        const urlToPlay = manualUrl.startsWith('http') && !manualUrl.includes('localhost')
            ? `http://localhost:3001/proxy/audio?url=${encodeURIComponent(manualUrl)}`
            : manualUrl;

        console.log("Playing Manual Source:", urlToPlay);
        audioManager.play(urlToPlay).then(() => {
            setIsPlaying(true);
            setError(null);
            setActiveLogs(prev => [...prev.slice(-19), { time: new Date().toLocaleTimeString(), msg: `MANUAL OVERRIDE: ${manualUrl.substring(0, 20)}...` }]);
        }).catch(e => {
            console.error(e);
            setError('Failed to play custom URL');
        });
    };

    const handlePlayPause = () => {
        if (!selectedStation) return;

        if (isPlaying) {
            audioManager.stop();
            setIsPlaying(false);
        } else {
            if (!selectedStation.stream) {
                alert('ERROR: No stream URL for this station!');
                setError('No stream available for this station');
                return;
            }

            console.log("Playing:", selectedStation.stream);
            setError(null);
            setIsPlaying(true);

            audioManager.play(selectedStation.stream).catch(e => {
                console.error("Playback failed:", e);
                alert(`Playback Error: ${e.message}. Ensure Server is Running!`);
                setError('Playback blocked. Click PLAY again.');
                setIsPlaying(false);
            });
        }
    };

    useEffect(() => {
        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);
        const onError = () => {
            setError('Stream offline or blocked.');
            setIsPlaying(false);
        };

        audioManager.on('play', onPlay);
        audioManager.on('pause', onPause);
        audioManager.on('error', onError);

        setIsPlaying(audioManager.isPlaying());

        return () => {
            audioManager.off('play', onPlay);
            audioManager.off('pause', onPause);
            audioManager.off('error', onError);
        };
    }, []);

    return (
        <div className="h-full flex flex-col gap-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                    <currentConfig.icon className={`w-5 h-5 text-${currentConfig.theme}-400`} />
                    <h2 className={`text-lg font-bold text-${currentConfig.theme}-400`}>
                        {currentConfig.label}
                    </h2>
                </div>
                {selectedStation && (
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${selectedStation.isOnline ? 'bg-green-500 shadow-[0_0_5px_#22c55e]' : 'bg-red-500'}`} />
                        <span className="text-xs font-mono text-slate-400">{selectedStation.isOnline ? 'ONLINE' : 'OFFLINE'}</span>
                    </div>
                )}
            </div>

            <div className="bg-slate-900/50 p-3 rounded border border-slate-800">
                <div className="text-xs text-slate-500 mb-1">TARGET DESIGNATION</div>
                <div className="text-xl font-bold text-white truncate">
                    {selectedStation ? selectedStation.city : 'NO TARGET SELECTED'}
                </div>
                <div className="flex justify-between items-end mt-2">
                    <div className="text-xs font-mono text-slate-400">
                        {selectedStation && selectedStation.lat != null && selectedStation.lon != null
                            ? `LOC: ${selectedStation.lat.toFixed(4)}, ${selectedStation.lon.toFixed(4)}`
                            : 'WAITING FOR INPUT...'}
                    </div>
                    {selectedStation && (
                        <div className={`text-xs font-bold px-2 py-0.5 rounded ${selectedStation.isReal ? 'bg-orange-500/20 text-orange-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
                            {selectedStation.freq}
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <button
                    onClick={handlePlayPause}
                    disabled={!selectedStation || !selectedStation.stream}
                    className={`p-3 rounded border flex items-center justify-center gap-2 transition-all ${isPlaying && selectedStation
                        ? 'bg-red-500/10 border-red-500/50 text-red-400 hover:bg-red-500/20'
                        : `bg-${currentConfig.theme}-500/10 border-${currentConfig.theme}-500/50 text-${currentConfig.theme}-400 hover:bg-${currentConfig.theme}-500/20`
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    {isPlaying && selectedStation ? (
                        <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 animate-pulse text-red-500" />
                            <span className="text-xs font-bold">STREAMING...</span>
                        </div>
                    ) : (
                        <>
                            <Volume2 className="w-4 h-4" />
                            <span className="text-xs font-bold">PLAY STREAM</span>
                        </>
                    )}
                </button>

                <button
                    onClick={handleAnalyzeSignal}
                    disabled={!selectedStation || analysisLoading}
                    className="p-3 rounded border border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 hover:text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Activity className={`w-4 h-4 ${analysisLoading ? 'animate-spin' : ''}`} />
                    <span className="text-xs font-bold">{analysisLoading ? 'ANALYZING...' : 'ANALYZE SIGNAL'}</span>
                </button>
            </div>

            <div className="flex-1 bg-black/50 rounded border border-slate-800 p-3 font-mono text-xs overflow-y-auto">
                {selectedStation ? (
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between text-slate-500 border-b border-slate-800 pb-1">
                            <span>FREQ:</span> <span className="text-cyan-400">{selectedStation.freq}</span>
                        </div>
                        <div className="flex justify-between text-slate-500 border-b border-slate-800 pb-1">
                            <span>TYPE:</span> <span className="text-cyan-400">{selectedStation.isReal ? 'LIVE FEED' : 'SIMULATION'}</span>
                        </div>
                        <div className="flex justify-between text-slate-500 border-b border-slate-800 pb-1">
                            <span>STATUS:</span> <span className={selectedStation.isOnline ? 'text-green-400' : 'text-red-400'}>{selectedStation.isOnline ? 'ACTIVE' : 'OFFLINE'}</span>
                        </div>

                        {analysisLoading && (
                            <div className="mt-4 text-yellow-400 animate-pulse">
                                {'>'} DECRYPTING SIGNAL...<br />
                                {'>'} ANALYZING WAVEFORM...<br />
                                {'>'} MATCHING SIGNATURES...
                            </div>
                        )}

                        {analysisResult && (
                            <div className="mt-4 p-2 bg-green-900/20 border border-green-500/30 rounded text-green-400">
                                <div className="font-bold mb-1">[ANALYSIS COMPLETE]</div>
                                {analysisResult}
                            </div>
                        )}

                        {analysisError && (
                            <div className="mt-4 p-2 bg-red-900/20 border border-red-500/30 rounded text-red-400">
                                <div className="font-bold mb-1">[ANALYSIS FAILED]</div>
                                {analysisError}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-slate-600 text-center mt-10">
                        SELECT A TARGET FROM THE GLOBE OR LIST TO BEGIN ANALYSIS
                    </div>
                )}
            </div>

            {/* PASTE & PLAY SYSTEM */}
            <div className="mt-1 pt-2 border-t border-slate-800">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={manualUrl}
                        onChange={(e) => setManualUrl(e.target.value)}
                        placeholder="PASTE DIRECT STREAM URL..."
                        className="flex-1 bg-slate-900/50 border border-slate-800 text-[10px] p-2 text-white rounded focus:border-cyan-500 outline-none font-mono"
                    />
                    <button
                        onClick={handleManualPlay}
                        className="bg-cyan-900/40 border border-cyan-500/50 text-cyan-400 text-[10px] px-3 font-bold rounded hover:bg-cyan-900/80"
                    >
                        TUNE
                    </button>
                </div>
            </div>
        </div >
    );
};

const OrbitalPanel = ({ selectedSatellite, satGroups, satFilter, setSatFilter }) => {
    const getSatelliteInfo = (sat) => {
        if (!sat || !sat.satrec) return null;
        try {
            const date = new Date();
            const positionAndVelocity = satellite.propagate(sat.satrec, date);
            if (!positionAndVelocity || !positionAndVelocity.position || !positionAndVelocity.velocity) return null;

            const pos = positionAndVelocity.position;
            const vel = positionAndVelocity.velocity;
            const gmst = satellite.gstime(date);
            const geodetic = satellite.eciToGeodetic(pos, gmst);

            const altitude = geodetic.height;
            const velocity = Math.sqrt(vel.x ** 2 + vel.y ** 2 + vel.z ** 2);
            const latitude = (geodetic.latitude * 180 / Math.PI).toFixed(2);
            const longitude = (geodetic.longitude * 180 / Math.PI).toFixed(2);
            const noradId = sat.satrec ? sat.satrec.satnum : 'N/A';

            return { altitude, velocity, latitude, longitude, noradId };
        } catch (e) {
            return null;
        }
    };

    const satInfo = selectedSatellite ? getSatelliteInfo(selectedSatellite) : null;

    return (
        <div className="flex flex-col gap-2 h-full overflow-y-auto">
            {/* SATELLITE FILTER CONTROLS */}
            <div className="flex flex-wrap gap-1 mb-2">
                {['DEFAULT', 'ALL', 'STARLINK', 'GPS', 'ISS', 'WEATHER', 'NOAA'].map(f => (
                    <button
                        key={f}
                        onClick={() => setSatFilter(f)}
                        className={`px-2 py-1 text-[9px] font-bold rounded border transition-colors ${satFilter === f
                            ? 'bg-cyan-900/80 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.3)]'
                            : 'bg-slate-800/50 border-slate-700 text-slate-500 hover:bg-slate-700'
                            }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {selectedSatellite && satInfo && (
                <div className="bg-cyan-900/30 border border-cyan-500/50 p-2 rounded mb-2">
                    <div className="text-xs font-bold text-cyan-400 mb-1">ðŸ›°ï¸ TRACKING TARGET</div>
                    <div className="text-white font-mono text-sm truncate">{selectedSatellite.name || 'Unknown Satellite'}</div>
                    <div className="text-[10px] text-slate-400 mb-2">NORAD ID: {satInfo.noradId}</div>
                    <div className="grid grid-cols-2 gap-1 text-[10px] font-mono text-slate-300">
                        <div>ALT: <span className="text-cyan-400">{satInfo.altitude.toFixed(0)} km</span></div>
                        <div>VEL: <span className="text-orange-400">{(satInfo.velocity * 3600).toFixed(0)} km/h</span></div>
                        <div>LAT: <span className="text-green-400">{satInfo.latitude}Â°</span></div>
                        <div>LON: <span className="text-green-400">{satInfo.longitude}Â°</span></div>
                    </div>
                </div>
            )}
            {selectedSatellite && !satInfo && (
                <div className="bg-yellow-900/30 border border-yellow-500/50 p-2 rounded mb-2">
                    <div className="text-xs font-bold text-yellow-400">âš ï¸ SIGNAL LOST</div>
                    <div className="text-white font-mono text-sm">{selectedSatellite.name || 'Unknown'}</div>
                    <div className="text-[10px] text-slate-400">Unable to calculate position</div>
                </div>
            )}
            {satGroups.map(group => (
                <div key={group.id} className="bg-slate-900/50 p-2 rounded border flex flex-col gap-1 border-slate-800">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full animate-pulse bg-green-500"></div>
                            <span className="text-xs font-bold text-white">{group.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-500">{group.count} sats</span>
                    </div>
                </div>
            ))}
        </div>
    );
};

const ResourcePanel = ({ uptime, fps }) => {
    const [cpu, setCpu] = useState(12);
    const [mem, setMem] = useState(2.4);

    useEffect(() => {
        const interval = setInterval(() => {
            setCpu(prev => Math.min(100, Math.max(5, prev + (Math.random() * 10 - 5))));
            setMem(prev => Math.min(16, Math.max(1.5, prev + (Math.random() * 0.2 - 0.1))));
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="grid grid-cols-2 gap-2 h-full">
            <div className="bg-slate-900/50 p-2 rounded border border-slate-800 flex flex-col items-center justify-center gap-1">
                <span className="text-[10px] text-slate-500">CPU LOAD</span>
                <span className={`text-lg font-mono ${cpu > 80 ? 'text-red-400' : 'text-cyan-400'}`}>{cpu.toFixed(0)}%</span>
            </div>
            <div className="bg-slate-900/50 p-2 rounded border border-slate-800 flex flex-col items-center justify-center gap-1">
                <span className="text-[10px] text-slate-500">MEMORY</span>
                <span className="text-lg font-mono text-cyan-400">{mem.toFixed(1)}GB</span>
            </div>
            <div className="bg-slate-900/50 p-2 rounded border border-slate-800 flex flex-col items-center justify-center gap-1">
                <span className="text-[10px] text-slate-500">FPS</span>
                <span className={`text-lg font-mono ${fps > 50 ? 'text-green-400' : fps > 30 ? 'text-yellow-400' : 'text-red-400'}`}>{fps}</span>
            </div>
            <div className="bg-slate-900/50 p-2 rounded border border-slate-800 flex flex-col items-center justify-center gap-1">
                <span className="text-[10px] text-slate-500">UPTIME</span>
                <span className="text-lg font-mono text-white">{uptime}</span>
            </div>
        </div>
    );
};

const Globe = ({ onNodeSelect, onSatelliteSelect, onFpsUpdate, appMode, selectedNode, onGlobeClick, weatherLayer, satGroups, setSatGroups, cityLabelsRef, selectedSatellite, satFilter, aircraftData, satelliteModel }) => {
    const mountRef = useRef(null);
    const rendererRef = useRef(null);
    const cameraRef = useRef(null);
    const controlsRef = useRef(null);
    const nodeMeshRef = useRef(null);
    const earthRef = useRef(null);
    const cloudsRef = useRef(null);
    const clouds2Ref = useRef(null);
    const pinRef = useRef(null);
    const satMeshesRef = useRef([]);
    const appModeRef = useRef(appMode);
    const weatherMeshRef = useRef(null);
    const precipMeshRef = useRef(null);
    const tempMeshRef = useRef(null);
    const weatherTexturesRef = useRef({});
    const townMeshRef = useRef(null);
    const cityMeshRef = useRef(null);
    const sceneRef = useRef(null);
    const satGroupsRef = useRef(satGroups);
    const globeGroupRef = useRef(null);
    const starsRef = useRef(null);
    const orbitLineRef = useRef(null);
    const glowSpriteRef = useRef(null);
    const weatherLayerRef = useRef(weatherLayer);
    const selectedSatelliteRef = useRef(selectedSatellite);

    const lastFrameTime = useRef(performance.now());
    const frameCount = useRef(0);

    useEffect(() => {
        appModeRef.current = appMode;
    }, [appMode]);

    useEffect(() => { weatherLayerRef.current = weatherLayer; }, [weatherLayer]);
    useEffect(() => {
        selectedSatelliteRef.current = selectedSatellite;

        // --- UPDATE ORBITAL TRAIL ---
        if (!selectedSatellite || !orbitLineRef.current || !selectedSatellite.satrec) {
            if (orbitLineRef.current) orbitLineRef.current.visible = false;
            if (glowSpriteRef.current) glowSpriteRef.current.visible = false;
            return;
        }

        const satrec = selectedSatellite.satrec;
        const points = [];
        const now = new Date();

        // Calculate orbit for next 95 minutes (approx one orbit)
        for (let i = 0; i <= 95; i++) {
            const time = new Date(now.getTime() + i * 60000); // +i minutes
            const pv = satellite.propagate(satrec, time);
            if (pv.position) {
                const scale = EARTH_RADIUS / 6371;
                const x = pv.position.x * scale;
                const y = pv.position.z * scale;
                const z = -pv.position.y * scale;
                points.push(new THREE.Vector3(x, y, z));
            }
        }

        orbitLineRef.current.geometry.setFromPoints(points);
        orbitLineRef.current.geometry.attributes.position.needsUpdate = true;
        orbitLineRef.current.visible = true;
        if (glowSpriteRef.current) glowSpriteRef.current.visible = true;
    }, [selectedSatellite]);

    // Removed internal fetching. Data passed via props.



    // --- UPDATE WEATHER LAYER ---
    useEffect(() => {
        if (weatherMeshRef.current && weatherTexturesRef.current[weatherLayer]) {
            weatherMeshRef.current.material.map = weatherTexturesRef.current[weatherLayer];
            weatherMeshRef.current.material.needsUpdate = true;
            // Adjust color/opacity based on layer
            if (weatherLayer === 'TEMP') {
                weatherMeshRef.current.material.opacity = 0.5;
                weatherMeshRef.current.material.blending = THREE.NormalBlending;
            } else {
                weatherMeshRef.current.material.opacity = 0.6;
                weatherMeshRef.current.material.blending = THREE.AdditiveBlending;
            }
        }
    }, [weatherLayer]);

    // --- UPDATE NODES ON MODE CHANGE ---
    useEffect(() => {
        if (!nodeMeshRef.current) return;

        const nodes = NODES[appMode] || [];
        const dummy = new THREE.Object3D();
        const color = new THREE.Color(MODE_CONFIG[appMode].color);

        // Reset all
        nodeMeshRef.current.count = nodes.length;
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            const phi = (90 - node.lat) * (Math.PI / 180);
            const theta = (node.lon + 180) * (Math.PI / 180);
            const r = EARTH_RADIUS + 0.1;

            const x = -(r * Math.sin(phi) * Math.cos(theta));
            const z = (r * Math.sin(phi) * Math.sin(theta));
            const y = (r * Math.cos(phi));

            dummy.position.set(x, y, z);
            dummy.lookAt(0, 0, 0);
            dummy.updateMatrix();
            nodeMeshRef.current.setMatrixAt(i, dummy.matrix);
            nodeMeshRef.current.setColorAt(i, color);
        }
        nodeMeshRef.current.instanceMatrix.needsUpdate = true;
        if (nodeMeshRef.current.instanceColor) {
            nodeMeshRef.current.instanceColor.needsUpdate = true;
        }

    }, [appMode]);

    // --- UPDATE PIN ---
    useEffect(() => {
        if (!pinRef.current || !selectedNode) {
            if (pinRef.current) pinRef.current.visible = false;
            return;
        }

        const phi = (90 - selectedNode.lat) * (Math.PI / 180);
        const theta = (selectedNode.lon + 180) * (Math.PI / 180);
        const r = 10.2;

        const x = -(r * Math.sin(phi) * Math.cos(theta));
        const z = (r * Math.sin(phi) * Math.sin(theta));
        const y = (r * Math.cos(phi));

        pinRef.current.position.set(x, y, z);
        pinRef.current.visible = true;

    }, [selectedNode]);

    // --- TOGGLE WEATHER LAYERS ---
    useEffect(() => {
        const isWeather = appMode === 'WEATHER';
        if (townMeshRef.current) townMeshRef.current.visible = isWeather;
        if (cityMeshRef.current) cityMeshRef.current.visible = isWeather;
    }, [appMode]);

    // --- INITIALIZATION ---
    useEffect(() => {
        // --- SETUP ---
        if (!mountRef.current) return;

        // Prevent multiple initializations
        if (rendererRef.current) {
            console.log("DEBUG: Renderer already exists, skipping initialization");
            return;
        }

        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;

        if (width === 0 || height === 0) return;

        console.log("DEBUG: Globe initializing Three.js");
        console.log("[DIAGNOSTIC] mountRef dimensions:", width, height);

        let renderer;
        try {
            console.log("DEBUG: Creating WebGLRenderer...");
            renderer = new THREE.WebGLRenderer({
                antialias: true
            });
            console.log("DEBUG: WebGLRenderer created successfully!");
        } catch (e) {
            console.error("WebGL initialization failed:", e);
            throw e;
        }

        if (!renderer || !renderer.getContext()) {
            throw new Error("WebGL context could not be created.");
        }

        // Append the renderer's canvas to the mount point
        mountRef.current.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000000);
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        camera.position.z = 38;
        camera.updateProjectionMatrix();

        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        rendererRef.current = renderer;

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.rotateSpeed = 0.5;
        controls.autoRotate = false; // Manual rotation
        controls.autoRotateSpeed = 0.5;
        controls.enableZoom = true;
        controls.zoomSpeed = 1.5;
        controls.minDistance = 12.5; // EARTH_RADIUS * 1.25
        controls.maxDistance = 60.0; // EARTH_RADIUS * 6.0
        controls.maxPolarAngle = Math.PI;
        controlsRef.current = controls;

        // Pause auto-rotate on user interaction
        let interactionTimeout;
        const pauseAutoRotate = () => {
            controls.autoRotate = false;
            clearTimeout(interactionTimeout);
            interactionTimeout = setTimeout(() => {
                controls.autoRotate = true;
            }, 3000);
        };

        renderer.domElement.addEventListener('mousedown', pauseAutoRotate);
        renderer.domElement.addEventListener('touchstart', pauseAutoRotate);
        renderer.domElement.addEventListener('wheel', pauseAutoRotate);

        // --- NODE CLICK INTERACTION ---
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        const onInteraction = (event) => {
            const rect = renderer.domElement.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);

            // Check Nodes
            if (nodeMeshRef.current) {
                const intersects = raycaster.intersectObject(nodeMeshRef.current);
                if (intersects.length > 0) {
                    const instanceId = intersects[0].instanceId;
                    const nodes = NODES[appModeRef.current] || []; // Use ref
                    const clickedNode = nodes[instanceId];
                    if (clickedNode && onNodeSelect) {
                        onNodeSelect(clickedNode, true);
                        return; // Prioritize nodes
                    }
                }
            }

            // Check Satellites
            if (satMeshesRef.current.length > 0) {
                for (const { bodyMesh, panelMesh, group } of satMeshesRef.current) {
                    // Check Body
                    const intersectsBody = raycaster.intersectObject(bodyMesh);
                    if (intersectsBody.length > 0) {
                        const instanceId = intersectsBody[0].instanceId;
                        const satData = group.satData[instanceId];
                        if (satData && onSatelliteSelect) {
                            onSatelliteSelect(satData, group);
                            return;
                        }
                    }
                    // Check Panels
                    const intersectsPanel = raycaster.intersectObject(panelMesh);
                    if (intersectsPanel.length > 0) {
                        const instanceId = intersectsPanel[0].instanceId;
                        const satData = group.satData[instanceId];
                        if (satData && onSatelliteSelect) {
                            onSatelliteSelect(satData, group);
                            return;
                        }
                    }
                }
            }
            // Check Earth Click
            if (earthRef.current) {
                const intersectsEarth = raycaster.intersectObject(earthRef.current);
                if (intersectsEarth.length > 0) {
                    const pointWorld = intersectsEarth[0].point;
                    // Convert world point to local point (relative to rotating earth)
                    const point = globeGroupRef.current ? globeGroupRef.current.worldToLocal(pointWorld.clone()) : pointWorld;

                    const r = EARTH_RADIUS;
                    const lat = 90 - (Math.acos(point.y / r) * 180 / Math.PI);
                    const lon = ((Math.atan2(point.z, point.x) * 180 / Math.PI) + 180) % 360 - 180;

                    if (onGlobeClick) {
                        onGlobeClick(lat, lon);
                    }
                }
            }
        };

        renderer.domElement.addEventListener('click', onInteraction);

        // Textures
        const textureLoader = new THREE.TextureLoader();
        const earthMap = textureLoader.load('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg');
        const earthBump = textureLoader.load('https://unpkg.com/three-globe/example/img/earth-topology.png');
        const earthSpec = textureLoader.load('https://unpkg.com/three-globe/example/img/earth-water.png');
        const cloudsMap = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png');

        const maxAnisotropy = 1; // DISABLED FOR STABILITY
        [earthMap, earthBump, earthSpec, cloudsMap].forEach(t => {
            t.anisotropy = maxAnisotropy;
        });

        // --- GENERATE WEATHER TEXTURES ---
        // --- REAL WEATHER TEXTURES (NASA GIBS WMS) ---
        // Update: Added TIME parameter correctly for GIBS WMS stability
        const today = new Date().toISOString().split('T')[0];
        const PROXY = 'http://localhost:3001/proxy/data?url=';
        const GIBS_WMS = (layer) => `https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&FORMAT=image/png&TRANSPARENT=true&WIDTH=2048&HEIGHT=1024&CRS=EPSG:4326&BBOX=-90,-180,90,180&TIME=${today}&LAYERS=${layer}`;

        weatherTexturesRef.current = {
            // VIIRS SNPP True Color (Clouds)
            CLOUDS: textureLoader.load(PROXY + encodeURIComponent(GIBS_WMS('VIIRS_SNPP_CorrectedReflectance_TrueColor'))),
            // GPM IMERG Precipitation
            RAIN: textureLoader.load(PROXY + encodeURIComponent(GIBS_WMS('IMERG_Precipitation_Rate'))),
            // MODIS Land Surface Temp
            TEMP: textureLoader.load(PROXY + encodeURIComponent(GIBS_WMS('MODIS_Terra_Land_Surface_Temp_Day')))
        };

        // --- EARTH MESH ---
        const earthGeo = new THREE.SphereGeometry(EARTH_RADIUS, 64, 64);
        const earthMat = new THREE.MeshPhongMaterial({
            map: earthMap,
            normalMap: earthBump,
            specularMap: earthSpec,
            shininess: 5
        });
        const earth = new THREE.Mesh(earthGeo, earthMat);

        // --- GLOBE GROUP (For independent rotation) ---
        const globeGroup = new THREE.Group();
        scene.add(globeGroup);
        globeGroupRef.current = globeGroup;

        globeGroup.add(earth);
        earthRef.current = earth;

        // --- CLOUDS MESH 1 (LOWER) ---
        const cloudsGeo = new THREE.SphereGeometry(EARTH_RADIUS + 0.15, 64, 64);
        const cloudsMat = new THREE.MeshPhongMaterial({
            map: cloudsMap,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
        });
        const clouds = new THREE.Mesh(cloudsGeo, cloudsMat);
        globeGroup.add(clouds);
        cloudsRef.current = clouds;

        // --- CLOUDS MESH 2 (UPPER) ---
        const clouds2Geo = new THREE.SphereGeometry(EARTH_RADIUS + 0.25, 64, 64);
        const clouds2Mat = new THREE.MeshPhongMaterial({
            map: cloudsMap,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
        });
        const clouds2 = new THREE.Mesh(clouds2Geo, clouds2Mat);
        clouds2.rotation.y = Math.PI; // Offset
        clouds2.rotation.y = Math.PI; // Offset
        globeGroup.add(clouds2);
        clouds2Ref.current = clouds2;

        // --- WEATHER OVERLAY (REAL TEXTURE) ---
        const weatherGeo = new THREE.SphereGeometry(EARTH_RADIUS + 0.3, 64, 64);
        const weatherMat = new THREE.MeshPhongMaterial({
            map: weatherTexturesRef.current.CLOUDS, // Default
            transparent: true,
            opacity: 0.0, // Hidden by default
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            color: 0xffffff
        });
        const weatherMesh = new THREE.Mesh(weatherGeo, weatherMat);
        globeGroup.add(weatherMesh);
        weatherMeshRef.current = weatherMesh;

        // --- PRECIPITATION MESH ---
        const precipGeo = new THREE.SphereGeometry(EARTH_RADIUS + 0.35, 64, 64);
        const precipMat = new THREE.MeshPhongMaterial({
            map: weatherTexturesRef.current.RAIN,
            transparent: true,
            opacity: 0.0,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
        });
        const precipMesh = new THREE.Mesh(precipGeo, precipMat);
        globeGroup.add(precipMesh);
        precipMeshRef.current = precipMesh;

        // --- TEMPERATURE MESH ---
        const tempGeo = new THREE.SphereGeometry(EARTH_RADIUS + 0.1, 64, 64);
        const tempMat = new THREE.MeshPhongMaterial({
            map: weatherTexturesRef.current.TEMP,
            transparent: true,
            opacity: 0.0,
            blending: THREE.AdditiveBlending, // Heatmap style
            side: THREE.DoubleSide
        });
        const tempMesh = new THREE.Mesh(tempGeo, tempMat);
        globeGroup.add(tempMesh);
        tempMeshRef.current = tempMesh;

        // (Removed nested useEffect)

        // --- ATMOSPHERIC GLOW ---
        const atmoGeo = new THREE.SphereGeometry(EARTH_RADIUS + 2.5, 64, 64);
        const atmoMat = new THREE.ShaderMaterial({
            vertexShader: `
                varying vec3 vNormal;
void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,
            fragmentShader: `
                varying vec3 vNormal;
void main() {
                    float intensity = pow(0.6 - dot(vNormal, vec3(0, 0, 1.0)), 4.0);
    gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
}
`,
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide,
            transparent: true
        });
        const atmosphere = new THREE.Mesh(atmoGeo, atmoMat);
        scene.add(atmosphere);

        // --- STARS ---
        const starsGeo = new THREE.BufferGeometry();
        const starsCount = 5000;
        const posArray = new Float32Array(starsCount * 3);
        for (let i = 0; i < starsCount * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 400;
        }
        starsGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        const starsMat = new THREE.PointsMaterial({ size: 0.15, color: 0xffffff, transparent: true, opacity: 0.8 });
        const stars = new THREE.Points(starsGeo, starsMat);
        scene.add(stars);
        starsRef.current = stars;

        // --- LIGHTS ---
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.15);
        scene.add(ambientLight);
        const sunLight = new THREE.DirectionalLight(0xffffff, 2.0);
        sunLight.position.set(50, 20, 30);
        scene.add(sunLight);

        // --- NODE MESHES ---
        const maxNodes = 2000;
        const nodeGeo = new THREE.SphereGeometry(0.06, 8, 8);
        const nodeMat = new THREE.MeshBasicMaterial({ color: 0xffffff, blending: THREE.AdditiveBlending });
        // Enable vertex colors for the material
        nodeMat.vertexColors = true;
        const instancedNodeMesh = new THREE.InstancedMesh(nodeGeo, nodeMat, maxNodes);
        globeGroup.add(instancedNodeMesh);
        nodeMeshRef.current = instancedNodeMesh;

        // --- POPULATE NODE PINS (Run once or on mode change) ---
        // This logic fills the instanced mesh with ALL enabled stations
        const updatePins = () => {
            const nodes = [];
            // Aggregate all nodes appropriate for display
            // We show ALL nodes but can filter by mode if desired. 
            // Requirement: "Select centers globe". Let's show all for "Cyberpunk" density, 
            // or filter by active mode to reduce clutter? 
            // User said "Globe Consistency" -> likely wants to see relevant pins.
            // Actually, let's show pins for the CURRENT MODE to avoid chaos.

            let activeNodes = [];
            if (appMode === 'RADIO') activeNodes = NODES.RADIO;
            else if (appMode === 'NEWS') activeNodes = NODES.NEWS;
            else if (appMode === 'TACTICAL') activeNodes = NODES.TACTICAL;
            else if (appMode === 'ATS') activeNodes = NODES.ATS;
            // Weather uses separate city markers

            const dummy = new THREE.Object3D();
            const color = new THREE.Color();

            let idx = 0;
            activeNodes.forEach(node => {
                const phi = (90 - node.lat) * (Math.PI / 180);
                const theta = (node.lon + 180) * (Math.PI / 180);
                const r = EARTH_RADIUS;

                dummy.position.x = -(r * Math.sin(phi) * Math.cos(theta));
                dummy.position.z = (r * Math.sin(phi) * Math.sin(theta));
                dummy.position.y = (r * Math.cos(phi));
                dummy.lookAt(0, 0, 0);
                dummy.updateMatrix();

                instancedNodeMesh.setMatrixAt(idx, dummy.matrix);

                // COLOR CODING
                if (node.type === 'RADIO') color.setHex(0x00ffff); // Cyan
                else if (node.type === 'NEWS') color.setHex(0xffaaaa); // Salmon/Orange
                else if (node.type === 'TACTICAL') color.setHex(0xff0000); // Red
                else if (node.type === 'ATS') color.setHex(0x8a2be2); // Indigo/Violet
                else if (node.type === 'MILITARY') color.setHex(0xff4400); // Red-Orange
                else color.setHex(0xffffff); // White default

                instancedNodeMesh.setColorAt(idx, color);
                idx++;
            });

            instancedNodeMesh.count = idx;
            instancedNodeMesh.instanceMatrix.needsUpdate = true;
            if (instancedNodeMesh.instanceColor) instancedNodeMesh.instanceColor.needsUpdate = true;
        };

        // Expose updatePins to effect (via ref or just run it here if we depend on appMode)
        // Since this is inside useEffect[], it only runs once.
        // We need a separate useEffect to update pins when appMode changes.
        // Let's store the mesh in ref and do the update in a separate effect.


        // --- WEATHER CITY MARKERS (Major Cities) ---
        const cityGeo = new THREE.SphereGeometry(0.04, 4, 4);
        const cityMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.8 }); // Cyan for major
        const cityMesh = new THREE.InstancedMesh(cityGeo, cityMat, WEATHER_CITIES.length);

        const dummyCity = new THREE.Object3D();
        WEATHER_CITIES.forEach((city, i) => {
            const phi = (90 - city.lat) * (Math.PI / 180);
            const theta = (city.lon + 180) * (Math.PI / 180);
            const r = EARTH_RADIUS;

            dummyCity.position.x = -(r * Math.sin(phi) * Math.cos(theta));
            dummyCity.position.z = (r * Math.sin(phi) * Math.sin(theta));
            dummyCity.position.y = (r * Math.cos(phi));
            dummyCity.lookAt(0, 0, 0);
            dummyCity.updateMatrix();
            cityMesh.setMatrixAt(i, dummyCity.matrix);
        });
        cityMesh.visible = appMode === 'WEATHER';
        globeGroup.add(cityMesh);
        cityMeshRef.current = cityMesh;

        // --- PROCEDURAL TOWNS (Thousands of dots) ---
        const townCount = 100;
        const townGeo = new THREE.SphereGeometry(0.015, 3, 3); // Tiny dots
        const townMat = new THREE.MeshBasicMaterial({ color: 0x88ccff, transparent: true, opacity: 0.4 });
        const townMesh = new THREE.InstancedMesh(townGeo, townMat, townCount);

        // Generate towns clustered around major cities
        for (let i = 0; i < townCount; i++) {
            // Pick random major city
            const city = WEATHER_CITIES[Math.floor(Math.random() * WEATHER_CITIES.length)];
            // Random offset (gaussian-ish)
            const offsetLat = (Math.random() - 0.5) * 4;
            const offsetLon = (Math.random() - 0.5) * 4;

            const lat = city.lat + offsetLat;
            const lon = city.lon + offsetLon;

            const phi = (90 - lat) * (Math.PI / 180);
            const theta = (lon + 180) * (Math.PI / 180);
            const r = EARTH_RADIUS;

            dummyCity.position.x = -(r * Math.sin(phi) * Math.cos(theta));
            dummyCity.position.z = (r * Math.sin(phi) * Math.sin(theta));
            dummyCity.position.y = (r * Math.cos(phi));
            dummyCity.lookAt(0, 0, 0);
            dummyCity.updateMatrix();
            townMesh.setMatrixAt(i, dummyCity.matrix);
        }
        townMesh.visible = appMode === 'WEATHER';
        globeGroup.add(townMesh);
        townMeshRef.current = townMesh; // Store ref to toggle

        // --- WIND SYSTEM (PARTICLES) ---
        const windCount = 4000;
        const windGeo = new THREE.BufferGeometry();
        const windPos = new Float32Array(windCount * 3);
        const windSpeed = new Float32Array(windCount);

        for (let i = 0; i < windCount; i++) {
            const r = EARTH_RADIUS + 0.5 + Math.random() * 0.5;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            windPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            windPos[i * 3 + 1] = r * Math.cos(phi);
            windPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

            windSpeed[i] = 0.1 + Math.random() * 0.2;
        }
        windGeo.setAttribute('position', new THREE.BufferAttribute(windPos, 3));
        windGeo.setAttribute('speed', new THREE.BufferAttribute(windSpeed, 1));

        const windMat = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                color: { value: new THREE.Color(0xaaccff) }
            },
            vertexShader: `
                uniform float time;
                attribute float speed;
                varying float vOpacity;
                void main() {
                    vec3 pos = position;
                    // Simple zonal flow (faster at equator, slower at poles)
                    float lat = pos.y / 10.0;
                    float angle = time * speed * (1.0 - abs(lat));
                    float s = sin(angle);
                    float c = cos(angle);
                    
                    // Rotate around Y
                    float x = pos.x * c - pos.z * s;
                    float z = pos.x * s + pos.z * c;
                    
                    vec4 mvPosition = modelViewMatrix * vec4(x, pos.y, z, 1.0);
                    gl_Position = projectionMatrix * mvPosition;
                    gl_PointSize = 2.0 * (30.0 / -mvPosition.z);
                    vOpacity = 0.3 + 0.2 * sin(time + pos.x);
                }
            `,
            fragmentShader: `
                uniform vec3 color;
                varying float vOpacity;
                void main() {
                    if (length(gl_PointCoord - vec2(0.5)) > 0.5) discard;
                    gl_FragColor = vec4(color, vOpacity);
                }
            `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        const windParticles = new THREE.Points(windGeo, windMat);
        windParticles.visible = false; // Toggle with weather
        globeGroup.add(windParticles);

        // --- CITY LABELS SETUP ---
        // Create label elements
        const labelElements = [];
        if (cityLabelsRef.current) {
            cityLabelsRef.current.innerHTML = ''; // Clear
            WEATHER_CITIES.forEach(city => {
                const el = document.createElement('div');
                el.className = 'absolute pointer-events-none text-[10px] font-mono text-cyan-400 bg-black/50 px-1 rounded border border-cyan-500/30 whitespace-nowrap hidden';
                el.textContent = `${city.name} ${Math.round(20 + Math.random() * 10)}Â°C`; // Mock temp
                cityLabelsRef.current.appendChild(el);

                // Pre-calculate position vector
                const phi = (90 - city.lat) * (Math.PI / 180);
                const theta = (city.lon + 180) * (Math.PI / 180);
                const r = EARTH_RADIUS;
                const pos = new THREE.Vector3(
                    -(r * Math.sin(phi) * Math.cos(theta)),
                    r * Math.cos(phi),
                    (r * Math.sin(phi) * Math.sin(theta))
                );
                labelElements.push({ el, pos });
            });
        }

        // Satellite meshes are now created in separate useEffect when satGroups changes


        // --- SELECTED PIN MARKER ---
        const pinGeo = new THREE.SphereGeometry(0.12, 16, 16);
        const pinMat = new THREE.MeshBasicMaterial({ color: 0xffff00, blending: THREE.AdditiveBlending, transparent: true, opacity: 0.8 });
        const pin = new THREE.Mesh(pinGeo, pinMat);
        pin.visible = false;
        globeGroup.add(pin);
        pinRef.current = pin;

        // --- ORBITAL TRAIL ---
        const orbitGeo = new THREE.BufferGeometry();
        const orbitMat = new THREE.LineBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.5 });
        const orbitLine = new THREE.Line(orbitGeo, orbitMat);
        orbitLine.visible = false;
        scene.add(orbitLine);
        orbitLineRef.current = orbitLine;

        // --- SATELLITE GLOW ---
        const glowMat = new THREE.SpriteMaterial({
            map: createGlowTexture(),
            color: 0x00ffff,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        const glowSprite = new THREE.Sprite(glowMat);
        glowSprite.scale.set(2, 2, 2);
        glowSprite.visible = false;
        scene.add(glowSprite);
        glowSpriteRef.current = glowSprite;

        // --- ANIMATION LOOP ---
        let animationId;
        const animate = () => {
            animationId = requestAnimationFrame(animate);
            controls.update();

            // --- INDEPENDENT ROTATION (SLOWED) ---
            if (globeGroupRef.current) globeGroupRef.current.rotation.y += 0.00005; // 50% slower
            if (starsRef.current) starsRef.current.rotation.y += 0.000005; // 80% slower

            // Update Glow Position
            const currentSelectedSat = selectedSatelliteRef.current;
            if (currentSelectedSat && glowSpriteRef.current) {
                const date = new Date();
                const pv = satellite.propagate(currentSelectedSat.satrec, date);
                if (pv.position) {
                    const scale = EARTH_RADIUS / 6371;
                    const x = pv.position.x * scale;
                    const y = pv.position.z * scale;
                    const z = -pv.position.y * scale;
                    glowSpriteRef.current.position.set(x, y, z);
                }
            }

            const time = Date.now() * 0.001;
            windMat.uniforms.time.value = time;

            // Toggle Wind Visibility
            const isWeatherMode = appModeRef.current === 'WEATHER';
            const currentLayer = weatherLayerRef.current;
            // Show wind if mode is WEATHER and layer is ALL or CLOUDS (wind usually goes with clouds)
            // Or maybe add a specific WIND toggle? For now, link to ALL/CLOUDS.
            const showWind = isWeatherMode && (currentLayer === 'ALL' || currentLayer === 'CLOUDS');
            windParticles.visible = showWind;

            // Update City Labels
            if (cityLabelsRef.current && appModeRef.current === 'WEATHER') {
                const dist = camera.position.distanceTo(new THREE.Vector3(0, 0, 0));
                const showLabels = dist < 16.0; // Threshold

                if (showLabels) {
                    labelElements.forEach(({ el, pos }) => {
                        // Project to screen
                        const v = pos.clone();
                        v.project(camera);

                        // Check if visible (in front of camera and not occluded by earth)
                        // Simple occlusion check: dot product with camera vector? 
                        // Or raycast? Raycast is expensive.
                        // Simple check: is point facing camera?
                        const isFacing = v.z < 1.0; // Normalized device coordinates z < 1

                        // Better occlusion: distance check
                        const distToPoint = camera.position.distanceTo(pos);
                        const distToCenter = camera.position.length();
                        // If point is behind earth, distToPoint > distToCenter (roughly)
                        // Actually, dot product of normal at pos and camera view vector
                        const normal = pos.clone().normalize();
                        const viewDir = camera.position.clone().sub(pos).normalize();
                        const dot = normal.dot(viewDir);

                        if (isFacing && dot > 0.2) { // Visible
                            const x = (v.x * .5 + .5) * width;
                            const y = (v.y * -.5 + .5) * height;

                            el.style.transform = `translate(${x}px, ${y}px)`;
                            el.style.display = 'block';
                            el.style.opacity = Math.min(1.0, (16.0 - dist) / 2.0); // Fade in
                        } else {
                            el.style.display = 'none';
                        }
                    });
                } else {
                    // Hide all
                    labelElements.forEach(({ el }) => el.style.display = 'none');
                }
            } else if (cityLabelsRef.current) {
                labelElements.forEach(({ el }) => el.style.display = 'none');
            }

            // --- HARD CAMERA CONSTRAINT (HOLLOW EARTH FIX) ---
            if (camera.position.length() < 12.5) {
                camera.position.setLength(12.5);
            }

            // FPS Calculation
            const now = performance.now();
            frameCount.current++;
            if (now - lastFrameTime.current >= 1000) {
                const fps = Math.round((frameCount.current * 1000) / (now - lastFrameTime.current));
                if (onFpsUpdate) onFpsUpdate(fps);
                frameCount.current = 0;
                lastFrameTime.current = now;
            }

            // Update Weather Visibility

            // Clouds (Base Layer)
            if (weatherMeshRef.current) {
                weatherMeshRef.current.visible = true;
                // Show clouds if Weather Mode OR if specific Cloud layer selected
                const targetOpacity = (isWeatherMode && (currentLayer === 'CLOUDS' || currentLayer === 'ALL')) ? 0.6 : 0.0;
                weatherMeshRef.current.material.opacity += (targetOpacity - weatherMeshRef.current.material.opacity) * 0.05;
                weatherMeshRef.current.rotation.y += 0.0004;
            }

            // Precipitation
            if (precipMeshRef.current) {
                precipMeshRef.current.visible = true;
                const targetOpacity = (isWeatherMode && (currentLayer === 'RAIN' || currentLayer === 'ALL')) ? 0.7 : 0.0;
                precipMeshRef.current.material.opacity += (targetOpacity - precipMeshRef.current.material.opacity) * 0.05;
                precipMeshRef.current.rotation.y += 0.0004;
            }

            // Temperature
            if (tempMeshRef.current) {
                tempMeshRef.current.visible = true;
                const targetOpacity = (isWeatherMode && (currentLayer === 'TEMP' || currentLayer === 'ALL')) ? 0.5 : 0.0;
                tempMeshRef.current.material.opacity += (targetOpacity - tempMeshRef.current.material.opacity) * 0.05;
                tempMeshRef.current.rotation.y += 0.0002;
            }

            // Rotate Clouds and Earth
            if (cloudsRef.current) cloudsRef.current.rotation.y += 0.0003;
            if (clouds2Ref.current) {
                clouds2Ref.current.rotation.y += 0.0002; // Independent speed
                clouds2Ref.current.rotation.x = Math.sin(now * 0.0001) * 0.05; // Slight tilt wobble
            }
            if (earthRef.current) earthRef.current.rotation.y += 0.0001; // 50% slower (REALISTIC)

            // Pulse Pin
            if (pinRef.current && pinRef.current.visible) {
                const scale = 1 + Math.sin(now * 0.005) * 0.3;
                pinRef.current.scale.set(scale, scale, scale);
            }

            // SGP4 & Procedural Satellite Propagation
            try {
                satMeshesRef.current.forEach(({ meshes, data }) => {
                    const dummy = new THREE.Object3D();
                    const date = new Date();

                    data.forEach((sat, i) => {
                        let posX, posY, posZ;
                        let velX = 0, velY = 0, velZ = 0;

                        if (sat.satrec) {
                            // SGP4 satellite
                            const positionAndVelocity = satellite.propagate(sat.satrec, date);
                            const positionEci = positionAndVelocity?.position;
                            const velocityEci = positionAndVelocity?.velocity;

                            if (positionEci && velocityEci) {
                                const timeFactor = 500; // Increased for visible movement
                                const acceleratedDate = new Date(startTimeRef.current + (Date.now() - startTimeRef.current) * timeFactor);

                                const posAcc = satellite.propagate(sat.satrec, acceleratedDate);
                                const pEci = posAcc.position;
                                const vEci = posAcc.velocity;

                                if (pEci && vEci) {
                                    const scale = EARTH_RADIUS / 6371;
                                    posX = pEci.x * scale;
                                    posY = pEci.z * scale;
                                    posZ = -pEci.y * scale;
                                    velX = vEci.x;
                                    velY = vEci.z;
                                    velZ = -vEci.y;
                                } else {
                                    return;
                                }
                            } else {
                                return;
                            }
                        } else if (sat.procedural) {
                            // Procedural satellite (fallback)
                            const altitude = sat.altitude || 550;
                            const inclination = (sat.inclination || 53) * (Math.PI / 180);
                            const phase = sat.phase || 0;
                            const raan = sat.raan || 0;
                            const r = EARTH_RADIUS + (altitude / 6371) * EARTH_RADIUS;

                            const scale = EARTH_RADIUS / 6371;
                            const timeOffset = Date.now() * 0.0001; // Faster animation (10x from before)
                            const angle = phase + timeOffset * (1400 / altitude); // Faster orbit

                            const x1 = r * Math.cos(angle);
                            const z1 = r * Math.sin(angle);
                            const y2 = z1 * Math.sin(inclination);
                            const z2 = z1 * Math.cos(inclination);

                            posX = x1 * Math.cos(raan) - z2 * Math.sin(raan);
                            posZ = x1 * Math.sin(raan) + z2 * Math.cos(raan);
                            posY = y2;

                            velX = -Math.sin(angle + raan);
                            velZ = Math.cos(angle + raan) * Math.cos(inclination);
                            velY = Math.cos(angle) * Math.sin(inclination);
                        } else {
                            return;
                        }

                        dummy.position.set(posX, posY, posZ);

                        // SAFETY: Ensure satellite stays above Earth surface
                        const dist = dummy.position.length();
                        if (dist < EARTH_RADIUS + 0.5) {
                            dummy.position.setLength(EARTH_RADIUS + 0.5);
                        }

                        dummy.lookAt(posX + velX, posY + velY, posZ + velZ);
                        dummy.rotateZ(Math.PI / 2);
                        dummy.scale.set(0.25, 0.25, 0.25);
                        dummy.updateMatrix();

                        if (meshes) {
                            meshes.forEach(mesh => {
                                mesh.setMatrixAt(i, dummy.matrix);
                            });
                        }
                    });

                    if (meshes) {
                        meshes.forEach(mesh => {
                            mesh.instanceMatrix.needsUpdate = true;
                        });
                    }
                });
            } catch (err) {
                console.warn("Satellite Animation Error (Recovering):", err);
            }

            // --- AIRCRAFT EXTRAPOLATION (ATS MODE) ---
            if (appModeRef.current === 'ATS' && nodeMeshRef.current && aircraftData?.length > 0) {
                const mesh = nodeMeshRef.current;
                const dummy = new THREE.Object3D();
                const color = new THREE.Color();
                const dt = (now - lastFrameTime.current) / 1000; // seconds since last frame

                // We use the raw aircraftData and extrapolate based on velocity/heading
                // To avoid complexity, we only update the PLANE types in the instanced mesh
                // The first NODES.ATS.length are stationary towers, the rest are planes
                let idx = NODES.ATS.length;

                aircraftData.slice(0, 2500).forEach(ac => {
                    // Update lat/lon based on speed and heading
                    // Speed is in m/s. Heading is in degrees.
                    const speedDegPerSec = (ac.velocity || 0) * 0.000009; // Scale factor for deg/s
                    const rad = ((ac.heading || 0) - 90) * (Math.PI / 180);

                    // Simple extrapolation
                    ac.lat += -Math.sin(rad) * speedDegPerSec * dt;
                    ac.lon += Math.cos(rad) * speedDegPerSec * dt;

                    const phi = (90 - ac.lat) * (Math.PI / 180);
                    const theta = (ac.lon + 180) * (Math.PI / 180);
                    const r = EARTH_RADIUS + (ac.alt ? (ac.alt / 6371000) * EARTH_RADIUS : 0);

                    dummy.position.x = -(r * Math.sin(phi) * Math.cos(theta));
                    dummy.position.z = (r * Math.sin(phi) * Math.sin(theta));
                    dummy.position.y = (r * Math.cos(phi));
                    dummy.lookAt(0, 0, 0);
                    dummy.updateMatrix();

                    mesh.setMatrixAt(idx, dummy.matrix);

                    // Maintain color
                    const alt = ac.alt || 0;
                    if (alt > 10000) color.setHex(0x00ff00);
                    else if (alt > 5000) color.setHex(0xffff00);
                    else color.setHex(0xffaa00);
                    mesh.setColorAt(idx, color);

                    idx++;
                });

                mesh.instanceMatrix.needsUpdate = true;
                if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
            }

            renderer.render(scene, camera);
        };
        animate();

        // --- RESIZE HANDLER ---
        const handleResize = () => {
            if (!mountRef.current) return;
            const w = mountRef.current.clientWidth;
            const h = mountRef.current.clientHeight;
            renderer.setSize(w, h);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
        };
        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', handleResize);
            if (mountRef.current && renderer.domElement && mountRef.current.contains(renderer.domElement)) {
                mountRef.current.removeChild(renderer.domElement);
            }
            renderer.dispose();
            rendererRef.current = null;
        };
    }, []); // Changed to empty array - initialize once only

    // --- SATELLITE MESH GENERATION (Must be top level) ---
    // --- SATELLITE MESH GENERATION (Must be top level) ---
    useEffect(() => {
        if (!orbitLineRef.current || !orbitLineRef.current.parent) return;

        const scene = orbitLineRef.current.parent;

        // Ensure satGroup exists attached to Scene (Static Frame)
        let satGroup = scene.getObjectByName('satGroup');
        if (!satGroup) {
            satGroup = new THREE.Group();
            satGroup.name = 'satGroup';
            scene.add(satGroup);
        }

        // Cleanup existing meshes from the satGroup
        satMeshesRef.current.forEach(({ meshes }) => {
            if (meshes) {
                meshes.forEach(mesh => {
                    satGroup.remove(mesh);
                    mesh.geometry.dispose();
                    mesh.material.dispose();
                });
            }
        });

        satMeshesRef.current = [];

        satGroups.forEach(group => {
            // FILTERING LOGIC
            let filteredData = group.satData;
            if (satFilter === 'DEFAULT') {
                // Show a mix of satellites from all groups for balanced display
                if (group.name === 'Starlink') filteredData = group.satData.slice(0, 30);
                else if (group.name === 'GPS') filteredData = group.satData.slice(0, 15);
                else filteredData = group.satData; // Show all Space Stations, Weather, NOAA
            } else if (satFilter === 'STARLINK') {
                if (group.name !== 'Starlink') filteredData = [];
            } else if (satFilter === 'GPS') {
                if (group.name !== 'GPS') filteredData = [];
            } else if (satFilter === 'ISS') {
                if (group.name !== 'Space Stations') filteredData = [];
            } else if (satFilter === 'WEATHER') {
                if (group.name !== 'Weather') filteredData = [];
            } else if (satFilter === 'NOAA') {
                if (group.name !== 'NOAA') filteredData = [];
            }
            // 'ALL' shows everything

            const count = filteredData.length;
            if (count === 0) return;

            // --- SATELLITE 3D MODEL COMPOSITION ---
            // Using the pre-loaded satelliteModel state for performance

            if (!satelliteModel || !satelliteModel.bus || !satelliteModel.panel || !satelliteModel.antenna) {
                return; // Wait for load
            }

            const { geometry: busGeo, material: busMat } = satelliteModel.bus;
            const { geometry: panelGeo, material: panelMat } = satelliteModel.panel;
            const { geometry: dishGeo, material: dishMat } = satelliteModel.antenna;

            if (!busGeo || !panelGeo || !dishGeo) {
                console.error("Missing geometry in satellite model");
                return;
            }

            const busMesh = new THREE.InstancedMesh(busGeo, busMat, count);
            const panelMesh = new THREE.InstancedMesh(panelGeo, panelMat, count);
            const dishMesh = new THREE.InstancedMesh(dishGeo, dishMat, count);

            // Matrix Helpers
            const dummy = new THREE.Object3D();
            const date = new Date();
            const scale = EARTH_RADIUS / 6371;

            filteredData.forEach((sat, i) => {
                let posX, posY, posZ;
                let velX = 0, velY = 0, velZ = 0;

                if (sat.satrec) {
                    // SGP4 satellite (real TLE data)
                    const positionAndVelocity = satellite.propagate(sat.satrec, date);
                    const positionEci = positionAndVelocity?.position;
                    const velocityEci = positionAndVelocity?.velocity;

                    if (positionEci && velocityEci) {
                        posX = positionEci.x * scale;
                        posY = positionEci.z * scale;
                        posZ = -positionEci.y * scale;
                        velX = velocityEci.x;
                        velY = velocityEci.z;
                        velZ = -velocityEci.y;
                    } else {
                        return; // Skip this satellite
                    }
                } else if (sat.procedural) {
                    // Procedural satellite (fallback)
                    const altitude = sat.altitude || 550;
                    const inclination = (sat.inclination || 53) * (Math.PI / 180);
                    const phase = sat.phase || 0;
                    const raan = sat.raan || 0;
                    const r = EARTH_RADIUS + (altitude / 6371) * EARTH_RADIUS;

                    // Simple circular orbit calculation
                    const timeOffset = Date.now() * 0.0001; // Slow orbit animation
                    const angle = phase + timeOffset * (28000 / altitude); // Faster at lower altitude

                    // Position on orbital plane
                    const x1 = r * Math.cos(angle);
                    const z1 = r * Math.sin(angle);

                    // Rotate for inclination
                    const y2 = z1 * Math.sin(inclination);
                    const z2 = z1 * Math.cos(inclination);

                    // Rotate for RAAN (right ascension of ascending node)
                    posX = x1 * Math.cos(raan) - z2 * Math.sin(raan);
                    posZ = x1 * Math.sin(raan) + z2 * Math.cos(raan);
                    posY = y2;

                    // Approximate velocity direction (tangent to orbit)
                    velX = -Math.sin(angle + raan);
                    velZ = Math.cos(angle + raan) * Math.cos(inclination);
                    velY = Math.cos(angle) * Math.sin(inclination);
                } else {
                    return; // Unknown satellite type
                }

                dummy.position.set(posX, posY, posZ);

                // Scale down the model (it might be too big)
                dummy.scale.set(0.3, 0.3, 0.3);

                // ROTATION: Align with velocity vector
                dummy.lookAt(posX + velX, posY + velY, posZ + velZ);
                dummy.rotateZ(Math.PI / 2);

                dummy.updateMatrix();

                busMesh.setMatrixAt(i, dummy.matrix);
                panelMesh.setMatrixAt(i, dummy.matrix);
                dishMesh.setMatrixAt(i, dummy.matrix);
            });

            busMesh.instanceMatrix.needsUpdate = true;
            panelMesh.instanceMatrix.needsUpdate = true;
            dishMesh.instanceMatrix.needsUpdate = true;

            satGroup.add(busMesh);
            satGroup.add(panelMesh);
            satGroup.add(dishMesh);

            satMeshesRef.current.push({
                meshes: [busMesh, panelMesh, dishMesh],
                group,
                data: filteredData
            });
        });
    }, [satGroups, satFilter, satelliteModel]);





    // --- NODE PIN UPDATES (Stations + Aircraft) ---
    useEffect(() => {
        const mesh = nodeMeshRef.current;
        if (!mesh) return;

        let activeNodes = [];
        if (appMode === 'RADIO') activeNodes = NODES.RADIO;
        else if (appMode === 'NEWS') activeNodes = NODES.NEWS;
        else if (appMode === 'TACTICAL') activeNodes = NODES.TACTICAL; // Police/Incident Data
        else if (appMode === 'ATS') {
            // Mix Stations + Aircraft
            // Convert aircraft to node format
            const planes = aircraftData.map(ac => ({
                id: ac.icao24,
                city: `${ac.callsign || 'UNK'} (${Math.round(ac.alt || 0)}m)`,
                lat: ac.lat,
                lon: ac.lon,
                type: 'PLANE',
                isOnline: true,
                freq: `${Math.round((ac.velocity || 0) * 1.943)} kts`, // Convert m/s to knots
                alt: ac.alt,
                heading: ac.heading,
                velocity: ac.velocity
            }));
            // Restoring previous high density - user requested "thousands"
            // Using 2500 as a safe high-performance limit for InstancedMesh
            const limitedPlanes = planes.slice(0, 2500);
            activeNodes = [...NODES.ATS, ...limitedPlanes];
        }


        const dummy = new THREE.Object3D();
        const color = new THREE.Color();

        let idx = 0;
        activeNodes.forEach(node => {
            const phi = (90 - node.lat) * (Math.PI / 180);
            const theta = (node.lon + 180) * (Math.PI / 180);
            const r = EARTH_RADIUS;

            dummy.position.x = -(r * Math.sin(phi) * Math.cos(theta));
            dummy.position.z = (r * Math.sin(phi) * Math.sin(theta));
            dummy.position.y = (r * Math.cos(phi));
            dummy.lookAt(0, 0, 0);
            dummy.updateMatrix();

            mesh.setMatrixAt(idx, dummy.matrix);

            // COLOR CODING
            if (node.type === 'RADIO') color.setHex(MODE_CONFIG.RADIO.color);
            else if (node.type === 'NEWS') color.setHex(MODE_CONFIG.NEWS.color);
            else if (node.type === 'TACTICAL') color.setHex(MODE_CONFIG.TACTICAL.color);
            else if (node.type === 'WEATHER') color.setHex(MODE_CONFIG.WEATHER.color);
            else if (node.type === 'ATS') color.setHex(0xf59e0b); // Amber for towers
            else if (node.type === 'PLANE') {
                // Altitude-based coloring
                const alt = node.alt || 0;
                if (alt > 10000) color.setHex(0x00ff00); // High (Green)
                else if (alt > 5000) color.setHex(0xffff00); // Mid (Yellow)
                else color.setHex(0xffaa00); // Low (Orange)
            }
            else if (node.type === 'MILITARY') color.setHex(0xff4400); // Red-Orange
            else color.setHex(0xffffff);

            mesh.setColorAt(idx, color);
            idx++;
        });

        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    }, [appMode, aircraftData]);

    return <div ref={mountRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 0, pointerEvents: 'auto' }} />;
};

// --- ERROR BOUNDARY ---
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Globe Error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="absolute inset-0 z-0 flex items-center justify-center bg-black text-white p-4">
                    <div className="bg-black p-6 rounded border border-red-500 max-w-md text-center">
                        <h3 className="text-xl font-bold mb-2 text-red-400">Something went wrong</h3>
                        <p className="text-sm text-slate-400 mb-4">The 3D visualization encountered an error</p>
                        <pre className="text-xs text-left overflow-auto max-h-32 bg-slate-900 p-2 rounded mb-4">{this.state.error?.toString()}</pre>
                        <button
                            onClick={() => this.setState({ hasError: false, error: null })}
                            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded font-bold text-sm transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

// --- MAIN APP COMPONENT ---

export default function App() {
    // --- STATE ---
    const [appMode, setAppMode] = useState('RADIO');
    const [selectedStation, setSelectedStation] = useState(null);
    const [selectedSatellite, setSelectedSatellite] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isBuffering, setIsBuffering] = useState(false);
    const [error, setError] = useState(null);
    const [activeLogs, setActiveLogs] = useState([]);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [analysisLoading, setAnalysisLoading] = useState(false);
    const [analysisError, setAnalysisError] = useState(null);
    const [weatherLayer, setWeatherLayer] = useState('CLOUDS');
    const [weatherData, setWeatherData] = useState(null);
    const [selectedCity, setSelectedCity] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [fps, setFps] = useState(0);
    const [uptime, setUptime] = useState(0);
    const [panelMinimizedStates, setPanelMinimizedStates] = useState({
        registry: false,
        analyzer: false,
        orbital: false,
        resources: false,
        logs: false
    });
    // Immediate procedural satellites for instant visibility while TLEs load
    const createInitialSats = (name, count, alt, inc) => {
        const sats = [];
        for (let i = 0; i < count; i++) {
            sats.push({
                name: `${name}-${i + 1}`,
                procedural: true,
                altitude: alt,
                inclination: inc,
                phase: (i / count) * Math.PI * 2,
                raan: (i % 6) * 60 * (Math.PI / 180),
                type: 'PROCEDURAL'
            });
        }
        return sats;
    };
    const [satGroups, setSatGroups] = useState([
        { name: 'Starlink', id: 'STARLINK', satData: createInitialSats('STARLINK', 80, 550, 53), count: 80 },
        { name: 'GPS', id: 'GPS', satData: createInitialSats('GPS', 31, 20200, 55), count: 31 },
        { name: 'Space Stations', id: 'STATIONS', satData: createInitialSats('ISS', 3, 420, 51.6), count: 3 },
        { name: 'Weather', id: 'WEATHER', satData: createInitialSats('GOES', 8, 35786, 0), count: 8 }
    ]);
    const [satFilter, setSatFilter] = useState('DEFAULT'); // 'DEFAULT', 'ALL', 'STARLINK', 'GPS', 'ISS'
    const [aircraftData, setAircraftData] = useState([]);

    // --- REFS ---
    // audioRef removed - using global AudioManager
    const startTimeRef = useRef(Date.now());
    const cityLabelsRef = useRef(null); // For city labels
    const weatherLayerRef = useRef(weatherLayer);
    const globeGroupRef = useRef(null);
    const starsRef = useRef(null);
    const orbitLineRef = useRef(null);
    const glowSpriteRef = useRef(null);
    const [satelliteModel, setSatelliteModel] = useState(null);
    useEffect(() => { weatherLayerRef.current = weatherLayer; }, [weatherLayer]);

    // --- LOAD SATELLITE MODEL (WITH FALLBACK) ---
    useEffect(() => {
        // FALLBACK: Procedural model using Three.js primitives
        const createFallbackModel = () => {
            console.log("Creating fallback procedural satellite model...");
            const busMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.6, roughness: 0.4 });
            const panelMat = new THREE.MeshStandardMaterial({ color: 0x2266bb, metalness: 0.3, roughness: 0.5 });
            const antennaMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.2 });

            return {
                bus: { geometry: new THREE.BoxGeometry(1, 0.5, 0.5), material: busMat },
                panel: { geometry: new THREE.BoxGeometry(3, 0.05, 0.8), material: panelMat },
                antenna: { geometry: new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8), material: antennaMat }
            };
        };

        const loader = new GLTFLoader();
        loader.load('/models/satellite.glb', (gltf) => {
            console.log("Satellite GLB Loaded successfully");
            let model = {};
            const bus = gltf.scene.getObjectByName('Bus');
            const panel = gltf.scene.getObjectByName('Solar_Panel');
            const antenna = gltf.scene.getObjectByName('Antenna');

            if (bus && panel && antenna) {
                model = {
                    bus: { geometry: bus.geometry, material: bus.material },
                    panel: { geometry: panel.geometry, material: panel.material },
                    antenna: { geometry: antenna.geometry, material: antenna.material }
                };
            } else {
                gltf.scene.traverse(child => {
                    if (child.isMesh) {
                        if (child.name.toLowerCase().includes('panel')) {
                            model.panel = { geometry: child.geometry, material: child.material };
                        } else if (child.name.toLowerCase().includes('antenna')) {
                            model.antenna = { geometry: child.geometry, material: child.material };
                        } else {
                            model.bus = { geometry: child.geometry, material: child.material };
                        }
                    }
                });
            }
            if (model.bus && model.panel && model.antenna) {
                setSatelliteModel(model);
                console.log("Satellite model state initialized");
            } else {
                console.warn("GLB loaded but missing parts, using fallback");
                setSatelliteModel(createFallbackModel());
            }
        }, undefined, (error) => {
            console.error("GLB load failed, using fallback model:", error);
            setSatelliteModel(createFallbackModel());
        });
    }, []);

    // --- SATELLITE DATA - REAL TLE FETCHING ---
    useEffect(() => {
        const fetchSatellites = async () => {
            const PROXY = 'http://localhost:3001/proxy/data?url=';

            // Celestrak Groups
            const SOURCES = [
                { name: 'Starlink', id: 'STARLINK', url: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=tle', limit: 300 },
                { name: 'GPS', id: 'GPS', url: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=gps-ops&FORMAT=tle', limit: 50 },
                { name: 'Space Stations', id: 'STATIONS', url: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle', limit: 50 },
                { name: 'Weather', id: 'WEATHER', url: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=weather&FORMAT=tle', limit: 100 },
                { name: 'NOAA', id: 'NOAA', url: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=noaa&FORMAT=tle', limit: 50 }
            ];

            const newGroups = [];
            let totalSats = 0;

            console.log("Starting Satellite TLE Fetch...");

            for (const source of SOURCES) {
                try {
                    const res = await fetch(PROXY + encodeURIComponent(source.url));
                    if (!res.ok) throw new Error(`Failed to fetch ${source.name}`);
                    const text = await res.text();

                    // Parse TLEs
                    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
                    const sats = [];

                    for (let i = 0; i < lines.length; i += 3) {
                        const name = lines[i];
                        const line1 = lines[i + 1];
                        const line2 = lines[i + 2];

                        if (line1 && line2 && line1.startsWith('1') && line2.startsWith('2')) {
                            const satrec = satellite.twoline2satrec(line1, line2);
                            sats.push({
                                name: name,
                                satrec: satrec,
                                line1: line1,
                                line2: line2,
                                id: satrec.satnum, // NORAD ID
                                type: 'REAL'
                            });
                        }
                    }

                    // Limit count for performance
                    const limitedSats = source.limit ? sats.slice(0, source.limit) : sats;

                    newGroups.push({
                        name: source.name,
                        id: source.id,
                        satData: limitedSats,
                        count: limitedSats.length
                    });
                    totalSats += limitedSats.length;
                    console.log(`Fetched ${limitedSats.length} satellites for ${source.name}`);

                } catch (e) {
                    console.error(`Failed to load ${source.name} satellites:`, e);
                    newGroups.push({
                        name: source.name + ' (OFFLINE)',
                        id: source.id,
                        satData: [],
                        count: 0
                    });
                }
            }

            setSatGroups(newGroups);
            console.log(`Total Satellites Loaded: ${totalSats}`);

            // FALLBACK: If no satellites loaded, generate procedural ones
            if (totalSats === 0) {
                console.warn('[SAT] No TLEs loaded, using procedural fallback...');
                const createProcedural = (name, count, alt, inc) => {
                    const sats = [];
                    for (let i = 0; i < count; i++) {
                        sats.push({
                            name: `${name}-${i + 1}`,
                            procedural: true,
                            altitude: alt,
                            inclination: inc,
                            phase: (i / count) * Math.PI * 2,
                            raan: (i % 6) * 60 * (Math.PI / 180),
                            type: 'PROCEDURAL'
                        });
                    }
                    return sats;
                };
                setSatGroups([
                    { name: 'Starlink', id: 'STARLINK', satData: createProcedural('STARLINK', 100, 550, 53), count: 100 },
                    { name: 'GPS', id: 'GPS', satData: createProcedural('GPS', 31, 20200, 55), count: 31 },
                    { name: 'Space Stations', id: 'STATIONS', satData: createProcedural('ISS', 3, 420, 51.6), count: 3 }
                ]);
            }
        };

        fetchSatellites();

        // Refresh TLEs every 12 hours
        const interval = setInterval(fetchSatellites, 12 * 60 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    // --- AIRCRAFT DATA FETCHING (Always fetch for availability) ---
    useEffect(() => {
        const fetchAircraft = async () => {
            try {
                const res = await fetch('http://localhost:3001/api/aircraft');
                if (res.ok) {
                    const data = await res.json();
                    if (data.data) setAircraftData(data.data);
                }
            } catch (e) { console.error("Aircraft fetch error", e); }
        };

        fetchAircraft();
        const interval = setInterval(fetchAircraft, 30000); // 30s poll
        return () => clearInterval(interval);
    }, []); // Run once on mount

    const currentConfig = MODE_CONFIG[appMode];

    // --- HANDLERS ---
    const toggleMinimize = (panel) => {
        setPanelMinimizedStates(prev => ({ ...prev, [panel]: !prev[panel] }));
    };

    const handleNodeSelect = (node, autoPlay = false) => {
        setSelectedStation(node);
        setSelectedSatellite(null); // Deselect satellite
        setError(null);
        setAnalysisResult(null);
        setAnalysisError(null);

        // Add log
        const newLog = { time: new Date().toLocaleTimeString(), msg: `TARGET ACQUIRED: ${node.city} [${node.freq}]` };
        setActiveLogs(prev => [...prev.slice(-19), newLog]);

        // Auto-play if clicked on globe
        if (autoPlay && node.stream && node.isOnline) {
            setIsPlaying(false); // Stop current playback first

            setTimeout(() => {
                setIsPlaying(true);
                audioManager.play(node.stream).catch(err => {
                    console.error('Auto-play failed:', err);
                    setError('Auto-play blocked. Click PLAY STREAM button.');
                    setIsPlaying(false);
                });

                setActiveLogs(prev => [...prev.slice(-19), {
                    time: new Date().toLocaleTimeString(),
                    msg: `AUTO - PLAY: ${node.city} @${node.freq} `
                }]);
            }, 100);
        } else if (!autoPlay) {
            setIsPlaying(false); // Just stop if manually selected from list
            audioManager.stop();
        }
    };

    const handleSatelliteSelect = (sat, groupInfo) => {
        setSelectedSatellite({ ...sat, group: groupInfo });
        setSelectedStation(null); // Deselect station

        // Update Glow
        if (glowSpriteRef.current) {
            glowSpriteRef.current.visible = true;
        }

        // Add log
        const newLog = { time: new Date().toLocaleTimeString(), msg: `SATELLITE TRACKED: ${groupInfo.name} [ID: ${groupInfo.id}]` };
        setActiveLogs(prev => [...prev.slice(-19), newLog]);
    };

    // --- WEATHER SEARCH HANDLER ---
    const handleWeatherSearch = async (city) => {
        setSelectedCity(city);
        try {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current_weather=true&hourly=relativehumidity_2m,precipitation_probability,surface_pressure`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.current_weather) {
                setWeatherData({
                    locationName: city.name + (city.country ? `, ${city.country}` : ''),
                    lat: city.lat,
                    lon: city.lon,
                    temp: data.current_weather.temperature,
                    windSpeed: data.current_weather.windspeed,
                    windDir: data.current_weather.winddirection,
                    weatherCode: data.current_weather.weathercode,
                    humidity: data.hourly?.relativehumidity_2m?.[0] || 'N/A',
                    precipitation: data.hourly?.precipitation_probability?.[0] || 0,
                    pressure: data.hourly?.surface_pressure?.[0] || 'N/A'
                });
                // Add log
                const newLog = { time: new Date().toLocaleTimeString(), msg: `WEATHER TARGET: ${city.name} [${city.lat.toFixed(2)}°, ${city.lon.toFixed(2)}°]` };
                setActiveLogs(prev => [...prev.slice(-19), newLog]);
            }
        } catch (e) {
            console.error('Weather fetch failed:', e);
            setWeatherData(null);
        }
    };

    // --- MODE CHANGE HANDLER ---
    const handleModeChange = (mode) => {
        if (mode === appMode) return;

        // Stop any playing audio
        if (isPlaying) {
            audioManager.stop();
            setIsPlaying(false);
        }

        // Clear selections
        setSelectedStation(null);
        setSelectedSatellite(null);
        setSelectedCity(null);
        setWeatherData(null);
        setError(null);

        setAppMode(mode);

        // Log switch
        const newLog = { time: new Date().toLocaleTimeString(), msg: `SYSTEM MODE SWITCH: ${mode}` };
        setActiveLogs(prev => [...prev.slice(-19), newLog]);
    };

    // --- ORBITAL TRAIL CALCULATION MOVED TO GLOBE COMPONENT ---

    const handleAnalyzeSignal = async () => {
        if (!selectedStation) return;

        setAnalysisResult(null);
        setAnalysisError(null);
        setAnalysisLoading(true);

        // SIMULATION MODE (If no API Key)
        if (!API_KEY) {
            setTimeout(() => {
                const mockReports = [
                    "SIGNAL DECRYPTED: Encrypted voice traffic detected on sideband. Origin appears to be mobile ground unit. Content suggests routine patrol status check.",
                    "INTERCEPT ANALYSIS: High-frequency data burst intercepted. Header indicates telemetry from unknown orbital asset. Decoding...",
                    "PATTERN MATCH: Signal signature matches known civilian broadcast pattern. No anomalies detected. Signal integrity: 98%.",
                ];
                setAnalysisResult(mockReports[Math.floor(Math.random() * mockReports.length)]);
                setAnalysisLoading(false);
            }, 2000);
            return;
        }

        // Real API call would go here
        setAnalysisLoading(false);
    };

    // --- UPTIME COUNTER ---
    useEffect(() => {
        const interval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
            setUptime(elapsed);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Format uptime as HH:MM:SS
    const formatUptime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')} `;
    };

    // --- GLOBE INTERACTION HANDLER ---
    const handleGlobeClick = (lat, lon) => {
        // AUDIO BINDING (RADIO / TACTICAL / ATS)
        if (appMode === 'RADIO' || appMode === 'TACTICAL' || appMode === 'ATS') {
            const nodes = NODES[appMode] || [];
            let nearest = null;
            let minD = Infinity;

            // Simple Euclidean distance on lat/lon (sufficient for click selection)
            nodes.forEach(node => {
                const dLat = node.lat - lat;
                // Handle wrap-around for longitude
                let dLon = node.lon - lon;
                if (dLon > 180) dLon -= 360;
                if (dLon < -180) dLon += 360;

                const dist = Math.sqrt(dLat * dLat + dLon * dLon);
                if (dist < minD) {
                    minD = dist;
                    nearest = node;
                }
            });

            // Threshold: 5 degrees (~550km) for auto-snap
            if (nearest && minD < 5) {
                handleNodeSelect(nearest, true); // True = Auto-play
                return;
            }
        }

        if (appMode !== 'WEATHER') return;

        // Simulate Weather Data based on Latitude
        const isPolar = Math.abs(lat) > 60;
        const isTropical = Math.abs(lat) < 23;

        // Reverse Geocoding (Nearest City)
        let locationName = "Unknown Sector";
        let minDist = Infinity;

        WEATHER_CITIES.forEach(city => {
            const dLat = city.lat - lat;
            const dLon = city.lon - lon;
            const dist = Math.sqrt(dLat * dLat + dLon * dLon);
            if (dist < minDist) {
                minDist = dist;
                if (dist < 8) { // INCREASED RADIUS: ~8 degrees (approx 800km)
                    locationName = `Near ${city.name}, ${city.country}`;
                } else if (dist < 15) {
                    locationName = `${dist.toFixed(0)}00km from ${city.name}`;
                }
            }
        });

        if (minDist > 25) locationName = "Deep Ocean / Remote";

        let temp, condition, description;

        if (isPolar) {
            temp = Math.floor(Math.random() * -20) - 10; // -10 to -30
            condition = Math.random() > 0.5 ? 'Snow' : 'Clear';
            description = "Polar vortex stability nominal. Ice sheet integrity 98%.";
        } else if (isTropical) {
            temp = Math.floor(Math.random() * 15) + 25; // 25 to 40
            condition = Math.random() > 0.6 ? 'Stormy' : (Math.random() > 0.3 ? 'Rainy' : 'Clear');
            description = "High humidity detected. Convective storm cells forming.";
        } else {
            temp = Math.floor(Math.random() * 25) + 5; // 5 to 30
            condition = Math.random() > 0.7 ? 'Rainy' : (Math.random() > 0.4 ? 'Cloudy' : 'Clear');
            description = "Atmospheric pressure stable. Visibility good.";
        }

        setWeatherData({
            lat,
            lon,
            locationName, // NEW
            temp,
            condition,
            description,
            humidity: Math.floor(Math.random() * 60) + 40,
            windSpeed: Math.floor(Math.random() * 40) + 5,
            pressure: Math.floor(Math.random() * 50) + 980
        });
    };

    return (
        <div className="fixed top-0 left-0 w-full h-[100dvh] bg-black text-white font-sans overflow-hidden selection:bg-cyan-500/30" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', overflow: 'hidden', backgroundColor: 'black' }}>
            {/* BACKGROUND - Conditional based on mode */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, isolation: 'isolate', contain: 'layout style paint' }}>
                {appMode === 'ATS' ? (
                    <FlightRadarEmbed />
                ) : appMode === 'TACTICAL' ? (
                    <CrimeMapEmbed />
                ) : appMode === 'WEATHER' ? (
                    <WeatherMapEmbed lat={weatherData?.lat || 45} lon={weatherData?.lon || 10} zoom={weatherData ? 7 : 3} />
                ) : (
                    <ErrorBoundary>
                        <Globe
                            onNodeSelect={handleNodeSelect}
                            onSatelliteSelect={handleSatelliteSelect}
                            onFpsUpdate={setFps}
                            appMode={appMode}
                            selectedNode={selectedStation}
                            onGlobeClick={handleGlobeClick}
                            weatherLayer={weatherLayer}
                            satGroups={satGroups}
                            setSatGroups={setSatGroups}
                            cityLabelsRef={cityLabelsRef}
                            selectedSatellite={selectedSatellite}
                            satFilter={satFilter}
                            aircraftData={aircraftData}
                            satelliteModel={satelliteModel}
                        />
                    </ErrorBoundary>
                )}
            </div>

            {/* --- OVERLAY UI --- */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 1000,
                pointerEvents: 'none',
                display: 'flex',
                flexDirection: 'column',
                padding: '1rem',
                paddingTop: (appMode === 'ATS' || appMode === 'TACTICAL') ? '4.5rem' : '1rem'
            }}>

                {/* HEADER */}
                <div className="flex justify-between items-start mb-4 pointer-events-auto">
                    <div className="flex flex-col">
                        <h1 className="text-4xl font-black tracking-tighter text-white mb-1 flex items-center gap-3">
                            <GlobeIcon className="w-8 h-8 text-cyan-400 animate-pulse" />
                            AETHER <span className="text-cyan-500">MONITOR</span>
                        </h1>
                        <div className="flex items-center gap-4 text-xs font-mono text-cyan-300/70">
                            <span className="text-cyan-400 font-mono">v2.3 VISUAL OVERHAUL</span>
                            <span>::</span>
                            <span>SECURE CONNECTION</span>
                            <span>::</span>
                            <span className="animate-pulse text-green-400">LIVE FEED ACTIVE</span>
                        </div>
                    </div>

                    {/* MODE SWITCHER */}
                    <div className="flex gap-2 bg-black/90 p-1 rounded border border-slate-800">
                        {Object.entries(MODE_CONFIG).map(([key, config]) => {
                            const Icon = config.icon;
                            const isActive = appMode === key;
                            return (
                                <button
                                    key={key}
                                    onClick={() => handleModeChange(key)}
                                    className={`
                                        flex items-center gap-2 px-4 py-2 rounded transition-all duration-300 font-bold text-xs tracking-wider
                                        ${isActive
                                            ? `bg-${config.theme}-950/40 text-${config.theme}-400 border border-${config.theme}-500/30 shadow-[0_0_20px_rgba(0,0,0,0.6)] backdrop-blur-md`
                                            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                                        }
                                    `}
                                >
                                    <Icon size={14} />
                                    {config.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* CITY LABELS OVERLAY */}
                <div ref={cityLabelsRef} className="absolute inset-0 pointer-events-none z-10 overflow-hidden" />

                {/* MAIN GRID */}
                <div className="flex-1 grid grid-cols-12 gap-4 min-h-0 pointer-events-none">

                    {/* LEFT COLUMN - REGISTRY & ANALYZER */}
                    <div className="col-span-3 flex flex-col gap-4 min-h-0 pointer-events-auto h-full">
                        {appMode !== 'WEATHER' ? (
                            <>
                                <DraggablePanel
                                    title={appMode === 'ATS' ? 'AVIATION HAM' : appMode === 'TACTICAL' ? 'SCANNER FEEDS' : 'NODE REGISTRY'}
                                    icon={appMode === 'ATS' || appMode === 'TACTICAL' ? Radio : Database}
                                    color="cyan"
                                    isMinimized={panelMinimizedStates.registry}
                                    onToggleMinimize={() => toggleMinimize('registry')}
                                    className="flex-1 min-h-0"
                                >
                                    {(appMode === 'ATS' || appMode === 'TACTICAL') ? (
                                        <HamRadioPanel
                                            mode={appMode}
                                            onSelectStream={(stream) => {
                                                setSelectedStation({
                                                    id: stream.id,
                                                    city: stream.name,
                                                    freq: stream.freq,
                                                    stream: stream.url,
                                                    isOnline: true,
                                                    type: stream.type
                                                });
                                                // Auto-play HAM stream
                                                audioManager.play(stream.url).then(() => {
                                                    setIsPlaying(true);
                                                    setActiveLogs(prev => [...prev.slice(-19), {
                                                        time: new Date().toLocaleTimeString(),
                                                        msg: `HAM TUNED: ${stream.name} @ ${stream.freq}`
                                                    }]);
                                                }).catch(err => {
                                                    console.error('HAM play failed:', err);
                                                    setError('Stream unavailable');
                                                });
                                            }}
                                        />
                                    ) : (
                                        <NodeRegistryPanel
                                            appMode={appMode}
                                            searchQuery={searchQuery}
                                            setSearchQuery={setSearchQuery}
                                            selectedStation={selectedStation}
                                            handleNodeSelect={handleNodeSelect}
                                            isPlaying={isPlaying}
                                            aircraftData={aircraftData}
                                            onStopAudio={() => {
                                                setIsPlaying(false);
                                                audioManager.stop();
                                            }}
                                        />
                                    )}
                                </DraggablePanel>

                                <DraggablePanel
                                    title="SIGNAL ANALYZER"
                                    icon={Activity}
                                    color="emerald"
                                    isMinimized={panelMinimizedStates.analyzer}
                                    onToggleMinimize={() => toggleMinimize('analyzer')}
                                    className="shrink-0"
                                >
                                    <AnalyzerPanel
                                        appMode={appMode}
                                        selectedStation={selectedStation}
                                        isPlaying={isPlaying}
                                        isBuffering={isBuffering}
                                        error={error}
                                        setIsPlaying={setIsPlaying}
                                        setError={setError}
                                        setActiveLogs={setActiveLogs}
                                        handleAnalyzeSignal={handleAnalyzeSignal}
                                        analysisResult={analysisResult}
                                        analysisLoading={analysisLoading}
                                        analysisError={analysisError}
                                    />
                                </DraggablePanel>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col gap-4 min-h-0 pointer-events-auto h-full">
                                <div className="p-4 bg-black/80 border border-slate-800 rounded text-center animate-in fade-in backdrop-blur-md">
                                    <CloudRain className="w-12 h-12 text-cyan-400 mb-2 mx-auto animate-pulse" />
                                    <h2 className="text-lg font-bold text-white mb-1">GLOBAL WEATHER MONITORING</h2>
                                    <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                                        Real-Time Atmospheric Data Visualization
                                    </p>
                                </div>

                                {/* WEATHER HAM RADIO - NOAA Weather Radio */}
                                <div className="mb-2">
                                    <HamRadioPanel
                                        mode="WEATHER"
                                        onSelectStream={(stream) => {
                                            setSelectedStation({
                                                id: stream.id,
                                                city: stream.name,
                                                freq: stream.freq,
                                                stream: stream.url,
                                                isOnline: true,
                                                type: 'WEATHER'
                                            });
                                            audioManager.play(stream.url).then(() => {
                                                setIsPlaying(true);
                                            }).catch(() => { });
                                        }}
                                    />
                                </div>

                                {/* DYNAMIC WEATHER DATA PANEL */}
                                <div className="flex-1 bg-black/80 border border-slate-800 rounded p-4 overflow-y-auto backdrop-blur-md flex flex-col gap-4">

                                    {/* SEARCH BAR */}
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input
                                            type="text"
                                            placeholder="Search City / Region..."
                                            className="w-full bg-slate-900/50 border border-slate-700 rounded py-2 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors"
                                            onChange={(e) => {
                                                const val = e.target.value.toLowerCase();
                                                if (val.length > 2) {
                                                    const match = WEATHER_CITIES.find(c => c.name.toLowerCase().includes(val));
                                                    if (match) handleWeatherSearch(match);
                                                }
                                            }}
                                        />
                                    </div>

                                    {weatherData ? (
                                        <div className="flex flex-col gap-4 animate-in slide-in-from-left-4 fade-in duration-300">
                                            <div className="border-b border-slate-700 pb-2">
                                                <div className="text-[10px] text-slate-500 font-mono mb-1">TARGET LOCATION</div>
                                                <div className="text-xl font-bold text-white">{weatherData.locationName}</div>
                                                <div className="text-xs font-mono text-cyan-400">
                                                    {Math.abs(weatherData.lat).toFixed(2)}Â°{weatherData.lat >= 0 ? 'N' : 'S'}, {Math.abs(weatherData.lon).toFixed(2)}Â°{weatherData.lon >= 0 ? 'E' : 'W'}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-slate-900/50 p-3 rounded border border-slate-700">
                                                    <div className="text-[10px] text-slate-500 mb-1">TEMPERATURE</div>
                                                    <div className="text-2xl font-bold text-white">{weatherData.temp}Â°C</div>
                                                </div>
                                                <div className="bg-slate-900/50 p-3 rounded border border-slate-700">
                                                    <div className="text-[10px] text-slate-500 mb-1">HUMIDITY</div>
                                                    <div className="text-2xl font-bold text-blue-400">{weatherData.humidity}%</div>
                                                </div>
                                                <div className="bg-slate-900/50 p-3 rounded border border-slate-700">
                                                    <div className="text-[10px] text-slate-500 mb-1">WIND SPEED</div>
                                                    <div className="text-2xl font-bold text-emerald-400">{weatherData.windSpeed} <span className="text-xs text-slate-500">km/h</span></div>
                                                </div>
                                                <div className="bg-slate-900/50 p-3 rounded border border-slate-700">
                                                    <div className="text-[10px] text-slate-500 mb-1">PRESSURE</div>
                                                    <div className="text-2xl font-bold text-purple-400">{weatherData.pressure} <span className="text-xs text-slate-500">hPa</span></div>
                                                </div>
                                            </div>

                                            <div className="bg-slate-900/50 p-3 rounded border border-slate-700">
                                                <div className="text-[10px] text-slate-500 mb-1">CONDITION</div>
                                                <div className="text-lg font-bold text-yellow-400 flex items-center gap-2">
                                                    {weatherData.condition === 'Stormy' && <Zap className="w-4 h-4" />}
                                                    {weatherData.condition === 'Rainy' && <CloudRain className="w-4 h-4" />}
                                                    {weatherData.condition === 'Cloudy' && <CloudRain className="w-4 h-4" />}
                                                    {(weatherData.condition || 'STABLE').toUpperCase()}
                                                </div>
                                                <div className="text-xs text-slate-400 mt-1 italic">
                                                    "{weatherData.description}"
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2 opacity-50">
                                            <Search className="w-8 h-8" />
                                            <span className="text-xs font-mono text-center">CLICK ANYWHERE ON THE GLOBE<br />TO ANALYZE LOCAL ATMOSPHERE</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* CENTER COLUMN - VISUALIZER */}
                    <div className="col-span-6 flex flex-col justify-end pb-8 pointer-events-none">
                        <div className="pointer-events-auto">
                            <AudioVisualizer isPlaying={isPlaying} />
                        </div>
                    </div>

                    {/* RIGHT COLUMN - ORBITAL & SYSTEM */}
                    <div className="col-span-3 flex flex-col gap-4 min-h-0 pointer-events-auto">
                        {appMode !== 'WEATHER' && (
                            <DraggablePanel
                                title="ORBITAL TRACKING"
                                icon={Satellite}
                                color="indigo"
                                isMinimized={panelMinimizedStates.orbital}
                                onToggleMinimize={() => toggleMinimize('orbital')}
                            >
                                <OrbitalPanel
                                    selectedSatellite={selectedSatellite}
                                    satGroups={satGroups}
                                    satFilter={satFilter}
                                    setSatFilter={setSatFilter}
                                />
                            </DraggablePanel>
                        )}
                        <DraggablePanel
                            title="SYSTEM RESOURCES"
                            icon={Cpu}
                            color="slate"
                            isMinimized={panelMinimizedStates.resources}
                            onToggleMinimize={() => toggleMinimize('resources')}
                        >
                            <ResourcePanel uptime={formatUptime(uptime)} fps={fps} />
                        </DraggablePanel>
                    </div>
                </div>
            </div>
        </div>
    );
}
