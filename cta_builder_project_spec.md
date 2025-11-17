# CTA Builder Wizard – Project Spec (Updated)

## 1. Purpose & Audience

**App type:** Front-end-only web app (no backend).
**Primary user (customer):** Internal field reps / account managers who configure CTAs for dealerships.
**Deliverable TO THE USER:**
- A block of **copy‑pasteable code** (HTML/CSS) displayed on screen with live preview.
- They will paste this into a dealership's website / tag manager.

**Internal-only asset (for dev):**
- One JSON file per OEM/brand (38 total) used to pre-fill branded styles and defaults.
- This JSON is NOT the user-facing deliverable. It's a configuration source for the builder.

---

## 2. High-Level Flow

1. Field rep opens the CTA Builder Wizard.
2. Wizard walks them through a series of steps:
   - **Step 1:** Select OEM brand (live preview updates with brand colors)
   - **Step 2:** Choose CTAs
   - **Step 3:** Configure trees & departments (with deeplink support)
   - **Step 4:** Customize styling and labels
   - **Step 5:** Advanced styling (border-radius, margins, padding sliders)
   - **Step 6:** Set placement (SRP/VDP/Mobile/Desktop)
   - **Step 7:** Preview and copy generated code
3. **Live Preview Sidebar:** Shows real-time preview of CTAs with OEM branding throughout all steps
4. On the final step:
   - Show a **full preview** of the CTAs
   - Show the **generated code** in a code block
   - Provide a "Copy Code" button

No data is saved server-side. All logic is client-side.

---

## 3. Wizard Steps (User-Facing)

### Step 1 – OEM Selection

**Question:**
"Which OEM brand is this for?"

**UI:**
- Dropdown with 38 OEM options (Acura through Volvo)
- Live preview sidebar updates immediately with brand color scheme

**Features:**
- Progress bar shows Step 1 as active (dark blue with lime green glow)
- Preview shows placeholder when no OEM selected
- Selecting OEM loads brand-specific JSON with colors and styles

Wizard state example:

```js
state.oem = "toyota";
state.oemData = {
  code: "toyota",
  name: "Toyota",
  brandColor: "#EB0A1E",
  styles: {
    primary: { ... },
    secondary: { ... }
  }
};
```

---

### Step 2 – CTA Selection

**Question:**
"Which CTAs do you want to include?"

**UI:**
- Checkboxes with simplified labels:
  - Payments (Personalize My Payment)
  - Confirm (Confirm Availability)
  - Trade (Value My Trade)
  - Test Drive (Schedule Test Drive)
  - Pre-Qualify
  - E-Price
  - Text Us
  - Chat Now

**Validation:**
- At least 1 CTA must be selected

**Features:**
- Live preview updates as CTAs are selected/deselected
- Progress bar shows Step 2 as active, Step 1 as completed

Wizard state example:

```js
state.selectedCtas = [
  "personalize_payment",
  "confirm_availability",
  "value_trade"
];
```

---

### Step 3 – Trees & Departments

**Question:**
"Configure routing for each CTA"

**For each selected CTA:**

**Tree Configuration:**
- Dropdown showing tree IDs in UPPERCASE MONOSPACED font
- Trees sorted alphabetically
- Examples: "1000_V2_TEST_DRIVE", "3000_V2_TRADE_TRIM_DR"

**Department Configuration:**
- **Confirm Availability:** Shows ONLY custom department number input (no dropdown)
- **Other CTAs:**
  - Dropdown with standard departments auto-selected by default
  - Can be changed to custom department
  - Standard depts: 2844 (Test Drive), 2845 (E-Price), 3346 (Trade), 3347 (Credit)

**Deeplink Support:**
- Toggle for CTAs that support deeplinks (Personalize Payment, Confirm Availability, Value Trade)
- When enabled:
  - Tree/dept fields hide
  - Deeplink step dropdown appears (e.g., "credit", "payments", "trade")
- When disabled:
  - Tree/dept fields reappear
  - Auto re-renders properly

Wizard state example:

```js
state.ctaConfigs = {
  personalize_payment: {
    useDeeplink: true,
    deeplinkStep: "payments",
    tree: null,
    dept: null
  },
  value_trade: {
    useDeeplink: false,
    tree: "3000_V2_TRADE_TRIM_DR",
    dept: 3346
  },
  confirm_availability: {
    useDeeplink: false,
    tree: "2000_V2_DN_INVENTORY_VERIFY",
    dept: "custom",
    customDept: 1234
  }
};
```

