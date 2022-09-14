/// <reference types="cypress" />

import { defineStep } from "@badeball/cypress-cucumber-preprocessor";
// import HeroAppQuery from '../Selectors/HeroAppQuery'

defineStep('I open the {string} demo page', (pageName) => {
    cy.login(pageName)
})

// I open the 'Playground' app in the Android 'Pixel_3a_API_33_arm64' device
defineStep('I open the {string} app in the Android {string} device', (mobileApp, androidDevice) => {
    cy.startAndroidAVD(androidDevice);
    cy.startAppiumServer();
    cy.appiumCapabilities(mobileApp, androidDevice);
});

// I can run a test 'tabs and input' on the 'Playground' app with WDIO
defineStep('I can run a test {string} on the {string} app with WDIO', (scriptName, appName) => {
    cy.appiumScript(scriptName, appName)
})