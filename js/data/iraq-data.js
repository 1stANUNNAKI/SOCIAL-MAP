/**
 * بيانات الجمهورية العراقية الجغرافية والتاريخية والخدمية الشاملة (v10 - مشروع OMI)
 * تغطي العراق من أقصى الشمال إلى أقصى الجنوب، بما في ذلك كافة الأحياء السكنية والمقاطعات (مثل العطيشي وخان العطيشي وغيرها)،
 * المجمعات التعليمية (مثل مجموعة العميد التعليمية)، المحلات، المولات، الشوارع، المستشفيات، الجامعات، المطاعم، والمصارف،
 * مع ضبط الأقواس بالنظام العربي الصحيح غير الملامس للحروف.
 */

import { IRAQ_COMPREHENSIVE_GAZETTEER } from './iraq-gazetteer.js?v=16';

export const IRAQ_GEOMETRY = {
  center: [33.3152, 44.3661], // بغداد - قلب العراق
  defaultZoom: 7,
  bounds: [
    [29.0, 38.5], // الزاوية الجنوبية الغربية ( الرطبة / الحدود الجنوبية )
    [37.5, 49.0]  // الزاوية الشمالية الشرقية ( زاخو / حلبجة / الجبال )
  ]
};

// المحافظات العراقية الـ 18 من الشمال إلى الجنوب
export const IRAQ_GOVERNORATES = [
  {
    id: "duhok",
    name: "دهوك",
    nameEn: "Duhok",
    region: "الشمال",
    center: [36.8679, 42.9902],
    zoom: 11,
    capital: "مدينة دهوك",
    description: "بوابة العراق الشمالية، تضم قضاء زاخو وجسر دلال والعمادية وقمم جبال طوروس الشاهقة."
  },
  {
    id: "erbil",
    name: "أربيل",
    nameEn: "Erbil",
    region: "الشمال",
    center: [36.1911, 44.0092],
    zoom: 11,
    capital: "مدينة أربيل",
    description: "عاصمة إقليم كردستان، تحتضن قلعة أربيل المدرجة على لائحة التراث العالمي وشلالات كلي علي بك."
  },
  {
    id: "sulaymaniyah",
    name: "السليمانية",
    nameEn: "Sulaymaniyah",
    region: "الشمال",
    center: [35.5558, 45.4351],
    zoom: 11,
    capital: "مدينة السليمانية",
    description: "عاصمة الثقافة، تحيط بها بحيرة دوكان وبحيرة دربنديخان وجبال قنديل وهورامان."
  },
  {
    id: "nineveh",
    name: "نينوى",
    nameEn: "Nineveh",
    region: "الشمال",
    center: [36.3400, 43.1300],
    zoom: 11,
    capital: "الموصل \u200F( أم الربيعين )\u200F",
    description: "مهد الحضارة الآشورية العريقة، تضم آثار نينوى والنمرود ومدينة الحضر التاريخية."
  },
  {
    id: "kirkuk",
    name: "كركوك",
    nameEn: "Kirkuk",
    region: "الشمال",
    center: [35.4681, 44.3922],
    zoom: 11,
    capital: "مدينة كركوك",
    description: "مدينة التآخي وحقول النار الأزلية \u200F( بابا كركر )\u200F والقلعة الأثرية التاريخية."
  },
  {
    id: "salah-al-din",
    name: "صلاح الدين",
    nameEn: "Salah Al-Din",
    region: "الوسط",
    center: [34.6000, 43.6800],
    zoom: 10,
    capital: "تكريت",
    description: "تحتضن سامراء عاصمة العباسيين ومئذنتها الملوية وقصر العاشق وبحيرة الثرثار."
  },
  {
    id: "diyala",
    name: "ديالى",
    nameEn: "Diyala",
    region: "الوسط",
    center: [33.7500, 45.1500],
    zoom: 10,
    capital: "بعقوبة",
    description: "مدينة البرتقال وبساتين النخيل، تمتد من تخوم بغداد حتى بحيرة حمرين وخانقين."
  },
  {
    id: "anbar",
    name: "الأنبار",
    nameEn: "Al-Anbar",
    region: "الغرب",
    center: [33.4200, 43.3000],
    zoom: 10,
    capital: "الرمادي",
    description: "كبرى محافظات العراق مساحة، تحتضن نهر الفرات وبحيرة الحبانية والرطبة وحديثة والقائم."
  },
  {
    id: "baghdad",
    name: "بغداد",
    nameEn: "Baghdad",
    region: "الوسط",
    center: [33.3152, 44.3661],
    zoom: 12,
    capital: "بغداد \u200F( العاصمة )\u200F",
    description: "عاصمة السلام ومنارة التاريخ، يشطرها دجلة الخير إلى الكرخ والرصافة، وتضم معالم التحرير والكاظمية والأعظمية."
  },
  {
    id: "babil",
    name: "بابل",
    nameEn: "Babylon",
    region: "الوسط",
    center: [32.4833, 44.4333],
    zoom: 11,
    capital: "الحلة",
    description: "مهد الشرائع وبوابة عشتار والجنائن المعلقة وحضارة حمورابي ونبوخذ نصر."
  },
  {
    id: "karbala",
    name: "كربلاء",
    nameEn: "Karbala",
    region: "الفرات الأوسط",
    center: [32.6160, 44.0250],
    zoom: 12,
    capital: "مدينة كربلاء",
    description: "المدينة المقدسة، تضم العتبتين الحسينية والعباسية، ومجموعة العميد التعليمية، وحصن الأخيضر التاريخي وبحيرة الرزازة."
  },
  {
    id: "najaf",
    name: "النجف الأشرف",
    nameEn: "Najaf",
    region: "الفرات الأوسط",
    center: [32.0000, 44.3300],
    zoom: 12,
    capital: "النجف الأشرف",
    description: "عاصمة الفقه والعلم، تضم الروضة الحيدرية ومسجد الكوفة المعظم وبحر النجف ومقبرة وادي السلام."
  },
  {
    id: "wasit",
    name: "واسط",
    nameEn: "Wasit",
    region: "الوسط",
    center: [32.5100, 45.8200],
    zoom: 10,
    capital: "الكوت",
    description: "سلة خبز العراق الزراعية، تشتهر بسدة الكوت التاريخية على نهر دجلة وقضاء الحي وبدرة."
  },
  {
    id: "al-qadisiyyah",
    name: "الديوانية \u200F( القادسية )\u200F",
    nameEn: "Al-Qadisiyyah",
    region: "الفرات الأوسط",
    center: [31.9900, 44.9200],
    zoom: 11,
    capital: "الديوانية",
    description: "موطن زراعة عنبر الفرات الشهير ومدينة نيبور السومرية المقدسة عاصمة إنليل الدينية."
  },
  {
    id: "maysan",
    name: "ميسان",
    nameEn: "Maysan",
    region: "الجنوب",
    center: [31.8400, 47.1400],
    zoom: 10,
    capital: "العمارة",
    description: "أرض الكرم والجمال الطبيعي، تضم أهوار الحويزة وميادين الصيد والزراعة وشريان دجلة."
  },
  {
    id: "dhi-qar",
    name: "ذي قار",
    nameEn: "Dhi Qar",
    region: "الجنوب",
    center: [31.0500, 46.2500],
    zoom: 10,
    capital: "الناصرية",
    description: "مهد الحرف الأول، تحتضن زقورة أور ومسقط رأس النبي إبراهيم عليه السلام وأهوار الجبايش."
  },
  {
    id: "al-muthanna",
    name: "المثنى",
    nameEn: "Al-Muthanna",
    region: "الجنوب",
    center: [30.5000, 45.0000],
    zoom: 10,
    capital: "السماوة",
    description: "أرض الوركاء \u200F( أوروك )\u200F مهد جلجامش وأقدم مدينة حضرية بالعالم، وتضم بحيرة ساوة الفريدة والبادية."
  },
  {
    id: "basra",
    name: "البصرة",
    nameEn: "Basra",
    region: "الجنوب",
    center: [30.5081, 47.7835],
    zoom: 11,
    capital: "مدينة البصرة \u200F( ثغر العراق الباسم )\u200F",
    description: "رئة العراق الاقتصادية، ملتقى دجلة والفرات في شط العرب، وتمتد إلى ميناء الفاو الكبير وأقصى نقطة بالخليج العربي."
  }
];

