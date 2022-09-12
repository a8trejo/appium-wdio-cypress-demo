/// <reference types="cypress" />

import { Given, When, Then, And } from "@badeball/cypress-cucumber-preprocessor"
import HeroAppQuery from '../../support/Selectors/HeroAppQuery';
import HeroAppObject from './HeroAppObject'

// I click on the "Basic Auth" demo option
When('I click on the {string} demo option', (option) => {
    if (option === "Basic Auth") {
        HeroAppObject.basicAuthCatch()
    }

    HeroAppQuery.selectors(option).click()
})
