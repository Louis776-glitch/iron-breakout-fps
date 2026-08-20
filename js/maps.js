"use strict";

// -----------------------------------------------------------------------
// 十张可供无尽模式和关卡模式共同使用的独立线路拓扑
// -----------------------------------------------------------------------
function buildLegacyEndlessMap() {
  currentMapName = "废弃联合厂区";
  scene.background.set(0x10161c);
  scene.fog.color.set(0x10161c);
  scene.fog.near = 23;
  scene.fog.far = 96;
  sun.color.set(0xffd7aa);
  sun.intensity = 1.42;
  hemisphere.intensity = 0.68;

  addFloor();
  addBoundary();
  setPlayerStart(0, 31, Math.PI, 0);

  // 六座一层房间围绕中央装配大厅，通过转角暗廊互相连通。
  addRoom(0, 0, 18, 16, {
    doors: ["北", "南", "东", "西"],
    roof: false,
    height: 4
  });
  addRoom(-25, -23, 14, 12, {
    doors: ["南", "东"],
    roof: true,
    lightColor: 0xff8b43
  });
  addRoom(24, -22, 14, 12, {
    doors: ["南", "西"],
    roof: true,
    lightColor: 0x5d8dca
  });
  addRoom(-25, 23, 14, 12, {
    doors: ["北", "东"],
    roof: true,
    lightColor: 0x648cc5
  });
  addRoom(24, 22, 14, 12, {
    doors: ["北", "西"],
    roof: true,
    lightColor: 0xffa04e
  });
  addRoom(-28, 1, 10, 14, {
    doors: ["东", "北"],
    roof: false
  });
  addRoom(28, 2, 10, 14, {
    doors: ["西", "南"],
    roof: false
  });

  addBentCorridor([[-18, -23], [-11, -23], [-11, -8], [0, -8]], 4.1, 0xd8803e);
  addBentCorridor([[17, -22], [11, -22], [11, -8], [0, -8]], 4.1, 0x4d78ad);
  addBentCorridor([[-18, 23], [-11, 23], [-11, 8], [0, 8]], 4.1, 0x4d78ad);
  addBentCorridor([[17, 22], [11, 22], [11, 8], [0, 8]], 4.1, 0xd8803e);
  addBentCorridor([[-23, 1], [-15, 1], [-15, 0], [-9, 0]], 3.8, 0xbc733d);
  addBentCorridor([[23, 2], [15, 2], [15, 0], [9, 0]], 3.8, 0x527fac);

  addDoorFrame(0, -8, "横", 2.7, 2.55);
  addDoorFrame(0, 8, "横", 2.7, 2.55);
  addDoorFrame(-9, 0, "纵", 2.7, 2.55);
  addDoorFrame(9, 0, "纵", 2.7, 2.55);

  // 中央大厅上方的二层玩家优势回廊。
  addCatwalkSegment(0, -1.8, 14, "横", 3.45);
  addPlatform(6, 3.5, 5, 5, 3.45);
  addLadder(-5.7, -0.05, 3.45, 0, -1, "横");
  addLadder(8.85, 3.5, 3.45, -1, 0, "纵");

  // 低装卸台可直接逐级跳上，中央南侧是相对凹陷维修坑。
  addLoadingDock(-23, 15, 8, 5, "南");
  addLoadingDock(23, -12, 7, 5, "西");
  addSunkenWorkBay(0, 17, 12, 9);

  addBrokenWall(-18, -2, 10, "纵");
  addBrokenWall(18, 9, 11, "横");
  addRubbleCover(-5, -14, "横");
  addRubbleCover(18, -3, "纵");

  const crates = [
    [-29, -8], [-25, 8], [-19, 29], [19, 29],
    [-5, 5], [5, -5], [27, 11], [20, -30],
    [-3, -29], [29, -9]
  ];
  for (const point of crates) addCrate(point[0], point[1]);

  addMapLight(0, 3.2, 0, 0xe7b061, 5.5, 17);
  addMapLight(-20, 2.6, 0, 0x668fc4, 3.6, 10);
  addMapLight(20, 2.6, 2, 0xd78446, 3.6, 10);
  addCommonSpawns();
}

function buildLegacyEndlessMapTwo() {
  currentMapName = "地下转运站";
  scene.background.set(0x080f16);
  scene.fog.color.set(0x080f16);
  scene.fog.near = 12;
  scene.fog.far = 70;
  sun.color.set(0x6f8eaa);
  sun.intensity = 0.38;
  hemisphere.intensity = 0.32;

  addFloor();
  addBoundary();
  setPlayerStart(0, 31, Math.PI, 0);

  addRoom(0, 1, 20, 16, {
    doors: ["北", "南", "东", "西"],
    roof: false,
    height: 4
  });
  addRoom(-25, -24, 14, 12, {
    doors: ["南", "东"],
    roof: true,
    lightColor: 0xe57938
  });
  addRoom(24, -24, 15, 12, {
    doors: ["南", "西"],
    roof: true,
    lightColor: 0x487db8
  });
  addRoom(-25, 23, 15, 12, {
    doors: ["北", "东"],
    roof: true,
    lightColor: 0x487db8
  });
  addRoom(25, 23, 14, 12, {
    doors: ["北", "西"],
    roof: true,
    lightColor: 0xe57938
  });
  addRoom(-27, 1, 10, 16, {
    doors: ["东", "北"],
    roof: true,
    lightColor: 0x9a6438
  });
  addRoom(27, 1, 10, 16, {
    doors: ["西", "南"],
    roof: true,
    lightColor: 0x416e9e
  });

  addBentCorridor([[-18, -24], [-12, -24], [-12, -7], [0, -7]], 3.9, 0xdf7236);
  addBentCorridor([[16.5, -24], [12, -24], [12, -7], [0, -7]], 3.9, 0x4677ad);
  addBentCorridor([[-17.5, 23], [-12, 23], [-12, 9], [0, 9]], 3.9, 0x4677ad);
  addBentCorridor([[18, 23], [12, 23], [12, 9], [0, 9]], 3.9, 0xdf7236);
  addBentCorridor([[-22, 1], [-16, 1], [-16, 0], [-10, 0]], 3.7, 0xa96437);
  addBentCorridor([[22, 1], [16, 1], [16, 2], [10, 2]], 3.7, 0x426f9f);

  addDoorFrame(0, -7, "横", 2.7, 2.55);
  addDoorFrame(0, 9, "横", 2.7, 2.55);
  addDoorFrame(-10, 1, "纵", 2.7, 2.55);
  addDoorFrame(10, 1, "纵", 2.7, 2.55);

  addCatwalkSegment(0, 1, 13, "纵", 3.35);
  addPlatform(-4.5, -4, 5, 5, 3.35);
  addLadder(1.75, -4.8, 3.35, -1, 0, "纵");
  addLadder(-7.35, -4, 3.35, 1, 0, "纵");

  addLoadingDock(-23, 13, 8, 6, "东");
  addLoadingDock(23, -13, 8, 6, "西");
  addSunkenWorkBay(0, 20, 12, 9);
  addSunkenWorkBay(-15, -2, 9, 8);

  addBrokenWall(-21, -8, 11, "横");
  addBrokenWall(21, 10, 11, "横");
  addRubbleCover(-5, -15, "横");
  addRubbleCover(18, -3, "纵");

  for (const point of [
    [-30, 10], [-26, -9], [-15, 29], [15, 29],
    [30, -10], [25, 10], [-8, -29], [8, -29],
    [-5, 5], [6, -5]
  ]) {
    addCrate(point[0], point[1]);
  }

  addMapLight(0, 3.05, 1, 0x7950bc, 5, 16);
  addMapLight(-17, 2.55, 1, 0xd27538, 3.4, 9);
  addMapLight(17, 2.55, 1, 0x4777aa, 3.4, 9);
  addCommonSpawns();
}

