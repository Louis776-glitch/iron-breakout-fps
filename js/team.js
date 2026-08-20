"use strict";

// -----------------------------------------------------------------------
// 团队模式：5V5 红蓝对抗、离线人机与双人房间同步
// -----------------------------------------------------------------------
const TEAM_RED = "红";
const TEAM_BLUE = "蓝";
const TEAM_SCORE_LIMIT = 100;
const TEAM_RESPAWN_SECONDS = 15;
const TEAM_INVULNERABLE_SECONDS = 3;
const TEAM_SNAPSHOT_INTERVAL = 0.08;
const TEAM_PLAYER_STATE_INTERVAL = 0.05;

const teamDifficultyProfiles = {
  "简单": {
    health: 82,
    shotDamage: 4.2,
    fireInterval: 1.72,
    accuracy: 0.34,
    shootRange: 24,
    detection: 23
  },
  "适中": {
    health: 100,
    shotDamage: 6.1,
    fireInterval: 1.28,
    accuracy: 0.5,
    shootRange: 29,
    detection: 28
  },
  "困难": {
    health: 132,
    shotDamage: 8.4,
    fireInterval: 0.94,
    accuracy: 0.67,
    shootRange: 35,
    detection: 34
  }
};

const teamBodyMaterials = {
  "红": new THREE.MeshStandardMaterial({
    color: 0xb52f36,
    roughness: 0.7,
    metalness: 0.08
  }),
  "蓝": new THREE.MeshStandardMaterial({
    color: 0x287eb8,
    roughness: 0.7,
    metalness: 0.08
  })
};

const teamAccentMaterials = {
  "红": new THREE.MeshStandardMaterial({
    color: 0xff6664,
    emissive: 0x5e1113,
    emissiveIntensity: 0.7,
    roughness: 0.55
  }),
  "蓝": new THREE.MeshStandardMaterial({
    color: 0x58c4ff,
    emissive: 0x0c3155,
    emissiveIntensity: 0.75,
    roughness: 0.55
  })
};

const teamArmorMaterial = new THREE.MeshStandardMaterial({
  color: 0x202a30,
  roughness: 0.78,
  metalness: 0.18
});

const teamHumanVisorMaterial = new THREE.MeshStandardMaterial({
  color: 0xe9f8ff,
  emissive: 0x4bb8e6,
  emissiveIntensity: 1.1,
  roughness: 0.22,
  metalness: 0.34
});

const teamShieldMaterial = new THREE.MeshBasicMaterial({
  color: 0x8fe5ff,
  transparent: true,
  opacity: 0.18,
  wireframe: true,
  depthWrite: false
});

// 团队角色会在重开对局时重建，因此复用几何体，避免每次
// 进入团队模式都创建一批新的 GPU 缓冲区。
const teamChestAccentGeometry = new THREE.BoxGeometry(0.5, 0.22, 0.035);
const teamShoulderAccentGeometry = new THREE.BoxGeometry(0.18, 0.12, 0.3);
const teamHumanVisorGeometry = new THREE.BoxGeometry(0.34, 0.13, 0.035);
const teamShieldGeometry = new THREE.SphereGeometry(0.9, 12, 8);

let teamNetworkRole = "offline";
let teamLocalTeam = TEAM_BLUE;
let teamLocalPlayerId = "offline-player";
let teamLocalPlayerName = "玩家";
let teamLocalAlive = true;
let teamLocalRespawnAt = 0;
let teamLocalInvulnerableUntil = 0;
let teamRedScore = 0;
let teamBlueScore = 0;
let teamBotDifficulty = "适中";
let teamMatchWinner = null;
let teamCurrentConfig = null;
let teamSocket = null;
let teamSocketPromise = null;
let teamRoomCode = "";
let teamLobbyPlayers = [];
let teamLobbyRole = null;
let teamSnapshotTimer = 0;
let teamPlayerStateTimer = 0;
let teamHudTimer = 0;
let teamConnectionClosedIntentionally = false;

const teamActorById = new Map();
const teamLineRaycaster = new THREE.Raycaster();
const teamLineHits = [];
const teamLineDirection = new THREE.Vector3();
const teamTargetPosition = new THREE.Vector3();
const teamBotWeapons = [
  "机枪", "手枪", "狙击枪", "霰弹枪", "冲锋枪",
  "半自动步枪", "电击枪", "轻机枪"
];

function teamNow() {
  return Date.now() / 1000;
}

function teamOpposite(side) {
  return side === TEAM_RED ? TEAM_BLUE : TEAM_RED;
}

function teamIsAuthority() {
  return teamNetworkRole === "offline" || teamNetworkRole === "host";
}

function teamSanitizeName(name) {
  const clean = String(name || "玩家")
    .replace(/[<>\u0000-\u001f]/g, "")
    .trim()
    .slice(0, 12);
  return clean || "玩家";
}

function teamCreateNameSprite(text, team, human) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(2, 7, 10, 0.82)";
  context.fillRect(18, 18, canvas.width - 36, canvas.height - 36);
  context.strokeStyle = team === TEAM_RED ? "#ff6868" : "#5fc7ff";
  context.lineWidth = human ? 7 : 3;
  context.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);
  context.fillStyle = human ? "#ffffff" : "#c8d2d6";
  context.font = human
    ? "bold 44px Microsoft YaHei, sans-serif"
    : "bold 36px Microsoft YaHei, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(human ? "玩家 · " + text : "AI", 256, 65);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: true,
    depthWrite: false
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(human ? 2.8 : 1.2, human ? 0.7 : 0.42, 1);
  sprite.position.set(0, human ? 2.48 : 2.3, 0);
  return sprite;
}

function teamDisposeWeaponModel(model) {
  if (!model) return;
  model.traverse(function (object) {
    if (object.geometry) object.geometry.dispose();
  });
}

function teamCreateWorldWeapon(name) {
  const weaponName = weaponProfiles[name] ? name : "机枪";
  const model = createPickupVisual(weaponName);
  const halo = model.userData.halo;
  if (halo) {
    model.remove(halo);
    halo.geometry.dispose();
  }
  model.scale.setScalar(0.56);
  model.position.set(0, 1.28, -0.53);
  model.rotation.set(0, 0, 0);
  model.traverse(function (object) {
    if (object.isMesh) {
      // 九名非本地角色的武器只需负责外形识别；如果每个
      // 零件都参与动态阴影，镜头转动时会带来明显 GPU 峰值。
      object.castShadow = false;
      object.receiveShadow = false;
    }
  });
  return model;
}

