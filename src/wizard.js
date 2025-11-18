/**
 * Wizard Module - Entry Point
 * Main entry point for the CTA Builder Wizard
 * All logic has been modularized into separate components
 */

import { WizardOrchestrator } from './wizard/WizardOrchestrator.js';

// Initialize wizard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new WizardOrchestrator();
});
