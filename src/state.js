/**
 * State Management Module
 * Manages application state for the CTA Builder wizard
 */

class AppState {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 7;
        this.data = {
            oem: null,              // Selected OEM code
            oemData: null,          // Full OEM data object
            selectedCtas: [],       // Array of selected CTA types
            ctaConfigs: {},         // Configuration for each CTA
            advancedStyles: this.createDefaultAdvancedStyles(),
            // Each CTA config structure:
            // {
            //   type: 'confirm_availability',
            //   label: 'Check Availability',
            //   customLabel: null,
            //   useDeeplink: false,
            //   deeplinkStep: null,
            //   tree: null,
            //   dept: null,
            //   customDept: null,
            //   styleType: 'primary',  // 'primary' or 'outline'
            //   placement: {
            //     srp: true,
            //     vdp: true,
            //     sameStyle: true      // If false, can have different styles for SRP/VDP
            //   }
            // }
        };
        this.loadedData = {
            oems: [],
            ctaLabels: null,
            trees: null
        };
    }

    createDefaultAdvancedStyles() {
        const createEmpty = () => ({
            fontFamily: null,
            fontSize: null,
            fontWeight: null,
            lineHeight: null,
            letterSpacing: null,
            borderRadius: null,
            marginTop: null,
            marginBottom: null,
            padding: null,
            textWrap: 'wrap'
        });

        return {
            srp: createEmpty(),
            vdp: createEmpty()
        };
    }

    /**
     * Navigate to a specific step
     */
    goToStep(stepNumber) {
        if (stepNumber >= 1 && stepNumber <= this.totalSteps) {
            this.currentStep = stepNumber;
            return true;
        }
        return false;
    }

    /**
     * Move to next step
     */
    nextStep() {
        if (this.currentStep < this.totalSteps) {
            this.currentStep++;
            return true;
        }
        return false;
    }

    /**
     * Move to previous step
     */
    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            return true;
        }
        return false;
    }

    /**
     * Set selected OEM
     */
    setOem(oemCode, oemData) {
        this.data.oem = oemCode;
        this.data.oemData = oemData;
        this.data.advancedStyles = this.createDefaultAdvancedStyles();
    }

    /**
     * Set selected CTAs
     */
    setSelectedCtas(ctaTypes) {
        this.data.selectedCtas = ctaTypes;

        // Initialize configs for newly selected CTAs
        ctaTypes.forEach(type => {
            if (!this.data.ctaConfigs[type]) {
                this.data.ctaConfigs[type] = this.createDefaultCtaConfig(type);
            }
        });

        // Remove configs for unselected CTAs
        Object.keys(this.data.ctaConfigs).forEach(type => {
            if (!ctaTypes.includes(type)) {
                delete this.data.ctaConfigs[type];
            }
        });
    }

    /**
     * Create default configuration for a CTA type
     */
    createDefaultCtaConfig(ctaType) {
        const ctaInfo = this.loadedData.ctaLabels[ctaType];

        // Confirm Availability always uses custom dept
        let defaultDept = null;
        let defaultCustomDept = null;

        if (ctaType === 'confirm_availability') {
            defaultDept = 'custom';
            defaultCustomDept = null;
        } else if (ctaInfo.standardDept) {
            // Other CTAs with standard dept use it as default
            defaultDept = ctaInfo.standardDept;
        }

        return {
            type: ctaType,
            label: ctaInfo.default,
            customLabel: null,
            useCustomLabel: false,
            useDeeplink: false,
            deeplinkStep: null,
            tree: null,
            useCustomTree: false,
            customTree: null,
            dept: defaultDept,
            customDept: defaultCustomDept,
            styleType: 'primary',
            placement: {
                srp: true,
                vdp: true,
                mobileOnly: false,
                desktopOnly: false,
                sameStyle: true
            }
        };
    }

    /**
     * Update CTA configuration
     */
    updateCtaConfig(ctaType, updates) {
        if (this.data.ctaConfigs[ctaType]) {
            this.data.ctaConfigs[ctaType] = {
                ...this.data.ctaConfigs[ctaType],
                ...updates
            };
        }
    }

    updateAdvancedStyles(placement, updates) {
        if (this.data.advancedStyles[placement]) {
            this.data.advancedStyles[placement] = {
                ...this.data.advancedStyles[placement],
                ...updates
            };
        }
    }

    /**
     * Get CTA configuration
     */
    getCtaConfig(ctaType) {
        return this.data.ctaConfigs[ctaType] || null;
    }

    /**
     * Get all CTA configurations
     */
    getAllCtaConfigs() {
        return this.data.ctaConfigs;
    }

    /**
     * Load OEMs list
     */
    async loadOems() {
        try {
            const response = await fetch('data/oem-list.json');
            const data = await response.json();
            this.loadedData.oems = data.oems;
            return this.loadedData.oems;
        } catch (error) {
            console.error('Error loading OEMs:', error);
            return [];
        }
    }

    /**
     * Load specific OEM data
     */
    async loadOemData(oemCode) {
        try {
            const response = await fetch(`data/oems/${oemCode}.json`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`Error loading OEM data for ${oemCode}:`, error);
            return null;
        }
    }

    /**
     * Load CTA labels configuration
     */
    async loadCtaLabels() {
        try {
            const response = await fetch('data/cta-labels.json');
            const data = await response.json();
            this.loadedData.ctaLabels = data;
            return data;
        } catch (error) {
            console.error('Error loading CTA labels:', error);
            return null;
        }
    }

    /**
     * Load trees configuration
     */
    async loadTrees() {
        try {
            const response = await fetch('data/trees.json');
            const data = await response.json();
            this.loadedData.trees = data;
            return data;
        } catch (error) {
            console.error('Error loading trees:', error);
            return null;
        }
    }

    /**
     * Get trees for a specific category (sorted alphabetically)
     */
    getTreesForCategory(category) {
        if (!this.loadedData.trees) return [];

        const treeCategory = this.loadedData.trees.trees.find(t => t.category === category);
        if (!treeCategory) return [];

        // Sort trees alphabetically by ID
        return [...treeCategory.options].sort((a, b) => a.id.localeCompare(b.id));
    }

    /**
     * Get departments for a specific category
     */
    getDepartmentsForCategory(category) {
        if (!this.loadedData.trees) return [];

        return this.loadedData.trees.departments.filter(
            d => d.category === category || d.category === 'all'
        );
    }

    /**
     * Validate current step
     */
    validateCurrentStep() {
        const errors = this.getValidationErrors();
        return errors.length === 0;
    }

    /**
     * Get detailed validation errors for current step
     */
    getValidationErrors() {
        const errors = [];

        switch (this.currentStep) {
            case 1: // OEM Selection
                if (!this.data.oem) {
                    errors.push({
                        field: 'oem-select',
                        message: 'Please select an OEM'
                    });
                }
                break;

            case 2: // CTA Selection
                if (this.data.selectedCtas.length === 0) {
                    errors.push({
                        field: 'cta-checkboxes',
                        message: 'Please select at least one CTA'
                    });
                }
                break;

            case 3: // Tree Configuration
                // Validate that CTAs requiring trees have them configured
                for (const ctaType of this.data.selectedCtas) {
                    const config = this.data.ctaConfigs[ctaType];
                    const ctaInfo = this.loadedData.ctaLabels[ctaType];

                    if (ctaInfo.requiresTree && !config.useDeeplink) {
                        // Must have tree selected
                        if (config.useCustomTree) {
                            if (!config.customTree || !config.customTree.trim()) {
                                errors.push({
                                    field: `custom-tree-${ctaType}`,
                                    message: `Enter a custom tree for ${ctaInfo.default}`
                                });
                            }
                        } else if (!config.tree) {
                            errors.push({
                                field: `tree-${ctaType}`,
                                message: `Select a tree for ${ctaInfo.default}`
                            });
                        }
                        // Must have dept (number) or custom dept filled
                        if (!config.dept || (config.dept === 'custom' && !config.customDept)) {
                            errors.push({
                                field: ctaType === 'confirm_availability' ? `custom-dept-${ctaType}` : `dept-${ctaType}`,
                                message: `Select a department for ${ctaInfo.default}`
                            });
                        }
                    }

                    // If using deeplink for a CTA that supports it, must have deeplink step
                    if (config.useDeeplink && ctaInfo.deeplinkSteps && ctaInfo.deeplinkSteps.length > 0) {
                        if (!config.deeplinkStep) {
                            errors.push({
                                field: `deeplink-step-${ctaType}`,
                                message: `Select a deeplink step for ${ctaInfo.default}`
                            });
                        }
                    }
                }
                break;

            case 4: // Styling
                // Basic validation - ensure all CTAs have a style type
                for (const ctaType of this.data.selectedCtas) {
                    const config = this.data.ctaConfigs[ctaType];
                    if (!config.styleType) {
                        errors.push({
                            field: `style-${ctaType}`,
                            message: 'Please select a style type'
                        });
                    }
                }
                break;

            case 5: // Advanced Styling
                // Validate that all slider values are within acceptable range (handled by HTML5 validation)
                break;

            case 6: // Placement
                // Ensure at least one placement is selected for each CTA
                for (const ctaType of this.data.selectedCtas) {
                    const placement = this.data.ctaConfigs[ctaType].placement;
                    if (!placement.srp && !placement.vdp) {
                        const ctaInfo = this.loadedData.ctaLabels[ctaType];
                        errors.push({
                            field: `srp-${ctaType}`,
                            message: `Select at least one page placement for ${ctaInfo.default}`
                        });
                    }
                }
                break;

            case 7: // Preview/Export
                break;
        }

        return errors;
    }

    /**
     * Reset state
     */
    reset() {
        this.currentStep = 1;
        this.data = {
            oem: null,
            oemData: null,
            selectedCtas: [],
            ctaConfigs: {},
            advancedStyles: this.createDefaultAdvancedStyles()
        };
    }

    /**
     * Export state as JSON (for debugging/saving)
     */
    exportState() {
        return JSON.stringify(this.data, null, 2);
    }

    /**
     * Import state from JSON (for debugging/loading)
     */
    importState(jsonString) {
        try {
            const importedData = JSON.parse(jsonString);
            this.data = importedData;
             if (!this.data.advancedStyles) {
                 this.data.advancedStyles = this.createDefaultAdvancedStyles();
             }
            return true;
        } catch (error) {
            console.error('Error importing state:', error);
            return false;
        }
    }
}

// Create singleton instance
const appState = new AppState();

// Export for use in other modules
export default appState;