function buildLegacyEndlessMapThree() {
  currentMapName = "坍塌钢铁厂";
  scene.background.set(0x190d0b);
  scene.fog.color.set(0x190d0b);
  scene.fog.near = 17;
  scene.fog.far = 82;
  sun.color.set(0xff9a68);
  sun.intensity = 0.92;
  hemisphere.intensity = 0.48;

  addFloor();
  addBoundary();
  setPlayerStart(-30, 30, -Math.PI * 0.75, 0);

  addRoom(0, 0, 24, 20, {
    doors: ["北", "南", "东", "西"],
    roof: false,
    height: 4.2
  });
  addRoom(-25, -23, 14, 13, {
    doors: ["南", "东"],
    roof: true,
    lightColor: 0xff623c
  });
  addRoom(25, -23, 14, 13, {
    doors: ["南", "西"],
    roof: true,
    lightColor: 0xff9a45
  });
  addRoom(-25, 23, 14, 13, {
    doors: ["北", "东"],
    roof: false
  });
  addRoom(25, 23, 14, 13, {
    doors: ["北", "西"],
    roof: false
  });

  addBentCorridor([[-18, -23], [-15, -23], [-15, -10], [0, -10]], 4.2, 0xe05f38);
  addBentCorridor([[18, -23], [15, -23], [15, -10], [0, -10]], 4.2, 0xd78b3f);
  addBentCorridor([[-18, 23], [-15, 23], [-15, 10], [0, 10]], 4.2, 0x7d5a49);
  addBentCorridor([[18, 23], [15, 23], [15, 10], [0, 10]], 4.2, 0xb06439);

  addDoorFrame(0, -10, "横", 2.7, 2.55);
  addDoorFrame(0, 10, "横", 2.7, 2.55);
  addDoorFrame(-12, 0, "纵", 2.7, 2.55);
  addDoorFrame(12, 0, "纵", 2.7, 2.55);

  // 交错高架和中央熔炉检修平台。
  addCatwalkSegment(-2, -3, 18, "横", 3.5);
  addCatwalkSegment(6, 4, 14, "纵", 3.5);
  addPlatform(6, -3, 5, 5, 3.5);
  addPlatform(6, 11, 5, 5, 3.5);
  addLadder(-9.5, -1.25, 3.5, 0, -1, "横");
  addLadder(8.85, 11, 3.5, -1, 0, "纵");

  addLoadingDock(-25, 9, 8, 6, "东");
  addLoadingDock(24, -9, 8, 6, "西");
  addSunkenWorkBay(-4, 18, 11, 8);

  addBrokenWall(-27, 1, 14, "纵");
  addBrokenWall(27, 1, 14, "纵");
  addBrokenWall(0, 28, 14, "横");
  addRubbleCover(-8, -16, "横");
  addRubbleCover(18, 4, "纵");
  addRubbleCover(-18, 12, "纵");

  for (const point of [
    [-30, -10], [-28, 10], [-12, 29], [12, 29],
    [30, -10], [28, 11], [-7, -29], [7, -29],
    [-5, 5], [5, -5], [17, -14]
  ]) {
    addCrate(point[0], point[1]);
  }

  addMapLight(0, 3.2, 0, 0xff603c, 6, 18);
  addMapLight(-18, 2.6, 0, 0xc66c3b, 3.4, 10);
  addMapLight(18, 2.6, 0, 0x86604b, 3.4, 10);
  addCommonSpawns();
}

// -----------------------------------------------------------------------
// 新版无尽地图一：放射式联合厂区
// -----------------------------------------------------------------------
function buildEndlessMap() {
  currentMapName = "废弃联合厂区";
  scene.background.set(0x152029);
  scene.fog.color.set(0x152029);
  scene.fog.near = 30;
  scene.fog.far = 122;
  sun.color.set(0xffe0b8);
  sun.intensity = 1.8;
  hemisphere.intensity = 1.08;

  addFloor();
  addBoundary();
  setPlayerStart(20, 47, Math.PI, 0);

  // 中央装配大厅与四个生产翼形成清晰的放射式主路线。
  addRoom(0, 0, 24, 20, {
    doors: ["北", "南", "东", "西"], roof: false, height: 4.4, doorWidth: 3.2
  });
  addRoom(0, -38, 24, 16, {
    doors: ["南", "东"], roof: true, height: 4, lightColor: 0xffa55b, doorWidth: 3.2
  });
  addRoom(0, 38, 28, 16, {
    doors: ["北", "西"], roof: true, height: 4, lightColor: 0x70a9cf, doorWidth: 3.2
  });
  addRoom(-38, -3, 16, 25, {
    doors: ["东", "南"], roof: true, height: 4, lightColor: 0x79a9cc, doorWidth: 3.2
  });
  addRoom(38, 4, 16, 25, {
    doors: ["西", "北"], roof: true, height: 4, lightColor: 0xffa052, doorWidth: 3.2
  });

  // 四条笔直生产通道不会在转角处产生隐藏碰撞墙。
  addTunnel(0, -20, 20, 4.8, "纵", 0xffb465);
  addTunnel(0, 20, 20, 4.8, "纵", 0x7ab7dc);
  addTunnel(-21, 0, 18, 4.8, "横", 0x7ab7dc);
  addTunnel(21, 0, 18, 4.8, "横", 0xffb465);

  // 两座角部车间与主干分离，外围堆料场可以自由绕行。
  addRoom(-35, 32, 16, 13, {
    doors: ["东", "南"], roof: false, height: 3.7, doorWidth: 3.1
  });
  addRoom(34, -31, 16, 13, {
    doors: ["西", "北"], roof: false, height: 3.7, doorWidth: 3.1
  });
  addDoorFrame(-24, 26, "纵", 3.4, 2.65);
  addDoorFrame(23, -25, "纵", 3.4, 2.65);

  // 中央十字高架是玩家优势位，两组梯子从不同方向进入。
  addCatwalkSegment(0, -2.5, 18, "横", 3.35);
  addCatwalkSegment(5.5, 2.5, 13, "纵", 3.35);
  addPlatform(5.5, -2.5, 5, 5, 3.35);
  addLadder(-9.4, -0.8, 3.35, 0, -1, "横");
  addLadder(8.35, 7.7, 3.35, -1, 0, "纵");

  addSunkenWorkBay(-7, 16, 12, 9);
  addLoadingDock(-39, 15, 9, 6, "东");
  addLoadingDock(39, -14, 9, 6, "西");
  addBrokenWall(-25, -25, 14, "横");
  addBrokenWall(24, 27, 13, "纵");
  addRubbleCover(-20, 13, "纵");
  addRubbleCover(21, -14, "横");

  for (const point of [
    [-46, -43], [-32, -45], [35, -44], [46, -17],
    [-46, 15], [-22, 43], [25, 44], [46, 39],
    [-8, -27], [9, 27], [-27, 8], [28, -7]
  ]) {
    addCrate(point[0], point[1], 2.2, 2, 2.2);
  }

  addMapLight(0, 3.3, 0, 0xffc36e, 6.2, 18);
  addMapLight(-27, 3, 0, 0x78b5d8, 4.2, 13);
  addMapLight(27, 3, 0, 0xffa154, 4.2, 13);
  addMapLight(0, 3, -27, 0xffad5c, 4.2, 13);
  addMapLight(0, 3, 27, 0x7bb7d9, 4.2, 13);
  addCommonSpawns(false);
}

