/**
 * موسوعة وكتالوج منظومة SOCIALMAP العراقية الشاملة (v11.5)
 * تغطي:
 * 1. فئات سيارات الأجرة والتوصيل العراقية ومعادلات التسعير بالدينار العراقي (IQD).
 * 2. قوائم الطعام (Menus) وكتالوجات الأسواق والمولات متعددة الطوابق والصيدليات والمتاجر في العراق.
 * 3. مواصفات المجسمات ثلاثية الأبعاد (3D Procedural/GLB Dish & Product Models) والصور والفيديوهات لكل قطعة.
 * 4. سجل كاميرات البث المباشر الحية (Live Location Cameras) وزوايا الرؤية المتعددة في مدن العراق.
 */

export const IRAQ_RIDE_TIERS = [
  {
    id: 'ECONOMY',
    name: 'توفير (Economy)',
    badge: 'الأكثر طلباً',
    capacity: '4 ركاب',
    baseFareIqd: 1500,
    perKmIqd: 350,
    perMinIqd: 75,
    minFareIqd: 3000,
    etaMin: 3,
    icon: '🚖',
    color: '#f59e0b',
    vehicleModelDesc: 'كيا ريو / هيونداي أكسنت مكيفة'
  },
  {
    id: 'COMFORT',
    name: 'مريح (Comfort)',
    badge: 'عالي الرفاهية',
    capacity: '4 ركاب',
    baseFareIqd: 2000,
    perKmIqd: 450,
    perMinIqd: 100,
    minFareIqd: 4000,
    etaMin: 4,
    icon: '🚕',
    color: '#0ea5e9',
    vehicleModelDesc: 'تويوتا كامري / سوناتا حديثة'
  },
  {
    id: 'FAMILY_XL',
    name: 'عائلي (Family XL)',
    badge: '7 ركاب',
    capacity: '7 ركاب',
    baseFareIqd: 2500,
    perKmIqd: 600,
    perMinIqd: 125,
    minFareIqd: 5000,
    etaMin: 5,
    icon: '🚙',
    color: '#10b981',
    vehicleModelDesc: 'كيا سورينتو / تويوتا لاندكروزر'
  },
  {
    id: 'VIP_EXEC',
    name: 'درجة أولى (VIP)',
    badge: 'رجال أعمال',
    capacity: '4 ركاب',
    baseFareIqd: 3500,
    perKmIqd: 800,
    perMinIqd: 150,
    minFareIqd: 7500,
    etaMin: 6,
    icon: '🚘',
    color: '#a855f7',
    vehicleModelDesc: 'تاهو ملكي / مرسيدس فئة E'
  },
  {
    id: 'LADY_TAXI',
    name: 'تكسي العائلة والنساء',
    badge: 'كابتنـات معتمدات',
    capacity: '4 ركاب',
    baseFareIqd: 2000,
    perKmIqd: 450,
    perMinIqd: 100,
    minFareIqd: 4000,
    etaMin: 5,
    icon: '🌸',
    color: '#ec4899',
    vehicleModelDesc: 'هيونداي إلنترا مخصصة للعائلات'
  },
  {
    id: 'MOTO_FAST',
    name: 'مندوب توصيل سريع',
    badge: 'طرود وطلبات',
    capacity: 'طرد ≤ 15 كغم',
    baseFareIqd: 1000,
    perKmIqd: 250,
    perMinIqd: 50,
    minFareIqd: 2500,
    etaMin: 2,
    icon: '🛵',
    color: '#ef4444',
    vehicleModelDesc: 'دراجة توصيل سريعة بحافظة حرارية'
  }
];

