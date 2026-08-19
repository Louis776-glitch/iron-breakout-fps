"use strict";

if (typeof THREE === "undefined") {
  document.querySelector("#loadingScreen .subtitle").textContent =
    "三维引擎加载失败，请检查网络连接后刷新页面";
  throw new Error("三维引擎加载失败");
}

// -----------------------------------------------------------------------
// 基础渲染环境
// -----------------------------------------------------------------------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111820);
scene.fog = new THREE.Fog(0x111820, 30, 105);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.05,
  150
);
camera.rotation.order = "YXZ";
scene.add(camera);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.58;
document.body.insertBefore(renderer.domElement, document.body.firstChild);

const clock = new THREE.Clock();
const raycaster = new THREE.Raycaster();
raycaster.far = 160;

const tempVector = new THREE.Vector3();
const tempVector2 = new THREE.Vector3();

// -----------------------------------------------------------------------
// 界面引用
// -----------------------------------------------------------------------
const loadingScreen = document.getElementById("loadingScreen");
const modeScreen = document.getElementById("modeScreen");
const endlessMapScreen = document.getElementById("endlessMapScreen");
const pauseScreen = document.getElementById("pauseScreen");
const resultScreen = document.getElementById("resultScreen");
const resultTitle = document.getElementById("resultTitle");
const resultSummary = document.getElementById("resultSummary");
const resultPrompt = document.getElementById("resultPrompt");
const resultActionButton = document.getElementById("resultActionButton");
const returnMenuButton = document.getElementById("returnMenuButton");
const healthText = document.getElementById("healthText");
const healthFill = document.getElementById("healthFill");
const modeText = document.getElementById("modeText");
const mapText = document.getElementById("mapText");
const scoreText = document.getElementById("scoreText");
const difficultyText = document.getElementById("difficultyText");
const enemyCountText = document.getElementById("enemyCountText");
const weaponText = document.getElementById("weaponText");
const ammoText = document.getElementById("ammoText");
const objective = document.getElementById("objective");
const climbHint = document.getElementById("climbHint");
const crosshair = document.getElementById("crosshair");
const hitMarker = document.getElementById("hitMarker");
const damageVignette = document.getElementById("damageVignette");
const pickupNotice = document.getElementById("pickupNotice");
const reloadIndicator = document.getElementById("reloadIndicator");
const scopeOverlay = document.getElementById("scopeOverlay");
const minimapCanvas = document.getElementById("minimap");
const minimapContext = minimapCanvas.getContext("2d");
const minimapStaticCanvas = document.createElement("canvas");
minimapStaticCanvas.width = minimapCanvas.width;
minimapStaticCanvas.height = minimapCanvas.height;
const minimapStaticContext = minimapStaticCanvas.getContext("2d");

// -----------------------------------------------------------------------
// 全局游戏状态
// -----------------------------------------------------------------------
const keys = Object.create(null);
const enemies = [];
const effects = [];
const colliders = [];
const platforms = [];
const ladderZones = [];
const raycastWorld = [];
const spawnPoints = [];
// 狙击塔顶出生位与地面导航数据分开保存：普通敌人只使用地面网格，
// 塔顶敌人也不会因为选择了地面巡逻点而从高处走出平台。
const sniperTowerSpawns = [];
const respawnTimers = [];
const pickups = [];
const pickupRespawnTimers = [];
const ambientPickupTimers = [];
const playerProjectiles = [];
const weaponAmmo = Object.create(null);

const pickupRoot = new THREE.Group();
scene.add(pickupRoot);

let mapRoot = null;
let selectedMode = null;
let selectedEndlessMap = 0;
let gameState = "菜单";
let currentLevel = 1;
let currentMapName = "待命区";
let score = 0;
let levelKills = 0;
let levelSpawned = 0;
let totalKills = 0;
let firing = false;
let lastShotTime = -Infinity;
let weaponRecoil = 0;
let cameraShake = 0;
let muzzleTimer = 0;
let damageFlash = 0;
let hitFlash = 0;
let pickupNoticeTimer = 0;
let currentWeapon = "机枪";
let reloadingWeapon = null;
let reloadTimer = 0;
let reloadDuration = 0;
let aiming = false;
let lastEmptyAmmoNotice = -Infinity;
let outerExpansionBuilt = false;
let minimapUpdateTimer = 0;
let groundNavigation = null;

// 边长由 72 扩为 104，实际可探索面积约为原来的 2.1 倍。
const MAP_SIZE = 104;
const MAP_HALF = MAP_SIZE / 2;
const LEVEL_ENEMY_TOTAL = 25;

const playerStart = {
  x: 0,
  y: 0,
  z: 29,
  yaw: 0
};

const player = {
  position: new THREE.Vector3(0, 0, 29),
  radius: 0.46,
  bodyHeight: 1.76,
  eyeHeight: 1.62,
  velocityY: 0,
  grounded: true,
  climbing: false,
  yaw: 0,
  pitch: 0,
  health: 100,
  walkSpeed: 5.3,
  sprintSpeed: 8.3,
  jumpSpeed: 7.4,
  climbSpeed: 4.3,
  gravity: 20.5
};
const playerLastSafePosition = player.position.clone();

// -----------------------------------------------------------------------
// 右上角战术小地图
// -----------------------------------------------------------------------
const MINIMAP_PADDING = 14;

function worldToMinimapX(worldX) {
  const usable = minimapCanvas.width - MINIMAP_PADDING * 2;
  return MINIMAP_PADDING + (worldX + MAP_HALF) / MAP_SIZE * usable;
}

function worldToMinimapY(worldZ) {
  const usable = minimapCanvas.height - MINIMAP_PADDING * 2;
  return MINIMAP_PADDING + (worldZ + MAP_HALF) / MAP_SIZE * usable;
}

function drawMinimapWorldRect(context, box, color) {
  const left = worldToMinimapX(box.minX);
  const top = worldToMinimapY(box.minZ);
  const right = worldToMinimapX(box.maxX);
  const bottom = worldToMinimapY(box.maxZ);
  context.fillStyle = color;
  context.fillRect(
    left,
    top,
    Math.max(1.5, right - left),
    Math.max(1.5, bottom - top)
  );
}

function rebuildMinimapStatic() {
  const context = minimapStaticContext;
  const width = minimapStaticCanvas.width;
  const height = minimapStaticCanvas.height;
  context.clearRect(0, 0, width, height);
  context.fillStyle = "#081015";
  context.fillRect(0, 0, width, height);

  // 网格以十三米为一格，便于快速判断距离与方向。
  context.strokeStyle = "rgba(113, 151, 165, 0.13)";
  context.lineWidth = 1;
  for (let world = -MAP_HALF; world <= MAP_HALF; world += 13) {
    const x = worldToMinimapX(world);
    const y = worldToMinimapY(world);
    context.beginPath();
    context.moveTo(x, MINIMAP_PADDING);
    context.lineTo(x, height - MINIMAP_PADDING);
    context.moveTo(MINIMAP_PADDING, y);
    context.lineTo(width - MINIMAP_PADDING, y);
    context.stroke();
  }

  // 只绘制一层墙体、柱子、箱体和低矮地形；屋顶会遮挡平面图，因此忽略。
  for (const box of colliders) {
    if (box.minY > 1.35) continue;
    const objectHeight = box.maxY - box.minY;
    const color = objectHeight < 0.65
      ? "rgba(91, 116, 124, 0.42)"
      : "rgba(151, 169, 175, 0.72)";
    drawMinimapWorldRect(context, box, color);
  }

  // 二层高架用蓝色透明区域标识，梯子则使用黄色短框。
  for (const platform of platforms) {
    if (platform.topY < 1.2) continue;
    drawMinimapWorldRect(context, {
      minX: platform.minX,
      maxX: platform.maxX,
      minZ: platform.minZ,
      maxZ: platform.maxZ
    }, "rgba(73, 161, 195, 0.28)");
  }

  context.strokeStyle = "rgba(255, 202, 88, 0.95)";
  context.lineWidth = 3;
  for (const ladder of ladderZones) {
    const left = worldToMinimapX(ladder.minX);
    const top = worldToMinimapY(ladder.minZ);
    const right = worldToMinimapX(ladder.maxX);
    const bottom = worldToMinimapY(ladder.maxZ);
    context.strokeRect(left, top, right - left, bottom - top);
  }

  context.strokeStyle = "rgba(203, 225, 232, 0.78)";
  context.lineWidth = 3;
  context.strokeRect(
    MINIMAP_PADDING,
    MINIMAP_PADDING,
    width - MINIMAP_PADDING * 2,
    height - MINIMAP_PADDING * 2
  );
}

function updateMinimap(delta) {
  minimapUpdateTimer -= delta;
  if (minimapUpdateTimer > 0) return;
  minimapUpdateTimer = 0.04;

  const context = minimapContext;
  context.clearRect(0, 0, minimapCanvas.width, minimapCanvas.height);
  context.drawImage(minimapStaticCanvas, 0, 0);

  // 血包、弹药包、随机物资包与武器使用不同战术图标。
  for (const pickup of pickups) {
    const x = worldToMinimapX(pickup.group.position.x);
    const y = worldToMinimapY(pickup.group.position.z);
    context.save();
    context.translate(x, y);
    if (pickup.type === "血包") {
      context.fillStyle = "#69ee95";
      context.fillRect(-2.5, -7, 5, 14);
      context.fillRect(-7, -2.5, 14, 5);
    } else if (pickup.type === "弹药包") {
      context.fillStyle = "#5bddff";
      context.fillRect(-7, -5, 14, 10);
      context.fillStyle = "#d6f7ff";
      context.fillRect(-3, -5, 2, 10);
      context.fillRect(2, -5, 2, 10);
    } else if (pickup.type === "物资包") {
      context.rotate(Math.PI / 4);
      context.fillStyle = "#c893ff";
      context.fillRect(-6, -6, 12, 12);
    } else {
      context.rotate(Math.PI / 4);
      context.fillStyle = "#ffc45e";
      context.fillRect(-5, -5, 10, 10);
    }
    context.restore();
  }

  // 红点始终显示存活敌人，方便玩家在大型室内地图中规划路线。
  context.fillStyle = "#ff4b43";
  context.shadowColor = "rgba(255, 55, 45, 0.8)";
  context.shadowBlur = 7;
  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    context.beginPath();
    context.arc(
      worldToMinimapX(enemy.group.position.x),
      worldToMinimapY(enemy.group.position.z),
      5.5,
      0,
      Math.PI * 2
    );
    context.fill();
  }
  context.shadowBlur = 0;

  const playerX = worldToMinimapX(player.position.x);
  const playerY = worldToMinimapY(player.position.z);
  context.save();
  context.translate(playerX, playerY);
  context.rotate(-player.yaw);

  // 半透明扇形表示当前朝向与大致视野。
  context.beginPath();
  context.moveTo(0, 0);
  context.lineTo(-17, -35);
  context.lineTo(17, -35);
  context.closePath();
  context.fillStyle = "rgba(126, 220, 255, 0.18)";
  context.fill();

  context.beginPath();
  context.moveTo(0, -13);
  context.lineTo(9, 10);
  context.lineTo(0, 6);
  context.lineTo(-9, 10);
  context.closePath();
  context.fillStyle = player.position.y > 1
    ? "#6fe1ff"
    : "#ffffff";
  context.strokeStyle = "rgba(0, 0, 0, 0.9)";
  context.lineWidth = 2.5;
  context.fill();
  context.stroke();
  context.restore();
}

