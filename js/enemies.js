"use strict";

// -----------------------------------------------------------------------
// 敌人模型、难度曲线与生成逻辑
// -----------------------------------------------------------------------
const enemyBodyGeometry = new THREE.BoxGeometry(0.62, 0.78, 0.36);
const enemyHeadGeometry = new THREE.BoxGeometry(0.42, 0.42, 0.42);
const enemyLimbGeometry = new THREE.BoxGeometry(0.2, 0.68, 0.22);
const enemyArmGeometry = new THREE.BoxGeometry(0.18, 0.72, 0.2);
const enemyEyeGeometry = new THREE.BoxGeometry(0.055, 0.055, 0.025);
const enemyGunBodyGeometry = new THREE.BoxGeometry(0.16, 0.14, 0.5);
const enemyGunStockGeometry = new THREE.BoxGeometry(0.14, 0.17, 0.24);
const enemyGunBarrelGeometry = new THREE.CylinderGeometry(0.025, 0.03, 0.4, 8);
const enemyMuzzleGeometry = new THREE.OctahedronGeometry(0.1, 0);

const enemyBodyMaterial = new THREE.MeshStandardMaterial({
  color: 0xa02727,
  roughness: 0.73
});

const enemyLimbMaterial = new THREE.MeshStandardMaterial({
  color: 0x292f34,
  roughness: 0.86
});

const enemySkinMaterial = new THREE.MeshStandardMaterial({
  color: 0xb98466,
  roughness: 0.9
});

const enemyEyeMaterial = new THREE.MeshBasicMaterial({ color: 0xff2c1f });
const enemyMuzzleMaterial = new THREE.MeshBasicMaterial({
  color: 0xffb23e,
  transparent: true,
  opacity: 1,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});

const enemyRaycaster = new THREE.Raycaster();
const enemyShotOrigin = new THREE.Vector3();
const enemySightOrigin = new THREE.Vector3();
const enemyShotTarget = new THREE.Vector3();
const enemyShotDirection = new THREE.Vector3();

function getDifficultyStats() {
  if (selectedMode === "无尽") {
    const tier = 1 + Math.floor(score / 800);
    return {
      tier: tier,
      health: 88 + (tier - 1) * 17,
      speed: Math.min(4.4, 1.85 + (tier - 1) * 0.17),
      damage: 11 + (tier - 1) * 1.65,
      shotDamage: 5.5 + (tier - 1) * 0.65,
      fireInterval: Math.max(0.52, 1.45 - (tier - 1) * 0.045),
      accuracy: Math.min(0.84, 0.46 + (tier - 1) * 0.022),
      shootRange: Math.min(38, 23 + (tier - 1) * 0.7),
      detection: Math.min(31, 17 + (tier - 1) * 0.8),
      maxActive: Math.min(24, 8 + Math.floor((tier - 1) / 2)),
      respawnDelay: Math.max(0.45, 1.8 - (tier - 1) * 0.07)
    };
  }

  return {
    tier: currentLevel,
    health: 90 + (currentLevel - 1) * 24,
    speed: 1.75 + (currentLevel - 1) * 0.27,
    damage: 10 + (currentLevel - 1) * 2.7,
    shotDamage: 5 + (currentLevel - 1) * 1.15,
    fireInterval: Math.max(0.68, 1.55 - (currentLevel - 1) * 0.17),
    accuracy: 0.43 + (currentLevel - 1) * 0.075,
    shootRange: 22 + (currentLevel - 1) * 2.5,
    detection: 16 + (currentLevel - 1) * 2,
    maxActive: 8 + currentLevel,
    respawnDelay: Math.max(0.55, 1.35 - currentLevel * 0.12)
  };
}

function randomPatrolPoint() {
  for (let attempt = 0; attempt < 40; attempt++) {
    if (spawnPoints.length > 0) {
      const point = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
      if (!collidesAt(point.x, point.z, 0.65, 0, 1.8)) {
        return point.clone();
      }
    }
  }
  return spawnPoints.length > 0
    ? spawnPoints[0].clone()
    : findNearestSafePosition(
        new THREE.Vector3(playerStart.x, 0, playerStart.z),
        0.65,
        1.8
      );
}

function chooseSpawnPoint() {
  let fallback = spawnPoints[0] || new THREE.Vector3(0, 0, -28);

  for (let attempt = 0; attempt < 60; attempt++) {
    const point = spawnPoints[Math.floor(Math.random() * spawnPoints.length)] || fallback;
    if (point.distanceTo(player.position) < 10) continue;

    let tooClose = false;
    for (const enemy of enemies) {
      if (enemy.alive && enemy.group.position.distanceTo(point) < 2.2) {
        tooClose = true;
        break;
      }
    }

    if (!tooClose && !collidesAt(point.x, point.z, 0.6, 0, 1.8)) {
      return point.clone();
    }
    fallback = point;
  }

  return fallback.clone();
}

