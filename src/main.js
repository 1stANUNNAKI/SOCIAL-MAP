import * as THREE from 'three';
import { CityTerrainSDF } from './terrain/sdfTerrain.js';
import { DynamicSignGenerator } from './rendering/signAtlas.js';
import { ProceduralCityBuilder } from './buildings/proceduralBuildings.js';
import { InstancedFoliageSystem } from './nature/foliageAndWater.js';
import { TrafficAndCitizensManager } from './simulation/trafficAndCitizens.js';
import { AtmosphereAndSketchEngine } from './rendering/sketchAtmosphere.js';
import { CityNavigationController } from './controls/navigationController.js';
import { ProceduralAudioSynth } from './audio/proceduralAudio.js';

class CityRTPrototypeApp {
  constructor() {
    this.canvas = document.getElementById('city-canvas');
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      48,
      window.innerWidth / window.innerHeight,
      0.25,
      650
    );

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    // Cap pixel ratio at 2x following `threejs-webgl-mastery`
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.currentBiome = 'meadow';
    this.autoTimeCycle = false;

    this.initSubsystems();
    this.bindUIControls();
    this.bindResize();

    this.clock = new THREE.Clock();
    this.elapsedTime = 0;
    this.animate = this.animate.bind(this);
    this.frameId = requestAnimationFrame(this.animate);
  }

  initSubsystems() {
    // 1. Audio Synthesizer (Web Audio API)
    this.audio = new ProceduralAudioSynth();

    // 2. Continuous SDF Terrain, Meandering Catmull-Rom River, & 5 Arched Bridges
    this.terrain = new CityTerrainSDF(360);
    this.terrainGroup = this.terrain.createTerrainGroup(this.currentBiome);
    this.scene.add(this.terrainGroup);

    // 3. Dynamic 2D-to-3D Signboard Atlas (Arabic, European, Japanese, Metropolis)
    this.signGen = new DynamicSignGenerator();

    // 4. Procedural Buildings across 4 Architectural Districts + Central Plaza Fountain
    this.cityBuilder = new ProceduralCityBuilder(this.terrain, this.signGen);
    this.cityGroup = this.cityBuilder.buildCity();
    this.scene.add(this.cityGroup);

    // 5. Instanced Foliage & Trees (~420 trees via InstancedMesh)
    this.foliage = new InstancedFoliageSystem(this.terrain, this.cityBuilder.buildings);
    this.foliageGroup = this.foliage.buildFoliage(this.currentBiome);
    this.scene.add(this.foliageGroup);

    // 6. Traffic Vehicles, River Boats, Cyberpunk Hovercars & Strolling Pedestrians
    this.traffic = new TrafficAndCitizensManager(this.terrain);
    this.trafficGroup = this.traffic.buildSimulation();
    this.scene.add(this.trafficGroup);

    // 7. 24-Hour Atmosphere, Weather Particles & Custom GLSL Shadow-Hatching Shader
    this.atmosphere = new AtmosphereAndSketchEngine(this.scene);
    this.atmosphere.applySketchShaderToScene(this.terrainGroup);
    this.atmosphere.applySketchShaderToScene(this.cityGroup);
    this.atmosphere.applySketchShaderToScene(this.foliageGroup);
    this.atmosphere.applySketchShaderToScene(this.trafficGroup);

    // 8. 3-Mode Player & Camera Navigation Controller (Orbit, Walk `G`, Drive `E`)
    this.nav = new CityNavigationController(
      this.camera,
      this.canvas,
      this.scene,
      this.terrain,
      this.cityBuilder,
      this.traffic,
      this.audio,
      (state) => this.updateNavigationHUD(state)
    );
  }

  bindUIControls() {
    const btnOrbit = document.getElementById('btn-mode-orbit');
    const btnWalk = document.getElementById('btn-mode-walk');
    const btnDrive = document.getElementById('btn-mode-drive');
    const btnView = document.getElementById('btn-camera-view');

    btnOrbit?.addEventListener('click', () => this.nav.setMode('orbit'));
    btnWalk?.addEventListener('click', () => this.nav.setMode('walk'));
    btnDrive?.addEventListener('click', () => this.nav.setMode('drive'));
    btnView?.addEventListener('click', () => {
      if (this.nav.mode === 'walk') {
        this.nav.thirdPerson = !this.nav.thirdPerson;
        this.nav.avatar.visible = this.nav.thirdPerson;
      } else if (this.nav.mode === 'drive') {
        this.nav.driveChaseCam = !this.nav.driveChaseCam;
      } else {
        this.nav.setMode('walk');
      }
      this.nav.notifyUI();
    });

    // District quick-fly buttons
    document.querySelectorAll('[data-fly]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const [x, z, dist, yaw] = btn.getAttribute('data-fly').split(',').map(Number);
        this.nav.flyToLocation(x, z, dist, yaw);
      });
    });

    // Time of Day slider & auto-cycle button
    const timeSlider = document.getElementById('time-slider');
    const btnTimeAuto = document.getElementById('btn-time-auto');
    timeSlider?.addEventListener('input', (e) => {
      this.atmosphere.hour = parseFloat(e.target.value);
      this.updateClockReadout();
    });

    btnTimeAuto?.addEventListener('click', () => {
      this.autoTimeCycle = !this.autoTimeCycle;
      btnTimeAuto.classList.toggle('active', this.autoTimeCycle);
    });

    // Biome selector
    const biomeSelect = document.getElementById('biome-select');
    biomeSelect?.addEventListener('change', (e) => {
      this.currentBiome = e.target.value;
      this.terrain.applyBiomeColors(this.currentBiome);
      this.foliage.applyBiomeFoliageColors(this.currentBiome);
    });

    // Weather selector
    const weatherSelect = document.getElementById('weather-select');
    weatherSelect?.addEventListener('change', (e) => {
      this.atmosphere.setWeather(e.target.value);
    });

    // Sketch shader preset selector
    const sketchSelect = document.getElementById('sketch-select');
    sketchSelect?.addEventListener('change', (e) => {
      this.atmosphere.setSketchPreset(e.target.value);
    });

    // Toggle HUD visibility (`Tab` key or button)
    const hudLayer = document.getElementById('hud-layer');
    const toggleHudBtn = document.getElementById('toggle-hud-btn');
    const toggleHud = () => {
      hudLayer?.classList.toggle('hidden');
    };
    toggleHudBtn?.addEventListener('click', toggleHud);
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Tab') {
        e.preventDefault();
        toggleHud();
      }
    });
  }

  updateClockReadout() {
    const clockEl = document.getElementById('clock-readout');
    if (!clockEl) return;
    const h = ((this.atmosphere.hour % 24) + 24) % 24;
    const hh = String(Math.floor(h)).padStart(2, '0');
    const mm = String(Math.floor((h % 1) * 60)).padStart(2, '0');
    const phase =
      h >= 5 && h < 9
        ? 'الشروق الذهبي'
        : h >= 9 && h < 16.5
          ? 'النهار الساطع'
          : h >= 16.5 && h < 20
            ? 'الغروب والمساء'
            : 'الليل وأضواء المدينة';
    clockEl.textContent = `الساعة ${hh}:${mm} (${phase}) · ${this.cityBuilder.buildings.length} مبنى ومعلم · ${this.traffic.vehicles.length} مركبة · ${this.traffic.pedestrians.length} من المشاة`;
  }

  updateNavigationHUD(state) {
    const btnOrbit = document.getElementById('btn-mode-orbit');
    const btnWalk = document.getElementById('btn-mode-walk');
    const btnDrive = document.getElementById('btn-mode-drive');
    const lblView = document.getElementById('lbl-camera-view');
    const banner = document.getElementById('status-banner');

    btnOrbit?.classList.toggle('active', state.mode === 'orbit');
    btnWalk?.classList.toggle('active', state.mode === 'walk');
    btnDrive?.classList.toggle('active', state.mode === 'drive');

    if (lblView) {
      if (state.mode === 'walk') {
        lblView.textContent = state.thirdPerson ? 'منظور: خلف الكتف' : 'منظور: الشخص الأول';
      } else if (state.mode === 'drive') {
        lblView.textContent = state.driveChaseCam ? 'كاميرا: تتبع السيارة' : 'كاميرا: مقعد السائق';
      } else {
        lblView.textContent = 'منظور المشي (V)';
      }
    }

    if (!banner) return;
    if (state.mode === 'orbit') {
      const bText = state.building ? ` · التركيز الحالي: ${state.building.name}` : '';
      banner.innerHTML = `طور التحليق الحر: <kbd>WASD</kbd> للتحريك · <kbd>RMB</kbd> أو <kbd>Q/E</kbd> للدوران · عجلة الفأرة للتقريب · نقر مزدوج على أي مبنى للتركيز · <kbd>G</kbd> للنزول للشارع${bText}`;
    } else if (state.mode === 'walk') {
      banner.innerHTML = `طور التجول الميداني على الأقدام: <kbd>WASD</kbd> للمشي (<kbd>Shift</kbd> للجري) · <kbd>Space</kbd> للقفز · <kbd>C</kbd> للانحناء · <kbd>V</kbd> لتبديل المنظور · <kbd>E</kbd> لركوب سيارة · <kbd>Esc</kbd> للعودة للخريطة`;
    } else if (state.mode === 'drive') {
      banner.innerHTML = `طور قيادة السيارة (${state.speedKmh} كم/س): <kbd>W/S</kbd> وقود ومكابح · <kbd>A/D</kbd> توجيه المقود · <kbd>Space</kbd> مكابح يدوية · <kbd>H</kbd> بوق السيارة · <kbd>V</kbd> تبديل الكاميرا · <kbd>E</kbd> للنزول`;
    }
  }

  bindResize() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  animate() {
    const dt = this.clock.getDelta();
    this.elapsedTime += dt;

    if (this.autoTimeCycle) {
      // In walk mode time runs 4x slower just like CityRT (`Пока гуляешь, часы идут вчетверо медленнее`)
      const rate = this.nav.mode === 'walk' ? 0.12 : 0.45;
      this.atmosphere.hour = (this.atmosphere.hour + dt * rate) % 24;
      const slider = document.getElementById('time-slider');
      if (slider) slider.value = this.atmosphere.hour.toFixed(1);
    }

    this.updateClockReadout();
    this.terrain.updateWaterColors(this.currentBiome, this.elapsedTime);
    this.cityBuilder.update(this.elapsedTime, this.atmosphere.hour);
    this.traffic.update(dt, this.elapsedTime, this.atmosphere.hour);
    this.atmosphere.update(dt, this.elapsedTime);
    this.nav.update(dt, this.elapsedTime);

    this.renderer.render(this.scene, this.camera);
    this.frameId = requestAnimationFrame(this.animate);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.__cityApp = new CityRTPrototypeApp();
});