// -----------------------------------------------------------------------
// 新版无尽地图二：纵向双轨地下转运站
// -----------------------------------------------------------------------
function buildEndlessMapTwo() {
  currentMapName = "地下转运站";
  scene.background.set(0x101b24);
  scene.fog.color.set(0x101b24);
  scene.fog.near = 24;
  scene.fog.far = 118;
  sun.color.set(0xa8c8df);
  sun.intensity = 1.75;
  hemisphere.intensity = 1.08;

  addFloor();
  addBoundary();
  setPlayerStart(0, 47, Math.PI, 0);

  // 两组轨道贯穿南北，形成与第一张地图完全不同的长视线战场。
  addRailTrack(-5, 0, 94, "纵");
  addRailTrack(5, 0, 94, "纵");

  // 分段站台刻意错位，中间留出六条横向穿越路线。
  for (const platform of [
    [-13, -35, 6, 17], [-13, -8, 6, 18], [-13, 23, 6, 19],
    [13, -25, 6, 18], [13, 6, 6, 18], [13, 35, 6, 17]
  ]) {
    addBox(
      platform[0], 0.26, platform[1], platform[2], 0.52, platform[3],
      wallMaterial, { platform: true }
    );
  }

  // 站场侧厅沿东西边缘布置，不再围绕中心房间对称复制。
  addRoom(-39, -28, 18, 18, {
    doors: ["东", "南"], roof: true, height: 3.8, lightColor: 0x6ca7cf, doorWidth: 3.2
  });
  addRoom(-39, 28, 18, 20, {
    doors: ["东", "北"], roof: true, height: 3.8, lightColor: 0xd28b4e, doorWidth: 3.2
  });
  addRoom(39, -10, 18, 28, {
    doors: ["西", "北", "南"], roof: true, height: 4, lightColor: 0xd18b4b, doorWidth: 3.2
  });
  addRoom(39, 34, 18, 14, {
    doors: ["西", "北"], roof: true, height: 3.8, lightColor: 0x689ec1, doorWidth: 3.2
  });

  // 横跨轨道的二层天桥和两端梯子是本站唯一高位路线。
  addCatwalkSegment(0, 0, 38, "横", 3.2);
  addPlatform(-19, 0, 5, 5, 3.2);
  addPlatform(19, 0, 5, 5, 3.2);
  addLadder(-21.8, 0, 3.2, 1, 0, "纵");
  addLadder(21.8, 0, 3.2, -1, 0, "纵");

  addSunkenWorkBay(0, -21, 9, 8);
  addLoadingDock(-38, 5, 10, 7, "东");
  addLoadingDock(38, 13, 10, 7, "西");
  addDoorFrame(0, -14, "横", 5.4, 2.7);
  addDoorFrame(0, 15, "横", 5.4, 2.7);

  for (const point of [
    [-21, -41], [20, -42], [-22, -15], [21, -10],
    [-22, 12], [21, 24], [-22, 42], [22, 46],
    [-30, -5], [31, 22], [-31, 43], [31, -35]
  ]) {
    addCrate(point[0], point[1], 2.1, 1.9, 2.1);
  }
  addRubbleCover(-24, -2, "纵");
  addRubbleCover(25, 31, "纵");

  for (const z of [-39, -19, 1, 21, 41]) {
    addMapLight(0, 3.25, z, z % 40 === 1 ? 0xe39850 : 0x70aeda, 4.8, 14);
  }
  addMapLight(-32, 3, -4, 0x6ba6cb, 4, 12);
  addMapLight(32, 3, 18, 0xd18a4a, 4, 12);
  addCommonSpawns(false);
}

// -----------------------------------------------------------------------
// 新版无尽地图三：非对称坍塌钢铁厂
// -----------------------------------------------------------------------
function buildEndlessMapThree() {
  currentMapName = "坍塌钢铁厂";
  scene.background.set(0x211713);
  scene.fog.color.set(0x211713);
  scene.fog.near = 27;
  scene.fog.far = 120;
  sun.color.set(0xffb77f);
  sun.intensity = 1.85;
  hemisphere.intensity = 1.06;

  addFloor();
  addBoundary();
  setPlayerStart(-45, 43, -Math.PI * 0.25, 0);

  // 西北角由三座大型熔炉组成，不存在传统中央大厅。
  addFurnaceStack(-31, -29, 0xff6238);
  addFurnaceStack(-16, -30, 0xff8b42);
  addFurnaceStack(-28, -12, 0xff5a34);
  addBox(-23.5, 1.25, -29, 11, 2.5, 1.1, metalMaterial);
  addBox(-29.5, 1.1, -20.5, 1.1, 2.2, 11.5, metalMaterial);

  // 三座大小、朝向和开口均不同的厂房分散在地图边缘。
  addRoom(27, -31, 36, 18, {
    doors: ["西", "北", "南"], roof: true, height: 4.2, lightColor: 0xff9550, doorWidth: 3.4
  });
  addRoom(-32, 30, 24, 20, {
    doors: ["东", "南"], roof: false, height: 4, doorWidth: 3.4
  });
  addRoom(30, 20, 26, 24, {
    doors: ["西", "北", "南"], roof: false, height: 4.3, doorWidth: 3.4
  });
  addRoom(-8, 37, 18, 13, {
    doors: ["北", "西"], roof: true, height: 3.7, lightColor: 0x779db3, doorWidth: 3.1
  });

  // 锯齿状残墙斜穿中央，构成连续转角但保留多处宽阔缺口。
  addBrokenWall(-12, -8, 13, "横");
  addBrokenWall(-4, -1, 13, "纵");
  addBrokenWall(7, 5, 15, "横");
  addBrokenWall(15, 13, 15, "纵");
  addBrokenWall(-19, 18, 12, "横");
  addRubbleCover(-7, -16, "纵");
  addRubbleCover(10, -11, "横");
  addRubbleCover(1, 19, "纵");

  // 两座浇铸坑与不规则 L 形高架构成地图的高低差路线。
  addSunkenWorkBay(0, 28, 13, 9);
  addSunkenWorkBay(12, -14, 11, 8);
  addCatwalkSegment(-9, -19, 25, "横", 3.4);
  addCatwalkSegment(4, -10, 20, "纵", 3.4);
  addPlatform(4, -19, 5, 5, 3.4);
  addLadder(-21.8, -17.4, 3.4, 0, -1, "横");
  addLadder(6.85, 0, 3.4, -1, 0, "纵");

  addLoadingDock(25, 39, 12, 7, "北");
  addLoadingDock(-42, 4, 9, 7, "东");
  addDoorFrame(-8, 22, "横", 3.6, 2.65);
  addDoorFrame(18, -8, "纵", 3.6, 2.65);

  for (const point of [
    [-46, -38], [-42, -4], [-38, 12], [-17, 44],
    [9, 44], [45, 42], [45, -5], [43, -44],
    [9, -38], [23, -9], [-11, 9], [28, 5]
  ]) {
    addCrate(point[0], point[1], 2.3, 2, 2.3);
  }

  addMapLight(-23, 3.2, -22, 0xff6337, 6.5, 18);
  addMapLight(5, 3, -4, 0xe18449, 4.5, 13);
  addMapLight(-8, 3, 29, 0x769eaf, 4.2, 13);
  addMapLight(31, 3.1, 12, 0xffa45a, 4.8, 14);
  addCommonSpawns(false);
}

// -----------------------------------------------------------------------
// 新版无尽地图四：并列双环冷却大厅
// -----------------------------------------------------------------------
function buildEndlessMapFour() {
  currentMapName = "双环冷却厂";
  scene.background.set(0x13242a);
  scene.fog.color.set(0x13242a);
  scene.fog.near = 29;
  scene.fog.far = 124;
  sun.color.set(0xc7eef2);
  sun.intensity = 1.86;
  hemisphere.intensity = 1.12;

  addFloor();
  addBoundary();
  setPlayerStart(0, 47, Math.PI, 0);

  // 两座大厅通过四向门洞形成各自的闭合环路，中央短廊负责横向交叉。
  addRoom(-27, 0, 40, 40, {
    doors: ["北", "南", "东", "西"], roof: false, height: 4.25, doorWidth: 4
  });
  addRoom(27, 0, 40, 40, {
    doors: ["北", "南", "东", "西"], roof: false, height: 4.25, doorWidth: 4
  });
  addTunnel(0, 0, 14, 5.4, "横", 0x68c3d2);

  // 大型冷却池占据大厅中心，池边四周均可通行，构成双环拓扑的核心。
  addSunkenWorkBay(-27, 0, 15, 19);
  addSunkenWorkBay(27, 0, 15, 19);
  for (const x of [-27, 27]) {
    addBox(x - 9.5, 1.5, -12.5, 0.7, 3, 0.7, wallMaterial);
    addBox(x + 9.5, 1.5, 12.5, 0.7, 3, 0.7, wallMaterial);
    addRubbleCover(x - 11, 8.5, "纵");
    addRubbleCover(x + 11, -8.5, "纵");
  }

  // 南北两条室外绕行带把两环再次连通，角部控制室提供近距离交战空间。
  addRoom(-31, -37, 20, 12, {
    doors: ["南", "东"], roof: true, height: 3.8, lightColor: 0x67aeca, doorWidth: 3.2
  });
  addRoom(31, 37, 20, 12, {
    doors: ["北", "西"], roof: true, height: 3.8, lightColor: 0xd09356, doorWidth: 3.2
  });
  addRoom(31, -37, 16, 12, {
    doors: ["南", "西"], roof: false, height: 3.7, doorWidth: 3.1
  });
  addRoom(-31, 37, 16, 12, {
    doors: ["北", "东"], roof: false, height: 3.7, doorWidth: 3.1
  });
  addBrokenWall(0, -27, 18, "横");
  addBrokenWall(0, 27, 18, "横");
  addDoorFrame(0, -20, "横", 4.2, 2.7);
  addDoorFrame(0, 20, "横", 4.2, 2.7);

  // 每个冷却池上方都有一条独立高架，梯子只把玩家送到二层优势位。
  addCatwalkSegment(-27, 0, 29, "纵", 3.35);
  addCatwalkSegment(27, 0, 29, "纵", 3.35);
  addLadder(-24.15, -12, 3.35, -1, 0, "纵");
  addLadder(29.85, 12, 3.35, -1, 0, "纵");

  addLoadingDock(-45, 28, 8, 6, "东");
  addLoadingDock(45, -28, 8, 6, "西");
  for (const point of [
    [-46, -45], [-14, -44], [14, -44], [46, -13],
    [-46, 14], [-14, 45], [14, 45], [46, 45],
    [-16, -14], [-16, 14], [16, -14], [16, 14]
  ]) {
    addCrate(point[0], point[1], 2.2, 2, 2.2);
  }

  addMapLight(-27, 3.2, 0, 0x61cbe0, 5.6, 17);
  addMapLight(27, 3.2, 0, 0x69d0bd, 5.6, 17);
  addMapLight(0, 3.1, 0, 0xe6a45f, 4.8, 14);
  addMapLight(-12, 3.1, -27, 0x6ab4cd, 4.2, 13);
  addMapLight(12, 3.1, 27, 0xd29b5c, 4.2, 13);
  addCommonSpawns(false);
}

