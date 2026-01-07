// js/ui/review_menu.js
class ReviewMenu {
    constructor() {
        this.isOpen = false;
        this.featureRenderers = {}; // کش برای رندررها
        this.init();
    }
    
    init() {
        this.setupEvents();
        this.addStyles();
        this.initializeFeatureCache(); // کش کردن رندررها هنگام بارگذاری
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
                max-width: 1100px;
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
            'quick-preview': () => this.showQuickPreview()
        };
        actions[action]?.();
    }
    
    async showQuickPreview() {
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
        await this.initQuickPreview(widgets);
    }
    
    async initQuickPreview(widgets) {
        const canvas = document.getElementById('previewCanvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        // رویدادها
        document.getElementById('refreshPreview')?.addEventListener('click', () => this.renderPreview(ctx, widgets));
        document.getElementById('runPreview')?.addEventListener('click', () => this.logEvent('Preview started'));
        document.getElementById('resetPreview')?.addEventListener('click', () => {
            widgets.forEach(w => {
                if (w.props) {
                    if (w.type === 'lvgl_slider') w.props.value = 50;
                    if (w.type === 'lvgl_switch') w.props.value = false;
                    if (w.type === 'lvgl_checkbox') w.props.value = false;
                    if (w.type === 'lvgl_dropdown') w.props.selected_index = 0;
                    if (w.type === 'lvgl_spinbox') w.props.value = 0;
                    if (w.type === 'lvgl_tabview') w.props.active_tab = 0;
                    if (w.type === 'lvgl_arc') w.props.value = 0;
                    if (w.type === 'lvgl_meter') w.props.value = 60;
                    if (w.type === 'lvgl_led') w.props.brightness = 255;
                    if (w.type === 'lvgl_bar') w.props.value = 70;
                }
            });
            this.renderPreview(ctx, widgets);
            this.logEvent('Preview reset');
        });
        
        canvas.addEventListener('click', (e) => this.handlePreviewClick(e, canvas, widgets, ctx));
        
        // رندر اولیه
        await this.renderPreview(ctx, widgets);
    }
    
    async renderPreview(ctx, widgets) {
        const canvas = ctx.canvas;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // پس‌زمینه مشکی
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // رسم گرید
        const showGrid = document.getElementById('showGrid')?.checked;
        if (showGrid) {
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
        }
        
        // رسم ویجت‌ها
        for (const widget of widgets) {
            await this.drawWidget(ctx, widget);
        }
    }
    
    async drawWidget(ctx, widget) {
        const x = widget.x || 0, y = widget.y || 0;
        const w = widget.width || 100, h = widget.height || 40;
        const type = widget.type || 'obj';
        const props = widget.props || {};
        
        ctx.save();
        
        // استفاده از رندر داخلی برای همه ویجت‌ها
        switch(type) {
            case 'text':
            case 'label':
            case 'lvgl_label':
                this.renderText(ctx, widget, x, y, w, h);
                break;
                
            case 'lvgl_button':
                this.renderButton(ctx, widget, x, y, w, h);
                break;
                
            case 'lvgl_slider':
                this.renderSlider(ctx, widget, x, y, w, h);
                break;
                
            case 'lvgl_arc':
                this.renderArc(ctx, widget, x, y, w, h);
                break;
                
            case 'lvgl_tabview':
                this.renderTabView(ctx, widget, x, y, w, h);
                break;
                
            case 'lvgl_spinbox':
                this.renderSpinbox(ctx, widget, x, y, w, h);
                break;
                
            case 'lvgl_led':
                this.renderLed(ctx, widget, x, y, w, h);
                break;
                
            case 'lvgl_spinner':
                this.renderSpinner(ctx, widget, x, y, w, h);
                break;
                
            case 'lvgl_meter':
                this.renderMeter(ctx, widget, x, y, w, h);
                break;
                
            case 'lvgl_bar':
                this.renderBar(ctx, widget, x, y, w, h);
                break;
                
            case 'lvgl_switch':
                this.renderSwitch(ctx, widget, x, y, w, h);
                break;
                
            case 'lvgl_checkbox':
                this.renderCheckbox(ctx, widget, x, y, w, h);
                break;
                
            case 'lvgl_dropdown':
                this.renderDropdown(ctx, widget, x, y, w, h);
                break;
                
            case 'lvgl_img':
                this.renderImage(ctx, widget, x, y, w, h);
                break;
                
            case 'lvgl_roller':
                this.renderRoller(ctx, widget, x, y, w, h);
                break;
                
            case 'shape_rect':
                ctx.fillStyle = this.parseColor(props.color || '#4CAF50');
                ctx.fillRect(x, y, w, h);
                break;
                
            case 'rounded_rect':
                ctx.fillStyle = this.parseColor(props.color || '#2196F3');
                this.drawRoundedRect(ctx, x, y, w, h, props.radius || 10);
                ctx.fill();
                break;
                
            case 'shape_circle':
                ctx.fillStyle = this.parseColor(props.color || '#FF9800');
                ctx.beginPath();
                ctx.arc(x + w/2, y + h/2, Math.min(w, h)/2, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            default:
                // تلاش کن از feature موجود استفاده کنی
                const renderer = this.getFeatureRenderer(type);
                if (renderer) {
                    await this.drawWithFeatureRenderer(ctx, widget, x, y, w, h, renderer);
                } else {
                    // رندر پیش‌فرض
                    ctx.fillStyle = '#222';
                    this.drawRoundedRect(ctx, x, y, w, h, 3);
                    ctx.fill();
                    ctx.fillStyle = '#fff';
                    ctx.font = '12px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(type.replace('lvgl_', ''), x + w/2, y + h/2);
                }
        }
        
        ctx.restore();
    }
    
    // ==================== توابع رندر داخلی ====================
    
    renderText(ctx, widget, x, y, w, h) {
        const props = widget.props || {};
        const text = props.text || widget.title || 'Text';
        const fontSize = props.font_size || props.value_font_size || 16;
        const color = this.parseColor(props.color || '#fff');
        const fontFamily = (props.font_family || 'Arial') + ', sans-serif';
        const fontWeight = String(props.font_weight || 400);
        const fontStyle = props.italic ? 'italic' : 'normal';
        
        ctx.fillStyle = color;
        ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        // تراز متن
        let textX = x;
        let textY = y;
        
        const align = props.text_align || 'TOP_LEFT';
        if (align.includes('CENTER')) {
            ctx.textAlign = 'center';
            textX = x + w/2;
        } else if (align.includes('RIGHT')) {
            ctx.textAlign = 'right';
            textX = x + w - 5;
        }
        
        if (align.includes('MIDDLE') || align.includes('CENTER')) {
            ctx.textBaseline = 'middle';
            textY = y + h/2;
        } else if (align.includes('BOTTOM')) {
            ctx.textBaseline = 'bottom';
            textY = y + h - 5;
        }
        
        // محدود کردن متن به عرض ویجت
        let displayText = text;
        const maxWidth = w - 10;
        const metrics = ctx.measureText(text);
        if (metrics.width > maxWidth) {
            // کوتاه کردن متن
            let shortened = text;
            while (ctx.measureText(shortened + '...').width > maxWidth && shortened.length > 1) {
                shortened = shortened.slice(0, -1);
            }
            displayText = shortened + '...';
        }
        
        ctx.fillText(displayText, textX, textY);
    }
    
    renderButton(ctx, widget, x, y, w, h) {
        const props = widget.props || {};
        const color = this.parseColor(props.color || '#007bff');
        
        // پس‌زمینه دکمه
        ctx.fillStyle = color;
        this.drawRoundedRect(ctx, x, y, w, h, 5);
        ctx.fill();
        
        // سایه
        ctx.shadowColor = 'rgba(0,0,0,0.2)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.strokeStyle = this.darkenColor(color, 20);
        ctx.lineWidth = 1;
        this.drawRoundedRect(ctx, x, y, w, h, 5);
        ctx.stroke();
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // متن دکمه
        if (props.text) {
            ctx.fillStyle = '#fff';
            ctx.font = `${props.font_size || 14}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(props.text, x + w/2, y + h/2);
        }
    }
    
    renderSlider(ctx, widget, x, y, w, h) {
        const props = widget.props || {};
        const isVertical = props.vertical || false;
        const value = props.value !== undefined ? props.value : 50;
        const min = props.min || 0;
        const max = props.max || 100;
        const percent = ((value - min) / (max - min)) * 100;
        const color = this.parseColor(props.color || '#007bff');
        
        // Track
        ctx.fillStyle = '#666';
        if (isVertical) {
            this.drawRoundedRect(ctx, x + w*0.35, y, w*0.3, h, 5);
        } else {
            this.drawRoundedRect(ctx, x, y + h*0.35, w, h*0.3, 5);
        }
        ctx.fill();
        
        // Filled track
        ctx.fillStyle = color;
        if (isVertical) {
            const filledHeight = (h * percent / 100);
            this.drawRoundedRect(ctx, x + w*0.35, y + h - filledHeight, w*0.3, filledHeight, 5);
        } else {
            const filledWidth = (w * percent / 100);
            this.drawRoundedRect(ctx, x, y + h*0.35, filledWidth, h*0.3, 5);
        }
        ctx.fill();
        
        // Knob
        ctx.fillStyle = color;
        const knobSize = isVertical ? w*0.6 : h*0.6;
        if (isVertical) {
            const knobY = y + h - (h * percent / 100);
            ctx.beginPath();
            ctx.arc(x + w/2, knobY, knobSize/2, 0, Math.PI * 2);
            ctx.fill();
            
            // Highlight
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(x + w/2 - knobSize*0.15, knobY - knobSize*0.15, knobSize*0.2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            const knobX = x + (w * percent / 100);
            ctx.beginPath();
            ctx.arc(knobX, y + h/2, knobSize/2, 0, Math.PI * 2);
            ctx.fill();
            
            // Highlight
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(knobX - knobSize*0.15, y + h/2 - knobSize*0.15, knobSize*0.2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // مقدار
        if (props.show_value !== false) {
            ctx.fillStyle = '#fff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const displayX = isVertical ? x + w/2 : x + (w * percent / 100);
            const displayY = isVertical ? y + h - (h * percent / 100) - knobSize : y + h/2;
            ctx.fillText(value.toString(), displayX, displayY - 20);
        }
    }
    
    renderArc(ctx, widget, x, y, w, h) {
        const props = widget.props || {};
        const value = props.value || 0;
        const min = props.min || 0;
        const max = props.max || 100;
        const percent = ((value - min) / (max - min)) * 100;
        const angle = (percent / 100) * 270;
        const color = this.parseColor(props.color || '#007bff');
        const thickness = props.thickness || 10;
        
        const centerX = x + w/2;
        const centerY = y + h/2;
        const radius = Math.min(w, h) * 0.4;
        
        // Track
        ctx.strokeStyle = '#666';
        ctx.lineWidth = thickness;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, -Math.PI/2, (Math.PI * 1.5));
        ctx.stroke();
        
        // Arc
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, -Math.PI/2, (-Math.PI/2) + (angle * Math.PI/180));
        ctx.stroke();
        
        // Knob
        const knobAngle = (-Math.PI/2) + (angle * Math.PI/180);
        const knobX = centerX + Math.cos(knobAngle) * radius;
        const knobY = centerY + Math.sin(knobAngle) * radius;
        
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(knobX, knobY, thickness * 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // مقدار
        if (props.show_value !== false) {
            ctx.fillStyle = '#fff';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(value.toString(), centerX, centerY);
        }
        
        // عنوان
        if (props.title) {
            ctx.fillStyle = '#aaa';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(props.title, centerX, centerY + radius + 10);
        }
    }
    
    renderTabView(ctx, widget, x, y, w, h) {
        const props = widget.props || {};
        let tabs = ['Tab 1', 'Tab 2', 'Tab 3'];
        
        if (props.tabs) {
            if (typeof props.tabs === 'string') {
                tabs = props.tabs.includes(',') ? 
                    props.tabs.split(',').map(t => t.trim()) : 
                    [props.tabs];
            } else if (Array.isArray(props.tabs)) {
                tabs = props.tabs;
            }
        }
        
        const activeTab = props.active_tab || 0;
        const bgColor = this.parseColor(props.bg_color || '#f0f0f0');
        
        ctx.fillStyle = bgColor;
        ctx.fillRect(x, y, w, h);
        
        const tabHeight = Math.min(30, h * 0.15);
        const tabWidth = w / Math.min(tabs.length, 5);
        
        // هدر تب‌ها
        ctx.fillStyle = '#ddd';
        ctx.fillRect(x, y, w, tabHeight);
        
        tabs.forEach((name, index) => {
            const tabX = x + (index * tabWidth);
            const isActive = index === activeTab;
            
            ctx.fillStyle = isActive ? '#fff' : '#eee';
            ctx.fillRect(tabX, y, tabWidth, tabHeight);
            
            ctx.strokeStyle = '#ccc';
            ctx.lineWidth = 1;
            ctx.strokeRect(tabX, y, tabWidth, tabHeight);
            
            ctx.fillStyle = '#333';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            let displayName = name.trim();
            if (displayName.length > 8) {
                displayName = displayName.substring(0, 7) + '...';
            }
            ctx.fillText(displayName, tabX + tabWidth/2, y + tabHeight/2);
            
            if (isActive) {
                ctx.fillStyle = this.parseColor(props.color || '#007bff');
                ctx.fillRect(tabX, y + tabHeight - 3, tabWidth, 3);
            }
        });
        
        // محتوای تب فعال
        ctx.fillStyle = '#fff';
        ctx.fillRect(x, y + tabHeight, w, h - tabHeight);
        
        ctx.fillStyle = '#666';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`Content: ${tabs[activeTab] || 'Tab'}`, x + w/2, y + tabHeight + (h - tabHeight)/2);
        
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y + tabHeight, w, h - tabHeight);
    }
    
    renderSpinbox(ctx, widget, x, y, w, h) {
        const props = widget.props || {};
        const value = props.value !== undefined ? props.value : 0;
        const min = props.min || 0;
        const max = props.max || 100;
        const step = props.step || 1;
        
        ctx.fillStyle = '#fff';
        this.drawRoundedRect(ctx, x, y, w, h, 5);
        ctx.fill();
        
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, w, h);
        
        const btnWidth = Math.min(h, w * 0.3);
        
        // دکمه کم کردن
        ctx.fillStyle = '#eee';
        ctx.fillRect(x, y, btnWidth, h);
        ctx.fillStyle = '#666';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('-', x + btnWidth/2, y + h/2);
        
        // دکمه اضافه کردن
        ctx.fillStyle = '#eee';
        ctx.fillRect(x + w - btnWidth, y, btnWidth, h);
        ctx.fillStyle = '#666';
        ctx.fillText('+', x + w - btnWidth/2, y + h/2);
        
        // مقدار
        ctx.fillStyle = '#000';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(value.toString(), x + w/2, y + h/2);
        
        // جداکننده‌ها
        ctx.strokeStyle = '#ccc';
        ctx.beginPath();
        ctx.moveTo(x + btnWidth, y);
        ctx.lineTo(x + btnWidth, y + h);
        ctx.moveTo(x + w - btnWidth, y);
        ctx.lineTo(x + w - btnWidth, y + h);
        ctx.stroke();
    }
    
    renderLed(ctx, widget, x, y, w, h) {
        const props = widget.props || {};
        const color = this.parseColor(props.color || 'red');
        const brightness = props.brightness || 255;
        const ledSize = Math.min(w, h) * 0.8;
        const centerX = x + w/2;
        const centerY = y + h/2;
        
        // Gradient for LED effect
        const gradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, ledSize/2
        );
        
        const alpha = brightness / 255;
        gradient.addColorStop(0, this.hexToRgba(color, alpha));
        gradient.addColorStop(0.7, this.hexToRgba(color, alpha * 0.7));
        gradient.addColorStop(1, this.hexToRgba(color, 0));
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, ledSize/2, 0, Math.PI * 2);
        ctx.fill();
        
        // LED outline
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, ledSize/2, 0, Math.PI * 2);
        ctx.stroke();
        
        // روشن/خاموش بودن
        ctx.fillStyle = brightness > 127 ? '#fff' : '#666';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(brightness > 127 ? 'ON' : 'OFF', centerX, y + h - 5);
    }
    
    renderSpinner(ctx, widget, x, y, w, h) {
        const props = widget.props || {};
        const centerX = x + w/2;
        const centerY = y + h/2;
        const radius = Math.min(w, h) * 0.4;
        const arcLength = props.arc_length || 60; // in degrees
        const spinTime = props.spin_time || 1000; // in ms
        const arcColor = this.parseColor(props.arc_color || 'blue');
        const trackColor = this.parseColor(props.track_color || 'white');
        
        // Draw track
        ctx.strokeStyle = trackColor;
        ctx.lineWidth = Math.min(w, h) * 0.1;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Calculate animated angle
        const now = Date.now();
        const angle = (now % spinTime) / spinTime * Math.PI * 2;
        
        // Draw arc
        ctx.strokeStyle = arcColor;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, angle, angle + (arcLength * Math.PI/180));
        ctx.stroke();
        
        // Draw center dot
        ctx.fillStyle = arcColor;
        ctx.beginPath();
        ctx.arc(centerX, centerY, Math.min(w, h) * 0.05, 0, Math.PI * 2);
        ctx.fill();
    }
    
    renderMeter(ctx, widget, x, y, w, h) {
        const props = widget.props || {};
        const value = props.value || 60;
        const min = props.min || 0;
        const max = props.max || 100;
        const tickCount = props.tick_count || 11;
        const tickLength = props.tick_length || 10;
        const labelGap = props.label_gap || 10;
        const indicatorColor = this.parseColor(props.indicator_color || 'red');
        const color = this.parseColor(props.color || 'black');
        
        const centerX = x + w/2;
        const centerY = y + h/2;
        const radius = Math.min(w, h) * 0.4;
        
        // Draw arc
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = Math.min(w, h) * 0.08;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, -Math.PI * 0.75, Math.PI * 0.75);
        ctx.stroke();
        
        // Draw ticks
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        const startAngle = -Math.PI * 0.75;
        const endAngle = Math.PI * 0.75;
        const angleRange = endAngle - startAngle;
        
        for (let i = 0; i < tickCount; i++) {
            const angle = startAngle + (angleRange * i / (tickCount - 1));
            const tickLengthActual = (i === 0 || i === tickCount - 1 || i === Math.floor(tickCount / 2)) 
                ? tickLength * 1.5 : tickLength;
            
            const x1 = centerX + Math.cos(angle) * radius;
            const y1 = centerY + Math.sin(angle) * radius;
            const x2 = centerX + Math.cos(angle) * (radius - tickLengthActual);
            const y2 = centerY + Math.sin(angle) * (radius - tickLengthActual);
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
        
        // Draw indicator
        const indicatorAngle = startAngle + ((value - min) / (max - min)) * angleRange;
        ctx.strokeStyle = indicatorColor;
        ctx.lineWidth = Math.min(w, h) * 0.05;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius - tickLength - 5, startAngle, indicatorAngle);
        ctx.stroke();
        
        // Draw indicator arrow
        const arrowX = centerX + Math.cos(indicatorAngle) * (radius - tickLength - 5);
        const arrowY = centerY + Math.sin(indicatorAngle) * (radius - tickLength - 5);
        
        ctx.fillStyle = indicatorColor;
        ctx.beginPath();
        ctx.arc(arrowX, arrowY, Math.min(w, h) * 0.04, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw value
        if (props.show_value !== false) {
            ctx.fillStyle = color;
            ctx.font = `${Math.min(w, h) * 0.15}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(value.toString(), centerX, centerY);
        }
    }
    
    renderBar(ctx, widget, x, y, w, h) {
        const props = widget.props || {};
        const value = props.value !== undefined ? props.value : 70;
        const min = props.min || 0;
        const max = props.max || 100;
        const percent = ((value - min) / (max - min)) * 100;
        const isVertical = props.vertical || false;
        const color = this.parseColor(props.color || '#007bff');
        
        // Draw background
        ctx.fillStyle = '#eee';
        this.drawRoundedRect(ctx, x, y, w, h, 5);
        ctx.fill();
        
        // Draw filled part
        ctx.fillStyle = color;
        if (isVertical) {
            const filledHeight = (h * percent / 100);
            this.drawRoundedRect(ctx, x, y + h - filledHeight, w, filledHeight, 5);
        } else {
            const filledWidth = (w * percent / 100);
            this.drawRoundedRect(ctx, x, y, filledWidth, h, 5);
        }
        ctx.fill();
        
        // Draw border
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 1;
        this.drawRoundedRect(ctx, x, y, w, h, 5);
        ctx.stroke();
        
        // Draw value
        ctx.fillStyle = '#333';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(value.toString(), x + w/2, y + h/2);
    }
    
    renderSwitch(ctx, widget, x, y, w, h) {
        const props = widget.props || {};
        const value = props.value || false;
        const switchWidth = Math.min(w, h * 2);
        const switchHeight = Math.min(h, w/2);
        const switchX = x + (w - switchWidth)/2;
        const switchY = y + (h - switchHeight)/2;
        const knobSize = switchHeight * 0.8;
        const color = this.parseColor(props.color || '#4CAF50');
        
        // Draw track
        ctx.fillStyle = value ? color : '#ccc';
        this.drawRoundedRect(ctx, switchX, switchY, switchWidth, switchHeight, switchHeight/2);
        ctx.fill();
        
        // Draw knob
        const knobX = value ? switchX + switchWidth - knobSize - (switchHeight - knobSize)/2 : 
                            switchX + (switchHeight - knobSize)/2;
        const knobY = switchY + (switchHeight - knobSize)/2;
        
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(knobX + knobSize/2, knobY + knobSize/2, knobSize/2, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw shadow
        ctx.shadowColor = 'rgba(0,0,0,0.2)';
        ctx.shadowBlur = 3;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        ctx.beginPath();
        ctx.arc(knobX + knobSize/2, knobY + knobSize/2, knobSize/2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Draw labels
        ctx.fillStyle = value ? '#fff' : '#666';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(value ? 'ON' : 'OFF', switchX + switchWidth/2, switchY + switchHeight/2);
    }
    
    renderCheckbox(ctx, widget, x, y, w, h) {
        const props = widget.props || {};
        const value = props.value || false;
        const boxSize = Math.min(w, h) * 0.7;
        const boxX = x + (w - boxSize)/2;
        const boxY = y + (h - boxSize)/2;
        const color = this.parseColor(props.color || '#4CAF50');
        
        // Draw box
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.strokeRect(boxX, boxY, boxSize, boxSize);
        
        if (value) {
            // Fill box
            ctx.fillStyle = color;
            ctx.fillRect(boxX, boxY, boxSize, boxSize);
            
            // Draw checkmark
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(boxX + boxSize * 0.2, boxY + boxSize * 0.5);
            ctx.lineTo(boxX + boxSize * 0.4, boxY + boxSize * 0.7);
            ctx.lineTo(boxX + boxSize * 0.8, boxY + boxSize * 0.3);
            ctx.stroke();
        }
        
        // Draw label if exists
        if (props.text) {
            ctx.fillStyle = '#333';
            ctx.font = `${Math.min(w, h) * 0.25}px Arial`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(props.text, x + boxSize + 10, y + h/2);
        }
    }
    
    renderDropdown(ctx, widget, x, y, w, h) {
        const props = widget.props || {};
        const options = props.options ? props.options.split(',') : ['Option 1', 'Option 2', 'Option 3'];
        const selectedIndex = props.selected_index || 0;
        
        // Draw box
        ctx.fillStyle = '#fff';
        this.drawRoundedRect(ctx, x, y, w, h, 5);
        ctx.fill();
        
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 1;
        this.drawRoundedRect(ctx, x, y, w, h, 5);
        ctx.stroke();
        
        // Draw selected text
        if (options[selectedIndex]) {
            ctx.fillStyle = '#333';
            ctx.font = `${h * 0.4}px Arial`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            const text = options[selectedIndex].trim();
            const displayText = text.length > 15 ? text.substring(0, 12) + '...' : text;
            ctx.fillText(displayText, x + 10, y + h/2);
        }
        
        // Draw arrow
        const arrowSize = h * 0.3;
        const arrowX = x + w - arrowSize - 10;
        const arrowY = y + h/2;
        
        ctx.fillStyle = '#666';
        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY - arrowSize/2);
        ctx.lineTo(arrowX + arrowSize, arrowY - arrowSize/2);
        ctx.lineTo(arrowX + arrowSize/2, arrowY + arrowSize/2);
        ctx.closePath();
        ctx.fill();
    }
    
    renderImage(ctx, widget, x, y, w, h) {
        const props = widget.props || {};
        
        // Draw placeholder
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(x, y, w, h);
        
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, w, h);
        
        // Draw "Image" text
        ctx.fillStyle = '#999';
        ctx.font = `${Math.min(w, h) * 0.15}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Image', x + w/2, y + h/2);
        
        // Draw cross lines
        ctx.strokeStyle = '#ddd';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + w, y + h);
        ctx.moveTo(x + w, y);
        ctx.lineTo(x, y + h);
        ctx.stroke();
        
        // اگر src وجود دارد، نام فایل را نشان بده
        if (props.src) {
            const fileName = props.src.split('/').pop();
            ctx.fillStyle = '#666';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            const displayName = fileName.length > 20 ? fileName.substring(0, 17) + '...' : fileName;
            ctx.fillText(displayName, x + w/2, y + h + 5);
        }
    }
    
    renderRoller(ctx, widget, x, y, w, h) {
        const props = widget.props || {};
        const options = props.options ? props.options.split(',') : ['Option 1', 'Option 2', 'Option 3'];
        const selectedIndex = props.selected_index || 0;
        
        // Draw roller background
        ctx.fillStyle = '#fff';
        this.drawRoundedRect(ctx, x, y, w, h, 5);
        ctx.fill();
        
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 1;
        this.drawRoundedRect(ctx, x, y, w, h, 5);
        ctx.stroke();
        
        // Draw visible options (simplified - show selected only)
        if (options[selectedIndex]) {
            ctx.fillStyle = '#333';
            ctx.font = `${h * 0.4}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const text = options[selectedIndex].trim();
            const displayText = text.length > 15 ? text.substring(0, 12) + '...' : text;
            ctx.fillText(displayText, x + w/2, y + h/2);
        }
        
        // Draw up/down indicators
        ctx.fillStyle = '#666';
        ctx.beginPath();
        // Up arrow
        ctx.moveTo(x + w - 15, y + 10);
        ctx.lineTo(x + w - 25, y + 10);
        ctx.lineTo(x + w - 20, y + 5);
        ctx.closePath();
        ctx.fill();
        
        // Down arrow
        ctx.beginPath();
        ctx.moveTo(x + w - 15, y + h - 10);
        ctx.lineTo(x + w - 25, y + h - 10);
        ctx.lineTo(x + w - 20, y + h - 5);
        ctx.closePath();
        ctx.fill();
    }
    
    // ==================== متدهای کمکی ====================
    
    initializeFeatureCache() {
        // بررسی وجود FeatureRegistry و کش کردن رندررها
        if (window.FeatureRegistry && window.FeatureRegistry.getRenderer) {
            const commonFeatures = [
                'text', 'label', 'lvgl_label', 'lvgl_button', 'lvgl_slider',
                'lvgl_arc', 'lvgl_spinbox', 'lvgl_tabview', 'lvgl_led',
                'lvgl_spinner', 'lvgl_meter', 'lvgl_bar', 'lvgl_switch',
                'lvgl_checkbox', 'lvgl_dropdown', 'lvgl_img', 'image',
                'icon', 'line', 'graph', 'shape_rect', 'shape_circle',
                'rounded_rect', 'progress_bar', 'qr_code'
            ];
            
            commonFeatures.forEach(type => {
                const renderer = window.FeatureRegistry.getRenderer(type);
                if (renderer) {
                    this.featureRenderers[type] = renderer;
                }
            });
        }
    }
    
    getFeatureRenderer(type) {
        return this.featureRenderers[type] || 
               (window.FeatureRegistry && window.FeatureRegistry.getRenderer(type));
    }
    
    async drawWithFeatureRenderer(ctx, widget, x, y, w, h, renderer) {
        try {
            // یک المان موقت برای رندر feature ایجاد کن
            const tempDiv = document.createElement('div');
            tempDiv.style.width = w + 'px';
            tempDiv.style.height = h + 'px';
            tempDiv.style.position = 'absolute';
            tempDiv.style.left = '-9999px';
            tempDiv.style.top = '-9999px';
            tempDiv.style.overflow = 'hidden';
            document.body.appendChild(tempDiv);
            
            // رندر feature
            await renderer(tempDiv, widget, {
                getColorStyle: (color) => this.parseColor(color)
            });
            
            // کشیدن مستطیل ساده به جای محتوای پیچیده
            ctx.fillStyle = '#333';
            this.drawRoundedRect(ctx, x, y, w, h, 3);
            ctx.fill();
            
            // متن نوع ویجت
            ctx.fillStyle = '#fff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const displayType = widget.type.replace('lvgl_', '');
            ctx.fillText(displayType, x + w/2, y + h/2);
            
            document.body.removeChild(tempDiv);
            
        } catch (error) {
            console.warn(`Failed to render ${widget.type} with feature:`, error);
            // رندر ساده
            ctx.fillStyle = '#222';
            this.drawRoundedRect(ctx, x, y, w, h, 3);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(widget.type.replace('lvgl_', ''), x + w/2, y + h/2);
        }
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
        
        let clicked = null;
        
        // بررسی از آخر به اول
        for (let i = widgets.length - 1; i >= 0; i--) {
            const widget = widgets[i];
            if (this.isPointInWidget(x, y, widget)) {
                clicked = widget;
                break;
            }
        }
        
        if (clicked) {
            this.updateWidgetInfo(clicked);
            this.logEvent(`Clicked: ${clicked.type}`);
            this.handleWidgetInteraction(clicked, x, y, ctx, widgets);
        } else {
            this.logEvent('Clicked: background');
        }
    }
    
    isPointInWidget(x, y, widget) {
        const wx = widget.x || 0;
        const wy = widget.y || 0;
        const ww = widget.width || 100;
        const wh = widget.height || 40;
        return x >= wx && x <= wx + ww && y >= wy && y <= wy + wh;
    }
    
    handleWidgetInteraction(widget, x, y, ctx, widgets) {
        widget.props = widget.props || {};
        
        switch(widget.type) {
            case 'lvgl_slider':
                const isVertical = widget.props.vertical || false;
                const min = widget.props.min || 0;
                const max = widget.props.max || 100;
                
                if (isVertical) {
                    const relativeY = 1 - ((y - widget.y) / widget.height);
                    widget.props.value = Math.round(min + (relativeY * (max - min)));
                } else {
                    const relativeX = (x - widget.x) / widget.width;
                    widget.props.value = Math.round(min + (relativeX * (max - min)));
                }
                widget.props.value = Math.max(min, Math.min(max, widget.props.value));
                this.logEvent(`Slider value: ${widget.props.value}`);
                break;
                
            case 'lvgl_spinbox':
                const btnWidth = Math.min(widget.height, widget.width * 0.3);
                const isMinusBtn = x < widget.x + btnWidth;
                const isPlusBtn = x > widget.x + widget.width - btnWidth;
                
                if (isMinusBtn) {
                    widget.props.value = (widget.props.value || 0) - (widget.props.step || 1);
                    this.logEvent(`Spinbox decremented: ${widget.props.value}`);
                } else if (isPlusBtn) {
                    widget.props.value = (widget.props.value || 0) + (widget.props.step || 1);
                    this.logEvent(`Spinbox incremented: ${widget.props.value}`);
                }
                
                const minVal = widget.props.min || 0;
                const maxVal = widget.props.max || 100;
                widget.props.value = Math.max(minVal, Math.min(maxVal, widget.props.value || 0));
                break;
                
            case 'lvgl_tabview':
                const tabs = widget.props.tabs ? widget.props.tabs.split(',') : ['Tab 1', 'Tab 2'];
                const tabHeight = Math.min(30, widget.height * 0.15);
                
                if (y >= widget.y && y <= widget.y + tabHeight) {
                    const tabWidth = widget.width / Math.min(tabs.length, 5);
                    const tabIndex = Math.floor((x - widget.x) / tabWidth);
                    
                    if (tabIndex >= 0 && tabIndex < tabs.length) {
                        widget.props.active_tab = tabIndex;
                        this.logEvent(`Tab changed to: ${tabs[tabIndex]}`);
                    }
                }
                break;
                
            case 'lvgl_arc':
                const centerX = widget.x + widget.width/2;
                const centerY = widget.y + widget.height/2;
                const radius = Math.min(widget.width, widget.height) * 0.4;
                
                const dx = x - centerX;
                const dy = y - centerY;
                const angle = Math.atan2(dy, dx);
                
                let normalizedAngle = (angle + Math.PI/2) % (Math.PI * 2);
                if (normalizedAngle < 0) normalizedAngle += Math.PI * 2;
                
                const percent = Math.min(1, Math.max(0, normalizedAngle / (Math.PI * 1.5)));
                const arcMin = widget.props.min || 0;
                const arcMax = widget.props.max || 100;
                widget.props.value = Math.round(arcMin + (percent * (arcMax - arcMin)));
                
                this.logEvent(`Arc value: ${widget.props.value}`);
                break;
                
            case 'lvgl_switch':
                widget.props.value = !widget.props.value;
                this.logEvent(`Switch ${widget.props.value ? 'ON' : 'OFF'}`);
                break;
                
            case 'lvgl_checkbox':
                widget.props.value = !widget.props.value;
                this.logEvent(`Checkbox ${widget.props.value ? 'checked' : 'unchecked'}`);
                break;
                
            case 'lvgl_button':
                this.logEvent('Button clicked');
                break;
                
            case 'lvgl_led':
                widget.props.brightness = widget.props.brightness > 127 ? 0 : 255;
                this.logEvent(`LED brightness: ${widget.props.brightness}`);
                break;
                
            default:
                this.logEvent(`${widget.type} clicked`);
        }
        
        this.renderPreview(ctx, widgets);
    }
    
    updateWidgetInfo(widget) {
        const info = document.getElementById('widgetInfo');
        if (!info) return;
        
        const props = widget.props || {};
        const propsList = Object.entries(props)
            .filter(([key]) => !key.startsWith('_'))
            .map(([key, value]) => `<div>${key}: <strong>${JSON.stringify(value)}</strong></div>`)
            .join('');
        
        info.innerHTML = `
            <div style="background:var(--bg-input);padding:10px;border-radius:6px;border-left:4px solid var(--accent);">
                <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
                    <strong>${widget.type}</strong>
                    <span style="font-size:10px;background:var(--bg-subtle);padding:2px 6px;border-radius:3px;">${widget.id || 'no-id'}</span>
                </div>
                <div>Pos: (${widget.x||0}, ${widget.y||0})</div>
                <div>Size: ${widget.width||0}×${widget.height||0}</div>
                ${propsList}
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
    
    parseColor(color) {
        if (!color) return '#000';
        if (color.startsWith('0x')) return '#' + color.slice(2);
        if (color.startsWith('#')) return color;
        const colors = {
            'red': '#ff0000', 'green': '#00ff00', 'blue': '#0000ff',
            'yellow': '#ffff00', 'white': '#ffffff', 'black': '#000000',
            'gray': '#808080', 'grey': '#808080', 'orange': '#ffa500',
            'purple': '#800080', 'pink': '#ffc0cb', 'brown': '#a52a2a',
            'cyan': '#00ffff', 'magenta': '#ff00ff', 'primary': '#007bff',
            'lightblue': '#add8e6', 'lightgray': '#d3d3d3', 'darkgray': '#a9a9a9',
            'darkblue': '#00008b', 'darkgreen': '#006400', 'darkred': '#8b0000'
        };
        return colors[color.toLowerCase()] || '#000';
    }
    
    hexToRgba(hex, alpha = 1) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    
    darkenColor(hex, percent) {
        const num = parseInt(hex.slice(1), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return '#' + (
            0x1000000 +
            (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)
        ).toString(16).slice(1);
    }
    
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
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.reviewMenu = new ReviewMenu();
});