// frontend/js/io/evm_code_generator.js - VERSION FINAL STANDARD
class EVMCodeGenerator {
    constructor() {
        this.name = "EVM Code Generator";
        this.version = "6.0.0";
    }
    
    async generate(context) {
        const appState = window.AppState || {};
        const currentPage = appState.getCurrentPage?.() || { widgets: [] };
        const widgets = currentPage.widgets || [];
        
        return this.generateStandardCode(widgets);
    }
    
    generateStandardCode(widgets) {
        const actFileName = "main"; // یا نام فایل از context
        
        // Generate event handlers
        let cb = '';
        widgets.forEach((widget, index) => {
            const id = this.getWidgetVarName(widget, index);
            if (widget.props?.events) {
                cb += this.template_evm_cb(id, widget.props.events);
            }
        });
        
        // Generate main body
        let body = `function lvgl_lv_${actFileName}() {\n`;
        body += `    // Screen setup\n`;
        body += `    var screen = lv.lv_scr_act();\n`;
        body += `    lv.lv_scr_load(screen);\n\n`;
        
        if (widgets.length === 0) {
            body += `    // No widgets defined\n`;
            body += `    var label = lv.lv_label_create(screen);\n`;
            body += `    lv.lv_label_set_text(label, "No widgets");\n`;
            body += `    lv.lv_obj_align(label, lv.LV_ALIGN_CENTER, 0, 0);\n`;
        } else {
            body += `    // Create widgets\n`;
            widgets.forEach((widget, index) => {
                const parent = widget.parent_id || 'screen';
                const id = this.getWidgetVarName(widget, index);
                const type = this.getWidgetEVMMap(widget.type);
                
                // Create widget
                body += `    // ${widget.type || 'obj'}\n`;
                body += `    ${this.template_evm_create(id, parent, type)}\n`;
                
                // Basic properties
                if (widget.x !== undefined) body += `    lv.lv_obj_set_x(${id}, ${widget.x});\n`;
                if (widget.y !== undefined) body += `    lv.lv_obj_set_y(${id}, ${widget.y});\n`;
                if (widget.width !== undefined) body += `    lv.lv_obj_set_width(${id}, ${widget.width});\n`;
                if (widget.height !== undefined) body += `    lv.lv_obj_set_height(${id}, ${widget.height});\n`;
                
                // Alignment
                if (widget.align) {
                    const alignCode = this.getAlignCode(widget.align);
                    const xOffset = widget.align_offset_x || 0;
                    const yOffset = widget.align_offset_y || 0;
                    body += `    lv.lv_obj_align(${id}, ${alignCode}, ${xOffset}, ${yOffset});\n`;
                }
                
                // Widget-specific APIs
                if (widget.props) {
                    for (const [api, value] of Object.entries(widget.props)) {
                        if (api === 'events' || api === 'styles') continue;
                        
                        if (api === 'text' || api === 'src' || api === 'options') {
                            body += `    ${this.template_evm_api_simple(id, type, `set_${api}`, value)}\n`;
                        } else if (api === 'value' || api === 'range') {
                            body += `    ${this.template_evm_setter_simple(id, type, api, value)}\n`;
                        }
                    }
                }
                
                // Styles
                if (widget.styles && widget.styles.length > 0) {
                    body += this.template_evm_styles({
                        id,
                        type,
                        styles: widget.styles,
                        data: widget.props || {}
                    });
                }
                
                // Events
                if (widget.props?.events) {
                    body += `    lv.lv_obj_add_event_cb(${id}, ${id}_event_handler, lv.LV_EVENT_ALL, null);\n`;
                }
                
                body += `\n`;
            });
        }
        
        body += `}\n`;
        
        // Return full template
        return this.template_evm_all(body, cb, actFileName);
    }
    
    // ==================== Template Functions ====================
    
    template_evm_create(id, parent_id, type) {
        return `var ${id} = lv.${this.getEVMCreateFunction(type)}(${parent_id});`;
    }
    
    template_evm_setter_simple(id, type, attr, param) {
        const setterFunc = this.getEVMSetterFunction(type, attr);
        const formattedValue = this.formatEVMValue(attr, param);
        return `lv.${setterFunc}(${id}, ${formattedValue});`;
    }
    
