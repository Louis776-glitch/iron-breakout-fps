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

const gunBlue = new THREE.MeshStandardMaterial({
  color: 0x246f88,
  roughness: 0.38,
  metalness: 0.62,
  depthTest: false,
  depthWrite: false
});

const gunOlive = new THREE.MeshStandardMaterial({
  color: 0x52613b,
  roughness: 0.55,
  metalness: 0.34,
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
    usesAmmo: true, magazineSize: 45, reserveMax: 180, reloadTime: 2.25,
    weaponClass: "突击步枪", automatic: true,
    description: "均衡可靠的制式突击武器，适合中近距离持续压制。",
    mechanic: "全自动射击 · 后坐力与射速均衡"
  },
  "手枪": {
    type: "hitscan", damage: 48, cooldown: 0.34, range: 125,
    recoil: 0.12, shake: 0.021, flash: true,
    usesAmmo: true, magazineSize: 15, reserveMax: 75, reloadTime: 1.5,
    weaponClass: "副武器", automatic: true,
    description: "轻巧的高伤害手枪，换弹迅速，适合精准点射。",
    mechanic: "精准单发 · 快速换弹"
  },
  "狙击枪": {
    type: "hitscan", damage: 135, cooldown: 1.08, range: 190,
    recoil: 0.19, shake: 0.032, flash: true,
    usesAmmo: true, magazineSize: 5, reserveMax: 25, reloadTime: 2.8,
    weaponClass: "远程精确武器", automatic: true,
    description: "拥有最高单发伤害与最远有效射程，适合占据狙击塔作战。",
    mechanic: "按住鼠标右键开启瞄准镜"
  },
  "匕首": {
    type: "melee", damage: 112, cooldown: 0.46, range: 2.55,
    recoil: 0.15, shake: 0.012, flash: false,
    usesAmmo: false, magazineSize: 0, reserveMax: 0, reloadTime: 0,
    weaponClass: "近战武器", automatic: true,
    description: "无需弹药的高伤近战装备，必须贴近目标才能命中。",
    mechanic: "无限使用 · 极短射程"
  },
  "火箭弹": {
    type: "rocket", damage: 145, cooldown: 1.15, range: 150,
    recoil: 0.2, shake: 0.035, flash: true,
    usesAmmo: true, magazineSize: 1, reserveMax: 5, reloadTime: 1.85,
    weaponClass: "重型爆炸武器", automatic: true, blastRadius: 5.2,
    description: "发射直线飞行的高爆火箭，可同时杀伤爆心周围的多名敌人。",
    mechanic: "爆炸半径 5.2 米 · 距离衰减伤害"
  },
  "霰弹枪": {
    type: "shotgun", damage: 18, pellets: 8, spread: 0.075,
    cooldown: 0.82, range: 55, recoil: 0.2, shake: 0.038, flash: true,
    usesAmmo: true, magazineSize: 8, reserveMax: 40, reloadTime: 2.6,
    weaponClass: "近距霰弹武器", automatic: true, damageLabel: "18 × 8",
    description: "一次射出八枚弹丸，近距离可造成极高总伤害，距离越远散布越大。",
    mechanic: "每发 8 枚弹丸 · 扇形散射"
  },
  "冲锋枪": {
    type: "hitscan", damage: 16, cooldown: 0.065, range: 90,
    recoil: 0.055, shake: 0.01, flash: true,
    usesAmmo: true, magazineSize: 50, reserveMax: 250, reloadTime: 1.9,
    weaponClass: "高速近战武器", automatic: true,
    description: "全武器库射速最快，机动灵活，适合在房间和回廊内贴近压制。",
    mechanic: "超高射速 · 低单发伤害"
  },
  "半自动步枪": {
    type: "hitscan", damage: 68, cooldown: 0.26, range: 170,
    recoil: 0.13, shake: 0.022, flash: true,
    usesAmmo: true, magazineSize: 12, reserveMax: 72, reloadTime: 2.05,
    weaponClass: "中远程精确武器", automatic: false,
    description: "高精度、高单发伤害的半自动步枪，每次点击只射出一发子弹。",
    mechanic: "半自动扳机 · 必须逐次点击射击"
  },
  "榴弹发射器": {
    type: "grenade", damage: 110, cooldown: 1, range: 110,
    recoil: 0.18, shake: 0.03, flash: true,
    usesAmmo: true, magazineSize: 4, reserveMax: 16, reloadTime: 3.1,
    weaponClass: "弧线爆炸武器", automatic: true, blastRadius: 4.6,
    description: "发射受重力影响的高爆榴弹，适合越过低矮掩体攻击成群敌人。",
    mechanic: "弧线弹道 · 爆炸半径 4.6 米"
  },
  "电击枪": {
    type: "taser", damage: 28, cooldown: 0.45, range: 32,
    recoil: 0.07, shake: 0.012, flash: true,
    usesAmmo: true, magazineSize: 12, reserveMax: 60, reloadTime: 1.8,
    weaponClass: "战术控制武器", automatic: true,
    description: "短射程电击武器，命中后使敌人的移动速度暂时降低。",
    mechanic: "命中减速 3 秒 · 蓝色电火花"
  },
  "轻机枪": {
    type: "hitscan", damage: 30, cooldown: 0.11, range: 145,
    recoil: 0.09, shake: 0.018, flash: true,
    usesAmmo: true, magazineSize: 100, reserveMax: 300, reloadTime: 4.8,
    weaponClass: "持续火力武器", automatic: true,
    description: "百发弹箱提供最长持续火力，代价是明显后坐力与较慢换弹。",
    mechanic: "100 发弹箱 · 长换弹时间"
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
  // 圆锥底面朝向玩家并紧贴护手，尖端朝屏幕前方；不再附加会让底面
  // 歪斜的 Z 轴旋转。
  firstPersonPart(dagger, new THREE.ConeGeometry(0.13, 0.92, 4), gunMetal, 0, 0, -0.75, -Math.PI / 2);
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

  // 霰弹枪：双粗枪管、木质泵动护木与厚实枪托。
  const shotgun = new THREE.Group();
  firstPersonPart(shotgun, new THREE.BoxGeometry(0.25, 0.23, 0.92), gunMetal, 0, 0, -0.42);
  for (const x of [-0.058, 0.058]) {
    firstPersonPart(shotgun, new THREE.CylinderGeometry(0.043, 0.043, 0.98, 9), gunDark, x, 0.05, -1.37, Math.PI / 2);
  }
  firstPersonPart(shotgun, new THREE.BoxGeometry(0.27, 0.2, 0.42), gunWood, 0, -0.02, -0.98);
  firstPersonPart(shotgun, new THREE.BoxGeometry(0.23, 0.24, 0.68), gunWood, 0, -0.02, 0.4, -0.08);
  firstPersonPart(shotgun, new THREE.BoxGeometry(0.18, 0.34, 0.19), gunDark, 0, -0.27, -0.28, -0.16);
  firstPersonPart(shotgun, new THREE.BoxGeometry(0.2, 0.2, 0.28), gloveMaterial, 0.08, -0.25, -0.65, -0.15);
  shotgun.visible = false;
  weapon.add(shotgun);
  weaponModels["霰弹枪"] = shotgun;

  // 冲锋枪：短枪管、折叠枪托和加长弹匣。
  const smg = new THREE.Group();
  firstPersonPart(smg, new THREE.BoxGeometry(0.25, 0.24, 0.68), gunMetal, 0, 0, -0.38);
  firstPersonPart(smg, new THREE.CylinderGeometry(0.035, 0.04, 0.5, 9), gunDark, 0, 0.02, -0.95, Math.PI / 2);
  firstPersonPart(smg, new THREE.BoxGeometry(0.2, 0.55, 0.18), gunDark, 0, -0.34, -0.38, -0.12);
  firstPersonPart(smg, new THREE.BoxGeometry(0.08, 0.13, 0.62), gunMetal, 0, 0.02, 0.3);
  firstPersonPart(smg, new THREE.BoxGeometry(0.18, 0.32, 0.19), gunDark, 0, -0.25, 0.02, -0.18);
  firstPersonPart(smg, new THREE.BoxGeometry(0.19, 0.19, 0.26), gloveMaterial, 0.07, -0.25, -0.58);
  smg.visible = false;
  weapon.add(smg);
  weaponModels["冲锋枪"] = smg;

  // 半自动步枪：改为现代无托式轮廓。后置弹匣、聚合物枪身和方形
  // 反射瞄具让它与木托、长镜筒的狙击枪形成明显区别。
  const semiRifle = new THREE.Group();
  firstPersonPart(semiRifle, new THREE.BoxGeometry(0.29, 0.27, 0.82), gunOlive, 0, 0, -0.35);
  firstPersonPart(semiRifle, new THREE.BoxGeometry(0.24, 0.21, 0.58), gunDark, 0, 0.01, -1.02);
  firstPersonPart(semiRifle, new THREE.CylinderGeometry(0.03, 0.036, 0.72, 10), gunMetal, 0, 0.02, -1.66, Math.PI / 2);
  firstPersonPart(semiRifle, new THREE.CylinderGeometry(0.055, 0.055, 0.16, 10), gunDark, 0, 0.02, -2.09, Math.PI / 2);
  firstPersonPart(semiRifle, new THREE.BoxGeometry(0.31, 0.34, 0.48), gunOlive, 0, -0.02, 0.3, -0.08);
  firstPersonPart(semiRifle, new THREE.BoxGeometry(0.2, 0.4, 0.22), gunDark, 0, -0.3, 0.05, -0.15);
  firstPersonPart(semiRifle, new THREE.BoxGeometry(0.18, 0.34, 0.2), gunDark, 0, -0.28, -0.48, -0.2);
  firstPersonPart(semiRifle, new THREE.BoxGeometry(0.11, 0.07, 0.86), gunMetal, 0, 0.19, -0.55);
  firstPersonPart(semiRifle, new THREE.BoxGeometry(0.2, 0.16, 0.25), gunBlue, 0, 0.3, -0.52);
  firstPersonPart(semiRifle, new THREE.BoxGeometry(0.2, 0.2, 0.28), gloveMaterial, 0.08, -0.24, -0.75);
  semiRifle.visible = false;
  weapon.add(semiRifle);
  weaponModels["半自动步枪"] = semiRifle;

  // 榴弹发射器：大口径短管与四发转轮弹巢。
  const grenadeLauncher = new THREE.Group();
  firstPersonPart(grenadeLauncher, new THREE.CylinderGeometry(0.11, 0.11, 0.9, 12), gunMetal, 0, 0.04, -0.78, Math.PI / 2);
  firstPersonPart(grenadeLauncher, new THREE.CylinderGeometry(0.21, 0.21, 0.38, 12), gunDark, 0, -0.02, -0.24, Math.PI / 2);
  firstPersonPart(grenadeLauncher, new THREE.CylinderGeometry(0.15, 0.15, 0.2, 10), gunOlive, 0, 0.04, -1.27, Math.PI / 2);
  firstPersonPart(grenadeLauncher, new THREE.BoxGeometry(0.2, 0.31, 0.25), gunWood, 0, -0.27, -0.12, -0.18);
  firstPersonPart(grenadeLauncher, new THREE.BoxGeometry(0.2, 0.22, 0.64), gunOlive, 0, -0.02, 0.37);
  firstPersonPart(grenadeLauncher, new THREE.BoxGeometry(0.2, 0.2, 0.28), gloveMaterial, 0.08, -0.28, -0.45);
  grenadeLauncher.visible = false;
  weapon.add(grenadeLauncher);
  weaponModels["榴弹发射器"] = grenadeLauncher;

  // 电击枪：蓝色绝缘外壳、双电极和能量电池。
  const taser = new THREE.Group();
  firstPersonPart(taser, new THREE.BoxGeometry(0.26, 0.26, 0.72), gunBlue, 0, 0, -0.42);
  for (const x of [-0.075, 0.075]) {
    firstPersonPart(taser, new THREE.CylinderGeometry(0.018, 0.018, 0.28, 7), gunMetal, x, 0.02, -0.91, Math.PI / 2);
  }
  firstPersonPart(taser, new THREE.BoxGeometry(0.22, 0.4, 0.24), gunDark, 0, -0.29, -0.2, -0.2);
  firstPersonPart(taser, new THREE.BoxGeometry(0.14, 0.22, 0.18), gunBlue, 0, -0.3, -0.45);
  firstPersonPart(taser, new THREE.BoxGeometry(0.2, 0.19, 0.27), gloveMaterial, 0.05, -0.39, -0.16);
  taser.visible = false;
  weapon.add(taser);
  weaponModels["电击枪"] = taser;

  // 轻机枪：重型枪身、百发弹箱、提把和长枪管。
  const lightMachineGun = new THREE.Group();
  firstPersonPart(lightMachineGun, new THREE.BoxGeometry(0.3, 0.27, 1.02), gunMetal, 0, 0, -0.47);
  firstPersonPart(lightMachineGun, new THREE.CylinderGeometry(0.04, 0.046, 1.03, 10), gunDark, 0, 0.03, -1.51, Math.PI / 2);
  firstPersonPart(lightMachineGun, new THREE.CylinderGeometry(0.065, 0.065, 0.18, 10), gunDark, 0, 0.03, -2.07, Math.PI / 2);
  firstPersonPart(lightMachineGun, new THREE.BoxGeometry(0.4, 0.43, 0.38), gunOlive, 0, -0.29, -0.38);
  firstPersonPart(lightMachineGun, new THREE.BoxGeometry(0.24, 0.25, 0.66), gunWood, 0, -0.02, 0.42);
  firstPersonPart(lightMachineGun, new THREE.TorusGeometry(0.19, 0.025, 7, 16, Math.PI), gunDark, 0, 0.27, -0.4, Math.PI / 2, 0, Math.PI / 2);
  firstPersonPart(lightMachineGun, new THREE.BoxGeometry(0.2, 0.2, 0.28), gloveMaterial, 0.09, -0.31, -0.7);
  lightMachineGun.visible = false;
  weapon.add(lightMachineGun);
  weaponModels["轻机枪"] = lightMachineGun;
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
    "火箭弹": [0, 0.02, -1.58],
    "霰弹枪": [0, 0.05, -1.9],
    "冲锋枪": [0, 0.02, -1.23],
    "半自动步枪": [0, 0.02, -2.2],
    "榴弹发射器": [0, 0.04, -1.46],
    "电击枪": [0, 0.02, -1.08],
    "轻机枪": [0, 0.03, -2.18]
  };
  muzzleFlash.position.fromArray(muzzlePositions[name]);
  muzzleLight.position.copy(muzzleFlash.position);
  weaponText.textContent = name;
  updateAmmoUI();
  if (announce) showPickupNotice("已装备：" + name);
}

