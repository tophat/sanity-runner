# Sanity Test Repo Example 

## Running Example
```
bash bootstrap.sh 
make run-tests
```

## Example Tests

We provided some sample tests under the sanities folder. Outlined below is a high level description of how each of them work in order to act as some base examples.

### **google-load-example.test.js**
Confirms google loads correctly

```
describe('Google Loads', async () => {
    test('Test that Google.com is working ', async () => {
        await page.goto('https://www.google.com')
        await expect(page).toMatchElement('#main')
    }, 30000)
})

```

1. Goes to google.com
2. Confirms Element exists on the page

### **google-fail-example.test.js**
Confirms element is not on page

```
describe('Google Fails', async () => {
    test('Test that Google.com fails to find element ', async () => {
        await page.goto('https://www.google.com')
        await expect(page).not.toMatchElement('#thiswillfail')
    }, 30000)
})
```

1. Goes to www.google.com
2. Confirms Element does not exist on the page  

### **google-search.test.js**
Confirms Google Search is working

```
describe('Google Loads', async () => {
    test('Test Google Search is working ', async () => {
        await page.goto('https://www.google.com')
        await expect(page).toFill('[title=Search]', "Tophat\n")
        await page.waitFor(500)
        await expect(page.url()).toContain('search') 
    }, 30000)
})

```

1. Goes to www.google.com
2. Fills in Search Bar with string "Tophat"
3. Uses \n to simulate Enter Key
4. Waits for page to load
5. Ensures Search URL is present