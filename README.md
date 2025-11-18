# CTA Builder

A front-end wizard tool for generating custom Call-to-Action (CTA) code for automotive dealership websites.

## Features

- 38+ OEM brand support with pre-configured styling
- 7-step wizard interface
- Support for multiple CTA types:
  - Personalize My Payment (BuyNow)
  - Confirm Availability
  - Value My Trade
  - Schedule Test Drive
  - Pre-Qualify
  - Get E-Price
  - Text Us
  - Chat Now
- Deeplink support for enhanced functionality
- Live preview sidebar with real-time updates
- OEM color scheme preview updates dynamically on Step 1
- Advanced styling controls (border-radius, margins, padding)
- Copy-to-clipboard code generation
- SRP/VDP/Mobile/Desktop placement configuration

## Getting Started

### Prerequisites

- Modern web browser (Chrome recommended)
- Local web server (Python, Node.js, or any HTTP server)

### Running the Application

1. Start a local web server in the project directory:

   **Using Python:**
   ```bash
   python -m http.server 8000
   ```

   **Using Node.js:**
   ```bash
   npx http-server -p 8000
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:8000
   ```

3. Follow the 7-step wizard:
   - **Step 1:** Select your OEM brand (live preview updates with brand colors)
   - **Step 2:** Choose which CTAs to include
   - **Step 3:** Configure trees and departments (with deeplink support)
   - **Step 4:** Customize styling and labels
   - **Step 5:** Advanced styling (border-radius, margins, padding)
   - **Step 6:** Set placement (SRP/VDP/Mobile/Desktop)
   - **Step 7:** Preview and copy generated code

## Project Structure

```
cta_builder/
├── index.html              # Main application page
├── styles/
│   └── wizard.css          # Application styles
├── src/
│   ├── state.js            # State management
│   ├── utils.js            # Utility functions
│   ├── wizard.js           # Wizard navigation & UI
│   └── generator.js        # Code generation logic
└── data/
    ├── oem-list.json       # List of all OEMs
    ├── cta-labels.json     # CTA configurations
    ├── trees.json          # Tree and department data
    └── oems/               # Individual OEM styling files
        ├── toyota.json
        ├── honda.json
        └── ... (38 total)
```

## Technical Details

- **Framework:** Vanilla JavaScript ES6 modules
- **Styling:** Custom CSS with OEM-specific branding
- **Data:** JSON-based configuration files
- **Browser Support:** Modern browsers with ES6 module support

## Output

The wizard generates copy-paste ready HTML/CSS code including:
- Complete CSS styles with OEM-specific branding
- HTML markup with proper class names
- SRP/VDP/Mobile/Desktop wrapper divs
- Appropriate onclick handlers or data attributes
- Deeplink configuration (when enabled)
- Custom border-radius, margins, and padding

## Notes

- All generated code is production-ready
- Supports both regular CTAs and deeplinked variants
- Includes hover states and transitions
- Live preview updates in real-time as you configure
- OEM color scheme applies to preview immediately upon selection
- Trees sorted alphabetically for easy selection
- Department defaults auto-selected (can be changed)