// -----------------------------------------------------------------------
// 新版无尽地图五：交替开口的蛇形后勤堡垒
// -----------------------------------------------------------------------
function buildEndlessMapFive() {
  currentMapName = "蛇形后勤堡垒";
  scene.background.set(0x1b221d);
  scene.fog.color.set(0x1b221d);
  scene.fog.near = 28;
  scene.fog.far = 120;
  sun.color.set(0xe4dfbd);
  sun.intensity = 1.82;
  hemisphere.intensity = 1.1;

  addFloor();
  addBoundary();
  setPlayerStart(0, 47, Math.PI, 0);

  // 五道长墙交替在东、西两端留出十米宽缺口，形成连续的 S 形主路线。
  for (let row = 0; row < 5; row++) {
    const z = -32 + row * 16;
    const openEast = row % 2 === 0;
    addBox(
      openEast ? -3 : 3,
      1.72,
      z,
      90,
      3.44,
      0.62,
      row % 2 === 0 ? wallMaterial : bunkerMaterial
    );
    addDoorFrame(openEast ? 46 : -46, z, "横", 5.2, 2.7);
  }

  // 每条折返巷道都嵌入不同朝向的小房间，房门不封堵两端主缺口。
  addRoom(-35, -24, 17, 10, {
    doors: ["东", "西"], roof: true, height: 3.7, lightColor: 0x729e78, doorWidth: 3.1
  });
  addRoom(35, -8, 17, 10, {
    doors: ["东", "西"], roof: false, height: 3.8, doorWidth: 3.1
  });
  addRoom(-35, 8, 17, 10, {
    doors: ["东", "西"], roof: false, height: 3.8, doorWidth: 3.1
  });
  addRoom(35, 24, 17, 10, {
    doors: ["东", "西"], roof: true, height: 3.7, lightColor: 0xc08855, doorWidth: 3.1
  });

  // 中央二层纵向捷径跨过两道长墙，让玩家可以选择高风险的快速穿越路线。
  addCatwalkSegment(0, 8, 38, "纵", 3.82);
  addPlatform(0, -11, 5, 5, 3.82);
  addPlatform(0, 27, 5, 5, 3.82);
  addLadder(-2.85, -11, 3.82, 1, 0, "纵");
  addLadder(2.85, 27, 3.82, -1, 0, "纵");

  addSunkenWorkBay(19, 40, 12, 8);
  addLoadingDock(-20, -41, 10, 6, "南");
  addRubbleCover(31, -40, "横");
  addRubbleCover(-30, 40, "横");
  addRubbleCover(20, -23, "纵");
  addRubbleCover(-20, 23, "纵");
  addBrokenWall(-18, -8, 11, "纵");
  addBrokenWall(18, 8, 11, "纵");

  for (const point of [
    [-44, -44], [10, -42], [43, -26], [-11, -24],
    [-43, -9], [12, -8], [43, 8], [-12, 8],
    [-43, 25], [12, 24], [43, 42], [-11, 42]
  ]) {
    addCrate(point[0], point[1], 2.15, 1.95, 2.15);
  }

  for (const light of [
    [-28, 3, -40, 0x75ad80], [28, 3, -24, 0xd39a59],
    [-28, 3, -8, 0x75ad80], [28, 3, 8, 0xd39a59],
    [-28, 3, 24, 0x75ad80], [28, 3, 40, 0xd39a59]
  ]) {
    addMapLight(light[0], light[1], light[2], light[3], 4.6, 14);
  }
  addCommonSpawns(false);
}

function buildLevelOne() {
  // 原关卡模式使用的基础线路正式命名，今后作为十图池中的独立拓扑。
  currentMapName = "十字机修仓";
  scene.background.set(0x182129);
  scene.fog.color.set(0x182129);
  scene.fog.near = 27;
  scene.fog.far = 104;
  sun.color.set(0xffe3bf);
  sun.intensity = 1.72;
  hemisphere.intensity = 0.82;

  addFloor();
  addBoundary();
  setPlayerStart(0, 31, Math.PI, 0);

  addRoom(-6, 1, 22, 18, {
    doors: ["北", "南", "东", "西"],
    roof: false,
    height: 4
  });
  addRoom(-25, -22, 14, 13, {
    doors: ["南", "东"],
    roof: true,
    lightColor: 0xf0a153
  });
  addRoom(22, -23, 16, 12, {
    doors: ["南", "西"],
    roof: true,
    lightColor: 0x739aca
  });
  addRoom(-25, 22, 14, 13, {
    doors: ["北", "东"],
    roof: false
  });
  addRoom(25, 16, 13, 16, {
    doors: ["北", "西"],
    roof: true,
    lightColor: 0xf0a153
  });

  addBentCorridor([[-18, -22], [-13, -22], [-13, -8], [-6, -8]], 4.2, 0xd98745);
  addBentCorridor([[14, -23], [10, -23], [10, -8], [-1, -8]], 4.2, 0x5f86b7);
  addBentCorridor([[-18, 22], [-15, 22], [-15, 10], [-6, 10]], 4.2, 0x5f86b7);
  addBentCorridor([[18.5, 16], [12, 16], [12, 4], [5, 4]], 4.2, 0xd98745);

  addDoorFrame(-6, -8, "横", 2.7, 2.55);
  addDoorFrame(-6, 10, "横", 2.7, 2.55);
  addDoorFrame(-17, 1, "纵", 2.7, 2.55);
  addDoorFrame(5, 1, "纵", 2.7, 2.55);

  addCatwalkSegment(-6, 2, 17, "横", 3.25);
  addLadder(-12.2, 3.75, 3.25, 0, -1, "横");

  addLoadingDock(-25, 12, 8, 5, "东");
  addLoadingDock(21, -11, 7, 5, "南");
  addSunkenWorkBay(11, 24, 11, 8);
  addBrokenWall(-20, 3, 10, "纵");
  addRubbleCover(8, 10, "横");

  for (const point of [
    [-29, -7], [-22, 5], [-4, -14], [5, -16],
    [20, 4], [29, -6], [2, 24], [-11, 27]
  ]) {
    addCrate(point[0], point[1]);
  }

  addMapLight(-6, 3.1, 1, 0xf0b362, 5, 16);
  addMapLight(13, 2.6, 9, 0x678db8, 3.2, 10);
  addCommonSpawns();
}