// 无尽模式选图界面的俯视缩略图。缩略图直接用 Canvas 绘制，
// 与五张地图各自的路线拓扑对应，不依赖外部图片资源。
function drawEndlessMapPreviews() {
  document.querySelectorAll(".endless-map-preview").forEach(function (canvas) {
    const context = canvas.getContext("2d");
    const index = Number(canvas.dataset.previewIndex);
    const width = canvas.width;
    const height = canvas.height;
    const padding = 18;

    function mapX(x) {
      return padding + (x + MAP_HALF) / MAP_SIZE * (width - padding * 2);
    }

    function mapY(z) {
      return padding + (z + MAP_HALF) / MAP_SIZE * (height - padding * 2);
    }

    function rect(x, z, rectWidth, rectDepth, color, stroke) {
      const left = mapX(x - rectWidth / 2);
      const top = mapY(z - rectDepth / 2);
      const right = mapX(x + rectWidth / 2);
      const bottom = mapY(z + rectDepth / 2);
      context.fillStyle = color;
      context.fillRect(left, top, right - left, bottom - top);
      if (stroke) {
        context.strokeStyle = stroke;
        context.lineWidth = 2;
        context.strokeRect(left, top, right - left, bottom - top);
      }
    }

    function line(points, color, lineWidth) {
      context.beginPath();
      context.moveTo(mapX(points[0][0]), mapY(points[0][1]));
      for (let i = 1; i < points.length; i++) {
        context.lineTo(mapX(points[i][0]), mapY(points[i][1]));
      }
      context.strokeStyle = color;
      context.lineWidth = lineWidth;
      context.lineCap = "square";
      context.lineJoin = "miter";
      context.stroke();
    }

    function label(text, x, z, color) {
      context.fillStyle = color || "#d7e7ed";
      context.font = "bold 18px Microsoft YaHei, sans-serif";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(text, mapX(x), mapY(z));
    }

    context.fillStyle = "#071015";
    context.fillRect(0, 0, width, height);
    context.strokeStyle = "rgba(105, 145, 157, 0.12)";
    context.lineWidth = 1;
    for (let grid = -39; grid <= 39; grid += 13) {
      context.beginPath();
      context.moveTo(mapX(grid), mapY(-52));
      context.lineTo(mapX(grid), mapY(52));
      context.moveTo(mapX(-52), mapY(grid));
      context.lineTo(mapX(52), mapY(grid));
      context.stroke();
    }
    context.strokeStyle = "rgba(196, 222, 231, 0.62)";
    context.lineWidth = 3;
    context.strokeRect(padding, padding, width - padding * 2, height - padding * 2);

    if (index === 0) {
      // 地图一：中心大厅向四个生产翼放射，外围保持可绕行堆料场。
      rect(0, 0, 24, 20, "#31434a", "#a7c1c9");
      rect(0, -38, 24, 16, "#3d4f55", "#b1c8cf");
      rect(0, 38, 28, 16, "#3d4f55", "#b1c8cf");
      rect(-38, -3, 16, 25, "#3d4f55", "#b1c8cf");
      rect(38, 4, 16, 25, "#3d4f55", "#b1c8cf");
      rect(-34, 32, 16, 13, "#2c3d43", "#8ea9b2");
      rect(34, -31, 16, 13, "#2c3d43", "#8ea9b2");
      rect(0, -21, 5, 18, "rgba(226, 166, 77, 0.58)");
      rect(0, 21, 5, 18, "rgba(226, 166, 77, 0.58)");
      rect(-23, 0, 22, 5, "rgba(226, 166, 77, 0.58)");
      rect(23, 0, 22, 5, "rgba(226, 166, 77, 0.58)");
      line([[-9, -2], [9, -2]], "#63cce9", 7);
      line([[5, -8], [5, 8]], "#63cce9", 7);
      label("装配", 0, 0, "#ffe0a0");
    } else if (index === 1) {
      // 地图二：双轨纵贯全场，站台分段排列，侧厅沿东西两侧布置。
      line([[-5, -46], [-5, 46]], "#9aa8ad", 5);
      line([[5, -46], [5, 46]], "#9aa8ad", 5);
      for (const z of [-32, -5, 25]) {
        rect(-13, z, 6, 18, "#44565d", "#9eb5bd");
      }
      for (const z of [-25, 4, 32]) {
        rect(13, z, 6, 17, "#44565d", "#9eb5bd");
      }
      rect(-39, -27, 18, 20, "#293d48", "#75a9c5");
      rect(-39, 28, 18, 20, "#293d48", "#75a9c5");
      rect(39, -9, 18, 29, "#423b35", "#d29a67");
      rect(39, 34, 18, 13, "#423b35", "#d29a67");
      line([[-21, 0], [21, 0]], "#62c8e6", 8);
      label("天桥", 0, 0, "#b5edff");
    } else if (index === 2) {
      // 地图三：左上熔炉群、右侧轧钢厅、中央斜向废墟，没有对称轴。
      for (const point of [[-31, -29], [-16, -30], [-28, -12]]) {
        context.beginPath();
        context.arc(mapX(point[0]), mapY(point[1]), 18, 0, Math.PI * 2);
        context.fillStyle = "#753927";
        context.fill();
        context.strokeStyle = "#df7b4c";
        context.lineWidth = 3;
        context.stroke();
      }
      rect(27, -30, 35, 18, "#443a34", "#c28962");
      rect(-32, 29, 25, 21, "#303e42", "#8fa4aa");
      rect(28, 21, 27, 25, "#3d3935", "#b48461");
      line([[-14, -9], [-4, -9], [-4, -1], [8, -1], [8, 9], [19, 9]], "#b7a291", 8);
      rect(0, 27, 13, 9, "rgba(62, 144, 167, 0.52)", "#65c2da");
      rect(12, -13, 11, 8, "rgba(62, 144, 167, 0.52)", "#65c2da");
      label("熔炉", -25, -23, "#ffd0a8");
    } else if (index === 3) {
      // 地图四：两座并列大厅各自绕冷却池成环，并拥有中央与外围交叉通路。
      rect(-27, 0, 38, 40, "#30464d", "#96c8d5");
      rect(27, 0, 38, 40, "#30464d", "#96c8d5");
      rect(-27, 0, 14, 18, "#123b48", "#58bad4");
      rect(27, 0, 14, 18, "#123b48", "#58bad4");
      rect(0, 0, 16, 6, "rgba(226, 166, 77, 0.62)");
      line([[-46, -27], [46, -27]], "#69858e", 8);
      line([[-46, 27], [46, 27]], "#69858e", 8);
      line([[0, -27], [0, 27]], "#66cee6", 7);
      rect(-31, -37, 19, 12, "#423a34", "#ca9568");
      rect(31, 37, 19, 12, "#423a34", "#ca9568");
      label("双环", 0, 0, "#c8f5ff");
    } else {
      // 地图五：交替开口的长墙迫使路线连续折返，边仓提供额外环路。
      for (let row = 0; row < 5; row++) {
        const z = -32 + row * 16;
        const openEast = row % 2 === 0;
        rect(openEast ? -4 : 4, z, 88, 2.2, "#4b585d", "#a6bbc0");
        rect(openEast ? 46 : -46, z, 5, 7, "rgba(226, 166, 77, 0.62)");
      }
      rect(-35, -24, 18, 11, "#344850", "#78aebc");
      rect(35, -8, 18, 11, "#443c35", "#c18c61");
      rect(-35, 9, 18, 11, "#443c35", "#c18c61");
      rect(35, 25, 18, 11, "#344850", "#78aebc");
      line([[-18, 7], [18, 7]], "#63cce9", 8);
      label("折返", 0, 22, "#d9f5ff");
    }

    // 白色三角表示各地图的玩家起始方向。
    const starts = [
      [20, 47, 0],
      [0, 47, 0],
      [-45, 43, -Math.PI * 0.25],
      [0, 47, 0],
      [0, 47, 0]
    ];
    const start = starts[index];
    context.save();
    context.translate(mapX(start[0]), mapY(start[1]));
    context.rotate(start[2]);
    context.beginPath();
    context.moveTo(0, -10);
    context.lineTo(7, 8);
    context.lineTo(-7, 8);
    context.closePath();
    context.fillStyle = "#ffffff";
    context.fill();
    context.restore();
  });
}

