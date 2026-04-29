import { test, expect } from '@playwright/test';

// Shared state
let context;
let page;

const Username = 'ninjas@owner';
const Password = 'Ninjas@owner00';
const environment = 'Live';
const location = 'Aurora';

// URLs & selectors based on environment
const config = {
  Stage: {
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

const env = config[environment];

// ---------- Hooks ----------
test.beforeAll(async ({ browser }) => {
  context = await browser.newContext();
  page = await context.newPage();
});

test.afterEach(async ({}, testInfo) => {
  if (page) {
    await testInfo.attach(testInfo.title, {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
  }
});

test.afterAll(async () => {
  await context.close();
});

// ---------- Tests ----------
test.describe('Appointment Page', () => {

  let formID = '';

  test('Step 1: Navigate to Login Page', async () => {
    await page.goto(env.url);
  });

  test('Step 2: Verify Username textbox is visible and fill', async () => {
    const usernameTextbox = page.getByRole('textbox', { name: env.usernameField });
    await expect(usernameTextbox).toBeVisible();
    await usernameTextbox.fill(Username);
  });

  test('Step 3: Verify Password textbox is visible and fill', async () => {
    const passwordTextbox = page.getByRole('textbox', { name: env.passwordField });
    await expect(passwordTextbox).toBeVisible();
    await passwordTextbox.fill(Password);
  });

  test('Step 4: Verify Login button is visible and click', async () => {
    const loginButton = page.getByRole('button', { name: 'Login' });
    await expect(loginButton).toBeVisible();
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
    const locationOption = page.getByRole('option', { name: location });
    await expect(locationOption).toBeVisible();
    await locationOption.click();
  });

  test('Step 9: Opening Patient Forms', async () => {
    await page.getByRole('link', { name: '' }).click();
  });

  test('Step 10: Click initial link and button', async () => {
    await page.getByRole('link').nth(1).click();
    await page.getByLabel('', { exact: true })
      .getByRole('button')
      .filter({ hasText: /^$/ })
      .click();
    await page.locator('.icon-Patient-Form.white-color').click();
  });

  test('Step 11: Select First Name from dropdown', async () => {
    const firstNameDropdown = page.getByRole('combobox', { name: /First Name/i });
    await firstNameDropdown.click();
    await firstNameDropdown.fill('pfsanity');
    await page.getByText('pfsanity automation454-545-').click();
  });

  test('Step 12: Click Next button', async () => {
    await page.getByRole('button', { name: /Next/i }).click();
  });

  test('Step 13: Assign new form', async () => {
    await page.getByRole('button', { name: /Assign New Form/i }).click();

    await page.locator('.assign-new-form-check')
      .locator('.inner-check-block', {
        has: page.locator('.assign-new-checktext span', { hasText: 'SanityPFAutomation' })
      })
      .locator('input[type="checkbox"]')
      .check();
  });

  test('Step 14: Save & Send', async () => {
    await page.getByRole('button', { name: /Save/i }).click();
    await page.getByRole('button', { name: /Send/i }).click();
  });

  test('Step 15: Open patient and click Edit (handle popup)', async () => {
    await page.getByRole('tab', { name: 'Requested' }).click();
    await page.getByRole('link', { name: 'pfsanity automation' }).first().click();

    const url = page.url();
    formID = url.split('/').pop();
        console.log('Expected Form ID: ', formID);

    const [popup] = await Promise.all([
      page.waitForEvent('popup'),
      page.getByRole('button', { name: /Edit/i }).click()
    ]);

    global.popup = popup;
  });

  test('Step 16: Fill patient form in popup', async () => {
    const popup = global.popup;

    const fillField = async (label, value) => {
      const field = popup.locator('adittech-single-line-textbox')
        .filter({ hasText: label })
        .getByRole('textbox');
      await field.click();
      await field.fill(value);
    };

    await fillField('Last Name', 'automation');
    await fillField('First Name', 'pfsanity');

    await popup.locator('adittech-textbox-date').getByRole('textbox').click();
    await popup.getByLabel('Select year').selectOption('2000');
    await popup.getByLabel('Select month').selectOption('0');
    await popup.getByRole('link', { name: '1', exact: true }).click();

    const emailField = popup.locator('adittech-textbox-email');
    await expect(emailField).toContainText('Email'); // wait for Angular
    await emailField.getByRole('textbox').fill('qa@adit.com');

    await fillField('Address', 'asdasdasd');
    await fillField('City', 'asdsadas');
    await fillField('State', 'dsaddsas');
    await fillField('ZIP', '2528845');

    await popup.locator('adittech-textbox-phone').filter({ hasText: 'Mobile Number' })
      .getByRole('textbox').fill('(454) 545-4545');

    await popup.locator('adittech-selection-dropdown').filter({ hasText: 'Preferred Provider' })
      .getByRole('combobox').click();
    await popup.getByRole('option', { name: 'Default Provider' }).click();

    await popup.locator('adittech-selection-dropdown').filter({ hasText: 'Marital Status' })
      .getByRole('combobox').click();
    await popup.getByRole('option', { name: 'Single' }).click();

    await popup.locator('adittech-selection-dropdown').filter({ hasText: 'Gender' })
      .getByRole('combobox').click();
    await popup.getByRole('option', { name: 'Male', exact: true }).click();

    await popup.getByRole('link', { name: 'Submit' }).click();
  });

  test('Step 17: Navigate to Submissions page', async () => {
    await page.bringToFront();
    await page.getByRole('link', { name: /Submissions/i }).click();
  });

  test('Step 18: Approve Form', async () => {
    await page.getByRole('tab', { name: 'Submitted' }).click();
    await page.locator('tr')
      .filter({ hasText: 'pfsanity automation' })
      .first()
      .getByRole('button')
      .click();
      const responsePromise = page.waitForResponse(response =>
        response.url().includes('/patient-form/forms/get-patient-form-submissions-list') &&
        response.request().method() === 'POST'
      );
      // Wait until API is called and completed
    const response = await responsePromise;
    if (response.ok()) {
      console.log('✅ API called successfully');
    }
  });

  test('Step 19: Imported Tab', async () => {
    await page.getByRole('tab', { name: 'Imported' }).click();
    await page.getByText('Date Submitted').click();
    await page.getByText('Date Submitted').click();
    await page.getByRole('link', { name: 'pfsanity automation' }).first().click();
    const url = page.url();
    const id = url.split('/').pop();
    console.log('Form ID: ', id);

    if(formID !== id) {
      throw new Error('Form ID does not match');
    }else{
      console.group('Form Validation');
      console.log('✅ Form ID matches');
      console.log('✅ Form is verified');
      console.groupEnd();
    }
  });

});