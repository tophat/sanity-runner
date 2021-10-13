/**
 * @Owner Experience: Assessment                                 
 * @Slack #bot-proving-ground, asdasd, #asdasd
 * @Runbook https://tophat.atlassian.net/wiki/spaces/TOP/pages/885358599/Sanity+Slack+Failure+-+Runbook
 * @Description
 *  - confirms healthcheck api loads
 */

describe('Google Fails', async () => {
    test('Test that Google.com fails to find element ', async () => {
        await page.goto('https://www.google.com')
        await expect("Asdas").toEqual("!23123")
        await expect(page).not.toMatchElement('#thiswillfail')
    }, 30000)
})