// -----------------------------------------------------------------------
// 程序化材质与灯光
// -----------------------------------------------------------------------
function createGroundTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext("2d");

  context.fillStyle = "#41484d";
  context.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 2600; i++) {
    const shade = 42 + Math.floor(Math.random() * 50);
    context.fillStyle =
      "rgba(" + shade + "," + (shade + 3) + "," + (shade + 5) + "," +
      (Math.random() * 0.18) + ")";
    const size = Math.random() * 2.2 + 0.4;
    context.fillRect(Math.random() * 256, Math.random() * 256, size, size);
  }

  context.strokeStyle = "rgba(18,22,25,0.55)";
  context.lineWidth = 3;
  context.strokeRect(1.5, 1.5, 253, 253);
  context.beginPath();
  context.moveTo(128, 0);
  context.lineTo(128, 256);
  context.moveTo(0, 128);
  context.lineTo(256, 128);
  context.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(26, 26);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return texture;
}

const groundMaterial = new THREE.MeshStandardMaterial({
  color: 0xadb3b7,
  map: createGroundTexture(),
  roughness: 0.96,
  metalness: 0.02
});

const wallMaterial = new THREE.MeshStandardMaterial({
  color: 0x53616b,
  roughness: 0.88,
  metalness: 0.08
});

const darkWallMaterial = new THREE.MeshStandardMaterial({
  color: 0x252e35,
  roughness: 0.84,
  metalness: 0.18
});

const bunkerMaterial = new THREE.MeshStandardMaterial({
  color: 0x343d43,
  roughness: 0.9,
  metalness: 0.06
});

const woodMaterial = new THREE.MeshStandardMaterial({
  color: 0x754724,
  roughness: 0.88
});

const woodDarkMaterial = new THREE.MeshStandardMaterial({
  color: 0x382114,
  roughness: 0.92
});

const metalMaterial = new THREE.MeshStandardMaterial({
  color: 0x3f4c56,
  roughness: 0.55,
  metalness: 0.62
});

const ladderMaterial = new THREE.MeshStandardMaterial({
  color: 0xb28a4a,
  roughness: 0.45,
  metalness: 0.72
});

const hemisphere = new THREE.HemisphereLight(0x8faec7, 0x241d17, 0.95);
scene.add(hemisphere);

const sun = new THREE.DirectionalLight(0xffeed1, 2.05);
sun.position.set(-18, 30, 12);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -60;
sun.shadow.camera.right = 60;
sun.shadow.camera.top = 60;
sun.shadow.camera.bottom = -60;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 90;
sun.shadow.bias = -0.0003;
scene.add(sun);

// -----------------------------------------------------------------------
// 碰撞、地面支撑与地图基础组件
// -----------------------------------------------------------------------
function circleIntersectsBox(x, z, radius, box) {
  const nearestX = Math.max(box.minX, Math.min(x, box.maxX));
  const nearestZ = Math.max(box.minZ, Math.min(z, box.maxZ));
  const dx = x - nearestX;
  const dz = z - nearestZ;
  return dx * dx + dz * dz < radius * radius;
}

function verticalRangesOverlap(feetY, bodyHeight, box) {
  const bodyBottom = feetY + 0.03;
  const bodyTop = feetY + bodyHeight;
  return bodyBottom < box.maxY - 0.015 && bodyTop > box.minY + 0.015;
}

function collidesAt(x, z, radius, feetY, bodyHeight) {
  for (const box of colliders) {
    if (
      verticalRangesOverlap(feetY, bodyHeight, box) &&
      circleIntersectsBox(x, z, radius, box)
    ) {
      return true;
    }
  }
  return false;
}

function pointInsideWorldCollider(point, inset) {
  inset = inset || 0;
  for (const box of colliders) {
    if (
      point.x > box.minX + inset && point.x < box.maxX - inset &&
      point.y > box.minY + inset && point.y < box.maxY - inset &&
      point.z > box.minZ + inset && point.z < box.maxZ - inset
    ) {
      return true;
    }
  }
  return false;
}

// 当角色因梯子出口、多个墙角重叠或极端帧率进入碰撞体时，
// 将圆形碰撞体沿最短方向推出墙体，避免之后所有移动方向都被锁死。
function resolveCirclePenetration(position, radius, bodyHeight) {
  let adjusted = false;

  for (let pass = 0; pass < 10; pass++) {
    let changedThisPass = false;

    for (const box of colliders) {
      if (!verticalRangesOverlap(position.y, bodyHeight, box)) continue;

      const nearestX = Math.max(box.minX, Math.min(position.x, box.maxX));
      const nearestZ = Math.max(box.minZ, Math.min(position.z, box.maxZ));
      const dx = position.x - nearestX;
      const dz = position.z - nearestZ;
      const distanceSquared = dx * dx + dz * dz;
      if (distanceSquared >= radius * radius) continue;

      if (distanceSquared > 0.0000001) {
        const distance = Math.sqrt(distanceSquared);
        const push = radius - distance + 0.006;
        position.x += dx / distance * push;
        position.z += dz / distance * push;
      } else {
        // 圆心位于矩形内部时没有现成法线，选择最近的扩展边界推出。
        const candidates = [
          { axis: "x", amount: box.minX - radius - position.x },
          { axis: "x", amount: box.maxX + radius - position.x },
          { axis: "z", amount: box.minZ - radius - position.z },
          { axis: "z", amount: box.maxZ + radius - position.z }
        ];
        candidates.sort(function (a, b) {
          return Math.abs(a.amount) - Math.abs(b.amount);
        });
        position[candidates[0].axis] += candidates[0].amount;
      }

      changedThisPass = true;
      adjusted = true;
    }

    // 永远把角色保留在外围边界的内侧，防止被推出地图之外。
    const boundaryMargin = radius + 0.52;
    position.x = THREE.MathUtils.clamp(
      position.x,
      -MAP_HALF + boundaryMargin,
      MAP_HALF - boundaryMargin
    );
    position.z = THREE.MathUtils.clamp(
      position.z,
      -MAP_HALF + boundaryMargin,
      MAP_HALF - boundaryMargin
    );

    if (!changedThisPass) break;
  }

  return adjusted;
}

function findNearestSafePosition(origin, radius, bodyHeight) {
  const candidate = origin.clone();
  const safeLimit = MAP_HALF - radius - 0.52;

  function candidateIsSafe(point) {
    return (
      Math.abs(point.x) <= safeLimit &&
      Math.abs(point.z) <= safeLimit &&
      !collidesAt(point.x, point.z, radius, point.y, bodyHeight)
    );
  }

  if (candidateIsSafe(candidate)) {
    return candidate;
  }

  for (let searchRadius = 0.6; searchRadius <= 10; searchRadius += 0.6) {
    const samples = Math.max(16, Math.ceil(searchRadius * 10));
    for (let sample = 0; sample < samples; sample++) {
      const angle = sample / samples * Math.PI * 2;
      candidate.set(
        origin.x + Math.cos(angle) * searchRadius,
        origin.y,
        origin.z + Math.sin(angle) * searchRadius
      );
      if (candidateIsSafe(candidate)) {
        return candidate.clone();
      }
    }
  }

  return new THREE.Vector3(0, 0, 0);
}

function moveWithCollisions(position, dx, dz, radius, bodyHeight) {
  resolveCirclePenetration(position, radius, bodyHeight);
  let movedX = false;
  let movedZ = false;

  if (!collidesAt(position.x + dx, position.z, radius, position.y, bodyHeight)) {
    position.x += dx;
    movedX = true;
  }

  if (!collidesAt(position.x, position.z + dz, radius, position.y, bodyHeight)) {
    position.z += dz;
    movedZ = true;
  }

  resolveCirclePenetration(position, radius, bodyHeight);

  return movedX || movedZ;
}

function addBox(x, y, z, width, height, depth, material, options) {
  options = options || {};
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    material
  );
  mesh.position.set(x, y, z);
  mesh.castShadow = options.castShadow !== false;
  mesh.receiveShadow = options.receiveShadow !== false;
  mapRoot.add(mesh);

  if (options.collider !== false) {
    colliders.push({
      minX: x - width / 2,
      maxX: x + width / 2,
      minY: y - height / 2,
      maxY: y + height / 2,
      minZ: z - depth / 2,
      maxZ: z + depth / 2
    });
  }

  if (options.platform) {
    platforms.push({
      minX: x - width / 2,
      maxX: x + width / 2,
      minZ: z - depth / 2,
      maxZ: z + depth / 2,
      topY: y + height / 2
    });
  }

  if (options.raycast !== false) {
    raycastWorld.push(mesh);
  }

  return mesh;
}

function addFloor() {
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(MAP_SIZE, MAP_SIZE),
    groundMaterial
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.03;
  floor.receiveShadow = true;
  mapRoot.add(floor);
  raycastWorld.push(floor);
}

function addBoundary() {
  addBox(0, 2.3, -MAP_HALF, MAP_SIZE + 1, 4.6, 0.9, wallMaterial);
  addBox(0, 2.3, MAP_HALF, MAP_SIZE + 1, 4.6, 0.9, wallMaterial);
  addBox(-MAP_HALF, 2.3, 0, 0.9, 4.6, MAP_SIZE, wallMaterial);
  addBox(MAP_HALF, 2.3, 0, 0.9, 4.6, MAP_SIZE, wallMaterial);
}

function addSpawn(x, z) {
  spawnPoints.push(new THREE.Vector3(x, 0, z));
}

function setPlayerStart(x, z, yaw, y) {
  playerStart.x = x;
  playerStart.z = z;
  playerStart.y = y || 0;
  playerStart.yaw = yaw || 0;
}

function addMapLight(x, y, z, color, intensity, distance) {
  const bulbMaterial = new THREE.MeshBasicMaterial({ color: color });
  bulbMaterial.userData.mapOwned = true;
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.15, 10, 7),
    bulbMaterial
  );
  bulb.position.set(x, y, z);
  mapRoot.add(bulb);

  const light = new THREE.PointLight(color, intensity, distance, 2);
  light.position.set(x, y, z);
  mapRoot.add(light);
}

