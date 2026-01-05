// frontend/js/ui/code_tabs_controller.js
// Code Tabs Controller - تب‌های YAML، EVM JavaScript، C Code
// نسخه کامل و یکپارچه - تمام توابع با قابلیت Fallback

class CodeTabsController {
    constructor() {
        this.currentTab = 'yaml'; // yaml, evm, c
        this.isGenerating = false;
        this.codeContent = {
            yaml: '',
            evm: '',
            c: ''
        };
        
        // Generators instances
        this.cGenerator = null;
        this.evmGenerator = null;
        
        this.init();
    }
    
    init() {
        console.log('[CodeTabsController] Initializing...');
        
        // Initialize generators first
        this.initializeGenerators();
        
        // Create UI
        this.createTabs();
        this.bindEvents();
        
        // Initial code generation
        this.updateCurrentTab();
        
        // Listen for state changes
        if (typeof on === 'function' && typeof EVENTS !== 'undefined') {
            on(EVENTS.STATE_CHANGED, () => {
                this.updateCurrentTab();
            });
        }
        
        console.log('[CodeTabsController] Initialized');
    }
    
    initializeGenerators() {
        // Initialize CCodeGenerator
        if (window.CCodeGenerator && typeof window.CCodeGenerator === 'function') {
            try {
                this.cGenerator = new CCodeGenerator();
                console.log('[CodeTabsController] CCodeGenerator initialized');
            } catch (error) {
                console.error('[CodeTabsController] Failed to initialize CCodeGenerator:', error);
            }
        } else {
            console.warn('[CodeTabsController] CCodeGenerator class not found');
        }
        
        // Initialize EVMCodeGenerator (already instantiated globally)
        if (window.EVMCodeGenerator && typeof window.EVMCodeGenerator.generate === 'function') {
            this.evmGenerator = window.EVMCodeGenerator;
            console.log('[CodeTabsController] EVMCodeGenerator found');
        } else {
            console.warn('[CodeTabsController] EVMCodeGenerator not found');
        }
    }
    
    createTabs() {
        // If tabs already exist, don't recreate
        if (document.querySelector('.code-tabs-container')) return;
        
        // Find existing YAML panel
        const yamlPanel = document.querySelector('.code-panel.yaml-panel');
        if (!yamlPanel) {
            console.error('[CodeTabsController] YAML panel not found');
            return;
        }
        
        // Save existing YAML content if any
        const yamlTextarea = yamlPanel.querySelector('#snippetBox');
        if (yamlTextarea) {
            this.codeContent.yaml = yamlTextarea.value;
        }
        
        // Create tabs container
        const parent = yamlPanel.parentNode;
        const tabsContainer = document.createElement('div');
        tabsContainer.className = 'code-tabs-container';
        tabsContainer.innerHTML = `
            <div class="code-tabs-header">
                <div class="code-tabs">
                    <button class="code-tab active" data-tab="yaml">
                        <span class="tab-icon">📄</span>
                        ESPHome YAML
                    </button>
                    <button class="code-tab" data-tab="evm">
                        <span class="tab-icon">⚡</span>
                        EVM Script
                    </button>
                    <button class="code-tab" data-tab="c">
                        <span class="tab-icon">🖥️</span>
                        C Code
                    </button>
                </div>
                <div class="code-tabs-actions" id="codeTabActions">
                    <!-- Action buttons will be added dynamically -->
                </div>
            </div>
            <div class="code-tabs-content">
                <!-- YAML content -->
                <div class="code-tab-content active" data-tab="yaml">
                    <textarea id="yamlCodeBox" class="code-box yaml-code" spellcheck="false"
                        placeholder="# ESPHome YAML configuration..."></textarea>
                </div>
                
                <!-- EVM content -->
                <div class="code-tab-content" data-tab="evm">
                    <textarea id="evmCodeBox" class="code-box js-code" spellcheck="false"
                        placeholder="// EVM JavaScript code will be generated here..."></textarea>
                </div>
                
                <!-- C content -->
                <div class="code-tab-content" data-tab="c">
                    <textarea id="cCodeBox" class="code-box c-code" spellcheck="false"
                        placeholder="// C code for ESP32 with LVGL will be generated here..."></textarea>
                </div>
            </div>
        `;
        
        // Replace YAML panel with tabs container
        parent.replaceChild(tabsContainer, yamlPanel);
        
        // Add styles
        this.addStyles();
        
        // Update action buttons for current tab
        this.updateTabActions();
    }
    