export const IRAQI_CAPTAINS_POOL = [
  { name: 'الكابتن حيدر الكرادي', car: 'تويوتا كامري حديثة', rating: 4.95, trips: 1840, plate: 'بغداد أ - 48291', phone: '0770-XXX-4829' },
  { name: 'الكابتن مصطفى المنصور', car: 'كيا K5 مكيفة', rating: 4.92, trips: 1420, plate: 'بغداد ب - 71045', phone: '0780-XXX-7104' },
  { name: 'الكابتن علي البصراوي', car: 'هيونداي سوناتا', rating: 4.96, trips: 2150, plate: 'البصرة - 33912', phone: '0771-XXX-3391' },
  { name: 'الكابتن كاروان هورامي', car: 'تويوتا كورولا', rating: 4.94, trips: 1630, plate: 'أربيل - 89204', phone: '0750-XXX-8920' },
  { name: 'الكابتن عمر الموصلي', car: 'هيونداي إلنترا', rating: 4.91, trips: 1290, plate: 'نينوى - 54810', phone: '0772-XXX-5481' },
  { name: 'الكابتن حسين النجفي', car: 'كيا سبورتاج حديثة', rating: 4.97, trips: 2410, plate: 'النجف - 60419', phone: '0781-XXX-6041' },
  { name: 'الكابتن زينب العبيدي (تكسي العائلة)', car: 'هيونداي توسان حديثة', rating: 4.99, trips: 980, plate: 'بغداد د - 91205', phone: '0773-XXX-9120' }
];

/**
 * حساب تسعيرة الرحلة بالدينار العراقي لجميع فئات المركبات مع التقريب لأقرب 250 د.ع
 */
export function calculateIraqRideQuotes(distanceKm = 3.5, durationMin = 9) {
  const safeDist = Math.max(0.8, Number(distanceKm) || 3.2);
  const safeDur = Math.max(3, Number(durationMin) || Math.round(safeDist * 2.4 + 3));

  return IRAQ_RIDE_TIERS.map((tier) => {
    const raw = tier.baseFareIqd + safeDist * tier.perKmIqd + safeDur * tier.perMinIqd;
    const clamped = Math.max(tier.minFareIqd, raw);
    const fareIqd = Math.round(clamped / 250) * 250;
    return {
      ...tier,
      nameAr: tier.name,
      descAr: `${tier.vehicleModelDesc} · ${tier.capacity}`,
      distanceKm: Number(safeDist.toFixed(1)),
      durationMin: Math.round(safeDur),
      fareIqd,
      fareIQD: fareIqd,
      formattedFare: `${fareIqd.toLocaleString('en-US')} د.ع`
    };
  });
}

/**
 * قوالب المنيو والكتالوجات العراقية الغنية بالصور والمجسمات ثلاثية الأبعاد والفيديو
 */
