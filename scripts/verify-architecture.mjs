import { CityTerrainSDF, BIOME_SKINS, smin } from '../src/terrain/sdfTerrain.js';
import { DISTRICT_SIGNS } from '../src/rendering/signAtlas.js';
import { SKETCH_PRESETS } from '../src/rendering/sketchAtmosphere.js';

console.log('=== Verifying CityRT Prototype Subsystems ===');

// 1. Test SDF Terrain & Catmull-Rom River Spatial Hash
const terrain = new CityTerrainSDF(360);
const riverMid = terrain.waterSDF(15, -35);
const landPoint = terrain.waterSDF(-90, -98);
if (!(riverMid < 0)) {
  throw new Error(`Expected river center (15, -35) to have waterSDF < 0, got ${riverMid}`);
}
if (!(landPoint > 4.0)) {
  throw new Error(`Expected land lot (-90, -98) to have waterSDF > 4.0, got ${landPoint}`);
}
console.log(`[PASS] SDF River & Spatial Hash Grid verified (river=${riverMid.toFixed(2)}m, land=${landPoint.toFixed(2)}m)`);

// 2. Test Bridge detection where N-S Avenue crosses river
const bridgeCheck = terrain.getRoadState(0, -35);
if (!bridgeCheck.isBridge) {
  throw new Error('Expected Avenue X=0 at Z=-35 to form an arched river bridge');
}
console.log('[PASS] Arched Bridge detection over SDF River verified');

// 3. Test Biomes, Multilingual Signs & Sketch Presets
const biomeKeys = Object.keys(BIOME_SKINS);
const signStyles = Object.keys(DISTRICT_SIGNS);
const presetKeys = Object.keys(SKETCH_PRESETS);
if (biomeKeys.length < 8 || signStyles.length < 4 || presetKeys.length < 4) {
  throw new Error('Missing biomes, sign styles, or sketch presets');
}
console.log(`[PASS] Biomes (${biomeKeys.length}), Multilingual Sign Districts (${signStyles.length}), and NPR Sketch Presets (${presetKeys.length}) verified`);
console.log('ALL VERIFICATION GATES PASSED.');

