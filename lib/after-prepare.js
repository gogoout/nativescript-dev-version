var fs = require('fs');
const AndroidManifest = require('androidmanifest');
const plist = require('simple-plist');

module.exports = function ($logger, $projectData, $runController, $platformsDataService) {
  var appPackage = require($projectData.projectFilePath);
  if (!appPackage.nativescript || !appPackage.nativescript.versionCode) {
    $logger.warn('Nativescript version is not defined. Skipping set native package version.');
    return;
  }
  var appVersion = appPackage.version;
  var appVersionCode = appPackage.nativescript.versionCode;

  return Promise.each($runController.getPreparedPlatforms($projectData), function (platform) {
    var platformData = $platformsDataService.getPlatformData(platform);
    if (platform === 'android') {
      var manifest = new AndroidManifest().readFile(platformData.configurationFilePath);
      manifest.$('manifest').attr('android:versionCode', appVersionCode.android);
      manifest.$('manifest').attr('android:versionName', appVersion);
      $logger.info('Bump android version to: ' + appVersion + '(' + appVersionCode.android + ')');
      manifest.writeFile(platformData.configurationFilePath);
    }
    else if (platform === 'ios') {
      const plistData = plist.readFileSync(platformData.configurationFilePath);
      plistData.CFBundleShortVersionString = appVersion;
      plistData.CFBundleVersion = appVersionCode.ios;
      $logger.info('Bump ios version to: ' + appVersion + '(' + appVersionCode.ios + ')');
      plist.writeFileSync(platformData.configurationFilePath, plistData);
    }
  });
};