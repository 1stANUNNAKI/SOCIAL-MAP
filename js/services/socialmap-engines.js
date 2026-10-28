/**
 * ============================================================================
 * SOCIALMAP — Interactive Engines Suite (v11.5)
 * ============================================================================
 * 1. UniversalPlaceHubController — Place Card & Action Hub
 * 2. RideHailingController — Pin-to-Ride Taxi & Delivery System (IQD)
 * 3. SpatialCommerceController — Pin-to-Shop Menus, Multi-Floor Malls & Cart
 * 4. RichMedia3DStageController — Three.js 360° 3D Dish/Product/Building Stage
 * 5. LiveCameraStreamController — Multi-Angle Live Stream & Floating PiP
 * ============================================================================
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
    IRAQI_CAPTAINS_POOL,
    calculateIraqRideQuotes,
    resolvePlaceMenuCatalog,
    resolvePlaceLiveCameras
} from '../data/socialmap-catalog.js?v=15';

function formatIQD(amount) {
    const num = Math.round((Number(amount) || 0) / 250) * 250;
    return `${num.toLocaleString('ar-IQ')} د.ع`;
}

function computeDistanceKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLng / 2) ** 2;
    return Math.max(0.35, R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

/**
 * ============================================================================
 * 1. RichMedia3DStageController (Three.js 360° 3D Dish / Product / Building)
 * ============================================================================
 */
export class RichMedia3DStageController {
    constructor(options = {}) {
        this.onAddToCart = options.onAddToCart || null;
        this.isOpen = false;
        this.currentItem = null;
        this.currentPlace = null;
        this.activeTab = '3d'; // '3d' | 'photos' | 'video'
        this.sizeScale = 1.0;
        this.lightingPreset = 'warm';

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.modelGroup = null;
        this.steamParticles = null;
        this.animId = null;
        this.videoAnimId = null;
        this.clock = new THREE.Clock();
    }

    openForItemOrPlace(itemOrPlace, parentPlace = null, initialTab = '3d') {
        this.currentItem = itemOrPlace || {};
        this.currentPlace = parentPlace || itemOrPlace || {};
        this.activeTab = initialTab;
        this.sizeScale = 1.0;
        this.isOpen = true;

        const modal = document.getElementById('socialmapMedia3DModal');
        if (!modal) return;
        modal.classList.remove('hidden');
        modal.setAttribute('aria-hidden', 'false');

        const titleEl = document.getElementById('media3DStageTitle');
        const subEl = document.getElementById('media3DStageSubtitle');
        const priceEl = document.getElementById('media3DStagePrice');
        const dimsEl = document.getElementById('media3DStageDims');

        const title = this.currentItem.name || this.currentPlace.name || 'معاينة ثلاثية الأبعاد 360°';
        const desc = this.currentItem.desc || this.currentPlace.address || 'مجسم ثلاثي الأبعاد تفاعلي بزاوية 360 درجة';
        const price = this.currentItem.priceIQD ? formatIQD(this.currentItem.priceIQD) : 'معاينة مجانية';
        const dims = this.currentItem.dims || '35 × 25 × 12 سم';

        if (titleEl) titleEl.textContent = title;
        if (subEl) subEl.textContent = desc;
        if (priceEl) priceEl.textContent = price;
        if (dimsEl) dimsEl.textContent = `📐 الأبعاد الحقيقية: ${dims}`;

        const orderBtn = document.getElementById('media3DOrderItemBtn');
        if (orderBtn) {
            if (this.currentItem && this.currentItem.priceIQD) {
                orderBtn.classList.remove('hidden');
                orderBtn.textContent = `🛒 أضف للسلة (${formatIQD(this.currentItem.priceIQD)})`;
                orderBtn.onclick = () => {
                    if (typeof this.onAddToCart === 'function') {
                        this.onAddToCart(this.currentItem, this.currentPlace);
                    }
                    this.close();
                };
            } else {
                orderBtn.classList.add('hidden');
            }
        }

        this.switchTab(initialTab);
    }

    switchTab(tab) {
        this.activeTab = tab;
        document.querySelectorAll('[data-media-tab]').forEach((btn) => {
            btn.classList.toggle('active', btn.getAttribute('data-media-tab') === tab);
        });

        const view3D = document.getElementById('mediaStage3DContainer');
        const viewPhotos = document.getElementById('mediaStagePhotosContainer');
        const viewVideo = document.getElementById('mediaStageVideoContainer');

        if (view3D) view3D.classList.toggle('hidden', tab !== '3d');
        if (viewPhotos) viewPhotos.classList.toggle('hidden', tab !== 'photos');
        if (viewVideo) viewVideo.classList.toggle('hidden', tab !== 'video');

        if (tab === '3d') {
            this.initOrUpdate3DStage();
        } else if (tab === 'photos') {
            this.renderPhotosGallery();
        } else if (tab === 'video') {
            this.startInteractiveVideoPreview();
        }
    }

    initOrUpdate3DStage() {
        const container = document.getElementById('mediaStage3DCanvasWrap');
        if (!container) return;

        if (!this.renderer) {
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x0f172a);

            this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
            this.camera.position.set(0, 3.6, 6.2);

            this.renderer = new THREE.WebGLRenderer({ antialias: true });
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
            this.renderer.shadowMap.enabled = true;
            container.innerHTML = '';
            container.appendChild(this.renderer.domElement);

            this.controls = new OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.autoRotate = true;
            this.controls.autoRotateSpeed = 2.0;
            this.controls.minDistance = 2.4;
            this.controls.maxDistance = 12;

            this.ambientLight = new THREE.HemisphereLight(0xfffbeb, 0x1e293b, 1.1);
            this.scene.add(this.ambientLight);

            this.keyLight = new THREE.DirectionalLight(0xffedd5, 1.8);
            this.keyLight.position.set(5, 8, 5);
            this.keyLight.castShadow = true;
            this.scene.add(this.keyLight);

            this.rimLight = new THREE.PointLight(0x38bdf8, 1.1, 18);
            this.rimLight.position.set(-5, 3, -4);
            this.scene.add(this.rimLight);

            // Turntable pedestal
            const pedestalGeo = new THREE.CylinderGeometry(2.6, 2.85, 0.28, 48);
            const pedestalMat = new THREE.MeshStandardMaterial({
                color: 0x1e293b,
                metalness: 0.5,
                roughness: 0.25
            });
            const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
            pedestal.position.y = -0.15;
            pedestal.receiveShadow = true;
            this.scene.add(pedestal);

            const ringGeo = new THREE.RingGeometry(2.48, 2.58, 48);
            ringGeo.rotateX(-Math.PI / 2);
            const ringMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.position.y = 0.01;
            this.scene.add(ring);

            this.modelGroup = new THREE.Group();
            this.scene.add(this.modelGroup);
        }

