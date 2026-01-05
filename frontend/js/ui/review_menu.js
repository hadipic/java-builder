// js/ui/review_menu.js
class ReviewMenu {
    constructor() {
        this.isOpen = false;
        this.init();
    }
    
    init() {
        this.setupEvents();
        this.addStyles();
    }
    
    setupEvents() {
        document.getElementById('reviewBtn')?.addEventListener('click', (e) => this.toggleMenu(e));
        document.getElementById('mobileReviewBtn')?.addEventListener('click', (e) => this.toggleMenu(e));
        document.addEventListener('click', () => this.isOpen && this.closeMenu());
    }
    
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .review-menu {
                position: absolute;
                top: 50px;
                right: 10px;
                background: var(--bg-elevated);
                border: 1px solid var(--border-subtle);
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                min-width: 200px;
                z-index: 1000;
                display: none;
                animation: fadeIn 0.2s ease;
            }
            .review-menu.open { display: block; }
            .review-menu-item {
                display: flex;
                align-items: center;
                padding: 10px 16px;
                width: 100%;
                border: none;
                background: none;
                text-align: left;
                font-size: 13px;
                color: var(--text);
                cursor: pointer;
                transition: background 0.2s;
                border-bottom: 1px solid var(--border-subtle);
            }
            .review-menu-item:hover { background: var(--bg-hover); }
            .review-menu-item svg {
                margin-right: 10px;
                width: 16px;
                height: 16px;
                color: var(--accent);
            }
            .review-menu-header {
                padding: 12px 16px;
                font-weight: 600;
                font-size: 12px;
                color: var(--text);
                border-bottom: 1px solid var(--border-subtle);
                background: var(--bg-subtle);
                border-radius: 8px 8px 0 0;
            }
            .review-modal {
                position: fixed;
                top: 0; left: 0;
                width: 100%; height: 100%;
                background: rgba(0,0,0,0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 2000;
                animation: fadeIn 0.3s ease;
            }
            .review-modal-content {
                background: var(--bg-elevated);
                border-radius: 12px;
                max-width: 1000px;
                width: 90%;
                max-height: 90vh;
                overflow: hidden;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            }
            .review-modal-header {
                padding: 16px 20px;
                border-bottom: 1px solid var(--border-subtle);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .review-modal-body { padding: 20px; overflow-y: auto; max-height: 70vh; }
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }
        `;
        document.head.appendChild(style);
    }
    
    toggleMenu(event) {
        event.stopPropagation();
        this.isOpen ? this.closeMenu() : this.openMenu(event);
    }
    
    openMenu(event) {
        this.closeMenu();
        const menuHTML = `
            <div class="review-menu open">
                <div class="review-menu-header">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                    </svg>
                    Review Options
                </div>
                
                <button class="review-menu-item" data-action="quick-preview">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    Quick Preview
                </button>
               
                <div style="height:1px;background:var(--border-subtle);margin:4px 0;"></div>
                
            </div>
        `;
        
        const button = event.currentTarget;
        const rect = button.getBoundingClientRect();
        document.body.insertAdjacentHTML('beforeend', menuHTML);
        
        const menuElement = document.querySelector('.review-menu');
        menuElement.style.top = rect.bottom + 5 + 'px';
        menuElement.style.right = window.innerWidth - rect.right + 'px';
        
        menuElement.querySelectorAll('.review-menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleMenuItemClick(e.target.dataset.action);
                this.closeMenu();
            });
        });
        
        this.isOpen = true;
    }
    
    closeMenu() {
        document.querySelector('.review-menu')?.remove();
        this.isOpen = false;
    }
    
    handleMenuItemClick(action) {
        const actions = {
          
            'quick-preview': () => this.showQuickPreview(),
            'export-yaml': () => this.exportAsYAML(),
            'export-lvgl': () => this.exportAsLVGL(),
            'export-c': () => this.exportAsC()
        };
        actions[action]?.();
    }
    
    openPreviewTab() {
        alert('Preview tab feature - Will open in full tab view');
    }
    
    showQuickPreview() {
        const widgets = this.getWidgets();
        if (!widgets.length) {
            alert('No widgets to preview. Add widgets first.');
            return;
        }
        
        const modalHTML = `
            <div class="review-modal" id="quickPreviewModal">
                <div class="review-modal-content" style="max-width: 1100px;">
                    <div class="review-modal-header">
                        <h3>Quick Preview (${widgets.length} widgets)</h3>
                        <div style="display:flex;gap:8px;align-items:center;">
                            <select id="previewDeviceSize" class="prop-input" style="width:120px;font-size:12px;">
                                <option value="320x240">320×240</option>
                                <option value="480x320">480×320</option>
                                <option value="800x480" selected>800×480</option>
                            </select>
                            <button onclick="this.closest('.review-modal').remove()" class="btn btn-secondary">Close</button>
                        </div>
                    </div>
                    <div class="review-modal-body" style="padding:0;display:flex;height:600px;">
                        <div style="flex:3;padding:20px;border-right:1px solid var(--border-subtle);">
                            <div style="text-align:center;">
                                <div style="margin-bottom:15px;font-size:12px;color:var(--muted);">ESP32 Display Preview</div>
                                <canvas id="previewCanvas" width="800" height="480" style="background:#000;border-radius:8px;border:2px solid #333;cursor:pointer;"></canvas>
                                <div style="margin-top:10px;font-size:11px;color:var(--muted);">Click widgets to interact</div>
                            </div>
                            <div style="margin-top:30px;padding:15px;background:var(--bg-subtle);border-radius:8px;">
                                <div style="font-size:14px;margin-bottom:10px;">Controls</div>
                                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                                    <button id="refreshPreview" class="btn btn-secondary btn-xs">Refresh</button>
                                    <button id="runPreview" class="btn btn-secondary btn-xs">Run</button>
                                    <button id="resetPreview" class="btn btn-secondary btn-xs">Reset</button>
                                    <label style="display:flex;align-items:center;gap:5px;font-size:11px;">
                                        <input type="checkbox" id="showGrid" checked> Grid
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div style="flex:2;padding:20px;background:var(--bg-subtle);overflow-y:auto;">
                            <div style="font-size:14px;margin-bottom:15px;">Widget Info</div>
                            <div id="widgetInfo" style="font-size:12px;margin-bottom:20px;">
                                Click a widget to see details
                            </div>
                            <div style="font-size:14px;margin-bottom:10px;">Event Log</div>
                            <div id="eventLog" style="height:200px;overflow-y:auto;background:var(--bg-input);border-radius:6px;padding:10px;font-size:11px;font-family:monospace;"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.initQuickPreview(widgets);
    }
    