function addCrate(x, z, width, height, depth) {
  width = width || 2.4;
  height = height || 2.3;
  depth = depth || 2.4;

  const body = addBox(
    x,
    height / 2,
    z,
    width,
    height,
    depth,
    woodMaterial
  );

  const beam = 0.12;
  const frontZ = z + depth / 2 + 0.025;

  addBox(
    x - width * 0.36,
    height / 2,
    frontZ,
    beam,
    height * 0.9,
    beam,
    woodDarkMaterial,
    { collider: false, raycast: false }
  );

  addBox(
    x + width * 0.36,
    height / 2,
    frontZ,
    beam,
    height * 0.9,
    beam,
    woodDarkMaterial,
    { collider: false, raycast: false }
  );

  addBox(
    x,
    height * 0.2,
    frontZ,
    width * 0.9,
    beam,
    beam,
    woodDarkMaterial,
    { collider: false, raycast: false }
  );

  addBox(
    x,
    height * 0.8,
    frontZ,
    width * 0.9,
    beam,
    beam,
    woodDarkMaterial,
    { collider: false, raycast: false }
  );

  return body;
}

function addRoom(cx, cz, width, depth, options) {
  options = options || {};
  const height = options.height || 3.6;
  const thickness = 0.42;
  const doorWidth = options.doorWidth || 2.6;
  const doorHeight = Math.min(2.55, height - 0.6);
  const doors = options.doors || ["南"];

  function horizontalWall(z, hasDoor) {
    if (!hasDoor) {
      addBox(cx, height / 2, z, width, height, thickness, bunkerMaterial);
      return;
    }
    const segment = (width - doorWidth) / 2;
    addBox(
      cx - (doorWidth + segment) / 2,
      height / 2,
      z,
      segment,
      height,
      thickness,
      bunkerMaterial
    );
    addBox(
      cx + (doorWidth + segment) / 2,
      height / 2,
      z,
      segment,
      height,
      thickness,
      bunkerMaterial
    );

    // 门洞上方保留实体过梁，形成清晰的方形门框。
    addBox(
      cx,
      doorHeight + (height - doorHeight) / 2,
      z,
      doorWidth,
      height - doorHeight,
      thickness,
      wallMaterial
    );
  }

  function verticalWall(x, hasDoor) {
    if (!hasDoor) {
      addBox(x, height / 2, cz, thickness, height, depth, bunkerMaterial);
      return;
    }
    const segment = (depth - doorWidth) / 2;
    addBox(
      x,
      height / 2,
      cz - (doorWidth + segment) / 2,
      thickness,
      height,
      segment,
      bunkerMaterial
    );
    addBox(
      x,
      height / 2,
      cz + (doorWidth + segment) / 2,
      thickness,
      height,
      segment,
      bunkerMaterial
    );

    addBox(
      x,
      doorHeight + (height - doorHeight) / 2,
      cz,
      thickness,
      height - doorHeight,
      doorWidth,
      wallMaterial
    );
  }

  horizontalWall(cz - depth / 2, doors.indexOf("北") >= 0);
  horizontalWall(cz + depth / 2, doors.indexOf("南") >= 0);
  verticalWall(cx - width / 2, doors.indexOf("西") >= 0);
  verticalWall(cx + width / 2, doors.indexOf("东") >= 0);

  if (options.roof) {
    addBox(
      cx,
      height + 0.16,
      cz,
      width,
      0.32,
      depth,
      darkWallMaterial
    );
    addMapLight(cx, height - 0.35, cz, options.lightColor || 0xffb05a, 4.2, 10);
  }
}

function addTunnel(cx, cz, length, width, orientation, color) {
  const height = 3;
  const thickness = 0.36;

  if (orientation === "横") {
    addBox(cx, height / 2, cz - width / 2, length, height, thickness, darkWallMaterial);
    addBox(cx, height / 2, cz + width / 2, length, height, thickness, darkWallMaterial);
    addBox(cx, height + 0.15, cz, length, 0.3, width, darkWallMaterial);

    for (let offset = -length / 2 + 4; offset < length / 2; offset += 12) {
      addMapLight(cx + offset, height - 0.35, cz, color || 0xe89b48, 2.8, 7);
    }
  } else {
    addBox(cx - width / 2, height / 2, cz, thickness, height, length, darkWallMaterial);
    addBox(cx + width / 2, height / 2, cz, thickness, height, length, darkWallMaterial);
    addBox(cx, height + 0.15, cz, width, 0.3, length, darkWallMaterial);

    for (let offset = -length / 2 + 4; offset < length / 2; offset += 12) {
      addMapLight(cx, height - 0.35, cz + offset, color || 0xe89b48, 2.8, 7);
    }
  }
}

function addPlatform(x, z, width, depth, topY) {
  addBox(
    x,
    topY - 0.16,
    z,
    width,
    0.32,
    depth,
    metalMaterial,
    { platform: true }
  );

  const columnHeight = topY - 0.32;
  const columnY = columnHeight / 2;

  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      addBox(
        x + sx * (width / 2 - 0.24),
        columnY,
        z + sz * (depth / 2 - 0.24),
        0.28,
        columnHeight,
        0.28,
        darkWallMaterial
      );
    }
  }
}

function addLadder(x, z, height, exitX, exitZ, orientation) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  mapRoot.add(group);

  if (orientation === "横") {
    for (const side of [-0.43, 0.43]) {
      const rail = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045, 0.045, height, 8),
        ladderMaterial
      );
      rail.position.set(side, height / 2, 0);
      rail.castShadow = true;
      group.add(rail);
      raycastWorld.push(rail);
    }

    for (let y = 0.35; y < height; y += 0.38) {
      const rung = new THREE.Mesh(
        new THREE.BoxGeometry(0.92, 0.055, 0.065),
        ladderMaterial
      );
      rung.position.set(0, y, 0);
      rung.castShadow = true;
      group.add(rung);
      raycastWorld.push(rung);
    }
  } else {
    for (const side of [-0.43, 0.43]) {
      const rail = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045, 0.045, height, 8),
        ladderMaterial
      );
      rail.position.set(0, height / 2, side);
      rail.castShadow = true;
      group.add(rail);
      raycastWorld.push(rail);
    }

    for (let y = 0.35; y < height; y += 0.38) {
      const rung = new THREE.Mesh(
        new THREE.BoxGeometry(0.065, 0.055, 0.92),
        ladderMaterial
      );
      rung.position.set(0, y, 0);
      rung.castShadow = true;
      group.add(rung);
      raycastWorld.push(rung);
    }
  }

  ladderZones.push({
    minX: x - 0.72,
    maxX: x + 0.72,
    minZ: z - 0.72,
    maxZ: z + 0.72,
    bottomY: 0,
    topY: height,
    exitX: exitX,
    exitZ: exitZ
  });
}

function addWatchTower(x, z, topY, ladderSide) {
  const size = 6;
  addPlatform(x, z, size, size, topY);

  if (ladderSide === "南") {
    addLadder(x, z + size / 2 + 0.35, topY, 0, -1, "横");
  } else if (ladderSide === "北") {
    addLadder(x, z - size / 2 - 0.35, topY, 0, 1, "横");
  } else if (ladderSide === "东") {
    addLadder(x + size / 2 + 0.35, z, topY, -1, 0, "纵");
  } else {
    addLadder(x - size / 2 - 0.35, z, topY, 1, 0, "纵");
  }
}

// -----------------------------------------------------------------------
// 高层狙击塔
// -----------------------------------------------------------------------
// 塔高约等于三段普通工业梯（2.75 米 × 3）。塔顶出生位单独登记，
// 不会混入一层 spawnPoints，也不会改变普通敌人“不会爬梯子”的规则。
const SNIPER_TOWER_HEIGHT = 8.25;
const SNIPER_TOWER_SIZE = 5.8;

function addSniperTowerRail(x, z, size, ladderSide, topY) {
  const railHeight = 1.05;
  const railThickness = 0.16;
  const railY = topY + railHeight / 2;
  const openingWidth = 1.65;
  const sideSegment = (size - openingWidth) / 2;

  function addHorizontalRail(railZ, split) {
    if (!split) {
      addBox(x, railY, railZ, size, railHeight, railThickness, metalMaterial);
      return;
    }
    const offset = openingWidth / 2 + sideSegment / 2;
    addBox(x - offset, railY, railZ, sideSegment, railHeight, railThickness, metalMaterial);
    addBox(x + offset, railY, railZ, sideSegment, railHeight, railThickness, metalMaterial);
  }

  function addVerticalRail(railX, split) {
    if (!split) {
      addBox(railX, railY, z, railThickness, railHeight, size, metalMaterial);
      return;
    }
    const offset = openingWidth / 2 + sideSegment / 2;
    addBox(railX, railY, z - offset, railThickness, railHeight, sideSegment, metalMaterial);
    addBox(railX, railY, z + offset, railThickness, railHeight, sideSegment, metalMaterial);
  }

  addHorizontalRail(z - size / 2, ladderSide === "北");
  addHorizontalRail(z + size / 2, ladderSide === "南");
  addVerticalRail(x - size / 2, ladderSide === "西");
  addVerticalRail(x + size / 2, ladderSide === "东");
}

function addSniperTower(x, z, ladderSide) {
  const topY = SNIPER_TOWER_HEIGHT;
  const size = SNIPER_TOWER_SIZE;
  addPlatform(x, z, size, size, topY);
  addSniperTowerRail(x, z, size, ladderSide, topY);

  // 梯子仅登记到玩家 ladderZones。敌人 AI 没有任何攀爬入口。
  if (ladderSide === "南") {
    addLadder(x, z + size / 2 + 0.35, topY, 0, -1, "横");
  } else if (ladderSide === "北") {
    addLadder(x, z - size / 2 - 0.35, topY, 0, 1, "横");
  } else if (ladderSide === "东") {
    addLadder(x + size / 2 + 0.35, z, topY, -1, 0, "纵");
  } else {
    addLadder(x - size / 2 - 0.35, z, topY, 1, 0, "纵");
  }

  // 塔顶灯既提供远距离轮廓，也让玩家爬上去后仍能看清平台边缘。
  addMapLight(x, topY + 1.55, z, 0xffd27a, 3.6, 15);

  sniperTowerSpawns.push({
    id: sniperTowerSpawns.length,
    position: new THREE.Vector3(x, topY + 0.025, z),
    minX: x - size / 2 + 0.78,
    maxX: x + size / 2 - 0.78,
    minZ: z - size / 2 + 0.78,
    maxZ: z + size / 2 - 0.78,
    topY: topY
  });
}

