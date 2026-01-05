// frontend/js/ui/tabs_manager.js - با اضافه شدن Preview
class TabsManager {
    constructor() {
        this.tabsContainer = document.getElementById('tabs-container');
        this.contentContainer = document.getElementById('content-container');
        this.init();
    }
    
    init() {
        this.addPreviewTab();
        this.setupEventListeners();
    }
    
    addPreviewTab() {
        if (!document.querySelector('.tab[data-tab="preview"]')) {
            const previewTab = document.createElement('div');
            previewTab.className = 'tab';
            previewTab.dataset.tab = 'preview';
            previewTab.innerHTML = `
                <span class="tab-icon">🔍</span>
                <span class="tab-text">Preview</span>
            `;
            
            const tabs = this.tabsContainer.querySelectorAll('.tab');
            if (tabs.length > 1) {
                this.tabsContainer.insertBefore(previewTab, tabs[tabs.length - 1]);
            } else {
                this.tabsContainer.appendChild(previewTab);
            }
            
            this.addPreviewContent();
        }
    }
    
    addPreviewContent() {
        const previewContent = document.createElement('div');
        previewContent.className = 'tab-content';
        previewContent.id = 'preview-content';
        previewContent.dataset.tab = 'preview';
        previewContent.style.display = 'none';
        previewContent.innerHTML = this.getPreviewHTML();
        
        this.contentContainer.appendChild(previewContent);
        this.initPreviewEngine();
    }
    
    getPreviewHTML() {
        return `
            <div class="preview-container" style="padding: 20px; height: calc(100vh - 150px); display: flex; flex-direction: column;">
                <div class="preview-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid #dee2e6;">
                    <h3>Interactive Preview</h3>
                    <div class="preview-controls" style="display: flex; gap: 10px; align-items: center;">
                        <button class="btn btn-sm btn-secondary" id="refresh-preview">
                            <i class="fas fa-sync-alt"></i> Refresh
                        </button>
                        <button class="btn btn-sm btn-primary" id="run-preview">
                            <i class="fas fa-play"></i> Run Preview
                        </button>
                        <select class="form-control-sm" id="preview-device" style="width: 150px;">
                            <option value="320x240">ESP32 320x240</option>
                            <option value="480x320">ESP32 480x320</option>
                            <option value="800x480">ESP32 800x480</option>
                        </select>
                    </div>
                </div>
                
                <div class="preview-canvas-container" style="display: flex; gap: 20px; flex: 1; overflow: hidden;">
                    <div class="device-frame" style="flex: 2; background: #f8f9fa; border-radius: 20px; padding: 20px; display: flex; flex-direction: column; align-items: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        <div class="device-screen" id="preview-screen" style="width: 320px; height: 240px; background: #000; border-radius: 5px; overflow: hidden; position: relative; border: 2px solid #333;">
                            <canvas id="preview-canvas" width="320" height="240" style="width: 100%; height: 100%; cursor: pointer;"></canvas>
                        </div>
                        <div class="device-label" style="margin-top: 15px; font-weight: bold; color: #495057;">ESP32 Display Preview</div>
                    </div>
                    
                    <div class="preview-info" style="flex: 1; background: #fff; border-radius: 10px; padding: 15px; border: 1px solid #dee2e6; overflow-y: auto;">
                        <h5>Widget Information</h5>
                        <div id="widget-info" style="margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 5px; min-height: 100px;">Click on any widget to see details</div>
                        <div class="preview-events" style="margin-top: 20px;">
                            <h6>Live Events</h6>
                            <div id="event-log" style="height: 200px; overflow-y: auto; background: #212529; color: #fff; padding: 10px; border-radius: 5px; font-family: monospace; font-size: 12px;"></div>
                        </div>
                    </div>
                </div>
                
                <div class="preview-console" style="margin-top: 20px; background: #212529; color: #fff; border-radius: 10px; padding: 15px;">
                    <h6>Preview Console</h6>
                    <div id="preview-console-output" style="height: 150px; overflow-y: auto; font-family: monospace; font-size: 12px; white-space: pre-wrap; margin-top: 10px;"></div>
                </div>
            </div>
        `;
    }
    
