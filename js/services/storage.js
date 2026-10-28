/**
 * خدمة التخزين الدائم في المتصفح (IndexedDB مع دعم LocalStorage كبديل فوري)
 * تضمن بقاء كافة النقاط والملاحظات والإشارات محفوظة في متصفح المستخدم تلقائياً
 */

import { IRAQ_DEFAULT_LANDMARKS } from '../data/iraq-data.js?v=16';

const DB_NAME = "OpenMapIQ_DB";
const DB_VERSION = 1;
const STORE_NAME = "user_places";
const LOCAL_STORAGE_KEY = "openmapiq_places_backup";
const SETTINGS_KEY = "openmapiq_settings";

class StorageService {
  constructor() {
    this.db = null;
    this.isReady = this.initDB();
  }

  async initDB() {
    if (!window.indexedDB) {
      console.warn("IndexedDB غير مدعوم في هذا المتصفح، سيتم الاعتماد على LocalStorage.");
      return false;
    }

    return new Promise((resolve) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
          store.createIndex("governorate", "governorate", { unique: false });
          store.createIndex("category", "category", { unique: false });
          store.createIndex("createdAt", "createdAt", { unique: false });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(true);
      };

      request.onerror = (event) => {
        console.error("فشل فتح IndexedDB:", event.target.error);
        resolve(false);
      };
    });
  }

  /**
   * جلب كافة النقاط المخزنة (مع تهيئة المعالم الافتراضية إذا كان المتصفح فارغاً لأول مرة)
   */
  async getAllPlaces() {
    await this.isReady;

    if (this.db) {
      return new Promise((resolve) => {
        const tx = this.db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = async () => {
          let results = request.result || [];
          if (results.length === 0) {
            results = await this.seedDefaultLandmarks();
          }
          resolve(results);
        };

        request.onerror = () => {
          resolve(this.getFallbackPlaces());
        };
      });
    }

    return this.getFallbackPlaces();
  }

  /**
   * تهيئة المعالم التراثية والوطنية الافتراضية للعراق عند فتح الموقع لأول مرة
   */
  async seedDefaultLandmarks() {
    const seeded = IRAQ_DEFAULT_LANDMARKS.map(lm => ({
      ...lm,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDefault: true,
      isFavorite: false
    }));

    for (const item of seeded) {
      await this.savePlace(item);
    }
    return seeded;
  }

  /**
   * حفظ أو تحديث نقطة وملاحظة في المتصفح
   */
  async savePlace(place) {
    await this.isReady;

    if (!place.id) {
      place.id = "pin_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
    }
    if (!place.createdAt) {
      place.createdAt = new Date().toISOString();
    }
    place.updatedAt = new Date().toISOString();

    if (this.db) {
      return new Promise((resolve, reject) => {
        const tx = this.db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(place);

        req.onsuccess = () => {
          this.syncBackupToLocalStorage();
          resolve(place);
        };
        req.onerror = (e) => reject(e);
      });
    } else {
      const places = this.getFallbackPlaces();
      const idx = places.findIndex(p => p.id === place.id);
      if (idx >= 0) {
        places[idx] = place;
      } else {
        places.push(place);
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(places));
      return place;
    }
  }

  /**
   * حذف نقطة محددة من المتصفح
   */
  async deletePlace(id) {
    await this.isReady;

    if (this.db) {
      return new Promise((resolve, reject) => {
        const tx = this.db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(id);

        req.onsuccess = () => {
          this.syncBackupToLocalStorage();
          resolve(true);
        };
        req.onerror = (e) => reject(e);
      });
    } else {
      let places = this.getFallbackPlaces();
      places = places.filter(p => p.id !== id);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(places));
      return true;
    }
  }

  /**
   * مسح كافة النقاط المضافة من قِبل المستخدم
   */
  async clearAllPlaces() {
    await this.isReady;
    if (this.db) {
      const tx = this.db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).clear();
    }
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    return true;
  }

  /**
   * استرجاع البيانات الاحتياطية من LocalStorage
   */
  getFallbackPlaces() {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error("خطأ قراءة LocalStorage:", e);
    }
    return [...IRAQ_DEFAULT_LANDMARKS];
  }

  /**
   * مزامنة نسخة احتياطية في LocalStorage
   */
  async syncBackupToLocalStorage() {
    if (this.db) {
      const tx = this.db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).getAll();
      req.onsuccess = () => {
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(req.result || []));
        } catch (e) {
          // في حال تجاوز سعة التخزين
        }
      };
    }
  }

  /**
   * تصدير النقاط بصيغة GeoJSON القياسية لنظم المعلومات الجغرافية
   */
  async exportAsGeoJSON() {
    const places = await this.getAllPlaces();
    const geojson = {
      type: "FeatureCollection",
      generator: "OpenMapIQ Iraq GIS",
      timestamp: new Date().toISOString(),
      features: places.map(p => ({
        type: "Feature",
        id: p.id,
        geometry: {
          type: "Point",
          coordinates: [p.lng, p.lat]
        },
        properties: {
          title: p.title,
          notes: p.notes,
          category: p.category,
          color: p.color,
          governorate: p.governorate,
          tags: p.tags,
          createdAt: p.createdAt
        }
      }))
    };
    return JSON.stringify(geojson, null, 2);
  }

  /**
   * تصدير النقاط كملف JSON عادي
   */
  async exportAsJSON() {
    const places = await this.getAllPlaces();
    return JSON.stringify(places, null, 2);
  }

  /**
   * تصدير النقاط كملف CSV قابل للفتح في Excel
   */
  async exportAsCSV() {
    const places = await this.getAllPlaces();
    const headers = ["المعرف", "العنوان", "المحافظة", "التصنيف", "خط العرض", "خط الطول", "الملاحظات", "تاريخ التسجيل"];
    const rows = places.map(p => [
      `"${p.id}"`,
      `"${(p.title || '').replace(/"/g, '""')}"`,
      `"${(p.governorate || '').replace(/"/g, '""')}"`,
      `"${p.category || ''}"`,
      p.lat,
      p.lng,
      `"${(p.notes || '').replace(/"/g, '""')}"`,
      `"${p.createdAt || ''}"`
    ]);

    return "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n");
  }

  /**
   * استيراد نقاط من نص JSON أو GeoJSON
   */
  async importData(text) {
    try {
      const data = JSON.parse(text);
      let count = 0;

      if (data.type === "FeatureCollection" && Array.isArray(data.features)) {
        for (const f of data.features) {
          if (f.geometry && f.geometry.type === "Point" && f.geometry.coordinates) {
            const [lng, lat] = f.geometry.coordinates;
            const props = f.properties || {};
            await this.savePlace({
              title: props.title || "نقطة مستوردة",
              notes: props.notes || "",
              category: props.category || "personal",
              color: props.color || "#0284c7",
              lat: Number(lat),
              lng: Number(lng),
              governorate: props.governorate || "",
              tags: props.tags || ["مستورد"]
            });
            count++;
          }
        }
      } else if (Array.isArray(data)) {
        for (const item of data) {
          if (item.lat && item.lng) {
            await this.savePlace({
              ...item,
              id: "pin_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6)
            });
            count++;
          }
        }
      }
      return { success: true, count };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * إدارة إعدادات وتفضيلات المستخدم
   */
  getSettings() {
    try {
      const s = localStorage.getItem(SETTINGS_KEY);
      return s ? JSON.parse(s) : {
        activeLayer: "osm",
        theme: "dark",
        userModel: "pin_arrow",
        showDefaultLandmarks: true
      };
    } catch (e) {
      return { activeLayer: "osm", theme: "dark", userModel: "pin_arrow", showDefaultLandmarks: true };
    }
  }

  saveSettings(settings) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) { }
  }
}

export const storage = new StorageService();
