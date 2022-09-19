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
        "TEST_TRIGGER": "local",
        "TAGS": "not @skip",
        "expandCollapseTime": 1500,
        "HeroApp": "https://the-internet.herokuapp.com/",
        "appiumTimeout": 60000,
        "appiumRetries": 3,
        "appiumPort": "4723",
        "appiumCapabilitiesPath": "cypress/config/appium.json",
        "androidPort": "5554",
        "apkPath": "wdio/apk",
        "avdHeadless": true,
    },
    setupNodeEvents,
  }
})

async function setupNodeEvents(on, config) {
  const testTrigger = config.env.TEST_TRIGGER || 'local'
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
    androidAVDStart({startCmd, checkCmd, testTrigger}){
      let avdMsg = emulatorStart(startCmd, checkCmd)
      return avdMsg
    },

    appiumServerStart( {startCmd, checkCmd} ){
      let appiumMsg = appiumStart(startCmd, checkCmd)
      return appiumMsg;
    }
  });
  
  return config;
}

function cleanReports() {
    const reportPath = './cypress/results/reports';
    if (fs.existsSync(reportPath)) {
        fs.rmdirSync('./cypress/results/reports', { recursive: true });
    }
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

async function emulatorStart(avdStartCmd, avdCheckCmd, testTrigger) {
  const avdCheckAttempts = (testTrigger === 'local')? 5 : 12
  const checkSleep = (testTrigger === 'local')? 3000 : 15000
  let avdOn = false
  let avdMsg
  let avdOutput
  let i = 0

  console.log(avdStartCmd)
  exec(avdStartCmd, (error, stdout, stderr) => {
    avdOutput = `AVD stdout: ${stdout}`
    if (stderr) {
      avdOutput = `${avdOutput}\nAVD stderror: ${stderr}`
      console.log(`AVD stderror: ${stderr}`);
    }
    if (error) {
      avdOutput = `${avdOutput}\nAVD Error: ${error.message}`
      console.log(`AVD Error: ${error.message}`);
    }
    console.log(avdOutput);
  })
  while(avdOn === false && i <= avdCheckAttempts) {
    await sleep(5000)
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
  let appiumOutput
  let i = 0

  console.log(appiumStartCmd)
  exec(appiumStartCmd, (error, stdout, stderr) => {
    appiumOutput = `Appium stdout: ${stdout}`
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
    console.log(appiumOutput);
  }
  console.log(appiumMsg)
  return appiumMsg
}
