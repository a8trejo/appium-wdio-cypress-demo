/// <reference types="cypress" />

import HeroAppQuery from '../../support/Selectors/HeroAppQuery'

class HeroAppObject {
    static basicAuthCatch () {
        const encodedAuth = Cypress.env("encodedAuth")

        // Preparing to intercept the /basic_auth request and add the auth header once we click on login
        cy.intercept('GET', '**/basic_auth', (req) => {
            req.headers['authorization'] = `Basic ${encodedAuth}`
        })
    }
}

export default HeroAppObject;