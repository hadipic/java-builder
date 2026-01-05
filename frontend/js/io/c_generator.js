class CCodeGenerator {
    constructor() {
        this.name = "C Code Generator";
        this.version = "2.0.0";
    }
    
    async generate(state) {
        console.log('[CCodeGenerator] Generating C code...');
        
        // روش صحیح: مستقیماً از AppState بخوان
        const appState = window.AppState || {};
        const currentPage = appState.getCurrentPage?.() || { widgets: [] };
        const deviceModel = appState.deviceModel || 'esp32';
        const deviceProfile = window.DEVICE_PROFILES?.[deviceModel] || {};
        
        // گرفتن ویجت‌های واقعی
        const widgets = currentPage.widgets || [];
        console.log(`[CCodeGenerator] Found ${widgets.length} real widgets`);
        
        // اگر ویجتی نبود، نمونه نمایشی بساز
        if (widgets.length === 0) {
            return this.generateDemoCode(deviceProfile);
        }
        
        // تولید کد واقعی
        return this.generateRealCode(widgets, deviceProfile);
    }
    
    generateRealCode(widgets, deviceProfile) {
        const lines = [];
        
        // Header
        lines.push(`/*
 * LVGL C Code - Generated from ESPHome Designer
 * Device: ${deviceProfile.name || 'Unknown'}
 * Display: ${deviceProfile.width || 240}x${deviceProfile.height || 240}
 * Widgets: ${widgets.length}
 * Generated: ${new Date().toLocaleString()}
 */`);
        
        // Includes
        lines.push('');
        lines.push('#include <stdio.h>');
        lines.push('#include <stdlib.h>');
        lines.push('#include <string.h>');
        lines.push('#include "lvgl.h"');
        lines.push('');
        lines.push('#include "esp_log.h"');
        lines.push('#include "freertos/FreeRTOS.h"');
        lines.push('#include "freertos/task.h"');
        lines.push('');
        
        // Defines
        lines.push('/* Display dimensions */');
        lines.push(`#define DISP_WIDTH    ${deviceProfile.width || 240}`);
        lines.push(`#define DISP_HEIGHT   ${deviceProfile.height || 240}`);
        lines.push('');
        
        // Variables
        lines.push('/* Widget variables */');
        lines.push('static lv_obj_t *scr;');
        lines.push('');
        
        widgets.forEach((widget, index) => {
            const varName = this.getVariableName(widget, index);
            lines.push(`static lv_obj_t *${varName};`);
        });
        
        lines.push('');
        
        // Function prototypes
        lines.push('/* Function prototypes */');
        lines.push('void create_ui(void);');
        lines.push('void register_events(void);');
        lines.push('');
        
        // UI Setup function
        lines.push('void create_ui(void)');
        lines.push('{');
        lines.push('    scr = lv_scr_act();');
        lines.push('    lv_obj_clean(scr);');
        lines.push('');
        
        // Create each widget
        widgets.forEach((widget, index) => {
            lines.push(...this.createWidgetCode(widget, index));
        });
        
        lines.push('}');
        lines.push('');
        
        // Event handlers
        const hasEvents = widgets.some(w => this.isInteractiveWidget(w.type));
        if (hasEvents) {
            lines.push('/* Event handlers */');
            lines.push('');
            
            widgets.forEach((widget, index) => {
                if (this.isInteractiveWidget(widget.type)) {
                    const varName = this.getVariableName(widget, index);
                    lines.push(`static void ${varName}_event_cb(lv_event_t *e)`);
                    lines.push('{');
                    lines.push('    lv_event_code_t code = lv_event_get_code(e);');
                    lines.push('    ');
                    lines.push('    switch(code) {');
                    lines.push('        case LV_EVENT_CLICKED:');
                    lines.push(`            ESP_LOGI("UI", "${varName} clicked");`);
                    lines.push('            break;');
                    lines.push('        case LV_EVENT_VALUE_CHANGED:');
                    lines.push(`            ESP_LOGI("UI", "${varName} value changed");`);
                    lines.push('            break;');
                    lines.push('        default:');
                    lines.push('            break;');
                    lines.push('    }');
                    lines.push('}');
                    lines.push('');
                }
            });
            
            lines.push('void register_events(void)');
            lines.push('{');
            
            widgets.forEach((widget, index) => {
                if (this.isInteractiveWidget(widget.type)) {
                    const varName = this.getVariableName(widget, index);
                    const event = widget.type === 'lvgl_button' ? 'LV_EVENT_CLICKED' : 'LV_EVENT_VALUE_CHANGED';
                    lines.push(`    lv_obj_add_event_cb(${varName}, ${varName}_event_cb, ${event}, NULL);`);
                }
            });
            
            lines.push('}');
            lines.push('');
        } else {
            lines.push('void register_events(void) {}');
            lines.push('');
        }
        
        // Main function
        lines.push('void app_main(void)');
        lines.push('{');
        lines.push('    /* Initialize LVGL */');
        lines.push('    lv_init();');
        lines.push('');
        lines.push('    /* Initialize your display driver here */');
        lines.push('    /* For ${deviceProfile.board || "esp32"} */');
        lines.push('');
        lines.push('    /* Create UI */');
        lines.push('    create_ui();');
        lines.push('    register_events();');
        lines.push('');
        lines.push('    ESP_LOGI("MAIN", "App started with %d widgets", ' + widgets.length + ');');
        lines.push('');
        lines.push('    /* Main loop */');
        lines.push('    while (1) {');
        lines.push('        lv_timer_handler();');
        lines.push('        vTaskDelay(pdMS_TO_TICKS(5));');
        lines.push('    }');
        lines.push('}');
        
        return lines.join('\n');
    }
    
    createWidgetCode(widget, index) {
        const varName = this.getVariableName(widget, index);
        const props = widget.properties || {};
        const type = widget.type || 'obj';
        
        const lines = [];
        
        lines.push(`    // ${type} - ${widget.id || 'widget_' + index}`);
        
        // Create widget based on type
        switch(type) {
            case 'lvgl_slider':
                lines.push(`    ${varName} = lv_slider_create(scr);`);
                if (props.x !== undefined && props.y !== undefined) {
                    lines.push(`    lv_obj_set_pos(${varName}, ${props.x}, ${props.y});`);
                }
                if (props.width !== undefined && props.height !== undefined) {
                    lines.push(`    lv_obj_set_size(${varName}, ${props.width}, ${props.height});`);
                }
                lines.push(`    lv_slider_set_range(${varName}, ${props.min || 0}, ${props.max || 100});`);
                lines.push(`    lv_slider_set_value(${varName}, ${props.value || 50}, LV_ANIM_OFF);`);
                if (props.color) {
                    const color = this.formatColor(props.color);
                    lines.push(`    lv_obj_set_style_bg_color(${varName}, lv_color_hex(${color}), LV_PART_MAIN);`);
                }
                break;
                
            case 'lvgl_spinbox':
                lines.push(`    ${varName} = lv_spinbox_create(scr);`);
                if (props.x !== undefined && props.y !== undefined) {
                    lines.push(`    lv_obj_set_pos(${varName}, ${props.x}, ${props.y});`);
                }
                if (props.width !== undefined && props.height !== undefined) {
                    lines.push(`    lv_obj_set_size(${varName}, ${props.width}, ${props.height});`);
                }
                lines.push(`    lv_spinbox_set_range(${varName}, ${props.min || -1000}, ${props.max || 1000});`);
                lines.push(`    lv_spinbox_set_digit_format(${varName}, ${props.digits || 4}, 0);`);
                break;
                
            case 'lvgl_tabview':
                lines.push(`    ${varName} = lv_tabview_create(scr, LV_DIR_TOP, 50);`);
                if (props.x !== undefined && props.y !== undefined) {
                    lines.push(`    lv_obj_set_pos(${varName}, ${props.x}, ${props.y});`);
                }
                if (props.width !== undefined && props.height !== undefined) {
                    lines.push(`    lv_obj_set_size(${varName}, ${props.width}, ${props.height});`);
                }
                
                // Add tabs from YAML
                if (props.tabs && Array.isArray(props.tabs)) {
                    props.tabs.forEach((tab, tabIndex) => {
                        const tabName = typeof tab === 'object' ? tab.name : tab;
                        lines.push(`    lv_obj_t *${varName}_tab${tabIndex + 1} = lv_tabview_add_tab(${varName}, "${tabName}");`);
                    });
                } else {
                    lines.push(`    lv_obj_t *${varName}_tab1 = lv_tabview_add_tab(${varName}, "Tab 1");`);
                    lines.push(`    lv_obj_t *${varName}_tab2 = lv_tabview_add_tab(${varName}, "Tab 2");`);
                }
                break;
                
            case 'icon':
            case 'weather_icon':
                lines.push(`    ${varName} = lv_label_create(scr);`);
                if (props.x !== undefined && props.y !== undefined) {
                    lines.push(`    lv_obj_set_pos(${varName}, ${props.x}, ${props.y});`);
                }
                if (props.width !== undefined && props.height !== undefined) {
                    lines.push(`    lv_obj_set_size(${varName}, ${props.width}, ${props.height});`);
                }
                lines.push(`    lv_label_set_text(${varName}, "${props.icon || '★'}");`);
                break;
                
            case 'shape_rect':
            case 'rounded_rect':
            case 'shape_circle':
                lines.push(`    ${varName} = lv_obj_create(scr);`);
                if (props.x !== undefined && props.y !== undefined) {
                    lines.push(`    lv_obj_set_pos(${varName}, ${props.x}, ${props.y});`);
                }
                if (props.width !== undefined && props.height !== undefined) {
                    lines.push(`    lv_obj_set_size(${varName}, ${props.width}, ${props.height});`);
                }
                
                if (type === 'rounded_rect') {
                    lines.push(`    lv_obj_set_style_radius(${varName}, ${props.radius || 10}, 0);`);
                }
                
                if (props.fill === true || props.fill === 'true') {
                    lines.push(`    lv_obj_set_style_bg_opa(${varName}, LV_OPA_COVER, 0);`);
                } else {
                    lines.push(`    lv_obj_set_style_bg_opa(${varName}, LV_OPA_TRANSP, 0);`);
                }
                
                if (props.color) {
                    const color = this.formatColor(props.color);
                    lines.push(`    lv_obj_set_style_border_color(${varName}, lv_color_hex(${color}), 0);`);
                    if (props.fill === true || props.fill === 'true') {
                        lines.push(`    lv_obj_set_style_bg_color(${varName}, lv_color_hex(${color}), 0);`);
                    }
                }
                
                if (props.border_width !== undefined) {
                    lines.push(`    lv_obj_set_style_border_width(${varName}, ${props.border_width}, 0);`);
                }
                break;
                
            default:
                // Generic widget
                lines.push(`    ${varName} = lv_obj_create(scr);`);
                if (props.x !== undefined && props.y !== undefined) {
                    lines.push(`    lv_obj_set_pos(${varName}, ${props.x}, ${props.y});`);
                }
                if (props.width !== undefined && props.height !== undefined) {
                    lines.push(`    lv_obj_set_size(${varName}, ${props.width}, ${props.height});`);
                }
        }
        
        lines.push('');
        return lines;
    }
    
    getVariableName(widget, index) {
        if (widget.id && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(widget.id)) {
            return widget.id;
        }
        return `widget${index + 1}`;
    }
    
    isInteractiveWidget(type) {
        return ['lvgl_button', 'lvgl_switch', 'lvgl_slider', 'lvgl_checkbox'].includes(type);
    }
    
    formatColor(color) {
        if (typeof color === 'string') {
            if (color.startsWith('#')) {
                return `0x${color.substring(1)}`;
            }
            const colorMap = {
                'black': '0x000000',
                'white': '0xFFFFFF',
                'red': '0xFF0000',
                'green': '0x00FF00',
                'blue': '0x0000FF',
                'yellow': '0xFFFF00'
            };
            return colorMap[color.toLowerCase()] || '0x000000';
        }
        return `0x${color.toString(16).padStart(6, '0')}`;
    }
    
    generateDemoCode(deviceProfile) {
        return `/*
 * LVGL C Code - Demo
 * Device: ${deviceProfile.name || 'ESP32'}
 * Display: ${deviceProfile.width || 240}x${deviceProfile.height || 240}
 */
#include "lvgl.h"

void create_ui(void) {
    lv_obj_t *scr = lv_scr_act();
    
    lv_obj_t *label = lv_label_create(scr);
    lv_label_set_text(label, "No widgets defined");
    lv_obj_align(label, LV_ALIGN_CENTER, 0, 0);
}

void app_main(void) {
    lv_init();
    create_ui();
    
    while(1) {
        lv_timer_handler();
        vTaskDelay(pdMS_TO_TICKS(5));
    }
}`;
    }
}

window.CCodeGenerator = CCodeGenerator;