const { defineConfig } = require('cypress')
const createBundler = require('@bahmutov/cypress-esbuild-preprocessor')
const preprocessor = require("@badeball/cypress-cucumber-preprocessor");
const createEsbuildPlugin = require("@badeball/cypress-cucumber-preprocessor/esbuild");

const fs = require('fs-extra');
const { exec } = require('child_process')
let githubActionsKeys = {}
  
module.exports = defineConfig({
  e2e: {
    watchForFileChanges: false,
    specPattern: ["**/*.feature", "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}"],
    pageLoadTimeout: 90000,
    responseTimeout: 45000,
    defaultCommandTimeout: 6000,
    video: true,
    chromeWebSecurity: false,
    screenshotsFolder: "cypress/results/screenshots",
    videosFolder: "cypress/results/videos",
    downloadsFolder: "cypress/results/downloads",
    supportFile: 'cypress/support/e2e.js',
    reporter: "cypress-multi-reporters",
    reporterOptions: {
        "configFile": "cypress/config/reporter-configs.json"
    },
    env: {
        "TAGS": "not @skip",
        "expandCollapseTime": 1500,
        "ACTION_TEST": "[SHOULD BE OVERWRITTEN]",
        "HeroApp": "https://the-internet.herokuapp.com/",
        "appiumTimeout": 120000,
        "appiumRetries": 3,
        "appiumPort": "4723",
        "appiumCapabilitiesPath": "cypress/config/appium.json",
        "androidPort": "5554",
        "apkPath": "wdio/apk",
        "avdHeadless": false,
    },
    setupNodeEvents,
  }
})

async function setupNodeEvents(on, config) {
  await preprocessor.addCucumberPreprocessorPlugin(on, config);

  on(
    "file:preprocessor",
    createBundler({
      plugins: [createEsbuildPlugin.default(config)],
    })
  );
  
  cleanReports();
  readGitHubSecrets(config);

  on('task', {
    logMsg(msg) {
      console.log(msg);
      return null;
    },
    getGithubKeys: () => {
      return githubActionsKeys;
    },
    androidAVDStart({avdName, headless, port, linux=true}){
      //Example: /Users/atrejo/Library/Android/sdk/emulator/emulator -avd Pixel_4_API_26 -no-window -port 5554
      const avdCommand = linux ? 'emulator': '"emulator.exe"'

      exec(avdCommand + ' -avd ' + avdName + ' -no-boot-anim -no-audio ' + headless + port, (error, stdout, stderr) => {
        //console.log(stdout)
        if (error) {
          console.log(`AVD Error: ${error.message}`);
        }
        if(stderr){
          console.log(`AVD stderror: ${stderr}`);
        }
        console.log(`AVD stdout: ${stdout}`);
      })
      return null
    },
    appiumServerStart( appiumPort){
      exec("appium "+appiumPort+"&",(error, stdout, stderr) =>{
        //console.log(stdout)
        if(error){
          console.log(`Appium Error: ${error.message}`);
        }
        if(stderr){
          console.log(`Appium stderror: ${stderr}`);
        }
        console.log(`Appium stdout: ${stdout}`);
      })
      return null;
    }
  });

  const envKey = config.env.envKey || 'default';
  config.env.TEST_TRIGGER = 'local';

  if (envKey !== 'default') {
    return getConfigByFile(envKey, config);
  } else {
    return config;
  }
}

function cleanReports() {
    const reportPath = './cypress/results/reports';
    if (fs.existsSync(reportPath)) {
        fs.rmdirSync('./cypress/results/reports', { recursive: true });
    }
};

function getConfigByFile(envKey, config) {
  let fileName = `cypress_${envKey}.json`
  console.log("Config file: " + fileName);

  let rawData = fs.readFileSync(`cypress/config/${fileName}`);
  let newConfig = JSON.parse(rawData);

  config = {...config, ...newConfig}
  return config;
};

function readGitHubSecrets(config) {
    githubActionsKeys["process_env_CYPRESS_ACTION_TEST"] = process.env.CYPRESS_ACTION_TEST
    githubActionsKeys["config_ACTION_TEST"] = config.env.ACTION_TEST
}