---

### Step 4 – Styling Configuration

**Question:**
"Customize labels and style types for each CTA"

**For each selected CTA:**

**Label Configuration:**
- Dropdown with pre-defined label options
- "Custom" option that shows text input field (NOT a browser prompt)
- When pre-populated option selected, custom text box is disabled
- Live preview updates as labels change

**Style Type:**
- Dropdown with OEM-specific styles:
  - Primary (filled button with brand color)
  - Secondary (outline button)
- Live preview updates as style changes

Wizard state example:

```js
state.ctaConfigs = {
  personalize_payment: {
    label: "Personalize My Payment",
    customLabel: null,
    styleType: "primary"
  },
  value_trade: {
    label: "Custom Trade-In",
    customLabel: "Custom Trade-In",
    styleType: "secondary"
  }
};
```

---

### Step 5 – Advanced Styling (NEW STEP)

**Question:**
"Fine-tune spacing and border radius for each CTA"

**For each selected CTA:**

**Sliders with live preview:**
- Border-radius: 0-50px slider
- Margin-top: 0-50px slider
- Margin-bottom: 0-50px slider (default 7px max)
- Padding: 0-50px slider

**Features:**
- Slider values display current value
- Live preview updates in real-time as sliders move
- Default values come from OEM JSON

Wizard state example:

```js
state.ctaConfigs = {
  personalize_payment: {
    customStyles: {
      borderRadius: "8px",
      marginTop: "10px",
      marginBottom: "7px",
      padding: "12px"
    }
  }
};
```

---

### Step 6 – Placement Configuration

**Question:**
"Where should each CTA appear?"

**For each selected CTA:**

**Placement Checkboxes:**
- Show on SRP (Search Results Page)
- Show on VDP (Vehicle Details Page)
- Mobile Only
- Desktop Only

**Validation:**
- At least one placement must be checked

**Features:**
- Multiple can be checked simultaneously
- Placement affects wrapper divs in generated code

Wizard state example:

```js
state.ctaConfigs = {
  personalize_payment: {
    placement: {
      srp: true,
      vdp: true,
      mobileOnly: false,
      desktopOnly: false
    }
  }
};
```

---

### Step 7 – Preview & Export

**Preview:**
- Full-size preview of all CTAs with actual OEM styling
- Shows SRP/VDP sections based on placement
- Hover effects work in preview

**Generated Code:**
- Complete HTML/CSS in `<pre><code>` block
- Includes:
  - `<style>` block with base `.demo-cta` class
  - Individual style classes for each CTA
  - Hover styles
  - SRP/VDP wrapper divs (`cn-srp-only`, `cn-vdp-only`)
  - Mobile/Desktop wrapper divs if specified
  - Correct class names and attributes
  - For BuyNow: `cn-buynow-b1` class, `data-vin="{vin}"`
  - For deeplinked CTAs: `cn-buy-now` class, `drtstp` attribute
  - For regular CTAs: `onclick` handler with tree/dept

**Buttons:**
- Copy to Clipboard (shows success notification)

Example output:

```html
<style>
.demo-cta {
    display: block;
    text-align: center;
    text-decoration: none;
    cursor: pointer;
    border-style: solid;
}

.demo-cta-personalize_payment {
    background-color: #EB0A1E;
    color: #ffffff;
    border: 2px solid #EB0A1E;
    border-radius: 8px;
    padding: 12px;
    margin-top: 10px;
    margin-bottom: 7px;
    text-transform: uppercase;
}

.demo-cta-personalize_payment:hover {
    background-color: #ffffff;
    color: #EB0A1E;
}
</style>

<!-- SRP CTAs -->
<div class="cn-srp-only">
    <div>
        <a class="demo-cta demo-cta-personalize_payment cn-buynow-b1" data-vin="{vin}">Personalize My Payment</a>
    </div>
</div>
```

---

## 4. Internal OEM JSON Templates

38 OEM JSON files in `data/oems/` directory.

### Example JSON per OEM (`data/oems/toyota.json`)