export const IRAQ_DEFAULT_LANDMARKS = [
  {
    id: "lm_zakho",
    title: "جسر دلال التاريخي - زاخو",
    category: "history",
    color: "#8b5cf6",
    lat: 37.1439,
    lng: 42.6847,
    governorate: "دهوك",
    notes: "جسر حجري أثري عريق فوق نهر الخابور في مدينة زاخو قرب الحدود الشمالية للعراق.",
    tags: ["أقصى الشمال", "تاريخي", "دهوك", "سياحة"]
  },
  {
    id: "lm_erbil_citadel",
    title: "قلعة أربيل الأثرية",
    category: "history",
    color: "#f59e0b",
    lat: 36.1911,
    lng: 44.0092,
    governorate: "أربيل",
    notes: "من أقدم المستوطنات المأهولة بالسكان باستمرار في التاريخ الإنساني منذ أكثر من 6000 عام، موقع تراث عالمي \u200F( اليونسكو )\u200F.",
    tags: ["تراث عالمي", "أربيل", "معلم وطني"]
  },
  {
    id: "lm_hatra",
    title: "مملكة الحضر التاريخية",
    category: "history",
    color: "#f59e0b",
    lat: 35.5900,
    lng: 42.7200,
    governorate: "نينوى",
    notes: "عاصمة مملكة عربايا الأثرية الخالدة ومعابد إله الشمس في قلب بادية الجزيرة.",
    tags: ["نينوى", "آثار", "تراث عالمي"]
  },
  {
    id: "lm_samarra",
    title: "ملوية سامراء والجامع الكبير",
    category: "history",
    color: "#d97706",
    lat: 34.2064,
    lng: 43.8742,
    governorate: "صلاح الدين",
    notes: "المئذنة الحلزونية الفريدة التي بناها الخليفة المتوكل العباسي عام 851 م، رمز عمارة العباسيين.",
    tags: ["سامراء", "إسلامي", "تراث عالمي"]
  },
  {
    id: "lm_tahrir",
    title: "ساحة التحرير ونصب الحرية - بغداد",
    category: "landmark",
    color: "#0284c7",
    lat: 33.3283,
    lng: 44.4094,
    governorate: "بغداد",
    notes: "أيقونة العاصمة بغداد في قلب الرصافة، عمل النحات العراقي الخالد جواد سليم يروي مسيرة الشعب العراقي.",
    tags: ["بغداد", "معلم وطني", "فن"]
  },
  {
    id: "lm_ctesiphon",
    title: "طاق كسرى \u200F( إيوان المدائن )\u200F",
    category: "history",
    color: "#b45309",
    lat: 33.0936,
    lng: 44.5811,
    governorate: "بغداد",
    notes: "أكبر طاق مقوس مبني بالطابوق بدون دعامات في العالم القديم على ضفاف دجلة جنوب بغداد.",
    tags: ["المدائن", "آثار", "عمارة"]
  },
  {
    id: "lm_babylon",
    title: "آثار بابل التاريخية وبوابة عشتار",
    category: "history",
    color: "#f59e0b",
    lat: 32.5422,
    lng: 44.4211,
    governorate: "بابل",
    notes: "عاصمة الإمبراطورية البابلية وموقع قصر نبوخذ نصر وشارع الموكب وأسد بابل ومسقط مسلة حمورابي.",
    tags: ["بابل", "تراث عالمي", "مهد الحضارة"]
  },
  {
    id: "lm_ur_ziggurat",
    title: "زقورة أور ومسقط رأس إبراهيم الخليل",
    category: "history",
    color: "#ea580c",
    lat: 30.9625,
    lng: 46.1031,
    governorate: "ذي قار",
    notes: "زقورة سومرية شامخة يعود تاريخها للألف الثالث قبل الميلاد مكرسة للإله نانا \u200F( سين )\u200F بجانب منزل النبي إبراهيم.",
    tags: ["أور", "ذي قار", "سومر", "تراث عالمي"]
  },
  {
    id: "lm_marshes",
    title: "أهوار الجبايش الطبيعية والتاريخية",
    category: "landmark",
    color: "#10b981",
    lat: 30.9450,
    lng: 46.9950,
    governorate: "ذي قار",
    notes: "جنة القصب والمياه، فينيسيا الشرق الأوسط وبيئة البوفالو والطيور المهاجرة، مدرجة على لائحة اليونسكو كإرث مختلط.",
    tags: ["الأهوار", "طبيعة", "تراث عالمي", "جنوب العراق"]
  },
  {
    id: "lm_fao",
    title: "رأس البيشة وميناء الفاو الكبير",
    category: "landmark",
    color: "#0369a1",
    lat: 29.9328,
    lng: 48.5670,
    governorate: "البصرة",
    notes: "أقصى نقطة جغرافية في جنوب العراق على رأس الخليج العربي، منطلق طريق التنمية وميناء الفاو العملاق.",
    tags: ["أقصى الجنوب", "الفاو", "الخليج العربي", "البصرة"]
  }
];

/**
 * قاعدة البيانات الشاملة للمدن، الأقضية، المجمعات التعليمية، المولات، الشوارع، الأسواق، الجامعات، المستشفيات، والمحلات في العراق
 * جميع الأقواس منسقة بالنظام العربي الصحيح مع مسافات فاصلة وعلامات اتجاه RTL لمنع أي انعكاس.
 */