    initQuickPreview(widgets) {
        const canvas = document.getElementById('previewCanvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        // رویدادها
        document.getElementById('refreshPreview')?.addEventListener('click', () => this.renderPreview(ctx, widgets));
        document.getElementById('runPreview')?.addEventListener('click', () => this.logEvent('Preview started'));
        document.getElementById('resetPreview')?.addEventListener('click', () => {
            widgets.forEach(w => w._value = w.props?.value || 0);
            this.renderPreview(ctx, widgets);
            this.logEvent('Preview reset');
        });
        
        canvas.addEventListener('click', (e) => this.handlePreviewClick(e, canvas, widgets, ctx));
        
        // رندر اولیه
        this.renderPreview(ctx, widgets);
    }
    
    renderPreview(ctx, widgets) {
        const canvas = ctx.canvas;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // پس‌زمینه مشکی
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // رسم گرید
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= canvas.width; x += 20) {
            ctx.beginPath();
            ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
        }
        for (let y = 0; y <= canvas.height; y += 20) {
            ctx.beginPath();
            ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
        }
        
        // رسم ویجت‌ها
        widgets.forEach(widget => {
            this.drawWidget(ctx, widget);
        });
    }
    
    drawWidget(ctx, widget) {
        const x = widget.x || 0, y = widget.y || 0;
        const w = widget.width || 100, h = widget.height || 40;
        const type = widget.type || 'obj';
        const props = widget.props || {};
        
        ctx.save();
        
        switch(type) {
            case 'label':
            case 'lvgl_label':
                ctx.fillStyle = this.parseColor(props.color || '#fff');
                ctx.font = `${props.font_size || 16}px Arial`;
                ctx.fillText(props.text || '', x, y);
                break;
            case 'lvgl_button':
                ctx.fillStyle = this.parseColor(props.color || '#007bff');
                ctx.fillRect(x, y, w, h);
                if (props.text) {
                    ctx.fillStyle = '#fff';
                    ctx.font = '14px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(props.text, x + w/2, y + h/2);
                }
                break;
            case 'shape_rect':
                ctx.fillStyle = this.parseColor(props.color || '#ccc');
                ctx.fillRect(x, y, w, h);
                break;
            case 'rounded_rect':
                ctx.fillStyle = this.parseColor(props.color || '#ccc');
                this.drawRoundedRect(ctx, x, y, w, h, props.radius || 10);
                ctx.fill();
                break;
            default:
                ctx.fillStyle = '#222';
                ctx.fillRect(x, y, w, h);
                ctx.fillStyle = '#666';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(type, x + w/2, y + h/2);
        }
        
        ctx.restore();
    }
    
    drawRoundedRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }
    
    handlePreviewClick(e, canvas, widgets, ctx) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        const clicked = widgets.find(w => 
            x >= (w.x||0) && x <= (w.x||0) + (w.width||100) &&
            y >= (w.y||0) && y <= (w.y||0) + (w.height||40)
        );
        
        if (clicked) {
            this.updateWidgetInfo(clicked);
            this.logEvent(`Clicked: ${clicked.type}`);
            
            // شبیه‌سازی تعامل
            if (clicked.type === 'lvgl_slider') {
                clicked.props = clicked.props || {};
                clicked.props.value = Math.min(100, Math.max(0, Math.round((x - (clicked.x||0)) / (clicked.width||100) * 100)));
                this.renderPreview(ctx, widgets);
                this.logEvent(`Slider value: ${clicked.props.value}`);
            }
        }
    }
    
    updateWidgetInfo(widget) {
        const info = document.getElementById('widgetInfo');
        if (!info) return;
        
        info.innerHTML = `
            <div style="background:var(--bg-input);padding:10px;border-radius:6px;border-left:4px solid var(--accent);">
                <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
                    <strong>${widget.type}</strong>
                    <span style="font-size:10px;background:var(--bg-subtle);padding:2px 6px;border-radius:3px;">${widget.id || 'no-id'}</span>
                </div>
                <div>Pos: (${widget.x||0}, ${widget.y||0})</div>
                <div>Size: ${widget.width||0}×${widget.height||0}</div>
                ${widget.props?.text ? `<div>Text: "${widget.props.text}"</div>` : ''}
                ${widget.props?.color ? `<div>Color: ${widget.props.color}</div>` : ''}
            </div>
        `;
    }
    
    logEvent(message) {
        const log = document.getElementById('eventLog');
        if (!log) return;
        const entry = document.createElement('div');
        entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        log.appendChild(entry);
        log.scrollTop = log.scrollHeight;
    }
    
    showDeviceEmulator() {
        const modalHTML = `
            <div class="review-modal">
                <div class="review-modal-content" style="max-width: 900px;">
                    <div class="review-modal-header">
                        <h3>Device Emulator</h3>
                        <button onclick="this.closest('.review-modal').remove()" class="btn btn-secondary">Close</button>
                    </div>
                    <div class="review-modal-body">
                        <div style="text-align:center;">
                            <div style="display:inline-block;padding:20px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:30px;">
                                <div style="background:#1a1a1a;border-radius:25px;padding:40px 20px;width:300px;">
                                    <div style="width:240px;height:320px;margin:0 auto;background:#000;border-radius:8px;position:relative;overflow:hidden;">
                                        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#444;text-align:center;">
                                            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#444" stroke-width="1">
                                                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                                                <line x1="8" y1="21" x2="16" y2="21"/>
                                                <line x1="12" y1="17" x2="12" y2="21"/>
                                            </svg>
                                            <div style="margin-top:10px;font-size:12px;">ESP32 Emulator</div>
                                            <div style="font-size:10px;margin-top:5px;">Touch to interact</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div style="margin-top:30px;max-width:500px;margin-left:auto;margin-right:auto;">
                                <h4>Device Features</h4>
                                <ul style="text-align:left;margin-top:15px;color:var(--muted);font-size:14px;">
                                    <li>Screen: 240×320 LCD</li>
                                    <li>Touch: Capacitive</li>
                                    <li>WiFi + Bluetooth</li>
                                    <li>Battery simulation</li>
                                    <li>Orientation sensor</li>
                                </ul>
                                <div style="margin-top:20px;">
                                    <button class="btn btn-secondary" onclick="alert('Simulation started')">Start Simulation</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    exportAsYAML() {
        const widgets = this.getWidgets();
        const yaml = `# ESPHome Configuration
# Generated ${new Date().toLocaleDateString()}

esphome:
  name: "esphome-device"
  platform: ESP32

wifi:
  ssid: "Your_WiFi"
  password: "Your_Password"

display:
  - platform: lilygo_t_display_s3
    id: display1
    width: 320
    height: 240

# Widgets (${widgets.length} total)
widgets:${widgets.length ? '' : ' []'}
${widgets.map((w, i) => `  - id: ${w.id || `widget_${i+1}`}
    type: ${w.type || 'label'}
    position: [${w.x || 0}, ${w.y || 0}]
    size: [${w.width || 100}, ${w.height || 40}]${w.props?.text ? `\n    text: "${w.props.text}"` : ''}${w.props?.color ? `\n    color: ${w.props.color}` : ''}`).join('\n\n')}`;
        
        this.showCodeModal('ESPHome YAML', yaml);
    }
    
    exportAsLVGL() {
        const code = `// LVGL EVM Code
var lv = require('@native.lvgl');

function createUI() {
    var screen = lv.scr_act();
    lv.scr_load(screen);
    
    // Your LVGL widgets will be created here
    var label = lv.label_create(screen);
    lv.label_set_text(label, "Hello LVGL!");
    lv.obj_align(label, lv.ALIGN_CENTER, 0, 0);
    
    console.log("UI created successfully");
}

// Initialize
createUI();`;
        this.showCodeModal('LVGL EVM Code', code);
    }
    
    exportAsC() {
        const code = `// ESPHome C Code
#include "esphome.h"

class MyDisplay : public Component, public Display {
 public:
  void setup() override {
    // Initialize your display here
    ESP_LOGI("TAG", "Display setup complete");
  }
  
  void loop() override {
    // Update display logic
  }
};

// Register component
static MyDisplay my_display;`;
        this.showCodeModal('C Code', code);
    }
    
    showCodeModal(title, code) {
        const modalHTML = `
            <div class="review-modal">
                <div class="review-modal-content">
                    <div class="review-modal-header">
                        <h3>${title}</h3>
                        <button onclick="this.closest('.review-modal').remove()" class="btn btn-secondary">Close</button>
                    </div>
                    <div class="review-modal-body">
                        <div style="background:#1a1a1a;color:#f0f0f0;padding:20px;border-radius:8px;font-family:monospace;font-size:12px;overflow:auto;">
                            <button onclick="copyCode(this)" style="position:absolute;top:10px;right:10px;background:var(--accent);color:white;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-size:11px;">Copy</button>
                            <pre style="margin:0;">${this.escapeHTML(code)}</pre>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    // Utility functions
    getWidgets() {
        try {
            if (window.AppState?.getCurrentPage) {
                return window.AppState.getCurrentPage()?.widgets || [];
            }
            return [];
        } catch (e) {
            console.warn('Could not get widgets:', e);
            return [];
        }
    }
    
    parseColor(color) {
        if (!color) return '#000';
        if (color.startsWith('0x')) return '#' + color.slice(2);
        if (color.startsWith('#')) return color;
        const colors = {
            'red': '#ff0000', 'green': '#00ff00', 'blue': '#0000ff',
            'yellow': '#ffff00', 'white': '#ffffff', 'black': '#000000'
        };
        return colors[color.toLowerCase()] || '#000';
    }
    
    escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Global helper
window.copyCode = function(button) {
    const code = button.nextElementSibling.textContent;
    navigator.clipboard.writeText(code).then(() => {
        const original = button.textContent;
        button.textContent = 'Copied!';
        setTimeout(() => button.textContent = original, 2000);
    }).catch(err => alert('Copy failed: ' + err));
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.reviewMenu = new ReviewMenu();
});