    template_evm_api_simple(id, type, api, param) {
        const formattedValue = this.formatEVMValue(api, param);
        const funcName = this.getEVMApiFunction(type, api);
        
        // فارسی support
        if ((api === 'set_text' || api === 'set_options') && this.containsPersian(param)) {
            return `    lv.lv_obj_set_persian_font(${id});\n    lv.lv_obj_set_rtl(${id});\n    lv.${funcName}(${id}, ${formattedValue});`;
        }
        
        return `lv.${funcName}(${id}, ${formattedValue});`;
    }
    
    template_evm_cb(id, events) {
        let code = `// Event handler for ${id}\n`;
        code += `function ${id}_event_handler(obj, event_code) {\n`;
        code += `    switch(event_code) {\n`;
        
        if (events.clicked) {
            code += `        case lv.LV_EVENT_CLICKED:\n`;
            code += `            ${events.clicked}\n`;
            code += `            break;\n`;
        }
        
        if (events.value_changed) {
            code += `        case lv.LV_EVENT_VALUE_CHANGED:\n`;
            code += `            ${events.value_changed}\n`;
            code += `            break;\n`;
        }
        
        code += `    }\n`;
        code += `}\n\n`;
        return code;
    }
    
    template_evm_all(body, cb, actFileName) {
        return `// ${actFileName}.js - Generated by LVGL Builder for EVM Runtime
// Target: ESP32 / IoT Device
// EVM Version: 2.0 (QuickJS compatible)

var lv = require('@native.lvgl');
var styleModule = require('@native.lv_style');

/**********************
 *   EVENT HANDLERS
 **********************/
${cb}
/**********************
 *   MAIN UI FUNCTION
 **********************/
${body}

// Auto-execute the UI function
lvgl_lv_${actFileName}();

// Timer for LVGL task handler
setInterval(function() {
    lv.lv_task_handler();
}, 50);

console.log("UI initialized successfully");`;
    }
    
    template_evm_styles(node) {
        let code = '';
        const { id, type, styles, data } = node;
        
        if (!styles || styles.length === 0) {
            return '';
        }
        
        // Check for Persian text
        const hasPersianText = data['text'] && this.containsPersian(data['text']);
        
        // Arc specific styles
        if (type === 'arc') {
            code += `    // Arc styles\n`;
            code += `    styleModule.lv_arc_hide_knob(${id});\n`;
            
            // Process arc styles
            for (const style of styles) {
                const param = data[style];
                if (param === undefined || param === null) continue;
                
                const formattedValue = this.formatEVMStyleValue(style, param);
                
                switch(style) {
                    case 'arc_width':
                        code += `    styleModule.set_style_arc_width(${id}, ${formattedValue});\n`;
                        code += `    styleModule.set_style_arc_indic_width(${id}, ${formattedValue});\n`;
                        break;
                    case 'arc_color':
                        code += `    styleModule.set_style_arc_color(${id}, ${formattedValue});\n`;
                        code += `    styleModule.set_style_arc_indic_color(${id}, ${formattedValue});\n`;
                        break;
                    case 'text_font':
                        code += `    styleModule.set_style_text_font(${id}, ${formattedValue});\n`;
                        break;
                    default:
                        if (style.includes('.')) {
                            const cleanApi = style.split('.')[1];
                            code += `    styleModule.set_style_${cleanApi}(${id}, ${formattedValue});\n`;
                        } else {
                            code += `    styleModule.set_style_${style}(${id}, ${formattedValue});\n`;
                        }
                }
            }
        } 
        // Other widgets
        else {
            if (hasPersianText) {
                code += `    // Persian text support\n`;
                code += `    lv.lv_obj_set_persian_font(${id});\n`;
                code += `    lv.lv_obj_set_rtl(${id});\n`;
                
                // Check if font style is defined
                const hasFont = styles.some(s => s === 'text_font');
                if (!hasFont) {
                    code += `    styleModule.set_style_text_font(${id}, lv.lvgl_style_get_persian_font("persian_16"));\n`;
                }
            }
            
            for (const style of styles) {
                const param = data[style];
                if (param === undefined || param === null) continue;
                
                const formattedValue = this.formatEVMStyleValue(style, param);
                
                if (style === 'text_font' && hasPersianText) {
                    code += `    styleModule.set_style_text_font(${id}, lv.lvgl_style_get_persian_font("persian_16"));\n`;
                } else if (style.includes('.')) {
                    const cleanApi = style.split('.')[1];
                    code += `    styleModule.set_style_${cleanApi}(${id}, ${formattedValue});\n`;
                } else {
                    code += `    styleModule.set_style_${style}(${id}, ${formattedValue});\n`;
                }
            }
        }
        
        return code ? '\n    ' + code.trim() : '';
    }
    