export const IRAQ_DETAILED_PLACES = [
  // ==================== دهوك وأقصى الشمال ====================
  { id: "pl_duhok_city", name: "مدينة دهوك", gov: "دهوك", type: "city", lat: 36.8679, lng: 42.9902, icon: "🏙️", importance: 1 },
  { id: "pl_zakho", name: "قضاء زاخو", gov: "دهوك", type: "town", lat: 37.1439, lng: 42.6847, icon: "🌉", importance: 1 },
  { id: "pl_amadiya", name: "العمادية \u200F( آميدي )\u200F", gov: "دهوك", type: "town", lat: 37.0911, lng: 43.4875, icon: "⛰️", importance: 2 },
  { id: "pl_akre", name: "قضاء عقرة", gov: "دهوك", type: "town", lat: 36.7456, lng: 43.8911, icon: "🏰", importance: 2 },
  { id: "pl_shekhan", name: "قضاء الشيخان", gov: "دهوك", type: "town", lat: 36.6983, lng: 43.3517, icon: "🏛️", importance: 3 },
  { id: "pl_ibrahim_khalil", name: "منفذ إبراهيم الخليل الحدودي", gov: "دهوك", type: "border", lat: 37.1517, lng: 42.5708, icon: "🛂", importance: 1 },
  { id: "pl_family_mall_duhok", name: "فاميلي مول دهوك \u200F( المركز التجاري )\u200F", gov: "دهوك", type: "mall", lat: 36.8586, lng: 42.9614, icon: "🛍️", importance: 3 },
  { id: "pl_mazi_mall_duhok", name: "مازي مول دهوك", gov: "دهوك", type: "mall", lat: 36.8620, lng: 42.9780, icon: "🛒", importance: 3 },
  { id: "pl_uod_duhok", name: "جامعة دهوك", gov: "دهوك", type: "university", lat: 36.8542, lng: 42.9311, icon: "🎓", importance: 3 },
  { id: "pl_azadi_hosp_duhok", name: "مستشفى آزادي التعليمي - دهوك", gov: "دهوك", type: "hospital", lat: 36.8655, lng: 42.9985, icon: "🏥", importance: 3 },

  // ==================== أربيل ====================
  { id: "pl_erbil_city", name: "مدينة أربيل \u200F( هولير )\u200F", gov: "أربيل", type: "city", lat: 36.1911, lng: 44.0092, icon: "🏰", importance: 1 },
  { id: "pl_erbil_airport", name: "مطار أربيل الدولي", gov: "أربيل", type: "airport", lat: 36.2372, lng: 43.9592, icon: "✈️", importance: 1 },
  { id: "pl_soran", name: "قضاء سوران", gov: "أربيل", type: "town", lat: 36.6531, lng: 44.5381, icon: "⛰️", importance: 2 },
  { id: "pl_rawanduz", name: "رواندوز وشلال بيخال", gov: "أربيل", type: "nature", lat: 36.6117, lng: 44.5256, icon: "🌊", importance: 2 },
  { id: "pl_shakhlawa", name: "قضاء شقلاوة السياحي", gov: "أربيل", type: "town", lat: 36.3986, lng: 44.3414, icon: "🌲", importance: 2 },
  { id: "pl_koya", name: "قضاء كويسنجق \u200F( كوية )\u200F", gov: "أربيل", type: "town", lat: 36.0833, lng: 44.6333, icon: "🏘️", importance: 2 },
  { id: "pl_haji_omar", name: "منفذ حاج عمران الحدودي", gov: "أربيل", type: "border", lat: 36.6711, lng: 45.0483, icon: "🛂", importance: 2 },
  { id: "pl_family_mall_erbil", name: "فاميلي مول أربيل", gov: "أربيل", type: "mall", lat: 36.1825, lng: 44.0415, icon: "🛍️", importance: 3 },
  { id: "pl_majidi_mall_erbil", name: "ماجدي مول أربيل", gov: "أربيل", type: "mall", lat: 36.2089, lng: 44.0622, icon: "🛍️", importance: 3 },
  { id: "pl_empire_world_erbil", name: "أبراج إمباير وورلد - أربيل", gov: "أربيل", type: "landmark", lat: 36.1972, lng: 43.9728, icon: "🏢", importance: 3 },
  { id: "pl_ankawa_erbil", name: "ناحية عنكاوا وشارع المطاعم", gov: "أربيل", type: "district", lat: 36.2300, lng: 43.9930, icon: "🍽️", importance: 3 },
  { id: "pl_sami_park_erbil", name: "بارك سامي عبد الرحمن", gov: "أربيل", type: "nature", lat: 36.1905, lng: 43.9822, icon: "🌳", importance: 3 },
  { id: "pl_qaysari_bazaar_erbil", name: "سوق القيصرية التاريخي - أربيل", gov: "أربيل", type: "market", lat: 36.1888, lng: 44.0098, icon: "🏪", importance: 3 },
  { id: "pl_iskaan_st_erbil", name: "شارع الإسكان التجاري والمقاهي - أربيل", gov: "أربيل", type: "street", lat: 36.1782, lng: 44.0195, icon: "☕", importance: 3 },
  { id: "pl_gulan_st_erbil", name: "شارع كولان التجاري - أربيل", gov: "أربيل", type: "street", lat: 36.2035, lng: 43.9960, icon: "🛣️", importance: 3 },
  { id: "pl_salahaddin_uni", name: "جامعة صلاح الدين - أربيل", gov: "أربيل", type: "university", lat: 36.1536, lng: 44.0131, icon: "🎓", importance: 3 },

  // ==================== السليمانية وحلبجة ====================
  { id: "pl_sulaymaniyah_city", name: "مدينة السليمانية", gov: "السليمانية", type: "city", lat: 35.5558, lng: 45.4351, icon: "🏙️", importance: 1 },
  { id: "pl_sulaymaniyah_airport", name: "مطار السليمانية الدولي", gov: "السليمانية", type: "airport", lat: 35.5617, lng: 45.3167, icon: "✈️", importance: 1 },
  { id: "pl_dukan_lake", name: "بحيرة وسد دوكان السياحي", gov: "السليمانية", type: "nature", lat: 35.9556, lng: 44.9611, icon: "🏖️", importance: 2 },
  { id: "pl_darbandikhan", name: "سد وبحيرة دربنديخان", gov: "السليمانية", type: "nature", lat: 35.1167, lng: 45.7000, icon: "🌊", importance: 2 },
  { id: "pl_rania", name: "قضاء رانية", gov: "السليمانية", type: "town", lat: 36.2544, lng: 44.8828, icon: "🏘️", importance: 2 },
  { id: "pl_kalar", name: "قضاء كلار \u200F( كرميان )\u200F", gov: "السليمانية", type: "town", lat: 34.6292, lng: 45.3183, icon: "🏘️", importance: 2 },
  { id: "pl_halabja", name: "محافظة حلبجة الشهيدة", gov: "حلبجة", type: "city", lat: 35.1778, lng: 45.9861, icon: "🕊️", importance: 1 },
  { id: "pl_bashmakh", name: "منفذ باشماخ الحدودي", gov: "السليمانية", type: "border", lat: 35.5997, lng: 46.0683, icon: "🛂", importance: 2 },
  { id: "pl_family_mall_suli", name: "فاميلي مول السليمانية", gov: "السليمانية", type: "mall", lat: 35.5522, lng: 45.3885, icon: "🛍️", importance: 3 },
  { id: "pl_majidi_mall_suli", name: "ماجدي مول السليمانية", gov: "السليمانية", type: "mall", lat: 35.5712, lng: 45.3625, icon: "🛍️", importance: 3 },
  { id: "pl_salim_st_suli", name: "شارع سالم التجاري \u200F( سهولكة )\u200F - السليمانية", gov: "السليمانية", type: "street", lat: 35.5585, lng: 45.4265, icon: "🛣️", importance: 3 },
  { id: "pl_azmar_mount", name: "جبل أزمير وكويزة السياحي", gov: "السليمانية", type: "nature", lat: 35.5900, lng: 45.4750, icon: "⛰️", importance: 3 },
  { id: "pl_grand_millennium_suli", name: "فندق غراند ميلينيوم \u200F( برج شاري جوان )\u200F", gov: "السليمانية", type: "hotel", lat: 35.5681, lng: 45.4022, icon: "🏨", importance: 3 },

  // ==================== نينوى ( الموصل ) ====================
  { id: "pl_mosul_city", name: "مدينة الموصل \u200F( أم الربيعين )\u200F", gov: "نينوى", type: "city", lat: 36.3400, lng: 43.1300, icon: "🏙️", importance: 1 },
  { id: "pl_mosul_airport", name: "مطار الموصل الدولي", gov: "نينوى", type: "airport", lat: 36.3056, lng: 43.1461, icon: "✈️", importance: 2 },
  { id: "pl_tal_afar", name: "قضاء تلعفر وقلعتها", gov: "نينوى", type: "town", lat: 36.3767, lng: 42.4519, icon: "🏘️", importance: 2 },
  { id: "pl_sinjar", name: "قضاء سنجار وجبل سنجار", gov: "نينوى", type: "town", lat: 36.3206, lng: 41.8622, icon: "⛰️", importance: 2 },
  { id: "pl_hamdaniya", name: "قضاء الحمدانية \u200F( بغديدا - قرقوش )\u200F", gov: "نينوى", type: "town", lat: 36.2731, lng: 43.3769, icon: "⛪", importance: 2 },
  { id: "pl_tilkaif", name: "قضاء تلكيف", gov: "نينوى", type: "town", lat: 36.4917, lng: 43.1417, icon: "🏘️", importance: 3 },
  { id: "pl_nimrud", name: "آثار كالح النمرود الآشورية", gov: "نينوى", type: "history", lat: 35.9983, lng: 43.3275, icon: "🏛️", importance: 2 },
  { id: "pl_mosul_dam", name: "سد الموصل وبحيرة السد", gov: "نينوى", type: "nature", lat: 36.6317, lng: 42.8239, icon: "🌊", importance: 2 },
  { id: "pl_rabia", name: "منفذ ربيعة الحدودي", gov: "نينوى", type: "border", lat: 36.8083, lng: 42.1083, icon: "🛂", importance: 2 },
  { id: "pl_mosul_uni", name: "جامعة الموصل \u200F( المجمع الجامعي )\u200F", gov: "نينوى", type: "university", lat: 36.3775, lng: 43.1436, icon: "🎓", importance: 3 },
  { id: "pl_nuri_mosque_mosul", name: "الجامع النوري الكبير ومنارة الحدباء", gov: "نينوى", type: "shrine", lat: 36.3431, lng: 43.1269, icon: "🕌", importance: 3 },
  { id: "pl_nabi_yunus_mosul", name: "جامع ومرقد النبي يونس \u200F( عليه السلام )\u200F - الموصل", gov: "نينوى", type: "shrine", lat: 36.3556, lng: 43.1536, icon: "🕌", importance: 3 },
  { id: "pl_zuhoor_st_mosul", name: "حي الزهور وشارع الزهور التجاري والمولات - الموصل", gov: "نينوى", type: "mall", lat: 36.3720, lng: 43.1680, icon: "🛍️", importance: 3 },
  { id: "pl_masarif_mosul", name: "حي المصارف والمراكز التجارية - الموصل", gov: "نينوى", type: "district", lat: 36.3650, lng: 43.1580, icon: "🏦", importance: 3 },
  { id: "pl_ghabat_mosul", name: "غابات الموصل السياحية وكورنيش دجلة", gov: "نينوى", type: "nature", lat: 36.3690, lng: 43.1280, icon: "🌲", importance: 3 },
  { id: "pl_salam_hosp_mosul", name: "مستشفى السلام التعليمي - الموصل", gov: "نينوى", type: "hospital", lat: 36.3220, lng: 43.1750, icon: "🏥", importance: 3 },

  // ==================== كركوك ====================
  { id: "pl_kirkuk_city", name: "مدينة كركوك", gov: "كركوك", type: "city", lat: 35.4681, lng: 44.3922, icon: "🏙️", importance: 1 },
  { id: "pl_kirkuk_citadel", name: "قلعة كركوك التاريخية وسوق القيصرية", gov: "كركوك", type: "history", lat: 35.4700, lng: 44.3900, icon: "🏰", importance: 2 },
  { id: "pl_baba_gurgur", name: "حقل بابا كركر \u200F( النار الأزلية )\u200F", gov: "كركوك", type: "landmark", lat: 35.5389, lng: 44.3217, icon: "🔥", importance: 2 },
  { id: "pl_hawija", name: "قضاء الحويجة", gov: "كركوك", type: "town", lat: 35.3236, lng: 43.7744, icon: "🌾", importance: 2 },
  { id: "pl_daquq", name: "قضاء داقوق", gov: "كركوك", type: "town", lat: 35.0733, lng: 44.4447, icon: "🏘️", importance: 3 },
  { id: "pl_quds_st_kirkuk", name: "شارع القدس التجاري والمطاعم - كركوك", gov: "كركوك", type: "street", lat: 35.4580, lng: 44.3850, icon: "🛍️", importance: 3 },
  { id: "pl_muhafadha_st_kirkuk", name: "شارع المحافظة والعيادات الطبية - كركوك", gov: "كركوك", type: "street", lat: 35.4640, lng: 44.3960, icon: "🏥", importance: 3 },
  { id: "pl_kirkuk_uni", name: "جامعة كركوك \u200F( مجمع الصيادة )\u200F", gov: "كركوك", type: "university", lat: 35.4120, lng: 44.3950, icon: "🎓", importance: 3 },

  // ==================== صلاح الدين ====================
  { id: "pl_tikrit_city", name: "مدينة تكريت", gov: "صلاح الدين", type: "city", lat: 34.6000, lng: 43.6800, icon: "🏙️", importance: 1 },
  { id: "pl_samarra_city", name: "مدينة سامراء والروضة العسكرية", gov: "صلاح الدين", type: "city", lat: 34.1983, lng: 43.8736, icon: "🕌", importance: 1 },
  { id: "pl_samarra_malwiya", name: "مئذنة الملوية العباسية", gov: "صلاح الدين", type: "history", lat: 34.2072, lng: 43.8797, icon: "🏺", importance: 1 },
  { id: "pl_balad", name: "قضاء بلد ومرقد السيد محمد", gov: "صلاح الدين", type: "shrine", lat: 34.0167, lng: 44.1500, icon: "🕌", importance: 2 },
  { id: "pl_dujail", name: "قضاء الدجيل", gov: "صلاح الدين", type: "town", lat: 33.8833, lng: 44.2333, icon: "🌴", importance: 3 },
  { id: "pl_tuz_khurmatu", name: "قضاء طوز خورماتو", gov: "صلاح الدين", type: "town", lat: 34.8872, lng: 44.6339, icon: "🏘️", importance: 2 },
  { id: "pl_baiji", name: "قضاء بيجي ومصفى الصمود", gov: "صلاح الدين", type: "industry", lat: 34.9333, lng: 43.4833, icon: "⚙️", importance: 2 },
  { id: "pl_tharthar_lake", name: "بحيرة الثرثار العملاقة", gov: "صلاح الدين", type: "nature", lat: 34.0500, lng: 43.2000, icon: "🌊", importance: 2 },
  { id: "pl_tikrit_uni", name: "جامعة تكريت \u200F( القادسية )\u200F", gov: "صلاح الدين", type: "university", lat: 34.6780, lng: 43.6550, icon: "🎓", importance: 3 },
  { id: "pl_arbaeen_st_tikrit", name: "شارع الأربعين التجاري - تكريت", gov: "صلاح الدين", type: "street", lat: 34.6050, lng: 43.6750, icon: "🛍️", importance: 3 },

  // ==================== ديالى ====================
  { id: "pl_baqubah_city", name: "مدينة بعقوبة", gov: "ديالى", type: "city", lat: 33.7500, lng: 45.1500, icon: "🍊", importance: 1 },
  { id: "pl_khanaqin", name: "قضاء خانقين ونهر الوند", gov: "ديالى", type: "town", lat: 34.3500, lng: 45.3833, icon: "🏘️", importance: 2 },
  { id: "pl_muqdadiyah", name: "قضاء المقدادية \u200F( شهربان )\u200F", gov: "ديالى", type: "town", lat: 33.9789, lng: 44.9367, icon: "🌴", importance: 2 },
  { id: "pl_khalis", name: "قضاء الخالص", gov: "ديالى", type: "town", lat: 33.8500, lng: 44.5333, icon: "🌾", importance: 2 },
  { id: "pl_mandali", name: "ناحية مندلي وبساتين النخيل", gov: "ديالى", type: "town", lat: 33.7500, lng: 45.5500, icon: "🌴", importance: 3 },
  { id: "pl_hamrin_lake", name: "بحيرة وجبال حمرين", gov: "ديالى", type: "nature", lat: 34.2000, lng: 45.0000, icon: "🌊", importance: 2 },
  { id: "pl_munthiriya", name: "منفذ المنذرية الحدودي", gov: "ديالى", type: "border", lat: 34.4083, lng: 45.4583, icon: "🛂", importance: 2 },
  { id: "pl_diyala_uni", name: "جامعة ديالى \u200F( المرادية )\u200F", gov: "ديالى", type: "university", lat: 33.6820, lng: 44.6150, icon: "🎓", importance: 3 },

  // ==================== الأنبار ====================
  { id: "pl_ramadi_city", name: "مدينة الرمادي", gov: "الأنبار", type: "city", lat: 33.4200, lng: 43.3000, icon: "🏙️", importance: 1 },
  { id: "pl_fallujah_city", name: "مدينة الفلوجة \u200F( مدينة المآذن )\u200F", gov: "الأنبار", type: "city", lat: 33.3500, lng: 43.7833, icon: "🕌", importance: 1 },
  { id: "pl_hit", name: "قضاء هيت وعيون القير الأثرية", gov: "الأنبار", type: "town", lat: 33.6417, lng: 42.8250, icon: "🏘️", importance: 2 },
  { id: "pl_haditha", name: "قضاء حديثة وسد حديثة", gov: "الأنبار", type: "town", lat: 34.1333, lng: 42.3833, icon: "🌊", importance: 2 },
  { id: "pl_anah", name: "قضاء عنة التاريخي", gov: "الأنبار", type: "town", lat: 34.3667, lng: 41.9833, icon: "🏛️", importance: 2 },
  { id: "pl_rawa", name: "قضاء راوة على الفرات", gov: "الأنبار", type: "town", lat: 34.4667, lng: 41.9167, icon: "🏘️", importance: 3 },
  { id: "pl_qaim", name: "قضاء القائم الحدودي", gov: "الأنبار", type: "town", lat: 34.3611, lng: 41.0806, icon: "🌾", importance: 2 },
  { id: "pl_rutba", name: "قضاء الرطبة \u200F( قلب البادية الغربية )\u200F", gov: "الأنبار", type: "town", lat: 33.0333, lng: 40.2833, icon: "🏜️", importance: 2 },
  { id: "pl_habbaniyah_lake", name: "بحيرة الحبانية والمدينة السياحية", gov: "الأنبار", type: "nature", lat: 33.3000, lng: 43.4833, icon: "🏖️", importance: 2 },
  { id: "pl_trebil", name: "منفذ طريبيل الحدودي الدولي", gov: "الأنبار", type: "border", lat: 32.8833, lng: 39.0000, icon: "🛂", importance: 1 },
  { id: "pl_alwalid", name: "منفذ الوليد الحدودي", gov: "الأنبار", type: "border", lat: 33.4333, lng: 38.9333, icon: "🛂", importance: 2 },
  { id: "pl_anbar_uni", name: "جامعة الأنبار - الرمادي", gov: "الأنبار", type: "university", lat: 33.4030, lng: 43.2610, icon: "🎓", importance: 3 },
  { id: "pl_mustawdaa_st_ramadi", name: "شارع المستودع التجاري والمولات - الرمادي", gov: "الأنبار", type: "street", lat: 33.4280, lng: 43.3050, icon: "🛍️", importance: 3 },
  { id: "pl_arbaeen_st_fallujah", name: "شارع الأربعين التجاري - الفلوجة", gov: "الأنبار", type: "street", lat: 33.3560, lng: 43.7880, icon: "🛍️", importance: 3 },

  // ==================== بغداد ( العاصمة، المولات، الشوارع، المحلات، الجامعات، المستشفيات ) ====================
  { id: "pl_baghdad_center", name: "بغداد - ساحة التحرير والرصافة", gov: "بغداد", type: "capital", lat: 33.3283, lng: 44.4094, icon: "🇮🇶", importance: 1 },
  { id: "pl_karkh", name: "بغداد - الكرخ وساحة النسور", gov: "بغداد", type: "city", lat: 33.3150, lng: 44.3650, icon: "🏙️", importance: 1 },
  { id: "pl_baghdad_airport", name: "مطار بغداد الدولي", gov: "بغداد", type: "airport", lat: 33.2625, lng: 44.2344, icon: "✈️", importance: 1 },
  { id: "pl_kadhimiya", name: "العتبة الكاظمية المقدسة", gov: "بغداد", type: "shrine", lat: 33.3797, lng: 44.3381, icon: "🕌", importance: 1 },
  { id: "pl_adhamiya", name: "الأعظمية وجامع الإمام أبي حنيفة النعمان", gov: "بغداد", type: "shrine", lat: 33.3719, lng: 44.3586, icon: "🕌", importance: 1 },
  { id: "pl_madain_ctesiphon", name: "المدائن وطاق كسرى \u200F( سلمان باك )\u200F", gov: "بغداد", type: "history", lat: 33.0936, lng: 44.5811, icon: "🏛️", importance: 1 },

  // مولات بغداد الكبرى
  { id: "pl_baghdad_mall", name: "بغداد مول \u200F( الحارثية )\u200F", gov: "بغداد", type: "mall", lat: 33.3075, lng: 44.3658, icon: "🛍️", importance: 2 },
  { id: "pl_mansour_mall", name: "مول المنصور التجاري", gov: "بغداد", type: "mall", lat: 33.3164, lng: 44.3422, icon: "🛍️", importance: 2 },
  { id: "pl_babylon_mall", name: "بابيلون مول \u200F( المنصور )\u200F", gov: "بغداد", type: "mall", lat: 33.3139, lng: 44.3450, icon: "🛍️", importance: 3 },
  { id: "pl_zayouna_mall", name: "زيونة مول التجاري", gov: "بغداد", type: "mall", lat: 33.3264, lng: 44.4561, icon: "🛍️", importance: 2 },
  { id: "pl_nakheel_mall", name: "النخيل مول \u200F( شارع فلسطين )\u200F", gov: "بغداد", type: "mall", lat: 33.3469, lng: 44.4472, icon: "🛍️", importance: 2 },
  { id: "pl_oasis_mall", name: "الواحة مول \u200F( اليرموك )\u200F", gov: "بغداد", type: "mall", lat: 33.2961, lng: 44.3364, icon: "🛍️", importance: 3 },
  { id: "pl_amiriya_mall", name: "لايت مول ومول العامرية التجاري", gov: "بغداد", type: "mall", lat: 33.3015, lng: 44.2890, icon: "🛍️", importance: 3 },
  { id: "pl_dream_city_mall", name: "دريم سيتي مول \u200F( المنصور )\u200F", gov: "بغداد", type: "mall", lat: 33.3180, lng: 44.3495, icon: "🛒", importance: 3 },
  { id: "pl_cairo_mall_bgd", name: "مول القاهرة \u200F( حي القاهرة )\u200F", gov: "بغداد", type: "mall", lat: 33.3820, lng: 44.3950, icon: "🛍️", importance: 3 },
  { id: "pl_iraq_mall_bgd", name: "مول العراق \u200F( الدورة )\u200F", gov: "بغداد", type: "mall", lat: 33.2550, lng: 44.3880, icon: "🛍️", importance: 3 },

  // شوارع وأسواق ومحلات بغداد الشهيرة
  { id: "pl_mutanabbi_st", name: "شارع المتنبي وسوق السراي والقشلة", gov: "بغداد", type: "street", lat: 33.3406, lng: 44.3886, icon: "📚", importance: 2 },
  { id: "pl_rashid_st", name: "شارع الرشيد التاريخي", gov: "بغداد", type: "street", lat: 33.3380, lng: 44.3930, icon: "🏛️", importance: 3 },
  { id: "pl_shorja_market", name: "سوق الشورجة التجاري المركزي", gov: "بغداد", type: "market", lat: 33.3392, lng: 44.3978, icon: "🏪", importance: 2 },
  { id: "pl_jamila_market", name: "سوق جميلة التجاري للجملة", gov: "بغداد", type: "market", lat: 33.3680, lng: 44.4320, icon: "🏪", importance: 3 },
  { id: "pl_rubaie_st", name: "شارع الربيعي التجاري والمطاعم - زيونة", gov: "بغداد", type: "street", lat: 33.3295, lng: 44.4510, icon: "🍽️", importance: 3 },
  { id: "pl_14ramadan_st", name: "شارع 14 رمضان ومطاعم المنصور", gov: "بغداد", type: "street", lat: 33.3155, lng: 44.3455, icon: "🍔", importance: 3 },
  { id: "pl_amirat_st", name: "شارع الأميرات - المنصور", gov: "بغداد", type: "street", lat: 33.3195, lng: 44.3540, icon: "🏡", importance: 3 },
  { id: "pl_karada_dakhil", name: "شارع الكرادة داخل التجاري والمحلات", gov: "بغداد", type: "street", lat: 33.2975, lng: 44.4210, icon: "🏪", importance: 2 },
  { id: "pl_karada_kharij", name: "شارع الكرادة خارج وعرصات الهندية", gov: "بغداد", type: "street", lat: 33.2930, lng: 44.4320, icon: "🛍️", importance: 3 },
  { id: "pl_sinaa_st", name: "شارع الصناعة للحاسبات والتقنية \u200F( الجامعة التكنولوجية )\u200F", gov: "بغداد", type: "street", lat: 33.3119, lng: 44.4469, icon: "💻", importance: 3 },
  { id: "pl_palestine_st", name: "شارع فلسطين التجاري", gov: "بغداد", type: "street", lat: 33.3550, lng: 44.4380, icon: "🛣️", importance: 3 },
  { id: "pl_abu_nuwas_st", name: "شارع أبو نؤاس وكورنيش دجلة ومطاعم السمك المسكوف", gov: "بغداد", type: "street", lat: 33.3175, lng: 44.4150, icon: "🐟", importance: 3 },
  { id: "pl_haifa_st", name: "شارع حيفا التراثي - الكرخ", gov: "بغداد", type: "street", lat: 33.3420, lng: 44.3750, icon: "🏢", importance: 3 },
  { id: "pl_sadoun_st", name: "شارع السعدون وساحة الفردوس والفنادق", gov: "بغداد", type: "street", lat: 33.3180, lng: 44.4220, icon: "🏨", importance: 3 },

  // جامعات ومستشفيات ومعالم بغداد
  { id: "pl_baghdad_uni_jadriya", name: "جامعة بغداد - مجمع الجادرية", gov: "بغداد", type: "university", lat: 33.2725, lng: 44.3786, icon: "🎓", importance: 2 },
  { id: "pl_mustansiriya_uni", name: "الجامعة المستنصرية - شارع فلسطين", gov: "بغداد", type: "university", lat: 33.3672, lng: 44.4050, icon: "🎓", importance: 3 },
  { id: "pl_nahrain_uni", name: "جامعة النهرين - الجادرية", gov: "بغداد", type: "university", lat: 33.2792, lng: 44.3750, icon: "🎓", importance: 3 },
  { id: "pl_medical_city_bgd", name: "مدينة الطب التعليمية - باب المعظم", gov: "بغداد", type: "hospital", lat: 33.3536, lng: 44.3806, icon: "🏥", importance: 2 },
  { id: "pl_yarmouk_hosp", name: "مستشفى اليرموك التعليمي", gov: "بغداد", type: "hospital", lat: 33.2989, lng: 44.3469, icon: "🏥", importance: 3 },
  { id: "pl_kindi_hosp", name: "مستشفى الكندي التعليمي - النهضة", gov: "بغداد", type: "hospital", lat: 33.3425, lng: 44.4215, icon: "🏥", importance: 3 },
  { id: "pl_central_bank_tower", name: "برج البنك المركزي العراقي الجديد \u200F( زها حديد - الجادرية )\u200F", gov: "بغداد", type: "landmark", lat: 33.2858, lng: 44.3853, icon: "🏦", importance: 2 },
  { id: "pl_baghdad_tower", name: "برج بغداد السياحي \u200F( المأمون )\u200F", gov: "بغداد", type: "landmark", lat: 33.3036, lng: 44.3531, icon: "🗼", importance: 2 },
  { id: "pl_shaheed_monument", name: "نصب الشهيد \u200F( القبة الفيروزية - شارع فلسطين )\u200F", gov: "بغداد", type: "landmark", lat: 33.3433, lng: 44.4458, icon: "🏛️", importance: 2 },
  { id: "pl_iraq_museum", name: "المتحف العراقي الوطني - العلاوي", gov: "بغداد", type: "history", lat: 33.3283, lng: 44.3847, icon: "🏺", importance: 2 },
  { id: "pl_zawraa_park", name: "متنزه وحديقة الزوراء ومدينة الألعاب", gov: "بغداد", type: "nature", lat: 33.3114, lng: 44.3694, icon: "🎡", importance: 2 },
  { id: "pl_shaab_stadium", name: "ملعب الشعب الدولي - زيونة", gov: "بغداد", type: "landmark", lat: 33.3256, lng: 44.4358, icon: "⚽", importance: 3 },

  // أحياء وأقضية بغداد
  { id: "pl_sadr_city", name: "مدينة الصدر", gov: "بغداد", type: "city", lat: 33.3889, lng: 44.4556, icon: "🏙️", importance: 2 },
  { id: "pl_dora", name: "حي الدورة وشارع طعمة وأبو طيارة", gov: "بغداد", type: "district", lat: 33.2500, lng: 44.4000, icon: "🏘️", importance: 2 },
  { id: "pl_saydiya", name: "حي السيدية والشارع التجاري", gov: "بغداد", type: "district", lat: 33.2580, lng: 44.3550, icon: "🏪", importance: 3 },
  { id: "pl_bayaa", name: "حي البياع وشارع عشرين التجاري", gov: "بغداد", type: "district", lat: 33.2720, lng: 44.3420, icon: "🏪", importance: 3 },
  { id: "pl_ghazaliya", name: "حي الغزالية", gov: "بغداد", type: "district", lat: 33.3380, lng: 44.2750, icon: "🏘️", importance: 3 },
  { id: "pl_hurriya", name: "مدينة الحرية", gov: "بغداد", type: "district", lat: 33.3580, lng: 44.3150, icon: "🏘️", importance: 3 },
  { id: "pl_shaab_district", name: "مدينة الشعب وسوق شلال", gov: "بغداد", type: "district", lat: 33.4120, lng: 44.4150, icon: "🏪", importance: 3 },
  { id: "pl_new_baghdad", name: "بغداد الجديدة ومسبح الصفا", gov: "بغداد", type: "district", lat: 33.3150, lng: 44.4750, icon: "🏪", importance: 3 },
  { id: "pl_mahmudiyah", name: "قضاء المحمودية \u200F( بوابة الجنوب )\u200F", gov: "بغداد", type: "town", lat: 33.0611, lng: 44.3564, icon: "🏘️", importance: 2 },
  { id: "pl_abu_ghraib", name: "قضاء أبو غريب", gov: "بغداد", type: "town", lat: 33.3083, lng: 44.1806, icon: "🌾", importance: 2 },
  { id: "pl_tarmiyah", name: "قضاء الطارمية", gov: "بغداد", type: "town", lat: 33.6667, lng: 44.3833, icon: "🌴", importance: 3 },

  // ==================== بابل ====================
  { id: "pl_hillah_city", name: "مدينة الحلة", gov: "بابل", type: "city", lat: 32.4833, lng: 44.4333, icon: "🏙️", importance: 1 },
  { id: "pl_babylon_ruins", name: "آثار بابل وبوابة عشتار وأسد بابل", gov: "بابل", type: "history", lat: 32.5422, lng: 44.4211, icon: "🦁", importance: 1 },
  { id: "pl_musayyib", name: "قضاء المسيب وسدة الهندية", gov: "بابل", type: "town", lat: 32.7833, lng: 44.2833, icon: "🌊", importance: 2 },
  { id: "pl_mahawil", name: "قضاء المحاويل", gov: "بابل", type: "town", lat: 32.6500, lng: 44.4000, icon: "🌾", importance: 2 },
  { id: "pl_hashimiyah", name: "قضاء الهاشمية", gov: "بابل", type: "town", lat: 32.3500, lng: 44.6000, icon: "🏘️", importance: 3 },
  { id: "pl_kifl", name: "قضاء الكفل ومرقد ذي الكفل", gov: "بابل", type: "shrine", lat: 32.2217, lng: 44.3756, icon: "🕌", importance: 2 },
  { id: "pl_borsippa", name: "آثار بورسيبا وبرج نمرود", gov: "بابل", type: "history", lat: 32.3917, lng: 44.3417, icon: "🏛️", importance: 2 },
  { id: "pl_arbaeen_st_hilla", name: "شارع 40 التجاري والمولات والمطاعم - الحلة", gov: "بابل", type: "street", lat: 32.4780, lng: 44.4250, icon: "🛍️", importance: 3 },
  { id: "pl_babil_uni", name: "جامعة بابل", gov: "بابل", type: "university", lat: 32.4020, lng: 44.4050, icon: "🎓", importance: 3 },

  // ==================== كربلاء المقدسة ( شاملة مجموعة العميد التعليمية وكافة المجمعات والأحياء ) ====================
  { id: "pl_karbala_city", name: "مدينة كربلاء المقدسة", gov: "كربلاء", type: "shrine", lat: 32.6160, lng: 44.0250, icon: "🕌", importance: 1 },
  { id: "pl_imam_hussain", name: "العتبة الحسينية والعباسية وبين الحرمين", gov: "كربلاء", type: "shrine", lat: 32.6164, lng: 44.0325, icon: "🕌", importance: 1 },
  // مجمعات ومدارس وجامعة العميد التعليمية في كربلاء المقدسة
  { id: "pl_alameed_edu_group_main", name: "مجموعة العميد التعليمية \u200F( المجمع التربوي للبنات )\u200F", gov: "كربلاء", type: "university", lat: 32.6308, lng: 44.0010, icon: "🎓", importance: 2 },
  { id: "pl_alameed_edu_group_boys", name: "مجموعة العميد التعليمية \u200F( المجمع التربوي للبنين )\u200F", gov: "كربلاء", type: "university", lat: 32.5580, lng: 44.0740, icon: "🎓", importance: 2 },
  { id: "pl_alameed_durra_school", name: "مجموعة العميد التعليمية \u200F( مدرسة درة العميد )\u200F", gov: "كربلاء", type: "university", lat: 32.6056, lng: 44.0283, icon: "🏫", importance: 2 },
  { id: "pl_alameed_qamar_school", name: "مجموعة العميد التعليمية \u200F( ثانوية سيد الماء وثانوية القمر )\u200F", gov: "كربلاء", type: "university", lat: 32.5576, lng: 44.0464, icon: "🏫", importance: 2 },
  { id: "pl_alameed_university", name: "جامعة العميد \u200F( العتبة العباسية المقدسة )\u200F", gov: "كربلاء", type: "university", lat: 32.5514, lng: 44.0846, icon: "🎓", importance: 2 },
  { id: "pl_karbala_uni_freiha", name: "جامعة كربلاء \u200F( مجمع فريحة )\u200F", gov: "كربلاء", type: "university", lat: 32.6035, lng: 44.0865, icon: "🎓", importance: 2 },
  { id: "pl_warith_uni_karbala", name: "جامعة وارث الأنبياء - كربلاء", gov: "كربلاء", type: "university", lat: 32.6190, lng: 44.0950, icon: "🎓", importance: 3 },
  { id: "pl_zahraa_uni_karbala", name: "جامعة الزهراء للبنات - كربلاء", gov: "كربلاء", type: "university", lat: 32.6250, lng: 44.0780, icon: "🎓", importance: 3 },
  { id: "pl_ain_tamur", name: "قضاء عين التمر \u200F( شثاثا )\u200F", gov: "كربلاء", type: "town", lat: 32.5667, lng: 43.4833, icon: "🌴", importance: 2 },
  { id: "pl_ukhaydir", name: "حصن وقصر الأخيضر الأثري", gov: "كربلاء", type: "history", lat: 32.4406, lng: 43.6017, icon: "🏰", importance: 1 },
  { id: "pl_razzaza_lake", name: "بحيرة الرزازة", gov: "كربلاء", type: "nature", lat: 32.6833, lng: 43.7833, icon: "🌊", importance: 2 },
  { id: "pl_karbala_airport", name: "مطار كربلاء الدولي", gov: "كربلاء", type: "airport", lat: 32.4550, lng: 44.1450, icon: "✈️", importance: 2 },
  { id: "pl_snatir_st_karbala", name: "شارع السناتر التجاري والمولات - كربلاء", gov: "كربلاء", type: "mall", lat: 32.6020, lng: 44.0210, icon: "🛍️", importance: 3 },
  { id: "pl_afaf_mall_karbala", name: "مول العفاف التجاري - كربلاء", gov: "كربلاء", type: "mall", lat: 32.6085, lng: 44.0290, icon: "🛒", importance: 3 },
  { id: "pl_harith_mall_karbala", name: "مول الحارث وشارع فاطمة الزهراء - كربلاء", gov: "كربلاء", type: "mall", lat: 32.6010, lng: 44.0265, icon: "🛍️", importance: 3 },
  { id: "pl_karbala_stadium", name: "ملعب كربلاء الدولي", gov: "كربلاء", type: "landmark", lat: 32.5656, lng: 44.0042, icon: "⚽", importance: 3 },
  { id: "pl_kafeel_hosp_karbala", name: "مستشفى الكفيل التخصصي - كربلاء", gov: "كربلاء", type: "hospital", lat: 32.6050, lng: 44.0410, icon: "🏥", importance: 2 },
  { id: "pl_hussain_medical_karbala", name: "مدينة الإمام الحسين الطبية - كربلاء", gov: "كربلاء", type: "hospital", lat: 32.6110, lng: 44.0185, icon: "🏥", importance: 3 },
  { id: "pl_hay_hussain_karbala", name: "حي الحسين وشارع المكتبات - كربلاء", gov: "كربلاء", type: "district", lat: 32.6040, lng: 44.0190, icon: "🏘️", importance: 3 },
  { id: "pl_hay_muwadhafeen_karbala", name: "حي الموظفين وحي الأسرة - كربلاء", gov: "كربلاء", type: "district", lat: 32.5960, lng: 44.0260, icon: "🏘️", importance: 3 },

  // ==================== النجف الأشرف ====================
  { id: "pl_najaf_city", name: "مدينة النجف الأشرف", gov: "النجف الأشرف", type: "city", lat: 32.0000, lng: 44.3300, icon: "🕌", importance: 1 },
  { id: "pl_imam_ali_shrine", name: "الروضة الحيدرية الشريفة وسوق النجف الكبير", gov: "النجف الأشرف", type: "shrine", lat: 31.9961, lng: 44.3142, icon: "🕌", importance: 1 },
  { id: "pl_najaf_airport", name: "مطار النجف الأشرف الدولي", gov: "النجف الأشرف", type: "airport", lat: 31.9897, lng: 44.4042, icon: "✈️", importance: 1 },
  { id: "pl_kufa_city", name: "مدينة الكوفة ومسجد الكوفة المعظم", gov: "النجف الأشرف", type: "shrine", lat: 32.0300, lng: 44.4000, icon: "🕌", importance: 1 },
  { id: "pl_managhir", name: "قضاء المناذرة", gov: "النجف الأشرف", type: "town", lat: 31.8833, lng: 44.4833, icon: "🌾", importance: 2 },
  { id: "pl_mishkhab", name: "قضاء المشخاب وعنبر الفرات", gov: "النجف الأشرف", type: "town", lat: 31.8000, lng: 44.5000, icon: "🌾", importance: 2 },
  { id: "pl_wadi_salam", name: "مقبرة وادي السلام الكبرى", gov: "النجف الأشرف", type: "history", lat: 32.0167, lng: 44.3167, icon: "🕊️", importance: 2 },
  { id: "pl_sea_najaf", name: "بحر النجف الطبيعي", gov: "النجف الأشرف", type: "nature", lat: 31.9500, lng: 44.2500, icon: "🌊", importance: 2 },
  { id: "pl_najaf_city_mall", name: "نجف سيتي مول التجاري", gov: "النجف الأشرف", type: "mall", lat: 32.0085, lng: 44.3510, icon: "🛍️", importance: 3 },
  { id: "pl_rawan_st_najaf", name: "شارع الروان التجاري والمطاعم - النجف", gov: "النجف الأشرف", type: "street", lat: 31.9920, lng: 44.3420, icon: "🍽️", importance: 3 },
  { id: "pl_kufa_uni", name: "جامعة الكوفة", gov: "النجف الأشرف", type: "university", lat: 32.0250, lng: 44.3720, icon: "🎓", importance: 3 },

  // ==================== واسط ====================
  { id: "pl_kut_city", name: "مدينة الكوت وسدة الكوت", gov: "واسط", type: "city", lat: 32.5100, lng: 45.8200, icon: "🏙️", importance: 1 },
  { id: "pl_hayy", name: "قضاء الحي ومرقد سعيد بن جبير", gov: "واسط", type: "town", lat: 32.1667, lng: 46.0500, icon: "🕌", importance: 2 },
  { id: "pl_numaniyah", name: "قضاء النعمانية", gov: "واسط", type: "town", lat: 32.5500, lng: 45.4167, icon: "🏘️", importance: 2 },
  { id: "pl_suwaira", name: "قضاء الصويرة وبساتين واسط", gov: "واسط", type: "town", lat: 32.9167, lng: 44.7833, icon: "🌴", importance: 2 },
  { id: "pl_badra", name: "قضاء بدرة وجصان", gov: "واسط", type: "town", lat: 33.1000, lng: 45.9667, icon: "⛰️", importance: 3 },
  { id: "pl_zurbatiya", name: "منفذ زرباطية الحدودي", gov: "واسط", type: "border", lat: 33.0833, lng: 46.2167, icon: "🛂", importance: 1 },
  { id: "pl_kafaat_kut", name: "حي الكفاءات وكورنيش الكوت والمطاعم", gov: "واسط", type: "street", lat: 32.5020, lng: 45.8280, icon: "🍽️", importance: 3 },
  { id: "pl_wasit_uni", name: "جامعة واسط", gov: "واسط", type: "university", lat: 32.4880, lng: 45.8420, icon: "🎓", importance: 3 },

  // ==================== الديوانية ( القادسية ) ====================
  { id: "pl_diwaniyah_city", name: "مدينة الديوانية", gov: "الديوانية", type: "city", lat: 31.9900, lng: 44.9200, icon: "🏙️", importance: 1 },
  { id: "pl_shamiya", name: "قضاء الشامية على الفرات", gov: "الديوانية", type: "town", lat: 31.9667, lng: 44.6000, icon: "🌾", importance: 2 },
  { id: "pl_hamzah", name: "قضاء الحمزة الشرقي", gov: "الديوانية", type: "town", lat: 31.7333, lng: 44.9833, icon: "🏘️", importance: 2 },
  { id: "pl_afak", name: "قضاء عفك", gov: "الديوانية", type: "town", lat: 32.0667, lng: 45.2500, icon: "🏘️", importance: 2 },
  { id: "pl_nippur", name: "مدينة نيبور السومرية المقدسة \u200F( نفر )\u200F", gov: "الديوانية", type: "history", lat: 32.1250, lng: 45.2319, icon: "🏛️", importance: 1 },
  { id: "pl_qadisiyah_uni", name: "جامعة القادسية - الديوانية", gov: "الديوانية", type: "university", lat: 32.0120, lng: 44.8950, icon: "🎓", importance: 3 },

  // ==================== ميسان ====================
  { id: "pl_amara_city", name: "مدينة العمارة", gov: "ميسان", type: "city", lat: 31.8400, lng: 47.1400, icon: "🏙️", importance: 1 },
  { id: "pl_majar_kabir", name: "قضاء المجر الكبير", gov: "ميسان", type: "town", lat: 31.5833, lng: 47.1667, icon: "🏘️", importance: 2 },
  { id: "pl_ali_gharbi", name: "قضاء علي الغربي", gov: "ميسان", type: "town", lat: 32.4667, lng: 46.6833, icon: "🏘️", importance: 2 },
  { id: "pl_qalat_saleh", name: "قضاء قلعة صالح", gov: "ميسان", type: "town", lat: 31.5167, lng: 47.2833, icon: "🌴", importance: 2 },
  { id: "pl_hawizeh_marshes", name: "أهوار الحويزة ومحميات اليونسكو", gov: "ميسان", type: "nature", lat: 31.5500, lng: 47.6000, icon: "🛶", importance: 1 },
  { id: "pl_sheeb", name: "منفذ الشيب الحدودي", gov: "ميسان", type: "border", lat: 31.8333, lng: 47.7833, icon: "🛂", importance: 2 },
  { id: "pl_dijla_st_amara", name: "شارع دجلة التجاري وكورنيش العمارة", gov: "ميسان", type: "street", lat: 31.8430, lng: 47.1450, icon: "🛍️", importance: 3 },

  // ==================== ذي قار ====================
  { id: "pl_nasiriyah_city", name: "مدينة الناصرية", gov: "ذي قار", type: "city", lat: 31.0500, lng: 46.2500, icon: "🏙️", importance: 1 },
  { id: "pl_ur_ruins", name: "آثار وزقورة أور وبيت النبي إبراهيم", gov: "ذي قار", type: "history", lat: 30.9625, lng: 46.1031, icon: "🏺", importance: 1 },
  { id: "pl_chibayish", name: "قضاء الجبايش وأهوارها العالمية", gov: "ذي قار", type: "nature", lat: 30.9450, lng: 46.9950, icon: "🛶", importance: 1 },
  { id: "pl_shatrah", name: "قضاء الشطرة", gov: "ذي قار", type: "town", lat: 31.4167, lng: 46.1833, icon: "🌾", importance: 2 },
  { id: "pl_suq_shuyukh", name: "قضاء سوق الشيوخ", gov: "ذي قار", type: "town", lat: 30.8833, lng: 46.4667, icon: "🏘️", importance: 2 },
  { id: "pl_rifai", name: "قضاء الرفاعي", gov: "ذي قار", type: "town", lat: 31.6500, lng: 46.1000, icon: "🏘️", importance: 2 },
  { id: "pl_lagash", name: "مدينة لكش وتلو السومرية القديمة", gov: "ذي قار", type: "history", lat: 31.4117, lng: 46.4067, icon: "🏛️", importance: 2 },
  { id: "pl_eridu", name: "آثار إريدو السومرية", gov: "ذي قار", type: "history", lat: 30.8167, lng: 45.9833, icon: "🏺", importance: 2 },
  { id: "pl_haboubi_st_nasiriyah", name: "شارع وساحة الحبوبي التجارية والمولات - الناصرية", gov: "ذي قار", type: "street", lat: 31.0460, lng: 46.2580, icon: "🛍️", importance: 3 },
  { id: "pl_dhiqar_uni", name: "جامعة ذي قار", gov: "ذي قار", type: "university", lat: 31.0350, lng: 46.2150, icon: "🎓", importance: 3 },

  // ==================== المثنى ====================
  { id: "pl_samawah_city", name: "مدينة السماوة", gov: "المثنى", type: "city", lat: 30.3167, lng: 45.2833, icon: "🏙️", importance: 1 },
  { id: "pl_uruk_warkaa", name: "آثار الوركاء \u200F( أوروك - موطن جلجامش )\u200F", gov: "المثنى", type: "history", lat: 31.3222, lng: 45.6361, icon: "🏛️", importance: 1 },
  { id: "pl_rumaitha", name: "قضاء الرميثة", gov: "المثنى", type: "town", lat: 31.5333, lng: 45.2167, icon: "🌾", importance: 2 },
  { id: "pl_khidhir", name: "قضاء الخضر على ضفاف الفرات", gov: "المثنى", type: "town", lat: 31.1833, lng: 45.4167, icon: "🌴", importance: 2 },
  { id: "pl_sawa_lake", name: "بحيرة ساوة الطبيعية الفريدة", gov: "المثنى", type: "nature", lat: 31.3139, lng: 45.0042, icon: "🌊", importance: 1 },
  { id: "pl_salman", name: "قضاء السلمان في بادية السماوة", gov: "المثنى", type: "town", lat: 30.5000, lng: 44.5500, icon: "🏜️", importance: 2 },
  { id: "pl_jumaima", name: "منفذ الجميمة الحدودي", gov: "المثنى", type: "border", lat: 29.5833, lng: 44.8667, icon: "🛂", importance: 3 },
  { id: "pl_kornish_samawah", name: "كورنيش السماوة والسوق المسقف", gov: "المثنى", type: "market", lat: 31.3180, lng: 45.2850, icon: "🏪", importance: 3 },

  // ==================== البصرة وأقصى الجنوب ====================
  { id: "pl_basra_city", name: "مدينة البصرة \u200F( ثغر العراق الباسم )\u200F", gov: "البصرة", type: "city", lat: 30.5081, lng: 47.7835, icon: "⚓", importance: 1 },
  { id: "pl_basra_airport", name: "مطار البصرة الدولي", gov: "البصرة", type: "airport", lat: 30.5492, lng: 47.6622, icon: "✈️", importance: 1 },
  { id: "pl_qurna", name: "قضاء القرنة وشجرة آدم \u200F( ملتقى دجلة والفرات )\u200F", gov: "البصرة", type: "nature", lat: 31.0167, lng: 47.4333, icon: "🌴", importance: 1 },
  { id: "pl_zubair", name: "قضاء الزبير", gov: "البصرة", type: "shrine", lat: 30.3900, lng: 47.7000, icon: "🕌", importance: 2 },
  { id: "pl_abu_khasib", name: "قضاء أبي الخصيب وبساتين النخيل", gov: "البصرة", type: "town", lat: 30.4500, lng: 47.9833, icon: "🌴", importance: 2 },
  { id: "pl_umm_qasr", name: "ميناء أم قصر التجاري الدولي", gov: "البصرة", type: "port", lat: 30.0333, lng: 47.9333, icon: "🚢", importance: 1 },
  { id: "pl_fao_port", name: "ميناء الفاو الكبير ورأس البيشة", gov: "البصرة", type: "port", lat: 29.9328, lng: 48.5670, icon: "🌊", importance: 1 },
  { id: "pl_shalamcheh", name: "منفذ الشلامجة الحدودي", gov: "البصرة", type: "border", lat: 30.5000, lng: 48.0667, icon: "🛂", importance: 1 },
  { id: "pl_safwan", name: "منفذ سفوان الحدودي مع الكويت", gov: "البصرة", type: "border", lat: 30.1167, lng: 47.7167, icon: "🛂", importance: 1 },
  { id: "pl_times_square_basra", name: "بصرة تايمز سكوير مول", gov: "البصرة", type: "mall", lat: 30.5214, lng: 47.8225, icon: "🛍️", importance: 2 },
  { id: "pl_maxi_mall_basra", name: "ماكسي مول البصرة", gov: "البصرة", type: "mall", lat: 30.5095, lng: 47.8180, icon: "🛍️", importance: 3 },
  { id: "pl_shanshal_mall_basra", name: "شنشول مول البصرة - الجزائر", gov: "البصرة", type: "mall", lat: 30.4950, lng: 47.8260, icon: "🛍️", importance: 3 },
  { id: "pl_jazair_st_basra", name: "شارع الجزائر التجاري والمطاعم - البصرة", gov: "البصرة", type: "street", lat: 30.4980, lng: 47.8220, icon: "🍽️", importance: 3 },
  { id: "pl_ashar_market_basra", name: "سوق العشار الكبير وكورنيش شط العرب", gov: "البصرة", type: "market", lat: 30.5150, lng: 47.8380, icon: "🚢", importance: 2 },
  { id: "pl_basra_sports_city", name: "المدينة الرياضية وجذع النخلة - البصرة", gov: "البصرة", type: "landmark", lat: 30.4400, lng: 47.7797, icon: "⚽", importance: 2 },
  { id: "pl_basra_uni_garmat", name: "جامعة البصرة - مجمع كرمة علي وباب الزبير", gov: "البصرة", type: "university", lat: 30.5680, lng: 47.7480, icon: "🎓", importance: 3 },
  ...IRAQ_COMPREHENSIVE_GAZETTEER
];