function buildLevelTwo() {
  currentMapName = "第二关：物流仓库群";
  scene.background.set(0x1d201c);
  scene.fog.color.set(0x1d201c);
  scene.fog.near = 20;
  scene.fog.far = 88;
  sun.color.set(0xffc986);
  sun.intensity = 1.3;
  hemisphere.intensity = 0.64;

  addFloor();
  addBoundary();
  setPlayerStart(-30, 30, -Math.PI * 0.75, 0);

  addRoom(-23, -23, 16, 14, {
    doors: ["南", "东"],
    roof: true,
    lightColor: 0xff9847
  });
  addRoom(0, -23, 16, 14, {
    doors: ["南", "东", "西"],
    roof: true,
    lightColor: 0x7597ba
  });
  addRoom(23, -23, 16, 14, {
    doors: ["南", "西"],
    roof: true,
    lightColor: 0xff9847
  });
  addRoom(-23, 22, 16, 15, {
    doors: ["北", "东"],
    roof: false
  });
  addRoom(23, 22, 16, 15, {
    doors: ["北", "西"],
    roof: false
  });
  addRoom(0, 7, 18, 15, {
    doors: ["北", "南", "东", "西"],
    roof: false,
    height: 4
  });

  addBentCorridor([[-15, -23], [-12, -23], [-12, -0.5], [-9, -0.5]], 3.9, 0xe08b43);
  addBentCorridor([[8, -23], [12, -23], [12, -0.5], [9, -0.5]], 3.9, 0x5a80aa);
  addBentCorridor([[-15, 22], [-12, 22], [-12, 14.5], [-9, 14.5]], 3.9, 0x5a80aa);
  addBentCorridor([[15, 22], [12, 22], [12, 14.5], [9, 14.5]], 3.9, 0xe08b43);
  addTunnel(-3.5, -23, 7, 3.7, "横", 0xb67642);

  // 货架与箱堆形成曲折的一层回廊，但预留足够门洞宽度。
  for (const z of [-12, -4, 17, 29]) {
    for (const x of [-25, -17, 17, 25]) {
      if (!collidesAt(x, z, 1.2, 0, 2)) {
        addCrate(x, z, 2.7, z % 2 === 0 ? 2.8 : 2.3, 2.7);
      }
    }
  }

  addBrokenWall(-3, -10, 12, "横");
  addBrokenWall(3, 25, 12, "横");
  addRubbleCover(-4, 18, "纵");
  addRubbleCover(18, 5, "纵");

  addLoadingDock(-24, 7, 8, 6, "南");
  addLoadingDock(24, -7, 8, 6, "北");
  addSunkenWorkBay(0, 27, 12, 8);

  addCatwalkSegment(0, 7, 15, "横", 3.4);
  addLadder(-5.8, 8.75, 3.4, 0, -1, "横");

  addMapLight(0, 3.1, 7, 0xf0ad58, 5, 16);
  addMapLight(-12, 2.6, 7, 0x6488ad, 3, 9);
  addMapLight(12, 2.6, 7, 0x6488ad, 3, 9);
  addCommonSpawns();
}

function buildLevelThree() {
  currentMapName = "第三关：地下动力区";
  scene.background.set(0x080d12);
  scene.fog.color.set(0x080d12);
  scene.fog.near = 11;
  scene.fog.far = 68;
  sun.color.set(0x7892ab);
  sun.intensity = 0.42;
  hemisphere.intensity = 0.34;

  addFloor();
  addBoundary();
  setPlayerStart(0, 31, Math.PI, 0);

  addRoom(-25, -24, 14, 12, {
    doors: ["南", "东"],
    roof: true,
    lightColor: 0xff7135
  });
  addRoom(0, -24, 16, 12, {
    doors: ["南", "东", "西"],
    roof: true,
    lightColor: 0x527eb4
  });
  addRoom(25, -22, 14, 14, {
    doors: ["南", "西"],
    roof: true,
    lightColor: 0xff7135
  });
  addRoom(-23, 21, 16, 14, {
    doors: ["北", "东"],
    roof: true,
    lightColor: 0x527eb4
  });
  addRoom(23, 21, 16, 14, {
    doors: ["北", "西"],
    roof: true,
    lightColor: 0xff7135
  });
  addRoom(0, 2, 16, 16, {
    doors: ["北", "南", "东", "西"],
    roof: false,
    height: 4
  });

  addBentCorridor([[-18, -24], [-14, -24], [-14, -6], [-8, -6]], 4, 0xe07638);
  addBentCorridor([[8, -24], [14, -24], [14, -6], [8, -6]], 4, 0x4874a6);
  addBentCorridor([[-15, 21], [-13, 21], [-13, 10], [-8, 10]], 4, 0x4874a6);
  addBentCorridor([[15, 21], [13, 21], [13, 10], [8, 10]], 4, 0xe07638);
  addTunnel(-12.5, -24, 9, 3.8, "横", 0x9e6136);

  addDoorFrame(0, -6, "横", 2.7, 2.55);
  addDoorFrame(0, 10, "横", 2.7, 2.55);
  addDoorFrame(-8, 2, "纵", 2.7, 2.55);
  addDoorFrame(8, 2, "纵", 2.7, 2.55);

  addSunkenWorkBay(0, 2, 11, 10);
  addLoadingDock(-25, 7, 7, 5, "东");
  addBrokenWall(-25, -5, 11, "纵");
  addBrokenWall(25, 5, 11, "纵");
  addRubbleCover(-4, 17, "横");
  addRubbleCover(21, -9, "纵");

  addCatwalkSegment(0, 2, 13, "横", 3.35);
  addPlatform(6, 7, 5, 5, 3.35);
  addLadder(-5.25, 3.75, 3.35, 0, -1, "横");
  addLadder(8.85, 7, 3.35, -1, 0, "纵");

  for (const point of [
    [-30, 8], [-20, 2], [-7, 27], [8, 27],
    [29, 8], [22, -9], [-9, -14], [5, -15]
  ]) {
    addCrate(point[0], point[1]);
  }

  addMapLight(0, 3, 2, 0x9b64df, 4.6, 14);
  addMapLight(-18, 2.5, 0, 0x4d78a8, 3, 9);
  addMapLight(18, 2.5, 0, 0xd06f38, 3, 9);
  addCommonSpawns();
}

function buildLevelFour() {
  currentMapName = "第四关：高架铸造车间";
  scene.background.set(0x121820);
  scene.fog.color.set(0x121820);
  scene.fog.near = 20;
  scene.fog.far = 90;
  sun.color.set(0xbccfe0);
  sun.intensity = 1.06;
  hemisphere.intensity = 0.58;

  addFloor();
  addBoundary();
  setPlayerStart(-30, 30, -Math.PI * 0.75, 0);

  addRoom(-24, -23, 15, 13, {
    doors: ["南", "东"],
    roof: true,
    lightColor: 0xe58c43
  });
  addRoom(24, -23, 15, 13, {
    doors: ["南", "西"],
    roof: true,
    lightColor: 0x5a82b2
  });
  addRoom(-24, 23, 15, 13, {
    doors: ["北", "东"],
    roof: true,
    lightColor: 0x5a82b2
  });
  addRoom(24, 23, 15, 13, {
    doors: ["北", "西"],
    roof: true,
    lightColor: 0xe58c43
  });
  addRoom(0, 0, 22, 20, {
    doors: ["北", "南", "东", "西"],
    roof: false,
    height: 4.2
  });

  addBentCorridor([[-16.5, -23], [-13, -23], [-13, -10], [0, -10]], 4, 0xd77c3c);
  addBentCorridor([[16.5, -23], [13, -23], [13, -10], [0, -10]], 4, 0x527aa8);
  addBentCorridor([[-16.5, 23], [-13, 23], [-13, 10], [0, 10]], 4, 0x527aa8);
  addBentCorridor([[16.5, 23], [13, 23], [13, 10], [0, 10]], 4, 0xd77c3c);

  // 十字形二层回廊，所有支柱、桥板均参与碰撞和子弹射线。
  addCatwalkSegment(0, -3.5, 18, "横", 3.55);
  addCatwalkSegment(4.5, 4, 15, "纵", 3.55);
  addPlatform(4.5, -3.5, 5, 5, 3.55);
  addPlatform(4.5, 11.5, 5, 5, 3.55);
  addLadder(-7.6, -1.75, 3.55, 0, -1, "横");
  addLadder(7.35, 11.5, 3.55, -1, 0, "纵");

  addLoadingDock(-22, 7, 8, 6, "东");
  addLoadingDock(22, -7, 8, 6, "西");
  addSunkenWorkBay(-7, 18, 11, 8);
  addSunkenWorkBay(16, 4, 9, 8);

  addBrokenWall(-26, 0, 12, "纵");
  addBrokenWall(26, 0, 12, "纵");
  addRubbleCover(-6, -17, "横");
  addRubbleCover(18, 14, "纵");

  for (const point of [
    [-30, -8], [-20, 3], [-10, 27], [10, 27],
    [29, -8], [20, 2], [-7, -27], [8, -27]
  ]) {
    addCrate(point[0], point[1]);
  }

  addMapLight(0, 3.3, 0, 0xe8a653, 5.5, 18);
  addMapLight(-16, 2.6, 0, 0x5e84af, 3.2, 10);
  addMapLight(17, 2.6, 0, 0xd17b40, 3.2, 10);
  addCommonSpawns();
}

