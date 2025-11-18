/**
 * Wizard Module
 * Handles step navigation and UI rendering
 */

import appState from './state.js';
import * as utils from './utils.js';
import { generateCode } from './generator.js';

class Wizard {
    constructor() {
        this.previewThemeToggleBtn = null;
        this.currentPreviewPlacement = 'srp';
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

        this.previewThemeToggleBtn = document.getElementById('preview-theme-toggle');
        this.themeToggleLabel = document.getElementById('theme-toggle-label');
        if (this.previewThemeToggleBtn) {
            this.previewThemeToggleBtn.addEventListener('change', () => this.togglePreviewTheme());
            this.updatePreviewThemeLabel(false);
        }
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

        // Toggle preview sidebar visibility (hide on step 7)
        this.togglePreviewSidebarVisibility(stepNumber);

        // Update live preview
        this.updateLivePreview();
    }

    togglePreviewTheme() {
        const sidebar = document.getElementById('preview-sidebar');
        if (!sidebar) return;

        const isDark = this.previewThemeToggleBtn.checked;
        if (isDark) {
            sidebar.classList.add('dark');
        } else {
            sidebar.classList.remove('dark');
        }
        this.updatePreviewThemeLabel(isDark);
    }

    updatePreviewThemeLabel(isDark) {
        if (!this.themeToggleLabel) return;
        this.themeToggleLabel.textContent = isDark ? 'Dark' : 'Light';
    }

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
        const errors = appState.getValidationErrors();
        const isValid = errors.length === 0;

        // Always keep Next button enabled so users can click it to see errors
        nextBtn.disabled = false;
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
            nextBtn.textContent = 'Save This Config';
            nextBtn.style.display = 'block';
            nextBtn.disabled = true; // Disabled for now - will implement in future session
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

            // Make the entire div clickable
            checkboxItem.onclick = (e) => {
                // Prevent double-triggering if the checkbox itself was clicked
                if (e.target !== checkbox) {
                    checkbox.checked = !checkbox.checked;
                    this.handleCtaSelectionChange();
                }
            };

            // Add pointer cursor to indicate clickability
            checkboxItem.style.cursor = 'pointer';

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
            // Re-attach validation listeners after DOM rebuild
            this.setupValidationWatching();
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
        const isCustomTree = config.useCustomTree || (config.tree && !trees.some(tree => tree.id === config.tree));

        trees.forEach(tree => {
            const option = utils.createElement('option', {
                value: tree.id,
                selected: !isCustomTree && config.tree === tree.id
            }, tree.id);
            treeSelect.appendChild(option);
        });

        const customTreeOption = utils.createElement('option', {
            value: '__custom__',
            selected: isCustomTree
        }, 'Custom Tree');
        treeSelect.appendChild(customTreeOption);

        treeSelect.onchange = (e) => {
            const value = e.target.value;
            if (value === '__custom__') {
                appState.updateCtaConfig(ctaType, {
                    useCustomTree: true,
                    customTree: config.customTree || '',
                    tree: config.customTree || ''
                });
                this.renderTreeConfiguration();
                this.setupValidationWatching();
            } else {
                appState.updateCtaConfig(ctaType, {
                    useCustomTree: false,
                    customTree: null,
                    tree: value
                });
                // Clear validation error
                utils.clearFieldError(`tree-${ctaType}`);
                // Re-render to remove custom tree input field
                this.renderTreeConfiguration();
                this.setupValidationWatching();
            }
        };

        treeField.appendChild(treeLabel);
        treeField.appendChild(treeSelect);
        row.appendChild(treeField);

