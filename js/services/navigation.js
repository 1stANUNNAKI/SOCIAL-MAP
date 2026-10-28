/**
 * خدمة الملاحة والتوجيه الذكي بالدبابيس التفاعلية (Interactive Pin-to-Pin Navigation & Tracking)
 * تتيح الانتقال من وجهة إلى أخرى عبر سحب دبابيس البداية (🅰️) والوجهة (🏁) مباشرة على الخريطة
 * أو النقر المباشر على أي نقطة/معلم بدون أي قوائم منسدلة تقليدية.
 */

import { calculateDistanceKm, calculateBearing, findClosestGovernorate, sanitizeText } from './geoutils.js?v=16';

export class TripNavigation {
  constructor(mapEngine) {
    this.mapEngine = mapEngine;
    this.activeRoute = null;
    this.origin = null;
    this.destination = null;
    this.routePolyline = null;
    this.glowPolyline = null;
    this.startMarker = null;
    this.endMarker = null;
    this.isTripActive = false;
    this.isSimulating = false;
    this.simulationTimer = null;
    this.autoFollowCamera = true;
    this.callbacks = {};
    this.isPinNavMode = false;
  }

  /**
   * تفعيل وضع الملاحة المباشر بالدبابيس (Pin-to-Pin Mode)
   * ينشئ دبوس الانطلاق (أخضر قابل للسحب) ودبوس الوجهة (أحمر قابل للسحب) ويرسم المسار فوراً
   */
  async activatePinToPinNavigation(initialOrigin = null, initialDest = null, callbacks = {}) {
    this.callbacks = callbacks;
    this.isPinNavMode = true;
    this.isTripActive = true;

    // 1. تحديد نقطة البداية (موقع المستخدم الفعلي إن وجد، أو وسط الخريطة/بغداد)
    if (initialOrigin) {
      this.origin = { ...initialOrigin };
    } else if (this.mapEngine.userLocationLatLng) {
      const gov = findClosestGovernorate(this.mapEngine.userLocationLatLng.lat, this.mapEngine.userLocationLatLng.lng);
      this.origin = {
        lat: this.mapEngine.userLocationLatLng.lat,
        lng: this.mapEngine.userLocationLatLng.lng,
        name: `موقعي \u200F( ${gov.governorate} )\u200F`
      };
    } else {
      const c = this.mapEngine.map.getCenter();
      const gov = findClosestGovernorate(c.lat, c.lng);
      this.origin = {
        lat: c.lat,
        lng: c.lng,
        name: `نقطة الانطلاق \u200F( ${gov.governorate} )\u200F`
      };
    }

    // 2. تحديد نقطة الوجهة (إما الوجهة الممررة أو نقطة قريبة قابلة للسحب)
    if (initialDest) {
      this.destination = { ...initialDest };
    } else {
      const destLat = this.origin.lat + 0.045;
      const destLng = this.origin.lng + 0.045;
      const gov = findClosestGovernorate(destLat, destLng);
      this.destination = {
        lat: destLat,
        lng: destLng,
        name: `الوجهة \u200F( ${gov.governorate} )\u200F`
      };
    }

    // إظهار موقع المستخدم بالمجسم الثلاثي الأبعاد عند نقطة الانطلاق وتوجيهه نحو الوجهة
    const initialBearing = calculateBearing(this.origin.lat, this.origin.lng, this.destination.lat, this.destination.lng);
    this.mapEngine.updateUserLocation(this.origin.lat, this.origin.lng, 12, initialBearing, false, 0);

    await this.calculateAndRenderPinRoute(true);
    return this.activeRoute;
  }

  /**
   * تعيين الوجهة مباشرة عند النقر على الخريطة أو على أي دبوس/معلم
   */
  async setDestinationPin(lat, lng, customName = null) {
    const gov = findClosestGovernorate(lat, lng);
    this.destination = {
      lat,
      lng,
      name: customName || `وجهة مخصصة \u200F( ${gov.governorate} )\u200F`
    };

    if (!this.origin) {
      if (this.mapEngine.userLocationLatLng) {
        this.origin = {
          lat: this.mapEngine.userLocationLatLng.lat,
          lng: this.mapEngine.userLocationLatLng.lng,
          name: 'موقعي الحالي'
        };
      } else {
        this.origin = { lat: 33.3152, lng: 44.3661, name: 'بغداد' };
      }
    }

    this.isTripActive = true;
    this.isPinNavMode = true;
    return await this.calculateAndRenderPinRoute(false);
  }

