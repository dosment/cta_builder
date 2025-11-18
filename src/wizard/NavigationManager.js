/**
 * NavigationManager
 * Handles wizard navigation, progress bar, and button state
 */

import * as utils from '../utils.js';

export class NavigationManager {
    constructor(appState, validationManager) {
        this.appState = appState;
        this.validationManager = validationManager;
        this.onStepChangeCallback = null;
    }

    /**
     * Set callback to be invoked when step changes
     */
    onStepChange(callback) {
        this.onStepChangeCallback = callback;
    }

    /**
     * Setup navigation event listeners
     */
    setupEventListeners() {
        // Previous button
        document.getElementById('prev-btn').addEventListener('click', () => this.handlePrev());

        // Next button is handled dynamically in updateNavigationButtons
    }

    /**
     * Handle Next button click
     */
    handleNext() {
        // Validate current step
        if (!this.validationManager.validateCurrentStep()) {
            return;
        }

        if (this.appState.nextStep()) {
            this.triggerStepChange(this.appState.currentStep);
        }
    }

    /**
     * Handle Previous button click
     */
    handlePrev() {
        if (this.appState.prevStep()) {
            this.triggerStepChange(this.appState.currentStep);
        }
    }

    /**
     * Trigger step change callback
     */
    triggerStepChange(stepNumber) {
        if (this.onStepChangeCallback) {
            this.onStepChangeCallback(stepNumber);
        }
    }

    /**
     * Update progress bar visual state
     */
    updateProgressBar(stepNumber) {
        document.querySelectorAll('.progress-step').forEach((step, index) => {
            const num = index + 1;
            if (num < stepNumber) {
                step.classList.add('completed');
                step.classList.remove('active');
            } else if (num === stepNumber) {
                step.classList.add('active');
                step.classList.remove('completed');
            } else {
                step.classList.remove('active', 'completed');
            }
        });
    }

    /**
     * Update navigation buttons based on current step
     */
    updateNavigationButtons(stepNumber, onRegenerateCode) {
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');

        // Previous button
        prevBtn.disabled = stepNumber === 1;

        // Next button text and functionality
        if (stepNumber === this.appState.totalSteps) {
            nextBtn.textContent = 'Save This Config';
            nextBtn.style.display = 'block';
            nextBtn.disabled = true;
            nextBtn.classList.add('btn-inactive');
            nextBtn.setAttribute('aria-disabled', 'true');

            // On final step, clicking regenerates code and scrolls to it
            nextBtn.onclick = () => {
                if (onRegenerateCode) {
                    onRegenerateCode();
                }
                const codeOutput = document.getElementById('generated-code');
                if (codeOutput) {
                    codeOutput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            };
        } else {
            nextBtn.textContent = 'Next';
            nextBtn.style.display = 'block';
            nextBtn.classList.remove('btn-inactive');
            nextBtn.removeAttribute('aria-disabled');
            nextBtn.onclick = () => this.handleNext();
        }
    }

    /**
     * Toggle preview sidebar visibility
     */
    togglePreviewSidebarVisibility(stepNumber) {
        const sidebar = document.getElementById('preview-sidebar');
        if (!sidebar) return;

        // Hide sidebar on step 7 (Preview & Export Code)
        if (stepNumber === 7) {
            sidebar.style.display = 'none';
        } else {
            sidebar.style.display = '';
        }
    }
}
