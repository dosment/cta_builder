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
├── index.html                          # Main HTML entry point
├── styles/
│   └── wizard.css                      # All application styling
├── src/                                # Core application logic
│   ├── state.js                        # State management singleton
│   ├── utils.js                        # DOM/utility helper functions
│   ├── wizard.js                       # Module entry point
│   ├── generator.js                    # Code generation engine
│   └── wizard/
│       ├── WizardOrchestrator.js       # Main orchestrator
│       ├── ValidationManager.js        # Step validation logic
│       ├── NavigationManager.js        # Navigation & progress bar
│       ├── PreviewManager.js           # Live preview rendering
│       ├── components/
│       │   ├── StyleSelector.js        # Style selection UI
│       │   ├── TreeFieldBuilder.js     # Tree/department configuration UI
│       │   └── TypographyControls.js   # Advanced styling controls
│       └── steps/                      # 7-step wizard implementations
│           ├── OemSelectionStep.js     # Step 1: OEM selection
│           ├── CtaSelectionStep.js     # Step 2: CTA selection
│           ├── TreeConfigurationStep.js # Step 3: Tree configuration
│           ├── StylingStep.js          # Step 4: Styling
│           ├── AdvancedStylingStep.js  # Step 5: Advanced styling
│           ├── PlacementStep.js        # Step 6: Placement
│           └── PreviewStep.js          # Step 7: Preview & code
└── data/                               # Configuration data
    ├── oem-list.json                   # 38+ OEM brands
    ├── cta-labels.json                 # CTA configurations
    ├── trees.json                      # Tree/department routing data
    └── oems/                           # Individual OEM style files
        ├── toyota.json, honda.json, etc. (40 files total)
