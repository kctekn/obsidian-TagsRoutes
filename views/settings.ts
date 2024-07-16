import { Setting, ExtraButtonComponent, ColorComponent, SliderComponent } from 'obsidian';
import TagsRoutes from 'main';

export class settingGroup {
    public readonly id: string;
    public readonly rootContainer: HTMLElement;
    private headContainer: HTMLElement;
    private holdContainer: HTMLElement;
    private handleButton: ExtraButtonComponent;
    plugin: TagsRoutes;

    /*
       This constructor will create:
        - a root container:
        - with a head container
        - and a hold container ready to add sub components
        - with in the given comtainer
    */
    constructor(plugin: TagsRoutes, id: string, name: string, type: "root"|"group"|"flex-box" = "group" ) {//isRoot: boolean = false) {
        this.plugin = plugin
        this.rootContainer = document.createElement('div')
        this.rootContainer.id = id;

        if (type === "flex-box")
        {
        this.holdContainer = this.rootContainer.createDiv('div')
            this.holdContainer.addClass('setting-flex-box')
            return this;
        }

        this.headContainer = this.rootContainer.createEl('div', { cls: 'title-bar' })
        this.addColorPicker = this.addColorPicker.bind(this)

        //head.textContent = name;
        this.holdContainer = this.rootContainer.createDiv('div')
        this.holdContainer.addClass('group-holder')


        if (type==="group") {
            this.handleButton = new ExtraButtonComponent(this.headContainer.createEl('span', { cls: 'group-bar-button' }))
                .setIcon("chevron-down")
                .setTooltip("Close " + name)
                .onClick(() => {
                        if (this.holdContainer.style.display === 'none') {
                            this.holdContainer.style.display = 'inline';
                        //this.settingButton.extraSettingsEl.addClass = 'flex-end';
                        //  this.settingButton.extraSettingsEl.style.justifyContent = 'flex-end';
                        this.handleButton.setTooltip("Close " + name);
                        this.handleButton.setIcon("x")

                    } else {
                        this.holdContainer.style.display = 'none';
                        this.handleButton.setTooltip("Open " + name);
                        this.handleButton.setIcon("chevron-down")
                    }
                });
            //  this.handleButton.extraSettingsEl.style.justifyContent = 'flex-end';
            //this.settingsButton.extraSettingsEl.addClasses(["clickable-icon"])
            this.headContainer.createEl('span', { cls: 'group-bar-text' }).textContent = name;
        } else if (type==="root") {
            // use a solid style for root container
            this.handleButton = new ExtraButtonComponent(this.headContainer.createEl('div', { cls: 'root-title-bar' }))
                //                .setIcon("x")
                .setTooltip("Open " + name)
                .onClick(() => {
                    if (this.holdContainer.style.display === 'none') {
                        this.holdContainer.style.display = 'block';
                        //this.settingButton.extraSettingsEl.addClass = 'flex-end';
                        //  this.settingButton.extraSettingsEl.style.justifyContent = 'flex-end';
                        this.handleButton.setTooltip("Close " + name);
                        this.handleButton.setIcon("x")

                    } else {
                        this.holdContainer.style.display = 'none';
                        this.handleButton.setTooltip("Open " + name);
                        this.handleButton.setIcon("settings")
                    }
                });
            if (this.holdContainer.style.display === 'none') {
                this.handleButton.setIcon("x")
            } else {
                this.handleButton.setIcon("settings")
            }

            this.handleButton.extraSettingsEl.style.justifyContent = 'flex-end';
            //this.settingsButton.extraSettingsEl.addClasses(["clickable-icon"])
            // this.headContainer.createEl('span', { cls: 'title-bar' }).textContent = name;            
        } 
        //  return;

        return this
    }
    /*
        it add a htmlelement , or a settinggroup's root container
        to current hold container
    */
    public add({ arg = null }: { arg?: HTMLElement | settingGroup | null } = {}): this {
        if (arg instanceof HTMLElement) {
            this.holdContainer.appendChild(arg);
        } else if (arg instanceof settingGroup) {
            this.holdContainer.appendChild(arg.rootContainer)
        }
        return this
    }

    public hide() {
        this.holdContainer.style.display = 'none'
        return this
    }
    
    public hideAll() {
        const subholders = Array.from(this.rootContainer.getElementsByClassName('group-holder'));
        subholders.forEach(element => {
            if (element instanceof HTMLElement) {
                (element as HTMLElement).style.display = 'none';
            }
        });
    }

    public show() {
        this.holdContainer.style.display = 'block'
        return this
    }
    public addButton(buttonText: string, buttonClass: string, buttonCallback: () => void) {
        const button = this.holdContainer.createEl('div').createEl('button', { text: buttonText, cls: buttonClass });
        button.addEventListener('click', buttonCallback);
        return this;
    }
    addSlider(name: string, min: number, max: number, step: number, defaultNum: number, cb: (v: number) => void,cls:string = "setting-item-block") {
        let _slider: SliderComponent| undefined;
        const slider = new Setting(this.holdContainer)
            .setName(name)
            .setClass("mod-slider")
            .addSlider(slider =>
                _slider = slider
                    .setLimits(min, max, step)
                    .setValue(defaultNum)
                    .setDynamicTooltip()
                    .onChange(async value => cb(value)))
        slider.setClass(cls)
        if (_slider!==undefined)
        _slider.setValue(defaultNum)
        return this;
    }
    addColorPicker(name: string, defaultColor: string, cb: (v: string) => void) {
        const colorpicker = new Setting(this.holdContainer)
            .setName(name)
            .setDesc(defaultColor || "#000000")
            .addColorPicker(picker => {
                picker
                    .onChange(async (value) => {
                        cb(value)
                        setTimeout(() => colorpicker.setDesc(value), 0);
                    })
                    .setValue(defaultColor)

            })
        colorpicker.setClass("setting-item-inline")
        return this;
    }
    addText(name: string, cb: (v: string) => void)
    {
        const texter = new Setting(this.holdContainer)
            .setName(name)
            //  .setDesc(this.plugin.settings.link_particle_color || "#000000")
            .addText(picker => picker
                .setPlaceholder("file path")
                .onChange(async (value) => {
                    cb(value)
                    
                })
        )
        texter.setClass("setting-item-block")
     //   colorpicker.setClass("setting-item-inline")
        return this;        
    }
    attachEl(container: HTMLElement) {
        container.append(this.rootContainer)
        return this;
    }
}