function teamSetActorWeapon(actor, name) {
  const weaponName = weaponProfiles[name] ? name : "机枪";
  if (actor.weaponName === weaponName && actor.weaponModel) return;
  if (actor.weaponModel) {
    actor.group.remove(actor.weaponModel);
    teamDisposeWeaponModel(actor.weaponModel);
  }
  actor.weaponName = weaponName;
  actor.weaponModel = teamCreateWorldWeapon(weaponName);
  actor.group.add(actor.weaponModel);
}

function teamAddActorPart(actor, geometry, material, x, y, z) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  // 地图的 2048px 阴影在载入时一次生成。团队角色不写入
  // 这张静态阴影图，避免 9 名移动角色迫使整张地图反复重绘。
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.userData.enemy = actor;
  actor.group.add(mesh);
  actor.hitMeshes.push(mesh);
  return mesh;
}

function teamCreateActor(options) {
  const stats = teamDifficultyProfiles[teamBotDifficulty] || teamDifficultyProfiles["适中"];
  const actor = {
    id: options.id,
    name: teamSanitizeName(options.name || (options.isHuman ? "玩家" : "AI")),
    team: options.team === TEAM_RED ? TEAM_RED : TEAM_BLUE,
    isHuman: Boolean(options.isHuman),
    isTeamActor: true,
    isTeamBot: !options.isHuman,
    group: new THREE.Group(),
    hitMeshes: [],
    health: options.health || stats.health,
    maxHealth: options.health || stats.health,
    alive: options.alive !== false,
    radius: 0.43,
    // 团队 AI 与玩家未按 Shift 时使用完全相同的移动速度。
    // 难度只改变血量和射击属性，不再暗中改变跑速。
    speed: player.walkSpeed,
    shotDamage: stats.shotDamage,
    fireInterval: stats.fireInterval * THREE.MathUtils.randFloat(0.9, 1.12),
    accuracy: stats.accuracy,
    shootRange: stats.shootRange,
    detectionRange: stats.detection,
    shotCooldown: THREE.MathUtils.randFloat(0.4, 1.4),
    muzzleTimer: 0,
    patrolTarget: new THREE.Vector3(),
    patrolPath: [],
    patrolIndex: 0,
    pathRefresh: 0,
    visionTimer: Math.random() * 0.2,
    targetId: null,
    pursuitTimer: 0,
    pursuitCooldown: THREE.MathUtils.randFloat(0.2, 2.4),
    blockedTime: 0,
    walkPhase: Math.random() * Math.PI * 2,
    respawnAt: Number(options.respawnAt || 0),
    invulnerableUntil: Number(options.invulnerableUntil || 0),
    weaponName: null,
    weaponModel: null
  };

  const bodyMaterial = teamBodyMaterials[actor.team];
  const accentMaterial = teamAccentMaterials[actor.team];
  actor.body = teamAddActorPart(actor, enemyBodyGeometry, bodyMaterial, 0, 1.17, 0);
  actor.head = teamAddActorPart(actor, enemyHeadGeometry, enemySkinMaterial, 0, 1.82, 0);
  actor.leftLeg = teamAddActorPart(actor, enemyLimbGeometry, teamArmorMaterial, -0.18, 0.4, 0);
  actor.rightLeg = teamAddActorPart(actor, enemyLimbGeometry, teamArmorMaterial, 0.18, 0.4, 0);
  actor.leftArm = teamAddActorPart(actor, enemyArmGeometry, bodyMaterial, -0.42, 1.18, 0);
  actor.rightArm = teamAddActorPart(actor, enemyArmGeometry, bodyMaterial, 0.42, 1.18, 0);
  actor.leftArm.rotation.x = -0.9;
  actor.rightArm.rotation.x = -0.9;

  // 胸前与肩部使用高饱和阵营标识，即使在昏暗房间内也能辨认红蓝归属。
  teamAddActorPart(actor, teamChestAccentGeometry, accentMaterial, 0, 1.25, -0.2);
  teamAddActorPart(actor, teamShoulderAccentGeometry, accentMaterial, -0.43, 1.42, 0);
  teamAddActorPart(actor, teamShoulderAccentGeometry, accentMaterial, 0.43, 1.42, 0);

  if (actor.isHuman) {
    // 真人拥有发光面罩和更大的“玩家”头顶标签；标签启用深度测试，
    // 因而不会隔着墙壁泄露敌方真人的位置。
    teamAddActorPart(actor, teamHumanVisorGeometry, teamHumanVisorMaterial, 0, 1.86, -0.225);
  } else {
    for (const eyeX of [-0.11, 0.11]) {
      teamAddActorPart(actor, enemyEyeGeometry, enemyEyeMaterial, eyeX, 1.86, -0.218);
    }
  }

  // 仅真人需要“玩家”标记；AI 靠红蓝制服识别，不再额外
  // 生成八张 Canvas 纹理和八个透明精灵绘制。
  actor.nameSprite = actor.isHuman
    ? teamCreateNameSprite(actor.name, actor.team, true)
    : null;
  if (actor.nameSprite) actor.group.add(actor.nameSprite);
  actor.shield = new THREE.Mesh(teamShieldGeometry, teamShieldMaterial);
  actor.shield.position.y = 1.05;
  actor.shield.scale.y = 1.35;
  actor.shield.visible = false;
  actor.group.add(actor.shield);
  actor.muzzleFlash = new THREE.Mesh(enemyMuzzleGeometry, enemyMuzzleMaterial);
  actor.muzzleFlash.position.set(0, 1.3, -1.16);
  actor.muzzleFlash.scale.set(0.65, 0.65, 2.1);
  actor.muzzleFlash.visible = false;
  actor.group.add(actor.muzzleFlash);

  teamSetActorWeapon(actor, options.weaponName || teamBotWeapons[
    Math.floor(Math.random() * teamBotWeapons.length)
  ]);
  actor.group.position.copy(options.position || teamChooseSpawnPoint());
  actor.group.rotation.y = Number(options.yaw || 0);
  actor.group.visible = actor.alive;
  resolveCirclePenetration(actor.group.position, actor.radius, 1.85);
  scene.add(actor.group);
  enemies.push(actor);
  teamActorById.set(actor.id, actor);

  if (actor.isTeamBot) teamAssignPatrol(actor);
  return actor;
}

function teamRemoveActor(actor) {
  if (!actor) return;
  scene.remove(actor.group);
  if (actor.nameSprite) {
    if (actor.nameSprite.material.map) actor.nameSprite.material.map.dispose();
    actor.nameSprite.material.dispose();
  }
  teamDisposeWeaponModel(actor.weaponModel);
  const enemyIndex = enemies.indexOf(actor);
  if (enemyIndex >= 0) enemies.splice(enemyIndex, 1);
  teamActorById.delete(actor.id);
}

