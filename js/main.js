"use strict";

// -----------------------------------------------------------------------
// 模式流程、五关切换和界面状态
// -----------------------------------------------------------------------
function clearEnemiesAndEffects() {
  for (const enemy of enemies) {
    scene.remove(enemy.group);
  }
  enemies.length = 0;

  for (const effect of effects) {
    scene.remove(effect.group);
    effect.material.dispose();
  }
  effects.length = 0;
  respawnTimers.length = 0;

  for (const projectile of playerProjectiles) {
    projectile.group.traverse(function (object) {
      if (object.geometry) object.geometry.dispose();
    });
    scene.remove(projectile.group);
  }
  playerProjectiles.length = 0;
}

function resetPlayer() {
  const safeStart = findNearestSafePosition(
    new THREE.Vector3(playerStart.x, playerStart.y, playerStart.z),
    player.radius,
    player.bodyHeight
  );
  player.position.copy(safeStart);
  resolveCirclePenetration(player.position, player.radius, player.bodyHeight);
  playerLastSafePosition.copy(player.position);
  player.velocityY = 0;
  player.grounded = true;
  player.climbing = false;
  player.yaw = playerStart.yaw;
  player.pitch = 0;
  player.health = 100;
  damageFlash = 0;
  hitFlash = 0;
  firing = false;
  weaponRecoil = 0;
  muzzleTimer = 0;
  muzzleFlash.visible = false;
  muzzleLight.intensity = 0;
  lastShotTime = -Infinity;
  lastEmptyAmmoNotice = -Infinity;
  setAiming(false);
  resetAllAmmo();
  setCurrentWeapon("机枪", false);

  for (const key in keys) keys[key] = false;

  camera.position.set(
    player.position.x,
    player.position.y + player.eyeHeight,
    player.position.z
  );
  camera.rotation.set(0, player.yaw, 0);
  updateHealthUI();
}

function populateImmediately() {
  const stats = getDifficultyStats();
  const count = selectedMode === "无尽"
    ? stats.maxActive
    : Math.min(stats.maxActive, LEVEL_ENEMY_TOTAL);

  for (let i = 0; i < count; i++) {
    createEnemy();
  }
}

function startGame(mode) {
  selectedMode = mode;
  currentLevel = 1;
  score = 0;
  totalKills = 0;
  levelKills = 0;
  levelSpawned = 0;
  gameState = "战斗";

  clearEnemiesAndEffects();
  loadCurrentMap();
  resetPlayer();
  populateImmediately();

  modeScreen.classList.add("hidden");
  endlessMapScreen.classList.add("hidden");
  pauseScreen.classList.add("hidden");
  resultScreen.classList.add("hidden");
  updateGameInfo();

  renderer.domElement.requestPointerLock();
}

function startCurrentLevel() {
  gameState = "战斗";
  levelKills = 0;
  levelSpawned = 0;

  clearEnemiesAndEffects();
  loadCurrentMap();
  resetPlayer();
  populateImmediately();

  resultScreen.classList.add("hidden");
  pauseScreen.classList.add("hidden");
  updateGameInfo();
  renderer.domElement.requestPointerLock();
}

function completeCurrentLevel() {
  gameState = currentLevel >= 5 ? "通关" : "过关";
  firing = false;
  setAiming(false);
  cancelReload();
  respawnTimers.length = 0;

  if (document.pointerLockElement === renderer.domElement) {
    document.exitPointerLock();
  }

  resultScreen.classList.remove("hidden");
  resultTitle.className = "title win";
  resultActionButton.classList.remove("hidden");

  if (currentLevel >= 5) {
    resultTitle.textContent = "全部关卡完成";
    resultSummary.textContent =
      "五座战区已全部肃清　累计分数：" + score;
    resultPrompt.textContent = "你已完成最终任务";
    resultActionButton.textContent = "重新挑战关卡模式";
  } else {
    resultTitle.textContent = "第 " + currentLevel + " 关胜利";
    resultSummary.textContent =
      "本关二十五名敌人已全部消灭　累计分数：" + score;
    resultPrompt.textContent =
      "下一关威胁等级将提升至 " + (currentLevel + 1);
    resultActionButton.textContent = "进入下一关";
  }
}

function showGameOver() {
  gameState = "失败";
  firing = false;
  setAiming(false);
  cancelReload();
  respawnTimers.length = 0;

  if (document.pointerLockElement === renderer.domElement) {
    document.exitPointerLock();
  }

  resultScreen.classList.remove("hidden");
  resultTitle.className = "title fail";
  resultTitle.textContent = "任务失败";
  resultSummary.textContent =
    "累计分数：" + score + "　累计击杀：" + totalKills;
  resultPrompt.textContent = "按 R 键重新开始当前模式";
  resultActionButton.classList.add("hidden");
}

function restartSelectedMode() {
  if (!selectedMode) return;
  startGame(selectedMode);
}

function showModeMenu() {
  gameState = "菜单";
  selectedMode = null;
  firing = false;
  setAiming(false);
  resetAllAmmo();
  setCurrentWeapon("机枪", false);
  clearEnemiesAndEffects();
  clearMapPickups();

  if (document.pointerLockElement === renderer.domElement) {
    document.exitPointerLock();
  }

  resultScreen.classList.add("hidden");
  pauseScreen.classList.add("hidden");
  endlessMapScreen.classList.add("hidden");
  modeScreen.classList.remove("hidden");

  modeText.textContent = "尚未选择";
  mapText.textContent = "待命区";
  scoreText.textContent = "0";
  difficultyText.textContent = "1";
  enemyCountText.textContent = "0";
  weaponText.textContent = "机枪";
  updateAmmoUI();
  objective.textContent = "请选择游戏模式";
}

