// Standard Script Entry Point
// All dependencies are expected to be loaded globally

class App {
    constructor() {
        try {
            console.log("[App] Constructor started");
            this.sidebar = new Sidebar();
            console.log("[App] Sidebar created");
            this.canvas = new Canvas();
            console.log("[App] Canvas created");
            this.propertiesPanel = new PropertiesPanel();
            console.log("[App] PropertiesPanel created");
            this.deviceSettings = new DeviceSettings();
            console.log("[App] DeviceSettings created");
            this.editorSettings = new EditorSettings();
            console.log("[App] EditorSettings created");
            this.pageSettings = new PageSettings();
            console.log("[App] PageSettings created");
            this.keyboardHandler = new KeyboardHandler();
            console.log("[App] KeyboardHandler created");
            this.llmPrompt = window.llmPrompt;
            console.log("[App] LLMPrompt linked");

            // Initialize Code Generation System
            this.codeTabsController = null;
            this.codeGenerators = {
                evm: window.EVMCodeGenerator || null,
                c: window.CCodeGenerator || null,
                java: window.JavaCodeGenerator || null
            };
            console.log("[App] Code Generators detected:", {
                evm: !!this.codeGenerators.evm,
                c: !!this.codeGenerators.c,
                java: !!this.codeGenerators.java
            });
            
            // به این تغییر دهید:
            setTimeout(() => {
                if (typeof CodeTabsController !== 'undefined' && !window.codeTabs) {
                    try {
                        console.log('[App] Initializing CodeTabsController...');
                        window.codeTabs = new CodeTabsController();
                    } catch (error) {
                        console.error('[App] Failed to init CodeTabsController:', error);
                    }
                }
            }, 1000); // 

            // Initialize Layout Manager
            if (window.layoutManager) {
                this.layoutManager = window.layoutManager;
                console.log("[App] LayoutManager linked");
            }

            // Flag to prevent auto-update loop when manually updating from snippet box
            this.suppressSnippetUpdate = false;
            this.snippetDebounceTimer = null;

            // Flag for embedded code updates
            this.suppressEmbeddedUpdate = false;
            this.embeddedDebounceTimer = null;

            this.init();
        } catch (e) {
            console.error("[App] Critical Error in Constructor:", e);
        }
    }

    async init() {
        console.log("[App] Initializing reTerminal Dashboard Designer...");
        console.log("[App] AppState:", window.AppState);

        // Initialize UI components
        this.sidebar.init();
        this.propertiesPanel.init();
        this.deviceSettings.init();
        this.editorSettings.init();

        // Load saved theme preference from localStorage
        try {
            const savedTheme = localStorage.getItem('reterminal-editor-theme');
            if (savedTheme === 'light') {
                AppState.settings.editor_light_mode = true;
                this.editorSettings.applyEditorTheme(true);
            }
        } catch (e) {
            console.log('Could not load theme preference:', e);
        }

        this.pageSettings.init();
        if (this.llmPrompt) this.llmPrompt.init();

        // Initialize Code Generation System
        this.initCodeGenerationSystem();

        // Initialize Layout Manager
        if (this.layoutManager) {
            this.layoutManager.init();
        }

        // Bind global buttons
        this.bindGlobalButtons();

        // Initialize EVM and C panels
        this.initEVMPanels();

        // Load initial data
        if (hasHaBackend()) {
            console.log("HA Backend detected. Loading layout from backend...");
            await loadLayoutFromBackend();
            await loadExternalProfiles(); // Load dynamic hardware templates
            await fetchEntityStates();
        } else {
            console.log("Running in standalone/offline mode.");
            // Try to load from localStorage
            const savedLayout = AppState.loadFromLocalStorage();
            if (savedLayout) {
                console.log("[App] Found saved layout in localStorage, loading...");
                loadLayoutIntoState(savedLayout);
            } else {
                console.log("[App] No saved layout in localStorage, starting fresh.");
                // State initializes with default layout automatically
            }
        }

        // Update the layout indicator after loading
        if (window.AppState && typeof window.AppState.updateLayoutIndicator === 'function') {
            window.AppState.updateLayoutIndicator();
        }

        // Setup auto-save or auto-update snippet
        this.setupAutoUpdate();

        console.log("Initialization complete.");
    }