function teamClearActors() {
  for (const actor of Array.from(teamActorById.values())) teamRemoveActor(actor);
  teamActorById.clear();
}

function teamChooseSpawnPoint() {
  const fallback = spawnPoints[0]
    ? spawnPoints[0].clone()
    : new THREE.Vector3(playerStart.x, 0, playerStart.z);
  let best = fallback;
  let bestClearance = -1;

  for (let attempt = 0; attempt < 80; attempt++) {
    const source = spawnPoints.length > 0
      ? spawnPoints[Math.floor(Math.random() * spawnPoints.length)]
      : fallback;
    const candidate = source.clone();
    if (collidesAt(candidate.x, candidate.z, 0.48, candidate.y, 1.82)) continue;
    let clearance = player.position.distanceTo(candidate);
    for (const actor of enemies) {
      if (!actor.alive) continue;
      clearance = Math.min(clearance, actor.group.position.distanceTo(candidate));
    }
    if (clearance > bestClearance) {
      bestClearance = clearance;
      best = candidate;
    }
    if (clearance >= 8) return candidate;
  }
  return best;
}

function teamAssignPatrol(actor) {
  actor.patrolTarget.copy(randomPatrolPoint(actor.group.position));
  actor.patrolPath = buildGroundPatrolPath(actor.group.position, actor.patrolTarget);
  actor.patrolIndex = 0;
}

function teamTargetAlive(target) {
  if (!target) return false;
  if (target.kind === "local") return teamLocalAlive;
  return target.alive;
}

function teamTargetTeam(target) {
  return target.kind === "local" ? teamLocalTeam : target.team;
}

function teamTargetId(target) {
  return target.kind === "local" ? teamLocalPlayerId : target.id;
}

function teamGetTargetPosition(target, eyeHeight) {
  if (target.kind === "local") {
    teamTargetPosition.copy(player.position);
  } else {
    teamTargetPosition.copy(target.group.position);
  }
  if (eyeHeight) teamTargetPosition.y += 1.52;
  return teamTargetPosition;
}

function teamFindTargetById(id) {
  if (id === teamLocalPlayerId) {
    return { kind: "local", id: teamLocalPlayerId, team: teamLocalTeam };
  }
  return teamActorById.get(id) || null;
}

function teamFindNearestOpponent(actor) {
  let best = null;
  let bestDistance = actor.detectionRange;
  if (teamLocalAlive && teamLocalTeam !== actor.team) {
    const distance = actor.group.position.distanceTo(player.position);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = { kind: "local", id: teamLocalPlayerId, team: teamLocalTeam };
    }
  }
  for (const candidate of enemies) {
    if (
      candidate === actor ||
      !candidate.alive ||
      candidate.team === actor.team
    ) {
      continue;
    }
    const distance = actor.group.position.distanceTo(candidate.group.position);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = candidate;
    }
  }
  return best;
}

function teamPathIsClear(origin, target) {
  teamLineDirection.subVectors(target, origin);
  const distance = teamLineDirection.length();
  if (distance <= 0.05) return true;
  teamLineDirection.normalize();
  teamLineRaycaster.set(origin, teamLineDirection);
  teamLineRaycaster.near = 0.02;
  teamLineRaycaster.far = Math.max(0.02, distance - 0.05);
  teamLineHits.length = 0;
  teamLineRaycaster.intersectObjects(raycastWorld, false, teamLineHits);
  return teamLineHits.length === 0;
}

function teamActorCanSee(actor, target) {
  if (!target || !teamTargetAlive(target)) return false;
  const origin = new THREE.Vector3(
    actor.group.position.x,
    actor.group.position.y + 1.48,
    actor.group.position.z
  );
  const targetPosition = teamGetTargetPosition(target, true).clone();
  return teamPathIsClear(origin, targetPosition);
}

function teamTriggerActorMuzzle(actor) {
  if (!actor) return;
  actor.muzzleFlash.visible = true;
  actor.muzzleFlash.rotation.z = Math.random() * Math.PI;
  actor.muzzleTimer = 0.07;
}

function teamShootBot(actor, target, distance) {
  if (!teamActorCanSee(actor, target)) {
    actor.shotCooldown = 0.2;
    return;
  }
  teamTriggerActorMuzzle(actor);
  actor.shotCooldown = actor.fireInterval * THREE.MathUtils.randFloat(0.88, 1.16);
  const rangePenalty = Math.min(0.4, distance / actor.shootRange * 0.4);
  const hitChance = actor.accuracy * (1 - rangePenalty);
  if (Math.random() < hitChance) {
    if (target.kind === "local") {
      damageTeamLocalPlayer(actor.shotDamage, actor.team);
    } else {
      damageTeamActor(target, actor.shotDamage, actor.team);
    }
  } else {
    const origin = actor.group.position.clone().add(new THREE.Vector3(0, 1.4, 0));
    const direction = teamGetTargetPosition(target, true).clone().sub(origin).normalize();
    direction.x += THREE.MathUtils.randFloatSpread(0.12);
    direction.y += THREE.MathUtils.randFloatSpread(0.08);
    direction.z += THREE.MathUtils.randFloatSpread(0.12);
    direction.normalize();
    teamLineRaycaster.set(origin, direction);
    teamLineRaycaster.near = 0.08;
    teamLineRaycaster.far = actor.shootRange;
    teamLineHits.length = 0;
    teamLineRaycaster.intersectObjects(raycastWorld, false, teamLineHits);
    if (teamLineHits.length > 0) {
      const hit = teamLineHits[0];
      const normal = hit.face
        ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld)
        : new THREE.Vector3(0, 1, 0);
      spawnImpact(hit.point, normal, false);
    }
  }
}