function updateGameInfo() {
  const stats = selectedMode ? getDifficultyStats() : { tier: 1 };
  modeText.textContent = selectedMode
    ? selectedMode + "模式"
    : "尚未选择";
  scoreText.textContent = String(score);
  difficultyText.textContent = String(stats.tier);
  enemyCountText.textContent = String(livingEnemyCount());

  if (selectedMode === "无尽") {
    objective.textContent =
      "无尽作战：敌人会持续复活　每 800 分提升一次威胁等级";
  } else if (selectedMode === "关卡") {
    objective.textContent =
      "第 " + currentLevel + " 关：已消灭 " +
      levelKills + " / " + LEVEL_ENEMY_TOTAL;
  }
}

// -----------------------------------------------------------------------
// 鼠标锁定与键盘输入
// -----------------------------------------------------------------------
function onPointerLockChange() {
  const locked = document.pointerLockElement === renderer.domElement;

  if (locked) {
    pauseScreen.classList.add("hidden");
  } else {
    firing = false;
    setAiming(false);
    if (gameState === "战斗" && modeScreen.classList.contains("hidden")) {
      pauseScreen.classList.remove("hidden");
    }
  }
}

document.getElementById("endlessModeButton").addEventListener("click", function () {
  modeScreen.classList.add("hidden");
  endlessMapScreen.classList.remove("hidden");
});

document.getElementById("backFromMapButton").addEventListener("click", function () {
  endlessMapScreen.classList.add("hidden");
  modeScreen.classList.remove("hidden");
});

document.querySelectorAll(".endless-map-button").forEach(function (button) {
  button.addEventListener("click", function () {
    selectedEndlessMap = Number(button.dataset.mapIndex);
    startGame("无尽");
  });
});

document.getElementById("levelModeButton").addEventListener("click", function () {
  startGame("关卡");
});

pauseScreen.addEventListener("click", function () {
  if (gameState === "战斗") {
    renderer.domElement.requestPointerLock();
  }
});

resultActionButton.addEventListener("click", function () {
  if (gameState === "过关") {
    currentLevel++;
    startCurrentLevel();
  } else if (gameState === "通关") {
    startGame("关卡");
  }
});

returnMenuButton.addEventListener("click", showModeMenu);
document.addEventListener("pointerlockchange", onPointerLockChange);

document.addEventListener("mousemove", function (event) {
  if (
    document.pointerLockElement !== renderer.domElement ||
    gameState !== "战斗"
  ) {
    return;
  }

  const sensitivity = aiming ? 0.00072 : 0.00215;
  player.yaw -= event.movementX * sensitivity;
  player.pitch -= event.movementY * sensitivity;
  player.pitch = THREE.MathUtils.clamp(
    player.pitch,
    -Math.PI / 2 + 0.04,
    Math.PI / 2 - 0.04
  );
});

document.addEventListener("mousedown", function (event) {
  if (
    event.button === 0 &&
    document.pointerLockElement === renderer.domElement
  ) {
    firing = true;
    shoot();
  }
});

document.addEventListener("mouseup", function (event) {
  if (event.button === 0) firing = false;
});

document.addEventListener("contextmenu", function (event) {
  event.preventDefault();
});

document.addEventListener("keydown", function (event) {
  keys[event.code] = true;

  if (event.code === "KeyQ") {
    setAiming(true);
  }

  if (event.code === "Space") {
    event.preventDefault();
    const ladder = findNearbyLadder();
    if (
      player.grounded &&
      !ladder &&
      gameState === "战斗" &&
      document.pointerLockElement === renderer.domElement
    ) {
      player.velocityY = player.jumpSpeed;
      player.grounded = false;
    }
  }

  if (event.code === "KeyR") {
    if (gameState === "失败") {
      restartSelectedMode();
    } else if (
      gameState === "战斗" &&
      document.pointerLockElement === renderer.domElement
    ) {
      startReload(true);
    }
  }
});

document.addEventListener("keyup", function (event) {
  keys[event.code] = false;
  if (event.code === "KeyQ") setAiming(false);
});

window.addEventListener("blur", function () {
  for (const key in keys) keys[key] = false;
  firing = false;
  setAiming(false);
});

window.addEventListener("resize", function () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// -----------------------------------------------------------------------
// 主循环
// -----------------------------------------------------------------------
function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);

  updatePlayer(delta);
  if (firing) shoot();
  updateWeapon(delta);
  updatePlayerProjectiles(delta);
  updateEnemyAI(delta);
  maintainEnemyPopulation();
  updatePickups(delta);
  updateEffects(delta);
  updateVisualUI(delta);
  updateMinimap(delta);
  renderer.render(scene, camera);
}

// 初始化待命场景并显示模式选择。
clearMap();
buildEndlessMap();
rebuildMinimapStatic();
drawEndlessMapPreviews();
camera.position.set(0, player.eyeHeight, 29);
updateHealthUI();
updateGameInfo();
loadingScreen.classList.add("hidden");
modeScreen.classList.remove("hidden");
animate();
