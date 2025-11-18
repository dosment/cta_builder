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

        // Update progress bar on window resize to maintain accuracy
        window.addEventListener('resize', () => {
            this.updateProgressBar(this.appState.currentStep);
        });
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
        const totalSteps = this.appState.totalSteps;
        const progressBar = document.querySelector('.progress-bar');
        const progressSteps = document.querySelectorAll('.progress-step');

        progressSteps.forEach((step, index) => {
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

        // Update the thick progress line width
        // Calculate the position to the center of the current step circle
        if (progressBar && progressSteps.length > 0) {
            // Get the position of the current step
            const currentStepElement = progressSteps[stepNumber - 1];
            if (currentStepElement) {
                const progressBarRect = progressBar.getBoundingClientRect();
                const stepNumberElement = currentStepElement.querySelector('.step-number');

                if (stepNumberElement) {
                    const stepNumberRect = stepNumberElement.getBoundingClientRect();

                    // Calculate the center of the step number circle relative to the progress bar
                    const stepCenterX = stepNumberRect.left + (stepNumberRect.width / 2) - progressBarRect.left;
                    const progressBarWidth = progressBarRect.width;
                    const progressPercent = (stepCenterX / progressBarWidth) * 100;

                    progressBar.style.setProperty('--progress-width', `${progressPercent}%`);
                }
            }
        }
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
            nextBtn.onclick = null;
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
