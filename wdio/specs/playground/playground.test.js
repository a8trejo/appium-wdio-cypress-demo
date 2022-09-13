const expect = require('chai').expect;
const appiumJson = require('../../../cypress/config/appium.json');
const playgroundObject = require('./playgroundPageObject');
const logsRecords = require('../../testData/logs.json');

describe ('Playground Actions', () => {
    before(()=>{
        driver.reset();
        // driver.setNetworkConnection(6);
    })

    it ('tabs and input text', async () => {
        console.log("----------------------------------------------------------")
        console.log("Tabs and Input Test Case")
        console.log("----------------------------------------------------------")
        // const appMenu = await $(playgroundObject._menuOption("appMenu"));
        const appMenu = await $("//android.widget.TextView[@content-desc='App']");
        //await appMenu.touchAction({action: 'tab'});
        await appMenu.click()
        

        const searchMenu = await $(playgroundObject._menuOption("searchMenu"));
        await searchMenu.click()

        const invokeSearch = await $(playgroundObject._menuOption("Invoke Search"));
        await invokeSearch.click()

        const prefillQuery = await $(playgroundObject.prefillQuery)
        await prefillQuery.setValue("-----YES---------")
    })
})