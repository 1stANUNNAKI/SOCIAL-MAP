import * as THREE from 'three';

/**
 * 24-Hour Keyframed Lighting, Sky, Fog, Weather & NPR Pencil-Hatching Shader Engine
 * Modeled after CityRT's `looks-Bnp5BQTW.js`, `lens-9Duff1Tm.js`, and `settings-VRlP1rEA.js`
 */
export const SKETCH_PRESETS = {
  sketch: {
    id: 'sketch',
    name: 'الرسم الهندسي بالقلم (Clean Sketch)',
    hatchStrength: 0.42,
    paperGrain: 0.25,
    inkOutline: 0.45
  },
  inkwash: {
    id: 'inkwash',
    name: 'الحبر الصيني والغسيل (Ink & Wash)',
    hatchStrength: 0.15,
    paperGrain: 0.38,
    inkOutline: 0.72
  },
  pencil: {
    id: 'pencil',
    name: 'القلم الرصاص الناعم (Soft Pencil)',
    hatchStrength: 0.68,
    paperGrain: 0.45,
    inkOutline: 0.3
  },
  vivid: {
    id: 'vivid',
    name: 'الألوان المعمارية الحية (Vivid Color)',
    hatchStrength: 0.0,
    paperGrain: 0.05,
    inkOutline: 0.0
  }
};

export class AtmosphereAndSketchEngine {
  constructor(scene) {
    this.scene = scene;
    this.hour = 10.5; // Default morning-day golden angle
    this.weatherMode = 'clear'; // 'clear' | 'rain' | 'snow' | 'sakura'
    this.sketchPreset = 'sketch';

    this.shaderUniforms = {
      uHatchStrength: { value: 0.42 },
      uPaperGrain: { value: 0.25 },
      uTime: { value: 0.0 }
    };

    this.initLightsAndSky();
    this.initWeatherParticles();
  }

  initLightsAndSky() {
    // Directional Sun / Moon light with stable shadow frustum
    this.sunLight = new THREE.DirectionalLight(0xfff4d8, 2.2);
    this.sunLight.position.set(95, 130, 80);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    const d = 165;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 420;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);

    // Warm sky / ground hemisphere light
    this.hemiLight = new THREE.HemisphereLight(0xdcebf7, 0x8c7b65, 0.95);
    this.scene.add(this.hemiLight);

    // Atmospheric distance fog
    this.scene.fog = new THREE.FogExp2(0xe8dfc8, 0.0024);
    this.scene.background = new THREE.Color(0xe8dfc8);

    // Visible Sun / Moon Disc in the sky
    const sunGeo = new THREE.SphereGeometry(9.5, 16, 16);
    this.sunDiscMat = new THREE.MeshBasicMaterial({ color: 0xfffae0 });
    this.sunDisc = new THREE.Mesh(sunGeo, this.sunDiscMat);
    this.scene.add(this.sunDisc);

