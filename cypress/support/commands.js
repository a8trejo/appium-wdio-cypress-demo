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

let avdOn = false;
let appiumOn = false;
let capabilitiesJSON = {};
let appiumMsg;
let avdMsg;
let isLinux = false;
let command_adb;

Cypress.Commands.add('login', (pageName) => {
    let baseURL = Cypress.env(pageName)
    cy.visit(baseURL)
});

Cypress.Commands.add('logMsg', (logMsg) => {
    cy.task('logMsg', logMsg)
    cy.log(logMsg);
});

Cypress.Commands.add('getTimeStamp', timeFormat => {
    //Ex: cy.getTimeStamp('M/DD/YYYY, h:mm:ss A')
    return new Cypress.Promise((resolve, reject) => {
        let timeStamp = dayjs().format(timeFormat);
        resolve(timeStamp);
    });
});

Cypress.Commands.add('determineOs', () => {
    cy.logMsg('Cypres-platform: ' + Cypress.platform);
    isLinux = (Cypress.platform != 'win32') ? true : false;
})

Cypress.Commands.add('uninstallApp', (appName) => {
    cy.exec('adb uninstall ' + appsData[appName].package_name, { failOnNonZeroExit: false, timeout: appiumTimeout }).then(output => {
        if (output.stdout.includes('Success')) {
            cy.logMsg('Package uninstalled');
        } else {
            cy.logMsg('Nothing to uninstall');
        }
    })
})

Cypress.Commands.add('appiumScript', (actionScript, appName) => {
    const specFile = appName.toLowerCase() + '.test.js';
    //Example Command: npx wdio run ./wdio.conf.js --spec "playground.test.js" --mochaOpts.grep "Checkboxes"
    const npxCommand = 'npx wdio run ./wdio.conf.js --spec ' + specFile + ' --mochaOpts.grep "' + actionScript + '"'
    cy.logMsg('Playground takes up 30 seconds to process and send the logs to DataDog')
    cy.exec(npxCommand , {failOnNonZeroExit : false, timeout: appiumTimeout}).then( output => {
        let summary = output.stdout.split('Run onComplete hook')[1]
        if ( output.code == 0) {
            console.log(output.stdout)
            expect(summary).to.include('1 passed');
        } else {
            console.log(output.stdout)
            cy.logMsg("Exit code: " + output.code);
            expect(summary).to.include('1 passed');
        }
    });
});

Cypress.Commands.add('appiumCheck', () => {
    let portCommand = isLinux ? 'lsof -i :' + appiumPort + '' : 'netstat -noa | findStr "' + appiumPort + '" '

    cy.exec(portCommand, { failOnNonZeroExit: false }).then(output => {
        appiumOn = output.stdout.includes('LISTEN');
        cy.logMsg(output.stdout);
        if ( appiumOn == false) {
            appiumMsg = 'Appium Server Initialization Failed!!!';
        } else if (appiumOn == true) {
            appiumMsg = 'Appium Server Started!!!';
        }
    });
});

let i = 0;
let j = 0;
Cypress.Commands.add('startAppiumServer', () => {
    if (appiumOn == false || j < 1) {
        const serverPort = (appiumPort == '') ? '' : '-p ' + appiumPort + ' ';
        cy.task('appiumServerStart', serverPort)
        cy.wait(3000);
        cy.appiumCheck().then(() => {
            if (appiumOn == false) {
                cy.wait(3000);
                cy.appiumCheck().then(() => {
                    console.log(appiumMsg)
                    expect(appiumMsg).to.eq('Appium Server Started!!!');
                    j++;
                    cy.wait(1500);
                })
            } else {
                console.log(appiumMsg)
                expect(appiumMsg).to.eq('Appium Server Started!!!');
                j++;
                cy.wait(1500);
            }
        });
    }
});

Cypress.Commands.add('stopAppiumServer', () => {
    cy.killProcessByPort(appiumPort);
    appiumOn = false;
    appiumMsg = '';
});