    addStyles() {
        // Don't add styles if already added
        if (document.querySelector('style[data-code-tabs]')) return;
        
        const style = document.createElement('style');
        style.setAttribute('data-code-tabs', 'true');
        style.textContent = `
            .code-tabs-container {
                display: flex;
                flex-direction: column;
                height: 300px;
                background: var(--bg-elevated);
                border-radius: 8px;
                overflow: hidden;
                margin-top: 8px;
                border: 1px solid var(--border-subtle);
            }
            
            .code-tabs-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0 16px;
                background: var(--bg-input);
                border-bottom: 1px solid var(--border-subtle);
                min-height: 48px;
            }
            
            .code-tabs {
                display: flex;
                gap: 4px;
            }
            
            .code-tab {
                padding: 8px 16px;
                background: transparent;
                border: none;
                color: var(--muted);
                font-size: 13px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 8px;
                border-radius: 4px 4px 0 0;
                position: relative;
                transition: all 0.2s ease;
            }
            
            .code-tab:hover {
                background: rgba(255, 255, 255, 0.05);
                color: var(--text);
            }
            
            .code-tab.active {
                color: var(--accent);
                background: var(--bg-elevated);
                font-weight: 600;
            }
            
            .code-tab.active::after {
                content: '';
                position: absolute;
                bottom: -1px;
                left: 0;
                right: 0;
                height: 3px;
                background: var(--accent);
            }
            
            .code-tab .tab-icon {
                font-size: 14px;
            }
            
            .code-tabs-actions {
                display: flex;
                gap: 8px;
            }
            
            .code-tabs-content {
                flex: 1;
                position: relative;
                overflow: hidden;
            }
            
            .code-tab-content {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.3s ease;
                background: var(--bg-elevated);
            }
            
            .code-tab-content.active {
                opacity: 1;
                visibility: visible;
            }
            
            .code-box {
                width: 100%;
                height: 100%;
                border: none;
                background: transparent;
                color: var(--text);
                font-family: 'Roboto Mono', monospace;
                font-size: 12px;
                line-height: 1.5;
                padding: 16px;
                resize: none;
                outline: none;
                white-space: pre;
                overflow-x: auto;
                tab-size: 2;
            }
            
            .code-box:focus {
                background: var(--bg-input-focus);
            }
            
            /* Syntax highlighting based on code type */
            .yaml-code {
                color: #c62828;
            }
            
            .yaml-code::-moz-selection,
            .yaml-code::selection {
                background: rgba(198, 40, 40, 0.2);
            }
            
            .js-code {
                color: #2e7d32;
            }
            
            .js-code::-moz-selection,
            .js-code::selection {
                background: rgba(46, 125, 50, 0.2);
            }
            
            .c-code {
                color: #1565c0;
            }
            
            .c-code::-moz-selection,
            .c-code::selection {
                background: rgba(21, 101, 192, 0.2);
            }
            
            /* Small buttons */
            .btn-xs {
                padding: 4px 12px;
                font-size: 11px;
                height: 28px;
                min-width: 70px;
            }
            
            /* Code generation indicator */
            .generating-indicator {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                font-size: 11px;
                color: var(--muted);
                padding: 4px 8px;
                background: var(--bg-input);
                border-radius: 4px;
            }
            
            .generating-indicator .spinner {
                width: 12px;
                height: 12px;
                border: 2px solid transparent;
                border-top-color: var(--accent);
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            /* Fullscreen mode */
            .fullscreen-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: var(--bg);
                z-index: 10000;
                display: flex;
                flex-direction: column;
            }
            
            .fullscreen-header {
                padding: 20px;
                background: var(--bg-elevated);
                border-bottom: 1px solid var(--border-subtle);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .fullscreen-textarea {
                flex: 1;
                background: var(--bg-input);
                color: var(--text);
                font-family: 'Roboto Mono', monospace;
                padding: 20px;
                border: none;
                outline: none;
                resize: none;
                font-size: 14px;
                line-height: 1.5;
            }
            
            .fullscreen-actions {
                display: flex;
                gap: 10px;
            }
        `;
        document.head.appendChild(style);
    }
    
