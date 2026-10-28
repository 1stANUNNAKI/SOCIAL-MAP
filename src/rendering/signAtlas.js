import * as THREE from 'three';

/**
 * Multilingual Signboard Dictionary modeled after `settings-VRlP1rEA.js` (lines 3810-3820)
 */
export const DISTRICT_SIGNS = {
  arabic: [
    { text: 'البلدية', bg: '#1e4d42', fg: '#f5e6c4', border: '#d4af37', neon: false },
    { text: 'سوق الزعفران', bg: '#7a2e22', fg: '#f7ebd2', border: '#e2b858', neon: false },
    { text: 'مقهى الأندلس', bg: '#264653', fg: '#f4e8c1', border: '#e9c46a', neon: false },
    { text: 'مكتبة الحكمة', bg: '#3d2b1f', fg: '#f3ede0', border: '#c9a259', neon: false },
    { text: 'فندق الرياض', bg: '#1b3b5c', fg: '#fcefb4', border: '#d4af37', neon: true },
    { text: 'صيدلية الشفاء', bg: '#1b5e3a', fg: '#ffffff', border: '#7ae582', neon: true },
    { text: 'مخبز البركة', bg: '#6b3e26', fg: '#fff1d0', border: '#e6b86a', neon: false },
    { text: 'مستشفى النور', bg: '#f3ede0', fg: '#b82929', border: '#b82929', neon: true }
  ],
  european: [
    { text: 'BOULANGERIE', bg: '#2b3a4a', fg: '#f2e5c6', border: '#c9a45c', neon: false },
    { text: 'CAFÉ DE PARIS', bg: '#6e2228', fg: '#faf0d7', border: '#d9b26f', neon: false },
    { text: 'PHARMACIE', bg: '#195938', fg: '#e8fff0', border: '#5ce68a', neon: true },
    { text: 'GRAND HÔTEL', bg: '#232830', fg: '#f5dca2', border: '#d4af37', neon: true },
    { text: 'TRATTORIA', bg: '#5e3023', fg: '#f7ebd4', border: '#c99b5b', neon: false },
    { text: 'LIBRAIRIE', bg: '#1f3b34', fg: '#f0e6d2', border: '#b89860', neon: false },
    { text: 'GALERIE D’ART', bg: '#362d42', fg: '#f3e8ee', border: '#c49ec9', neon: false },
    { text: 'HÔTEL DE VILLE', bg: '#2a2320', fg: '#f3ede0', border: '#d4af37', neon: false }
  ],
  japanese: [
    { text: 'ラーメン 居酒屋', bg: '#8c1d1d', fg: '#fff6e0', border: '#f2c14e', neon: true },
    { text: 'さくら 茶屋', bg: '#2b2628', fg: '#f7c8d4', border: '#e88ca5', neon: false },
    { text: '東京 書店', bg: '#1d3547', fg: '#f0ebd8', border: '#9ec5db', neon: false },
    { text: '旅館 富士', bg: '#3b2b20', fg: '#f5e8c7', border: '#d4a857', neon: true },
    { text: '交番 KOBAN', bg: '#22384f', fg: '#ffffff', border: '#ffd166', neon: true },
    { text: '薬局 कुसुり', bg: '#1e523a', fg: '#f2fff6', border: '#70e098', neon: true }
  ],
  metropolis: [
    { text: 'CYBER CORP', bg: '#0d1326', fg: '#00f5d4', border: '#00bbf9', neon: true },
    { text: 'DINER 24H', bg: '#4a1228', fg: '#ff70a6', border: '#ffd670', neon: true },
    { text: 'METRO BANK', bg: '#16263b', fg: '#f5d77f', border: '#d4af37', neon: true },
    { text: 'PARKING 24/7', bg: '#183661', fg: '#ffffff', border: '#4ea8de', neon: true },
    { text: 'SKY ARCADE', bg: '#240046', fg: '#ff9e00', border: '#e0aaff', neon: true },
    { text: 'GRAND MALL', bg: '#1b262c', fg: '#bbe1fa', border: '#3282b8', neon: true }
  ]
};

/**
 * Generates individual hand-sketched signboard textures on Canvas2D
 * with wobbly ink borders and diagonal hatching like `settings-VRlP1rEA.js`
 */
export class DynamicSignGenerator {
  constructor() {
    this.cache = new Map();
  }

  getSignMaterial(styleKey, index = 0) {
    const list = DISTRICT_SIGNS[styleKey] || DISTRICT_SIGNS.european;
    const item = list[index % list.length];
    const cacheKey = `${styleKey}:${index % list.length}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Background fill
    ctx.fillStyle = item.bg;
    ctx.fillRect(0, 0, 512, 128);

    // Subtle diagonal pencil hatching (`Штриховка`) across sign background
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = -128; x < 512 + 128; x += 14) {
      ctx.moveTo(x, 128);
      ctx.lineTo(x + 128, 0);
    }
    ctx.stroke();

    // Hand-drawn wobbly frame border
    ctx.strokeStyle = item.border;
    ctx.lineWidth = 5;
    ctx.beginPath();
    const pad = 10;
    ctx.moveTo(pad, pad + 2);
    ctx.quadraticCurveTo(256, pad - 3, 512 - pad, pad + 1);
    ctx.quadraticCurveTo(512 - pad + 2, 64, 512 - pad - 1, 128 - pad);
    ctx.quadraticCurveTo(256, 128 - pad + 3, pad + 1, 128 - pad - 1);
    ctx.closePath();
    ctx.stroke();

    // Inner thin accent frame
    ctx.lineWidth = 1.5;
    ctx.strokeRect(pad + 6, pad + 6, 512 - (pad + 6) * 2, 128 - (pad + 6) * 2);

    // Signboard typography (supports Arabic, Latin, and Japanese glyphs)
    ctx.fillStyle = item.fg;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 46px "Segoe UI", "Tahoma", "Noto Sans Arabic", sans-serif';
    if (item.neon) {
      ctx.shadowColor = item.border;
      ctx.shadowBlur = 14;
    }
    ctx.fillText(item.text, 256, 66);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;

    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: item.neon ? 0.3 : 0.7,
      metalness: 0.1,
      emissive: item.neon ? new THREE.Color(item.bg).lerp(new THREE.Color(item.fg), 0.35) : new THREE.Color(0x000000),
      emissiveMap: item.neon ? texture : null,
      emissiveIntensity: item.neon ? 0.65 : 0.0
    });
    material.userData.isSign = true;
    material.userData.isNeon = item.neon;

    this.cache.set(cacheKey, material);
    return material;
  }
}

