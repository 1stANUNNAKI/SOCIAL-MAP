import * as THREE from 'three';
import { clamp } from '../terrain/sdfTerrain.js';

/**
 * Unified 3-Mode Environment Navigation Controller modeled after CityRT:
 * 1. `orbit` (Mayor Orbital Camera: WASD pan, RMB/QE orbit, RF tilt, Wheel zoom, Double-Click building fly-to)
 * 2. `walk`  (Street-Level Walk Mode `G`: First-Person & Third-Person `V`, Jump `Space`, Crouch `C`, `walkBob`)
 * 3. `drive` (Street Car Driving Mode `E`: Gas/Brake `WS`, Steer `AD`, Handbrake `Space`, Horn `H`, `km/h` HUD)
 */
export class CityNavigationController {
  constructor(camera, domElement, scene, terrain, cityBuilder, trafficManager, audioSynth, onStateChange) {
    this.camera = camera;
    this.domElement = domElement;
    this.scene = scene;
    this.terrain = terrain;
    this.cityBuilder = cityBuilder;
    this.trafficManager = trafficManager;
    this.audio = audioSynth;
    this.onStateChange = onStateChange;

    this.mode = 'orbit'; // 'orbit' | 'walk' | 'drive'
    this.keys = new Set();

    // Orbit mode state
    this.target = new THREE.Vector3(0, 1.5, 10);
    this.desiredTarget = new THREE.Vector3(0, 1.5, 10);
    this.yaw = -0.55;
    this.pitch = 0.62;
    this.distance = 115;
    this.desiredDistance = 115;
    this.slowFactor = 1.0;

    // Walk mode state
    this.walkPos = new THREE.Vector3(0, 1.4, 25);
    this.walkYaw = 0;
    this.walkPitch = 0;
    this.walkVelY = 0;
    this.isGrounded = true;
    this.isCrouching = false;
    this.thirdPerson = true; // Over-the-shoulder view (`V` toggles first/third person)
    this.walkBobPhase = 0;
    this.stepTimer = 0;

    // Drive mode state
    this.activeVehicle = null;
    this.driveSpeed = 0;
    this.driveYaw = 0;
    this.driveChaseCam = true;

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    this.initPlayerAvatar();
    this.bindInputEvents();
  }