```

## Architecture & Diagrams

### System Architecture

The application follows a **Manager-Step pattern** with clear separation of concerns:

```mermaid
graph TB
    subgraph "Entry Point"
        HTML[index.html]
        WizardJS[wizard.js]
    end

    subgraph "Core State"
        State[AppState<br/>Singleton]
    end

    subgraph "Orchestration Layer"
        Orch[WizardOrchestrator<br/>Main Coordinator]
    end

    subgraph "Managers"
        Val[ValidationManager<br/>Step Validation]
        Nav[NavigationManager<br/>Progress & Navigation]
        Prev[PreviewManager<br/>Live Preview]
    end

    subgraph "Step Handlers"
        S1[OemSelectionStep]
        S2[CtaSelectionStep]
        S3[TreeConfigurationStep]
        S4[StylingStep]
        S5[AdvancedStylingStep]
        S6[PlacementStep]
        S7[PreviewStep]
    end

    subgraph "Components"
        Style[StyleSelector]
        Tree[TreeFieldBuilder]
        Typo[TypographyControls]
    end

    subgraph "Code Generation"
        Gen[generator.js<br/>Code Engine]
    end

    subgraph "Data Layer"
        OEMList[oem-list.json]
        CTALabels[cta-labels.json]
        Trees[trees.json]
        OEMStyles[oems/*.json]
    end

    HTML --> WizardJS
    WizardJS --> Orch
    Orch --> State
    Orch --> Val
    Orch --> Nav
    Orch --> Prev
    Orch --> S1 & S2 & S3 & S4 & S5 & S6 & S7

    S4 --> Style
    S3 --> Tree
    S5 --> Typo

    State --> OEMList & CTALabels & Trees & OEMStyles
    S7 --> Gen
    Gen --> State

    style Orch fill:#ff9800
    style State fill:#2196f3
    style Gen fill:#4caf50
```

### Data Flow

This diagram shows how user input flows through the system to generate the final code:

```mermaid
flowchart TD
    Start([User Opens Wizard]) --> LoadData[Load JSON Data<br/>OEMs, CTAs, Trees, Styles]
    LoadData --> InitState[Initialize AppState]
    InitState --> Step1{Step 1:<br/>Select OEM}

    Step1 --> |OEM Selected| UpdatePreview1[Update Brand Colors<br/>in Preview]
    UpdatePreview1 --> Step2{Step 2:<br/>Select CTAs}

    Step2 --> |CTAs Chosen| Validate2{Validation<br/>Manager}
    Validate2 --> |Valid| Step3{Step 3:<br/>Configure Trees}
    Validate2 --> |Invalid| Error2[Show Error]
    Error2 --> Step2

    Step3 --> |Trees Configured| Validate3{Validation<br/>Manager}
    Validate3 --> |Valid| Step4{Step 4:<br/>Select Style}
    Validate3 --> |Invalid| Error3[Show Error]
    Error3 --> Step3

    Step4 --> |Style Selected| UpdatePreview4[Update Preview<br/>with Style]
    UpdatePreview4 --> Step5{Step 5:<br/>Advanced Styling}

    Step5 --> |Customizations| UpdatePreview5[Update Preview<br/>with Custom Styles]
    UpdatePreview5 --> Step6{Step 6:<br/>Set Placement}

    Step6 --> |Placement Set| Step7{Step 7:<br/>Preview & Generate}

    Step7 --> MergeData[Merge OEM Styles<br/>+ User Customizations]
    MergeData --> GenerateCSS[Generate CSS Code]
    GenerateCSS --> GenerateHTML[Generate HTML Markup]
    GenerateHTML --> DisplayCode[Display in Code Editor]
    DisplayCode --> Copy[User Copies Code]
    Copy --> End([Complete])

    style Step1 fill:#e3f2fd
    style Step2 fill:#e3f2fd
    style Step3 fill:#e3f2fd
    style Step4 fill:#e3f2fd
    style Step5 fill:#e3f2fd
    style Step6 fill:#e3f2fd
    style Step7 fill:#e3f2fd
    style GenerateCSS fill:#c8e6c9
    style GenerateHTML fill:#c8e6c9
```

### State Management Flow

```mermaid
stateDiagram-v2
    [*] --> Step1_OEM

    Step1_OEM --> Step2_CTA: OEM Selected
    Step2_CTA --> Step3_Trees: CTAs Selected & Valid
    Step3_Trees --> Step4_Styling: Trees Configured & Valid
    Step4_Styling --> Step5_Advanced: Style Selected
    Step5_Advanced --> Step6_Placement: Advanced Options Set
    Step6_Placement --> Step7_Preview: Placement Configured
    Step7_Preview --> [*]: Code Generated & Copied

    Step2_CTA --> Step1_OEM: Back
    Step3_Trees --> Step2_CTA: Back
    Step4_Styling --> Step3_Trees: Back
    Step5_Advanced --> Step4_Styling: Back
    Step6_Placement --> Step5_Advanced: Back
    Step7_Preview --> Step6_Placement: Back

    note right of Step1_OEM
        Loads OEM data
        Updates brand colors
    end note

    note right of Step2_CTA
        Validates at least 1 CTA selected
    end note

    note right of Step3_Trees
        Validates tree requirements
        for selected CTAs
    end note

    note right of Step7_Preview
        Runs generator.js
        Produces final HTML/CSS
    end note
```

### Component Interaction Sequence

This shows the typical interaction flow when a user navigates through the wizard:

```mermaid
sequenceDiagram
    actor User
    participant UI as Browser UI
    participant Nav as NavigationManager
    participant Val as ValidationManager
    participant State as AppState
    participant Step as Step Handler
    participant Prev as PreviewManager
    participant Gen as Generator

    User->>UI: Click "Next"
    UI->>Nav: handleNext()
    Nav->>Val: validateStep(currentStep)

    alt Step Invalid
        Val-->>Nav: false
        Nav->>UI: Show validation error
        UI-->>User: Display error message
    else Step Valid
        Val-->>Nav: true
        Nav->>State: moveToNextStep()
        State->>Nav: Current step updated
        Nav->>Step: render()
        Step->>UI: Display step content
        Step->>Prev: updatePreview()
        Prev->>State: getConfiguration()
        State-->>Prev: Current config
        Prev->>UI: Render preview
        UI-->>User: Show new step
    end

    User->>UI: Modify settings
    UI->>Step: handleChange(value)
    Step->>State: updateState(key, value)
    State->>Prev: trigger preview update
    Prev->>UI: Update preview sidebar
    UI-->>User: Live preview updates

    User->>UI: Reach Step 7
    UI->>Step: render()
    Step->>Gen: generateCode(state)
    Gen->>State: getFullConfiguration()
    State-->>Gen: Complete config
    Gen->>Gen: Merge styles + Generate CSS/HTML
    Gen-->>Step: Final code string
    Step->>UI: Display in code editor
    UI-->>User: Show generated code

    User->>UI: Click "Copy Code"
    UI->>UI: Copy to clipboard
    UI-->>User: Success notification
```

### Data Model Structure

```mermaid
erDiagram
    AppState ||--o{ OEM : "loads"
    AppState ||--o{ CTA : "configures"
    AppState ||--o{ Tree : "assigns"
    AppState ||--|| StyleConfig : "manages"
    AppState ||--|| PlacementConfig : "manages"

    OEM {
        string code
        string name
        string brandColor
        object styles
    }

    OEM ||--|{ StyleVariant : "contains"

    StyleVariant {
        string name
        object colors
        object typography
        object spacing
        object transitions
    }

    CTA {
        string type
        string label
        boolean deeplink
        string tree
        object options
    }

    CTA ||--o| Tree : "routes to"

    Tree {
        string category
        string value
        array departments
    }

    StyleConfig {
        string selectedStyle
        object customColors
        object borderRadius
        object margins
        object padding
        object typography
    }

    PlacementConfig {
        boolean srp
        boolean vdp
        boolean mobile
        boolean desktop
    }
```

## Technical Details

- **Framework:** Vanilla JavaScript ES6 modules
- **Architecture Pattern:** Manager-Step with singleton state management
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
