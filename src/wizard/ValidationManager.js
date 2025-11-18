/**
 * ValidationManager
 * Handles form validation and dynamic button state management
 */

import * as utils from '../utils.js';

export class ValidationManager {
    constructor(appState) {
        this.appState = appState;
    }

    /**
     * Setup validation watching to dynamically enable/disable Next button
     */
    setupValidationWatching(currentStep) {
        const currentStepElement = document.getElementById(`step-${currentStep}`);
        if (!currentStepElement) return;

        // Watch for changes on inputs, selects, and checkboxes
        const watchElements = currentStepElement.querySelectorAll('input, select, textarea');

        watchElements.forEach(element => {
            const eventType = element.type === 'checkbox' ? 'change' : 'input';

            element.addEventListener(eventType, () => {
                // Clear error for this field when user starts correcting
                if (element.id) {
                    utils.clearFieldError(element.id);
                }

                // Update Next button state based on validation
                this.updateNextButtonState();
            });
        });

        // Set initial button state
        this.updateNextButtonState();
    }

    /**
     * Update Next/Generate button state based on current validation
     */
    updateNextButtonState() {
        const nextBtn = document.getElementById('next-btn');
        const errors = this.appState.getValidationErrors();
        const isValid = errors.length === 0;

        const isFinalStep = this.appState.currentStep === this.appState.totalSteps;

        if (isFinalStep) {
            nextBtn.disabled = true;
            nextBtn.classList.add('btn-inactive');
            nextBtn.setAttribute('aria-disabled', 'true');
            return;
        }

        nextBtn.classList.remove('btn-inactive');
        nextBtn.removeAttribute('aria-disabled');

        // Always keep Next button enabled so users can click it to see errors
        nextBtn.disabled = false;
    }

    /**
     * Validate current step and show errors if any
     * @returns {boolean} True if valid, false otherwise
     */
    validateCurrentStep() {
        // Clear any previous field errors
        utils.clearAllFieldErrors();

        // Validate current step
        const errors = this.appState.getValidationErrors();
        if (errors.length > 0) {
            // Show field-level errors
            errors.forEach(error => {
                utils.showFieldError(error.field, error.message);
            });

            // Also show a notification
            utils.showNotification('Please complete all required fields', 'error');
            return false;
        }

        return true;
    }
}
