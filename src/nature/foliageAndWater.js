import * as THREE from 'three';
import { BIOME_SKINS, hash2 } from '../terrain/sdfTerrain.js';

/**
 * Instanced Procedural Foliage System (`الزرع والأشجار والحدائق`)
 * Uses `THREE.InstancedMesh` for zero-jank rendering of ~420 trees & shrubs
 */
export class InstancedFoliageSystem {
  constructor(terrain, buildingsList) {
    this.terrain = terrain;
    this.buildingsList = buildingsList;
    this.treeRecords = [];
  }

  buildFoliage(biomeKey = 'meadow') {
    const group = new THREE.Group();
    group.name = 'InstancedFoliage';

    // Collect valid tree placement coordinates across parks, riverbanks, avenues, and perimeter hills
    const candidates = [];

    // 1. Central Park Oasis & Desire Path surroundings (x: [-52..52], z: [32..80])
    for (let x = -50; x <= 50; x += 6.5) {
      for (let z = 32; z <= 78; z += 6.5) {
        const jx = x + (hash2(x, z) - 0.5) * 3.5;
        const jz = z + (hash2(z, x) - 0.5) * 3.5;
        if (this.isValidTreeSpot(jx, jz)) {
          candidates.push({ x: jx, z: jz, scale: 0.85 + hash2(jx * 2, jz) * 0.55 });
        }
      }
    }

    // 2. Riverbank promenade trees & outer perimeter forest belt
    for (let x = -168; x <= 168; x += 11) {
      for (let z = -168; z <= 168; z += 11) {
        if (x > -52 && x < 52 && z > 30 && z < 80) continue;
        const jx = x + (hash2(x + 9, z) - 0.5) * 6.0;
        const jz = z + (hash2(z + 9, x) - 0.5) * 6.0;
        const w = this.terrain.waterSDF(jx, jz);
        const isRiverbank = w > 4.2 && w < 15.0;
        const isOuterForest = Math.max(Math.abs(jx), Math.abs(jz)) > 128;
        const isCourtyardTree = hash2(jx * 0.3, jz * 0.3) > 0.62;

        if ((isRiverbank || isOuterForest || isCourtyardTree) && this.isValidTreeSpot(jx, jz)) {
          candidates.push({ x: jx, z: jz, scale: 0.75 + hash2(jx, jz * 3) * 0.75 });
        }
      }
    }

    const count = candidates.length;
    this.treeRecords = candidates;

    const trunkGeo = new THREE.CylinderGeometry(0.18, 0.3, 2.2, 6);
    trunkGeo.translate(0, 1.1, 0);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4028, roughness: 0.9 });

    const crownGeo = new THREE.DodecahedronGeometry(1.55, 1);
    crownGeo.translate(0, 3.1, 0);
    const crownMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.82
    });

    this.trunkInstanced = new THREE.InstancedMesh(trunkGeo, trunkMat, count);
    this.crownInstanced = new THREE.InstancedMesh(crownGeo, crownMat, count);
    this.trunkInstanced.castShadow = true;
    this.crownInstanced.castShadow = true;
    this.crownInstanced.receiveShadow = true;

    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const rec = candidates[i];
      const y = this.terrain.getHeightAt(rec.x, rec.z);
      rec.y = y;

      dummy.position.set(rec.x, y, rec.z);
      dummy.rotation.set(0, hash2(rec.x, rec.z) * Math.PI * 2, 0);
      dummy.scale.set(rec.scale, rec.scale * (0.9 + hash2(rec.z, rec.x) * 0.35), rec.scale);
      dummy.updateMatrix();

      this.trunkInstanced.setMatrixAt(i, dummy.matrix);
      this.crownInstanced.setMatrixAt(i, dummy.matrix);
    }

    this.trunkInstanced.instanceMatrix.needsUpdate = true;
    this.crownInstanced.instanceMatrix.needsUpdate = true;

    this.applyBiomeFoliageColors(biomeKey);

    group.add(this.trunkInstanced);
    group.add(this.crownInstanced);
    return group;
  }

  isValidTreeSpot(x, z) {
    const w = this.terrain.waterSDF(x, z);
    if (w < 4.0) return false;
    const road = this.terrain.getRoadState(x, z);
    if (road.isRoad || road.isSidewalk) return false;
    if (this.terrain.isDesirePath(x, z)) return false;

    // Avoid building footprints
    for (const b of this.buildingsList) {
      const c = b.collider;
      if (!c) continue;
      if (x >= c.minX - 2.2 && x <= c.maxX + 2.2 && z >= c.minZ - 2.2 && z <= c.maxZ + 2.2) {
        return false;
      }
    }
    return true;
  }

  applyBiomeFoliageColors(biomeKey) {
    if (!this.crownInstanced) return;
    const skin = BIOME_SKINS[biomeKey] || BIOME_SKINS.meadow;
    const col = new THREE.Color();

    for (let i = 0; i < this.treeRecords.length; i++) {
      const rec = this.treeRecords[i];
      // In Japanese district (x < 0, z > 25), mix pink Sakura blossom trees even in meadow mode!
      if (biomeKey === 'meadow' && rec.x < -10 && rec.z > 28 && i % 3 === 0) {
        col.setHex(0xf49cbb);
      } else {
        const palette = skin.foliage;
        col.setHex(palette[i % palette.length]);
      }
      this.crownInstanced.setColorAt(i, col);
    }
    if (this.crownInstanced.instanceColor) {
      this.crownInstanced.instanceColor.needsUpdate = true;
    }
  }
}

