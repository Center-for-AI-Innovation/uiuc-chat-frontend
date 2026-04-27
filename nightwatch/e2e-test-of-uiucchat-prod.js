/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- this is our only js file so far, just don't bother with types.
describe('test-ece-2', function () {
  before(function (browser) {
    browser.options.desiredCapabilities['goog:chromeOptions'] = {
      args: [
        '--headless=new',
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    }
  })

  it('tests test-ece-2', function (browser) {
    browser.timeouts('implicit', 10000)
    const message = `nightwatch-prod-smoke-${Date.now()}`

    browser
      .windowRect({ width: 955, height: 1045 })
      .navigateTo('https://www.uiuc.chat/ece120/chat')
      .waitForElementVisible('textarea.chat-input', 30000)
      .setValue('textarea.chat-input', message)
      .waitForElementVisible('button[aria-label="Send message"]', 10000)
      .click('button[aria-label="Send message"]')
      .useXpath()
      .waitForElementVisible(
        `//*[contains(normalize-space(.), "${message}")]`,
        30000,
      )
      .useCss()
      .waitForElementVisible('div[aria-live="polite"]', 30000)
      .assert.textMatches('div[aria-live="polite"]', /.+/)
      .end()
  })
})
