"use strict";

// -----------------------------------------------------------------------
// 第一人称 AK 风格武器
// -----------------------------------------------------------------------
const weapon = new THREE.Group();
camera.add(weapon);

const gunMetal = new THREE.MeshStandardMaterial({
  color: 0x151719,
  roughness: 0.34,
  metalness: 0.82,
  depthTest: false,
  depthWrite: false
});

const gunDark = new THREE.MeshStandardMaterial({
  color: 0x08090a,
  roughness: 0.5,
  metalness: 0.55,
  depthTest: false,
  depthWrite: false
});

const gunWood = new THREE.MeshStandardMaterial({
  color: 0x783b1d,
  roughness: 0.58,
  metalness: 0.05,
  depthTest: false,
  depthWrite: false
});

const gloveMaterial = new THREE.MeshStandardMaterial({
  color: 0x41463d,
  roughness: 0.92,
  depthTest: false,
  depthWrite: false
});

const machineGunParts = [];

function weaponPart(geometry, material, x, y, z, rx, ry, rz) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.rotation.set(rx || 0, ry || 0, rz || 0);
  mesh.renderOrder = 1000;
  weapon.add(mesh);
  machineGunParts.push(mesh);
  return mesh;
}

weaponPart(new THREE.BoxGeometry(0.22, 0.2, 0.56), gunMetal, 0, 0, -0.14);
weaponPart(new THREE.BoxGeometry(0.19, 0.07, 0.45), gunDark, 0, 0.13, -0.14);
weaponPart(new THREE.BoxGeometry(0.18, 0.23, 0.5), gunWood, 0, 0.01, 0.37, -0.18);
weaponPart(new THREE.BoxGeometry(0.19, 0.16, 0.45), gunWood, 0, 0, -0.63);
weaponPart(new THREE.CylinderGeometry(0.033, 0.04, 0.68, 10), gunMetal, 0, 0.035, -1.16, Math.PI / 2);
weaponPart(new THREE.CylinderGeometry(0.055, 0.055, 0.15, 10), gunDark, 0, 0.035, -1.53, Math.PI / 2);
weaponPart(new THREE.BoxGeometry(0.17, 0.42, 0.2), gunDark, 0, -0.28, -0.13, -0.16);
weaponPart(new THREE.BoxGeometry(0.16, 0.25, 0.18), gunDark, 0, -0.55, -0.08, -0.34);
weaponPart(new THREE.BoxGeometry(0.14, 0.32, 0.16), gunWood, 0, -0.29, 0.17, -0.26);
weaponPart(new THREE.BoxGeometry(0.06, 0.12, 0.06), gunDark, 0, 0.19, -0.82);
weaponPart(new THREE.BoxGeometry(0.08, 0.1, 0.05), gunDark, 0, 0.19, 0.06);
weaponPart(new THREE.BoxGeometry(0.18, 0.18, 0.3), gloveMaterial, -0.09, -0.18, -0.61, -0.15);
weaponPart(new THREE.BoxGeometry(0.19, 0.2, 0.27), gloveMaterial, 0.09, -0.22, 0.12, -0.3);

const muzzleFlashMaterial = new THREE.MeshBasicMaterial({
  color: 0xffc64a,
  transparent: true,
  opacity: 1,
  blending: THREE.AdditiveBlending,
  depthTest: false,
  depthWrite: false
});

const muzzleFlash = new THREE.Mesh(
  new THREE.OctahedronGeometry(0.14, 0),
  muzzleFlashMaterial
);
muzzleFlash.position.set(0, 0.035, -1.66);
muzzleFlash.scale.set(0.65, 0.65, 2.6);
muzzleFlash.visible = false;
muzzleFlash.renderOrder = 1001;
weapon.add(muzzleFlash);

const muzzleLight = new THREE.PointLight(0xff9b2f, 0, 4, 2);
muzzleLight.position.copy(muzzleFlash.position);
weapon.add(muzzleLight);

const weaponBasePosition = new THREE.Vector3(0.42, -0.42, -0.68);
weapon.position.copy(weaponBasePosition);
weapon.rotation.set(-0.035, -0.025, -0.025);