Cypress.Commands.add('avdCheck', () => {
    //cy.exec('lsof -i :' + androidPort + '', { failOnNonZeroExit: false } ).then( output => {
    //    avdOn = output.stdout.includes('LISTEN');
    cy.exec(command_adb + ' devices', { failOnNonZeroExit: false }).then(output => {
        avdOn = output.stdout.includes('emulator');
        cy.logMsg(output.stdout);
        if ( avdOn == false) {
            avdMsg = "Android AVD Initialization Failed!!!!"
        } else if (avdOn == true) {
            avdMsg = 'Android AVD Started!!!';
        }
    });
});

Cypress.Commands.add('startAndroidAVD', (appName, androidAVD) => {
    const avdMode = (avdHeadless == true) ? '-no-window ':'';
    const avdPort = (androidPort == '') ? '': '-port ' +androidPort + ' ';

    command_adb = isLinux ? '$ANDROID_HOME/platform-tools/adb' : '"%ANDROID_HOME%/platform-tools/adb"'

    if (avdOn == false || i < 1) {
        cy.exec(command_adb + ' kill-server', { failOnNonZeroExit: false })
        cy.task('androidEmulatorStart', { avdName: androidAVD, headless: avdMode, port: avdPort, linux: isLinux },)
        cy.exec(command_adb + ' start-server', { failOnNonZeroExit: false })
        cy.wait(5000);
        cy.avdCheck().then(() => {
            if (avdOn == false) {
                cy.wait(3500);
                cy.avdCheck().then(() => {
                    console.log(avdMsg)
                    expect(avdMsg).to.eq('Android AVD Started!!!');
                    i++;
                    cy.uninstallApp(appName);
                    cy.wait(5500);
                })
            } else {
                console.log(avdMsg)
                expect(avdMsg).to.eq('Android AVD Started!!!');
                i++;
                cy.uninstallApp(appName);
                cy.wait(5500);
            }
        });
    }
});

Cypress.Commands.add('stopAndroidAVD', () => {
    const avdPort = (androidPort == '') ? '5554': androidPort;
    cy.killProcessByPort(avdPort, false);
    avdOn = false;
    avdMsg = '';
});

Cypress.Commands.add('killProcessByPort', (portNumber, force = true) => {
    var forceOpt = (force) ? ' /f' : ''
    cy.log('Trying to close services on port: ' + portNumber)
    if (isLinux) {
        cy.exec('kill $(lsof -t -i :' + portNumber + ')', { failOnNonZeroExit: false, log: false });
    }
    else {
        cy.exec('netstat -noa | findStr "' + portNumber, { failOnNonZeroExit: false }).then(output => {
            if (output.stdout.length > 10) {
                var processId = output.stdout.substring(output.stdout.search('ING') + 4, output.stdout.search('ING') + 20).match(/\d/g).join("");
                cy.log('closing the found process id: ' + processId)
                // 'taskkill /f /pid' + processId +' >> taskkillResults_' + portNumber + '_' + processId + '.txt '
                cy.exec('taskkill' + forceOpt + ' /pid ' + processId, { failOnNonZeroExit: false, log: false });
            }

        })
    }
});

Cypress.Commands.add('appiumCapabilities', (appToUse, deviceToUse, logBtn) => {
    const apkName = appsData[appToUse].apk_name
    //Example: "wdio/apk/app-debug.apk"
    const apkPath = Cypress.env('apkPath') + apkName;
    cy.readFile(capabilitiesPath).then(function(jsonContent) {
        capabilitiesJSON = jsonContent;
        capabilitiesJSON.platform = 'Android';
        capabilitiesJSON.androidDevice = deviceToUse;
        capabilitiesJSON.androidApp = apkPath;
        capabilitiesJSON.retries = appiumRetries;
        capabilitiesJSON.headless = avdHeadless;
        capabilitiesJSON.logToSend = logBtn;
        cy.writeFile(capabilitiesPath, capabilitiesJSON);
    });
});