describe('Google Loads', async () => {
    test('Test that Google.com is working ', async () => {
        await page.goto('https://www.google.com')
        await expect(page).toMatchElement('#main')
    }, 30000)
})