function teamMoveBot(actor, target, delta) {
  let destination = null;
  const chasing = target && actor.pursuitTimer > 0;
  if (chasing) {
    actor.pathRefresh -= delta;
    if (actor.pathRefresh <= 0 || actor.patrolPath.length === 0) {
      const destinationPoint = teamGetTargetPosition(target, false).clone();
      destinationPoint.y = 0;
      actor.patrolPath = buildGroundPatrolPath(actor.group.position, destinationPoint);
      actor.patrolIndex = 0;
      actor.pathRefresh = THREE.MathUtils.randFloat(0.65, 1.05);
    }
  } else if (actor.patrolPath.length === 0) {
    teamAssignPatrol(actor);
  }

  destination = actor.patrolPath[Math.min(
    actor.patrolIndex,
    actor.patrolPath.length - 1
  )] || actor.patrolTarget;
  tempVector.subVectors(destination, actor.group.position);
  tempVector.y = 0;
  let distance = tempVector.length();
  if (distance < 0.75) {
    actor.patrolIndex++;
    if (actor.patrolIndex >= actor.patrolPath.length) {
      if (chasing) actor.patrolPath.length = 0;
      else teamAssignPatrol(actor);
    }
    destination = actor.patrolPath[Math.min(
      actor.patrolIndex,
      actor.patrolPath.length - 1
    )] || actor.patrolTarget;
    tempVector.subVectors(destination, actor.group.position);
    tempVector.y = 0;
    distance = tempVector.length();
  }

  if (distance <= 0.001) return;
  tempVector.normalize();
  const speed = actor.speed;
  const moved = moveWithCollisions(
    actor.group.position,
    tempVector.x * speed * delta,
    tempVector.z * speed * delta,
    actor.radius,
    1.85
  );
  if (!moved) {
    actor.blockedTime += delta;
    if (actor.blockedTime > 0.55) {
      actor.patrolPath.length = 0;
      actor.pathRefresh = 0;
      actor.blockedTime = 0;
    }
  } else {
    actor.blockedTime = 0;
  }
  actor.group.rotation.y = Math.atan2(-tempVector.x, -tempVector.z);
  actor.walkPhase += delta * (chasing ? 8 : 5.2);
  const swing = Math.sin(actor.walkPhase) * 0.48;
  actor.leftLeg.rotation.x = swing;
  actor.rightLeg.rotation.x = -swing;
  actor.leftArm.rotation.x = -0.9 - swing * 0.1;
  actor.rightArm.rotation.x = -0.9 + swing * 0.1;
}

function updateTeamBots(delta) {
  if (!teamIsAuthority() || gameState !== "战斗") return;
  const now = teamNow();
  for (const actor of enemies) {
    if (!actor.isTeamBot || !actor.alive) continue;
    resolveCirclePenetration(actor.group.position, actor.radius, 1.85);
    actor.shotCooldown -= delta;
    actor.visionTimer -= delta;
    actor.pursuitTimer = Math.max(0, actor.pursuitTimer - delta);
    actor.pursuitCooldown = Math.max(0, actor.pursuitCooldown - delta);

    let target = teamFindTargetById(actor.targetId);
    if (!target || !teamTargetAlive(target) || teamTargetTeam(target) === actor.team) {
      target = null;
      actor.targetId = null;
    }

    if (actor.visionTimer <= 0) {
      const observed = teamFindNearestOpponent(actor);
      if (observed && teamActorCanSee(actor, observed)) {
        target = observed;
        actor.targetId = teamTargetId(observed);
        if (actor.pursuitTimer <= 0 && actor.pursuitCooldown <= 0) {
          actor.pursuitTimer = THREE.MathUtils.randFloat(4.2, 6.8);
          actor.pursuitCooldown = actor.pursuitTimer + THREE.MathUtils.randFloat(4.5, 7.5);
        }
      }
      actor.visionTimer = THREE.MathUtils.randFloat(0.16, 0.28);
    }

    teamMoveBot(actor, target, delta);
    if (!target || !teamTargetAlive(target)) continue;
    const targetPosition = teamGetTargetPosition(target, false);
    const distance = actor.group.position.distanceTo(targetPosition);
    // 视线侦测已在上方以 4–6Hz 执行。过去这里每帧又对所有
    // 人机做一次全地图射线，并在开枪时第三次重复。现在只在
    // 真正要开枪的那一帧调用 teamShootBot 做精确墙体检查。
    if (distance <= actor.shootRange) {
      actor.group.rotation.y = Math.atan2(
        -(targetPosition.x - actor.group.position.x),
        -(targetPosition.z - actor.group.position.z)
      );
      if (actor.shotCooldown <= 0) teamShootBot(actor, target, distance);
    }
  }
}

function teamScoreFor(side) {
  return side === TEAM_RED ? teamRedScore : teamBlueScore;
}

function teamSetScore(side, score) {
  if (side === TEAM_RED) teamRedScore = score;
  else teamBlueScore = score;
}

function teamAwardKill(side) {
  if (side !== TEAM_RED && side !== TEAM_BLUE) return;
  const next = teamScoreFor(side) + 1;
  teamSetScore(side, next);
  if (next >= TEAM_SCORE_LIMIT) teamFinishMatch(side);
}

function damageTeamActor(actor, amount, attackerTeam) {
  if (
    !actor ||
    !actor.alive ||
    actor.team === attackerTeam ||
    teamNow() < actor.invulnerableUntil
  ) {
    return;
  }

  if (!teamIsAuthority()) {
    teamSendGame({
      type: "hit",
      targetId: actor.id,
      weapon: currentWeapon,
      amount: Math.max(0, Number(amount) || 0)
    });
    hitFlash = 0.12;
    return;
  }

  actor.health -= Math.max(0, Number(amount) || 0);
  hitFlash = 0.12;
  if (actor.health <= 0) teamEliminateActor(actor, attackerTeam);
}

function teamEliminateActor(actor, killerTeam) {
  if (!actor || !actor.alive) return;
  actor.alive = false;
  actor.health = 0;
  actor.group.visible = false;
  actor.respawnAt = teamNow() + TEAM_RESPAWN_SECONDS;
  actor.targetId = null;
  actor.patrolPath.length = 0;
  if (killerTeam !== actor.team) teamAwardKill(killerTeam);
}

function damageTeamLocalPlayer(amount, attackerTeam) {
  if (
    selectedMode !== "团队" ||
    gameState !== "战斗" ||
    !teamLocalAlive ||
    attackerTeam === teamLocalTeam ||
    teamNow() < teamLocalInvulnerableUntil
  ) {
    return;
  }
  player.health = Math.max(0, player.health - Math.max(0, Number(amount) || 0));
  damageFlash = Math.min(1, Math.max(damageFlash, 0.52) + amount * 0.022);
  updateHealthUI();
  if (player.health <= 0) teamEliminateLocalPlayer(attackerTeam);
}

function teamEliminateLocalPlayer(killerTeam) {
  if (!teamLocalAlive) return;
  teamLocalAlive = false;
  player.health = 0;
  teamLocalRespawnAt = teamNow() + TEAM_RESPAWN_SECONDS;
  firing = false;
  setAiming(false);
  cancelReload();
  weapon.visible = false;
  teamRespawnOverlay.classList.remove("hidden");
  if (teamIsAuthority() && killerTeam !== teamLocalTeam) teamAwardKill(killerTeam);
  updateHealthUI();
}

