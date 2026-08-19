module.exports = {
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