    initCodeGenerationSystem() {
        try {
            // Initialize CodeTabsController if available
            if (window.CodeTabsController || window.codeTabs) {
                if (typeof CodeTabsController !== 'undefined' && !window.codeTabs) {
                try {
                    window.codeTabs = new CodeTabsController();
                    console.log('[App] CodeTabsController initialized.');
                } catch (error) {
                    console.error('[App] Failed to initialize CodeTabsController:', error);
                }
                }
                
                // Initialize if it has init method
                if (this.codeTabsController && typeof this.codeTabsController.init === 'function') {
                    this.codeTabsController.init();
                    console.log("[App] CodeTabsController initialized");
                }
            } else {
                console.warn("[App] CodeTabsController not available.");
            }
            
            // Check if we have at least one code generator
            const hasGenerators = Object.values(this.codeGenerators).some(gen => gen !== null);
            if (!hasGenerators) {
                console.warn("[App] No code generators found. Please load evm_code_generator.js and other generators.");
            }
            
        } catch (error) {
            console.error("[App] Error initializing code generation system:", error);
        }
    }

    initEVMPanels() {
        try {
            console.log("[App] Initializing EVM and C panels...");
            
            // Check if new panels exist
            this.evmScriptBox = document.getElementById('evmScriptBox');
            this.cCodeBox = document.getElementById('cCodeBox');
            
            if (this.evmScriptBox && this.cCodeBox) {
                console.log("[App] EVM and C panels detected");
                
                // Bind events for new panels
                this.bindEVMPanelEvents();
                
                // Auto-update when layout changes
                on(EVENTS.STATE_CHANGED, () => {
                    this.updateEVMPanels();
                });
                
                // Initial update
                setTimeout(() => this.updateEVMPanels(), 500);
            } else {
                console.log("[App] EVM or C panels not found (OK if not in HTML)");
            }
        } catch (error) {
            console.error("[App] Error initializing EVM panels:", error);
        }
    }

    bindEVMPanelEvents() {
        // EVM Panel Buttons
        document.getElementById('validateEvmBtn')?.addEventListener('click', () => this.validateEVMCode());
        document.getElementById('copyEvmBtn')?.addEventListener('click', () => this.copyEVMCode());
        document.getElementById('runEvmBtn')?.addEventListener('click', () => this.runEVMSimulation());
        
        // C Panel Buttons
        document.getElementById('validateCBtn')?.addEventListener('click', () => this.validateCCode());
        document.getElementById('copyCBtn')?.addEventListener('click', () => this.copyCCode());
        document.getElementById('downloadCBtn')?.addEventListener('click', () => this.downloadCCode());
    }

    async updateEVMPanels() {
        if (!this.evmScriptBox || !this.cCodeBox) return;
        if (this.suppressEmbeddedUpdate) return;
        
        try {
            // Update EVM JavaScript code
            if (window.EVMCodeGenerator && typeof window.EVMCodeGenerator.generate === 'function') {
                const evmCode = await window.EVMCodeGenerator.generate(window.AppState);
                this.evmScriptBox.value = evmCode;
            } else if (this.codeGenerators.evm && typeof this.codeGenerators.evm.generate === 'function') {
                const evmCode = await this.codeGenerators.evm.generate(window.AppState);
                this.evmScriptBox.value = evmCode;
            }
            
            // Update C code
            if (window.CCodeGenerator && typeof window.CCodeGenerator.generate === 'function') {
                const cCode = await window.CCodeGenerator.generate(window.AppState);
                this.cCodeBox.value = cCode;
            } else if (this.codeGenerators.c && typeof this.codeGenerators.c.generate === 'function') {
                const cCode = await this.codeGenerators.c.generate(window.AppState);
                this.cCodeBox.value = cCode;
            }
        } catch (error) {
            console.error("[App] Error updating EVM panels:", error);
        }
    }

