Feature: HeroApp WebPage Automation

Background: Authorized access
    Given I open the 'HeroApp' demo page

Scenario: Control Appium WDIO with node
    When I open the 'Playground' app in the Android 'Pixel_3a_API_33_arm64-v8a' device
    Then I can run a test 'tabs and input' on the 'Playground' app with WDIO
    # And I can come back to the browser