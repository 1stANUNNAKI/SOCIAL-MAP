/**
 * وحدة التحكم المركزية لنظام SMI (SMI.basharTwaij.com - v16.0)
 * مصمم ومبرمج من قبل بشار تويج (BasharTwaij.com)
 */

import { IRAQ_GOVERNORATES, IRAQ_DEFAULT_LANDMARKS, IRAQ_DETAILED_PLACES, syncLatestPlacesData, registerNewPlaceInGazetteer } from './data/iraq-data.js?v=16';
import { storage } from './services/storage.js?v=16';
import { MapEngine } from './services/map-engine.js?v=16';
import { findClosestGovernorate, formatCoordinates, sanitizeText, formatArabicParentheses, isWithinIraq, calculateDistanceKm } from './services/geoutils.js?v=16';
import { threeEngine, AVAILABLE_3D_MODELS } from './services/three-engine.js?v=16';
import { offlinePack } from './services/offline-pack.js?v=16';
import { TripNavigation } from './services/navigation.js?v=16';
import { CityRT3DIraqEngine } from './services/cityrt-iraq-engine.js?v=16';
import {
  UniversalPlaceHubController,
  RideHailingController,
  SpatialCommerceController,
  RichMedia3DStageController,
  LiveCameraStreamController
} from './services/socialmap-engines.js?v=16';

class OpenMapIQApp {
  constructor() {
    this.mapEngine = null;
    this.tripNavigation = null;
    this.cityRTEngine = null;
    this.placeHubController = null;
    this.rideHailingController = null;
    this.commerceController = null;
    this.media3DStageController = null;
    this.liveCamController = null;
    this.places = [];
    this.activeFilter = "all";
    this.activePlaceForEdit = null;
    this.gpsWatchId = null;
    this.isTrackingLive = false;
    this.preview3DInstance = null;
    this.placesLabelsVisible = true;

    this.init();
  }

  async init() {
    // 1. استرجاع الإعدادات المحفوظة
    const settings = storage.getSettings();
    if (settings.activeLayer === 'voyager' || !['osm', 'hot', 'satellite', 'topo'].includes(settings.activeLayer)) {
      settings.activeLayer = 'osm';
      storage.saveSettings(settings);
    }
    if (settings.userModel === 'parrot') {
      settings.userModel = 'flying_bird';
      storage.saveSettings(settings);
    }
    document.documentElement.setAttribute('data-theme', settings.theme || 'dark');

    // ضمان أن القائمة الجانبية وبطاقة المكان مخفيتان افتراضياً عند فتح الموقع ولا تفتحان إلا بضغط المستخدم على مكان معين
    const sidebarEl = document.getElementById('sidebar');
    if (sidebarEl) {
      sidebarEl.classList.add('collapsed');
      sidebarEl.classList.remove('active');
    }
    document.getElementById('socialmapPlaceHubSheet')?.classList.add('hidden');

    // 2. تهيئة محرك الخرائط
    const defaultModel = (settings.userModel && settings.userModel !== 'pin_arrow') ? settings.userModel : 'arrow';
    this.mapEngine = new MapEngine('map', {
      defaultLayer: settings.activeLayer,
      userModelId: defaultModel,
      on3DStateChange: (is3DActive) => {
        const view3DBtn = document.getElementById('view3DMapBtn');
        const bar3D = document.getElementById('map3DControlBar');
        view3DBtn?.classList.toggle('primary-glow', is3DActive);
        bar3D?.classList.toggle('hidden', !is3DActive);
      },
      onMapClick: (latlng) => {
        if (this.tripNavigation && this.tripNavigation.isTripActive) {
          const match = findClosestGovernorate(latlng.lat, latlng.lng);
          this.tripNavigation.setDestinationPin(latlng.lat, latlng.lng, `نقطة على الخريطة \u200F( ${match.governorate} )\u200F`);
          this.showToast(`🏁 تم نقل دبوس الوجهة وإعادة رسم المسار إلى \u200F( ${match.governorate} )\u200F`);
        } else {
          this.startPinPlacement(latlng, true);
        }
      }
    });

    // 3. تهيئة خدمة الملاحة التفاعلية عبر الدبابيس ومحركات SMI & 3D Live Roaming
    this.tripNavigation = new TripNavigation(this.mapEngine);
    this.initSocialMapEngines();

    // 4. تحميل النقاط المحفوظة من المتصفح
    await this.refreshPlacesList();

    // 5. رسم طبقة الأماكن العراقية بنظام التكبير الذكي
    this.mapEngine.renderDetailedPlaces(IRAQ_DETAILED_PLACES, (place, action) => {
      this.handlePlaceAction(place, action);
    });

    // 6. ربط أحداث الواجهة
    this.bindEvents();

    // 7. تحديث الإحصائيات وواجهة الشخصيات الـ 3D والأوفلاين
    this.updateStats();
    this.setup3DModalUI();
    this.setupOfflineUI();

    // 8. المزامنة السريعة وتجميع البيانات النصية للمواقع العراقية في الخلفية
    syncLatestPlacesData((updatedPlaces) => {
      this.mapEngine.renderDetailedPlaces(updatedPlaces, (place, action) => {
        this.handlePlaceAction(place, action);
      });
    }).then((res) => {
      console.log(`[SMI] تمت مزامنة وتثبيت ${res.count} موقع ومنطقة وبناية عراقية.`);
    });

    window.addEventListener('online', async () => {
      const res = await syncLatestPlacesData();
      this.showToast(`⚡ تم استعادة الاتصال وتحديث بيانات ${res.count} موقع عراقي!`);
    });

    // 9. تسجيل Service Worker للعمل بدون إنترنت
    this.registerServiceWorker();

    this.showToast("مرحباً بك في نظام SMI — SMI.basharTwaij.com 🇮🇶");
  }

