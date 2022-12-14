### appium-wdio-cypress-demo
------------------------------------------------------------------------------------
#### LOCAL ENVIRONMENT SETUP
If this is the first time the repository is cloned, in order to set up your local environment, please do the following 

1. Execute the following commands in the project's terminal (if using Windows, run terminal as admin instead of using `sudo`):
```
    $ sudo npm install -g appium
    $ npm install
```

2. Make sure you have installed Android SDK

3. Open the Android SDK Manager, go to **SDK Tools** and click on `Android SDK Command-line Tools` to install it, click `Ok`.

4. Add the following system variables to your `$PATH`: `ANDROID_HOME`, `ANDROID_SDK_ROOT`, `ANDROID_AVD_HOME` and `JAVA_HOME`

5. Download the APK located in https://github.com/appium/appium/blob/master/packages/appium/sample-code/apps/ApiDemos-debug.apk

6. Open the Android SDK Manager, expand the **Android Version** with `API Level 30`, click on `Show Package Details`, select and install `Google APIs Intel x86 Atom System Image`.

7. Create at least **one Android AVD**. You can use this command to create a new AVD `avdmanager create avd -n DemoAVD -k "system-images;android-33;google_apis;arm64-v8a" -d pixel`.

8. In the file `cypress/e2e/Playground.feature`, update the value `DemoAVD` for **your respective AVD ID**, if you renamed it.

9. Test the correct setUp by running the Appium Script first, follow the instructions below in **APPIUM EXECUTION ONLY**

---
#### TEST EXECUTION (Cypress + Appium)
Cypress/cucumber test cases are used for testing the Playground application, to test them out, simply execute the following command:
```
    $ npx cypress run --headed --env avdHeadless=false // Will execute both Cypress and the AVD actions headed
    $ npx cypress run --headless --env avdHeadless=true  //// Will execute both Cypress and the AVD actions headless
```
To test individual scenario(s) inside a feature, tag any Scenario with @focus and run the test as usual
```
@focus (<--- Place tag here)
Scenario: ...
Given ...
When ...
Then ...
```
For custom tags, modify the TAG environment variable in the file `/cypress.config.js`:
```
"TAGS": "not @skip and @focus" // Will run only test with Tag @focus, if the test has NO Tags, it will NOT run
"TAGS": "not @skip" // Will skip test with @skip tags, tag @focus will not work either, will run any test without Tags???
```
---
#### APPIUM EXECUTION ONLY
If you wish to execute only the appium webdriver I/O script, do the following:
1. Start the respective Android AVD manually, terminal command: `emulator -avd DemoAVD -no-boot-anim`
2. Start the Appium Server manually, terminal command: `appium &`
3. Execute the following commands in the project's terminal:
```
    $ npx wdio run ./wdio.conf.js --spec "wdio/specs/playground/playground.test.js" --mochaOpts.grep "tabs and input"
```
If you wish to execute all of the scripts inside the spec file, remove the `mochaOpts.grep` option, or if you wish to specify one specific script, you can use that same parameter.

---
### References:
------------------------------------------------------------------------------------
#### Android System Variables
```
# Android Studio
export ANDROID_HOME=/Users/username/Library/Android/sdk
export ANDROID_SDK_ROOT=/Users/username/Library/Android/sdk
export PATH=$ANDROID_HOME/emulator:$PATH
export PATH=$ANDROID_HOME/cmdline-tools/latest/bin:$PATH
export PATH=$ANDROID_HOME/platform-tools:$PATH
```

Test with
`emulator -list-avds`
`avdmanager list`

#### Port Commands
`lsof -i :4723`
`lsof -i :5554`

`kill $(lsof -t -i :4723)`
`kill $(lsof -t -i :5554)`

#### AVD Creation and Start
`avdmanager create avd -n DemoAVD -k "system-images;android-30;google_apis;x86" -d pixel`
`$ANDROID_HOME/emulator/emulator -avd Pixel_2_API_30 -no-window -port 5554`

#### Appium Server Start
`$ sudo npm install -g appium`
`$ sudo npm install -g appium --unsafe-perm=true --allow-root`
https://github.com/appium/appium-inspector/releases
`appium -p 4723 &`

#### Appium Script Execution
`npx wdio run ./wdio.conf.js --spec "SPEC_NAME.js" --mochaOpts.grep "warning"`

#### Misc
https://gist.github.com/alvr/8db356880447d2c4bbe948ea92d22c23
https://stackoverflow.com/questions/38399465/how-to-get-list-of-all-timezones-in-javascript
https://webdriver.io/docs/api/element/touchAction

