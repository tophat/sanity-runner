describe('Google Loads', () => {
    test('Test Google Search is working ', async () => {
        await page.goto('https://www.google.com')
        await expect(page).toFill('[title=Search]', "Tophat\n")
        await page.waitFor(500)
        await expect(page.url()).toContain('search') 
    }, 30000)
})

