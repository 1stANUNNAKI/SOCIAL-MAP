# 🗄️ وثيقة 03: نمذجة البيانات الشاملة وقواعد البيانات المكانية (Data Models, ERDs & Storage Schemas)
### **النظام: SOCIALMAP — المنظومة الجغرافية الاجتماعية والتجارية واللوجستية الفائقة**

---

## 1. 📐 مخطط العلاقات والكيانات الشامل (Master Entity-Relationship Diagram - ERD)

يوضح مخطط `erDiagram` التالي كافة الكيانات والعلاقات المهيكلة لمنظومة **SOCIALMAP** (المستخدمون، الأماكن الجغرافية، الوسائط والمجسمات ثلاثية الأبعاد، كاميرات البث المباشر، المتاجر والمنيو والمنتجات، الطلبات والسلة، وكباتن سيارات الأجرة والرحلات):

```mermaid
erDiagram
    USERS ||--o{ RIDES : "يطلب رحلة تكسي"
    USERS ||--o{ ORDERS : "يشتري من المنيو"
    USERS ||--o{ SAVED_PLACES : "يحفظ في المفضلة"
    USERS ||--|| WALLETS : "يمتلك محفظة مالية"

    PLACES ||--o{ PLACE_MEDIA_3D : "يمتلك صور وفيديو ومجسم 3D"
    PLACES ||--o{ LIVE_CAMERAS : "يحتوي على كاميرات بث مباشر"
    PLACES ||--o| MERCHANTS : "يرتبط بمطعم / سوق / مول"
    PLACES ||--o{ RIDES : "يكون نقطة انطلاق أو وجهة"

    MERCHANTS ||--o{ MENU_CATEGORIES : "يقسم المنيو إلى فئات"
    MENU_CATEGORIES ||--o{ MENU_ITEMS : "تضم عناصر وقطع المنيو"
    MENU_ITEMS ||--o{ ITEM_MEDIA_3D : "يعرض صور وفيديو ومجسم 3D للقطعة"
    MENU_ITEMS ||--o{ ITEM_OPTION_GROUPS : "خيارات الحجم والإضافات"

    ORDERS ||--|{ ORDER_ITEMS : "يتكون من قطع مشتراة"
    MERCHANTS ||--o{ ORDERS : "يستقبل ويجهز الطلب"
    DRIVERS ||--o{ RIDES : "ينفذ رحلة التكسي"
    DRIVERS ||--o{ ORDERS : "يوصل الطلب للمستخدم"

    USERS {
        uuid id PK
        string full_name
        string phone_iq "9647XXXXXXXXX"
        string role "user | captain | courier | merchant | admin"
        string avatar_3d_model "arrow | car | human | explorer..."
        float last_lat
        float last_lng
        string h3_index_res9
        timestamp created_at
    }

    PLACES {
        string id PK "gaz_krb_1 / osm_way_123"
        string name_ar "الاسم العربي المنسق"
        string name_en
        string governorate "المحافظة العراقية"
        string district_sub "القضاء / الحي / المقاطعة"
        string place_type "restaurant | mall | market | landmark | district | hospital | university"
        float lat
        float lng
        string h3_index_res9
        boolean is_ride_enabled "متاح لطلب التكسي"
        boolean has_menu_store "يحتوي على منيو وشراء"
        boolean has_live_cameras "يحتوي على بث مباشر"
        boolean has_3d_model "يحتوي على مجسم 3D"
        float rating_avg
        string crowd_status "low | moderate | high"
    }

    PLACE_MEDIA_3D {
        uuid id PK
        string place_id FK
        string media_type "photo_hd | photo_360 | video_reel | model_3d_glb"
        string url "رابط الصورة أو الفيديو أو ملف GLB"
        string thumbnail_url
        jsonb model_3d_config "{scale, rotation, autoRotate, cameraOrbit, arSupported}"
        int sort_order
    }

    LIVE_CAMERAS {
        uuid id PK
        string place_id FK
        string camera_title_ar "المدخل الرئيسي / الساحة الداخلية / الشارع"
        string stream_protocol "webrtc_whep | ll_hls | mp4_sim"
        string stream_url
        string fallback_video_url
        string status "online_live | maintenance | offline"
        int current_viewers
        string crowd_level "quiet | normal | busy"
        boolean audio_enabled
        string angle_direction "شمال | جنوب | داخلي | بانوراما"
    }

    MERCHANTS {
        uuid id PK
        string place_id FK
        string store_name_ar
        string store_category "restaurant | cafe | supermarket | mall_shop | pharmacy | electronics"
        string logo_url
        string cover_video_url
        boolean is_open_now
        string opening_hours "08:00 - 24:00"
        int prep_time_minutes "15 - 30"
        int min_order_iqd "5000"
        int base_delivery_fee_iqd "2000"
        boolean supports_delivery
        boolean supports_pickup
        boolean supports_dine_in
    }

    MENU_CATEGORIES {
        uuid id PK
        uuid merchant_id FK
        string title_ar "المشويات | البرغر | الحلويات | الإلكترونيات"
        string icon_emoji
        int sort_order
    }

    MENU_ITEMS {
        uuid id PK
        uuid category_id FK
        uuid merchant_id FK
        string name_ar "اسم الوجبة أو القطعة"
        string description_ar "وصف المكونات أو المواصفات"
        int price_iqd "السعر بالدينار العراقي"
        int discount_price_iqd
        boolean in_stock
        int calories_or_weight
        string primary_photo_url
        string preview_video_url "فيديو استعراض القطعة"
        string model_3d_glb_url "مجسم ثلاثي الأبعاد للقطعة .glb"
        jsonb customization_schema "الأحجام والإضافات"
    }

    DRIVERS {
        uuid id PK
        uuid user_id FK
        stringdriver_type "taxi_captain | delivery_courier | both"
        string vehicle_tier "economy | comfort | family_xl | moto_express"
        string vehicle_make_model "كيا سبورتج 2024 - أبيض"
        string plate_number_iq "بغداد 12345 أ"
        string model_3d_id "car | bike"
        float current_lat
        float current_lng
        float heading_deg
        float speed_kmh
        string h3_index_res9
        string availability_status "online_free | busy_on_ride | busy_on_delivery | offline"
        float rating_avg
    }

    RIDES {
        uuid id PK
        uuid passenger_id FK
        uuid captain_id FK
        string target_place_id FK
        float pickup_lat
        float pickup_lng
        string pickup_address_ar
        float dropoff_lat
        float dropoff_lng
        string dropoff_address_ar
        string vehicle_tier
        float distance_km
        int estimated_minutes
        int fare_total_iqd
        string payment_method "cash | wallet | zaincash | qicard"
        string ride_status "searching | accepted | arriving | arrived | in_progress | completed | cancelled"
        jsonb route_polyline
        timestamp created_at
    }

    ORDERS {
        uuid id PK
        uuid customer_id FK
        uuid merchant_id FK
        uuid courier_id FK
        string fulfillment_type "delivery | pickup | dine_in"
        float delivery_lat
        float delivery_lng
        string delivery_address_ar
        int subtotal_iqd
        int delivery_fee_iqd
        int discount_iqd
        int total_iqd
        string payment_method "cash_on_delivery | wallet | zaincash | qicard"
        string order_status "placed | accepted | preparing | ready | picked_up | delivering | delivered | cancelled"
        string delivery_otp_code "رمز تأكيد الاستلام من 4 أرقام"
        timestamp created_at
    }

    ORDER_ITEMS {
        uuid id PK
        uuid order_id FK
        uuid menu_item_id FK
        string item_name_ar
        int unit_price_iqd
        int quantity
        jsonb selected_options
        string special_notes
    }
```