resetAllAmmo();

// -----------------------------------------------------------------------
// 地图自然物资：血包、弹药包、随机物资包与全部十一种武器
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
const pickupWeaponNames = [
  "机枪", "手枪", "狙击枪", "匕首", "火箭弹", "霰弹枪",
  "冲锋枪", "半自动步枪", "榴弹发射器", "电击枪", "轻机枪"
];
let nearbyWeaponPickup = null;
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
    // 圆锥沿 Y 轴竖直放置，底面高度 0.16，正好与护手顶面贴合。
    addPickupMesh(group, new THREE.ConeGeometry(0.15, 0.9, 4), pickupMetalMaterial, 0, 0.61, 0);
    addPickupMesh(group, new THREE.BoxGeometry(0.46, 0.08, 0.12), pickupWoodMaterial, 0, 0.12, 0);
    addPickupMesh(group, new THREE.CylinderGeometry(0.07, 0.08, 0.35, 8), pickupDarkMaterial, 0, -0.08, 0);
  } else if (type === "火箭弹") {
    color = 0xff7c52;
    addPickupMesh(group, new THREE.CylinderGeometry(0.16, 0.16, 1.15, 12), pickupMetalMaterial, 0, 0.35, 0, Math.PI / 2);
    addPickupMesh(group, new THREE.CylinderGeometry(0.21, 0.21, 0.22, 12), pickupDarkMaterial, 0, 0.35, -0.64, Math.PI / 2);
    addPickupMesh(group, new THREE.BoxGeometry(0.16, 0.4, 0.2), pickupWoodMaterial, 0, 0.08, 0.04, -0.15);
  } else if (type === "霰弹枪") {
    color = 0xffa54f;
    addPickupMesh(group, new THREE.BoxGeometry(0.24, 0.22, 0.92), pickupMetalMaterial, 0, 0.38, 0);
    for (const x of [-0.055, 0.055]) {
      addPickupMesh(group, new THREE.CylinderGeometry(0.04, 0.04, 0.94, 9), pickupDarkMaterial, x, 0.42, -0.88, Math.PI / 2);
    }
    addPickupMesh(group, new THREE.BoxGeometry(0.27, 0.2, 0.4), pickupWoodMaterial, 0, 0.37, -0.5);
    addPickupMesh(group, new THREE.BoxGeometry(0.23, 0.23, 0.68), pickupWoodMaterial, 0, 0.35, 0.78, -0.08);
    addPickupMesh(group, new THREE.BoxGeometry(0.18, 0.36, 0.18), pickupDarkMaterial, 0, 0.14, 0.2, -0.16);
  } else if (type === "冲锋枪") {
    color = 0x5ad4ff;
    addPickupMesh(group, new THREE.BoxGeometry(0.25, 0.24, 0.7), pickupMetalMaterial, 0, 0.38, 0);
    addPickupMesh(group, new THREE.CylinderGeometry(0.035, 0.04, 0.48, 9), pickupDarkMaterial, 0, 0.4, -0.58, Math.PI / 2);
    addPickupMesh(group, new THREE.BoxGeometry(0.2, 0.55, 0.18), pickupDarkMaterial, 0, 0.08, -0.02, -0.12);
    addPickupMesh(group, new THREE.BoxGeometry(0.08, 0.13, 0.58), pickupMetalMaterial, 0, 0.38, 0.62);
    addPickupMesh(group, new THREE.BoxGeometry(0.18, 0.34, 0.18), pickupDarkMaterial, 0, 0.13, 0.36, -0.18);
  } else if (type === "半自动步枪") {
    color = 0x88d58b;
    addPickupMesh(group, new THREE.BoxGeometry(0.3, 0.28, 0.82), supplyPickupMaterial, 0, 0.4, 0);
    addPickupMesh(group, new THREE.BoxGeometry(0.24, 0.22, 0.58), pickupDarkMaterial, 0, 0.41, -0.66);
    addPickupMesh(group, new THREE.CylinderGeometry(0.03, 0.036, 0.68, 10), pickupMetalMaterial, 0, 0.42, -1.28, Math.PI / 2);
    addPickupMesh(group, new THREE.CylinderGeometry(0.055, 0.055, 0.16, 10), pickupDarkMaterial, 0, 0.42, -1.7, Math.PI / 2);
    addPickupMesh(group, new THREE.BoxGeometry(0.32, 0.35, 0.5), supplyPickupMaterial, 0, 0.37, 0.64, -0.08);
    addPickupMesh(group, new THREE.BoxGeometry(0.2, 0.42, 0.22), pickupDarkMaterial, 0, 0.12, 0.4, -0.15);
    addPickupMesh(group, new THREE.BoxGeometry(0.18, 0.35, 0.2), pickupDarkMaterial, 0, 0.13, -0.13, -0.2);
    addPickupMesh(group, new THREE.BoxGeometry(0.11, 0.07, 0.88), pickupMetalMaterial, 0, 0.59, -0.22);
    addPickupMesh(group, new THREE.BoxGeometry(0.21, 0.17, 0.25), ammoPickupMaterial, 0, 0.71, -0.18);
  } else if (type === "榴弹发射器") {
    color = 0xb6d86b;
    addPickupMesh(group, new THREE.CylinderGeometry(0.11, 0.11, 0.92, 12), pickupMetalMaterial, 0, 0.4, -0.28, Math.PI / 2);
    addPickupMesh(group, new THREE.CylinderGeometry(0.21, 0.21, 0.38, 12), pickupDarkMaterial, 0, 0.34, 0.25, Math.PI / 2);
    addPickupMesh(group, new THREE.CylinderGeometry(0.15, 0.15, 0.2, 10), supplyPickupMaterial, 0, 0.4, -0.83, Math.PI / 2);
    addPickupMesh(group, new THREE.BoxGeometry(0.2, 0.33, 0.23), pickupWoodMaterial, 0, 0.12, 0.43, -0.18);
    addPickupMesh(group, new THREE.BoxGeometry(0.2, 0.22, 0.6), supplyPickupMaterial, 0, 0.36, 0.83);
  } else if (type === "电击枪") {
    color = 0x38e8ff;
    addPickupMesh(group, new THREE.BoxGeometry(0.26, 0.26, 0.72), ammoPickupMaterial, 0, 0.38, 0);
    for (const x of [-0.075, 0.075]) {
      addPickupMesh(group, new THREE.CylinderGeometry(0.018, 0.018, 0.3, 7), pickupMetalMaterial, x, 0.4, -0.5, Math.PI / 2);
    }
    addPickupMesh(group, new THREE.BoxGeometry(0.22, 0.42, 0.24), pickupDarkMaterial, 0, 0.12, 0.17, -0.2);
    addPickupMesh(group, new THREE.BoxGeometry(0.14, 0.22, 0.18), ammoPickupMaterial, 0, 0.12, -0.1);
  } else if (type === "轻机枪") {
    color = 0xf4d36c;
    addPickupMesh(group, new THREE.BoxGeometry(0.3, 0.27, 1.04), pickupMetalMaterial, 0, 0.4, 0);
    addPickupMesh(group, new THREE.CylinderGeometry(0.04, 0.046, 1.04, 10), pickupDarkMaterial, 0, 0.43, -1.04, Math.PI / 2);
    addPickupMesh(group, new THREE.BoxGeometry(0.4, 0.43, 0.38), supplyPickupMaterial, 0, 0.12, -0.12);
    addPickupMesh(group, new THREE.BoxGeometry(0.24, 0.25, 0.66), pickupWoodMaterial, 0, 0.36, 0.86);
    addPickupMesh(group, new THREE.TorusGeometry(0.19, 0.025, 7, 16, Math.PI), pickupDarkMaterial, 0, 0.67, 0, Math.PI / 2, 0, Math.PI / 2);
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

// -----------------------------------------------------------------------
// 主菜单武器库：独立三维场景与可拖动 360° 环绕展示
// -----------------------------------------------------------------------
const armoryScene = new THREE.Scene();
const armoryCamera = new THREE.PerspectiveCamera(38, 1, 0.05, 50);
const armoryPreviewRoot = new THREE.Group();
let armoryPreviewModel = null;
let armorySelectedWeapon = pickupWeaponNames[0];
let armoryDragging = false;
let armoryPointerX = 0;
let armoryPointerY = 0;

const armoryRenderer = new THREE.WebGLRenderer({
  canvas: armoryCanvas,
  antialias: true,
  alpha: true
});
armoryRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
armoryRenderer.outputColorSpace = THREE.SRGBColorSpace;
armoryRenderer.toneMapping = THREE.ACESFilmicToneMapping;
armoryRenderer.toneMappingExposure = 1.45;

armoryCamera.position.set(0, 1.05, 4.8);
armoryCamera.lookAt(0, 0.25, 0);
armoryScene.add(armoryPreviewRoot);
armoryScene.add(new THREE.HemisphereLight(0xdff5ff, 0x17130f, 2.3));
const armoryKeyLight = new THREE.DirectionalLight(0xffe4bc, 4.2);
armoryKeyLight.position.set(4, 5, 4);
armoryScene.add(armoryKeyLight);
const armoryRimLight = new THREE.DirectionalLight(0x4bbde8, 3.1);
armoryRimLight.position.set(-4, 2, -3);
armoryScene.add(armoryRimLight);

const armoryPedestal = new THREE.Mesh(
  new THREE.CylinderGeometry(1.8, 2.05, 0.24, 32),
  new THREE.MeshStandardMaterial({
    color: 0x172127,
    roughness: 0.6,
    metalness: 0.7
  })
);
armoryPedestal.position.y = -1.15;
armoryScene.add(armoryPedestal);

function clearArmoryPreviewModel() {
  if (!armoryPreviewModel) return;
  armoryPreviewModel.traverse(function (object) {
    if (object.geometry) object.geometry.dispose();
  });
  armoryPreviewRoot.remove(armoryPreviewModel);
  armoryPreviewModel = null;
}

function createArmoryPreviewModel(name) {
  const model = createPickupVisual(name);
  const halo = model.userData.halo;
  if (halo) {
    model.remove(halo);
    halo.geometry.dispose();
  }

  model.rotation.set(0, 0, 0);
  model.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(model);
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  model.position.sub(center);
  const longestSide = Math.max(size.x, size.y, size.z, 0.1);
  // 紧凑型手枪不按长枪的同一目标长度放大，否则套筒会占满整个陈列窗。
  const displayScale = name === "手枪" ? 0.68 : 1;
  model.scale.setScalar(3.1 / longestSide * displayScale);
  model.rotation.x = -0.08;
  return model;
}

function selectArmoryWeapon(name) {
  const profile = weaponProfiles[name];
  if (!profile) return;
  armorySelectedWeapon = name;
  clearArmoryPreviewModel();
  armoryPreviewModel = createArmoryPreviewModel(name);
  armoryPreviewRoot.add(armoryPreviewModel);
  armoryPreviewRoot.rotation.set(0.06, -0.55, 0);

  armoryWeaponName.textContent = name;
  armoryWeaponClass.textContent = profile.weaponClass;
  armoryWeaponDescription.textContent = profile.description;
  armoryDamage.textContent = profile.damageLabel || String(profile.damage);
  armoryRange.textContent = profile.range + " 米";
  armoryMagazine.textContent = profile.usesAmmo
    ? String(profile.magazineSize)
    : "无限";
  armoryReserve.textContent = profile.usesAmmo
    ? String(profile.reserveMax)
    : "无限";
  armoryMechanic.textContent = profile.mechanic;

  armoryWeaponList.querySelectorAll(".armory-weapon-button").forEach(function (button) {
    button.classList.toggle("active", button.dataset.weapon === name);
  });
}

function initializeArmory() {
  const fragment = document.createDocumentFragment();
  pickupWeaponNames.forEach(function (name, index) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "armory-weapon-button";
    button.dataset.weapon = name;
    const number = document.createElement("i");
    number.textContent = String(index + 1).padStart(2, "0");
    const label = document.createElement("strong");
    label.textContent = name;
    button.appendChild(number);
    button.appendChild(label);
    button.addEventListener("click", function () {
      selectArmoryWeapon(name);
    });
    fragment.appendChild(button);
  });
  armoryWeaponList.appendChild(fragment);
  selectArmoryWeapon(armorySelectedWeapon);
}

