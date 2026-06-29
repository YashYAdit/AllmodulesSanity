import { test, expect } from '@playwright/test';
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

const currentDate = new Date();

const formattedDate = currentDate.toLocaleDateString('en-US', {
  month: 'short',
  day: 'numeric'
});

// ---------- Tests ----------
test.describe('Email Campaign', () => {

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
    await expect(locationOption).toBeVisible();
    await locationOption.click();
  });

  test('Step 9: Opening Patient Forms', async () => {
    await page.locator('.icon-Patients').first().click();
    await page.waitForTimeout(4000);
  });

  test('Step 10: Open Patients Segment', async () => {
    await page.getByRole('link', { name: 'Segments' }).click();
    await page.getByRole('link', { name: 'Patients'}).last().click();
  });

  test('Step 11: Create Segment', async()=>{
    await page.getByRole('button', { name: 'Add Segment' }).click();
    await page.getByRole('textbox', { name: 'Type here' }).click();
    await page.getByRole('textbox', { name: 'Type here' }).fill('PatientSegmentAbove115'+user.firstName);
    await page.getByText('Status').click();
    await page.getByRole('combobox', { name: location }).nth(2).click();
    await page.waitForTimeout(2000);
    await page.getByRole('option', { name: 'Both Active & Inactive' }).click();
    await page.getByText('Age', { exact: true }).click();
    await page.getByRole('combobox', { name: location }).nth(3).click();
    await page.waitForTimeout(2000);
    await page.getByText('Above',{ exact: true }).click();
    await page.getByRole('spinbutton').click();
    await page.getByRole('spinbutton').fill('99');
    await page.getByRole('button', { name: 'Add', exact: true }).click();
  })

    test('Step 9: Open Email Campaign', async () => {
        await page.locator('.icon-Email-Campaign').first().click();
        await page.waitForTimeout(4000);
    });

    test('Step 9: Add Email Campaign', async () => {
        await page.getByRole('button', { name: 'Add Campaign' }).click();
        await page.locator('textarea[formcontrolname="campaign_name"]').click();
        await page.locator('textarea[formcontrolname="campaign_name"]').fill('Test'+user.firstName);
        await page.getByRole('button', { name: 'Begin' }).click();
    });

    test('Step 9: Edit Recipients', async () => {
        await page.getByRole('button', { name: 'Add Recipients' }).click();
        await page.locator('mat-select[formcontrolname="segmentIds"]').first().click();
        await page.getByRole('option', { name: 'PatientSegmentAbove115'+user.firstName }).first().click();
        await page.waitForTimeout(2000);
        await page.locator('body').click({ position: { x: 5, y: 5 } });
        await page.waitForTimeout(4000);
        await page.locator('form').getByRole('button', { name: 'Save' }).click();


        await (
          await page.getByRole('button', { name: 'Add From' }).isVisible()
            ? page.getByRole('button', { name: 'Add From' })
            : page.getByRole('button', { name: 'Edit From' })
        ).click();
        await page.waitForTimeout(2000);
        //await page.getByText('SaveCancel').click();
        await page.locator('#mainlayout').getByRole('textbox').click();
        await page.locator('#mainlayout').getByRole('textbox').fill('QA Automation - Team Ninja');
        await page.evaluate(() => {
          [...document.querySelectorAll('button')]
            .find(btn => btn.textContent?.trim() === 'Save')
            ?.click();
        });
        //await page.getByRole('button', { name: 'Save' }).first().click();
        //await page.getByRole('textbox').nth(1).click();
        await page.getByRole('button', { name: 'Add Subject' }).click();
        await page.getByRole('textbox').nth(1).click();
        await page.getByRole('textbox').nth(1).fill('sdasd');
        await page.locator('form').getByRole('button', { name: 'Save' }).click();
        await page.getByRole('button', { name: 'Design Email' }).click();
        await page.locator('img[src*="aditstorage"]').first().click();
        const response = await page.waitForResponse(response =>
          response.url().includes('https://api.events.unlayer.com/usage') &&
          response.ok()
        );

        console.log('✅ API response successful:', response.status());
        await page.getByRole('button', { name: 'Continue' }).click();
        await page.waitForResponse(response =>
          response.url().includes('https://api.events.unlayer.com/save') &&
          response.ok()
        );
        await page.waitForTimeout(8000);
        await page.getByRole('button', { name: 'Send' }).first().click();
        await page.getByRole('button', { name: 'Send Now' }).click();
        await page.waitForTimeout(8000);
    });


    test('Step 10: Validate Copy Campaign', async () => {
        await page.reload();
        await page.locator('button[title="Copy"]').first().click();
    });

    test('Step 10: Validate schedule Campaign', async () => {                  
        await page.getByRole('button', { name: 'Schedule' }).click();          
        await page.getByRole('textbox', { name: 'Choose a date' }).click();    
        await page.getByRole('button', { name: formattedDate+',' }).click();   
        await page.locator('input[name="scheduleTime"]').evaluate((el) => {    
          el.value = '10';                                                     
          el.dispatchEvent(new Event('input', { bubbles: true }));             
          el.dispatchEvent(new Event('change', { bubbles: true }));            
        });                                                                    
        await page.getByRole('button', { name: 'Schedule Campaign' }).click();  
    });

    test('Step 10: Validate Copy Campaign created successfully', async () => {
        await expect(
          page.getByRole('button', { name: 'Test'+user.firstName+' (Copy 1)' })
        ).toBeVisible();
    });

    test('Step 11: Delete Copy Campaign', async () => {
        await page.getByRole('button', { name: 'delete_outline' }).first().click();
        await page.getByRole('button', { name: 'Confirm' }).click();
    });

    test('Step 12: Open report', async () => {
        await page.getByRole('button', { name: 'View Report' }).first().click();
        await expect(
          page.getByText('Test'+user.firstName)
        ).toBeVisible();
        
    });
    
    test('Step 13: Create Drip Campaign', async () => {
        await page.getByRole('link', { name: 'Automation' }).click();
        await page.getByRole('button', { name: 'Create Drip Campaign' }).click();
        await page.locator('#mat-input-4').click();
        await page.locator('#mat-input-4').fill('Test'+user.firstName);
        await page.getByRole('button', { name: 'Next' }).click();
    });

    test('Step 14: Add Immediate send Followup', async () => {
        await page.locator('button[mattooltip="Add New Follow Up Message"]').click();
        await page.locator('input[formcontrolname="name"]').click();
        await page.locator('input[formcontrolname="name"]').fill('TestImmediate'+user.firstName);
        await page.getByRole('button', { name: 'Next' }).click();
        await page.getByRole('button', { name: 'Add Subject' }).click();
        await page.locator('input[formcontrolname="subject"]').click();
        await page.locator('input[formcontrolname="subject"]').fill('Test Subject');
        await page.getByRole('button', { name: 'Save' }).first().click();
        await page.getByRole('button', { name: 'Design Email' }).first().click();
        await page.locator('button:has(img)').first().click();
        const response = await page.waitForResponse(response =>
          response.url().includes('https://api.events.unlayer.com/usage') &&
          response.ok()
        );
        

        console.log('✅ API response successful:', response.status());
        await page.getByRole('button', { name: 'Continue' }).click();
        await page.getByRole('button', { name: 'Finish' }).first().click();
        await page.locator('div.follow-messages-active-text', {
          has: page.locator('button', { hasText: 'TestImmediate'+user.firstName })
        }).getByRole('button', { name: 'Set Sending Time' }).click();
        
        await page.locator('div.mdc-form-field', {hasText: 'Immediately After Contact joins list'}).locator('input[value="immediate"]').check();
        await page.getByRole('button', { name: 'Save' }).first().click();
        await page.waitForResponse(response =>
          response.url().includes('emailcampaign/drip-campaign/get-drip-campaign') &&
          response.ok()
        );
        await page.locator('.follow-messages-active-innter').filter({ hasText: 'TestImmediate'+user.firstName }).locator('span:has-text("play_circle_outline")').first().click();
        await page.waitForTimeout(4000);
        
    });

    test('Step 15: Add Delay send Followup', async () => {
        await page.locator('button[mattooltip="Add New Follow Up Message"]').click();
        await page.locator('input[formcontrolname="name"]').click();
        await page.locator('input[formcontrolname="name"]').fill('TestDelay'+user.firstName);
        await page.getByRole('button', { name: 'Next' }).click();
        await page.getByRole('button', { name: 'Add Subject' }).click();
        await page.locator('input[formcontrolname="subject"]').click();
        await page.locator('input[formcontrolname="subject"]').fill('Test Subject');
        await page.getByRole('button', { name: 'Save' }).first().click();
        await page.getByRole('button', { name: 'Design Email' }).first().click();
        await page.locator('button:has(img)').first().click();
        const response = await page.waitForResponse(response =>
          response.url().includes('https://api.events.unlayer.com/usage') &&
          response.ok()
        );
        

        console.log('✅ API response successful:', response.status());
        await page.getByRole('button', { name: 'Continue' }).click();
        await page.getByRole('button', { name: 'Finish' }).first().click();
        await page.locator('div.follow-messages-active-text', {
          has: page.locator('button', { hasText: 'TestDelay'+user.firstName })
        }).getByRole('button', { name: 'Set Sending Time' }).click();
        
        await page.locator('div.mdc-form-field', {hasText: 'After a delay'}).locator('input[value="delay"]').check();
        await page.locator('input[formcontrolname="number_to_delay"]').click();
        await page.locator('input[formcontrolname="number_to_delay"]').fill('1');
        await page.getByRole('button', { name: 'Save' }).first().click();
        await page.waitForResponse(response =>
          response.url().includes('emailcampaign/drip-campaign/get-drip-campaign') &&
          response.ok()
        );
        await page.locator('.follow-messages-active-innter').filter({ hasText: 'TestDelay'+user.firstName }).locator('span:has-text("play_circle_outline")').first().click();
        await page.waitForTimeout(4000);
        await page.getByRole('link', { name: 'Automation' }).click();
        await page.pause();
    });

    test('Step 16: Clone the Drip Campaign and Validate and delete', async() => {
        await page.getByRole('button', { name: 'Test'+user.firstName }).click();
        await page.getByRole('button', { name: /Actions/i }).click();
        await page.getByRole('button', { name: 'Clone' }).click();
        await page.locator('input[formcontrolname="name"]').click();
        await page.locator('input[formcontrolname="name"]').fill('CloneTest'+user.firstName);
        await page.getByRole('button', { name: 'Confirm' }).click();
        await expect(page.locator(`span[title="CloneTest${user.firstName}"]`).first()).toBeVisible();
        await page.getByRole('button', { name: /Actions/i }).click();
        await page.getByRole('button', { name: 'Delete' }).click();
        await page.getByRole('button', { name: 'Confirm' }).click();
    });

});