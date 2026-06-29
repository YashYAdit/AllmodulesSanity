import { test, expect } from '@playwright/test';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

// Shared state
let context;
let page;

const Username = process.env.APP_USERNAME;
const Password = process.env.APP_PASSWORD;
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
  await context.close();
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

// ---------- Tests ----------
test.describe('New Patient', () => {

  test('Step 1: Navigate to Login Page', async () => {
    await page.goto(currentEnvConfig.url);
  });

  test('Step 2: Verify Username textbox is visible and fill', async () => {
    const usernameTextbox = page.getByRole('textbox', { name: currentEnvConfig.usernameField });
    await expect(usernameTextbox).toBeVisible();
    await usernameTextbox.fill(Username);
  });

  test('Step 3: Verify Password textbox is visible and fill', async () => {
    const passwordTextbox = page.getByRole('textbox', { name: currentEnvConfig.passwordField });
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
    const locationOption = page.getByRole('option', { name: location }).first();
    //await expect(locationOption).toBeVisible();
    await locationOption.click();
  });

  test('Step 9: Opening Patient Forms', async () => {
    await page.locator('.icon-Patient-Form').first().click();
    await page.waitForTimeout(4000);
  });

  test('Step 10: Click initial link and button', async () => {
    await page.locator('i.icon-new-add-icon').click();
    await page.waitForTimeout(2000);
    const popupText = page.getByText('Why and How to Register Business for 10DLC');

    if (await popupText.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('✅ 10DLC Popup is visible');
      await page.getByLabel('', { exact: true }).getByRole('button').filter({ hasText: /^$/ }).last().click();
    }
    
    await page.locator('.icon-Patient-Form.white-color').click();
  });

  test('Step 11: Fill details', async () => {

        await page.getByRole('combobox', { name: 'First Name*' }).click();
        await page.getByRole('combobox', { name: 'First Name*' }).fill(user.firstName);
        await page.getByRole('combobox', { name: 'Last Name*' }).click();
        await page.getByRole('combobox', { name: 'Last Name*' }).fill(user.lastName);
        await page.waitForTimeout(2000);
        await page.getByRole('textbox', { name: 'Cell phone' }).click();
        await page.getByRole('textbox', { name: 'Cell phone' }).fill(user.mobile.toString());
        await page.getByRole('textbox', { name: 'Email' }).click();
        await page.getByRole('textbox', { name: 'Email' }).fill(user.email);
        await page.waitForTimeout(2000);
        await page.getByRole('combobox', { name: 'dropdownlist' }).first().click();
        await page.getByText('Lead', { exact: true }).click();
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
    const response = await page.waitForResponse(response =>
      response.url().includes('/patient-form/send-form-request') &&
      response.request().method() === 'POST'
    );
  });


  test('Step 15: Open patient and click Edit (handle popup)', async () => {
    await page.waitForTimeout(2000);
      await page.getByRole('tab', { name: 'Requested' }).click();
      await page.getByText(user.firstName +' '+ user.lastName).first().click();
  
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

    // await fillField('Last Name', 'automation');
    // await fillField('First Name', 'pfsanity');

    await popup.locator('adittech-textbox-date').getByRole('textbox').click();
    await popup.getByLabel('Select year').selectOption('2000');
    await popup.getByLabel('Select month').selectOption('0');
    await popup.getByRole('link', { name: '1', exact: true }).click();

    // const emailField = popup.locator('adittech-textbox-email');
    // await expect(emailField).toContainText('Email'); // wait for Angular
    // await emailField.getByRole('textbox').fill('qa@adit.com');

    await fillField('Address', 'asdasdasd');
    await fillField('City', 'asdsadas');
    await fillField('State', 'dsaddsas');
    await fillField('ZIP', '2528845');

    // await popup.locator('adittech-textbox-phone').filter({ hasText: 'Mobile Number' })
    //   .getByRole('textbox').fill('(454) 545-4545');

    await popup.locator('adittech-selection-dropdown').filter({ hasText: 'Preferred Provider' })
      .getByRole('combobox').click();
    await popup.getByRole('option', { name: 'Default Provider' }).click();

    await popup.locator('adittech-selection-dropdown').filter({ hasText: 'Marital Status' })
      .getByRole('combobox').click();
    await popup.getByRole('option', { name: 'Single' }).click();

    await popup.locator('adittech-selection-dropdown').filter({ hasText: 'Gender' }).getByRole('combobox').click();
    await popup.getByRole('option', { name: 'Male', exact: true }).click();

    await popup.locator('#submit').first().click();
  });

  test('Step 17: Navigate to Submissions page', async () => {
    await page.bringToFront();
    await page.getByRole('link', { name: /Submissions/i }).click();
  });

  test('Step 18: Approve Form', async () => {
    await page.waitForTimeout(2000);
      await page.getByRole('tab', { name: 'Submitted' }).click();
      await page.locator('tr')
        .filter({ hasText: user.firstName + ' ' + user.lastName })
        .first()
        .getByRole('button')
        .click();

        await page.locator('.icon-user-invite').click();
        await page.getByRole('button', { name: 'Add Patient & Approve Form' }).click();
        
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
      await page.waitForTimeout(3000);
      await page.getByRole('tab', { name: 'Imported' }).click();
      await page.getByText('Date Submitted').click();
      await page.getByText('Date Submitted').click();
      await page.getByText(user.firstName +' '+ user.lastName).first().click();
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
      console.log('---------------------------------New Patient Flow Ended---------------------------------');
    });

});

