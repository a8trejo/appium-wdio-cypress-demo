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
        "appiumTimeout": 60000,
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
    androidAVDStart({startCmd, checkCmd}){
      let avdMsg = emulatorStart(startCmd, checkCmd)
      return avdMsg
    },

    appiumServerStart( {startCmd, checkCmd} ){
      let appiumMsg = appiumStart(startCmd, checkCmd)
      return appiumMsg;
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


function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function emulatorStart(avdStartCmd, avdCheckCmd) {
  const avdCheckAttempts = 5
  let avdOn = false
  let avdMsg
  let i = 0

  console.log(avdStartCmd)
  exec(avdStartCmd, (error, stdout, stderr) => {
    let avdOutput = `AVD stdout: ${stdout}`
    if (stderr) {
      avdOutput = `${avdOutput}\nAVD stderror: ${stderr}`
      console.log(`AVD stderror: ${stderr}`);
    }
    if (error) {
      avdOutput = `${avdOutput}\nAVD Error: ${error.message}`
      console.log(`AVD Error: ${error.message}`);
    }
    // Might not be needed as it is too much noise
    // console.log(avdOutput);
  })
  while(avdOn === false && i <= avdCheckAttempts) {
    await sleep(3000)
    i++;
    exec(avdCheckCmd, (error, stdout, stderr) => {
      let checkOutput = `${avdCheckCmd}\n${stdout}`
      if (stderr) {
        checkOutput = `${checkOutput}\n${stderr}`
      }
      if (error) {
        checkOutput = `${checkOutput}\n${error.message}`
      }
      console.log(checkOutput)
      avdOn = stdout.includes('emulator-') && !stdout.includes('offline');
    })
  }
  if( avdOn ) {
    avdMsg = 'Success: Android AVD Started!!!'
  } else {
    avdMsg = "Android AVD Initialization Failed!!!!"
  }
  console.log(avdMsg)
  return avdMsg
}

async function appiumStart(appiumStartCmd, appiumCheckCmd) {
  const appiumCheckAttempts = 5
  let appiumOn = false
  let appiumMsg
  let i = 0

  console.log(appiumStartCmd)
  exec(appiumStartCmd, (error, stdout, stderr) => {
    let appiumOutput = `Appium stdout: ${stdout}`
    if (stderr) {
      appiumOutput = `${appiumOutput}\nAppium stderror: ${stderr}`
      console.log(`Appium stderror: ${stderr}`)
    }
    if (error) {
      appiumOutput = `${appiumOutput}\nAppium Error: ${error.message}`
      console.log(`Appium Error: ${error.message}`)
    }
    // A bit noisy, remove comment for debugging
    // console.log(appiumOutput);
  })
  while(appiumOn === false && i <= appiumCheckAttempts) {
    await sleep(3000)
    i++;
    exec(appiumCheckCmd, (error, stdout, stderr) => {
      let checkOutput = `${appiumCheckCmd}\n${stdout}`
      if (stderr) {
        checkOutput = `${checkOutput}\n${stderr}`
      }
      if (error) {
        checkOutput = `${checkOutput}\n${error.message}`
      }
      console.log(checkOutput)
      appiumOn = stdout.includes('LISTEN');
    })
  }
  if( appiumOn ) {
    appiumMsg = 'Success: Appium Server Started!!!'
  } else {
    appiumMsg = "Appium Server Initialization Failed!!!!"
  }
  console.log(appiumMsg)
  return appiumMsg
}