    bindEvents() {
        // Tab click events
        document.addEventListener('click', (e) => {
            if (e.target.closest('.code-tab')) {
                const tab = e.target.closest('.code-tab');
                this.switchTab(tab.dataset.tab);
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl + 1 for YAML
            if ((e.ctrlKey || e.metaKey) && e.key === '1' && !e.target.matches('textarea, input')) {
                e.preventDefault();
                this.switchTab('yaml');
            }
            // Ctrl + 2 for EVM
            if ((e.ctrlKey || e.metaKey) && e.key === '2' && !e.target.matches('textarea, input')) {
                e.preventDefault();
                this.switchTab('evm');
            }
            // Ctrl + 3 for C
            if ((e.ctrlKey || e.metaKey) && e.key === '3' && !e.target.matches('textarea, input')) {
                e.preventDefault();
                this.switchTab('c');
            }
        });
    }
    
    switchTab(tabName) {
        if (this.currentTab === tabName) return;
        
        console.log(`[CodeTabsController] Switching to ${tabName} tab`);
        
        // Save current tab content
        this.saveCurrentTabContent();
        
        // Update current tab
        this.currentTab = tabName;
        
        // Update active classes
        document.querySelectorAll('.code-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        
        document.querySelectorAll('.code-tab-content').forEach(content => {
            content.classList.toggle('active', content.dataset.tab === tabName);
        });
        
        // Update action buttons
        this.updateTabActions();
        
        // Load tab content
        this.loadTabContent(tabName);
    }
    
    saveCurrentTabContent() {
        const textarea = this.getCurrentTabTextarea();
        if (textarea) {
            this.codeContent[this.currentTab] = textarea.value;
        }
    }
    
    loadTabContent(tabName) {
        const textarea = document.getElementById(`${tabName}CodeBox`);
        if (!textarea) return;
        
        // If code was previously generated, show it
        if (this.codeContent[tabName]) {
            textarea.value = this.codeContent[tabName];
        } else {
            // Generate on first load
            this.generateCodeForTab(tabName);
        }
    }
    
    getCurrentTabTextarea() {
        const textareaId = `${this.currentTab}CodeBox`;
        return document.getElementById(textareaId);
    }
    
    updateTabActions() {
        const actionsContainer = document.getElementById('codeTabActions');
        if (!actionsContainer) return;
        
        const tabConfig = {
            yaml: {
                copyLabel: 'Copy YAML',
                fullscreenLabel: 'Fullscreen',
                updateLabel: 'Update Layout'
            },
            evm: {
                copyLabel: 'Copy EVM',
                fullscreenLabel: 'Fullscreen',
                updateLabel: 'Validate'
            },
            c: {
                copyLabel: 'Copy C',
                fullscreenLabel: 'Fullscreen',
                updateLabel: 'Download'
            }
        };
        
        const config = tabConfig[this.currentTab];
        
        actionsContainer.innerHTML = `
            <button id="copyCodeBtn" class="btn btn-secondary btn-xs">${config.copyLabel}</button>
            <button id="fullscreenCodeBtn" class="btn btn-secondary btn-xs">${config.fullscreenLabel}</button>
            <button id="updateCodeBtn" class="btn btn-secondary btn-xs">${config.updateLabel}</button>
        `;
        
        // Re-bind events
        this.bindActionButtons();
    }
    
    bindActionButtons() {
        // Copy button
        document.getElementById('copyCodeBtn')?.addEventListener('click', () => {
            this.copyCurrentTabCode();
        });
        
        // Fullscreen button
        document.getElementById('fullscreenCodeBtn')?.addEventListener('click', () => {
            this.showFullscreen();
        });
        
        // Update/Validate/Download button
        document.getElementById('updateCodeBtn')?.addEventListener('click', () => {
            this.handleUpdateAction();
        });
    }
    
    async updateCurrentTab() {
        if (this.isGenerating) return;
        
        this.isGenerating = true;
        this.showGeneratingIndicator();
        
        try {
            await this.generateCodeForTab(this.currentTab);
        } catch (error) {
            console.error('[CodeTabsController] Error generating code:', error);
            this.showError('Failed to generate code: ' + error.message);
        } finally {
            this.isGenerating = false;
            this.hideGeneratingIndicator();
        }
    }
    
    async generateCodeForTab(tabName) {
        console.log(`[CodeTabsController] Generating ${tabName} code...`);
        
        // Get current state
        const currentPage = window.AppState?.getCurrentPage() || { widgets: [] };
        const deviceModel = window.AppState?.deviceModel || 'esp32';
        const deviceProfile = window.DEVICE_PROFILES?.[deviceModel] || {};
        
        let generatedCode = '';
        
        try {
            switch(tabName) {
                case 'yaml':
                    generatedCode = await this.generateYamlCode(currentPage, deviceProfile);
                    break;
                    
                case 'evm':
                    generatedCode = await this.generateEVMCode(currentPage, deviceProfile);
                    break;
                    
                case 'c':
                    generatedCode = await this.generateCCode(currentPage, deviceProfile);
                    break;
                    
                default:
                    generatedCode = `// Unknown tab type: ${tabName}`;
            }
        } catch (error) {
            console.error(`[CodeTabsController] Error generating ${tabName}:`, error);
            generatedCode = `// Error generating ${tabName.toUpperCase()} code:
// ${error.message}
// 
// Stack trace:
// ${error.stack}`;
        }
        
        // Save and display code
        this.codeContent[tabName] = generatedCode;
        const textarea = document.getElementById(`${tabName}CodeBox`);
        if (textarea) {
            textarea.value = generatedCode;
            textarea.scrollTop = 0;
        }
        
        console.log(`[CodeTabsController] ${tabName} code generated (${generatedCode.length} chars)`);
        return generatedCode;
    }
    
    async generateYamlCode(page, deviceProfile) {
        console.log('[CodeTabsController] Getting YAML...');
        
        // Method 1: Use existing snippetBox
        const snippetBox = document.getElementById('snippetBox');
        if (snippetBox && snippetBox.value && snippetBox.value.length > 50) {
            console.log(`[CodeTabsController] Using existing snippetBox content (${snippetBox.value.length} chars)`);
            return snippetBox.value;
        }
        
        // Method 2: Use generateSnippetLocally from main project
        if (typeof generateSnippetLocally === 'function') {
            try {
                console.log('[CodeTabsController] Calling generateSnippetLocally()');
                const yaml = await generateSnippetLocally();
                
                if (!yaml || typeof yaml !== 'string') {
                    throw new Error('Invalid return value from generateSnippetLocally');
                }
                
                console.log(`[CodeTabsController] Generated YAML (${yaml.length} chars)`);
                
                // Also save to snippetBox
                if (snippetBox) {
                    snippetBox.value = yaml;
                }
                
                return yaml;
            } catch (error) {
                console.error('[CodeTabsController] generateSnippetLocally failed:', error);
            }
        } else {
            console.error('[CodeTabsController] generateSnippetLocally is not available');
        }
        
        // Method 3: Use app.updateSnippetBox if available
        if (window.app && typeof window.app.updateSnippetBox === 'function') {
            try {
                console.log('[CodeTabsController] Using app.updateSnippetBox');
                window.app.updateSnippetBox();
                
                // Wait for value to be populated
                await new Promise(resolve => setTimeout(resolve, 500));
                
                if (snippetBox && snippetBox.value && snippetBox.value.length > 50) {
                    console.log(`[CodeTabsController] Got YAML after update (${snippetBox.value.length} chars)`);
                    return snippetBox.value;
                }
            } catch (error) {
                console.error('[CodeTabsController] app.updateSnippetBox failed:', error);
            }
        }
        
        // Method 4: Fallback
        console.warn('[CodeTabsController] Using fallback YAML generator');
        return this.generateFallbackYAML(page, deviceProfile);
    }
    
    generateFallbackYAML(page, deviceProfile) {
        const widgetCount = page.widgets?.length || 0;
        const width = deviceProfile.width || 240;
        const height = deviceProfile.height || 240;
        const board = deviceProfile.board || 'esp32dev';
        
        return `# ESPHome YAML Configuration - Fallback Generator
# Generated: ${new Date().toLocaleString()}
# Widgets: ${widgetCount}
# Display: ${width}x${height}
# Device: ${deviceProfile.name || 'ESP32'}

esphome:
  name: "lvgl_display"
  platform: ESP32
  board: ${board}
  framework:
    type: esp-idf
    version: 5.4.2

wifi:
  ssid: "YourWiFiSSID"
  password: "YourWiFiPassword"

api:
  encryption:
    key: "YOUR_ENCRYPTION_KEY"

ota:
  password: "YOUR_OTA_PASSWORD"

logger:

display:
  - platform: lvgl
    id: lvgl_display
    width: ${width}
    height: ${height}
    rotation: 0
    update_interval: 60s

# Add your widget configurations here
# Note: Use the visual editor to generate widget configurations`;
    }
    
    async generateEVMCode(page, deviceProfile) {
        // Method 1: Use real EVMCodeGenerator
        if (this.evmGenerator && typeof this.evmGenerator.generate === 'function') {
            try {
                const context = {
                    getCurrentPage: () => page,
                    deviceModel: window.AppState?.deviceModel || 'esp32',
                    getLayout: () => window.AppState?.getLayout?.() || { name: 'LVGL App' }
                };
                const code = await this.evmGenerator.generate(context);
                
                if (code && typeof code === 'string' && code.length > 10) {
                    console.log(`[CodeTabsController] EVM code from generator (${code.length} chars)`);
                    return code;
                }
            } catch (error) {
                console.error('[CodeTabsController] EVMCodeGenerator.generate failed:', error);
            }
        }
        
        // Method 2: Fallback generator
        console.warn('[CodeTabsController] Using fallback EVM generator');
        return this.generateFallbackEVMCode(page, deviceProfile);
    }
    
    generateFallbackEVMCode(page, deviceProfile) {
        const widgets = page.widgets || [];
        const widgetCount = widgets.length;
        const width = deviceProfile.width || 240;
        const height = deviceProfile.height || 240;
        
        let widgetCode = '';
        
        if (widgetCount > 0) {
            widgets.forEach((widget, index) => {
                const varName = `widget${index + 1}`;
                const type = widget.type || 'obj';
                const props = widget.properties || {};
                
                widgetCode += `\n    // ${type} ${index + 1}\n`;
                widgetCode += `    ${varName} = lv.obj_create(scr);\n`;
                
                if (props.x !== undefined && props.y !== undefined) {
                    widgetCode += `    lv.obj_set_pos(${varName}, ${props.x}, ${props.y});\n`;
                }
                if (props.width !== undefined && props.height !== undefined) {
                    widgetCode += `    lv.obj_set_size(${varName}, ${props.width}, ${props.height});\n`;
                }
                
                if (type === 'lvgl_label' && props.text) {
                    widgetCode += `    lv.label_set_text(${varName}, "${props.text}");\n`;
                }
                
                if (props.color) {
                    widgetCode += `    lv.obj_set_style_bg_color(${varName}, lv.color_hex(0x${props.color.toString(16)}), 0);\n`;
                }
            });
        } else {
            widgetCode = '    // No widgets to display\n';
        }
        
        return `// EVM JavaScript - Fallback Generator
// Generated: ${new Date().toLocaleString()}
// Widgets: ${widgetCount} | Display: ${width}x${height}
// Target: EVM Runtime (ESP32/Linux)

const lv = require('@native.lvgl');
const Timer = require('@native.timer');

console.log("Starting EVM application with ${widgetCount} widgets");

// Get active screen
const scr = lv.scr_act();

// Create widgets${widgetCode}

// Main application loop
while (true) {
    lv.task_handler();
    Timer.delay(100);
}`;
    }
    
    async generateCCode(page, deviceProfile) {
        // Method 1: Use real CCodeGenerator
        if (this.cGenerator && typeof this.cGenerator.generate === 'function') {
            try {
                const state = {
                    getCurrentPage: () => page,
                    deviceModel: window.AppState?.deviceModel || 'esp32',
                    settings: window.AppState?.settings || {},
                    ...window.AppState
                };
                const code = await this.cGenerator.generate(state);
                
                if (code && typeof code === 'string' && code.length > 10) {
                    console.log(`[CodeTabsController] C code from generator (${code.length} chars)`);
                    return code;
                }
            } catch (error) {
                console.error('[CodeTabsController] CCodeGenerator.generate failed:', error);
            }
        }
        
        // Method 2: Fallback generator
        console.warn('[CodeTabsController] Using fallback C generator');
        return this.generateFallbackCCode(page, deviceProfile);
    }
    
    generateFallbackCCode(page, deviceProfile) {
        const widgets = page.widgets || [];
        const widgetCount = widgets.length;
        const width = deviceProfile.width || 240;
        const height = deviceProfile.height || 240;
        
        let widgetCode = '';
        
        if (widgetCount > 0) {
            widgets.forEach((widget, index) => {
                const varName = `widget${index + 1}`;
                const type = widget.type || 'obj';
                const props = widget.properties || {};
                
                widgetCode += `\n    // ${type} ${index + 1}\n`;
                widgetCode += `    ${varName} = lv_${type.replace('lvgl_', '')}_create(scr);\n`;
                
                if (props.x !== undefined && props.y !== undefined) {
                    widgetCode += `    lv_obj_set_pos(${varName}, ${props.x}, ${props.y});\n`;
                }
                if (props.width !== undefined && props.height !== undefined) {
                    widgetCode += `    lv_obj_set_size(${varName}, ${props.width}, ${props.height});\n`;
                }
                
                if (type === 'lvgl_label' && props.text) {
                    widgetCode += `    lv_label_set_text(${varName}, "${props.text}");\n`;
                }
                
                if (props.color) {
                    widgetCode += `    lv_obj_set_style_bg_color(${varName}, lv_color_hex(0x${props.color.toString(16)}), 0);\n`;
                }
            });
        } else {
            widgetCode = '    // No widgets to create\n';
        }
        
        return `/*
 * C Code for ESP32/LVGL - Fallback Generator
 * Generated: ${new Date().toLocaleString()}
 * Widgets: ${widgetCount}
 * Display: ${width}x${height}
 */

#include "lvgl.h"
#include "esp_log.h"

static const char *TAG = "main_app";

// Function prototypes
void create_ui(lv_obj_t* parent);

// Main application
void app_main(void) {
    ESP_LOGI(TAG, "Starting LVGL application");
    ESP_LOGI(TAG, "Display: %dx%d", ${width}, ${height});
    
    // Initialize LVGL
    lv_init();
    
    // Create UI
    create_ui(lv_scr_act());
    
    // Main loop
    while (1) {
        lv_timer_handler();
        vTaskDelay(pdMS_TO_TICKS(5));
    }
}

// Create user interface
void create_ui(lv_obj_t* parent) {${widgetCode}
}`;
    }
    
    showGeneratingIndicator() {
        const actionsContainer = document.getElementById('codeTabActions');
        if (actionsContainer && !actionsContainer.querySelector('.generating-indicator')) {
            const indicator = document.createElement('div');
            indicator.className = 'generating-indicator';
            indicator.innerHTML = `
                <div class="spinner"></div>
                <span>Generating...</span>
            `;
            actionsContainer.appendChild(indicator);
        }
    }
    
    hideGeneratingIndicator() {
        const indicator = document.querySelector('.generating-indicator');
        if (indicator) {
            indicator.remove();
        }
    }
    
    copyCurrentTabCode() {
        const textarea = this.getCurrentTabTextarea();
        if (textarea && textarea.value) {
            textarea.select();
            document.execCommand('copy');
            
            const tabNames = {
                yaml: 'YAML',
                evm: 'EVM Script',
                c: 'C Code'
            };
            
            this.showToast(`${tabNames[this.currentTab]} copied to clipboard`);
        }
    }
    
    showFullscreen() {
        const textarea = this.getCurrentTabTextarea();
        if (!textarea || !textarea.value) return;
        
        const tabNames = {
            yaml: 'ESPHome YAML',
            evm: 'EVM Script',
            c: 'C Code'
        };
        
        const modal = document.createElement('div');
        modal.className = 'fullscreen-modal';
        modal.innerHTML = `
            <div class="fullscreen-header">
                <h3 style="margin: 0; font-size: 16px;">${tabNames[this.currentTab]} (Fullscreen)</h3>
                <div class="fullscreen-actions">
                    <button id="fullscreenCopy" class="btn btn-secondary btn-xs">Copy</button>
                    <button id="closeFullscreen" class="btn btn-secondary btn-xs">Close (Esc)</button>
                </div>
            </div>
            <textarea class="fullscreen-textarea" spellcheck="false">${textarea.value}</textarea>
        `;
        
        document.body.appendChild(modal);
        
        // Focus and select all
        const fullscreenTextarea = modal.querySelector('.fullscreen-textarea');
        fullscreenTextarea.focus();
        fullscreenTextarea.select();
        
        // Apply syntax highlighting class
        fullscreenTextarea.classList.add(`${this.currentTab}-code`);
        
        // Event handlers
        modal.querySelector('#closeFullscreen').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.querySelector('#fullscreenCopy').addEventListener('click', () => {
            fullscreenTextarea.select();
            document.execCommand('copy');
            this.showToast('Copied to clipboard');
        });
        
        // Close on Escape
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.body.removeChild(modal);
            }
        });
    }
    
    handleUpdateAction() {
        switch(this.currentTab) {
            case 'yaml':
                this.updateLayoutFromYAML();
                break;
            case 'evm':
                this.validateEVMScript();
                break;
            case 'c':
                this.downloadCCode();
                break;
        }
    }
    
    updateLayoutFromYAML() {
        const textarea = document.getElementById('yamlCodeBox');
        if (textarea && textarea.value) {
            this.showToast('YAML import functionality would parse and update canvas');
            console.log('Importing YAML:', textarea.value.substring(0, 200));
            
            // Here you would call your YAML import function
            // Example: importYAMLFromText(textarea.value);
        }
    }
    
    validateEVMScript() {
        const textarea = document.getElementById('evmCodeBox');
        if (textarea && textarea.value) {
            const code = textarea.value;
            const errors = [];
            
            // Simple validation
            if (!code.includes('require')) {
                errors.push('Missing require statements');
            }
            if (!code.includes('lv.')) {
                errors.push('Missing LVGL function calls');
            }
            if (!code.includes('while') && !code.includes('loop')) {
                errors.push('Missing main loop');
            }
            
            if (errors.length === 0) {
                this.showToast('✓ EVM Script is valid');
            } else {
                this.showToast(`⚠ Issues found: ${errors.join(', ')}`);
            }
        }
    }
    
    downloadCCode() {
        const textarea = document.getElementById('cCodeBox');
        if (!textarea || !textarea.value) return;
        
        const filename = `esp32_lvgl_${Date.now()}.c`;
        const blob = new Blob([textarea.value], { type: 'text/x-c' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast(`Downloaded: ${filename}`);
    }
    
    showToast(message, type = 'info') {
        // Remove existing toasts
        document.querySelectorAll('.code-tabs-toast').forEach(toast => toast.remove());
        
        const toast = document.createElement('div');
        toast.className = 'code-tabs-toast';
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${type === 'error' ? '#f44336' : '#2196f3'};
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            z-index: 10000;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            animation: fadeIn 0.3s ease;
            max-width: 300px;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                if (toast.parentNode) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
    
    showError(message) {
        console.error('[CodeTabsController] Error:', message);
        this.showToast(message, 'error');
    }
}

// Wait for DOM to load and initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Small delay to ensure other scripts are loaded
        setTimeout(() => {
            if (!window.codeTabsController) {
                window.codeTabsController = new CodeTabsController();
                console.log('[CodeTabsController] Initialized on DOMContentLoaded');
            }
        }, 1000);
    });
} else {
    // DOM already loaded
    setTimeout(() => {
        if (!window.codeTabsController) {
            window.codeTabsController = new CodeTabsController();
            console.log('[CodeTabsController] Initialized on ready');
        }
    }, 1000);
}

// Add CSS animations if not already present
if (!document.querySelector('style[data-toast-animations]')) {
    const style = document.createElement('style');
    style.setAttribute('data-toast-animations', 'true');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fadeOut {
            from { opacity: 1; transform: translateY(0); }
            to { opacity: 0; transform: translateY(10px); }
        }
    `;
    document.head.appendChild(style);
}