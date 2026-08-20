"use strict";

// -----------------------------------------------------------------------
// 射击、命中特效和击杀结算
// -----------------------------------------------------------------------
const IMPACT_PARTICLE_COUNT = 8;
const IMPACT_EFFECT_POOL_SIZE = 20;

// 命中特效使用固定对象池：开枪时不再临时创建 8 个网格、材质和点光源。
// 动态增删点光源会让大量 MeshStandardMaterial 重新编译着色器，是原先
// “子弹刚命中就卡一下”的主要原因之一。
function initializeImpactEffectPool() {
  for (let poolIndex = 0; poolIndex < IMPACT_EFFECT_POOL_SIZE; poolIndex++) {
    const positions = new Float32Array(IMPACT_PARTICLE_COUNT * 3);
    const velocities = new Float32Array(IMPACT_PARTICLE_COUNT * 3);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage)
    );
    const material = new THREE.PointsMaterial({
      color: 0xffc24a,
      size: 0.105,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const points = new THREE.Points(geometry, material);
    points.visible = false;
    points.frustumCulled = false;
    scene.add(points);

    effects.push({
      active: false,
      points: points,
      geometry: geometry,
      material: material,
      positions: positions,
      velocities: velocities,
      age: 0,
      lifetime: 0.34
    });
  }
}

function spawnImpact(position, normal, hitEnemy, colorOverride) {
  let effect = null;
  for (const candidate of effects) {
    if (!candidate.active) {
      effect = candidate;
      break;
    }
  }

  // 极端连续爆炸超过池容量时复用最老特效，避免任何运行时分配。
  if (!effect) {
    effect = effects[0];
    for (const candidate of effects) {
      if (candidate.age > effect.age) effect = candidate;
    }
  }

  effect.active = true;
  effect.age = 0;
  effect.material.color.setHex(
    colorOverride === undefined
      ? (hitEnemy ? 0xff4a24 : 0xffc24a)
      : colorOverride
  );
  effect.material.opacity = 1;
  effect.material.size = hitEnemy ? 0.12 : 0.105;
  effect.points.position.copy(position).addScaledVector(normal, 0.025);
  effect.points.visible = true;
  effect.positions.fill(0);

  for (let i = 0; i < IMPACT_PARTICLE_COUNT; i++) {
    const offset = i * 3;
    let directionX = THREE.MathUtils.randFloatSpread(1) + normal.x * 1.4;
    let directionY = Math.random() * 0.85 + normal.y * 1.4;
    let directionZ = THREE.MathUtils.randFloatSpread(1) + normal.z * 1.4;
    const inverseLength = 1 / Math.max(
      0.0001,
      Math.hypot(directionX, directionY, directionZ)
    );
    const speed = THREE.MathUtils.randFloat(1.8, 5);
    directionX *= inverseLength * speed;
    directionY *= inverseLength * speed;
    directionZ *= inverseLength * speed;
    effect.velocities[offset] = directionX;
    effect.velocities[offset + 1] = directionY;
    effect.velocities[offset + 2] = directionZ;
  }

  effect.geometry.attributes.position.needsUpdate = true;
}

function clearImpactEffects() {
  for (const effect of effects) {
    effect.active = false;
    effect.points.visible = false;
    effect.material.opacity = 0;
  }
}

function setImpactEffectsCompileVisible(visible) {
  // 只需预编译一个 PointsMaterial；其余池成员使用相同着色器程序。
  if (effects.length <= 0 || effects[0].active) return;
  effects[0].points.visible = visible;
  effects[0].material.opacity = 0;
}

function updateEffects(delta) {
  for (const effect of effects) {
    if (!effect.active) continue;
    effect.age += delta;
    const life = Math.max(0, 1 - effect.age / effect.lifetime);

    for (let i = 0; i < IMPACT_PARTICLE_COUNT; i++) {
      const offset = i * 3;
      effect.positions[offset] += effect.velocities[offset] * delta;
      effect.positions[offset + 1] += effect.velocities[offset + 1] * delta;
      effect.positions[offset + 2] += effect.velocities[offset + 2] * delta;
      effect.velocities[offset + 1] -= 8 * delta;
    }

    effect.geometry.attributes.position.needsUpdate = true;
    effect.material.opacity = life;

    if (effect.age >= effect.lifetime) {
      effect.active = false;
      effect.points.visible = false;
      effect.material.opacity = 0;
    }
  }
}