        if (isCustomTree) {
            const customTreeField = utils.createElement('div', { className: 'config-field' });
            const customTreeLabel = utils.createElement('label', {}, 'Custom Tree ID: ');
            const customTreeRequired = utils.createElement('span', {
                className: 'text-danger',
                style: 'font-weight: bold;'
            }, '*');
            customTreeLabel.appendChild(customTreeRequired);

            const customTreeInput = utils.createElement('input', {
                type: 'text',
                id: `custom-tree-${ctaType}`,
                value: config.customTree || config.tree || '',
                placeholder: 'Enter custom tree ID',
                required: true
            });

            customTreeInput.oninput = (e) => {
                const value = e.target.value;
                appState.updateCtaConfig(ctaType, {
                    customTree: value,
                    tree: value
                });
                utils.clearFieldError(`custom-tree-${ctaType}`);
            };

            customTreeField.appendChild(customTreeLabel);
            customTreeField.appendChild(customTreeInput);
            row.appendChild(customTreeField);
        }

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
                    // Re-attach validation listeners after DOM rebuild
                    this.setupValidationWatching();
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

        const useCustomLabel = config.useCustomLabel;

        ctaInfo.options.forEach(option => {
            const optElement = utils.createElement('option', {
                value: option,
                selected: !useCustomLabel && (config.label === option)
            }, option);
            labelSelect.appendChild(optElement);
        });

        // Custom option
        const customOption = utils.createElement('option', {
            value: '__custom__',
            selected: useCustomLabel
        }, 'Custom');
        labelSelect.appendChild(customOption);

        labelSelect.onchange = (e) => {
            if (e.target.value === '__custom__') {
                appState.updateCtaConfig(ctaType, {
                    useCustomLabel: true,
                    customLabel: config.customLabel || ''
                });
                this.renderStylingConfiguration();
            } else {
                appState.updateCtaConfig(ctaType, {
                    useCustomLabel: false,
                    customLabel: '',
                    label: e.target.value
                });
                this.renderStylingConfiguration(); // Re-render to disable custom input
                this.updateLivePreview(); // Update preview when label changes
            }
        };

        labelField.appendChild(labelLabel);
        labelField.appendChild(labelSelect);
        row.appendChild(labelField);

        // Only show custom text input if "Custom" is selected
        if (useCustomLabel) {
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
        } else {
            const helperField = utils.createElement('div', { className: 'config-field' });
            const helperLabel = utils.createElement('label', {}, 'Custom Label Text:');
            const helperInput = utils.createElement('input', {
                type: 'text',
                id: `custom-label-${ctaType}`,
                value: '',
                placeholder: 'Select "Custom" to edit',
                disabled: true
            });
            helperField.appendChild(helperLabel);
            helperField.appendChild(helperInput);
            row.appendChild(helperField);
        }

