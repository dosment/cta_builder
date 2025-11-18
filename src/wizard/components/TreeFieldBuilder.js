/**
 * TreeFieldBuilder
 * Builds tree and department field UI components
 */

import * as utils from '../../utils.js';

export class TreeFieldBuilder {
    constructor(appState, onFieldChange) {
        this.appState = appState;
        this.onFieldChange = onFieldChange;
    }

    /**
     * Create deeplink toggle checkbox
     */
    createDeeplinkToggle(ctaType, config, ctaInfo) {
        const row = utils.createElement('div', { className: 'config-row' });

        const toggleField = utils.createElement('div', { className: 'config-field checkbox-field' });
        const checkbox = utils.createElement('input', {
            type: 'checkbox',
            id: `deeplink-${ctaType}`,
            checked: config.useDeeplink
        });
        const toggleLabel = utils.createElement('label', {
            for: `deeplink-${ctaType}`,
            className: 'inline-checkbox-label'
        });
        const labelText = utils.createElement('span', {}, 'Use Deeplink:');

        checkbox.onchange = (e) => {
            const isEnabled = e.target.checked;
            this.appState.updateCtaConfig(ctaType, { useDeeplink: isEnabled });

            // Notify parent to re-render
            if (this.onFieldChange) {
                this.onFieldChange();
            }
        };

        toggleLabel.appendChild(labelText);
        toggleLabel.appendChild(checkbox);
        toggleField.appendChild(toggleLabel);
        row.appendChild(toggleField);

        return row;
    }

    /**
     * Create tree and department fields
     */
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

        const trees = this.appState.getTreesForCategory(ctaInfo.treeCategory);
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
                this.appState.updateCtaConfig(ctaType, {
                    useCustomTree: true,
                    customTree: config.customTree || '',
                    tree: config.customTree || ''
                });
                if (this.onFieldChange) {
                    this.onFieldChange();
                }
            } else {
                this.appState.updateCtaConfig(ctaType, {
                    useCustomTree: false,
                    customTree: null,
                    tree: value
                });
                utils.clearFieldError(`tree-${ctaType}`);
                if (this.onFieldChange) {
                    this.onFieldChange();
                }
            }
        };

        treeField.appendChild(treeLabel);
        treeField.appendChild(treeSelect);
        row.appendChild(treeField);

        // Custom tree input if needed
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
                this.appState.updateCtaConfig(ctaType, {
                    customTree: value,
                    tree: value
                });
                utils.clearFieldError(`custom-tree-${ctaType}`);
            };

            customTreeField.appendChild(customTreeLabel);
            customTreeField.appendChild(customTreeInput);
            row.appendChild(customTreeField);
        }

        // Department configuration
        this.addDepartmentFields(row, ctaType, config, ctaInfo);

        return row;
    }

    /**
     * Add department fields to row
     */
    addDepartmentFields(row, ctaType, config, ctaInfo) {
        // Confirm Availability is special (custom only)
        if (ctaType === 'confirm_availability') {
            const customDeptField = this.createCustomDeptField(ctaType, config);
            row.appendChild(customDeptField);
        } else {
            // Regular department selector for other CTAs
            const deptField = this.createDeptSelector(ctaType, config, ctaInfo);
            row.appendChild(deptField);

            // Custom department input (if custom is selected)
            if (config.dept === 'custom') {
                const customDeptField = this.createCustomDeptField(ctaType, config);
                row.appendChild(customDeptField);
            }
        }
    }

    /**
     * Create department selector
     */
    createDeptSelector(ctaType, config, ctaInfo) {
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

        const departments = this.appState.getDepartmentsForCategory(ctaInfo.treeCategory);
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
                this.appState.updateCtaConfig(ctaType, { dept: 'custom' });
                if (this.onFieldChange) {
                    this.onFieldChange();
                }
            } else {
                this.appState.updateCtaConfig(ctaType, { dept: parseInt(value), customDept: null });
            }
        };

        deptField.appendChild(deptLabel);
        deptField.appendChild(deptSelect);
        return deptField;
    }

    /**
     * Create custom department field
     */
    createCustomDeptField(ctaType, config) {
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
            this.appState.updateCtaConfig(ctaType, {
                dept: 'custom',
                customDept: parseInt(e.target.value)
            });
            utils.clearFieldError(`custom-dept-${ctaType}`);
        };

        customDeptField.appendChild(customDeptLabel);
        customDeptField.appendChild(customDeptInput);
        return customDeptField;
    }

    /**
     * Create deeplink step selector
     */
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
            this.appState.updateCtaConfig(ctaType, { deeplinkStep: e.target.value });
        };

        stepField.appendChild(stepLabel);
        stepField.appendChild(stepSelect);
        row.appendChild(stepField);

        return row;
    }
}
