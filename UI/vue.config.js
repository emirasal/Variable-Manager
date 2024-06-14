const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  configureWebpack: {
    resolve: {
      fallback: {
        "crypto": false,
        "path": false,
        "os": false,
        "fs": false
      }
    }
  }
})