function teamRespawnActor(actor) {
  const spawn = teamChooseSpawnPoint();
  actor.group.position.copy(spawn);
  actor.group.rotation.y = Math.random() * Math.PI * 2;
  actor.health = actor.maxHealth;
  actor.alive = true;
  actor.respawnAt = 0;
  actor.invulnerableUntil = teamNow() + TEAM_INVULNERABLE_SECONDS;
  actor.group.visible = true;
  actor.shield.visible = true;
  actor.shotCooldown = 0.8;
  actor.targetId = null;
  actor.patrolPath.length = 0;
  if (actor.isTeamBot) teamAssignPatrol(actor);
}

function teamPlaceLocalPlayer(position) {
  const spawn = position ? position.clone() : teamChooseSpawnPoint();
  player.position.copy(spawn);
  player.position.y = Math.max(0, spawn.y || 0);
  resolveCirclePenetration(player.position, player.radius, player.bodyHeight);
  playerLastSafePosition.copy(player.position);
  player.velocityY = 0;
  player.grounded = true;
  player.climbing = false;
  camera.position.set(
    player.position.x,
    player.position.y + player.eyeHeight,
    player.position.z
  );
}

function teamRespawnLocalPlayer(position) {
  teamPlaceLocalPlayer(position);
  player.health = 100;
  teamLocalAlive = true;
  teamLocalRespawnAt = 0;
  teamLocalInvulnerableUntil = teamNow() + TEAM_INVULNERABLE_SECONDS;
  teamRespawnOverlay.classList.add("hidden");
  weapon.visible = true;
  updateHealthUI();
}

function updateTeamRespawns() {
  if (!teamIsAuthority() || gameState !== "战斗") return;
  const now = teamNow();
  for (const actor of enemies) {
    if (actor.isTeamActor && !actor.alive && actor.respawnAt > 0 && now >= actor.respawnAt) {
      teamRespawnActor(actor);
    }
  }
  if (!teamLocalAlive && teamLocalRespawnAt > 0 && now >= teamLocalRespawnAt) {
    teamRespawnLocalPlayer();
  }
}

function teamSerializeActor(actor) {
  return {
    id: actor.id,
    name: actor.name,
    team: actor.team,
    isHuman: actor.isHuman,
    alive: actor.alive,
    health: actor.health,
    maxHealth: actor.maxHealth,
    x: actor.group.position.x,
    y: actor.group.position.y,
    z: actor.group.position.z,
    yaw: actor.group.rotation.y,
    weapon: actor.weaponName,
    respawnAt: actor.respawnAt,
    invulnerableUntil: actor.invulnerableUntil
  };
}

function teamSerializeLocalPlayer() {
  return {
    id: teamLocalPlayerId,
    name: teamLocalPlayerName,
    team: teamLocalTeam,
    isHuman: true,
    alive: teamLocalAlive,
    health: player.health,
    maxHealth: 100,
    x: player.position.x,
    y: player.position.y,
    z: player.position.z,
    yaw: player.yaw,
    pitch: player.pitch,
    weapon: currentWeapon,
    respawnAt: teamLocalRespawnAt,
    invulnerableUntil: teamLocalInvulnerableUntil
  };
}

function teamEnsureNetworkActor(state) {
  let actor = teamActorById.get(state.id);
  if (!actor) {
    actor = teamCreateActor({
      id: state.id,
      name: state.name,
      team: state.team,
      isHuman: state.isHuman,
      health: state.maxHealth,
      alive: state.alive,
      weaponName: state.weapon,
      position: new THREE.Vector3(state.x || 0, state.y || 0, state.z || 0),
      yaw: state.yaw,
      respawnAt: state.respawnAt,
      invulnerableUntil: state.invulnerableUntil
    });
  }
  return actor;
}

function teamApplyActorState(actor, state) {
  const wasAlive = actor.alive;
  actor.team = state.team;
  actor.health = Number(state.health || 0);
  actor.maxHealth = Number(state.maxHealth || actor.maxHealth || 100);
  actor.alive = Boolean(state.alive);
  actor.respawnAt = Number(state.respawnAt || 0);
  actor.invulnerableUntil = Number(state.invulnerableUntil || 0);
  actor.group.visible = actor.alive;
  if (actor.alive) {
    const targetX = Number(state.x || 0);
    const targetY = Number(state.y || 0);
    const targetZ = Number(state.z || 0);
    if (!wasAlive || actor.group.position.distanceToSquared(
      new THREE.Vector3(targetX, targetY, targetZ)
    ) > 100) {
      actor.group.position.set(targetX, targetY, targetZ);
    } else {
      actor.group.position.x = THREE.MathUtils.lerp(actor.group.position.x, targetX, 0.42);
      actor.group.position.y = THREE.MathUtils.lerp(actor.group.position.y, targetY, 0.42);
      actor.group.position.z = THREE.MathUtils.lerp(actor.group.position.z, targetZ, 0.42);
    }
    actor.group.rotation.y = THREE.MathUtils.lerp(
      actor.group.rotation.y,
      Number(state.yaw || 0),
      0.5
    );
  }
  actor.shield.visible = actor.alive && teamNow() < actor.invulnerableUntil;
  teamSetActorWeapon(actor, state.weapon);
}

function teamApplyLocalAuthoritativeState(state) {
  const wasAlive = teamLocalAlive;
  teamLocalAlive = Boolean(state.alive);
  player.health = Number(state.health || 0);
  teamLocalRespawnAt = Number(state.respawnAt || 0);
  teamLocalInvulnerableUntil = Number(state.invulnerableUntil || 0);
  if (!teamLocalAlive) {
    firing = false;
    setAiming(false);
    weapon.visible = false;
    teamRespawnOverlay.classList.remove("hidden");
  } else {
    if (!wasAlive) {
      teamPlaceLocalPlayer(new THREE.Vector3(state.x, state.y, state.z));
    }
    teamRespawnOverlay.classList.add("hidden");
    weapon.visible = true;
  }
  updateHealthUI();
}

function teamBroadcastSnapshot() {
  if (teamNetworkRole !== "host" || !teamSocket || teamSocket.readyState !== WebSocket.OPEN) return;
  const actors = [teamSerializeLocalPlayer()];
  for (const actor of enemies) {
    if (actor.isTeamActor) actors.push(teamSerializeActor(actor));
  }
  teamSendGame({
    type: "snapshot",
    redScore: teamRedScore,
    blueScore: teamBlueScore,
    winner: teamMatchWinner,
    actors: actors
  });
}

function teamApplySnapshot(snapshot) {
  if (teamNetworkRole !== "guest") return;
  teamRedScore = Number(snapshot.redScore || 0);
  teamBlueScore = Number(snapshot.blueScore || 0);
  const activeIds = new Set();
  for (const state of snapshot.actors || []) {
    activeIds.add(state.id);
    if (state.id === teamLocalPlayerId) {
      teamApplyLocalAuthoritativeState(state);
      continue;
    }
    const actor = teamEnsureNetworkActor(state);
    teamApplyActorState(actor, state);
  }
  for (const actor of Array.from(teamActorById.values())) {
    if (!activeIds.has(actor.id)) teamRemoveActor(actor);
  }
  if (snapshot.winner && !teamMatchWinner) teamFinishMatch(snapshot.winner, true);
}

