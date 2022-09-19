/// <reference types="cypress" />

import HeroAppQuery from './Selectors/HeroAppQuery'

const dayjs = require('dayjs');

const appsData = require('../config/appium.json').appsMeta;
const appiumTimeout = Cypress.env('appiumTimeout');
const appiumRetries= Cypress.env('appiumRetries'); 
const appiumPort = Cypress.env('appiumPort');
const androidPort = Cypress.env('androidPort');
const capabilitiesPath = Cypress.env('appiumCapabilitiesPath');
const avdHeadless = Cypress.env('avdHeadless');
const avdBootTime = 50000;

let isLinux = false;

Cypress.Commands.add('login', (pageName) => {
    let baseURL = Cypress.env(pageName)
    cy.visit(baseURL)
});

Cypress.Commands.add('logMsg', (logMsg, logConsole) => {
    switch(logConsole) {
        case 'node': 
            cy.task('logMsg', logMsg)
        break;
        case 'cypress': 
            cy.log(logMsg)
        break;
        case 'browser': 
            console.log(logMsg)
        break
        case 'all':
            cy.task('logMsg', logMsg)
            cy.log(logMsg)
            console.log(logMsg)
        break
    }
});

Cypress.Commands.add('getTimeStamp', timeFormat => {
    //Ex: cy.getTimeStamp('M/DD/YYYY, h:mm:ss A')
    return new Cypress.Promise((resolve, reject) => {
        let timeStamp = dayjs().format(timeFormat);
        resolve(timeStamp);
    });
});

Cypress.Commands.add('determineOs', () => {
    cy.logMsg(`Cypres-platform: ${Cypress.platform}`, 'node');
    isLinux = (Cypress.platform != 'win32') ? true : false;
})

Cypress.Commands.add('startAndroidAVD', (androidAVD) => {
    const avdMode = (avdHeadless == true) ? '-no-window ':'';
    const avdPort = (androidPort == '') ? '': `-port ${androidPort}`;
    const avdBin = isLinux ? 'emulator': '"emulator.exe"'
    const hardwareAcceleration = (Cypress.env("TEST_TRIGGER") === 'local') ? '' : '-no-snapshot -gpu swiftshader_indirect '
    
    //Example: /Users/atrejo/Library/Android/sdk/emulator/emulator -avd Pixel_4_API_26 -no-window -port 5554
    const avdStartCmd = `${avdBin} -avd ${androidAVD} ${hardwareAcceleration}-no-boot-anim -no-audio ${avdMode} ${avdPort}`
    const avdCheckCmd = 'adb devices'
    cy.task('androidAVDStart', {startCmd:avdStartCmd, checkCmd:avdCheckCmd}).then((avdMsg) => {
        expect(avdMsg).to.include("Success")
    })
});

Cypress.Commands.add('startAppiumServer', () => {
    let serverPort = (appiumPort === '') ? '' : `-p ${appiumPort}`;
    const appiumCmd = `appium ${serverPort} &`
    let portCmd = isLinux ? `lsof -i :${appiumPort}` : `netstat -noa | findStr "${appiumPort}"`
    cy.task('appiumServerStart', {startCmd:appiumCmd, checkCmd:portCmd}).then((appiumMsg) => {
        expect(appiumMsg).to.include("Success")
    })
});

Cypress.Commands.add('stopAndroidAVD', () => {
    const avdPort = (androidPort == '') ? '5554': androidPort;
    cy.killProcessByPort(avdPort, false);
});


Cypress.Commands.add('stopAppiumServer', () => {
    cy.killProcessByPort(appiumPort);
});

Cypress.Commands.add('killProcessByPort', (portNumber, force = true) => {
    let forceOpt = (force) ? ' /f' : ''
    cy.log(`Trying to close services on port: ${portNumber}`)
    if (isLinux) {
        cy.exec(`kill $(lsof -t -i :${portNumber})`, { failOnNonZeroExit: false, log: false });
    }
    else {
        cy.exec(`netstat -noa | findStr "${portNumber}"`, { failOnNonZeroExit: false }).then(output => {
            if (output.stdout.length > 10) {
                let processId = output.stdout.substring(output.stdout.search('ING') + 4, output.stdout.search('ING') + 20).match(/\d/g).join("");
                cy.log('Closing the found process id: ' + processId)
                // 'taskkill /f /pid' + processId +' >> taskkillResults_' + portNumber + '_' + processId + '.txt '
                cy.exec(`'taskkill'${forceOpt} /pid ${processId}`, { failOnNonZeroExit: false, log: false });
            }
        })
    }
});

Cypress.Commands.add('appiumCapabilities', (appToUse, deviceToUse) => {
    const apkName = `${appsData[appToUse].apkName}.apk`
    const apkPath = `${Cypress.env('apkPath')}/${apkName}`;
    let appiumJSON = {};
    cy.readFile(capabilitiesPath).then((jsonContent) => {
        appiumJSON = {...jsonContent};
        appiumJSON.capabilities.platform = 'Android';
        appiumJSON.capabilities.androidDevice = deviceToUse;
        appiumJSON.capabilities.androidApp = apkPath;
        appiumJSON.capabilities.retries = appiumRetries;
        appiumJSON.capabilities.headless = avdHeadless;
        cy.writeFile(capabilitiesPath, appiumJSON);
    });
});


Cypress.Commands.add('appiumScript', (actionScript, appName) => {
    const specFile = appsData[appName].specPath
    const npxCommand = `npx wdio run ./wdio.conf.js --spec ${specFile} --mochaOpts.grep "${actionScript}"`
    //Example Command: npx wdio run ./wdio.conf.js --spec "wdio/specs/playground/playground.test.js" --mochaOpts.grep "Checkboxes"
    cy.logMsg(npxCommand, 'all')
    cy.exec(npxCommand , {failOnNonZeroExit : false, timeout: appiumTimeout}).then( output => {
        let summary = output.stdout.split('Run onComplete hook')[1]
        if ( output.code == 0) {
            cy.logMsg(`Appium Script Summary:\n${summary}`, 'node');
            expect(summary).to.include('1 passed');
        } else {
            cy.logMsg(`Appium Script Exit code: ${output.code}`, 'all');
            cy.logMsg(output.stdout, 'node')
            expect(summary).to.include('1 passed');
        }
    });
});

// When building an app on same repo, it is advised to uninstall it from the AVD to see the new app version properly reflected
Cypress.Commands.add('uninstallApp', (appName) => {
    cy.exec(`adb uninstall ${appsData[appName].packageName}`, { failOnNonZeroExit: false, timeout: appiumTimeout }).then(output => {
        if (output.stdout.includes('Success')) {
            cy.logMsg('Package Uninstalled Succesfully!', 'all');
        } else {
            cy.logMsg('Nothing to uninstall...','all');
        }
    })
})