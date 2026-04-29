# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\PatientFormNewAndExistingPatient.spec.js >> New Patient >> Step 15: Open patient and click Edit (handle popup)
- Location: tests\PatientFormNewAndExistingPatient.spec.js:183:7

# Error details

```
Error: locator.click: Target page, context or browser has been closed
Call log:
  - waiting for getByRole('link', { name: '66ovsx Un3wwn9919' }).first()

```

# Test source

```ts
  85  |   test('Step 3: Verify Password textbox is visible and fill', async () => {
  86  |     const passwordTextbox = page.getByRole('textbox', { name: currentEnvConfig.passwordField });
  87  |     await expect(passwordTextbox).toBeVisible();
  88  |     await passwordTextbox.fill(Password);
  89  |   });
  90  | 
  91  |   test('Step 4: Verify Login button is visible and click', async () => {
  92  |     const loginButton = page.getByRole('button', { name: 'Login' });
  93  |     await expect(loginButton).toBeVisible();
  94  |     await loginButton.click();
  95  |   });
  96  | 
  97  |   test('Step 5: If Rating pop up appears', async () => {
  98  |     const popupHeading = page.getByRole('heading', { name: 'Enjoying the Adit App?' });
  99  |     const closeButton = page.getByRole('button', { name: '' });
  100 | 
  101 |     if (await popupHeading.isVisible({ timeout: 3000 })) {
  102 |       await expect(closeButton).toBeVisible();
  103 |       await closeButton.click();
  104 |     }
  105 |   });
  106 | 
  107 |   test('Step 6: Verify Dashboard & close softphone popup', async () => {
  108 | 
  109 |     const closeSoftphone = page.locator('.e-popup-open .e-dlg-closeicon-btn');
  110 |     await closeSoftphone.click();
  111 |     
  112 |   });
  113 | 
  114 |   test('Step 7: Verify Location Dropdown is visible and click', async () => {
  115 |     const customIcon = page.locator('.custom-icon');
  116 |     await expect(customIcon).toBeVisible();
  117 |     await customIcon.click();
  118 |   });
  119 | 
  120 |   test('Step 8: Select Location', async () => {
  121 |     const locationOption = page.getByRole('option', { name: location });
  122 |     await expect(locationOption).toBeVisible();
  123 |     await locationOption.click();
  124 |   });
  125 | 
  126 |   test('Step 9: Opening Patient Forms', async () => {
  127 |     await page.locator('.icon-Patient-Form').first().click();
  128 |     await page.waitForTimeout(4000);
  129 |   });
  130 | 
  131 |   test('Step 10: Click initial link and button', async () => {
  132 |     await page.locator('i.icon-new-add-icon').click();
  133 |     await page.waitForTimeout(2000);
  134 |     await page.getByLabel('', { exact: true })
  135 |     .getByRole('button')
  136 |     .filter({ hasText: /^$/ })
  137 |     .last()
  138 |     .click();
  139 |     await page.locator('.icon-Patient-Form.white-color').click();
  140 |   });
  141 | 
  142 |   test('Step 11: Fill details', async () => {
  143 | 
  144 |         await page.getByRole('combobox', { name: 'First Name*' }).click();
  145 |         await page.getByRole('combobox', { name: 'First Name*' }).fill(user.firstName);
  146 |         await page.getByRole('combobox', { name: 'Last Name*' }).click();
  147 |         await page.getByRole('combobox', { name: 'Last Name*' }).fill(user.lastName);
  148 |         await page.waitForTimeout(2000);
  149 |         await page.getByRole('textbox', { name: 'Cell phone' }).click();
  150 |         await page.getByRole('textbox', { name: 'Cell phone' }).fill(user.mobile.toString());
  151 |         await page.getByRole('textbox', { name: 'Email' }).click();
  152 |         await page.getByRole('textbox', { name: 'Email' }).fill(user.email);
  153 |         await page.waitForTimeout(2000);
  154 |         await page.getByRole('combobox', { name: 'dropdownlist' }).first().click();
  155 |         await page.getByText('Lead', { exact: true }).click();
  156 |   });
  157 | 
  158 |   test('Step 12: Click Next button', async () => {
  159 |     await page.getByRole('button', { name: /Next/i }).click();
  160 |   });
  161 | 
  162 |   test('Step 13: Assign new form', async () => {
  163 |     await page.getByRole('button', { name: /Assign New Form/i }).click();
  164 | 
  165 |     await page.locator('.assign-new-form-check')
  166 |       .locator('.inner-check-block', {
  167 |         has: page.locator('.assign-new-checktext span', { hasText: 'SanityPFAutomation' })
  168 |       })
  169 |       .locator('input[type="checkbox"]')
  170 |       .check();
  171 |   });
  172 | 
  173 |   test('Step 14: Save & Send', async () => {
  174 |     await page.getByRole('button', { name: /Save/i }).click();
  175 |     await page.getByRole('button', { name: /Send/i }).click();
  176 |     const response = await page.waitForResponse(response =>
  177 |       response.url().includes('/patient-form/send-form-request') &&
  178 |       response.request().method() === 'POST'
  179 |     );
  180 |   });
  181 | 
  182 | 
  183 |   test('Step 15: Open patient and click Edit (handle popup)', async () => {
  184 |       await page.getByRole('tab', { name: 'Requested' }).click();
> 185 |       await page.getByRole('link', { name: user.firstName + ' ' + user.lastName }).first().click();
      |                                                                                            ^ Error: locator.click: Target page, context or browser has been closed
  186 |   
  187 |       const url = page.url();
  188 |       formID = url.split('/').pop();
  189 |           console.log('Expected Form ID: ', formID);
  190 |   
  191 |       const [popup] = await Promise.all([
  192 |         page.waitForEvent('popup'),
  193 |         page.getByRole('button', { name: /Edit/i }).click()
  194 |       ]);
  195 |   
  196 |       global.popup = popup;
  197 |     });
  198 | 
  199 |   test('Step 16: Fill patient form in popup', async () => {
  200 |     const popup = global.popup;
  201 | 
  202 |     const fillField = async (label, value) => {
  203 |       const field = popup.locator('adittech-single-line-textbox')
  204 |         .filter({ hasText: label })
  205 |         .getByRole('textbox');
  206 |       await field.click();
  207 |       await field.fill(value);
  208 |     };
  209 | 
  210 |     // await fillField('Last Name', 'automation');
  211 |     // await fillField('First Name', 'pfsanity');
  212 | 
  213 |     await popup.locator('adittech-textbox-date').getByRole('textbox').click();
  214 |     await popup.getByLabel('Select year').selectOption('2000');
  215 |     await popup.getByLabel('Select month').selectOption('0');
  216 |     await popup.getByRole('link', { name: '1', exact: true }).click();
  217 | 
  218 |     // const emailField = popup.locator('adittech-textbox-email');
  219 |     // await expect(emailField).toContainText('Email'); // wait for Angular
  220 |     // await emailField.getByRole('textbox').fill('qa@adit.com');
  221 | 
  222 |     await fillField('Address', 'asdasdasd');
  223 |     await fillField('City', 'asdsadas');
  224 |     await fillField('State', 'dsaddsas');
  225 |     await fillField('ZIP', '2528845');
  226 | 
  227 |     // await popup.locator('adittech-textbox-phone').filter({ hasText: 'Mobile Number' })
  228 |     //   .getByRole('textbox').fill('(454) 545-4545');
  229 | 
  230 |     await popup.locator('adittech-selection-dropdown').filter({ hasText: 'Preferred Provider' })
  231 |       .getByRole('combobox').click();
  232 |     await popup.getByRole('option', { name: 'Default Provider' }).click();
  233 | 
  234 |     await popup.locator('adittech-selection-dropdown').filter({ hasText: 'Marital Status' })
  235 |       .getByRole('combobox').click();
  236 |     await popup.getByRole('option', { name: 'Single' }).click();
  237 | 
  238 |     await popup.locator('adittech-selection-dropdown').filter({ hasText: 'Gender' })
  239 |       .getByRole('combobox').click();
  240 |     await popup.getByRole('option', { name: 'Male', exact: true }).click();
  241 | 
  242 |     await popup.getByRole('link', { name: 'Submit' }).click();
  243 |   });
  244 | 
  245 |   test('Step 17: Navigate to Submissions page', async () => {
  246 |     await page.bringToFront();
  247 |     await page.getByRole('link', { name: /Submissions/i }).click();
  248 |   });
  249 | 
  250 |   test('Step 18: Approve Form', async () => {
  251 |       await page.getByRole('tab', { name: 'Submitted' }).click();
  252 |       await page.locator('tr')
  253 |         .filter({ hasText: user.firstName + ' ' + user.lastName })
  254 |         .first()
  255 |         .getByRole('button')
  256 |         .click();
  257 | 
  258 |         await page.locator('.icon-user-invite').click();
  259 |         await page.getByRole('button', { name: 'Add Patient & Approve Form' }).click();
  260 |         
  261 |         const responsePromise = page.waitForResponse(response =>
  262 |           response.url().includes('/patient-form/forms/get-patient-form-submissions-list') &&
  263 |           response.request().method() === 'POST'
  264 |         );
  265 |         // Wait until API is called and completed
  266 |       const response = await responsePromise;
  267 |       if (response.ok()) {
  268 |         console.log('✅ API called successfully');
  269 |       }
  270 |     });
  271 |   
  272 |     test('Step 19: Imported Tab', async () => {
  273 |       await page.getByRole('tab', { name: 'Imported' }).click();
  274 |       await page.getByText('Date Submitted').click();
  275 |       await page.getByText('Date Submitted').click();
  276 |       await page.getByRole('link', { name: user.firstName + ' ' + user.lastName }).first().click();
  277 |       const url = page.url();
  278 |       const id = url.split('/').pop();
  279 |       console.log('Form ID: ', id);
  280 |   
  281 |       if(formID !== id) {
  282 |         throw new Error('Form ID does not match');
  283 |       }else{
  284 |         console.group('Form Validation');
  285 |         console.log('✅ Form ID matches');
```