const HARVESTED_CACHE_KEY = "OpenMapIQ_Harvested_POIs_v10";

// دمج أي مواقع وبنايات تم تجميعها وحفظها مسبقاً في ذاكرة المتصفح عند الإقلاع
try {
  const savedRaw = localStorage.getItem(HARVESTED_CACHE_KEY);
  if (savedRaw) {
    const savedList = JSON.parse(savedRaw);
    if (Array.isArray(savedList)) {
      const existingIds = new Set(IRAQ_DETAILED_PLACES.map(p => p.id));
      savedList.forEach(item => {
        if (item && item.id && item.name && !existingIds.has(item.id)) {
          existingIds.add(item.id);
          IRAQ_DETAILED_PLACES.push(item);
        }
      });
    }
  }
} catch (e) {
  // تجاهل أخطاء الذاكرة المحلية إن وجدت
}

/**
 * تسجيل وحفظ أي موقع أو بناية أو منطقة عراقية مكتشفة في الموسوعة المحلية لتبقى متاحة دائماً في البحث وعلى الخريطة
 */
export function registerNewPlaceInGazetteer(placeObj) {
  if (!placeObj || !placeObj.name || isNaN(placeObj.lat) || isNaN(placeObj.lng)) return null;
  const cleanName = String(placeObj.name).trim();
  if (!cleanName) return null;

  const existing = IRAQ_DETAILED_PLACES.find(
    p => p.id === placeObj.id || (p.name === cleanName && Math.abs(p.lat - placeObj.lat) < 0.002 && Math.abs(p.lng - placeObj.lng) < 0.002)
  );
  if (existing) return existing;

  const newEntry = {
    id: placeObj.id || `harv_${Number(placeObj.lat).toFixed(4)}_${Number(placeObj.lng).toFixed(4)}`,
    name: cleanName,
    gov: placeObj.gov || "العراق",
    sub: placeObj.sub || placeObj.gov || "العراق",
    type: placeObj.type || "building",
    lat: Number(placeObj.lat),
    lng: Number(placeObj.lng),
    icon: placeObj.icon || "📍",
    importance: placeObj.importance || 3,
    keywords: placeObj.keywords || `${cleanName} ${placeObj.gov || ''} ${placeObj.sub || ''}`
  };

  IRAQ_DETAILED_PLACES.push(newEntry);

  try {
    const savedRaw = localStorage.getItem(HARVESTED_CACHE_KEY);
    const savedList = savedRaw ? JSON.parse(savedRaw) : [];
    if (Array.isArray(savedList) && savedList.length < 4000) {
      savedList.push(newEntry);
      localStorage.setItem(HARVESTED_CACHE_KEY, JSON.stringify(savedList));
    }
  } catch (e) {
    // تجاهل امتلاء الذاكرة
  }

  return newEntry;
}

