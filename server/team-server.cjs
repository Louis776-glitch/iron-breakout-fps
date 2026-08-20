"use strict";

// 钢铁突围双人房间服务。
// 服务器只管理房间、权限与消息中继；房主客户端负责 AI、伤害、比分和复活，
// 因而无需在服务器中加载 Three.js 或复制整套地图碰撞代码。
const http = require("node:http");
const crypto = require("node:crypto");
const { WebSocketServer, WebSocket } = require("ws");

const PORT = Number(process.env.PORT || 8787);
const ROOM_CODE_CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const ROOM_IDLE_LIMIT = 2 * 60 * 60 * 1000;
const MAX_MESSAGES_PER_SECOND = 80;
const rooms = new Map();

function jsonResponse(response, statusCode, body) {
  const payload = JSON.stringify(body);
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload),
    "Cache-Control": "no-store"
  });
  response.end(payload);
}

const server = http.createServer(function (request, response) {
  if (request.method === "GET" && request.url === "/health") {
    jsonResponse(response, 200, {
      ok: true,
      service: "iron-breakout-team-server",
      rooms: rooms.size,
      time: new Date().toISOString()
    });
    return;
  }
  if (request.method === "GET" && request.url === "/") {
    jsonResponse(response, 200, {
      name: "钢铁突围团队模式房间服务",
      protocol: "WebSocket",
      playersPerRoom: 2
    });
    return;
  }
  jsonResponse(response, 404, { ok: false, message: "未找到接口" });
});

const webSocketServer = new WebSocketServer({
  server: server,
  maxPayload: 96 * 1024,
  perMessageDeflate: false
});

function sanitizeName(name) {
  const clean = String(name || "玩家")
    .replace(/[<>\u0000-\u001f]/g, "")
    .trim()
    .slice(0, 12);
  return clean || "玩家";
}

function sanitizeTeam(team) {
  return team === "红" ? "红" : "蓝";
}

function sanitizeDifficulty(difficulty) {
  return ["简单", "适中", "困难"].includes(difficulty)
    ? difficulty
    : "适中";
}

function hashPassword(password) {
  return crypto
    .createHash("sha256")
    .update(String(password || ""), "utf8")
    .digest("hex");
}

function makeRoomCode() {
  for (let attempt = 0; attempt < 100; attempt++) {
    let code = "";
    for (let index = 0; index < 6; index++) {
      code += ROOM_CODE_CHARACTERS[
        crypto.randomInt(0, ROOM_CODE_CHARACTERS.length)
      ];
    }
    if (!rooms.has(code)) return code;
  }
  throw new Error("无法生成房间码");
}

function send(socket, message) {
  if (socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify(message));
}

function roomPlayers(room) {
  return Array.from(room.clients.values()).map(function (client) {
    return {
      id: client.id,
      name: client.name,
      team: client.team
    };
  });
}

function roomState(room) {
  return {
    type: "roomState",
    roomCode: room.code,
    hostId: room.hostId,
    players: roomPlayers(room),
    config: room.config
  };
}

function broadcast(room, message, exceptSocket) {
  for (const [socket] of room.clients) {
    if (socket !== exceptSocket) send(socket, message);
  }
}

function fail(socket, message) {
  send(socket, { type: "error", message: message });
}

function leaveCurrentRoom(socket) {
  const code = socket.roomCode;
  if (!code || !rooms.has(code)) return;
  const room = rooms.get(code);
  const client = room.clients.get(socket);
  room.clients.delete(socket);
  socket.roomCode = null;
  room.updatedAt = Date.now();

  if (client && client.id === room.hostId) {
    broadcast(room, { type: "hostLeft" });
    for (const [remainingSocket] of room.clients) {
      remainingSocket.roomCode = null;
    }
    rooms.delete(code);
    return;
  }
  if (room.clients.size === 0) {
    rooms.delete(code);
  } else {
    room.started = false;
    broadcast(room, roomState(room));
  }
}