// -----------------------------------------------------------------------
// 可拾取武器：第一人称模型与武器参数
// -----------------------------------------------------------------------
const weaponModels = Object.create(null);
const weaponProfiles = {
  "机枪": {
    type: "hitscan", damage: 24, cooldown: 0.09, range: 160,
    recoil: 0.072, shake: 0.014, flash: true,
    usesAmmo: true, magazineSize: 45, reserveMax: 180, reloadTime: 2.25
  },
  "手枪": {
    type: "hitscan", damage: 48, cooldown: 0.34, range: 125,
    recoil: 0.12, shake: 0.021, flash: true,
    usesAmmo: true, magazineSize: 15, reserveMax: 75, reloadTime: 1.5
  },
  "狙击枪": {
    type: "hitscan", damage: 135, cooldown: 1.08, range: 190,
    recoil: 0.19, shake: 0.032, flash: true,
    usesAmmo: true, magazineSize: 5, reserveMax: 25, reloadTime: 2.8
  },
  "匕首": {
    type: "melee", damage: 112, cooldown: 0.46, range: 2.55,
    recoil: 0.15, shake: 0.012, flash: false,
    usesAmmo: false, magazineSize: 0, reserveMax: 0, reloadTime: 0
  },
  "火箭弹": {
    type: "rocket", damage: 145, cooldown: 1.15, range: 150,
    recoil: 0.2, shake: 0.035, flash: true,
    usesAmmo: true, magazineSize: 1, reserveMax: 5, reloadTime: 1.85
  }
};

function firstPersonPart(parent, geometry, material, x, y, z, rx, ry, rz) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.rotation.set(rx || 0, ry || 0, rz || 0);
  mesh.renderOrder = 1000;
  parent.add(mesh);
  return mesh;
}

function createFirstPersonWeaponModels() {
  // 手枪：短套筒、握把和准星。
  const pistol = new THREE.Group();
  firstPersonPart(pistol, new THREE.BoxGeometry(0.22, 0.22, 0.72), gunMetal, 0, 0, -0.45);
  firstPersonPart(pistol, new THREE.BoxGeometry(0.2, 0.38, 0.24), gunDark, 0, -0.27, -0.16, -0.22);
  firstPersonPart(pistol, new THREE.CylinderGeometry(0.026, 0.026, 0.3, 9), gunDark, 0, 0, -0.93, Math.PI / 2);
  firstPersonPart(pistol, new THREE.BoxGeometry(0.2, 0.18, 0.26), gloveMaterial, 0, -0.38, -0.18);
  pistol.visible = false;
  weapon.add(pistol);
  weaponModels["手枪"] = pistol;

  // 狙击枪：长枪管、枪托、弹匣和带前后镜片的光学瞄准镜。
  const sniper = new THREE.Group();
  firstPersonPart(sniper, new THREE.BoxGeometry(0.21, 0.2, 1.08), gunMetal, 0, 0, -0.48);
  firstPersonPart(sniper, new THREE.CylinderGeometry(0.028, 0.034, 1.08, 10), gunDark, 0, 0.02, -1.52, Math.PI / 2);
  firstPersonPart(sniper, new THREE.CylinderGeometry(0.05, 0.05, 0.2, 10), gunDark, 0, 0.02, -2.14, Math.PI / 2);
  firstPersonPart(sniper, new THREE.BoxGeometry(0.22, 0.22, 0.72), gunWood, 0, -0.02, 0.38, -0.08);
  firstPersonPart(sniper, new THREE.BoxGeometry(0.18, 0.34, 0.2), gunDark, 0, -0.27, -0.36, -0.16);
  firstPersonPart(sniper, new THREE.CylinderGeometry(0.07, 0.07, 0.56, 12), gunMetal, 0, 0.23, -0.5, Math.PI / 2);
  firstPersonPart(sniper, new THREE.CylinderGeometry(0.095, 0.095, 0.12, 12), gunDark, 0, 0.23, -0.78, Math.PI / 2);
  firstPersonPart(sniper, new THREE.CylinderGeometry(0.095, 0.095, 0.12, 12), gunDark, 0, 0.23, -0.22, Math.PI / 2);
  firstPersonPart(sniper, new THREE.BoxGeometry(0.055, 0.13, 0.2), gunDark, 0, 0.12, -0.48);
  firstPersonPart(sniper, new THREE.BoxGeometry(0.19, 0.2, 0.28), gloveMaterial, 0.08, -0.23, -0.45, -0.12);
  sniper.visible = false;
  weapon.add(sniper);
  weaponModels["狙击枪"] = sniper;

  // 匕首：银色刀身配短护手。
  const dagger = new THREE.Group();
  firstPersonPart(dagger, new THREE.ConeGeometry(0.13, 0.92, 4), gunMetal, 0, 0.18, -0.75, Math.PI / 2, 0, Math.PI / 4);
  firstPersonPart(dagger, new THREE.BoxGeometry(0.42, 0.07, 0.08), gunWood, 0, -0.02, -0.25);
  firstPersonPart(dagger, new THREE.CylinderGeometry(0.07, 0.085, 0.38, 8), gunDark, 0, -0.2, -0.12, 0.2);
  firstPersonPart(dagger, new THREE.BoxGeometry(0.2, 0.2, 0.27), gloveMaterial, 0, -0.37, -0.08);
  dagger.rotation.z = -0.28;
  dagger.visible = false;
  weapon.add(dagger);
  weaponModels["匕首"] = dagger;

  // 火箭发射器：大口径管身、瞄具和握把。
  const rocket = new THREE.Group();
  firstPersonPart(rocket, new THREE.CylinderGeometry(0.14, 0.14, 1.45, 12), gunMetal, 0, 0.02, -0.62, Math.PI / 2);
  firstPersonPart(rocket, new THREE.CylinderGeometry(0.19, 0.19, 0.22, 12), gunDark, 0, 0.02, -1.38, Math.PI / 2);
  firstPersonPart(rocket, new THREE.BoxGeometry(0.12, 0.19, 0.32), gunDark, 0, 0.2, -0.48);
  firstPersonPart(rocket, new THREE.BoxGeometry(0.16, 0.36, 0.2), gunWood, 0, -0.25, -0.35, -0.18);
  firstPersonPart(rocket, new THREE.BoxGeometry(0.2, 0.2, 0.28), gloveMaterial, 0.08, -0.36, -0.3);
  rocket.visible = false;
  weapon.add(rocket);
  weaponModels["火箭弹"] = rocket;
}