function towerSiteIsClear(x, z, ladderSide) {
  const half = SNIPER_TOWER_SIZE / 2 + 0.38;
  let minX = x - half;
  let maxX = x + half;
  let minZ = z - half;
  let maxZ = z + half;

  // 给梯脚和玩家接近梯子的区域再留出 1.5 米净空。
  if (ladderSide === "南") maxZ += 1.5;
  else if (ladderSide === "北") minZ -= 1.5;
  else if (ladderSide === "东") maxX += 1.5;
  else minX -= 1.5;

  const safeBoundary = MAP_HALF - 1.15;
  if (
    minX < -safeBoundary || maxX > safeBoundary ||
    minZ < -safeBoundary || maxZ > safeBoundary
  ) {
    return false;
  }

  for (const box of colliders) {
    if (box.maxY < 0.02 || box.minY > SNIPER_TOWER_HEIGHT + 1.2) continue;
    if (
      maxX > box.minX && minX < box.maxX &&
      maxZ > box.minZ && minZ < box.maxZ
    ) {
      return false;
    }
  }

  for (const tower of sniperTowerSpawns) {
    if (Math.hypot(tower.position.x - x, tower.position.z - z) < 13) {
      return false;
    }
  }

  return Math.hypot(x - playerStart.x, z - playerStart.z) > 9;
}

// 从已经确认与玩家出生区连通的一层出生点中寻找塔位。优先靠近每张地图
// 设计的锚点，若锚点被房间占用则自动寻找最近的安全空地。
function findSniperTowerSite(preferredX, preferredZ, ladderSide) {
  const candidates = spawnPoints.slice().sort(function (a, b) {
    return (
      Math.hypot(a.x - preferredX, a.z - preferredZ) -
      Math.hypot(b.x - preferredX, b.z - preferredZ)
    );
  });

  for (const point of candidates) {
    if (towerSiteIsClear(point.x, point.z, ladderSide)) {
      return { x: point.x, z: point.z, ladderSide: ladderSide };
    }
  }
  return null;
}

// 带真实门洞的外围环形走廊。普通 addTunnel 的侧墙是完整长墙，
// 与另一条走廊交叉时仍会保留不可见的碰撞阻挡；这里把内侧墙切成两段。
function addHorizontalRingTunnel(z, innerSign, openingX, color) {
  const height = 3;
  const width = 5.6;
  const length = 78;
  const thickness = 0.36;
  const openingWidth = 6.2;
  const leftEdge = -length / 2;
  const rightEdge = length / 2;
  const gapLeft = openingX - openingWidth / 2;
  const gapRight = openingX + openingWidth / 2;
  const innerZ = z + innerSign * width / 2;
  const outerZ = z - innerSign * width / 2;

  addBox(0, height / 2, outerZ, length, height, thickness, darkWallMaterial);
  addBox(
    (leftEdge + gapLeft) / 2,
    height / 2,
    innerZ,
    gapLeft - leftEdge,
    height,
    thickness,
    darkWallMaterial
  );
  addBox(
    (gapRight + rightEdge) / 2,
    height / 2,
    innerZ,
    rightEdge - gapRight,
    height,
    thickness,
    darkWallMaterial
  );
  addBox(0, height + 0.15, z, length, 0.3, width, darkWallMaterial);
  for (let x = -34; x <= 34; x += 12) {
    addMapLight(x, height - 0.35, z, color, 3.4, 8.5);
  }
  addDoorFrame(openingX, innerZ, "横", openingWidth - 0.7, 2.65);
}

function addVerticalRingTunnel(x, innerSign, openingZ, color) {
  const height = 3;
  const width = 5.6;
  const length = 78;
  const thickness = 0.36;
  const openingWidth = 6.2;
  const topEdge = -length / 2;
  const bottomEdge = length / 2;
  const gapTop = openingZ - openingWidth / 2;
  const gapBottom = openingZ + openingWidth / 2;
  const innerX = x + innerSign * width / 2;
  const outerX = x - innerSign * width / 2;

  addBox(outerX, height / 2, 0, thickness, height, length, darkWallMaterial);
  addBox(
    innerX,
    height / 2,
    (topEdge + gapTop) / 2,
    thickness,
    height,
    gapTop - topEdge,
    darkWallMaterial
  );
  addBox(
    innerX,
    height / 2,
    (gapBottom + bottomEdge) / 2,
    thickness,
    height,
    bottomEdge - gapBottom,
    darkWallMaterial
  );
  addBox(x, height + 0.15, 0, width, 0.3, length, darkWallMaterial);
  for (let z = -34; z <= 34; z += 12) {
    addMapLight(x, height - 0.35, z, color, 3.4, 8.5);
  }
  addDoorFrame(innerX, openingZ, "纵", openingWidth - 0.7, 2.65);
}

function addOpenReturnTunnel(cx, cz, length, width, orientation, coreSign, color) {
  const height = 3;
  const thickness = 0.36;
  const exitGap = 4.2;
  const wallLength = length - exitGap;

  if (orientation === "纵") {
    const wallCenterZ = cz - coreSign * exitGap / 2;
    addBox(cx - width / 2, height / 2, wallCenterZ, thickness, height, wallLength, darkWallMaterial);
    addBox(cx + width / 2, height / 2, wallCenterZ, thickness, height, wallLength, darkWallMaterial);
    addBox(cx, height + 0.15, cz, width, 0.3, length, darkWallMaterial);
  } else {
    const wallCenterX = cx - coreSign * exitGap / 2;
    addBox(wallCenterX, height / 2, cz - width / 2, wallLength, height, thickness, darkWallMaterial);
    addBox(wallCenterX, height / 2, cz + width / 2, wallLength, height, thickness, darkWallMaterial);
    addBox(cx, height + 0.15, cz, length, 0.3, width, darkWallMaterial);
  }
  addMapLight(cx, height - 0.35, cz, color, 3.8, 9);
}

// 所有地图共享的外围工业扩展区。它把旧战区与四角仓室、环形货运暗道
// 和外围装卸平台连成一体；这里的建筑仍通过 addBox 等基础函数创建，
// 因而会自动拥有玩家碰撞、敌人避障和子弹命中特效。
function addOuterIndustrialRing() {
  if (outerExpansionBuilt) return;
  outerExpansionBuilt = true;

  const ringColor = 0xffc46b;

  // 四条货运走廊围成外围环线，靠核心战区的一侧各保留一个真实门洞。
  addHorizontalRingTunnel(-43, 1, -6, ringColor);
  addHorizontalRingTunnel(43, -1, 6, ringColor);
  addVerticalRingTunnel(-43, 1, 7, ringColor);
  addVerticalRingTunnel(43, -1, -7, ringColor);

  // 使用无转角碰撞墙的直通回程通道，玩家可随时从外围返回主战区。
  addOpenReturnTunnel(-6, -35, 16.4, 5.2, "纵", 1, 0x8fd4ff);
  addOpenReturnTunnel(6, 35, 16.4, 5.2, "纵", -1, 0x8fd4ff);
  addOpenReturnTunnel(-35, 7, 16.4, 5.2, "横", 1, 0xffaa62);
  addOpenReturnTunnel(35, -7, 16.4, 5.2, "横", -1, 0xffaa62);

  // 四角仓室同时提供近距离室内交火和多个方形门洞。
  addRoom(-43, -43, 14, 14, {
    doors: ["东", "南"], roof: true, height: 3.8, lightColor: 0xffc36d
  });
  addRoom(43, -43, 14, 14, {
    doors: ["西", "南"], roof: true, height: 3.8, lightColor: 0x9bdcff
  });
  addRoom(-43, 43, 14, 14, {
    doors: ["东", "北"], roof: true, height: 3.8, lightColor: 0x9bdcff
  });
  addRoom(43, 43, 14, 14, {
    doors: ["西", "北"], roof: true, height: 3.8, lightColor: 0xffc36d
  });

  // 外围高低差、装卸台和低矮掩体让扩展区域也有纵深。
  // 装卸台位于只有 5.6 米宽的外围回廊内。缩短台面宽度并减小进深，
  // 避免平台与走廊侧墙形成狭窄夹缝，让玩家可以从两侧稳定绕行。
  addLoadingDock(-25, -43, 6.4, 2.6, "南");
  addLoadingDock(25, 43, 6.4, 2.6, "北");
  addCatwalkSegment(-43, 22, 12, "纵", 2.75);
  addLadder(-40, 22, 2.75, -1, 0, "纵");
  addCatwalkSegment(43, -22, 12, "纵", 2.75);
  addLadder(40, -22, 2.75, 1, 0, "纵");

  for (const item of [
    [-30, -43, "横"], [30, -43, "横"],
    [-30, 43, "横"], [30, 43, "横"],
    [-43, -18, "纵"], [-43, 18, "纵"],
    [43, -18, "纵"], [43, 18, "纵"]
  ]) {
    addRubbleCover(item[0], item[1], item[2]);
  }

  for (const point of [
    [-47, -35], [-38, -47], [47, -35], [38, -47],
    [-47, 35], [-38, 47], [47, 35], [38, 47]
  ]) {
    addCrate(point[0], point[1], 2.1, 1.8, 2.1);
  }

  for (const light of [
    [-24, 3.1, -43], [24, 3.1, -43], [-24, 3.1, 43], [24, 3.1, 43],
    [-43, 3.1, -24], [-43, 3.1, 24], [43, 3.1, -24], [43, 3.1, 24]
  ]) {
    addMapLight(light[0], light[1], light[2], 0xffd397, 5.5, 13);
  }
}

function addCommonSpawns(includeSharedOuterArea) {
  if (includeSharedOuterArea !== false) {
    addOuterIndustrialRing();
  }

  // 只在一层 y=0 检测出生点。二层平台的碰撞高度不会参与本次检测，
  // 因此敌人可以在高架下方巡逻，但永远不会出生在高架上。
  for (let z = -47; z <= 47; z += 6) {
    for (let x = -47; x <= 47; x += 6) {
      const offsetX = ((Math.round(z / 6)) % 2 === 0) ? 1.2 : -1.2;
      const spawnX = x + offsetX;
      const distanceFromPlayer = Math.hypot(
        spawnX - playerStart.x,
        z - playerStart.z
      );

      if (
        distanceFromPlayer > 8 &&
        !collidesAt(spawnX, z, 0.72, 0, 1.82)
      ) {
        addSpawn(spawnX, z);
      }
    }
  }
}