/**
 * مزامنة وتجميع البيانات النصية للمواقع والأحياء والبنايات العراقية تلقائياً في الخلفية
 */
export async function syncLatestPlacesData(onNewPlacesHarvested = null) {
  try {
    localStorage.setItem("OpenMapIQ_Places_Cache_v10", JSON.stringify(IRAQ_DETAILED_PLACES));

    if (navigator.onLine) {
      // جلب آلاف الأحياء والمناطق والبلدات العراقية المسماة من خوادم الخرائط المفتوحة وتخزينها محلياً
      const overpassEndpoints = [
        'https://overpass-api.de/api/interpreter',
        'https://lz4.overpass-api.de/api/interpreter',
        'https://overpass.kumi.systems/api/interpreter'
      ];
      const query = `[out:json][timeout:15];(node["place"~"suburb|quarter|neighbourhood|town|village|locality"]["name"](29.1,38.8,37.4,48.6);way["historic"]["name"](29.1,38.8,37.4,48.6););out center qt 1200;`;

      for (const endpoint of overpassEndpoints) {
        try {
          const res = await fetch(`${endpoint}?data=${encodeURIComponent(query)}`);
          if (!res.ok) continue;
          const data = await res.json();
          if (data && Array.isArray(data.elements) && data.elements.length > 0) {
            let addedCount = 0;
            data.elements.forEach(el => {
              const name = el.tags?.['name:ar'] || el.tags?.name;
              const lat = el.lat ?? el.center?.lat;
              const lng = el.lon ?? el.center?.lon;
              if (!name || lat === undefined || lng === undefined) return;
              const added = registerNewPlaceInGazetteer({
                id: `osm_iq_${el.id}`,
                name,
                gov: el.tags?.['addr:province'] || el.tags?.['is_in:state'] || 'العراق',
                sub: el.tags?.place === 'suburb' || el.tags?.place === 'neighbourhood' ? 'حي / منطقة' : 'موقع جغرافي',
                type: el.tags?.historic ? 'history' : 'district',
                lat,
                lng,
                icon: el.tags?.historic ? '🏰' : '🏘️',
                importance: 3
              });
              if (added) addedCount++;
            });
            if (addedCount > 0 && typeof onNewPlacesHarvested === 'function') {
              onNewPlacesHarvested(IRAQ_DETAILED_PLACES);
            }
            break;
          }
        } catch (innerErr) {
          // الانتقال للخادم الاحتياطي التالي
        }
      }
    }

    return { count: IRAQ_DETAILED_PLACES.length, updated: true };
  } catch (err) {
    return { count: IRAQ_DETAILED_PLACES.length, updated: false };
  }
}