    initPreviewEngine() {
        this.canvas = document.getElementById('preview-canvas');
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.widgets = [];
        this.selectedWidget = null;
        this.isRunning = false;
        
        this.setupPreviewEvents();
        this.refreshPreview();
    }
    
    setupPreviewEvents() {
        // Refresh button
        document.getElementById('refresh-preview')?.addEventListener('click', () => this.refreshPreview());
        
        // Run/Stop button
        document.getElementById('run-preview')?.addEventListener('click', () => this.togglePreview());
        
        // Device selector
        document.getElementById('preview-device')?.addEventListener('change', (e) => this.changeDeviceSize(e.target.value));
        
        // Canvas click
        this.canvas?.addEventListener('click', (e) => this.handleCanvasClick(e));
        
        // Canvas hover
        this.canvas?.addEventListener('mousemove', (e) => this.handleCanvasHover(e));
        
        // Listen to widget changes
        if (window.AppState) {
            const originalSetWidgets = window.AppState.setWidgets;
            window.AppState.setWidgets = function(widgets) {
                originalSetWidgets.call(this, widgets);
                if (window.tabsManager && window.tabsManager.isPreviewRunning()) {
                    window.tabsManager.refreshPreview();
                }
            };
        }
    }
    
    changeDeviceSize(size) {
        const screen = document.getElementById('preview-screen');
        const [width, height] = size.split('x').map(Number);
        
        screen.style.width = width + 'px';
        screen.style.height = height + 'px';
        this.canvas.width = width;
        this.canvas.height = height;
        
        this.refreshPreview();
    }
    
    togglePreview() {
        this.isRunning = !this.isRunning;
        const btn = document.getElementById('run-preview');
        if (btn) {
            btn.innerHTML = this.isRunning ? 
                '<i class="fas fa-stop"></i> Stop Preview' : 
                '<i class="fas fa-play"></i> Run Preview';
            btn.className = this.isRunning ? 'btn btn-sm btn-danger' : 'btn btn-sm btn-primary';
        }
        
        if (this.isRunning) {
            this.refreshPreview();
        }
    }
    
    isPreviewRunning() {
        return this.isRunning;
    }
    
    refreshPreview() {
        if (!this.canvas || !this.ctx) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.loadPreviewWidgets();
        this.renderPreviewWidgets();
        this.logToPreviewConsole('Preview refreshed');
    }
    
    loadPreviewWidgets() {
        const appState = window.AppState || {};
        const currentPage = appState.getCurrentPage?.() || { widgets: [] };
        this.widgets = currentPage.widgets || [];
        
        this.widgets.forEach((widget, index) => {
            widget._id = widget.id || `widget_${index}`;
            widget._type = widget.type || 'obj';
            widget._props = widget.props || {};
            widget._x = widget.x || 0;
            widget._y = widget.y || 0;
            widget._width = widget.width || 100;
            widget._height = widget.height || 40;
            widget._isActive = true;
        });
    }
    
    renderPreviewWidgets() {
        this.widgets.forEach(widget => {
            if (!widget._isActive) return;
            
            this.drawPreviewWidget(widget);
        });
    }
    
    drawPreviewWidget(widget) {
        const { _x, _y, _width, _height, _type, _props } = widget;
        
        this.ctx.save();
        
        switch(_type) {
            case 'lvgl_button':
                this.drawButton(widget);
                break;
            case 'lvgl_label':
                this.drawLabel(widget);
                break;
            case 'lvgl_slider':
                this.drawSlider(widget);
                break;
            case 'shape_rect':
            case 'rounded_rect':
                this.drawRect(widget);
                break;
            default:
                this.ctx.fillStyle = '#f0f0f0';
                this.ctx.fillRect(_x, _y, _width, _height);
                this.ctx.strokeStyle = '#ccc';
                this.ctx.strokeRect(_x, _y, _width, _height);
        }
        
        // Highlight if selected
        if (this.selectedWidget === widget) {
            this.ctx.strokeStyle = '#007bff';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(_x, _y, _width, _height);
        }
        
        this.ctx.restore();
    }
    
