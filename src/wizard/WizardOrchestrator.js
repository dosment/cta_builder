/**
 * WizardOrchestrator
 * Main wizard coordinator - orchestrates all managers and steps
 */

import appState from '../state.js';
import * as utils from '../utils.js';
import { ValidationManager } from './ValidationManager.js';
import { NavigationManager } from './NavigationManager.js';
import { PreviewManager } from './PreviewManager.js';
import { OemSelectionStep } from './steps/OemSelectionStep.js';
import { CtaSelectionStep } from './steps/CtaSelectionStep.js';
import { TreeConfigurationStep } from './steps/TreeConfigurationStep.js';
import { StylingStep } from './steps/StylingStep.js';
import { AdvancedStylingStep } from './steps/AdvancedStylingStep.js';
import { PlacementStep } from './steps/PlacementStep.js';
import { PreviewStep } from './steps/PreviewStep.js';

export class WizardOrchestrator {
    constructor() {
        // Initialize managers
        this.validationManager = new ValidationManager(appState);
        this.previewManager = new PreviewManager(appState);
        this.navigationManager = new NavigationManager(appState, this.validationManager);

        // Initialize step handlers
        this.steps = {
            1: new OemSelectionStep(appState, this.previewManager),
            2: new CtaSelectionStep(appState, this.previewManager),
            3: new TreeConfigurationStep(appState, this.validationManager),
            4: new StylingStep(appState, this.previewManager, this.validationManager),
            5: new AdvancedStylingStep(appState, this.previewManager),
            6: new PlacementStep(appState),
            7: new PreviewStep(appState, this.previewManager)
        };

        this.init();
    }

    async init() {
        // Load all required data
        await Promise.all([
            appState.loadOems(),
            appState.loadCtaLabels(),
            appState.loadTrees()
        ]);

        // Set up event listeners
        this.setupEventListeners();

        // Render initial step
        this.renderStep(1);
    }

    setupEventListeners() {
        // Navigation event listeners
        this.navigationManager.setupEventListeners();

        // Preview theme toggle
        this.previewManager.setupThemeToggle();

        // Register step change callback
        this.navigationManager.onStepChange((stepNumber) => {
            this.renderStep(stepNumber);
        });
    }

    renderStep(stepNumber) {
        // Clear any field errors from previous step
        utils.clearAllFieldErrors();

        // Update progress bar
        this.navigationManager.updateProgressBar(stepNumber);

        // Hide all steps
        document.querySelectorAll('.step').forEach(step => {
            utils.hideElement(step);
        });

        // Show current step
        const currentStepElement = document.getElementById(`step-${stepNumber}`);
        utils.showElement(currentStepElement);

        // Render step content
        const stepHandler = this.steps[stepNumber];
        if (stepHandler && stepHandler.render) {
            stepHandler.render();
        }

        // Update navigation buttons
        this.navigationManager.updateNavigationButtons(
            stepNumber,
            () => this.handleRegenerateCode()
        );

        // Set up validation watching for this step
        this.validationManager.setupValidationWatching(stepNumber);

        // Toggle preview sidebar visibility (hide on step 7)
        this.navigationManager.togglePreviewSidebarVisibility(stepNumber);

        // Update live preview
        this.previewManager.updateLivePreview();
    }

    /**
     * Handle regenerate code on final step
     */
    handleRegenerateCode() {
        const step7 = this.steps[7];
        if (step7 && step7.render) {
            step7.render();
        }
    }
}
