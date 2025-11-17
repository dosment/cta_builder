/**
 * Wizard Module
 * Handles step navigation and UI rendering
 */

import appState from './state.js';
import * as utils from './utils.js';
import { generateCode } from './generator.js';

class Wizard {
    constructor() {
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
        // Navigation buttons - only set up prev button here
        // Next button is handled dynamically in updateNavigationButtons
        document.getElementById('prev-btn').addEventListener('click', () => this.handlePrev());
    }

    handleNext() {
        // Clear any previous field errors
        utils.clearAllFieldErrors();

        // Validate current step
        const errors = appState.getValidationErrors();
        if (errors.length > 0) {
            // Show field-level errors
            errors.forEach(error => {
                utils.showFieldError(error.field, error.message);
            });

            // Also show a notification
            utils.showNotification('Please complete all required fields', 'error');
            return;
        }

        if (appState.nextStep()) {
            this.renderStep(appState.currentStep);
        }
    }

    handlePrev() {
        if (appState.prevStep()) {
            this.renderStep(appState.currentStep);
        }
    }

    renderStep(stepNumber) {
        // Clear any field errors from previous step
        utils.clearAllFieldErrors();

        // Update progress bar
        this.updateProgressBar(stepNumber);

        // Hide all steps
        document.querySelectorAll('.step').forEach(step => {
            utils.hideElement(step);
        });

        // Show current step
        const currentStepElement = document.getElementById(`step-${stepNumber}`);
        utils.showElement(currentStepElement);

        // Render step content
        switch (stepNumber) {
            case 1:
                this.renderOemSelection();
                break;
            case 2:
                this.renderCtaSelection();
                break;
            case 3:
                this.renderTreeConfiguration();
                break;
            case 4:
                this.renderStylingConfiguration();
                break;
            case 5:
                this.renderAdvancedStylingConfiguration();
                break;
            case 6:
                this.renderPlacementConfiguration();
                break;
            case 7:
                this.renderPreview();
                break;
        }

        // Update navigation buttons
        this.updateNavigationButtons(stepNumber);

        // Set up validation watching for this step
        this.setupValidationWatching();

        // Update live preview
        this.updateLivePreview();
    }

    /**
     * Setup validation watching to dynamically enable/disable Next button
     */
    setupValidationWatching() {
        const nextBtn = document.getElementById('next-btn');
        const currentStep = document.getElementById(`step-${appState.currentStep}`);

        if (!currentStep) return;

        // Watch for changes on inputs, selects, and checkboxes
        const watchElements = currentStep.querySelectorAll('input, select, textarea');

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
        const isValid = appState.validateCurrentStep();

        if (appState.currentStep === appState.totalSteps) {
            // On final step, it's "Generate Code"
            nextBtn.disabled = !isValid;
        } else {
            // On other steps, it's "Next"
            nextBtn.disabled = !isValid;
        }
    }

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