//---------------------------------------------------------- Existing Patient ----------------------------------------------------------

test.describe('Existing Patient', () => {

  formID = '';

    test('Step 1: Navigate to Submissions page', async () => {
        await page.getByRole('link', { name: /Submissions/i }).click();
    });

  test('Step 10: Click initial link and button', async () => {
    await page.locator('i.icon-new-add-icon').first().click();
    // await page.getByLabel('', { exact: true })
    //   .getByRole('button')
    //   .filter({ hasText: /^$/ })
    //   .click();
    await page.locator('.icon-Patient-Form.white-color').click();
  });

  test('Step 11: Select First Name from dropdown', async () => {
    const firstNameDropdown = page.getByRole('combobox', { name: /First Name/i });
    await firstNameDropdown.click();
    await firstNameDropdown.fill(user.firstName);
    //await page.getByText('8ikshr L39abd9331').click();

    const option = page.locator('mat-option', {
        hasText: user.firstName+' '+user.lastName
    });

    await option.waitFor();
    await option.click();

    //await page.getByText(user.firstName+' '+user.lastName).first().click();
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

  test('Step 15: open engage', async () => {
    await page.locator('.icon-Engage').first().click();
    await page.waitForTimeout(5000);
  });

  test('Step 16: Click Search', async () => {
    await page.getByText('Search').click();
    await page.getByRole('textbox', { name: 'Search by name or number' }).click();
    await page.getByRole('textbox', { name: 'Search by name or number' }).fill(user.firstName+' '+user.lastName);
    await page.waitForTimeout(4000);
    await page.getByText(user.firstName+' '+user.lastName).click();
    await page.waitForTimeout(4000);
    await page.getByText(user.firstName+' '+user.lastName).first().click();
  });

  // test('Step 17: verity message', async () => {
  //       const lastMessage = page
  //       .locator('#smschatroomcol2 .messagerowgraybox')
  //       .last();

  //       const timeText = await lastMessage
  //       .locator('.sender-name .time')
  //       .innerText();

  //       function parseTime(timeStr) {
  //           const now = new Date();

  //           const [time, modifier] = timeStr.split(' ');
  //           let [hours, minutes] = time.split(':').map(Number);

  //           if (modifier.toLowerCase() === 'pm' && hours !== 12) hours += 12;
  //           if (modifier.toLowerCase() === 'am' && hours === 12) hours = 0;

  //           const messageTime = new Date(now);
  //           messageTime.setHours(hours, minutes, 0, 0);

  //           return messageTime;
  //       }

  //       const messageTime = parseTime(timeText);
  //       const now = new Date();

  //       const diffInMinutes = Math.abs(now - messageTime) / (1000 * 60);

  //       if (diffInMinutes <= 2) {
  //       console.log('✅ Message is recent');
  //       } else {
  //       throw new Error(`❌ Message too old: ${timeText}`);
  //       }
  // });

  
  test('Step 14: Open Patient Forms Again' , async () => {
    await page.locator('.icon-Patient-Form').first().click();
  });


  test('Step 15: Open patient and click Edit (handle popup)', async () => {
    await page.waitForTimeout(2000);
    await page.getByRole('tab', { name: 'Requested' }).click();
    await page.getByText(user.firstName +' '+ user.lastName).first().click();

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

    // await fillField('Last Name', 'automation');
    // await fillField('First Name', 'pfsanity');

    await popup.locator('adittech-textbox-date').getByRole('textbox').click();
    await popup.getByLabel('Select year').selectOption('2000');
    await popup.getByLabel('Select month').selectOption('0');
    await popup.getByRole('link', { name: '1', exact: true }).click();

    // const emailField = popup.locator('adittech-textbox-email');
    // await expect(emailField).toContainText('Email'); // wait for Angular
    // await emailField.getByRole('textbox').fill('qa@adit.com');

    await fillField('Address', 'asdasdasd');
    await fillField('City', 'asdsadas');
    await fillField('State', 'dsaddsas');
    await fillField('ZIP', '2528845');

    // await popup.locator('adittech-textbox-phone').filter({ hasText: 'Mobile Number' })
    //   .getByRole('textbox').fill('(454) 545-4545');

    await popup.locator('adittech-selection-dropdown').filter({ hasText: 'Preferred Provider' })
      .getByRole('combobox').click();
    await popup.getByRole('option', { name: 'Default Provider' }).click();

    await popup.locator('adittech-selection-dropdown').filter({ hasText: 'Marital Status' })
      .getByRole('combobox').click();
    await popup.getByRole('option', { name: 'Single' }).click();

    await popup.locator('adittech-selection-dropdown').filter({ hasText: 'Gender' })
      .getByRole('combobox').click();
    await popup.getByRole('option', { name: 'Male', exact: true }).click();

    await popup.locator('#submit').first().click();
  });

  test('Step 17: Navigate to Submissions page', async () => {
    await page.bringToFront();
    await page.getByRole('link', { name: /Submissions/i }).click();
  });

  test('Step 18: Approve Form', async () => {
    await page.waitForTimeout(2000);
    await page.getByRole('tab', { name: 'Submitted' }).click();
    await page.locator('tr')
      .filter({ hasText: user.firstName+' '+user.lastName })
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
    await page.waitForTimeout(2000);
    await page.getByRole('tab', { name: 'Imported' }).click();
    await page.getByText('Date Submitted').click();
    await page.getByText('Date Submitted').click();
    await page.getByText(user.firstName +' '+ user.lastName).first().click();
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
    console.log('---------------------------------Existing Patient Flow Ended---------------------------------');
  });
  
});
//----------------------------------------------------- Engage -----------------------------------------------------

test.describe('Engage Page', () => {

  formID = '';

  test('Step 20: open engage', async () => {
    await page.locator('.icon-Engage').first().click();
  });

  test('Step 21: Click Search', async () => {
    await page.getByText('Search').click();
    await page.getByRole('textbox', { name: 'Search by name or number' }).click();
    await page.getByRole('textbox', { name: 'Search by name or number' }).fill(user.firstName+' '+user.lastName);
    await page.waitForTimeout(2000);
    await page.getByText(user.firstName+' '+user.lastName).click();
    await page.waitForTimeout(2000);
  });

  test('Step 22: send engage message', async () => {
      await page.locator('#dropdownMenuButton').click();
      await page.locator('i.icon-Patient-Form-old').click();
  });

  test('Step 23: Assign new form', async () => {
    await page.getByRole('button', { name: /Assign New Form/i }).click();

    await page.locator('.assign-new-form-check')
      .locator('.inner-check-block', {
        has: page.locator('.assign-new-checktext span', { hasText: 'SanityPFAutomation' })
      })
      .locator('input[type="checkbox"]')
      .check();
  });

  test('Step 24: Save & Send', async () => {
    await page.getByRole('button', { name: /Save/i }).click();
    await page.getByRole('button', { name: 'Select' }).click();
    await page.locator('.icon-send-round').click();

    const responsePromise = page.waitForResponse(response =>
        response.url().includes('/engage/sms') &&
        response.request().method() === 'POST'
      );
      // Wait until API is called and completed
    const response = await responsePromise;
    if (response.ok()) {
      console.log('✅ SMS Sent API called successfully');
      console.log('⌛ Wait for 4 seconds');
      await page.waitForTimeout(4000);
    }
  });

  test('Step 31: open sent link', async () => {
    let popup;

  if (environment !== 'Beta') {
    [popup] = await Promise.all([
      page.waitForEvent('popup'),
      page.locator('#smschatroomcol2 a[href^="https://k.adit.com/"]')
      .last()
      .click()
    ]);
    } else {
      [popup] = await Promise.all([
        page.waitForEvent('popup'),
        page.locator('#smschatroomcol2 a[href^="https://short-beta.adit.com/"]')
          .last()
          .click()
      ]);
    }

    global.popup = popup;

    const response = await popup.waitForResponse(res =>
      res.url().includes('/patient-form/get-forms-by-patientId') &&
      res.status() === 200
    );

    const data = await response.json();
    formID = data.data[0].submitted_form_id;
  });

  test('Step 26: Fill patient form in popup', async () => {
    const popup = global.popup;
    

    const fillField = async (label, value) => {
      const field = popup.locator('adittech-single-line-textbox')
        .filter({ hasText: label })
        .getByRole('textbox');
      await field.click();
      await field.fill(value);
    };

    // await fillField('Last Name', 'automation');
    // await fillField('First Name', 'pfsanity');

    await popup.locator('adittech-textbox-date').getByRole('textbox').click();
    await popup.getByLabel('Select year').selectOption('2000');
    await popup.getByLabel('Select month').selectOption('0');
    await popup.getByRole('link', { name: '1', exact: true }).click();

    // const emailField = popup.locator('adittech-textbox-email');
    // await expect(emailField).toContainText('Email'); // wait for Angular
    // await emailField.getByRole('textbox').fill('qa@adit.com');

    await fillField('Address', 'asdasdasd');
    await fillField('City', 'asdsadas');
    await fillField('State', 'dsaddsas');
    await fillField('ZIP', '2528845');

    // await popup.locator('adittech-textbox-phone').filter({ hasText: 'Mobile Number' })
    //   .getByRole('textbox').fill('(454) 545-4545');

    await popup.locator('adittech-selection-dropdown').filter({ hasText: 'Preferred Provider' })
      .getByRole('combobox').click();
    await popup.getByRole('option', { name: 'Default Provider' }).click();

    await popup.locator('adittech-selection-dropdown').filter({ hasText: 'Marital Status' })
      .getByRole('combobox').click();
    await popup.getByRole('option', { name: 'Single' }).click();

    await popup.locator('adittech-selection-dropdown').filter({ hasText: 'Gender' })
      .getByRole('combobox').click();
    await popup.getByRole('option', { name: 'Male', exact: true }).click();

    await popup.locator('#submit').first().click();
  });

  test('Step 27: Navigate to Submissions page', async () => {
    await page.bringToFront();
    await page.locator('.icon-Patient-Form').first().click();
    await page.getByRole('link', { name: /Submissions/i }).click();
  });

  test('Step 28: Approve Form', async () => {
    await page.waitForTimeout(2000);
    await page.getByRole('tab', { name: 'Submitted' }).click();
    await page.locator('tr')
      .filter({ hasText: user.firstName+' '+user.lastName })
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

  test('Step 29: Imported Tab', async () => {
    await page.waitForTimeout(2000);
    await page.getByRole('tab', { name: 'Imported' }).click();
    await page.getByText('Date Submitted').click();
    await page.getByText('Date Submitted').click();
    await page.getByText(user.firstName +' '+ user.lastName).first().click();
    const url = page.url();
    const id = url.split('/').pop();
    console.log('Form ID: ', id);

    if(formID !== id) {
      throw new Error('Form ID does not match');
    }else{
      console.group('Form Validation');
      console.log('✅ Form ID matches in Engage');
      console.log('✅ Form is verified in Engage');
      console.groupEnd();
    }
    console.log('---------------------------------Engage flow Ended---------------------------------');
  });
  
});

test.describe('TX Plan Page', () => {
  test('Step 1: TX Plan Open', async () => {
    await page.getByRole('link', { name: 'TX Plans' }).click();
  });

  test('Step 2: New TX Plan', async () => {
    await page.getByRole('button', { name: 'New Plan' }).click();
  });

  test('Step 3: Fill Details in TX Plan', async () => {
    await page.getByRole('combobox', { name: 'Patient Name' }).click();
    await page.getByRole('combobox', { name: 'Patient Name' }).fill(user.firstName + ' ' + user.lastName);
    await page.waitForTimeout(2000);
    await page.getByText(user.firstName+' '+user.lastName).click();
    await page.waitForTimeout(2000);
    await page.getByRole('textbox', { name: 'Treatment Plan Name' }).click();
    await page.getByRole('textbox', { name: 'Treatment Plan Name' }).fill(user.firstName +'SanityPFAutomation');
    await page.waitForTimeout(4000);
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.waitForTimeout(4000);
  });

  test('Step 4: Add Procedure', async () => {
    await page.getByText('Add Procedure(s)').click();
    const responsePromise = page.waitForResponse(response =>
        response.url().includes('/patient-form/treatment-plan/get-treatment-code') &&
        response.status() === 200
      );
      // Wait until API is called and completed
    const response = await responsePromise;
    if (response.ok()) {
      console.log('✅ API called successfully');
    }
    await page.waitForTimeout(4000);
    await page.getByText('Unplanned Tx').click();
    await page.locator('.border-bottom-block > .checkbox-box > adit-checkbox > .e-section-control > .e-checkbox-wrapper > label > .e-icons').first().click();
    await page.getByRole('button', { name: 'Add', exact: true }).click();
  });

  test('Step 5: Send TX Plan', async () => {
    await page.getByRole('button', { name: ' Save & Send' }).click();
    await page.getByRole('button', { name: 'Send', exact: true }).click();
  });

  test('Step 6: open engage', async () => {
    await page.locator('.icon-Engage').first().click();
  });

  test('Step 7: Click Search', async () => {
    await page.getByText('Search').click();
    await page.getByRole('textbox', { name: 'Search by name or number' }).click();
    await page.getByRole('textbox', { name: 'Search by name or number' }).fill(user.firstName+' '+user.lastName);
    await page.waitForTimeout(2000);
    await page.getByText(user.firstName+' '+user.lastName).first().click();
    await page.waitForTimeout(2000);
  });

  test('Step 8: open sent link', async () => {
    const [popup] = await Promise.all([
        page.waitForEvent('popup'),
        page.locator('#smschatroomcol2 a[href^="https://k.adit.com/"]')
        .last()
        .click()
      ]);

    global.popup = popup;
  });

  test('Step 9: Fill TX Plan in popup', async () => {
    const popup = global.popup;
    await popup.getByRole('link', { name: 'Sign' }).click();
    await popup.getByRole('textbox').first().click();
    await popup.getByRole('textbox').first().fill(user.firstName);
    await popup.getByRole('textbox').nth(1).click();
    await popup.getByRole('textbox').nth(1).fill(user.firstName+'.'+user.lastName+'@adit.com');
    await popup.getByRole('textbox').nth(2).click();
    await popup.getByRole('textbox').nth(2).fill(user.mobile.toString());
    await popup.getByRole('link', { name: 'Accept & Sign' }).first().click();
    await popup.getByText('format_color_textType').click();
    await popup.getByRole('textbox', { name: 'Signature' }).click();
    await popup.getByRole('textbox', { name: 'Signature' }).fill(user.firstName);

    await popup.evaluate(() => {
      document.querySelector('#first').checked = true;
    });

    await popup.getByRole('heading', { name: 'Signature' }).click();
    await popup.waitForTimeout(4000);

    await popup.evaluate(() => {
      document.querySelector('.rightbtn').click();
    });
    await popup.getByRole('button', { name: 'Submit' }).click();
  });

  test('Step 10: open Tx plan', async () => {
    await page.bringToFront();
    await page.locator('.icon-Patient-Form').first().click();
    await page.getByRole('link', { name: 'TX Plans' }).click();
  });

  test('Step 11: Open Submitted Tab', async () => {
    await page.waitForTimeout(2000);
    await page.getByRole('tab', { name: 'Submitted' }).click();
    await page.getByText(user.firstName +'SanityPFAutomation').click();
  });

  test('Step 11: Doctor Sign', async () => {
    await page.locator('.icon-frame-icon').click();
    await page.getByRole('menuitem', { name: ' Sign' }).click();
    await page.getByRole('button', { name: 'Accept & Sign' }).click();
    await page.getByText('Type').click();
    await page.getByRole('textbox', { name: 'Signature' }).click();
    await page.getByRole('textbox', { name: 'Signature' }).fill(user.firstName);
    await page.locator('.verif-radio').first().click();
    await page.getByRole('button', { name: 'Accept & Sign' }).click();
  });

  test('Step 12: open Submitted', async () => {
    await page.getByRole('link', { name: 'TX Plans' }).click();
    console.log('---------------------------------Tx Plans flow Ended---------------------------------');
  });

  

});

test.describe('Patient Card', ()=>{

  formID = '';

  test('Step 1: Open Patient Card', async () => {
        await page.locator('.icon-Patients').first().click();
        await page.getByRole('textbox', { name: 'Search by Name, Email, Number' }).click();
        await page.getByRole('textbox', { name: 'Search by Name, Email, Number' }).fill(user.firstName+' '+user.lastName);
        await page.waitForTimeout(2000);
        await page.getByText(user.firstName+' '+user.lastName).click();
        await page.waitForTimeout(2000);
  });

  test('Step 2: Click Create Request', async () => {
      await page.locator('.icon.icon-new-add-icon').click();
      await page.locator('.icon-Patient-Form.white-color').click();
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

  test('Step 15: close Patient Card', async () => {
    await page.getByRole('button', { name: 'Close', exact: true }).first().click();
  });

   test('Step 15: open engage', async () => {
    await page.locator('.icon-Engage').first().click();
  });

  test('Step 16: Click Search', async () => {
    await page.getByText('Search').click();
    await page.getByRole('textbox', { name: 'Search by name or number' }).click();
    await page.getByRole('textbox', { name: 'Search by name or number' }).fill(user.firstName+' '+user.lastName);
    await page.waitForTimeout(2000);
    await page.getByText(user.firstName+' '+user.lastName).first().click();
    await page.waitForTimeout(2000);
  });

  // test('Step 17: verity message', async () => {
  //       const lastMessage = page
  //       .locator('#smschatroomcol2 .messagerowgraybox')
  //       .last();

  //       const timeText = await lastMessage
  //       .locator('.sender-name .time')
  //       .innerText();

  //       function parseTime(timeStr) {
  //           const now = new Date();

  //           const [time, modifier] = timeStr.split(' ');
  //           let [hours, minutes] = time.split(':').map(Number);

  //           if (modifier.toLowerCase() === 'pm' && hours !== 12) hours += 12;
  //           if (modifier.toLowerCase() === 'am' && hours === 12) hours = 0;

  //           const messageTime = new Date(now);
  //           messageTime.setHours(hours, minutes, 0, 0);

  //           return messageTime;
  //       }

  //       const messageTime = parseTime(timeText);
  //       const now = new Date();

  //       const diffInMinutes = Math.abs(now - messageTime) / (1000 * 60);

  //       if (diffInMinutes <= 2) {
  //       console.log('✅ Message is recent');
  //       } else {
  //       throw new Error(`❌ Message too old: ${timeText}`);
  //       }
  // });

  test('Step 31: open sent link', async () => {
    const [popup] = await Promise.all([
        page.waitForEvent('popup'),
        page.locator('#smschatroomcol2 a[href^="https://k.adit.com/"]')
        .last()
        .click()
      ]);

    global.popup = popup;
    const [response] = await Promise.all([
      popup.waitForResponse(res =>
        res.url().includes('/patient-form/get-forms-by-patientId') &&
        res.status() === 200
      ),
    ]);

    const data = await response.json();
    formID = data.data[0].submitted_form_id;
  });

  test('Step 26: Fill patient form in popup', async () => {
    const popup = global.popup;
    

    const fillField = async (label, value) => {
      const field = popup.locator('adittech-single-line-textbox')
        .filter({ hasText: label })
        .getByRole('textbox');
      await field.click();
      await field.fill(value);
    };

    // await fillField('Last Name', 'automation');
    // await fillField('First Name', 'pfsanity');

    await popup.locator('adittech-textbox-date').getByRole('textbox').click();
    await popup.getByLabel('Select year').selectOption('2000');
    await popup.getByLabel('Select month').selectOption('0');
    await popup.getByRole('link', { name: '1', exact: true }).click();

    // const emailField = popup.locator('adittech-textbox-email');
    // await expect(emailField).toContainText('Email'); // wait for Angular
    // await emailField.getByRole('textbox').fill('qa@adit.com');

    await fillField('Address', 'asdasdasd');
    await fillField('City', 'asdsadas');
    await fillField('State', 'dsaddsas');
    await fillField('ZIP', '2528845');

    // await popup.locator('adittech-textbox-phone').filter({ hasText: 'Mobile Number' })
    //   .getByRole('textbox').fill('(454) 545-4545');

    await popup.locator('adittech-selection-dropdown').filter({ hasText: 'Preferred Provider' })
      .getByRole('combobox').click();
    await popup.getByRole('option', { name: 'Default Provider' }).click();

    await popup.locator('adittech-selection-dropdown').filter({ hasText: 'Marital Status' })
      .getByRole('combobox').click();
    await popup.getByRole('option', { name: 'Single' }).click();

    await popup.locator('adittech-selection-dropdown').filter({ hasText: 'Gender' })
      .getByRole('combobox').click();
    await popup.getByRole('option', { name: 'Male', exact: true }).click();

    await popup.locator('#submit').first().click();
  });

  test('Step 27: Navigate to Submissions page', async () => {
    await page.bringToFront();
    await page.locator('.icon-Patient-Form').first().click();
    await page.getByRole('link', { name: /Submissions/i }).click();
  });

  test('Step 28: Approve Form', async () => {
    await page.waitForTimeout(2000);
    await page.getByRole('tab', { name: 'Submitted' }).click();
    await page.locator('tr')
      .filter({ hasText: user.firstName+' '+user.lastName })
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

  test('Step 29: Imported Tab', async () => {
    await page.waitForTimeout(2000);
    await page.getByRole('tab', { name: 'Imported' }).click();
    await page.getByText('Date Submitted').click();
    await page.getByText('Date Submitted').click();
    await page.getByText(user.firstName +' '+ user.lastName).first().click();
    const url = page.url();
    const id = url.split('/').pop();
    console.log('Form ID: ', id);

    if(formID !== id) {
      throw new Error('Form ID does not match');
    }else{
      console.group('Form Validation');
      console.log('✅ Form ID matches in Engage');
      console.log('✅ Form is verified in Engage');
      console.groupEnd();
    }
    console.log('---------------------------------Patient Card flow Ended---------------------------------');
  });

})

//---------------------------------------------------------------------------- AUTO Import ---------------------------------------------------------------------------

test.describe('Auto Import', ()=>{

  test('Step 30: Forms Manager', async () => {
    await page.getByRole('link', { name: /Forms Manager/i }).click();
    const row = page.locator('tr', {
      has: page.locator('a', { hasText: 'SanityPFAutomation' })
    });

    const autoImportToggle = row.locator(
      'td[aria-label*="Auto import?"] input[type="checkbox"]'
    );

    // Turn ON only if it's currently OFF
    if (!(await autoImportToggle.isChecked())) {
      await autoImportToggle.click();
    }

    await page.getByLabel('New Patients').check();
    await page.getByLabel('Existing Patients').check();

    await page.getByRole('button', { name: 'Save' }).click();

    await page.waitForTimeout(5000);

  })

  formID = '';

    test('Step 1: Navigate to Submissions page', async () => {
        await page.getByRole('link', { name: /Submissions/i }).click();
    });

  test('Step 10: Click initial link and button', async () => {
    await page.locator('i.icon-new-add-icon').first().click();
    // await page.getByLabel('', { exact: true })
    //   .getByRole('button')
    //   .filter({ hasText: /^$/ })
    //   .click();
    await page.locator('.icon-Patient-Form.white-color').click();
  });

  test('Step 11: Select First Name from dropdown', async () => {
    const firstNameDropdown = page.getByRole('combobox', { name: /First Name/i });
    await firstNameDropdown.click();
    await firstNameDropdown.fill(user.firstName);
    //await page.getByText('8ikshr L39abd9331').click();

    const option = page.locator('mat-option', {
        hasText: user.firstName+' '+user.lastName
    });

    await option.waitFor();
    await option.click();

    //await page.getByText(user.firstName+' '+user.lastName).first().click();
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

  // test('Step 15: open engage', async () => {
  //   await page.locator('.icon-Engage').first().click();
  //   await page.waitForTimeout(5000);
  // });

  // test('Step 16: Click Search', async () => {
  //   await page.getByText('Search').click();
  //   await page.getByRole('textbox', { name: 'Search by name or number' }).click();
  //   await page.getByRole('textbox', { name: 'Search by name or number' }).fill(user.firstName+' '+user.lastName);
  //   await page.waitForTimeout(4000);
  //   await getByRole('strong').getByText(user.firstName +' '+ user.lastName).click();
  //   await page.waitForTimeout(4000);
  //   await page.getByText(user.firstName+' '+user.lastName).first().click();
  // });

  // test('Step 17: verity message', async () => {
  //       const lastMessage = page
  //       .locator('#smschatroomcol2 .messagerowgraybox')
  //       .last();

  //       const timeText = await lastMessage
  //       .locator('.sender-name .time')
  //       .innerText();

  //       function parseTime(timeStr) {
  //           const now = new Date();

  //           const [time, modifier] = timeStr.split(' ');
  //           let [hours, minutes] = time.split(':').map(Number);

  //           if (modifier.toLowerCase() === 'pm' && hours !== 12) hours += 12;
  //           if (modifier.toLowerCase() === 'am' && hours === 12) hours = 0;

  //           const messageTime = new Date(now);
  //           messageTime.setHours(hours, minutes, 0, 0);

  //           return messageTime;
  //       }

  //       const messageTime = parseTime(timeText);
  //       const now = new Date();

  //       const diffInMinutes = Math.abs(now - messageTime) / (1000 * 60);

  //       if (diffInMinutes <= 2) {
  //       console.log('✅ Message is recent');
  //       } else {
  //       throw new Error(`❌ Message too old: ${timeText}`);
  //       }
  // });

  
  // test('Step 14: Open Patient Forms Again' , async () => {
  //   await page.locator('.icon-Patient-Form').first().click();
  // });


  test('Step 15: Open patient and click Edit (handle popup)', async () => {
    await page.waitForTimeout(2000);
    await page.getByRole('tab', { name: 'Requested' }).click();
    await page.getByText(user.firstName +' '+ user.lastName).first().click();

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

    // await fillField('Last Name', 'automation');
    // await fillField('First Name', 'pfsanity');

    await popup.locator('adittech-textbox-date').getByRole('textbox').click();
    await popup.getByLabel('Select year').selectOption('2000');
    await popup.getByLabel('Select month').selectOption('0');
    await popup.getByRole('link', { name: '1', exact: true }).click();

    // const emailField = popup.locator('adittech-textbox-email');
    // await expect(emailField).toContainText('Email'); // wait for Angular
    // await emailField.getByRole('textbox').fill('qa@adit.com');

    await fillField('Address', 'asdasdasd');
    await fillField('City', 'asdsadas');
    await fillField('State', 'dsaddsas');
    await fillField('ZIP', '2528845');

    // await popup.locator('adittech-textbox-phone').filter({ hasText: 'Mobile Number' })
    //   .getByRole('textbox').fill('(454) 545-4545');

    await popup.locator('adittech-selection-dropdown').filter({ hasText: 'Preferred Provider' })
      .getByRole('combobox').click();
    await popup.getByRole('option', { name: 'Default Provider' }).click();

    await popup.locator('adittech-selection-dropdown').filter({ hasText: 'Marital Status' })
      .getByRole('combobox').click();
    await popup.getByRole('option', { name: 'Single' }).click();

    await popup.locator('adittech-selection-dropdown').filter({ hasText: 'Gender' })
      .getByRole('combobox').click();
    await popup.getByRole('option', { name: 'Male', exact: true }).click();

    await popup.locator('#submit').first().click();
  });

  test('Step 17: Navigate to Submissions page', async () => {
    await page.bringToFront();
    await page.getByRole('link', { name: /Submissions/i }).click();
    await page.waitForTimeout(10000);
    
  });

  test('Step 19: Imported Tab', async () => {
    await page.reload();
    await page.getByRole('tab', { name: 'Imported' }).click();
    await page.getByText('Date Submitted').click();
    await page.getByText('Date Submitted').click();
    await page.getByText(user.firstName +' '+ user.lastName).first().click();
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

    await page.locator('span.icon-frame-icon').first().click();
    await page.waitForTimeout(2000);
    const downloadPromise = page.waitForEvent('download');

    await page.getByText('Download PDF').click();

    const download = await downloadPromise;

    console.log(await download.suggestedFilename());
    
  });

  test('Step 20: Auto Import Off', async () => {
    await page.getByRole('link', { name: /Forms Manager/i }).click();
    const row = page.locator('tr', {
      has: page.locator('a', { hasText: 'SanityPFAutomation' })
    });

    const autoImportToggle = row.locator(
      'td[aria-label*="Auto import?"] input[type="checkbox"]'
    );

    // Turn ON only if it's currently OFF
    if ((await autoImportToggle.isChecked())) {
      await autoImportToggle.click();
    }

    await page.waitForTimeout(5000);
    console.log('-------------------------------------------Auto Import Flow Ended-------------------------------------------------');
  })
  
})