---

## 2. 📋 المواصفات التفصيلية لهياكل البيانات (Detailed JSON / Schema Specifications)

### 2.1 عقد بيانات المكان الشامل (`PlaceHubDataContract`)
كل مكان في `SOCIALMAP` يحمل البنية الموحدة التالية التي تغذي الخريطة، البحث، التكسي، المنيو، الـ 3D، والبث المباشر:

```json
{
  "id": "sm_karbala_afaf_mall",
  "name": "مول العفاف التجاري",
  "gov": "كربلاء",
  "sub": "حي الحسين - شارع السناتر",
  "type": "mall",
  "lat": 32.6085,
  "lng": 44.0290,
  "h3Index": "892c1248927ffff",
  "icon": "🛍️",
  "importance": 2,
  "rating": 4.8,
  "reviewsCount": 1420,
  "crowdStatus": "moderate",
  "capabilities": {
    "rideHailing": true,
    "hasMenuOrStore": true,
    "has3DModel": true,
    "hasVideo": true,
    "hasLiveCameras": true
  },
  "media": {
    "photos": [
      { "id": "ph_1", "title": "الواجهة الرئيسية لمول العفاف", "url": "..." },
      { "id": "ph_2", "title": "الطابق التجاري وصالة المطاعم", "url": "..." }
    ],
    "videos": [
      { "id": "vid_1", "title": "جولة فيديو داخل المول والأقسام", "url": "...", "durationSec": 45 }
    ],
    "model3D": {
      "glbUrl": "./assets/models/building_mall_3d.glb",
      "proceduralType": "extruded_mall_complex",
      "scale": 1.4,
      "autoRotate": true,
      "arSupported": true
    }
  },
  "liveCameras": [
    {
      "camId": "cam_afaf_1",
      "title": "كاميرا البوابة الرئيسية وشارع السناتر",
      "status": "online_live",
      "viewers": 128,
      "crowdLevel": "متوسط الحركة",
      "streamType": "hls_or_sim",
      "streamUrl": "..."
    },
    {
      "camId": "cam_afaf_2",
      "title": "كاميرا الباحة الوسطى والطابق الأرضي",
      "status": "online_live",
      "viewers": 84,
      "crowdLevel": "نشط",
      "streamType": "hls_or_sim",
      "streamUrl": "..."
    }
  ],
  "merchantId": "merch_afaf_mall"
}
```