export const IRAQ_COMMERCE_TEMPLATES = {
  restaurant: {
    sectorName: 'مطعم ومطبخ عراقي وعالمي',
    actionLabel: '🍽️ عرض المنيو وطلب الطعام',
    prepTime: '20 - 30 دقيقة',
    minOrderIqd: 5000,
    baseDeliveryIqd: 2000,
    categories: [
      { id: 'all', name: 'الكل 🔥' },
      { id: 'iraqi', name: 'الأكلات العراقية الملكية 🇮🇶' },
      { id: 'grills', name: 'المشويات على الفحم 🍢' },
      { id: 'fastfood', name: 'البيتزا والبرغر 🍕' },
      { id: 'sweets', name: 'الحلويات والمشروبات 🍹' }
    ],
    items: [
      {
        id: 'item_masgouf',
        category: 'iraqi',
        name: 'سمك مسكوف عراقي على الحطب (كطان)',
        desc: 'سمكة كطان دجلة طازجة مشوية على حطب النارنج مع الصلصة العراقية الحارة، الطرشي، البصل المشوي، وخبز التنور الحار.',
        priceIqd: 28000,
        calories: '920 سعرة',
        dimensionsCm: 'قطر الصينية 45 سم × ارتفاع 9 سم',
        badge: '🔥 الأشهر في العراق',
        shape3D: 'masgouf_platter',
        colorPrimary: '#d97706',
        colorAccent: '#dc2626',
        photoGrad: 'linear-gradient(135deg, #7c2d12, #b45309, #fbbf24)',
        icon: '🐟',
        modifiers: [
          { id: 'mod_tanoor', name: 'إضافة خبز تنور عراقي إضافي (4 أرغفة)', priceIqd: 1000 },
          { id: 'mod_rice', name: 'إضافة تمن أحمر عراقي بالشبنت', priceIqd: 3500 },
          { id: 'mod_torshi', name: 'طرشي مدبس نجفي خاص', priceIqd: 1500 }
        ]
      },
      {
        id: 'item_kebab_iraqi',
        category: 'grills',
        name: 'صينية كباب عراقي ومشويات ملكية (نفرين)',
        desc: '6 أسياخ كباب غنم عراقي خالص، تكة غنم، تكة دجاج، مع طماطة وبصل مشوي، سماق، مقبلات مشكلة، وخبز عراقي.',
        priceIqd: 22000,
        calories: '1150 سعرة',
        dimensionsCm: 'صينية 40 سم × 30 سم',
        badge: '⭐ تقييم 4.9',
        shape3D: 'kebab_grill',
        colorPrimary: '#991b1b',
        colorAccent: '#f59e0b',
        photoGrad: 'linear-gradient(135deg, #450a0a, #991b1b, #d97706)',
        icon: '🍢',
        modifiers: [
          { id: 'mod_hummus', name: 'صحن حمص بطحينة ومقبلات مشكلة', priceIqd: 3000 },
          { id: 'mod_ayran', name: 'لبن أربيل مدخن طبيعي (لتر)', priceIqd: 2500 }
        ]
      },
      {
        id: 'item_quzi_sham',
        category: 'iraqi',
        name: 'قوزي لحم غنم على التمن واللوز والزبيب',
        desc: 'موزات لحم غنم مطهوة ببطء لمدة 5 ساعات تقدم فوق تمن العنبر العراقي المزود باللوز المحمص والكشمش والشعرية، مع مرق الفاصوليا واللبن.',
        priceIqd: 18500,
        calories: '980 سعرة',
        dimensionsCm: 'قطر الطبق 34 سم × ارتفاع 12 سم',
        badge: '👑 طبق الضيافة',
        shape3D: 'quzi_dome',
        colorPrimary: '#b45309',
        colorAccent: '#fde047',
        photoGrad: 'linear-gradient(135deg, #78350f, #d97706, #fef08a)',
        icon: '🍖',
        modifiers: [
          { id: 'mod_extra_meat', name: 'قطعة لحم محمرة إضافية', priceIqd: 7500 },
          { id: 'mod_soup', name: 'مرق بامية عراقية باللحم', priceIqd: 2000 }
        ]
      },
      {
        id: 'item_dolma_baghdadi',
        category: 'iraqi',
        name: 'جدر دولمة بغدادية حامضة بدبس الرمان',
        desc: 'تشكيلة ورق عنب، سلق، بصل، باذنجان، وفلفل محشوة باللحم المفروم وتمن العنبر والبهارات العراقية مع الضلوع ودبس الرمان.',
        priceIqd: 16000,
        calories: '840 سعرة',
        dimensionsCm: 'قطر الجدر 30 سم × عمق 14 سم',
        badge: '🌿 طازج يومياً',
        shape3D: 'dolma_pot',
        colorPrimary: '#15803d',
        colorAccent: '#b91c1c',
        photoGrad: 'linear-gradient(135deg, #14532d, #166534, #ca8a04)',
        icon: '🥘',
        modifiers: [
          { id: 'mod_yogurt', name: 'كاسة لبن خاثر بالنعناع', priceIqd: 1500 }
        ]
      },
      {
        id: 'item_pizza_royal',
        category: 'fastfood',
        name: 'بيتزا نابوليتانا بالحطب والجبن الإيطالي',
        desc: 'عجينة مخمرة 48 ساعة مخبوزة في فرن الحجري مع صلصة سان مارزانو، جبن موزاريلا بافلو، شرائح ببروني بقري، وريحان طازج.',
        priceIqd: 12500,
        calories: '790 سعرة',
        dimensionsCm: 'قطر 32 سم × سمك 2.5 سم',
        badge: '🧊 مجسم 3D تفاعلي',
        shape3D: 'pizza_disc',
        colorPrimary: '#ea580c',
        colorAccent: '#fef08a',
        photoGrad: 'linear-gradient(135deg, #7c2d12, #ea580c, #fde047)',
        icon: '🍕',
        modifiers: [
          { id: 'mod_stuffed_crust', name: 'أطراف محشوة بالجبن الكريمي', priceIqd: 2500 },
          { id: 'mod_ranch', name: 'صلصة رانش وثوم إضافية', priceIqd: 1000 }
        ]
      },
      {
        id: 'item_smash_burger',
        category: 'fastfood',
        name: 'دبل سماش برغر أنغوس مشوي مع البطاطا',
        desc: 'شريحتان من لحم الأنغوس الطازج (220 غم) مع جبن شيدر معتق، بصل مكرمل، مخلل منزلي، وخبز بريوش بالزبدة.',
        priceIqd: 9500,
        calories: '860 سعرة',
        dimensionsCm: 'قطر 13 سم × ارتفاع 11 سم',
        badge: '🍔 الأكثر مبيعاً',
        shape3D: 'burger_stack',
        colorPrimary: '#b45309',
        colorAccent: '#facc15',
        photoGrad: 'linear-gradient(135deg, #451a03, #b45309, #f59e0b)',
        icon: '🍔',
        modifiers: [
          { id: 'mod_cheese_fries', name: 'بطاطا مقرمشة مغطاة بجبن الشيدر والهالبينو', priceIqd: 2500 },
          { id: 'mod_cola', name: 'مشروب غازي بارد 330 مل', priceIqd: 1000 }
        ]
      },
      {
        id: 'item_kahi_gaimar',
        category: 'sweets',
        name: 'كاهي وكيمر عرب عراقي أصلي مع الشيرة والعسل',
        desc: 'رقائق كاهي ذهبية مقرمشة ومورقة بالدهن الحر تقدم مع كيمر السدة العراقي الطازج وشيرة الهيل والزعفران والفستق الحلبي.',
        priceIqd: 8500,
        calories: '680 سعرة',
        dimensionsCm: 'طبق 26 سم × 20 سم',
        badge: '🍯 تراث عراقي',
        shape3D: 'dessert_plate',
        colorPrimary: '#f59e0b',
        colorAccent: '#fef9c3',
        photoGrad: 'linear-gradient(135deg, #78350f, #f59e0b, #fef3c7)',
        icon: '🥞',
        modifiers: [
          { id: 'mod_honey', name: 'عسل جبل كردستان طبيعي بدل الشيرة', priceIqd: 2000 },
          { id: 'mod_tea', name: 'قوري شاي عراقي مهيل على الفحم', priceIqd: 2000 }
        ]
      }
    ]
  },

  mall: {
    sectorName: 'مول ومجمع تجاري وترفيهي متعدد الطوابق',
    actionLabel: '🏬 دليل طوابق المول، المنيو، والتسوق',
    prepTime: '25 - 40 دقيقة',
    minOrderIqd: 10000,
    baseDeliveryIqd: 2500,
    floors: [
      { id: 'G', name: 'الطابق الأرضي (G): الأزياء، العطور، والهايبرماركت' },
      { id: 'F1', name: 'الطابق الأول (1): الإلكترونيات، الساعات، والأحذية' },
      { id: 'F2', name: 'الطابق الثاني (2): صالة المطاعم (Food Court) والكافيهات' },
      { id: 'F3', name: 'الطابق الثالث (3): السينما، الألعاب، والترفيه العائلي' }
    ],
    categories: [
      { id: 'all', name: 'كل المتاجر والمطاعم 🏬' },
      { id: 'foodcourt', name: 'صالة المطاعم والكافيهات 🍽️' },
      { id: 'fashion', name: 'الأزياء، الساعات، والعطور ⌚' },
      { id: 'electronics', name: 'الهواتف والإلكترونيات 📱' },
      { id: 'hypermarket', name: 'الهايبرماركت والتسوق اليومي 🛒' }
    ],
    items: [
      {
        id: 'mall_perfume_oud',
        category: 'fashion',
        name: 'عطر عود ملكي وعنبر بغدادي فاخر (100 مل)',
        desc: 'تركيبة فاخرة من دهن العود الكمبودي المعتق مع الورد الدمشقي والزعفران والعنبر في زجاجة كريستال محفورة.',
        priceIqd: 65000,
        calories: 'الطابق الأرضي G - جناح العطور',
        dimensionsCm: 'ارتفاع الزجاجة 14 سم × عرض 7 سم',
        badge: '✨ إصدار فاخر',
        shape3D: 'perfume_bottle',
        colorPrimary: '#7e22ce',
        colorAccent: '#facc15',
        photoGrad: 'linear-gradient(135deg, #3b0764, #7e22ce, #eab308)',
        icon: '🧴',
        modifiers: [
          { id: 'mod_gift_wrap', name: 'تغليف هدية ملكي مع بطاقة إهداء', priceIqd: 3000 }
        ]
      },
      {
        id: 'mall_smartwatch',
        category: 'electronics',
        name: 'ساعة ذكية رياضية بشاشة AMOLED ومقاومة للماء',
        desc: 'شاشة عالية السطوع، تتبع GPS مدمج، قياس نبضات القلب والأكسجين، وبطارية تدوم 10 أيام متواصلة مع ضمان وكالة سنة كاملة.',
        priceIqd: 95000,
        calories: 'الطابق الأول 1 - جناح التقنية',
        dimensionsCm: 'قطر الإطار 46 ملم × سمك 10.8 ملم',
        badge: '🧊 معاينة 3D بـ 360°',
        shape3D: 'smart_device',
        colorPrimary: '#0284c7',
        colorAccent: '#38bdf8',
        photoGrad: 'linear-gradient(135deg, #0f172a, #0369a1, #38bdf8)',
        icon: '⌚',
        modifiers: [
          { id: 'mod_extra_strap', name: 'سوار جلدي إضافي أصلي', priceIqd: 12000 }
        ]
      },
      {
        id: 'mall_specialty_coffee',
        category: 'foodcourt',
        name: 'بوكس قهوة مختصة (V60 & Spanish Latte) + كرواسون',
        desc: '4 أكواب قهوة مختصة محضرة من بن إثيوبي وكولومبي محمص طازج مع 4 قطع كرواسون فرنسي بالزبدة والفستق واللوتس.',
        priceIqd: 24000,
        calories: 'الطابق الثاني 2 - كافيه المول',
        dimensionsCm: 'بوكس ضيافة 32 سم × 24 سم',
        badge: '☕ كافيه المول',
        shape3D: 'coffee_box',
        colorPrimary: '#78350f',
        colorAccent: '#fcd34d',
        photoGrad: 'linear-gradient(135deg, #271206, #78350f, #d97706)',
        icon: '☕',
        modifiers: [
          { id: 'mod_oat_milk', name: 'استبدال بحليب الشوفان أو اللوز', priceIqd: 2000 }
        ]
      },
      {
        id: 'mall_hyper_basket',
        category: 'hypermarket',
        name: 'سلة التسوق العائلية المتكاملة من الهايبرماركت',
        desc: 'تضم: رز عنبر ممتاز 5 كغم، زيت عباد الشمس، أجبان وألبان طازجة، تمر عراقي فاخر، فواكه موسمية، وعصائر طبيعية.',
        priceIqd: 38000,
        calories: 'الطابق الأرضي G - الهايبرماركت',
        dimensionsCm: 'صندوق توصيل 48 سم × 36 سم × 28 سم',
        badge: '🛒 توصيل فوري',
        shape3D: 'market_crate',
        colorPrimary: '#059669',
        colorAccent: '#34d399',
        photoGrad: 'linear-gradient(135deg, #064e3b, #059669, #34d399)',
        icon: '🧺',
        modifiers: [
          { id: 'mod_express_deliv', name: 'توصيل مبرد فائق السرعة خلال 20 دقيقة', priceIqd: 2000 }
        ]
      }
    ]
  },

  institution: {
    sectorName: 'مجمع ومؤسسة خدمية / تعليمية / طبية',
    actionLabel: '🏛️ دليل الخدمات، الكافتيريا، والحجز',
    prepTime: '10 - 15 دقيقة',
    minOrderIqd: 2500,
    baseDeliveryIqd: 1500,
    categories: [
      { id: 'all', name: 'الكل 📋' },
      { id: 'cafeteria', name: 'الكافتيريا والضيافة ☕' },
      { id: 'stationery', name: 'المكتبة والقرطاسية والخدمات 📚' }
    ],
    items: [
      {
        id: 'inst_coffee_meal',
        category: 'cafeteria',
        name: 'وجبة إفطار واستراحة من الكافتيريا الرئيسية',
        desc: 'ساندويتش حلوم مشوي أو فلافل عراقية طازجة بالحمص والعمبة مع كوب شاي عراقي مهيل أو قهوة وعصير برتقال طبيعي.',
        priceIqd: 4500,
        calories: '540 سعرة',
        dimensionsCm: 'صينية تقديم 28 سم × 20 سم',
        badge: '☕ كافتيريا الموقع',
        shape3D: 'coffee_box',
        colorPrimary: '#0284c7',
        colorAccent: '#fbbf24',
        photoGrad: 'linear-gradient(135deg, #0c4a6e, #0284c7, #38bdf8)',
        icon: '🥪',
        modifiers: [
          { id: 'mod_water', name: 'قنينة مياه معدنية باردة 500 مل', priceIqd: 500 }
        ]
      },
      {
        id: 'inst_book_pack',
        category: 'stationery',
        name: 'حقيبة القرطاسية والمستلزمات المكتبية الشاملة',
        desc: 'دفاتر محاضرات فاخرة، طقم أقلام هندسية، حافظة وثائق جلدية، ومستلزمات مكتبية متكاملة.',
        priceIqd: 12000,
        calories: 'مكتبة الموقع',
        dimensionsCm: 'حافظة 34 سم × 25 سم × 4 سم',
        badge: '📚 متوفر الآن',
        shape3D: 'smart_device',
        colorPrimary: '#4f46e5',
        colorAccent: '#818cf8',
        photoGrad: 'linear-gradient(135deg, #1e1b4b, #4338ca, #818cf8)',
        icon: '📘',
        modifiers: []
      }
    ]
  }
};