function createEnemy() {
  const stats = getDifficultyStats();
  const spawn = chooseSpawnPoint();

  const enemy = {
    group: new THREE.Group(),
    hitMeshes: [],
    health: stats.health,
    alive: true,
    radius: 0.43,
    patrolTarget: randomPatrolPoint(),
    detectionRange: stats.detection,
    attackRange: 1.55,
    speed: stats.speed,
    damage: stats.damage,
    shotDamage: stats.shotDamage,
    fireInterval: stats.fireInterval,
    accuracy: stats.accuracy,
    shootRange: stats.shootRange,
    shotCooldown: THREE.MathUtils.randFloat(0.8, 1.8),
    muzzleTimer: 0,
    visionTimer: Math.random() * 0.2,
    hasLineOfSight: false,
    blockedTime: 0,
    avoidTimer: 0,
    avoidDirection: new THREE.Vector3(),
    walkPhase: Math.random() * Math.PI * 2
  };

  enemy.group.position.copy(spawn);
  resolveCirclePenetration(enemy.group.position, enemy.radius, 1.85);

  function addEnemyPart(geometry, material, x, y, z) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.enemy = enemy;
    enemy.group.add(mesh);
    enemy.hitMeshes.push(mesh);
    return mesh;
  }

  enemy.body = addEnemyPart(enemyBodyGeometry, enemyBodyMaterial, 0, 1.17, 0);
  enemy.head = addEnemyPart(enemyHeadGeometry, enemySkinMaterial, 0, 1.82, 0);
  enemy.leftLeg = addEnemyPart(enemyLimbGeometry, enemyLimbMaterial, -0.18, 0.4, 0);
  enemy.rightLeg = addEnemyPart(enemyLimbGeometry, enemyLimbMaterial, 0.18, 0.4, 0);
  enemy.leftArm = addEnemyPart(enemyArmGeometry, enemyLimbMaterial, -0.42, 1.18, 0);
  enemy.rightArm = addEnemyPart(enemyArmGeometry, enemyLimbMaterial, 0.42, 1.18, 0);
  enemy.leftArm.rotation.x = -0.9;
  enemy.rightArm.rotation.x = -0.9;

  for (const eyeX of [-0.11, 0.11]) {
    const eye = new THREE.Mesh(
      enemyEyeGeometry,
      enemyEyeMaterial
    );
    eye.position.set(eyeX, 1.86, -0.218);
    eye.userData.enemy = enemy;
    enemy.group.add(eye);
    enemy.hitMeshes.push(eye);
  }

  // 敌人枪支与玩家武器一样由基础几何体拼接，不使用外部资源。
  enemy.gunBody = addEnemyPart(
    enemyGunBodyGeometry,
    metalMaterial,
    0,
    1.32,
    -0.38
  );
  enemy.gunStock = addEnemyPart(
    enemyGunStockGeometry,
    woodMaterial,
    0,
    1.31,
    -0.04
  );
  enemy.gunBarrel = addEnemyPart(
    enemyGunBarrelGeometry,
    metalMaterial,
    0,
    1.33,
    -0.78
  );
  enemy.gunBarrel.rotation.x = Math.PI / 2;

  enemy.muzzleFlash = new THREE.Mesh(enemyMuzzleGeometry, enemyMuzzleMaterial);
  enemy.muzzleFlash.position.set(0, 1.33, -1.02);
  enemy.muzzleFlash.scale.set(0.65, 0.65, 2.1);
  enemy.muzzleFlash.visible = false;
  enemy.group.add(enemy.muzzleFlash);

  enemy.muzzleLight = new THREE.PointLight(0xff982f, 0, 3.5, 2);
  enemy.muzzleLight.position.copy(enemy.muzzleFlash.position);
  enemy.group.add(enemy.muzzleLight);

  scene.add(enemy.group);
  enemies.push(enemy);

  if (selectedMode === "关卡") {
    levelSpawned++;
  }

  updateGameInfo();
  return enemy;
}

function livingEnemyCount() {
  let count = 0;
  for (const enemy of enemies) {
    if (enemy.alive) count++;
  }
  return count;
}

function scheduleRespawn(delay) {
  respawnTimers.push(performance.now() / 1000 + delay);
}