// 从玩家出生位置进行一层地面洪水搜索，只保留敌人实际能够走到的区域。
// 这会排除断墙背面、封闭屋顶夹层和地图装饰之间的孤立空间。
function filterSpawnPointsByReachability() {
  groundNavigation = null;
  const cellSize = 1;
  const margin = 0.9;
  const navRadius = 0.52;
  const navBodyHeight = 1.82;
  const navigationStart = findNearestSafePosition(
    new THREE.Vector3(playerStart.x, 0, playerStart.z),
    player.radius,
    player.bodyHeight
  );
  const originX = -MAP_HALF + margin;
  const originZ = -MAP_HALF + margin;
  const cellsPerSide = Math.floor((MAP_SIZE - margin * 2) / cellSize) + 1;
  const cellTotal = cellsPerSide * cellsPerSide;
  const walkable = new Uint8Array(cellTotal);
  const reachable = new Uint8Array(cellTotal);
  const queue = new Int32Array(cellTotal);

  function cellIndex(xIndex, zIndex) {
    return zIndex * cellsPerSide + xIndex;
  }

  function cellWorldX(xIndex) {
    return originX + xIndex * cellSize;
  }

  function cellWorldZ(zIndex) {
    return originZ + zIndex * cellSize;
  }

  let nearestStartIndex = -1;
  let nearestStartDistance = Infinity;
  for (let zIndex = 0; zIndex < cellsPerSide; zIndex++) {
    for (let xIndex = 0; xIndex < cellsPerSide; xIndex++) {
      const index = cellIndex(xIndex, zIndex);
      const worldX = cellWorldX(xIndex);
      const worldZ = cellWorldZ(zIndex);
      if (!collidesAt(worldX, worldZ, navRadius, 0, navBodyHeight)) {
        walkable[index] = 1;
        const startDistance = Math.hypot(
          worldX - navigationStart.x,
          worldZ - navigationStart.z
        );
        if (startDistance < nearestStartDistance) {
          nearestStartDistance = startDistance;
          nearestStartIndex = index;
        }
      }
    }
  }

  if (nearestStartIndex < 0) {
    spawnPoints.length = 0;
    return;
  }

  let queueHead = 0;
  let queueTail = 0;
  queue[queueTail++] = nearestStartIndex;
  reachable[nearestStartIndex] = 1;

  while (queueHead < queueTail) {
    const index = queue[queueHead++];
    const xIndex = index % cellsPerSide;
    const zIndex = Math.floor(index / cellsPerSide);
    const neighbors = [
      [xIndex - 1, zIndex],
      [xIndex + 1, zIndex],
      [xIndex, zIndex - 1],
      [xIndex, zIndex + 1]
    ];

    for (const neighbor of neighbors) {
      const nextX = neighbor[0];
      const nextZ = neighbor[1];
      if (
        nextX < 0 || nextX >= cellsPerSide ||
        nextZ < 0 || nextZ >= cellsPerSide
      ) {
        continue;
      }
      const nextIndex = cellIndex(nextX, nextZ);
      if (!walkable[nextIndex] || reachable[nextIndex]) continue;
      reachable[nextIndex] = 1;
      queue[queueTail++] = nextIndex;
    }
  }

  const safeSpawns = [];
  for (const point of spawnPoints) {
    const xIndex = THREE.MathUtils.clamp(
      Math.round((point.x - originX) / cellSize),
      0,
      cellsPerSide - 1
    );
    const zIndex = THREE.MathUtils.clamp(
      Math.round((point.z - originZ) / cellSize),
      0,
      cellsPerSide - 1
    );
    if (reachable[cellIndex(xIndex, zIndex)]) {
      safeSpawns.push(point);
    }
  }

  // 若规则网格留下的点较少，从已确认连通的单元中补充安全出生点。
  for (let queueIndex = 0; queueIndex < queueTail && safeSpawns.length < 70; queueIndex += 5) {
    const index = queue[queueIndex];
    const xIndex = index % cellsPerSide;
    const zIndex = Math.floor(index / cellsPerSide);
    const worldX = cellWorldX(xIndex);
    const worldZ = cellWorldZ(zIndex);
    if (Math.hypot(worldX - navigationStart.x, worldZ - navigationStart.z) <= 9) continue;

    let tooClose = false;
    for (const point of safeSpawns) {
      if (Math.hypot(worldX - point.x, worldZ - point.z) < 3.2) {
        tooClose = true;
        break;
      }
    }
    if (!tooClose) safeSpawns.push(new THREE.Vector3(worldX, 0, worldZ));
  }

  spawnPoints.length = 0;
  spawnPoints.push.apply(spawnPoints, safeSpawns);

  // 保存整张地图的一层连通网格。敌人会基于它规划跨房间、跨走廊路线，
  // 而不是只朝目标直线行走并在第一堵墙前反复改向。
  groundNavigation = {
    cellSize: cellSize,
    originX: originX,
    originZ: originZ,
    cellsPerSide: cellsPerSide,
    reachable: reachable
  };
}

function addDoorFrame(x, z, orientation, width, height) {
  width = width || 2.8;
  height = height || 2.65;
  const post = 0.22;
  const beam = 0.24;

  if (orientation === "横") {
    addBox(x - width / 2, height / 2, z, post, height, 0.32, woodMaterial);
    addBox(x + width / 2, height / 2, z, post, height, 0.32, woodMaterial);
    addBox(x, height, z, width + post, beam, 0.32, woodMaterial);
  } else {
    addBox(x, height / 2, z - width / 2, 0.32, height, post, woodMaterial);
    addBox(x, height / 2, z + width / 2, 0.32, height, post, woodMaterial);
    addBox(x, height, z, 0.32, beam, width + post, woodMaterial);
  }
}

function addBrokenWall(x, z, length, orientation) {
  const pieces = [
    { offset: -0.37, scale: 0.26, height: 2.8 },
    { offset: 0, scale: 0.14, height: 1.15 },
    { offset: 0.36, scale: 0.25, height: 2.15 }
  ];

  for (const piece of pieces) {
    if (orientation === "横") {
      addBox(
        x + piece.offset * length,
        piece.height / 2,
        z,
        piece.scale * length,
        piece.height,
        0.46,
        wallMaterial
      );
    } else {
      addBox(
        x,
        piece.height / 2,
        z + piece.offset * length,
        0.46,
        piece.height,
        piece.scale * length,
        wallMaterial
      );
    }
  }
}

function addBentCorridor(points, width, color) {
  width = width || 4.2;
  color = color || 0xe39a4b;

  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i];
    const end = points[i + 1];
    const dx = end[0] - start[0];
    const dz = end[1] - start[1];

    if (Math.abs(dx) >= Math.abs(dz)) {
      addTunnel(
        (start[0] + end[0]) / 2,
        start[1],
        Math.abs(dx) + 0.5,
        width,
        "横",
        color
      );
    } else {
      addTunnel(
        start[0],
        (start[1] + end[1]) / 2,
        Math.abs(dz) + 0.5,
        width,
        "纵",
        color
      );
    }

  }
}

function addLoadingDock(x, z, width, depth, approach) {
  const topY = 0.78;
  const stepDepth = 0.9;

  addBox(
    x,
    topY / 2,
    z,
    width,
    topY,
    depth,
    wallMaterial,
    { platform: true }
  );

  if (approach === "南" || approach === "北") {
    const sign = approach === "南" ? 1 : -1;
    addBox(
      x,
      0.25,
      z + sign * (depth / 2 + stepDepth / 2),
      width * 0.6,
      0.5,
      stepDepth,
      wallMaterial,
      { platform: true }
    );
    addBox(
      x,
      0.13,
      z + sign * (depth / 2 + stepDepth * 1.35),
      width * 0.48,
      0.26,
      stepDepth,
      wallMaterial,
      { platform: true }
    );
  } else {
    const sign = approach === "东" ? 1 : -1;
    addBox(
      x + sign * (width / 2 + stepDepth / 2),
      0.25,
      z,
      stepDepth,
      0.5,
      depth * 0.6,
      wallMaterial,
      { platform: true }
    );
    addBox(
      x + sign * (width / 2 + stepDepth * 1.35),
      0.13,
      z,
      stepDepth,
      0.26,
      depth * 0.48,
      wallMaterial,
      { platform: true }
    );
  }
}

function addSunkenWorkBay(x, z, width, depth) {
  const rimHeight = 0.36;
  const rimWidth = 2.2;
  const entranceWidth = 2.8;

  // 中央仍使用 y=0 的基础地面，四周抬高后形成相对凹陷。
  addBox(
    x - width / 2 + rimWidth / 2,
    rimHeight / 2,
    z,
    rimWidth,
    rimHeight,
    depth,
    wallMaterial,
    { platform: true }
  );
  addBox(
    x + width / 2 - rimWidth / 2,
    rimHeight / 2,
    z,
    rimWidth,
    rimHeight,
    depth,
    wallMaterial,
    { platform: true }
  );
  const horizontalLength = width - rimWidth * 2;
  const sideLength = (horizontalLength - entranceWidth) / 2;

  for (const edgeZ of [
    z - depth / 2 + rimWidth / 2,
    z + depth / 2 - rimWidth / 2
  ]) {
    addBox(
      x - (entranceWidth + sideLength) / 2,
      rimHeight / 2,
      edgeZ,
      sideLength,
      rimHeight,
      rimWidth,
      wallMaterial,
      { platform: true }
    );
    addBox(
      x + (entranceWidth + sideLength) / 2,
      rimHeight / 2,
      edgeZ,
      sideLength,
      rimHeight,
      rimWidth,
      wallMaterial,
      { platform: true }
    );
  }
}

