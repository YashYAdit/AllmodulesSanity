# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\OnlineSchedulingSanity.spec.js >> New Patient >> Step 6: Verify Dashboard & close softphone popup
- Location: tests\OnlineSchedulingSanity.spec.js:130:7

# Error details

```
Error: locator.click: Target page, context or browser has been closed
Call log:
  - waiting for locator('.e-popup-open .e-dlg-closeicon-btn')

```

```
Error: page.screenshot: Target page, context or browser has been closed
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import fs from 'fs';
  3   | import dotenv from 'dotenv';
  4   | dotenv.config();
  5   | 
  6   | // Shared state
  7   | let browserInstance;
  8   | let context;
  9   | let page;
  10  | 
  11  | const Username = process.env.APP_USERNAME;
  12  | const Password = process.env.APP_PASSWORD;
  13  | const ManagerUsername = process.env.MANAGER_USERNAME;
  14  | const ManagerPassword = process.env.MANAGER_PASSWORD;
  15  | const environment = process.env.ENVIRONMENT;
  16  | const location = process.env.LOCATION;
  17  | 
  18  | console.log(Username, Password, environment, location);
  19  | 
  20  | // URLs & selectors based on environment
  21  | const appConfig  = {
  22  |   Beta: {
  23  |     url: 'https://betaapp.adit.com/auth/login',
  24  |     usernameField: 'Enter your username',
  25  |     passwordField: 'Enter your password'
  26  |   },
  27  |   Live: {
  28  |     url: 'https://app.adit.com/auth/login',
  29  |     usernameField: 'Username',
  30  |     passwordField: 'Password'
  31  |   }
  32  | };
  33  | 
  34  | const currentEnvConfig  = appConfig[environment];
  35  | 
  36  | // ---------- Hooks ----------
  37  | test.beforeAll(async ({ browser }) => {
  38  |   browserInstance = browser;
  39  |   context = await browser.newContext();
  40  |   page = await context.newPage();
  41  | });
  42  | 
  43  | test.afterEach(async ({}, testInfo) => {
  44  | 
  45  |   if (testInfo.status !== testInfo.expectedStatus) {
  46  | 
> 47  |     const screenshot = await page.screenshot({
      |                                   ^ Error: page.screenshot: Target page, context or browser has been closed
  48  |       fullPage: true
  49  |     });
  50  | 
  51  |     await testInfo.attach('Failure Screenshot', {
  52  |       body: screenshot,
  53  |       contentType: 'image/png',
  54  |     });
  55  |   }
  56  | });
  57  | 
  58  | test.afterAll(async () => {
  59  |   await page?.close();
  60  |   await context?.close();
  61  |   await browserInstance?.close();
  62  | });
  63  | 
  64  | function getRandomUser() {
  65  |   const randomNum = Date.now(); // ensures uniqueness
  66  | 
  67  |   // Generate random strings
  68  |   const firstName = Math.random().toString(36).substring(2, 8);
  69  |   const lastName = Math.random().toString(36).substring(2, 8) + randomNum.toString().slice(-4);
  70  | 
  71  |   // Capitalize first letter
  72  |   const format = (str) => str.charAt(0).toUpperCase() + str.slice(1);
  73  | 
  74  |   const formattedFirstName = format(firstName);
  75  |   const formattedLastName = format(lastName);
  76  | 
  77  |   // Mobile (Indian format)
  78  |   const mobile = Math.floor(6000000000 + Math.random() * 4000000000);
  79  | 
  80  |   // Email with @adit.com
  81  |   const email = `${firstName}.${lastName}@adit.com`;
  82  | 
  83  |   return {
  84  |     firstName: formattedFirstName,
  85  |     lastName: formattedLastName,
  86  |     mobile,
  87  |     email
  88  |   };
  89  | }
  90  | 
  91  | let formID = '';
  92  | const user = getRandomUser();
  93  | let groupName = '';
  94  | 
  95  | // ---------- Tests ----------
  96  | test.describe('New Patient', () => {
  97  | 
  98  |   test('Step 1: Navigate to Login Page', async () => {
  99  |     await page.goto(currentEnvConfig.url);
  100 |   });
  101 | 
  102 |   test('Step 2: Verify Username textbox is visible and fill', async () => {
  103 |     const usernameTextbox = page.getByRole('textbox', { name: currentEnvConfig.usernameField });
  104 |     //await expect(usernameTextbox).toBeVisible();
  105 |     await usernameTextbox.fill(Username);
  106 |   });
  107 | 
  108 |   test('Step 3: Verify Password textbox is visible and fill', async () => {
  109 |     const passwordTextbox = page.getByRole('textbox', { name: currentEnvConfig.passwordField });
  110 |     //await expect(passwordTextbox).toBeVisible();
  111 |     await passwordTextbox.fill(Password);
  112 |   });
  113 | 
  114 |   test('Step 4: Verify Login button is visible and click', async () => {
  115 |     const loginButton = page.getByRole('button', { name: 'Login' });
  116 |     //await expect(loginButton).toBeVisible();
  117 |     await loginButton.click();
  118 |   });
  119 | 
  120 |   test('Step 5: If Rating pop up appears', async () => {
  121 |     const popupHeading = page.getByRole('heading', { name: 'Enjoying the Adit App?' });
  122 |     const closeButton = page.getByRole('button', { name: '' });
  123 | 
  124 |     if (await popupHeading.isVisible({ timeout: 3000 })) {
  125 |       await expect(closeButton).toBeVisible();
  126 |       await closeButton.click();
  127 |     }
  128 |   });
  129 | 
  130 |   test('Step 6: Verify Dashboard & close softphone popup', async () => {
  131 | 
  132 |     const closeSoftphone = page.locator('.e-popup-open .e-dlg-closeicon-btn');
  133 |     await closeSoftphone.click();
  134 |     
  135 |   });
  136 | 
  137 |   test('Step 7: Verify Location Dropdown is visible and click', async () => {
  138 |     const customIcon = page.locator('.custom-icon');
  139 |     await expect(customIcon).toBeVisible();
  140 |     await customIcon.click();
  141 |   });
  142 | 
  143 |     test('Step 8: Select Location', async () => {
  144 |         const locationOption = page.getByRole('option', { name: location }).first();
  145 |         //await expect(locationOption).toBeVisible();
  146 |         await locationOption.click();
  147 |     });
```