function teamReceiveRemotePlayerState(from, state) {
  if (teamNetworkRole !== "host" || !state || from === teamLocalPlayerId) return;
  const actor = teamActorById.get(from);
  if (!actor || !actor.isHuman) return;
  if (actor.alive) {
    const safeX = THREE.MathUtils.clamp(Number(state.x || 0), -MAP_HALF + 1, MAP_HALF - 1);
    const safeZ = THREE.MathUtils.clamp(Number(state.z || 0), -MAP_HALF + 1, MAP_HALF - 1);
    const requested = new THREE.Vector3(safeX, Math.max(0, Number(state.y || 0)), safeZ);
    if (!collidesAt(requested.x, requested.z, actor.radius, requested.y, 1.85)) {
      actor.group.position.copy(requested);
    }
    actor.group.rotation.y = Number(state.yaw || 0);
    teamSetActorWeapon(actor, state.weapon);
  }
}

function teamHandleNetworkHit(from, payload) {
  if (teamNetworkRole !== "host" || !payload) return;
  const attacker = teamLobbyPlayers.find(function (entry) { return entry.id === from; });
  if (!attacker) return;
  const profile = weaponProfiles[payload.weapon] || weaponProfiles["机枪"];
  const maximum = profile.type === "shotgun"
    ? profile.damage
    : profile.damage;
  const amount = THREE.MathUtils.clamp(Number(payload.amount || 0), 0, maximum);
  if (payload.targetId === teamLocalPlayerId) {
    damageTeamLocalPlayer(amount, attacker.team);
    return;
  }
  const target = teamActorById.get(payload.targetId);
  if (target) damageTeamActor(target, amount, attacker.team);
}

function teamBroadcastLocalFire(weaponName) {
  if (selectedMode !== "团队" || teamNetworkRole === "offline") return;
  teamSendGame({ type: "fire", weapon: weaponName });
}

function teamHandleRemoteFire(from, payload) {
  const actor = teamActorById.get(from);
  if (!actor) return;
  teamSetActorWeapon(actor, payload.weapon);
  teamTriggerActorMuzzle(actor);
}

function teamSendGame(payload) {
  if (!teamSocket || teamSocket.readyState !== WebSocket.OPEN || !teamRoomCode) return;
  teamSocket.send(JSON.stringify({ type: "game", payload: payload }));
}

function teamSendLobbyUpdate() {
  if (!teamSocket || teamSocket.readyState !== WebSocket.OPEN || !teamRoomCode) return;
  teamSocket.send(JSON.stringify({
    type: "lobby",
    name: teamSanitizeName(teamPlayerNameInput.value),
    team: teamSideSelect.value === TEAM_RED ? TEAM_RED : TEAM_BLUE,
    mapIndex: Number(teamMapSelect.value) || 0,
    difficulty: teamDifficultySelect.value
  }));
}

function teamUpdateLobbyState(message) {
  teamRoomCode = message.roomCode || teamRoomCode;
  teamLobbyPlayers = Array.isArray(message.players) ? message.players : [];
  teamRoomCodeText.textContent = teamRoomCode || "------";
  teamConnectionStatus.textContent = teamLobbyRole === "host"
    ? "房间已建立，等待另一名玩家"
    : "已加入房间";
  teamRoomPlayers.innerHTML = teamLobbyPlayers.map(function (entry) {
    const role = entry.id === message.hostId ? "房主" : "成员";
    const sideClass = entry.team === TEAM_RED ? "team-score-red" : "team-score-blue";
    return "<span class=\"" + sideClass + "\">" +
      role + " · " + entry.name + " · " + entry.team + "方</span>";
  }).join("<br>") || "等待玩家";
  teamHostStartButton.classList.toggle("hidden", teamLobbyRole !== "host");
  teamHostStartButton.disabled = teamLobbyPlayers.length !== 2;

  if (message.config) {
    teamMapSelect.value = String(message.config.mapIndex || 0);
    teamDifficultySelect.value = message.config.difficulty || "适中";
  }
  const local = teamLobbyPlayers.find(function (entry) { return entry.id === teamLocalPlayerId; });
  if (local) teamSideSelect.value = local.team;
  const guestLocked = teamLobbyRole === "guest";
  teamMapSelect.disabled = guestLocked;
  teamDifficultySelect.disabled = guestLocked;
}

function teamHandleSocketMessage(event) {
  let message;
  try {
    message = JSON.parse(event.data);
  } catch (error) {
    return;
  }

  if (message.type === "error") {
    teamConnectionStatus.textContent = message.message || "房间操作失败";
    return;
  }
  if (message.type === "created" || message.type === "joined") {
    teamLobbyRole = message.type === "created" ? "host" : "guest";
    teamLocalPlayerId = message.playerId;
    teamRoomCode = message.roomCode;
    teamConnectionStatus.textContent = message.type === "created" ? "房间创建成功" : "加入成功";
    teamUpdateLobbyState(message);
    teamSendLobbyUpdate();
    return;
  }
  if (message.type === "roomState") {
    teamUpdateLobbyState(message);
    return;
  }
  if (message.type === "start") {
    const local = (message.players || []).find(function (entry) {
      return entry.id === teamLocalPlayerId;
    });
    if (!local) return;
    startTeamBattle(
      teamLobbyRole === "host" ? "host" : "guest",
      message.config,
      message.players
    );
    return;
  }
  if (message.type === "game") {
    const payload = message.payload || {};
    if (payload.type === "playerState") teamReceiveRemotePlayerState(message.from, payload.state);
    else if (payload.type === "snapshot") teamApplySnapshot(payload);
    else if (payload.type === "hit") teamHandleNetworkHit(message.from, payload);
    else if (payload.type === "fire") teamHandleRemoteFire(message.from, payload);
    return;
  }
  if (message.type === "hostLeft") {
    teamConnectionStatus.textContent = "房主已离开，房间关闭";
    if (selectedMode === "团队" && gameState === "战斗") {
      teamFinishMatch(teamOpposite(teamLocalTeam), true, "房主连接已断开");
    }
  }
}

