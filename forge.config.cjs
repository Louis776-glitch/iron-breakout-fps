const packageJSON = require("./package.json");

module.exports = {
  // 每个版本写入独立目录。即使玩家正在运行旧版，构建新版也不会再因
  // Windows 锁定旧程序文件而失败。
  outDir: "out",
  buildIdentifier: "v" + packageJSON.version,
  packagerConfig: {
    asar: true,
    executableName: "钢铁突围",
    ignore: [
      /^\/\.git($|\/)/,
      /^\/out($|\/)/,
      /^\/dist($|\/)/,
      /^\/钢铁突围_完整源代码\.txt$/
    ]
  },
  makers: []
};
