/**
 * محرك المجسمات والشخصيات ثلاثية الأبعاد الحقيقية (Real 3D WebGL Engine via Three.js - v8 OMI)
 * - أسماء مختصرة من كلمة واحدة فقط بدون أوصاف زائدة:
 *   سهم - مستكشف - انسان - سيارة - روبوت - طائرة - دراجة هوائية - حصان - ثعلب - فلامينغو
 * - دعم DRACOLoader لتحميل المجسمات المضغوطة (مثل السيارة الفيراري) + مجسمات بشرية وحركية حقيقية متكاملة.
 * - ضبط دقيق للأحجام داخل إطار الـ Canvas (136x136) بحيث لا يخرج أي مجسم خارج حدوده.
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

export const AVAILABLE_3D_MODELS = [
  {
    id: 'arrow',
    name: 'سهم',
    icon: '🧭',
    proceduralType: 'luxury_arrow',
    scale: 1.32,
    rotationOffset: { x: 0, y: 0, z: 0 }
  },
  {
    id: 'soldier',
    name: 'مستكشف',
    icon: '🪖',
    proceduralType: 'tactical_explorer',
    scale: 1.25,
    rotationOffset: { x: 0, y: 0, z: 0 }
  },
  {
    id: 'character_man',
    name: 'انسان',
    icon: '🚶',
    proceduralType: 'human_walker',
    scale: 1.25,
    rotationOffset: { x: 0, y: 0, z: 0 }
  },
  {
    id: 'car_ferrari',
    name: 'سيارة',
    icon: '🏎️',
    file: './models/car_ferrari.glb',
    fallbackProcedural: 'sports_car',
    scale: 1.48,
    rotationOffset: { x: 0, y: 0, z: 0 },
    idleClip: null,
    moveClip: 'wheels'
  },
  {
    id: 'robot_alien',
    name: 'روبوت',
    icon: '🤖',
    proceduralType: 'smart_robot',
    scale: 1.35,
    rotationOffset: { x: 0, y: 0, z: 0 }
  },
  {
    id: 'spacecraft',
    name: 'طائرة',
    icon: '🚀',
    proceduralType: 'starfighter',
    scale: 1.4,
    rotationOffset: { x: 0, y: 0, z: 0 }
  },
  {
    id: 'bike',
    name: 'دراجة هوائية',
    icon: '🚴',
    proceduralType: 'human_cyclist',
    scale: 1.36,
    rotationOffset: { x: 0, y: 0, z: 0 }
  },
  {
    id: 'creature_horse',
    name: 'حصان',
    icon: '🐎',
    file: './models/creature_horse.glb',
    scale: 1.95,
    yOffset: 0.18,
    rotationOffset: { x: 0, y: Math.PI, z: 0 },
    idleClip: 'horse_A_',
    moveClip: 'horse_A_',
    idleTimeScale: 0.45,
    moveTimeScale: 1.45
  },
  {
    id: 'fox_animal',
    name: 'ثعلب',
    icon: '🦊',
    file: './models/fox_animal.glb',
    scale: 1.55,
    rotationOffset: { x: 0, y: Math.PI, z: 0 },
    idleClip: 'Survey',
    moveClip: 'Walk',
    fastClip: 'Run'
  },
  {
    id: 'flying_bird',
    name: 'فلامينغو',
    altName: 'طائر رحال',
    icon: '🦩',
    file: './models/flying_bird.glb',
    scale: 1.65,
    yOffset: 0.2,
    rotationOffset: { x: 0, y: Math.PI, z: 0 },
    idleClip: 'flamingo_flyA_',
    moveClip: 'flamingo_flyA_',
    idleTimeScale: 0.85,
    moveTimeScale: 1.5
  }
];

class ThreeEngine {
  constructor() {
    this.loader = new GLTFLoader();
    try {
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath('https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/gltf/');
      this.loader.setDRACOLoader(dracoLoader);
    } catch (e) {
      // استمرار آمن في حال عدم توفر فاك الضغط
    }
    this.gltfCache = new Map();
  }

  /**
   * 1. بناء السهم الذكي الفاخر (Luxury 3D Chevron Navigation Arrow)
   * تصميم سهم ملاحة ثلاثي الأبعاد انسيابي مجنح بقلب طاقة متوهج يشير بدقة نحو الشمال (-Z)
   */
  buildLuxurySmartArrow() {
    const root = new THREE.Group();

    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      metalness: 0.82,
      roughness: 0.18
    });
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      metalness: 0.88,
      roughness: 0.15
    });
    const cyanGlowMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0ea5e9,
      emissiveIntensity: 2.2,
      roughness: 0.1
    });
    const emeraldGlowMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 1.9,
      roughness: 0.15
    });

    // الرأس الماسي المدبب للسهم يتجه نحو الأمام (-Z)
    const spearHead = new THREE.Mesh(new THREE.ConeGeometry(0.62, 1.55, 4), bodyMat);
    spearHead.rotation.x = -Math.PI / 2;
    spearHead.rotation.y = Math.PI / 4;
    spearHead.scale.set(1.15, 1.0, 0.48);
    spearHead.position.set(0, 0.1, -0.65);
    root.add(spearHead);

    // الأجنحة الجانبية المنسابة للخلف (Chevron Swept Wings)
    const leftWing = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.16, 1.25), wingMat);
    leftWing.position.set(-0.52, 0.08, 0.18);
    leftWing.rotation.y = 0.52;
    leftWing.rotation.z = -0.12;
    root.add(leftWing);

    const rightWing = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.16, 1.25), wingMat);
    rightWing.position.set(0.52, 0.08, 0.18);
    rightWing.rotation.y = -0.52;
    rightWing.rotation.z = 0.12;
    root.add(rightWing);

    // شريط الطاقة الوسطي المضيء (Center Luminescent Fin)
    const centerSpine = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.28, 1.55), cyanGlowMat);
    centerSpine.position.set(0, 0.18, -0.15);
    root.add(centerSpine);

    // نواة التوجيه الزمردية في المقدمة
    const frontCrystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 0), emeraldGlowMat);
    frontCrystal.scale.set(0.9, 0.6, 1.5);
    frontCrystal.position.set(0, 0.24, -0.82);
    root.add(frontCrystal);

    // باعث الدفع الخلفي
    const tailThruster = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 0.35, 16), cyanGlowMat);
    tailThruster.rotation.x = Math.PI / 2;
    tailThruster.position.set(0, 0.08, 0.78);
    root.add(tailThruster);

    const customTick = (elapsed, isMoving) => {
      const pulse = (isMoving ? 1.25 : 0.95) + Math.sin(elapsed * 8) * 0.15;
      tailThruster.scale.set(1, pulse, 1);
      root.rotation.z = Math.sin(elapsed * 2.2) * 0.05;
    };

    return { scene: root, customTick };
  }

  /**
   * 2. بناء شخصية المستكشف التكتيكي البشري الواقعي (Articulated Realistic Tactical Explorer - مستكشف)
   * بحجم متناسق تماماً داخل الإطار وحركة مشي حقيقية للأرجل والركب والأذرع
   */
  buildRealTacticalExplorer() {
    const root = new THREE.Group();

    const skinMat = new THREE.MeshStandardMaterial({ color: 0xe0ac69, roughness: 0.45, metalness: 0.05 });
    const uniformMat = new THREE.MeshStandardMaterial({ color: 0x3f6212, roughness: 0.65, metalness: 0.1 });
    const vestMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.3 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x365314, roughness: 0.7, metalness: 0.08 });
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, metalness: 0.25 });
    const visorMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, emissive: 0x0369a1, emissiveIntensity: 0.4, metalness: 0.9, roughness: 0.1 });
    const goldBadgeMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.85, roughness: 0.2 });

    // الجذع والسترة التكتيكية (Torso)
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.92, 0.46), uniformMat);
    torso.position.y = 0.22;
    root.add(torso);

    const tacticalVest = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.68, 0.52), vestMat);
    tacticalVest.position.y = 0.24;
    root.add(tacticalVest);

    // شارة الصدر الذهبية
    const chestBadge = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.04), goldBadgeMat);
    chestBadge.position.set(-0.2, 0.42, -0.27);
    root.add(chestBadge);

    // حقيبة الظهر الميدانية (Backpack at +Z)
    const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.68, 0.32), vestMat);
    backpack.position.set(0, 0.26, 0.38);
    root.add(backpack);

    // الرأس البشري والخوذة التكتيكية (Head)
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.98, 0);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.2, 16), skinMat);
    neck.position.y = -0.22;
    headGroup.add(neck);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 24, 24), skinMat);
    head.scale.set(0.92, 1.05, 0.95);
    headGroup.add(head);

    // الخوذة التكتيكية
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.35, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.58), uniformMat);
    helmet.position.y = 0.05;
    headGroup.add(helmet);

    // النظارة التكتيكية الأمامية (-Z)
    const goggles = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.14, 0.12), visorMat);
    goggles.position.set(0, 0.04, -0.28);
    headGroup.add(goggles);

    root.add(headGroup);

    // الأذرع البشرية المفصلية (Arms)
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.54, 0.58, 0);
    const leftUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.48, 16), uniformMat);
    leftUpperArm.position.y = -0.22;
    const leftForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.42, 16), skinMat);
    leftForearm.position.set(0, -0.6, -0.05);
    leftForearm.rotation.x = 0.25;
    const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 14), vestMat);
    leftHand.position.set(0, -0.82, -0.1);
    leftArmGroup.add(leftUpperArm, leftForearm, leftHand);
    root.add(leftArmGroup);

    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.54, 0.58, 0);
    const rightUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.48, 16), uniformMat);
    rightUpperArm.position.y = -0.22;
    const rightForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.42, 16), skinMat);
    rightForearm.position.set(0, -0.6, -0.05);
    rightForearm.rotation.x = 0.25;
    const rightHand = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 14), vestMat);
    rightHand.position.set(0, -0.82, -0.1);
    rightArmGroup.add(rightUpperArm, rightForearm, rightHand);
    root.add(rightArmGroup);

    // الأرجل المفصلية مع الركبة والحذاء الميداني (Articulated Legs with Knee bend)
    const createLeg = (xPos) => {
      const hipGroup = new THREE.Group();
      hipGroup.position.set(xPos, -0.25, 0);

      const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.13, 0.52, 16), pantsMat);
      thigh.position.y = -0.25;
      hipGroup.add(thigh);

      const kneeGroup = new THREE.Group();
      kneeGroup.position.set(0, -0.5, 0);

      const calf = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.48, 16), pantsMat);
      calf.position.y = -0.24;
      kneeGroup.add(calf);

      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.44), bootMat);
      boot.position.set(0, -0.5, -0.08);
      kneeGroup.add(boot);

      hipGroup.add(kneeGroup);
      return { hipGroup, kneeGroup };
    };

    const leftLeg = createLeg(-0.22);
    const rightLeg = createLeg(0.22);
    root.add(leftLeg.hipGroup, rightLeg.hipGroup);

    root.scale.set(0.88, 0.88, 0.88);

    const customTick = (elapsed, isMoving) => {
      const speed = isMoving ? 8.5 : 3.2;
      const stride = isMoving ? 0.62 : 0.22;
      const phase = elapsed * speed;

      leftLeg.hipGroup.rotation.x = Math.sin(phase) * stride;
      rightLeg.hipGroup.rotation.x = -Math.sin(phase) * stride;

      // ثني الركبة الواقعي أثناء رفع القدم
      leftLeg.kneeGroup.rotation.x = Math.max(0, -Math.cos(phase) * (stride * 0.85));
      rightLeg.kneeGroup.rotation.x = Math.max(0, Math.cos(phase) * (stride * 0.85));

      leftArmGroup.rotation.x = -Math.sin(phase) * (stride * 0.8);
      rightArmGroup.rotation.x = Math.sin(phase) * (stride * 0.8);
      headGroup.rotation.y = Math.sin(elapsed * 1.6) * 0.12;
    };

    return { scene: root, customTick };
  }

  /**
   * 3. بناء شخصية الإنسان الواقعي المتحرك (Realistic Articulated Human - انسان)
   * إنسان عصري بملامح وملابس حقيقية وحركة مشي طبيعية للأرجل والركب والذراعين داخل الإطار
   */
  buildRealHumanWalker() {
    const root = new THREE.Group();

    const skinMat = new THREE.MeshStandardMaterial({ color: 0xf1c27d, roughness: 0.42, metalness: 0.05 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x1e1b18, roughness: 0.8 });
    const jacketMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.5, metalness: 0.15 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.6 });
    const jeansMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.75 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.1 });

    // الجذع والسترة الكاجوال (Torso)
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.9, 0.42), jacketMat);
    torso.position.y = 0.22;
    root.add(torso);

    // القميص الداخلي الأمامي (-Z)
    const innerShirt = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.88, 0.44), shirtMat);
    innerShirt.position.set(0, 0.22, -0.01);
    root.add(innerShirt);

    // الرأس والوجه البشري والشعر (Head)
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.96, 0);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.18, 16), skinMat);
    neck.position.y = -0.2;
    headGroup.add(neck);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.31, 24, 24), skinMat);
    head.scale.set(0.92, 1.06, 0.95);
    headGroup.add(head);

    // الشعر الطبيعي
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.33, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), hairMat);
    hair.position.set(0, 0.06, 0.02);
    headGroup.add(hair);

    // العيون البشرية الأمامية (-Z)
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 12), eyeMat);
    leftEye.position.set(-0.1, 0.04, -0.28);
    const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 12), eyeMat);
    rightEye.position.set(0.1, 0.04, -0.28);
    headGroup.add(leftEye, rightEye);

    root.add(headGroup);

    // الذراعان البشريتان (Arms)
    const createArm = (xPos) => {
      const armGroup = new THREE.Group();
      armGroup.position.set(xPos, 0.56, 0);
      const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.46, 16), jacketMat);
      sleeve.position.y = -0.2;
      const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.08, 0.4, 16), skinMat);
      forearm.position.set(0, -0.56, -0.04);
      forearm.rotation.x = 0.2;
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 14), skinMat);
      hand.position.set(0, -0.78, -0.08);
      armGroup.add(sleeve, forearm, hand);
      return armGroup;
    };

    const leftArmGroup = createArm(-0.5);
    const rightArmGroup = createArm(0.5);
    root.add(leftArmGroup, rightArmGroup);

    // الأرجل المفصلية مع الجينز والحذاء الرياضي (Legs)
    const createLeg = (xPos) => {
      const hipGroup = new THREE.Group();
      hipGroup.position.set(xPos, -0.24, 0);

      const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.125, 0.5, 16), jeansMat);
      thigh.position.y = -0.24;
      hipGroup.add(thigh);

      const kneeGroup = new THREE.Group();
      kneeGroup.position.set(0, -0.48, 0);

      const calf = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.48, 16), jeansMat);
      calf.position.y = -0.24;
      kneeGroup.add(calf);

      const sneaker = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.42), shoeMat);
      sneaker.position.set(0, -0.48, -0.07);
      kneeGroup.add(sneaker);

      hipGroup.add(kneeGroup);
      return { hipGroup, kneeGroup };
    };

    const leftLeg = createLeg(-0.2);
    const rightLeg = createLeg(0.2);
    root.add(leftLeg.hipGroup, rightLeg.hipGroup);

    root.scale.set(0.88, 0.88, 0.88);

    const customTick = (elapsed, isMoving) => {
      const speed = isMoving ? 8.2 : 3.0;
      const stride = isMoving ? 0.58 : 0.2;
      const phase = elapsed * speed;

      leftLeg.hipGroup.rotation.x = Math.sin(phase) * stride;
      rightLeg.hipGroup.rotation.x = -Math.sin(phase) * stride;

      leftLeg.kneeGroup.rotation.x = Math.max(0, -Math.cos(phase) * (stride * 0.82));
      rightLeg.kneeGroup.rotation.x = Math.max(0, Math.cos(phase) * (stride * 0.82));

      leftArmGroup.rotation.x = -Math.sin(phase) * (stride * 0.75);
      rightArmGroup.rotation.x = Math.sin(phase) * (stride * 0.75);
      headGroup.rotation.y = Math.sin(elapsed * 1.5) * 0.1;
    };

    return { scene: root, customTick };
  }

  /**
   * 4. بناء مجسم شخص يقود دراجة هوائية حقيقية (Articulated Cyclist on Bicycle - دراجة هوائية)
   * دراجة هوائية حقيقية بعجلتين دوارتين ومقود وهيكل وراكب بشري يحرك قدميه على الدواسات
   */
  buildRealHumanCyclist() {
    const root = new THREE.Group();

    const frameMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.75, roughness: 0.2 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.15 });
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.85 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xf1c27d, roughness: 0.45 });
    const jerseyMat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.4 });
    const shortsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
    const helmetMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.4, roughness: 0.25 });

    // 1. العجلتان الأمامية (-Z) والخلفية (+Z)
    const createBicycleWheel = (zPos) => {
      const wheelGroup = new THREE.Group();
      wheelGroup.position.set(0, -0.58, zPos);

      const tire = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.065, 16, 32), tireMat);
      tire.rotation.y = Math.PI / 2;
      wheelGroup.add(tire);

      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.025, 12, 28), chromeMat);
      rim.rotation.y = Math.PI / 2;
      wheelGroup.add(rim);

      // أسلاك العجلة (Spokes)
      for (let i = 0; i < 6; i++) {
        const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.72, 8), chromeMat);
        spoke.rotation.x = (Math.PI / 6) * i;
        wheelGroup.add(spoke);
      }

      return wheelGroup;
    };

    const frontWheel = createBicycleWheel(-0.78);
    const rearWheel = createBicycleWheel(0.78);
    root.add(frontWheel, rearWheel);

    // 2. هيكل الدراجة الهوائية الماسي (Diamond Bicycle Frame)
    const topTube = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 1.05, 12), frameMat);
    topTube.rotation.x = Math.PI / 2;
    topTube.position.set(0, -0.02, -0.12);
    root.add(topTube);

    const downTube = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 1.1, 12), frameMat);
    downTube.rotation.x = Math.PI / 3.1;
    downTube.position.set(0, -0.32, -0.22);
    root.add(downTube);

    const seatTube = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.85, 12), frameMat);
    seatTube.rotation.x = -0.22;
    seatTube.position.set(0, -0.2, 0.32);
    root.add(seatTube);

    const frontFork = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.78, 12), chromeMat);
    frontFork.rotation.x = 0.22;
    frontFork.position.set(0, -0.26, -0.7);
    root.add(frontFork);

    // المقود (Handlebar)
    const handlebar = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.76, 12), chromeMat);
    handlebar.rotation.z = Math.PI / 2;
    handlebar.position.set(0, 0.16, -0.62);
    root.add(handlebar);

    // المقعد (Saddle)
    const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.34), tireMat);
    saddle.position.set(0, 0.18, 0.4);
    root.add(saddle);

    // 3. الشخص الراكب على الدراجة الهوائية (Human Cyclist Rider)
    const riderGroup = new THREE.Group();

    // جذع الدراج المائل للأمام نحو المقود
    const riderTorso = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.72, 0.34), jerseyMat);
    riderTorso.position.set(0, 0.56, 0.12);
    riderTorso.rotation.x = -0.58;
    riderGroup.add(riderTorso);

    // رأس الدراج وخوذة الدراجة الهوائية
    const riderHead = new THREE.Mesh(new THREE.SphereGeometry(0.24, 20, 20), skinMat);
    riderHead.position.set(0, 0.95, -0.18);
    riderGroup.add(riderHead);

    const cycleHelmet = new THREE.Mesh(new THREE.SphereGeometry(0.27, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), helmetMat);
    cycleHelmet.scale.set(0.95, 0.85, 1.25);
    cycleHelmet.position.set(0, 1.0, -0.18);
    riderGroup.add(cycleHelmet);

    // ذراعا الدراج الممسكتان بالمقود
    const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.68, 12), skinMat);
    leftArm.position.set(-0.28, 0.48, -0.32);
    leftArm.rotation.x = -1.05;
    riderGroup.add(leftArm);

    const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.68, 12), skinMat);
    rightArm.position.set(0.28, 0.48, -0.32);
    rightArm.rotation.x = -1.05;
    riderGroup.add(rightArm);

    // أرجل الدراج المتحركة على الدواسات
    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(-0.18, 0.22, 0.32);
    const leftThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.09, 0.46, 12), shortsMat);
    leftThigh.position.set(0, -0.2, -0.12);
    leftThigh.rotation.x = 0.5;
    const leftCalf = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.07, 0.44, 12), skinMat);
    leftCalf.position.set(0, -0.52, -0.18);
    leftLegGroup.add(leftThigh, leftCalf);
    riderGroup.add(leftLegGroup);

    const rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(0.18, 0.22, 0.32);
    const rightThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.09, 0.46, 12), shortsMat);
    rightThigh.position.set(0, -0.2, -0.12);
    rightThigh.rotation.x = 0.5;
    const rightCalf = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.07, 0.44, 12), skinMat);
    rightCalf.position.set(0, -0.52, -0.18);
    rightLegGroup.add(rightThigh, rightCalf);
    riderGroup.add(rightLegGroup);

    root.add(riderGroup);

    const customTick = (elapsed, isMoving) => {
      const speed = isMoving ? 10.0 : 4.2;
      const pedalAngle = elapsed * speed;
      frontWheel.rotation.x = -pedalAngle * 1.3;
      rearWheel.rotation.x = -pedalAngle * 1.3;

      leftLegGroup.rotation.x = Math.sin(pedalAngle) * 0.45;
      rightLegGroup.rotation.x = -Math.sin(pedalAngle) * 0.45;
    };

    return { scene: root, customTick };
  }

  /**
   * 5. بناء مجسم السيارة الرياضية الحقيقية ثلاثية الأبعاد (Real 3D Sports Car - سيارة)
   * تستخدم في حال عدم توفر شبكة لفك ضغط Draco أو كبديل فوري مطابق للسيارة الرياضية
   */
  buildRealSportsCar() {
    const root = new THREE.Group();

    const carPaintMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      metalness: 0.85,
      roughness: 0.14
    });
    const cabinGlassMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.95,
      roughness: 0.05
    });
    const carbonMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.6,
      roughness: 0.35
    });
    const headlightMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x38bdf8,
      emissiveIntensity: 2.0
    });
    const taillightMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xdc2626,
      emissiveIntensity: 2.2
    });
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      metalness: 0.9,
      roughness: 0.15
    });

    // جسم السيارة الرئيسي (Chassis pointing to -Z)
    const lowerChassis = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.38, 2.75), carPaintMat);
    lowerChassis.position.set(0, -0.18, 0);
    root.add(lowerChassis);

    // مقدمة السيارة الانسيابية (-Z)
    const frontHood = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.28, 0.95), carPaintMat);
    frontHood.position.set(0, -0.16, -1.05);
    frontHood.rotation.x = 0.14;
    root.add(frontHood);

    // المقصورة الزجاجية (Cabin)
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.42, 1.35), cabinGlassMat);
    cabin.position.set(0, 0.18, 0.12);
    root.add(cabin);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.08, 0.95), carPaintMat);
    roof.position.set(0, 0.4, 0.15);
    root.add(roof);

    // الجناح الرياضي الخلفي (Rear Spoiler at +Z)
    const spoilerWing = new THREE.Mesh(new THREE.BoxGeometry(1.34, 0.07, 0.28), carbonMat);
    spoilerWing.position.set(0, 0.26, 1.24);
    root.add(spoilerWing);

    // المصابيح الأمامية LED (-Z) والخلفية (+Z)
    const leftLight = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.09, 0.08), headlightMat);
    leftLight.position.set(-0.46, -0.12, -1.48);
    const rightLight = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.09, 0.08), headlightMat);
    rightLight.position.set(0.46, -0.12, -1.48);
    root.add(leftLight, rightLight);

    const rearTailLight = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.1, 0.06), taillightMat);
    rearTailLight.position.set(0, -0.08, 1.38);
    root.add(rearTailLight);

    // العجلات الأربع الدوارة
    const wheels = [];
    const wheelPositions = [
      [-0.7, -0.34, -0.86],
      [0.7, -0.34, -0.86],
      [-0.7, -0.34, 0.86],
      [0.7, -0.34, 0.86]
    ];
    wheelPositions.forEach(([wx, wy, wz]) => {
      const wg = new THREE.Group();
      wg.position.set(wx, wy, wz);
      const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.22, 24), carbonMat);
      tire.rotation.z = Math.PI / 2;
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.24, 16), rimMat);
      hub.rotation.z = Math.PI / 2;
      wg.add(tire, hub);
      wheels.push(wg);
      root.add(wg);
    });

    const customTick = (elapsed, isMoving) => {
      const spin = elapsed * (isMoving ? 12.0 : 3.5);
      wheels.forEach((w) => {
        w.rotation.x = -spin;
      });
    };

    return { scene: root, customTick };
  }

  /**
   * 6. بناء مجسم الروبوت الذكي ثلاثي الأبعاد الحقيقي (PBR Articulated Mecha Robot - روبوت)
   * محفوظ كما هو تماماً بناءً على إعجاب المستخدم ("الروبوت و المقاتلة مثاليين لا تغيرهما وضعهما وحجمهما مثالي")
   */
  buildRealSmartRobot() {
    const root = new THREE.Group();

    const armorMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.75,
      roughness: 0.22
    });
    const darkJointMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.35
    });
    const glowCyanMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      emissive: 0x38bdf8,
      emissiveIntensity: 1.8,
      roughness: 0.1
    });
    const goldAccentMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.85,
      roughness: 0.2
    });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.25, 0.75), armorMat);
    torso.position.y = 0.2;
    root.add(torso);

    const coreRing = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.1, 24), goldAccentMat);
    coreRing.rotation.x = Math.PI / 2;
    coreRing.position.set(0, 0.3, -0.36);
    root.add(coreRing);

    const coreGlow = new THREE.Mesh(new THREE.SphereGeometry(0.18, 20, 20), glowCyanMat);
    coreGlow.position.set(0, 0.3, -0.39);
    root.add(coreGlow);

    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.18, 0);

    const headBox = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.68, 0.72), armorMat);
    headGroup.add(headBox);

    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.24, 0.08), darkJointMat);
    visor.position.set(0, 0.04, -0.35);
    headGroup.add(visor);

    const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), glowCyanMat);
    leftEye.position.set(-0.17, 0.04, -0.39);
    headGroup.add(leftEye);

    const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), glowCyanMat);
    rightEye.position.set(0.17, 0.04, -0.39);
    headGroup.add(rightEye);

    const antennaStem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.35, 12), goldAccentMat);
    antennaStem.position.set(0, 0.48, 0);
    headGroup.add(antennaStem);

    const antennaTip = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 16), glowCyanMat);
    antennaTip.position.set(0, 0.68, 0);
    headGroup.add(antennaTip);

    root.add(headGroup);

    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.78, 0.68, 0);
    const leftShoulder = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), goldAccentMat);
    const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.12, 0.95, 16), armorMat);
    leftArm.position.y = -0.45;
    const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 16), darkJointMat);
    leftHand.position.y = -0.95;
    leftArmGroup.add(leftShoulder, leftArm, leftHand);
    root.add(leftArmGroup);

    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.78, 0.68, 0);
    const rightShoulder = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), goldAccentMat);
    const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.12, 0.95, 16), armorMat);
    rightArm.position.y = -0.45;
    const rightHand = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 16), darkJointMat);
    rightHand.position.y = -0.95;
    rightArmGroup.add(rightShoulder, rightArm, rightHand);
    root.add(rightArmGroup);

    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(-0.32, -0.42, 0);
    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.85, 0.36), darkJointMat);
    leftLeg.position.y = -0.4;
    const leftFoot = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.22, 0.58), armorMat);
    leftFoot.position.set(0, -0.85, -0.08);
    leftLegGroup.add(leftLeg, leftFoot);
    root.add(leftLegGroup);

    const rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(0.32, -0.42, 0);
    const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.85, 0.36), darkJointMat);
    rightLeg.position.y = -0.4;
    const rightFoot = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.22, 0.58), armorMat);
    rightFoot.position.set(0, -0.85, -0.08);
    rightLegGroup.add(rightLeg, rightFoot);
    root.add(rightLegGroup);

    root.scale.set(0.95, 0.95, 0.95);

    const customTick = (elapsed, isMoving) => {
      const speed = isMoving ? 9.0 : 2.2;
      const amp = isMoving ? 0.65 : 0.08;
      leftLegGroup.rotation.x = Math.sin(elapsed * speed) * amp;
      rightLegGroup.rotation.x = -Math.sin(elapsed * speed) * amp;
      leftArmGroup.rotation.x = -Math.sin(elapsed * speed) * (amp * 0.85);
      rightArmGroup.rotation.x = Math.sin(elapsed * speed) * (amp * 0.85);
      headGroup.rotation.y = Math.sin(elapsed * 1.8) * 0.15;
    };

    return { scene: root, customTick };
  }

  /**
   * 7. بناء مجسم المقاتلة الفضائية النفاثة ثلاثي الأبعاد الحقيقي (Futuristic Delta Starfighter - طائرة)
   * محفوظ كما هو تماماً بناءً على إعجاب المستخدم ("الروبوت و المقاتلة مثاليين لا تغيرهما وضعهما وحجمهما مثالي")
   */
  buildRealStarfighter() {
    const root = new THREE.Group();

    const hullMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      metalness: 0.8,
      roughness: 0.2
    });
    const darkTrimMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.9,
      roughness: 0.25
    });
    const cockpitGlassMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x0369a1,
      emissiveIntensity: 0.6,
      metalness: 0.95,
      roughness: 0.05
    });
    const plasmaGlowMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0ea5e9,
      emissiveIntensity: 2.5,
      roughness: 0.1
    });
    const accentRedMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      metalness: 0.6,
      roughness: 0.3
    });

    const noseCone = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.65, 24), hullMat);
    noseCone.rotation.x = -Math.PI / 2;
    noseCone.position.set(0, 0, -1.05);
    root.add(noseCone);

    const midBody = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.52, 1.5, 24), hullMat);
    midBody.rotation.x = Math.PI / 2;
    midBody.position.set(0, 0, 0.52);
    root.add(midBody);

    const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.32, 24, 16), cockpitGlassMat);
    canopy.scale.set(0.85, 0.65, 2.1);
    canopy.position.set(0, 0.24, -0.25);
    root.add(canopy);

    const wingShape = new THREE.BoxGeometry(3.1, 0.09, 1.15);
    const mainWing = new THREE.Mesh(wingShape, hullMat);
    mainWing.position.set(0, -0.04, 0.45);
    root.add(mainWing);

    const leftTip = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.28, 1.3), accentRedMat);
    leftTip.position.set(-1.55, 0.04, 0.48);
    root.add(leftTip);

    const rightTip = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.28, 1.3), accentRedMat);
    rightTip.position.set(1.55, 0.04, 0.48);
    root.add(rightTip);

    const leftFin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.72, 0.68), darkTrimMat);
    leftFin.position.set(-0.42, 0.42, 0.92);
    leftFin.rotation.z = 0.22;
    root.add(leftFin);

    const rightFin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.72, 0.68), darkTrimMat);
    rightFin.position.set(0.42, 0.42, 0.92);
    rightFin.rotation.z = -0.22;
    root.add(rightFin);

    const leftEngine = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.55, 20), darkTrimMat);
    leftEngine.rotation.x = Math.PI / 2;
    leftEngine.position.set(-0.24, 0, 1.35);
    root.add(leftEngine);

    const rightEngine = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.55, 20), darkTrimMat);
    rightEngine.rotation.x = Math.PI / 2;
    rightEngine.position.set(0.24, 0, 1.35);
    root.add(rightEngine);

    const leftFlame = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.65, 16), plasmaGlowMat);
    leftFlame.rotation.x = Math.PI / 2;
    leftFlame.position.set(-0.24, 0, 1.75);
    root.add(leftFlame);

    const rightFlame = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.65, 16), plasmaGlowMat);
    rightFlame.rotation.x = Math.PI / 2;
    rightFlame.position.set(0.24, 0, 1.75);
    root.add(rightFlame);

    const customTick = (elapsed, isMoving) => {
      const flameScale = (isMoving ? 1.35 : 0.85) + Math.sin(elapsed * 22) * 0.2;
      leftFlame.scale.set(1, flameScale, 1);
      rightFlame.scale.set(1, flameScale, 1);
      root.rotation.z = Math.sin(elapsed * 2.5) * 0.08;
    };

    return { scene: root, customTick };
  }

  /**
   * تحميل أو بناء المجسم ثلاثي الأبعاد
   */
  async loadModelAsset(modelId) {
    // دعم التوافق مع المعرفات السابقة (مثل parrot -> flying_bird)
    const normalizedId = modelId === 'parrot' ? 'flying_bird' : modelId;
    let info = AVAILABLE_3D_MODELS.find(m => m.id === normalizedId);
    if (!info) {
      info = AVAILABLE_3D_MODELS[0];
    }

    if (info.proceduralType === 'luxury_arrow') {
      const built = this.buildLuxurySmartArrow();
      return this.wrapSceneWithCompass(built.scene, info, [], built.customTick);
    }
    if (info.proceduralType === 'tactical_explorer') {
      const built = this.buildRealTacticalExplorer();
      return this.wrapSceneWithCompass(built.scene, info, [], built.customTick);
    }
    if (info.proceduralType === 'human_walker') {
      const built = this.buildRealHumanWalker();
      return this.wrapSceneWithCompass(built.scene, info, [], built.customTick);
    }
    if (info.proceduralType === 'human_cyclist') {
      const built = this.buildRealHumanCyclist();
      return this.wrapSceneWithCompass(built.scene, info, [], built.customTick);
    }
    if (info.proceduralType === 'smart_robot') {
      const built = this.buildRealSmartRobot();
      return this.wrapSceneWithCompass(built.scene, info, [], built.customTick);
    }
    if (info.proceduralType === 'starfighter') {
      const built = this.buildRealStarfighter();
      return this.wrapSceneWithCompass(built.scene, info, [], built.customTick);
    }

    if (this.gltfCache.has(info.id)) {
      return this.instantiateFromCache(info);
    }

    return new Promise((resolve) => {
      this.loader.load(
        info.file,
        (gltf) => {
          this.gltfCache.set(info.id, {
            scene: gltf.scene,
            animations: gltf.animations || []
          });
          resolve(this.instantiateFromCache(info));
        },
        undefined,
        (err) => {
          console.warn(`فشل تحميل مجسم ${info.file}:`, err);
          if (info.fallbackProcedural === 'sports_car') {
            const builtCar = this.buildRealSportsCar();
            resolve(this.wrapSceneWithCompass(builtCar.scene, info, [], builtCar.customTick));
          } else {
            const builtArrow = this.buildLuxurySmartArrow();
            resolve(this.wrapSceneWithCompass(builtArrow.scene, AVAILABLE_3D_MODELS[0], [], builtArrow.customTick));
          }
        }
      );
    });
  }

  instantiateFromCache(info) {
    const cached = this.gltfCache.get(info.id);
    const clonedScene = SkeletonUtils.clone(cached.scene);
    const animations = cached.animations || [];

    // إذا كانت السيارة المحملة من GLB، نضيف دوراناً سلساً للعجلات
    let customTick = null;
    if (info.id === 'car_ferrari') {
      const wheelMeshes = [];
      clonedScene.traverse((child) => {
        if (child.name && /wheel/i.test(child.name)) {
          wheelMeshes.push(child);
        }
      });
      if (wheelMeshes.length > 0) {
        customTick = (elapsed, isMoving) => {
          const spin = elapsed * (isMoving ? 10 : 3);
          wheelMeshes.forEach((w) => {
            w.rotation.x = -spin;
          });
        };
      }
    }

    return this.wrapSceneWithCompass(clonedScene, info, animations, customTick);
  }

  /**
   * تغليف المجسم وتوسيطه وضبط حجمه بدقة ليظهر بوضوح تام داخل إطار 136x136 دون خروج عن الحدود
   */
  wrapSceneWithCompass(clonedScene, info, animations = [], customTick = null) {
    const wrapper = new THREE.Group();
    const innerHolder = new THREE.Group();

    clonedScene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(clonedScene);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;

    // ضبط القياس داخل الكانفاس (2.65 وحدة قياسية) بحيث لا يخرج أي مجسم خارج حدود الكانفاس
    const targetScale = (2.65 / maxDim) * (info.scale || 1.0);

    clonedScene.position.sub(center);

    innerHolder.add(clonedScene);
    if (info.rotationOffset) {
      innerHolder.rotation.set(
        info.rotationOffset.x || 0,
        info.rotationOffset.y || 0,
        info.rotationOffset.z || 0
      );
    }
    if (info.yOffset) {
      innerHolder.position.y += info.yOffset;
    }

    innerHolder.scale.set(targetScale, targetScale, targetScale);
    wrapper.add(innerHolder);

    clonedScene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    // حلقة بوصلة أرضية ثلاثية الأبعاد واضحة أسفل المجسم
    const ringGeo = new THREE.RingGeometry(1.15, 1.38, 36);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x0ea5e9,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.55
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.y = -1.15;
    wrapper.add(ringMesh);

    // مؤشر أمامي أخضر بارز يشير دائماً إلى اتجاه المستخدم الحقيقي (-Z)
    const pointerGeo = new THREE.ConeGeometry(0.28, 0.55, 16);
    pointerGeo.rotateX(-Math.PI / 2);
    const pointerMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const pointerMesh = new THREE.Mesh(pointerGeo, pointerMat);
    pointerMesh.position.set(0, -1.1, -1.52);
    wrapper.add(pointerMesh);

    let mixer = null;
    const actions = {};
    if (animations.length > 0) {
      mixer = new THREE.AnimationMixer(clonedScene);
      animations.forEach((clip) => {
        actions[clip.name] = mixer.clipAction(clip);
      });
    }

    return {
      wrapper,
      clonedScene,
      mixer,
      actions,
      info,
      customTick
    };
  }

  applyCharacterMotionState(modelBundle, isMoving = false, speedKmh = 0) {
    if (!modelBundle || !modelBundle.mixer) return;
    const { actions, info } = modelBundle;
    const actionKeys = Object.keys(actions);
    if (actionKeys.length === 0) return;

    let targetClipName = isMoving ? (info.moveClip || info.idleClip) : (info.idleClip || info.moveClip);
    if (isMoving && speedKmh > 20 && info.fastClip && actions[info.fastClip]) {
      targetClipName = info.fastClip;
    }

    const targetAction = actions[targetClipName] || actions[actionKeys[0]];
    if (!targetAction) return;

    actionKeys.forEach((key) => {
      const act = actions[key];
      if (act === targetAction) {
        if (!act.isRunning()) {
          act.reset().fadeIn(0.25).play();
        }
        act.timeScale = isMoving ? (info.moveTimeScale || 1.25) : (info.idleTimeScale || 0.85);
      } else if (act.isRunning()) {
        act.fadeOut(0.25);
      }
    });
  }

  /**
   * إنشاء WebGL Canvas متوازن وواضح (136x136 بكسل) لموقع المستخدم على الخريطة
   */
  createMarker3DCanvas(modelId = 'arrow', size = 136) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    canvas.className = 'three-marker-canvas';

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 3.8, 4.4);
    camera.lookAt(0, -0.05, 0);

    const ambientLight = new THREE.AmbientLight(0xffffff, 2.1);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.7);
    dirLight1.position.set(5, 10, 7);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 1.5);
    dirLight2.position.set(-5, 4, -5);
    scene.add(dirLight2);

    let currentBundle = null;
    let animId = null;
    let targetHeadingRad = 0;
    let currentHeadingRad = 0;
    let isMovingState = false;
    let currentSpeedKmh = 0;

    this.loadModelAsset(modelId).then((bundle) => {
      currentBundle = bundle;
      scene.add(currentBundle.wrapper);
      this.applyCharacterMotionState(currentBundle, isMovingState, currentSpeedKmh);
    });

    const clock = new THREE.Clock();
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      if (currentBundle) {
        if (currentBundle.mixer) {
          currentBundle.mixer.update(delta);
        }
        if (currentBundle.customTick) {
          currentBundle.customTick(elapsed, isMovingState);
        }

        let diff = targetHeadingRad - currentHeadingRad;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        currentHeadingRad += diff * Math.min(1, delta * 10);

        currentBundle.wrapper.rotation.y = currentHeadingRad;
        currentBundle.wrapper.position.y = Math.sin(elapsed * 2.5) * 0.06;
      }

      renderer.render(scene, camera);
    };

    animate();

    return {
      canvas,
      destroy: () => {
        if (animId) cancelAnimationFrame(animId);
        renderer.dispose();
      },
      updateModel: async (newModelId) => {
        if (currentBundle) {
          scene.remove(currentBundle.wrapper);
        }
        currentBundle = await this.loadModelAsset(newModelId);
        currentBundle.wrapper.rotation.y = currentHeadingRad;
        scene.add(currentBundle.wrapper);
        this.applyCharacterMotionState(currentBundle, isMovingState, currentSpeedKmh);
      },
      setHeading: (bearingDeg) => {
        if (typeof bearingDeg === 'number' && !isNaN(bearingDeg)) {
          targetHeadingRad = (-bearingDeg * Math.PI) / 180;
        }
      },
      setMotionState: (isMoving, speedKmh = 0) => {
        if (isMovingState !== isMoving || Math.abs(currentSpeedKmh - speedKmh) > 8) {
          isMovingState = isMoving;
          currentSpeedKmh = speedKmh;
          this.applyCharacterMotionState(currentBundle, isMovingState, currentSpeedKmh);
        }
      }
    };
  }

  /**
   * معاينة تفاعلية 360 درجة كبيرة وواضحة في نافذة اختيار الشخصيات
   */
  setupPreviewCanvas(canvas, modelId = 'arrow') {
    const width = canvas.clientWidth || 420;
    const height = canvas.clientHeight || 240;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    camera.position.set(0, 2.3, 4.8);
    camera.lookAt(0, -0.05, 0);

    const ambientLight = new THREE.AmbientLight(0xffffff, 2.0);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.7);
    sunLight.position.set(5, 8, 5);
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x0284c7, 1.6);
    fillLight.position.set(-5, 2, -3);
    scene.add(fillLight);

    let currentBundle = null;
    let animId = null;
    let isDragging = false;
    let prevMouseX = 0;
    let manualRotation = 0.45;

    this.loadModelAsset(modelId).then((bundle) => {
      currentBundle = bundle;
      scene.add(currentBundle.wrapper);
      this.applyCharacterMotionState(currentBundle, true, 16);
    });

    canvas.onmousedown = (e) => {
      isDragging = true;
      prevMouseX = e.clientX;
    };
    window.onmouseup = () => { isDragging = false; };
    window.onmousemove = (e) => {
      if (isDragging && currentBundle) {
        const delta = e.clientX - prevMouseX;
        manualRotation += delta * 0.015;
        prevMouseX = e.clientX;
      }
    };

    canvas.ontouchstart = (e) => {
      if (e.touches.length === 1) {
        isDragging = true;
        prevMouseX = e.touches[0].clientX;
      }
    };
    window.ontouchend = () => { isDragging = false; };
    window.ontouchmove = (e) => {
      if (isDragging && currentBundle && e.touches.length === 1) {
        const delta = e.touches[0].clientX - prevMouseX;
        manualRotation += delta * 0.015;
        prevMouseX = e.touches[0].clientX;
      }
    };

    const clock = new THREE.Clock();
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      if (currentBundle) {
        if (currentBundle.mixer) {
          currentBundle.mixer.update(delta);
        }
        if (currentBundle.customTick) {
          currentBundle.customTick(elapsed, true);
        }
        currentBundle.wrapper.rotation.y = manualRotation;
        currentBundle.wrapper.position.y = Math.sin(elapsed * 2.0) * 0.06;
      }

      renderer.render(scene, camera);
    };

    animate();

    return {
      destroy: () => {
        if (animId) cancelAnimationFrame(animId);
        renderer.dispose();
      },
      changeModel: async (newId) => {
        if (currentBundle) scene.remove(currentBundle.wrapper);
        currentBundle = await this.loadModelAsset(newId);
        scene.add(currentBundle.wrapper);
        this.applyCharacterMotionState(currentBundle, true, 16);
      }
    };
  }
}

export const threeEngine = new ThreeEngine();
