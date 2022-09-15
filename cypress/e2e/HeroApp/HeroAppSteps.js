/// <reference types="cypress" />

import { Given, When, Then, And } from "@badeball/cypress-cucumber-preprocessor"
import HeroAppQuery from '../../support/Selectors/HeroAppQuery';
import HeroAppObject from './HeroAppObject'

const baseURL = Cypress.env("HeroApp")
Cypress.config('baseUrl', baseURL)

before(() => {
    cy.determineOs()
    cy.stopAppiumServer()
    cy.stopAndroidAVD()
})

after(() => {
    cy.stopAppiumServer()
    cy.stopAndroidAVD()
})

// I click on the "Basic Auth" demo option
When('I click on the {string} demo option', (option) => {
    if (option === "Basic Auth") {
        HeroAppObject.basicAuthCatch()
    }

    HeroAppQuery.selectors(option).click()
})

// And I can come back to the browser
And('I can come back to the browser', () => {
    cy.visit('/')
})