function resizeArmoryRenderer() {
  const width = Math.max(1, armoryCanvas.clientWidth);
  const height = Math.max(1, armoryCanvas.clientHeight);
  const targetWidth = Math.floor(width * Math.min(window.devicePixelRatio, 2));
  const targetHeight = Math.floor(height * Math.min(window.devicePixelRatio, 2));
  if (
    armoryCanvas.width !== targetWidth ||
    armoryCanvas.height !== targetHeight
  ) {
    armoryRenderer.setSize(width, height, false);
    armoryCamera.aspect = width / height;
    armoryCamera.updateProjectionMatrix();
  }
}

function updateArmoryPreview(delta) {
  if (armoryScreen.classList.contains("hidden")) return;
  resizeArmoryRenderer();
  if (!armoryDragging) armoryPreviewRoot.rotation.y += delta * 0.48;
  armoryRenderer.render(armoryScene, armoryCamera);
}

armoryCanvas.addEventListener("pointerdown", function (event) {
  armoryDragging = true;
  armoryPointerX = event.clientX;
  armoryPointerY = event.clientY;
  armoryCanvas.setPointerCapture(event.pointerId);
});

armoryCanvas.addEventListener("pointermove", function (event) {
  if (!armoryDragging) return;
  const movementX = event.clientX - armoryPointerX;
  const movementY = event.clientY - armoryPointerY;
  armoryPointerX = event.clientX;
  armoryPointerY = event.clientY;
  armoryPreviewRoot.rotation.y += movementX * 0.012;
  armoryPreviewRoot.rotation.x = THREE.MathUtils.clamp(
    armoryPreviewRoot.rotation.x + movementY * 0.008,
    -0.65,
    0.65
  );
});