function teamCloseSocket() {
  teamConnectionClosedIntentionally = true;
  if (teamSocket) {
    try { teamSocket.close(); } catch (error) { /* 已关闭 */ }
  }
  teamSocket = null;
  teamSocketPromise = null;
  teamRoomCode = "";
  teamLobbyPlayers = [];
  teamLobbyRole = null;
  teamRoomCodeText.textContent = "------";
  teamConnectionStatus.textContent = "尚未连接";
  teamRoomPlayers.textContent = "等待创建或加入房间";
  teamHostStartButton.classList.add("hidden");
  teamMapSelect.disabled = false;
  teamDifficultySelect.disabled = false;
}

function teamConnectSocket() {
  if (teamSocket && teamSocket.readyState === WebSocket.OPEN) {
    return Promise.resolve(teamSocket);
  }
  if (teamSocketPromise) return teamSocketPromise;
  const serverUrl = String(teamServerUrlInput.value || "").trim();
  if (!/^wss?:\/\//i.test(serverUrl)) {
    teamConnectionStatus.textContent = "服务器地址必须以 ws:// 或 wss:// 开头";
    return Promise.reject(new Error("服务器地址无效"));
  }
  localStorage.setItem("ironBreakoutTeamServer", serverUrl);
  teamConnectionStatus.textContent = "正在连接服务器……";
  teamConnectionClosedIntentionally = false;
  teamSocketPromise = new Promise(function (resolve, reject) {
    const socket = new WebSocket(serverUrl);
    const timeout = setTimeout(function () {
      try { socket.close(); } catch (error) { /* 忽略 */ }
      reject(new Error("连接超时"));
    }, 7000);
    socket.addEventListener("open", function () {
      clearTimeout(timeout);
      teamSocket = socket;
      teamSocketPromise = null;
      teamConnectionStatus.textContent = "服务器已连接";
      resolve(socket);
    }, { once: true });
    socket.addEventListener("message", teamHandleSocketMessage);
    socket.addEventListener("error", function () {
      clearTimeout(timeout);
      teamSocketPromise = null;
      teamConnectionStatus.textContent = "无法连接房间服务器";
      reject(new Error("连接失败"));
    }, { once: true });
    socket.addEventListener("close", function () {
      if (teamSocket === socket) teamSocket = null;
      teamSocketPromise = null;
      if (!teamConnectionClosedIntentionally) {
        teamConnectionStatus.textContent = "连接已断开";
      }
    });
  });
  return teamSocketPromise;
}

function teamBuildRoster(players) {
  const humansByTeam = { "红": 0, "蓝": 0 };
  for (const entry of players) humansByTeam[entry.team]++;
  let botCounter = 0;
  for (const side of [TEAM_RED, TEAM_BLUE]) {
    const botCount = 5 - humansByTeam[side];
    for (let index = 0; index < botCount; index++) {
      botCounter++;
      teamCreateActor({
        id: "bot-" + side + "-" + botCounter,
        name: side + "方 AI " + (index + 1),
        team: side,
        isHuman: false,
        position: teamChooseSpawnPoint()
      });
    }
  }

  // 房主端为客人建立真人模型；客人的客户端会从房主快照中建立房主模型。
  if (teamNetworkRole === "host") {
    for (const entry of players) {
      if (entry.id === teamLocalPlayerId) continue;
      teamCreateActor({
        id: entry.id,
        name: entry.name,
        team: entry.team,
        isHuman: true,
        health: 100,
        weaponName: "机枪",
        position: teamChooseSpawnPoint(),
        invulnerableUntil: teamNow() + TEAM_INVULNERABLE_SECONDS
      });
    }
  }
}

function startTeamBattle(role, config, players) {
  teamNetworkRole = role;
  teamCurrentConfig = {
    mapIndex: THREE.MathUtils.clamp(Number(config.mapIndex) || 0, 0, 9),
    difficulty: teamDifficultyProfiles[config.difficulty] ? config.difficulty : "适中"
  };
  teamBotDifficulty = teamCurrentConfig.difficulty;
  selectedMode = "团队";
  selectedEndlessMap = teamCurrentConfig.mapIndex;
  gameState = "战斗";
  teamMatchWinner = null;
  teamRedScore = 0;
  teamBlueScore = 0;
  teamSnapshotTimer = 0;
  teamPlayerStateTimer = 0;
  teamLobbyPlayers = players.slice();
  const local = players.find(function (entry) { return entry.id === teamLocalPlayerId; });
  teamLocalTeam = local ? local.team : teamSideSelect.value;
  teamLocalPlayerName = local ? local.name : teamSanitizeName(teamPlayerNameInput.value);

  teamClearActors();
  clearEnemiesAndEffects();
  loadCurrentMap();
  resetPlayer();
  teamPlaceLocalPlayer();
  teamLocalAlive = true;
  teamLocalRespawnAt = 0;
  teamLocalInvulnerableUntil = teamNow() + TEAM_INVULNERABLE_SECONDS;

  if (teamIsAuthority()) teamBuildRoster(players);

  modeScreen.classList.add("hidden");
  endlessMapScreen.classList.add("hidden");
  armoryScreen.classList.add("hidden");
  teamLobbyScreen.classList.add("hidden");
  pauseScreen.classList.add("hidden");
  resultScreen.classList.add("hidden");
  teamRespawnOverlay.classList.add("hidden");
  teamScoreboard.classList.remove("hidden");
  updateTeamHud(true);
  warmUpBattleRenderer();
  requestGamePointerLock();
}

function startOfflineTeamBattle() {
  teamCloseSocket();
  teamNetworkRole = "offline";
  teamLocalPlayerId = "offline-player";
  const localName = teamSanitizeName(teamPlayerNameInput.value);
  const localTeam = teamSideSelect.value === TEAM_RED ? TEAM_RED : TEAM_BLUE;
  startTeamBattle("offline", {
    mapIndex: Number(teamMapSelect.value) || 0,
    difficulty: teamDifficultySelect.value
  }, [{ id: teamLocalPlayerId, name: localName, team: localTeam }]);
}

function updateTeamHud(force, delta) {
  if (selectedMode !== "团队") return;
  if (!force) {
    teamHudTimer -= delta || 0;
    if (teamHudTimer > 0) return;
  }
  // 文字 HUD 每秒刷新 5 次已足够显示计分与复活倒计时，
  // 避免在每个渲染帧都触发多个 DOM 文字布局。
  teamHudTimer = 0.2;
  teamRedScoreText.textContent = String(teamRedScore);
  teamBlueScoreText.textContent = String(teamBlueScore);
  modeText.textContent = teamNetworkRole === "offline"
    ? "团队模式 · 单人"
    : "团队模式 · 联机";
  mapText.textContent = currentMapName;
  scoreText.textContent = teamRedScore + " : " + teamBlueScore;
  difficultyText.textContent = teamBotDifficulty;
  let opponents = 0;
  for (const actor of enemies) {
    if (actor.alive && actor.team !== teamLocalTeam) opponents++;
  }
  enemyCountText.textContent = String(opponents);
  objective.textContent = teamLocalTeam + "方作战　红方 " + teamRedScore +
    " / 蓝方 " + teamBlueScore + "　率先达到 " + TEAM_SCORE_LIMIT + " 击杀获胜";

  if (!teamLocalAlive) {
    const seconds = Math.max(0, Math.ceil(teamLocalRespawnAt - teamNow()));
    teamRespawnSecondsText.textContent = String(seconds);
    teamRespawnOverlay.classList.remove("hidden");
  } else {
    teamRespawnOverlay.classList.add("hidden");
  }
}