```json
{
  "code": "toyota",
  "name": "Toyota",
  "brandColor": "#EB0A1E",
  "styles": {
    "primary": {
      "label": "Primary",
      "backgroundColor": "#EB0A1E",
      "textColor": "#ffffff",
      "hoverBackgroundColor": "#ffffff",
      "hoverTextColor": "#EB0A1E",
      "borderColor": "#EB0A1E",
      "borderRadius": "4px",
      "textTransform": "uppercase",
      "fontSize": "16px",
      "fontWeight": "bold",
      "padding": "11px",
      "marginTop": "6px",
      "marginBottom": "0px",
      "letterSpacing": "0.1em",
      "borderWidth": "2px",
      "transition": "all 0.3s ease"
    },
    "secondary": {
      "label": "Secondary",
      "backgroundColor": "transparent",
      "textColor": "#EB0A1E",
      "hoverBackgroundColor": "#EB0A1E",
      "hoverTextColor": "#ffffff",
      "borderColor": "#EB0A1E",
      "borderRadius": "4px",
      "textTransform": "uppercase",
      "fontSize": "16px",
      "fontWeight": "bold",
      "padding": "11px",
      "marginTop": "6px",
      "marginBottom": "0px",
      "letterSpacing": "0.1em",
      "borderWidth": "2px",
      "transition": "all 0.3s ease"
    }
  },
  "font": null
}
```

---

## 5. CTA Labels Configuration

Located in `data/cta-labels.json`.

```json
{
  "personalize_payment": {
    "default": "Personalize My Payment",
    "displayName": "Payments",
    "options": [
      "Personalize My Payment",
      "Buy Now",
      "Get Payments"
    ],
    "supportsDeeplink": true,
    "requiresTree": false,
    "deeplinkSteps": [
      { "id": "start", "label": "Start" },
      { "id": "credit", "label": "Credit" },
      { "id": "payments", "label": "Payments" },
      { "id": "trade", "label": "Trade" }
    ]
  },
  "confirm_availability": {
    "default": "Confirm Availability",
    "displayName": "Confirm",
    "options": [
      "Confirm Availability",
      "Check Availability",
      "Is This Available?"
    ],
    "supportsDeeplink": true,
    "requiresTree": true,
    "treeCategory": "inventory",
    "deeplinkSteps": [
      { "id": "payments", "label": "Payments" },
      { "id": "info", "label": "Info" }
    ]
  }
}
```

---

## 6. Trees Configuration

Located in `data/trees.json`.

```json
{
  "trees": [
    {
      "category": "testdrive",
      "options": [
        { "id": "1000_V2_TEST_DRIVE", "label": "Test Drive V2" }
      ]
    },
    {
      "category": "trade",
      "options": [
        { "id": "3000_V2_TRADE_TRIM_DR", "label": "Trade V2" }
      ]
    }
  ],
  "departments": [
    {
      "id": 2844,
      "label": "Test Drive (2844)",
      "category": "testdrive"
    },
    {
      "id": 3346,
      "label": "Trade (3346)",
      "category": "trade"
    },
    {
      "id": "custom",
      "label": "Custom Department Number",
      "category": "all"
    }
  ]
}
```

**Note:** Trees are displayed in UPPERCASE MONOSPACED font and sorted alphabetically.

---

## 7. Implementation (Actual Files)

Project structure:

```
cta_builder/
├── index.html              # Main wizard interface with 7 steps + live preview sidebar
├── styles/wizard.css       # CarNow-branded styles (dark blue/lime green theme)
├── src/
│   ├── state.js            # State management (AppState singleton)
│   ├── utils.js            # 30+ helper functions
│   ├── wizard.js           # Step navigation, rendering, UI updates
│   └── generator.js        # Code generation from state
├── data/
│   ├── oem-list.json       # List of 38 OEMs
│   ├── cta-labels.json     # CTA configurations with deeplink support
│   ├── trees.json          # Tree and department data
│   └── oems/               # 38 individual OEM JSON files
│       ├── toyota.json
│       ├── honda.json
│       └── ... (38 total)
├── README.md               # User documentation
├── TESTING.md              # Testing guide
└── .gitignore
```

---

## 8. Key Features & Improvements

### Live Preview Sidebar
- Sticky sidebar on right side of wizard
- Updates in real-time as user makes changes
- Shows CTAs with actual OEM styling
- Visible throughout all steps

### OEM Color Scheme Preview
- Step 1: Selecting OEM immediately updates preview with brand colors
- Preview shows sample buttons even before CTAs are selected

