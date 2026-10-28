/**
 * أدوات وحسابات الجغرافيا المكانية المخصصة للعراق
 * مع وظائف التعقيم الأمني والحساب العكسي للمحافظات
 */

import { IRAQ_GOVERNORATES } from '../data/iraq-data.js?v=16';

/**
 * حساب المسافة بين نقطتين جغرافيتين بالكيلومتر باستخدام معادلة Haversine
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // نصف قطر الأرض بالكيلومتر
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * حساب زاوية التوجيه والبوصلة (Bearing in Degrees 0-360) بين نقطتين
 */
export function calculateBearing(lat1, lon1, lat2, lon2) {
  const p1 = deg2rad(lat1);
  const p2 = deg2rad(lat2);
  const dLon = deg2rad(lon2 - lon1);

  const y = Math.sin(dLon) * Math.cos(p2);
  const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dLon);
  const brng = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  return brng;
}

/**
 * حساب المسافة التراكمية لمسار كامل بالكيلومتر
 */
export function calculatePathDistanceKm(coordsArray) {
  if (!coordsArray || coordsArray.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < coordsArray.length - 1; i++) {
    total += calculateDistanceKm(
      coordsArray[i][0], coordsArray[i][1],
      coordsArray[i + 1][0], coordsArray[i + 1][1]
    );
  }
  return total;
}

/**
 * تحديد أقرب محافظة عراقية للإحداثي المعطى تلقائياً (Reverse Geocoding مبسط بدون انترنت)
 */
export function findClosestGovernorate(lat, lng) {
  let closest = IRAQ_GOVERNORATES[0];
  let minDistance = calculateDistanceKm(lat, lng, closest.center[0], closest.center[1]);

  for (let i = 1; i < IRAQ_GOVERNORATES.length; i++) {
    const gov = IRAQ_GOVERNORATES[i];
    const dist = calculateDistanceKm(lat, lng, gov.center[0], gov.center[1]);
    if (dist < minDistance) {
      minDistance = dist;
      closest = gov;
    }
  }

  return {
    governorate: closest.name,
    distanceKm: Math.round(minDistance * 10) / 10,
    region: closest.region
  };
}

/**
 * فحص ما إذا كان الإحداثي يقع ضمن حدود جمهورية العراق التقريبية
 */
export function isWithinIraq(lat, lng) {
  return lat >= 29.0 && lat <= 37.6 && lng >= 38.5 && lng <= 49.0;
}

/**
 * تنسيق الإحداثيات لقراءة بشرية أنيقة بالعربية
 */
export function formatCoordinates(lat, lng) {
  const latDir = lat >= 0 ? "شمالاً" : "جنوباً";
  const lngDir = lng >= 0 ? "شرقاً" : "غرباً";
  return `${Math.abs(lat).toFixed(5)}° ${latDir} ، ${Math.abs(lng).toFixed(5)}° ${lngDir}`;
}

/**
 * ضبط الأقواس بالنظام العربي الصحيح مع ترك مسافة غير ملامسة للحروف وعلامات اتجاه RTL لمنع انقلاب الأقواس
 */
export function formatArabicParentheses(text) {
  if (typeof text !== "string") return "";
  return text.replace(/\(\s*([^()]+?)\s*\)/g, "\u200F( \u200F$1\u200F )\u200F");
}

/**
 * تعقيم النصوص لمنع هجمات XSS قبل العرض مع تصحيح اتجاه ومسافات الأقواس العربية
 */
export function sanitizeText(text) {
  if (typeof text !== "string") return "";
  const formatted = formatArabicParentheses(text);
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  };
  return formatted.replace(/[&<>"']/g, (m) => map[m]);
}