initializeImpactEffectPool();

function findEnemyFromObject(object) {
  let current = object;
  while (current) {
    if (current.userData && current.userData.enemy) {
      return current.userData.enemy;
    }
    current = current.parent;
  }
  return null;
}

const projectileRaycaster = new THREE.Raycaster();
const projectileDirection = new THREE.Vector3();
const projectileStep = new THREE.Vector3();
const projectileTargets = [];
const projectileHits = [];
const playerShotEnemyTargets = [];
const playerShotWorldHits = [];
const playerShotEnemyHits = [];
const playerAimPoint = new THREE.Vector2(0, 0);
const shotWorldNormal = new THREE.Vector3();
const playerShotDirection = new THREE.Vector3();
const playerShotRight = new THREE.Vector3();
const playerShotUp = new THREE.Vector3();
const playerShotOrigin = new THREE.Vector3();
const projectileMetalMaterial = new THREE.MeshStandardMaterial({
  color: 0xc9d3d8, roughness: 0.28, metalness: 0.82
});
const rocketBodyMaterial = new THREE.MeshStandardMaterial({
  color: 0x4c6550, roughness: 0.58, metalness: 0.38
});
const rocketFlameMaterial = new THREE.MeshBasicMaterial({
  color: 0xff7a24,
  transparent: true,
  opacity: 0.92,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});
const grenadeBodyMaterial = new THREE.MeshStandardMaterial({
  color: 0x687545, roughness: 0.55, metalness: 0.42
});

function damageEnemy(enemy, amount) {
  if (!enemy || !enemy.alive) return;
  if (selectedMode === "团队" && enemy.isTeamActor) {
    damageTeamActor(enemy, amount, teamLocalTeam);
    return;
  }
  enemy.health -= amount;
  hitFlash = 0.12;
  if (enemy.health <= 0) killEnemy(enemy);
}

function applyEnemySlow(enemy, duration, factor) {
  if (!enemy || !enemy.alive) return;
  enemy.slowTimer = Math.max(enemy.slowTimer || 0, duration);
  enemy.slowFactor = Math.min(enemy.slowFactor || 1, factor);
}

function createPlayerProjectile(kind, profile) {
  camera.updateMatrixWorld(true);
  const direction = camera.getWorldDirection(new THREE.Vector3()).normalize();
  const group = new THREE.Group();
  const isGrenade = kind === "grenade";
  const speed = isGrenade ? 15 : 17;
  const lifetime = isGrenade ? 4 : 6.5;

  if (isGrenade) {
    const body = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 10, 7),
      grenadeBodyMaterial
    );
    body.scale.z = 1.25;
    group.add(body);
    for (const z of [-0.11, 0.11]) {
      const band = new THREE.Mesh(
        new THREE.TorusGeometry(0.13, 0.018, 6, 12),
        projectileMetalMaterial
      );
      band.position.z = z;
      group.add(band);
    }
  } else {
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.085, 0.085, 0.72, 10),
      rocketBodyMaterial
    );
    body.rotation.x = Math.PI / 2;
    group.add(body);
    const nose = new THREE.Mesh(
      new THREE.ConeGeometry(0.09, 0.22, 10),
      projectileMetalMaterial
    );
    nose.rotation.x = -Math.PI / 2;
    nose.position.z = -0.45;
    group.add(nose);
    // 使用自发光几何体代替运行时增删 PointLight，避免着色器重新编译。
    const flame = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 7, 5),
      rocketFlameMaterial
    );
    flame.position.z = 0.38;
    flame.scale.z = 1.8;
    group.add(flame);
  }

  group.quaternion.copy(camera.quaternion);
  group.position.copy(camera.position).addScaledVector(direction, 0.72);
  scene.add(group);
  const velocity = direction.multiplyScalar(speed);
  if (isGrenade) velocity.y += 4.2;
  playerProjectiles.push({
    kind: kind,
    group: group,
    velocity: velocity,
    damage: profile.damage,
    lifetime: lifetime,
    gravity: isGrenade ? 12 : 0,
    blastRadius: profile.blastRadius || (isGrenade ? 4.6 : 5.2)
  });
}

