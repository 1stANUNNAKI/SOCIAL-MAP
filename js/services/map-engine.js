/**
 * محرك الخرائط الجغرافي للعراق (MapEngine - Leaflet Architecture v8 - مشروع OMI)
 * - يدعم التقريب الفائق حتى أقصى درجة (Zoom 22) بدون رسالة "البيانات غير متوفرة" عبر maxNativeZoom.
 * - يدعم العرض ثلاثي الأبعاد الكامل (Full 3D Extruded Buildings + 3D Horizon + تحكم دوران وميلان + زر خروج فوري واضح).
 * - يكتشف اسم البناية أو المجمع الذي يقف فيه المستخدم تلقائياً (Reverse Geocoding + Overpass Radius) مثل "مجموعة العميد التعليمية".
 * - يعرض كافة البنايات الصغيرة والمدارس والمولات والمحلات عند التقريب (Zoom >= 13).
 */

import { IRAQ_GEOMETRY, registerNewPlaceInGazetteer } from '../data/iraq-data.js?v=15';
import { formatCoordinates, sanitizeText, formatArabicParentheses, calculatePathDistanceKm, calculateDistanceKm, calculateBearing, findClosestGovernorate } from './geoutils.js?v=15';
import { threeEngine } from './three-engine.js?v=15';

// رمز دبوس الخريطة المفرغ من الوسط (Hollow-Center Map Pin SVG) بدلاً من الدبوس الأحمر
const HOLLOW_MAP_PIN_SVG = `<svg class="hollow-map-pin-icon" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 10.5c-1.93 0-3.5-1.57-3.5-3.5S10.07 5.5 12 5.5s3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/></svg>`;
const HOLLOW_DRAG_PIN_SVG = `<svg class="drag-pin-hollow-svg" viewBox="0 0 24 24" width="44" height="44" aria-hidden="true"><defs><linearGradient id="omiPinGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#0ea5e9"/><stop offset="100%" stop-color="#0284c7"/></linearGradient></defs><path fill="url(#omiPinGrad)" stroke="#ffffff" stroke-width="1.6" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 10.5c-1.93 0-3.5-1.57-3.5-3.5S10.07 5.5 12 5.5s3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/></svg>`;

// المراكز الرئيسية الـ 19 (العاصمة بغداد وعواصم المحافظات) التي تظهر في العرض العام
const MAJOR_CAPITALS_IDS = new Set([
  'pl_baghdad_center',
  'pl_basra_city',
  'pl_mosul_city',
  'pl_erbil_city',
  'pl_sulaymaniyah_city',
  'pl_duhok_city',
  'pl_kirkuk_city',
  'pl_tikrit_city',
  'pl_baqubah_city',
  'pl_ramadi_city',
  'pl_hillah_city',
  'pl_karbala_city',
  'pl_najaf_city',
  'pl_kut_city',
  'pl_diwaniyah_city',
  'pl_amara_city',
  'pl_nasiriyah_city',
  'pl_samawah_city',
  'pl_halabja'
]);

export class MapEngine {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.options = options;
    this.map = null;
    this.activeBaseLayer = null;
    this.baseLayers = {};
    this.markersLayer = null;
    this.userLocationMarker = null;
    this.accuracyCircle = null;
    this.measureLayer = null;
    this.measurePoints = [];
    this.isMeasuring = false;

    // الدبوس التفاعلي القابل للسحب (Draggable Pin)
    this.draggablePin = null;
    this.onDraggablePinConfirm = null;
    this.onDraggablePinNavigate = null;

    // طبقات الأماكن والبنايات التفصيلية والـ 3D
    this.placesLabelsLayer = null;
    this.livePoiLayer = null;
    this.buildings3DLayer = null;
    this.allDetailedPlaces = [];
    this.liveFetchedPlaces = new Map();
    this.cachedOsmWays = [];
    this.onSelectPlaceCallback = null;
    this.placesLabelsEnabled = true;

    // وضع العرض ثلاثي الأبعاد للخريطة والمباني (3D Extruded Mode)
    this.is3DMapView = false;
    this.pitch3DDeg = 42;
    this.bearing3DDeg = 0;
    this.on3DStateChange = options.on3DStateChange || null;

    // طبقة مسار الرحلة والملاحة وتتبع الحركة
    this.navigationRouteLayer = null;

    // مجسم الـ 3D الحالي لموقع المستخدم
    this.active3DModelId = this.options.userModelId && this.options.userModelId !== 'pin_arrow' ? this.options.userModelId : 'arrow';
    this.user3DInstance = null;
    this.lastUserLatLng = null;
    this.currentHeadingDeg = 0;
    this.currentStandingBuildingName = '';
    this.lastReverseGeocodeKey = '';

    this.overpassTimer = null;
    this.lastFetchedBoundsKey = '';