    // ==================== Helper Functions ====================
    
    getWidgetVarName(widget, index) {
        return widget.id ? widget.id.replace(/[^a-zA-Z0-9_]/g, '_') : `widget${index + 1}`;
    }
    
    getWidgetEVMMap(widgetType) {
        const map = {
            'lvgl_label': 'label',
            'lvgl_button': 'btn',
            'lvgl_slider': 'slider',
            'lvgl_switch': 'switch',
            'lvgl_checkbox': 'checkbox',
            'lvgl_arc': 'arc',
            'lvgl_img': 'img',
            'lvgl_textarea': 'textarea',
            'lvgl_dropdown': 'dropdown',
            'lvgl_spinbox': 'spinbox',
            'lvgl_tabview': 'tabview',
            'icon': 'label',
            'shape_rect': 'obj',
            'rounded_rect': 'obj',
            'shape_circle': 'obj'
        };
        return map[widgetType] || 'obj';
    }
    
    getEVMCreateFunction(type) {
        const map = {
            'obj': 'lv_obj_create',
            'label': 'lv_label_create',
            'btn': 'lv_btn_create',
            'slider': 'lv_slider_create',
            'arc': 'lv_arc_create',
            'img': 'lv_img_create',
            'checkbox': 'lv_checkbox_create',
            'switch': 'lv_switch_create',
            'textarea': 'lv_textarea_create',
            'dropdown': 'lv_dropdown_create',
            'spinbox': 'lv_spinbox_create',
            'tabview': 'lv_tabview_create'
        };
        return map[type] || 'lv_obj_create';
    }
    
    getEVMSetterFunction(type, attr) {
        const generalSetters = {
            'x': 'lv_obj_set_x',
            'y': 'lv_obj_set_y',
            'pos': 'lv_obj_set_pos',
            'width': 'lv_obj_set_width',
            'height': 'lv_obj_set_height',
            'size': 'lv_obj_set_size',
        };
        
        if (generalSetters[attr]) return generalSetters[attr];
        return `lv_${type}_set_${attr}`;
    }
    
    getEVMApiFunction(type, api) {
        const specialAPIs = {
            'label': { 'set_text': 'lv_label_set_text' },
            'btn': { 'set_text': 'lv_btn_set_text' },
            'arc': {
                'set_value': 'lv_arc_set_value',
                'set_range': 'lv_arc_set_range',
            },
            'slider': { 'set_value': 'lv_slider_set_value' },
            'checkbox': { 'set_text': 'lv_checkbox_set_text' },
            'textarea': { 'set_text': 'lv_textarea_set_text' },
            'dropdown': { 'set_options': 'lv_dropdown_set_options' },
            'img': { 'set_src': 'lv_img_set_src' }
        };
        
        if (specialAPIs[type] && specialAPIs[type][api]) {
            return specialAPIs[type][api];
        }
        return `lv_${type}_${api}`;
    }
    
    getAlignCode(align) {
        const map = {
            'center': 'lv.LV_ALIGN_CENTER',
            'top_left': 'lv.LV_ALIGN_TOP_LEFT',
            'top_mid': 'lv.LV_ALIGN_TOP_MID',
            'top_right': 'lv.LV_ALIGN_TOP_RIGHT',
            'left_mid': 'lv.LV_ALIGN_LEFT_MID',
            'right_mid': 'lv.LV_ALIGN_RIGHT_MID',
            'bottom_left': 'lv.LV_ALIGN_BOTTOM_LEFT',
            'bottom_mid': 'lv.LV_ALIGN_BOTTOM_MID',
            'bottom_right': 'lv.LV_ALIGN_BOTTOM_RIGHT'
        };
        return map[align] || 'lv.LV_ALIGN_CENTER';
    }
    