function removePlayerProjectile(projectile) {
  projectile.group.traverse(function (object) {
    if (object.geometry) object.geometry.dispose();
  });
  scene.remove(projectile.group);
  const index = playerProjectiles.indexOf(projectile);
  if (index >= 0) playerProjectiles.splice(index, 1);
}

function explodePlayerProjectile(position, baseDamage, radius, color) {
  // 从多个方向喷发既能照亮爆心，也沿用现有的火花粒子系统。
  for (let i = 0; i < 6; i++) {
    const normal = new THREE.Vector3(
      THREE.MathUtils.randFloatSpread(1),
      Math.random() * 0.9 + 0.15,
      THREE.MathUtils.randFloatSpread(1)
    ).normalize();
    spawnImpact(position, normal, false, color);
  }

  for (const enemy of enemies.slice()) {
    if (!enemy.alive) continue;
    const enemyCenter = enemy.group.position.clone();
    enemyCenter.y += 1;
    const distance = enemyCenter.distanceTo(position);
    if (distance <= radius) {
      const falloff = THREE.MathUtils.clamp(1 - distance / radius, 0.25, 1);
      damageEnemy(enemy, baseDamage * falloff);
    }
  }
  cameraShake = Math.min(0.07, cameraShake + 0.045);
}

function explodeRocket(position, baseDamage, radius) {
  explodePlayerProjectile(position, baseDamage, radius || 5.2, 0xff9b35);
}

function explodeGrenade(position, baseDamage, radius) {
  explodePlayerProjectile(position, baseDamage, radius || 4.6, 0xd7ff62);
}

function updatePlayerProjectiles(delta) {
  if (gameState !== "战斗") return;
  for (const projectile of playerProjectiles.slice()) {
    projectile.lifetime -= delta;
    if (projectile.lifetime <= 0) {
      if (projectile.kind === "rocket") {
        explodeRocket(
          projectile.group.position.clone(),
          projectile.damage,
          projectile.blastRadius
        );
      } else if (projectile.kind === "grenade") {
        explodeGrenade(
          projectile.group.position.clone(),
          projectile.damage,
          projectile.blastRadius
        );
      }
      removePlayerProjectile(projectile);
      continue;
    }

    if (projectile.gravity > 0) projectile.velocity.y -= projectile.gravity * delta;
    projectileStep.copy(projectile.velocity).multiplyScalar(delta);
    const travelDistance = projectileStep.length();
    projectileDirection.copy(projectile.velocity).normalize();
    projectileRaycaster.set(projectile.group.position, projectileDirection);
    projectileRaycaster.near = 0;
    projectileRaycaster.far = travelDistance + 0.08;

    projectileTargets.length = 0;
    projectileTargets.push.apply(projectileTargets, raycastWorld);
    for (const enemy of enemies) {
      if (enemy.alive && canLocalPlayerDamageActor(enemy)) {
        projectileTargets.push.apply(projectileTargets, enemy.hitMeshes);
      }
    }
    projectileHits.length = 0;
    projectileRaycaster.intersectObjects(
      projectileTargets,
      false,
      projectileHits
    );

    if (projectileHits.length > 0) {
      const hit = projectileHits[0];
      const enemy = findEnemyFromObject(hit.object);
      const normal = hit.face
        ? shotWorldNormal.copy(hit.face.normal).transformDirection(hit.object.matrixWorld)
        : shotWorldNormal.set(0, 1, 0);

      if (projectile.kind === "rocket") {
        explodeRocket(hit.point, projectile.damage, projectile.blastRadius);
      } else if (projectile.kind === "grenade") {
        explodeGrenade(hit.point, projectile.damage, projectile.blastRadius);
      } else {
        spawnImpact(hit.point, normal, Boolean(enemy && enemy.alive));
        if (enemy && enemy.alive) damageEnemy(enemy, projectile.damage);
      }
      removePlayerProjectile(projectile);
      continue;
    }

    projectile.group.position.add(projectileStep);
    if (projectile.kind === "rocket") {
      projectile.group.rotation.z += delta * 6;
    } else if (projectile.kind === "grenade") {
      projectile.group.rotation.x += delta * 8;
      projectile.group.rotation.y += delta * 5;
    }
  }
}

