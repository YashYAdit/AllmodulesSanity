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

    test('Step 9: Opening Engage Internal Chat', async () => {
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

      await page.locator('li', {has: page.locator('span.message-list-name', { hasText: 'Manager User' })}).click();
    });

    let count = 1;

    test('Step 10: Send Message', async () => {
        await page.locator('#focusDiv').click();
        await page.locator('#focusDiv').pressSequentially(String(count) + user.firstName, { delay: 50 });
        await page.locator('.icon-send-round.orangecolor').click();
    });

    test('Step 11: Vaildate sent Message', async () => {
      await expect(page.getByText(count + user.firstName, { exact: true })).toBeVisible();
      count++;
    });

    test('Step 12: Edit the previously sent chat message.', async () => {
      await page.locator('i.icon-cart-arrow-down').last().click();
      await page.locator('a', { hasText: 'Edit' }).click();
      await page.locator('#focusDiv').click();
      await page.keyboard.press('Control+A');
      await page.keyboard.press('Backspace');
      await page.locator('#focusDiv').pressSequentially(String(count) + user.firstName, { delay: 50 });
      await page.keyboard.press('Enter');
    });

    test('Step 12: Validate that the edited message is updated successfully.', async () => {
      await expect(page.getByText(count + user.firstName, { exact: true })).toBeVisible();
    });

    test('Step 13: Remove/Delete the chat message.', async () => {
      await page.locator('i.icon-cart-arrow-down').last().click();
      await page.locator('a', { hasText: 'Remove' }).click();
      await page.getByRole('button', { name: 'Yes' }).click();
      
    });

    test('Step 14: Validate that the message is removed successfully from the chat.', async () => {
      await expect(page.getByText(count + user.firstName, { exact: true })).not.toBeVisible();
    });

    test('Step 15: Verify the Clear Chat functionality.', async () => {
        await page.locator('.message-chatroom-headbox').getByRole('button').click();
        await page.getByRole('menuitem', { name: /Clear Chat/ }).click();
        await page.getByRole('button', { name: 'Confirm' }).click();
    });

    test('Step 22: Send Message again', async () => {
        await page.locator('#focusDiv').click();
        await page.locator('#focusDiv').pressSequentially(String(count) + user.firstName, { delay: 50 });
        await page.locator('.icon-send-round.orangecolor').click();
    });

    test('Step 23: Vaildate sent Message', async () => {
      await expect(page.getByText(count + user.firstName, { exact: true }).last()).toBeVisible();

    });

    test('Step 16: Create a new Group Chat successfully.', async () => {
        groupName = `UI Auto Group ${Date.now()}`;

        await page.getByRole('button', { name: 'New' }).click();
        await page.locator('h4:has-text("Create Internal Group Chat")').click();
        await page.getByPlaceholder('Name This Group Chat').fill(groupName);

        // Read names before clicking (clicking removes user from list, shifting indices)
        const staffList = page.locator('#newDialog_dialog-content li');
        const firstName = await staffList.nth(0).locator('h4').innerText();
        const secondName = await staffList.nth(1).locator('h4').innerText();
        // Must click the h4 inside li — li.click() doesn't trigger Angular's selection handler
        // Use name-based filter for second click to avoid index shift after first selection
        await staffList.filter({ hasText: firstName }).locator('h4').first().click();
        await staffList.filter({ hasText: secondName }).locator('h4').first().click();

        await page.getByRole('button', { name: 'Start', exact: true }).click();

        page._addedMembers = [firstName.trim(), secondName.trim()];
    });

    test('Step 17: Validate Group Chat name and added members are visible on the right panel.', async () => {
        // Validate full group name in the right panel heading
        await expect(page.locator('h3').filter({ hasText: groupName }).last()).toBeVisible();

        // Validate both added members appear in the Group Members list (.group-list-area)
        for (const member of page._addedMembers) {
            await expect(
                page.locator('.group-list-area h4').filter({ hasText: member })
            ).toBeVisible();
        }
    });

    test('Step 18: Send a message in the Group Chat.', async () => {
        await page.locator('#focusDiv').click();
        await page.locator('#focusDiv').pressSequentially('GroupMsg ' + user.firstName, { delay: 50 });
        await page.locator('.icon-send-round.orangecolor').click();
    });

    test('Step 19: Validate that the Group Chat message is displayed correctly.', async () => {
        await expect(page.getByText('GroupMsg ' + user.firstName, { exact: true })).toBeVisible();
    });

    test('Step 20: Remove a member from the Group Chat.', async () => {
        // Remove the first added member via the Remove span in .group-list-area
        const memberToRemove = page._addedMembers[0];
        await page.locator('.group-list-area li')
            .filter({ hasText: memberToRemove })
            .locator('span.remove-text-area')
            .click();
        // Confirm the remove dialog
        await page.getByRole('button', { name: 'Remove' }).click();
    });

    test('Step 21: Leave the Group Chat successfully.', async () => {
        await page.locator('button.e-control:has-text("Leave Conversation")').click();
        // Confirm the leave dialog
        await page.getByRole('button', { name: 'Leave', exact: true }).click();
        
    });

    test('Step 24: Logout', async () => {
        await page.locator('div.e-avatar-circle').first().click();
        await page.getByRole('menuitem', { name: 'Logout' }).click();
    });

