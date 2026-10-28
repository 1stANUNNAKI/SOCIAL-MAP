import fs from 'fs';
import path from 'path';

const modelsDir = path.resolve('models');
if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
}

const models = [
  {
    name: 'car_ferrari.glb',
    url: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/ferrari.glb'
  },
  {
    name: 'creature_horse.glb',
    url: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/Horse.glb'
  },
  {
    name: 'flying_bird.glb',
    url: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/Flamingo.glb'
  },
  {
    name: 'spacecraft.glb',
    url: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/PrimaryIonDrive.glb'
  }
];

async function downloadAll() {
  for (const item of models) {
    const dest = path.join(modelsDir, item.name);
    console.log(`Downloading ${item.name} from ${item.url}...`);
    try {
      const res = await fetch(item.url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buffer = await res.arrayBuffer();
      fs.writeFileSync(dest, Buffer.from(buffer));
      console.log(`Saved ${item.name} (${(buffer.byteLength / 1024).toFixed(1)} KB)`);
    } catch (e) {
      console.error(`Failed ${item.name}: ${e.message}`);
    }
  }
}

downloadAll();