    formatEVMValue(attr, value) {
        if (value === undefined || value === null) return 'null';
        
        if (typeof value === 'string') {
            let cleanValue = value;
            if ((cleanValue.startsWith('"') && cleanValue.endsWith('"')) || 
                (cleanValue.startsWith("'") && cleanValue.endsWith("'"))) {
                cleanValue = cleanValue.slice(1, -1);
            }
            
            // Text
            if (attr.includes('text') || attr.includes('src') || attr.includes('options')) {
                return `"${cleanValue}"`;
            }
            
            // Numbers
            if (!isNaN(cleanValue) && cleanValue.trim() !== '') {
                return cleanValue;
            }
            
            // Booleans
            if (cleanValue.toLowerCase() === 'false') return 'false';
            if (cleanValue.toLowerCase() === 'true') return 'true';
            
            return `"${cleanValue}"`;
        }
        
        if (typeof value === 'number') {
            if (attr.includes('color')) {
                return `lv.lv_color_hex(0x${value.toString(16).padStart(6, '0')})`;
            }
            return value;
        }
        
        if (typeof value === 'boolean') {
            return value ? 'true' : 'false';
        }
        
        return JSON.stringify(value);
    }
    
    formatEVMStyleValue(styleApi, value) {
        if (value === undefined || value === null) return '0';
        
        if (typeof value === 'string') {
            let cleanValue = value;
            if ((cleanValue.startsWith('"') && cleanValue.endsWith('"')) || 
                (cleanValue.startsWith("'") && cleanValue.endsWith("'"))) {
                cleanValue = cleanValue.slice(1, -1);
            }
            
            // Font
            if (styleApi.includes('font')) {
                if (cleanValue.includes('font_montserrat')) {
                    const sizeMatch = cleanValue.match(/font_montserrat_(\d+)/);
                    if (sizeMatch) return `lv.lvgl_style_get_font(${sizeMatch[1]})`;
                    return 'lv.lvgl_style_get_font(16)';
                }
                if (!isNaN(cleanValue)) {
                    return `lv.lvgl_style_get_font(${cleanValue})`;
                }
                if (cleanValue.includes('persian')) {
                    const sizeMatch = cleanValue.match(/persian_(\d+)/);
                    if (sizeMatch) return `lv.lvgl_style_get_persian_font("persian_${sizeMatch[1]}")`;
                    return 'lv.lvgl_style_get_persian_font("persian_16")';
                }
                return cleanValue;
            }
            
            // Color
            if (styleApi.includes('color')) {
                if (cleanValue.startsWith('0x')) {
                    return `lv.lv_color_hex(${cleanValue})`;
                }
                if (cleanValue.startsWith('#')) {
                    return `lv.lv_color_hex(0x${cleanValue.slice(1)})`;
                }
                if (!isNaN(cleanValue)) {
                    return `lv.lv_color_hex(0x${parseInt(cleanValue).toString(16).padStart(6, '0')})`;
                }
            }
            
            // Opa
            if (styleApi.includes('opa')) {
                if (cleanValue === '255' || cleanValue.toLowerCase() === 'cover') return '255';
                if (cleanValue === '0' || cleanValue.toLowerCase() === 'transp') return '0';
            }
            
            // Boolean
            if (cleanValue.toLowerCase() === 'false') return 'false';
            if (cleanValue.toLowerCase() === 'true') return 'true';
            
            // Number
            if (!isNaN(cleanValue) && cleanValue.trim() !== '') {
                return cleanValue;
            }
            
            return `"${cleanValue}"`;
        }
        
        if (typeof value === 'number') {
            if (styleApi.includes('color')) {
                return `lv.lv_color_hex(0x${value.toString(16).padStart(6, '0')})`;
            }
            return value;
        }
        
        if (typeof value === 'boolean') {
            return value ? 'true' : 'false';
        }
        
        return JSON.stringify(value);
    }
    
    containsPersian(text) {
        if (typeof text !== 'string') return false;
        
        let cleanText = text;
        if ((cleanText.startsWith('"') && cleanText.endsWith('"')) || 
            (cleanText.startsWith("'") && cleanText.endsWith("'"))) {
            cleanText = cleanText.slice(1, -1);
        }
        
        const persianRange = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
        return persianRange.test(cleanText);
    }
}

window.EVMCodeGenerator = new EVMCodeGenerator();