        const w = Math.max(320, container.clientWidth || 540);
        const h = Math.max(260, container.clientHeight || 360);
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);

        this.buildProcedural3DModel(this.currentItem.modelType || 'building_3d');

        if (!this.animId) {
            this.clock.start();
            this.animate3D();
        }
    }

    buildProcedural3DModel(modelType) {
        while (this.modelGroup.children.length) {
            this.modelGroup.remove(this.modelGroup.children[0]);
        }
        this.steamParticles = null;

        const plateMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2, metalness: 0.1 });
        const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 });
        const copperMat = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.65, roughness: 0.28 });

        if (modelType === 'masgouf_platter') {
            // Authentic Iraqi Masgouf on Wood Platter
            const board = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 0.18, 36), woodMat);
            board.position.y = 0.09;
            this.modelGroup.add(board);

            const fishMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.35, metalness: 0.15 });
            const charMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.6 });
            [-0.55, 0.55].forEach((zOff) => {
                const half = new THREE.Mesh(new THREE.CapsuleGeometry(0.45, 1.65, 8, 16), fishMat);
                half.rotation.z = Math.PI / 2;
                half.scale.set(1, 1, 0.45);
                half.position.set(0, 0.32, zOff);
                this.modelGroup.add(half);

                const grillMarks = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.55), charMat);
                grillMarks.position.set(0, 0.52, zOff);
                this.modelGroup.add(grillMarks);
            });

            // Lemon & Tomato garnishes
            const lemonMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 });
            const tomatoMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });
            for (let i = 0; i < 5; i++) {
                const ang = (i * Math.PI * 2) / 5;
                const tom = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.1, 16), i % 2 === 0 ? tomatoMat : lemonMat);
                tom.position.set(Math.cos(ang) * 1.45, 0.24, Math.sin(ang) * 1.45);
                this.modelGroup.add(tom);
            }
            this.addSteamEffect();
        } else if (modelType === 'kebab_grill') {
            const platter = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.16, 2.2), plateMat);
            platter.position.y = 0.08;
            this.modelGroup.add(platter);

            const kebabMat = new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.65 });
            const skewerMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.2 });

            for (let s = -2; s <= 2; s++) {
                const zPos = s * 0.36;
                const skewer = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 3.6, 8), skewerMat);
                skewer.rotation.z = Math.PI / 2;
                skewer.position.set(0, 0.32, zPos);
                this.modelGroup.add(skewer);

                const meat = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 2.3, 8, 12), kebabMat);
                meat.rotation.z = Math.PI / 2;
                meat.position.set(0, 0.32, zPos);
                this.modelGroup.add(meat);
            }
            this.addSteamEffect();
        } else if (modelType === 'quzi_dome') {
            const tray = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 1.95, 0.22, 36), copperMat);
            tray.position.y = 0.11;
            this.modelGroup.add(tray);

            const riceMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.75 });
            const riceMound = new THREE.Mesh(new THREE.SphereGeometry(1.65, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5), riceMat);
            riceMound.position.y = 0.2;
            riceMound.scale.y = 0.55;
            this.modelGroup.add(riceMound);

            const meatMat = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.45 });
            const lamb = new THREE.Mesh(new THREE.DodecahedronGeometry(0.62, 1), meatMat);
            lamb.position.set(0, 1.05, 0);
            lamb.scale.set(1.3, 0.75, 1.0);
            this.modelGroup.add(lamb);
            this.addSteamEffect();
        } else if (modelType === 'dolma_pot') {
            const pot = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.35, 1.25, 32), copperMat);
            pot.position.y = 0.65;
            this.modelGroup.add(pot);

            const leafMat = new THREE.MeshStandardMaterial({ color: 0x365314, roughness: 0.45 });
            for (let i = 0; i < 12; i++) {
                const roll = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.48, 6, 10), leafMat);
                roll.rotation.z = Math.PI / 2;
                roll.rotation.y = (i * Math.PI) / 6;
                const r = i < 4 ? 0.35 : 0.88;
                roll.position.set(Math.cos(i) * r, 1.32, Math.sin(i) * r);
                this.modelGroup.add(roll);
            }
            this.addSteamEffect();
        } else if (modelType === 'pizza_disc') {
            const board = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 0.12, 36), woodMat);
            board.position.y = 0.06;
            this.modelGroup.add(board);

            const crust = new THREE.Mesh(
                new THREE.CylinderGeometry(1.85, 1.85, 0.16, 32),
                new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 })
            );
            crust.position.y = 0.18;
            this.modelGroup.add(crust);

            const cheese = new THREE.Mesh(
                new THREE.CylinderGeometry(1.62, 1.62, 0.06, 32),
                new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.35 })
            );
            cheese.position.y = 0.27;
            this.modelGroup.add(cheese);

            const pepMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.4 });
            for (let i = 0; i < 9; i++) {
                const ang = (i * Math.PI * 2) / 9;
                const dist = (i % 2 === 0) ? 0.95 : 0.45;
                const pep = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.05, 16), pepMat);
                pep.position.set(Math.cos(ang) * dist, 0.31, Math.sin(ang) * dist);
                this.modelGroup.add(pep);
            }
        } else if (modelType === 'burger_stack') {
            const plate = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.6, 0.15, 32), plateMat);
            plate.position.y = 0.08;
            this.modelGroup.add(plate);

            const bunMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5 });
            const pattyMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.7 });
            const cheeseMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 });
            const lettuceMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.5 });

            const botBun = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.05, 0.32, 28), bunMat);
            botBun.position.y = 0.32;
            this.modelGroup.add(botBun);

            const patty1 = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.28, 28), pattyMat);
            patty1.position.y = 0.62;
            this.modelGroup.add(patty1);

            const cheese1 = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.06, 1.75), cheeseMat);
            cheese1.position.y = 0.78;
            cheese1.rotation.y = 0.4;
            this.modelGroup.add(cheese1);

            const patty2 = new THREE.Mesh(new THREE.CylinderGeometry(1.18, 1.18, 0.26, 28), pattyMat);
            patty2.position.y = 0.95;
            this.modelGroup.add(patty2);

            const lettuce = new THREE.Mesh(new THREE.CylinderGeometry(1.24, 1.24, 0.1, 24), lettuceMat);
            lettuce.position.y = 1.14;
            this.modelGroup.add(lettuce);

            const topBun = new THREE.Mesh(new THREE.SphereGeometry(1.18, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.5), bunMat);
            topBun.position.y = 1.18;
            topBun.scale.y = 0.65;
            this.modelGroup.add(topBun);
        } else if (modelType === 'perfume_bottle') {
            const glassMat = new THREE.MeshStandardMaterial({
                color: 0xf59e0b,
                metalness: 0.3,
                roughness: 0.1,
                transparent: true,
                opacity: 0.88
            });
            const goldMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.85, roughness: 0.15 });

            const bottle = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.2, 0.9), glassMat);
            bottle.position.y = 1.15;
            this.modelGroup.add(bottle);

            const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.38, 20), goldMat);
            neck.position.y = 2.42;
            this.modelGroup.add(neck);

            const cap = new THREE.Mesh(new THREE.OctahedronGeometry(0.48, 0), goldMat);
            cap.position.y = 2.95;
            this.modelGroup.add(cap);
        } else if (modelType === 'smart_device') {
            const bodyMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.2 });
            const screenMat = new THREE.MeshStandardMaterial({
                color: 0x0284c7,
                emissive: new THREE.Color(0x0284c7),
                emissiveIntensity: 0.45,
                roughness: 0.1
            });
            const frame = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.8, 0.2), bodyMat);
            frame.position.y = 1.65;
            frame.rotation.x = -0.15;
            this.modelGroup.add(frame);

            const screen = new THREE.Mesh(new THREE.BoxGeometry(1.46, 2.62, 0.04), screenMat);
            screen.position.set(0, 1.65, 0.1);
            screen.rotation.x = -0.15;
            this.modelGroup.add(screen);
        } else {
            // Default: Detailed 3D Architectural Landmark / Heritage Building Model
            const baseMat = new THREE.MeshStandardMaterial({ color: 0xf5efe6, roughness: 0.55 });
            const domeMat = new THREE.MeshStandardMaterial({ color: 0x0d9488, metalness: 0.45, roughness: 0.25 });
            const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.7, roughness: 0.2 });

            const bldg = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.1, 2.0), baseMat);
            bldg.position.y = 1.05;
            this.modelGroup.add(bldg);

            const shanasheel = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.75, 0.35), woodMat);
            shanasheel.position.set(0, 1.35, 1.1);
            this.modelGroup.add(shanasheel);

            const dome = new THREE.Mesh(new THREE.SphereGeometry(0.75, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), domeMat);
            dome.position.y = 2.1;
            this.modelGroup.add(dome);

            const finial = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.45, 8), goldMat);
            finial.position.y = 2.95;
            this.modelGroup.add(finial);
        }

        this.modelGroup.scale.setScalar(this.sizeScale);
    }

    addSteamEffect() {
        const count = 45;
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 1.8;
            pos[i * 3 + 1] = 0.5 + Math.random() * 1.8;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 1.8;
        }
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const mat = new THREE.PointsMaterial({
            color: 0xf8fafc,
            size: 0.14,
            transparent: true,
            opacity: 0.42
        });
        this.steamParticles = new THREE.Points(geo, mat);
        this.modelGroup.add(this.steamParticles);
    }

    setSizeScale(scale, labelText) {
        this.sizeScale = Number(scale) || 1.0;
        if (this.modelGroup) {
            this.modelGroup.scale.setScalar(this.sizeScale);
        }
        document.querySelectorAll('[data-media-size]').forEach((btn) => {
            btn.classList.toggle('active', Number(btn.getAttribute('data-media-size')) === this.sizeScale);
        });
        const dimsEl = document.getElementById('media3DStageDims');
        if (dimsEl && labelText) {
            dimsEl.textContent = `📐 الحجم المختار: ${labelText}`;
        }
    }

    setLightingPreset(preset) {
        this.lightingPreset = preset;
        if (!this.scene || !this.keyLight) return;
        if (preset === 'day') {
            this.scene.background.setHex(0x1e293b);
            this.keyLight.color.setHex(0xffffff);
            this.keyLight.intensity = 2.0;
        } else if (preset === 'warm') {
            this.scene.background.setHex(0x0f172a);
            this.keyLight.color.setHex(0xffedd5);
            this.keyLight.intensity = 1.75;
        } else if (preset === 'neon') {
            this.scene.background.setHex(0x090d16);
            this.keyLight.color.setHex(0x38bdf8);
            this.rimLight.color.setHex(0xf43f5e);
            this.keyLight.intensity = 1.9;
        }
    }

    renderPhotosGallery() {
        const container = document.getElementById('mediaStagePhotosContainer');
        if (!container) return;
        const mainPhoto = this.currentItem.photo || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=900&q=80';
        const extraPhotos = [
            mainPhoto,
            'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=900&q=80',
            'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=900&q=80',
            'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=900&q=80'
        ];
        container.innerHTML = `
            <div class="media-photos-grid">
                ${extraPhotos.map((src, idx) => `
                    <div class="media-photo-card">
                        <img src="${src}" alt="صورة ${idx + 1}" loading="lazy" />
                        <span class="media-photo-caption">لقطة عالية الدقة #${idx + 1} — ${this.currentItem.name || this.currentPlace.name || ''}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    startInteractiveVideoPreview() {
        const canvas = document.getElementById('mediaStageVideoCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width = 680;
        canvas.height = 360;

        if (this.videoAnimId) cancelAnimationFrame(this.videoAnimId);
        let frame = 0;
        const title = this.currentItem.name || this.currentPlace.name || 'عرض سينمائي حي';
        const sub = this.currentPlace.name || 'العراق — SOCIALMAP';

        const drawVideo = () => {
            if (!this.isOpen || this.activeTab !== 'video') return;
            frame++;
            const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            grad.addColorStop(0, '#0f172a');
            grad.addColorStop(0.5, '#1e293b');
            grad.addColorStop(1, '#334155');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Animated golden bokeh particles
            for (let i = 0; i < 18; i++) {
                const x = ((i * 97 + frame * (1.2 + (i % 3) * 0.4)) % (canvas.width + 80)) - 40;
                const y = 60 + Math.sin(frame * 0.03 + i) * 90 + (i * 15) % 180;
                const r = 12 + (i % 5) * 8;
                ctx.fillStyle = i % 2 === 0 ? 'rgba(245, 158, 11, 0.16)' : 'rgba(56, 189, 248, 0.14)';
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.fill();
            }

            // Progress bar & HD overlay
            ctx.fillStyle = '#f59e0b';
            ctx.font = 'bold 16px "Cairo", sans-serif';
            ctx.fillText('🎬 فيديو تعريفي سينمائي (1080p 60FPS)', 28, 42);

            ctx.fillStyle = '#ffffff';
            ctx.font = '900 30px "Cairo", sans-serif';
            ctx.fillText(title, 28, 175);

            ctx.fillStyle = '#cbd5e1';
            ctx.font = '600 18px "Cairo", sans-serif';
            ctx.fillText(`📍 ${sub} — جودة مضمونة وتحضير طازج`, 28, 215);

            const progress = (frame % 360) / 360;
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.fillRect(28, 320, canvas.width - 56, 6);
            ctx.fillStyle = '#10b981';
            ctx.fillRect(28, 320, (canvas.width - 56) * progress, 6);

            this.videoAnimId = requestAnimationFrame(drawVideo);
        };
        drawVideo();
    }

    animate3D() {
        if (!this.isOpen) return;
        this.animId = requestAnimationFrame(() => this.animate3D());
        if (this.activeTab !== '3d' || !this.renderer) return;

        const dt = this.clock.getDelta();
        if (this.controls) this.controls.update();

        if (this.steamParticles) {
            const pos = this.steamParticles.geometry.attributes.position;
            for (let i = 0; i < pos.count; i++) {
                let y = pos.getY(i) + dt * 0.65;
                if (y > 2.4) y = 0.5;
                pos.setY(i, y);
            }
            pos.needsUpdate = true;
        }

        this.renderer.render(this.scene, this.camera);
    }

    close() {
        this.isOpen = false;
        if (this.animId) {
            cancelAnimationFrame(this.animId);
            this.animId = null;
        }
        if (this.videoAnimId) {
            cancelAnimationFrame(this.videoAnimId);
            this.videoAnimId = null;
        }
        const modal = document.getElementById('socialmapMedia3DModal');
        if (modal) {
            modal.classList.add('hidden');
            modal.setAttribute('aria-hidden', 'true');
        }
    }
}