function createRoom(socket, message) {
  leaveCurrentRoom(socket);
  const code = makeRoomCode();
  const client = {
    id: socket.clientId,
    name: sanitizeName(message.name),
    team: sanitizeTeam(message.team)
  };
  const room = {
    code: code,
    passwordHash: hashPassword(message.password),
    hostId: client.id,
    clients: new Map([[socket, client]]),
    config: {
      mapIndex: Math.max(0, Math.min(9, Number(message.mapIndex) || 0)),
      difficulty: sanitizeDifficulty(message.difficulty)
    },
    started: false,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  rooms.set(code, room);
  socket.roomCode = code;
  send(socket, {
    type: "created",
    roomCode: code,
    playerId: client.id,
    hostId: room.hostId,
    players: roomPlayers(room),
    config: room.config
  });
}

function joinRoom(socket, message) {
  const code = String(message.roomCode || "").trim().toUpperCase();
  const room = rooms.get(code);
  if (!room) {
    fail(socket, "房间不存在或已经关闭");
    return;
  }
  if (room.started) {
    fail(socket, "比赛已经开始");
    return;
  }
  if (room.clients.size >= 2) {
    fail(socket, "房间已满，仅支持两名真人");
    return;
  }
  if (room.passwordHash !== hashPassword(message.password)) {
    fail(socket, "房间密码错误");
    return;
  }

  leaveCurrentRoom(socket);
  const client = {
    id: socket.clientId,
    name: sanitizeName(message.name),
    team: sanitizeTeam(message.team)
  };
  room.clients.set(socket, client);
  room.updatedAt = Date.now();
  socket.roomCode = code;
  send(socket, {
    type: "joined",
    roomCode: code,
    playerId: client.id,
    hostId: room.hostId,
    players: roomPlayers(room),
    config: room.config
  });
  broadcast(room, roomState(room));
}

function updateLobby(socket, message) {
  const room = rooms.get(socket.roomCode);
  if (!room || room.started) return;
  const client = room.clients.get(socket);
  if (!client) return;
  client.name = sanitizeName(message.name);
  client.team = sanitizeTeam(message.team);
  if (client.id === room.hostId) {
    room.config.mapIndex = Math.max(0, Math.min(9, Number(message.mapIndex) || 0));
    room.config.difficulty = sanitizeDifficulty(message.difficulty);
  }
  room.updatedAt = Date.now();
  broadcast(room, roomState(room));
}

function startRoom(socket) {
  const room = rooms.get(socket.roomCode);
  if (!room) return;
  const client = room.clients.get(socket);
  if (!client || client.id !== room.hostId) {
    fail(socket, "只有房主可以开始比赛");
    return;
  }
  if (room.clients.size !== 2) {
    fail(socket, "需要两名真人都加入后才能开始");
    return;
  }
  room.started = true;
  room.updatedAt = Date.now();
  broadcast(room, {
    type: "start",
    roomCode: room.code,
    hostId: room.hostId,
    players: roomPlayers(room),
    config: room.config
  });
}

function relayGameMessage(socket, payload) {
  const room = rooms.get(socket.roomCode);
  if (!room || !room.started) return;
  const sender = room.clients.get(socket);
  if (!sender || !payload || typeof payload !== "object") return;
  room.updatedAt = Date.now();
  broadcast(room, {
    type: "game",
    from: sender.id,
    payload: payload
  }, socket);
}

webSocketServer.on("connection", function (socket) {
  socket.clientId = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  socket.roomCode = null;
  socket.isAlive = true;
  socket.rateWindowStarted = Date.now();
  socket.rateCount = 0;

  socket.on("pong", function () {
    socket.isAlive = true;
  });

  socket.on("message", function (buffer) {
    const now = Date.now();
    if (now - socket.rateWindowStarted >= 1000) {
      socket.rateWindowStarted = now;
      socket.rateCount = 0;
    }
    socket.rateCount++;
    if (socket.rateCount > MAX_MESSAGES_PER_SECOND) {
      fail(socket, "消息发送过快");
      return;
    }

    let message;
    try {
      message = JSON.parse(buffer.toString("utf8"));
    } catch (error) {
      fail(socket, "消息格式错误");
      return;
    }

    if (message.type === "create") createRoom(socket, message);
    else if (message.type === "join") joinRoom(socket, message);
    else if (message.type === "lobby") updateLobby(socket, message);
    else if (message.type === "start") startRoom(socket);
    else if (message.type === "game") relayGameMessage(socket, message.payload);
    else if (message.type === "leave") leaveCurrentRoom(socket);
  });

  socket.on("close", function () {
    leaveCurrentRoom(socket);
  });
});

const heartbeat = setInterval(function () {
  for (const socket of webSocketServer.clients) {
    if (!socket.isAlive) {
      socket.terminate();
      continue;
    }
    socket.isAlive = false;
    socket.ping();
  }

  const now = Date.now();
  for (const [code, room] of rooms) {
    if (now - room.updatedAt > ROOM_IDLE_LIMIT) {
      broadcast(room, { type: "hostLeft" });
      for (const [socket] of room.clients) socket.roomCode = null;
      rooms.delete(code);
    }
  }
}, 30000);
heartbeat.unref();

function shutdown() {
  clearInterval(heartbeat);
  for (const socket of webSocketServer.clients) socket.close(1001, "服务器关闭");
  server.close(function () { process.exit(0); });
  setTimeout(function () { process.exit(0); }, 3000).unref();
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

server.listen(PORT, "0.0.0.0", function () {
  console.log("钢铁突围团队房间服务已启动：http://0.0.0.0:" + PORT);
});