function buildLevelFive() {
  currentMapName = "第五关：坍塌核心工厂";
  scene.background.set(0x150b0c);
  scene.fog.color.set(0x150b0c);
  scene.fog.near = 15;
  scene.fog.far = 78;
  sun.color.set(0xff9570);
  sun.intensity = 0.88;
  hemisphere.intensity = 0.46;

  addFloor();
  addBoundary();
  setPlayerStart(0, 32, Math.PI, 0);

  addRoom(0, 0, 20, 18, {
    doors: ["北", "南", "东", "西"],
    roof: false,
    height: 4.2
  });
  addRoom(-25, -24, 14, 12, {
    doors: ["南", "东"],
    roof: true,
    lightColor: 0xff5738
  });
  addRoom(25, -24, 14, 12, {
    doors: ["南", "西"],
    roof: true,
    lightColor: 0xff5738
  });
  addRoom(-25, 23, 14, 12, {
    doors: ["北", "东"],
    roof: true,
    lightColor: 0x7657d4
  });
  addRoom(25, 23, 14, 12, {
    doors: ["北", "西"],
    roof: true,
    lightColor: 0x7657d4
  });
  addRoom(-27, 1, 10, 14, {
    doors: ["东", "南"],
    roof: false
  });
  addRoom(27, 1, 10, 14, {
    doors: ["西", "北"],
    roof: false
  });

  addBentCorridor([[-18, -24], [-13, -24], [-13, -9], [0, -9]], 4, 0xe15e38);
  addBentCorridor([[18, -24], [13, -24], [13, -9], [0, -9]], 4, 0xe15e38);
  addBentCorridor([[-18, 23], [-13, 23], [-13, 9], [0, 9]], 4, 0x6c51bd);
  addBentCorridor([[18, 23], [13, 23], [13, 9], [0, 9]], 4, 0x6c51bd);
  addBentCorridor([[-22, 1], [-16, 1], [-16, 0], [-10, 0]], 3.8, 0xba5335);
  addBentCorridor([[22, 1], [16, 1], [16, 0], [10, 0]], 3.8, 0x664aae);

  addDoorFrame(0, -9, "横", 2.7, 2.55);
  addDoorFrame(0, 9, "横", 2.7, 2.55);
  addDoorFrame(-10, 0, "纵", 2.7, 2.55);
  addDoorFrame(10, 0, "纵", 2.7, 2.55);

  // 低高度双层核心平台，使用两部梯子从不同方向进入。
  addCatwalkSegment(0, -2.5, 16, "横", 3.5);
  addCatwalkSegment(5.5, 4, 13, "纵", 3.5);
  addPlatform(5.5, -2.5, 5, 5, 3.5);
  addLadder(-6.7, -0.75, 3.5, 0, -1, "横");
  addLadder(8.35, 8.5, 3.5, -1, 0, "纵");

  addLoadingDock(-24, 12, 8, 6, "东");
  addLoadingDock(24, -10, 8, 6, "西");
  addSunkenWorkBay(0, 18, 12, 9);
  addSunkenWorkBay(-16, -3, 9, 8);

  addBrokenWall(-22, -7, 12, "横");
  addBrokenWall(22, 9, 12, "横");
  addBrokenWall(0, 27, 13, "横");
  addRubbleCover(-5, -15, "横");
  addRubbleCover(18, -2, "纵");
  addRubbleCover(-19, 14, "纵");

  for (const point of [
    [-30, -10], [-28, 10], [-16, 29], [16, 29],
    [29, -10], [28, 11], [-8, -29], [8, -29],
    [-5, 5], [5, -5]
  ]) {
    addCrate(point[0], point[1]);
  }

  addMapLight(0, 3.15, 0, 0xff5c3b, 6, 18);
  addMapLight(-17, 2.6, 0, 0x7256c2, 3.5, 10);
  addMapLight(17, 2.6, 0, 0xd45537, 3.5, 10);
  addCommonSpawns();
}

// -----------------------------------------------------------------------
// 新拓扑七：交替缺口形成多次折返的锯齿管线站
// -----------------------------------------------------------------------
function buildZigzagPipelineMap() {
  currentMapName = "锯齿管线站";
  scene.background.set(0x142027);
  scene.fog.color.set(0x142027);
  scene.fog.near = 28;
  scene.fog.far = 122;
  sun.color.set(0xd4edf2);
  sun.intensity = 1.84;
  hemisphere.intensity = 1.1;

  addFloor();
  addBoundary();
  setPlayerStart(-45, 46, -Math.PI * 0.75, 0);

  // 四道管线隔墙的缺口不断左右换位，构成锯齿形主路线；每个缺口
  // 都保留十米宽度，敌人导航与玩家奔跑不会被转角卡住。
  function addBarrierWithGap(z, gapX) {
    const halfGap = 5;
    const leftWidth = gapX - halfGap + 48;
    const rightWidth = 48 - gapX - halfGap;
    if (leftWidth > 0.5) {
      addBox(-48 + leftWidth / 2, 1.72, z, leftWidth, 3.44, 0.62, bunkerMaterial);
    }
    if (rightWidth > 0.5) {
      addBox(gapX + halfGap + rightWidth / 2, 1.72, z, rightWidth, 3.44, 0.62, wallMaterial);
    }
    addDoorFrame(gapX, z, "横", 5.2, 2.7);
  }

  addBarrierWithGap(-32, -30);
  addBarrierWithGap(-12, 28);
  addBarrierWithGap(8, -16);
  addBarrierWithGap(28, 31);

  addRoom(-38, -41, 17, 10, {
    doors: ["南", "东"], roof: true, height: 3.7,
    lightColor: 0x67a8c5, doorWidth: 3.2
  });
  addRoom(38, -22, 17, 13, {
    doors: ["北", "西"], roof: false, height: 3.8, doorWidth: 3.2
  });
  addRoom(-36, -2, 20, 13, {
    doors: ["南", "东"], roof: true, height: 3.8,
    lightColor: 0xd28a4d, doorWidth: 3.2
  });
  addRoom(37, 18, 18, 13, {
    doors: ["北", "西"], roof: true, height: 3.8,
    lightColor: 0x6b9eb8, doorWidth: 3.2
  });
  addRoom(-36, 39, 20, 12, {
    doors: ["北", "东"], roof: false, height: 3.7, doorWidth: 3.2
  });

  // L 形二层检修线跨过中部两条折返巷道，设置两部独立梯子。
  addCatwalkSegment(0, -2, 31, "横", 3.5);
  addCatwalkSegment(15.5, 7, 18, "纵", 3.5);
  addPlatform(15.5, -2, 5, 5, 3.5);
  addLadder(-15.7, -0.25, 3.5, 0, -1, "横");
  addLadder(18.35, 15.5, 3.5, -1, 0, "纵");

  addSunkenWorkBay(8, 39, 12, 8);
  addLoadingDock(-40, 18, 9, 6, "东");
  addBrokenWall(10, -41, 14, "横");
  addRubbleCover(-20, -22, "纵");
  addRubbleCover(21, 18, "横");

  for (const point of [
    [-45, -24], [-18, -41], [19, -40], [44, -3],
    [-44, 17], [-8, 18], [8, 40], [44, 41],
    [11, -21], [-25, -2], [24, 39]
  ]) {
    addCrate(point[0], point[1], 2.2, 2, 2.2);
  }

  for (const light of [
    [-28, 3, -42, 0x68a9c7], [28, 3, -22, 0xd18b4e],
    [-28, 3, -2, 0x68a9c7], [28, 3, 18, 0xd18b4e],
    [-24, 3, 40, 0x68a9c7]
  ]) {
    addMapLight(light[0], light[1], light[2], light[3], 4.6, 14);
  }
  addCommonSpawns(false);
}