    updateNavigationButtons(stepNumber) {
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');

        // Previous button
        prevBtn.disabled = stepNumber === 1;

        // Next button text and functionality
        if (stepNumber === appState.totalSteps) {
            nextBtn.textContent = 'Generate Code';
            nextBtn.style.display = 'block';
            // On final step, clicking regenerates code and scrolls to it
            nextBtn.onclick = () => {
                this.renderPreview();
                const codeOutput = document.getElementById('generated-code');
                if (codeOutput) {
                    codeOutput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            };
        } else {
            nextBtn.textContent = 'Next';
            nextBtn.style.display = 'block';
            nextBtn.onclick = () => this.handleNext();
        }

        // Disabled state is managed by updateNextButtonState
    }

    // Step 1: OEM Selection
    renderOemSelection() {
        const select = document.getElementById('oem-select');

        // Mark as required
        select.required = true;

        // Clear existing options (except first)
        while (select.options.length > 1) {
            select.remove(1);
        }

        // Populate OEM options
        appState.loadedData.oems.forEach(oem => {
            const option = document.createElement('option');
            option.value = oem.code;
            option.textContent = oem.name;
            if (appState.data.oem === oem.code) {
                option.selected = true;
            }
            select.appendChild(option);
        });

        // Event listener
        select.onchange = async (e) => {
            const oemCode = e.target.value;
            if (oemCode) {
                const oemData = await appState.loadOemData(oemCode);
                appState.setOem(oemCode, oemData);
                // Clear validation error if present
                utils.clearFieldError('oem-select');
                // Update live preview immediately with OEM colors
                this.updateLivePreview();
            } else {
                appState.setOem(null, null);
                this.updateLivePreview();
            }
        };
    }

    // Step 2: CTA Selection
    renderCtaSelection() {
        const container = document.getElementById('cta-checkboxes');
        utils.clearElement(container);

        const ctaLabels = appState.loadedData.ctaLabels;

        Object.keys(ctaLabels).forEach(ctaType => {
            const ctaInfo = ctaLabels[ctaType];
            const isChecked = appState.data.selectedCtas.includes(ctaType);

            const checkboxItem = utils.createElement('div', { className: 'checkbox-item' });

            const checkbox = utils.createElement('input', {
                type: 'checkbox',
                id: `cta-${ctaType}`,
                value: ctaType,
                checked: isChecked
            });

            const label = utils.createElement('label', {
                for: `cta-${ctaType}`
            }, ctaInfo.displayName || ctaInfo.default);

            checkbox.onchange = () => this.handleCtaSelectionChange();

            checkboxItem.appendChild(checkbox);
            checkboxItem.appendChild(label);
            container.appendChild(checkboxItem);
        });
    }

    handleCtaSelectionChange() {
        const checkboxes = document.querySelectorAll('#cta-checkboxes input[type="checkbox"]');
        const selectedCtas = Array.from(checkboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);

        appState.setSelectedCtas(selectedCtas);

        // Clear validation error if at least one CTA is selected
        if (selectedCtas.length > 0) {
            utils.clearFieldError('cta-checkboxes');
        }

        this.updateLivePreview();
    }

    // Step 3: Tree & Department Configuration
    renderTreeConfiguration() {
        const container = document.getElementById('tree-config-list');
        utils.clearElement(container);

        const ctaLabels = appState.loadedData.ctaLabels;

        appState.data.selectedCtas.forEach(ctaType => {
            const config = appState.getCtaConfig(ctaType);
            const ctaInfo = ctaLabels[ctaType];

            const configItem = utils.createElement('div', { className: 'config-item' });
            const heading = utils.createElement('h3', {}, ctaInfo.default);
            configItem.appendChild(heading);

            // Check if CTA supports deeplink
            if (ctaInfo.supportsDeeplink) {
                const deeplinkToggle = this.createDeeplinkToggle(ctaType, config, ctaInfo);
                configItem.appendChild(deeplinkToggle);
            }

            // Tree and department fields (only if requires tree and not using deeplink)
            if (ctaInfo.requiresTree && !config.useDeeplink) {
                const treeFields = this.createTreeFields(ctaType, config, ctaInfo);
                configItem.appendChild(treeFields);
            }

            // Deeplink step selector (if using deeplink)
            if (config.useDeeplink && ctaInfo.deeplinkSteps) {
                const deeplinkFields = this.createDeeplinkFields(ctaType, config, ctaInfo);
                configItem.appendChild(deeplinkFields);
            }

            // Note for CTAs that don't require configuration
            if (!ctaInfo.requiresTree && !ctaInfo.supportsDeeplink) {
                const note = utils.createElement('p', { className: 'text-muted' },
                    'This CTA does not require tree or department configuration.');
                configItem.appendChild(note);
            }

            container.appendChild(configItem);
        });
    }

    createDeeplinkToggle(ctaType, config, ctaInfo) {
        const row = utils.createElement('div', { className: 'config-row' });

        const toggleField = utils.createElement('div', { className: 'config-field' });
        const toggleLabel = utils.createElement('label', {}, 'Use Deeplink:');

        const toggleSwitch = utils.createElement('div', { className: 'toggle-switch' });
        const checkbox = utils.createElement('input', {
            type: 'checkbox',
            id: `deeplink-${ctaType}`,
            checked: config.useDeeplink
        });

        const toggleText = utils.createElement('span', {
            className: 'toggle-text',
            id: `deeplink-text-${ctaType}`
        }, config.useDeeplink ? 'Enabled' : 'Disabled');

        checkbox.onchange = (e) => {
            const isEnabled = e.target.checked;
            appState.updateCtaConfig(ctaType, { useDeeplink: isEnabled });

            // Update toggle text
            toggleText.textContent = isEnabled ? 'Enabled' : 'Disabled';

            // Re-render to show/hide fields
            this.renderTreeConfiguration();
        };

        toggleSwitch.appendChild(checkbox);
        toggleSwitch.appendChild(toggleText);
        toggleField.appendChild(toggleLabel);
        toggleField.appendChild(toggleSwitch);
        row.appendChild(toggleField);

        return row;
    }

    createTreeFields(ctaType, config, ctaInfo) {
        const row = utils.createElement('div', { className: 'config-row' });

        // Tree selector
        const treeField = utils.createElement('div', { className: 'config-field' });
        const treeLabel = utils.createElement('label', {}, 'Tree: ');
        const requiredMark = utils.createElement('span', {
            className: 'text-danger',
            style: 'font-weight: bold;'
        }, '*');
        treeLabel.appendChild(requiredMark);

        const treeSelect = utils.createElement('select', {
            id: `tree-${ctaType}`,
            required: true
        });

        const defaultOption = utils.createElement('option', { value: '' }, '-- Select Tree --');
        treeSelect.appendChild(defaultOption);

        const trees = appState.getTreesForCategory(ctaInfo.treeCategory);
        trees.forEach(tree => {
            const option = utils.createElement('option', {
                value: tree.id,
                selected: config.tree === tree.id
            }, tree.id);
            treeSelect.appendChild(option);
        });

        treeSelect.onchange = (e) => {
            appState.updateCtaConfig(ctaType, { tree: e.target.value });
            // Clear validation error
            utils.clearFieldError(`tree-${ctaType}`);
        };

        treeField.appendChild(treeLabel);
        treeField.appendChild(treeSelect);
        row.appendChild(treeField);

        // Department configuration - Confirm Availability is special (custom only)
        if (ctaType === 'confirm_availability') {
            // Only show custom dept input for Confirm Availability
            const customDeptField = utils.createElement('div', { className: 'config-field' });
            const customDeptLabel = utils.createElement('label', {}, 'Custom Dept #: ');
            const requiredMark = utils.createElement('span', {
                className: 'text-danger',
                style: 'font-weight: bold;'
            }, '*');
            customDeptLabel.appendChild(requiredMark);

            const customDeptInput = utils.createElement('input', {
                type: 'number',
                id: `custom-dept-${ctaType}`,
                value: config.customDept || '',
                placeholder: 'Enter department number',
                required: true
            });

            customDeptInput.oninput = (e) => {
                appState.updateCtaConfig(ctaType, { dept: 'custom', customDept: parseInt(e.target.value) });
                utils.clearFieldError(`custom-dept-${ctaType}`);
            };

            customDeptField.appendChild(customDeptLabel);
            customDeptField.appendChild(customDeptInput);
            row.appendChild(customDeptField);
        } else {
            // Regular department selector for other CTAs
            const deptField = utils.createElement('div', { className: 'config-field' });
            const deptLabel = utils.createElement('label', {}, 'Department: ');
            const requiredMark = utils.createElement('span', {
                className: 'text-danger',
                style: 'font-weight: bold;'
            }, '*');
            deptLabel.appendChild(requiredMark);

            const deptSelect = utils.createElement('select', {
                id: `dept-${ctaType}`,
                required: true
            });

            const deptDefaultOption = utils.createElement('option', { value: '' }, '-- Select Department --');
            deptSelect.appendChild(deptDefaultOption);

            const departments = appState.getDepartmentsForCategory(ctaInfo.treeCategory);
            departments.forEach(dept => {
                const deptValue = dept.id === 'custom' ? 'custom' : dept.id;
                const option = utils.createElement('option', {
                    value: deptValue,
                    selected: config.dept === deptValue
                }, dept.label);
                deptSelect.appendChild(option);
            });

            deptSelect.onchange = (e) => {
                const value = e.target.value;
                utils.clearFieldError(`dept-${ctaType}`);
                if (value === 'custom') {
                    appState.updateCtaConfig(ctaType, { dept: 'custom' });
                    this.renderTreeConfiguration(); // Re-render to show custom input
                } else {
                    appState.updateCtaConfig(ctaType, { dept: parseInt(value), customDept: null });
                }
            };

            deptField.appendChild(deptLabel);
            deptField.appendChild(deptSelect);
            row.appendChild(deptField);

            // Custom department input (if custom is selected)
            if (config.dept === 'custom') {
                const customDeptField = utils.createElement('div', { className: 'config-field' });
                const customDeptLabel = utils.createElement('label', {}, 'Custom Dept #: ');
                const requiredMark = utils.createElement('span', {
                    className: 'text-danger',
                    style: 'font-weight: bold;'
                }, '*');
                customDeptLabel.appendChild(requiredMark);

                const customDeptInput = utils.createElement('input', {
                    type: 'number',
                    id: `custom-dept-${ctaType}`,
                    value: config.customDept || '',
                    placeholder: 'Enter department number',
                    required: true
                });

                customDeptInput.oninput = (e) => {
                    appState.updateCtaConfig(ctaType, { customDept: parseInt(e.target.value) });
                    utils.clearFieldError(`custom-dept-${ctaType}`);
                };

                customDeptField.appendChild(customDeptLabel);
                customDeptField.appendChild(customDeptInput);
                row.appendChild(customDeptField);
            }
        }

        return row;
    }

    createDeeplinkFields(ctaType, config, ctaInfo) {
        const row = utils.createElement('div', { className: 'config-row' });

        const stepField = utils.createElement('div', { className: 'config-field' });
        const stepLabel = utils.createElement('label', {}, 'Deeplink Step:');
        const stepSelect = utils.createElement('select', { id: `deeplink-step-${ctaType}` });

        const defaultOption = utils.createElement('option', { value: '' }, '-- Select Step --');
        stepSelect.appendChild(defaultOption);

        ctaInfo.deeplinkSteps.forEach(step => {
            const option = utils.createElement('option', {
                value: step.id,
                selected: config.deeplinkStep === step.id
            }, step.label);
            stepSelect.appendChild(option);
        });

        stepSelect.onchange = (e) => {
            appState.updateCtaConfig(ctaType, { deeplinkStep: e.target.value });
        };

        stepField.appendChild(stepLabel);
        stepField.appendChild(stepSelect);
        row.appendChild(stepField);

        return row;
    }

    // Step 4: Styling Configuration
    renderStylingConfiguration() {
        const container = document.getElementById('styling-config-list');
        utils.clearElement(container);

        const ctaLabels = appState.loadedData.ctaLabels;

        appState.data.selectedCtas.forEach(ctaType => {
            const config = appState.getCtaConfig(ctaType);
            const ctaInfo = ctaLabels[ctaType];

            const configItem = utils.createElement('div', { className: 'config-item' });
            const heading = utils.createElement('h3', {}, ctaInfo.default);
            configItem.appendChild(heading);

            // Label selection
            const labelRow = this.createLabelSelection(ctaType, config, ctaInfo);
            configItem.appendChild(labelRow);

            // Style type selection
            const styleRow = this.createStyleSelection(ctaType, config);
            configItem.appendChild(styleRow);

            container.appendChild(configItem);
        });
    }

    createLabelSelection(ctaType, config, ctaInfo) {
        const row = utils.createElement('div', { className: 'config-row' });

        const labelField = utils.createElement('div', { className: 'config-field' });
        const labelLabel = utils.createElement('label', {}, 'Button Label:');
        const labelSelect = utils.createElement('select', { id: `label-${ctaType}` });

        ctaInfo.options.forEach(option => {
            const optElement = utils.createElement('option', {
                value: option,
                selected: (config.customLabel || config.label) === option
            }, option);
            labelSelect.appendChild(optElement);
        });

        // Custom option
        const isCustom = config.customLabel && !ctaInfo.options.includes(config.customLabel);
        const customOption = utils.createElement('option', {
            value: '__custom__',
            selected: isCustom
        }, 'Custom');
        labelSelect.appendChild(customOption);

        labelSelect.onchange = (e) => {
            if (e.target.value === '__custom__') {
                appState.updateCtaConfig(ctaType, { customLabel: config.label });
                this.renderStylingConfiguration();
            } else {
                appState.updateCtaConfig(ctaType, { customLabel: null, label: e.target.value });
                this.updateLivePreview(); // Update preview when label changes
            }
        };

        labelField.appendChild(labelLabel);
        labelField.appendChild(labelSelect);
        row.appendChild(labelField);

        // Only show custom text input if "Custom" is selected
        if (labelSelect.value === '__custom__') {
            const customLabelField = utils.createElement('div', { className: 'config-field' });
            const customLabelLabel = utils.createElement('label', {}, 'Custom Label Text:');
            const customLabelInput = utils.createElement('input', {
                type: 'text',
                id: `custom-label-${ctaType}`,
                value: config.customLabel || '',
                placeholder: 'Enter button text'
            });

            customLabelInput.oninput = (e) => {
                appState.updateCtaConfig(ctaType, { customLabel: e.target.value });
                this.updateLivePreview(); // Update preview as user types
            };

            customLabelField.appendChild(customLabelLabel);
            customLabelField.appendChild(customLabelInput);
            row.appendChild(customLabelField);
        }

        return row;
    }

    createStyleSelection(ctaType, config) {
        const row = utils.createElement('div', { className: 'config-row' });

        const styleField = utils.createElement('div', { className: 'config-field' });
        const styleLabel = utils.createElement('label', {}, 'Style Type:');
        const styleSelect = utils.createElement('select', { id: `style-${ctaType}` });

        const oemData = appState.data.oemData;
        if (oemData && oemData.styles) {
            Object.keys(oemData.styles).forEach(styleKey => {
                const styleInfo = oemData.styles[styleKey];
                const option = utils.createElement('option', {
                    value: styleKey,
                    selected: config.styleType === styleKey
                }, styleInfo.label);
                styleSelect.appendChild(option);
            });
        }

        styleSelect.onchange = (e) => {
            appState.updateCtaConfig(ctaType, { styleType: e.target.value });
            this.updateLivePreview(); // Update preview when style changes
        };

        styleField.appendChild(styleLabel);
        styleField.appendChild(styleSelect);
        row.appendChild(styleField);

        return row;
    }

    // Step 5: Advanced Styling Configuration
    renderAdvancedStylingConfiguration() {
        const container = document.getElementById('advanced-styling-config-list');
        utils.clearElement(container);

        const ctaLabels = appState.loadedData.ctaLabels;

        appState.data.selectedCtas.forEach(ctaType => {
            const config = appState.getCtaConfig(ctaType);
            const ctaInfo = ctaLabels[ctaType];
            const oemStyles = appState.data.oemData.styles[config.styleType];

            const configItem = utils.createElement('div', { className: 'config-item' });
            const heading = utils.createElement('h3', {}, ctaInfo.default);
            configItem.appendChild(heading);

            // Border Radius Slider
            const borderRadiusRow = this.createSlider(
                ctaType,
                'borderRadius',
                'Border Radius (px)',
                0,
                50,
                parseInt(config.customStyles.borderRadius) || parseInt(oemStyles.borderRadius) || 4
            );
            configItem.appendChild(borderRadiusRow);

            // Margin Top Slider
            const marginTopRow = this.createSlider(
                ctaType,
                'marginTop',
                'Margin Top (px)',
                0,
                50,
                parseInt(config.customStyles.marginTop) || parseInt(oemStyles.marginTop) || 6
            );
            configItem.appendChild(marginTopRow);

            // Margin Bottom Slider
            const marginBottomRow = this.createSlider(
                ctaType,
                'marginBottom',
                'Margin Bottom (px)',
                0,
                50,
                parseInt(config.customStyles.marginBottom) || 7
            );
            configItem.appendChild(marginBottomRow);

            // Padding Slider
            const paddingRow = this.createSlider(
                ctaType,
                'padding',
                'Padding (px)',
                0,
                50,
                parseInt(config.customStyles.padding) || parseInt(oemStyles.padding) || 11
            );
            configItem.appendChild(paddingRow);

            container.appendChild(configItem);
        });
    }

    createSlider(ctaType, property, label, min, max, defaultValue) {
        const row = utils.createElement('div', { className: 'config-row' });

        const sliderField = utils.createElement('div', { className: 'config-field' });
        const sliderLabel = utils.createElement('label', {}, `${label}:`);

        const sliderContainer = utils.createElement('div', { className: 'slider-container' });

        const slider = utils.createElement('input', {
            type: 'range',
            id: `${property}-${ctaType}`,
            min: min,
            max: max,
            value: defaultValue
        });

        const valueDisplay = utils.createElement('span', {
            className: 'slider-value',
            id: `${property}-value-${ctaType}`
        }, `${defaultValue}px`);

        slider.oninput = (e) => {
            const value = e.target.value;
            valueDisplay.textContent = `${value}px`;

            // Update state with the new value
            const customStyles = { ...appState.getCtaConfig(ctaType).customStyles };
            customStyles[property] = `${value}px`;
            appState.updateCtaConfig(ctaType, { customStyles });

            // Update live preview
            this.updateLivePreview();
        };

        sliderContainer.appendChild(slider);
        sliderContainer.appendChild(valueDisplay);
        sliderField.appendChild(sliderLabel);
        sliderField.appendChild(sliderContainer);
        row.appendChild(sliderField);

        return row;
    }

    // Step 6: Placement Configuration
    renderPlacementConfiguration() {
        const container = document.getElementById('placement-config-list');
        utils.clearElement(container);

        const ctaLabels = appState.loadedData.ctaLabels;

        appState.data.selectedCtas.forEach(ctaType => {
            const config = appState.getCtaConfig(ctaType);
            const ctaInfo = ctaLabels[ctaType];

            const configItem = utils.createElement('div', { className: 'config-item' });
            const heading = utils.createElement('h3', {}, ctaInfo.default);
            configItem.appendChild(heading);

            // Placement checkboxes
            const placementRow = this.createPlacementCheckboxes(ctaType, config);
            configItem.appendChild(placementRow);

            container.appendChild(configItem);
        });
    }

    createPlacementCheckboxes(ctaType, config) {
        const container = utils.createElement('div', { className: 'placement-container' });

        // Page placement checkboxes (SRP/VDP)
        const pageRow = utils.createElement('div', { className: 'config-row' });
        const pageLabel = utils.createElement('label', {
            style: 'display: block; margin-bottom: 8px; font-weight: 500;'
        }, 'Show on:');
        pageRow.appendChild(pageLabel);

        // SRP checkbox
        const srpField = utils.createElement('div', { className: 'checkbox-item' });
        const srpCheckbox = utils.createElement('input', {
            type: 'checkbox',
            id: `srp-${ctaType}`,
            checked: config.placement.srp
        });
        const srpLabel = utils.createElement('label', { for: `srp-${ctaType}` }, 'SRP');

        srpCheckbox.onchange = (e) => {
            const newPlacement = { ...config.placement, srp: e.target.checked };
            appState.updateCtaConfig(ctaType, {
                placement: newPlacement
            });
            // Clear validation error if at least one placement is selected
            if (newPlacement.srp || newPlacement.vdp) {
                utils.clearFieldError(`srp-${ctaType}`);
            }
        };

        srpField.appendChild(srpCheckbox);
        srpField.appendChild(srpLabel);
        pageRow.appendChild(srpField);

        // VDP checkbox
        const vdpField = utils.createElement('div', { className: 'checkbox-item' });
        const vdpCheckbox = utils.createElement('input', {
            type: 'checkbox',
            id: `vdp-${ctaType}`,
            checked: config.placement.vdp
        });
        const vdpLabel = utils.createElement('label', { for: `vdp-${ctaType}` }, 'VDP');

        vdpCheckbox.onchange = (e) => {
            const newPlacement = { ...config.placement, vdp: e.target.checked };
            appState.updateCtaConfig(ctaType, {
                placement: newPlacement
            });
            // Clear validation error if at least one placement is selected
            if (newPlacement.srp || newPlacement.vdp) {
                utils.clearFieldError(`srp-${ctaType}`);
            }
        };

        vdpField.appendChild(vdpCheckbox);
        vdpField.appendChild(vdpLabel);
        pageRow.appendChild(vdpField);

        container.appendChild(pageRow);

        // Device targeting dropdown
        const deviceRow = utils.createElement('div', { className: 'config-row', style: 'margin-top: 12px;' });
        const deviceField = utils.createElement('div', { className: 'config-field' });
        const deviceLabel = utils.createElement('label', {}, 'Device Targeting:');
        const deviceSelect = utils.createElement('select', { id: `device-${ctaType}` });

        // Determine current device setting
        let currentDeviceValue = 'all';
        if (config.placement.mobileOnly) {
            currentDeviceValue = 'mobile';
        } else if (config.placement.desktopOnly) {
            currentDeviceValue = 'desktop';
        }

        const deviceOptions = [
            { value: 'all', label: 'All devices' },
            { value: 'mobile', label: 'Mobile only' },
            { value: 'desktop', label: 'Desktop only' }
        ];

        deviceOptions.forEach(opt => {
            const option = utils.createElement('option', {
                value: opt.value,
                selected: currentDeviceValue === opt.value
            }, opt.label);
            deviceSelect.appendChild(option);
        });

        deviceSelect.onchange = (e) => {
            const value = e.target.value;
            appState.updateCtaConfig(ctaType, {
                placement: {
                    ...config.placement,
                    mobileOnly: value === 'mobile',
                    desktopOnly: value === 'desktop'
                }
            });
        };

        deviceField.appendChild(deviceLabel);
        deviceField.appendChild(deviceSelect);
        deviceRow.appendChild(deviceField);
        container.appendChild(deviceRow);

        return container;
    }

    // Step 6: Preview & Export
    renderPreview() {
        const previewArea = document.getElementById('preview-area');
        const codeOutput = document.getElementById('generated-code');

        // Generate preview
        utils.clearElement(previewArea);
        this.renderPreviewCtas(previewArea);

        // Generate code
        const generatedCode = generateCode(appState.data, appState.loadedData);
        codeOutput.querySelector('code').textContent = generatedCode;

        // Copy button
        const copyBtn = document.getElementById('copy-code-btn');
        copyBtn.onclick = async () => {
            const success = await utils.copyToClipboard(generatedCode);
            if (success) {
                utils.showNotification('Code copied to clipboard!', 'success');
            } else {
                utils.showNotification('Failed to copy code', 'error');
            }
        };
    }

    renderPreviewCtas(container) {
        const oemData = appState.data.oemData;

        appState.data.selectedCtas.forEach(ctaType => {
            const config = appState.getCtaConfig(ctaType);
            const styles = oemData.styles[config.styleType];
            const customStyles = config.customStyles || {};

            const button = utils.createElement('a', {
                className: 'demo-cta',
                href: '#',
                style: `
                    display: block;
                    text-align: center;
                    background-color: ${styles.backgroundColor};
                    color: ${styles.textColor};
                    border: ${styles.borderWidth} solid ${styles.borderColor};
                    border-radius: ${customStyles.borderRadius || styles.borderRadius};
                    text-transform: ${styles.textTransform};
                    font-size: ${styles.fontSize};
                    font-weight: ${styles.fontWeight};
                    padding: ${customStyles.padding || styles.padding};
                    margin-top: ${customStyles.marginTop || styles.marginTop};
                    margin-bottom: ${customStyles.marginBottom || styles.marginBottom};
                    letter-spacing: ${styles.letterSpacing};
                    transition: ${styles.transition};
                    text-decoration: none;
                    cursor: pointer;
                `
            }, config.customLabel || config.label);

            // Hover effects
            button.onmouseenter = () => {
                button.style.backgroundColor = styles.hoverBackgroundColor;
                button.style.color = styles.hoverTextColor;
            };
            button.onmouseleave = () => {
                button.style.backgroundColor = styles.backgroundColor;
                button.style.color = styles.textColor;
            };

            container.appendChild(button);
        });
    }

    // Update Live Preview Sidebar
    updateLivePreview() {
        const livePreviewArea = document.getElementById('live-preview-area');

        // If no OEM selected, show placeholder
        if (!appState.data.oemData) {
            livePreviewArea.innerHTML = '<p class="text-muted">Select an OEM to see preview</p>';
            return;
        }

        // If OEM selected but no CTAs, show sample button with OEM colors
        if (appState.data.selectedCtas.length === 0) {
            utils.clearElement(livePreviewArea);
            const oemData = appState.data.oemData;
            const styles = oemData.styles.primary;

            const sampleButton = utils.createElement('a', {
                className: 'demo-cta',
                href: '#',
                style: `
                    display: block;
                    text-align: center;
                    background-color: ${styles.backgroundColor};
                    color: ${styles.textColor};
                    border: ${styles.borderWidth} solid ${styles.borderColor};
                    border-radius: ${styles.borderRadius};
                    text-transform: ${styles.textTransform};
                    font-size: ${styles.fontSize};
                    font-weight: ${styles.fontWeight};
                    padding: ${styles.padding};
                    margin-top: ${styles.marginTop};
                    margin-bottom: ${styles.marginBottom};
                    letter-spacing: ${styles.letterSpacing};
                    transition: ${styles.transition};
                    text-decoration: none;
                    cursor: pointer;
                `
            }, `Sample ${oemData.name} Button`);

            // Hover effects
            sampleButton.onmouseenter = () => {
                sampleButton.style.backgroundColor = styles.hoverBackgroundColor;
                sampleButton.style.color = styles.hoverTextColor;
            };
            sampleButton.onmouseleave = () => {
                sampleButton.style.backgroundColor = styles.backgroundColor;
                sampleButton.style.color = styles.textColor;
            };

            livePreviewArea.appendChild(sampleButton);
            return;
        }

        // Clear and render preview CTAs
        utils.clearElement(livePreviewArea);
        this.renderPreviewCtas(livePreviewArea);
    }
}

// Initialize wizard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new Wizard();
});