createFirstPersonWeaponModels();

function getWeaponAmmo(name) {
  const profile = weaponProfiles[name];
  if (!profile || !profile.usesAmmo) return null;
  if (!weaponAmmo[name]) {
    weaponAmmo[name] = {
      magazine: profile.magazineSize,
      reserve: profile.reserveMax
    };
  }
  return weaponAmmo[name];
}

function resetAllAmmo() {
  for (const name in weaponProfiles) {
    const profile = weaponProfiles[name];
    if (!profile.usesAmmo) continue;
    weaponAmmo[name] = {
      magazine: profile.magazineSize,
      reserve: profile.reserveMax
    };
  }
  reloadingWeapon = null;
  reloadTimer = 0;
  reloadDuration = 0;
  updateAmmoUI();
}

function updateAmmoUI() {
  const profile = weaponProfiles[currentWeapon];
  if (!profile || !profile.usesAmmo) {
    ammoText.textContent = "无限";
    ammoText.classList.remove("low");
    reloadIndicator.classList.remove("visible");
    return;
  }

  const ammo = getWeaponAmmo(currentWeapon);
  ammoText.textContent = ammo.magazine + " / " + ammo.reserve;
  ammoText.classList.toggle(
    "low",
    ammo.magazine <= Math.max(1, Math.floor(profile.magazineSize * 0.25))
  );
  const isCurrentReload = reloadingWeapon === currentWeapon && reloadTimer > 0;
  reloadIndicator.classList.toggle("visible", isCurrentReload);
  if (isCurrentReload) {
    reloadIndicator.textContent =
      "正在换弹　" + Math.max(0, reloadTimer).toFixed(1) + " 秒";
  }
}

function cancelReload() {
  reloadingWeapon = null;
  reloadTimer = 0;
  reloadDuration = 0;
  reloadIndicator.classList.remove("visible");
}