// -----------------------------------------------------------------------
// 新拓扑八：中央枢纽向三座铸造翼延伸的三叉路线
// -----------------------------------------------------------------------
function buildTridentFoundryMap() {
  currentMapName = "三叉铸造枢纽";
  scene.background.set(0x211913);
  scene.fog.color.set(0x211913);
  scene.fog.near = 27;
  scene.fog.far = 121;
  sun.color.set(0xffcf9b);
  sun.intensity = 1.86;
  hemisphere.intensity = 1.08;

  addFloor();
  addBoundary();
  setPlayerStart(0, 47, Math.PI, 0);

  addRoom(0, 3, 24, 22, {
    doors: ["北", "南", "东", "西"], roof: false,
    height: 4.3, doorWidth: 4
  });
  addRoom(0, -39, 28, 16, {
    doors: ["南", "东", "西"], roof: true, height: 4,
    lightColor: 0xff9047, doorWidth: 3.5
  });
  addRoom(-38, 27, 20, 22, {
    doors: ["北", "东"], roof: true, height: 4,
    lightColor: 0x6f9fb8, doorWidth: 3.5
  });
  addRoom(38, 27, 20, 22, {
    doors: ["北", "西"], roof: true, height: 4,
    lightColor: 0xd48848, doorWidth: 3.5
  });

  // 北、 southwest、southeast 三条生产翼汇入中央大厅；南侧保留
  // 开阔装卸场，形成三叉而非十字对称布局。
  addTunnel(0, -20.5, 21, 5.2, "纵", 0xe08e48);
  addBentCorridor([[-12, 3], [-20, 3], [-20, 27], [-28, 27]], 5, 0x6797b4);
  addBentCorridor([[12, 3], [20, 3], [20, 27], [28, 27]], 5, 0xd58b4c);
  addDoorFrame(0, -10, "横", 4.2, 2.7);
  addDoorFrame(-12, 3, "纵", 4.2, 2.7);
  addDoorFrame(12, 3, "纵", 4.2, 2.7);

  addFurnaceStack(-7, -38, 0xff693b);
  addFurnaceStack(8, -38, 0xff9b48);
  addSunkenWorkBay(0, 3, 13, 10);
  addLoadingDock(-18, 42, 11, 7, "北");
  addLoadingDock(19, 42, 11, 7, "北");

  // 二层观察线从中央延伸向两个侧翼，两个端点均有梯子。
  addCatwalkSegment(0, 1, 31, "横", 3.55);
  addCatwalkSegment(-15.5, 12, 22, "纵", 3.55);
  addPlatform(-15.5, 1, 5, 5, 3.55);
  addLadder(15.7, 2.75, 3.55, 0, -1, "横");
  addLadder(-18.35, 22, 3.55, 1, 0, "纵");

  addBrokenWall(-31, -11, 14, "纵");
  addBrokenWall(31, -11, 14, "纵");
  addRubbleCover(-23, 11, "横");
  addRubbleCover(24, 12, "横");
  for (const point of [
    [-44, -43], [-25, -42], [25, -43], [44, -23],
    [-44, 6], [44, 5], [-13, 34], [13, 34],
    [-29, 44], [30, 44], [-5, 19], [7, 20]
  ]) {
    addCrate(point[0], point[1], 2.25, 2, 2.25);
  }

  addMapLight(0, 3.3, 3, 0xffa052, 6.2, 18);
  addMapLight(0, 3.1, -25, 0xff7540, 5, 15);
  addMapLight(-28, 3.1, 25, 0x6e9eb9, 4.6, 14);
  addMapLight(28, 3.1, 25, 0xd58a4b, 4.6, 14);
  addCommonSpawns(false);
}

// -----------------------------------------------------------------------
// 新拓扑九：外环、内环与中央能源井组成同心回字路线
// -----------------------------------------------------------------------
function buildConcentricEnergyMap() {
  currentMapName = "回字能源堡";
  scene.background.set(0x111d22);
  scene.fog.color.set(0x111d22);
  scene.fog.near = 29;
  scene.fog.far = 124;
  sun.color.set(0xbfe8ee);
  sun.intensity = 1.84;
  hemisphere.intensity = 1.12;

  addFloor();
  addBoundary();
  setPlayerStart(0, 47, Math.PI, 0);

  // 两个四向开门的完整方环形成三层同心路线：外围、环间以及内核。
  addRoom(0, 0, 76, 76, {
    doors: ["北", "南", "东", "西"], roof: false,
    height: 4.25, doorWidth: 5
  });
  addRoom(0, 0, 38, 38, {
    doors: ["北", "南", "东", "西"], roof: false,
    height: 4.1, doorWidth: 4.2
  });

  for (const room of [
    [-28, -28, ["南", "东"]], [28, -28, ["南", "西"]],
    [-28, 28, ["北", "东"]], [28, 28, ["北", "西"]]
  ]) {
    addRoom(room[0], room[1], 13, 12, {
      doors: room[2], roof: true, height: 3.7,
      lightColor: room[0] < 0 ? 0x61a7c2 : 0xd48f4e,
      doorWidth: 3
    });
  }

  addSunkenWorkBay(0, 0, 14, 14);
  addDoorFrame(0, -38, "横", 5.2, 2.75);
  addDoorFrame(0, 38, "横", 5.2, 2.75);
  addDoorFrame(-38, 0, "纵", 5.2, 2.75);
  addDoorFrame(38, 0, "纵", 5.2, 2.75);

  // 内环上方的 U 形检修回廊提供多方向射击角度。
  addCatwalkSegment(0, -18.5, 31, "横", 3.45);
  addCatwalkSegment(-15.5, -4, 29, "纵", 3.45);
  addCatwalkSegment(15.5, -4, 29, "纵", 3.45);
  addPlatform(-15.5, -18.5, 5, 5, 3.45);
  addPlatform(15.5, -18.5, 5, 5, 3.45);
  addLadder(-18.35, 9, 3.45, 1, 0, "纵");
  addLadder(18.35, 9, 3.45, -1, 0, "纵");

  addLoadingDock(-44, -22, 8, 7, "东");
  addLoadingDock(44, 22, 8, 7, "西");
  addBrokenWall(-18, 43, 14, "横");
  addBrokenWall(18, -43, 14, "横");
  addRubbleCover(-9, 27, "纵");
  addRubbleCover(10, -27, "纵");
  for (const point of [
    [-46, -45], [0, -45], [46, -45], [-45, 16],
    [45, -16], [-46, 45], [0, 45], [46, 45],
    [-9, -9], [9, -9], [-9, 9], [9, 9]
  ]) {
    addCrate(point[0], point[1], 2.15, 1.95, 2.15);
  }

  addMapLight(0, 3.2, 0, 0x61d3e0, 6, 18);
  addMapLight(-28, 3, 0, 0x68a8c1, 4.6, 14);
  addMapLight(28, 3, 0, 0xd79751, 4.6, 14);
  addMapLight(0, 3, -28, 0x68a8c1, 4.6, 14);
  addMapLight(0, 3, 28, 0xd79751, 4.6, 14);
  addCommonSpawns(false);
}

