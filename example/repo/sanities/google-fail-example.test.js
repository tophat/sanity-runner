describe('Google Fails', () => {
    test('Test that Google.com fails to find element ', async () => {
        await page.goto('https://www.google.com')
        await expect(page).not.toMatchElement('#thiswillfail')
    }, 30000)
})