  /**
   * تعيين نقطة الانطلاق مباشرة عبر سحب الدبوس
   */
  async setOriginPin(lat, lng, customName = null) {
    const gov = findClosestGovernorate(lat, lng);
    this.origin = {
      lat,
      lng,
      name: customName || `انطلاق \u200F( ${gov.governorate} )\u200F`
    };

    const bearing = this.destination
      ? calculateBearing(lat, lng, this.destination.lat, this.destination.lng)
      : 0;
    this.mapEngine.updateUserLocation(lat, lng, 10, bearing, false, 0);

    return await this.calculateAndRenderPinRoute(false);
  }

  /**
   * حساب المسار الفعلي (OSRM أونلاين أو جيوديسي أوفلاين) ورسم الدبابيس القابلة للسحب
   */
  async calculateAndRenderPinRoute(fitBounds = false) {
    if (!this.origin || !this.destination) return null;

    let coordinates = [];
    let distanceKm = 0;
    let estimatedMinutes = 0;
    let isOsrm = false;

    if (navigator.onLine) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3200);

        const url = `https://router.project-osrm.org/route/v1/driving/${this.origin.lng},${this.origin.lat};${this.destination.lng},${this.destination.lat}?overview=full&geometries=geojson`;
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
            const r = data.routes[0];
            coordinates = r.geometry.coordinates.map(coord => [coord[1], coord[0]]);
            distanceKm = r.distance / 1000;
            estimatedMinutes = Math.max(1, Math.round(r.duration / 60));
            isOsrm = true;
          }
        }
      } catch (e) {
        // التحول التلقائي السلس للوضع المحلي الأوفلاين
      }
    }

    if (!isOsrm || coordinates.length === 0) {
      const directDist = calculateDistanceKm(this.origin.lat, this.origin.lng, this.destination.lat, this.destination.lng);
      distanceKm = directDist * 1.12;
      estimatedMinutes = Math.max(1, Math.round((distanceKm / 80) * 60));

      const numSteps = Math.max(20, Math.min(80, Math.round(distanceKm * 1.5)));
      coordinates = [];
      for (let i = 0; i <= numSteps; i++) {
        const t = i / numSteps;
        const curLat = this.origin.lat + (this.destination.lat - this.origin.lat) * t;
        const curLng = this.origin.lng + (this.destination.lng - this.origin.lng) * t;
        coordinates.push([curLat, curLng]);
      }
    }

    const bearingDeg = calculateBearing(this.origin.lat, this.origin.lng, this.destination.lat, this.destination.lng);

    this.activeRoute = {
      origin: this.origin,
      destination: this.destination,
      coordinates,
      distanceKm,
      estimatedMinutes,
      bearingDeg: Math.round(bearingDeg),
      bearingLabel: this.formatBearingArabic(bearingDeg),
      isOsrm
    };

    this.renderInteractivePinsAndRoute(fitBounds);

    // توجيه سهم/شخصية المستخدم نحو بداية المسار الفعلي
    if (coordinates.length > 1) {
      const firstStepBearing = calculateBearing(coordinates[0][0], coordinates[0][1], coordinates[1][0], coordinates[1][1]);
      this.mapEngine.updateUserLocation(this.origin.lat, this.origin.lng, 10, firstStepBearing, false, 0);
    }

    if (this.callbacks.onRouteUpdated) {
      this.callbacks.onRouteUpdated(this.activeRoute);
    }

    return this.activeRoute;
  }

  /**
   * رسم خط المسار المضيء ودبابيس البداية والوجهة التفاعلية القابلة للسحب
   */
  renderInteractivePinsAndRoute(fitBounds = false) {
    if (!this.mapEngine || !this.activeRoute) return;
    const { coordinates, origin, destination } = this.activeRoute;
    const layer = this.mapEngine.navigationRouteLayer;
    layer.clearLayers();

    // 1. هالة مضيئة خلف المسار
    this.glowPolyline = L.polyline(coordinates, {
      color: '#0ea5e9',
      weight: 10,
      opacity: 0.3,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(layer);

    // 2. خط المسار المتدرج النابض
    this.routePolyline = L.polyline(coordinates, {
      color: '#10b981',
      weight: 5,
      opacity: 0.95,
      dashArray: '10, 8',
      lineCap: 'round'
    }).addTo(layer);

    // 3. دبوس نقطة الانطلاق القابل للسحب (Draggable Start Pin)
    const startIcon = L.divIcon({
      className: 'nav-point-marker start-pin',
      html: `
        <div class="nav-pin-draggable start" title="اسحب لتغيير نقطة الانطلاق">
          <div class="nav-pin-head">🅰️</div>
          <div class="nav-pin-label">${origin.name || 'الانطلاق'}</div>
        </div>
      `,
      iconSize: [130, 44],
      iconAnchor: [65, 38]
    });

    this.startMarker = L.marker([origin.lat, origin.lng], {
      icon: startIcon,
      draggable: true,
      autoPan: true,
      zIndexOffset: 1800
    }).addTo(layer);

    this.startMarker.on('dragend', async (e) => {
      const pos = e.target.getLatLng();
      await this.setOriginPin(pos.lat, pos.lng);
    });

    // 4. دبوس نقطة الوجهة القابل للسحب (Draggable Destination Pin)
    const endIcon = L.divIcon({
      className: 'nav-point-marker end-pin',
      html: `
        <div class="nav-pin-draggable end" title="اسحب الدبوس لتغيير الوجهة مباشرة">
          <div class="nav-pin-head">🏁</div>
          <div class="nav-pin-label">${destination.name || 'الوجهة'}</div>
        </div>
      `,
      iconSize: [140, 44],
      iconAnchor: [70, 38]
    });

    this.endMarker = L.marker([destination.lat, destination.lng], {
      icon: endIcon,
      draggable: true,
      autoPan: true,
      zIndexOffset: 1900
    }).addTo(layer);

    this.endMarker.on('dragend', async (e) => {
      const pos = e.target.getLatLng();
      await this.setDestinationPin(pos.lat, pos.lng);
    });

    if (fitBounds && coordinates.length > 1) {
      const bounds = L.latLngBounds(coordinates);
      this.mapEngine.map.fitBounds(bounds, { padding: [70, 70], maxZoom: 13 });
    }
  }

  /**
   * معالجة التحديث اللحظي لموقع المستخدم أثناء السير الفعلي أو المحاكاة
   */
  handlePositionUpdate(lat, lng, speedKmh = 0, explicitBearing = null) {
    if (!this.isTripActive || !this.activeRoute) return;

    const { destination } = this.activeRoute;
    const remainingKm = calculateDistanceKm(lat, lng, destination.lat, destination.lng);
    const bearingDeg = explicitBearing !== null
      ? explicitBearing
      : calculateBearing(lat, lng, destination.lat, destination.lng);
    const bearingLabel = this.formatBearingArabic(bearingDeg);

    const effectiveSpeed = speedKmh > 3 ? speedKmh : 75;
    const remainingMinutes = Math.max(1, Math.round((remainingKm / effectiveSpeed) * 60));
    const isMoving = speedKmh > 1.5;

    // توجيه مجسم الـ 3D بدقة نحو زاوية الطريق وتشغيل حركة المشي/القيادة
    this.mapEngine.updateUserLocation(lat, lng, 10, bearingDeg, isMoving, speedKmh);

    if (this.autoFollowCamera) {
      this.mapEngine.map.panTo([lat, lng], { animate: true, duration: 0.35 });
    }

    if (remainingKm <= 0.08) {
      this.endTrip(true);
      return;
    }

    if (this.callbacks.onProgress) {
      this.callbacks.onProgress({
        lat,
        lng,
        remainingKm: remainingKm.toFixed(1),
        remainingMinutes,
        speedKmh: Math.round(speedKmh),
        bearingDeg: Math.round(bearingDeg),
        bearingLabel
      });
    }
  }

  /**
   * محاكاة حركية فائقة السلاسة (60FPS Interpolated Simulation) على طول المسار
   */
  startSimulation() {
    if (!this.activeRoute || this.isSimulating) return;
    this.isSimulating = true;

    const rawCoords = this.activeRoute.coordinates;
    if (!rawCoords || rawCoords.length < 2) return;

    // توليد نقاط ناعمة متقاربة لحركة سينمائية انسيابية
    const smoothPoints = [];
    for (let i = 0; i < rawCoords.length - 1; i++) {
      const p1 = rawCoords[i];
      const p2 = rawCoords[i + 1];
      const segDist = calculateDistanceKm(p1[0], p1[1], p2[0], p2[1]);
      const subSteps = Math.max(2, Math.min(12, Math.ceil(segDist * 4)));
      for (let s = 0; s < subSteps; s++) {
        const t = s / subSteps;
        smoothPoints.push([
          p1[0] + (p2[0] - p1[0]) * t,
          p1[1] + (p2[1] - p1[1]) * t
        ]);
      }
    }
    smoothPoints.push(rawCoords[rawCoords.length - 1]);

    let stepIndex = 0;
    const totalSteps = smoothPoints.length;

    if (this.simulationTimer) clearInterval(this.simulationTimer);

    this.simulationTimer = setInterval(() => {
      if (!this.isSimulating || stepIndex >= totalSteps) {
        this.stopSimulation();
        if (stepIndex >= totalSteps) {
          this.endTrip(true);
        }
        return;
      }

      const current = smoothPoints[stepIndex];
      const next = smoothPoints[Math.min(stepIndex + 1, totalSteps - 1)];
      const bearing = calculateBearing(current[0], current[1], next[0], next[1]);

      this.handlePositionUpdate(current[0], current[1], 88, bearing);
      stepIndex++;
    }, 220);
  }

  stopSimulation() {
    this.isSimulating = false;
    if (this.simulationTimer) {
      clearInterval(this.simulationTimer);
      this.simulationTimer = null;
    }
    // إيقاف حركة المشي عند التوقف
    if (this.mapEngine?.user3DInstance) {
      this.mapEngine.user3DInstance.setMotionState(false, 0);
    }
  }

  /**
   * إنهاء الرحلة ومسح المسار والدبابيس
   */
  endTrip(isArrived = false) {
    this.stopSimulation();
    this.isTripActive = false;
    this.isPinNavMode = false;

    const dest = this.activeRoute?.destination;
    this.clearRoute();

    if (isArrived && this.callbacks.onArrival && dest) {
      this.callbacks.onArrival(dest);
    }
    if (this.callbacks.onEnd) {
      this.callbacks.onEnd(isArrived);
    }
  }

  clearRoute() {
    if (this.mapEngine?.navigationRouteLayer) {
      this.mapEngine.navigationRouteLayer.clearLayers();
    }
    this.routePolyline = null;
    this.glowPolyline = null;
    this.startMarker = null;
    this.endMarker = null;
    this.activeRoute = null;
  }

  formatBearingArabic(deg) {
    const d = (deg + 360) % 360;
    if (d >= 337.5 || d < 22.5) return 'شمال ⬆️';
    if (d >= 22.5 && d < 67.5) return 'شمال-شرق ↗️';
    if (d >= 67.5 && d < 112.5) return 'شرق ➡️';
    if (d >= 112.5 && d < 157.5) return 'جنوب-شرق ↘️';
    if (d >= 157.5 && d < 202.5) return 'جنوب ⬇️';
    if (d >= 202.5 && d < 247.5) return 'جنوب-غرب ↙️';
    if (d >= 247.5 && d < 292.5) return 'غرب ⬅️';
    return 'شمال-غرب ↖️';
  }
}
