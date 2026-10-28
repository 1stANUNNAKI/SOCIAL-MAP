/**
 * ============================================================================
 * SMI — Real-Map 3D Live Roaming, Physics, Architecture & AI Avatar Engine (v16.0)
 * ============================================================================
 * Designed by Bashar Twaij (SMI.basharTwaij.com / BasharTwaij.com)
 *
 * Key Capabilities:
 * 1. Fast 60FPS Rendering with shared geometry/material pools & 5x5 real map
 *    slippy tile streaming (1:1 WGS84 metric projection).
 * 2. Authentic 3D Physics & Solid Collision Engine:
 *    - Characters never clip into streets, trees, or buildings.
 *    - Human (`انسان`) & Explorer (`مستكشف`) climb buildings step-by-step
 *      (`درجة درجة`) when pressing against a facade, and can stand/walk on roofs.
 *    - Touching any building/element unlocks the Action Button (`ضغط الإجراء 🏢/🔓`)
 *      to open the Place Info & Services Hub (which stays strictly hidden otherwise).
 * 3. Distinct 3D Architectural Typologies for Every Building Category:
 *    - Universities (Classical Columns + Clock/Knowledge Tower)
 *    - Mosques & Shrines (Ribbed Dome + Crescent + Tall Minaret + Arches)
 *    - Schools (Courtyard + Iraqi Flagpole + Colorful Canopy)
 *    - Malls (Curved/Stepped Glass Curtain-Wall + Neon Fascia + Panoramic Lift)
 *    - Markets / Souqs (Arched Bazaar Arcade + Striped Canopies)
 *    - Hospitals (White/Cyan Medical Tower + Red Crescent + Rooftop Helipad H)
 *    - Restaurants (Hospitality Facade + Outdoor Umbrella Tables)
 *    - Residential / Heritage (Baghdadi Wooden Shanasheel)
 * 4. Rich Community Parks & Playgrounds:
 *    - Colorful Slides (`زحاليق`), Swings (`مراجيح`), Seesaws, Carousel,
 *      Animated Water Fountain, and Family Gazebo.
 * 5. Character Special Laws & Abilities:
 *    - Robot (`روبوت`): Animated moving eye laser beams + random Arabic speech
 *      bubble every 15–30s accompanied by synthesized JAX machine language audio.
 *    - All characters: 3D Laser/Projectile firing (`🔥`), Jumping & Free Flight
 *      (`⬆️/⬇️`), and authentic synthesized animal/vehicle sounds (`📯`).
 * 6. Mobile & Tablet Landscape/Portrait Split-Screen Touch:
 *    - Left half: Ultra-transparent virtual movement gear (`ترس تحرك شفاف جداً`).
 *    - Right cluster: Action Trigger (`🏢`), Fire (`🔥`), Horn/Voice (`📯`), Up (`⬆️`), Down (`⬇️`).
 * 7. Live Roaming Auto-Navigation (`ملاحة آلية للشخصية`):
 *    - Searching and selecting any place while in Live Roaming mode smoothly
 *      navigates the character toward the destination with pause/resume & ride/shop options.
 * ============================================================================
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { IRAQ_DETAILED_PLACES } from '../data/iraq-data.js?v=16';
import { threeEngine, AVAILABLE_3D_MODELS } from './three-engine.js?v=16';

/**
 * 1. WGS84 Local Tangent Plane Projector (1 Three.js unit = 1 real meter)
 */
export function createIraqGeoProjector(originLng, originLat) {
    const EARTH_RADIUS = 6378137.0;
    const DEG2RAD = Math.PI / 180.0;
    const cosLat0 = Math.cos(originLat * DEG2RAD);

    return {
        originLng,
        originLat,
        lngLatToXZ(lng, lat) {
            const x = (lng - originLng) * DEG2RAD * EARTH_RADIUS * cosLat0;
            const z = -(lat - originLat) * DEG2RAD * EARTH_RADIUS;
            return [x, z];
        },
        xzToLngLat(x, z) {
            const lng = originLng + (x / (EARTH_RADIUS * cosLat0)) / DEG2RAD;
            const lat = originLat - (z / EARTH_RADIUS) / DEG2RAD;
            return [lng, lat];
        }
    };
}

function lngLatToTileXY(lng, lat, zoom) {
    const n = Math.pow(2, zoom);
    const x = Math.floor(((lng + 180) / 360) * n);
    const latRad = (lat * Math.PI) / 180;
    const y = Math.floor(
        ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
    );
    return { x, y };
}

function tileXYToBoundsLngLat(tx, ty, zoom) {
    const n = Math.pow(2, zoom);
    const west = (tx / n) * 360 - 180;
    const east = ((tx + 1) / n) * 360 - 180;
    const nNorth = Math.PI - (2 * Math.PI * ty) / n;
    const nSouth = Math.PI - (2 * Math.PI * (ty + 1)) / n;
    const north = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(nNorth) - Math.exp(-nNorth)));
    const south = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(nSouth) - Math.exp(-nSouth)));
    return { west, east, north, south };
}

function isPointInPolygonXZ(px, pz, ringXZ) {
    let inside = false;
    for (let i = 0, j = ringXZ.length - 1; i < ringXZ.length; j = i++) {
        const xi = ringXZ[i][0], zi = ringXZ[i][1];
        const xj = ringXZ[j][0], zj = ringXZ[j][1];
        const intersect = ((zi > pz) !== (zj > pz)) &&
            (px < ((xj - xi) * (pz - zi)) / ((zj - zi) || 1e-9) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

/**
 * Sentences spoken by the Robot in Arabic while emitting JAX Machine Language audio
 */
const ROBOT_JAX_ARABIC_SENTENCES = [
    '🤖 أُحلّل الآن تضاريس البنايات والشوارع المحيطة بالليزر الضوئي!',
    '⚡ بروتوكول جاكس للآلات نشط.. أهلاً بك في نظام SMI الذكي!',
    '🛰️ الإحداثيات الفضائية متطابقة 100% مع خريطتك الحقيقية!',
    '🔍 أرصد مطاعم ومولات قريبة.. المس أي بناية واضغط زر الإجراء!',
    '💫 هل ترغب بتجربة الطيران أم إطلاق الليزر الكهرومغناطيسي؟',
    '🏗️ كل بناية هنا مصممة بهويتها المعمارية العراقية الخاصة!',
    '📡 قنوات الاتصال الآلي JAX ترسل تحياتها إلى كافة مستكشفي العراق!',
    '🚀 الطاقة الحركية في المستوى الأقصى.. لننطلق في جولة جديدة!'
];

/**
 * Multi-Character & JAX Machine-Language WebAudio Synthesizer
 */
class SMIAvatarAudioSynthesizer {
    constructor() {
        this.ctx = null;
    }

    ensureCtx() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) this.ctx = new AudioCtx();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
        return this.ctx;
    }

    playStep(isClimb = false) {
        const ctx = this.ensureCtx();
        if (!ctx) return;
        try {
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(isClimb ? 190 : 105, now);
            osc.frequency.exponentialRampToValueAtTime(isClimb ? 95 : 38, now + 0.055);
            gain.gain.setValueAtTime(0.035, now);
            gain.gain.linearRampToValueAtTime(0.001, now + 0.06);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.065);
        } catch (_) {}
    }

    /**
     * Synthesizes "JAX" Machine-to-Machine communication language (futuristic droid/modem syllables)
     */
    playJaxRobotSpeech() {
        const ctx = this.ensureCtx();
        if (!ctx) return;
        try {
            const now = ctx.currentTime;
            const syllables = 14;
            for (let i = 0; i < syllables; i++) {
                const start = now + i * 0.095;
                const dur = 0.075;
                const carrier = ctx.createOscillator();
                const mod = ctx.createOscillator();
                const modGain = ctx.createGain();
                const gain = ctx.createGain();

                const baseFreqs = [520, 880, 1320, 660, 1580, 740, 1180, 960, 1440, 620];
                const f1 = baseFreqs[(i * 3 + Math.floor(Math.random() * 4)) % baseFreqs.length];
                const f2 = baseFreqs[(i * 7 + 2) % baseFreqs.length];

                carrier.type = i % 2 === 0 ? 'sine' : 'square';
                carrier.frequency.setValueAtTime(f1, start);
                carrier.frequency.exponentialRampToValueAtTime(f2, start + dur);

                mod.type = 'sawtooth';
                mod.frequency.setValueAtTime(45 + (i % 5) * 30, start);
                modGain.gain.setValueAtTime(180, start);

                gain.gain.setValueAtTime(0.001, start);
                gain.gain.linearRampToValueAtTime(0.045, start + 0.012);
                gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

                mod.connect(modGain);
                modGain.connect(carrier.frequency);
                carrier.connect(gain);
                gain.connect(ctx.destination);

                mod.start(start);
                carrier.start(start);
                mod.stop(start + dur + 0.01);
                carrier.stop(start + dur + 0.01);
            }
        } catch (_) {}
    }

    playLaserShot() {
        const ctx = this.ensureCtx();
        if (!ctx) return;
        try {
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(1450, now);
            osc.frequency.exponentialRampToValueAtTime(140, now + 0.18);
            gain.gain.setValueAtTime(0.07, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.2);
        } catch (_) {}
    }

    playCharacterSound(modelId) {
        const ctx = this.ensureCtx();
        if (!ctx) return;
        const now = ctx.currentTime;

        try {
            if (modelId === 'robot') {
                this.playJaxRobotSpeech();
                return;
            }

            if (modelId === 'creature_horse') {
                // Horse Neigh / Whinny (vibrato descending pitch)
                const osc = ctx.createOscillator();
                const lfo = ctx.createOscillator();
                const lfoGain = ctx.createGain();
                const gain = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(620, now);
                osc.frequency.linearRampToValueAtTime(920, now + 0.15);
                osc.frequency.exponentialRampToValueAtTime(340, now + 0.75);

                lfo.frequency.setValueAtTime(16, now);
                lfoGain.gain.setValueAtTime(55, now);
                lfo.connect(lfoGain);
                lfoGain.connect(osc.frequency);

                gain.gain.setValueAtTime(0.06, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.78);
                osc.connect(gain);
                gain.connect(ctx.destination);
                lfo.start(now);
                osc.start(now);
                lfo.stop(now + 0.8);
                osc.stop(now + 0.8);
                return;
            }

            if (modelId === 'fox') {
                // Fox double yip/bark
                [0, 0.18].forEach((offset) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(480, now + offset);
                    osc.frequency.exponentialRampToValueAtTime(1120, now + offset + 0.06);
                    osc.frequency.exponentialRampToValueAtTime(320, now + offset + 0.14);
                    gain.gain.setValueAtTime(0.07, now + offset);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.15);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now + offset);
                    osc.stop(now + offset + 0.16);
                });
                return;
            }

            if (modelId === 'flying_bird') {
                // Bird chirp call
                [0, 0.16].forEach((offset, idx) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(idx === 0 ? 1350 : 1650, now + offset);
                    osc.frequency.exponentialRampToValueAtTime(920, now + offset + 0.13);
                    gain.gain.setValueAtTime(0.06, now + offset);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.14);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now + offset);
                    osc.stop(now + offset + 0.15);
                });
                return;
            }

            // Default Car / Bike / Jet Horn
            [392, 493.88].forEach((freq) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(freq, now);
                gain.gain.setValueAtTime(0.065, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.32);
            });
        } catch (_) {}
    }
}

/**
 * Shared Procedural Facade & Signboard Texture Pool (Fast Cached Materials)
 */
class SMIMatsAndSignsPool {
    constructor(renderer) {
        this.renderer = renderer;
        this.facadeCache = new Map();
        this.signCache = new Map();
        this.roofMat = new THREE.MeshStandardMaterial({
            color: 0xe2e8f0,
            roughness: 0.75,
            metalness: 0.08
        });
    }