// -----------------------------------------------------------------------
// 新拓扑十：八座仓房围绕中央路口形成九宫格街巷
// -----------------------------------------------------------------------
function buildGridWarehouseMap() {
  currentMapName = "九宫仓储区";
  scene.background.set(0x1d211c);
  scene.fog.color.set(0x1d211c);
  scene.fog.near = 28;
  scene.fog.far = 122;
  sun.color.set(0xe9dfb8);
  sun.intensity = 1.83;
  hemisphere.intensity = 1.1;

  addFloor();
  addBoundary();
  setPlayerStart(0, 47, Math.PI, 0);

  // 八座独立仓房占据九宫格外围单元，中央单元保持开阔。横纵街道
  // 宽度均超过十二米，形成棋盘式多路线交叉战场。
  const warehouseCells = [
    [-30, -30], [0, -30], [30, -30],
    [-30, 0], [30, 0],
    [-30, 30], [0, 30], [30, 30]
  ];
  for (let index = 0; index < warehouseCells.length; index++) {
    const cell = warehouseCells[index];
    addRoom(cell[0], cell[1], 16, 16, {
      doors: ["北", "南", "东", "西"],
      roof: index % 3 !== 1,
      height: 3.8 + (index % 2) * 0.2,
      lightColor: index % 2 === 0 ? 0x6d9eaf : 0xd49652,
      doorWidth: 3.2
    });
  }

  addSunkenWorkBay(0, 0, 12, 12);
  addLoadingDock(-15, -15, 9, 6, "南");
  addLoadingDock(15, 15, 9, 6, "北");
  addBrokenWall(0, -19, 12, "横");
  addBrokenWall(0, 19, 12, "横");
  addRubbleCover(-17, 0, "纵");
  addRubbleCover(17, 0, "纵");

  // 中央十字天桥俯瞰四条主街，两端梯子提供相反方向的登高入口。
  addCatwalkSegment(0, -2.5, 28, "横", 3.5);
  addCatwalkSegment(5, 7, 19, "纵", 3.5);
  addPlatform(5, -2.5, 5, 5, 3.5);
  addLadder(-14.2, -0.75, 3.5, 0, -1, "横");
  addLadder(7.85, 16, 3.5, -1, 0, "纵");

  for (const point of [
    [-46, -15], [-15, -46], [15, -46], [46, -15],
    [-46, 15], [-15, 46], [15, 46], [46, 15],
    [-15, -2], [15, 2], [-2, -15], [2, 15]
  ]) {
    addCrate(point[0], point[1], 2.2, 2, 2.2);
  }

  for (const light of [
    [-15, 3.1, -15, 0x6da3b7], [15, 3.1, -15, 0xd49652],
    [-15, 3.1, 15, 0xd49652], [15, 3.1, 15, 0x6da3b7],
    [0, 3.3, 0, 0xe6bc72]
  ]) {
    addMapLight(light[0], light[1], light[2], light[3], 4.8, 14);
  }
  addCommonSpawns(false);
}

const endlessMapBuilders = [
  buildEndlessMap,
  buildEndlessMapTwo,
  buildEndlessMapThree,
  buildEndlessMapFour,
  buildEndlessMapFive,
  buildLevelOne,
  buildZigzagPipelineMap,
  buildTridentFoundryMap,
  buildConcentricEnergyMap,
  buildGridWarehouseMap
];

// 关卡模式的正式十图池。旧的二至五关固定地图生成函数仍保留在源码中
// 作为历史布局参考，但不再参与抽图，因此玩家实际可遇到的拓扑严格为十种。
const campaignMapBuilders = [
  buildEndlessMap,
  buildEndlessMapTwo,
  buildEndlessMapThree,
  buildEndlessMapFour,
  buildEndlessMapFive,
  buildLevelOne,
  buildZigzagPipelineMap,
  buildTridentFoundryMap,
  buildConcentricEnergyMap,
  buildGridWarehouseMap
];

const campaignMapOrder = [];

function prepareCampaignMapOrder() {
  campaignMapOrder.length = 0;
  for (let index = 0; index < campaignMapBuilders.length; index++) {
    campaignMapOrder.push(index);
  }

  // Fisher-Yates 洗牌后取前五张，每轮战役五关不会重复地图。
  for (let index = campaignMapOrder.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const temporary = campaignMapOrder[index];
    campaignMapOrder[index] = campaignMapOrder[swapIndex];
    campaignMapOrder[swapIndex] = temporary;
  }
}

// 每张地图使用不同方向的锚点寻找狙击塔位置。实际位置会在地图建成后
// 从可达地面中自动微调，因此不会与房间、暗道、家具或玩家出生点重叠。
const sniperTowerLayouts = {
  "废弃联合厂区": [
    [-34, 28, "南"],
    [34, -28, "北"]
  ],
  "地下转运站": [
    [-35, -31, "东"],
    [35, 31, "西"]
  ],
  "坍塌钢铁厂": [
    [-33, 30, "东"],
    [34, -30, "西"]
  ],
  "双环冷却厂": [
    [-35, -29, "南"],
    [35, 29, "北"]
  ],
  "蛇形后勤堡垒": [
    [-36, 8, "东"],
    [36, -8, "西"]
  ],
  "十字机修仓": [
    [-31, 9, "东"],
    [31, -9, "西"]
  ],
  "锯齿管线站": [
    [-39, -18, "东"],
    [38, 20, "西"]
  ],
  "三叉铸造枢纽": [
    [-36, -10, "东"],
    [36, 10, "西"]
  ],
  "回字能源堡": [
    [-44, -29, "南"],
    [44, 29, "北"]
  ],
  "九宫仓储区": [
    [-43, 0, "东"],
    [43, 0, "西"]
  ],
  "第二关：物流仓库群": [
    [-32, -8, "东"],
    [32, 8, "西"]
  ],
  "第三关：地下动力区": [
    [-32, 15, "东"],
    [32, -15, "西"]
  ],
  "第四关：高架铸造车间": [
    [-32, -18, "南"],
    [32, 18, "北"]
  ],
  "第五关：坍塌核心工厂": [
    [-33, 20, "东"],
    [33, -20, "西"]
  ]
};

function addSniperTowersForCurrentMap() {
  const layout = sniperTowerLayouts[currentMapName] || [];
  for (const anchor of layout) {
    const directions = ["北", "东", "南", "西"];
    const preferredDirection = anchor[2];
    directions.splice(directions.indexOf(preferredDirection), 1);
    directions.unshift(preferredDirection);

    let site = null;
    for (const direction of directions) {
      site = findSniperTowerSite(anchor[0], anchor[1], direction);
      if (site) break;
    }
    if (site) addSniperTower(site.x, site.z, site.ladderSide);
  }
}

function clearMap() {
  if (mapRoot) {
    scene.remove(mapRoot);
    mapRoot.traverse(function (object) {
      if (object.geometry) object.geometry.dispose();
      if (
        object.material &&
        object.material.userData &&
        object.material.userData.mapOwned
      ) {
        if (object.material.map) object.material.map.dispose();
        object.material.dispose();
      }
    });
  }

  mapRoot = new THREE.Group();
  scene.add(mapRoot);

  colliders.length = 0;
  invalidateColliderSpatialGrid();
  platforms.length = 0;
  ladderZones.length = 0;
  raycastWorld.length = 0;
  spawnPoints.length = 0;
  sniperTowerSpawns.length = 0;
  groundNavigation = null;
  outerExpansionBuilt = false;
}

function loadCurrentMap() {
  clearMap();

  if (selectedMode === "无尽" || selectedMode === "团队") {
    endlessMapBuilders[selectedEndlessMap]();
  } else {
    if (campaignMapOrder.length < 5) prepareCampaignMapOrder();
    const mapPoolIndex = campaignMapOrder[currentLevel - 1];
    const builder = campaignMapBuilders[mapPoolIndex] || campaignMapBuilders[0];
    builder();
  }

  // 无尽与关卡地图共用装饰阶段，墙画、家具都会参与当前地图生命周期。
  decorateCurrentMap();

  // 先计算一次一层连通区域，狙击塔会从这些可达地面点附近选址；建塔后
  // 再重算一次导航，保证塔柱和梯脚也进入最终碰撞与寻路数据。
  mapRoot.updateMatrixWorld(true);
  rebuildColliderSpatialGrid();
  filterSpawnPointsByReachability();
  addSniperTowersForCurrentMap();
  mapRoot.updateMatrixWorld(true);
  rebuildColliderSpatialGrid();
  filterSpawnPointsByReachability();

  // 立即刷新建筑矩阵，保证首帧碰撞射线和敌人视线检测使用新地图坐标。
  rebuildMinimapStatic();
  minimapUpdateTimer = 0;
  // 老厂房仍保留明暗层次，但任何地图都不会再低于这个基础亮度。
  hemisphere.intensity = Math.max(hemisphere.intensity, 1.05);
  sun.intensity = Math.max(sun.intensity, 1.75);
  mapText.textContent = currentMapName;
  populateMapPickups();
}
