const {
  withAndroidManifest,
  withMainApplication,
  withDangerousMod,
  createRunOncePlugin
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withAndroidWidgetFiles = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const androidDir = config.modRequest.platformProjectRoot;

      // 1. Copy layout and xml info files into android res
      const layoutDir = path.join(androidDir, 'app', 'src', 'main', 'res', 'layout');
      const xmlDir = path.join(androidDir, 'app', 'src', 'main', 'res', 'xml');
      fs.mkdirSync(layoutDir, { recursive: true });
      fs.mkdirSync(xmlDir, { recursive: true });

      const layoutSource = path.join(
        projectRoot,
        'native-widgets',
        'android',
        'res',
        'layout',
        'streak_widget_layout.xml'
      );
      const xmlSource = path.join(
        projectRoot,
        'native-widgets',
        'android',
        'res',
        'xml',
        'streak_widget_info.xml'
      );

      if (fs.existsSync(layoutSource)) {
        fs.copyFileSync(layoutSource, path.join(layoutDir, 'streak_widget_layout.xml'));
      }
      if (fs.existsSync(xmlSource)) {
        fs.copyFileSync(xmlSource, path.join(xmlDir, 'streak_widget_info.xml'));
      }

      // 2. Copy Kotlin source files into the com.streaktracker.app package
      const packageName = config.android?.package || 'com.streaktracker.app';
      const packagePath = packageName.replace(/\./g, path.sep);
      const javaDir = path.join(androidDir, 'app', 'src', 'main', 'java', packagePath);
      fs.mkdirSync(javaDir, { recursive: true });

      const ktFiles = [
        'StreakWidgetProvider.kt',
        'WidgetBridgeModule.kt',
        'WidgetBridgePackage.kt'
      ];

      for (const file of ktFiles) {
        const src = path.join(projectRoot, 'native-widgets', 'android', file);
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, path.join(javaDir, file));
        }
      }

      return config;
    }
  ]);
};

const withAndroidWidgetManifest = (config) => {
  return withAndroidManifest(config, (config) => {
    const mainApplication = config.modResults.manifest.application[0];
    mainApplication.receiver = mainApplication.receiver || [];

    const exists = mainApplication.receiver.some(
      (r) => r.$ && r.$['android:name'] === '.StreakWidgetProvider'
    );

    if (!exists) {
      mainApplication.receiver.push({
        $: {
          'android:name': '.StreakWidgetProvider',
          'android:exported': 'true'
        },
        'intent-filter': [
          {
            action: [
              {
                $: {
                  'android:name': 'android.appwidget.action.APPWIDGET_UPDATE'
                }
              }
            ]
          }
        ],
        'meta-data': [
          {
            $: {
              'android:name': 'android.appwidget.provider',
              'android:resource': '@xml/streak_widget_info'
            }
          }
        ]
      });
    }

    return config;
  });
};

const withAndroidWidgetMainApplication = (config) => {
  return withMainApplication(config, (config) => {
    let contents = config.modResults.contents;
    if (!contents.includes('WidgetBridgePackage()')) {
      contents = contents.replace(
        /PackageList\(this\)\.packages\.apply\s*\{/g,
        'PackageList(this).packages.apply {\n              add(WidgetBridgePackage())'
      );
    }
    config.modResults.contents = contents;
    return config;
  });
};

const withAndroidWidget = (config) => {
  config = withAndroidWidgetFiles(config);
  config = withAndroidWidgetManifest(config);
  config = withAndroidWidgetMainApplication(config);
  return config;
};

module.exports = createRunOncePlugin(withAndroidWidget, 'withAndroidWidget', '1.0.0');