function startReload(announce) {
  const profile = weaponProfiles[currentWeapon];
  const ammo = getWeaponAmmo(currentWeapon);
  if (
    !profile || !profile.usesAmmo || !ammo ||
    reloadingWeapon || ammo.magazine >= profile.magazineSize || ammo.reserve <= 0
  ) {
    return false;
  }

  reloadingWeapon = currentWeapon;
  reloadTimer = profile.reloadTime;
  reloadDuration = profile.reloadTime;
  setAiming(false);
  if (announce) showPickupNotice("开始换弹：" + currentWeapon);
  updateAmmoUI();
  return true;
}

function completeReload() {
  if (!reloadingWeapon) return;
  const name = reloadingWeapon;
  const profile = weaponProfiles[name];
  const ammo = getWeaponAmmo(name);
  if (profile && ammo) {
    const needed = profile.magazineSize - ammo.magazine;
    const loaded = Math.min(needed, ammo.reserve);
    ammo.magazine += loaded;
    ammo.reserve -= loaded;
  }
  cancelReload();
  updateAmmoUI();
}

function refillAllAmmo() {
  let changed = false;
  for (const name in weaponProfiles) {
    const profile = weaponProfiles[name];
    if (!profile.usesAmmo) continue;
    const ammo = getWeaponAmmo(name);
    if (ammo.magazine < profile.magazineSize || ammo.reserve < profile.reserveMax) {
      changed = true;
    }
    ammo.magazine = profile.magazineSize;
    ammo.reserve = profile.reserveMax;
  }
  cancelReload();
  updateAmmoUI();
  return changed;
}

function refillWeaponAmmo(name) {
  const profile = weaponProfiles[name];
  const ammo = getWeaponAmmo(name);
  if (!profile || !profile.usesAmmo || !ammo) return;
  ammo.magazine = profile.magazineSize;
  ammo.reserve = Math.max(ammo.reserve, Math.ceil(profile.reserveMax * 0.5));
  updateAmmoUI();
}

function setAiming(active) {
  aiming = Boolean(
    active &&
    currentWeapon === "狙击枪" &&
    !reloadingWeapon &&
    gameState === "战斗" &&
    document.pointerLockElement === renderer.domElement
  );
  scopeOverlay.classList.toggle("active", aiming);
  crosshair.style.opacity = aiming ? "0" : "1";
}

function setCurrentWeapon(name, announce) {
  if (!weaponProfiles[name]) return;
  cancelReload();
  setAiming(false);
  currentWeapon = name;
  for (const part of machineGunParts) part.visible = name === "机枪";
  for (const modelName in weaponModels) {
    weaponModels[modelName].visible = modelName === name;
  }

  const muzzlePositions = {
    "机枪": [0, 0.035, -1.66],
    "手枪": [0, 0, -1.12],
    "狙击枪": [0, 0.02, -2.25],
    "匕首": [0, 0.1, -1.05],
    "火箭弹": [0, 0.02, -1.58]
  };
  muzzleFlash.position.fromArray(muzzlePositions[name]);
  muzzleLight.position.copy(muzzleFlash.position);
  weaponText.textContent = name;
  updateAmmoUI();
  if (announce) showPickupNotice("已装备：" + name);
}

resetAllAmmo();

// -----------------------------------------------------------------------
// 地图自然物资：血包、弹药包、随机物资包与五种武器
// -----------------------------------------------------------------------
const healthPickupMaterial = new THREE.MeshStandardMaterial({
  color: 0xe63c36, roughness: 0.48, emissive: 0x3b0806, emissiveIntensity: 0.55
});
const ammoPickupMaterial = new THREE.MeshStandardMaterial({
  color: 0x3aa8c8, roughness: 0.38, metalness: 0.5,
  emissive: 0x073445, emissiveIntensity: 0.5
});
const supplyPickupMaterial = new THREE.MeshStandardMaterial({
  color: 0x65713d, roughness: 0.72, metalness: 0.18
});
const pickupMetalMaterial = new THREE.MeshStandardMaterial({
  color: 0x788993, roughness: 0.34, metalness: 0.78
});
const pickupDarkMaterial = new THREE.MeshStandardMaterial({
  color: 0x171b1e, roughness: 0.62, metalness: 0.42
});
const pickupWoodMaterial = new THREE.MeshStandardMaterial({
  color: 0x8b5129, roughness: 0.7
});
const pickupHaloMaterials = Object.create(null);
const pickupWeaponNames = ["狙击枪", "机枪", "匕首", "手枪", "火箭弹"];
const pickupTypeLimits = {
  "血包": 8,
  "弹药包": 6,
  "物资包": 4
};

