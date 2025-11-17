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
        // Navigation buttons
        document.getElementById('next-btn').addEventListener('click', () => this.handleNext());
        document.getElementById('prev-btn').addEventListener('click', () => this.handlePrev());
    }

    handleNext() {
        // Validate current step
        if (!appState.validateCurrentStep()) {
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
                this.renderPlacementConfiguration();
                break;
            case 6:
                this.renderPreview();
                break;
        }

        // Update navigation buttons
        this.updateNavigationButtons(stepNumber);
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

        // Next button text
        if (stepNumber === appState.totalSteps) {
            nextBtn.textContent = 'Generate Code';
            nextBtn.style.display = 'none'; // Hide on final step
        } else {
            nextBtn.textContent = 'Next';
            nextBtn.style.display = 'block';
        }
    }

    // Step 1: OEM Selection
    renderOemSelection() {
        const select = document.getElementById('oem-select');

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
            } else {
                appState.setOem(null, null);
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
            }, ctaInfo.default);

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

        checkbox.onchange = (e) => {
            appState.updateCtaConfig(ctaType, { useDeeplink: e.target.checked });
            this.renderTreeConfiguration(); // Re-render to show/hide fields
        };

        const toggleText = utils.createElement('span', {}, config.useDeeplink ? 'Enabled' : 'Disabled');

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
        const treeLabel = utils.createElement('label', {}, 'Tree:');
        const treeSelect = utils.createElement('select', { id: `tree-${ctaType}` });

        const defaultOption = utils.createElement('option', { value: '' }, '-- Select Tree --');
        treeSelect.appendChild(defaultOption);

        const trees = appState.getTreesForCategory(ctaInfo.treeCategory);
        trees.forEach(tree => {
            const option = utils.createElement('option', {
                value: tree.id,
                selected: config.tree === tree.id
            }, tree.label);
            treeSelect.appendChild(option);
        });

        treeSelect.onchange = (e) => {
            appState.updateCtaConfig(ctaType, { tree: e.target.value });
        };

        treeField.appendChild(treeLabel);
        treeField.appendChild(treeSelect);
        row.appendChild(treeField);

        // Department selector
        const deptField = utils.createElement('div', { className: 'config-field' });
        const deptLabel = utils.createElement('label', {}, 'Department:');
        const deptSelect = utils.createElement('select', { id: `dept-${ctaType}` });

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
            const customDeptLabel = utils.createElement('label', {}, 'Custom Dept #:');
            const customDeptInput = utils.createElement('input', {
                type: 'number',
                id: `custom-dept-${ctaType}`,
                value: config.customDept || '',
                placeholder: 'Enter department number'
            });

            customDeptInput.oninput = (e) => {
                appState.updateCtaConfig(ctaType, { customDept: parseInt(e.target.value) });
            };

            customDeptField.appendChild(customDeptLabel);
            customDeptField.appendChild(customDeptInput);
            row.appendChild(customDeptField);
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
        const customOption = utils.createElement('option', {
            value: '__custom__',
            selected: config.customLabel && !ctaInfo.options.includes(config.customLabel)
        }, 'Custom...');
        labelSelect.appendChild(customOption);

        labelSelect.onchange = (e) => {
            if (e.target.value === '__custom__') {
                const customLabel = prompt('Enter custom label:', config.customLabel || config.label);
                if (customLabel) {
                    appState.updateCtaConfig(ctaType, { customLabel });
                }
                this.renderStylingConfiguration();
            } else {
                appState.updateCtaConfig(ctaType, { customLabel: null, label: e.target.value });
            }
        };

        labelField.appendChild(labelLabel);
        labelField.appendChild(labelSelect);
        row.appendChild(labelField);

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
        };

        styleField.appendChild(styleLabel);
        styleField.appendChild(styleSelect);
        row.appendChild(styleField);

        return row;
    }

    // Step 5: Placement Configuration
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
        const row = utils.createElement('div', { className: 'config-row' });

        // SRP checkbox
        const srpField = utils.createElement('div', { className: 'checkbox-item' });
        const srpCheckbox = utils.createElement('input', {
            type: 'checkbox',
            id: `srp-${ctaType}`,
            checked: config.placement.srp
        });
        const srpLabel = utils.createElement('label', { for: `srp-${ctaType}` }, 'Show on SRP');

        srpCheckbox.onchange = (e) => {
            appState.updateCtaConfig(ctaType, {
                placement: { ...config.placement, srp: e.target.checked }
            });
        };

        srpField.appendChild(srpCheckbox);
        srpField.appendChild(srpLabel);
        row.appendChild(srpField);

        // VDP checkbox
        const vdpField = utils.createElement('div', { className: 'checkbox-item' });
        const vdpCheckbox = utils.createElement('input', {
            type: 'checkbox',
            id: `vdp-${ctaType}`,
            checked: config.placement.vdp
        });
        const vdpLabel = utils.createElement('label', { for: `vdp-${ctaType}` }, 'Show on VDP');

        vdpCheckbox.onchange = (e) => {
            appState.updateCtaConfig(ctaType, {
                placement: { ...config.placement, vdp: e.target.checked }
            });
        };

        vdpField.appendChild(vdpCheckbox);
        vdpField.appendChild(vdpLabel);
        row.appendChild(vdpField);

        return row;
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

            const button = utils.createElement('a', {
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
}

// Initialize wizard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new Wizard();
});