    getFacadeMaterial(styleKey = 'iraqi_sand', isNight = false) {
        const key = `${styleKey}_${isNight ? 'night' : 'day'}`;
        if (this.facadeCache.has(key)) return this.facadeCache.get(key);

        const palettes = {
            iraqi_sand: { wall: '#f5ebd6', trim: '#d4be98', winDay: '#1e3a5f', winLit: '#fef08a' },
            university_blue: { wall: '#eff6ff', trim: '#1d4ed8', winDay: '#1e40af', winLit: '#93c5fd' },
            school_warm: { wall: '#fef3c7', trim: '#f59e0b', winDay: '#0369a1', winLit: '#fde047' },
            mosque_sacred: { wall: '#f8fafc', trim: '#0d9488', winDay: '#115e59', winLit: '#99f6e4' },
            mall_glass: { wall: '#0f172a', trim: '#38bdf8', winDay: '#0284c7', winLit: '#7dd3fc' },
            market_souq: { wall: '#edd5b8', trim: '#b45309', winDay: '#451a03', winLit: '#fed7aa' },
            hospital_clean: { wall: '#ffffff', trim: '#06b6d4', winDay: '#0891b2', winLit: '#cffafe' },
            restaurant_warm: { wall: '#fff7ed', trim: '#ea580c', winDay: '#7c2d12', winLit: '#fdba74' }
        };
        const pal = palettes[styleKey] || palettes.iraqi_sand;

        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = pal.wall;
        ctx.fillRect(0, 0, 128, 128);

        for (let r = 0; r < 4; r++) {
            const y = r * 32;
            ctx.fillStyle = pal.trim;
            ctx.fillRect(0, y, 128, 3);

            for (let c = 0; c < 4; c++) {
                const x = 5 + c * 31;
                const wy = y + 7;
                const ww = 21;
                const wh = 19;

                ctx.fillStyle = pal.trim;
                ctx.fillRect(x - 1, wy - 1, ww + 2, wh + 2);

                const isLit = isNight && ((r * 5 + c * 3) % 3 !== 0);
                ctx.fillStyle = isLit ? pal.winLit : pal.winDay;
                ctx.fillRect(x, wy, ww, wh);
            }
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.colorSpace = THREE.SRGBColorSpace;

        const mat = new THREE.MeshStandardMaterial({
            map: tex,
            roughness: styleKey === 'mall_glass' ? 0.22 : 0.62,
            metalness: styleKey === 'mall_glass' ? 0.55 : 0.1,
            emissive: isNight ? new THREE.Color(0xfef08a) : new THREE.Color(0x000000),
            emissiveMap: isNight ? tex : null,
            emissiveIntensity: isNight ? 0.35 : 0.0
        });

        this.facadeCache.set(key, mat);
        return mat;
    }

    getSignMaterial(nameAr, categoryLabel = '', seed = 0) {
        const key = `${nameAr}|${categoryLabel}`;
        if (this.signCache.has(key)) return this.signCache.get(key);

        const palettes = [
            { bg: '#0f172a', border: '#f59e0b', text: '#ffffff', sub: '#fcd34d' },
            { bg: '#064e3b', border: '#10b981', text: '#ffffff', sub: '#6ee7b7' },
            { bg: '#1e3a8a', border: '#38bdf8', text: '#f0f9ff', sub: '#93c5fd' },
            { bg: '#7c2d12', border: '#fb923c', text: '#fff7ed', sub: '#fed7aa' }
        ];
        const pal = palettes[Math.abs(seed) % palettes.length];

        const canvas = document.createElement('canvas');
        canvas.width = 384;
        canvas.height = 112;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = pal.bg;
        ctx.fillRect(0, 0, 384, 112);

        ctx.strokeStyle = pal.border;
        ctx.lineWidth = 5;
        ctx.strokeRect(4, 4, 376, 104);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.direction = 'rtl';

        if (categoryLabel) {
            ctx.fillStyle = pal.sub;
            ctx.font = 'bold 19px "Cairo", "Segoe UI", Tahoma, sans-serif';
            ctx.fillText(categoryLabel, 192, 30);
        }

        ctx.fillStyle = pal.text;
        ctx.font = '900 26px "Cairo", "Segoe UI", Tahoma, sans-serif';
        const shortName = String(nameAr || 'معلم عراقي').slice(0, 28);
        ctx.fillText(shortName, 192, categoryLabel ? 72 : 56);

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;

        const mat = new THREE.MeshStandardMaterial({
            map: tex,
            roughness: 0.35,
            metalness: 0.15,
            emissive: new THREE.Color(pal.border),
            emissiveIntensity: 0.14
        });

        this.signCache.set(key, mat);
        return mat;
    }
}

/**
 * High-Speed Real Map Tile Ground Streamer (5x5 Grid around Player)
 */
class RealMapTileGroundManager {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.group.position.y = 0.01;
        this.scene.add(this.group);
        this.loadedTiles = new Map();
        this.texLoader = new THREE.TextureLoader();
        this.texLoader.crossOrigin = 'anonymous';
        this.tileZoom = 17;
    }

    clear() {
        for (const mesh of this.loadedTiles.values()) {
            this.group.remove(mesh);
            if (mesh.geometry) mesh.geometry.dispose();
        }
        this.loadedTiles.clear();
    }

    updateTilesAround(centerLng, centerLat, projector, layerStyle = 'osm') {
        const centerTile = lngLatToTileXY(centerLng, centerLat, this.tileZoom);
        const radius = 2; // 5x5 fast tile grid

        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const tx = centerTile.x + dx;
                const ty = centerTile.y + dy;
                const key = `${this.tileZoom}/${tx}/${ty}_${layerStyle}`;
                if (this.loadedTiles.has(key)) continue;

                const bounds = tileXYToBoundsLngLat(tx, ty, this.tileZoom);
                const [westX, northZ] = projector.lngLatToXZ(bounds.west, bounds.north);
                const [eastX, southZ] = projector.lngLatToXZ(bounds.east, bounds.south);

                const width = Math.abs(eastX - westX);
                const depth = Math.abs(southZ - northZ);
                const cx = (westX + eastX) * 0.5;
                const cz = (northZ + southZ) * 0.5;

                const geo = new THREE.PlaneGeometry(width, depth);
                geo.rotateX(-Math.PI / 2);

                const mat = new THREE.MeshStandardMaterial({
                    color: 0xe2e8f0,
                    roughness: 0.9,
                    metalness: 0.02
                });

                const mesh = new THREE.Mesh(geo, mat);
                mesh.position.set(cx, 0, cz);
                mesh.receiveShadow = true;
                this.group.add(mesh);
                this.loadedTiles.set(key, mesh);

                const sub = ['a', 'b', 'c'][Math.abs(tx + ty) % 3];
                const tileUrl = layerStyle === 'satellite'
                    ? `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${this.tileZoom}/${ty}/${tx}`
                    : (layerStyle === 'hot'
                        ? `https://${sub}.tile.openstreetmap.fr/hot/${this.tileZoom}/${tx}/${ty}.png`
                        : `https://${sub}.tile.openstreetmap.org/${this.tileZoom}/${tx}/${ty}.png`);

                this.texLoader.load(
                    tileUrl,
                    (tex) => {
                        tex.colorSpace = THREE.SRGBColorSpace;
                        mat.map = tex;
                        mat.color.setHex(0xffffff);
                        mat.needsUpdate = true;
                    },
                    undefined,
                    () => {}
                );
            }
        }
    }
}

/**
 * Main SMI Real-Map 3D Live Roaming & Physics Engine
 */
export class CityRT3DIraqEngine {
    constructor(options = {}) {
        this.onSelectPlace = options.onSelectPlace || null;
        this.onRequestTaxi = options.onRequestTaxi || null;
        this.onOpenCommerce = options.onOpenCommerce || null;
        this.getMapEngine = options.getMapEngine || (() => window.OpenMapIQ?.mapEngine);
        this.onAvatarChanged = options.onAvatarChanged || null;
        this.onExit3D = options.onExit3D || null;

        this.isActive = false;
        this.originLng = 44.3661;
        this.originLat = 33.3152;
        this.originName = 'بغداد';
        this.projector = createIraqGeoProjector(this.originLng, this.originLat);

        this.container = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.clock = new THREE.Clock();
        this.animFrameId = null;

        this.matsAndSigns = null;
        this.tileGround = null;
        this.buildingsGroup = null;
        this.roadsAndParksGroup = null;
        this.trafficGroup = null;
        this.projectilesGroup = null;
        this.weatherGroup = null;

        // Physics & Solid Colliders
        this.buildingColliders = []; // { minX, maxX, minZ, maxZ, cx, cz, height, place }
        this.cylinderColliders = []; // { x, z, r, height, place }
        this.activeTouchedPlace = null;
        this.standingOnRoofHeight = 0;
        this.climbStepTimer = 0;

        // User 3D Avatar Roaming State
        this.activeModelId = 'flying_bird';
        this.avatarAnchor = null;
        this.avatarBundle = null;
        this.avatarRing = null;
        this.robotLaserGroup = null;

        this.cameraMode = 'roam'; // 'roam' | 'first' | 'orbit'
        this.playerPos = new THREE.Vector3(0, 0, 0);
        this.playerHeading = 0;
        this.playerSpeed = 0;
        this.verticalVelocity = 0;
        this.flightAltitude = 0;
        this.targetAltitude = 0;
        this.freeFlightEnabled = false;

        this.keys = {};
        this.virtualControls = { forward: 0, turn: 0, up: 0 };

        // Projectiles & Moving Objects
        this.projectiles = [];
        this.movingAgents = [];
        this.animatedParkProps = [];
        this.interactiveMeshes = [];
        this.buildingLabels = [];
        this.labelsOverlay = null;

        // Robot JAX Speech Timer (every 15 - 30 seconds)
        this.nextRobotSpeechTime = 8;
        this.robotBubbleHideTime = 0;

        // Roaming Auto-Navigation State
        this.autoNavState = {
            active: false,
            paused: false,
            targetPlace: null,
            targetXZ: new THREE.Vector2(0, 0),
            lineMesh: null
        };

        this.timeOfDay = 16.5;
        this.weatherMode = 'clear';
        this.sketchMode = false;
        this.audio = new SMIAvatarAudioSynthesizer();
        this.raycaster = new THREE.Raycaster();
        this.pointer = new THREE.Vector2();
        this.stepTimer = 0;
        this.lastMapSyncTime = 0;
        this.lastStreamingCheckPos = new THREE.Vector2(0, 0);
        this.buildGenerationId = 0;
    }

    async openAtLocation(lng, lat, locationTitle = '') {
        // Ensure Place Info Hub is strictly hidden when entering or moving in Live Roaming
        document.getElementById('socialmapPlaceHubSheet')?.classList.add('hidden');

        const mapEngine = this.getMapEngine();
        if (mapEngine) {
            const center = mapEngine.userLocationLatLng || mapEngine.map.getCenter();
            if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
                lng = center.lng;
                lat = center.lat;
            }
            if (mapEngine.active3DModelId) {
                this.activeModelId = mapEngine.active3DModelId;
            }
        }

        this.originLng = Number.isFinite(lng) ? lng : 44.3661;
        this.originLat = Number.isFinite(lat) ? lat : 33.3152;
        this.originName = locationTitle || this.resolveNearestDistrictName(this.originLng, this.originLat);
        this.projector = createIraqGeoProjector(this.originLng, this.originLat);

        const modalEl = document.getElementById('cityrt3DModal');
        if (modalEl) {
            modalEl.classList.remove('hidden');
            modalEl.setAttribute('aria-hidden', 'false');
        }

        const titleEl = document.getElementById('cityrtLocationTitle');
        if (titleEl) {
            titleEl.textContent = this.originName;
        }

        if (!this.renderer) {
            this.initThreeScene();
            this.bindEvents();
            this.buildAvatarSelectorStrip();
            this.buildSplitScreenTouchAndActionControls();
        }

        this.isActive = true;
        this.playerPos.set(0, 0, 0);
        this.playerHeading = 0;
        this.playerSpeed = 0;
        this.verticalVelocity = 0;
        this.standingOnRoofHeight = 0;
        this.activeTouchedPlace = null;
        this.updateActionTriggerUI(null);
        this.stopRoamingAutoNavigation();

        this.onResize();
        if (!this.animFrameId) {
            this.clock.start();
            this.animate();
        }