//--------------------------------------------------------------- Manager Flow ----------------------------------------------------------------

test('Step 25: Verify Username textbox is visible and fill', async () => {
    const usernameTextbox = page.getByRole('textbox', { name: currentEnvConfig.usernameField });
    await expect(usernameTextbox).toBeVisible();
    await usernameTextbox.fill(ManagerUsername);
  });

  test('Step 26: Verify Password textbox is visible and fill', async () => {
    const passwordTextbox = page.getByRole('textbox', { name: currentEnvConfig.passwordField });
    await expect(passwordTextbox).toBeVisible();
    await passwordTextbox.fill(ManagerPassword);
  });

  test('Step 27: Verify Login button is visible and click', async () => {
    const loginButton = page.getByRole('button', { name: 'Login' });
    await expect(loginButton).toBeVisible();
    await loginButton.click();
  });

  test('Step 28: If Rating pop up appears', async () => {
    const popupHeading = page.getByRole('heading', { name: 'Enjoying the Adit App?' });
    const closeButton = page.getByRole('button', { name: '' });

    if (await popupHeading.isVisible({ timeout: 3000 })) {
      await expect(closeButton).toBeVisible();
      await closeButton.click();
    }
  });

  test('Step 29: Verify Dashboard & close softphone popup', async () => {

    const closeSoftphone = page.locator('.e-popup-open .e-dlg-closeicon-btn');
    await closeSoftphone.click();
    
  });

  test('Step 30: Verify Location Dropdown is visible and click', async () => {
    const customIcon = page.locator('.custom-icon');
    await expect(customIcon).toBeVisible();
    await customIcon.click();
  });

  test('Step 31: Select Location', async () => {
    const locationOption = page.getByRole('option', { name: location }).first();
    //await expect(locationOption).toBeVisible();
    await locationOption.click();
  });

   test('Step 32: Opening Engage Internal Chat', async () => {
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

      await page.locator('li', {has: page.locator('span.message-list-name', { hasText: 'Owner Ninja' })}).click();
    });

    test('Step 33: Vaildate sent Message', async () => {
      await expect(page.getByText(count + user.firstName, { exact: true })).toBeVisible();
      count++;
    });

    test('Step 34: Remove/Delete the chat message.', async () => {
      await page.locator('i.icon-cart-arrow-down').last().click();
      await page.locator('a', { hasText: 'Reply' }).click();
    });

    test('Step 35: Send Message in reply', async () => {
        await page.locator('#focusDiv').click();
        await page.locator('#focusDiv').pressSequentially(String(count) + user.firstName, { delay: 50 });
        await page.locator('.icon-send-round.orangecolor').click();
    });

    test('Step 36: Vaildate sent reply Message', async () => {
      await expect(page.getByText(count + user.firstName, { exact: true })).toBeVisible();
      await page.pause();
    });

});