/**
 * ============================================================================
 * 2. LiveCameraStreamController (`🔴 بث مباشر` Multi-Angle & Floating PiP)
 * ============================================================================
 */
export class LiveCameraStreamController {
    constructor(options = {}) {
        this.onRequestRide = options.onRequestRide || null;
        this.onOpenMenu = options.onOpenMenu || null;

        this.isOpen = false;
        this.isPiP = false;
        this.currentPlace = null;
        this.cameras = [];
        this.activeCamIndex = 0;
        this.quadMode = false;
        this.animId = null;
        this.frame = 0;
    }

    openForPlace(place) {
        this.currentPlace = place || { name: 'موقع عراقي حي', city: 'بغداد', lat: 33.3152, lng: 44.3661 };
        this.cameras = resolvePlaceLiveCameras(this.currentPlace);
        this.activeCamIndex = 0;
        this.quadMode = false;
        this.isOpen = true;
        this.isPiP = false;

        const modal = document.getElementById('socialmapLiveCamModal');
        const pipBar = document.getElementById('socialmapLivePiPWidget');
        if (pipBar) pipBar.classList.add('hidden');
        if (modal) {
            modal.classList.remove('hidden');
            modal.setAttribute('aria-hidden', 'false');
        }

        this.renderCameraUI();
        this.startStreamLoop();
    }