### 2.2 عقد بيانات عنصر المنيو / القطعة القابلة للشراء (`MenuItemDataContract`)
كل وجبة في مطعم أو قطعة في متجر/مول تمتلك هيكلاً غنياً يدعم الصور، الفيديو، والمجسم ثلاثي الأبعاد، وخيارات التخصيص والشراء:

```json
{
  "itemId": "item_masgouf_royal",
  "merchantId": "merch_baghdad_abu_nuwas_rest",
  "categoryId": "cat_grills",
  "name": "سمك مسكوف عراقي على الحطب \u200F( وزن 2 كغم )\u200F",
  "description": "سمك كارب عراقي حي مسكوف على حطب النارنج مع القيمر والطرشي والخبز الحار بالتنور.",
  "priceIQD": 35000,
  "discountPriceIQD": null,
  "currency": "د.ع",
  "inStock": true,
  "prepTimeMinutes": 25,
  "calories": 1450,
  "rating": 4.9,
  "media": {
    "photos": [
      "https://...",
      "https://..."
    ],
    "videoUrl": "https://...",
    "model3D": {
      "id": "dish_3d_masgouf",
      "glbUrl": "./assets/models/dish_platter.glb",
      "proceduralDishType": "grilled_platter_3d",
      "scale": 1.25,
      "interactive360": true
    }
  },
  "optionGroups": [
    {
      "groupId": "opt_size",
      "title": "اختر الحجم / الوزن",
      "required": true,
      "maxSelect": 1,
      "choices": [
        { "id": "sz_med", "label": "وسط \u200F( 1.5 كغم )\u200F", "extraIQD": 0 },
        { "id": "sz_lrg", "label": "كبير عائلي \u200F( 2.5 كغم )\u200F", "extraIQD": 12000 }
      ]
    },
    {
      "groupId": "opt_addons",
      "title": "إضافات جانبية",
      "required": false,
      "maxSelect": 4,
      "choices": [
        { "id": "add_rice", "label": "تمن عنبر أحمر إضافي", "extraIQD": 3500 },
        { "id": "add_mezze", "label": "صحن مقبلات عراقية مشكل", "extraIQD": 5000 }
      ]
    }
  ]
}
```

---

## 3. 💾 معمارية التخزين المحلي في المتصفح (`IndexedDB Stores v2 — SocialMapDB`)

لضمان عمل المنظومة بسرعة البرق وحفظ سجل المستخدم حتى عند انقطاع الإنترنت، يتم توسيع قاعدة بيانات المتصفح `IndexedDB` لتشمل 7 مخازن (`Object Stores`) رئيسية:

1. **`places_store`**: النقاط والمواقع الشخصية المحفوظة من قبل المستخدم.
2. **`gazetteer_cache_store`**: الموسوعة الجغرافية العراقية الشاملة + البنايات والمتاجر المحصودة تلقائياً مع فهرس جغرافي (`[lat, lng]`) وفهرس نصي (`keywords`).
3. **`merchants_menus_store`**: تخزين مؤقت لقوائم المطاعم والأسواق والمولات التي تصفحها المستخدم لتعمل فوراً (`Instant Open`).
4. **`cart_store`**: حفظ سلة المشتريات المفتوحة لكل متجر مع الخيارات والكميات حتى لو أُغلق المتصفح.
5. **`orders_history_store`**: سجل كافة طلبات الشراء والتوصيل السابقة والحالية مع الفواتير وحالة التتبع.
6. **`rides_history_store`**: سجل كافة رحلات سيارات الأجرة السابقة والحالية مع المسارات المرسومة والتكلفة وبيانات الكابتن.
7. **`models_3d_cache_store`**: تخزين مؤقت لبيانات المجسمات ثلاثية الأبعاد وإعدادات الكاميرا الخاصة بها.