  bindEvents() {
    // قائمة الأزرار العلوية القابلة للطي والتوسيع (زر واحد يظهر باقي الأزرار بجانبه عند الضغط عليه)
    const topActionsContainer = document.getElementById('topActionsContainer');
    const topActionsMenuBtn = document.getElementById('topActionsMenuBtn');
    topActionsMenuBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = topActionsContainer?.classList.toggle('open');
      topActionsMenuBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // قائمة الأزرار الجانبية القابلة للطي والتوسيع (زر واحد يظهر باقي الأزرار بجانبه عند الضغط عليه)
    const sideControlsContainer = document.getElementById('sideControlsContainer');
    const sideControlsMenuBtn = document.getElementById('sideControlsMenuBtn');
    sideControlsMenuBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = sideControlsContainer?.classList.toggle('open');
      sideControlsMenuBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // زر علامة التعجب (!) لفتح صفحة تعريف مشروع الخرائط العراقية المفتوحة (OMI) والمصمم بشار تويج
    document.getElementById('aboutOmiBtn')?.addEventListener('click', () => {
      this.openModal('aboutOmiModal');
    });

    // أزرار التكبير والتصغير
    document.getElementById('zoomInBtn')?.addEventListener('click', () => {
      this.mapEngine.map.zoomIn();
    });
    document.getElementById('zoomOutBtn')?.addEventListener('click', () => {
      this.mapEngine.map.zoomOut();
    });

    // زر توسيط كامل خارطة العراق
    document.getElementById('fitIraqBtn')?.addEventListener('click', () => {
      if (this.mapEngine.is3DMapView) {
        this.mapEngine.toggle3DMapView(false);
      }
      this.mapEngine.fitToIraq();
      this.showToast("تم توسيط العرض لكامل الجمهورية العراقية");
    });

    // زر وضع التجول الحي ثلاثي الأبعاد في الخريطة الحقيقية (🕹️ ضمن القائمة الفوقية)
    document.getElementById('liveRoam3DBtn')?.addEventListener('click', () => {
      this.toggleLiveRoam3DMode();
    });

    // زر تفعيل/إيقاف العرض ثلاثي الأبعاد للخريطة والمباني (🧊 3D Map View)
    document.getElementById('view3DMapBtn')?.addEventListener('click', () => {
      const is3D = this.mapEngine.toggle3DMapView();
      this.showToast(is3D ? "🧊 تم تفعيل الخريطة والمباني ثلاثية الأبعاد! وللتجول الحي بالطائر أو السيارة اضغط زر 🕹️" : "🗺️ تم العودة للعرض العادي 2D");
    });

    // أزرار شريط التحكم والخروج السهل من الوضع ثلاثي الأبعاد
    document.getElementById('exit3DViewBtn')?.addEventListener('click', () => {
      this.mapEngine.toggle3DMapView(false);
      this.showToast("🗺️ تم الخروج من الوضع ثلاثي الأبعاد والعودة للوضع العادي 2D");
    });
    document.getElementById('rotate3DLeftBtn')?.addEventListener('click', () => {
      this.mapEngine.adjust3DCamera(0, -18);
    });
    document.getElementById('rotate3DRightBtn')?.addEventListener('click', () => {
      this.mapEngine.adjust3DCamera(0, 18);
    });
    document.getElementById('tilt3DToggleBtn')?.addEventListener('click', () => {
      const nextDelta = this.mapEngine.pitch3DDeg >= 50 ? -22 : 10;
      this.mapEngine.adjust3DCamera(nextDelta, 0);
    });

    // دعم زر Escape للخروج الفوري من الوضع ثلاثي الأبعاد أو إغلاق النوافذ
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.mapEngine?.is3DMapView) {
        const activeModal = document.querySelector('.modal-backdrop.active');
        if (!activeModal) {
          this.mapEngine.toggle3DMapView(false);
          this.showToast("🗺️ تم الخروج من الوضع ثلاثي الأبعاد");
        }
      }
    });

    // زر وضع دبوس متحرك تفاعلي
    document.getElementById('dragPinBtn')?.addEventListener('click', () => {
      this.startPinPlacement();
    });

    // زر تحديد موقعي واتجاهي وبنايتي الحالية عبر الـ GPS
    document.getElementById('locateBtn')?.addEventListener('click', () => {
      this.locateUser();
    });

    document.getElementById('trackToggleBtn')?.addEventListener('click', () => {
      this.toggleLiveTracking();
    });

    // زر اختيار المجسم ثلاثي الأبعاد (🚶)
    document.getElementById('avatar3DBtn')?.addEventListener('click', () => {
      this.open3DModal();
    });

    // زر الملاحة المباشرة عبر الدبابيس
    document.getElementById('routeNavBtn')?.addEventListener('click', () => {
      this.togglePinNavigationMode();
    });

    document.getElementById('mobileNavPinBtn')?.addEventListener('click', () => {
      this.togglePinNavigationMode();
    });

    // زر تشغيل وإيقاف الحركة والمحاكاة على المسار
    document.getElementById('simTripBtn')?.addEventListener('click', () => {
      if (this.tripNavigation.isSimulating) {
        this.tripNavigation.stopSimulation();
        const btn = document.getElementById('simTripBtn');
        if (btn) btn.innerHTML = '<span>🚀</span> استئناف الحركة';
      } else {
        const btn = document.getElementById('simTripBtn');
        if (btn) btn.innerHTML = '<span>⏸️</span> إيقاف مؤقت';
        this.tripNavigation.startSimulation();
      }
    });

    // زر إنهاء المسار
    document.getElementById('endTripActionBtn')?.addEventListener('click', () => {
      this.tripNavigation.endTrip();
    });
    document.getElementById('closeTripDashboardBtn')?.addEventListener('click', () => {
      this.tripNavigation.endTrip();
    });

    // زر تتبع الكاميرا للرحلة
    document.getElementById('autoFollowCameraToggle')?.addEventListener('change', (e) => {
      this.tripNavigation.autoFollowCamera = e.target.checked;
    });

    // زر إظهار/إخفاء طبقة الأماكن
    document.getElementById('placesToggleBtn')?.addEventListener('click', () => {
      this.togglePlacesLayer();
    });

    // زر إدارة الخريطة أوفلاين وتثبيت التطبيق
    document.getElementById('offlinePackBtn')?.addEventListener('click', () => {
      this.openModal('offlineModal');
      this.updateOfflineModalStats();
    });

    // زر قياس المسافات
    const measureBtn = document.getElementById('measureBtn');
    measureBtn?.addEventListener('click', () => {
      const active = this.mapEngine.toggleMeasureMode();
      measureBtn.classList.toggle('active', active);
      const card = document.getElementById('measureCard');
      if (card) card.classList.toggle('hidden', !active);
      if (active) {
        this.showToast("📐 وضع قياس المسافات: انقر على الخريطة بين أي نقطتين");
      }
    });

    document.getElementById('closeMeasureBtn')?.addEventListener('click', () => {
      this.mapEngine.toggleMeasureMode();
      measureBtn?.classList.remove('active');
      document.getElementById('measureCard')?.classList.add('hidden');
    });

    // زر تبديل طبقات الخريطة
    document.getElementById('layersBtn')?.addEventListener('click', () => {
      this.openModal('layersModal');
    });

    document.querySelectorAll('.layer-card-option').forEach(el => {
      el.addEventListener('click', () => {
        const layer = el.getAttribute('data-layer');
        this.mapEngine.setBaseLayer(layer);
        document.querySelectorAll('.layer-card-option').forEach(c => c.classList.remove('selected'));
        el.classList.add('selected');

        const s = storage.getSettings();
        s.activeLayer = layer;
        storage.saveSettings(s);

        this.closeModal('layersModal');
        this.showToast(`تم تبديل نمط الخريطة بنجاح`);
      });
    });

    // حفظ نموذج النقطة والملاحظة
    document.getElementById('placeForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSavePlace();
    });

    // تبديل القائمة الجانبية فقط عندما يضغط المستخدم على الزر المخصص لها
    const toggleSidebar = () => {
      const isMobile = window.innerWidth <= 900;
      const sidebar = document.getElementById('sidebar');
      const backdrop = document.getElementById('sidebarBackdrop');
      if (isMobile) {
        sidebar?.classList.toggle('active');
        backdrop?.classList.toggle('active');
      } else {
        sidebar?.classList.toggle('collapsed');
        setTimeout(() => this.mapEngine?.map?.invalidateSize(), 300);
      }
    };
    document.getElementById('menuToggleBtn')?.addEventListener('click', toggleSidebar);
    document.getElementById('closeSidebarBtn')?.addEventListener('click', toggleSidebar);
    document.getElementById('sidebarBackdrop')?.addEventListener('click', toggleSidebar);
    document.getElementById('mobileListBtn')?.addEventListener('click', toggleSidebar);

    // أزرار الموبايل السفلية
    document.getElementById('mobileLocateBtn')?.addEventListener('click', () => this.locateUser());
    document.getElementById('mobileAddBtn')?.addEventListener('click', () => {
      this.startPinPlacement();
    });
    document.getElementById('mobileLayersBtn')?.addEventListener('click', () => this.openModal('layersModal'));

    // أزرار تبديل الفلاتر والتصنيفات
    document.querySelectorAll('.filter-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeFilter = btn.getAttribute('data-filter') || 'all';
        this.renderPlacesListUI();
      });
    });

    // البحث السريع الشامل (محافظات + مجمعات مثل مجموعة العميد التعليمية + مولات وشوارع + بحث حي في كل بنايات العراق)
    const searchInput = document.getElementById('quickSearchInput');
    const searchDropdown = document.getElementById('searchResultsDropdown');
    let searchDebounceTimer = null;

    searchInput?.addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      if (!q) {
        searchDropdown.classList.remove('active');
        return;
      }
      if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
      this.handleSearch(q, searchDropdown);
      searchDebounceTimer = setTimeout(() => {
        this.fetchLiveNominatimSearch(q, searchDropdown);
      }, 300);
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-box-container')) {
        searchDropdown?.classList.remove('active');
      }
    });

    // أزرار التصدير والاستيراد
    document.getElementById('exportGeoJsonBtn')?.addEventListener('click', () => this.exportData('geojson'));
    document.getElementById('exportCsvBtn')?.addEventListener('click', () => this.exportData('csv'));
    document.getElementById('importFileBtn')?.addEventListener('click', () => {
      document.getElementById('importFileInput')?.click();
    });

    document.getElementById('importFileInput')?.addEventListener('change', (e) => {
      this.handleFileImport(e);
    });

    // تبديل المظهر (داكن / فاتح)
    document.getElementById('themeToggleBtn')?.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      const s = storage.getSettings();
      s.theme = next;
      storage.saveSettings(s);
    });

    // إغلاق النوافذ المنبثقة
    document.querySelectorAll('.modal-close-btn, .modal-cancel-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const modal = btn.closest('.modal-backdrop');
        if (modal) modal.classList.remove('active');
        if (modal?.id === 'avatar3DModal' && this.preview3DInstance) {
          this.preview3DInstance.destroy();
          this.preview3DInstance = null;
        }
      });
    });

    // اختيار الألوان والتصنيفات في النموذج
    document.querySelectorAll('.color-option').forEach(el => {
      el.addEventListener('click', () => {
        document.querySelectorAll('.color-option').forEach(c => c.classList.remove('selected'));
        el.classList.add('selected');
        document.getElementById('placeColorInput').value = el.getAttribute('data-color');
      });
    });

    document.querySelectorAll('.category-chip').forEach(el => {
      el.addEventListener('click', () => {
        document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('selected'));
        el.classList.add('selected');
        document.getElementById('placeCategoryInput').value = el.getAttribute('data-category');
      });
    });
  }

  openAddPlaceModal(lat, lng) {
    this.activePlaceForEdit = null;
    document.getElementById('placeModalTitle').textContent = "إضافة نقطة وملاحظة جغرافية جديدة";
    document.getElementById('placeIdInput').value = "";
    document.getElementById('placeTitleInput').value = "";
    document.getElementById('placeNotesInput').value = "";
    document.getElementById('placeTagsInput').value = "";
    document.getElementById('placeLatInput').value = lat.toFixed(6);
    document.getElementById('placeLngInput').value = lng.toFixed(6);

    const match = findClosestGovernorate(lat, lng);
    const govSelect = document.getElementById('placeGovSelect');
    if (govSelect) {
      govSelect.value = match.governorate;
    }

    const hint = document.getElementById('coordsHint');
    if (hint) {
      hint.textContent = `${formatCoordinates(lat, lng)} \u200F( أقرب محافظة: ${match.governorate} )\u200F`;
    }

    // اقتراح اسم البناية الفعلي إن وجد
    this.mapEngine.reverseGeocodeBuildingAt(lat, lng).then((bName) => {
      const titleInput = document.getElementById('placeTitleInput');
      if (bName && titleInput && !titleInput.value) {
        titleInput.value = formatArabicParentheses(bName);
      }
    });

    this.openModal('placeModal');
  }

  openEditPlaceModal(place) {
    this.activePlaceForEdit = place;
    document.getElementById('placeModalTitle').textContent = "تعديل النقطة والملاحظات";
    document.getElementById('placeIdInput').value = place.id;
    document.getElementById('placeTitleInput').value = place.title || "";
    document.getElementById('placeNotesInput').value = place.notes || "";
    document.getElementById('placeTagsInput').value = (place.tags || []).join(", ");
    document.getElementById('placeLatInput').value = Number(place.lat).toFixed(6);
    document.getElementById('placeLngInput').value = Number(place.lng).toFixed(6);

    const govSelect = document.getElementById('placeGovSelect');
    if (govSelect && place.governorate) {
      govSelect.value = place.governorate;
    }

    document.querySelectorAll('.color-option').forEach(c => {
      c.classList.toggle('selected', c.getAttribute('data-color') === place.color);
    });
    document.getElementById('placeColorInput').value = place.color || "#0284c7";

    document.querySelectorAll('.category-chip').forEach(c => {
      c.classList.toggle('selected', c.getAttribute('data-category') === place.category);
    });
    document.getElementById('placeCategoryInput').value = place.category || "personal";

    this.openModal('placeModal');
  }

  async handleSavePlace() {
    const id = document.getElementById('placeIdInput').value;
    const title = document.getElementById('placeTitleInput').value.trim();
    const notes = document.getElementById('placeNotesInput').value.trim();
    const lat = parseFloat(document.getElementById('placeLatInput').value);
    const lng = parseFloat(document.getElementById('placeLngInput').value);
    const governorate = document.getElementById('placeGovSelect').value;
    const color = document.getElementById('placeColorInput').value || "#0284c7";
    const category = document.getElementById('placeCategoryInput').value || "personal";
    const tagsStr = document.getElementById('placeTagsInput').value;
    const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [];

    if (!title) {
      alert("يرجى كتابة اسم أو عنوان للنقطة");
      return;
    }

    if (isNaN(lat) || isNaN(lng)) {
      alert("الإحداثيات المدخلة غير صحيحة");
      return;
    }

    const placeData = {
      id: id || undefined,
      title: formatArabicParentheses(title),
      notes,
      lat,
      lng,
      governorate,
      color,
      category,
      tags
    };

    await storage.savePlace(placeData);
    this.closeModal('placeModal');
    this.mapEngine.clearDraggablePin();
    await this.refreshPlacesList();
    this.showToast(`تم حفظ النقطة "${title}" بنجاح ✅`);

    this.mapEngine.flyTo(lat, lng, 15);
  }

  async deletePlace(id) {
    const target = this.places.find(p => p.id === id);
    const title = target ? target.title : "هذه النقطة";
    if (confirm(`هل أنت متأكد من حذف "${title}" نهائياً من المتصفح؟`)) {
      await storage.deletePlace(id);
      await this.refreshPlacesList();
      this.showToast("تم حذف النقطة بنجاح");
    }
  }

  async refreshPlacesList() {
    this.places = await storage.getAllPlaces();

    this.mapEngine.renderPlaces(this.places, {
      onEdit: (place) => this.openEditPlaceModal(place),
      onDelete: (id) => this.deletePlace(id),
      onNotify: (msg) => this.showToast(msg),
      onNavigatePin: (dest) => {
        this.startPinNavigationToDestination(dest);
      }
    });

    this.renderPlacesListUI();
    this.updateStats();
  }

  renderPlacesListUI() {
    const container = document.getElementById('placesListContainer');
    if (!container) return;

    let filtered = this.places;
    if (this.activeFilter !== "all") {
      filtered = this.places.filter(p => p.category === this.activeFilter);
    }

    container.innerHTML = "";

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📍</div>
          <p>لا توجد نقاط محفوظة في هذا التصنيف حالياً.</p>
          <small>انقر على أي موقع في الخريطة لوضع دبوس تفاعلي.</small>
        </div>
      `;
      return;
    }

    filtered.forEach(place => {
      const card = document.createElement('div');
      card.className = 'place-item-card';
      card.style.setProperty('--item-color', place.color || '#0284c7');

      card.innerHTML = `
        <div class="place-item-header">
          <span class="place-item-title">${sanitizeText(place.title)}</span>
          <span class="place-item-gov">${sanitizeText(place.governorate || "العراق")}</span>
        </div>
        <p class="place-item-notes">${sanitizeText(place.notes || "لا توجد ملاحظات")}</p>
        <div class="place-item-footer">
          <span>${formatCoordinates(place.lat, place.lng)}</span>
          <div class="place-item-actions">
            <button class="icon-action-btn nav-item-btn" title="انطلق بالمسار إلى هذا الدبوس">🧭</button>
            <button class="icon-action-btn edit-item-btn" title="تعديل">✏️</button>
            <button class="icon-action-btn delete-item-btn" title="حذف">🗑️</button>
          </div>
        </div>
      `;

      card.addEventListener('click', (e) => {
        if (e.target.closest('.icon-action-btn')) return;
        this.mapEngine.flyTo(place.lat, place.lng, 15);
        if (window.innerWidth <= 900) {
          document.getElementById('sidebar')?.classList.remove('active');
          document.getElementById('sidebarBackdrop')?.classList.remove('active');
        }
      });

      card.querySelector('.nav-item-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.innerWidth <= 900) {
          document.getElementById('sidebar')?.classList.remove('active');
          document.getElementById('sidebarBackdrop')?.classList.remove('active');
        }
        this.startPinNavigationToDestination({
          lat: place.lat,
          lng: place.lng,
          name: place.title
        });
      });

      card.querySelector('.edit-item-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        this.openEditPlaceModal(place);
      });

      card.querySelector('.delete-item-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        this.deletePlace(place.id);
      });

      container.appendChild(card);
    });
  }

  updateStats() {
    const totalCount = this.places.length;
    const govSet = new Set(this.places.map(p => p.governorate).filter(Boolean));

    const totalEl = document.getElementById('totalPlacesCount');
    const govEl = document.getElementById('coveredGovsCount');

    if (totalEl) totalEl.textContent = totalCount;
    if (govEl) govEl.textContent = govSet.size;
  }

  /**
   * تطبيع النص العربي للبحث الذكي الشامل (يتعامل مع الهمزات، التاء المربوطة، الياء، والتعريف "ال")
   */
  normalizeArabicSearchText(str = "") {
    return String(str)
      .toLowerCase()
      .replace(/[\u200E\u200F\u064B-\u065F\u0670]/g, "")
      .replace(/[أإآٱ]/g, "ا")
      .replace(/ة/g, "ه")
      .replace(/ى/g, "ي")
      .replace(/[-_،,()]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * فحص تطابق استعلام البحث مع أي موقع عراقي بدقة عالية ومرونة في ترتيب الكلمات
   */
  scorePlaceMatch(queryNorm, queryTokens, title, sub = "", gov = "", keywords = "") {
    const titleNorm = this.normalizeArabicSearchText(title);
    const fullNorm = this.normalizeArabicSearchText(`${title} ${sub} ${gov} ${keywords}`);

    if (!titleNorm) return 0;
    if (titleNorm === queryNorm) return 120;
    if (titleNorm.startsWith(queryNorm)) return 100;
    if (titleNorm.includes(queryNorm)) return 90;
    if (fullNorm.includes(queryNorm)) return 80;

    // مطابقة جميع الكلمات حتى لو اختلف ترتيبها أو وجدت "ال" التعريف
    const allTokensMatch = queryTokens.every((tok) => {
      const strippedTok = tok.startsWith("ال") && tok.length > 3 ? tok.slice(2) : tok;
      return fullNorm.includes(tok) || (strippedTok.length >= 2 && fullNorm.includes(strippedTok));
    });

    if (allTokensMatch) {
      const inTitleCount = queryTokens.filter((tok) => {
        const strippedTok = tok.startsWith("ال") && tok.length > 3 ? tok.slice(2) : tok;
        return titleNorm.includes(tok) || titleNorm.includes(strippedTok);
      }).length;
      return 60 + inTitleCount * 10;
    }

    return 0;
  }

  /**
   * بناء عنصر نتيجة بحث أنيق مع أيقونة دبوس الخريطة المفرغ وتثبيت الموقع مباشرة على الخريطة عند النقر
   */
  createSearchResultItemElement(res, dropdown) {
    const item = document.createElement('div');
    item.className = 'search-result-item';
    const pinSvg = `<svg class="hollow-map-pin-icon" viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true" style="flex-shrink:0;"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 10.5c-1.93 0-3.5-1.57-3.5-3.5S10.07 5.5 12 5.5s3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/></svg>`;

    item.innerHTML = `
      <div class="search-result-info" style="display: flex; align-items: center; gap: 8px;">
        ${pinSvg}
        <div>
          <strong>${sanitizeText(res.title)}</strong>
          <small>${sanitizeText(res.sub)}</small>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
        <button class="search-pin-nav-btn" title="انطلق بالمسار إلى هنا">🧭 مسار</button>
        <span class="search-result-type">${sanitizeText(res.type)}</span>
      </div>
    `;

    item.querySelector('.search-pin-nav-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.remove('active');
      this.mapEngine.registerAndPlotDiscoveredPlace({
        id: res.id || `srch_${Number(res.lat).toFixed(4)}_${Number(res.lng).toFixed(4)}`,
        name: res.title,
        gov: res.gov || res.sub || 'العراق',
        type: 'building',
        lat: res.lat,
        lng: res.lng,
        icon: '📍'
      }, false);
      this.startPinNavigationToDestination({
        lat: res.lat,
        lng: res.lng,
        name: res.title
      });
    });

    item.addEventListener('click', () => {
      const placeObj = {
        id: res.id || `srch_${Number(res.lat).toFixed(4)}_${Number(res.lng).toFixed(4)}`,
        name: res.title,
        gov: res.gov || res.sub || 'العراق',
        city: res.gov || 'العراق',
        address: res.sub || res.gov || 'العراق',
        type: 'building',
        lat: res.lat,
        lng: res.lng,
        icon: '📍'
      };
      this.mapEngine.registerAndPlotDiscoveredPlace(placeObj, true);
      this.mapEngine.flyTo(res.lat, res.lng, res.zoom || 16);
      dropdown.classList.remove('active');
      document.getElementById('quickSearchInput').value = formatArabicParentheses(res.title);

      if (this.cityRTEngine && this.cityRTEngine.isActive) {
        this.placeHubController?.close();
        this.cityRTEngine.startRoamingAutoNavigation(placeObj);
        this.showToast(`🧭 تم تفعيل التوجه التلقائي في التجول الحي نحو "${res.title}"!`);
      } else if (this.placeHubController) {
        this.placeHubController.openForPlace(placeObj);
      }
    });

    return item;
  }

  /**
   * محرك البحث الذكي الشامل (يبحث في المحافظات الـ 18 + الموسوعة الجغرافية العراقية الشاملة للأحياء والمقاطعات مثل العطيشي + البنايات + النقاط المحفوظة)
   */
  handleSearch(query, dropdown) {
    dropdown.innerHTML = "";
    const queryNorm = this.normalizeArabicSearchText(query);
    if (!queryNorm) return;
    const queryTokens = queryNorm.split(" ").filter(Boolean);
    const results = [];

    IRAQ_GOVERNORATES.forEach(gov => {
      const score = this.scorePlaceMatch(queryNorm, queryTokens, gov.name, gov.capital, gov.region, gov.nameEn);
      if (score > 0) {
        results.push({
          id: `gov_${gov.id}`,
          title: gov.name,
          sub: `${gov.capital} - ${gov.region}`,
          gov: gov.name,
          type: "محافظة",
          lat: gov.center[0],
          lng: gov.center[1],
          zoom: gov.zoom,
          score: score + 5
        });
      }
    });

    IRAQ_DETAILED_PLACES.forEach(pl => {
      const score = this.scorePlaceMatch(queryNorm, queryTokens, pl.name, pl.sub || "", pl.gov || "", pl.keywords || "");
      if (score > 0) {
        results.push({
          id: pl.id,
          title: pl.name,
          sub: pl.sub ? `${pl.sub} \u200F( ${pl.gov} )\u200F` : `محافظة ${pl.gov}`,
          gov: pl.gov,
          type: pl.type === 'district' ? 'منطقة/حي' : (pl.type === 'history' ? 'معلم/خان' : 'موقع/بناية'),
          lat: pl.lat,
          lng: pl.lng,
          zoom: 16,
          score
        });
      }
    });

    this.places.forEach(p => {
      const score = this.scorePlaceMatch(queryNorm, queryTokens, p.title, p.notes || "", p.governorate || "");
      if (score > 0) {
        results.push({
          id: p.id,
          title: p.title,
          sub: p.governorate || "نقطة محفوظة",
          gov: p.governorate || "العراق",
          type: "نقطتي",
          lat: p.lat,
          lng: p.lng,
          zoom: 16,
          score: score + 10
        });
      }
    });

    results.sort((a, b) => b.score - a.score);

    if (results.length === 0) {
      dropdown.innerHTML = `<div class="live-search-status" style="padding: 12px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">🔍 جاري البحث الفوري في كافة مناطق وبنايات وشوارع العراق عن "${sanitizeText(query)}"...</div>`;
      dropdown.classList.add('active');
      return;
    }

    results.slice(0, 12).forEach(res => {
      dropdown.appendChild(this.createSearchResultItemElement(res, dropdown));
    });

    dropdown.classList.add('active');
  }

  /**
   * البحث الحي الفوري متعدد المحركات (ArcGIS Iraq Geocoder + Nominatim OSM + Photon Komoot)
   * يجلب أي منطقة فرعية، مقاطعة، خان، شارع، مدرسة، أو بناية في العراق ويضعها في موقعها الصحيح على الخريطة فوراً
   */
  async fetchLiveNominatimSearch(query, dropdown) {
    if (!navigator.onLine || query.length < 2) return;

    const existingKeys = new Set(
      Array.from(dropdown.querySelectorAll('.search-result-info strong')).map(el => this.normalizeArabicSearchText(el.textContent))
    );

    const appendLiveCandidate = (cand) => {
      if (!cand || !cand.title || isNaN(cand.lat) || isNaN(cand.lng)) return;
      if (!isWithinIraq(cand.lat, cand.lng)) return;

      const normTitle = this.normalizeArabicSearchText(cand.title);
      if (!normTitle || existingKeys.has(normTitle)) return;
      existingKeys.add(normTitle);

      const statusBanner = dropdown.querySelector('.live-search-status');
      if (statusBanner) statusBanner.remove();

      const govMatch = findClosestGovernorate(cand.lat, cand.lng).governorate;
      const enriched = {
        id: cand.id || `live_${ cand.lat.toFixed(4) }_${ cand.lng.toFixed(4) }`,
        title: cand.title,
        sub: cand.sub || `محافظة ${govMatch}`,
        gov: govMatch,
        type: cand.type || 'موقع/بناية',
        lat: cand.lat,
        lng: cand.lng,
        zoom: 17
      };

      // حفظ الموقع النصي المكتشف ووضعه في إحداثياته الصحيحة على الخريطة تلقائياً
      this.mapEngine.registerAndPlotDiscoveredPlace({
        id: enriched.id,
        name: enriched.title,
        gov: enriched.gov,
        sub: enriched.sub,
        type: 'building',
        lat: enriched.lat,
        lng: enriched.lng,
        icon: '📍',
        importance: 3
      }, false);

      dropdown.appendChild(this.createSearchResultItemElement(enriched, dropdown));
      dropdown.classList.add('active');
    };

    // 1. محرك ArcGIS World Geocoder المخصص للعراق (الأقوى في الأحياء والمقاطعات والخانات والبنايات العراقية)
    const arcgisTask = (async () => {
      try {
        const arcUrl = `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?SingleLine=${encodeURIComponent(query)}&countryCode=IRQ&langCode=ar&maxLocations=10&outFields=PlaceName,Place_addr,Type,City,Subregion,Region&f=json`;
        const res = await fetch(arcUrl);
        if (!res.ok) return;
        const data = await res.json();
        if (!Array.isArray(data.candidates)) return;

        data.candidates.forEach((c) => {
          const lat = parseFloat(c.location?.y);
          const lng = parseFloat(c.location?.x);
          const mainTitle = c.attributes?.PlaceName || (c.address || '').split(/[,،]/)[0]?.trim() || query;
          const cityPart = c.attributes?.City || c.attributes?.Subregion || c.attributes?.Region || '';
          const addrPart = c.attributes?.Place_addr || c.address || '';
          const subTitle = cityPart ? `${cityPart} - ${addrPart}` : (addrPart || 'العراق');

          appendLiveCandidate({
            title: mainTitle,
            sub: subTitle,
            type: 'منطقة/بناية',
            lat,
            lng
          });
        });
      } catch (e) {}
    })();

    // 2. محرك OpenStreetMap Nominatim المخصص للعراق (مع إصلاح فاصلة النصوص العربية والإنكليزية)
    const nominatimTask = (async () => {
      try {
        const nomUrl = `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=iq&accept-language=ar&addressdetails=1&limit=10&q=${encodeURIComponent(query)}`;
        const res = await fetch(nomUrl);
        if (!res.ok) return;
        const items = await res.json();
        if (!Array.isArray(items)) return;

        items.forEach((loc) => {
          const lat = parseFloat(loc.lat);
          const lng = parseFloat(loc.lon);
          const parts = (loc.display_name || '').split(/[,،]/).map(s => s.trim()).filter(Boolean);
          const mainTitle = loc.name || parts[0] || query;
          const subTitle = parts.slice(1, 4).join(' - ') || 'العراق';

          appendLiveCandidate({
            id: `nom_${loc.place_id}`,
            title: mainTitle,
            sub: subTitle,
            type: 'بناية/موقع',
            lat,
            lng
          });
        });
      } catch (e) {}
    })();

    // 3. محرك Photon Komoot للبحث الجغرافي الضبابي السريع داخل حدود العراق
    const photonTask = (async () => {
      try {
        const phoUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&bbox=38.5,29.0,49.0,37.5&limit=8`;
        const res = await fetch(phoUrl);
        if (!res.ok) return;
        const data = await res.json();
        if (!Array.isArray(data.features)) return;

        data.features.forEach((f) => {
          const coords = f.geometry?.coordinates;
          if (!Array.isArray(coords) || coords.length < 2) return;
          const lng = parseFloat(coords[0]);
          const lat = parseFloat(coords[1]);
          const props = f.properties || {};
          const mainTitle = props.name;
          if (!mainTitle) return;
          const subParts = [props.district, props.city, props.state].filter(Boolean);

          appendLiveCandidate({
            id: `pho_${props.osm_id || Math.random()}`,
            title: mainTitle,
            sub: subParts.join(' - ') || 'العراق',
            type: 'موقع جغرافي',
            lat,
            lng
          });
        });
      } catch (e) {}
    })();

    await Promise.allSettled([arcgisTask, nominatimTask, photonTask]);

    // إذا لم توجد أي نتائج بعد انتهاء المحركات الثلاثة، نعرض رسالة واضحة
    const statusBanner = dropdown.querySelector('.live-search-status');
    if (statusBanner && !dropdown.querySelector('.search-result-item')) {
      statusBanner.textContent = `لم يتم العثور على "${query}"، جرب كتابة اسم المنطقة متبوعاً باسم المحافظة`;
    }
  }

  /**
   * قراءة موقع المستخدم واتجاهه الحقيقي وبنايته الحالية عبر GPS
   */
  locateUser() {
    if (!navigator.geolocation) {
      alert("خاصية تحديد الموقع الجغرافي (GPS) غير مدعومة في متصفحك.");
      return;
    }

    this.showToast("📍 جاري تحديد موقعك وبنايتك الحالية عبر GPS...");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy, heading, speed } = pos.coords;
        const speedKmh = speed ? speed * 3.6 : 0;
        const validHeading = (typeof heading === 'number' && !isNaN(heading)) ? heading : null;

        this.mapEngine.updateUserLocation(latitude, longitude, accuracy, validHeading, speedKmh > 1.5, speedKmh);
        this.mapEngine.flyTo(latitude, longitude, 17);

        const match = findClosestGovernorate(latitude, longitude);
        const buildingName = await this.mapEngine.reverseGeocodeBuildingAt(latitude, longitude);

        if (buildingName) {
          this.showToast(`✅ موقعك الحالي: ${formatArabicParentheses(buildingName)} \u200F( ${match.governorate} )\u200F`);
        } else {
          this.showToast(`✅ تم تحديد موقعك واتجاهك بدقة في \u200F( ${match.governorate} )\u200F`);
        }

        if (this.tripNavigation && this.tripNavigation.isTripActive) {
          this.tripNavigation.setOriginPin(latitude, longitude, buildingName || `موقعي \u200F( ${match.governorate} )\u200F`);
        }

        setTimeout(() => {
          const btn = document.getElementById('addHereGpsBtn');
          if (btn) {
            btn.onclick = () => {
              this.openAddPlaceModal(latitude, longitude);
            };
          }
        }, 300);
      },
      (err) => {
        console.warn("GPS Warning:", err);
        const center = this.mapEngine.map.getCenter();
        this.mapEngine.updateUserLocation(center.lat, center.lng, 25, 0, false, 0);
        this.showToast("📍 تم تفعيل مجسم موقعك في المركز الحالي");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  async exportData(type = "geojson") {
    let content = "";
    let filename = "";
    let mime = "application/json";

    if (type === "geojson") {
      content = await storage.exportAsGeoJSON();
      filename = `omi_iraq_places_${Date.now()}.geojson`;
      mime = "application/geo+json";
    } else if (type === "csv") {
      content = await storage.exportAsCSV();
      filename = `omi_iraq_places_${Date.now()}.csv`;
      mime = "text/csv;charset=utf-8;";
    } else {
      content = await storage.exportAsJSON();
      filename = `omi_iraq_places_${Date.now()}.json`;
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.showToast(`تم تصدير ملف ${filename} بنجاح ✅`);
  }

  async handleFileImport(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const res = await storage.importData(text);
      if (res.success) {
        await this.refreshPlacesList();
        this.showToast(`تم استيراد ${res.count} نقطة بنجاح! 🎉`);
      } else {
        alert("فشل استيراد الملف: تأكد من صحة تنسيق GeoJSON أو JSON");
      }
      e.target.value = "";
    };
    reader.readAsText(file);
  }

  showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = formatArabicParentheses(message);
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(12px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  startPinPlacement(initialLatLng = null, openHubOnClick = false) {
    this.mapEngine.startDraggablePin(
      initialLatLng,
      (lat, lng) => {
        this.openAddPlaceModal(lat, lng);
      },
      (destObj) => {
        this.startPinNavigationToDestination(destObj);
      }
    );

    if (!openHubOnClick || !initialLatLng) {
      return;
    }

    const pos = initialLatLng;
    const match = findClosestGovernorate(pos.lat, pos.lng);
    const basePlace = {
      id: `pin_${Date.now()}`,
      name: `موقع محدد (${match.governorate})`,
      city: match.governorate,
      gov: match.governorate,
      address: `${match.governorate} — ${formatCoordinates(pos.lat, pos.lng)}`,
      lat: pos.lat,
      lng: pos.lng
    };
    if (this.placeHubController) {
      this.placeHubController.openForPlace(basePlace);
    }
    this.mapEngine.reverseGeocodeBuildingAt(pos.lat, pos.lng).then((detectedName) => {
      if (detectedName && this.placeHubController) {
        this.placeHubController.openForPlace({
          ...basePlace,
          name: detectedName
        });
      }
    });
  }

  /**
   * تهيئة واجهة اختيار المجسمات ثلاثية الأبعاد بأسماء من كلمة واحدة فقط بدون تفاصيل أو حشو
   * (سهم - مستكشف - انسان - سيارة - روبوت - طائرة - دراجة هوائية - حصان - ثعلب - فلامينغو)
   */
  setup3DModalUI() {
    const grid = document.getElementById('models3DGrid');
    if (!grid) return;

    grid.innerHTML = '';
    const savedModel = storage.getSettings().userModel || 'arrow';
    const currentModelId = savedModel === 'parrot' ? 'flying_bird' : savedModel;

    AVAILABLE_3D_MODELS.forEach((m) => {
      const card = document.createElement('div');
      card.className = `model-3d-card compact-word-only ${m.id === currentModelId ? 'selected' : ''}`;
      card.setAttribute('data-model-id', m.id);
      card.innerHTML = `
        <div class="model-3d-icon">${m.icon}</div>
        <div class="model-3d-info">
          <strong>${m.name}</strong>
        </div>
      `;

      card.addEventListener('click', () => {
        document.querySelectorAll('.model-3d-card').forEach((c) => c.classList.remove('selected'));
        card.classList.add('selected');

        if (this.preview3DInstance) {
          this.preview3DInstance.changeModel(m.id);
        }

        this.mapEngine.setUser3DModel(m.id);

        if (!this.mapEngine.userLocationMarker) {
          const c = this.mapEngine.map.getCenter();
          this.mapEngine.updateUserLocation(c.lat, c.lng, 15, 0, false, 0);
        }

        const s = storage.getSettings();
        s.userModel = m.id;
        storage.saveSettings(s);

        if (this.cityRTEngine && this.cityRTEngine.isActive) {
          this.cityRTEngine.loadUser3DAvatar(m.id);
        }

        this.showToast(`✨ تم اختيار: ${m.name}`);
      });

      grid.appendChild(card);
    });

    document.getElementById('launchRoamFromAvatarModalBtn')?.addEventListener('click', () => {
      this.closeModal('avatar3DModal');
      this.toggleLiveRoam3DMode(true);
    });
  }

  open3DModal() {
    this.openModal('avatar3DModal');
    const canvas = document.getElementById('avatarPreviewCanvas');
    if (canvas) {
      if (this.preview3DInstance) {
        this.preview3DInstance.destroy();
      }
      const savedModel = storage.getSettings().userModel || 'arrow';
      const activeModelId = savedModel === 'parrot' ? 'flying_bird' : savedModel;
      this.preview3DInstance = threeEngine.setupPreviewCanvas(canvas, activeModelId);
    }
  }

  setupOfflineUI() {
    const downloadBtn = document.getElementById('startOfflineDownloadBtn');
    const progressBar = document.getElementById('offlineProgressBar');
    const progressFill = document.getElementById('offlineProgressFill');
    const progressText = document.getElementById('offlineProgressText');

    downloadBtn?.addEventListener('click', async () => {
      downloadBtn.disabled = true;
      downloadBtn.innerHTML = '⏳ جاري تنزيل بلاطات وشخصيات العراق...';
      if (progressBar) progressBar.style.display = 'block';

      const res = await offlinePack.downloadOfflinePack((prog) => {
        if (progressFill) progressFill.style.width = `${prog.percent}%`;
        if (progressText) progressText.textContent = prog.text;
      });

      downloadBtn.disabled = false;
      downloadBtn.innerHTML = '✅ تم تنزيل خريطة العراق أوفلاين';

      if (res.success) {
        this.showToast(`🎉 اكتمل تنزيل خريطة العراق للعمل أوفلاين بدون انترنت!`);
        this.updateOfflineModalStats();
      } else {
        alert('حدث خطأ أثناء تحميل بعض الملفات، يرجى المحاولة لاحقاً');
      }
    });

    document.getElementById('pwaInstallActionBtn')?.addEventListener('click', async () => {
      const installed = await offlinePack.triggerInstallPrompt();
      if (installed) {
        this.showToast('شكراً لتثبيت مشروع OMI على جهازك! 🇮🇶');
      }
    });

    document.getElementById('clearOfflineCacheBtn')?.addEventListener('click', async () => {
      if (confirm('هل ترغب بمسح خريطة العراق المخزنة أوفلاين لتحرير مساحة التخزين؟')) {
        await offlinePack.clearOfflinePack();
        this.updateOfflineModalStats();
        this.showToast('تم مسح الحزمة أوفلاين بنجاح');
      }
    });
  }

  async updateOfflineModalStats() {
    const status = await offlinePack.getOfflineStatus();
    const countEl = document.getElementById('offlineTilesCount');
    const badgeEl = document.getElementById('offlineStatusBadge');

    if (countEl) countEl.textContent = `${status.count} بلاطة وملف`;
    if (badgeEl) {
      if (status.isCached) {
        badgeEl.textContent = 'جاهز للعمل أوفلاين 100% ✅';
        badgeEl.className = 'status-badge-ready';
      } else {
        badgeEl.textContent = 'يتطلب تحميل الحزمة ⚠️';
        badgeEl.className = 'status-badge-pending';
      }
    }
  }

  toggleLiveTracking() {
    if (this.isTrackingLive) {
      if (this.gpsWatchId !== null) {
        navigator.geolocation.clearWatch(this.gpsWatchId);
        this.gpsWatchId = null;
      }
      this.isTrackingLive = false;
      document.getElementById('trackToggleBtn')?.classList.remove('active');
      if (this.mapEngine?.user3DInstance) {
        this.mapEngine.user3DInstance.setMotionState(false, 0);
      }
      this.showToast('تم إيقاف التتبع الفضائي المباشر');
      return;
    }

    if (!navigator.geolocation) {
      alert('خاصية تحديد الموقع غير مدعومة في هذا الجهاز.');
      return;
    }

    this.isTrackingLive = true;
    document.getElementById('trackToggleBtn')?.classList.add('active');
    this.showToast('📡 تم تفعيل التتبع الفضائي المباشر الموجه لبوصلتك الحقيقية');

    this.gpsWatchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy, speed, heading } = pos.coords;
        const speedKmh = speed ? speed * 3.6 : 0;
        const validHeading = (typeof heading === 'number' && !isNaN(heading)) ? heading : null;

        this.mapEngine.updateUserLocation(latitude, longitude, accuracy, validHeading, speedKmh > 1.5, speedKmh);

        if (this.tripNavigation && this.tripNavigation.isTripActive) {
          this.tripNavigation.handlePositionUpdate(latitude, longitude, speedKmh, validHeading);
        }
      },
      (err) => {
        console.warn('GPS Watch warning:', err);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 15000
      }
    );
  }

  async togglePinNavigationMode() {
    this.mapEngine.clearDraggablePin();

    if (this.tripNavigation.isTripActive) {
      this.tripNavigation.endTrip();
      return;
    }

    this.showToast('🧭 اسحب دبوس الانطلاق 🅰️ أو دبوس الوجهة 🏁 أو انقر على أي مكان بالخريطة لتحديد مسارك!');
    await this.tripNavigation.activatePinToPinNavigation(null, null, this.getTripCallbacks());
  }

  async startPinNavigationToDestination(destinationObj) {
    this.mapEngine.clearDraggablePin();
    this.showToast(`🧭 تم رسم المسار المباشر بالدبوس إلى ${formatArabicParentheses(destinationObj.name)}`);

    if (this.tripNavigation.isTripActive) {
      await this.tripNavigation.setDestinationPin(destinationObj.lat, destinationObj.lng, destinationObj.name);
    } else {
      await this.tripNavigation.activatePinToPinNavigation(null, destinationObj, this.getTripCallbacks());
    }
  }

  getTripCallbacks() {
    return {
      onRouteUpdated: (route) => {
        const dashboard = document.getElementById('tripDashboard');
        if (dashboard) dashboard.classList.remove('hidden');

        document.getElementById('tripRouteTitle').textContent = formatArabicParentheses(`من ${route.origin.name} ➔ إلى ${route.destination.name}`);
        document.getElementById('tripRemainingDist').textContent = `${route.distanceKm.toFixed(1)} كم`;
        document.getElementById('tripEta').textContent = `${route.estimatedMinutes} دقيقة`;
        document.getElementById('tripSpeed').textContent = `جاهز`;
        document.getElementById('tripBearing').textContent = `${route.bearingLabel} \u200F( ${route.bearingDeg}° )\u200F`;
        document.getElementById('tripModeBadge').textContent = route.isOsrm
          ? '🛣️ مسار طرق ذكي — اسحب الدبوس 🅰️ أو 🏁 أو انقر لتغيير الوجهة'
          : '📡 مسار أوفلاين مباشر — اسحب الدبوس 🅰️ أو 🏁 أو انقر لتغيير الوجهة';

        const simBtn = document.getElementById('simTripBtn');
        if (simBtn && !this.tripNavigation.isSimulating) {
          simBtn.innerHTML = '<span>🚀</span> تحرك على المسار الآن';
        }
      },
      onProgress: (data) => {
        document.getElementById('tripRemainingDist').textContent = `${data.remainingKm} كم`;
        document.getElementById('tripEta').textContent = `${data.remainingMinutes} دقيقة`;
        document.getElementById('tripSpeed').textContent = `${data.speedKmh} كم/س`;
        document.getElementById('tripBearing').textContent = `${data.bearingLabel} \u200F( ${data.bearingDeg}° )\u200F`;
      },
      onArrival: (dest) => {
        this.showToast(`🎉 الحمد لله على السلامة! وصلت إلى: ${formatArabicParentheses(dest.name)}`);
        this.handleTripEnd();
      },
      onEnd: () => {
        this.handleTripEnd();
      }
    };
  }

  handleTripEnd() {
    const dashboard = document.getElementById('tripDashboard');
    if (dashboard) dashboard.classList.add('hidden');
  }

  getUserOrMapCenterCoords() {
    if (this.mapEngine?.userLocationLatLng) {
      return this.mapEngine.userLocationLatLng;
    }
    if (this.mapEngine?.map) {
      const c = this.mapEngine.map.getCenter();
      return { lat: c.lat, lng: c.lng };
    }
    return { lat: 33.3152, lng: 44.3661 };
  }

  initSocialMapEngines() {
    // 1. محرك الوسائط ثلاثية الأبعاد 360° والصور والفيديو
    this.media3DStageController = new RichMedia3DStageController({
      onAddToCart: (item, place) => {
        if (this.commerceController) {
          this.commerceController.addItemToCart(item, place);
          this.showToast(`🛒 تمت إضافة "${item.name}" إلى السلة بنجاح`);
        }
      }
    });

    // 2. محرك البث المباشر للكاميرات الحية ونافذة PiP العائمة
    this.liveCamController = new LiveCameraStreamController({
      onRequestRide: (place) => this.rideHailingController?.openForDestination(place),
      onOpenMenu: (place) => this.commerceController?.openCatalogForPlace(place)
    });

    // 3. محرك المنيو والتسوق المكاني والطوابق المتعددة للمولات
    this.commerceController = new SpatialCommerceController({
      getUserCoords: () => this.getUserOrMapCenterCoords(),
      onInspect3DItem: (item, place, tab) => {
        this.media3DStageController?.openForItemOrPlace(item, place, tab || '3d');
      },
      onDispatchDeliveryOnMap: (storePlace) => {
        this.showToast(`🛵 تم تأكيد طلبك من "${storePlace.name}"! جاري تتبع المندوب مباشرة على الخريطة`);
        if (this.rideHailingController) {
          this.rideHailingController.destinationPlace = storePlace;
          const cap = { name: 'كابتن التوصيل السريع', car: 'دراجة توصيل سريعة', plate: 'بغداد 9941', rating: 4.97 };
          this.rideHailingController.startLiveCaptainTracking(
            { formattedFare: 'مدفوع / عند الاستلام' },
            cap,
            String(Math.floor(1000 + Math.random() * 9000)),
            true
          );
        }
      }
    });

    // 4. محرك طلب سيارات الأجرة والتوصيل (Pin-to-Ride)
    this.rideHailingController = new RideHailingController({
      getMapEngine: () => this.mapEngine,
      getUserCoords: () => this.getUserOrMapCenterCoords()
    });

    // 5. محرك وضع التجول الحي ثلاثي الأبعاد فوق الخريطة الحقيقية (Real-Map CityRT 3D Live Roaming Engine)
    this.cityRTEngine = new CityRT3DIraqEngine({
      getMapEngine: () => this.mapEngine,
      onSelectPlace: (place) => {
        this.placeHubController?.openForPlace(place);
        this.showToast(`🏢 اخترت "${place.name}" — يمكنك طلب تكسي أو تصفح المنيو أو البث الحي`);
      },
      onAvatarChanged: (modelId) => {
        const s = storage.getSettings();
        s.userModel = modelId;
        storage.saveSettings(s);
        const found = AVAILABLE_3D_MODELS.find((m) => m.id === modelId);
        if (found) {
          this.showToast(`🕹️ أنت تتجول الآن في الخريطة الحقيقية بشخصية: ${found.icon} ${found.name}`);
        }
      },
      onExit3D: () => {
        document.getElementById('liveRoam3DBtn')?.classList.remove('active');
      }
    });

    // 6. محرك بطاقة المكان الشاملة (Universal Place Hub)
    this.placeHubController = new UniversalPlaceHubController({
      getUserCoords: () => this.getUserOrMapCenterCoords(),
      onRequestTaxi: (place) => this.rideHailingController?.openForDestination(place),
      onOpenCommerce: (place) => this.commerceController?.openCatalogForPlace(place),
      onOpenLiveCam: (place) => this.liveCamController?.openForPlace(place),
      onOpenRich3D: (item, place, tab) => this.media3DStageController?.openForItemOrPlace(item, place, tab || '3d'),
      onOpenCityRT3D: (place) => {
        this.placeHubController?.close();
        document.getElementById('liveRoam3DBtn')?.classList.add('active');
        this.cityRTEngine?.openAtLocation(place.lng, place.lat, place.name);
      },
      onNavigateRoute: (place) => {
        this.startPinNavigationToDestination({
          lat: place.lat,
          lng: place.lng,
          name: place.name
        });
      }
    });

    // ربط أزرار الشريط السريع (Quick Filter Bar)
    document.querySelectorAll('[data-sm-filter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-sm-filter]').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const filterKey = btn.getAttribute('data-sm-filter') || 'all';
        this.mapEngine?.setSocialMapCategoryFilter(filterKey);
        if (filterKey === 'restaurant') {
          this.showToast('🍽️ تم إبراز المطاعم والكافيهات — اضغط على أي مكان لعرض المنيو ومجسمات الأطباق 3D');
        } else if (filterKey === 'mall') {
          this.showToast('🏬 تم إبراز المولات والأسواق — اضغط على أي مول لتصفح الطوابق والشراء');
        } else if (filterKey === 'livecam') {
          this.showToast('🔴 تم إبراز مواقع البث المباشر — اضغط على أي موقع لمشاهدة الكاميرات الحية');
        }
      });
    });

    document.getElementById('smQuickTaxiBtn')?.addEventListener('click', () => {
      const c = this.mapEngine.map.getCenter();
      const gov = findClosestGovernorate(c.lat, c.lng).governorate;
      this.rideHailingController?.openForDestination({
        name: `موقع الخريطة الحالي (${gov})`,
        city: gov,
        lat: c.lat,
        lng: c.lng
      });
    });

    document.getElementById('smQuickCityRTBtn')?.addEventListener('click', () => {
      this.toggleLiveRoam3DMode(true);
    });

    document.getElementById('enterFullCityRTFromBarBtn')?.addEventListener('click', () => {
      this.toggleLiveRoam3DMode(true);
    });

    // ربط أزرار درج التكسي
    document.getElementById('closeTaxiDrawerBtn')?.addEventListener('click', () => {
      this.rideHailingController?.closeDrawer();
    });
    document.getElementById('taxiConfirmBookingBtn')?.addEventListener('click', () => {
      this.rideHailingController?.confirmBooking();
      this.showToast('🚖 تم إرسال طلب سيارة الأجرة! الكابتن في طريقه إليك على الخريطة');
    });

    // ربط أزرار درج المنيو والسلة
    document.getElementById('closeCommerceDrawerBtn')?.addEventListener('click', () => {
      this.commerceController?.closeDrawer();
    });
    document.getElementById('openCartCheckoutBtn')?.addEventListener('click', () => {
      this.commerceController?.openCheckoutModal();
    });
    document.getElementById('closeCartCheckoutBtn')?.addEventListener('click', () => {
      document.getElementById('socialmapCartCheckoutModal')?.classList.add('hidden');
    });
    document.getElementById('confirmOrderDispatchBtn')?.addEventListener('click', () => {
      this.commerceController?.confirmOrderAndDispatch();
    });

    // ربط أزرار مسرح المجسمات 3D والصور والفيديو
    document.getElementById('closeMedia3DModalBtn')?.addEventListener('click', () => {
      this.media3DStageController?.close();
    });
    document.querySelectorAll('[data-media-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.media3DStageController?.switchTab(btn.getAttribute('data-media-tab'));
      });
    });
    document.querySelectorAll('[data-media-size]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.media3DStageController?.setSizeScale(
          btn.getAttribute('data-media-size'),
          btn.getAttribute('data-size-label')
        );
      });
    });
    document.querySelectorAll('[data-media-light]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-media-light]').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.media3DStageController?.setLightingPreset(btn.getAttribute('data-media-light'));
      });
    });

    // ربط أزرار البث المباشر ونافذة PiP
    document.getElementById('closeLiveCamModalBtn')?.addEventListener('click', () => {
      this.liveCamController?.close();
    });
    document.getElementById('liveCamSnapshotBtn')?.addEventListener('click', () => {
      this.liveCamController?.captureSnapshot();
      this.showToast('📸 تم التقاط وحفظ صورة حية من البث المباشر');
    });
    document.getElementById('liveCamPiPBtn')?.addEventListener('click', () => {
      this.liveCamController?.minimizeToPiP();
    });
    document.getElementById('livePiPExpandBtn')?.addEventListener('click', () => {
      this.liveCamController?.restoreFromPiP();
    });
    document.getElementById('livePiPCloseBtn')?.addEventListener('click', () => {
      this.liveCamController?.close();
    });

    // ربط أزرار وضع التجول الحي SMI 3D Live Roaming
    const roamHudToggleBtn = document.getElementById('roamHudToggleBtn');
    const roamSettingsDrawer = document.getElementById('roamSettingsDrawer');
    roamHudToggleBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!roamSettingsDrawer) return;
      const isCollapsed = roamSettingsDrawer.classList.toggle('collapsed');
      roamHudToggleBtn.setAttribute('aria-expanded', isCollapsed ? 'false' : 'true');
    });

    document.getElementById('closeCityRT3DBtn')?.addEventListener('click', () => {
      this.cityRTEngine?.close();
    });
    document.getElementById('closeCityRT3DQuickBtn')?.addEventListener('click', () => {
      this.cityRTEngine?.close();
    });

    // ربط أزرار شريط التوجه التلقائي الذكي في وضع التجول الحي
    document.getElementById('roamAutoNavToggleBtn')?.addEventListener('click', () => {
      this.cityRTEngine?.togglePauseRoamingAutoNavigation();
    });
    document.getElementById('roamAutoNavStopBtn')?.addEventListener('click', () => {
      this.cityRTEngine?.stopRoamingAutoNavigation();
    });
    document.getElementById('roamAutoNavTaxiBtn')?.addEventListener('click', () => {
      const target = this.cityRTEngine?.autoNavTarget || this.cityRTEngine?.currentTouchedBuilding;
      if (target) {
        this.rideHailingController?.openForDestination(target);
      }
    });
    document.getElementById('roamAutoNavShopBtn')?.addEventListener('click', () => {
      const target = this.cityRTEngine?.autoNavTarget || this.cityRTEngine?.currentTouchedBuilding;
      if (target) {
        this.commerceController?.openCatalogForPlace(target);
      }
    });
    document.getElementById('roamAutoNavHubBtn')?.addEventListener('click', () => {
      const target = this.cityRTEngine?.autoNavTarget || this.cityRTEngine?.currentTouchedBuilding;
      if (target) {
        this.placeHubController?.openForPlace(target);
      }
    });

    document.querySelectorAll('[data-cityrt-nav]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.cityRTEngine?.setCameraMode(btn.getAttribute('data-cityrt-nav'));
      });
    });
    document.getElementById('cityrtPerspectiveBtn')?.addEventListener('click', () => {
      this.cityRTEngine?.toggleCameraPerspective();
    });
    document.getElementById('cityrtSketchToggleBtn')?.addEventListener('click', () => {
      this.cityRTEngine?.toggleSketchMode();
    });
    document.getElementById('cityrtTimeSlider')?.addEventListener('input', (e) => {
      this.cityRTEngine?.applyTimeOfDay(parseFloat(e.target.value));
    });
    document.getElementById('cityrtWeatherSelect')?.addEventListener('change', (e) => {
      this.cityRTEngine?.setWeatherMode(e.target.value);
    });
  }

  toggleLiveRoam3DMode(forceOpen = null) {
    if (!this.cityRTEngine) return;
    const shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : !this.cityRTEngine.isActive;
    const roamBtn = document.getElementById('liveRoam3DBtn');

    // إغلاق نافذة معلومات المكان دائماً عند التبديل لضمان بقائها مخفية إلا عند الطلب
    this.placeHubController?.close();

    if (!shouldOpen) {
      this.cityRTEngine.close();
      roamBtn?.classList.remove('active');
      this.showToast('🗺️ تم العودة للخريطة التفاعلية 2D مع حفظ موقعك الحالي');
      return;
    }

    const pos = this.mapEngine.userLocationLatLng || this.mapEngine.map.getCenter();
    const gov = findClosestGovernorate(pos.lat, pos.lng).governorate;
    const savedModel = storage.getSettings().userModel || 'flying_bird';
    this.cityRTEngine.activeModelId = (savedModel === 'arrow' || savedModel === 'parrot') ? 'flying_bird' : savedModel;
    this.cityRTEngine.openAtLocation(pos.lng, pos.lat, `${gov}`);
    roamBtn?.classList.add('active');
    this.showToast('🎮 اضغط على زر 🎮 لفتح أو غلق شريط الشخصيات والإعدادات، وعند ملامسة أي بناية اضغط زر الإجراء 🏢 لعرض خدماتها');
  }

  handlePlaceAction(place, action) {
    if (action === 'hub') {
      this.placeHubController?.openForPlace(place);
    } else if (action === 'taxi') {
      this.rideHailingController?.openForDestination(place);
    } else if (action === 'shop') {
      this.commerceController?.openCatalogForPlace(place);
    } else if (action === 'livecam') {
      this.liveCamController?.openForPlace(place);
    } else if (action === 'stage3d') {
      this.media3DStageController?.openForItemOrPlace(place, place, '3d');
    } else if (action === 'cityrt') {
      this.placeHubController?.close();
      this.cityRTEngine?.openAtLocation(place.lng, place.lat, place.name);
    } else if (action === 'navigate') {
      this.startPinNavigationToDestination({
        lat: place.lat,
        lng: place.lng,
        name: place.name
      });
    } else if (action === 'save') {
      this.openAddPlaceModal(place.lat, place.lng);
      const titleInput = document.getElementById('placeTitleInput');
      const govSelect = document.getElementById('placeGovSelect');
      if (titleInput) titleInput.value = formatArabicParentheses(place.name);
      if (govSelect && place.gov) govSelect.value = place.gov;
    }
  }

  togglePlacesLayer() {
    this.placesLabelsVisible = this.mapEngine.togglePlacesLabels();
    const btn = document.getElementById('placesToggleBtn');
    if (btn) btn.classList.toggle('active', this.placesLabelsVisible);
    this.showToast(this.placesLabelsVisible ? 'تم إظهار الأماكن والبنايات \u200F( حسب مستوى التكبير )\u200F' : 'تم إخفاء أسماء الأماكن');
  }

  openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('active');
  }

  closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('active');
    if (id === 'avatar3DModal' && this.preview3DInstance) {
      this.preview3DInstance.destroy();
      this.preview3DInstance = null;
    }
  }

  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js?v=16').catch(() => {});
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.OpenMapIQ = new OpenMapIQApp();
});
