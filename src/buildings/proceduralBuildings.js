import * as THREE from 'three';

/**
 * Procedural Architectural Generator inspired by CityRT's `catalog.json`
 * Generates 4 distinct architectural districts + Central Park Plaza:
 * 1. European (Haussmann mansards, corner rotundas, Dutch gables, Belfry Clock Tower, Windmill)
 * 2. Arabic (Riad courtyards, Mashrabiya wooden bays, Turquoise/Gold domes, Pishtaq portals, Minaret)
 * 3. Japanese (Machiya townhouses, curved Kawara roofs, 5-story Pagoda, Red Torii gates, Lanterns)
 * 4. Metropolis / Cyberpunk (Art-Deco stepped towers, glass high-rises, neon billboards, Spiral Garage)
 */
export class ProceduralCityBuilder {
  constructor(terrain, signGen) {
    this.terrain = terrain;
    this.signGen = signGen;
    this.buildings = [];
    this.colliders = [];
    this.animatedProps = [];
    this.windowMaterials = [];
    this.streetLightMaterials = [];
    this.streetLights = [];

    this.initSharedMaterials();
  }

  initSharedMaterials() {
    // Dynamic window material sets (warm interior glow at evening/night)
    this.windowLitMats = [0xffe4a0, 0xffcc70, 0xfff3d1, 0x9be8ff].map(
      (hex) =>
        new THREE.MeshStandardMaterial({
          color: 0x2a3848,
          roughness: 0.2,
          metalness: 0.6,
          emissive: new THREE.Color(hex),
          emissiveIntensity: 0.0
        })
    );
    this.windowDarkMat = new THREE.MeshStandardMaterial({
      color: 0x243240,
      roughness: 0.22,
      metalness: 0.65
    });

    this.windowMaterials.push(...this.windowLitMats);

    this.lampGlowMat = new THREE.MeshStandardMaterial({
      color: 0xfff0c2,
      emissive: new THREE.Color(0xffb84d),
      emissiveIntensity: 0.2
    });
    this.streetLightMaterials.push(this.lampGlowMat);

    this.darkIronMat = new THREE.MeshStandardMaterial({
      color: 0x2a2320,
      roughness: 0.55,
      metalness: 0.45
    });
  }

  buildCity() {
    const root = new THREE.Group();
    root.name = 'ProceduralCityArchitecture';

    // Define city blocks aligned with roadsX [-120, -60, 0, 60, 120] and roadsZ [-120, -75, 25, 85, 135]
    // 1. European District (NW: x < 0, z < 20)
    this.populateEuropeanDistrict(root);

    // 2. Arabic District (NE: x > 0, z < 20)
    this.populateArabicDistrict(root);

    // 3. Japanese District (SW: x < -5, z > 28)
    this.populateJapaneseDistrict(root);

    // 4. Metropolis & Cyberpunk District (SE: x > 5, z > 28)
    this.populateMetropolisDistrict(root);

    // 5. Central Park Oasis, Fountain, Pergolas & Torii Walk (x in [-52..52], z in [30..80])
    this.populateCentralParkAndPlaza(root);

    // 6. Streetlamps, Bus Stops, Traffic Lights & Benches along avenues
    this.populateStreetFurniture(root);

    return root;
  }

  /**
   * Helper: checks if footprint (x, z, w, d) is clear of river water & roads
   */
  canPlaceFootprint(cx, cz, w, d) {
    const hw = w * 0.5 + 1.5;
    const hd = d * 0.5 + 1.5;
    const pts = [
      [cx, cz],
      [cx - hw, cz - hd],
      [cx + hw, cz - hd],
      [cx - hw, cz + hd],
      [cx + hw, cz + hd]
    ];
    for (const [px, pz] of pts) {
      if (this.terrain.waterSDF(px, pz) < 4.2) return false;
      const r = this.terrain.getRoadState(px, pz);
      if (r.isRoad || r.isSidewalk) return false;
    }
    return true;
  }

  registerBuilding(meshGroup, meta) {
    this.buildings.push({
      group: meshGroup,
      ...meta
    });
    if (meta.collider) {
      this.colliders.push(meta.collider);
    }
  }

  /**
   * Adds procedural window grids onto a rectangular building wing
   */
  addWindowGrid(parent, width, height, depth, floors, style = 'european') {
    const winW = style === 'arabic' ? 0.85 : 1.05;
    const winH = style === 'arabic' ? 1.35 : 1.45;
    const floorH = height / floors;
    const colsX = Math.max(1, Math.floor((width - 1.6) / 2.3));
    const colsZ = Math.max(1, Math.floor((depth - 1.6) / 2.3));

    const winGeo = new THREE.BoxGeometry(winW, winH, 0.12);

    for (let f = 1; f < floors; f++) {
      const y = (f + 0.5) * floorH;

      // Front & Back facades (along X)
      for (let ix = 0; ix < colsX; ix++) {
        const wx = -((colsX - 1) * 2.2) * 0.5 + ix * 2.2;
        for (const side of [-1, 1]) {
          const mat =
            (ix + f * 3 + (side > 0 ? 1 : 0)) % 5 === 0
              ? this.windowDarkMat
              : this.windowLitMats[(ix + f) % this.windowLitMats.length];
          const win = new THREE.Mesh(winGeo, mat);
          win.position.set(wx, y, side * (depth * 0.5 + 0.03));
          parent.add(win);
        }
      }

      // Left & Right facades (along Z)
      const sideGeo = new THREE.BoxGeometry(0.12, winH, winW);
      for (let iz = 0; iz < colsZ; iz++) {
        const wz = -((colsZ - 1) * 2.2) * 0.5 + iz * 2.2;
        for (const side of [-1, 1]) {
          const mat =
            (iz + f * 2) % 4 === 0
              ? this.windowDarkMat
              : this.windowLitMats[(iz + f + 1) % this.windowLitMats.length];
          const win = new THREE.Mesh(sideGeo, mat);
          win.position.set(side * (width * 0.5 + 0.03), y, wz);
          parent.add(win);
        }
      }
    }
  }

