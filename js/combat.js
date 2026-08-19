"use strict";

// -----------------------------------------------------------------------
// 射击、命中特效和击杀结算
// -----------------------------------------------------------------------
const sparkGeometry = new THREE.SphereGeometry(0.035, 6, 4);

function spawnImpact(position, normal, hitEnemy) {
  const color = hitEnemy ? 0xff4a24 : 0xffc24a;
  const group = new THREE.Group();
  group.position.copy(position).addScaledVector(normal, 0.025);
  scene.add(group);

  const material = new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: 1,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const particles = [];
  for (let i = 0; i < 8; i++) {
    const spark = new THREE.Mesh(sparkGeometry, material);
    const direction = new THREE.Vector3(
      THREE.MathUtils.randFloatSpread(1),
      Math.random() * 0.85,
      THREE.MathUtils.randFloatSpread(1)
    ).normalize();
    direction.addScaledVector(normal, 1.4).normalize();
    spark.userData.velocity = direction.multiplyScalar(
      THREE.MathUtils.randFloat(1.8, 5)
    );
    group.add(spark);
    particles.push(spark);
  }

  const light = new THREE.PointLight(color, 6, 3.5, 2);
  group.add(light);

  effects.push({
    group: group,
    material: material,
    particles: particles,
    light: light,
    age: 0,
    lifetime: 0.34
  });
}

function updateEffects(delta) {
  for (let i = effects.length - 1; i >= 0; i--) {
    const effect = effects[i];
    effect.age += delta;
    const life = 1 - effect.age / effect.lifetime;

    for (const particle of effect.particles) {
      particle.position.addScaledVector(particle.userData.velocity, delta);
      particle.userData.velocity.y -= 8 * delta;
      particle.scale.setScalar(Math.max(0.01, life));
    }

    effect.material.opacity = Math.max(0, life);
    effect.light.intensity = Math.max(0, life * 6);

    if (effect.age >= effect.lifetime) {
      scene.remove(effect.group);
      effect.material.dispose();
      effects.splice(i, 1);
    }
  }
}

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
const projectileMetalMaterial = new THREE.MeshStandardMaterial({
  color: 0xc9d3d8, roughness: 0.28, metalness: 0.82
});
const rocketBodyMaterial = new THREE.MeshStandardMaterial({
  color: 0x4c6550, roughness: 0.58, metalness: 0.38
});

function damageEnemy(enemy, amount) {
  if (!enemy || !enemy.alive) return;
  enemy.health -= amount;
  hitFlash = 0.12;
  if (enemy.health <= 0) killEnemy(enemy);
}

function createPlayerProjectile(kind, profile) {
  camera.updateMatrixWorld(true);
  const direction = camera.getWorldDirection(new THREE.Vector3()).normalize();
  const group = new THREE.Group();
  const speed = 17;
  const lifetime = 6.5;
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
  const flame = new THREE.PointLight(0xff7a24, 4.5, 3.2, 2);
  flame.position.z = 0.38;
  group.add(flame);

  group.quaternion.copy(camera.quaternion);
  group.position.copy(camera.position).addScaledVector(direction, 0.72);
  scene.add(group);
  playerProjectiles.push({
    kind: kind,
    group: group,
    velocity: direction.multiplyScalar(speed),
    damage: profile.damage,
    lifetime: lifetime
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

function explodeRocket(position, baseDamage) {
  const radius = 5.2;
  // 从多个方向喷发既能照亮爆心，也沿用现有的火花粒子系统。
  for (let i = 0; i < 6; i++) {
    const normal = new THREE.Vector3(
      THREE.MathUtils.randFloatSpread(1),
      Math.random() * 0.9 + 0.15,
      THREE.MathUtils.randFloatSpread(1)
    ).normalize();
    spawnImpact(position, normal, false);
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

function updatePlayerProjectiles(delta) {
  if (gameState !== "战斗") return;
  for (const projectile of playerProjectiles.slice()) {
    projectile.lifetime -= delta;
    if (projectile.lifetime <= 0) {
      if (projectile.kind === "rocket") {
        explodeRocket(projectile.group.position.clone(), projectile.damage);
      }
      removePlayerProjectile(projectile);
      continue;
    }

    projectileStep.copy(projectile.velocity).multiplyScalar(delta);
    const travelDistance = projectileStep.length();
    projectileDirection.copy(projectile.velocity).normalize();
    projectileRaycaster.set(projectile.group.position, projectileDirection);
    projectileRaycaster.near = 0;
    projectileRaycaster.far = travelDistance + 0.08;

    const targets = raycastWorld.slice();
    for (const enemy of enemies) {
      if (enemy.alive) targets.push.apply(targets, enemy.hitMeshes);
    }
    const hits = projectileRaycaster.intersectObjects(targets, false);

    if (hits.length > 0) {
      const hit = hits[0];
      const enemy = findEnemyFromObject(hit.object);
      const normal = hit.face
        ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld)
        : new THREE.Vector3(0, 1, 0);

      if (projectile.kind === "rocket") {
        explodeRocket(hit.point, projectile.damage);
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
    }
  }
}

function shoot() {
  if (
    gameState !== "战斗" ||
    document.pointerLockElement !== renderer.domElement
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

  if (profile.type === "rocket") {
    createPlayerProjectile(profile.type, profile);
    return;
  }

  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  raycaster.far = profile.range;
  const targets = raycastWorld.slice();
  for (const enemy of enemies) {
    if (enemy.alive) targets.push.apply(targets, enemy.hitMeshes);
  }

  const intersections = raycaster.intersectObjects(targets, false);
  if (intersections.length === 0) return;

  const hit = intersections[0];
  const enemy = findEnemyFromObject(hit.object);
  const worldNormal = hit.face
    ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld)
    : new THREE.Vector3(0, 1, 0);

  spawnImpact(hit.point, worldNormal, Boolean(enemy && enemy.alive));

  if (enemy && enemy.alive) {
    damageEnemy(enemy, profile.damage);
  }
}

function killEnemy(enemy) {
  if (!enemy.alive) return;

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

  player.health = Math.max(0, player.health - amount);
  damageFlash = Math.min(1, damageFlash + amount * 0.028);
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

  for (const box of colliders) {
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
    const movement = new THREE.Vector3()
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
  weapon.visible = !aiming;

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
  damageVignette.style.opacity = String(Math.min(0.9, damageFlash));

  hitFlash = Math.max(0, hitFlash - delta);
  hitMarker.style.opacity = hitFlash > 0
    ? String(Math.min(1, hitFlash * 12))
    : "0";

  pickupNoticeTimer = Math.max(0, pickupNoticeTimer - delta);
  pickupNotice.style.opacity = pickupNoticeTimer > 0
    ? String(Math.min(1, pickupNoticeTimer * 3))
    : "0";
}
