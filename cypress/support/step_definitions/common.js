/// <reference types="cypress" />

import { defineStep } from "@badeball/cypress-cucumber-preprocessor";
// import HeroAppQuery from '../Selectors/HeroAppQuery'

defineStep('I open the {string} demo page', (pageName) => {
    cy.login(pageName)
})