    drawButton(widget) {
        const { _x, _y, _width, _height, _props } = widget;
        
        this.ctx.fillStyle = this.parseColor(_props.color || '#007bff');
        this.ctx.fillRect(_x, _y, _width, _height);
        
        if (_props.text) {
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(_props.text, _x + _width/2, _y + _height/2);
        }
        
        this.ctx.strokeStyle = '#0056b3';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(_x, _y, _width, _height);
    }
    
    drawLabel(widget) {
        const { _x, _y, _width, _height, _props } = widget;
        
        this.ctx.fillStyle = this.parseColor(_props.color || '#000');
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        
        if (_props.text) {
            this.ctx.fillText(_props.text, _x, _y);
        }
    }
    
    drawSlider(widget) {
        const { _x, _y, _width, _height, _props } = widget;
        
        const trackHeight = 8;
        const trackY = _y + (_height - trackHeight) / 2;
        
        this.ctx.fillStyle = this.parseColor(_props.bg_color || '#e9ecef');
        this.ctx.fillRect(_x, trackY, _width, trackHeight);
        
        const min = _props.min_value || 0;
        const max = _props.max_value || 100;
        const value = _props.value || 50;
        const percentage = (value - min) / (max - min);
        
        this.ctx.fillStyle = this.parseColor(_props.color || '#007bff');
        this.ctx.fillRect(_x, trackY, _width * percentage, trackHeight);
        
        const knobSize = 20;
        const knobX = _x + (_width * percentage) - knobSize/2;
        const knobY = _y + _height/2 - knobSize/2;
        
        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.arc(knobX + knobSize/2, knobY + knobSize/2, knobSize/2, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#007bff';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }
    
    drawRect(widget) {
        const { _x, _y, _width, _height, _type, _props } = widget;
        
        if (_props.fill !== false && _props.fill !== 'false') {
            this.ctx.fillStyle = this.parseColor(_props.color || '#f0f0f0');
            if (_type === 'rounded_rect') {
                const radius = _props.radius || 5;
                this.drawRoundedRect(_x, _y, _width, _height, radius);
                this.ctx.fill();
            } else {
                this.ctx.fillRect(_x, _y, _width, _height);
            }
        }
        
        this.ctx.strokeStyle = this.parseColor(_props.color || '#ccc');
        this.ctx.lineWidth = _props.border_width || 1;
        
        if (_type === 'rounded_rect') {
            const radius = _props.radius || 5;
            this.drawRoundedRect(_x, _y, _width, _height, radius);
            this.ctx.stroke();
        } else {
            this.ctx.strokeRect(_x, _y, _width, _height);
        }
    }
    
    drawRoundedRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
    }
    
    handleCanvasClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const clickedWidget = this.widgets.find(widget => 
            widget._isActive &&
            x >= widget._x && x <= widget._x + widget._width &&
            y >= widget._y && y <= widget._y + widget._height
        );
        
        if (clickedWidget) {
            this.selectedWidget = clickedWidget;
            this.showWidgetInfo(clickedWidget);
            
            if (clickedWidget._props.events?.clicked) {
                this.executeEvent(clickedWidget, 'clicked');
            }
            
            this.renderPreviewWidgets();
        } else {
            this.selectedWidget = null;
            document.getElementById('widget-info').innerHTML = 'Click on any widget to see details';
        }
    }
    
    handleCanvasHover(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const hoveredWidget = this.widgets.find(widget => 
            widget._isActive &&
            x >= widget._x && x <= widget._x + widget._width &&
            y >= widget._y && y <= widget._y + widget._height
        );
        
        this.canvas.style.cursor = hoveredWidget ? 'pointer' : 'default';
    }
    