function addCatwalkSegment(x, z, length, orientation, topY) {
  const width = 2.7;

  if (orientation === "横") {
    addPlatform(x, z, length, width, topY);
    for (let offset = -length / 2 + 2.5; offset <= length / 2 - 2.5; offset += 5) {
      addBox(
        x + offset,
        topY / 2,
        z,
        0.58,
        topY,
        0.58,
        wallMaterial
      );
    }
  } else {
    addPlatform(x, z, width, length, topY);
    for (let offset = -length / 2 + 2.5; offset <= length / 2 - 2.5; offset += 5) {
      addBox(
        x,
        topY / 2,
        z + offset,
        0.58,
        topY,
        0.58,
        wallMaterial
      );
    }
  }
}

function addRubbleCover(x, z, orientation) {
  if (orientation === "横") {
    addBox(x, 0.55, z, 4.5, 1.1, 0.75, wallMaterial);
    addBox(x - 1.35, 1.05, z, 1.7, 1, 0.64, wallMaterial);
    addBox(x + 1.45, 0.82, z, 1.25, 0.55, 0.8, woodMaterial);
  } else {
    addBox(x, 0.55, z, 0.75, 1.1, 4.5, wallMaterial);
    addBox(x, 1.05, z - 1.35, 0.64, 1, 1.7, wallMaterial);
    addBox(x, 0.82, z + 1.45, 0.8, 0.55, 1.25, woodMaterial);
  }
}

function addRailTrack(x, z, length, orientation) {
  const railSpacing = 0.82;
  if (orientation === "纵") {
    addBox(x - railSpacing, 0.07, z, 0.13, 0.14, length, metalMaterial, { collider: false });
    addBox(x + railSpacing, 0.07, z, 0.13, 0.14, length, metalMaterial, { collider: false });
    for (let offset = -length / 2 + 1; offset <= length / 2 - 1; offset += 2.4) {
      addBox(x, 0.035, z + offset, 2.2, 0.07, 0.22, woodDarkMaterial, { collider: false });
    }
  } else {
    addBox(x, 0.07, z - railSpacing, length, 0.14, 0.13, metalMaterial, { collider: false });
    addBox(x, 0.07, z + railSpacing, length, 0.14, 0.13, metalMaterial, { collider: false });
    for (let offset = -length / 2 + 1; offset <= length / 2 - 1; offset += 2.4) {
      addBox(x + offset, 0.035, z, 0.22, 0.07, 2.2, woodDarkMaterial, { collider: false });
    }
  }
}

function addFurnaceStack(x, z, glowColor) {
  // 方形炉基提供准确、稳定的碰撞；上方炉体与烟囱负责视觉轮廓和射线命中。
  addBox(x, 0.7, z, 5.6, 1.4, 5.6, bunkerMaterial);

  const furnace = new THREE.Mesh(
    new THREE.CylinderGeometry(1.85, 2.25, 5.4, 12),
    metalMaterial
  );
  furnace.position.set(x, 4.1, z);
  furnace.castShadow = true;
  furnace.receiveShadow = true;
  mapRoot.add(furnace);
  raycastWorld.push(furnace);

  const chimney = new THREE.Mesh(
    new THREE.CylinderGeometry(0.72, 0.92, 4.2, 10),
    darkWallMaterial
  );
  chimney.position.set(x, 8.8, z);
  chimney.castShadow = true;
  mapRoot.add(chimney);
  raycastWorld.push(chimney);

  addMapLight(x, 1.7, z + 2.8, glowColor || 0xff6638, 6.5, 12);
}

// -----------------------------------------------------------------------
// 程序化墙画与生活化家具
// -----------------------------------------------------------------------
// 墙画由 Canvas 即时绘制，因此本单文件无需加载任何外部图片资源。
function createWallArtTexture(caption, theme) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  const palettes = {
    蓝: ["#102b38", "#2f91aa", "#bde9ef", "#e0a64f"],
    橙: ["#351b15", "#b74f2f", "#ffd08b", "#526b72"],
    绿: ["#132a24", "#3f8065", "#d2e3b1", "#d39a4b"],
    紫: ["#211b32", "#6f5aa0", "#e1c8ef", "#d18a48"]
  };
  const palette = palettes[theme] || palettes.蓝;

  const gradient = context.createLinearGradient(0, 0, 512, 256);
  gradient.addColorStop(0, palette[0]);
  gradient.addColorStop(0.55, palette[1]);
  gradient.addColorStop(1, palette[0]);
  context.fillStyle = gradient;
  context.fillRect(0, 0, 512, 256);

  // 抽象厂房天际线、管道和太阳共同组成每张海报的主插画。
  context.fillStyle = "rgba(5, 10, 13, 0.62)";
  for (let i = 0; i < 9; i++) {
    const seed = caption.charCodeAt(i % caption.length) + i * 37;
    const buildingWidth = 34 + seed % 42;
    const buildingHeight = 40 + seed % 96;
    context.fillRect(i * 61 - 16, 188 - buildingHeight, buildingWidth, buildingHeight);
    context.fillRect(i * 61 + 4, 75 - seed % 28, 9, 113 + seed % 28);
  }
  context.beginPath();
  context.arc(405, 67, 38, 0, Math.PI * 2);
  context.fillStyle = palette[3];
  context.fill();

  context.strokeStyle = palette[2];
  context.lineWidth = 9;
  context.beginPath();
  context.moveTo(35, 64);
  context.lineTo(147, 25);
  context.lineTo(253, 82);
  context.lineTo(362, 33);
  context.stroke();

  // 底部工业警戒条与中文标题增强废弃仓库中的视觉识别。
  context.fillStyle = "rgba(10, 13, 15, 0.82)";
  context.fillRect(0, 188, 512, 68);
  context.save();
  context.translate(0, 188);
  context.rotate(-0.12);
  for (let x = -80; x < 580; x += 48) {
    context.fillStyle = x % 96 === 0 ? palette[3] : "rgba(18, 22, 24, 0.9)";
    context.fillRect(x, 0, 26, 82);
  }
  context.restore();
  context.fillStyle = "#f4f0df";
  context.font = "900 42px Microsoft YaHei, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.shadowColor = "rgba(0, 0, 0, 0.85)";
  context.shadowBlur = 8;
  context.fillText(caption, 256, 221);

  context.shadowBlur = 0;
  context.strokeStyle = "rgba(230, 239, 235, 0.8)";
  context.lineWidth = 8;
  context.strokeRect(8, 8, 496, 240);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return texture;
}

function addWallArt(x, y, z, width, height, facing, caption, theme, visibleSide) {
  const texture = createWallArtTexture(caption, theme);
  const sideDirection = visibleSide === -1 ? -1 : 1;
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    color: 0xffffff,
    emissive: 0x172027,
    emissiveIntensity: 0.22,
    roughness: 0.62,
    metalness: 0.04,
    side: THREE.DoubleSide
  });
  material.userData.mapOwned = true;

  const frame = addBox(
    x, y, z,
    facing === "横" ? width + 0.18 : 0.11,
    height + 0.18,
    facing === "横" ? 0.11 : width + 0.18,
    woodDarkMaterial,
    { collider: false }
  );
  frame.castShadow = false;

  const painting = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  painting.position.set(
    x + (facing === "纵" ? 0.061 * sideDirection : 0),
    y,
    z + (facing === "横" ? 0.061 * sideDirection : 0)
  );
  if (facing === "纵") painting.rotation.y = Math.PI / 2;
  painting.castShadow = false;
  painting.receiveShadow = false;
  mapRoot.add(painting);
  raycastWorld.push(painting);
  return painting;
}

// 外围边界没有任何门洞，是放置大型安全宣传画最稳定的位置。
// 北墙与西墙朝地图内部的可见方向为正，东墙朝地图内部的方向为负。
function addOuterWallGallery() {
  const northWallArt = [
    [-39, "安全生产", "橙"],
    [-14, "质量第一", "蓝"],
    [14, "珍惜资源", "绿"],
    [39, "严禁烟火", "橙"]
  ];
  for (const item of northWallArt) {
    addWallArt(item[0], 2.35, -51.42, 7.2, 2.25, "横", item[1], item[2], 1);
  }

  const westWallArt = [
    [-36, "佩戴护具", "蓝"],
    [-11, "当心机械", "橙"],
    [14, "文明施工", "绿"],
    [39, "平安回家", "紫"]
  ];
  for (const item of westWallArt) {
    addWallArt(-51.42, 2.35, item[0], 7.2, 2.25, "纵", item[1], item[2], 1);
  }

  const eastWallArt = [
    [-29, "保持通道", "绿"],
    [0, "人人有责", "蓝"],
    [29, "注意高空", "橙"]
  ];
  for (const item of eastWallArt) {
    addWallArt(51.42, 2.35, item[0], 7.2, 2.25, "纵", item[1], item[2], -1);
  }
}

function addCabinet(x, z, orientation) {
  const horizontal = orientation !== "纵";
  const width = horizontal ? 2.8 : 0.72;
  const depth = horizontal ? 0.72 : 2.8;
  addBox(x, 1.15, z, width, 2.3, depth, woodMaterial);

  // 门缝、把手和顶檐只是薄装饰，不额外扩大碰撞体。
  if (horizontal) {
    addBox(x, 1.15, z + depth / 2 + 0.025, 0.07, 2.05, 0.05, woodDarkMaterial, { collider: false });
    addBox(x - 0.18, 1.2, z + depth / 2 + 0.06, 0.06, 0.18, 0.06, metalMaterial, { collider: false });
    addBox(x + 0.18, 1.2, z + depth / 2 + 0.06, 0.06, 0.18, 0.06, metalMaterial, { collider: false });
  } else {
    addBox(x + width / 2 + 0.025, 1.15, z, 0.05, 2.05, 0.07, woodDarkMaterial, { collider: false });
    addBox(x + width / 2 + 0.06, 1.2, z - 0.18, 0.06, 0.18, 0.06, metalMaterial, { collider: false });
    addBox(x + width / 2 + 0.06, 1.2, z + 0.18, 0.06, 0.18, 0.06, metalMaterial, { collider: false });
  }
  addBox(x, 2.37, z, width + 0.14, 0.14, depth + 0.14, woodDarkMaterial, { collider: false });
}

