import { test, expect } from '@playwright/test';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

// Shared state
let browserInstance;
let context;
let page;

const Username = process.env.APP_USERNAME;
const Password = process.env.APP_PASSWORD;
const ManagerUsername = process.env.MANAGER_USERNAME;
const ManagerPassword = process.env.MANAGER_PASSWORD;
const environment = process.env.ENVIRONMENT;
const location = process.env.LOCATION;

console.log(Username, Password, environment, location);

// URLs & selectors based on environment
const appConfig  = {
  Beta: {
    url: 'https://betaapp.adit.com/auth/login',
    usernameField: 'Enter your username',
    passwordField: 'Enter your password'
  },
  Live: {
    url: 'https://app.adit.com/auth/login',
    usernameField: 'Username',
    passwordField: 'Password'
  }
};

const currentEnvConfig  = appConfig[environment];

// ---------- Hooks ----------
test.beforeAll(async ({ browser }) => {
  browserInstance = browser;
  context = await browser.newContext();
  page = await context.newPage();
});

test.afterEach(async ({}, testInfo) => {

  if (testInfo.status !== testInfo.expectedStatus) {

    const screenshot = await page.screenshot({
      fullPage: true
    });

    await testInfo.attach('Failure Screenshot', {
      body: screenshot,
      contentType: 'image/png',
    });
  }
});

test.afterAll(async () => {
  await page?.close();
  await context?.close();
  await browserInstance?.close();
});

function getRandomUser() {
  const randomNum = Date.now(); // ensures uniqueness

  // Generate random strings
  const firstName = Math.random().toString(36).substring(2, 8);
  const lastName = Math.random().toString(36).substring(2, 8) + randomNum.toString().slice(-4);

  // Capitalize first letter
  const format = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  const formattedFirstName = format(firstName);
  const formattedLastName = format(lastName);

  // Mobile (Indian format)
  const mobile = Math.floor(6000000000 + Math.random() * 4000000000);

  // Email with @adit.com
  const email = `${firstName}.${lastName}@adit.com`;

  return {
    firstName: formattedFirstName,
    lastName: formattedLastName,
    mobile,
    email
  };
}

let formID = '';
const user = getRandomUser();
let groupName = '';