    // Drifting low-poly stylized clouds ring
    this.cloudsGroup = new THREE.Group();
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xf7f3ea,
      roughness: 0.95,
      transparent: true,
      opacity: 0.86
    });
    this.cloudMaterial = cloudMat;

    for (let i = 0; i < 18; i++) {
      const cCluster = new THREE.Group();
      const angle = (i / 18) * Math.PI * 2;
      const dist = 70 + (i % 3) * 45;
      cCluster.position.set(Math.cos(angle) * dist, 58 + (i % 4) * 8, Math.sin(angle) * dist);

      for (let p = 0; p < 4; p++) {
        const puff = new THREE.Mesh(
          new THREE.DodecahedronGeometry(4.5 + (p % 2) * 2.2, 1),
          cloudMat
        );
        puff.scale.set(1.5, 0.55, 1.1);
        puff.position.set((p - 1.5) * 3.8, (p % 2) * 0.8, (p % 3 - 1) * 1.5);
        cCluster.add(puff);
      }
      this.cloudsGroup.add(cCluster);
    }
    this.scene.add(this.cloudsGroup);
  }

  /**
   * Injects CityRT-style Shadow Pencil Hatching (`Штриховка в тени`) & Paper Grain into scene materials
   */
  applySketchShaderToScene(rootGroup) {
    rootGroup.traverse((obj) => {
      if (!obj.isMesh || !obj.material) return;
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const mat of mats) {
        if (mat.userData.sketchHooked || mat.userData.isSign) continue;
        mat.userData.sketchHooked = true;

        mat.onBeforeCompile = (shader) => {
          shader.uniforms.uHatchStrength = this.shaderUniforms.uHatchStrength;
          shader.uniforms.uPaperGrain = this.shaderUniforms.uPaperGrain;

          shader.vertexShader = shader.vertexShader.replace(
            '#include <common>',
            `#include <common>
            varying vec3 vWorldPosSketch;`
          );
          shader.vertexShader = shader.vertexShader.replace(
            '#include <worldpos_vertex>',
            `#include <worldpos_vertex>
            vWorldPosSketch = (modelMatrix * vec4(transformed, 1.0)).xyz;`
          );

          shader.fragmentShader = shader.fragmentShader.replace(
            '#include <common>',
            `#include <common>
            uniform float uHatchStrength;
            uniform float uPaperGrain;
            varying vec3 vWorldPosSketch;
            float sketchHash(vec2 p) {
              return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
            }`
          );

          shader.fragmentShader = shader.fragmentShader.replace(
            '#include <dithering_fragment>',
            `#include <dithering_fragment>
            // Compute luminance for shadow-side pencil hatching
            float lum = dot(gl_FragColor.rgb, vec3(0.299, 0.587, 0.114));
            float shadowMask = smoothstep(0.62, 0.18, lum);

            // Diagonal primary hatching + secondary cross-hatching in deep shadows
            float coord1 = (gl_FragCoord.x + gl_FragCoord.y) * 0.85;
            float coord2 = (gl_FragCoord.x - gl_FragCoord.y) * 0.85;
            float line1 = step(0.45, fract(coord1 * 0.18));
            float line2 = step(0.55, fract(coord2 * 0.18));

            float hatch = mix(1.0, line1, shadowMask * uHatchStrength);
            float deepShadow = smoothstep(0.36, 0.10, lum);
            hatch *= mix(1.0, line2, deepShadow * uHatchStrength * 0.75);

            // Subtle architectural paper grain
            float grain = (sketchHash(floor(gl_FragCoord.xy * 0.5)) - 0.5) * 0.08 * uPaperGrain;
            gl_FragColor.rgb = gl_FragColor.rgb * hatch + grain;`
          );
        };
        mat.needsUpdate = true;
      }
    });
  }

  setSketchPreset(presetKey) {
    const p = SKETCH_PRESETS[presetKey] || SKETCH_PRESETS.sketch;
    this.sketchPreset = p.id;
    this.shaderUniforms.uHatchStrength.value = p.hatchStrength;
    this.shaderUniforms.uPaperGrain.value = p.paperGrain;
  }

  initWeatherParticles() {
    this.particleCount = 1400;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particleCount * 3);
    for (let i = 0; i < this.particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 260;
      positions[i * 3 + 1] = Math.random() * 85;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 260;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    this.weatherMat = new THREE.PointsMaterial({
      color: 0xdcebf7,
      size: 0.65,
      transparent: true,
      opacity: 0.0
    });

    this.weatherPoints = new THREE.Points(geo, this.weatherMat);
    this.scene.add(this.weatherPoints);
  }

  setWeather(mode) {
    this.weatherMode = mode;
    if (mode === 'clear') {
      this.weatherMat.opacity = 0.0;
    } else if (mode === 'rain') {
      this.weatherMat.color.setHex(0xa8c8e8);
      this.weatherMat.size = 0.55;
      this.weatherMat.opacity = 0.65;
    } else if (mode === 'snow') {
      this.weatherMat.color.setHex(0xffffff);
      this.weatherMat.size = 0.95;
      this.weatherMat.opacity = 0.85;
    } else if (mode === 'sakura') {
      this.weatherMat.color.setHex(0xffb3c6);
      this.weatherMat.size = 0.9;
      this.weatherMat.opacity = 0.85;
    }
  }

  /**
   * Updates 24-hour sun orbit, sky/fog keyframes, clouds, and weather particles
   */
  update(dt, timeSec) {
    this.shaderUniforms.uTime.value = timeSec;
    this.cloudsGroup.rotation.y = timeSec * 0.012;

    // Normalize hour [0..24]
    const h = ((this.hour % 24) + 24) % 24;

    // Compute solar elevation angle: sunrise at 6:00, zenith at 12:00, sunset at 18:00
    const sunAngle = ((h - 6) / 24) * Math.PI * 2;
    const sunY = Math.sin(sunAngle);
    const sunXZ = Math.cos(sunAngle);

    const orbitRadius = 185;
    const lx = sunXZ * orbitRadius * 0.85;
    const ly = Math.max(18, Math.abs(sunY) * orbitRadius);
    const lz = 65 + Math.sin(sunAngle * 0.5) * 55;

    this.sunLight.position.set(lx, ly, lz);
    this.sunDisc.position.set(sunXZ * 210, sunY * 165, -90);

    // 4 Keyframed Atmosphere Palettes (`morning`, `day`, `evening`, `night` from `looks-Bnp5BQTW.js`)
    const cSky = new THREE.Color();
    const cSun = new THREE.Color();
    const cHemiSky = new THREE.Color();
    const cHemiGround = new THREE.Color();
    let sunIntensity = 2.0;
    let hemiIntensity = 0.9;

    if (h >= 5 && h < 8.5) {
      // Morning Golden Sunrise
      const t = (h - 5) / 3.5;
      cSky.setHex(0x28354a).lerp(new THREE.Color(0xf2dec4), t);
      cSun.setHex(0xff9e5e).lerp(new THREE.Color(0xfff1cf), t);
      cHemiSky.setHex(0x6c7d99).lerp(new THREE.Color(0xe6dcc8), t);
      cHemiGround.setHex(0x302b28).lerp(new THREE.Color(0x8c7b65), t);
      sunIntensity = 0.6 + t * 1.6;
      hemiIntensity = 0.45 + t * 0.5;
    } else if (h >= 8.5 && h < 16.5) {
      // Crisp Architectural Daylight (`#ECE4D2` warm paper sky)
      cSky.setHex(0xebe3d0);
      cSun.setHex(0xfff5db);
      cHemiSky.setHex(0xdceaf7);
      cHemiGround.setHex(0x8f7e68);
      sunIntensity = 2.25;
      hemiIntensity = 0.95;
    } else if (h >= 16.5 && h < 20.0) {
      // Sunset / Evening Dusk (`evening` warm amber & violet)
      const t = (h - 16.5) / 3.5;
      cSky.setHex(0xebe3d0).lerp(new THREE.Color(0xd98a6c), Math.sin(t * Math.PI)).lerp(new THREE.Color(0x1c2536), t);
      cSun.setHex(0xfff5db).lerp(new THREE.Color(0xff6b3d), t);
      cHemiSky.setHex(0xdceaf7).lerp(new THREE.Color(0x4a3b5c), t);
      cHemiGround.setHex(0x8f7e68).lerp(new THREE.Color(0x262024), t);
      sunIntensity = 2.25 * (1 - t * 0.78);
      hemiIntensity = 0.95 - t * 0.5;
    } else {
      // Night (`night` deep indigo & moonlight)
      cSky.setHex(0x161f2e);
      cSun.setHex(0x7fa6d6);
      cHemiSky.setHex(0x2b3b54);
      cHemiGround.setHex(0x1c1817);
      sunIntensity = 0.48;
      hemiIntensity = 0.42;
    }

    this.scene.background.copy(cSky);
    this.scene.fog.color.copy(cSky);
    this.sunLight.color.copy(cSun);
    this.sunLight.intensity = sunIntensity;
    this.hemiLight.color.copy(cHemiSky);
    this.hemiLight.groundColor.copy(cHemiGround);
    this.hemiLight.intensity = hemiIntensity;
    this.sunDiscMat.color.copy(cSun);
    this.cloudMaterial.color.copy(cSky).lerp(new THREE.Color(0xffffff), 0.55);

    // Update Weather Particles
    if (this.weatherMode !== 'clear') {
      const pos = this.weatherPoints.geometry.attributes.position;
      const fallSpeed = this.weatherMode === 'rain' ? 42.0 : this.weatherMode === 'snow' ? 7.5 : 5.2;
      const driftX = this.weatherMode === 'sakura' ? 5.5 : 2.0;

      for (let i = 0; i < this.particleCount; i++) {
        let x = pos.getX(i) + Math.sin(timeSec + i) * driftX * dt;
        let y = pos.getY(i) - fallSpeed * dt;
        let z = pos.getZ(i) + Math.cos(timeSec * 0.8 + i) * 1.5 * dt;
        if (y < 0) {
          y = 82;
          x = (Math.random() - 0.5) * 260;
          z = (Math.random() - 0.5) * 260;
        }
        pos.setXYZ(i, x, y, z);
      }
      pos.needsUpdate = true;
    }
  }
}

