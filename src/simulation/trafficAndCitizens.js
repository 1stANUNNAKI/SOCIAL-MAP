import * as THREE from 'three';

/**
 * Active Traffic, River Vessels, Hovercars, and Strolling Citizens Simulation
 * Modeled after CityRT's living street simulation
 */
export class TrafficAndCitizensManager {
  constructor(terrain) {
    this.terrain = terrain;
    this.vehicles = [];
    this.boats = [];
    this.hovercars = [];
    this.pedestrians = [];

    this.headlightMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xfff2c2,
      emissiveIntensity: 0.4
    });
    this.taillightMat = new THREE.MeshStandardMaterial({
      color: 0xff2a2a,
      emissive: 0xff1e1e,
      emissiveIntensity: 0.5
    });
    this.wheelMat = new THREE.MeshStandardMaterial({
      color: 0x222020,
      roughness: 0.85
    });
    this.glassMat = new THREE.MeshStandardMaterial({
      color: 0x2c4257,
      roughness: 0.15,
      metalness: 0.8
    });
  }

  buildSimulation() {
    const root = new THREE.Group();
    root.name = 'LivingTrafficAndCitizens';

    this.spawnRoadVehicles(root);
    this.spawnRiverBoats(root);
    this.spawnHovercars(root);
    this.spawnPedestrians(root);

    return root;
  }

  /**
   * Creates a detailed 3D vehicle mesh (sedan, bus, truck, loaf van, taxi, police)
   */
  createVehicleMesh(kind, bodyColorHex) {
    const g = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({
      color: bodyColorHex,
      roughness: 0.42,
      metalness: 0.25
    });

    let length = 3.9;
    let width = 1.75;
    let height = 1.35;

    if (kind === 'bus') {
      length = 7.4;
      width = 2.2;
      height = 2.45;
      const hull = new THREE.Mesh(new THREE.BoxGeometry(width, height, length), bodyMat);
      hull.position.y = height * 0.5 + 0.35;
      hull.castShadow = true;
      g.add(hull);

      const winBand = new THREE.Mesh(new THREE.BoxGeometry(width + 0.06, 0.85, length - 0.6), this.glassMat);
      winBand.position.y = height * 0.68 + 0.35;
      g.add(winBand);
    } else if (kind === 'truck') {
      length = 6.2;
      width = 2.1;
      height = 2.5;
      const cabMat = new THREE.MeshStandardMaterial({ color: 0xd96b43, roughness: 0.5 });
      const cab = new THREE.Mesh(new THREE.BoxGeometry(width, 1.95, 2.0), cabMat);
      cab.position.set(0, 1.32, length * 0.5 - 1.0);
      cab.castShadow = true;
      g.add(cab);

      const cargoMat = new THREE.MeshStandardMaterial({ color: 0xede6d8, roughness: 0.75 });
      const cargo = new THREE.Mesh(new THREE.BoxGeometry(width + 0.1, 2.35, 4.0), cargoMat);
      cargo.position.set(0, 1.52, -0.9);
      cargo.castShadow = true;
      g.add(cargo);
    } else if (kind === 'loaf') {
      // Iconic CityRT «буханка» ("Loaf" utility van)
      length = 4.2;
      width = 1.85;
      height = 1.95;
      const hull = new THREE.Mesh(new THREE.BoxGeometry(width, height, length), bodyMat);
      hull.position.y = height * 0.5 + 0.35;
      hull.castShadow = true;
      g.add(hull);

      const win = new THREE.Mesh(new THREE.BoxGeometry(width + 0.05, 0.65, length - 0.5), this.glassMat);
      win.position.y = 1.72;
      g.add(win);
    } else {
      // Sedan / Taxi / Police car
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(width, 0.75, length), bodyMat);
      chassis.position.y = 0.72;
      chassis.castShadow = true;
      g.add(chassis);

      const cabin = new THREE.Mesh(new THREE.BoxGeometry(width - 0.22, 0.68, length * 0.54), bodyMat);
      cabin.position.set(0, 1.38, -0.15);
      cabin.castShadow = true;
      g.add(cabin);

      const glass = new THREE.Mesh(new THREE.BoxGeometry(width - 0.16, 0.52, length * 0.56), this.glassMat);
      glass.position.set(0, 1.38, -0.15);
      g.add(glass);

      if (kind === 'police') {
        const siren = new THREE.Mesh(
          new THREE.BoxGeometry(0.85, 0.18, 0.28),
          new THREE.MeshStandardMaterial({ color: 0x1e6bff, emissive: 0x1e6bff, emissiveIntensity: 1.4 })
        );
        siren.position.set(0, 1.8, -0.15);
        g.add(siren);
      } else if (kind === 'taxi') {
        const sign = new THREE.Mesh(
          new THREE.BoxGeometry(0.65, 0.22, 0.28),
          new THREE.MeshStandardMaterial({ color: 0xffd166, emissive: 0xffb703, emissiveIntensity: 0.9 })
        );
        sign.position.set(0, 1.8, -0.15);
        g.add(sign);
      }
    }

    // 4 Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.26, 10);
    wheelGeo.rotateZ(Math.PI / 2);
    const zOff = length * 0.32;
    const xOff = width * 0.5;
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const w = new THREE.Mesh(wheelGeo, this.wheelMat);
        w.position.set(sx * xOff, 0.36, sz * zOff);
        g.add(w);
      }
    }

    // Headlights (+Z is forward) & Taillights (-Z is rear)
    const hlGeo = new THREE.BoxGeometry(0.28, 0.2, 0.08);
    for (const sx of [-1, 1]) {
      const hl = new THREE.Mesh(hlGeo, this.headlightMat);
      hl.position.set(sx * (width * 0.35), 0.72, length * 0.5 + 0.03);
      g.add(hl);

      const tl = new THREE.Mesh(hlGeo, this.taillightMat);
      tl.position.set(sx * (width * 0.35), 0.72, -length * 0.5 - 0.03);
      g.add(tl);
    }

    g.userData.length = length;
    return g;
  }

  spawnRoadVehicles(root) {
    const carPalette = [
      0xd9534f, 0x3b7ea1, 0xe6a832, 0x5c8c58, 0xd8cfc2, 0x6e4e78, 0x2f3e4e, 0xc76b42
    ];
    const kinds = ['sedan', 'sedan', 'taxi', 'loaf', 'bus', 'truck', 'police', 'sedan'];

    // 1. Spawn vehicles along all 5 North-South Avenues (these cross the river bridges!)
    this.terrain.roadsX.forEach((rx, rIdx) => {
      for (const dir of [1, -1]) {
        const laneX = rx + (dir > 0 ? 2.3 : -2.3);
        const numCars = 4;
        for (let i = 0; i < numCars; i++) {
          const z = -150 + i * 78 + (rIdx * 17) % 30;
          const kind = kinds[(rIdx + i + (dir > 0 ? 0 : 3)) % kinds.length];
          const color =
            kind === 'taxi'
              ? 0xf4b942
              : kind === 'police'
                ? 0x243b55
                : kind === 'bus'
                  ? 0x2e778d
                  : kind === 'loaf'
                    ? 0x6c8564
                    : carPalette[(rIdx * 3 + i) % carPalette.length];

          const mesh = this.createVehicleMesh(kind, color);
          const y = this.terrain.getWalkableHeightAt(laneX, z);
          mesh.position.set(laneX, y, z);
          mesh.rotation.y = dir > 0 ? 0 : Math.PI;
          root.add(mesh);

          this.vehicles.push({
            mesh,
            kind,
            axis: 'z',
            laneCoord: laneX,
            dir,
            speed: kind === 'bus' || kind === 'truck' ? 11.5 : 15.5 + (i % 3) * 2.0,
            currentSpeed: 12.0,
            playerDriven: false
          });
        }
      }
    });

    // 2. Spawn vehicles along East-West Streets that don't intersect the river (roadsZ = -120, 85, 135)
    for (const rz of [-120, 85, 135]) {
      for (const dir of [1, -1]) {
        const laneZ = rz + (dir > 0 ? 2.3 : -2.3);
        for (let i = 0; i < 3; i++) {
          const x = -140 + i * 95;
          if (this.terrain.waterSDF(x, laneZ) < 5) continue;
          const kind = kinds[(i + (dir > 0 ? 1 : 4)) % kinds.length];
          const color = carPalette[(i * 2 + 1) % carPalette.length];
          const mesh = this.createVehicleMesh(kind, color);
          const y = this.terrain.getWalkableHeightAt(x, laneZ);
          mesh.position.set(x, y, laneZ);
          mesh.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
          root.add(mesh);

          this.vehicles.push({
            mesh,
            kind,
            axis: 'x',
            laneCoord: laneZ,
            dir,
            speed: 13.5 + (i % 2) * 2.5,
            currentSpeed: 12.0,
            playerDriven: false
          });
        }
      }
    }
  }

  /**
   * River Barges & Tour Boats sailing along the Catmull-Rom river spline
   */
  spawnRiverBoats(root) {
    const hullMat = new THREE.MeshStandardMaterial({ color: 0x7a3b2e, roughness: 0.65 });
    const deckMat = new THREE.MeshStandardMaterial({ color: 0xe8dec8, roughness: 0.75 });

    for (let i = 0; i < 4; i++) {
      const boat = new THREE.Group();
      const hull = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.1, 8.6), hullMat);
      hull.position.y = 0.35;
      hull.castShadow = true;
      boat.add(hull);

      const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.25, 4.2), deckMat);
      cabin.position.set(0, 1.2, -0.4);
      cabin.castShadow = true;
      boat.add(cabin);

      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.24, 6, 6), this.headlightMat);
      lamp.position.set(0, 1.95, 1.6);
      boat.add(lamp);

      root.add(boat);
      this.boats.push({
        mesh: boat,
        progress: (i / 4) * (this.terrain.riverSamples.length - 2),
        speed: 4.5 + (i % 2) * 1.2
      });
    }
  }

  /**
   * Cyberpunk/Futurist Hovercars (`ховер-кары и аэромобили`) gliding above SE district
   */
  spawnHovercars(root) {
    const hoverMat = new THREE.MeshStandardMaterial({ color: 0x1a2639, roughness: 0.25, metalness: 0.8 });
    const thrusterMat = new THREE.MeshStandardMaterial({
      color: 0x00f5d4,
      emissive: 0x00f5d4,
      emissiveIntensity: 1.5
    });

    for (let i = 0; i < 5; i++) {
      const hc = new THREE.Group();
      const body = new THREE.Mesh(new THREE.ConeGeometry(1.3, 3.8, 6), hoverMat);
      body.rotation.x = Math.PI / 2;
      body.scale.set(1.2, 1.0, 0.45);
      hc.add(body);

      const glow = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.18, 1.2), thrusterMat);
      glow.position.y = -0.25;
      hc.add(glow);

      root.add(hc);
      this.hovercars.push({
        mesh: hc,
        centerX: 90,
        centerZ: 90,
        radiusX: 48 + (i % 2) * 18,
        radiusZ: 36 + (i % 3) * 14,
        altitude: 22 + i * 3.5,
        angle: (i / 5) * Math.PI * 2,
        speed: 0.35 + (i % 2) * 0.12
      });
    }
  }

  /**
   * Strolling Pedestrians (`Пешеходы и жители`) along sidewalks & park desire paths
   */
  spawnPedestrians(root) {
    const coatPalette = [0xc94a38, 0x3b6e8c, 0xd99b26, 0x4f7d58, 0x7a4b82, 0x454a54, 0xd67449];
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xf2ccb0, roughness: 0.7 });
    const legMat = new THREE.MeshStandardMaterial({ color: 0x2c3038, roughness: 0.85 });

    for (let i = 0; i < 64; i++) {
      const ped = new THREE.Group();
      const coatMat = new THREE.MeshStandardMaterial({
        color: coatPalette[i % coatPalette.length],
        roughness: 0.78
      });

      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.65, 0.26), coatMat);
      torso.position.y = 1.02;
      torso.castShadow = true;
      ped.add(torso);

      const head = new THREE.Mesh(new THREE.SphereGeometry(0.19, 8, 8), skinMat);
      head.position.y = 1.52;
      ped.add(head);

      const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.68, 0.16), legMat);
      leftLeg.position.set(-0.11, 0.35, 0);
      ped.add(leftLeg);

      const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.68, 0.16), legMat);
      rightLeg.position.set(0.11, 0.35, 0);
      ped.add(rightLeg);

      // Assign either a sidewalk route along roadsX or a park stroll route
      const onParkLoop = i < 16;
      const rx = this.terrain.roadsX[i % this.terrain.roadsX.length];
      const side = i % 2 === 0 ? 1 : -1;
      const walkX = rx + side * (this.terrain.roadHalfWidth + 1.0);
      const startZ = -140 + ((i * 23) % 280);

      root.add(ped);
      this.pedestrians.push({
        mesh: ped,
        leftLeg,
        rightLeg,
        onParkLoop,
        walkX,
        z: startZ,
        dir: i % 2 === 0 ? 1 : -1,
        angle: (i / 16) * Math.PI * 2,
        speed: 1.85 + (i % 4) * 0.25,
        phase: i * 1.3
      });
    }
  }

  /**
   * Updates all moving vehicles, river boats, hovercars, and pedestrians each frame
   */
  update(dt, timeSec, hourOfDay) {
    const clampedDt = Math.min(dt, 0.05);

    // Night headlight/taillight intensity
    const isNight = hourOfDay >= 17.5 || hourOfDay <= 6.5;
    this.headlightMat.emissiveIntensity = isNight ? 2.2 : 0.35;
    this.taillightMat.emissiveIntensity = isNight ? 1.8 : 0.45;

    // 1. Update Road Vehicles (with spacing collision avoidance)
    for (let i = 0; i < this.vehicles.length; i++) {
      const v = this.vehicles[i];
      if (v.playerDriven) continue;

      let targetSpeed = v.speed;
      // Check ahead in the same lane to avoid overlapping
      for (let j = 0; j < this.vehicles.length; j++) {
        if (i === j) continue;
        const other = this.vehicles[j];
        if (other.axis === v.axis && Math.abs(other.laneCoord - v.laneCoord) < 1.2 && other.dir === v.dir) {
          const distAhead =
            v.axis === 'z'
              ? (other.mesh.position.z - v.mesh.position.z) * v.dir
              : (other.mesh.position.x - v.mesh.position.x) * v.dir;
          if (distAhead > 0 && distAhead < 12.0) {
            targetSpeed = Math.min(targetSpeed, other.currentSpeed * 0.65);
          }
          if (distAhead > 0 && distAhead < 6.5) {
            targetSpeed = 0;
          }
        }
      }

      v.currentSpeed += (targetSpeed - v.currentSpeed) * Math.min(1, clampedDt * 5.0);

      if (v.axis === 'z') {
        let nz = v.mesh.position.z + v.dir * v.currentSpeed * clampedDt;
        if (nz > 168) nz = -168;
        if (nz < -168) nz = 168;
        const ny = this.terrain.getWalkableHeightAt(v.laneCoord, nz);
        // Pitch vehicle slightly on arched bridge slopes
        const nyAhead = this.terrain.getWalkableHeightAt(v.laneCoord, nz + v.dir * 1.5);
        const pitch = Math.atan2(nyAhead - ny, 1.5);
        v.mesh.position.set(v.laneCoord, ny, nz);
        v.mesh.rotation.set(-pitch, v.dir > 0 ? 0 : Math.PI, 0);
      } else {
        let nx = v.mesh.position.x + v.dir * v.currentSpeed * clampedDt;
        if (nx > 168) nx = -168;
        if (nx < -168) nx = 168;
        const ny = this.terrain.getWalkableHeightAt(nx, v.laneCoord);
        v.mesh.position.set(nx, ny, v.laneCoord);
        v.mesh.rotation.set(0, v.dir > 0 ? Math.PI / 2 : -Math.PI / 2, 0);
      }
    }

    // 2. Update River Boats along Catmull-Rom spline samples
    const samples = this.terrain.riverSamples;
    const maxIdx = samples.length - 2;
    for (const b of this.boats) {
      b.progress += b.speed * clampedDt;
      if (b.progress >= maxIdx) b.progress = 0;
      const idx = Math.floor(b.progress);
      const frac = b.progress - idx;
      const p0 = samples[idx];
      const p1 = samples[idx + 1];
      const bx = p0[0] + (p1[0] - p0[0]) * frac;
      const bz = p0[1] + (p1[1] - p0[1]) * frac;
      const yaw = Math.atan2(p1[0] - p0[0], p1[1] - p0[1]);
      b.mesh.position.set(bx, 0.15 + Math.sin(timeSec * 2.5 + idx) * 0.05, bz);
      b.mesh.rotation.y = yaw;
    }

    // 3. Update Cyberpunk Hovercars
    for (const hc of this.hovercars) {
      hc.angle += hc.speed * clampedDt;
      const x = hc.centerX + Math.cos(hc.angle) * hc.radiusX;
      const z = hc.centerZ + Math.sin(hc.angle) * hc.radiusZ;
      const dx = -Math.sin(hc.angle) * hc.radiusX;
      const dz = Math.cos(hc.angle) * hc.radiusZ;
      hc.mesh.position.set(x, hc.altitude + Math.sin(timeSec * 2.0 + hc.angle) * 0.4, z);
      hc.mesh.rotation.y = Math.atan2(dx, dz);
    }

    // 4. Update Strolling Pedestrians & Leg Walk Cycle
    for (const p of this.pedestrians) {
      const swing = Math.sin(timeSec * 7.5 + p.phase) * 0.55;
      p.leftLeg.rotation.x = swing;
      p.rightLeg.rotation.x = -swing;

      if (p.onParkLoop) {
        p.angle += 0.08 * clampedDt * p.dir;
        const px = Math.cos(p.angle) * 29.5;
        const pz = 55 + Math.sin(p.angle) * 15.0;
        const py = this.terrain.getWalkableHeightAt(px, pz);
        p.mesh.position.set(px, py, pz);
        p.mesh.rotation.y = Math.atan2(-Math.sin(p.angle) * p.dir, Math.cos(p.angle) * p.dir);
      } else {
        p.z += p.dir * p.speed * clampedDt;
        if (p.z > 155) p.dir = -1;
        if (p.z < -155) p.dir = 1;
        const py = this.terrain.getWalkableHeightAt(p.walkX, p.z);
        p.mesh.position.set(p.walkX, py, p.z);
        p.mesh.rotation.y = p.dir > 0 ? 0 : Math.PI;
      }
    }
  }
}