function addTable(x, z, orientation) {
  const horizontal = orientation !== "纵";
  const width = horizontal ? 3.1 : 1.45;
  const depth = horizontal ? 1.45 : 3.1;
  addBox(x, 1.04, z, width, 0.2, depth, woodMaterial);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      addBox(
        x + sx * (width / 2 - 0.22), 0.49, z + sz * (depth / 2 - 0.22),
        0.18, 0.98, 0.18, woodDarkMaterial
      );
    }
  }
}

function addChair(x, z, facing) {
  addBox(x, 0.58, z, 0.86, 0.14, 0.86, woodMaterial);
  addBox(x, 0.27, z, 0.68, 0.54, 0.68, woodDarkMaterial);
  const backOffset = 0.43;
  if (facing === "北" || facing === "南") {
    addBox(x, 1.03, z + (facing === "北" ? backOffset : -backOffset), 0.86, 0.96, 0.12, woodMaterial);
  } else {
    addBox(x + (facing === "西" ? backOffset : -backOffset), 1.03, z, 0.12, 0.96, 0.86, woodMaterial);
  }
}

function addVase(x, y, z, color) {
  const vaseMaterial = new THREE.MeshStandardMaterial({
    color: color || 0x4c87a6,
    roughness: 0.28,
    metalness: 0.08
  });
  vaseMaterial.userData.mapOwned = true;
  const vase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.17, 0.28, 0.58, 12),
    vaseMaterial
  );
  vase.position.set(x, y + 0.29, z);
  vase.castShadow = true;
  mapRoot.add(vase);
  raycastWorld.push(vase);
  colliders.push({
    minX: x - 0.28, maxX: x + 0.28,
    minY: y, maxY: y + 0.58,
    minZ: z - 0.28, maxZ: z + 0.28
  });

  const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x3f7045, roughness: 0.82 });
  stemMaterial.userData.mapOwned = true;
  for (const offset of [-0.08, 0.08]) {
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.025, 0.55, 6), stemMaterial);
    stem.position.set(x + offset, y + 0.82, z);
    stem.rotation.z = offset * 1.4;
    mapRoot.add(stem);
    raycastWorld.push(stem);
  }
}

function addFurnitureCluster(x, z, orientation, accentColor) {
  const horizontal = orientation !== "纵";
  addTable(x, z, orientation);
  if (horizontal) {
    addChair(x, z - 1.4, "南");
    addChair(x, z + 1.4, "北");
    addCabinet(x + 3.15, z, "纵");
    addVase(x + 0.55, 1.14, z, accentColor);
  } else {
    addChair(x - 1.4, z, "东");
    addChair(x + 1.4, z, "西");
    addCabinet(x, z + 3.15, "横");
    addVase(x, 1.14, z + 0.55, accentColor);
  }
}

// 每张地图独立指定安全的墙面与空房区域。此表覆盖五张无尽地图和五个关卡，
// 装饰在地图主体建成后统一生成，避免任何游戏模式遗漏生活化细节。
function decorateCurrentMap() {
  const layouts = {
    "废弃联合厂区": {
      art: [
        [-7, 2.05, -9.72, 4.4, 2, "横", "装配守则", "橙", 1],
        [-29.72, 2, 4.5, 4.2, 2, "纵", "联合厂区", "蓝", -1],
        [34, 2, -24.72, 4.5, 2, "横", "工人之家", "绿", -1],
        [0, 2, 45.72, 5.4, 2.1, "横", "生产蓝图", "蓝", -1],
        [45.72, 2, 8, 4.6, 2, "纵", "设备巡检", "橙", -1]
      ],
      furniture: [[-5, -38, "横", 0x4c8aaa], [-38, -4, "纵", 0xb96c42]]
    },
    "地下转运站": {
      art: [
        [-47.72, 2, -28, 4.6, 2, "纵", "一路平安", "蓝", 1],
        [47.72, 2, -12, 5, 2.1, "纵", "准点发车", "橙", -1],
        [-39, 2, 37.72, 4.2, 1.9, "横", "地下站台", "绿", -1],
        [-30.28, 2, 21, 4.2, 1.9, "纵", "候车须知", "蓝", -1],
        [30.28, 2, -19, 4.5, 2, "纵", "货运调度", "橙", 1]
      ],
      furniture: [[-40, -29, "横", 0x5a90aa], [39, -12, "纵", 0xc16b43]]
    },
    "坍塌钢铁厂": {
      art: [
        [27, 2.1, -21.72, 5.2, 2.15, "横", "轧钢车间", "橙", -1],
        [-32, 2, 20.28, 4.8, 2, "横", "百炼成钢", "蓝", 1],
        [17.28, 2, 20, 4.6, 2, "纵", "重建家园", "绿", 1],
        [-43.72, 2, 28, 4.4, 2, "纵", "设备档案", "蓝", 1],
        [42.72, 2, 13, 4.6, 2, "纵", "复工计划", "绿", -1]
      ],
      furniture: [[27, -31, "横", 0xb96442], [-33, 30, "纵", 0x5987a3]]
    },
    "双环冷却厂": {
      art: [
        [-27, 2.15, -19.72, 5.4, 2.2, "横", "冷却一号", "蓝", 1],
        [27, 2.15, 19.72, 5.4, 2.2, "横", "冷却二号", "绿", -1],
        [45.72, 2, 2, 4.6, 2, "纵", "循环不息", "紫", -1],
        [-46.72, 2, -10, 4.8, 2, "纵", "水压记录", "蓝", 1],
        [46.72, 2, 10, 4.8, 2, "纵", "循环规程", "绿", -1]
      ],
      furniture: [[-38, 11, "纵", 0x4f8ca7], [38, -11, "纵", 0x5d9670]]
    },
    "蛇形后勤堡垒": {
      art: [
        [-18, 2, -31.68, 5, 2, "横", "后勤保障", "绿", 1],
        [18, 2, 0.32, 5, 2, "横", "守望相助", "橙", 1],
        [-18, 2, 32.32, 5, 2, "横", "平安归来", "蓝", 1],
        [18, 2, -15.68, 5, 2, "横", "仓储清单", "紫", 1],
        [-18, 2, 16.32, 5, 2, "横", "物资路线", "绿", 1]
      ],
      furniture: [[-35, -24, "横", 0x73955d], [35, 24, "横", 0xb36d48]]
    },
    "第一关：旧机修仓": {
      art: [
        [-12, 2, -7.72, 3.8, 1.9, "横", "机修之家", "橙", 1],
        [-25, 2, -28.22, 4.2, 1.9, "横", "精心检修", "蓝", 1],
        [22, 2, -28.72, 4.2, 1.9, "横", "工具归位", "绿", 1],
        [-31.72, 2, 22, 4.1, 1.9, "纵", "班组记忆", "紫", 1],
        [31.22, 2, 17, 4.2, 1.9, "纵", "每日点检", "橙", -1]
      ],
      furniture: [[-25, -22, "横", 0x548baa], [24, 16, "纵", 0xa86a45]]
    },
    "第二关：物流仓库群": {
      art: [
        [0, 2, -29.72, 4.4, 1.9, "横", "今日发货", "绿", 1],
        [-23, 2, 29.22, 4.2, 1.9, "横", "安全装卸", "橙", -1],
        [23, 2, -29.72, 4.2, 1.9, "横", "货物编码", "蓝", 1],
        [30.72, 2, 22, 4.2, 1.9, "纵", "先进先出", "绿", -1],
        [-30.72, 2, -23, 4.2, 1.9, "纵", "轻拿轻放", "紫", 1]
      ],
      furniture: [[-23, -23, "横", 0x6b9462], [23, 22, "横", 0xb56b46]]
    },
    "第三关：地下动力区": {
      art: [
        [0, 2, -29.72, 4.4, 1.9, "横", "动力核心", "紫", 1],
        [23, 2, 27.72, 4.1, 1.85, "横", "节约能源", "蓝", -1],
        [-31.72, 2, -24, 4.1, 1.9, "纵", "高压危险", "橙", 1],
        [31.72, 2, -22, 4.1, 1.9, "纵", "检修记录", "蓝", -1],
        [-30.72, 2, 21, 4.1, 1.9, "纵", "保持通风", "绿", 1]
      ],
      furniture: [[-25, -24, "横", 0x7659a2], [-23, 21, "横", 0x4d86a1]]
    },
    "第四关：高架铸造车间": {
      art: [
        [-24, 2, -29.22, 4.2, 1.9, "横", "铸造荣光", "橙", 1],
        [24, 2, 29.22, 4.2, 1.9, "横", "质量第一", "蓝", -1],
        [31.22, 2, -23, 4.1, 1.9, "纵", "高温作业", "橙", -1],
        [-31.22, 2, 23, 4.1, 1.9, "纵", "工艺流程", "蓝", 1],
        [-24, 2, 29.22, 4.2, 1.9, "横", "匠心制造", "绿", -1]
      ],
      furniture: [[-24, -23, "横", 0xb66a45], [24, 23, "横", 0x5689a5]]
    },
    "第五关：坍塌核心工厂": {
      art: [
        [-25, 2, -29.72, 4.2, 1.9, "横", "核心禁区", "橙", 1],
        [25, 2, 28.72, 4.2, 1.9, "横", "坚持到底", "紫", -1],
        [9.72, 2.05, 5, 3.2, 1.9, "纵", "共同守护", "蓝", -1],
        [-31.72, 2, -24, 4.2, 1.9, "纵", "废墟档案", "橙", 1],
        [31.72, 2, 23, 4.2, 1.9, "纵", "最后防线", "紫", -1]
      ],
      furniture: [[-25, 23, "横", 0x7354a2], [25, -24, "横", 0xb35e42]]
    }
  };

  const layout = layouts[currentMapName];
  if (!layout) return;
  addOuterWallGallery();
  for (const art of layout.art) addWallArt.apply(null, art);
  for (const furniture of layout.furniture) addFurnitureCluster.apply(null, furniture);
}