function firePlayerRay(origin, direction, profile, impactColor) {
  raycaster.set(origin, direction);
  raycaster.near = 0;
  raycaster.far = profile.range;
  playerShotWorldHits.length = 0;
  raycaster.intersectObjects(raycastWorld, false, playerShotWorldHits);

  playerShotEnemyTargets.length = 0;
  for (const enemy of enemies) {
    if (enemy.alive && canLocalPlayerDamageActor(enemy)) {
      playerShotEnemyTargets.push.apply(playerShotEnemyTargets, enemy.hitMeshes);
    }
  }
  playerShotEnemyHits.length = 0;
  raycaster.intersectObjects(
    playerShotEnemyTargets,
    false,
    playerShotEnemyHits
  );

  const worldHit = playerShotWorldHits[0] || null;
  const enemyHit = playerShotEnemyHits[0] || null;
  const hit = !worldHit
    ? enemyHit
    : !enemyHit
      ? worldHit
      : enemyHit.distance < worldHit.distance ? enemyHit : worldHit;
  if (!hit) return null;

  const enemy = findEnemyFromObject(hit.object);
  const worldNormal = hit.face
    ? shotWorldNormal.copy(hit.face.normal).transformDirection(hit.object.matrixWorld)
    : shotWorldNormal.set(0, 1, 0);
  spawnImpact(
    hit.point,
    worldNormal,
    Boolean(enemy && enemy.alive),
    impactColor
  );

  if (enemy && enemy.alive) {
    damageEnemy(enemy, profile.damage);
    if (profile.type === "taser" && enemy.alive) {
      applyEnemySlow(enemy, 3, 0.45);
    }
  }
  return hit;
}

function shoot() {
  if (
    gameState !== "战斗" ||
    document.pointerLockElement !== renderer.domElement ||
    !isTeamLocalPlayerActive()
  ) {
    return;
  }

  const profile = weaponProfiles[currentWeapon];
  if (reloadingWeapon) return;
  const ammo = getWeaponAmmo(currentWeapon);
  if (profile.usesAmmo && ammo.magazine <= 0) {
    if (!startReload(true)) {
      const emptyNoticeTime = performance.now() / 1000;
      if (emptyNoticeTime - lastEmptyAmmoNotice > 1.2) {
        showPickupNotice("弹药耗尽：寻找蓝色弹药包");
        lastEmptyAmmoNotice = emptyNoticeTime;
      }
    }
    return;
  }
  const now = performance.now() / 1000;
  if (now - lastShotTime < profile.cooldown) return;
  lastShotTime = now;

  if (profile.usesAmmo) {
    ammo.magazine--;
    updateAmmoUI();
    if (ammo.magazine <= 0 && ammo.reserve > 0) startReload(false);
  }

  muzzleTimer = 0.055;
  muzzleFlash.visible = profile.flash;
  muzzleFlash.rotation.z = Math.random() * Math.PI;
  muzzleFlash.scale.set(
    THREE.MathUtils.randFloat(0.55, 0.85),
    THREE.MathUtils.randFloat(0.55, 0.85),
    THREE.MathUtils.randFloat(2.2, 3.1)
  );
  muzzleLight.intensity = profile.flash ? 10 : 0;
  weaponRecoil = Math.min(0.22, weaponRecoil + profile.recoil);
  cameraShake = Math.min(0.055, cameraShake + profile.shake);
  player.pitch = Math.min(
    Math.PI / 2 - 0.03,
    player.pitch + THREE.MathUtils.randFloat(0.002, profile.shake * 0.48 + 0.003)
  );

  if (profile.type === "rocket" || profile.type === "grenade") {
    createPlayerProjectile(profile.type, profile);
    return;
  }

  camera.updateMatrixWorld(true);
  playerShotOrigin.copy(camera.position);
  camera.getWorldDirection(playerShotDirection).normalize();

  if (profile.type === "shotgun") {
    playerShotRight.set(1, 0, 0).applyQuaternion(camera.quaternion);
    playerShotUp.set(0, 1, 0).applyQuaternion(camera.quaternion);
    for (let pellet = 0; pellet < profile.pellets; pellet++) {
      const pelletDirection = tempVector3
        .copy(playerShotDirection)
        .addScaledVector(
          playerShotRight,
          THREE.MathUtils.randFloatSpread(profile.spread)
        )
        .addScaledVector(
          playerShotUp,
          THREE.MathUtils.randFloatSpread(profile.spread)
        )
        .normalize();
      firePlayerRay(playerShotOrigin, pelletDirection, profile);
    }
    return;
  }

  firePlayerRay(
    playerShotOrigin,
    playerShotDirection,
    profile,
    profile.type === "taser" ? 0x36e7ff : undefined
  );

  if (selectedMode === "团队") teamBroadcastLocalFire(currentWeapon);
}