/**
 * استنتاج الكتالوج والمنيو المناسب لأي مكان في العراق ديناميكياً
 */
export function resolvePlaceMenuCatalog(place = {}) {
  const name = String(place.name || place.title || '').toLowerCase();
  const type = String(place.type || place.category || '').toLowerCase();

  let templateKey = 'restaurant';
  if (
    name.includes('مول') ||
    name.includes('mall') ||
    name.includes('سوق') ||
    name.includes('ماركت') ||
    name.includes('بلازا') ||
    name.includes('سنتر') ||
    name.includes('شارع') ||
    type === 'mall' ||
    type === 'shop'
  ) {
    templateKey = 'mall';
  } else if (
    name.includes('جامعة') ||
    name.includes('مدرسة') ||
    name.includes('مجموعة') ||
    name.includes('كلية') ||
    name.includes('مستشفى') ||
    name.includes('مطار') ||
    name.includes('دائرة') ||
    type === 'education' ||
    type === 'health'
  ) {
    templateKey = 'institution';
  }

  const photoMap = {
    masgouf_platter: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80',
    kebab_grill: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80',
    quzi_dome: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80',
    dolma_pot: 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=800&q=80',
    pizza_disc: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80',
    burger_stack: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
    dessert_plate: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800&q=80',
    perfume_bottle: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&q=80',
    smart_device: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
    coffee_box: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80',
    market_crate: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80'
  };

  const base = IRAQ_COMMERCE_TEMPLATES[templateKey];
  const normalizedFloors = base.floors
    ? base.floors.map((fl) => ({
        ...fl,
        label: fl.name.split(':')[0] || fl.name,
        desc: fl.name.split(':')[1] || ''
      }))
    : null;

  const normalizedItems = (base.items || []).map((it, idx) => ({
    ...it,
    priceIQD: it.priceIqd || it.priceIQD || 10000,
    modelType: it.shape3D || it.modelType || 'building_3d',
    dims: it.dimensionsCm || '35 × 25 سم',
    catId: it.category || 'all',
    photo: it.photo || photoMap[it.shape3D] || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
    popular: idx < 2,
    prepMin: 15 + (idx * 5) % 20
  }));

  return {
    ...base,
    badgeAr: base.sectorName,
    actionLabelAr: base.actionLabel,
    deliveryTimeMin: base.prepTime,
    minOrderIQD: base.minOrderIqd || 5000,
    floors: normalizedFloors,
    categories: (base.categories || []).filter((c) => c.id !== 'all'),
    items: normalizedItems,
    placeId: place.id || `plc_${Date.now()}`,
    placeName: place.name || place.title || 'موقع في العراق',
    placeGov: place.gov || place.governorate || 'العراق',
    rating: (4.6 + ((String(place.name || '').length % 4) * 0.1)).toFixed(1),
    reviewsCount: 140 + ((String(place.name || '').length * 37) % 620)
  };
}