    renderCameraUI() {
        const cam = this.cameras[this.activeCamIndex] || this.cameras[0];
        if (!cam) return;

        const titleEl = document.getElementById('liveCamPlaceTitle');
        const angleEl = document.getElementById('liveCamAngleTitle');
        const viewersEl = document.getElementById('liveCamViewersCount');
        const crowdEl = document.getElementById('liveCamCrowdBadge');
        const switcherEl = document.getElementById('liveCamAnglesSwitcher');

        if (titleEl) titleEl.textContent = `🔴 بث مباشر — ${this.currentPlace.name}`;
        if (angleEl) angleEl.textContent = `${cam.angleAr} (${cam.fps} FPS · ${cam.quality})`;
        if (viewersEl) viewersEl.textContent = `👁️ ${cam.viewers} مشاهد الآن`;
        if (crowdEl) crowdEl.textContent = cam.crowdText;

        if (switcherEl) {
            switcherEl.innerHTML = this.cameras.map((c, idx) => `
                <button type="button" class="live-cam-angle-btn ${(!this.quadMode && idx === this.activeCamIndex) ? 'active' : ''}" data-cam-idx="${idx}">
                    📹 ${c.angleAr}
                </button>
            `).join('') + `
                <button type="button" class="live-cam-angle-btn ${this.quadMode ? 'active' : ''}" id="liveCamQuadToggleBtn">
                    🎛️ شبكة 4 كاميرات (Quad)
                </button>
            `;

            switcherEl.querySelectorAll('[data-cam-idx]').forEach((btn) => {
                btn.addEventListener('click', () => {
                    this.quadMode = false;
                    this.activeCamIndex = Number(btn.getAttribute('data-cam-idx')) || 0;
                    this.renderCameraUI();
                });
            });

            const quadBtn = switcherEl.querySelector('#liveCamQuadToggleBtn');
            if (quadBtn) {
                quadBtn.addEventListener('click', () => {
                    this.quadMode = !this.quadMode;
                    this.renderCameraUI();
                });
            }
        }
    }

    startStreamLoop() {
        if (this.animId) cancelAnimationFrame(this.animId);
        const mainCanvas = document.getElementById('liveCamStreamCanvas');
        const pipCanvas = document.getElementById('livePiPCanvas');

        const renderFrame = () => {
            if (!this.isOpen && !this.isPiP) return;
            this.frame++;

            const targetCanvas = this.isPiP ? pipCanvas : mainCanvas;
            if (targetCanvas) {
                const ctx = targetCanvas.getContext('2d');
                const w = targetCanvas.width = this.isPiP ? 320 : 760;
                const h = targetCanvas.height = this.isPiP ? 180 : 420;

                if (this.quadMode && !this.isPiP) {
                    const hw = w / 2;
                    const hh = h / 2;
                    this.cameras.slice(0, 4).forEach((cam, idx) => {
                        const ox = (idx % 2) * hw;
                        const oy = Math.floor(idx / 2) * hh;
                        ctx.save();
                        ctx.beginPath();
                        ctx.rect(ox, oy, hw, hh);
                        ctx.clip();
                        this.drawSimulatedLiveFeed(ctx, ox, oy, hw, hh, cam, idx);
                        ctx.strokeStyle = '#334155';
                        ctx.lineWidth = 2;
                        ctx.strokeRect(ox, oy, hw, hh);
                        ctx.restore();
                    });
                } else {
                    const cam = this.cameras[this.activeCamIndex] || this.cameras[0];
                    this.drawSimulatedLiveFeed(ctx, 0, 0, w, h, cam, this.activeCamIndex);
                }
            }

            this.animId = requestAnimationFrame(renderFrame);
        };
        renderFrame();
    }