function addPickupMesh(group, geometry, material, x, y, z, rx, ry, rz) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x || 0, y || 0, z || 0);
  mesh.rotation.set(rx || 0, ry || 0, rz || 0);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function createPickupVisual(type) {
  const group = new THREE.Group();
  let color = 0x70e88f;

  if (type === "血包") {
    color = 0xff4b44;
    addPickupMesh(group, new THREE.BoxGeometry(0.82, 0.24, 0.58), pickupDarkMaterial, 0, 0.25, 0);
    addPickupMesh(group, new THREE.BoxGeometry(0.19, 0.52, 0.08), healthPickupMaterial, 0, 0.48, -0.3);
    addPickupMesh(group, new THREE.BoxGeometry(0.52, 0.19, 0.08), healthPickupMaterial, 0, 0.48, -0.3);
  } else if (type === "弹药包") {
    color = 0x58d9ff;
    addPickupMesh(group, new THREE.BoxGeometry(0.92, 0.52, 0.68), ammoPickupMaterial, 0, 0.3, 0);
    addPickupMesh(group, new THREE.BoxGeometry(0.96, 0.09, 0.72), pickupDarkMaterial, 0, 0.5, 0);
    addPickupMesh(group, new THREE.BoxGeometry(0.12, 0.58, 0.72), pickupMetalMaterial, -0.28, 0.3, 0);
    addPickupMesh(group, new THREE.BoxGeometry(0.12, 0.58, 0.72), pickupMetalMaterial, 0.28, 0.3, 0);
    for (const x of [-0.24, 0, 0.24]) {
      addPickupMesh(group, new THREE.CylinderGeometry(0.035, 0.045, 0.28, 7), pickupWoodMaterial, x, 0.73, 0);
    }
  } else if (type === "物资包") {
    color = 0xc993ff;
    addPickupMesh(group, new THREE.BoxGeometry(0.96, 0.62, 0.78), supplyPickupMaterial, 0, 0.34, 0);
    addPickupMesh(group, new THREE.BoxGeometry(1.02, 0.1, 0.84), pickupDarkMaterial, 0, 0.62, 0);
    addPickupMesh(group, new THREE.BoxGeometry(0.14, 0.68, 0.84), pickupWoodMaterial, 0, 0.34, 0);
    addPickupMesh(group, new THREE.TorusGeometry(0.18, 0.035, 7, 16, Math.PI), pickupMetalMaterial, 0, 0.82, 0, 0, 0, Math.PI);
  } else if (type === "机枪") {
    color = 0xffc35e;
    addPickupMesh(group, new THREE.BoxGeometry(0.22, 0.22, 0.9), pickupMetalMaterial, 0, 0.35, 0);
    addPickupMesh(group, new THREE.CylinderGeometry(0.035, 0.035, 0.72, 8), pickupDarkMaterial, 0, 0.35, -0.78, Math.PI / 2);
    addPickupMesh(group, new THREE.BoxGeometry(0.17, 0.42, 0.22), pickupWoodMaterial, 0, 0.12, 0.18, -0.18);
  } else if (type === "手枪") {
    color = 0x7bcaff;
    addPickupMesh(group, new THREE.BoxGeometry(0.22, 0.22, 0.7), pickupMetalMaterial, 0, 0.36, -0.12);
    addPickupMesh(group, new THREE.BoxGeometry(0.2, 0.46, 0.22), pickupDarkMaterial, 0, 0.08, 0.08, -0.2);
  } else if (type === "狙击枪") {
    color = 0x7fb5ff;
    addPickupMesh(group, new THREE.BoxGeometry(0.2, 0.2, 1.18), pickupMetalMaterial, 0, 0.38, 0);
    addPickupMesh(group, new THREE.CylinderGeometry(0.025, 0.032, 0.9, 9), pickupDarkMaterial, 0, 0.38, -0.98, Math.PI / 2);
    addPickupMesh(group, new THREE.BoxGeometry(0.21, 0.25, 0.55), pickupWoodMaterial, 0, 0.33, 0.78, -0.1);
    addPickupMesh(group, new THREE.CylinderGeometry(0.065, 0.065, 0.45, 10), pickupDarkMaterial, 0, 0.62, -0.12, Math.PI / 2);
    addPickupMesh(group, new THREE.BoxGeometry(0.05, 0.12, 0.18), pickupDarkMaterial, 0, 0.5, -0.12);
  } else if (type === "匕首") {
    color = 0xf0f3ff;
    addPickupMesh(group, new THREE.ConeGeometry(0.15, 0.9, 4), pickupMetalMaterial, 0, 0.58, 0, 0, 0, Math.PI / 4);
    addPickupMesh(group, new THREE.BoxGeometry(0.46, 0.08, 0.12), pickupWoodMaterial, 0, 0.12, 0);
    addPickupMesh(group, new THREE.CylinderGeometry(0.07, 0.08, 0.35, 8), pickupDarkMaterial, 0, -0.08, 0);
  } else if (type === "火箭弹") {
    color = 0xff7c52;
    addPickupMesh(group, new THREE.CylinderGeometry(0.16, 0.16, 1.15, 12), pickupMetalMaterial, 0, 0.35, 0, Math.PI / 2);
    addPickupMesh(group, new THREE.CylinderGeometry(0.21, 0.21, 0.22, 12), pickupDarkMaterial, 0, 0.35, -0.64, Math.PI / 2);
    addPickupMesh(group, new THREE.BoxGeometry(0.16, 0.4, 0.2), pickupWoodMaterial, 0, 0.08, 0.04, -0.15);
  }

  if (!pickupHaloMaterials[color]) {
    pickupHaloMaterials[color] = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.72,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
  }
  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(0.72, 0.025, 7, 28),
    pickupHaloMaterials[color]
  );
  halo.rotation.x = Math.PI / 2;
  halo.position.y = 0.06;
  group.add(halo);
  group.userData.halo = halo;
  return group;
}

