import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
import jsQR from 'jsqr';
dotenv.config();

// Shared state
let context;
let page;
let popup;
let qrPopup;
let firstName;
let lastName;
let patientNumber;
let reviewText;
let qrReviewText;
let qrReviewerName;

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
    const locationOption = page.getByRole('option', { name: location });
    await expect(locationOption).toBeVisible();
    await locationOption.click();
})


test('Step 9: Open CRM and add filter and capture patient name', async () => {
  const openCRM = page.locator('a.fixiconbox:has(i.icon-Patients)');
  await openCRM.waitFor({ state: 'visible' });
  await openCRM.click();

  await page.locator('button.common-defaultfilter.empty-filter:visible').click();
  await page.getByRole('button', { name: 'Add Filter' }).click();
  await page.getByText('Profile Created From').click();
  await page.getByRole('combobox', { name: 'null' }).first().click();
  await page.locator('div').filter({ hasText: /^is$/ }).first().click();
  await page.locator('span').filter({ hasText: 'null' }).click();
  await page.locator('div').filter({ hasText: 'EHR' }).nth(2).click();
  await page.getByRole('button', { name: 'Apply' }).click();

//   await page.pause();

 const patientName = await page
  .locator('td[aria-label*="Patient Name"] a.bluecolor')
  .first()
  .textContent();

const trimmedName = patientName.trim().replace(/\s+/g, ' ');

const nameParts = trimmedName.split(' ');

 firstName = nameParts[0];
 lastName = nameParts.slice(1).join(' ');

console.log('Patient Name:', trimmedName);
console.log('First Name:', firstName);
console.log('Last Name:', lastName);
  // await page.pause();
});


test('Step 10: Nagivate to Pozative and send review request', async () => {

  const openPozative = page.locator('a.fixiconbox:has(i.icon-Pozative)');

  await openPozative.waitFor({ state: 'visible' });
  await openPozative.click();

  // Verify QR Code button
  await expect(
    page.getByRole('button', { name: 'QR Code' })
  ).toBeVisible();

  // Scroll a bit
  await page.mouse.wheel(0, 500);

  // Verify Review Request section
  await expect(
    page.getByRole('heading', { name: 'Review Request' })
  ).toBeVisible();

  await page
    .getByRole('heading', { name: 'Review Request' })
    .scrollIntoViewIfNeeded();

  // Fill Patient First Name
  const firstNameField = page.getByRole('combobox', {
    name: 'Patient First Name'
  });

  await firstNameField.click();
  await firstNameField.fill(firstName);

  // Wait for Angular autocomplete dropdown
  await page.waitForTimeout(1000);

  // Wait for dropdown options
  await page.waitForSelector('mat-option', { timeout: 10000 });

  // Select Patient
  const patientOption = page.getByRole('option', {
    name: `${firstName} ${lastName}`
  }).first();

  await patientOption.waitFor({
    state: 'visible',
    timeout: 10000
  });

  await patientOption.click();

  // Capture Patient Number
  await page.waitForTimeout(4000);
  const patientNumberField = page.locator('input[formcontrolname="mobleNumber"]');

  patientNumber = await patientNumberField.inputValue();

  console.log('Patient Number:', patientNumber);

  await page.locator('ul.social-col').evaluate((ul) => {
  ul.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    checkbox.checked = false;

    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    checkbox.dispatchEvent(new Event('input', { bubbles: true }));
  });

  ul.querySelectorAll('i.active').forEach((icon) => {
    icon.classList.remove('active');
  });
});

  //await page.pause();

  // Send Review Request
  const sendButton = page.getByRole('button', { name: 'SEND' });

  await sendButton.scrollIntoViewIfNeeded();
  await expect(sendButton).toBeVisible();

  await page.waitForTimeout(2000);

  await sendButton.click();

  await page.waitForTimeout(3000);

});

