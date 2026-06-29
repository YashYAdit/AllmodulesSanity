import { test, expect } from '@playwright/test';
import fs from 'fs';
import dotenv from 'dotenv';
import { execArgv } from 'process';
dotenv.config();

// Shared state
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

function generateRandomMobileNumber() {
    const firstDigit = Math.floor(Math.random() * 9) + 1; // 1-9
    const remainingDigits = Math.floor(Math.random() * 1000000000)
        .toString()
        .padStart(9, '0');

    return `${firstDigit}${remainingDigits}`;
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

////------------------------Navigation & Basic Functionality-------------------------------------------------------------------------------------
    test('Step 9: Opening Engage Internal Chat', async () => {
      await page.locator('i.icon-Engage').first().click();
      await page.locator('i.icon-Engage').first().click();
      await page.waitForTimeout(4000);

      // Dismiss #newDialog popup if present
      if (await page.locator('#newDialog').isVisible({ timeout: 2000 }).catch(() => false)) {
        await page.locator('#newDialog .e-dlg-closeicon-btn').click();
      }

      // Dismiss 10DLC registration popup if present
      const tenDLC = page.getByRole('dialog').filter({ hasText: '10DLC' });
      if (await tenDLC.isVisible({ timeout: 2000 }).catch(() => false)) {
        await tenDLC.getByRole('button').filter({ hasText: /^$/ }).click();
      }

      await page.getByRole('heading', { name: 'Home' }).hover();
    });

    test('Step 10: Open any chat from the home page and verify it opens successfully', async () => {
      await page.locator('.message-content strong').first().click();
      await page.locator('.icon-open-in-full').click();
    });

    test('Step 11: Navigate to the Mention page and validate proper loading', async () => {
      await page.locator('li.patient-li-flex', {has: page.locator('span', { hasText: 'Mentions' })}).click(); 
      await page.getByRole('heading', { name: 'Mentions' }).hover();
    });

    test('Step 12: Open the Search page, enter a patient name, and verify chat search functionality', async () => {
        await page.locator('li.patient-li-flex', {has: page.locator('span', { hasText: 'Search' })}).click();
        await page.getByRole('textbox', { name: 'Search by name or number' }).click();
        await page.getByRole('textbox', { name: 'Search by name or number' }).fill('Test Test');
        await page.waitForTimeout(2000);
        await page.getByText('Test Test').first().click();
        await page.waitForTimeout(2000);
    });

    test('Step 13: Navigate to the Tag page and confirm it loads without issues', async () => {
        await page.locator('li.patient-li-flex', {has: page.locator('span', { hasText: 'Tag' })}).click();
        await page.getByRole('heading', { name: 'Tag' }).hover();
    });
////------------------------Chat & Messaging Functionality-------------------------------------------------------------------------------------
    let patientName = '';

    test('Step 14: Click on the New button, enter details, and create a new chat', async () => {
        await page.getByRole('button', { name: 'New' }).click();
        await page.getByPlaceholder('Enter Patient, Staff or Number').click();
        await page.getByPlaceholder('Enter Patient, Staff or Number').fill(generateRandomMobileNumber());
        await page.getByRole('button', { name: /Send SMS to/i }).click();
        await page.locator('#message_text').click();
        await page.waitForTimeout(2000);
        await page.locator('#message_text').pressSequentially("Hello from Playwright!");
        await page.locator('.icon-send-round.orangecolor').click();
        await expect(page.locator('div.message').last()).toHaveText('Hello from Playwright!');
        patientName = await page.locator('#recentsms li.patient-li-flex .message-list-name').first().textContent();
        await page.locator('#recentsms li.patient-li-flex .message-list-name').first().click();
        await page.locator('#message_text').pressSequentially("Hello from Playwright!");
        await page.locator('.icon-send-round.orangecolor').click();
        await page.locator('i.icon-mood').first().click();
        await page.locator('span[aria-label="🙂, slightly_smiling_face"]').click();
        await page.locator('.icon-send-round.orangecolor').click();
        const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser'),
            page.locator('i.icon-attach-file.color-blue-icon.font-size22').click()
        ]);

        await fileChooser.setFiles('Images/Logo.png');
        await page.getByRole('button', { name: 'Send', exact: true }).last().click();
        await page.locator('#dropdownMenuButton').click();
        await page.locator('i.icon-Patient-Form-old').click();
         await page.getByRole('button', { name: /Assign New Form/i }).click();

        await page.locator('.assign-new-form-check')
          .locator('.inner-check-block', {
            has: page.locator('.assign-new-checktext span', { hasText: 'COVID PRESCREENING SAMPLE' })
          })
          .locator('input[type="checkbox"]')
          .check();

        await page.waitForTimeout(2000);
        await page.getByRole('button', { name: /Save/i }).click();
        await page.getByRole('button', { name: 'Select' }).last().click();
        await page.locator('.icon-send-round').first().click();

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

    test('Step 15: Validate the Schedule Message functionality', async () => {
        await page.locator('#message_text').click();
        await page.waitForTimeout(2000);
        await page.locator('#message_text').pressSequentially("Hello from Playwright Scheduled Message!");
        await page.locator('button.downbutton-menu').click();
        await page.getByText('Tomorrow at 9:00 AM', { exact: true }).click();
    });

    test('Step 16: Click on the patient name and verify the patient card opens correctly', async () => {
        await page.getByRole('heading', { name: patientName }).last().click();

    });

    test('Step 17: Open the bubble chat and validate its functionality', async () => {
        await page.locator('i.icon-Engage').last().click();
    });

    test('Step 18: Click on Close and ensure chat is closed successfully', async () => {
        await page.locator('i.icon-Close').last().click();
    });

    test('Step 19: Click on Open Conversation and verify chat opens in full screen', async () => {
        await page.locator('i.icon-Engage').last().click();
        const [newPage] = await Promise.all([
            page.waitForEvent('popup'),
            page.locator('i.icon-open-arrow.expand').click()
        ]);

        await newPage.getByRole('heading', { name: patientName }).last().click();
    });

    test('Step 20: Verify filters and unread chat toggle work as expected', async () => {
        await page.bringToFront();
        const filterButton = page.locator(
            'adit-filter button.common-defaultfilter'
        ).first();

        await page.locator('label[for="dropdown-toggle-patients"]').hover();
        await filterButton.hover();
        await filterButton.click();

        await page.getByRole('button', { name: 'Close' }).last().click();

        const patient = page.locator('label[for="dropdown-toggle-patients"]');
        const switchWrapper = page.locator('ejs-switch').first();
        const toggle = switchWrapper.locator('input[name="statusToggle"]');

        await patient.hover();

        const initialState = await toggle.isChecked();
        await switchWrapper.click();

        // validations...

        await patient.hover();

        if ((await toggle.isChecked()) !== initialState) {
            await switchWrapper.click();
        }

        // Perform your validations here...

        // Restore to the original state if needed
        if (await toggle.isChecked() !== initialState) {
            await toggle.click();
        }
    });

    test('Step 21: Open the Birthday Reminder page and validate loading', async () => {
      await page.getByRole('link', { name: 'Auto-Reminders' }).click();
      await page.getByRole('link', { name: 'Birthday Wishes' }).click();
      await page.getByRole('heading', { name: 'Birthday Wishes' }).click();
  
    });

    test('Step 22: Verify enable/disable toggle functionality', async () => {
      await page.locator('.e-switch-handle').first().click();
      await expect(page.locator('.e-toast-content')).toHaveText('Record updated successfully.');
      await page.waitForTimeout(4000);
      await page.locator('.e-switch-handle').first().click();
      await expect(page.locator('.e-toast-content')).toHaveText('Record updated successfully.');
      await page.waitForTimeout(4000);
    });

    test('Step 23: Edit reminder details and save changes', async () => {
      await page.locator('.message-edit > a').first().click();
      await page.getByRole('dialog', { name: 'Edit Birthday Wishes' }).click();
      await page.getByRole('button', { name: 'Save' }).click();
      await expect(page.locator('.e-toast-content')).toHaveText('Record updated successfully.');
    });

    test('Step 24: Open Schedule Confirmation page and validate loading', async () => {
      await page.getByRole('link', { name: 'Scheduled Confirmations' }).click();
      await page.getByRole('heading', { name: 'Scheduled Confirmations' }).click();
    });

    test('Step 25: Verify enable/disable toggle functionality', async () => {
      await page.locator('.e-switch-handle').first().click();
      await expect(page.locator('.e-toast-content')).toHaveText('Record updated successfully.');
      await page.waitForTimeout(4000);
      await page.locator('.e-switch-handle').first().click();
      await expect(page.locator('.e-toast-content')).toHaveText('Record updated successfully.');
      await page.waitForTimeout(4000);
    });

    test('Step 26: Edit reminder details and save changes', async () => {
      await page.locator('.message-edit > a').first().click();
      await page.getByRole('dialog', { name: 'Edit Scheduled Confirmations' }).click();
      await page.getByRole('button', { name: 'Save' }).click();
      await expect(page.locator('.e-toast-content')).toHaveText('Record updated successfully.');

    });
    
    test('Step 27: Open Appointment Reminder page and validate loading', async () => {
      await page.getByRole('link', { name: 'Appointment Reminders' }).click();
      await page.getByRole('heading', { name: 'General Settings' }).click();
    });

    test('Step 28: Validate Auto Confirmation toggle and edit text functionality', async () => {
        await page.locator('.e-switch-handle').first().click();
        await expect(page.locator('.e-toast-content')).toHaveText('Record updated successfully.');
        await page.waitForTimeout(4000);
        await page.locator('.e-switch-handle').first().click();
        await expect(page.locator('.e-toast-content')).toHaveText('Record updated successfully.');
        await page.waitForTimeout(4000);

          await page.getByRole('textbox', { name: 'Type here' }).click();
          await page.getByRole('textbox', { name: 'Type here' }).fill('Thank you for confirming your appointment. We look forward to seeing you! test');
          await page.getByRole('button', { name: 'Save' }).first().click();
          await page.getByRole('textbox', { name: 'Type here' }).fill('Thank you for confirming your appointment. We look forward to seeing you!');
          await page.getByRole('button', { name: 'Save' }).first().click();
    });

    test('Step 29: Verify status mapping and redirection to Settings page', async () => {
      const [newPage] = await Promise.all([
            page.waitForEvent('popup'),
            page.getByRole('link', { name: 'Status Mapping' }).click()
        ]);

        await newPage.getByRole('heading', { name: 'Confirmation Mapping' }).click();
    });

    test('Step 30: Verify enable/disable toggle', async () => {
        await page.bringToFront();
        await page.locator('.message-col .e-section-control > .e-switch-wrapper > .e-switch-handle').first().click();
        await expect(page.locator('.e-toast-content')).toHaveText('Record updated successfully.');
        await page.waitForTimeout(4000);
        await page.locator('.message-col .e-section-control > .e-switch-wrapper > .e-switch-handle').first().click();
        await expect(page.locator('.e-toast-content')).toHaveText('Record updated successfully.');
        await page.waitForTimeout(4000);
    });

    test('Step 31: Edit reminder details and save changes', async () => {
      await page.locator('.message-edit > a').first().click();
      await page.getByRole('dialog', { name: 'Edit Appointment Reminder' }).click();
      await page.getByLabel('Edit Appointment Reminder').getByRole('button', { name: 'Save' }).click();
      await expect(page.locator('.e-toast-content')).toHaveText('Record updated successfully.');
    });


    test('Step 32: Open Recall Reminders page and validate loading', async () => {
      await page.getByRole('link', { name: 'Recall Reminders' }).click();
      await page.getByRole('heading', { name: 'Recall Types to Use' }).click();
    });

    test('Step 33: Validate toggle and Add functionality', async () => {
        await page.locator('.e-switch-handle').first().click();
        await expect(page.locator('.e-toast-content')).toHaveText('Record updated successfully.');
        await page.waitForTimeout(4000);
        await page.locator('.e-switch-handle').first().click();
        await expect(page.locator('.e-toast-content')).toHaveText('Record updated successfully.');
        await page.waitForTimeout(4000);

        await page.getByRole('link', { name: 'Add' }).click();
        await page.getByRole('dialog', { name: 'Add Recall Reminder' }).click();
        await page.locator('.e-dlg-closeicon-btn').last().click();
    });

    test('Step 35: Verify enable/disable toggle', async () => {
        await page.locator('.message-col .e-section-control > .e-switch-wrapper > .e-switch-handle').first().click();
        await expect(page.locator('.e-toast-content')).toHaveText('Record updated successfully.');
        await page.waitForTimeout(4000);
        await page.locator('.message-col .e-section-control > .e-switch-wrapper > .e-switch-handle').first().click();
        await expect(page.locator('.e-toast-content')).toHaveText('Record updated successfully.');
        await page.waitForTimeout(4000);
    });

    test('Step 36: Edit reminder details and save changes', async () => {
      await page.locator('.message-edit > a').first().click();
      await page.getByRole('dialog', { name: 'Edit Recall Reminder' }).click();
      await page.getByLabel('Edit Recall Reminder').getByRole('button', { name: 'Save' }).click();
      await expect(page.locator('.e-toast-content')).toHaveText('Record updated successfully.');


    });


    test('Step 37: Open Payment Reminders page and validate loading', async () => {
      await page.getByRole('link', { name: 'Payment Reminders' }).click();
      await page.getByRole('heading', { name: 'Reminders' }).click();
    });

    test('Step 38: Validate toggle and Add functionality', async () => {
        await page.getByRole('link', { name: 'Add' }).click();
        await page.getByRole('dialog', { name: 'Add Payment Reminder' }).click();
        await page.locator('.e-dlg-closeicon-btn').last().click();
    });

    test('Step 39: Verify enable/disable toggle', async () => {
        await page.locator('.message-col .e-section-control > .e-switch-wrapper > .e-switch-handle').first().click();
        await expect(page.locator('.e-toast-content')).toHaveText(/Reminder marked (active|inactive) successfully\./);
        await page.waitForTimeout(4000);
        await page.locator('.message-col .e-section-control > .e-switch-wrapper > .e-switch-handle').first().click();
        await expect(page.locator('.e-toast-content')).toHaveText(/Reminder marked (active|inactive) successfully\./);
        await page.waitForTimeout(4000);
    });

    test('Step 40: Edit reminder details and save changes', async () => {
      await page.locator('.message-edit > a').first().click();
      await page.getByRole('dialog', { name: 'Edit Payment Reminder' }).click();
      await page.getByLabel('Edit Payment Reminder').getByRole('button', { name: 'Save' }).click();
      await expect(page.locator('.e-toast-content')).toHaveText('Reminder updated successfully.');
      
    });


    test('Step 41: Open Missed Call page and validate loading', async () => {
      await page.getByRole('link', { name: 'Missed Call Text' }).click();
      await page.getByRole('heading', { name: 'Missed Call Text', exact: true }).click();
    });

    test('Step 42: Validate toggle and Add functionality', async () => {
        await page.getByRole('link', { name: 'Add' }).click();
        await page.getByRole('dialog', { name: 'Add Missed Call Text' }).click();
        await page.getByPlaceholder('Type here').first().click(); 
        await page.getByPlaceholder('Type here').first().fill('Test Missed Call Text'); 
        await page.locator('.e-multi-select-wrapper').first().click();
        await page.locator('.e-list-item').first().click();
        await page.getByLabel('Add Missed Call Text').getByRole('button', { name: 'Save' }).click();
    });

    test('Step 43: Verify enable/disable toggle', async () => {
        await page.waitForTimeout(4000);
        await page.locator('.message-col .e-section-control > .e-switch-wrapper > .e-switch-handle').last().click();
        await expect(page.locator('.e-toast-content')).toHaveText(/Reminder marked (active|inactive) successfully\./);
        await page.waitForTimeout(4000);
        await page.locator('.message-col .e-section-control > .e-switch-wrapper > .e-switch-handle').last().click();
        await expect(page.locator('.e-toast-content')).toHaveText(/Reminder marked (active|inactive) successfully\./);
        await page.waitForTimeout(4000);
        
    });

    test('Step 44: Edit reminder details and save changes', async () => {
      await page.locator('i.icon-editpen-new-icon').last().click();
      await page.getByRole('dialog', { name: 'Edit Missed Call Text' }).click();
      await page.getByLabel('Edit Missed Call Text').getByRole('button', { name: 'Save' }).click();
      await expect(page.locator('.e-toast-content')).toHaveText('Missed Call Text updated successfully.');
      await page.locator('.icon-new-remove-icon').last().click();
      await page.getByRole('button', { name: 'Yes' }).last().click();
    });


    test('Step 45: Open Form Reminders page and validate loading', async () => {
      await page.getByRole('link', { name: 'Form Reminders' }).click();
      await page.getByRole('heading', { name: 'Incomplete Form Reminders', exact: true }).click();
    });

    test('Step 46: Validate toggle and Add functionality', async () => {
        await page.getByRole('link', { name: 'Add' }).click();
        await page.getByRole('dialog', { name: 'Add Incomplete Form Reminder' }).click();
        await page.getByPlaceholder('Type here').first().click(); 
        await page.getByPlaceholder('Type here').first().fill('Test Incomplete Form Reminder'); 
        await page.getByLabel('Add Incomplete Form Reminder').getByRole('button', { name: 'Save' }).click();
    });

    test('Step 47: Verify enable/disable toggle', async () => {
        await page.waitForTimeout(4000);
        await page.locator('.message-col .e-section-control > .e-switch-wrapper > .e-switch-handle').last().click();
        await expect(page.locator('.e-toast-content')).toHaveText('Record updated successfully.');
        await page.waitForTimeout(4000);
        await page.locator('.message-col .e-section-control > .e-switch-wrapper > .e-switch-handle').last().click();
        await expect(page.locator('.e-toast-content')).toHaveText('Record updated successfully.');
        await page.waitForTimeout(4000);
        
    });

    test('Step 48: Edit reminder details and save changes', async () => {
      await page.locator('i.icon-editpen-new-icon').last().click();
      await page.getByRole('dialog', { name: 'Edit Incomplete Form Reminder' }).click();
      await page.getByLabel('Edit Incomplete Form Reminder').getByRole('button', { name: 'Save' }).click();
      await expect(page.locator('.e-toast-content')).toHaveText('Record updated successfully.');
      await page.locator('.icon-new-remove-icon').last().click();
      await page.getByRole('button', { name: 'Yes' }).last().click();
      
    });


    test('Step 49: Open Auto-Assign Forms page and validate loading', async () => {
      await page.getByRole('link', { name: 'Auto-Assign Forms' }).click();
      await page.getByRole('heading', { name: 'Auto-Assign Forms', exact: true }).click();
    });

    test('Step 50: Validate toggle and Add functionality', async () => {
        await page.getByRole('link', { name: 'Add' }).click();
        await page.getByRole('dialog', { name: 'Add Auto-Assign Form' }).click();
        await page.getByPlaceholder('Type here').first().click();
        await page.getByPlaceholder('Type here').first().fill('Test Auto-Assign Form');
        await page.locator('adit-drop-down:has(input[placeholder="Search"]) .e-ddl').click();

        await page.locator('.e-list-item').first().click();
        await page.getByLabel('Add Auto-Assign Form').getByRole('button', { name: 'Save' }).click();
    });

    test('Step 51: Verify enable/disable toggle', async () => {
        await page.waitForTimeout(4000);
        await page.locator('adit-toggle.ehr-toggle .e-switch-wrapper').last().click();
        await expect(page.locator('.e-toast-content')).toHaveText('Assignment Status Updated Successfully..');
        await page.waitForTimeout(4000);
        await page.locator('adit-toggle.ehr-toggle .e-switch-wrapper').last().click();
        await expect(page.locator('.e-toast-content')).toHaveText('Assignment Status Updated Successfully..');
        await page.waitForTimeout(4000);
        
    });

    test('Step 52: Edit auto-assign form details and save changes', async () => {
      await page.locator('i.icon-editpen-new-icon').last().click();
      await page.getByRole('dialog', { name: 'Edit Auto-Assign Form' }).click();
      await page.getByLabel('Edit Auto-Assign Form').getByRole('button', { name: 'Save' }).click();
      await expect(page.locator('.e-toast-content')).toHaveText('Settings updated successfully');
      await page.locator('.icon-new-remove-icon').last().click();
      await page.getByRole('button', { name: 'Delete' }).last().click();
      
    });


    test('Step 53: Navigate to Mass Texting and create a new campaign', async () => {
      await page.getByRole('link', { name: 'Mass Texting' }).click();
      await page.getByRole('button', { name: 'Add Campaign' }).first().click();
    });

    test('Step 54: Enter campaign details and click on Add Recipient', async () => {
      await page.getByPlaceholder('Campaign Name', { exact: true }).click();
      await page.getByPlaceholder('Campaign Name', { exact: true }).fill('Playwright Test Campaign '+user.firstName);
      await page.getByRole('button', { name: 'Begin' }).first().click();
      await page.getByRole('button', { name: 'Add Recipients' }).first().click();
      await page.locator('mat-select[placeholder="Select a Segment"]').click();
      await page.getByRole('option', {name: /PatientSegmentAbove115/}).first().click();
      await page.locator('body').click({ position: { x: 5, y: 5 } });
      await page.getByRole('button', { name: 'Save' }).first().click();
      await page.locator('a', { hasText: 'First Name' }).click();
      await page.locator('a', { hasText: 'Last Name' }).click();
      //await page.getByRole('button', { name: 'Schedule' }).first().click();
      let tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const formattedDate = tomorrow.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric'
      });

      // await page.locator('#datepicker_input').click();
      // await page.pause();
      // // if(formattedDate == 1){
      // //   await page.getByRole('button', { name: 'next month' }).click();
      // // }
      // await page.getByTitle(formattedDate + ',').click();
      // await page.getByRole('button', { name: 'Schedule Campaign' }).first().click();

      await page.getByRole('button', { name: 'Send Now' }).first().click();
      await page.waitForTimeout(2000);
      await page.getByRole('button', { name: 'Send Now' }).last().click();
      
      //await page.pause();
    });


    test('Step 55: Validate ASAP List page loads correctly', async () => {
      await page.getByRole('link', { name: 'ASAP Lists' }).click();
      
    });

    test('Step 56: Open a patient card and mark the patient for ASAP List', async () => {
      await page.getByRole('textbox', { name: 'Search Patient or Task' }).click();
      await page.getByRole('textbox', { name: 'Search Patient or Task' }).nth(1).fill('TEST TEST');
      await page.locator('li .list-parent').first().click();
      await page.locator('.icon-editpen-new-icon').first().click();
      await page.locator('adit-toggle[formcontrolname="putAsapOnList"] label',{ hasText: 'Yes' }).click();

      await page.locator('adit-drop-down[formcontrolname="provider"] .e-ddl').click();

      await page.locator('.e-list-item').first().click();

      const appointmentLength = page.locator(
          'input[formcontrolname="appointmentLengthMinutes"]'
      );

      await appointmentLength.click();
      await appointmentLength.fill('15');

      await page.getByRole('button', { name: 'Save' }).click();
      await page.getByRole('button', { name: 'Close', exact: true }).first().click();
      
    });

    test('Step 57: Verify the patient is added to the ASAP List', async () => {
      await page.getByRole('link', { name: 'Mass Texting' }).click();
      await page.waitForTimeout(2000);
      await page.getByRole('link', { name: 'ASAP Lists' }).click();
      await page.getByText('TEST TEST').hover();
      await page.locator('.icon-editpen-new-icon').first().click();
      await page.getByRole('button', { name: 'Save' }).click();
      await expect(page.locator('.e-toast-content')).toHaveText('The patient record was updated succesfully!');
      await page.waitForTimeout(4000);
      await page.locator('.icon-new-remove-icon').first().click();
      await page.getByRole('button', { name: 'Confirm' }).click();
      await expect(page.locator('.e-toast-content')).toHaveText('This patient was successfully removed from the ASAP List!');
      await page.waitForTimeout(4000);
      await page.getByRole('link', { name: 'Mass Texting' }).click();
      await page.waitForTimeout(2000);
      await page.getByRole('link', { name: 'ASAP Lists' }).click();
    });

    test('Step 58: open Reports Auto Recall Report and validate', async () => {
      await page.getByRole('link', { name: 'Reports' }).click();
      await page.getByRole('link', { name: 'Auto Recall' }).click();
      await page.getByRole('tab', { name: 'Unscheduled' ,exact: true}).hover();
    });

    test('Step 59: open Appointment Insights and validate', async () => {
      await page.getByRole('link', { name: 'Appointment Insights' }).click();

      const noDataFound = page.getByRole('paragraph').filter({ hasText: 'No data found' });

        // Wait a bit for the page to load
        await page.waitForTimeout(2000);

        const isVisible = await noDataFound.isVisible();

        console.log('isVisible:', isVisible);

        if (!isVisible) {
            await page.locator('.icon-new-info-icon').first().click();
            await page.locator('#newDialog_dialog-header button.e-dlg-closeicon-btn').click();
        }
    });

    test('Step 60: open Canned Messages and validate', async () => {
      await page.getByRole('link', { name: 'Canned Messages' }).click();
      await page.getByRole('heading', { name: 'Canned Messages (Pre-made Messages)' }).click();
    });

    test('Step 61: Create a new canned message', async () => {
      await page.getByText('+Add', { exact: true }).click();
      await page.getByText('Patient First Name', { exact: true }).click();
      await page.getByText('Location Name', { exact: true }).click();
      await page.getByText('Organization Name', { exact: true }).click();
      await page.locator('input[placeholder="#Type Shortcut..."]').fill('#TestShortcut');
      await page.getByRole('heading', { name: 'Shortcut:' }).first().click();
      await page.getByRole('button', { name: 'Save' }).last().click();
      await page.locator('.submenu-items-inner a:has-text("Messages")').first().click();
      await page.locator('.message-content strong').first().click();
      await page.locator('.icon-open-in-full').click();

      await page.locator('#message_text').click();
      await page.waitForTimeout(2000);
      await page.locator('#message_text').pressSequentially("#TestShortcut");
      await page.locator('.cannedmessage-sec .messagetext-block span').first().click();
      await page.locator('.icon-send-round.orangecolor').click();
      await page.waitForResponse(response =>
        response.url().includes('/engage/sms') &&
        response.request().method() === 'POST'
      );
      await page.getByRole('link', { name: 'Canned Messages' }).click();
      await page.locator('.icon-new-remove-icon').first().click();
      await page.getByRole('button', { name: 'Confirm' }).last().click();

    });

    test('Step 62: open Preferences Messaging and validate', async () => {
      await page.getByRole('link', { name: 'Preferences' }).click();
      await page.locator('li a:has-text("Messaging")').click();
      const message = await page.locator('textarea#appt_text').first().inputValue();
      await page.locator('textarea#appt_text').first().fill('Test message');
      await page.getByRole('button', { name: 'Save' }).first().click();
      await expect(page.locator('.e-toast-content')).toHaveText('Preference Updated Successfully');
      await page.waitForTimeout(4000);
      await page.locator('textarea#appt_text').first().fill(message);
      await page.getByRole('button', { name: 'Save' }).first().click();
      await expect(page.locator('.e-toast-content')).toHaveText('Preference Updated Successfully');

    });

    test('Step 63: open Opt-In / Opt-Out and validate', async () => {
      await page.getByRole('link', { name: 'Opt in/Out Settings' }).click();
      const message = await page.locator('textarea#optin').first().inputValue();
      await page.locator('textarea#optin').click();
      await page.locator('textarea#optin').fill('Test message');
      await page.getByRole('button', { name: 'Save' }).first().click();
      await expect(page.locator('.e-toast-content')).toHaveText('Message template was updated successfully.');
      await page.waitForTimeout(4000);
      await page.locator('textarea#optin').first().fill(message);
      await page.getByRole('button', { name: 'Save' }).first().click();
      await expect(page.locator('.e-toast-content')).toHaveText('Message template was updated successfully.');
      await page.pause();
    });


});