function choosePickupPosition() {
  let fallback = new THREE.Vector3(0, 0, 0);
  for (let attempt = 0; attempt < 90; attempt++) {
    const candidate = spawnPoints.length > 0
      ? spawnPoints[Math.floor(Math.random() * spawnPoints.length)].clone()
      : new THREE.Vector3(
          THREE.MathUtils.randFloat(-47, 47),
          0,
          THREE.MathUtils.randFloat(-47, 47)
        );
    fallback.copy(candidate);
    if (candidate.distanceTo(new THREE.Vector3(playerStart.x, 0, playerStart.z)) < 5) continue;
    if (collidesAt(candidate.x, candidate.z, 0.72, 0, 1.1)) continue;

    let crowded = false;
    for (const pickup of pickups) {
      if (pickup.group.position.distanceTo(candidate) < 4.2) {
        crowded = true;
        break;
      }
    }
    if (!crowded) return candidate;
  }
  return fallback;
}

function spawnPickup(type) {
  const visual = createPickupVisual(type);
  const position = choosePickupPosition();
  visual.position.set(position.x, 0.13, position.z);
  pickupRoot.add(visual);
  pickups.push({
    type: type,
    group: visual,
    baseY: 0.13,
    phase: Math.random() * Math.PI * 2
  });
  return true;
}

function countPickupsOfType(type) {
  let count = 0;
  for (const pickup of pickups) {
    if (pickup.type === type) count++;
  }
  return count;
}

function randomAmbientDelay(type) {
  if (type === "弹药包") return THREE.MathUtils.randFloat(13, 22);
  if (type === "血包") return THREE.MathUtils.randFloat(17, 27);
  return THREE.MathUtils.randFloat(24, 38);
}

function pickupRespawnDelay(type) {
  if (type === "弹药包") return THREE.MathUtils.randFloat(16, 25);
  if (type === "血包") return THREE.MathUtils.randFloat(18, 28);
  if (type === "物资包") return THREE.MathUtils.randFloat(28, 42);
  return THREE.MathUtils.randFloat(30, 44);
}

function clearMapPickups() {
  while (pickupRoot.children.length > 0) {
    const child = pickupRoot.children[pickupRoot.children.length - 1];
    child.traverse(function (object) {
      if (object.geometry) object.geometry.dispose();
    });
    pickupRoot.remove(child);
  }
  pickups.length = 0;
  pickupRespawnTimers.length = 0;
  ambientPickupTimers.length = 0;
}