function maintainEnemyPopulation() {
  if (gameState !== "战斗") return;

  const now = performance.now() / 1000;

  for (let i = respawnTimers.length - 1; i >= 0; i--) {
    if (respawnTimers[i] <= now) {
      if (selectedMode === "关卡" && levelSpawned >= LEVEL_ENEMY_TOTAL) {
        respawnTimers.splice(i, 1);
        continue;
      }

      createEnemy();
      respawnTimers.splice(i, 1);
    }
  }

  const stats = getDifficultyStats();
  const alive = livingEnemyCount();
  const scheduled = respawnTimers.length;

  if (selectedMode === "无尽") {
    let missing = stats.maxActive - alive - scheduled;
    while (missing > 0) {
      scheduleRespawn(Math.random() * 0.7 + 0.25);
      missing--;
    }
  } else {
    const remainingTotal = LEVEL_ENEMY_TOTAL - levelKills;
    const desiredAlive = Math.min(stats.maxActive, remainingTotal);
    let missing = desiredAlive - alive - scheduled;

    while (
      missing > 0 &&
      levelSpawned + respawnTimers.length < LEVEL_ENEMY_TOTAL
    ) {
      scheduleRespawn(stats.respawnDelay + Math.random() * 0.45);
      missing--;
    }
  }
}

function enemyRayPathIsClear(origin, target) {
  enemyShotDirection.subVectors(target, origin);
  const sightDistance = enemyShotDirection.length();
  if (sightDistance <= 0.05) return true;
  enemyShotDirection.normalize();

  enemyRaycaster.set(origin, enemyShotDirection);
  enemyRaycaster.near = 0.015;
  enemyRaycaster.far = Math.max(0.02, sightDistance - 0.035);

  const blockers = enemyRaycaster.intersectObjects(raycastWorld, false);
  return blockers.length === 0;
}

function enemyCanSeePlayer(enemy, distanceToPlayer) {
  if (collidesAt(
    enemy.group.position.x,
    enemy.group.position.z,
    enemy.radius,
    enemy.group.position.y,
    1.85
  )) {
    return false;
  }

  // 先从敌人身体中心检测，避免伸入薄墙另一侧的枪口绕过墙体。
  enemy.group.updateMatrixWorld(true);
  enemySightOrigin.set(
    enemy.group.position.x,
    enemy.group.position.y + 1.42,
    enemy.group.position.z
  );
  enemyShotTarget.copy(camera.position);
  if (!enemyRayPathIsClear(enemySightOrigin, enemyShotTarget)) return false;

  // 再检查枪口到玩家的真实弹道，门框、立柱和靠近玩家的薄墙都能挡弹。
  enemy.muzzleFlash.getWorldPosition(enemyShotOrigin);
  if (pointInsideWorldCollider(enemyShotOrigin, 0.008)) return false;
  if (!enemyRayPathIsClear(enemyShotOrigin, enemyShotTarget)) return false;

  return true;
}

function enemyShoot(enemy, distanceToPlayer) {
  // 开火瞬间再次检查遮挡，避免敌人在视线缓存间隔内隔墙命中。
  if (!enemyCanSeePlayer(enemy, distanceToPlayer)) {
    enemy.hasLineOfSight = false;
    enemy.shotCooldown = 0.22;
    return;
  }

  enemy.group.updateMatrixWorld(true);
  enemy.muzzleFlash.getWorldPosition(enemyShotOrigin);
  enemyShotTarget.copy(camera.position);
  enemyShotDirection.subVectors(enemyShotTarget, enemyShotOrigin).normalize();

  enemy.muzzleFlash.visible = true;
  enemy.muzzleFlash.rotation.z = Math.random() * Math.PI;
  enemy.muzzleLight.intensity = 7;
  enemy.muzzleTimer = 0.065;
  enemy.shotCooldown = enemy.fireInterval * THREE.MathUtils.randFloat(0.86, 1.18);

  const distancePenalty = Math.min(
    0.36,
    distanceToPlayer / enemy.shootRange * 0.36
  );
  const hitChance = enemy.accuracy * (1 - distancePenalty);

  if (Math.random() < hitChance) {
    damagePlayer(enemy.shotDamage);
    return;
  }

  // 未命中时让子弹产生少量散布，并在命中的建筑表面生成火花。
  const spread = 0.055 + (1 - enemy.accuracy) * 0.09;
  enemyShotDirection.x += THREE.MathUtils.randFloatSpread(spread);
  enemyShotDirection.y += THREE.MathUtils.randFloatSpread(spread * 0.7);
  enemyShotDirection.z += THREE.MathUtils.randFloatSpread(spread);
  enemyShotDirection.normalize();

  enemyRaycaster.set(enemyShotOrigin, enemyShotDirection);
  enemyRaycaster.near = 0.08;
  enemyRaycaster.far = enemy.shootRange;
  const misses = enemyRaycaster.intersectObjects(raycastWorld, false);

  if (misses.length > 0) {
    const hit = misses[0];
    const normal = hit.face
      ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld)
      : new THREE.Vector3(0, 1, 0);
    spawnImpact(hit.point, normal, false);
  }
}