test('Step 11: Navigate to engage using sidebar option', async () => {

  await page.locator('.icon-Engage').first().click();
  // Wait 5 seconds before reload
  await page.waitForTimeout(5000);
  // Reload page and wait until everything is loaded
  await page.reload();
  // Additional wait after reload
  await page.waitForTimeout(3000);
    await page.reload();
  // Additional wait after reload
  await page.waitForTimeout(8000);
});

    test('Step 12: Click Search', async () => {
      await page.getByText('Search').click();
     
        await page.getByRole('textbox', { name: 'Search by name or number' }).click();
        await page.getByRole('textbox', { name: 'Search by name or number' }).fill(patientNumber);
        await page.waitForTimeout(2000);
        await page.getByText(firstName + " " + lastName).nth(1).click();
        await page.locator('.icon-open-in-full').click();
        await page.waitForTimeout(8000);
        });

    // test('Step 13: verity message', async () => {
    //         // Scroll chat to bottom to ensure latest messages are visible
    //         await page.locator('#smschatroomcol2').evaluate(el => el.scrollTop = el.scrollHeight);
    //         await page.waitForTimeout(1000);

    //         // Target the outbound review request message (contains adit.com review link)
    //         const lastReviewMessage = page
    //           .locator('#smschatroomcol2 [class*="messagerow"]')
    //           .filter({ has: page.locator('a[href*="adit.com"]') })
    //           .last();

    //         const timeText = await lastReviewMessage
    //           .locator('.sender-name .time')
    //           .innerText();

    //         console.log('Review request message time:', timeText);

    //         function parseTime(timeStr) {
    //             const now = new Date();
    //             const [time, modifier] = timeStr.split(' ');
    //             let [hours, minutes] = time.split(':').map(Number);
    //             if (modifier.toLowerCase() === 'pm' && hours !== 12) hours += 12;
    //             if (modifier.toLowerCase() === 'am' && hours === 12) hours = 0;
    //             const messageTime = new Date(now);
    //             messageTime.setHours(hours, minutes, 0, 0);
    //             return messageTime;
    //         }

    //         const messageTime = parseTime(timeText);
    //         const now = new Date();
    //         const diffInMinutes = Math.abs(now - messageTime) / (1000 * 60);

    //         if (diffInMinutes <= 5) {
    //           console.log('✅ Review request message is recent:', timeText);
    //         } else {
    //           throw new Error(`❌ Review request message too old: ${timeText}`);
    //         }
    //   });

        test('Step 14: open sent link', async () => {
          const reviewLink = page.locator('#smschatroomcol2 a[href^="https://k.adit.com/"], #smschatroomcol2 a[href^="https://short-beta.adit.com/"]').last();
          const reviewLinkUrl = await reviewLink.getAttribute('href');
          console.log('Review Link URL:', reviewLinkUrl);

          [popup] = await Promise.all([
            page.waitForEvent('popup'),
            reviewLink.click()
          ]);
        });

        test('Step 15: Validate Pozative review landing page', async () => {
          await popup.waitForURL(/review\.adit\.com/, { timeout: 15000 });
          await expect(popup.locator('#recommendTxt')).toBeVisible();
          await expect(popup.locator('#recommendTxt')).toContainText('Would you recommend our service?');
        });

        test('Step 16: Click YES and validate review form appears', async () => {
          await popup.locator('button.yesButton').click();
          // On Beta, YES goes directly to the review textarea (not social sites)
          await expect(popup.locator('#thirdCol')).toBeVisible({ timeout: 10000 });
          await expect(popup.locator('#experienceText')).toContainText('Please let us know about your experience.');
        });

        test('Step 17: Enter unique review text', async () => {
          reviewText = `Automated QA Review - ${Date.now()}`;
          console.log('Review Text:', reviewText);
          await popup.locator('textarea#edValue').fill(reviewText);
        });

        test('Step 18: Submit the review and verify thank you message', async () => {
          await popup.locator('button#submitBtn').click();
          await expect(popup.locator('#forthCol')).toBeVisible({ timeout: 10000 });
          await expect(popup.locator('#thankyouText')).toContainText('Thank You For Your Review.');
          console.log('✅ Review submitted successfully:', reviewText);
        });

        test('Step 19: Navigate to Pozative Dashboard and verify review', async () => {
          await page.bringToFront();
          await page.locator('a.fixiconbox:has(i.icon-Pozative)').click();
          await expect(page.getByRole('button', { name: 'QR Code' })).toBeVisible();

          await page.getByText('Recent Reviews').scrollIntoViewIfNeeded();
          await page.waitForTimeout(3000);

          await expect(
            page.locator('[class*="reviewcomment"], [class*="review-comment"], [class*="reviewtext"], p, span, div')
              .filter({ hasText: reviewText })
              .first()
          ).toBeVisible({ timeout: 15000 });

          console.log('✅ Review verified on Dashboard:', reviewText);
        });

        test('Step 20: Click QR Code button and validate modal', async () => {
          await page.getByRole('button', { name: 'QR Code' }).click();

          // Validate modal is visible
          await expect(page.locator('scan-qrcode-popup')).toBeVisible({ timeout: 10000 });

          // Validate QR canvas is rendered with non-zero size
          const canvas = page.locator('qrcode canvas');
          await expect(canvas).toBeVisible();
          const canvasWidth = await canvas.evaluate(el => el.width);
          expect(canvasWidth).toBeGreaterThan(0);
          console.log(`✅ QR canvas rendered at ${canvasWidth}px`);

          // Validate heading and scan label (regex handles curly apostrophe in actual DOM text)
          await expect(page.locator('scan-qrcode-popup')).toContainText(/Tell us how we.re doing/);
          await expect(page.locator('scan-qrcode-popup')).toContainText('Scan for Review');
        });

        test('Step 21: Decode QR code from canvas and open URL in new tab', async () => {
          // Ensure canvas is still in DOM (modal stays open from Step 19)
          await page.waitForSelector('qrcode canvas', { timeout: 10000 });

          // Extract raw RGBA pixel data from the QR canvas
          const imageData = await page.evaluate(() => {
            const canvas = document.querySelector('qrcode canvas');
            const ctx = canvas.getContext('2d');
            const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
            return { data: Array.from(data.data), width: canvas.width, height: canvas.height };
          });

          // Decode QR code in Node.js using jsQR
          const code = jsQR(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height);
          expect(code).not.toBeNull();
          const qrUrl = code.data;
          console.log('Decoded QR URL:', qrUrl);

          // Open the decoded URL in a new tab
          qrPopup = await context.newPage();
          await qrPopup.goto(qrUrl);
        });

        test('Step 22: Validate QR review landing page', async () => {
          await qrPopup.waitForLoadState('domcontentloaded', { timeout: 30000 });
          const currentUrl = qrPopup.url();
          console.log('QR Review Page URL:', currentUrl);

          await expect(qrPopup.locator('#recommendTxt')).toBeVisible({ timeout: 30000 });
          await expect(qrPopup.locator('#recommendTxt')).toContainText('Would you recommend our service?');
        });

        test('Step 23: Submit review via QR code link and verify thank you', async () => {
          await qrPopup.locator('button.yesButton').click();
          await expect(qrPopup.locator('#thirdCol')).toBeVisible({ timeout: 10000 });

          const ts = Date.now();
          qrReviewerName = `QA Reviewer ${ts}`;
          qrReviewText = `QR Code Review - ${ts}`;
          console.log('QR Reviewer Name:', qrReviewerName);
          console.log('QR Review Text:', qrReviewText);

          await qrPopup.getByRole('textbox', { name: 'Name*' }).fill(qrReviewerName);
          await qrPopup.getByRole('textbox', { name: 'Comments*' }).fill(qrReviewText);

          await qrPopup.locator('button#submitBtn').scrollIntoViewIfNeeded();
          await qrPopup.locator('button#submitBtn').click();
          await expect(qrPopup.locator('#forthCol')).toBeVisible({ timeout: 20000 });
          await expect(qrPopup.locator('#thankyouText')).toContainText('Thank You For Your Review.');
          console.log('✅ QR review submitted successfully:', qrReviewText);
        });

        test('Step 24: Verify QR review appears on Pozative Dashboard', async () => {
          // Close the QR review tab
          await qrPopup.close();

          // Bring main page to front and close the QR modal
          await page.bringToFront();
          // await page.keyboard.press('Escape');
          // await page.locator('scan-qrcode-popup').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});

          // Reload to fetch latest reviews
          await page.reload();
          // await page.waitForLoadState('networkidle');

          await page.locator('a.fixiconbox:has(i.icon-Pozative)').click();
          await expect(page.getByRole('button', { name: 'QR Code' })).toBeVisible();

          await page.getByText('Recent Reviews').scrollIntoViewIfNeeded();
          await page.waitForTimeout(3000);

          await expect(
            page.locator('[class*="reviewcomment"], [class*="review-comment"], [class*="reviewtext"], p, span, div')
              .filter({ hasText: qrReviewText })
              .first()
          ).toBeVisible({ timeout: 15000 });

          console.log('✅ QR review verified on Dashboard:', qrReviewText);
          // await page.pause();
        });

