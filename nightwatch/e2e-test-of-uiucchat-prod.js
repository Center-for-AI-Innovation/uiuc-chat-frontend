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

    browser
      .windowRect({ width: 955, height: 1045 })
      .navigateTo('https://www.uiuc.chat/ece120/chat')
      .pause(5000)
      .click('textarea')
      .setValue('textarea', 'hi')
      .perform(function () {
        const actions = this.actions({ async: true })

        return actions.keyDown(this.Keys.ENTER)
      })
      .perform(function () {
        const actions = this.actions({ async: true })

        return actions.keyUp(this.Keys.ENTER)
      })
      // Add waitForElementVisible before clicking
      .waitForElementVisible(
        'div.bg-gray-50\\/50 div.dark\\:prose-invert > div > div.w-full > div',
        15000,
      )
      .click(
        'div.bg-gray-50\\/50 div.dark\\:prose-invert > div > div.w-full > div',
      )
      .pause(5000)
      .getText(
        'div.bg-gray-50\\/50 div.dark\\:prose-invert > div > div.w-full > div',
        function (result) {
          console.log('Text content:', result.value)
          // this.assert.ok(result.value.length > 0, 'Response text should not be empty');
          const responseText = String(result.value)
          this.assert.ok(
            responseText.length > 0,
            'Response text should not be empty',
          )
        },
      )
      .end()
  })
})