function killEnemy(enemy) {
  if (!enemy.alive) return;

  if (selectedMode === "团队" && enemy.isTeamActor) {
    teamEliminateActor(enemy, teamLocalTeam);
    updateTeamHud(true);
    return;
  }

  enemy.alive = false;
  scene.remove(enemy.group);
  const enemyIndex = enemies.indexOf(enemy);
  if (enemyIndex >= 0) enemies.splice(enemyIndex, 1);
  totalKills++;

  const stats = getDifficultyStats();
  score += 100 * stats.tier;

  if (selectedMode === "无尽") {
    scheduleRespawn(stats.respawnDelay + Math.random() * 0.45);
  } else {
    levelKills++;

    if (levelKills >= LEVEL_ENEMY_TOTAL) {
      completeCurrentLevel();
    } else {
      scheduleRespawn(stats.respawnDelay + Math.random() * 0.35);
    }
  }

  updateGameInfo();
}

// -----------------------------------------------------------------------
// 玩家生命、梯子、跳跃和移动
// -----------------------------------------------------------------------
function damagePlayer(amount) {
  if (gameState !== "战斗") return;

  if (selectedMode === "团队") {
    damageTeamLocalPlayer(amount, teamOpposite(teamLocalTeam));
    return;
  }

  player.health = Math.max(0, player.health - amount);
  // 即使单发伤害较低也产生清晰的暗红受击脉冲；连续受击会自然叠加。
  damageFlash = Math.min(
    1,
    Math.max(damageFlash, 0.52) + amount * 0.022
  );
  updateHealthUI();

  if (player.health <= 0) {
    showGameOver();
  }
}

function updateHealthUI() {
  const health = Math.max(0, Math.ceil(player.health));
  healthText.textContent = String(health);
  healthFill.style.width = Math.max(0, player.health) + "%";

  if (player.health > 55) {
    healthFill.style.background = "linear-gradient(90deg, #38b84a, #75ea68)";
  } else if (player.health > 25) {
    healthFill.style.background = "linear-gradient(90deg, #d49b23, #f1cc43)";
  } else {
    healthFill.style.background = "linear-gradient(90deg, #a91d1d, #ef4538)";
  }
}

function findNearbyLadder() {
  for (const ladder of ladderZones) {
    if (
      player.position.x >= ladder.minX &&
      player.position.x <= ladder.maxX &&
      player.position.z >= ladder.minZ &&
      player.position.z <= ladder.maxZ &&
      player.position.y >= ladder.bottomY - 0.25 &&
      player.position.y <= ladder.topY + 0.45
    ) {
      return ladder;
    }
  }
  return null;
}