        this.loadUser3DAvatar(this.activeModelId);
        this.rebuildRealMap3DCity();
    }

    close() {
        this.isActive = false;
        if (this.animFrameId) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
        }
        const modalEl = document.getElementById('cityrt3DModal');
        if (modalEl) {
            modalEl.classList.add('hidden');
            modalEl.setAttribute('aria-hidden', 'true');
        }
        document.getElementById('socialmapPlaceHubSheet')?.classList.add('hidden');
        document.getElementById('robotSpeechBubble')?.classList.add('hidden');

        const mapEngine = this.getMapEngine();
        if (mapEngine && mapEngine.map) {
            const [finalLng, finalLat] = this.projector.xzToLngLat(this.playerPos.x, this.playerPos.z);
            mapEngine.updateUserLocation(finalLat, finalLng, 15, (-this.playerHeading * 180) / Math.PI, false, 0);
            mapEngine.map.setView([finalLat, finalLng], Math.max(16, mapEngine.map.getZoom()));
        }

        if (typeof this.onExit3D === 'function') {
            this.onExit3D();
        }
    }

    resolveNearestDistrictName(lng, lat) {
        let best = 'بغداد';
        let minD = Infinity;
        for (const p of IRAQ_DETAILED_PLACES) {
            const d = Math.hypot((p.lng - lng) * 92, (p.lat - lat) * 111);
            if (d < minD) {
                minD = d;
                best = `${p.gov || 'العراق'} — ${p.name}`;
            }
        }
        return best;
    }

    initThreeScene() {
        this.container = document.getElementById('cityrtCanvasContainer');
        if (!this.container) return;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xdbeafe);
        this.scene.fog = new THREE.FogExp2(0xdbeafe, 0.00085);

        this.camera = new THREE.PerspectiveCamera(
            54,
            Math.max(1, this.container.clientWidth) / Math.max(1, this.container.clientHeight),
            0.5,
            2200
        );
        this.camera.position.set(0, 32, 55);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        this.renderer.setSize(this.container.clientWidth || window.innerWidth, this.container.clientHeight || window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.innerHTML = '';
        this.container.appendChild(this.renderer.domElement);

        this.labelsOverlay = document.createElement('div');
        this.labelsOverlay.className = 'cityrt-labels-layer2';
        this.container.appendChild(this.labelsOverlay);

        this.sketchOverlay = document.createElement('div');
        this.sketchOverlay.className = 'cityrt-sketch-overlay hidden';
        this.container.appendChild(this.sketchOverlay);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.08;
        this.controls.maxPolarAngle = Math.PI * 0.485;
        this.controls.minDistance = 8;
        this.controls.maxDistance = 550;
        this.controls.enabled = false;

        this.ambientLight = new THREE.HemisphereLight(0xfffbeb, 0x334155, 1.15);
        this.scene.add(this.ambientLight);

        this.sunLight = new THREE.DirectionalLight(0xfffbeb, 1.65);
        this.sunLight.position.set(140, 220, 120);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 1024;
        this.sunLight.shadow.mapSize.height = 1024;
        this.sunLight.shadow.camera.near = 10;
        this.sunLight.shadow.camera.far = 600;
        const d = 190;
        this.sunLight.shadow.camera.left = -d;
        this.sunLight.shadow.camera.right = d;
        this.sunLight.shadow.camera.top = d;
        this.sunLight.shadow.camera.bottom = -d;
        this.scene.add(this.sunLight);

        const baseGeo = new THREE.PlaneGeometry(3600, 3600);
        baseGeo.rotateX(-Math.PI / 2);
        const baseMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0 });
        const baseMesh = new THREE.Mesh(baseGeo, baseMat);
        baseMesh.position.y = -0.12;
        this.scene.add(baseMesh);

        this.matsAndSigns = new SMIMatsAndSignsPool(this.renderer);
        this.tileGround = new RealMapTileGroundManager(this.scene);

        this.buildingsGroup = new THREE.Group();
        this.roadsAndParksGroup = new THREE.Group();
        this.trafficGroup = new THREE.Group();
        this.projectilesGroup = new THREE.Group();
        this.weatherGroup = new THREE.Group();
        this.scene.add(this.buildingsGroup);
        this.scene.add(this.roadsAndParksGroup);
        this.scene.add(this.trafficGroup);
        this.scene.add(this.projectilesGroup);
        this.scene.add(this.weatherGroup);

        // User 3D Avatar Anchor
        this.avatarAnchor = new THREE.Group();
        this.scene.add(this.avatarAnchor);

        const ringGeo = new THREE.RingGeometry(1.9, 2.45, 32);
        ringGeo.rotateX(-Math.PI / 2);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0x0ea5e9,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.85
        });
        this.avatarRing = new THREE.Mesh(ringGeo, ringMat);
        this.avatarRing.position.y = 0.08;
        this.avatarAnchor.add(this.avatarRing);

        // Robot Eye Laser Group (Visible only when Robot is active)
        this.buildRobotEyeLaserBeams();

        this.buildWeatherParticles();
        this.applyTimeOfDay(this.timeOfDay);
    }

    /**
     * Builds the animated Twin Laser Beams emitted from the Robot's eyes
     */
    buildRobotEyeLaserBeams() {
        this.robotLaserGroup = new THREE.Group();
        this.robotLaserGroup.position.set(0, 3.6, -0.4);

        const beamGeo = new THREE.CylinderGeometry(0.04, 0.14, 26, 8);
        beamGeo.translate(0, -13, 0);
        beamGeo.rotateX(Math.PI / 2);

        const beamMat = new THREE.MeshBasicMaterial({
            color: 0xef4444,
            transparent: true,
            opacity: 0.78
        });

        const leftBeam = new THREE.Mesh(beamGeo, beamMat);
        leftBeam.position.set(-0.28, 0, 0);
        const rightBeam = new THREE.Mesh(beamGeo, beamMat);
        rightBeam.position.set(0.28, 0, 0);

        const hitDot = new THREE.Mesh(
            new THREE.SphereGeometry(0.45, 10, 10),
            new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
        );
        hitDot.position.set(0, 0, -26);

        this.robotLaserGroup.add(leftBeam, rightBeam, hitDot);
        this.robotLaserGroup.visible = false;
        this.avatarAnchor.add(this.robotLaserGroup);
    }

    async loadUser3DAvatar(modelId) {
        this.activeModelId = modelId || 'flying_bird';

        document.querySelectorAll('[data-roam-avatar]').forEach((btn) => {
            btn.classList.toggle('active', btn.getAttribute('data-roam-avatar') === this.activeModelId);
        });

        const mapEngine = this.getMapEngine();
        if (mapEngine) {
            mapEngine.setUser3DModel(this.activeModelId);
        }

        if (this.avatarBundle && this.avatarBundle.wrapper) {
            this.avatarAnchor.remove(this.avatarBundle.wrapper);
        }

        try {
            const bundle = await threeEngine.loadModelAsset(this.activeModelId);
            this.avatarBundle = bundle;
            bundle.wrapper.scale.multiplyScalar(2.35);
            bundle.wrapper.position.y = 0;
            this.avatarAnchor.add(bundle.wrapper);

            const isFlyer = this.isFlyingAvatar(this.activeModelId);
            this.freeFlightEnabled = isFlyer;
            this.targetAltitude = isFlyer ? 18 : 0;
            this.flightAltitude = this.targetAltitude;

            if (this.robotLaserGroup) {
                this.robotLaserGroup.visible = (this.activeModelId === 'robot');
            }

            if (this.activeModelId === 'robot') {
                this.triggerRobotJaxSpeechBubble();
            } else {
                document.getElementById('robotSpeechBubble')?.classList.add('hidden');
            }

            threeEngine.applyCharacterMotionState(bundle, false, 0);
        } catch (err) {
            console.warn('Avatar load error:', err);
        }
    }

    isFlyingAvatar(modelId) {
        return modelId === 'flying_bird' || modelId === 'spacecraft';
    }

    isVehicleAvatar(modelId) {
        return modelId === 'car_ferrari' || modelId === 'bike' || modelId === 'creature_horse';
    }

    isClimberAvatar(modelId) {
        return modelId === 'human' || modelId === 'soldier';
    }

    triggerRobotJaxSpeechBubble() {
        const bubble = document.getElementById('robotSpeechBubble');
        const textEl = document.getElementById('robotSpeechText');
        if (!bubble || !textEl) return;

        const sentence = ROBOT_JAX_ARABIC_SENTENCES[Math.floor(Math.random() * ROBOT_JAX_ARABIC_SENTENCES.length)];
        textEl.textContent = sentence;
        bubble.classList.remove('hidden');

        this.audio.playJaxRobotSpeech();
        const elapsed = this.clock ? this.clock.getElapsedTime() : 0;
        this.robotBubbleHideTime = elapsed + 6.5;
        this.nextRobotSpeechTime = elapsed + 15 + Math.random() * 15;
    }

    buildAvatarSelectorStrip() {
        const host = document.getElementById('cityrtAvatarStrip');
        if (!host) return;

        host.innerHTML = AVAILABLE_3D_MODELS.map((m) => `
            <button type="button" class="cityrt-avatar-chip ${m.id === this.activeModelId ? 'active' : ''}" data-roam-avatar="${m.id}" title="${m.name}">
                <span class="chip-icon">${m.icon}</span>
                <span class="chip-name">${m.name}</span>
            </button>
        `).join('');

        host.querySelectorAll('[data-roam-avatar]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-roam-avatar');
                this.loadUser3DAvatar(id);
                if (typeof this.onAvatarChanged === 'function') {
                    this.onAvatarChanged(id);
                }
            });
        });
    }

    /**
     * Builds the Split-Screen Touch & Action HUD for Mobile, Tablet & Desktop (Landscape & Portrait):
     * - Left Half: Ultra-transparent virtual movement gear (`ترس تحرك شفاف جداً`)
     * - Right Cluster: Action Trigger (`🏢/🔓`), Fire (`🔥`), Horn/Voice (`📯`), Up/Jump (`⬆️`), Down (`⬇️`)
     */
    buildSplitScreenTouchAndActionControls() {
        if (!this.container) return;

        // 1. Left Half Touch Zone with Ultra-Transparent Movement Gear
        const leftZone = document.createElement('div');
        leftZone.className = 'roam-left-touch-zone';
        leftZone.innerHTML = `
            <div id="roamTransparentGear" class="roam-transparent-gear">
                <div class="gear-outer-ring">
                    <div id="roamGearKnob" class="gear-inner-knob">⚙️</div>
                </div>
            </div>
        `;
        this.container.appendChild(leftZone);

        const gearEl = leftZone.querySelector('#roamTransparentGear');
        const knobEl = leftZone.querySelector('#roamGearKnob');
        let touchOrigin = null;

        const updateGearVector = (clientX, clientY) => {
            if (!touchOrigin) return;
            const dx = clientX - touchOrigin.x;
            const dy = clientY - touchOrigin.y;
            const maxR = 48;
            const dist = Math.min(maxR, Math.hypot(dx, dy));
            const angle = Math.atan2(dy, dx);
            const kx = Math.cos(angle) * dist;
            const ky = Math.sin(angle) * dist;

            if (knobEl) {
                knobEl.style.transform = `translate(${kx.toFixed(1)}px, ${ky.toFixed(1)}px)`;
            }

            // Forward is negative Y on screen, Turn left is negative X
            this.virtualControls.forward = Math.abs(dy) > 6 ? THREE.MathUtils.clamp(-dy / maxR, -1, 1) : 0;
            this.virtualControls.turn = Math.abs(dx) > 6 ? THREE.MathUtils.clamp(-dx / maxR, -1, 1) : 0;
        };

        leftZone.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            leftZone.setPointerCapture(e.pointerId);
            const rect = gearEl.getBoundingClientRect();
            touchOrigin = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
            gearEl.classList.add('active');
            updateGearVector(e.clientX, e.clientY);
        });

        leftZone.addEventListener('pointermove', (e) => {
            if (!touchOrigin) return;
            updateGearVector(e.clientX, e.clientY);
        });

        const endGearTouch = () => {
            touchOrigin = null;
            gearEl.classList.remove('active');
            if (knobEl) knobEl.style.transform = 'translate(0px, 0px)';
            this.virtualControls.forward = 0;
            this.virtualControls.turn = 0;
        };
        leftZone.addEventListener('pointerup', endGearTouch);
        leftZone.addEventListener('pointercancel', endGearTouch);

        // 2. Right Action Buttons Cluster (Emoji-Only: Action Trigger, Fire, Horn/Voice, Up/Jump, Down)
        const rightCluster = document.createElement('div');
        rightCluster.className = 'roam-right-action-cluster';
        rightCluster.innerHTML = `
            <button type="button" id="roamActionTriggerBtn" class="roam-emoji-action-btn action-trigger-btn disabled" title="ضغط الإجراء — يُفعّل عند ملامسة بناية أو معلم لعرض المعلومات والخدمات">
                <span id="roamActionTriggerEmoji">🔒</span>
            </button>
            <button type="button" id="roamFireWeaponBtn" class="roam-emoji-action-btn fire-btn" title="إطلاق الليزر / النار (F)">🔥</button>
            <button type="button" id="roamVoiceHornBtn" class="roam-emoji-action-btn horn-btn" title="إطلاق الهورن / صوت الشخصية (H)">📯</button>
            <button type="button" id="roamUpJumpBtn" class="roam-emoji-action-btn up-btn" title="قفز / صعود وتحليق (Space)">⬆️</button>
            <button type="button" id="roamDownLandBtn" class="roam-emoji-action-btn down-btn" title="هبوط / نزول (C)">⬇️</button>
        `;
        this.container.appendChild(rightCluster);

        // Action Trigger Button (`ضغط الإجراء`) — opens Place Hub ONLY when touching a building/element!
        rightCluster.querySelector('#roamActionTriggerBtn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.activeTouchedPlace && typeof this.onSelectPlace === 'function') {
                this.onSelectPlace(this.activeTouchedPlace);
            }
        });

        // Fire Weapon / Laser Button (`🔥`)
        rightCluster.querySelector('#roamFireWeaponBtn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.fireCharacterProjectile();
        });

        // Horn / Animal / JAX Robot Voice Button (`📯`)
        rightCluster.querySelector('#roamVoiceHornBtn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.activeModelId === 'robot') {
                this.triggerRobotJaxSpeechBubble();
            } else {
                this.audio.playCharacterSound(this.activeModelId);
            }
        });

        // Up / Jump / Fly Up (`⬆️`)
        const upBtn = rightCluster.querySelector('#roamUpJumpBtn');
        upBtn?.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.triggerJumpOrAscend(true);
        });
        upBtn?.addEventListener('pointerup', () => { this.virtualControls.up = 0; });
        upBtn?.addEventListener('pointerleave', () => { this.virtualControls.up = 0; });

        // Down / Descend (`⬇️`)
        const downBtn = rightCluster.querySelector('#roamDownLandBtn');
        downBtn?.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.virtualControls.up = -1;
            if (this.standingOnRoofHeight > 0) {
                this.standingOnRoofHeight = 0;
                this.playerPos.z += 4;
            }
        });
        downBtn?.addEventListener('pointerup', () => { this.virtualControls.up = 0; });
        downBtn?.addEventListener('pointerleave', () => { this.virtualControls.up = 0; });
    }

    triggerJumpOrAscend(holdUp = false) {
        if (this.isFlyingAvatar(this.activeModelId) || this.freeFlightEnabled) {
            this.virtualControls.up = holdUp ? 1 : 0;
            this.targetAltitude = Math.min(140, this.targetAltitude + 10);
        } else {
            // Ground character Jump! If pressed while already in air, enables jetpack/free flight!
            if (this.playerPos.y > this.standingOnRoofHeight + 0.8) {
                this.freeFlightEnabled = true;
                this.targetAltitude = Math.max(14, this.playerPos.y + 10);
                this.flightAltitude = this.playerPos.y;
                this.virtualControls.up = 1;
            } else {
                this.verticalVelocity = 14.5;
                this.audio.playStep(true);
            }
        }
    }

    fireCharacterProjectile() {
        if (!this.projectilesGroup) return;
        this.audio.playLaserShot();

        const isRobot = this.activeModelId === 'robot';
        const color = isRobot ? 0xef4444 : (this.activeModelId === 'spacecraft' ? 0x38bdf8 : 0xf59e0b);

        const boltGeo = new THREE.SphereGeometry(0.42, 10, 10);
        boltGeo.scale(0.8, 0.8, 2.8);
        const boltMat = new THREE.MeshBasicMaterial({ color });
        const bolt = new THREE.Mesh(boltGeo, boltMat);

        const spawnY = this.playerPos.y + (isRobot ? 3.4 : 2.1);
        bolt.position.set(
            this.playerPos.x - Math.sin(this.playerHeading) * 2.5,
            spawnY,
            this.playerPos.z - Math.cos(this.playerHeading) * 2.5
        );
        bolt.rotation.y = this.playerHeading;

        this.projectilesGroup.add(bolt);
        this.projectiles.push({
            mesh: bolt,
            vx: -Math.sin(this.playerHeading) * 92,
            vz: -Math.cos(this.playerHeading) * 92,
            life: 2.2
        });
    }

    updateActionTriggerUI(touchedPlace, isClimbing = false) {
        const btn = document.getElementById('roamActionTriggerBtn');
        const emojiEl = document.getElementById('roamActionTriggerEmoji');
        const statusPill = document.getElementById('roamTouchStatusPill');
        const statusText = document.getElementById('roamTouchStatusText');

        if (touchedPlace) {
            btn?.classList.remove('disabled');
            btn?.classList.add('active');
            if (emojiEl) emojiEl.textContent = '🏢';
            if (statusPill && statusText) {
                statusPill.classList.remove('hidden');
                statusText.textContent = isClimbing
                    ? `🧗 جاري تسلق "${touchedPlace.name}" درجة درجة... اضغط 🏢 للمعلومات`
                    : `🏢 لامست "${touchedPlace.name}" — اضغط زر الإجراء 🏢 لعرض المعلومات والخدمات`;
            }
        } else {
            btn?.classList.add('disabled');
            btn?.classList.remove('active');
            if (emojiEl) emojiEl.textContent = '🔒';
            statusPill?.classList.add('hidden');
        }
    }

    /**
     * Starts Auto-Pilot Roaming Navigation toward a searched place on the 3D map
     */
    startRoamingAutoNavigation(place) {
        if (!place || !Number.isFinite(place.lat) || !Number.isFinite(place.lng)) return;

        const [tx, tz] = this.projector.lngLatToXZ(place.lng, place.lat);
        const distMeters = Math.hypot(tx - this.playerPos.x, tz - this.playerPos.z);

        // If destination is more than 1.2 km away, relocate origin near it (160m away) and auto-navigate the final approach!
        if (distMeters > 1200) {
            const approachLat = place.lat - 0.0012;
            const approachLng = place.lng;
            this.openAtLocation(approachLng, approachLat, place.name);
        }

        const [finalX, finalZ] = this.projector.lngLatToXZ(place.lng, place.lat);
        this.autoNavState.active = true;
        this.autoNavState.paused = false;
        this.autoNavState.targetPlace = place;
        this.autoNavState.targetXZ.set(finalX, finalZ);

        // Draw glowing 3D route ribbon
        if (this.autoNavState.lineMesh) {
            this.scene.remove(this.autoNavState.lineMesh);
        }
        const curve = new THREE.LineCurve3(
            new THREE.Vector3(this.playerPos.x, 0.6, this.playerPos.z),
            new THREE.Vector3(finalX, 0.6, finalZ)
        );
        const tubeGeo = new THREE.TubeGeometry(curve, 24, 0.85, 8, false);
        const tubeMat = new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.85 });
        this.autoNavState.lineMesh = new THREE.Mesh(tubeGeo, tubeMat);
        this.scene.add(this.autoNavState.lineMesh);

        const banner = document.getElementById('roamAutoNavBanner');
        const titleEl = document.getElementById('roamAutoNavTitle');
        const toggleBtn = document.getElementById('roamAutoNavToggleBtn');
        if (banner) banner.classList.remove('hidden');
        if (titleEl) titleEl.textContent = `🧭 ملاحة آلية نحو: ${place.name}`;
        if (toggleBtn) toggleBtn.textContent = '⏸️ إيقاف مؤقت';
    }

    togglePauseRoamingAutoNavigation() {
        if (!this.autoNavState.active) return;
        this.autoNavState.paused = !this.autoNavState.paused;
        const toggleBtn = document.getElementById('roamAutoNavToggleBtn');
        if (toggleBtn) {
            toggleBtn.textContent = this.autoNavState.paused ? '▶️ استئناف الملاحة' : '⏸️ إيقاف مؤقت';
        }
        if (this.autoNavState.paused) {
            this.playerSpeed = 0;
        }
    }

    stopRoamingAutoNavigation() {
        this.autoNavState.active = false;
        this.autoNavState.paused = false;
        if (this.autoNavState.lineMesh && this.scene) {
            this.scene.remove(this.autoNavState.lineMesh);
            this.autoNavState.lineMesh = null;
        }
        document.getElementById('roamAutoNavBanner')?.classList.add('hidden');
    }

    /**
     * Rebuilds the 3D Map World:
     * Phase 1 (0ms synchronous): Real Map Tiles + Local Landmarks + Typology Buildings + Interactive Playgrounds
     * Phase 2 (Async background): Live Overpass OSM Footprints enrichment
     */
    rebuildRealMap3DCity() {
        const genId = ++this.buildGenerationId;

        while (this.buildingsGroup.children.length) {
            this.buildingsGroup.remove(this.buildingsGroup.children[0]);
        }
        while (this.roadsAndParksGroup.children.length) {
            this.roadsAndParksGroup.remove(this.roadsAndParksGroup.children[0]);
        }
        while (this.trafficGroup.children.length) {
            this.trafficGroup.remove(this.trafficGroup.children[0]);
        }

        this.buildingColliders = [];
        this.cylinderColliders = [];
        this.interactiveMeshes = [];
        this.buildingLabels = [];
        this.movingAgents = [];
        this.animatedParkProps = [];
        if (this.labelsOverlay) this.labelsOverlay.innerHTML = '';

        // 1. Stream 5x5 Real Map Tiles immediately
        const mapEngine = this.getMapEngine();
        const currentLayerStyle = mapEngine?.options?.defaultLayer || 'osm';
        this.tileGround.clear();
        this.tileGround.updateTilesAround(this.originLng, this.originLat, this.projector, currentLayerStyle);

        // 2. Gather nearby Iraqi POIs
        const combinedPOIs = [...IRAQ_DETAILED_PLACES];
        if (mapEngine && mapEngine.liveFetchedPlaces) {
            for (const lp of mapEngine.liveFetchedPlaces.values()) {
                combinedPOIs.push(lp);
            }
        }

        const localPOIs = combinedPOIs
            .map((p) => {
                const [x, z] = this.projector.lngLatToXZ(p.lng, p.lat);
                return { ...p, x, z, dist: Math.hypot(x, z) };
            })
            .filter((p) => p.dist < 750)
            .sort((a, b) => a.dist - b.dist);

        const isNight = this.timeOfDay < 6 || this.timeOfDay > 18.5;
        const placedCentroids = [];

        // 3. Immediately build signature 3D Typology Buildings for local POIs & surrounding avenues (0ms wait!)
        localPOIs.slice(0, 28).forEach((poi, idx) => {
            if (Math.hypot(poi.x, poi.z) < 14) {
                poi.x += 22;
            }
            const isLarge = /مول|جامعة|مستشفى|مجمع|فندق|مرقد|مسجد|العميد/.test(poi.name);
            const hw = isLarge ? 11.5 : 8.0;
            const hd = isLarge ? 10.0 : 7.0;
            const ringXZ = [
                [poi.x - hw, poi.z - hd],
                [poi.x + hw, poi.z - hd],
                [poi.x + hw, poi.z + hd],
                [poi.x - hw, poi.z + hd]
            ];
            const height = isLarge ? 20 : 13;

            this.extrudeRealFootprintBuilding({
                ringXZ,
                cx: poi.x,
                cz: poi.z,
                height,
                name: poi.name,
                type: poi.type || 'landmark',
                lat: poi.lat,
                lng: poi.lng,
                seed: idx + 100,
                isNight
            });
            placedCentroids.push([poi.x, poi.z]);
        });

        // 4. Build Interactive Community Parks & Playgrounds (Slides, Swings, Seesaw, Fountain, Gazebo)
        const parkSpots = [
            { x: -38, z: -38, name: `حديقة وألعاب ${this.originName.split('—')[0].trim()} الترفيهية` },
            { x: 44, z: -42, name: `منتزه العائلة والألعاب (${this.originName.split('—')[0].trim()})` }
        ];
        parkSpots.forEach((pk, idx) => {
            if (!placedCentroids.some(([px, pz]) => Math.hypot(px - pk.x, pz - pk.z) < 22)) {
                this.buildInteractiveParkAndPlayground(pk.x, pk.z, pk.name, idx);
                placedCentroids.push([pk.x, pk.z]);
            }
        });

        // 5. Populate diverse architectural typology buildings around the avenues immediately
        const typologiesCycle = [
            { type: 'university', title: 'كلية وحرم جامعي' },
            { type: 'mosque', title: 'جامع ومسجد' },
            { type: 'school', title: 'مدرسة نموذجية' },
            { type: 'mall', title: 'مول ومركز تسوق' },
            { type: 'market', title: 'سوق تجاري' },
            { type: 'hospital', title: 'مستشفى ومركز طبي' },
            { type: 'restaurant', title: 'مطعم وكافيه' }
        ];

        let fIdx = 0;
        for (let gx = -160; gx <= 160; gx += 48) {
            for (let gz = -160; gz <= 160; gz += 48) {
                if (Math.abs(gx) < 24 || Math.abs(gz) < 24) continue;
                const cx = gx + ((fIdx % 3) - 1) * 4;
                const cz = gz + (((fIdx * 2) % 3) - 1) * 4;
                if (placedCentroids.some(([px, pz]) => Math.hypot(px - cx, pz - cz) < 25)) continue;

                const typo = typologiesCycle[fIdx % typologiesCycle.length];
                const refPoi = localPOIs[fIdx % Math.max(1, localPOIs.length)];
                const bName = (fIdx < localPOIs.length && refPoi)
                    ? refPoi.name
                    : `${typo.title} (${this.originName.split('—')[0].trim()})`;

                const hw = 8.5 + (fIdx % 3) * 1.5;
                const hd = 7.5 + ((fIdx * 2) % 3) * 1.4;
                const ringXZ = [
                    [cx - hw, cz - hd],
                    [cx + hw, cz - hd],
                    [cx + hw, cz + hd],
                    [cx - hw, cz + hd]
                ];
                const [bLng, bLat] = this.projector.xzToLngLat(cx, cz);

                this.extrudeRealFootprintBuilding({
                    ringXZ,
                    cx,
                    cz,
                    height: 11 + (fIdx % 4) * 3.5,
                    name: bName,
                    type: typo.type,
                    lat: bLat,
                    lng: bLng,
                    seed: 300 + fIdx,
                    isNight
                });
                placedCentroids.push([cx, cz]);
                fIdx++;
            }
        }

        // 6. Spawn moving traffic along avenues immediately
        const defaultSplines = [
            new THREE.CatmullRomCurve3([new THREE.Vector3(-200, 0.12, -10), new THREE.Vector3(200, 0.12, -10)]),
            new THREE.CatmullRomCurve3([new THREE.Vector3(200, 0.12, 10), new THREE.Vector3(-200, 0.12, 10)]),
            new THREE.CatmullRomCurve3([new THREE.Vector3(-10, 0.12, -200), new THREE.Vector3(-10, 0.12, 200)]),
            new THREE.CatmullRomCurve3([new THREE.Vector3(10, 0.12, 200), new THREE.Vector3(10, 0.12, -200)])
        ];
        defaultSplines.forEach((c, idx) => this.decorateRealRoadSpline(c, 'primary', idx));
        this.spawnSplineTraffic(defaultSplines);

        // 7. Asynchronous background enrichment from Overpass OSM footprints (non-blocking)
        this.fetchAndAppendLiveOsmBuildingsAsync(genId, placedCentroids, isNight);
    }

    async fetchAndAppendLiveOsmBuildingsAsync(genId, placedCentroids, isNight) {
        if (!navigator.onLine) return;
        try {
            const delta = 0.0042;
            const bbox = `${(this.originLat - delta).toFixed(5)},${(this.originLng - delta).toFixed(5)},${(this.originLat + delta).toFixed(5)},${(this.originLng + delta).toFixed(5)}`;
            const query = `[out:json][timeout:5];(way["building"](${bbox}););out geom qt 120;`;
            const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
            if (!res.ok || genId !== this.buildGenerationId) return;
            const data = await res.json();
            if (genId !== this.buildGenerationId) return;

            let added = 0;
            for (const el of (data.elements || [])) {
                if (added >= 45) break;
                if (el.type !== 'way' || !Array.isArray(el.geometry) || el.geometry.length < 3) continue;
                const tags = el.tags || {};
                const ringXZ = el.geometry.map((pt) => this.projector.lngLatToXZ(pt.lon, pt.lat));
                let cx = 0, cz = 0;
                for (const [px, pz] of ringXZ) { cx += px; cz += pz; }
                cx /= ringXZ.length;
                cz /= ringXZ.length;

                if (Math.hypot(cx, cz) < 16 || Math.hypot(cx, cz) > 420) continue;
                if (placedCentroids.some(([px, pz]) => Math.hypot(px - cx, pz - cz) < 20)) continue;

                const bName = tags['name:ar'] || tags.name || '';
                const bType = tags.amenity || tags.shop || tags.building || 'building';
                const levels = parseFloat(tags['building:levels']) || 3;
                const height = Math.max(8, Math.min(36, levels * 3.5));
                const [bLng, bLat] = this.projector.xzToLngLat(cx, cz);

                this.extrudeRealFootprintBuilding({
                    ringXZ,
                    cx,
                    cz,
                    height,
                    name: bName,
                    type: bType,
                    lat: bLat,
                    lng: bLng,
                    seed: el.id || added,
                    isNight
                });
                placedCentroids.push([cx, cz]);
                added++;
            }
        } catch (_) {}
    }

    /**
     * Determines the specialized architectural typology for a building
     */
    resolveBuildingTypology(type = '', name = '', seed = 0) {
        const text = `${type} ${name}`.toLowerCase();
        if (/جامعة|كلية|معهد|أكاديمية|university|college/.test(text)) return 'university';
        if (/مسجد|جامع|مرقد|حضرة|مقام|حسينية|mosque|worship/.test(text)) return 'mosque';
        if (/مدرسة|ثانوية|إعدادية|ابتدائية|روضة|العميد|school/.test(text)) return 'school';
        if (/مول|سنتر|بلازا|مجمع تجاري|mall/.test(text)) return 'mall';
        if (/سوق|بازار|شورجة|علاوي|محلات|market|shop/.test(text)) return 'market';
        if (/مستشفى|طبي|عيادة|صيدلية|صحي|hospital|clinic/.test(text)) return 'hospital';
        if (/مطعم|كباب|مسكوف|مندي|كافيه|مقهى|برغر|بيتزا|restaurant|cafe/.test(text)) return 'restaurant';

        const fallbackTypes = ['residential', 'market', 'mall', 'school', 'restaurant', 'university', 'mosque', 'hospital'];
        return fallbackTypes[Math.abs(seed) % fallbackTypes.length];
    }

    /**
     * Extrudes a 3D Building with its Distinct Architectural Typology & Solid Physics Collider
     */
    extrudeRealFootprintBuilding(cfg) {
        const { ringXZ, cx, cz, height, name, type, lat, lng, seed, isNight } = cfg;
        if (!ringXZ || ringXZ.length < 3) return;

        const typology = this.resolveBuildingTypology(type, name, seed);

        // Compute AABB bounds for Physics & Collision
        let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
        const shape = new THREE.Shape();
        ringXZ.forEach(([px, pz], idx) => {
            if (px < minX) minX = px;
            if (px > maxX) maxX = px;
            if (pz < minZ) minZ = pz;
            if (pz > maxZ) maxZ = pz;

            const lx = px - cx;
            const ly = -(pz - cz);
            if (idx === 0) shape.moveTo(lx, ly);
            else shape.lineTo(lx, ly);
        });
        shape.closePath();

        const halfW = Math.max(5, (maxX - minX) * 0.5);
        const halfD = Math.max(5, (maxZ - minZ) * 0.5);

        const extrudeGeo = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false });
        extrudeGeo.rotateX(-Math.PI / 2);

        const uvAttr = extrudeGeo.attributes.uv;
        if (uvAttr) {
            for (let i = 0; i < uvAttr.count; i++) {
                uvAttr.setXY(i, uvAttr.getX(i) * 0.08, uvAttr.getY(i) * 0.08);
            }
            uvAttr.needsUpdate = true;
        }

        const styleMap = {
            university: 'university_blue',
            mosque: 'mosque_sacred',
            school: 'school_warm',
            mall: 'mall_glass',
            market: 'market_souq',
            hospital: 'hospital_clean',
            restaurant: 'restaurant_warm',
            residential: 'iraqi_sand'
        };
        const wallMat = this.matsAndSigns.getFacadeMaterial(styleMap[typology] || 'iraqi_sand', isNight);

        const group = new THREE.Group();
        group.position.set(cx, 0, cz);

        const placePayload = {
            id: `smi_bldg_${seed}`,
            name: name || `${this.getCategoryArabicLabel(typology, '')} (${this.originName.split('—')[0].trim()})`,
            type: typology,
            city: this.originName.split('—')[0].trim(),
            gov: this.originName.split('—')[0].trim(),
            address: this.originName,
            lat,
            lng
        };

        const mesh = new THREE.Mesh(extrudeGeo, [this.matsAndSigns.roofMat, wallMat]);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.place = placePayload;
        this.interactiveMeshes.push(mesh);
        group.add(mesh);

        // Register Solid Building Collider for Physics & Step-by-Step Climbing
        this.buildingColliders.push({
            minX: minX - 0.6,
            maxX: maxX + 0.6,
            minZ: minZ - 0.6,
            maxZ: maxZ + 0.6,
            cx,
            cz,
            height,
            place: placePayload
        });

        // Add Specialized 3D Architectural Typology Features!
        this.attachTypologyArchitecture(group, typology, halfW, halfD, height, seed);

        // Mount 3D Roof Signboard & Crisp Layer 2 Floating Label for named buildings
        if (name) {
            const catLabel = this.getCategoryArabicLabel(typology, name);
            const signMat = this.matsAndSigns.getSignMaterial(name, catLabel, seed);
            const signBoard = new THREE.Mesh(new THREE.BoxGeometry(8.2, 2.3, 0.35), signMat);
            signBoard.position.set(0, height + 2.2, 0);
            signBoard.userData.place = placePayload;
            this.interactiveMeshes.push(signBoard);
            group.add(signBoard);

            this.createLayer2FloatingLabel(placePayload, new THREE.Vector3(cx, height + 5.2, cz), catLabel);
        }

        this.buildingsGroup.add(group);
    }

    /**
     * Attaches distinct 3D architectural structures based on building typology:
     * University, Mosque, School, Mall, Market/Souq, Hospital, Restaurant, Residential
     */
    attachTypologyArchitecture(group, typology, halfW, halfD, height, seed) {
        if (typology === 'mosque') {
            // 1. Ornate Islamic Dome + Crescent + Tall Cylindrical Minaret
            const domeColor = seed % 2 === 0 ? 0xf59e0b : 0x0d9488;
            const domeMat = new THREE.MeshStandardMaterial({ color: domeColor, metalness: 0.6, roughness: 0.22 });
            const drum = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 3.8, 2.2, 16), new THREE.MeshStandardMaterial({ color: 0xfef3c7 }));
            drum.position.y = height + 1.1;
            group.add(drum);

            const dome = new THREE.Mesh(new THREE.SphereGeometry(4.2, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), domeMat);
            dome.position.y = height + 2.0;
            group.add(dome);

            // Golden finial spire
            const finial = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.2, 8), new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.8 }));
            finial.position.y = height + 6.8;
            group.add(finial);

            // Tall Minaret (`مئذنة`)
            const minaretH = height + 12;
            const minaret = new THREE.Mesh(
                new THREE.CylinderGeometry(0.85, 1.15, minaretH, 12),
                new THREE.MeshStandardMaterial({ color: 0xf5ebd6, roughness: 0.5 })
            );
            minaret.position.set(halfW - 1.2, minaretH * 0.5, halfD - 1.2);
            group.add(minaret);

            const balcony = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.35, 0.8, 12), domeMat);
            balcony.position.set(halfW - 1.2, minaretH - 2.6, halfD - 1.2);
            group.add(balcony);

            const minCap = new THREE.Mesh(new THREE.ConeGeometry(0.95, 2.8, 12), domeMat);
            minCap.position.set(halfW - 1.2, minaretH + 1.4, halfD - 1.2);
            group.add(minCap);
            return;
        }

        if (typology === 'university') {
            // 2. University: Classical Entrance Columns + Pediment + Central Knowledge Clock Tower
            const colMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 });
            const accentMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, metalness: 0.3, roughness: 0.3 });

            for (let c = -1.5; c <= 1.5; c += 1) {
                const col = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, height * 0.75, 10), colMat);
                col.position.set(c * 2.4, height * 0.375, halfD + 0.8);
                group.add(col);
            }

            const pediment = new THREE.Mesh(new THREE.ConeGeometry(5.2, 2.6, 4), accentMat);
            pediment.rotation.y = Math.PI / 4;
            pediment.position.set(0, height * 0.78, halfD + 0.8);
            group.add(pediment);

            // Central Academic Clock Tower
            const tower = new THREE.Mesh(new THREE.BoxGeometry(4.2, 8.5, 4.2), colMat);
            tower.position.set(0, height + 4.25, 0);
            group.add(tower);

            const pyramidRoof = new THREE.Mesh(new THREE.ConeGeometry(3.4, 3.2, 4), accentMat);
            pyramidRoof.rotation.y = Math.PI / 4;
            pyramidRoof.position.set(0, height + 10.1, 0);
            group.add(pyramidRoof);
            return;
        }

        if (typology === 'school') {
            // 3. School: Cheerful Entrance Canopy + Courtyard Flagpole with Iraqi Flag
            const canopyMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 });
            const canopy = new THREE.Mesh(new THREE.BoxGeometry(halfW * 1.1, 0.6, 2.8), canopyMat);
            canopy.position.set(0, 3.6, halfD + 1.2);
            group.add(canopy);

            // Flagpole in front of school
            const pole = new THREE.Mesh(
                new THREE.CylinderGeometry(0.09, 0.12, 9.5, 8),
                new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8 })
            );
            pole.position.set(-halfW * 0.5, 4.75, halfD + 2.5);
            group.add(pole);

            const flag = new THREE.Mesh(
                new THREE.BoxGeometry(2.2, 1.3, 0.08),
                new THREE.MeshBasicMaterial({ color: 0xdc2626 })
            );
            flag.position.set(-halfW * 0.5 + 1.1, 8.8, halfD + 2.5);
            group.add(flag);
            return;
        }

        if (typology === 'mall') {
            // 4. Mall: Glowing Neon LED Horizontal Bands + Glass Atrium Skylight + Panoramic Elevator
            const neonMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
            const band1 = new THREE.Mesh(new THREE.BoxGeometry(halfW * 2.04, 0.45, halfD * 2.04), neonMat);
            band1.position.y = height - 0.5;
            group.add(band1);

            const band2 = new THREE.Mesh(new THREE.BoxGeometry(halfW * 2.04, 0.35, halfD * 2.04), new THREE.MeshBasicMaterial({ color: 0xf59e0b }));
            band2.position.y = 4.2;
            group.add(band2);

            const atrium = new THREE.Mesh(
                new THREE.CylinderGeometry(0.1, halfW * 0.75, 3.8, 6),
                new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.7, roughness: 0.15, transparent: true, opacity: 0.82 })
            );
            atrium.position.y = height + 1.9;
            group.add(atrium);
            return;
        }

        if (typology === 'market') {
            // 5. Market / Souq: Colorful Striped Bazaar Canopies along the ground floor
            const colors = [0xd97706, 0x059669, 0xdc2626, 0x0284c7];
            for (let i = -1; i <= 1; i++) {
                const awning = new THREE.Mesh(
                    new THREE.BoxGeometry(halfW * 0.58, 0.45, 2.6),
                    new THREE.MeshStandardMaterial({ color: colors[Math.abs(seed + i) % colors.length], roughness: 0.6 })
                );
                awning.position.set(i * halfW * 0.62, 3.2, halfD + 1.1);
                awning.rotation.x = 0.25;
                group.add(awning);
            }
            return;
        }

        if (typology === 'hospital') {
            // 6. Hospital: Rooftop Helipad (`H`) + Red Crescent Medical Emblem
            const pad = new THREE.Mesh(
                new THREE.CylinderGeometry(3.8, 3.8, 0.25, 20),
                new THREE.MeshBasicMaterial({ color: 0x0284c7 })
            );
            pad.position.y = height + 0.15;
            group.add(pad);

            const redCross = new THREE.Mesh(
                new THREE.TorusGeometry(1.4, 0.35, 10, 20, Math.PI * 1.45),
                new THREE.MeshBasicMaterial({ color: 0xef4444 })
            );
            redCross.position.set(0, height - 2.6, halfD + 0.25);
            redCross.rotation.z = Math.PI * 0.25;
            group.add(redCross);
            return;
        }

        if (typology === 'restaurant') {
            // 7. Restaurant: Outdoor Dining Umbrellas & Tables in front of the facade
            const umbColors = [0xef4444, 0xf59e0b, 0x10b981];
            [-halfW * 0.5, halfW * 0.5].forEach((ux, idx) => {
                const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.6, 6), new THREE.MeshStandardMaterial({ color: 0xffffff }));
                pole.position.set(ux, 1.3, halfD + 2.4);
                group.add(pole);

                const umb = new THREE.Mesh(
                    new THREE.ConeGeometry(1.85, 0.85, 8),
                    new THREE.MeshStandardMaterial({ color: umbColors[(seed + idx) % umbColors.length] })
                );
                umb.position.set(ux, 2.7, halfD + 2.4);
                group.add(umb);
            });
            return;
        }

        // 8. Residential / Heritage: Projecting Baghdadi Wooden Shanasheel Bay
        const shanasheel = new THREE.Mesh(
            new THREE.BoxGeometry(halfW * 1.1, Math.min(4.2, height * 0.4), 1.3),
            new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 })
        );
        shanasheel.position.set(0, height * 0.62, halfD + 0.55);
        group.add(shanasheel);
    }

    /**
     * Builds an Interactive Community Park & Playground (`حديقة وتجمع ترفيهي وألعاب وزحاليق`)
     */
    buildInteractiveParkAndPlayground(cx, cz, parkName, seed) {
        const parkGroup = new THREE.Group();
        parkGroup.position.set(cx, 0, cz);

        const [pLng, pLat] = this.projector.xzToLngLat(cx, cz);
        const parkPlace = {
            id: `smi_park_${seed}`,
            name: parkName,
            type: 'park',
            city: this.originName.split('—')[0].trim(),
            gov: this.originName.split('—')[0].trim(),
            address: `حديقة عامة ومنطقة ألعاب ترفيهية — ${this.originName}`,
            lat: pLat,
            lng: pLng
        };

        // 1. Lush Green Park Lawn & Circular Stone Plaza
        const lawn = new THREE.Mesh(
            new THREE.BoxGeometry(34, 0.22, 34),
            new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.85 })
        );
        lawn.position.y = 0.11;
        lawn.receiveShadow = true;
        lawn.userData.place = parkPlace;
        this.interactiveMeshes.push(lawn);
        parkGroup.add(lawn);

        const plaza = new THREE.Mesh(
            new THREE.CylinderGeometry(8.5, 8.8, 0.28, 24),
            new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.7 })
        );
        plaza.position.y = 0.15;
        parkGroup.add(plaza);

        // 2. Central Animated Water Fountain (`نافورة مياه`)
        const basin = new THREE.Mesh(
            new THREE.CylinderGeometry(3.4, 3.8, 1.1, 18),
            new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.25 })
        );
        basin.position.y = 0.65;
        parkGroup.add(basin);

        const jet = new THREE.Mesh(
            new THREE.ConeGeometry(1.2, 3.6, 12),
            new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.78 })
        );
        jet.position.y = 2.6;
        parkGroup.add(jet);
        this.animatedParkProps.push({ mesh: jet, type: 'fountain' });

        // 3. Colorful Playground Slides (`زحاليق أطفال ملونة`)
        const buildSlide = (sx, sz, chuteColor, rotY) => {
            const slideGrp = new THREE.Group();
            slideGrp.position.set(sx, 0, sz);
            slideGrp.rotation.y = rotY;

            const platform = new THREE.Mesh(
                new THREE.BoxGeometry(2.2, 3.2, 2.2),
                new THREE.MeshStandardMaterial({ color: 0xf59e0b })
            );
            platform.position.y = 1.6;
            slideGrp.add(platform);

            const roof = new THREE.Mesh(
                new THREE.ConeGeometry(2.1, 1.5, 4),
                new THREE.MeshStandardMaterial({ color: 0xef4444 })
            );
            roof.rotation.y = Math.PI / 4;
            roof.position.y = 3.95;
            slideGrp.add(roof);

            const chute = new THREE.Mesh(
                new THREE.BoxGeometry(1.3, 0.25, 5.2),
                new THREE.MeshStandardMaterial({ color: chuteColor, roughness: 0.2, metalness: 0.3 })
            );
            chute.position.set(0, 1.6, 2.8);
            chute.rotation.x = 0.56;
            slideGrp.add(chute);

            parkGroup.add(slideGrp);
            this.cylinderColliders.push({ x: cx + sx, z: cz + sz, r: 2.6, height: 4.2, place: parkPlace });
        };

        buildSlide(-9.5, -8.5, 0xef4444, 0.4);
        buildSlide(9.5, -8.5, 0x38bdf8, -0.4);

        // 4. Playground Swings (`مراجيح`) & Spinning Carousel (`دولاب دوار`)
        const swingBar = new THREE.Mesh(
            new THREE.BoxGeometry(5.6, 0.25, 0.25),
            new THREE.MeshStandardMaterial({ color: 0x8b5cf6 })
        );
        swingBar.position.set(-9.5, 3.6, 8.5);
        parkGroup.add(swingBar);

        const carousel = new THREE.Mesh(
            new THREE.CylinderGeometry(2.6, 2.6, 0.45, 16),
            new THREE.MeshStandardMaterial({ color: 0xec4899, metalness: 0.3, roughness: 0.3 })
        );
        carousel.position.set(9.5, 0.45, 8.5);
        parkGroup.add(carousel);
        this.animatedParkProps.push({ mesh: carousel, type: 'carousel' });
        this.cylinderColliders.push({ x: cx + 9.5, z: cz + 8.5, r: 2.8, height: 2.0, place: parkPlace });

        // 5. Family Gazebo (`مظلة عائلية`)
        const gazeboRoof = new THREE.Mesh(
            new THREE.ConeGeometry(4.2, 2.2, 6),
            new THREE.MeshStandardMaterial({ color: 0xb45309 })
        );
        gazeboRoof.position.set(0, 4.4, -11.5);
        parkGroup.add(gazeboRoof);
        this.cylinderColliders.push({ x: cx, z: cz - 11.5, r: 3.4, height: 4.5, place: parkPlace });

        this.createLayer2FloatingLabel(parkPlace, new THREE.Vector3(cx, 7.5, cz), '🎡 حديقة وألعاب');
        this.roadsAndParksGroup.add(parkGroup);
    }

    decorateRealRoadSpline(curve, highwayType, seed) {
        const length = curve.getLength();
        const steps = Math.min(8, Math.floor(length / 55));
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
        const crownMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.65 });

        for (let s = 1; s < steps; s++) {
            const t = s / steps;
            const pt = curve.getPointAt(t);
            const tan = curve.getTangentAt(t);
            const normX = -tan.z;
            const normZ = tan.x;
            const tx = pt.x + normX * 8.5;
            const tz = pt.z + normZ * 8.5;

            const tree = new THREE.Group();
            tree.position.set(tx, 0, tz);
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.34, 3.6, 7), trunkMat);
            trunk.position.y = 1.8;
            tree.add(trunk);

            const crown = new THREE.Mesh(new THREE.SphereGeometry(1.85, 8, 8), crownMat);
            crown.position.y = 4.2;
            tree.add(crown);
            this.roadsAndParksGroup.add(tree);

            // Register Solid Tree Collider so player never merges into trees
            this.cylinderColliders.push({ x: tx, z: tz, r: 1.35, height: 5.5, place: null });
        }
    }

    spawnSplineTraffic(roadSplines) {
        const carColors = [0xf59e0b, 0xffffff, 0x0284c7, 0xef4444, 0x10b981];
        roadSplines.slice(0, 10).forEach((curve, idx) => {
            const isTaxi = idx % 2 === 0;
            const car = new THREE.Group();
            const bodyMat = new THREE.MeshStandardMaterial({
                color: isTaxi ? 0xf59e0b : carColors[idx % carColors.length],
                metalness: 0.45,
                roughness: 0.3
            });
            const cabinMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });

            const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.8, 4.2), bodyMat);
            chassis.position.y = 0.6;
            car.add(chassis);

            const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.65, 2.1), cabinMat);
            cabin.position.y = 1.25;
            car.add(cabin);

            this.trafficGroup.add(car);
            this.movingAgents.push({
                curve,
                mesh: car,
                t: (idx * 0.21) % 1.0,
                speed: (15 + (idx % 4) * 3) / Math.max(40, curve.getLength())
            });
        });
    }

    getCategoryArabicLabel(typology, name = '') {
        if (typology === 'university') return '🎓 جامعة وصرح علمي';
        if (typology === 'mosque') return '🕌 جامع ومعلم ديني';
        if (typology === 'school') return '🏫 مدرسة ومجمع تعليمي';
        if (typology === 'mall') return '🏬 مول ومركز تسوق';
        if (typology === 'market') return '🛍️ سوق تجاري';
        if (typology === 'hospital') return '🏥 مستشفى ومركز طبي';
        if (typology === 'restaurant') return '🍽️ مطعم وكافيه';
        return '🏢 بناية ومعلم';
    }

    createLayer2FloatingLabel(place, worldPos, catLabel) {
        if (!this.labelsOverlay) return;
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'cityrt-floating-label';
        el.innerHTML = `
            <span class="cityrt-label-badge">${catLabel.split(' ')[0]}</span>
            <span class="cityrt-label-title">${place.name}</span>
        `;
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            if (typeof this.onSelectPlace === 'function') {
                this.onSelectPlace(place);
            }
        });
        this.labelsOverlay.appendChild(el);
        this.buildingLabels.push({ el, worldPos, place });
    }

    buildWeatherParticles() {
        const count = 600;
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 420;
            positions[i * 3 + 1] = Math.random() * 130 + 5;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 420;
        }
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.weatherMat = new THREE.PointsMaterial({
            color: 0x93c5fd,
            size: 1.35,
            transparent: true,
            opacity: 0.0
        });
        this.weatherPoints = new THREE.Points(geo, this.weatherMat);
        this.weatherGroup.add(this.weatherPoints);
    }

    setCameraMode(mode) {
        this.cameraMode = mode;
        document.querySelectorAll('[data-cityrt-nav]').forEach((btn) => {
            btn.classList.toggle('active', btn.getAttribute('data-cityrt-nav') === mode);
        });

        if (mode === 'orbit') {
            this.controls.enabled = true;
            this.controls.target.copy(this.playerPos);
            this.camera.position.set(this.playerPos.x + 42, this.playerPos.y + 58, this.playerPos.z + 75);
            if (this.avatarAnchor) this.avatarAnchor.visible = true;
        } else {
            this.controls.enabled = false;
            if (this.avatarAnchor) this.avatarAnchor.visible = (mode !== 'first');
        }
    }

    toggleCameraPerspective() {
        const next = this.cameraMode === 'roam' ? 'first' : (this.cameraMode === 'first' ? 'orbit' : 'roam');
        this.setCameraMode(next);
    }

    toggleSketchMode(forceState) {
        this.sketchMode = typeof forceState === 'boolean' ? forceState : !this.sketchMode;
        if (this.sketchOverlay) {
            this.sketchOverlay.classList.toggle('hidden', !this.sketchMode);
        }
        if (this.container) {
            this.container.classList.toggle('cityrt-sketch-mode-active', this.sketchMode);
        }
        const btn = document.getElementById('cityrtSketchToggleBtn');
        if (btn) btn.classList.toggle('active', this.sketchMode);
    }

    setWeatherMode(mode) {
        this.weatherMode = mode;
        if (!this.weatherMat) return;
        if (mode === 'clear') {
            this.weatherMat.opacity = 0.0;
        } else if (mode === 'rain') {
            this.weatherMat.color.setHex(0x93c5fd);
            this.weatherMat.size = 1.4;
            this.weatherMat.opacity = 0.78;
        } else if (mode === 'dust') {
            this.weatherMat.color.setHex(0xfbbf24);
            this.weatherMat.size = 2.1;
            this.weatherMat.opacity = 0.65;
        }
    }

    applyTimeOfDay(hour) {
        this.timeOfDay = Math.max(0, Math.min(24, Number(hour) || 16.5));
        const rad = ((this.timeOfDay - 6) / 24) * Math.PI * 2;
        const sunElev = Math.sin(rad);
        const sunAzim = Math.cos(rad);

        if (this.sunLight) {
            this.sunLight.position.set(sunAzim * 220, Math.max(18, sunElev * 220), 100);
            this.sunLight.intensity = Math.max(0.28, Math.min(1.75, (sunElev + 0.25) * 1.4));
        }

        const isNight = sunElev < 0.05;
        const isGolden = sunElev >= 0.05 && sunElev < 0.35;

        if (this.scene) {
            const skyColor = isNight
                ? new THREE.Color(0x090d16)
                : (isGolden ? new THREE.Color(0xfed7aa) : new THREE.Color(0xdbeafe));
            this.scene.background.copy(skyColor);
            if (this.scene.fog) this.scene.fog.color.copy(skyColor);
        }

        const timeLabel = document.getElementById('cityrtTimeValueLabel');
        if (timeLabel) {
            const hh = String(Math.floor(this.timeOfDay)).padStart(2, '0');
            const mm = String(Math.floor((this.timeOfDay % 1) * 60)).padStart(2, '0');
            timeLabel.textContent = `${hh}:${mm}`;
        }
    }

    bindEvents() {
        window.addEventListener('resize', () => this.onResize());

        window.addEventListener('keydown', (e) => {
            if (!this.isActive) return;
            const code = e.code;
            this.keys[code] = true;

            if (code === 'Space') {
                this.triggerJumpOrAscend(true);
            } else if (code === 'KeyF') {
                this.fireCharacterProjectile();
            } else if (code === 'KeyE' && this.activeTouchedPlace && typeof this.onSelectPlace === 'function') {
                this.onSelectPlace(this.activeTouchedPlace);
            } else if (code === 'KeyV') {
                e.preventDefault();
                this.toggleCameraPerspective();
            } else if (code === 'KeyH') {
                if (this.activeModelId === 'robot') {
                    this.triggerRobotJaxSpeechBubble();
                } else {
                    this.audio.playCharacterSound(this.activeModelId);
                }
            } else if (code === 'Escape') {
                this.close();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            if (e.code === 'Space') {
                this.virtualControls.up = 0;
            }
        });
    }

    onResize() {
        if (!this.isActive || !this.container || !this.renderer || !this.camera) return;
        const w = Math.max(300, this.container.clientWidth || window.innerWidth);
        const h = Math.max(240, this.container.clientHeight || window.innerHeight);
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
    }

    /**
     * Updates Physics, Solid Collisions, Building Step-by-Step Climbing, Auto-Nav & Character Laws
     */
    updateAvatarRoamPhysics(dt, elapsed) {
        if (this.cameraMode === 'orbit') {
            this.controls.update();
            return;
        }

        let forward = (this.keys['KeyW'] || this.keys['ArrowUp']) ? 1 : ((this.keys['KeyS'] || this.keys['ArrowDown']) ? -1 : 0);
        let turn = (this.keys['KeyA'] || this.keys['ArrowLeft']) ? 1 : ((this.keys['KeyD'] || this.keys['ArrowRight']) ? -1 : 0);
        const keyVert = (this.keys['Space'] || this.keys['KeyQ']) ? 1 : ((this.keys['KeyC'] || this.keys['KeyZ']) ? -1 : 0);
        const boost = (this.keys['ShiftLeft'] || this.keys['ShiftRight']) ? 1.75 : 1.0;

        if (!forward) forward = this.virtualControls.forward;
        if (!turn) turn = this.virtualControls.turn;
        const vert = keyVert || this.virtualControls.up;

        // If user presses manual movement keys while Auto-Nav is running, pause Auto-Nav
        if (this.autoNavState.active && !this.autoNavState.paused && (Math.abs(forward) > 0.25 || Math.abs(turn) > 0.25)) {
            this.togglePauseRoamingAutoNavigation();
        }

        // Handle Auto-Navigation steering & movement
        if (this.autoNavState.active && !this.autoNavState.paused) {
            const dx = this.autoNavState.targetXZ.x - this.playerPos.x;
            const dz = this.autoNavState.targetXZ.y - this.playerPos.z;
            const remDist = Math.hypot(dx, dz);

            const distLabel = document.getElementById('roamAutoNavDist');
            if (distLabel) {
                distLabel.textContent = `المسافة المتبقية: ${Math.round(remDist)} متر`;
            }

            if (remDist < 12) {
                const destPlace = this.autoNavState.targetPlace;
                this.stopRoamingAutoNavigation();
                this.activeTouchedPlace = destPlace;
                this.updateActionTriggerUI(destPlace, false);
                return;
            } else {
                const desiredHeading = Math.atan2(-dx, -dz);
                let diff = desiredHeading - this.playerHeading;
                while (diff > Math.PI) diff -= Math.PI * 2;
                while (diff < -Math.PI) diff += Math.PI * 2;
                this.playerHeading += diff * Math.min(1, dt * 5.0);
                forward = 1.0;
            }
        }

        const isFlyer = this.isFlyingAvatar(this.activeModelId) || this.freeFlightEnabled;
        const isVehicle = this.isVehicleAvatar(this.activeModelId);
        const isClimber = this.isClimberAvatar(this.activeModelId);

        const maxSpeed = (isFlyer ? 46 : (isVehicle ? 36 : 16)) * boost;
        if (Math.abs(forward) > 0.05) {
            this.playerSpeed = THREE.MathUtils.lerp(this.playerSpeed, forward * maxSpeed, dt * 5.0);
        } else {
            this.playerSpeed = THREE.MathUtils.lerp(this.playerSpeed, 0, dt * 7.0);
        }

        const isMoving = Math.abs(this.playerSpeed) > 0.5 || Math.abs(turn) > 0.08;
        this.playerHeading += turn * 2.2 * dt;

        // Candidate next position
        let nextX = this.playerPos.x - Math.sin(this.playerHeading) * this.playerSpeed * dt;
        let nextZ = this.playerPos.z - Math.cos(this.playerHeading) * this.playerSpeed * dt;

        // SOLID COLLISION DETECTION & STEP-BY-STEP BUILDING CLIMBING
        const playerRadius = isVehicle ? 2.1 : 1.35;
        let touchedPlaceNow = null;
        let isClimbingNow = false;
        let roofSupportY = 0;

        // 1. Check Cylinder Colliders (Street Trees & Park Structures)
        for (const cyl of this.cylinderColliders) {
            const dx = nextX - cyl.x;
            const dz = nextZ - cyl.z;
            const dist = Math.hypot(dx, dz);
            const minSep = cyl.r + playerRadius;
            if (dist < minSep && this.playerPos.y < cyl.height) {
                const nx = dist > 0.001 ? dx / dist : 1;
                const nz = dist > 0.001 ? dz / dist : 0;
                nextX = cyl.x + nx * minSep;
                nextZ = cyl.z + nz * minSep;
                if (cyl.place) touchedPlaceNow = cyl.place;
            }
        }

        // 2. Check Building AABB Colliders (Wall Blocking, Rooftop Standing & Human Climbing)
        for (const b of this.buildingColliders) {
            const insideX = nextX > (b.minX - playerRadius) && nextX < (b.maxX + playerRadius);
            const insideZ = nextZ > (b.minZ - playerRadius) && nextZ < (b.maxZ + playerRadius);

            if (insideX && insideZ) {
                // If player is already at or above roof height -> stand on top of building roof!
                if (this.playerPos.y >= b.height - 1.35) {
                    roofSupportY = Math.max(roofSupportY, b.height);
                    touchedPlaceNow = b.place;
                    continue;
                }

                // Player is touching the building wall!
                touchedPlaceNow = b.place;

                // Push out horizontally to prevent clipping inside the building
                const penLeft = Math.abs(nextX - (b.minX - playerRadius));
                const penRight = Math.abs((b.maxX + playerRadius) - nextX);
                const penTop = Math.abs(nextZ - (b.minZ - playerRadius));
                const penBottom = Math.abs((b.maxZ + playerRadius) - nextZ);
                const minPen = Math.min(penLeft, penRight, penTop, penBottom);

                if (minPen === penLeft) nextX = b.minX - playerRadius;
                else if (minPen === penRight) nextX = b.maxX + playerRadius;
                else if (minPen === penTop) nextZ = b.minZ - playerRadius;
                else nextZ = b.maxZ + playerRadius;

                // Human (`انسان`) & Explorer (`مستكشف`) Step-by-Step Building Climbing (`درجة درجة`)!
                if (isClimber && forward > 0.15) {
                    isClimbingNow = true;
                    this.climbStepTimer += dt;
                    if (this.climbStepTimer >= 0.18) {
                        this.climbStepTimer = 0;
                        this.playerPos.y = Math.min(b.height + 0.1, this.playerPos.y + 1.25);
                        this.audio.playStep(true);
                        if (this.playerPos.y >= b.height) {
                            // Step onto the roof edge!
                            this.standingOnRoofHeight = b.height;
                            nextX = THREE.MathUtils.lerp(nextX, b.cx, 0.15);
                            nextZ = THREE.MathUtils.lerp(nextZ, b.cz, 0.15);
                        }
                    }
                }
            }
        }

        this.playerPos.x = nextX;
        this.playerPos.z = nextZ;
        this.standingOnRoofHeight = roofSupportY;

        // Update touched place & Action Button (`ضغط الإجراء`)
        if (touchedPlaceNow !== this.activeTouchedPlace || isClimbingNow) {
            this.activeTouchedPlace = touchedPlaceNow;
            this.updateActionTriggerUI(touchedPlaceNow, isClimbingNow);
        }

        // Vertical Physics (Flight, Climbing, Jumping & Gravity)
        if (isFlyer) {
            if (vert !== 0) {
                this.targetAltitude = Math.max(roofSupportY, Math.min(140, this.targetAltitude + vert * 28 * dt));
                if (this.targetAltitude <= roofSupportY + 0.5 && !this.isFlyingAvatar(this.activeModelId)) {
                    this.freeFlightEnabled = false;
                }
            }
            this.flightAltitude = THREE.MathUtils.lerp(this.flightAltitude, Math.max(roofSupportY, this.targetAltitude), dt * 5);
            this.playerPos.y = this.flightAltitude + Math.sin(elapsed * 2.5) * 0.35;
        } else if (!isClimbingNow) {
            // Apply gravity & jump velocity above ground/rooftop support
            if (this.verticalVelocity !== 0 || this.playerPos.y > roofSupportY) {
                this.playerPos.y += this.verticalVelocity * dt;
                this.verticalVelocity -= 28.0 * dt;
                if (this.playerPos.y <= roofSupportY) {
                    this.playerPos.y = roofSupportY;
                    this.verticalVelocity = 0;
                }
            } else {
                this.playerPos.y = roofSupportY;
            }

            if (isMoving && !isVehicle && this.playerPos.y <= roofSupportY + 0.1) {
                this.stepTimer += dt * boost;
                if (this.stepTimer > 0.35) {
                    this.stepTimer = 0;
                    this.audio.playStep(false);
                }
            }
        }

        // Update 3D Avatar Anchor & Animation Mixer
        if (this.avatarAnchor) {
            this.avatarAnchor.position.set(this.playerPos.x, this.playerPos.y, this.playerPos.z);
            this.avatarAnchor.rotation.y = this.playerHeading;
            this.avatarAnchor.rotation.z = isFlyer ? (-turn * 0.25) : 0;
        }

        if (this.avatarRing) {
            this.avatarRing.position.y = 0.08;
        }

        // Robot Special Laws: Sweeping Eye Laser & Periodic JAX Speech Bubble (every 15-30s)
        if (this.activeModelId === 'robot') {
            if (this.robotLaserGroup) {
                this.robotLaserGroup.visible = true;
                this.robotLaserGroup.rotation.y = Math.sin(elapsed * 3.2) * 0.45;
                this.robotLaserGroup.rotation.x = Math.sin(elapsed * 2.1) * 0.12 + 0.08;
            }
            if (elapsed >= this.nextRobotSpeechTime) {
                this.triggerRobotJaxSpeechBubble();
            }
            if (elapsed > this.robotBubbleHideTime) {
                document.getElementById('robotSpeechBubble')?.classList.add('hidden');
            } else {
                this.updateRobotSpeechBubblePosition();
            }
        }

        if (this.avatarBundle) {
            const speedKmh = Math.round(Math.abs(this.playerSpeed) * 3.6);
            threeEngine.applyCharacterMotionState(this.avatarBundle, isMoving || isClimbingNow, speedKmh);
            if (this.avatarBundle.mixer) {
                this.avatarBundle.mixer.update(dt);
            }
            if (this.avatarBundle.customTick) {
                this.avatarBundle.customTick(elapsed, isMoving || isClimbingNow);
            }

            const kmhEl = document.getElementById('cityrtSpeedValue');
            if (kmhEl) kmhEl.textContent = String(speedKmh);
        }

        // Camera Follow
        if (this.cameraMode === 'first') {
            const eyeY = this.playerPos.y + 2.8;
            this.camera.position.set(this.playerPos.x, eyeY, this.playerPos.z);
            this.camera.lookAt(
                this.playerPos.x - Math.sin(this.playerHeading) * 30,
                eyeY - 0.5,
                this.playerPos.z - Math.cos(this.playerHeading) * 30
            );
        } else {
            const camDist = isFlyer ? 21 : (isVehicle ? 17 : 13.5);
            const camHeight = isFlyer ? 10.5 : (isVehicle ? 8.0 : 6.4);
            const targetCamPos = new THREE.Vector3(
                this.playerPos.x + Math.sin(this.playerHeading) * camDist,
                this.playerPos.y + camHeight,
                this.playerPos.z + Math.cos(this.playerHeading) * camDist
            );
            this.camera.position.lerp(targetCamPos, Math.min(1, dt * 8.0));
            this.camera.lookAt(
                this.playerPos.x - Math.sin(this.playerHeading) * 8,
                this.playerPos.y + 2.2,
                this.playerPos.z - Math.cos(this.playerHeading) * 8
            );
        }

        // Stream new map tiles as player roams
        if (elapsed - this.lastMapSyncTime > 0.8) {
            this.lastMapSyncTime = elapsed;
            const [curLng, curLat] = this.projector.xzToLngLat(this.playerPos.x, this.playerPos.z);

            const coordsLabel = document.getElementById('cityrtLiveCoordsBadge');
            if (coordsLabel) {
                coordsLabel.textContent = `${curLat.toFixed(5)}°N, ${curLng.toFixed(5)}°E`;
            }

            const movedDist = Math.hypot(
                this.playerPos.x - this.lastStreamingCheckPos.x,
                this.playerPos.z - this.lastStreamingCheckPos.y
            );
            if (movedDist > 120) {
                this.lastStreamingCheckPos.set(this.playerPos.x, this.playerPos.z);
                const mapEngine = this.getMapEngine();
                const currentLayerStyle = mapEngine?.options?.defaultLayer || 'osm';
                this.tileGround.updateTilesAround(curLng, curLat, this.projector, currentLayerStyle);
            }
        }
    }

    updateRobotSpeechBubblePosition() {
        const bubble = document.getElementById('robotSpeechBubble');
        if (!bubble || bubble.classList.contains('hidden') || !this.camera || !this.renderer) return;

        const headPos = new THREE.Vector3(this.playerPos.x, this.playerPos.y + 5.2, this.playerPos.z);
        headPos.project(this.camera);
        if (headPos.z > 1) return;

        const w = this.renderer.domElement.clientWidth;
        const h = this.renderer.domElement.clientHeight;
        const sx = (headPos.x * 0.5 + 0.5) * w;
        const sy = (-headPos.y * 0.5 + 0.5) * h;

        bubble.style.left = `${Math.max(120, Math.min(w - 120, sx)).toFixed(0)}px`;
        bubble.style.top = `${Math.max(70, Math.min(h - 90, sy)).toFixed(0)}px`;
    }

    updateProjectilesAndParks(dt, elapsed) {
        // 1. Update fired projectiles/lasers
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.life -= dt;
            p.mesh.position.x += p.vx * dt;
            p.mesh.position.z += p.vz * dt;

            if (p.life <= 0) {
                this.projectilesGroup.remove(p.mesh);
                this.projectiles.splice(i, 1);
            }
        }

        // 2. Update animated park fountains & carousels
        for (const prop of this.animatedParkProps) {
            if (prop.type === 'fountain') {
                prop.mesh.scale.y = 0.85 + Math.sin(elapsed * 6) * 0.22;
            } else if (prop.type === 'carousel') {
                prop.mesh.rotation.y += dt * 1.4;
            }
        }
    }

    updateLayer2FloatingLabels() {
        if (!this.labelsOverlay || !this.camera || !this.renderer) return;
        const width = this.renderer.domElement.clientWidth;
        const height = this.renderer.domElement.clientHeight;
        const projVec = new THREE.Vector3();

        for (const item of this.buildingLabels) {
            projVec.copy(item.worldPos);
            const dist = this.camera.position.distanceTo(projVec);
            if (dist > 340) {
                item.el.style.display = 'none';
                continue;
            }

            projVec.project(this.camera);
            if (projVec.z > 1.0 || projVec.z < -1.0) {
                item.el.style.display = 'none';
                continue;
            }

            const sx = (projVec.x * 0.5 + 0.5) * width;
            const sy = (-projVec.y * 0.5 + 0.5) * height;
            item.el.style.display = 'inline-flex';
            item.el.style.transform = `translate(-50%, -100%) translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px)`;
        }
    }

    animate() {
        if (!this.isActive) return;
        this.animFrameId = requestAnimationFrame(() => this.animate());

        const dt = Math.min(0.05, this.clock.getDelta());
        const elapsed = this.clock.getElapsedTime();

        // 1. Update Spline Traffic
        for (const agent of this.movingAgents) {
            if (agent.curve) {
                agent.t = (agent.t + agent.speed * dt) % 1.0;
                const pt = agent.curve.getPointAt(agent.t);
                const tan = agent.curve.getTangentAt(agent.t);
                agent.mesh.position.copy(pt);
                agent.mesh.rotation.y = Math.atan2(tan.x, tan.z);
            }
        }

        // 2. Update Weather
        if (this.weatherMode !== 'clear' && this.weatherPoints) {
            const pos = this.weatherPoints.geometry.attributes.position;
            const fallSpeed = this.weatherMode === 'rain' ? 68 : 16;
            for (let i = 0; i < pos.count; i++) {
                let y = pos.getY(i) - fallSpeed * dt;
                if (y < 0) y = 130;
                pos.setY(i, y);
            }
            pos.needsUpdate = true;
        }

        // 3. Update Projectiles & Park Animations
        this.updateProjectilesAndParks(dt, elapsed);

        // 4. Update Avatar Physics, Solid Collisions & Climbing
        this.updateAvatarRoamPhysics(dt, elapsed);

        // 5. Render Scene & Labels
        this.renderer.render(this.scene, this.camera);
        this.updateLayer2FloatingLabels();
    }
}
