import * as THREE from 'three';

/**
 * 10 Biomes / Skins directly modeled after CityRT's `_skins-p9RZO2__.js`
 */
export const BIOME_SKINS = {
  meadow: {
    id: 'meadow',
    name: 'المروج الخضراء (Meadow)',
    land: [0x9eb872, 0x8ca862, 0x7c9854, 0x6c8848],
    beach: 0xd8cba8,
    shallow: 0x6fa8b8,
    deep: 0x3b6e8c,
    foam: 0xeef6f8,
    road: 0x48423e,
    sidewalk: 0xcfc7b8,
    desirePath: 0xb59e7a,
    foliage: [0x5a8f48, 0x6ea352, 0x487838, 0x82b366]
  },
  autumn: {
    id: 'autumn',
    name: 'الخريف الذهبي (Autumn)',
    land: [0xc4a468, 0xb59256, 0x9e7c46, 0x8a6838],
    beach: 0xd6c29e,
    shallow: 0x6296a8,
    deep: 0x2f5c78,
    foam: 0xeae4d8,
    road: 0x453e3a,
    sidewalk: 0xc9bfb0,
    desirePath: 0xa68963,
    foliage: [0xd97236, 0xe6a13c, 0xb8462a, 0x8c9640]
  },
  sakura: {
    id: 'sakura',
    name: 'ربيع الساكورا (Sakura)',
    land: [0x9ec27e, 0x8cb06c, 0x7a9e5c, 0x688c4c],
    beach: 0xe2d6be,
    shallow: 0x78b4c4,
    deep: 0x467e99,
    foam: 0xf7f2f4,
    road: 0x4a4442,
    sidewalk: 0xd8d0c5,
    desirePath: 0xbfa88a,
    foliage: [0xf29bb2, 0xf7b7c8, 0x6ca358, 0xe87a98]
  },
  desert: {
    id: 'desert',
    name: 'الصحراء العربية (Desert)',
    land: [0xdcc294, 0xcfb280, 0xbfa06c, 0xad8e5a],
    beach: 0xe8d5b0,
    shallow: 0x5ab0b8,
    deep: 0x2b7685,
    foam: 0xf4efe4,
    road: 0x544b42,
    sidewalk: 0xd9c8ab,
    desirePath: 0xc2a374,
    foliage: [0x789456, 0x8fa668, 0x637d44, 0xa3b072]
  },
  tundra: {
    id: 'tundra',
    name: 'التندرا القطبية (Tundra)',
    land: [0xe6ecf0, 0xd5dfe6, 0xc2cfd9, 0xaebec9],
    beach: 0xc8cfd4,
    shallow: 0x6892ab,
    deep: 0x2c4e66,
    foam: 0xffffff,
    road: 0x4e5459,
    sidewalk: 0xd5dce0,
    desirePath: 0x9aa6b0,
    foliage: [0x4c6b58, 0x62826e, 0xdce6ed, 0x3b5746]
  },
  tropics: {
    id: 'tropics',
    name: 'الجزر الاستوائية (Tropics)',
    land: [0x78b056, 0x669e46, 0x548c36, 0x447828],
    beach: 0xf0e2be,
    shallow: 0x4ad4d4,
    deep: 0x1a7a99,
    foam: 0xf2ffff,
    road: 0x46423e,
    sidewalk: 0xd6cfc2,
    desirePath: 0xba9f78,
    foliage: [0x3ca342, 0x54bf56, 0x2c8532, 0x76cf62]
  },
  mars: {
    id: 'mars',
    name: 'كوكب المريخ (Mars)',
    land: [0xc46b4b, 0xb0583b, 0x99472c, 0x803720],
    beach: 0xd48566,
    shallow: 0x70584c,
    deep: 0x4a3830,
    foam: 0xe6b8a2,
    road: 0x3d2d28,
    sidewalk: 0xa66b56,
    desirePath: 0x8c4f3a,
    foliage: [0x8c7a5b, 0xa38e6c, 0x6e5e46, 0xb89f78]
  },
  blueprint: {
    id: 'blueprint',
    name: 'المخطط الهندسي (Blueprint)',
    land: [0x234975, 0x1e4068, 0x19375b, 0x152e4d],
    beach: 0x336296,
    shallow: 0x163252,
    deep: 0x0e2238,
    foam: 0x78b0e6,
    road: 0x122842,
    sidewalk: 0x2f5b8c,
    desirePath: 0x28507d,
    foliage: [0x3f75ad, 0x4d88c4, 0x2e5e91, 0x649ed6]
  }
};

