/// <reference types="cypress" />

import { defineStep } from "@badeball/cypress-cucumber-preprocessor";
// import HeroAppQuery from '../Selectors/HeroAppQuery'

defineStep('I open the {string} demo page', (pageName) => {
    cy.login(pageName)
})

defineStep('I open the {string} app in the Android {string} device', (appName, androidDevice) => {
  cy.startAndroidAVD(appName, androidDevice);
  cy.startAppiumServer();
  cy.appiumCapabilities(mobileApp, androidDevice, mobileAction);
});