### Deeplink Toggle Fixes
- Toggle properly shows/hides tree/dept fields
- Re-renders step content on toggle
- Validates deeplink step selection

### Tree Display
- Tree IDs shown in UPPERCASE
- Monospaced font for better readability
- Sorted alphabetically

### Department Auto-Selection
- Standard departments pre-selected for relevant CTAs
- Can be changed via dropdown
- Confirm Availability: custom dept only

### Custom Label Text Input
- Shows text field when "Custom" selected (not a prompt)
- Disabled when pre-populated option selected
- Updates live preview immediately

### Advanced Styling Step
- NEW: Step 5 with sliders for border-radius, margins, padding
- Live preview updates as sliders move
- Default values from OEM JSON
- Fine-grained control over button appearance

### Placement Options
- SRP/VDP checkboxes
- NEW: Mobile Only and Desktop Only options
- Multiple can be selected
- Generates appropriate wrapper divs

### Progress Bar Styling
- Active step: Dark blue background with lime green glow
- Completed steps: Navy blue
- Upcoming steps: Gray
- Step labels: OEM, CTAs, Trees, Styling, Advanced, Placement, Preview

### Button Margins
- Default margin-bottom: 7px max
- Configurable via slider in Advanced Styling step

---

## 9. Code Generation Logic

The `generator.js` module creates production-ready code:

1. **CSS Generation:**
   - Base `.demo-cta` class
   - Individual classes for each CTA (e.g., `.demo-cta-personalize_payment`)
   - Hover states
   - Special rule to hide default BuyNow button when using deeplinks

2. **HTML Generation:**
   - SRP section with `cn-srp-only` wrapper
   - VDP section with `cn-vdp-only` wrapper
   - Mobile/Desktop wrappers if specified
   - Each CTA as `<a>` tag with:
     - Correct class names
     - `data-vin` for BuyNow
     - `drtstp` for deeplinks
     - `onclick` for regular CTAs with tree/dept

3. **Class Name Logic:**
   - BuyNow (no deeplink): `cn-buynow-b1`
   - BuyNow (deeplink): `cn-buy-now`
   - Deeplinked CTA: `cn-buy-now`
   - Regular CTA: `demo-cta demo-cta-{type}`

---

## 10. State Management

The `AppState` singleton manages all wizard state:

```js
{
  currentStep: 1,
  totalSteps: 7,
  data: {
    oem: "toyota",
    oemData: { ... },
    selectedCtas: ["personalize_payment", "value_trade"],
    ctaConfigs: {
      personalize_payment: {
        type: "personalize_payment",
        label: "Personalize My Payment",
        customLabel: null,
        useDeeplink: false,
        deeplinkStep: null,
        tree: null,
        dept: null,
        customDept: null,
        styleType: "primary",
        customStyles: {
          borderRadius: "4px",
          marginTop: "6px",
          marginBottom: "7px",
          padding: "11px"
        },
        placement: {
          srp: true,
          vdp: true,
          mobileOnly: false,
          desktopOnly: false
        }
      }
    }
  }
}
```

---

## 11. Validation Rules

- **Step 1:** OEM must be selected
- **Step 2:** At least one CTA must be selected
- **Step 3:**
  - CTAs with `requiresTree: true` must have tree and dept configured (unless using deeplink)
  - Deeplinked CTAs must have deeplink step selected
  - Custom dept must be filled when dept === "custom"
- **Step 4:** All CTAs must have a label and style type
- **Step 5:** All slider values must be within range (0-50px)
- **Step 6:** At least one placement must be selected per CTA
- **Step 7:** Always valid (preview/export step)

---

## 12. Browser Support

- Modern browsers with ES6 module support
- Chrome, Firefox, Safari, Edge (latest versions)
- No IE support
- Copy to clipboard requires HTTPS or localhost

---

## 13. Running the Application

1. Start local HTTP server:
   ```bash
   python -m http.server 8000
   ```

2. Open browser:
   ```
   http://localhost:8000
   ```

3. Follow the 7-step wizard

---

## 14. Git Repository

Initialized with `.gitignore` excluding:
- OS files (.DS_Store, Thumbs.db)
- Editor files (.vscode/, .idea/)
- Logs (*.log)
- Temp files (*.tmp, .cache/)

---

## 15. Future Enhancements (Out of Scope)

- Server-side code generation
- Data persistence
- Multi-language support
- A/B testing configurations
- Analytics integration
- Template saving/loading