        return row;
    }

    createStyleSelection(ctaType, config) {
        const container = utils.createElement('div', { className: 'config-row', style: 'flex-direction: column;' });
        const row = utils.createElement('div', { className: 'config-row' });

        const styleField = utils.createElement('div', { className: 'config-field' });
        const styleLabel = utils.createElement('label', {}, 'Style Type:');
        const styleSelect = utils.createElement('select', { id: `style-${ctaType}` });

        const oemData = appState.data.oemData;
        const useCustomStyle = config.styleType === '__custom__';

        if (oemData && oemData.styles) {
            Object.keys(oemData.styles).forEach(styleKey => {
                const styleInfo = oemData.styles[styleKey];
                const option = utils.createElement('option', {
                    value: styleKey,
                    selected: !useCustomStyle && config.styleType === styleKey
                }, styleInfo.label);
                styleSelect.appendChild(option);
            });
        }

        // Add Custom option
        const customOption = utils.createElement('option', {
            value: '__custom__',
            selected: useCustomStyle
        }, 'Custom');
        styleSelect.appendChild(customOption);

        styleSelect.onchange = (e) => {
            if (e.target.value === '__custom__') {
                appState.updateCtaConfig(ctaType, {
                    styleType: '__custom__',
                    customStyle: config.customStyle || {
                        backgroundColor: '#000000',
                        textColor: '#ffffff',
                        borderColor: '#000000'
                    }
                });
                this.renderStylingConfiguration();
            } else {
                appState.updateCtaConfig(ctaType, {
                    styleType: e.target.value,
                    customStyle: null
                });
                this.renderStylingConfiguration();
                this.updateLivePreview();
            }
        };

        styleField.appendChild(styleLabel);
        styleField.appendChild(styleSelect);
        row.appendChild(styleField);
        container.appendChild(row);

        // Show custom color inputs if custom style is selected
        if (useCustomStyle) {
            const colorRow = utils.createElement('div', {
                className: 'config-row',
                style: 'margin-top: 12px; gap: 12px;'
            });

            // Background Color
            const bgColorField = utils.createElement('div', {
                className: 'config-field',
                style: 'display: flex; flex-direction: column; gap: 4px;'
            });
            const bgColorLabel = utils.createElement('label', {}, 'Background:');
            const bgColorWrapper = utils.createElement('div', {
                style: 'display: flex; gap: 8px; align-items: center;'
            });
            const bgColorInput = utils.createElement('input', {
                type: 'color',
                id: `custom-bg-picker-${ctaType}`,
                value: config.customStyle?.backgroundColor || '#000000',
                style: 'width: 50px; height: 35px; cursor: pointer;'
            });
            const bgColorText = utils.createElement('input', {
                type: 'text',
                id: `custom-bg-text-${ctaType}`,
                value: config.customStyle?.backgroundColor || '#000000',
                placeholder: '#000000',
                style: 'flex: 1; text-transform: uppercase;'
            });

            bgColorInput.oninput = (e) => {
                const newCustomStyle = { ...config.customStyle, backgroundColor: e.target.value };
                appState.updateCtaConfig(ctaType, { customStyle: newCustomStyle });
                bgColorText.value = e.target.value.toUpperCase();
                this.updateLivePreview();
            };

            bgColorText.oninput = (e) => {
                const value = e.target.value.trim();
                // Validate hex color format
                if (/^#[0-9A-Fa-f]{6}$/.test(value) || /^#[0-9A-Fa-f]{3}$/.test(value)) {
                    const newCustomStyle = { ...config.customStyle, backgroundColor: value };
                    appState.updateCtaConfig(ctaType, { customStyle: newCustomStyle });
                    bgColorInput.value = value;
                    this.updateLivePreview();
                }
            };

            bgColorWrapper.appendChild(bgColorInput);
            bgColorWrapper.appendChild(bgColorText);
            bgColorField.appendChild(bgColorLabel);
            bgColorField.appendChild(bgColorWrapper);
            colorRow.appendChild(bgColorField);

            // Text Color
            const textColorField = utils.createElement('div', {
                className: 'config-field',
                style: 'display: flex; flex-direction: column; gap: 4px;'
            });
            const textColorLabel = utils.createElement('label', {}, 'Text:');
            const textColorWrapper = utils.createElement('div', {
                style: 'display: flex; gap: 8px; align-items: center;'
            });
            const textColorInput = utils.createElement('input', {
                type: 'color',
                id: `custom-text-picker-${ctaType}`,
                value: config.customStyle?.textColor || '#ffffff',
                style: 'width: 50px; height: 35px; cursor: pointer;'
            });
            const textColorText = utils.createElement('input', {
                type: 'text',
                id: `custom-text-text-${ctaType}`,
                value: config.customStyle?.textColor || '#ffffff',
                placeholder: '#ffffff',
                style: 'flex: 1; text-transform: uppercase;'
            });

            textColorInput.oninput = (e) => {
                const newCustomStyle = { ...config.customStyle, textColor: e.target.value };
                appState.updateCtaConfig(ctaType, { customStyle: newCustomStyle });
                textColorText.value = e.target.value.toUpperCase();
                this.updateLivePreview();
            };

            textColorText.oninput = (e) => {
                const value = e.target.value.trim();
                // Validate hex color format
                if (/^#[0-9A-Fa-f]{6}$/.test(value) || /^#[0-9A-Fa-f]{3}$/.test(value)) {
                    const newCustomStyle = { ...config.customStyle, textColor: value };
                    appState.updateCtaConfig(ctaType, { customStyle: newCustomStyle });
                    textColorInput.value = value;
                    this.updateLivePreview();
                }
            };

            textColorWrapper.appendChild(textColorInput);
            textColorWrapper.appendChild(textColorText);
            textColorField.appendChild(textColorLabel);
            textColorField.appendChild(textColorWrapper);
            colorRow.appendChild(textColorField);

            // Border Color
            const borderColorField = utils.createElement('div', {
                className: 'config-field',
                style: 'display: flex; flex-direction: column; gap: 4px;'
            });
            const borderColorLabel = utils.createElement('label', {}, 'Border:');
            const borderColorWrapper = utils.createElement('div', {
                style: 'display: flex; gap: 8px; align-items: center;'
            });
            const borderColorInput = utils.createElement('input', {
                type: 'color',
                id: `custom-border-picker-${ctaType}`,
                value: config.customStyle?.borderColor || '#000000',
                style: 'width: 50px; height: 35px; cursor: pointer;'
            });
            const borderColorText = utils.createElement('input', {
                type: 'text',
                id: `custom-border-text-${ctaType}`,
                value: config.customStyle?.borderColor || '#000000',
                placeholder: '#000000',
                style: 'flex: 1; text-transform: uppercase;'
            });

            borderColorInput.oninput = (e) => {
                const newCustomStyle = { ...config.customStyle, borderColor: e.target.value };
                appState.updateCtaConfig(ctaType, { customStyle: newCustomStyle });
                borderColorText.value = e.target.value.toUpperCase();
                this.updateLivePreview();
            };

            borderColorText.oninput = (e) => {
                const value = e.target.value.trim();
                // Validate hex color format
                if (/^#[0-9A-Fa-f]{6}$/.test(value) || /^#[0-9A-Fa-f]{3}$/.test(value)) {
                    const newCustomStyle = { ...config.customStyle, borderColor: value };
                    appState.updateCtaConfig(ctaType, { customStyle: newCustomStyle });
                    borderColorInput.value = value;
                    this.updateLivePreview();
                }
            };

            borderColorWrapper.appendChild(borderColorInput);
            borderColorWrapper.appendChild(borderColorText);
            borderColorField.appendChild(borderColorLabel);
            borderColorField.appendChild(borderColorWrapper);
            colorRow.appendChild(borderColorField);

            container.appendChild(colorRow);
        }

        return container;
    }

    // Step 5: Advanced Styling Configuration
    renderAdvancedStylingConfiguration() {
        const container = document.getElementById('advanced-styling-config-list');
        utils.clearElement(container);

        const placements = [
            { key: 'srp', label: 'SRP Buttons' },
            { key: 'vdp', label: 'VDP Buttons' }
        ];

        placements.forEach(({ key, label }) => {
            const configItem = utils.createElement('div', { className: 'config-item' });
            const heading = utils.createElement('h3', {}, label);
            configItem.appendChild(heading);

            configItem.appendChild(this.createTypographyControls(key));
            configItem.appendChild(this.createSpacingControls(key));

            container.appendChild(configItem);
        });
    }

    createTypographyControls(placement) {
        const wrapper = utils.createElement('div', { className: 'config-row' });

        // Font family
        const fontFamilies = [
            { value: '', label: 'Inherit from site' },
            { value: 'Arial, sans-serif', label: 'Arial' },
            { value: '\'Roboto\', sans-serif', label: 'Roboto' },
            { value: '\'Montserrat\', sans-serif', label: 'Montserrat' },
            { value: '\'Georgia\', serif', label: 'Georgia' }
        ];
        const fontFamilyField = this.createPlacementSelect(
            placement,
            'fontFamily',
            'Font Family',
            fontFamilies
        );
        wrapper.appendChild(fontFamilyField);

        // Font size slider
        const fontSizeField = this.createPlacementSlider(
            placement,
            'fontSize',
            'Font Size (px)',
            12,
            28,
            1,
            'px'
        );
        wrapper.appendChild(fontSizeField);

        // Font weight
        const fontWeights = [
            { value: '', label: 'Inherit from site' },
            { value: '400', label: 'Regular (400)' },
            { value: '500', label: 'Medium (500)' },
            { value: '600', label: 'Semi-bold (600)' },
            { value: '700', label: 'Bold (700)' }
        ];
        const fontWeightField = this.createPlacementSelect(
            placement,
            'fontWeight',
            'Font Weight',
            fontWeights
        );
        wrapper.appendChild(fontWeightField);

        // Line height slider
        const lineHeightField = this.createPlacementSlider(
            placement,
            'lineHeight',
            'Line Height',
            1,
            3,
            0.1,
            ''
        );
        wrapper.appendChild(lineHeightField);

        // Letter spacing slider
        const letterSpacingField = this.createPlacementSlider(
            placement,
            'letterSpacing',
            'Letter Spacing (px)',
            -2,
            6,
            0.1,
            'px'
        );
        wrapper.appendChild(letterSpacingField);

        // Wrap select
        const wrapField = this.createPlacementSelect(
            placement,
            'textWrap',
            'Text Wrapping',
            [
                { value: 'wrap', label: 'Wrap text' },
                { value: 'nowrap', label: 'No wrap' }
            ]
        );
        wrapper.appendChild(wrapField);

        return wrapper;
    }

    createSpacingControls(placement) {
        const wrapper = utils.createElement('div', { className: 'config-row' });

        const borderRadiusField = this.createPlacementSlider(
            placement,
            'borderRadius',
            'Border Radius (px)',
            0,
            50,
            1,
            'px'
        );
        wrapper.appendChild(borderRadiusField);

        const borderWidthField = this.createPlacementSlider(
            placement,
            'borderWidth',
            'Border Width (px)',
            0,
            10,
            1,
            'px'
        );
        wrapper.appendChild(borderWidthField);

        const marginTopField = this.createPlacementSlider(
            placement,
            'marginTop',
            'Margin Top (px)',
            0,
            40,
            1,
            'px'
        );
        wrapper.appendChild(marginTopField);

        const marginBottomField = this.createPlacementSlider(
            placement,
            'marginBottom',
            'Margin Bottom (px)',
            0,
            40,
            1,
            'px'
        );
        wrapper.appendChild(marginBottomField);

        const paddingField = this.createPlacementSlider(
            placement,
            'padding',
            'Padding (px)',
            4,
            40,
            1,
            'px'
        );
        wrapper.appendChild(paddingField);

        return wrapper;
    }

    createPlacementSelect(placement, property, label, options) {
        const field = utils.createElement('div', { className: 'config-field' });
        const labelEl = utils.createElement('label', {}, `${label}:`);
        const select = utils.createElement('select', {
            id: `${property}-${placement}`
        });

        const advancedValue = this.getAdvancedStylesValue(placement, property);
        const currentValue = advancedValue ?? (property === 'textWrap' ? 'wrap' : '');

        options.forEach(opt => {
            const optionEl = utils.createElement('option', {
                value: opt.value,
                selected: currentValue === opt.value
            }, opt.label);
            select.appendChild(optionEl);
        });

        select.onchange = (e) => {
            const value = e.target.value;
            appState.updateAdvancedStyles(placement, {
                [property]: value === '' ? null : value
            });
            this.refreshPreviewOutputs();
        };

        field.appendChild(labelEl);
        field.appendChild(select);
        return field;
    }

    createPlacementSlider(placement, property, label, min, max, step, unit = 'px') {
        const field = utils.createElement('div', { className: 'config-field' });
        const labelEl = utils.createElement('label', {}, `${label}:`);

        const sliderContainer = utils.createElement('div', { className: 'slider-container' });

        const resolvedValue = this.getResolvedPlacementStyleValue(placement, property);
        const numericValue = this.parseNumericValue(resolvedValue, min);

        const slider = utils.createElement('input', {
            type: 'range',
            id: `${property}-${placement}`,
            min,
            max,
            step,
            value: numericValue
        });

        const valueDisplay = utils.createElement('span', {
            className: 'slider-value',
            id: `${property}-value-${placement}`
        }, unit ? `${numericValue}${unit}` : `${numericValue}`);

        slider.oninput = (e) => {
            const rawValue = e.target.value;
            valueDisplay.textContent = unit ? `${rawValue}${unit}` : rawValue;
            const storedValue = unit ? `${rawValue}${unit}` : rawValue;
            appState.updateAdvancedStyles(placement, { [property]: storedValue });
            this.refreshPreviewOutputs();
        };

        sliderContainer.appendChild(slider);
        sliderContainer.appendChild(valueDisplay);
        field.appendChild(labelEl);
        field.appendChild(sliderContainer);

        return field;
    }

    getAdvancedStylesValue(placement, property) {
        const adv = appState.data.advancedStyles?.[placement];
        if (!adv) return null;
        return adv[property];
    }

    getResolvedPlacementStyleValue(placement, property) {
        const advancedValue = this.getAdvancedStylesValue(placement, property);
        if (advancedValue) {
            return advancedValue;
        }

        if (property === 'textWrap') {
            return 'wrap';
        }

        const baseStyle = this.getPlacementBaseStyle(placement);
        if (baseStyle && baseStyle[property]) {
            return baseStyle[property];
        }

        return this.getFallbackValue(property);
    }

    getPlacementBaseStyle(placement) {
        const oemData = appState.data.oemData;
        if (!oemData || !oemData.styles) {
            return {};
        }

        if (placement === 'srp') {
            return oemData.styles.primary || {};
        }

        if (placement === 'vdp') {
            return oemData.styles.secondary || oemData.styles.primary || {};
        }

        return {};
    }

    getFallbackValue(property) {
        const defaults = {
            fontFamily: 'inherit',
            fontSize: '16px',
            fontWeight: '600',
            lineHeight: '1.4',
            letterSpacing: '0px',
            borderRadius: '4px',
            marginTop: '6px',
            marginBottom: '6px',
            padding: '12px',
            textWrap: 'wrap'
        };

        return defaults[property] || '';
    }

    parseNumericValue(value, fallback) {
        if (typeof value === 'number') {
            return value;
        }

        if (typeof value === 'string') {
            const match = value.match(/-?\d+(\.\d+)?/);
            if (match) {
                return parseFloat(match[0]);
            }
        }

        return fallback;
    }

    refreshPreviewOutputs() {
        this.updateLivePreview();
        if (appState.currentStep === 7) {
            this.renderPreview();
        }
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
        const placementSelect = document.getElementById('preview-placement-select');

        if (placementSelect) {
            placementSelect.value = this.currentPreviewPlacement;
            placementSelect.onchange = (e) => {
                this.currentPreviewPlacement = e.target.value;
                this.renderPreview();
                this.updateLivePreview();
            };
        }

        // Generate preview
        utils.clearElement(previewArea);
        const renderedCount = this.renderPreviewCtas(previewArea, this.currentPreviewPlacement);
        if (renderedCount === 0) {
            previewArea.innerHTML = `<p class="text-muted">No CTAs configured for ${this.currentPreviewPlacement.toUpperCase()} placement.</p>`;
        }

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

    renderPreviewCtas(container, mode = 'srp') {
        const oemData = appState.data.oemData;
        if (!oemData) return 0;

        let rendered = 0;

        appState.data.selectedCtas.forEach(ctaType => {
            const config = appState.getCtaConfig(ctaType);
            if (!config) return;

            const placement = this.resolvePlacementForPreview(config, mode);
            if (!placement) return;

            // Handle custom styles
            let styles, appliedStyles;
            if (config.styleType === '__custom__' && config.customStyle) {
                // Use custom colors
                styles = {
                    backgroundColor: config.customStyle.backgroundColor,
                    textColor: config.customStyle.textColor,
                    borderColor: config.customStyle.borderColor,
                    borderWidth: '2px',
                    textTransform: 'none',
                    hoverBackgroundColor: config.customStyle.textColor, // Swap on hover
                    hoverTextColor: config.customStyle.backgroundColor,
                    transition: 'all 0.3s ease'
                };
                appliedStyles = this.getPreviewStyles(styles, placement);
            } else {
                // Use OEM styles
                styles = oemData.styles[config.styleType] || oemData.styles.primary;
                appliedStyles = this.getPreviewStyles(styles, placement);
            }

            const buttonLabel = config.useCustomLabel
                ? (config.customLabel || config.label)
                : config.label;

            const styleClass = utils.sanitizeCssClassName(config.styleType || 'primary');
            const button = utils.createElement('a', {
                className: `demo-cta demo-cta-${styleClass}`,
                href: '#',
                style: `
                    display: inline-flex;
                    width: 100%;
                    justify-content: center;
                    align-items: center;
                    text-align: center;
                    background-color: ${appliedStyles.backgroundColor};
                    color: ${appliedStyles.textColor};
                    border: ${appliedStyles.borderWidth} solid ${appliedStyles.borderColor};
                    border-radius: ${appliedStyles.borderRadius};
                    text-transform: ${appliedStyles.textTransform};
                    font-size: ${appliedStyles.fontSize};
                    font-weight: ${appliedStyles.fontWeight};
                    line-height: ${appliedStyles.lineHeight};
                    letter-spacing: ${appliedStyles.letterSpacing};
                    padding: ${appliedStyles.padding};
                    margin-top: ${appliedStyles.marginTop};
                    margin-bottom: ${appliedStyles.marginBottom};
                    font-family: ${appliedStyles.fontFamily};
                    white-space: ${appliedStyles.whiteSpace};
                    transition: ${appliedStyles.transition};
                    text-decoration: none;
                    cursor: pointer;
                `
            }, buttonLabel);

            const baseStyles = styles;

            button.onmouseenter = () => {
                button.style.backgroundColor = baseStyles.hoverBackgroundColor;
                button.style.color = baseStyles.hoverTextColor;
            };
            button.onmouseleave = () => {
                button.style.backgroundColor = appliedStyles.backgroundColor;
                button.style.color = appliedStyles.textColor;
            };

            container.appendChild(button);
            rendered++;
        });

        return rendered;
    }

    resolvePlacementForPreview(config, mode) {
        if (mode === 'srp') {
            return config.placement.srp ? 'srp' : null;
        }
        if (mode === 'vdp') {
            return config.placement.vdp ? 'vdp' : null;
        }

        // live preview mode - prioritize SRP, fallback to VDP
        if (config.placement.srp) return 'srp';
        if (config.placement.vdp) return 'vdp';
        return null;
    }

    getPreviewStyles(baseStyles, placement) {
        const advanced = appState.data.advancedStyles?.[placement] || {};

        const resolve = (prop, fallbackKey) => {
            if (advanced[prop]) {
                return advanced[prop];
            }
            if (baseStyles && baseStyles[prop]) {
                return baseStyles[prop];
            }
            return this.getFallbackValue(fallbackKey || prop);
        };

        return {
            backgroundColor: baseStyles.backgroundColor,
            textColor: baseStyles.textColor,
            borderColor: baseStyles.borderColor,
            borderWidth: resolve('borderWidth'),
            borderRadius: resolve('borderRadius'),
            textTransform: baseStyles.textTransform,
            fontSize: resolve('fontSize'),
            fontWeight: resolve('fontWeight'),
            fontFamily: resolve('fontFamily'),
            lineHeight: resolve('lineHeight'),
            letterSpacing: resolve('letterSpacing'),
            padding: resolve('padding'),
            marginTop: resolve('marginTop'),
            marginBottom: resolve('marginBottom'),
            whiteSpace: advanced.textWrap === 'nowrap' ? 'nowrap' : 'normal',
            transition: baseStyles.transition
        };
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
            const appliedStyles = this.getPreviewStyles(styles, 'srp');

            const sampleButton = utils.createElement('a', {
                className: 'demo-cta demo-cta-primary',
                href: '#',
                style: `
                    display: inline-flex;
                    justify-content: center;
                    align-items: center;
                    width: 100%;
                    text-align: center;
                    background-color: ${appliedStyles.backgroundColor};
                    color: ${appliedStyles.textColor};
                    border: ${appliedStyles.borderWidth} solid ${appliedStyles.borderColor};
                    border-radius: ${appliedStyles.borderRadius};
                    text-transform: ${appliedStyles.textTransform};
                    font-size: ${appliedStyles.fontSize};
                    font-weight: ${appliedStyles.fontWeight};
                    line-height: ${appliedStyles.lineHeight};
                    letter-spacing: ${appliedStyles.letterSpacing};
                    padding: ${appliedStyles.padding};
                    margin-top: ${appliedStyles.marginTop};
                    margin-bottom: ${appliedStyles.marginBottom};
                    font-family: ${appliedStyles.fontFamily};
                    white-space: ${appliedStyles.whiteSpace};
                    transition: ${appliedStyles.transition};
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
                sampleButton.style.backgroundColor = appliedStyles.backgroundColor;
                sampleButton.style.color = appliedStyles.textColor;
            };

            livePreviewArea.appendChild(sampleButton);
            return;
        }

        // Clear and render preview CTAs for both SRP and VDP
        utils.clearElement(livePreviewArea);

        // Check if there are any SRP CTAs
        const hasSrpCtas = appState.data.selectedCtas.some(ctaType => {
            const config = appState.getCtaConfig(ctaType);
            return config && config.placement.srp;
        });

        // Check if there are any VDP CTAs
        const hasVdpCtas = appState.data.selectedCtas.some(ctaType => {
            const config = appState.getCtaConfig(ctaType);
            return config && config.placement.vdp;
        });

        // Render SRP section
        if (hasSrpCtas) {
            const srpSection = utils.createElement('div', { className: 'preview-section' });
            const srpTitle = utils.createElement('div', { className: 'preview-section-title' }, 'SRP Buttons');
            srpSection.appendChild(srpTitle);

            const srpContainer = utils.createElement('div', {});
            this.renderPreviewCtas(srpContainer, 'srp');
            srpSection.appendChild(srpContainer);
            livePreviewArea.appendChild(srpSection);
        }

        // Render VDP section
        if (hasVdpCtas) {
            const vdpSection = utils.createElement('div', { className: 'preview-section' });
            const vdpTitle = utils.createElement('div', { className: 'preview-section-title' }, 'VDP Buttons');
            vdpSection.appendChild(vdpTitle);

            const vdpContainer = utils.createElement('div', {});
            this.renderPreviewCtas(vdpContainer, 'vdp');
            vdpSection.appendChild(vdpContainer);
            livePreviewArea.appendChild(vdpSection);
        }

        // If no CTAs are enabled for either placement
        if (!hasSrpCtas && !hasVdpCtas) {
            livePreviewArea.innerHTML = '<p class="text-muted">Enable SRP or VDP placement to see CTAs here.</p>';
        }
    }
}

// Initialize wizard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new Wizard();
});