function getSupportHeight(x, z, oldY, newY) {
  let support = 0;

  for (const platform of platforms) {
    if (
      x >= platform.minX + player.radius * 0.15 &&
      x <= platform.maxX - player.radius * 0.15 &&
      z >= platform.minZ + player.radius * 0.15 &&
      z <= platform.maxZ - player.radius * 0.15 &&
      oldY >= platform.topY - 0.08 &&
      newY <= platform.topY + 0.04
    ) {
      support = Math.max(support, platform.topY);
    }
  }

  return support;
}

function findCeilingHeight(x, z, oldTop, newTop) {
  let ceiling = Infinity;

  for (const box of nearbyColliders(x, z, player.radius * 0.8)) {
    if (
      box.minY >= oldTop - 0.04 &&
      box.minY <= newTop + 0.02 &&
      circleIntersectsBox(x, z, player.radius * 0.8, box)
    ) {
      ceiling = Math.min(ceiling, box.minY);
    }
  }

  return ceiling;
}

function updatePlayer(delta) {
  if (gameState !== "战斗") return;

  if (!isTeamLocalPlayerActive()) {
    climbHint.style.opacity = "0";
    camera.position.set(
      player.position.x,
      player.position.y + player.eyeHeight,
      player.position.z
    );
    return;
  }

  const locked = document.pointerLockElement === renderer.domElement;
  if (!locked) {
    climbHint.style.opacity = "0";
    return;
  }

  const ladder = findNearbyLadder();
  climbHint.style.opacity = ladder && locked ? "1" : "0";

  let climbInput = 0;
  if (keys.KeyW || keys.Space) climbInput += 1;
  if (keys.KeyS) climbInput -= 1;

  player.climbing = Boolean(ladder && climbInput !== 0 && locked);

  if (player.climbing) {
    player.velocityY = 0;
    player.grounded = false;
    player.position.y += climbInput * player.climbSpeed * delta;

    if (player.position.y >= ladder.topY) {
      player.position.y = ladder.topY + 0.025;
      player.position.x += ladder.exitX * 0.62;
      player.position.z += ladder.exitZ * 0.62;
      player.climbing = false;
      player.grounded = true;
    } else if (player.position.y <= ladder.bottomY) {
      player.position.y = ladder.bottomY;
      player.climbing = false;
      player.grounded = true;
    }
  }

  const inputX = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0);
  let inputZ = (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0);
  if (player.climbing) inputZ = 0;

  const hasHorizontalInput = inputX !== 0 || inputZ !== 0;

  if (hasHorizontalInput && locked) {
    const forward = tempVector.set(
      -Math.sin(player.yaw),
      0,
      -Math.cos(player.yaw)
    );
    const right = tempVector2.set(
      Math.cos(player.yaw),
      0,
      -Math.sin(player.yaw)
    );
    const movement = tempVector3.set(0, 0, 0)
      .addScaledVector(forward, inputZ)
      .addScaledVector(right, inputX)
      .normalize();
    const speed = keys.ShiftLeft || keys.ShiftRight
      ? player.sprintSpeed
      : player.walkSpeed;

    moveWithCollisions(
      player.position,
      movement.x * speed * delta,
      movement.z * speed * delta,
      player.radius,
      player.bodyHeight
    );
  }

  if (!player.climbing) {
    const oldY = player.position.y;
    const oldTop = oldY + player.bodyHeight;
    player.velocityY -= player.gravity * delta;
    let newY = oldY + player.velocityY * delta;

    if (player.velocityY > 0) {
      const ceiling = findCeilingHeight(
        player.position.x,
        player.position.z,
        oldTop,
        newY + player.bodyHeight
      );
      if (ceiling < Infinity) {
        newY = ceiling - player.bodyHeight - 0.02;
        player.velocityY = 0;
      }
    }

    if (player.velocityY <= 0) {
      const support = getSupportHeight(
        player.position.x,
        player.position.z,
        oldY,
        newY
      );

      if (newY <= support) {
        newY = support;
        player.velocityY = 0;
        player.grounded = true;
      } else {
        player.grounded = false;
      }
    }

    player.position.y = Math.max(0, newY);
    if (player.position.y === 0) {
      player.velocityY = 0;
      player.grounded = true;
    }
  }

  // 最后进行一次自动脱墙；若复杂重叠墙角仍未解开，则回退到上一帧安全位置。
  resolveCirclePenetration(player.position, player.radius, player.bodyHeight);
  if (collidesAt(
    player.position.x,
    player.position.z,
    player.radius,
    player.position.y,
    player.bodyHeight
  )) {
    player.position.copy(playerLastSafePosition);
    player.velocityY = 0;
    player.climbing = false;
  } else {
    playerLastSafePosition.copy(player.position);
  }

  const movingOnGround =
    hasHorizontalInput &&
    player.grounded &&
    locked;
  const bobSpeed = keys.ShiftLeft || keys.ShiftRight ? 15 : 10;
  const bobAmount = movingOnGround
    ? Math.sin(performance.now() * 0.001 * bobSpeed) * 0.025
    : 0;

  camera.position.set(
    player.position.x,
    player.position.y + player.eyeHeight + bobAmount,
    player.position.z
  );

  cameraShake = THREE.MathUtils.damp(cameraShake, 0, 15, delta);
  const shakePitch = (Math.random() - 0.5) * cameraShake;
  const shakeYaw = (Math.random() - 0.5) * cameraShake * 0.55;
  const shakeRoll = (Math.random() - 0.5) * cameraShake * 0.8;

  camera.rotation.set(
    player.pitch + shakePitch,
    player.yaw + shakeYaw,
    shakeRoll
  );
}