function updateEnemyAI(delta) {
  if (
    gameState !== "战斗" ||
    document.pointerLockElement !== renderer.domElement
  ) {
    return;
  }

  for (const enemy of enemies) {
    if (!enemy.alive) continue;

    resolveCirclePenetration(enemy.group.position, enemy.radius, 1.85);
    if (collidesAt(
      enemy.group.position.x,
      enemy.group.position.z,
      enemy.radius,
      enemy.group.position.y,
      1.85
    )) {
      enemy.group.position.copy(chooseSpawnPoint());
      enemy.patrolTarget.copy(randomPatrolPoint());
      enemy.hasLineOfSight = false;
      enemy.shotCooldown = Math.max(enemy.shotCooldown, 0.8);
    }

    const distanceToPlayer = enemy.group.position.distanceTo(player.position);
    const chasing = distanceToPlayer < enemy.detectionRange;
    const target = chasing ? player.position : enemy.patrolTarget;

    enemy.muzzleTimer -= delta;
    if (enemy.muzzleTimer <= 0) {
      enemy.muzzleFlash.visible = false;
      enemy.muzzleLight.intensity = 0;
    }

    enemy.shotCooldown -= delta;
    enemy.visionTimer -= delta;
    if (enemy.visionTimer <= 0) {
      enemy.hasLineOfSight =
        chasing &&
        distanceToPlayer <= enemy.shootRange &&
        enemyCanSeePlayer(enemy, distanceToPlayer);
      enemy.visionTimer = THREE.MathUtils.randFloat(0.16, 0.27);
    }
    const canShoot =
      chasing &&
      distanceToPlayer <= enemy.shootRange &&
      enemy.hasLineOfSight;

    tempVector.subVectors(target, enemy.group.position);
    tempVector.y = 0;
    const distanceToTarget = tempVector.length();

    if (!chasing && distanceToTarget < 0.8) {
      enemy.patrolTarget.copy(randomPatrolPoint());
      continue;
    }

    if (distanceToTarget > 0.001) {
      tempVector.normalize();

      if (chasing && enemy.avoidTimer > 0) {
        enemy.avoidTimer -= delta;
        tempVector.copy(enemy.avoidDirection);
      }

      const speed = chasing
        ? (canShoot && distanceToPlayer < 14 ? enemy.speed * 0.14 : enemy.speed)
        : enemy.speed * 0.48;
      const step = speed * delta;

      const moved = moveWithCollisions(
        enemy.group.position,
        tempVector.x * step,
        tempVector.z * step,
        enemy.radius,
        1.85
      );

      if (!moved) {
        enemy.blockedTime += delta;
        const avoidSide = Math.random() < 0.5 ? 1 : -1;
        enemy.avoidDirection.set(
          -tempVector.z * avoidSide,
          0,
          tempVector.x * avoidSide
        ).normalize();
        enemy.avoidTimer = 0.9 + Math.random() * 0.8;
        if (enemy.blockedTime > 0.65) {
          enemy.patrolTarget.copy(randomPatrolPoint());
          enemy.blockedTime = 0;
        }
      } else {
        enemy.blockedTime = 0;
      }

      enemy.group.rotation.y = canShoot
        ? Math.atan2(
            -(player.position.x - enemy.group.position.x),
            -(player.position.z - enemy.group.position.z)
          )
        : Math.atan2(-tempVector.x, -tempVector.z);
      enemy.walkPhase += delta * (chasing ? 8.5 : 5);
      const swing = Math.sin(enemy.walkPhase) * 0.5;
      enemy.leftLeg.rotation.x = swing;
      enemy.rightLeg.rotation.x = -swing;
      enemy.leftArm.rotation.x = -0.9 - swing * 0.1;
      enemy.rightArm.rotation.x = -0.9 + swing * 0.1;
    }

    if (canShoot && enemy.shotCooldown <= 0) {
      enemyShoot(enemy, distanceToPlayer);
    }

    if (distanceToPlayer < enemy.attackRange) {
      damagePlayer(enemy.damage * delta);
    }
  }
}
