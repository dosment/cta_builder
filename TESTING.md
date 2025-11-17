# CTA Builder - Testing Guide

## Manual Testing Checklist

### Setup
- [x] All files created and in correct directories
- [x] HTTP server running on port 8000
- [ ] Browser opened to http://localhost:8000

### Step 1: OEM Selection
- [ ] Page loads without console errors
- [ ] OEM dropdown populates with 38 options (Acura through Volvo)
- [ ] Selecting an OEM enables the Next button
- [ ] Progress bar shows Step 1 as active

### Step 2: CTA Selection
- [ ] All 8 CTA types display as checkboxes:
  - Personalize My Payment
  - Confirm Availability
  - Value My Trade
  - Schedule Test Drive
  - Pre-Qualify
  - Get E-Price
  - Text Us
  - Chat Now
- [ ] Selecting at least one CTA enables Next button
- [ ] Multiple CTAs can be selected
- [ ] Progress bar shows Step 2 as active, Step 1 as completed

### Step 3: Tree & Department Configuration
- [ ] Only selected CTAs appear in configuration list
- [ ] CTAs with `requiresTree: true` show tree and department dropdowns
- [ ] CTAs with `supportsDeeplink: true` show deeplink toggle
- [ ] When deeplink is enabled:
  - [ ] Tree/dept fields hide
  - [ ] Deeplink step dropdown appears
- [ ] Custom department option works:
  - [ ] Selecting "Custom Department Number" shows number input
  - [ ] Custom number is required for validation
- [ ] Text Us and Chat Now show "no configuration required" message
- [ ] Next button validates all required fields

### Step 4: Styling Configuration
- [ ] Each selected CTA appears in list
- [ ] Label dropdown shows all available options from cta-labels.json
- [ ] Custom label option allows text input
- [ ] Style type dropdown shows OEM-specific styles (Primary/Outline)
- [ ] Changes are saved to state

### Step 5: Placement Configuration
- [ ] Each selected CTA appears in list
- [ ] SRP and VDP checkboxes present
- [ ] At least one must be checked (validation)
- [ ] Both can be checked simultaneously

### Step 6: Preview & Export
- [ ] Live preview shows buttons with correct styling:
  - [ ] OEM brand colors applied
  - [ ] Text color correct
  - [ ] Border radius matches OEM (0px for BMW/MINI/Cadillac, 15px for Kia/Mazda, etc.)
  - [ ] Hover effects work
- [ ] Generated code appears in code block
- [ ] Code includes:
  - [ ] CSS `<style>` block with .demo-cta base class
  - [ ] Individual .demo-cta-{type} classes for each CTA
  - [ ] Hover styles
  - [ ] SRP wrapper `<div class="cn-srp-only">` (if applicable)
  - [ ] VDP wrapper `<div class="cn-vdp-only">` (if applicable)
  - [ ] Correct class names on anchor tags
  - [ ] Correct attributes (data-vin, drtstp, onclick)
- [ ] Copy to Clipboard button works
- [ ] Success notification appears after copy

## Test Scenarios

### Scenario 1: Single BuyNow CTA (No Deeplink)
**Steps:**
1. Select Toyota OEM
2. Select "Personalize My Payment" only
3. Skip tree config (not required)
4. Keep default label and Primary style
5. Check both SRP and VDP
6. Verify code has:
   - `class="demo-cta demo-cta-personalize_payment cn-buynow-b1"`
   - `data-vin="{vin}"`
   - No onclick attribute

### Scenario 2: BuyNow with Deeplink
**Steps:**
1. Select Honda OEM
2. Select "Personalize My Payment"
3. Enable deeplink, select "Credit" step
4. Keep default styling
5. Check VDP only
6. Verify code has:
   - `class="demo-cta demo-cta-personalize_payment cn-buy-now"`
   - `data-vin="{vin}"`
   - `drtstp="credit"`
   - No onclick attribute
   - `.cn-bn1 { display: none !important; }` in CSS

### Scenario 3: Regular CTA with Tree
**Steps:**
1. Select Ford OEM
2. Select "Schedule Test Drive"
3. Select tree: "1000 V2 Test Drive"
4. Select dept: "2844"
5. Customize label to "Book a Test Drive"
6. Check SRP only
7. Verify code has:
   - `class="demo-cta demo-cta-test_drive"`
   - `onclick="CNPC.launch(this, { tree: '1000_V2_TEST_DRIVE', dept: 2844, re_engage: true, vin: '{vin}' })"`

### Scenario 4: Communication CTA
**Steps:**
1. Select Chevrolet OEM
2. Select "Text Us"
3. Skip tree config (not required)
4. Keep defaults
5. Check both SRP and VDP
6. Verify code has:
   - `class="demo-cta demo-cta-text_us"`
   - `onclick="CarNowPlugin.showSmsContactForm(this,'cncb11_sms_form');return false;"`

### Scenario 5: Multiple CTAs Mixed
**Steps:**
1. Select Mercedes-Benz OEM
2. Select: Personalize Payment, Confirm Availability, Value Trade
3. Configure Confirm Availability with deeplink "payments"
4. Configure Value Trade with tree and custom dept
5. Use different styles for each (mix Primary/Outline)
6. Set different placements (some SRP, some VDP, some both)
7. Verify:
   - SRP section only contains SRP CTAs
   - VDP section only contains VDP CTAs
   - Each CTA has unique class name
   - All configurations applied correctly

## Bug Fixes Applied

### Fixed Issues:
1. ✅ Duplicate class attributes - refactored to build class in generateCtaAttributes
2. ✅ Tree validation - now checks for custom dept when dept === 'custom'
3. ✅ Deeplink validation - validates deeplinkStep when required
4. ✅ Function parameter mismatch - getOnclickPattern now receives full ctaLabels object

## Known Limitations

- No server-side processing
- No data persistence (refresh loses state)
- Requires modern browser with ES6 module support
- No IE support
- Copy to clipboard requires HTTPS or localhost

## Browser Console Checks

Open browser DevTools (F12) and verify:
- [ ] No JavaScript errors
- [ ] All JSON files load successfully (Network tab)
- [ ] State updates correctly (use: `console.log(appState.data)`)
- [ ] Generated code validates (no unclosed tags)