function teamFinishMatch(winner, remote, reason) {
  if (teamMatchWinner) return;
  teamMatchWinner = winner;
  gameState = "团队结束";
  firing = false;
  setAiming(false);
  teamRespawnOverlay.classList.add("hidden");
  if (document.pointerLockElement === renderer.domElement) document.exitPointerLock();
  resultScreen.classList.remove("hidden");
  resultTitle.className = "title " + (winner === teamLocalTeam ? "win" : "fail");
  resultTitle.textContent = winner === teamLocalTeam ? "己方阵营获胜" : "己方阵营战败";
  resultSummary.textContent = reason || (
    "红方 " + teamRedScore + "　·　蓝方 " + teamBlueScore
  );
  resultPrompt.textContent = winner + "方率先完成一百次击杀";
  if (teamNetworkRole === "offline") {
    resultActionButton.classList.remove("hidden");
    resultActionButton.textContent = "使用当前设置再战一局";
  } else {
    resultActionButton.classList.add("hidden");
  }
  if (teamNetworkRole === "host" && !remote) teamBroadcastSnapshot();
}

function restartOfflineTeamBattle() {
  if (!teamCurrentConfig) return;
  startTeamBattle("offline", teamCurrentConfig, [{
    id: "offline-player",
    name: teamLocalPlayerName,
    team: teamLocalTeam
  }]);
}

function updateTeamMode(delta) {
  if (selectedMode !== "团队") return;
  if (gameState === "战斗") {
    updateTeamRespawns();
    updateTeamBots(delta);
    const now = teamNow();
    for (const actor of enemies) {
      if (!actor.isTeamActor) continue;
      actor.muzzleTimer -= delta;
      if (actor.muzzleTimer <= 0) actor.muzzleFlash.visible = false;
      actor.shield.visible = actor.alive && now < actor.invulnerableUntil;
    }

    teamPlayerStateTimer -= delta;
    if (teamNetworkRole === "guest" && teamPlayerStateTimer <= 0) {
      teamSendGame({ type: "playerState", state: teamSerializeLocalPlayer() });
      teamPlayerStateTimer = TEAM_PLAYER_STATE_INTERVAL;
    }
    teamSnapshotTimer -= delta;
    if (teamNetworkRole === "host" && teamSnapshotTimer <= 0) {
      teamBroadcastSnapshot();
      teamSnapshotTimer = TEAM_SNAPSHOT_INTERVAL;
    }
  }
  updateTeamHud(false, delta);
}

function isTeamLocalPlayerActive() {
  return selectedMode !== "团队" || teamLocalAlive;
}

function canLocalPlayerDamageActor(actor) {
  return selectedMode !== "团队" || (
    teamLocalAlive &&
    actor &&
    actor.team !== teamLocalTeam
  );
}

function showTeamLobby() {
  modeScreen.classList.add("hidden");
  armoryScreen.classList.add("hidden");
  endlessMapScreen.classList.add("hidden");
  teamLobbyScreen.classList.remove("hidden");
}

function hideTeamModeUi() {
  teamLobbyScreen.classList.add("hidden");
  teamScoreboard.classList.add("hidden");
  teamRespawnOverlay.classList.add("hidden");
}

function initializeTeamMode() {
  const savedServer = localStorage.getItem("ironBreakoutTeamServer");
  const savedName = localStorage.getItem("ironBreakoutPlayerName");
  if (savedServer) teamServerUrlInput.value = savedServer;
  if (savedName) teamPlayerNameInput.value = savedName;

  document.getElementById("teamModeButton").addEventListener("click", showTeamLobby);
  document.getElementById("backFromTeamButton").addEventListener("click", function () {
    teamCloseSocket();
    teamLobbyScreen.classList.add("hidden");
    modeScreen.classList.remove("hidden");
  });
  document.getElementById("teamOfflineStartButton").addEventListener("click", function () {
    localStorage.setItem("ironBreakoutPlayerName", teamSanitizeName(teamPlayerNameInput.value));
    startOfflineTeamBattle();
  });
  document.getElementById("teamCreateRoomButton").addEventListener("click", function () {
    teamCloseSocket();
    teamConnectSocket().then(function (socket) {
      socket.send(JSON.stringify({
        type: "create",
        name: teamSanitizeName(teamPlayerNameInput.value),
        password: teamRoomPasswordInput.value,
        team: teamSideSelect.value,
        mapIndex: Number(teamMapSelect.value) || 0,
        difficulty: teamDifficultySelect.value
      }));
    }).catch(function () { /* 状态已显示 */ });
  });
  document.getElementById("teamJoinRoomButton").addEventListener("click", function () {
    const roomCode = teamRoomCodeInput.value.trim().toUpperCase();
    if (roomCode.length !== 6) {
      teamConnectionStatus.textContent = "请输入六位房间码";
      return;
    }
    teamCloseSocket();
    teamConnectSocket().then(function (socket) {
      socket.send(JSON.stringify({
        type: "join",
        roomCode: roomCode,
        name: teamSanitizeName(teamPlayerNameInput.value),
        password: teamRoomPasswordInput.value,
        team: teamSideSelect.value
      }));
    }).catch(function () { /* 状态已显示 */ });
  });
  teamHostStartButton.addEventListener("click", function () {
    if (!teamSocket || teamSocket.readyState !== WebSocket.OPEN) return;
    teamSendLobbyUpdate();
    teamSocket.send(JSON.stringify({ type: "start" }));
  });
  for (const control of [
    teamPlayerNameInput,
    teamSideSelect,
    teamMapSelect,
    teamDifficultySelect
  ]) {
    control.addEventListener("change", function () {
      localStorage.setItem("ironBreakoutPlayerName", teamSanitizeName(teamPlayerNameInput.value));
      teamSendLobbyUpdate();
    });
  }
  teamRoomCodeInput.addEventListener("input", function () {
    teamRoomCodeInput.value = teamRoomCodeInput.value
      .replace(/[^a-z0-9]/gi, "")
      .toUpperCase();
  });
}

initializeTeamMode();