function stopArmoryDragging(event) {
  armoryDragging = false;
  if (event && armoryCanvas.hasPointerCapture(event.pointerId)) {
    armoryCanvas.releasePointerCapture(event.pointerId);
  }
}

armoryCanvas.addEventListener("pointerup", stopArmoryDragging);
armoryCanvas.addEventListener("pointercancel", stopArmoryDragging);
initializeArmory();

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

function isWeaponPickupType(type) {
  return pickupWeaponNames.indexOf(type) >= 0;
}

function spawnPickupAt(type, x, y, z, droppedByPlayer) {
  const visual = createPickupVisual(type);
  visual.position.set(x, y, z);
  pickupRoot.add(visual);
  pickups.push({
    type: type,
    group: visual,
    baseY: y,
    phase: Math.random() * Math.PI * 2,
    droppedByPlayer: Boolean(droppedByPlayer)
  });
  return true;
}

function spawnPickup(type) {
  const position = choosePickupPosition();
  return spawnPickupAt(type, position.x, 0.13, position.z, false);
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
  nearbyWeaponPickup = null;
  interactionPrompt.style.opacity = "0";
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

function removePickupFromWorld(pickup, scheduleRespawn) {
  pickup.group.traverse(function (object) {
    if (object.geometry) object.geometry.dispose();
  });
  pickupRoot.remove(pickup.group);
  const index = pickups.indexOf(pickup);
  if (index >= 0) pickups.splice(index, 1);

  if (scheduleRespawn) {
    pickupRespawnTimers.push({
      type: pickup.type,
      remaining: pickupRespawnDelay(pickup.type)
    });
  }
}

function dropWeaponAtPlayer(type) {
  return spawnPickupAt(
    type,
    player.position.x,
    player.position.y + 0.13,
    player.position.z,
    true
  );
}

function trySwapNearbyWeapon() {
  const pickup = nearbyWeaponPickup;
  if (
    !pickup ||
    pickups.indexOf(pickup) < 0 ||
    !isWeaponPickupType(pickup.type) ||
    pickup.type === currentWeapon
  ) {
    return false;
  }

  const horizontalDistance = Math.hypot(
    player.position.x - pickup.group.position.x,
    player.position.z - pickup.group.position.z
  );
  if (
    horizontalDistance >= 1.7 ||
    Math.abs(player.position.y - pickup.group.position.y) >= 1.7
  ) {
    return false;
  }

  const pickedWeapon = pickup.type;
  const droppedWeapon = currentWeapon;
  // 地面武器只是与玩家手中的武器交换位置，因此不额外安排武器复生，
  // 避免反复换枪后地图上的武器数量不断增长。
  removePickupFromWorld(pickup, false);
  dropWeaponAtPlayer(droppedWeapon);
  setCurrentWeapon(pickedWeapon, false);
  refillWeaponAmmo(pickedWeapon);
  showPickupNotice(
    "已拾取 " + pickedWeapon + "　已丢下 " + droppedWeapon
  );
  nearbyWeaponPickup = null;
  interactionPrompt.style.opacity = "0";
  return true;
}

function collectPickup(pickup) {
  // 地面武器必须由 F 键主动交换，其他补给仍保持靠近后自动拾取。
  if (isWeaponPickupType(pickup.type)) return false;

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
    const droppedWeapon = currentWeapon;
    dropWeaponAtPlayer(droppedWeapon);
    setCurrentWeapon(granted, false);
    refillWeaponAmmo(granted);
    showPickupNotice(
      "开启物资包：获得 " + granted + "　已丢下 " + droppedWeapon
    );
  }

  removePickupFromWorld(pickup, true);
  return true;
}