/**
 * توليد قائمة كاميرات البث المباشر الحية لأي موقع في العراق (4 زوايا كاميرات حية لكل مكان)
 */
export function resolvePlaceLiveCameras(place = {}) {
  const placeName = place.name || place.title || 'الموقع المحدد';
  const seed = Math.abs(Math.round((Number(place.lat || 33.31) * 1000) + (Number(place.lng || 44.36) * 1000)));

  const crowdStates = [
    { level: 'MODERATE', label: '🟡 حركة متوسطة وانسيابية', color: '#f59e0b' },
    { level: 'CALM', label: '🟢 أجواء هادئة ومريحة', color: '#10b981' },
    { level: 'BUSY', label: '🔴 نشاط حيوي وحركة نشطة', color: '#ef4444' }
  ];
  const crowd = crowdStates[seed % crowdStates.length];

  return [
    {
      id: 'cam_entrance',
      angleIndex: 0,
      angleAr: 'البوابة والواجهة الرئيسية',
      title: `🎥 كاميرا 1: البوابة والواجهة الرئيسية — ${placeName}`,
      fps: 60,
      quality: '1080p HD',
      crowdText: crowd.label,
      viewers: 42 + (seed % 120),
      viewMode: 'entrance'
    },
    {
      id: 'cam_interior',
      angleIndex: 1,
      angleAr: 'الساحة الوسطية والزوار',
      title: `🎥 كاميرا 2: الساحة الوسطية ومنطقة الزوار — ${placeName}`,
      fps: 60,
      quality: '1080p HD',
      crowdText: crowd.label,
      viewers: 28 + (seed % 95),
      viewMode: 'plaza'
    },
    {
      id: 'cam_street',
      angleIndex: 2,
      angleAr: 'الشارع العام والمرور',
      title: `🎥 كاميرا 3: الشارع العام وحركة السيارات — ${placeName}`,
      fps: 60,
      quality: '1080p HD',
      crowdText: crowd.label,
      viewers: 19 + (seed % 80),
      viewMode: 'street'
    },
    {
      id: 'cam_aerial',
      angleIndex: 3,
      angleAr: 'بانوراما علوية 360°',
      title: `🎥 كاميرا 4: المنظور البانورامي العلوي 360° — ${placeName}`,
      fps: 60,
      quality: '4K HDR',
      crowdText: crowd.label,
      viewers: 31 + (seed % 110),
      viewMode: 'aerial'
    }
  ];
}