  initPlayerAvatar() {
    this.avatar = new THREE.Group();
    this.avatar.visible = false;

    const coatMat = new THREE.MeshStandardMaterial({ color: 0xd96b43, roughness: 0.7 });
    const headMat = new THREE.MeshStandardMaterial({ color: 0xf5d0b5, roughness: 0.65 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x2a2320, roughness: 0.8 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.72, 0.3), coatMat);
    body.position.y = 1.05;
    body.castShadow = true;
    this.avatar.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), headMat);
    head.position.y = 1.62;
    head.castShadow = true;
    this.avatar.add(head);

    this.avatarLeftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.7, 0.18), darkMat);
    this.avatarLeftLeg.position.set(-0.13, 0.35, 0);
    this.avatar.add(this.avatarLeftLeg);

    this.avatarRightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.7, 0.18), darkMat);
    this.avatarRightLeg.position.set(0.13, 0.35, 0);
    this.avatar.add(this.avatarRightLeg);

    this.scene.add(this.avatar);
  }

  bindInputEvents() {
    this.isDraggingOrbit = false;
    this.isDraggingPan = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;

    window.addEventListener('keydown', (e) => {
      if (e.target && ['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;
      this.keys.add(e.code);

      if (e.code === 'KeyG') {
        e.preventDefault();
        this.toggleWalkMode();
      } else if (e.code === 'KeyE' && this.mode !== 'orbit') {
        e.preventDefault();
        this.toggleDriveMode();
      } else if (e.code === 'KeyV') {
        if (this.mode === 'walk') {
          this.thirdPerson = !this.thirdPerson;
          this.avatar.visible = this.thirdPerson;
          this.notifyUI();
        } else if (this.mode === 'drive') {
          this.driveChaseCam = !this.driveChaseCam;
          this.notifyUI();
        }
      } else if (e.code === 'KeyC' && this.mode === 'walk') {
        this.isCrouching = !this.isCrouching;
      } else if (e.code === 'Space' && this.mode === 'walk' && this.isGrounded) {
        e.preventDefault();
        this.walkVelY = 6.8;
        this.isGrounded = false;
        this.audio.playJump();
      } else if (e.code === 'KeyH' && this.mode === 'drive') {
        this.audio.playHorn();
      } else if (e.code === 'Home') {
        this.setMode('orbit');
        this.desiredTarget.set(0, 1.5, 10);
        this.desiredDistance = 115;
      } else if (e.code === 'Escape') {
        if (this.mode !== 'orbit') {
          this.setMode('orbit');
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });

    this.domElement.addEventListener('contextmenu', (e) => e.preventDefault());

    this.domElement.addEventListener('pointerdown', (e) => {
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      if (this.mode === 'orbit') {
        if (e.button === 2 || (e.button === 0 && e.altKey)) {
          this.isDraggingOrbit = true;
        } else if (e.button === 0 || e.button === 1) {
          this.isDraggingPan = true;
        }
      } else {
        this.isDraggingOrbit = true;
      }
    });

    window.addEventListener('pointerup', () => {
      this.isDraggingOrbit = false;
      this.isDraggingPan = false;
    });

    window.addEventListener('pointermove', (e) => {
      const dx = e.clientX - this.lastMouseX;
      const dy = e.clientY - this.lastMouseY;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;

      if (this.mode === 'orbit') {
        if (this.isDraggingOrbit) {
          this.yaw -= dx * 0.0065;
          this.pitch = clamp(this.pitch + dy * 0.0055, 0.18, 1.42);
        } else if (this.isDraggingPan) {
          const panScale = this.distance * 0.0014;
          const forwardX = Math.sin(this.yaw);
          const forwardZ = Math.cos(this.yaw);
          const rightX = Math.cos(this.yaw);
          const rightZ = -Math.sin(this.yaw);

          this.desiredTarget.x -= (rightX * dx + forwardX * dy) * panScale;
          this.desiredTarget.z -= (rightZ * dx + forwardZ * dy) * panScale;
          this.clampOrbitTarget();
        }
      } else if (this.mode === 'walk' && this.isDraggingOrbit) {
        this.walkYaw -= dx * 0.0055;
        this.walkPitch = clamp(this.walkPitch - dy * 0.0045, -0.85, 0.85);
      }
    });

    this.domElement.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        if (this.mode === 'orbit') {
          this.desiredDistance = clamp(this.desiredDistance * (1 + Math.sign(e.deltaY) * 0.11), 14, 210);
        }
      },
      { passive: false }
    );

    // Double-Click on any building in Orbit mode flies smoothly to it (`Двойной щелчок по зданию — камера летит к нему`)
    this.domElement.addEventListener('dblclick', (e) => {
      const rect = this.domElement.getBoundingClientRect();
      this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.pointer, this.camera);
      let bestBuilding = null;
      let bestDist = 1e9;

      for (const b of this.cityBuilder.buildings) {
        const hit = this.raycaster.intersectObject(b.group, true);
        if (hit.length > 0 && hit[0].distance < bestDist) {
          bestDist = hit[0].distance;
          bestBuilding = b;
        }
      }

      if (bestBuilding) {
        this.focusOnBuilding(bestBuilding);
      }
    });
  }

  focusOnBuilding(b) {
    this.setMode('orbit');
    this.desiredTarget.set(b.group.position.x, b.group.position.y + 4.5, b.group.position.z);
    this.desiredDistance = 36;
    this.focusedBuilding = b;
    this.notifyUI(b);
  }

  clampOrbitTarget() {
    this.desiredTarget.x = clamp(this.desiredTarget.x, -165, 165);
    this.desiredTarget.z = clamp(this.desiredTarget.z, -165, 165);
  }

  toggleWalkMode() {
    if (this.mode === 'walk') {
      this.setMode('orbit');
    } else {
      this.setMode('walk');
    }
  }

  toggleDriveMode() {
    if (this.mode === 'drive') {
      this.setMode('walk');
    } else {
      this.setMode('drive');
    }
  }

  setMode(newMode) {
    if (this.mode === 'drive' && this.activeVehicle) {
      this.activeVehicle.playerDriven = false;
      this.activeVehicle = null;
    }

    const prevMode = this.mode;
    this.mode = newMode;

    if (newMode === 'walk') {
      if (prevMode === 'orbit') {
        // Land on the street near the current orbit target or focused building door
        let spawnX = clamp(this.target.x, -145, 145);
        let spawnZ = clamp(this.target.z, -145, 145);
        if (this.focusedBuilding && this.focusedBuilding.door) {
          spawnX = this.focusedBuilding.door.x;
          spawnZ = this.focusedBuilding.door.z;
        } else if (this.terrain.waterSDF(spawnX, spawnZ) < 3.5) {
          spawnX = 0;
          spawnZ = 25;
        }
        const y = this.terrain.getWalkableHeightAt(spawnX, spawnZ);
        this.walkPos.set(spawnX, y, spawnZ);
        this.walkYaw = this.yaw + Math.PI;
        this.walkPitch = 0.05;
      }
      this.avatar.visible = this.thirdPerson;
    } else if (newMode === 'drive') {
      this.avatar.visible = false;
      // Find closest vehicle or summon one right to the player (`Подъедет к тротуару рядом, и ты сядешь за руль`)
      let nearest = null;
      let minDist = 1e9;
      const refPos = prevMode === 'walk' ? this.walkPos : this.target;

      for (const v of this.trafficManager.vehicles) {
        const d = v.mesh.position.distanceTo(refPos);
        if (d < minDist) {
          minDist = d;
          nearest = v;
        }
      }

      if (nearest) {
        this.activeVehicle = nearest;
        nearest.playerDriven = true;
        if (minDist > 18) {
          // Pull up to the nearest street near the player
          const snapX = this.terrain.roadsX.reduce((a, b) =>
            Math.abs(b - refPos.x) < Math.abs(a - refPos.x) ? b : a
          );
          const y = this.terrain.getWalkableHeightAt(snapX, refPos.z);
          nearest.mesh.position.set(snapX + 2.2, y, refPos.z);
          nearest.mesh.rotation.set(0, 0, 0);
        }
        this.driveYaw = nearest.mesh.rotation.y;
        this.driveSpeed = 0;
        this.audio.playHorn();
      }
    } else {
      // Orbit mode
      this.avatar.visible = false;
      if (prevMode === 'walk') {
        this.desiredTarget.set(this.walkPos.x, this.walkPos.y + 1.5, this.walkPos.z);
      } else if (prevMode === 'drive' && this.activeVehicle) {
        this.desiredTarget.copy(this.activeVehicle.mesh.position);
      }
      this.desiredDistance = Math.max(this.desiredDistance, 65);
    }

    this.notifyUI();
  }

  /**
   * Teleport directly to a named district or landmark
   */
  flyToLocation(x, z, dist = 58, yaw = -0.5) {
    this.setMode('orbit');
    const y = this.terrain.getWalkableHeightAt(x, z);
    this.desiredTarget.set(x, y + 3.0, z);
    this.desiredDistance = dist;
    this.yaw = yaw;
    this.notifyUI();
  }

  notifyUI(building = null) {
    if (typeof this.onStateChange === 'function') {
      this.onStateChange({
        mode: this.mode,
        thirdPerson: this.thirdPerson,
        driveChaseCam: this.driveChaseCam,
        speedKmh: Math.round(Math.abs(this.driveSpeed) * 3.2),
        building: building || this.focusedBuilding || null
      });
    }
  }

  update(dt, timeSec) {
    const clampedDt = Math.min(dt, 0.05) * this.slowFactor;

    if (this.mode === 'orbit') {
      this.updateOrbitMode(clampedDt);
    } else if (this.mode === 'walk') {
      this.updateWalkMode(clampedDt, timeSec);
    } else if (this.mode === 'drive') {
      this.updateDriveMode(clampedDt);
    }
  }

  updateOrbitMode(dt) {
    const panSpeed = Math.max(22, this.distance * 0.72) * dt;
    const rotSpeed = 1.65 * dt;

    if (this.keys.has('KeyQ')) this.yaw += rotSpeed;
    if (this.keys.has('KeyE')) this.yaw -= rotSpeed;
    if (this.keys.has('KeyR')) this.pitch = clamp(this.pitch - rotSpeed * 0.7, 0.18, 1.42);
    if (this.keys.has('KeyF')) this.pitch = clamp(this.pitch + rotSpeed * 0.7, 0.18, 1.42);

    const forwardX = -Math.sin(this.yaw);
    const forwardZ = -Math.cos(this.yaw);
    const rightX = Math.cos(this.yaw);
    const rightZ = -Math.sin(this.yaw);

    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) {
      this.desiredTarget.x += forwardX * panSpeed;
      this.desiredTarget.z += forwardZ * panSpeed;
    }
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) {
      this.desiredTarget.x -= forwardX * panSpeed;
      this.desiredTarget.z -= forwardZ * panSpeed;
    }
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) {
      this.desiredTarget.x += rightX * panSpeed;
      this.desiredTarget.z += rightZ * panSpeed;
    }
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) {
      this.desiredTarget.x -= rightX * panSpeed;
      this.desiredTarget.z -= rightZ * panSpeed;
    }

    this.clampOrbitTarget();
    const groundY = this.terrain.getWalkableHeightAt(this.desiredTarget.x, this.desiredTarget.z);
    this.desiredTarget.y = Math.max(groundY + 1.5, this.desiredTarget.y);

    this.target.lerp(this.desiredTarget, Math.min(1, dt * 8.5));
    this.distance += (this.desiredDistance - this.distance) * Math.min(1, dt * 8.5);

    const horizDist = Math.cos(this.pitch) * this.distance;
    const vertDist = Math.sin(this.pitch) * this.distance;

    this.camera.position.set(
      this.target.x + Math.sin(this.yaw) * horizDist,
      this.target.y + vertDist,
      this.target.z + Math.cos(this.yaw) * horizDist
    );
    this.camera.lookAt(this.target);
  }

  updateWalkMode(dt, timeSec) {
    const sprint = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
    const moveSpeed = (sprint ? 10.5 : 5.4) * (this.isCrouching ? 0.55 : 1.0);

    if (this.keys.has('KeyQ') || this.keys.has('ArrowLeft')) this.walkYaw += 1.9 * dt;
    if (this.keys.has('KeyE') || this.keys.has('ArrowRight')) this.walkYaw -= 1.9 * dt;

    let moveForward = 0;
    let moveRight = 0;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) moveForward += 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) moveForward -= 1;
    if (this.keys.has('KeyD')) moveRight += 1;
    if (this.keys.has('KeyA')) moveRight -= 1;

    const isMoving = moveForward !== 0 || moveRight !== 0;
    if (isMoving) {
      const len = Math.hypot(moveForward, moveRight);
      moveForward /= len;
      moveRight /= len;

      const fx = Math.sin(this.walkYaw);
      const fz = Math.cos(this.walkYaw);
      const rx = -Math.cos(this.walkYaw);
      const rz = Math.sin(this.walkYaw);

      const nextX = clamp(this.walkPos.x + (fx * moveForward + rx * moveRight) * moveSpeed * dt, -165, 165);
      const nextZ = clamp(this.walkPos.z + (fz * moveForward + rz * moveRight) * moveSpeed * dt, -165, 165);

      // Avoid walking into deep river water unless on a bridge
      const roadState = this.terrain.getRoadState(nextX, nextZ);
      const waterDist = this.terrain.waterSDF(nextX, nextZ);
      const blockedByWater = waterDist < 0.8 && !roadState.isBridge;

      // Check building colliders
      let blockedByBuilding = false;
      for (const c of this.cityBuilder.colliders) {
        if (nextX > c.minX - 0.6 && nextX < c.maxX + 0.6 && nextZ > c.minZ - 0.6 && nextZ < c.maxZ + 0.6) {
          blockedByBuilding = true;
          break;
        }
      }

      if (!blockedByWater && !blockedByBuilding) {
        this.walkPos.x = nextX;
        this.walkPos.z = nextZ;
      }

      // Walk bobbing (`Покачивание на прогулке`) & footstep synthesis
      this.walkBobPhase += dt * (sprint ? 13.5 : 9.0);
      this.stepTimer += dt;
      if (this.isGrounded && this.stepTimer > (sprint ? 0.32 : 0.46)) {
        this.stepTimer = 0;
        this.audio.playStep(sprint);
      }
    } else {
      this.walkBobPhase = 0;
    }

    // Vertical gravity & ground height following (including arched bridges!)
    const groundY = this.terrain.getWalkableHeightAt(this.walkPos.x, this.walkPos.z);
    if (!this.isGrounded) {
      this.walkVelY -= 18.5 * dt;
      this.walkPos.y += this.walkVelY * dt;
      if (this.walkPos.y <= groundY) {
        this.walkPos.y = groundY;
        this.walkVelY = 0;
        this.isGrounded = true;
        this.audio.playLand();
      }
    } else {
      this.walkPos.y = groundY;
    }

    // Update 3D player avatar pose
    this.avatar.position.copy(this.walkPos);
    this.avatar.rotation.y = this.walkYaw;
    const legSwing = isMoving ? Math.sin(this.walkBobPhase) * 0.65 : 0;
    this.avatarLeftLeg.rotation.x = legSwing;
    this.avatarRightLeg.rotation.x = -legSwing;

    const eyeH = (this.isCrouching ? 1.05 : 1.72) + Math.sin(this.walkBobPhase * 2) * (isMoving ? 0.055 : 0);
    const lookDirX = Math.sin(this.walkYaw) * Math.cos(this.walkPitch);
    const lookDirY = Math.sin(this.walkPitch);
    const lookDirZ = Math.cos(this.walkYaw) * Math.cos(this.walkPitch);

    if (this.thirdPerson) {
      // Over-the-shoulder camera (`Камера за плечом: видно себя и улицу вокруг`)
      const camBack = 4.6;
      const shoulderRight = -Math.cos(this.walkYaw) * 0.55;
      const shoulderRightZ = Math.sin(this.walkYaw) * 0.55;
      this.camera.position.set(
        this.walkPos.x - Math.sin(this.walkYaw) * camBack + shoulderRight,
        this.walkPos.y + eyeH + 0.85 - lookDirY * 2.2,
        this.walkPos.z - Math.cos(this.walkYaw) * camBack + shoulderRightZ
      );
      this.camera.lookAt(
        this.walkPos.x + lookDirX * 14,
        this.walkPos.y + eyeH + lookDirY * 14,
        this.walkPos.z + lookDirZ * 14
      );
    } else {
      // First-person view (`своими глазами`)
      this.camera.position.set(this.walkPos.x, this.walkPos.y + eyeH, this.walkPos.z);
      this.camera.lookAt(
        this.walkPos.x + lookDirX * 15,
        this.walkPos.y + eyeH + lookDirY * 15,
        this.walkPos.z + lookDirZ * 15
      );
    }
  }

  updateDriveMode(dt) {
    if (!this.activeVehicle) {
      this.setMode('walk');
      return;
    }

    const vMesh = this.activeVehicle.mesh;
    const maxSpeed = 24.0;
    const accel = 18.0;
    const handbrake = this.keys.has('Space');

    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) {
      this.driveSpeed = clamp(this.driveSpeed + accel * dt, -10, maxSpeed);
    } else if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) {
      this.driveSpeed = clamp(this.driveSpeed - accel * 1.2 * dt, -10, maxSpeed);
    } else {
      // Natural friction slowdown
      this.driveSpeed *= Math.pow(0.25, dt);
    }

    if (handbrake) {
      if (Math.abs(this.driveSpeed) > 6.5) {
        this.audio.playSkid();
      }
      this.driveSpeed *= Math.pow(0.03, dt);
    }

    if (Math.abs(this.driveSpeed) > 0.3) {
      const steerDir = Math.sign(this.driveSpeed);
      const steerRate = (handbrake ? 2.4 : 1.65) * dt * steerDir;
      if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) this.driveYaw += steerRate;
      if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) this.driveYaw -= steerRate;
    }

    const fx = Math.sin(this.driveYaw);
    const fz = Math.cos(this.driveYaw);
    const nx = clamp(vMesh.position.x + fx * this.driveSpeed * dt, -166, 166);
    const nz = clamp(vMesh.position.z + fz * this.driveSpeed * dt, -166, 166);

    const rState = this.terrain.getRoadState(nx, nz);
    const wDist = this.terrain.waterSDF(nx, nz);
    if (wDist > 0.8 || rState.isBridge) {
      const ny = this.terrain.getWalkableHeightAt(nx, nz);
      vMesh.position.set(nx, ny, nz);
    } else {
      this.driveSpeed = -this.driveSpeed * 0.4;
    }

    vMesh.rotation.set(0, this.driveYaw, 0);
    this.walkPos.copy(vMesh.position);

    if (this.driveChaseCam) {
      // Chase camera behind the driven car
      const backDist = 9.5;
      this.camera.position.set(
        vMesh.position.x - fx * backDist,
        vMesh.position.y + 3.8,
        vMesh.position.z - fz * backDist
      );
      this.camera.lookAt(vMesh.position.x + fx * 8, vMesh.position.y + 1.2, vMesh.position.z + fz * 8);
    } else {
      // Hood / Windshield driver perspective
      this.camera.position.set(
        vMesh.position.x + fx * 0.4,
        vMesh.position.y + 1.65,
        vMesh.position.z + fz * 0.4
      );
      this.camera.lookAt(vMesh.position.x + fx * 22, vMesh.position.y + 1.4, vMesh.position.z + fz * 22);
    }

    this.notifyUI();
  }
}

