/**
 * مدير التثبيت والعمل بدون إنترنت (PWA & Offline Map Pack Manager)
 * يتيح تثبيت التطبيق بنقرة واحدة وتحميل حزمة خرائط العراق أوفلاين
 */

const OFFLINE_TILE_CACHE = 'openmapiq-tiles-offline-v1';

// إحداثيات حدود العراق لتحويلها إلى إحداثيات بلاطات (Tile Coordinates x, y, z)
function long2tile(lon, zoom) {
  return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
}

function lat2tile(lat, zoom) {
  return Math.floor(
    ((1 -
      Math.log(
        Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)
      ) /
      Math.PI) /
      2) *
    Math.pow(2, zoom)
  );
}

class OfflinePackService {
  constructor() {
    this.deferredPrompt = null;
    this.isDownloading = false;
    this.initInstallPromptListener();
  }

  /**
   * الاستماع لحدث تثبيت التطبيق في المتصفح (PWA Install Prompt)
   */
  initInstallPromptListener() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      const installBtn = document.getElementById('pwaInstallBtn');
      if (installBtn) {
        installBtn.style.display = 'inline-flex';
      }
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      console.log('تم تثبيت OpenMapIQ كتطبيق مستقل بنجاح');
    });
  }

  /**
   * إطلاق نافذة تثبيت التطبيق على الجهاز
   */
  async triggerInstallPrompt() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      this.deferredPrompt = null;
      return outcome === 'accepted';
    }
    return false;
  }

  /**
   * حساب قائمة عناوين البلاطات التي تغطي الجمهورية العراقية من الشمال إلى الجنوب
   * للمستويات من zoom 6 إلى 9
   */
  generateIraqTileUrls(minZoom = 6, maxZoom = 9) {
    const urls = [];
    // نطاق العراق: [29.0, 38.5] إلى [37.5, 49.0]
    const minLat = 29.0;
    const maxLat = 37.5;
    const minLng = 38.5;
    const maxLng = 49.0;

    for (let z = minZoom; z <= maxZoom; z++) {
      const minX = long2tile(minLng, z);
      const maxX = long2tile(maxLng, z);
      const minY = lat2tile(maxLat, z);
      const maxY = lat2tile(minLat, z);

      for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
          urls.push(`https://tile.openstreetmap.org/${z}/${x}/${y}.png`);
        }
      }
    }

    return urls;
  }

  /**
   * تحميل وحفظ حزمة الخرائط والمجسمات في الـ Cache Storage للعمل بدون انترنت
   */
  async downloadOfflinePack(onProgress) {
    if (this.isDownloading) return;
    this.isDownloading = true;

    try {
      const cache = await caches.open(OFFLINE_TILE_CACHE);

      // 1. ملفات النماذج والأكواد المحلية وقاعدة البيانات الجغرافية
      const staticAssets = [
        './',
        './index.html',
        './css/style.css',
        './manifest.json',
        './js/app.js',
        './js/data/iraq-data.js',
        './js/services/geoutils.js',
        './js/services/storage.js',
        './js/services/map-engine.js',
        './js/services/three-engine.js',
        './js/services/navigation.js',
        './js/services/offline-pack.js',
        './models/arrow.glb',
        './models/soldier.glb',
        './models/car_ferrari.glb',
        './models/bike.glb',
        './models/creature_horse.glb',
        './models/parrot.glb',
        './models/character_man.glb',
        './models/fox_animal.glb'
      ];

      for (const asset of staticAssets) {
        try {
          await cache.add(asset);
        } catch (e) {
          // تجاوز أي ملف غير حرج
        }
      }

      // 2. بلاطات خريطة العراق
      const tileUrls = this.generateIraqTileUrls(6, 9);
      const total = tileUrls.length;
      let downloaded = 0;

      // تحميل متزامن خفيف لتفادي حظر الشبكة
      const batchSize = 6;
      for (let i = 0; i < tileUrls.length; i += batchSize) {
        const batch = tileUrls.slice(i, i + batchSize);
        await Promise.all(
          batch.map(async (url) => {
            try {
              const res = await fetch(url, { mode: 'cors' });
              if (res.ok) {
                await cache.put(url, res);
              }
            } catch (err) {
              // تجاوز البلاطات التي تفشل
            } finally {
              downloaded++;
              if (onProgress) {
                const percent = Math.min(100, Math.round((downloaded / total) * 100));
                onProgress({
                  percent,
                  downloaded,
                  total,
                  text: `جاري تحميل خريطة العراق أوفلاين: ${downloaded} من ${total} بلاطة (${percent}%)`
                });
              }
            }
          })
        );
      }

      this.isDownloading = false;
      return { success: true, count: downloaded };
    } catch (e) {
      this.isDownloading = false;
      console.error('خطأ في تحميل الحزمة أوفلاين:', e);
      return { success: false, error: e.message };
    }
  }

  /**
   * التحقق من حجم البلاطات المخزنة محلياً
   */
  async getOfflineStatus() {
    if (!('caches' in window)) return { supported: false, count: 0 };
    const cache = await caches.open(OFFLINE_TILE_CACHE);
    const keys = await cache.keys();
    return {
      supported: true,
      count: keys.length,
      isCached: keys.length > 50
    };
  }

  /**
   * مسح حزمة الخرائط أوفلاين لتحرير المساحة
   */
  async clearOfflinePack() {
    if ('caches' in window) {
      await caches.delete(OFFLINE_TILE_CACHE);
    }
    return true;
  }
}

export const offlinePack = new OfflinePackService();