function updatePickups(delta) {
  const now = performance.now() * 0.001;
  const canInteract =
    gameState === "战斗" &&
    document.pointerLockElement === renderer.domElement;
  let closestWeapon = null;
  let closestWeaponDistance = Infinity;

  for (let i = pickups.length - 1; i >= 0; i--) {
    const pickup = pickups[i];
    pickup.group.position.y = pickup.baseY + Math.sin(now * 2.2 + pickup.phase) * 0.12;
    pickup.group.rotation.y += delta * 0.8;
    pickup.group.userData.halo.rotation.z -= delta * 0.7;

    const horizontalDistance = Math.hypot(
      player.position.x - pickup.group.position.x,
      player.position.z - pickup.group.position.z
    );
    const verticalDistance = Math.abs(
      player.position.y - pickup.group.position.y
    );

    if (isWeaponPickupType(pickup.type)) {
      if (
        canInteract &&
        pickup.type !== currentWeapon &&
        horizontalDistance < 1.7 &&
        verticalDistance < 1.7 &&
        horizontalDistance < closestWeaponDistance
      ) {
        closestWeapon = pickup;
        closestWeaponDistance = horizontalDistance;
      }
    } else if (
      gameState === "战斗" &&
      horizontalDistance < 1.25 &&
      verticalDistance < 1.7
    ) {
      collectPickup(pickup);
    }
  }

  nearbyWeaponPickup =
    closestWeapon && closestWeapon.type !== currentWeapon
      ? closestWeapon
      : null;
  if (nearbyWeaponPickup) {
    interactionPrompt.textContent =
      "按 F 拾取 " + nearbyWeaponPickup.type +
      "　（将丢下 " + currentWeapon + "）";
    interactionPrompt.style.opacity = "1";
  } else {
    interactionPrompt.style.opacity = "0";
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