  /**
   * 1. EUROPEAN DISTRICT (NW): Haussmann Courtyard Blocks, Mansard Roofs, Dutch Gables, Belfry & Windmill
   */
  populateEuropeanDistrict(root) {
    const wallPalette = [0xe8dcc4, 0xd9c5a3, 0xc77d58, 0xdecbb1, 0xc9b296];
    const mansardMat = new THREE.MeshStandardMaterial({ color: 0x454d59, roughness: 0.65, metalness: 0.25 });
    const rustStoneMat = new THREE.MeshStandardMaterial({ color: 0xbdae96, roughness: 0.85 });
    const copperMat = new THREE.MeshStandardMaterial({ color: 0x4e8c75, roughness: 0.5, metalness: 0.35 });

    // European Landmark 1: Neo-Gothic Town Hall & Belfry Clock Tower (`Ратуша с беффруа`)
    const belfryX = -90;
    const belfryZ = -98;
    if (this.canPlaceFootprint(belfryX, belfryZ, 18, 14)) {
      const bGroup = new THREE.Group();
      const baseY = this.terrain.getHeightAt(belfryX, belfryZ);
      bGroup.position.set(belfryX, baseY, belfryZ);

      const hallMat = new THREE.MeshStandardMaterial({ color: 0xd8c8ae, roughness: 0.8 });
      const hall = new THREE.Mesh(new THREE.BoxGeometry(18, 11, 12), hallMat);
      hall.position.y = 5.5;
      hall.castShadow = true;
      hall.receiveShadow = true;
      bGroup.add(hall);
      this.addWindowGrid(bGroup, 18, 11, 12, 3, 'european');

      // Steep pitched roof
      const roofGeo = new THREE.ConeGeometry(11.5, 5.5, 4);
      roofGeo.rotateY(Math.PI / 4);
      const roof = new THREE.Mesh(roofGeo, mansardMat);
      roof.scale.set(1.15, 1, 0.78);
      roof.position.y = 13.7;
      roof.castShadow = true;
      bGroup.add(roof);

      // Central Belfry Clock Tower (`Беффруа с часами`)
      const tower = new THREE.Mesh(new THREE.BoxGeometry(5.2, 26, 5.2), hallMat);
      tower.position.set(0, 13, 1.5);
      tower.castShadow = true;
      bGroup.add(tower);

      const spire = new THREE.Mesh(new THREE.ConeGeometry(3.8, 9.5, 8), copperMat);
      spire.position.set(0, 30.7, 1.5);
      spire.castShadow = true;
      bGroup.add(spire);

      // Golden clock faces on 4 sides
      const clockMat = new THREE.MeshStandardMaterial({
        color: 0xfff5d6,
        emissive: 0xffd166,
        emissiveIntensity: 0.5
      });
      for (const [dx, dz, ry] of [
        [0, 2.68, 0],
        [0, -2.68, Math.PI],
        [2.68, 0, Math.PI / 2],
        [-2.68, 0, -Math.PI / 2]
      ]) {
        const clock = new THREE.Mesh(new THREE.CircleGeometry(1.3, 16), clockMat);
        clock.position.set(dx, 21.5, 1.5 + dz);
        clock.rotation.y = ry;
        bGroup.add(clock);
      }

      // Signboard
      const sign = new THREE.Mesh(
        new THREE.BoxGeometry(4.8, 1.2, 0.15),
        this.signGen.getSignMaterial('european', 7)
      );
      sign.position.set(0, 3.6, 6.1);
      bGroup.add(sign);

      root.add(bGroup);
      this.registerBuilding(bGroup, {
        name: 'دار البلدية وبرج الساعة (Belfry Town Hall)',
        style: 'european',
        door: new THREE.Vector3(belfryX, baseY, belfryZ + 8),
        collider: { minX: belfryX - 9, maxX: belfryX + 9, minZ: belfryZ - 6, maxZ: belfryZ + 6 }
      });
    }

    // European Landmark 2: Dutch Canal Windmill (`Мельница у канала`) near river bank
    const millX = -88;
    const millZ = -44;
    if (this.terrain.waterSDF(millX, millZ) > 4.0) {
      const mGroup = new THREE.Group();
      const baseY = this.terrain.getHeightAt(millX, millZ);
      mGroup.position.set(millX, baseY, millZ);

      const brickMat = new THREE.MeshStandardMaterial({ color: 0xa8523b, roughness: 0.85 });
      const body = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 4.2, 12, 8), brickMat);
      body.position.y = 6;
      body.castShadow = true;
      mGroup.add(body);

      const cap = new THREE.Mesh(new THREE.SphereGeometry(3.0, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.6), mansardMat);
      cap.position.y = 11.8;
      mGroup.add(cap);

      // Rotating windmill sails
      const sailsPivot = new THREE.Group();
      sailsPivot.position.set(0, 11.2, 3.1);
      const bladeMat = new THREE.MeshStandardMaterial({ color: 0xf3ede0, roughness: 0.7 });
      for (let i = 0; i < 4; i++) {
        const armGroup = new THREE.Group();
        armGroup.rotation.z = (i * Math.PI) / 2;
        const spar = new THREE.Mesh(new THREE.BoxGeometry(0.22, 8.5, 0.22), this.darkIronMat);
        spar.position.y = 4.2;
        armGroup.add(spar);
        const sail = new THREE.Mesh(new THREE.BoxGeometry(1.3, 7.2, 0.06), bladeMat);
        sail.position.set(0.65, 4.5, 0.08);
        armGroup.add(sail);
        sailsPivot.add(armGroup);
      }
      mGroup.add(sailsPivot);
      this.animatedProps.push({
        type: 'windmill',
        mesh: sailsPivot,
        speed: 0.85
      });

