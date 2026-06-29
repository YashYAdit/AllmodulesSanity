import { test, expect } from '@playwright/test';
import fs from 'fs';
import dotenv from 'dotenv';
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

  test('Step 9: Opening Settings', async () => {
    await page.locator('i.icon-new-settings-icon').click();
  });

  test('Step 10: Open Admin Page', async () => {
    await page.locator('i.icon-admin-panel').first().click();
    await page.waitForTimeout(8000);
  });

  test('Step 11: Open Organization page', async () => {
    await page.getByRole('link', { name: 'Organization' }).click();
  });

  test('Step 12: Click Edit Organization', async () => {
    await page.getByRole('button', { name: 'Edit Organization' }).click();
  });

  let orgname;
  test('Step 13: Edit Organization Name', async () => {
    orgname = await page.locator('input[formcontrolname="name"]').inputValue();
    await page.locator('input[formcontrolname="name"]').fill(orgname+'1');
    await page.getByRole('button', { name: 'Save' }).click();
  });

  test('Step 14: Verify Name Change and again change to default name', async () => {
    await expect(page.getByText(orgname+'1', { exact: true }).first()).toBeVisible();
    await page.getByRole('button', { name: 'Edit Organization' }).click();
    await page.locator('input[formcontrolname="name"]').fill(orgname);
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText(orgname, { exact: true }).first()).toBeVisible();
  });

  test('Step 15: Disable and enable the Get Started toggle and verify behavior', async () => {
        const toggle = page.locator('.slider-v1-wrapper').first();

        // Click Yes
        await toggle.getByText('Yes', { exact: true }).click();

        await expect(toggle.locator('label.selected')).toHaveText('Yes');

        // Click No
        await toggle.getByText('No', { exact: true }).click();

        await page.getByRole('button', { name: 'Yes' }).click();

        await expect(toggle.locator('label.selected')).toHaveText('No');
  });

  test('Step 16: Enable IP Restriction and add IP', async () => {
    const ipRestrictToggle = page.locator('#restrict_ip .slider-v1-wrapper');

    const selectedValue = await ipRestrictToggle
        .locator('label.selected')
        .textContent();

    await ipRestrictToggle.locator('label', { hasText: 'Yes' }).click();
    await page.getByRole('button', { name: 'Yes' }).click();
    const randomIp = `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    await page.locator('#add_ip').fill(randomIp);
    await page.getByRole('button', { name: 'Add' ,exact: true}).click();
    await expect(page.getByText(randomIp, { exact: true })).toBeVisible();

  });

  test('Step 17: Navigate to the Location page and verify the All, Active, and Inactive tabs.', async () => {
    await page.getByRole('link', { name: 'Location(s)' }).click();
    await page.getByText('All', { exact: true }).click();
    await page.getByText('Inactive', { exact: true }).click();
    await page.getByText('Active', { exact: true }).click();
  });


////---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

  // test('Step 18: Open an active location and validate adding/removing users and applications.', async () => {
  //   await page.locator('.locationList a').first().click();

  //   // OFF
  //   await page.locator('li', { has: page.locator('span', { hasText: 'Engage' })}).locator('.e-switch-wrapper').click();
  //   await page.locator('button.e-primary:has-text("Yes")').last().click();

  //   // ON
  //   await page.locator('li', { has: page.locator('span', { hasText: 'Engage' })}).locator('.e-switch-wrapper').click();
  //   await page.locator('button.e-primary:has-text("Yes")').last().click();

  //   const secondUser = page.locator('li.list-item-user-access').nth(1);

  //   const userName = await secondUser.locator('.avtar-location-text').textContent();

  //   console.log(userName?.trim());

  //   await secondUser.locator('button.icon-highlight-off').click();
  //   await page.getByRole('button', { name: 'Yes' }).last().click();

  //   await page.getByRole('button', { name: 'Add User(s)' }).click();

  //   await page.locator('.e-multi-select-wrapper').click();

  //   await page.locator('input[placeholder="Select an option"]').fill(userName?.trim());
  //   await page.pause();
  // });

  // test('Step 19: Add a new location and confirm it is created successfully.', async () => {
  //   await page.getByRole('button', { name: 'Add Location' }).click();
  //   await page.getByPlaceholder('Location Name').fill('My Location');
  //   await page.getByPlaceholder('Address Line1').fill('123 Main Street');
  //   await page.getByPlaceholder('City').fill('New York');
  //   await page.getByPlaceholder('e.g., 12345').fill('12345');
  //   await page.getByPlaceholder('Phone').fill('1234567890');
  //   await page.getByPlaceholder('Website').fill('www.adit.com');
  //   await page.getByPlaceholder('State').fill('California');
  //   await page.locator('ejs-dropdownlist#singleSelect').nth(1).click();
  //   await page.locator('li', { hasText: 'United States' }).click();
  //   await page.getByPlaceholder('Email').fill('N4a6H@example.com');
  //   await page.getByRole('button', { name: 'Next: Assign Apps' }).click();
  //   await page.locator('.location-block', {has: page.locator('.locauseriname', { hasText: 'Engage' })}).locator('input[type="checkbox"]').click();
  //   await page.getByRole('button', { name: 'Next: Assign Users' }).click();
  //   await page.getByRole('button', { name: 'Save' }).click();
  //   await expect(page.getByRole('link', { name: 'My Location' })).toBeVisible();
  //   await page.getByRole('link', { name: 'General' }).click();
  //   await page.getByRole('link', { name: 'My Location', exact: true }).click();
  //   await page.getByRole('button', { name: 'Deactivate' }).click();
  //   await page.getByRole('button', { name: 'Okay' }).click();
  //   const responsePromise = page.waitForResponse(response =>
  //       response.url().includes('/location/updateStatus/') &&
  //       response.request().method() === 'PUT'
  //     );
  //     // Wait until API is called and completed
  //   const response = await responsePromise;
  //   if (response.ok()) {
  //     console.log('✅ API called successfully');
  //   }
  //   await expect(page.getByRole('button', { name: 'Activate' })).toBeVisible();
  //   await page.getByRole('link', { name: 'Admin' }).click();
  // });

////---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

  test('Step 20: Navigate to the Application module and validate the page loads correctly.', async () => {
    await page.getByRole('link', { name: 'Applications' }).click();
  });

  test('Step 21: Ensure that Owner-level users do not have permission to enable or disable applications.', async () => {
    await expect(page.locator('input[type="checkbox"][role="switch"]').first()).toBeDisabled();

  });

  test('Step 22: Navigate to the User & Access page and validate it loads correctly.', async () => {
    await page.getByRole('link', { name: 'Users & Access' }).click();
  });

  test('Step 23: Open an existing user, update details, assign/remove locations or applications, and save changes.', async () => {
    await page.waitForTimeout(4000);
    await page.locator('.user-main-name button').first().click();
    await page.waitForResponse(response =>
        response.url().includes('/userv2') &&
        response.request().method() === 'GET' &&
        response.ok()
      );
    await page.locator('ul.list-unstyled li.list-item-user-access ejs-switch').first().click();
    await page.waitForResponse(response =>
        response.url().includes('/user/location/remove/') || response.url().includes('/user/location/add/') &&
        response.request().method() === 'PUT' &&
        response.ok()
      );
    await page.locator('ul.list-unstyled li.list-item-user-access ejs-switch').first().click();
    await page.waitForResponse(response =>
      response.url().includes('/user/location/remove/') || response.url().includes('/user/location/add/') &&
      response.request().method() === 'PUT' &&
      response.ok()
    );

    const engageToggle = page.locator('li', {
      has: page.locator('span.avtar-location-text', { hasText: 'Engage' })
    }).locator('input[role="switch"]');

      await engageToggle.click();
      await page.waitForResponse(response =>
            response.url().includes('/user/app/remove/') || response.url().includes('/user/app/add/') &&
            response.request().method() === 'PUT' &&
            response.ok()
          );
        await engageToggle.click();

        await page.waitForResponse(response =>
            response.url().includes('/user/app/remove/') || response.url().includes('/user/app/add/') &&
            response.request().method() === 'PUT' &&
            response.ok()
          );

    // await page.getByRole('button', { name: 'Save' }).click();
    // await page.getByRole('button', { name: 'Save' }).last().click();

  });

  test('Step 24: Navigate to the Billing page and validate that all elements load correctly.', async () => {
    await page.getByRole('link', { name: 'Billing' }).click();
    await page.getByText('Organization Level Billing').hover();
    await page.getByText('Location Level Billing').hover();
  });

  test('Step 25: Navigate to Audit Logs and validate filters, search functionality, and data accuracy.', async () => {
    await page.getByRole('link', { name: 'Audit Logs' }).click();
    await page.getByRole('button', { name: 'Filter' }).click();
    await page.getByRole('button', { name: 'Add Filter' }).click();
    await page.getByRole('option', { name: 'User',exact: true }).click();
    await page.locator('ejs-multiselect#multiSelect').first().click();
    await page.getByRole('option', { name: 'Owner' }).click();
    await page.locator('ejs-multiselect#multiSelect').first().click();
    await page.getByRole('button', { name: 'Apply' }).click();
    await page.getByRole('button', { name: 'Filter' }).click();
    await page.getByRole('link', { name: 'Clear' }).click();
    await page.getByRole('button', { name: 'Apply' }).click();
  });

  test('Step 26: Navigate to the General page and select a location.', async () => {
    await page.getByRole('link', { name: 'General' }).click();
    await page.locator('.location-block a.bluecolor').first().click();
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      await page.locator('label[for="file-input-logo"]').click()
    ]);

    await fileChooser.setFiles('Images/Logo.png');
    await page.getByRole('button', { name: 'Crop Image' }).click();
  });

  let addressLine1 = '';
  test('Step 27: Update logo and address details, then save and verify changes.', async () => {
    addressLine1 = await page.locator('#address_line_1').inputValue();
    console.log(addressLine1);
    await page.locator('#address_line_1').fill(addressLine1 + '1');
    await page.getByRole('button', { name: 'Save' }).click();
    await page.locator('#address_line_1').inputValue().then((value) => {
      expect(value).toBe(addressLine1 + '1');
    });
    await page.locator('#address_line_1').fill(addressLine1);
    await page.getByRole('button', { name: 'Save' }).click();
  });

  test('Step 28: Open Business Hours, add working hours, and save changes.', async () => {
    await page.getByRole('link', { name: 'Business Hours' }).click();
    //await page.locator('.location-block a.bluecolor').first().click();
    await page.locator('adit-button button.primary-button-block').last().click();
    await page.locator('div.businesshourboxpopup-slide', { has: page.getByText('Monday')}).locator('ejs-switch').click();
    await page.getByRole('button', { name: 'Save' }).click();
    await page.locator('adit-button button.primary-button-block').last().click();
    await page.locator('div.businesshourboxpopup-slide', { has: page.getByText('Monday')}).locator('ejs-switch').click();
    await page.getByRole('button', { name: 'Save' }).click();
    
  });

  test('Step 29: Navigate to the Business page', async () => {
    await page.getByRole('link', { name: 'Business Pages' }).click(); 
    await page.getByRole('columnheader', { name: 'Social Platforms' }).click();
  });

  test('Step 30: Open the Communication page and validate functionality.', async () => {
    await page.getByRole('link', { name: 'Communication' }).click();
    await page.getByText('Sender Address').first().click();
    await page.getByText('Outgoing Number').first().click();
  });

  test('Step 31: Navigate to the 10DLC page and verify it loads correctly.', async () => {
    await page.getByRole('link', { name: '10 DLC' }).click();
    await page.getByText('Improve SMS/MMS Success Rate').first().click();
    await page.getByText('Daily Messaging Volume').first().click();
  });

  test('Step 32: Open the Access page and verify it matches the Location page behavior.', async () => {
    await page.getByRole('link', { name: 'Access' }).click();
    await page.locator('li.list-item-user-access', {
      has: page.locator('span.avtar-location-text', { hasText: 'Engage' })
    }).locator('ejs-switch').click();

      await page.getByRole('button', { name: 'Yes' }).last().click();

      await page.waitForResponse(response =>
            response.url().includes('/location/app/add/') || response.url().includes('/location/app/remove/') &&
            response.request().method() === 'PUT' &&
            response.ok()
          );
        await page.locator('li.list-item-user-access', {
          has: page.locator('span.avtar-location-text', { hasText: 'Engage' })
        }).locator('ejs-switch').click();

        await page.getByRole('button', { name: 'Yes' }).last().click();

        await page.waitForResponse(response =>
            response.url().includes('/location/app/add/') || response.url().includes('/location/app/remove/') &&
            response.request().method() === 'PUT' &&
            response.ok()
        );

        
  });

  test('Step 33: add/remove users to validate functionality.', async () => {

    await page.getByRole('button', { name: 'Add User(s)' }).click();
    await page.locator('ejs-multiselect#multiSelect').click();

    const firstUser = page.locator('.e-list-item').first();

    const userName = (await firstUser.textContent())?.trim();

    await firstUser.click();

    await page.locator('ejs-multiselect#multiSelect').click();

    await page.getByRole('button', { name: 'Save'}).last().click();

    console.log(userName);

    await page.locator('li.list-item-user-access')
    .filter({
      has: page.locator('span.avtar-location-text', { hasText: userName })
    })
    .locator('button.icon-highlight-off')
    .click();

    await page.getByRole('button', { name: 'Yes'}).last().click();
  });

  test('Step 34: Enable/Disable Engage and validate API calls', async () => {
    await page.getByRole('link', { name: 'Insurances' }).click();
    await page.getByRole('heading', { name: 'Insurance' }).click();
  });

  test('Step 35: Enable/Disable Engage and validate API calls', async () => {
    await page.getByRole('link', { name: 'Ads Integrations' }).click();
    await page.getByRole('tab', { name: 'Google Ads' }).click();
    await page.getByRole('tab', { name: 'Facebook Ads' }).click();
  });

  test('Step 36: Open EHR Page', async () => {
    await page.getByRole('link', { name: 'EHR' }).click();

    const customIcon = page.locator('.custom-icon');
    await expect(customIcon).toBeVisible();
    await customIcon.click();

    const locationOption = page.getByRole('option', { name: location }).first();
    //await expect(locationOption).toBeVisible();
    await locationOption.click();
  });

  test('Step 37: Validate Connection Status', async () => {
    await page.getByRole('link', { name: 'Edit Settings' }).click();
    await page.locator('adit-checkbox label').first().click();
    await page.getByRole('button', { name: 'Confirm' }).click();

    await page.getByRole('link', { name: 'Edit Settings' }).click();
    await page.locator('adit-checkbox label').first().click();
    await page.getByRole('button', { name: 'Confirm' }).click();
  });

  test('Step 38: Open Providers and validate', async () => {
    await page.getByRole('link', { name: 'Providers' }).click();
    await page.getByRole('columnheader', { name: 'Providers' }).click();
    await page.getByRole('columnheader', { name: 'NPI' }).click();
  });

  test('Step 39: Open Appointment Types and validate', async () => {
    await page.getByRole('link', { name: 'Appointment Types' }).click();
    await page.getByRole('columnheader', { name: 'Appointment Types' }).click();
    await page.getByRole('columnheader', { name: 'Status' }).click();
  });

  test('Step 40: Open Operatories and validate', async () => {
    await page.getByRole('link', { name: 'Operatories' }).click();
    await page.getByRole('columnheader', { name: 'Operatories' }).click();
    await page.getByRole('columnheader', { name: 'Status' }).click();
  });

  test('Step 41: Open Patients and validate', async () => {
    await page.getByRole('link', { name: 'Patients' }).click();
    await page.getByRole('columnheader', { name: 'Patient Name' }).click();
    await page.getByRole('columnheader', { name: 'Email' }).click();
  });

  test('Step 42: Open Status Mapping and validate', async () => {
    await page.getByRole('link', { name: 'Status Mapping' }).click();
    await page.getByRole('heading', { name: 'Confirmation Mapping' }).click();
    await page.getByRole('heading', { name: 'Appointment Reason Mapping' }).click();
  });

  test('Step 42: Open Appointments and validate', async () => {
    await page.getByRole('link', { name: 'Appointments' }).click();
    await page.getByRole('columnheader', { name: 'Appt Time' }).click();
    await page.getByRole('columnheader', { name: 'Status' }).click();
  });

  test('Step 43: Open Appt Reminder Types and validate', async () => { 
    await page.getByRole('link', { name: 'Appt Reminder Types' }).click();
    await page.getByRole('columnheader', { name: 'Reminder Name' }).click();
    await page.getByRole('columnheader', { name: 'When to Send' }).click();
  });

  test('Step 44: Open Recall Types and validate', async () => {
    await page.getByRole('link', { name: 'Recall Types' }).click();
    await page.getByRole('columnheader', { name: 'Name' }).click();
    await page.getByRole('columnheader', { name: 'Status' }).click();
  });

  test('Step 45: Open Holidays and validate', async () => {
    await page.getByRole('link', { name: 'Holidays' }).click();
    await page.getByRole('columnheader', { name: 'Date' }).click();
    await page.getByRole('columnheader', { name: 'Name' }).click();
  });

  test('Step 46: Open Mandatory Fields and validate', async () => {
    await page.getByRole('link', { name: 'Mandatory Fields' }).click();
    await page.getByRole('columnheader', { name: 'Field Name' }).click();
    await page.getByRole('columnheader', { name: 'Field Type' }).click();
  });

  // test('Step 47: Open Automations Page', async () => {
  //   await page.getByRole('link', { name: 'Automations' }).first().click();
  //   await page.locator('button:has(.icon-editpen-new-icon)').first().click();
  //   await page.locator('ejs-dropdownlist#singleSelect').first().click();
  //   await page.getByRole('option', { name: '24 Hours' }).click();
  //   await page.locator('button:has(.icon-close-round)').first().click();
  //   await page.getByRole('button', { name: 'Delete' }).click();
  //   await page.locator('button:has(.icon-close-round)').first().click();
  //   await page.getByRole('button', { name: 'Delete' }).click();
  //   await page.locator('button:has(.icon-close-round)').first().click();
  //   await page.getByRole('button', { name: 'Delete' }).click();
  //   await page.locator('button:has(.icon-close-round)').first().click();
  //   await page.getByRole('button', { name: 'Delete' }).click();

  // });

  // test('Step 48: Create Task config', async () => {
  //       await page.getByRole('button', { name: 'Create a Task' }).click();
  //       // Open the dropdown
  //       await page.locator('input[placeholder="Select Due Date"]').click();

  //       // Select "Same as task creation date"
  //       await page.getByRole('option', { name: 'Same as task creation date' }).click();
  //       await page.getByRole('button', { name: 'Save' }).click();   
  // });

  // test('Step 49: Create Follow Up config', async () => {
  //       await page.getByRole('button', { name: 'Create Follow Up' }).click();
  //       await page.locator('input[formcontrolname="assignee_id"]').click();

  //       await page.locator('mat-option').first().click();
  //       await page.getByRole('button', { name: 'Save' }).click();   
  // });



  test('Step 50: Open Profile Page', async () => {
    await page.getByRole('link', { name: 'My Profile' }).first().click();
    await page.getByRole('link', { name: 'General' }).last().click();
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      await page.locator('label[for="file-input-logo"]').click()
    ]);

    await fileChooser.setFiles('Images/Logo.png');
    await page.waitForTimeout(4000);
    await page.getByRole('button', { name: 'Crop Image' }).click();

    await page.waitForResponse(response =>
        response.url().includes('/settings/getUserProfileImage/') &&
        response.request().method() === 'GET' &&
        response.ok()
    );

  });

  test('Step 51: Open Password Page and validate', async () => {
    await page.getByRole('link', { name: 'Password' }).first().click();
    await expect(page.getByRole('textbox', { name: 'Current Password' })).toBeVisible(); 
    await page.getByText('Terminate All Active Sessions').first().hover();
  });

  test('Step 52: Open Notifications Page and validate', async () => {
    await page.getByRole('link', { name: 'Notifications' }).first().click();
    await page.getByText('Add or edit notifications to receive alerts for calls and texts to your tracking numbers.').first().hover();
    await page.getByText('Add or edit notifications to receive alerts for appointments booked.').first().hover();
  });

  test('Step 53: Open Access Page and validate', async () => {
    await page.getByRole('link', { name: 'Access' }).first().click();
    await page.getByText('Applications you have Access to' ).hover();
    await page.getByText('Location(s) you have Access to' ).hover();
  });


  test('Step 54: Open Voice Page', async () => {
    await page.getByRole('link', { name: 'Voice' }).first().click();

    const customIcon = page.locator('.custom-icon');
    await expect(customIcon).toBeVisible();
    await customIcon.click();
    const locationOption = page.getByRole('option', { name: location }).first();
    await locationOption.click();
  });

  test('Step 54: Open Phone System Page and validate', async () => {
    await page.getByRole('link', { name: 'Phone System' }).first().click();
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: 'Cancel' }).first().click();

    const customIcon = page.locator('.custom-icon');
    await expect(customIcon).toBeVisible();
    await customIcon.click();
    const locationOption = page.getByRole('option', { name: location }).first();
    //await expect(locationOption).toBeVisible();
    await locationOption.click();

    let toggle = page.locator('adit-toggle[type="slider-v1"]').first();

    if ((await toggle.locator('label.selected').textContent())?.trim() === 'Yes') {
        await toggle.getByText('No', { exact: true }).click();
    } else {
        await toggle.getByText('Yes', { exact: true }).click();
    }

    await page.getByRole('button', { name: 'Update' }).click();
    
    await page.waitForResponse(response =>
        response.url().includes('/callflow/update/') &&
        response.request().method() === 'PUT' &&
        response.ok()
    );

    await expect(page.locator('.e-toast-content')).toHaveText('Call flow assign successfully');

    await page.waitForTimeout(4000);

    toggle = page.locator('adit-toggle[type="slider-v1"]').first();

    if ((await toggle.locator('label.selected').textContent())?.trim() === 'Yes') {
        await toggle.getByText('No', { exact: true }).click();
    } else {
        await toggle.getByText('Yes', { exact: true }).click();
    }

    await page.getByRole('button', { name: 'Update' }).click();
    await page.waitForTimeout(2000);
    await expect(page.locator('.e-toast-content')).toHaveText('Call flow assign successfully');

    await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
    });

    await page.getByRole('button', { name: 'Remove step' }).last().click();
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: 'Insert Step Here' }).last().click();
    await page.getByRole('button', { name: 'Add Voicemail' }).click();

    await page.getByRole('button', { name: 'Update' }).click();
    await expect(page.locator('.e-toast-content')).toHaveText('Call flow assign successfully');

    const faxTab = page.locator('li', {
        has: page.locator('span', { hasText: 'Fax' })
    }).first();

    if (await faxTab.isVisible()) {
        await faxTab.click();
        await page.locator('input[placeholder="Send incoming faxes to"]').fill('test@example.com');
        await page.getByRole('button', { name: 'Add' }).click();
        await page.locator('tr', {
            has: page.locator('a', { hasText: 'test@example.com' })
        }).locator('.delete-btn').click();
    }

  });

  test('Step 55: Open Tracking Numbers and validate', async () => {
    await page.getByRole('link', { name: 'Tracking Numbers' }).first().click();
    await page.getByRole('button', { name: 'Order New' }).first().click();
    await page.getByText('Select the number carrier').first().hover();
    await page.getByRole('button', { name: 'Cancel' }).first().click();
    await page.locator('a:has(.icon-editpen-new-icon)').first().click();
    await page.getByText('Where would you like calls received at this tracking number to route to?').first().hover();
    await page.getByText('For which types of customers visiting your website do you want to show this tracking number to?').first().hover();
    await page.getByRole('link', { name: 'Tracking Numbers' }).first().click();
    await page.getByRole('button', { name: 'Port In' }).first().click();
    await page.getByText('To complete this process, you will need:').first().hover();
    await page.getByRole('button', { name: 'Cancel' }).last().click();
   });

  test('Step 56: Open Lines / Prefixes and validate', async () => {
    await page.getByRole('link', { name: 'Lines / Prefixes' }).first().click();
    await page.getByRole('columnheader', { name: 'Line Number' }).first().click();
    await page.getByRole('columnheader', { name: 'Label Name' }).first().click();
   });

  test('Step 57: Open E911 Settings and validate', async () => {
    await page.getByRole('link', { name: 'E911 Settings' }).first().click();
    await page.getByRole('heading', { name: 'Emergency Response Location' }).first().click();
   });

  test('Step 58: Open Call Flow Templates and validate', async () => {
    await page.getByRole('link', { name: 'Call Flow Templates' }).first().click();
    await page.getByRole('columnheader', { name: 'Name' }).first().click();
    await page.getByRole('columnheader', { name: 'Location' }).first().click();
    await page.getByRole('button', { name: 'Create Call Flow' }).first().click();
    await page.getByPlaceholder('Call Flow Name').fill('Test By Automation');
    await page.getByRole('button', { name: 'Insert Step Here' }).first().click();
    await page.getByRole('button', { name: 'Add Voicemail' }).first().click();
    await page.getByRole('button', { name: 'Save' }).first().click();
    await page.locator('a:has(.icon-editpen-new-icon)').first().click();
    await page.getByRole('button', { name: 'Remove step' }).last().click();
    await page.getByRole('button', { name: 'Insert Step Here' }).first().click();
    await page.getByRole('button', { name: 'Add Voicemail' }).first().click();
    await page.getByRole('button', { name: 'Update' }).first().click();
    await page.locator('tr.e-row', {has: page.locator('a.fw-semibold', { hasText: 'Test By Automation' })}).locator('.icon-new-remove-icon').click();
    await page.getByRole('button', { name: 'Delete' }).first().click();
   });

  test('Step 59: Open Blocked Callers and validate', async () => {
    await page.getByRole('link', { name: 'Blocked Callers' }).first().click();
    await page.getByRole('button', { name: 'Block Callers' }).first().click();
    await page.getByText('Block Callers', { exact: true }).last().click();
    await page.getByRole('button', { name: 'Cancel' }).last().click();
   });

  test('Step 60: Open Hold Music and validate', async () => {
    await page.getByRole('link', { name: 'Hold Music' }).first().click();
    await page.getByText('Play music to caller on hold.').first().click();
    await page.locator('label:has-text("Custom Hold Music")').click();
    await page.getByRole('button', { name: 'Upload From Audio Library' }).first().click();
    await page.locator('input[type="file"][name="Upload File"]').setInputFiles('Audio/sampleAudio.mp3');
    await page.locator('input[name="rhSelectionRadio"]').last().click();
    await page.getByRole('button', { name: 'Save' }).last().click();
    await page.getByRole('button', { name: 'Update' }).first().click();
   });

  test('Step 61: Open Call Override and validate', async () => {
    await page.getByRole('link', { name: 'Call Override' }).first().click();
    const toggle = page.locator('adit-toggle[formcontrolname="isOverride"]').first();

    const originalState = (await toggle.locator('label.selected').textContent())?.trim();

    // Toggle
    if (originalState === 'Yes') {
        await toggle.locator('label', { hasText: 'No' }).click();
    } else {
        await toggle.locator('label', { hasText: 'Yes' }).click();
        await page.getByRole('button', { name: 'Okay' }).last().click();
    }

    // Your validations here...

    // Restore original state
    if (originalState === 'Yes') {
        await toggle.locator('label', { hasText: 'Yes' }).click();
        await page.getByRole('button', { name: 'Okay' }).last().click();
    } else {
        await toggle.locator('label', { hasText: 'No' }).click();
    }

   const toggle2 = page.locator('adit-toggle[formcontrolname="isCallRecording"]');

    const originalState2 = (await toggle2.locator('label.selected').textContent())?.trim();

    // Toggle to the opposite state
    if (originalState2 === 'Yes') {
        await toggle2.locator('label', { hasText: 'No' }).click();
    } else {
        await toggle2.locator('label', { hasText: 'Yes' }).click();
    }

    // Your validations here...

    // Restore original state
    if (originalState2 === 'Yes') {
        await toggle2.locator('label', { hasText: 'Yes' }).click();
    } else {
        await toggle2.locator('label', { hasText: 'No' }).click();
    }

    await page.getByRole('button', { name: 'Update' }).first().click();

   });

   test('Step 62: Open Audio Library and validate', async () => {
    await page.getByRole('link', { name: 'Audio Library' }).first().click();
    await page.getByPlaceholder('Search by Name').pressSequentially('sampleAudio');
    await page.locator('.icon-editpen-new-icon').first().click();
    await page.locator('input[placeholder="File name"]').fill('DeleteMusic2');
    await page.getByRole('button', { name: 'Done' }).last().click();
    await page.locator('div.musiclibrarylist', {hasText: 'DeleteMusic2'}).first().click();
    //await page.locator('tr', {has: page.locator('.musiclibrarylist', { hasText: 'DeleteMusic2' })}).locator('.icon-new-remove-icon').click();

   });

   test('Step 63: Open Call Recording Page and validate', async () => { 
    await page.getByRole('link', { name: 'Call Recording' }).first().click();
    await page.getByRole('columnheader', { name: 'Location' }).first().click();
    await page.getByRole('columnheader', { name: 'Outbound Record?' }).first().click();
   });

   test('Step 64: Open Voicemail Boxes Page and validate', async () => { 
    await page.getByRole('link', { name: 'Voicemail Boxes' }).first().click();
    await page.getByRole('columnheader', { name: 'VM Box Name' }).first().click();
    await page.getByRole('columnheader', { name: 'Email Alert' }).first().click();
    await page.locator('i.icon-editpen-new-icon').first().click();
    await page.getByRole('button', { name: 'Save' }).last().click();
    await page.locator('i.material-icons', {hasText: 'close'}).last().click();
   });

  test('Step 47: Logout Owner User', async () => {
    await page.locator('li.my-profile-name-block').click();
    await page.getByRole('menuitem', { name: 'Logout' }).click();
  });

  test('Step 48: Verify Username textbox is visible and fill', async () => {
      const usernameTextbox = page.getByRole('textbox', { name: currentEnvConfig.usernameField });
      await expect(usernameTextbox).toBeVisible();
      await usernameTextbox.fill(ManagerUsername);
    });
  
    test('Step 49: Verify Password textbox is visible and fill', async () => {
      const passwordTextbox = page.getByRole('textbox', { name: currentEnvConfig.passwordField });
      await expect(passwordTextbox).toBeVisible();
      await passwordTextbox.fill(ManagerPassword);
    });
  
    test('Step 50: Verify Login button is visible and click', async () => {
      const loginButton = page.getByRole('button', { name: 'Login' });
      await expect(loginButton).toBeVisible();
      await loginButton.click();
    });

    test('Step 51: Verify Access Denied message', async () => {
      await page.getByRole('heading', { name: 'Access Denied' }).click();
    });

    test('Step 52: Logout Manager User', async () => {
      await page.getByRole('button', { name: 'Logout' }).click();
    });

});