test('Step 25: Validate Reviews page sections', async () => {

        // Navigate to Reviews page
        await page.getByRole('link', { name: 'Reviews' }).click();

        // Wait for page to fully load
        // await page.waitForLoadState('networkidle');

        // Validate Reviews page heading
        await expect(
          page.getByRole('heading', { name: /reviews/i })
        ).toBeVisible();

        // Validate all tabs are visible
        const allReviewsTab = page.getByRole('tab', { name: 'All Reviews' });
        const repliedTab = page.getByRole('tab', { name: 'Replied', exact: true });
        const notRepliedTab = page.getByRole('tab', { name: 'Haven\'t Replied' });

        await expect(allReviewsTab).toBeVisible();
        await expect(repliedTab).toBeVisible();
        await expect(notRepliedTab).toBeVisible();

        // =========================
        // Validate All Reviews Tab
        // =========================
        await allReviewsTab.click();

        await expect(allReviewsTab).toHaveAttribute('aria-selected', 'true');

        // Validate reviews/cards/list exists
        await expect(
          page.locator('[class*="review"], [class*="Review"]').first()
        ).toBeVisible();

        // =====================
        // Validate Replied Tab
        // =====================
        await repliedTab.click();

        await expect(repliedTab).toHaveAttribute('aria-selected', 'true');

        // Wait for tab content load
        await page.waitForTimeout(2000);

        // Validate page still contains review section
        await expect(
          page.locator('body')
        ).toContainText(/review|reply|replied/i);

        // =============================
        // Validate Haven't Replied Tab
        // =============================
        await notRepliedTab.click();

        await expect(notRepliedTab).toHaveAttribute('aria-selected', 'true');

        // Wait for tab content load
        await page.waitForTimeout(2000);

        // Validate content loaded
        await expect(
          page.locator('body')
        ).toContainText(/review|reply|pending|haven't replied|not replied/i);

  // await page.pause();

      });

      test('Step 26: Validate Insights page sections', async () => {

  // Navigate to Insights page
  await page.getByRole('link', { name: 'Insights' }).click();

  // Wait for page to fully load
  // await page.waitForLoadState('networkidle');

  // =========================
  // Validate Your Ratings
  // =========================
  const yourRatingsHeading = page.getByRole('heading', {
    name: 'Your Ratings'
  });

  await expect(yourRatingsHeading).toBeVisible();

  // Validate ratings related content exists
  await expect(
    page.locator('body')
  ).toContainText(/rating|reviews|stars/i);

  // =========================
  // Validate Review Progress
  // =========================
  const reviewProgressHeading = page.getByRole('heading', {
    name: 'Review Progress'
  });

  await expect(reviewProgressHeading).toBeVisible();

  // Validate progress related content exists
  await expect(
    page.locator('body')
  ).toContainText(/progress|reviews|responses/i);

    // await page.pause();
});

test('Step 27: Validate Preferences page sections', async () => {

  // Navigate to Preferences page
  await page.getByRole('link', { name: 'Preferences' }).click();

  // Wait for page load
  // await page.waitForLoadState('networkidle');

  // =========================
  // Validate General Information
  // =========================
  const generalInformationHeading = page.getByRole('heading', {
    name: 'General Information'
  });

  await generalInformationHeading.scrollIntoViewIfNeeded();

  await expect(generalInformationHeading).toBeVisible();

  // =========================
  // Validate Pozative Settings
  // =========================
  const pozativeSettingsHeading = page.getByRole('heading', {
    name: 'Pozative Settings'
  });

  await pozativeSettingsHeading.scrollIntoViewIfNeeded();

  await expect(pozativeSettingsHeading).toBeVisible();

  // Validate settings text
  const reviewLimitText = page.getByText('Adit will limit 1 review');

  await reviewLimitText.scrollIntoViewIfNeeded();

  await expect(reviewLimitText).toBeVisible();

  // =========================
  // Validate Business Pages
  // =========================
  const businessPagesHeading = page.getByRole('heading', {
    name: 'Business Pages'
  });

  await businessPagesHeading.scrollIntoViewIfNeeded();

  await expect(businessPagesHeading).toBeVisible();

  // =========================
  // Validate Pozative Widget
  // =========================
  const pozativeWidgetHeading = page.getByRole('heading', {
    name: 'Pozative Widget'
  });

  await pozativeWidgetHeading.scrollIntoViewIfNeeded();

  await expect(pozativeWidgetHeading).toBeVisible();

});

test('Step 28: Navigate to Campaigns page', async () => {
  await page.getByRole('link', { name: 'Campaign' }).click();
  await page.waitForTimeout(2000);
});

test('Step 29: Click New Campaign button', async () => {
  await page.getByRole('button', { name: 'New Campaign' }).click();
  await page.waitForTimeout(2000);
});

test('Step 30: Select variable buttons and click Next', async () => {
  await page.getByRole('link', { name: 'Patient First Name' }).click();
  await page.getByRole('link', { name: 'Patient First Name' }).click();
  await page.getByRole('link', { name: 'Patient First Name' }).click();

  await page.getByRole('button', { name: 'Next' }).click();

  await page.waitForTimeout(3000);

  const patientName = `${firstName} ${lastName}`;

  // Find exact patient row
  const patientRow = page.locator('tr', {
    has: page.getByText(patientName, { exact: true })
  });

  // Ensure row is visible
  await patientRow.waitFor({ state: 'visible' });

  // Click checkbox in same row
  const checkbox = patientRow.locator('input[type="checkbox"]').first();

  await checkbox.waitFor({ state: 'visible' });
  await checkbox.click();

  // Verify checkbox checked
  await expect(checkbox).toBeChecked();
  await page.getByRole('button', { name: 'Next', exact: true }).click();


});

test('Step 31: Click Next and verify then click send ', async () => {
 //await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('cell', { name: firstName + " "+ lastName}).toBeVisible();
  await page.getByRole('cell', { name: patientNumber }).toBeVisible();
  await page.getByRole('button', { name: 'Send' }).click();
  await page.pause();
});



});