// ---------- Tests ----------
test.describe('New Patient', () => {

  test('Step 1: Navigate to Login Page', async () => {
    await page.goto(currentEnvConfig.url);
  });

  test('Step 2: Verify Username textbox is visible and fill', async () => {
    const usernameTextbox = page.getByRole('textbox', { name: currentEnvConfig.usernameField });
    //await expect(usernameTextbox).toBeVisible();
    await usernameTextbox.fill(Username);
  });

  test('Step 3: Verify Password textbox is visible and fill', async () => {
    const passwordTextbox = page.getByRole('textbox', { name: currentEnvConfig.passwordField });
    //await expect(passwordTextbox).toBeVisible();
    await passwordTextbox.fill(Password);
  });

  test('Step 4: Verify Login button is visible and click', async () => {
    const loginButton = page.getByRole('button', { name: 'Login' });
    //await expect(loginButton).toBeVisible();
    await loginButton.click();
  });

  test('Step 5: If Rating pop up appears', async () => {
    const popupHeading = page.getByRole('heading', { name: 'Enjoying the Adit App?' });
    const closeButton = page.getByRole('button', { name: '' });

    if (await popupHeading.isVisible({ timeout: 3000 })) {
      await expect(closeButton).toBeVisible();
      await closeButton.click();
    }
  });

  test('Step 6: Verify Dashboard & close softphone popup', async () => {

    const closeSoftphone = page.locator('.e-popup-open .e-dlg-closeicon-btn');
    await closeSoftphone.click();
    
  });

  test('Step 7: Verify Location Dropdown is visible and click', async () => {
    const customIcon = page.locator('.custom-icon');
    await expect(customIcon).toBeVisible();
    await customIcon.click();
  });

    test('Step 8: Select Location', async () => {
        const locationOption = page.getByRole('option', { name: location }).first();
        //await expect(locationOption).toBeVisible();
        await locationOption.click();
    });

    test('Step 9: Opening Online Scheduling and validate Appointment page', async () => {
        await page.locator('.icon-Appt-Reminders').first().dblclick();

        await page.getByText('Appointment').first().click();
        await page.getByText('Open Request').first().click();
        await page.getByText('Spam').first().click();
    });

    // test('Step 10: Open Providers and validate', async () => {
    //     await page.getByRole('link', { name: 'Providers' }).first().click();
    //     await page.locator('ejs-switch.e-switch-wrapper').first().click();
    //     await expect(page.locator('.e-toast-content')).toContainText("The provider was successfully marked as");
    //     await page.waitForTimeout(4000);
    //     await page.locator('ejs-switch.e-switch-wrapper').first().click();
    //     await expect(page.locator('.e-toast-content')).toContainText("The provider was successfully marked as");
    //     await page.waitForTimeout(4000);
    //     await page.locator('.icon-editpen-new-icon').first().click();
    //     await page.getByRole('button', { name: 'Save' }).click();
    //     await expect(page.locator('.e-toast-content')).toContainText("Settings Updated Sucessfully!");
    // });

    // test('Step 11: Open Insurance and validate', async () => {
    //     await page.getByRole('link', { name: 'Insurances' }).first().click();
    //     await page.getByRole('heading', { name: 'Insurance' }).first().click();
    // });

    // // test('Step 12: Open Insurance and validate', async () => {
    // //     await page.getByRole('link', { name: 'Black List' }).first().click();
    // //     await page.getByRole('button', { name: 'Add Blockers' }).first().click();
    // //     await page.getByPlaceholder('First Name').fill('Test');
    // //     await page.getByPlaceholder('Last Name').fill('Automation');
    // //     await page.getByPlaceholder('Email').last().fill('Automation@adit.com');
    // //     await page.getByPlaceholder('(000) 000-0000').fill('1234567890');
    // //     await page.getByRole('button', { name: 'Save' }).last().click();
    // // });

    // test('Step 13: Open Preferences and validate', async () => {
    //     await page.getByRole('link', { name: 'Preferences' }).first().click();
    //     await page.getByRole('heading', { name: 'General Information' }).first().click();
    //     await page.getByRole('heading', { name: 'Appointment Request Settings' }).first().click();
    //     await page.getByRole('button', {name: 'Save' }).first().click();
    //     await expect(page.locator('.e-toast-content')).toContainText("Settings Updated Sucessfully!");
    // });

    test('Step 14: Open Services and validate', async () => {
        await page.getByRole('link', { name: 'Services' }).first().click();
        await page.getByText('Enabled').first().click();
        await page.getByText('Disabled').first().click();
        await page.getByText('All').first().click();
    });

    test('Step 15: Add Services ', async () => {
        await page.getByRole('button', { name: 'Add Service' }).first().click();
        await page.locator('input[formcontrolname="serviceName"]').fill('Automation');
        await page.locator('ejs-dropdownlist .e-input-group').click();
        await page.locator('.e-popup-open .e-list-item').first().click();
        await page.locator('mat-select[role="combobox"]').last().click();
        await page.locator('mat-option').filter({ hasText: 'Dragon' }).click();
        await page.locator('body').click({ position: { x: 5, y: 5 } });
        await page.getByRole('button', { name: 'Next' }).last().click();
        await page.waitForTimeout(10000);

        await page.locator('input.e-input[placeholder="Select"]').locator('..').first().click();
        await page.getByText('15 min', { exact: true }).click();
        await page.locator('span').filter({ hasText: 'null' }).click();
        await page.getByText('Bite Adjustment').first().click();

        await page.locator('ul.list-unstyled.d-flex.flex-wrap.align-items-center').click();
        await page.locator('td.e-gridchkbox .e-frame.e-uncheck').first().click();
        await page.getByRole('button', { name: 'Add' }).last().click();
        await page.getByRole('button', { name: 'Save' }).last().click();
        await page.waitForTimeout(4000);
        
        await page.locator('tr:has(a:text-is("Automation")) input[role="switch"]').click();
    });


});