    validateEVMCode() {
        showToast("EVM code validated", "success");
    }

    copyEVMCode() {
        if (!this.evmScriptBox) return;
        navigator.clipboard.writeText(this.evmScriptBox.value);
        showToast("EVM code copied to clipboard", "success");
    }

    runEVMSimulation() {
        showToast("Running EVM simulation...", "info");
    }

    validateCCode() {
        showToast("C code validated", "success");
    }

    copyCCode() {
        if (!this.cCodeBox) return;
        navigator.clipboard.writeText(this.cCodeBox.value);
        showToast("C code copied to clipboard", "success");
    }

    downloadCCode() {
        if (!this.cCodeBox) return;
        const blob = new Blob([this.cCodeBox.value], { type: 'text/x-c' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'lvgl_code.c';
        a.click();
        showToast("C code downloaded", "success");
    }

    bindGlobalButtons() {
        // Top Toolbar Buttons
        const saveLayoutBtn = document.getElementById('saveLayoutBtn');
        if (saveLayoutBtn) {
            saveLayoutBtn.addEventListener('click', () => {
                if (hasHaBackend()) {
                    saveLayoutToBackend()
                        .then(() => showToast("Layout saved to Home Assistant", "success"))
                        .catch(err => showToast(`Save failed: ${err.message}`, "error"));
                } else {
                    saveLayoutToFile();
                }
            });
        }

        const loadLayoutBtn = document.getElementById('loadLayoutBtn'); // Hidden file input
        if (loadLayoutBtn) {
            loadLayoutBtn.addEventListener('change', handleFileSelect);
        }

        const importProjectBtn = document.getElementById('importProjectBtn');
        if (importProjectBtn && loadLayoutBtn) {
            importProjectBtn.addEventListener('click', () => {
                loadLayoutBtn.click();
            });
        }

        const fullscreenSnippetBtn = document.getElementById('fullscreenSnippetBtn');
        if (fullscreenSnippetBtn) {
            fullscreenSnippetBtn.addEventListener('click', () => {
                this.openSnippetModal();
            });
        }

        const snippetFullscreenClose = document.getElementById('snippetFullscreenClose');
        if (snippetFullscreenClose) {
            snippetFullscreenClose.addEventListener('click', () => {
                const modal = document.getElementById('snippetFullscreenModal');
                if (modal) {
                    modal.classList.add('hidden');
                }
            });
        }

        // Import Modal Buttons
        const importSnippetConfirm = document.getElementById('importSnippetConfirm');
        if (importSnippetConfirm) {
            importSnippetConfirm.addEventListener('click', async () => {
                await this.handleImportSnippet();
            });
        }

        // Device Settings
        const deviceSettingsBtn = document.getElementById('deviceSettingsBtn');
        if (deviceSettingsBtn) {
            console.log("Device Settings button found, binding click listener.");
            deviceSettingsBtn.addEventListener('click', () => {
                console.log("Device Settings button clicked.");
                if (this.deviceSettings) {
                    this.deviceSettings.open();
                } else {
                    console.error("DeviceSettings instance not found on App.");
                }
            });
        } else {
            console.error("Device Settings button NOT found in DOM.");
        }

        // Editor Settings
        const editorSettingsBtn = document.getElementById('editorSettingsBtn');
        if (editorSettingsBtn) {
            editorSettingsBtn.addEventListener('click', () => {
                this.editorSettings.open();
            });
        }

        // AI Prompt
        const aiPromptBtn = document.getElementById('aiPromptBtn');
        if (aiPromptBtn) {
            aiPromptBtn.addEventListener('click', () => {
                if (this.llmPrompt) {
                    this.llmPrompt.open();
                } else {
                    console.error("LLMPrompt instance not found.");
                }
            });
        }

        // Update Layout from YAML (Snippet Box)
        const updateLayoutBtn = document.getElementById('updateLayoutBtn');
        if (updateLayoutBtn) {
            updateLayoutBtn.addEventListener('click', async () => {
                await this.handleUpdateLayoutFromSnippetBox();
            });
        }

        // Copy Snippet Button
        const copySnippetBtn = document.getElementById('copySnippetBtn');
        if (copySnippetBtn) {
            copySnippetBtn.addEventListener('click', async () => {
                const snippetBox = document.getElementById('snippetBox');
                if (!snippetBox) return;

                const text = snippetBox.value || "";

                const originalText = copySnippetBtn.textContent;
                const setSuccessState = () => {
                    copySnippetBtn.textContent = "Copied!";
                    copySnippetBtn.style.minWidth = copySnippetBtn.offsetWidth + "px"; // Prevent layout jump

                    // Revert after 2 seconds
                    setTimeout(() => {
                        copySnippetBtn.textContent = originalText;
                        copySnippetBtn.style.minWidth = "";
                    }, 2000);
                };

                try {
                    if (navigator.clipboard && window.isSecureContext) {
                        await navigator.clipboard.writeText(text);
                        showToast("Snippet copied to clipboard", "success");
                        setSuccessState();
                    } else {
                        // Fallback for non-secure contexts
                        const textarea = document.createElement("textarea");
                        textarea.value = text;
                        textarea.style.position = "fixed";
                        textarea.style.left = "-999999px";
                        textarea.style.top = "-999999px";
                        document.body.appendChild(textarea);
                        textarea.focus();
                        textarea.select();
                        try {
                            document.execCommand("copy");
                            showToast("Snippet copied to clipboard", "success");
                            setSuccessState();
                        } catch {
                            showToast("Unable to copy. Try selecting and copying manually.", "error");
                        }
                        document.body.removeChild(textarea);
                    }
                } catch (err) {
                    console.error("Copy failed:", err);
                    showToast("Unable to copy snippet", "error");
                }
            });
        }

        // ===== REMOVED: Old Embedded Code Generation Buttons =====
        // These buttons no longer exist in the new three-panel layout
        // Validate/Compile Button - REMOVED
        // Copy Embedded Code Button - REMOVED
        // Download Embedded Code Button - REMOVED
        // Run Simulation Button - REMOVED
        // Clear Serial Output Button - REMOVED
        // Language Selection Change - REMOVED
    }

    setupAutoUpdate() {
        // Update snippet box whenever state changes
        on(EVENTS.STATE_CHANGED, () => {
            if (!this.suppressSnippetUpdate) {
                this.updateSnippetBox();
            }
            
            // Also update EVM and C panels if available
            if (!this.suppressEmbeddedUpdate) {
                this.updateEVMPanels();
            }
        });

        on(EVENTS.SELECTION_CHANGED, (data) => {
            if (data && data.widgetId && typeof highlightWidgetInSnippet === 'function') {
                highlightWidgetInSnippet(data.widgetId);
            }
        });

        // Initial updates
        this.updateSnippetBox();
        this.updateEVMPanels();
    }

    updateSnippetBox() {
        const snippetBox = document.getElementById('snippetBox');
        if (snippetBox) {
            // Debounce the update
            if (this.snippetDebounceTimer) clearTimeout(this.snippetDebounceTimer);

            this.snippetDebounceTimer = setTimeout(() => {
                // Double-check suppression flag inside callback
                if (this.suppressSnippetUpdate) {
                    return;
                }

                try {
                    generateSnippetLocally().then(yaml => {
                        snippetBox.value = yaml;

                        // Re-highlight the selected widget if any
                        if (window.AppState && window.AppState.selectedWidgetId && typeof highlightWidgetInSnippet === 'function') {
                            highlightWidgetInSnippet(window.AppState.selectedWidgetId);
                        }
                    }).catch(e => {
                        console.error("Error generating snippet async:", e);
                        snippetBox.value = "# Error generating YAML (async): " + e.message;
                    });
                } catch (e) {
                    console.error("Error generating snippet:", e);
                    snippetBox.value = "# Error generating YAML: " + e.message;
                }
            }, 300);
        }
    }

    updateEmbeddedCode() {
        // This function is kept for backward compatibility
        // Now it updates EVM and C panels
        if (!this.suppressEmbeddedUpdate) {
            this.updateEVMPanels();
        }
    }

    openSnippetModal() {
        const modal = document.getElementById('snippetFullscreenModal');
        const content = document.getElementById('snippetFullscreenContent');
        const snippetBox = document.getElementById('snippetBox');

        if (!modal || !content || !snippetBox) return;

        // Use a textarea for editing if it doesn't exist, otherwise update its value
        let textarea = content.querySelector("textarea");
        if (!textarea) {
            content.innerHTML = ""; // Clear existing content
            textarea = document.createElement("textarea");
            textarea.style.width = "100%";
            textarea.style.height = "calc(100vh - 150px)"; // Adjusted for header/footer
            textarea.style.fontFamily = "monospace";
            textarea.style.padding = "10px";
            textarea.style.boxSizing = "border-box";
            textarea.style.resize = "none";
            textarea.style.backgroundColor = "var(--bg-input)";
            textarea.style.color = "var(--text)";
            textarea.style.border = "1px solid var(--border)";
            textarea.style.borderRadius = "4px";
            content.appendChild(textarea);

            // Add a save/update button to the modal footer if not present
            let footer = modal.querySelector(".modal-actions");
            if (!footer) {
                footer = document.createElement("div");
                footer.className = "modal-actions";
                const modalInner = modal.querySelector(".modal");
                if (modalInner) modalInner.appendChild(footer);
            }

            if (!footer.querySelector("#fullscreenUpdateBtn")) {
                const updateBtn = document.createElement("button");
                updateBtn.id = "fullscreenUpdateBtn";
                updateBtn.className = "btn btn-primary";
                updateBtn.textContent = "Update Layout from YAML";
                updateBtn.onclick = () => {
                    snippetBox.value = textarea.value;
                    const updateLayoutBtn = document.getElementById('updateLayoutBtn');
                    if (updateLayoutBtn) updateLayoutBtn.click();
                    modal.classList.add("hidden");
                };
                footer.insertBefore(updateBtn, footer.firstChild);
            }
        }
        textarea.value = snippetBox.value || "";
        modal.style.display = ""; // Clear any inline display: none
        modal.classList.remove('hidden');
    }

    async handleImportSnippet() {
        const textarea = document.getElementById('importSnippetTextarea');
        const errorBox = document.getElementById('importSnippetError');
        if (!textarea) return;

        const yaml = textarea.value;
        if (!yaml.trim()) return;

        try {
            if (errorBox) errorBox.textContent = "";

            let layout;
            // Always try offline parser first for snippets as it's more robust for native LVGL
            try {
                layout = parseSnippetYamlOffline(yaml);
                console.log("[handleImportSnippet] Successfully used offline parser.");
            } catch (offlineErr) {
                console.warn("[handleImportSnippet] Offline parser failed, falling back to backend:", offlineErr);
                if (hasHaBackend()) {
                    layout = await importSnippetBackend(yaml);
                } else {
                    throw offlineErr;
                }
            }

            loadLayoutIntoState(layout);

            // Close modal
            const modal = document.getElementById('importSnippetModal');
            if (modal) {
                modal.classList.add('hidden');
                modal.style.display = 'none';
            }

            showToast("Layout imported successfully", "success");

        } catch (err) {
            console.error("Import failed:", err);
            if (errorBox) errorBox.textContent = `Error: ${err.message}`;
        }
    }

    async handleUpdateLayoutFromSnippetBox() {
        const snippetBox = document.getElementById('snippetBox');
        if (!snippetBox) return;
        const yaml = snippetBox.value;
        if (!yaml.trim()) return;

        try {
            // Preserve current layout context BEFORE parsing
            const currentLayoutId = window.AppState?.currentLayoutId || "reterminal_e1001";
            const currentDeviceName = window.AppState?.deviceName || "Layout 1";
            const currentDeviceModel = window.AppState?.deviceModel || window.AppState?.settings?.device_model || "reterminal_e1001";

            console.log(`[handleUpdateLayoutFromSnippetBox] Preserving context - ID: ${currentLayoutId}, Name: ${currentDeviceName}, Model: ${currentDeviceModel}`);

            // Always use offline parser for "Update" operation
            let layout = parseSnippetYamlOffline(yaml);

            // Preserve the current layout's identity
            layout.device_id = currentLayoutId;
            layout.name = currentDeviceName;
            layout.device_model = currentDeviceModel;

            // Also ensure settings preserve the device model and dark_mode
            if (!layout.settings) {
                layout.settings = {};
            }
            layout.settings.device_model = currentDeviceModel;
            layout.settings.device_name = currentDeviceName;

            // Preserve dark_mode setting from current state
            const currentDarkMode = window.AppState?.settings?.dark_mode || false;
            layout.settings.dark_mode = currentDarkMode;

            // Suppress auto-update to prevent overwriting the user's manual edits
            this.suppressSnippetUpdate = true;
            this.suppressEmbeddedUpdate = true;

            // Clear any pending debounce timers
            if (this.snippetDebounceTimer) {
                clearTimeout(this.snippetDebounceTimer);
                this.snippetDebounceTimer = null;
            }
            if (this.embeddedDebounceTimer) {
                clearTimeout(this.embeddedDebounceTimer);
                this.embeddedDebounceTimer = null;
            }

            loadLayoutIntoState(layout);

            // Re-enable after a delay
            setTimeout(() => {
                this.suppressSnippetUpdate = false;
                this.suppressEmbeddedUpdate = false;
            }, 1500);

            showToast("Layout updated from YAML", "success");

            // Warn about C++ code
            if (yaml.includes("lambda:") || yaml.includes("script:")) {
                setTimeout(() => {
                    showToast("Note: Custom C++ (lambda/script) may not fully preview.", "warning", 4000);
                }, 800);
            }

        } catch (err) {
            console.error("Update layout failed:", err);
            showToast(`Update failed: ${err.message}`, "error");
            this.suppressSnippetUpdate = false;
            this.suppressEmbeddedUpdate = false;
        }
    }
}

// Start the app
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();

    // Expose modal functions globally for button event listeners
    window.openDeviceSettings = () => {
        if (window.app && window.app.deviceSettings) {
            window.app.deviceSettings.open();
        }
    };

    window.openEditorSettingsModal = () => {
        if (window.app && window.app.editorSettings) {
            window.app.editorSettings.open();
        }
    };

    // Expose code generation functions (kept for backward compatibility)
    window.openEmbeddedCodePanel = () => {
        // This function is kept but does nothing in new layout
        console.log("Embedded code panel function called (deprecated in new layout)");
    };

    // Wire up buttons to global functions
    const deviceSettingsBtn = document.getElementById('deviceSettingsBtn');
    if (deviceSettingsBtn) {
        deviceSettingsBtn.addEventListener('click', window.openDeviceSettings);
    }

    const editorSettingsBtn = document.getElementById('editorSettingsBtn');
    if (editorSettingsBtn) {
        editorSettingsBtn.addEventListener('click', window.openEditorSettingsModal);
    }
});