    this.init();
  }

  init() {
    const southWest = L.latLng(28.0, 37.0);
    const northEast = L.latLng(38.5, 50.5);
    const iraqBounds = L.latLngBounds(southWest, northEast);

    this.map = L.map(this.containerId, {
      center: IRAQ_GEOMETRY.center,
      zoom: IRAQ_GEOMETRY.defaultZoom,
      minZoom: 5,
      maxZoom: 22,
      maxBounds: iraqBounds,
      maxBoundsViscosity: 0.85,
      zoomControl: false,
      attributionControl: false
    });

    this.setupBaseLayers();

    this.buildings3DLayer = L.layerGroup().addTo(this.map);
    this.markersLayer = L.layerGroup().addTo(this.map);
    this.placesLabelsLayer = L.layerGroup().addTo(this.map);
    this.livePoiLayer = L.layerGroup().addTo(this.map);
    this.navigationRouteLayer = L.layerGroup().addTo(this.map);
    this.measureLayer = L.layerGroup().addTo(this.map);

    this.map.on('click', (e) => {
      if (this.isMeasuring) {
        this.addMeasurePoint(e.latlng);
      } else if (this.options.onMapClick) {
        this.options.onMapClick(e.latlng);
      }
    });

    this.map.on('zoomend', () => {
      this.update3DMarkerScaleForZoom();
      this.updatePlacesVisibilityByZoom();
      this.scheduleLiveStreetDetailsFetch();
      if (this.is3DMapView) {
        this.render3DExtrudedBuildings();
      }
    });

    this.map.on('moveend', () => {
      this.updatePlacesVisibilityByZoom();
      this.scheduleLiveStreetDetailsFetch();
      if (this.is3DMapView) {
        this.render3DExtrudedBuildings();
      }
    });

    this.initDeviceCompassListener();
  }

  /**
   * ضبط حجم المجسم الثلاثي الأبعاد ديناميكياً ليبقى واضحاً ومتوازناً داخل إطاره دون خروج عن الحدود
   */
  update3DMarkerScaleForZoom() {
    if (!this.userLocationMarker) return;
    const el = this.userLocationMarker.getElement();
    if (!el) return;
    const wrapper = el.querySelector('.user-3d-pin-wrapper');
    if (!wrapper) return;

    const zoom = this.map.getZoom();
    const scaleFactor = Math.max(0.82, Math.min(1.22, 0.72 + (zoom - 5) * 0.03));
    wrapper.style.setProperty('--marker-zoom-scale', scaleFactor.toFixed(3));
  }

  /**
   * تفعيل أو إيقاف وضع الخريطة ثلاثية الأبعاد للعراق (Full 3D Extruded Buildings + 3D Camera Tilt)
   */
  toggle3DMapView(forceState = null) {
    this.is3DMapView = forceState !== null ? forceState : !this.is3DMapView;
    const stageEl = document.getElementById('map3DStage') || document.querySelector('.map-viewport-wrapper');

    if (this.is3DMapView) {
      stageEl?.classList.add('map-3d-perspective-active');
      this.apply3DCameraTransform();

      // إذا كان الزووم بعيداً جداً، نقرب الكاميرا لمستوى يظهر المباني والكتل ثلاثية الأبعاد بوضوح
      if (this.map.getZoom() < 15) {
        const targetCenter = this.userLocationLatLng || this.map.getCenter();
        this.map.setView([targetCenter.lat, targetCenter.lng], 16, { animate: true });
      }

      this.render3DExtrudedBuildings();
      this.scheduleLiveStreetDetailsFetch(true);
    } else {
      stageEl?.classList.remove('map-3d-perspective-active');
      this.pitch3DDeg = 42;
      this.bearing3DDeg = 0;
      const mapEl = document.getElementById(this.containerId);
      if (mapEl) {
        mapEl.style.transform = '';
      }
      this.buildings3DLayer.clearLayers();
    }

    if (this.on3DStateChange) {
      this.on3DStateChange(this.is3DMapView);
    }

    setTimeout(() => {
      this.map.invalidateSize();
    }, 300);

    return this.is3DMapView;
  }

  apply3DCameraTransform() {
    const mapEl = document.getElementById(this.containerId);
    if (!mapEl) return;
    if (!this.is3DMapView) {
      mapEl.style.transform = '';
      return;
    }
    mapEl.style.transform = `rotateX(${this.pitch3DDeg}deg) rotateZ(${this.bearing3DDeg}deg) scale(1.12)`;
  }

  adjust3DCamera(deltaPitch = 0, deltaBearing = 0) {
    if (!this.is3DMapView) return;
    this.pitch3DDeg = Math.max(15, Math.min(58, this.pitch3DDeg + deltaPitch));
    this.bearing3DDeg = (this.bearing3DDeg + deltaBearing) % 360;
    this.apply3DCameraTransform();
  }

  /**
   * رسم المباني والكتل العمرانية ثلاثية الأبعاد البارزة (True 3D Extruded Polygons: Walls + Roofs + Shadows)
   */
  render3DExtrudedBuildings() {
    if (!this.buildings3DLayer) return;
    this.buildings3DLayer.clearLayers();
    if (!this.is3DMapView) return;

    const zoom = this.map.getZoom();
    const bounds = this.map.getBounds();

    // معامل الارتفاع ثلاثي الأبعاد حسب مستوى التقريب
    const heightScale = zoom >= 17 ? 0.00022 : zoom >= 15 ? 0.00038 : 0.00085;

    // 1. رسم المباني الحقيقية المجلوبة من OpenStreetMap (جدران جانبية + أسقف مرتفعة + ظلال)
    this.cachedOsmWays.forEach((way) => {
      if (!way.geometry || way.geometry.length < 3) return;
      const pts = way.geometry.map(pt => [pt.lat, pt.lon]);
      if (!bounds.contains(pts[0])) return;

      const levels = parseFloat(way.tags?.['building:levels']) || (way.tags?.name ? 4.5 : 2.5);
      const dLat = levels * heightScale * 0.45;
      const dLng = -levels * heightScale * 0.28;

      const roofPts = pts.map(([lat, lng]) => [lat + dLat, lng + dLng]);
      const isNamed = Boolean(way.tags?.['name:ar'] || way.tags?.name);

      // جدران البناية ثلاثية الأبعاد (Extruded 3D Walls)
      for (let i = 0; i < pts.length - 1; i++) {
        const wallQuad = [pts[i], pts[i + 1], roofPts[i + 1], roofPts[i]];
        L.polygon(wallQuad, {
          color: isNamed ? '#0284c7' : '#334155',
          weight: 0.8,
          fillColor: isNamed ? '#0369a1' : '#1e293b',
          fillOpacity: 0.82,
          interactive: false
        }).addTo(this.buildings3DLayer);
      }

      // سقف البناية البارز (3D Roof)
      const roofPoly = L.polygon(roofPts, {
        color: isNamed ? '#38bdf8' : '#64748b',
        weight: 1.5,
        fillColor: isNamed ? '#0ea5e9' : '#475569',
        fillOpacity: 0.9
      });

      const bName = way.tags?.['name:ar'] || way.tags?.name;
      if (bName) {
        roofPoly.bindTooltip(`🏢 ${sanitizeText(bName)}`, {
          direction: 'top',
          className: 'building-3d-tooltip'
        });
      }

      roofPoly.addTo(this.buildings3DLayer);
    });

    // 2. تجسيم الأبراج والمعالم والمجمعات العراقية في نطاق الرؤية لضمان خريطة ثلاثية أبعاد غنية في كل مكان
    const visibleLandmarks = this.allDetailedPlaces.filter(p => bounds.contains([p.lat, p.lng]));
    visibleLandmarks.slice(0, 45).forEach((p) => {
      const boxHalf = zoom >= 15 ? 0.00045 : 0.0022;
      const dLat = zoom >= 15 ? 0.00065 : 0.0032;
      const dLng = zoom >= 15 ? -0.00038 : -0.0018;

      const base = [
        [p.lat - boxHalf, p.lng - boxHalf],
        [p.lat - boxHalf, p.lng + boxHalf],
        [p.lat + boxHalf, p.lng + boxHalf],
        [p.lat + boxHalf, p.lng - boxHalf]
      ];
      const roof = base.map(([lat, lng]) => [lat + dLat, lng + dLng]);

      for (let i = 0; i < 4; i++) {
        const next = (i + 1) % 4;
        L.polygon([base[i], base[next], roof[next], roof[i]], {
          color: '#0284c7',
          weight: 1,
          fillColor: '#0369a1',
          fillOpacity: 0.78,
          interactive: false
        }).addTo(this.buildings3DLayer);
      }

      L.polygon(roof, {
        color: '#38bdf8',
        weight: 1.8,
        fillColor: '#0ea5e9',
        fillOpacity: 0.92,
        interactive: false
      }).addTo(this.buildings3DLayer);
    });
  }

  initDeviceCompassListener() {
    const handleOrientation = (event) => {
      let compassHeading = null;
      if (typeof event.webkitCompassHeading === 'number') {
        compassHeading = event.webkitCompassHeading;
      } else if (event.absolute && typeof event.alpha === 'number') {
        compassHeading = (360 - event.alpha) % 360;
      }

      if (compassHeading !== null && !isNaN(compassHeading)) {
        this.currentHeadingDeg = compassHeading;
        if (this.user3DInstance) {
          this.user3DInstance.setHeading(this.currentHeadingDeg);
        }
      }
    };

    window.addEventListener('deviceorientationabsolute', handleOrientation, true);
    window.addEventListener('deviceorientation', handleOrientation, true);
  }

  setupBaseLayers() {
    const fallbackTileSvg = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256'><rect width='256' height='256' fill='%231e293b'/></svg>";

    const osmLayer = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxNativeZoom: 19,
        maxZoom: 22,
        errorTileUrl: fallbackTileSvg
      }
    );

    const hotLayer = L.tileLayer(
      'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
      {
        maxNativeZoom: 19,
        maxZoom: 22,
        errorTileUrl: fallbackTileSvg
      }
    );

    const satelliteImagery = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxNativeZoom: 17,
        maxZoom: 22,
        errorTileUrl: fallbackTileSvg
      }
    );
    const satelliteLabelsOverlay = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      {
        maxNativeZoom: 17,
        maxZoom: 22,
        opacity: 0.92
      }
    );
    const satelliteLayer = L.layerGroup([satelliteImagery, satelliteLabelsOverlay]);

    const topoLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      {
        maxNativeZoom: 17,
        maxZoom: 22,
        errorTileUrl: fallbackTileSvg
      }
    );

    this.baseLayers = {
      osm: osmLayer,
      hot: hotLayer,
      satellite: satelliteLayer,
      topo: topoLayer
    };

    const defaultKey = this.options.defaultLayer || 'osm';
    this.setBaseLayer(defaultKey);
  }

  setBaseLayer(layerKey) {
    if (!this.baseLayers[layerKey]) {
      layerKey = 'osm';
    }
    if (this.activeBaseLayer) {
      this.map.removeLayer(this.activeBaseLayer);
    }
    this.activeBaseLayer = this.baseLayers[layerKey];
    this.map.addLayer(this.activeBaseLayer);
  }

  fitToIraq() {
    this.map.fitBounds(IRAQ_GEOMETRY.bounds, {
      padding: [30, 30],
      animate: true,
      duration: 1.2
    });
  }

  flyTo(lat, lng, zoom = 14) {
    this.map.flyTo([lat, lng], zoom, {
      animate: true,
      duration: 1.35
    });
  }

  createCustomIcon(color = "#0284c7", category = "personal") {
    const iconSymbols = {
      personal: HOLLOW_MAP_PIN_SVG,
      landmark: "🏛️",
      work: "💼",
      history: "🏺",
      emergency: "🚨",
      checkpoint: "🛡️",
      nature: "🌴",
      custom: "⭐"
    };
    const symbol = iconSymbols[category] || HOLLOW_MAP_PIN_SVG;

    return L.divIcon({
      className: 'custom-map-pin',
      html: `
        <div class="pin-wrapper" style="--pin-color: ${color}">
          <div class="pin-head">
            <span class="pin-symbol">${symbol}</span>
          </div>
          <div class="pin-pulse"></div>
        </div>
      `,
      iconSize: [38, 48],
      iconAnchor: [19, 46],
      popupAnchor: [0, -44]
    });
  }

  renderPlaces(places, handlers = {}) {
    this.markersLayer.clearLayers();

    places.forEach(place => {
      const icon = this.createCustomIcon(place.color, place.category);
      const marker = L.marker([place.lat, place.lng], { icon });

      const safeTitle = sanitizeText(place.title);
      const safeNotes = sanitizeText(place.notes || "لا توجد ملاحظات إضافية");
      const safeGov = sanitizeText(place.governorate || "العراق");
      const coordStr = formatCoordinates(place.lat, place.lng);

      const popupContent = document.createElement("div");
      popupContent.className = "map-popup-card";
      popupContent.innerHTML = `
        <div class="popup-header" style="border-right-color: ${place.color || '#0284c7'}">
          <h4 class="popup-title">${safeTitle}</h4>
          <span class="popup-badge">${safeGov}</span>
        </div>
        <p class="popup-notes">${safeNotes}</p>
        <div class="popup-coords">
          <small>🌐 ${coordStr}</small>
        </div>
        <div style="margin-bottom: 8px;">
          <button class="popup-btn pin-nav-btn" style="width: 100%; background: linear-gradient(135deg, #10b981, #059669); color: #fff; padding: 8px; font-weight: 700;">
            🧭 انطلق بالمسار إلى هذا الدبوس
          </button>
        </div>
        <div class="popup-actions">
          <button class="popup-btn copy-btn" title="نسخ الإحداثيات">📋 نسخ</button>
          <button class="popup-btn edit-btn" title="تعديل النقطة">✏️ تعديل</button>
          <button class="popup-btn delete-btn danger" title="حذف النقطة">🗑️ حذف</button>
        </div>
      `;

      popupContent.querySelector(".pin-nav-btn").addEventListener("click", () => {
        marker.closePopup();
        if (handlers.onNavigatePin) {
          handlers.onNavigatePin({
            lat: place.lat,
            lng: place.lng,
            name: place.title
          });
        }
      });

      popupContent.querySelector(".copy-btn").addEventListener("click", () => {
        navigator.clipboard.writeText(`${place.lat}, ${place.lng}`);
        if (handlers.onNotify) handlers.onNotify("تم نسخ الإحداثيات إلى الحافظة!");
      });

      popupContent.querySelector(".edit-btn").addEventListener("click", () => {
        marker.closePopup();
        if (handlers.onEdit) handlers.onEdit(place);
      });

      popupContent.querySelector(".delete-btn").addEventListener("click", () => {
        marker.closePopup();
        if (handlers.onDelete) handlers.onDelete(place.id);
      });

      marker.bindPopup(popupContent, { maxWidth: 300, minWidth: 245, className: 'iraq-custom-popup' });
      this.markersLayer.addLayer(marker);
    });
  }

  startDraggablePin(initialLatLng = null, onConfirmCallback = null, onNavigateCallback = null) {
    this.clearDraggablePin();
    this.onDraggablePinConfirm = onConfirmCallback;
    this.onDraggablePinNavigate = onNavigateCallback;

    const startPos = initialLatLng || this.map.getCenter();

    const dragIcon = L.divIcon({
      className: 'interactive-drag-pin',
      html: `
        <div class="drag-pin-container">
          <div class="drag-pin-arrow">${HOLLOW_DRAG_PIN_SVG}</div>
          <div class="drag-pin-shadow"></div>
        </div>
      `,
      iconSize: [48, 56],
      iconAnchor: [24, 54],
      popupAnchor: [0, -50]
    });

    this.draggablePin = L.marker(startPos, {
      icon: dragIcon,
      draggable: true,
      autoPan: true,
      zIndexOffset: 1600
    }).addTo(this.map);

    const updateTooltip = (latlng) => {
      const match = findClosestGovernorate(latlng.lat, latlng.lng);
      const coordStr = formatCoordinates(latlng.lat, latlng.lng);
      this.draggablePin.bindTooltip(`
        <div style="direction: rtl; text-align: right; font-family: 'Cairo', sans-serif;">
          <strong>🎯 دبوس تفاعلي حر \u200F( ${sanitizeText(match.governorate)} )\u200F</strong><br>
          <small style="color: #64748b;">${coordStr}</small>
        </div>
      `, { permanent: false, direction: 'top', className: 'drag-pin-tooltip' });
    };

    updateTooltip(startPos);

    this.draggablePin.on('drag', (e) => {
      updateTooltip(e.target.getLatLng());
    });

    this.draggablePin.on('dragend', (e) => {
      const pos = e.target.getLatLng();
      updateTooltip(pos);
      this.showPinConfirmPopup(pos);
    });

    this.showPinConfirmPopup(startPos);
  }

  showPinConfirmPopup(latlng) {
    if (!this.draggablePin) return;

    const match = findClosestGovernorate(latlng.lat, latlng.lng);
    const content = document.createElement('div');
    content.className = 'drag-confirm-popup';
    content.innerHTML = `
      <div style="font-family: 'Cairo', sans-serif; text-align: center; padding: 6px; min-width: 230px;">
        <h4 id="dragPinTitleHeading" style="margin: 0 0 4px; color: #0284c7; font-size: 0.95rem; display: inline-flex; align-items: center; justify-content: center; gap: 5px;">${HOLLOW_MAP_PIN_SVG} <span>دبوس التحديد \u200F( ${sanitizeText(match.governorate)} )\u200F</span></h4>
        <p style="margin: 0 0 10px; font-size: 0.76rem; color: #64748b;">
          ${formatCoordinates(latlng.lat, latlng.lng)}
        </p>
        <div style="display: flex; flex-direction: column; gap: 6px;">
          <button id="taxiToPinBtn" class="popup-btn" style="background: linear-gradient(135deg, #d97706, #f59e0b); color: white; width: 100%; padding: 7px 10px; font-weight: 800;">
            🚖 اطلب سيارة أجرة لهذا الدبوس
          </button>
          <button id="hubAtPinBtn" class="popup-btn" style="background: linear-gradient(135deg, #e11d48, #f43f5e); color: white; width: 100%; padding: 7px 10px; font-weight: 800;">
            🔴 بث مباشر / منيو / 3D هنا
          </button>
          <button id="navToPinBtn" class="popup-btn" style="background: linear-gradient(135deg, #10b981, #059669); color: white; width: 100%; padding: 7px 10px; font-weight: 700;">
            🧭 انطلق بالمسار إلى هذا الدبوس
          </button>
          <button id="confirmPinBtn" class="popup-btn" style="background: #0284c7; color: white; width: 100%; padding: 7px 10px; font-weight: 700;">
            💾 حفظ كنقطة وملاحظة هنا
          </button>
        </div>
      </div>
    `;

    let resolvedTitle = `موقع محدد \u200F( ${match.governorate} )\u200F`;
    // جلب اسم البناية الفعلي عند موضع الدبوس فوراً
    this.reverseGeocodeBuildingAt(latlng.lat, latlng.lng).then((detectedName) => {
      if (detectedName) {
        resolvedTitle = detectedName;
        const headingEl = content.querySelector('#dragPinTitleHeading span');
        if (headingEl) {
          headingEl.textContent = formatArabicParentheses(detectedName);
        }
      }
    });

    content.querySelector('#taxiToPinBtn').addEventListener('click', () => {
      const finalPos = this.draggablePin.getLatLng();
      this.draggablePin.closePopup();
      if (this.onSelectPlaceCallback) {
        this.onSelectPlaceCallback({
          id: `pin_${Date.now()}`,
          name: resolvedTitle,
          city: match.governorate,
          gov: match.governorate,
          lat: finalPos.lat,
          lng: finalPos.lng
        }, 'taxi');
      }
    });

    content.querySelector('#hubAtPinBtn').addEventListener('click', () => {
      const finalPos = this.draggablePin.getLatLng();
      this.draggablePin.closePopup();
      if (this.onSelectPlaceCallback) {
        this.onSelectPlaceCallback({
          id: `pin_${Date.now()}`,
          name: resolvedTitle,
          city: match.governorate,
          gov: match.governorate,
          lat: finalPos.lat,
          lng: finalPos.lng
        }, 'hub');
      }
    });

    content.querySelector('#navToPinBtn').addEventListener('click', () => {
      const finalPos = this.draggablePin.getLatLng();
      const gov = findClosestGovernorate(finalPos.lat, finalPos.lng);
      this.clearDraggablePin();
      if (this.onDraggablePinNavigate) {
        this.onDraggablePinNavigate({
          lat: finalPos.lat,
          lng: finalPos.lng,
          name: resolvedTitle || `موقع محدد \u200F( ${gov.governorate} )\u200F`
        });
      }
    });

    content.querySelector('#confirmPinBtn').addEventListener('click', () => {
      const finalPos = this.draggablePin.getLatLng();
      if (this.onDraggablePinConfirm) {
        this.onDraggablePinConfirm(finalPos.lat, finalPos.lng);
      }
    });

    this.draggablePin.bindPopup(content, { closeButton: true }).openPopup();
  }

  clearDraggablePin() {
    if (this.draggablePin) {
      this.map.removeLayer(this.draggablePin);
      this.draggablePin = null;
    }
  }

  setUser3DModel(modelId) {
    this.active3DModelId = modelId;
    if (this.user3DInstance) {
      this.user3DInstance.updateModel(modelId);
    } else if (this.userLocationLatLng) {
      this.updateUserLocation(this.userLocationLatLng.lat, this.userLocationLatLng.lng, this.lastAccuracy || 0, this.currentHeadingDeg);
    }
  }

  /**
   * اكتشاف اسم البناية أو المنطقة أو المؤسسة (مثل مجموعة العميد التعليمية أو العطيشي) التي يقف فيها المستخدم حالياً
   * عبر قاعدة البيانات المحلية الشاملة + محركي Nominatim و ArcGIS
   */
  async reverseGeocodeBuildingAt(lat, lng) {
    // 1. البحث في قاعدة الأماكن المحلية الدقيقة أولاً (مسافة أقل من 350 متر)
    let closestLocal = null;
    let minDist = 0.35;
    for (const pl of this.allDetailedPlaces) {
      const dist = calculateDistanceKm(lat, lng, pl.lat, pl.lng);
      if (dist <= minDist) {
        minDist = dist;
        closestLocal = pl;
      }
    }
    if (closestLocal) {
      return closestLocal.name;
    }

    if (!navigator.onLine) return null;

    // 2. الاستعلام عبر Nominatim + ArcGIS بالتوازي لضمان أعلى دقة في العراق
    try {
      const nominatimPromise = fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&accept-language=ar`
      ).then(r => (r.ok ? r.json() : null)).catch(() => null);

      const arcgisPromise = fetch(
        `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?location=${lng},${lat}&langCode=ar&outSR=4326&f=json`
      ).then(r => (r.ok ? r.json() : null)).catch(() => null);

      const [nomData, arcData] = await Promise.all([nominatimPromise, arcgisPromise]);

      const addr = nomData?.address || {};
      const arcAddr = arcData?.address || {};

      const specificName =
        nomData?.name ||
        arcAddr.Address ||
        arcAddr.Neighborhood ||
        arcAddr.District ||
        addr.school ||
        addr.university ||
        addr.college ||
        addr.hospital ||
        addr.building ||
        addr.amenity ||
        addr.shop ||
        addr.commercial ||
        addr.neighbourhood ||
        addr.suburb ||
        addr.quarter ||
        arcAddr.Match_addr;

      if (specificName) {
        const gov = findClosestGovernorate(lat, lng).governorate;
        const poiObj = {
          id: `rev_${lat.toFixed(4)}_${lng.toFixed(4)}`,
          name: specificName,
          gov,
          type: 'building',
          lat,
          lng,
          icon: '🏢'
        };
        this.registerAndPlotDiscoveredPlace(poiObj, false);
        return specificName;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  /**
   * تحديث موقع المستخدم مع عرض المجسم الثلاثي الأبعاد واكتشاف اسم البناية الحالية فوراً
   */
  updateUserLocation(lat, lng, accuracy = 0, heading = null, isMoving = false, speedKmh = 0) {
    if (typeof heading === 'number' && !isNaN(heading)) {
      this.currentHeadingDeg = heading;
    } else if (this.lastUserLatLng) {
      const movedDistKm = calculateDistanceKm(this.lastUserLatLng.lat, this.lastUserLatLng.lng, lat, lng);
      if (movedDistKm > 0.004) {
        this.currentHeadingDeg = calculateBearing(this.lastUserLatLng.lat, this.lastUserLatLng.lng, lat, lng);
        isMoving = true;
      }
    }

    this.lastUserLatLng = { lat, lng };
    this.userLocationLatLng = { lat, lng };
    this.lastAccuracy = accuracy;

    // جلب اسم البناية/الموقع الذي يقف فيه المستخدم حالياً وتحديث الشارة
    const revKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    if (revKey !== this.lastReverseGeocodeKey) {
      this.lastReverseGeocodeKey = revKey;
      this.reverseGeocodeBuildingAt(lat, lng).then((bName) => {
        if (bName) {
          this.currentStandingBuildingName = bName;
          const bLabelEl = document.getElementById('userStandingPlaceLabel');
          if (bLabelEl) {
            bLabelEl.textContent = `🏢 ${formatArabicParentheses(bName)}`;
            bLabelEl.style.display = 'block';
          }
        }
      });
      this.scheduleLiveStreetDetailsFetch(true);
    }

    if (this.userLocationMarker) {
      this.userLocationMarker.setLatLng([lat, lng]);

      if (this.user3DInstance) {
        this.user3DInstance.setHeading(this.currentHeadingDeg);
        this.user3DInstance.setMotionState(isMoving, speedKmh);
      }

      if (this.accuracyCircle) {
        this.accuracyCircle.setLatLng([lat, lng]);
        this.accuracyCircle.setRadius(accuracy);
      }

      const el = this.userLocationMarker.getElement();
      if (el && this.user3DInstance?.canvas) {
        const host = el.querySelector('.user-3d-canvas-host');
        if (host && !host.contains(this.user3DInstance.canvas)) {
          host.innerHTML = '';
          host.appendChild(this.user3DInstance.canvas);
        }
      }
      this.update3DMarkerScaleForZoom();
      return;
    }

    if (this.user3DInstance) {
      this.user3DInstance.destroy();
      this.user3DInstance = null;
    }

    const canvasSize = 136;
    this.user3DInstance = threeEngine ? threeEngine.createMarker3DCanvas(this.active3DModelId || 'arrow', canvasSize) : null;
    if (this.user3DInstance) {
      this.user3DInstance.setHeading(this.currentHeadingDeg);
      this.user3DInstance.setMotionState(isMoving, speedKmh);
    }

    const userIcon = L.divIcon({
      className: 'user-3d-gps-pin',
      html: `
        <div class="user-3d-pin-wrapper" style="--marker-zoom-scale: 1;">
          <div class="user-3d-canvas-host"></div>
          <div class="user-3d-pulse-ring"></div>
          <div class="user-3d-shadow"></div>
        </div>
      `,
      iconSize: [canvasSize, canvasSize],
      iconAnchor: [canvasSize / 2, canvasSize * 0.62]
    });

    this.userLocationMarker = L.marker([lat, lng], {
      icon: userIcon,
      zIndexOffset: 2500
    }).addTo(this.map);

    const attachLiveCanvas = () => {
      const el = this.userLocationMarker ? this.userLocationMarker.getElement() : null;
      if (el && this.user3DInstance?.canvas) {
        const host = el.querySelector('.user-3d-canvas-host');
        if (host && !host.contains(this.user3DInstance.canvas)) {
          host.innerHTML = '';
          host.appendChild(this.user3DInstance.canvas);
        }
      }
      this.update3DMarkerScaleForZoom();
    };

    attachLiveCanvas();
    this.userLocationMarker.on('add', attachLiveCanvas);

    this.userLocationMarker.bindPopup(`
      <div style="text-align: center; font-family: 'Cairo', sans-serif; min-width: 215px; padding: 4px;">
        <strong style="color: #0284c7; font-size: 0.98rem; display: inline-flex; align-items: center; justify-content: center; gap: 5px;">${HOLLOW_MAP_PIN_SVG} <span>موقعك الفعلي المباشر</span></strong><br>
        <div id="userStandingPlaceLabel" style="color: #f59e0b; font-weight: 800; font-size: 0.85rem; margin: 4px 0; ${this.currentStandingBuildingName ? 'display:block;' : 'display:none;'}">
          🏢 ${sanitizeText(this.currentStandingBuildingName)}
        </div>
        <span style="color: #10b981; font-weight: 700; font-size: 0.8rem;">🧭 الاتجاه الحقيقي \u200F( ${Math.round(this.currentHeadingDeg)}° )\u200F</span><br>
        <small style="color: #64748b;">الدقة: ±${Math.round(accuracy)} متر</small><br>
        <div style="margin-top: 8px;">
          <button id="addHereGpsBtn" class="popup-btn" style="width: 100%; background: #0284c7; color: white;">➕ سجل نقطة هنا</button>
        </div>
      </div>
    `);

    if (accuracy > 0 && accuracy < 5000) {
      this.accuracyCircle = L.circle([lat, lng], {
        radius: accuracy,
        color: '#0284c7',
        fillColor: '#38bdf8',
        fillOpacity: 0.12,
        weight: 1.5
      }).addTo(this.map);
    }
  }

  renderDetailedPlaces(placesList, onSelectPlaceCallback = null) {
    this.allDetailedPlaces = Array.isArray(placesList) ? placesList : [];
    this.onSelectPlaceCallback = onSelectPlaceCallback;
    this.updatePlacesVisibilityByZoom();
  }

  /**
   * تسجيل أي منطقة أو بناية مكتشفة ووضع شارتها النصية في موقعها الصحيح على الخريطة فوراً
   */
  registerAndPlotDiscoveredPlace(placeObj, openPopupNow = false) {
    if (!placeObj || !placeObj.name || isNaN(placeObj.lat) || isNaN(placeObj.lng)) return null;
    const saved = registerNewPlaceInGazetteer(placeObj) || placeObj;
    this.liveFetchedPlaces.set(saved.id, saved);

    if (this.placesLabelsEnabled && this.livePoiLayer) {
      const marker = this.addPlaceBadgeMarker(saved, this.livePoiLayer);
      if (openPopupNow && marker) {
        setTimeout(() => marker.openPopup(), 250);
      }
      return marker;
    }
    return null;
  }

  setSocialMapCategoryFilter(filterKey = 'all') {
    this.socialMapFilter = filterKey;
    this.updatePlacesVisibilityByZoom();
  }

  /**
   * فلترة ورسم الأماكن حسب مستوى تكبير الخريطة ونطاق الرؤية (Zoom & Viewport LOD)
   */
  updatePlacesVisibilityByZoom() {
    if (!this.placesLabelsLayer) return;
    this.placesLabelsLayer.clearLayers();
    if (!this.placesLabelsEnabled || !this.allDetailedPlaces.length) return;

    const currentZoom = this.map.getZoom();
    const paddedBounds = this.map.getBounds().pad(0.35);
    const activeFilter = this.socialMapFilter || 'all';

    const visiblePlaces = this.allDetailedPlaces.filter((p) => {
      if (activeFilter === 'restaurant') {
        const isFood = /مطعم|كباب|مسكوف|مندي|كافيه|مقهى|حلويات|مأكولات|برغر|بيتزا/.test(p.name) || p.type === 'restaurant';
        if (!isFood) return false;
      } else if (activeFilter === 'mall') {
        const isShop = /مول|سوق|سنتر|ماركت|تجاري|شارع/.test(p.name) || p.type === 'mall' || p.type === 'shop';
        if (!isShop) return false;
      }

      const isMajorCapital = MAJOR_CAPITALS_IDS.has(p.id) || p.type === 'capital';
      if (activeFilter !== 'all' && paddedBounds.contains([p.lat, p.lng])) {
        return true;
      }
      if (currentZoom <= 8) {
        return isMajorCapital;
      }
      if (!paddedBounds.contains([p.lat, p.lng])) {
        return false;
      }
      if (currentZoom <= 9) {
        return isMajorCapital || p.importance === 1;
      }
      if (currentZoom <= 11) {
        return isMajorCapital || p.importance <= 2;
      }
      return true;
    });

    visiblePlaces.forEach((p) => {
      this.addPlaceBadgeMarker(p, this.placesLabelsLayer);
    });
  }

  addPlaceBadgeMarker(p, targetLayer) {
    const isMajorCapital = MAJOR_CAPITALS_IDS.has(p.id) || p.type === 'capital';
    const cleanLabel = sanitizeText(p.name);
    const isLiveHighlight = this.socialMapFilter === 'livecam';
    const badgeIcon = L.divIcon({
      className: 'iraq-place-badge-marker',
      html: `
        <div class="place-pin-dot ${isMajorCapital ? 'major-capital' : 'sub-place'}" data-type="${p.type}" dir="rtl">
          <span class="dot-core" style="${isLiveHighlight ? 'background:#e11d48;box-shadow:0 0 8px #e11d48;' : ''}"></span>
          <span class="dot-icon">${isLiveHighlight ? '🔴' : (p.icon || '📍')}</span>
          <span class="dot-label" dir="rtl">${cleanLabel}</span>
        </div>
      `,
      iconSize: [110, 24],
      iconAnchor: [55, 12]
    });

    const marker = L.marker([p.lat, p.lng], {
      icon: badgeIcon,
      zIndexOffset: isMajorCapital ? 600 : 280
    });

    marker.on('click', () => {
      if (this.onSelectPlaceCallback) {
        this.onSelectPlaceCallback(p, 'hub');
      }
    });

    const popupContent = document.createElement('div');
    popupContent.className = 'place-detail-popup';
    popupContent.innerHTML = `
      <div style="direction: rtl; text-align: right; font-family: 'Cairo', sans-serif; min-width: 240px; padding: 2px;">
        <h4 style="margin: 0 0 4px; color: #0284c7; font-size: 0.98rem;" dir="rtl">${p.icon || '📍'} ${cleanLabel}</h4>
        <div style="font-size: 0.78rem; color: #64748b; margin-bottom: 10px;" dir="rtl">
          <span>المحافظة: <strong>${sanitizeText(p.gov || p.city || 'العراق')}</strong></span>
          <span style="margin-right: 6px;" dir="ltr">(${Number(p.lat).toFixed(4)}, ${Number(p.lng).toFixed(4)})</span>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-bottom: 6px;">
          <button class="popup-btn hub-taxi-btn" style="background: #f59e0b; color: #0f172a; font-weight: 800; padding: 6px 8px;">
            🚖 طلب تكسي
          </button>
          <button class="popup-btn hub-shop-btn" style="background: #10b981; color: white; font-weight: 800; padding: 6px 8px;">
            🛍️ المنيو والشراء
          </button>
          <button class="popup-btn hub-live-btn" style="background: #e11d48; color: white; font-weight: 800; padding: 6px 8px;">
            🔴 بث مباشر
          </button>
          <button class="popup-btn hub-3d-btn" style="background: #0284c7; color: white; font-weight: 800; padding: 6px 8px;">
            🧊 مجسم 3D
          </button>
        </div>
        <div style="display: flex; flex-direction: column; gap: 5px;">
          <button class="popup-btn hub-cityrt-btn" style="background: linear-gradient(135deg, #d97706, #f59e0b); color: white; width: 100%; padding: 6px 10px; font-weight: 800; font-size: 1.05rem;" title="التجول الحي هنا">
            🎮
          </button>
          <button class="popup-btn nav-to-here-btn" style="background: linear-gradient(135deg, #10b981, #059669); color: white; width: 100%; padding: 6px 10px; font-weight: 700;">
            🧭 انطلق بالمسار إلى هذا البن مباشرة
          </button>
          <button class="popup-btn save-place-btn" style="background: #334155; color: white; width: 100%; padding: 5px 10px;">
            📌 حفظ في نقاطي المفضلة
          </button>
        </div>
      </div>
    `;

    popupContent.querySelector('.hub-taxi-btn').addEventListener('click', () => {
      marker.closePopup();
      if (this.onSelectPlaceCallback) this.onSelectPlaceCallback(p, 'taxi');
    });

    popupContent.querySelector('.hub-shop-btn').addEventListener('click', () => {
      marker.closePopup();
      if (this.onSelectPlaceCallback) this.onSelectPlaceCallback(p, 'shop');
    });

    popupContent.querySelector('.hub-live-btn').addEventListener('click', () => {
      marker.closePopup();
      if (this.onSelectPlaceCallback) this.onSelectPlaceCallback(p, 'livecam');
    });

    popupContent.querySelector('.hub-3d-btn').addEventListener('click', () => {
      marker.closePopup();
      if (this.onSelectPlaceCallback) this.onSelectPlaceCallback(p, 'stage3d');
    });

    popupContent.querySelector('.hub-cityrt-btn').addEventListener('click', () => {
      marker.closePopup();
      if (this.onSelectPlaceCallback) this.onSelectPlaceCallback(p, 'cityrt');
    });

    popupContent.querySelector('.nav-to-here-btn').addEventListener('click', () => {
      marker.closePopup();
      if (this.onSelectPlaceCallback) this.onSelectPlaceCallback(p, 'navigate');
    });

    popupContent.querySelector('.save-place-btn').addEventListener('click', () => {
      marker.closePopup();
      if (this.onSelectPlaceCallback) this.onSelectPlaceCallback(p, 'save');
    });

    marker.bindPopup(popupContent, { minWidth: 250, className: 'iraq-custom-popup' });
    targetLayer.addLayer(marker);
    return marker;
  }

  /**
   * جلب وتكثيف كافة البيانات النصية للأحياء والمقاطعات والبنايات والمدارس والمجمعات والمحلات والشوارع ووضعها في مواقعها الصحيحة
   */
  scheduleLiveStreetDetailsFetch(force = false) {
    if (this.overpassTimer) clearTimeout(this.overpassTimer);

    const zoom = this.map.getZoom();
    if (zoom < 11 && !this.is3DMapView) {
      this.livePoiLayer.clearLayers();
      this.buildings3DLayer.clearLayers();
      return;
    }

    this.overpassTimer = setTimeout(() => {
      this.fetchLiveStreetPOIsAndBuildings(force);
    }, 320);
  }

  async fetchLiveStreetPOIsAndBuildings(force = false) {
    if (!navigator.onLine || (!this.placesLabelsEnabled && !this.is3DMapView)) return;
    const zoom = this.map.getZoom();
    if (zoom < 11 && !this.is3DMapView) return;

    const bounds = this.map.getBounds();
    const s = bounds.getSouth().toFixed(3);
    const w = bounds.getWest().toFixed(3);
    const n = bounds.getNorth().toFixed(3);
    const e = bounds.getEast().toFixed(3);
    const key = `${s},${w},${n},${e}_${this.is3DMapView ? '3d' : '2d'}_z${Math.min(zoom, 17)}`;
    if (!force && key === this.lastFetchedBoundsKey) return;
    this.lastFetchedBoundsKey = key;

    const overpassMirrors = [
      'https://overpass-api.de/api/interpreter',
      'https://lz4.overpass-api.de/api/interpreter',
      'https://overpass.kumi.systems/api/interpreter'
    ];

    try {
      // فصل استعلام الأسماء النصية (لضمان عدم استهلاك الحصة بمضلعات بيوت غير مسماة) مع جلب مضلعات المباني عند تفعيل الـ 3D أو الزووم العالي
      const includeBuildingFootprints = (this.is3DMapView || zoom >= 16) ? `way["building"](${s},${w},${n},${e});` : '';
      const query = `[out:json][timeout:12];(node["place"](${s},${w},${n},${e});way["place"](${s},${w},${n},${e});node["name"](${s},${w},${n},${e});way["name"](${s},${w},${n},${e});relation["name"](${s},${w},${n},${e});${includeBuildingFootprints});out center geom qt 320;`;

      let data = null;
      for (const endpoint of overpassMirrors) {
        try {
          const res = await fetch(`${endpoint}?data=${encodeURIComponent(query)}`);
          if (res.ok) {
            data = await res.json();
            if (data && Array.isArray(data.elements)) break;
          }
        } catch (mirrorErr) {
          // الانتقال للخادم الاحتياطي التالي
        }
      }

      if (!data || !Array.isArray(data.elements)) return;

      this.livePoiLayer.clearLayers();
      this.cachedOsmWays = [];

      const centerGov = findClosestGovernorate(bounds.getCenter().lat, bounds.getCenter().lng).governorate;
      const seenNamesInView = new Set();

      data.elements.forEach((el) => {
        const tags = el.tags || {};
        if (el.type === 'way' && el.geometry && (tags.building || tags.amenity || tags.name)) {
          this.cachedOsmWays.push(el);
        }

        const rawName = tags['name:ar'] || tags.name || tags['official_name:ar'] || tags.official_name || this.resolveFallbackBuildingName(tags);
        if (!rawName) return;

        let lat = el.lat ?? el.center?.lat;
        let lng = el.lon ?? el.center?.lon;
        if ((lat === undefined || lng === undefined) && Array.isArray(el.geometry) && el.geometry.length > 0) {
          const mid = el.geometry[Math.floor(el.geometry.length / 2)];
          lat = mid.lat;
          lng = mid.lon;
        }
        if (lat === undefined || lng === undefined) return;

        const dedupKey = `${rawName}_${Number(lat).toFixed(3)}_${Number(lng).toFixed(3)}`;
        if (seenNamesInView.has(dedupKey)) return;
        seenNamesInView.add(dedupKey);

        const poiObj = {
          id: `osm_${el.type}_${el.id}`,
          name: rawName,
          gov: centerGov,
          sub: tags.place ? 'منطقة / حي' : (tags.building ? 'بناية' : centerGov),
          type: tags.place ? 'district' : (tags.building ? 'building' : 'poi'),
          lat: Number(lat),
          lng: Number(lng),
          icon: this.resolveOsmIcon(tags),
          importance: tags.place ? 2 : 3
        };

        this.liveFetchedPlaces.set(poiObj.id, poiObj);
        // حفظ الموقع النصي المكتشف في الموسوعة المحلية ليبقى متاحاً دائماً في البحث وعلى الخريطة
        registerNewPlaceInGazetteer(poiObj);

        if (this.placesLabelsEnabled) {
          this.addPlaceBadgeMarker(poiObj, this.livePoiLayer);
        }
      });

      if (this.is3DMapView) {
        this.render3DExtrudedBuildings();
      }
    } catch (err) {
      if (this.is3DMapView) {
        this.render3DExtrudedBuildings();
      }
    }
  }

  resolveFallbackBuildingName(tags = {}) {
    if (tags.amenity === 'school') return 'مدرسة تعليمية';
    if (tags.amenity === 'university') return 'حرم جامعي';
    if (tags.amenity === 'college') return 'كلية / معهد';
    if (tags.amenity === 'kindergarten') return 'روضة أطفال';
    if (tags.amenity === 'hospital') return 'مستشفى';
    if (tags.amenity === 'clinic') return 'مركز طبي / عيادة';
    if (tags.amenity === 'pharmacy') return 'صيدلية';
    if (tags.amenity === 'mosque' || tags.amenity === 'place_of_worship') return 'مسجد / جامع';
    if (tags.amenity === 'fuel') return 'محطة وقود';
    if (tags.shop === 'mall') return 'مول تجاري';
    if (tags.shop === 'supermarket') return 'سوبرماركت';
    return null;
  }

  resolveOsmIcon(tags = {}) {
    if (tags.shop === 'mall' || tags.shop === 'department_store') return '🛍️';
    if (tags.shop === 'supermarket' || tags.shop === 'convenience') return '🛒';
    if (tags.shop) return '🏪';
    if (tags.amenity === 'restaurant' || tags.amenity === 'fast_food') return '🍽️';
    if (tags.amenity === 'cafe') return '☕';
    if (tags.amenity === 'hospital' || tags.amenity === 'clinic') return '🏥';
    if (tags.amenity === 'pharmacy') return '💊';
    if (tags.amenity === 'university' || tags.amenity === 'school' || tags.amenity === 'college' || tags.amenity === 'kindergarten') return '🎓';
    if (tags.amenity === 'place_of_worship') return '🕌';
    if (tags.amenity === 'bank' || tags.amenity === 'atm') return '🏦';
    if (tags.amenity === 'fuel') return '⛽';
    if (tags.tourism === 'hotel') return '🏨';
    if (tags.building) return '🏢';
    return '📍';
  }

  togglePlacesLabels(show = null) {
    this.placesLabelsEnabled = show !== null ? show : !this.placesLabelsEnabled;
    this.updatePlacesVisibilityByZoom();
    if (!this.placesLabelsEnabled) {
      this.livePoiLayer.clearLayers();
    } else {
      this.scheduleLiveStreetDetailsFetch(true);
    }
    return this.placesLabelsEnabled;
  }

  toggleMeasureMode() {
    this.isMeasuring = !this.isMeasuring;
    if (!this.isMeasuring) {
      this.clearMeasurement();
    }
    return this.isMeasuring;
  }

  addMeasurePoint(latlng) {
    this.measurePoints.push([latlng.lat, latlng.lng]);
    this.renderMeasurement();
  }

  renderMeasurement() {
    this.measureLayer.clearLayers();
    if (this.measurePoints.length === 0) return;

    this.measurePoints.forEach((pt, i) => {
      const circle = L.circleMarker(pt, {
        radius: 6,
        color: '#f59e0b',
        fillColor: '#ffffff',
        fillOpacity: 1,
        weight: 2
      });
      circle.bindTooltip(`نقطة ${i + 1}`, { permanent: true, direction: 'top', className: 'measure-tooltip' });
      this.measureLayer.addLayer(circle);
    });

    if (this.measurePoints.length > 1) {
      const polyline = L.polyline(this.measurePoints, {
        color: '#f59e0b',
        weight: 3,
        dashArray: '6, 8'
      });
      this.measureLayer.addLayer(polyline);

      const totalDist = calculatePathDistanceKm(this.measurePoints);
      const lastPoint = this.measurePoints[this.measurePoints.length - 1];

      L.popup()
        .setLatLng(lastPoint)
        .setContent(`
          <div style="font-family: 'Cairo', sans-serif; text-align: center;">
            <strong>📐 المسافة الإجمالية:</strong><br>
            <span style="font-size: 1.15rem; color: #d97706; font-weight: bold;">${totalDist.toFixed(2)} كم</span><br>
            <small style="color: #64748b;">\u200F( انقر لإضافة نقاط إضافية )\u200F</small>
          </div>
        `)
        .openOn(this.map);
    }
  }

  clearMeasurement() {
    this.measurePoints = [];
    this.measureLayer.clearLayers();
    this.map.closePopup();
  }
}
