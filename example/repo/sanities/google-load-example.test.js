describe('Google Loads', () => {
    test('that Google.com is working', async () => {
        await page.goto('https://www.google.com')
        await expect(page).toMatchElement('#main')
    }, 30000)
})
