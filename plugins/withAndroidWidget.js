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

      // 1. Copy layout, drawable, and xml info files into android res
      const layoutDir = path.join(androidDir, 'app', 'src', 'main', 'res', 'layout');
      const xmlDir = path.join(androidDir, 'app', 'src', 'main', 'res', 'xml');
      const drawableDir = path.join(androidDir, 'app', 'src', 'main', 'res', 'drawable');
      fs.mkdirSync(layoutDir, { recursive: true });
      fs.mkdirSync(xmlDir, { recursive: true });
      fs.mkdirSync(drawableDir, { recursive: true });

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

      // Copy custom drawable assets
      const drawableSourceDir = path.join(
        projectRoot,
        'native-widgets',
        'android',
        'res',
        'drawable'
      );
      if (fs.existsSync(drawableSourceDir)) {
        const files = fs.readdirSync(drawableSourceDir);
        for (const file of files) {
          fs.copyFileSync(
            path.join(drawableSourceDir, file),
            path.join(drawableDir, file)
          );
        }
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

    // 1. Ensure import of WidgetBridgePackage is present
    if (!contents.includes('WidgetBridgePackage')) {
      contents = contents.replace(
        /package\s+[\w\.]+/,
        '$&\n\nimport com.streaktracker.app.WidgetBridgePackage'
      );
    }

    // 2. Add WidgetBridgePackage() into the React Native packages list across all Expo SDK 51 variations
    if (!contents.includes('WidgetBridgePackage()')) {
      if (contents.includes('val packages = PackageList(this).packages')) {
        contents = contents.replace(
          'val packages = PackageList(this).packages',
          'val packages = PackageList(this).packages.toMutableList()\n            packages.add(WidgetBridgePackage())'
        );
      } else if (/PackageList\(this\)\.packages\.apply\s*\{/.test(contents)) {
        contents = contents.replace(
          /PackageList\(this\)\.packages\.apply\s*\{/g,
          'PackageList(this).packages.apply {\n              add(WidgetBridgePackage())'
        );
      } else if (contents.includes('PackageList(this).packages')) {
        contents = contents.replace(
          'PackageList(this).packages',
          'PackageList(this).packages.apply {\n              add(WidgetBridgePackage())\n            }'
        );
      }
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