    drawSimulatedLiveFeed(ctx, ox, oy, w, h, cam, seed = 0) {
        // Sky & Plaza backdrop
        const skyGrad = ctx.createLinearGradient(ox, oy, ox, oy + h * 0.55);
        skyGrad.addColorStop(0, seed % 2 === 0 ? '#0c4a6e' : '#1e293b');
        skyGrad.addColorStop(1, '#38bdf8');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(ox, oy, w, h * 0.52);

        // Ground avenue & sidewalks
        ctx.fillStyle = '#334155';
        ctx.fillRect(ox, oy + h * 0.52, w, h * 0.48);

        ctx.fillStyle = '#475569';
        ctx.fillRect(ox, oy + h * 0.52, w, h * 0.1);

        // Perspective road lines
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 3;
        ctx.setLineDash([22, 16]);
        ctx.lineDashOffset = -(this.frame * 2.5);
        ctx.beginPath();
        ctx.moveTo(ox, oy + h * 0.78);
        ctx.lineTo(ox + w, oy + h * 0.78);
        ctx.stroke();
        ctx.setLineDash([]);

        // Background Iraqi Buildings Silhouette
        for (let b = 0; b < 7; b++) {
            const bx = ox + b * (w / 6.5);
            const bh = (h * 0.22) + ((b * 19 + seed * 11) % Math.floor(h * 0.18));
            const bw = (w / 7.2);
            ctx.fillStyle = b % 2 === 0 ? '#1e293b' : '#0f172a';
            ctx.fillRect(bx, oy + h * 0.52 - bh, bw, bh);

            // Lit windows
            ctx.fillStyle = 'rgba(254, 240, 138, 0.75)';
            for (let wy = oy + h * 0.52 - bh + 10; wy < oy + h * 0.50; wy += 14) {
                ctx.fillRect(bx + 8, wy, bw - 16, 5);
            }
        }

        // Moving Vehicles (Iraqi Yellow Taxis & Civilian Cars)
        for (let c = 0; c < 4; c++) {
            const dir = c % 2 === 0 ? 1 : -1;
            const speed = 1.8 + c * 0.55;
            const rawX = ((this.frame * speed * dir) + c * 190) % (w + 120);
            const cx = ox + (rawX < -60 ? rawX + w + 120 : rawX);
            const cy = oy + h * (dir > 0 ? 0.82 : 0.68);

            ctx.fillStyle = c % 2 === 0 ? '#f59e0b' : '#f8fafc';
            ctx.fillRect(cx, cy, 46, 18);
            ctx.fillStyle = '#0284c7';
            ctx.fillRect(cx + 8, cy - 9, 28, 10);
        }

        // Moving Pedestrians on sidewalk
        for (let p = 0; p < 6; p++) {
            const px = ox + ((this.frame * (0.55 + (p % 3) * 0.2) + p * 110) % w);
            const py = oy + h * 0.56 + Math.sin(this.frame * 0.15 + p) * 2;
            ctx.fillStyle = p % 2 === 0 ? '#38bdf8' : '#10b981';
            ctx.fillRect(px, py - 14, 7, 14);
            ctx.fillStyle = '#fde68a';
            ctx.beginPath();
            ctx.arc(px + 3.5, py - 18, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        // Camera HUD Timestamp (Baghdad Time GMT+3)
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Baghdad', hour12: false }) +
            '.' + String(now.getMilliseconds()).padStart(3, '0').slice(0, 2);

        ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
        ctx.fillRect(ox + 10, oy + 10, Math.min(w - 20, 310), 30);

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(ox + 24, oy + 25, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px "Cairo", monospace';
        ctx.fillText(`LIVE · ${cam?.angleAr || 'بث مباشر'} · ${timeStr}`, ox + 36, oy + 29);
    }

    captureSnapshot() {
        const canvas = document.getElementById('liveCamStreamCanvas');
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = `socialmap-live-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }

    minimizeToPiP() {
        this.isPiP = true;
        this.isOpen = false;
        const modal = document.getElementById('socialmapLiveCamModal');
        const pipWidget = document.getElementById('socialmapLivePiPWidget');
        if (modal) modal.classList.add('hidden');
        if (pipWidget) {
            pipWidget.classList.remove('hidden');
            const titleEl = document.getElementById('livePiPTitle');
            if (titleEl) titleEl.textContent = `🔴 ${this.currentPlace?.name || 'بث مباشر'}`;
        }
    }

    restoreFromPiP() {
        if (!this.currentPlace) return;
        this.openForPlace(this.currentPlace);
    }

    close() {
        this.isOpen = false;
        this.isPiP = false;
        if (this.animId) {
            cancelAnimationFrame(this.animId);
            this.animId = null;
        }
        const modal = document.getElementById('socialmapLiveCamModal');
        const pipWidget = document.getElementById('socialmapLivePiPWidget');
        if (modal) modal.classList.add('hidden');
        if (pipWidget) pipWidget.classList.add('hidden');
    }
}

/**
 * ============================================================================
 * 3. SpatialCommerceController (`Pin-to-Shop & Dine` Menus, Malls & Cart)
 * ============================================================================
 */
export class SpatialCommerceController {
    constructor(options = {}) {
        this.onInspect3DItem = options.onInspect3DItem || null;
        this.onDispatchDeliveryOnMap = options.onDispatchDeliveryOnMap || null;
        this.getUserCoords = options.getUserCoords || (() => ({ lat: 33.3152, lng: 44.3661 }));

        this.currentPlace = null;
        this.currentCatalog = null;
        this.activeFloor = null;
        this.activeCategory = 'all';
        this.cart = this.loadCart();
        this.updateCartFloatingBar();
    }

    loadCart() {
        try {
            const raw = localStorage.getItem('socialmap_cart_v11');
            return raw ? JSON.parse(raw) : [];
        } catch (_) {
            return [];
        }
    }

    saveCart() {
        try {
            localStorage.setItem('socialmap_cart_v11', JSON.stringify(this.cart));
        } catch (_) { /* ignore */ }
        this.updateCartFloatingBar();
    }

    openCatalogForPlace(place) {
        this.currentPlace = place || { name: 'متجر ومطعم عراقي', lat: 33.3152, lng: 44.3661 };
        this.currentCatalog = resolvePlaceMenuCatalog(this.currentPlace);
        this.activeFloor = this.currentCatalog.floors ? this.currentCatalog.floors[0].id : null;
        this.activeCategory = 'all';

        const drawer = document.getElementById('socialmapCommerceDrawer');
        if (!drawer) return;
        drawer.classList.remove('hidden');
        drawer.setAttribute('aria-hidden', 'false');

        this.renderCatalogUI();
    }

    renderCatalogUI() {
        const cat = this.currentCatalog;
        if (!cat) return;

        const titleEl = document.getElementById('commercePlaceTitle');
        const badgeEl = document.getElementById('commercePlaceBadge');
        const metaEl = document.getElementById('commercePlaceMeta');
        const floorsEl = document.getElementById('commerceFloorsBar');
        const tabsEl = document.getElementById('commerceCategoryTabs');
        const gridEl = document.getElementById('commerceItemsGrid');

        if (titleEl) titleEl.textContent = this.currentPlace.name;
        if (badgeEl) badgeEl.textContent = cat.badgeAr;
        if (metaEl) {
            metaEl.textContent = `⭐ ${cat.rating} (${cat.reviewsCount} تقييم) · 🛵 توصيل ${cat.deliveryTimeMin} دقيقة · الحد الأدنى ${formatIQD(cat.minOrderIQD)}`;
        }

        // Multi-Floor Bar for Malls
        if (floorsEl) {
            if (Array.isArray(cat.floors) && cat.floors.length > 0) {
                floorsEl.classList.remove('hidden');
                floorsEl.innerHTML = cat.floors.map((fl) => `
                    <button type="button" class="commerce-floor-btn ${this.activeFloor === fl.id ? 'active' : ''}" data-floor-id="${fl.id}">
                        🏢 ${fl.label} <small>${fl.desc}</small>
                    </button>
                `).join('');
                floorsEl.querySelectorAll('[data-floor-id]').forEach((btn) => {
                    btn.addEventListener('click', () => {
                        this.activeFloor = btn.getAttribute('data-floor-id');
                        this.renderCatalogUI();
                    });
                });
            } else {
                floorsEl.classList.add('hidden');
                floorsEl.innerHTML = '';
            }
        }

        // Category Tabs
        if (tabsEl) {
            const allCats = [{ id: 'all', name: '🔥 الكل' }, ...(cat.categories || [])];
            tabsEl.innerHTML = allCats.map((c) => `
                <button type="button" class="commerce-cat-tab ${this.activeCategory === c.id ? 'active' : ''}" data-cat-id="${c.id}">
                    ${c.name}
                </button>
            `).join('');
            tabsEl.querySelectorAll('[data-cat-id]').forEach((btn) => {
                btn.addEventListener('click', () => {
                    this.activeCategory = btn.getAttribute('data-cat-id');
                    this.renderCatalogUI();
                });
            });
        }

        // Filter & Render Items
        if (gridEl) {
            const items = (cat.items || []).filter((item) => {
                if (this.activeFloor && item.floor && item.floor !== this.activeFloor) return false;
                if (this.activeCategory !== 'all' && item.catId !== this.activeCategory) return false;
                return true;
            });

            gridEl.innerHTML = items.map((item) => `
                <article class="commerce-item-card">
                    <div class="commerce-item-img-wrap">
                        <img src="${item.photo}" alt="${item.name}" loading="lazy" />
                        ${item.popular ? `<span class="commerce-popular-pill">🔥 الأكثر طلباً</span>` : ''}
                        <button type="button" class="commerce-3d-Floating-btn" data-inspect-3d="${item.id}" title="استعراض المجسم ثلاثي الأبعاد 360°">
                            🧊 عرض 3D
                        </button>
                    </div>
                    <div class="commerce-item-body">
                        <h4 class="commerce-item-title">${item.name}</h4>
                        <p class="commerce-item-desc">${item.desc}</p>
                        <div class="commerce-item-specs">
                            <span>⏱️ ${item.prepMin || 15} د</span>
                            ${item.calories ? `<span>🔥 ${item.calories} سعرة</span>` : ''}
                            <span>📐 ${item.dims || 'قياسي'}</span>
                        </div>
                        <div class="commerce-item-footer">
                            <strong class="commerce-item-price">${formatIQD(item.priceIQD)}</strong>
                            <button type="button" class="commerce-add-btn" data-add-item="${item.id}">
                                + أضف للسلة
                            </button>
                        </div>
                    </div>
                </article>
            `).join('');

            gridEl.querySelectorAll('[data-inspect-3d]').forEach((btn) => {
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-inspect-3d');
                    const found = (cat.items || []).find((x) => x.id === id);
                    if (found && typeof this.onInspect3DItem === 'function') {
                        this.onInspect3DItem(found, this.currentPlace, '3d');
                    }
                });
            });

            gridEl.querySelectorAll('[data-add-item]').forEach((btn) => {
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-add-item');
                    const found = (cat.items || []).find((x) => x.id === id);
                    if (found) this.addItemToCart(found, this.currentPlace);
                });
            });
        }
    }

    addItemToCart(item, place) {
        if (!item) return;
        const existing = this.cart.find((c) => c.id === item.id);
        if (existing) {
            existing.qty += 1;
        } else {
            this.cart.push({
                id: item.id,
                name: item.name,
                priceIQD: item.priceIQD,
                photo: item.photo,
                qty: 1,
                placeName: place?.name || this.currentPlace?.name || 'متجر عراقي',
                placeLat: place?.lat || this.currentPlace?.lat || 33.3152,
                placeLng: place?.lng || this.currentPlace?.lng || 44.3661
            });
        }
        this.saveCart();
    }

    updateCartFloatingBar() {
        const bar = document.getElementById('socialmapCartFloatingBar');
        const countEl = document.getElementById('cartFloatingCount');
        const totalEl = document.getElementById('cartFloatingTotal');
        if (!bar) return;

        const totalQty = this.cart.reduce((sum, i) => sum + i.qty, 0);
        const subtotal = this.cart.reduce((sum, i) => sum + i.priceIQD * i.qty, 0);

        if (totalQty === 0) {
            bar.classList.add('hidden');
            return;
        }
        bar.classList.remove('hidden');
        if (countEl) countEl.textContent = `${totalQty} قطع في السلة`;
        if (totalEl) totalEl.textContent = formatIQD(subtotal);
    }

    openCheckoutModal() {
        const modal = document.getElementById('socialmapCartCheckoutModal');
        if (!modal) return;
        modal.classList.remove('hidden');
        this.renderCheckoutModal();
    }

    renderCheckoutModal() {
        const listEl = document.getElementById('checkoutItemsList');
        const summaryEl = document.getElementById('checkoutPriceSummary');
        if (!listEl || !summaryEl) return;

        if (this.cart.length === 0) {
            listEl.innerHTML = `<p class="empty-cart-msg">السلة فارغة حالياً.</p>`;
            summaryEl.innerHTML = '';
            return;
        }

        const userPos = this.getUserCoords();
        const firstStore = this.cart[0];
        const distKm = computeDistanceKm(userPos.lat, userPos.lng, firstStore.placeLat, firstStore.placeLng);
        const deliveryFee = Math.round(Math.max(1500, Math.min(7500, 1500 + distKm * 450)) / 250) * 250;
        const subtotal = this.cart.reduce((s, i) => s + i.priceIQD * i.qty, 0);
        const grandTotal = subtotal + deliveryFee;

        listEl.innerHTML = this.cart.map((item) => `
            <div class="checkout-cart-row">
                <img src="${item.photo}" alt="${item.name}" class="checkout-row-img" />
                <div class="checkout-row-info">
                    <strong>${item.name}</strong>
                    <small>📍 ${item.placeName} · ${formatIQD(item.priceIQD)}</small>
                </div>
                <div class="checkout-row-qty">
                    <button type="button" data-cart-dec="${item.id}">−</button>
                    <span>${item.qty}</span>
                    <button type="button" data-cart-inc="${item.id}">+</button>
                </div>
            </div>
        `).join('');

        listEl.querySelectorAll('[data-cart-dec]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-cart-dec');
                const found = this.cart.find((x) => x.id === id);
                if (found) {
                    found.qty -= 1;
                    if (found.qty <= 0) {
                        this.cart = this.cart.filter((x) => x.id !== id);
                    }
                    this.saveCart();
                    this.renderCheckoutModal();
                }
            });
        });

        listEl.querySelectorAll('[data-cart-inc]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-cart-inc');
                const found = this.cart.find((x) => x.id === id);
                if (found) {
                    found.qty += 1;
                    this.saveCart();
                    this.renderCheckoutModal();
                }
            });
        });

        summaryEl.innerHTML = `
            <div class="checkout-summary-line"><span>مجموع الطلبات:</span><strong>${formatIQD(subtotal)}</strong></div>
            <div class="checkout-summary-line"><span>أجرة التوصيل (${distKm.toFixed(1)} كم):</span><strong>${formatIQD(deliveryFee)}</strong></div>
            <div class="checkout-summary-line total"><span>الإجمالي الكلي:</span><strong>${formatIQD(grandTotal)}</strong></div>
        `;
    }

    confirmOrderAndDispatch() {
        if (this.cart.length === 0) return;
        const firstStore = this.cart[0];
        const orderPlace = {
            name: firstStore.placeName,
            lat: firstStore.placeLat,
            lng: firstStore.placeLng
        };

        this.cart = [];
        this.saveCart();

        const modal = document.getElementById('socialmapCartCheckoutModal');
        const drawer = document.getElementById('socialmapCommerceDrawer');
        if (modal) modal.classList.add('hidden');
        if (drawer) drawer.classList.add('hidden');

        if (typeof this.onDispatchDeliveryOnMap === 'function') {
            this.onDispatchDeliveryOnMap(orderPlace);
        }
    }

    closeDrawer() {
        const drawer = document.getElementById('socialmapCommerceDrawer');
        if (drawer) drawer.classList.add('hidden');
    }
}

/**
 * ============================================================================
 * 4. RideHailingController (`Pin-to-Ride` Taxi & Delivery Dispatch on Map)
 * ============================================================================
 */
export class RideHailingController {
    constructor(options = {}) {
        this.getMapEngine = options.getMapEngine || (() => null);
        this.getUserCoords = options.getUserCoords || (() => ({ lat: 33.3152, lng: 44.3661 }));

        this.destinationPlace = null;
        this.quotes = [];
        this.selectedTierId = 'ECONOMY';
        this.selectedPayment = 'نقداً عند الوصول';
        this.activeRideMarker = null;
        this.activeRideTimer = null;
    }

    openForDestination(place, preselectTier = 'ECONOMY') {
        this.destinationPlace = place || { name: 'وجهة مختارة', lat: 33.3152, lng: 44.3661 };
        this.selectedTierId = preselectTier;

        const userPos = this.getUserCoords();
        const distKm = computeDistanceKm(userPos.lat, userPos.lng, this.destinationPlace.lat, this.destinationPlace.lng);
        const durationMin = Math.max(4, Math.round((distKm / 32) * 60 + 3));

        this.quotes = calculateIraqRideQuotes(distKm, durationMin);

        // Draw route preview on the 2D map
        const mapEngine = this.getMapEngine();
        if (mapEngine && typeof mapEngine.buildPinToPinRoute === 'function') {
            mapEngine.buildPinToPinRoute(
                { lat: userPos.lat, lng: userPos.lng, name: 'موقعي الحالي' },
                { lat: this.destinationPlace.lat, lng: this.destinationPlace.lng, name: this.destinationPlace.name }
            );
        }

        const drawer = document.getElementById('socialmapTaxiDrawer');
        if (!drawer) return;
        drawer.classList.remove('hidden');
        drawer.setAttribute('aria-hidden', 'false');

        this.renderTaxiDrawer(distKm, durationMin);
    }

    renderTaxiDrawer(distKm, durationMin) {
        const destEl = document.getElementById('taxiDestinationLabel');
        const metaEl = document.getElementById('taxiRouteMetaLabel');
        const tiersEl = document.getElementById('taxiTiersList');
        const confirmBtn = document.getElementById('taxiConfirmBookingBtn');

        if (destEl) destEl.textContent = `📍 إلى: ${this.destinationPlace.name}`;
        if (metaEl) metaEl.textContent = `📏 المسافة: ${distKm.toFixed(1)} كم · ⏱️ الوقت المقدر: ${durationMin} دقيقة`;

        if (tiersEl) {
            tiersEl.innerHTML = this.quotes.map((q) => `
                <button type="button" class="taxi-tier-card ${this.selectedTierId === q.id ? 'active' : ''}" data-tier-id="${q.id}">
                    <span class="taxi-tier-icon">${q.icon}</span>
                    <div class="taxi-tier-info">
                        <strong>${q.nameAr} <span class="taxi-badge">${q.badge}</span></strong>
                        <small>${q.descAr} · يصل خلال ${q.etaMin} د</small>
                    </div>
                    <strong class="taxi-tier-price">${q.formattedFare}</strong>
                </button>
            `).join('');

            tiersEl.querySelectorAll('[data-tier-id]').forEach((btn) => {
                btn.addEventListener('click', () => {
                    this.selectedTierId = btn.getAttribute('data-tier-id');
                    this.renderTaxiDrawer(distKm, durationMin);
                });
            });
        }

        const selectedQuote = this.quotes.find((q) => q.id === this.selectedTierId) || this.quotes[0];
        if (confirmBtn && selectedQuote) {
            confirmBtn.textContent = `🚖 تأكيد طلب ${selectedQuote.nameAr} (${selectedQuote.formattedFare})`;
        }
    }

    confirmBooking() {
        const selectedQuote = this.quotes.find((q) => q.id === this.selectedTierId) || this.quotes[0];
        const captain = IRAQI_CAPTAINS_POOL[Math.floor(Math.random() * IRAQI_CAPTAINS_POOL.length)];
        const pinCode = String(Math.floor(1000 + Math.random() * 9000));

        const drawer = document.getElementById('socialmapTaxiDrawer');
        if (drawer) drawer.classList.add('hidden');

        this.startLiveCaptainTracking(selectedQuote, captain, pinCode);
    }

    startLiveCaptainTracking(quote, captain, pinCode, isDelivery = false) {
        const bar = document.getElementById('socialmapActiveRideBar');
        if (bar) {
            bar.classList.remove('hidden');
            bar.innerHTML = `
                <div class="active-ride-header">
                    <span class="active-ride-pulse"></span>
                    <strong>${isDelivery ? '🛵 طلبك قيد التوصيل الآن' : `🚖 الكابتن ${captain.name} في الطريق إليك`}</strong>
                    <span class="active-ride-pin">رمز الأمان PIN: <b>${pinCode}</b></span>
                </div>
                <div class="active-ride-details">
                    <span>🚗 ${captain.car} (${captain.plate})</span>
                    <span>⭐ ${captain.rating}</span>
                    <span>📍 الوجهة: ${this.destinationPlace?.name || 'موقعي'}</span>
                    <span>💵 ${quote ? quote.formattedFare : 'دفع عند الاستلام'}</span>
                    <button type="button" class="active-ride-cancel-btn" id="cancelActiveRideBtn">إنهاء المتابعة ✕</button>
                </div>
            `;
            const cancelBtn = bar.querySelector('#cancelActiveRideBtn');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => this.stopLiveTracking());
            }
        }

        // Animate moving vehicle on the Leaflet map
        const mapEngine = this.getMapEngine();
        const L = window.L;
        if (!mapEngine || !mapEngine.map || !L) return;

        if (this.activeRideMarker) {
            mapEngine.map.removeLayer(this.activeRideMarker);
            this.activeRideMarker = null;
        }
        if (this.activeRideTimer) {
            clearInterval(this.activeRideTimer);
        }

        const userPos = this.getUserCoords();
        const destPos = this.destinationPlace || { lat: userPos.lat + 0.01, lng: userPos.lng + 0.01 };

        const startLat = isDelivery ? destPos.lat : (userPos.lat + (destPos.lat - userPos.lat) * 0.25);
        const startLng = isDelivery ? destPos.lng : (userPos.lng + (destPos.lng - userPos.lng) * 0.25);
        const endLat = isDelivery ? userPos.lat : destPos.lat;
        const endLng = isDelivery ? userPos.lng : destPos.lng;

        const iconHtml = `
            <div class="socialmap-moving-taxi-marker">
                <span>${isDelivery ? '🛵' : '🚖'}</span>
            </div>
        `;
        const icon = L.divIcon({
            className: 'socialmap-taxi-div-icon',
            html: iconHtml,
            iconSize: [42, 42],
            iconAnchor: [21, 21]
        });

        this.activeRideMarker = L.marker([startLat, startLng], { icon, zIndexOffset: 1500 }).addTo(mapEngine.map);

        let step = 0;
        const totalSteps = 140;
        this.activeRideTimer = setInterval(() => {
            step = (step + 1) % (totalSteps + 1);
            const t = step / totalSteps;
            const curLat = startLat + (endLat - startLat) * t;
            const curLng = startLng + (endLng - startLng) * t;
            if (this.activeRideMarker) {
                this.activeRideMarker.setLatLng([curLat, curLng]);
            }
        }, 250);
    }

    stopLiveTracking() {
        if (this.activeRideTimer) {
            clearInterval(this.activeRideTimer);
            this.activeRideTimer = null;
        }
        const mapEngine = this.getMapEngine();
        if (this.activeRideMarker && mapEngine?.map) {
            mapEngine.map.removeLayer(this.activeRideMarker);
            this.activeRideMarker = null;
        }
        const bar = document.getElementById('socialmapActiveRideBar');
        if (bar) bar.classList.add('hidden');
    }

    closeDrawer() {
        const drawer = document.getElementById('socialmapTaxiDrawer');
        if (drawer) drawer.classList.add('hidden');
    }
}

/**
 * ============================================================================
 * 5. UniversalPlaceHubController (Unified Action Hub for Any Map Pin / Place)
 * ============================================================================
 */
export class UniversalPlaceHubController {
    constructor(options = {}) {
        this.onRequestTaxi = options.onRequestTaxi || null;
        this.onOpenCommerce = options.onOpenCommerce || null;
        this.onOpenLiveCam = options.onOpenLiveCam || null;
        this.onOpenRich3D = options.onOpenRich3D || null;
        this.onOpenCityRT3D = options.onOpenCityRT3D || null;
        this.onNavigateRoute = options.onNavigateRoute || null;
        this.getUserCoords = options.getUserCoords || (() => ({ lat: 33.3152, lng: 44.3661 }));

        this.currentPlace = null;
    }

    openForPlace(place) {
        if (!place) return;
        this.currentPlace = place;

        const catalog = resolvePlaceMenuCatalog(place);
        const cameras = resolvePlaceLiveCameras(place);
        const userPos = this.getUserCoords();
        const distKm = computeDistanceKm(userPos.lat, userPos.lng, place.lat, place.lng);
        const quotes = calculateIraqRideQuotes(distKm, Math.max(4, Math.round(distKm * 2)));
        const minFare = quotes[0]?.formattedFare || '3,000 د.ع';

        const hubEl = document.getElementById('socialmapPlaceHubSheet');
        if (!hubEl) return;
        hubEl.classList.remove('hidden');
        hubEl.setAttribute('aria-hidden', 'false');

        const firstItem = catalog.items?.[0] || {
            name: place.name,
            photo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
            modelType: 'building_3d'
        };

        hubEl.innerHTML = `
            <div class="place-hub-card">
                <button type="button" class="place-hub-close-btn" id="placeHubCloseBtn" title="إغلاق">✕</button>
                <div class="place-hub-media-banner">
                    <img src="${firstItem.photo}" alt="${place.name}" class="place-hub-hero-img" />
                    <div class="place-hub-media-badges">
                        <button type="button" class="hub-media-pill live" id="hubQuickLiveBtn">
                            🔴 بث مباشر (${cameras.length} كاميرات)
                        </button>
                        <button type="button" class="hub-media-pill view3d" id="hubQuick3DBtn">
                            🧊 مجسم 3D وصور وفيديو
                        </button>
                    </div>
                </div>

                <div class="place-hub-content">
                    <div class="place-hub-header-row">
                        <span class="place-hub-cat-badge">${catalog.badgeAr}</span>
                        <span class="place-hub-dist-badge">📏 يبعد ${distKm.toFixed(1)} كم</span>
                        <span class="place-hub-rating-badge">⭐ ${catalog.rating}</span>
                    </div>
                    <h3 class="place-hub-title">${place.name}</h3>
                    <p class="place-hub-address">📍 ${place.address || place.city || 'العراق'}</p>

                    <div class="place-hub-actions-grid">
                        <button type="button" class="hub-action-btn taxi" id="hubActionTaxiBtn">
                            <span class="hub-btn-icon">🚖</span>
                            <div class="hub-btn-text">
                                <strong>اطلب سيارة أجرة لهنا</strong>
                                <small>يبدأ من ${minFare}</small>
                            </div>
                        </button>

                        <button type="button" class="hub-action-btn shop" id="hubActionShopBtn">
                            <span class="hub-btn-icon">🛍️</span>
                            <div class="hub-btn-text">
                                <strong>${catalog.actionLabelAr}</strong>
                                <small>${catalog.items?.length || 6} خيارات متاحة</small>
                            </div>
                        </button>

                        <button type="button" class="hub-action-btn livecam" id="hubActionLiveCamBtn">
                            <span class="hub-btn-icon">🔴</span>
                            <div class="hub-btn-text">
                                <strong>مشاهدة البث المباشر</strong>
                                <small>${cameras[0]?.crowdText || '🟢 هادئ الآن'}</small>
                            </div>
                        </button>

                        <button type="button" class="hub-action-btn stage3d" id="hubActionStage3DBtn">
                            <span class="hub-btn-icon">🧊</span>
                            <div class="hub-btn-text">
                                <strong>عرض 3D / صور / فيديو</strong>
                                <small>معاينة تفاعلية 360°</small>
                            </div>
                        </button>
                    </div>

                    <div class="place-hub-secondary-row">
                        <button type="button" class="hub-sec-btn cityrt" id="hubActionCityRTBtn" title="وضع التجول الحي">
                            🎮
                        </button>
                        <button type="button" class="hub-sec-btn nav" id="hubActionNavBtn">
                            🧭 رسم مسار الملاحة
                        </button>
                    </div>
                </div>
            </div>
        `;

        hubEl.querySelector('#placeHubCloseBtn')?.addEventListener('click', () => this.close());
        hubEl.querySelector('#hubActionTaxiBtn')?.addEventListener('click', () => {
            if (typeof this.onRequestTaxi === 'function') this.onRequestTaxi(place);
        });
        hubEl.querySelector('#hubActionShopBtn')?.addEventListener('click', () => {
            if (typeof this.onOpenCommerce === 'function') this.onOpenCommerce(place);
        });
        hubEl.querySelector('#hubActionLiveCamBtn')?.addEventListener('click', () => {
            if (typeof this.onOpenLiveCam === 'function') this.onOpenLiveCam(place);
        });
        hubEl.querySelector('#hubQuickLiveBtn')?.addEventListener('click', () => {
            if (typeof this.onOpenLiveCam === 'function') this.onOpenLiveCam(place);
        });
        hubEl.querySelector('#hubActionStage3DBtn')?.addEventListener('click', () => {
            if (typeof this.onOpenRich3D === 'function') this.onOpenRich3D(firstItem, place, '3d');
        });
        hubEl.querySelector('#hubQuick3DBtn')?.addEventListener('click', () => {
            if (typeof this.onOpenRich3D === 'function') this.onOpenRich3D(firstItem, place, '3d');
        });
        hubEl.querySelector('#hubActionCityRT3DBtn, #hubActionCityRTBtn')?.addEventListener('click', () => {
            if (typeof this.onOpenCityRT3D === 'function') this.onOpenCityRT3D(place);
        });
        hubEl.querySelector('#hubActionNavBtn')?.addEventListener('click', () => {
            this.close();
            if (typeof this.onNavigateRoute === 'function') this.onNavigateRoute(place);
        });
    }

    close() {
        const hubEl = document.getElementById('socialmapPlaceHubSheet');
        if (hubEl) {
            hubEl.classList.add('hidden');
            hubEl.setAttribute('aria-hidden', 'true');
        }
    }
}