      root.add(mGroup);
      this.registerBuilding(mGroup, {
        name: 'طاحونة القناة الهولندية (Dutch Canal Windmill)',
        style: 'european',
        door: new THREE.Vector3(millX, baseY, millZ + 5.5),
        collider: { minX: millX - 4.2, maxX: millX + 4.2, minZ: millZ - 4.2, maxZ: millZ + 4.2 }
      });
    }

    // Generate stretched L-shape, U-shape & Haussmann blocks across NW blocks
    const euroLots = [
      { x: -148, z: -98, w: 14, d: 10, floors: 4, wing: 'L', signIdx: 0, title: 'مبنى هوسمان ومخبز (Haussmann Boulangerie)' },
      { x: -148, z: -50, w: 13, d: 11, floors: 5, wing: 'none', signIdx: 1, title: 'مقهى باريس الركني (Café de Paris)' },
      { x: -92, z: -145, w: 16, d: 11, floors: 4, wing: 'U', signIdx: 2, title: 'حي الفناء الأوروبي (European Courtyard Block)' },
      { x: -32, z: -145, w: 15, d: 10, floors: 5, wing: 'L', signIdx: 3, title: 'فندق بيل إيبوك (Grand Hôtel Belle Époque)' },
      { x: -32, z: -98, w: 16, d: 12, floors: 4, wing: 'none', signIdx: 4, title: 'تراتوريا وساحة أوروبية (Trattoria & Arcade)' },
      { x: -90, z: -4, w: 14, d: 10, floors: 4, wing: 'none', signIdx: 5, title: 'مكتبة القناة الهولندية (Canal Bookshop)' },
      { x: -30, z: 0, w: 14, d: 10, floors: 5, wing: 'L', signIdx: 6, title: 'غاليري الفنون (Galerie d’Art)' }
    ];

    euroLots.forEach((lot, idx) => {
      if (!this.canPlaceFootprint(lot.x, lot.z, lot.w, lot.d)) return;
      const baseY = this.terrain.getHeightAt(lot.x, lot.z);
      const group = new THREE.Group();
      group.position.set(lot.x, baseY, lot.z);

      const h = lot.floors * 3.3;
      const wallMat = new THREE.MeshStandardMaterial({
        color: wallPalette[idx % wallPalette.length],
        roughness: 0.82
      });

      // Rusticated stone ground floor podium
      const podium = new THREE.Mesh(new THREE.BoxGeometry(lot.w + 0.3, 3.4, lot.d + 0.3), rustStoneMat);
      podium.position.y = 1.7;
      podium.castShadow = true;
      podium.receiveShadow = true;
      group.add(podium);

      // Main upper body
      const body = new THREE.Mesh(new THREE.BoxGeometry(lot.w, h, lot.d), wallMat);
      body.position.y = h * 0.5;
      body.castShadow = true;
      body.receiveShadow = true;
      group.add(body);
      this.addWindowGrid(group, lot.w, h, lot.d, lot.floors, 'european');

      // Continuous wrought-iron balcony band on 2nd and top floor (`сквозные балконы`)
      const balc = new THREE.Mesh(new THREE.BoxGeometry(lot.w + 0.6, 0.35, lot.d + 0.6), this.darkIronMat);
      balc.position.y = 3.5;
      group.add(balc);

      // Zinc Mansard roof
      const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.hypot(lot.w, lot.d) * 0.52, 3.2, 4), mansardMat);
      roof.rotation.y = Math.PI / 4;
      roof.scale.set(lot.w / 12, 1, lot.d / 12);
      roof.position.y = h + 1.6;
      roof.castShadow = true;
      group.add(roof);

      // Attached Wing (`Shift + LMB — пристроить крыло`)
      if (lot.wing === 'L' || lot.wing === 'U') {
        const wingW = 6.5;
        const wingD = 7.5;
        const wing = new THREE.Mesh(new THREE.BoxGeometry(wingW, h - 2.5, wingD), wallMat);
        wing.position.set(lot.w * 0.5 - wingW * 0.5, (h - 2.5) * 0.5, lot.d * 0.5 + wingD * 0.45);
        wing.castShadow = true;
        group.add(wing);
      }

      // Corner Haussmann Rotunda Dome (`ротонда на углу`)
      if (idx % 2 === 0) {
        const rot = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, h + 1.2, 12), wallMat);
        rot.position.set(lot.w * 0.5, (h + 1.2) * 0.5, lot.d * 0.5);
        rot.castShadow = true;
        group.add(rot);

        const dome = new THREE.Mesh(
          new THREE.SphereGeometry(2.45, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55),
          copperMat
        );
        dome.position.set(lot.w * 0.5, h + 1.2, lot.d * 0.5);
        group.add(dome);
      }

      // Dynamic localized signboard on storefront
      const signMesh = new THREE.Mesh(
        new THREE.BoxGeometry(4.2, 1.05, 0.14),
        this.signGen.getSignMaterial('european', lot.signIdx)
      );
      signMesh.position.set(0, 3.1, lot.d * 0.5 + 0.22);
      group.add(signMesh);

      root.add(group);
      this.registerBuilding(group, {
        name: lot.title,
        style: 'european',
        door: new THREE.Vector3(lot.x, baseY, lot.z + lot.d * 0.5 + 2.2),
        collider: {
          minX: lot.x - lot.w * 0.5,
          maxX: lot.x + lot.w * 0.5,
          minZ: lot.z - lot.d * 0.5,
          maxZ: lot.z + lot.d * 0.5
        }
      });
    });
  }

  /**
   * 2. ARABIC DISTRICT (NE): Riad Courtyards, Carved Mashrabiyas, Turquoise/Gold Domes, Pishtaq & Minaret
   */
  populateArabicDistrict(root) {
    const sandWalls = [0xf2e3c6, 0xe8d2ae, 0xdfc195, 0xf5ead6, 0xd8b486];
    const woodMashrabiyaMat = new THREE.MeshStandardMaterial({ color: 0x5c3824, roughness: 0.75 });
    const turquoiseDomeMat = new THREE.MeshStandardMaterial({ color: 0x1e8896, roughness: 0.35, metalness: 0.25 });
    const goldDomeMat = new THREE.MeshStandardMaterial({ color: 0xd9a738, roughness: 0.3, metalness: 0.65 });
    const tileBlueMat = new THREE.MeshStandardMaterial({ color: 0x1b4d7a, roughness: 0.4 });

    // Arabic Landmark: Grand Domed Souq & Caravanserai (`سوق الزعفران وخان القوافل`)
    const souqX = 90;
    const souqZ = -98;
    if (this.canPlaceFootprint(souqX, souqZ, 20, 16)) {
      const sGroup = new THREE.Group();
      const baseY = this.terrain.getHeightAt(souqX, souqZ);
      sGroup.position.set(souqX, baseY, souqZ);

      const wallMat = new THREE.MeshStandardMaterial({ color: 0xf0dfc0, roughness: 0.82 });

      // Four courtyard wings surrounding an open central Riad fountain court
      const wThick = 4.2;
      const wallH = 9.5;
      const wings = [
        [0, -5.9, 20, wThick],
        [0, 5.9, 20, wThick],
        [-7.9, 0, wThick, 11.8],
        [7.9, 0, wThick, 11.8]
      ];
      for (const [wx, wz, ww, wd] of wings) {
        const wMesh = new THREE.Mesh(new THREE.BoxGeometry(ww, wallH, wd), wallMat);
        wMesh.position.set(wx, wallH * 0.5, wz);
        wMesh.castShadow = true;
        wMesh.receiveShadow = true;
        sGroup.add(wMesh);
      }

      // Monumental Tiled Pishtaq Portal (`портал-пиштак с изразцами`)
      const pishtaq = new THREE.Mesh(new THREE.BoxGeometry(6.8, 13.5, 1.6), tileBlueMat);
      pishtaq.position.set(0, 6.75, 8.2);
      pishtaq.castShadow = true;
      sGroup.add(pishtaq);

      // Central Grand Turquoise Dome & 4 Corner Cupolas
      const mainDome = new THREE.Mesh(
        new THREE.SphereGeometry(4.6, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.65),
        turquoiseDomeMat
      );
      mainDome.position.set(0, wallH + 1.5, -5.9);
      mainDome.castShadow = true;
      sGroup.add(mainDome);

      const finial = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.2, 2.2, 8), goldDomeMat);
      finial.position.set(0, wallH + 6.8, -5.9);
      sGroup.add(finial);

      // Slender Corner Minaret Tower (`مئذنة وبرج مراقبة`)
      const minaret = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.65, 24, 12), wallMat);
      minaret.position.set(9.2, 12, 7.2);
      minaret.castShadow = true;
      sGroup.add(minaret);

      const minBalcony = new THREE.Mesh(new THREE.CylinderGeometry(1.95, 1.75, 0.9, 12), tileBlueMat);
      minBalcony.position.set(9.2, 21.5, 7.2);
      sGroup.add(minBalcony);

      const minCap = new THREE.Mesh(new THREE.SphereGeometry(1.3, 12, 10), goldDomeMat);
      minCap.position.set(9.2, 24.2, 7.2);
      sGroup.add(minCap);

      // Inner courtyard octagonal fountain (`نافورة الفناء`)
      const basin = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.4, 0.65, 8), tileBlueMat);
      basin.position.set(0, 0.35, 0);
      sGroup.add(basin);

      // Arabic Signboard (`سوق الزعفران`)
      const sign = new THREE.Mesh(
        new THREE.BoxGeometry(4.6, 1.15, 0.16),
        this.signGen.getSignMaterial('arabic', 1)
      );
      sign.position.set(0, 11.2, 9.08);
      sGroup.add(sign);

      root.add(sGroup);
      this.registerBuilding(sGroup, {
        name: 'سوق الزعفران وخان القوافل (Grand Arabic Souq & Riad)',
        style: 'arabic',
        door: new THREE.Vector3(souqX, baseY, souqZ + 10.5),
        collider: { minX: souqX - 10, maxX: souqX + 10, minZ: souqZ - 8, maxZ: souqX + 8 }
      });
    }

    // Populate Arabic Riad & Mashrabiya buildings across NE blocks
    const arabLots = [
      { x: 30, z: -145, w: 14, d: 12, floors: 3, signIdx: 0, title: 'دار البلدية العربية (البلدية)' },
      { x: 90, z: -145, w: 15, d: 12, floors: 4, signIdx: 2, title: 'مقهى الأندلس بالمظلات (Andalusian Courtyard Café)' },
      { x: 148, z: -145, w: 14, d: 11, floors: 3, signIdx: 3, title: 'مكتبة الحكمة والقباب (House of Wisdom Library)' },
      { x: 30, z: -98, w: 15, d: 11, floors: 4, signIdx: 4, title: 'فندق الرياض بالمشربيات (Riad Mashrabiya Hotel)' },
      { x: 148, z: -98, w: 14, d: 11, floors: 3, signIdx: 5, title: 'صيدلية الشفاء (Al-Shifa Pharmacy)' },
      { x: 30, z: 2, w: 14, d: 10, floors: 3, signIdx: 6, title: 'مخبز البركة (Traditional Bakery)' },
      { x: 90, z: 4, w: 16, d: 11, floors: 4, signIdx: 7, title: 'مستشفى النور بالحديقة (Al-Noor Courtyard Hospital)' }
    ];

    arabLots.forEach((lot, idx) => {
      if (!this.canPlaceFootprint(lot.x, lot.z, lot.w, lot.d)) return;
      const baseY = this.terrain.getHeightAt(lot.x, lot.z);
      const group = new THREE.Group();
      group.position.set(lot.x, baseY, lot.z);

      const h = lot.floors * 3.2;
      const wallMat = new THREE.MeshStandardMaterial({
        color: sandWalls[idx % sandWalls.length],
        roughness: 0.85
      });

      const body = new THREE.Mesh(new THREE.BoxGeometry(lot.w, h, lot.d), wallMat);
      body.position.y = h * 0.5;
      body.castShadow = true;
      body.receiveShadow = true;
      group.add(body);
      this.addWindowGrid(group, lot.w, h, lot.d, lot.floors, 'arabic');

      // Carved Wooden Mashrabiya projecting bay windows (`Колонны машрабий`)
      const numBays = Math.max(2, Math.floor(lot.w / 4.2));
      for (let b = 0; b < numBays; b++) {
        const bx = -((numBays - 1) * 3.6) * 0.5 + b * 3.6;
        const mash = new THREE.Mesh(new THREE.BoxGeometry(1.7, h - 3.6, 0.65), woodMashrabiyaMat);
        mash.position.set(bx, 3.2 + (h - 3.6) * 0.5, lot.d * 0.5 + 0.32);
        mash.castShadow = true;
        group.add(mash);
      }

      // Crenellated parapet wall + rooftop dome or shaded pergola (`террасы с навесами на крыше`)
      const parapet = new THREE.Mesh(new THREE.BoxGeometry(lot.w + 0.3, 0.7, lot.d + 0.3), wallMat);
      parapet.position.y = h + 0.35;
      group.add(parapet);

      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(2.6, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.6),
        idx % 2 === 0 ? turquoiseDomeMat : goldDomeMat
      );
      dome.position.set(0, h + 0.5, 0);
      dome.castShadow = true;
      group.add(dome);

      // Arabic Signboard mounted over arched portal
      const signMesh = new THREE.Mesh(
        new THREE.BoxGeometry(4.4, 1.1, 0.15),
        this.signGen.getSignMaterial('arabic', lot.signIdx)
      );
      signMesh.position.set(0, 3.1, lot.d * 0.5 + 0.38);
      group.add(signMesh);

      root.add(group);
      this.registerBuilding(group, {
        name: lot.title,
        style: 'arabic',
        door: new THREE.Vector3(lot.x, baseY, lot.z + lot.d * 0.5 + 2.2),
        collider: {
          minX: lot.x - lot.w * 0.5,
          maxX: lot.x + lot.w * 0.5,
          minZ: lot.z - lot.d * 0.5,
          maxZ: lot.z + lot.d * 0.5
        }
      });
    });
  }

  /**
   * 3. JAPANESE DISTRICT (SW): 5-Story Pagoda, Machiya Wooden Lanes, Kawara Roofs & Red Lanterns
   */
  populateJapaneseDistrict(root) {
    const timberMat = new THREE.MeshStandardMaterial({ color: 0x3d281d, roughness: 0.78 });
    const plasterMat = new THREE.MeshStandardMaterial({ color: 0xf4ede2, roughness: 0.85 });
    const vermilionMat = new THREE.MeshStandardMaterial({ color: 0xb82921, roughness: 0.55 });
    const kawaraRoofMat = new THREE.MeshStandardMaterial({ color: 0x2c323b, roughness: 0.5, metalness: 0.25 });
    const lanternMat = new THREE.MeshStandardMaterial({
      color: 0xff5a36,
      emissive: 0xff3b1f,
      emissiveIntensity: 0.85
    });

    // Japanese Landmark: 5-Story Pagoda (`Пятиъярусная пагода`) + Red Torii Gate
    const pagX = -90;
    const pagZ = 56;
    if (this.canPlaceFootprint(pagX, pagZ, 14, 14)) {
      const pGroup = new THREE.Group();
      const baseY = this.terrain.getHeightAt(pagX, pagZ);
      pGroup.position.set(pagX, baseY, pagZ);

      // Stone podium
      const podium = new THREE.Mesh(new THREE.BoxGeometry(12, 1.4, 12), plasterMat);
      podium.position.y = 0.7;
      pGroup.add(podium);

      for (let tier = 0; tier < 5; tier++) {
        const w = 7.4 - tier * 0.95;
        const y0 = 1.4 + tier * 4.4;
        const core = new THREE.Mesh(new THREE.BoxGeometry(w, 3.6, w), vermilionMat);
        core.position.y = y0 + 1.8;
        core.castShadow = true;
        pGroup.add(core);

        const roof = new THREE.Mesh(new THREE.ConeGeometry((w + 3.4) * 0.75, 1.9, 4), kawaraRoofMat);
        roof.rotation.y = Math.PI / 4;
        roof.position.y = y0 + 4.1;
        roof.castShadow = true;
        pGroup.add(roof);
      }

      // Golden Sorin spire on top
      const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.35, 5.5, 8), vermilionMat);
      spire.position.y = 26.2;
      pGroup.add(spire);

      // Iconic Red Torii Gate at entrance (`Красные ворота тории`)
      const torii = this.createToriiGate(vermilionMat, this.darkIronMat);
      torii.position.set(0, 0, 8.2);
      pGroup.add(torii);

      root.add(pGroup);
      this.registerBuilding(pGroup, {
        name: 'باغودا الخمس طوابق وبوابة توري (Five-Story Pagoda & Torii)',
        style: 'japanese',
        door: new THREE.Vector3(pagX, baseY, pagZ + 9.5),
        collider: { minX: pagX - 6, maxX: pagX + 6, minZ: pagZ - 6, maxZ: pagZ + 6 }
      });
    }

    // Japanese Machiya & Izakaya streets
    const jpLots = [
      { x: -148, z: 56, w: 12, d: 10, floors: 2, signIdx: 0, title: 'شارع الرامن وإيزاكايا (Ramen & Izakaya Alley)' },
      { x: -148, z: 110, w: 13, d: 10, floors: 3, signIdx: 1, title: 'مقهى شاي الساكورا (Sakura Chaya Tea House)' },
      { x: -90, z: 110, w: 14, d: 11, floors: 3, signIdx: 2, title: 'مكتبة طوكيو الخشبية (Tokyo Machiya Bookshop)' },
      { x: -32, z: 110, w: 15, d: 11, floors: 3, signIdx: 3, title: 'ريوكان فوجي التقليدي (Ryokan Fuji Inn)' },
      { x: -90, z: 155, w: 12, d: 10, floors: 2, signIdx: 4, title: 'مركز شرطة كوبان (Koban Neighborhood Police)' }
    ];

    jpLots.forEach((lot, idx) => {
      if (!this.canPlaceFootprint(lot.x, lot.z, lot.w, lot.d)) return;
      const baseY = this.terrain.getHeightAt(lot.x, lot.z);
      const group = new THREE.Group();
      group.position.set(lot.x, baseY, lot.z);

      const h = lot.floors * 3.1;
      const body = new THREE.Mesh(new THREE.BoxGeometry(lot.w, h, lot.d), idx % 2 === 0 ? timberMat : plasterMat);
      body.position.y = h * 0.5;
      body.castShadow = true;
      body.receiveShadow = true;
      group.add(body);
      this.addWindowGrid(group, lot.w, h, lot.d, lot.floors, 'japanese');

      // Overhanging tiled Kawara gable roof
      const roof = new THREE.Mesh(
        new THREE.ConeGeometry(Math.hypot(lot.w, lot.d) * 0.56, 2.8, 4),
        kawaraRoofMat
      );
      roof.rotation.y = Math.PI / 4;
      roof.scale.set(lot.w / 11, 1, lot.d / 11);
      roof.position.y = h + 1.3;
      roof.castShadow = true;
      group.add(roof);

      // Glowing red Chochin paper lanterns under eaves
      for (let lx = -lot.w * 0.35; lx <= lot.w * 0.35; lx += 2.8) {
        const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 8), lanternMat);
        lantern.scale.y = 1.35;
        lantern.position.set(lx, 2.7, lot.d * 0.5 + 0.55);
        group.add(lantern);
      }

      // Japanese signboard
      const signMesh = new THREE.Mesh(
        new THREE.BoxGeometry(4.0, 1.05, 0.14),
        this.signGen.getSignMaterial('japanese', lot.signIdx)
      );
      signMesh.position.set(0, 3.2, lot.d * 0.5 + 0.25);
      group.add(signMesh);

      root.add(group);
      this.registerBuilding(group, {
        name: lot.title,
        style: 'japanese',
        door: new THREE.Vector3(lot.x, baseY, lot.z + lot.d * 0.5 + 2.2),
        collider: {
          minX: lot.x - lot.w * 0.5,
          maxX: lot.x + lot.w * 0.5,
          minZ: lot.z - lot.d * 0.5,
          maxZ: lot.z + lot.d * 0.5
        }
      });
    });
  }

  createToriiGate(vermilionMat, baseMat) {
    const g = new THREE.Group();
    for (const side of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.3, 4.8, 10), vermilionMat);
      post.position.set(side * 2.2, 2.4, 0);
      post.castShadow = true;
      g.add(post);

      const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 0.6, 10), baseMat);
      foot.position.set(side * 2.2, 0.3, 0);
      g.add(foot);
    }
    const kasagi = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.42, 0.55), vermilionMat);
    kasagi.position.set(0, 4.8, 0);
    g.add(kasagi);

    const nuki = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.28, 0.35), vermilionMat);
    nuki.position.set(0, 3.85, 0);
    g.add(nuki);
    return g;
  }

  /**
   * 4. METROPOLIS & CYBERPUNK DISTRICT (SE): Stepped Art-Deco Skyscrapers, Glass Towers & Neon Signs
   */
  populateMetropolisDistrict(root) {
    const glassTowerMat = new THREE.MeshStandardMaterial({
      color: 0x2b4560,
      roughness: 0.18,
      metalness: 0.75
    });
    const artDecoBrickMat = new THREE.MeshStandardMaterial({
      color: 0xb88b64,
      roughness: 0.72
    });
    const cyberDarkMat = new THREE.MeshStandardMaterial({
      color: 0x1e2433,
      roughness: 0.4,
      metalness: 0.5
    });
    const neonCyanMat = new THREE.MeshStandardMaterial({
      color: 0x00f5d4,
      emissive: 0x00f5d4,
      emissiveIntensity: 1.2
    });
    const neonMagentaMat = new THREE.MeshStandardMaterial({
      color: 0xff4da6,
      emissive: 0xff2a85,
      emissiveIntensity: 1.2
    });

    const metroLots = [
      { x: 90, z: 56, w: 16, d: 16, floors: 11, type: 'artdeco', signIdx: 2, title: 'برج آرت ديكو المدرج (Empire Art-Deco Stepped Tower)' },
      { x: 148, z: 56, w: 15, d: 14, floors: 9, type: 'cyber', signIdx: 0, title: 'برج سايبر كورب النيوني (Cyber Corp Hologram Tower)' },
      { x: 32, z: 110, w: 15, d: 12, floors: 7, type: 'glass', signIdx: 5, title: 'برج التجارة الزجاجي (Grand Glass Office Tower)' },
      { x: 90, z: 110, w: 16, d: 13, floors: 8, type: 'cyber', signIdx: 4, title: 'أركيد السماء والنيون (Sky Arcade & Hover Pad)' },
      { x: 148, z: 110, w: 15, d: 12, floors: 5, type: 'garage', signIdx: 3, title: 'مرآب السيارات الحلزوني (Spiral Parking Garage)' },
      { x: 90, z: 155, w: 14, d: 10, floors: 3, type: 'diner', signIdx: 1, title: 'مطعم درايف ثرو 24 ساعة (24H Drive-Thru Diner)' }
    ];

    metroLots.forEach((lot) => {
      if (!this.canPlaceFootprint(lot.x, lot.z, lot.w, lot.d)) return;
      const baseY = this.terrain.getHeightAt(lot.x, lot.z);
      const group = new THREE.Group();
      group.position.set(lot.x, baseY, lot.z);

      const h = lot.floors * 3.4;

      if (lot.type === 'artdeco') {
        // 3-tier stepped Art-Deco skyscraper (`Ступенчатая башня ар-деко`)
        const tiers = [
          [lot.w, h * 0.5, lot.d, 0],
          [lot.w * 0.72, h * 0.32, lot.d * 0.72, h * 0.5],
          [lot.w * 0.45, h * 0.25, lot.d * 0.45, h * 0.82]
        ];
        for (const [tw, th, td, ty] of tiers) {
          const box = new THREE.Mesh(new THREE.BoxGeometry(tw, th, td), artDecoBrickMat);
          box.position.y = ty + th * 0.5;
          box.castShadow = true;
          box.receiveShadow = true;
          group.add(box);
          this.addWindowGrid(group, tw, th, td, Math.max(2, Math.floor(th / 3.4)), 'metropolis');
        }
        const spire = new THREE.Mesh(new THREE.ConeGeometry(1.2, 8.5, 8), neonCyanMat);
        spire.position.y = h * 1.07 + 4.25;
        group.add(spire);
      } else {
        const mat = lot.type === 'cyber' ? cyberDarkMat : lot.type === 'glass' ? glassTowerMat : artDecoBrickMat;
        const body = new THREE.Mesh(new THREE.BoxGeometry(lot.w, h, lot.d), mat);
        body.position.y = h * 0.5;
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);
        this.addWindowGrid(group, lot.w, h, lot.d, lot.floors, 'metropolis');

        // Glowing neon trim bands for Cyberpunk towers
        if (lot.type === 'cyber') {
          for (const ratio of [0.35, 0.7, 0.98]) {
            const band = new THREE.Mesh(
              new THREE.BoxGeometry(lot.w + 0.35, 0.28, lot.d + 0.35),
              ratio > 0.5 ? neonCyanMat : neonMagentaMat
            );
            band.position.y = h * ratio;
            group.add(band);
          }
        }
      }

      // Rooftop HVAC units & water tank props (`баки для воды и кондиционеры`)
      const hvac = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.4, 2.2), this.darkIronMat);
      hvac.position.set(-2.2, h + 0.7, -1.5);
      group.add(hvac);

      // Signboard
      const signMesh = new THREE.Mesh(
        new THREE.BoxGeometry(5.0, 1.25, 0.16),
        this.signGen.getSignMaterial('metropolis', lot.signIdx)
      );
      signMesh.position.set(0, 3.8, lot.d * 0.5 + 0.28);
      group.add(signMesh);

      root.add(group);
      this.registerBuilding(group, {
        name: lot.title,
        style: 'metropolis',
        door: new THREE.Vector3(lot.x, baseY, lot.z + lot.d * 0.5 + 2.5),
        collider: {
          minX: lot.x - lot.w * 0.5,
          maxX: lot.x + lot.w * 0.5,
          minZ: lot.z - lot.d * 0.5,
          maxZ: lot.z + lot.d * 0.5
        }
      });
    });
  }

  /**
   * 5. CENTRAL PARK OASIS & CIVIC PLAZA (`Площадь с фонтаном и парк`)
   */
  populateCentralParkAndPlaza(root) {
    // Ornate Plaza Fountain (`Площадь Кубика / Фонтан`) at (x: -28, z: 54)
    const fx = -28;
    const fz = 54;
    const fy = this.terrain.getHeightAt(fx, fz);
    const fGroup = new THREE.Group();
    fGroup.position.set(fx, fy, fz);

    const stoneMat = new THREE.MeshStandardMaterial({ color: 0xd8cfc0, roughness: 0.7 });
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x56b8d4,
      emissive: 0x267899,
      emissiveIntensity: 0.35,
      roughness: 0.15
    });

    const outerRing = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.5, 0.85, 16), stoneMat);
    outerRing.position.y = 0.42;
    outerRing.castShadow = true;
    fGroup.add(outerRing);

    const pool = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 3.8, 0.75, 16), waterMat);
    pool.position.y = 0.52;
    fGroup.add(pool);

    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.3, 2.8, 12), stoneMat);
    pedestal.position.y = 1.4;
    fGroup.add(pedestal);

    const upperBowl = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 0.8, 0.6, 12), stoneMat);
    upperBowl.position.y = 2.7;
    fGroup.add(upperBowl);

    // Animated water jet droplets
    const jetGroup = new THREE.Group();
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const drop = new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 6), waterMat);
      drop.position.set(Math.cos(angle) * 1.2, 3.2, Math.sin(angle) * 1.2);
      drop.userData.phase = i * 0.8;
      jetGroup.add(drop);
    }
    fGroup.add(jetGroup);
    this.animatedProps.push({
      type: 'fountain',
      mesh: jetGroup
    });

    root.add(fGroup);
    this.registerBuilding(fGroup, {
      name: 'نافورة الساحة المركزية (Central Plaza Fountain)',
      style: 'parks',
      door: new THREE.Vector3(fx, fy, fz + 5.5),
      collider: { minX: fx - 4.2, maxX: fx + 4.2, minZ: fz - 4.2, maxZ: fz + 4.2 }
    });
  }

  /**
   * 6. STREETLAMPS, BUS STOPS & BENCHES ALONG AVENUES
   */
  populateStreetFurniture(root) {
    const furnitureGroup = new THREE.Group();
    furnitureGroup.name = 'StreetFurniture';

    const benchWoodMat = new THREE.MeshStandardMaterial({ color: 0x8c5832, roughness: 0.8 });
    const shelterGlassMat = new THREE.MeshStandardMaterial({
      color: 0x99d6ea,
      transparent: true,
      opacity: 0.55,
      roughness: 0.15
    });

    // Place streetlamps along roadsX and roadsZ
    const offset = this.terrain.roadHalfWidth + 0.85;
    for (const rx of this.terrain.roadsX) {
      for (let z = -150; z <= 150; z += 26) {
        if (this.terrain.waterSDF(rx, z) < 3.5) continue;
        const rState = this.terrain.getRoadState(rx + offset, z);
        if (rState.isRoad) continue;

        for (const side of [-1, 1]) {
          const lx = rx + side * offset;
          const ly = this.terrain.getHeightAt(lx, z);
          const lamp = this.createStreetLamp();
          lamp.position.set(lx, ly, z);
          furnitureGroup.add(lamp);
          this.streetLights.push(new THREE.Vector3(lx, ly + 4.2, z));
        }
      }
    }

    // Place 6 Bus Stops (`Остановка с навесом и схемой маршрутов`) & Benches
    const busStopCoords = [
      [-60 + offset + 0.6, -92, 0],
      [0 + offset + 0.6, -92, 0],
      [60 + offset + 0.6, -92, 0],
      [-60 - offset - 0.6, 52, Math.PI],
      [0 - offset - 0.6, 52, Math.PI],
      [60 - offset - 0.6, 52, Math.PI]
    ];

    for (const [bx, bz, rotY] of busStopCoords) {
      if (this.terrain.waterSDF(bx, bz) < 4) continue;
      const by = this.terrain.getHeightAt(bx, bz);
      const stop = new THREE.Group();
      stop.position.set(bx, by, bz);
      stop.rotation.y = rotY;

      const roof = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.14, 3.6), this.darkIronMat);
      roof.position.y = 2.65;
      roof.castShadow = true;
      stop.add(roof);

      const backGlass = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.5, 3.4), shelterGlassMat);
      backGlass.position.set(-0.7, 1.3, 0);
      stop.add(backGlass);

      const bench = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.45, 2.2), benchWoodMat);
      bench.position.set(-0.35, 0.35, 0);
      stop.add(bench);

      furnitureGroup.add(stop);
    }

    root.add(furnitureGroup);
  }

  createStreetLamp() {
    const g = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 4.1, 6), this.darkIronMat);
    pole.position.y = 2.05;
    pole.castShadow = true;
    g.add(pole);

    const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), this.lampGlowMat);
    lantern.position.y = 4.2;
    g.add(lantern);
    return g;
  }

  /**
   * Updates animated architectural props (windmill sails, fountain jets) & night window/lamp emissives
   */
  update(timeSec, hourOfDay) {
    // Night factor: lights turn on between 17:30 and 06:30
    const isNight = hourOfDay >= 17.5 || hourOfDay <= 6.5;
    const nightStrength =
      hourOfDay >= 19 || hourOfDay <= 5
        ? 1.0
        : hourOfDay > 17.5
          ? (hourOfDay - 17.5) / 1.5
          : hourOfDay < 6.5
            ? (6.5 - hourOfDay) / 1.5
            : 0.0;

    for (let i = 0; i < this.windowMaterials.length; i++) {
      this.windowMaterials[i].emissiveIntensity = isNight ? (0.65 + (i % 3) * 0.22) * nightStrength : 0.0;
    }
    for (const mat of this.streetLightMaterials) {
      mat.emissiveIntensity = 0.2 + nightStrength * 1.6;
    }

    // Update animated props
    for (const prop of this.animatedProps) {
      if (prop.type === 'windmill') {
        prop.mesh.rotation.z = timeSec * prop.speed;
      } else if (prop.type === 'fountain') {
        prop.mesh.children.forEach((drop, idx) => {
          const p = (timeSec * 2.4 + idx * 0.35) % 1.0;
          const r = 0.3 + p * 2.2;
          const angle = (idx / 8) * Math.PI * 2 + timeSec * 0.5;
          drop.position.x = Math.cos(angle) * r;
          drop.position.z = Math.sin(angle) * r;
          drop.position.y = 2.9 + Math.sin(p * Math.PI) * 1.9 - p * 1.8;
        });
      }
    }
  }
}

