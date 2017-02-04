const rootDir = 'web-bluetooth';
module.exports = {
  stripPrefix: `${rootDir}/`,
  staticFileGlobs: [
    `${rootDir}/**/*`,
  ],
  importScripts: [
    `sw-toolbox.js`
  ],
  runtimeCaching: [{
    urlPattern: /^https:\/\/fonts.googleapis.com/,
    handler: 'cacheFirst'
  }, {
    urlPattern: /^https:\/\/fonts.gstatic.com/,
    handler: 'fastest'
  }, {
    urlPattern: /web-bluetooth\/simon/,
    handler: 'fastest'
  }],
  maximumFileSizeToCacheInBytes: 1024 * 1024 * 10
}