/**
 * Polynomial smooth minimum (exact CityRT `_lib-C1cRAu0a.js` formula)
 */
export function smin(a, b, k) {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}

export function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

export function smoothstep(e0, e1, x) {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
}

/**
 * Deterministic 2D value + fractal noise
 */
export function hash2(x, z) {
  const n = Math.sin(x * 127.1 + z * 311.7) * 43758.5453123;
  return n - Math.floor(n);
}

export function noise2D(x, z) {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx);
  const uz = fz * fz * (3 - 2 * fz);

  const a = hash2(ix, iz);
  const b = hash2(ix + 1, iz);
  const c = hash2(ix, iz + 1);
  const d = hash2(ix + 1, iz + 1);

  return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
}

export function fbm(x, z) {
  return (
    0.55 * noise2D(x, z) +
    0.30 * noise2D(x * 2.03 + 17.3, z * 2.03 + 11.7) +
    0.15 * noise2D(x * 4.11 + 31.1, z * 4.11 + 23.9)
  );
}

/**
 * Catmull-Rom Spline with Spatial Hash Grid acceleration (50m cells)
 * Modeled after `catmull` and `polylineField` in `_lib-C1cRAu0a.js`
 */
function evalCatmullRom(pts, nSamples = 240) {
  const out = [];
  const k = pts.length - 1;
  for (let s = 0; s <= nSamples; s++) {
    const u = (s / nSamples) * k;
    const i = Math.min(k - 1, Math.floor(u));
    const f = u - i;
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(k, i + 2)];
    const f2 = f * f;
    const f3 = f2 * f;

    const x =
      0.5 *
      (2 * p1[0] +
        (-p0[0] + p2[0]) * f +
        (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * f2 +
        (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * f3);
    const z =
      0.5 *
      (2 * p1[1] +
        (-p0[1] + p2[1]) * f +
        (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * f2 +
        (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * f3);
    const w = p1[2] + (p2[2] - p1[2]) * f;
    out.push([x, z, w]);
  }
  return out;
}

export class CityTerrainSDF {
  constructor(worldSize = 360) {
    this.worldSize = worldSize;
    this.halfSize = worldSize / 2;

    // Meandering Catmull-Rom river control points [x, z, halfWidth]
    this.riverControlPoints = [
      [-210, -145, 15],
      [-130, -95, 14],
      [-55, -55, 15],
      [15, -35, 16],
      [85, -55, 15],
      [150, -20, 16],
      [215, 35, 18]
    ];

    this.riverSamples = evalCatmullRom(this.riverControlPoints, 220);
    this.buildSpatialHash();

    // Road Layout Coordinates (Avenues & Streets)
    this.roadsX = [-120, -60, 0, 60, 120];
    this.roadsZ = [-120, -75, 25, 85, 135];
    this.roadHalfWidth = 5.2;
    this.sidewalkWidth = 2.0;
  }

  buildSpatialHash() {
    this.cellSize = 40;
    this.segments = [];
    this.buckets = new Map();

    const pts = this.riverSamples;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const dx = b[0] - a[0];
      const dz = b[1] - a[1];
      const len2 = dx * dx + dz * dz || 1;
      const maxW = Math.max(a[2], b[2]) + 32;
      const segIdx = this.segments.length;
      this.segments.push({
        ax: a[0],
        az: a[1],
        aw: a[2],
        dx,
        dz,
        dw: b[2] - a[2],
        invL2: 1 / len2
      });

      const x0 = Math.floor((Math.min(a[0], b[0]) - maxW) / this.cellSize);
      const x1 = Math.floor((Math.max(a[0], b[0]) + maxW) / this.cellSize);
      const z0 = Math.floor((Math.min(a[1], b[1]) - maxW) / this.cellSize);
      const z1 = Math.floor((Math.max(a[1], b[1]) + maxW) / this.cellSize);

      for (let cx = x0; cx <= x1; cx++) {
        for (let cz = z0; cz <= z1; cz++) {
          const key = (cx << 16) ^ (cz & 0xffff);
          let arr = this.buckets.get(key);
          if (!arr) {
            arr = [];
            this.buckets.set(key, arr);
          }
          arr.push(segIdx);
        }
      }
    }
  }

  /**
   * Signed distance to the river & park lake (< 0 means inside water)
   */
  waterSDF(x, z) {
    const cx = Math.floor(x / this.cellSize);
    const cz = Math.floor(z / this.cellSize);
    const key = (cx << 16) ^ (cz & 0xffff);
    const bucket = this.buckets.get(key);

    let riverDist = 1e6;
    const list = bucket || null;

    if (list) {
      for (let k = 0; k < list.length; k++) {
        const s = this.segments[list[k]];
        let t = ((x - s.ax) * s.dx + (z - s.az) * s.dz) * s.invL2;
        t = clamp(t, 0, 1);
        const px = s.ax + s.dx * t;
        const pz = s.az + s.dz * t;
        const w = s.aw + s.dw * t;
        const d = Math.hypot(x - px, z - pz) - w;
        if (d < riverDist) riverDist = d;
      }
    } else {
      for (let k = 0; k < this.segments.length; k += 4) {
        const s = this.segments[k];
        const d = Math.hypot(x - s.ax, z - s.az) - s.aw;
        if (d < riverDist) riverDist = d;
      }
    }

    // Scenic Oasis/Park pond in the Southern Central Park block (x: [-45..45], z: [42..70])
    const lx = (x - 0) / 22;
    const lz = (z - 55) / 11;
    const lakeDist = (Math.hypot(lx, lz) - 1.0) * 14.0;

    return smin(riverDist, lakeDist, 8.0);
  }

  /**
   * Returns road state at (x, z):
   * { isRoad, isSidewalk, isCrosswalk, isBridge, distToRoadX, distToRoadZ }
   */
  getRoadState(x, z) {
    let minDx = 1e6;
    let minDz = 1e6;

    for (const rx of this.roadsX) {
      const d = Math.abs(x - rx);
      if (d < minDx) minDx = d;
    }
    for (const rz of this.roadsZ) {
      const d = Math.abs(z - rz);
      if (d < minDz) minDz = d;
    }

    const wWater = this.waterSDF(x, z);
    const rw = this.roadHalfWidth;
    const sw = rw + this.sidewalkWidth;

    // On water, only vertical N-S avenues (roadsX) form bridges across the river
    if (wWater < 1.5) {
      const onBridgeRoad = minDx <= rw;
      const onBridgeWalk = minDx > rw && minDx <= sw;
      return {
        isRoad: onBridgeRoad,
        isSidewalk: onBridgeWalk,
        isCrosswalk: false,
        isBridge: onBridgeRoad || onBridgeWalk,
        minDx,
        minDz
      };
    }

    const onX = minDx <= rw;
    const onZ = minDz <= rw;
    const isRoad = onX || onZ;

    const walkX = minDx <= sw;
    const walkZ = minDz <= sw;
    const isSidewalk = !isRoad && (walkX || walkZ);

    // Striped pedestrian crosswalks right at intersection approaches
    let isCrosswalk = false;
    if (isRoad && !(onX && onZ)) {
      if (onX && minDz > rw + 0.6 && minDz < rw + 3.2) {
        isCrosswalk = Math.floor((x + 500) * 1.6) % 2 === 0;
      } else if (onZ && minDx > rw + 0.6 && minDx < rw + 3.2) {
        isCrosswalk = Math.floor((z + 500) * 1.6) % 2 === 0;
      }
    }

    return { isRoad, isSidewalk, isCrosswalk, isBridge: false, minDx, minDz };
  }

  /**
   * Organic worn earth desire paths (`Протоптанная земля`) in parks & courtyards
   */
  isDesirePath(x, z) {
    const w = this.waterSDF(x, z);
    if (w < 3.5) return false;
    // Worn footpath looping around the central park lake & connecting districts
    const loopR = Math.hypot((x - 0) * 0.72, z - 55);
    const wobble = (fbm(x * 0.15, z * 0.15) - 0.5) * 2.2;
    if (Math.abs(loopR - 21.5 + wobble) < 1.45) return true;

    // Diagonal desire path across NE & NW park corners
    if (z > 28 && z < 82 && Math.abs(Math.abs(x) - (z - 15) * 0.65 + wobble) < 1.1) {
      return true;
    }
    return false;
  }

  /**
   * Compute height Y at (x, z)
   */
  getHeightAt(x, z) {
    const w = this.waterSDF(x, z);
    if (w < 0) {
      // Riverbed depth
      return Math.max(-2.6, w * 0.22);
    }
    // Gentle rolling hills on outer perimeter, flat buildable terraces in city blocks
    const bankSlope = smoothstep(0, 6.5, w);
    const edgeDist = Math.max(Math.abs(x), Math.abs(z));
    const hillFactor = smoothstep(125, 175, edgeDist);
    const hills = fbm(x * 0.018, z * 0.018) * 11.0 * hillFactor;
    const micro = (fbm(x * 0.05, z * 0.05) - 0.5) * 0.35 * (1 - hillFactor);

    const road = this.getRoadState(x, z);
    let baseH = bankSlope * 1.25 + hills + micro;
    if (road.isSidewalk && !road.isBridge) {
      baseH += 0.14;
    }
    return baseH;
  }

  /**
   * Returns surface height including bridge decks for walking/driving
   */
  getWalkableHeightAt(x, z) {
    const road = this.getRoadState(x, z);
    const w = this.waterSDF(x, z);
    if (road.isBridge && w < 4.5) {
      // Smooth arched bridge profile over the river
      const arch = clamp(1.0 - w / -16.0, 0, 1) * 2.1;
      return 1.35 + arch + (road.isSidewalk ? 0.15 : 0);
    }
    return Math.max(0.1, this.getHeightAt(x, z));
  }

  /**
   * Generates the high-resolution vertex-colored terrain mesh + animated water + arched bridges
   */
  createTerrainGroup(biomeKey = 'meadow') {
    const group = new THREE.Group();
    group.name = 'TerrainAndBridges';

    const segs = 220;
    const geo = new THREE.PlaneGeometry(this.worldSize, this.worldSize, segs, segs);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = this.getHeightAt(x, z);
      pos.setY(i, y);
    }
    geo.computeVertexNormals();
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    this.terrainGeometry = geo;
    this.applyBiomeColors(biomeKey);

    const terrainMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.92,
      metalness: 0.02
    });
    this.terrainMesh = new THREE.Mesh(geo, terrainMat);
    this.terrainMesh.receiveShadow = true;
    group.add(this.terrainMesh);

    // Create animated river & lake water surface plane
    const waterGeo = new THREE.PlaneGeometry(this.worldSize, this.worldSize, 140, 140);
    waterGeo.rotateX(-Math.PI / 2);
    const wPos = waterGeo.attributes.position;
    const wCol = new Float32Array(wPos.count * 3);
    const wSdfAttr = new Float32Array(wPos.count);

    for (let i = 0; i < wPos.count; i++) {
      const x = wPos.getX(i);
      const z = wPos.getZ(i);
      wSdfAttr[i] = this.waterSDF(x, z);
      wPos.setY(i, 0.12);
    }
    waterGeo.setAttribute('color', new THREE.BufferAttribute(wCol, 3));
    waterGeo.setAttribute('aWaterSdf', new THREE.BufferAttribute(wSdfAttr, 1));

    this.waterGeometry = waterGeo;
    this.updateWaterColors(biomeKey);

    this.waterMaterial = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.18,
      metalness: 0.15,
      transparent: true,
      opacity: 0.88
    });
    this.waterMesh = new THREE.Mesh(waterGeo, this.waterMaterial);
    this.waterMesh.receiveShadow = true;
    group.add(this.waterMesh);

    // Build the 5 arched bridges where roadsX cross the river
    const bridgesGroup = this.buildArchedBridges();
    group.add(bridgesGroup);

    return group;
  }

  applyBiomeColors(biomeKey) {
    const skin = BIOME_SKINS[biomeKey] || BIOME_SKINS.meadow;
    if (!this.terrainGeometry) return;

    const pos = this.terrainGeometry.attributes.position;
    const colAttr = this.terrainGeometry.attributes.color;
    const c = new THREE.Color();
    const c2 = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const w = this.waterSDF(x, z);
      const road = this.getRoadState(x, z);

      if (w < 0.2) {
        c.setHex(skin.beach).multiplyScalar(0.78);
      } else if (road.isCrosswalk) {
        c.setHex(0xf3ede0);
      } else if (road.isRoad && !road.isBridge) {
        c.setHex(skin.road);
        // Subtle dashed centerline on avenues
        if (
          (road.minDx < 0.22 && Math.floor((z + 500) * 0.35) % 2 === 0) ||
          (road.minDz < 0.22 && Math.floor((x + 500) * 0.35) % 2 === 0)
        ) {
          c.setHex(0xd9c698);
        }
      } else if (road.isSidewalk && !road.isBridge) {
        c.setHex(skin.sidewalk);
      } else if (w < 3.2) {
        // Sandy shoreline bank
        const t = smoothstep(0.2, 3.2, w);
        c.setHex(skin.beach);
        c2.setHex(skin.land[0]);
        c.lerp(c2, t);
      } else if (this.isDesirePath(x, z)) {
        // Worn earth desire path (`Протоптанная земля`)
        c.setHex(skin.desirePath);
      } else {
        const n = fbm(x * 0.04, z * 0.04);
        const idx = clamp(Math.floor(n * skin.land.length), 0, skin.land.length - 1);
        c.setHex(skin.land[idx]);
      }

      colAttr.setXYZ(i, c.r, c.g, c.b);
    }
    colAttr.needsUpdate = true;
    this.updateWaterColors(biomeKey);
  }

  updateWaterColors(biomeKey, timeSec = 0) {
    const skin = BIOME_SKINS[biomeKey] || BIOME_SKINS.meadow;
    if (!this.waterGeometry) return;

    const pos = this.waterGeometry.attributes.position;
    const sdf = this.waterGeometry.attributes.aWaterSdf;
    const colAttr = this.waterGeometry.attributes.color;

    const cShallow = new THREE.Color(skin.shallow);
    const cDeep = new THREE.Color(skin.deep);
    const cFoam = new THREE.Color(skin.foam);
    const c = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const d = sdf.getX(i);

      // Gentle animated water ripples
      const wave = Math.sin(x * 0.25 + timeSec * 2.2) * Math.cos(z * 0.22 - timeSec * 1.7) * 0.06;
      pos.setY(i, 0.14 + wave);

      if (d > -1.35 && d <= 0.8) {
        // Animated white shoreline foam
        const foamPulse = 0.5 + 0.5 * Math.sin(d * 4.0 - timeSec * 3.0 + x * 0.2);
        c.copy(cShallow).lerp(cFoam, foamPulse * 0.75);
      } else {
        const depthFactor = smoothstep(-1.35, -12.0, d);
        c.copy(cShallow).lerp(cDeep, depthFactor);
      }
      colAttr.setXYZ(i, c.r, c.g, c.b);
    }
    pos.needsUpdate = true;
    colAttr.needsUpdate = true;
  }

  /**
   * Builds stone & iron arched bridges where the 5 N-S avenues cross the meandering river
   */
  buildArchedBridges() {
    const group = new THREE.Group();
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0xc8beae, roughness: 0.85 });
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x48423e, roughness: 0.9 });
    const railMat = new THREE.MeshStandardMaterial({ color: 0x2a2320, roughness: 0.6, metalness: 0.4 });
    const lampMat = new THREE.MeshStandardMaterial({
      color: 0xffdf9e,
      emissive: 0xffb84d,
      emissiveIntensity: 0.9
    });

    for (const rx of this.roadsX) {
      // Find river crossing interval along Z for this X
      let minZ = null;
      let maxZ = null;
      for (let z = -150; z <= 60; z += 1.5) {
        if (this.waterSDF(rx, z) < 3.0) {
          if (minZ === null) minZ = z;
          maxZ = z;
        }
      }
      if (minZ === null || maxZ === null) continue;

      const spanLength = maxZ - minZ + 6;
      const centerZ = (minZ + maxZ) * 0.5;
      const segments = 16;
      const segLen = spanLength / segments;
      const totalWidth = (this.roadHalfWidth + this.sidewalkWidth) * 2;

      for (let s = 0; s < segments; s++) {
        const z0 = minZ - 3 + (s + 0.5) * segLen;
        const t = (s + 0.5) / segments;
        const archY = Math.sin(t * Math.PI) * 2.1 + 1.35;

        // Roadway deck segment
        const deckGeo = new THREE.BoxGeometry(this.roadHalfWidth * 2, 0.45, segLen + 0.15);
        const deck = new THREE.Mesh(deckGeo, roadMat);
        deck.position.set(rx, archY, z0);
        deck.castShadow = true;
        deck.receiveShadow = true;
        group.add(deck);

        // Left & right raised stone sidewalks + iron railings
        for (const side of [-1, 1]) {
          const swX = rx + side * (this.roadHalfWidth + this.sidewalkWidth * 0.5);
          const swGeo = new THREE.BoxGeometry(this.sidewalkWidth, 0.65, segLen + 0.15);
          const sw = new THREE.Mesh(swGeo, stoneMat);
          sw.position.set(swX, archY + 0.1, z0);
          sw.castShadow = true;
          sw.receiveShadow = true;
          group.add(sw);

          const railX = rx + side * (totalWidth * 0.5 - 0.15);
          const railGeo = new THREE.BoxGeometry(0.16, 0.85, segLen + 0.1);
          const rail = new THREE.Mesh(railGeo, railMat);
          rail.position.set(railX, archY + 0.75, z0);
          rail.castShadow = true;
          group.add(rail);

          // Bridge ornate streetlamps at 1/4 and 3/4 span
          if (s === 4 || s === 11) {
            const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 3.2, 6), railMat);
            post.position.set(railX, archY + 2.1, z0);
            group.add(post);

            const globe = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 8), lampMat);
            globe.position.set(railX, archY + 3.75, z0);
            group.add(globe);
          }
        }

        // Stone support piers in water
        if (s === 4 || s === 11) {
          const pierGeo = new THREE.BoxGeometry(totalWidth + 0.8, archY + 3.0, 2.2);
          const pier = new THREE.Mesh(pierGeo, stoneMat);
          pier.position.set(rx, (archY - 2.5) * 0.5, z0);
          pier.castShadow = true;
          pier.receiveShadow = true;
          group.add(pier);
        }
      }

      // Bridge center marker for UI / navigation
      group.userData.lastBridgeCenter = new THREE.Vector3(rx, 3.4, centerZ);
    }

    return group;
  }
}

