var fs = require('fs');
var path = require('path');
var glob = require('glob');
var Promise = require('bluebird');
var AndroidManifest = require('androidmanifest');
var iOSPList = require('plist');

module.exports = function ($logger, $projectData, $usbLiveSyncService) {
  var appPackage = require($projectData.projectFilePath);
  if (!appPackage.nativescript || !appPackage.nativescript.versionCode) {
    $logger.warn('Nativescript version is not defined. Skipping set native package version.');
    return;
  }
  var appVersion = appPackage.version;
  var appVersionCode = appPackage.nativescript.versionCode;

  var platformService = $injector.resolve('platformService');
  var platformsData = $injector.resolve('platformsData');
  return Promise.each(platformService.getPreparedPlatforms($projectData), function (platform) {
    var platformData = platformsData.getPlatformData(platform);
    if (platform === 'android') {
      var manifest = new AndroidManifest().readFile(platformData.configurationFilePath);
      manifest.$('manifest').attr('android:versionCode', appVersionCode.android);
      manifest.$('manifest').attr('android:versionName', appVersion);
      $logger.info('Bump android version to: ' + appVersion + '(' + appVersionCode.android +')');
      manifest.writeFile(platformData.configurationFilePath);
    }
    else if (platform === 'ios') {
      var plist = iOSPList.parse(fs.readFileSync(platformData.configurationFilePath, 'utf8'));
      plist.CFBundleShortVersionString = appVersion;
      plist.CFBundleVersion = appVersionCode.ios;
      $logger.info('Bump ios version to: ' + appVersion + '(' + appVersionCode.ios +')');
      fs.writeFileSync(platformData.configurationFilePath, iOSPList.build(plist));
    }
  });
}