function updateWeapon(delta) {
  if (reloadingWeapon) {
    reloadTimer -= delta;
    if (reloadTimer <= 0) completeReload();
    else updateAmmoUI();
  }

  const targetFov = aiming ? 24 : 75;
  const nextFov = THREE.MathUtils.damp(camera.fov, targetFov, aiming ? 13 : 9, delta);
  if (Math.abs(nextFov - camera.fov) > 0.001) {
    camera.fov = nextFov;
    camera.updateProjectionMatrix();
  }

  weaponRecoil = THREE.MathUtils.damp(weaponRecoil, 0, 17, delta);
  weapon.position.copy(weaponBasePosition);
  weapon.position.z += weaponRecoil;
  weapon.position.y += weaponRecoil * 0.32;
  weapon.rotation.x = -0.035 + weaponRecoil * 0.65;
  weapon.rotation.y = -0.025;
  weapon.rotation.z = -0.025;

  if (reloadingWeapon && reloadDuration > 0) {
    const progress = THREE.MathUtils.clamp(1 - reloadTimer / reloadDuration, 0, 1);
    const arc = Math.sin(progress * Math.PI);
    weapon.position.y -= arc * 0.22;
    weapon.position.x += arc * 0.08;
    weapon.rotation.z -= arc * 0.42;
  }

  // 进入狙击镜时隐藏第一人称枪身，避免模型遮住镜片中心。
  weapon.visible = !aiming && isTeamLocalPlayerActive();

  muzzleTimer -= delta;
  if (muzzleTimer <= 0) {
    muzzleFlash.visible = false;
    muzzleLight.intensity = 0;
  } else {
    muzzleLight.intensity = 10 * (muzzleTimer / 0.055);
  }
}

function updateVisualUI(delta) {
  damageFlash = THREE.MathUtils.damp(damageFlash, 0, 7, delta);
  const criticalHealth =
    gameState === "战斗" &&
    player.health > 0 &&
    player.health < 30;
  const criticalPulse = criticalHealth
    ? 0.4 + Math.sin(performance.now() * 0.0045) * 0.045
    : 0;
  damageVignette.style.opacity = String(
    Math.max(criticalPulse, Math.min(0.92, damageFlash))
  );

  hitFlash = Math.max(0, hitFlash - delta);
  hitMarker.style.opacity = hitFlash > 0
    ? String(Math.min(1, hitFlash * 12))
    : "0";

  pickupNoticeTimer = Math.max(0, pickupNoticeTimer - delta);
  pickupNotice.style.opacity = pickupNoticeTimer > 0
    ? String(Math.min(1, pickupNoticeTimer * 3))
    : "0";
}