    showWidgetInfo(widget) {
        const infoDiv = document.getElementById('widget-info');
        if (!infoDiv) return;
        
        const info = `
            <strong>${widget._type}</strong><br>
            <small>ID: ${widget._id}</small><br>
            Position: (${widget._x}, ${widget._y})<br>
            Size: ${widget._width} × ${widget._height}<br>
            ${widget._props.text ? `Text: ${widget._props.text}<br>` : ''}
            ${widget._props.color ? `Color: ${widget._props.color}<br>` : ''}
            ${widget._props.events ? `Has events: Yes` : 'No events'}
        `;
        
        infoDiv.innerHTML = info;
    }
    
    executeEvent(widget, eventType) {
        const eventCode = widget._props.events?.[eventType];
        if (!eventCode) return;
        
        this.logToEventLog(`[${new Date().toLocaleTimeString()}] ${widget._id} - ${eventType} event fired`);
        
        try {
            // Simulate event execution
            const fakeLV = {
                get_value: () => widget._props.value || 0,
                set_value: (val) => {
                    widget._props.value = val;
                    this.refreshPreview();
                    this.logToPreviewConsole(`Value changed to: ${val}`);
                }
            };
            
            // Simple evaluation (for demo only - in production use safer methods)
            if (typeof eventCode === 'string') {
                if (eventCode.includes('console.log')) {
                    this.logToPreviewConsole(eventCode.replace('console.log', '').replace(/[()';]/g, '').trim());
                }
            }
        } catch (error) {
            this.logToPreviewConsole(`Event error: ${error.message}`);
        }
    }
    
    parseColor(color) {
        if (!color) return '#000000';
        if (color.startsWith('0x')) return '#' + color.slice(2);
        if (color.startsWith('#')) return color;
        
        const colorMap = {
            'red': '#ff0000', 'green': '#00ff00', 'blue': '#0000ff',
            'yellow': '#ffff00', 'white': '#ffffff', 'black': '#000000',
            'gray': '#808080', 'orange': '#ffa500', 'purple': '#800080'
        };
        
        return colorMap[color.toLowerCase()] || '#000000';
    }
    
    logToPreviewConsole(message) {
        const consoleDiv = document.getElementById('preview-console-output');
        if (consoleDiv) {
            const time = new Date().toLocaleTimeString();
            consoleDiv.innerHTML += `[${time}] ${message}\n`;
            consoleDiv.scrollTop = consoleDiv.scrollHeight;
        }
    }
    
    logToEventLog(message) {
        const eventDiv = document.getElementById('event-log');
        if (eventDiv) {
            eventDiv.innerHTML += `${message}\n`;
            eventDiv.scrollTop = eventDiv.scrollHeight;
        }
    }
    
    setupEventListeners() {
        // Tab switching
        this.tabsContainer.addEventListener('click', (e) => {
            const tab = e.target.closest('.tab');
            if (!tab) return;
            
            const tabName = tab.dataset.tab;
            this.switchTab(tabName);
        });
    }
    
    switchTab(tabName) {
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
            content.style.display = 'none';
        });
        
        // Remove active class from all tabs
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Show selected tab content
        const content = document.getElementById(`${tabName}-content`);
        if (content) {
            content.style.display = 'block';
        }
        
        // Add active class to selected tab
        const selectedTab = document.querySelector(`.tab[data-tab="${tabName}"]`);
        if (selectedTab) {
            selectedTab.classList.add('active');
        }
        
        // Refresh preview if switching to preview tab
        if (tabName === 'preview' && this.isRunning) {
            setTimeout(() => this.refreshPreview(), 100);
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.tabsManager = new TabsManager();
    
    // Auto-switch to preview if in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('tab') === 'preview') {
        setTimeout(() => window.tabsManager.switchTab('preview'), 500);
    }
});