function populateMapPickups() {
  clearMapPickups();
  // 初始补给保持充足但不过量；三类补给还会在战斗中按随机周期自然刷新。
  for (let i = 0; i < 6; i++) spawnPickup("血包");
  for (let i = 0; i < 4; i++) spawnPickup("弹药包");
  for (let i = 0; i < 3; i++) spawnPickup("物资包");
  for (const name of pickupWeaponNames) {
    spawnPickup(name);
  }
  for (const type of ["弹药包", "血包", "物资包"]) {
    ambientPickupTimers.push({
      type: type,
      remaining: randomAmbientDelay(type)
    });
  }
}

function showPickupNotice(message) {
  pickupNotice.textContent = message;
  pickupNoticeTimer = 2.1;
  pickupNotice.style.opacity = "1";
}

function collectPickup(pickup) {
  if (pickup.type === "血包") {
    if (player.health >= 100) return false;
    const healed = Math.min(30, 100 - player.health);
    player.health = Math.min(100, player.health + 30);
    updateHealthUI();
    showPickupNotice("拾取血包：生命值 +" + Math.ceil(healed));
  } else if (pickup.type === "弹药包") {
    if (!refillAllAmmo()) return false;
    showPickupNotice("拾取弹药包：所有远程武器弹药已补满");
  } else if (pickup.type === "物资包") {
    const alternatives = pickupWeaponNames.filter(function (name) {
      return name !== currentWeapon;
    });
    const granted = alternatives[Math.floor(Math.random() * alternatives.length)] || "机枪";
    setCurrentWeapon(granted, false);
    refillWeaponAmmo(granted);
    showPickupNotice("开启物资包：获得 " + granted);
  } else {
    if (pickup.type === currentWeapon) return false;
    setCurrentWeapon(pickup.type, true);
    refillWeaponAmmo(pickup.type);
  }

  pickup.group.traverse(function (object) {
    if (object.geometry) object.geometry.dispose();
  });
  pickupRoot.remove(pickup.group);
  const index = pickups.indexOf(pickup);
  if (index >= 0) pickups.splice(index, 1);
  pickupRespawnTimers.push({
    type: pickup.type,
    remaining: pickupRespawnDelay(pickup.type)
  });
  return true;
}

function updatePickups(delta) {
  const now = performance.now() * 0.001;
  for (let i = pickups.length - 1; i >= 0; i--) {
    const pickup = pickups[i];
    pickup.group.position.y = pickup.baseY + Math.sin(now * 2.2 + pickup.phase) * 0.12;
    pickup.group.rotation.y += delta * 0.8;
    pickup.group.userData.halo.rotation.z -= delta * 0.7;

    const horizontalDistance = Math.hypot(
      player.position.x - pickup.group.position.x,
      player.position.z - pickup.group.position.z
    );
    if (
      gameState === "战斗" &&
      horizontalDistance < 1.25 &&
      Math.abs(player.position.y - pickup.group.position.y) < 1.7
    ) {
      collectPickup(pickup);
    }
  }

  if (gameState !== "战斗") return;
  for (let i = pickupRespawnTimers.length - 1; i >= 0; i--) {
    const timer = pickupRespawnTimers[i];
    timer.remaining -= delta;
    if (timer.remaining <= 0) {
      const limit = pickupTypeLimits[timer.type];
      if (limit && countPickupsOfType(timer.type) >= limit) {
        timer.remaining = THREE.MathUtils.randFloat(4, 7);
        continue;
      }
      spawnPickup(timer.type);
      pickupRespawnTimers.splice(i, 1);
    }
  }

  // 即使玩家暂时没有拾取，补给系统也会不定期尝试在安全地面补充物资。
  for (const timer of ambientPickupTimers) {
    timer.remaining -= delta;
    if (timer.remaining > 0) continue;
    const limit = pickupTypeLimits[timer.type];
    if (!limit || countPickupsOfType(timer.type) < limit) {
      spawnPickup(timer.type);
    }
    timer.remaining = randomAmbientDelay(timer.type);
  }
}
