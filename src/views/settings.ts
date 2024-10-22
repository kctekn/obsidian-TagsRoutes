import { Setting, ExtraButtonComponent, SliderComponent, ToggleComponent, DropdownComponent } from 'obsidian';
import  TagsRoutes  from '../main';
export class settingGroup {
    public readonly id: string;
    public readonly rootContainer: HTMLElement;
    private headContainer: HTMLElement;
    private holdContainer: HTMLElement;
    private handleButton: ExtraButtonComponent;
    private _baseContainer: HTMLElement;
    private _goAction: boolean = true;
    plugin: TagsRoutes;
    /*
       This constructor will create:
        - a root container:
        - with a head container
        - and a hold container ready to add sub components
        - with in the given comtainer
    */
    constructor(plugin: TagsRoutes, id: string, name: string, type: "root" | "group" | "flex-box"|"normal-box" = "group") {//isRoot: boolean = false) {
        this.plugin = plugin
        this.rootContainer = document.createElement('div')
        this.rootContainer.id = id;
        if (type === "group") {
            this.rootContainer.addClass("tree-item")
            this.rootContainer.addClass("graph-control-section")
        }
        if (type === "flex-box") {
            this.holdContainer = this.rootContainer.createDiv('div')
            this.holdContainer.addClass('setting-flex-box')
            return this;
        }
        if (type === "normal-box") {
            this.holdContainer = this.rootContainer.createDiv('div')
            //this.holdContainer.addClass('setting-flex-box')
            return this;
        }        
        this.headContainer = this.rootContainer.createEl('div')//, { cls: 'title-bar' })
        this.holdContainer = this.rootContainer.createDiv('div')
        if (type === "group") {
            this.handleButton = new ExtraButtonComponent(this.headContainer.createEl('div', { cls: 'tree-item-icon collapse-icon' }))
                .setIcon("chevron-down")
                .setTooltip("Close " + name)
               /*  .onClick(() => {
                    if (this.holdContainer.style.display === 'none') {
                        this.holdContainer.style.display = 'inline';
                        this.handleButton.setTooltip("Close " + name);
                        this.handleButton.setIcon("x")
                    } else {
                        this.holdContainer.style.display = 'none';
                        this.handleButton.setTooltip("Open " + name);
                        this.handleButton.setIcon("chevron-down")
                    }
                }); */
                this.headContainer.createEl('div', { cls: 'tree-item-inner graph-control-section-header' }).textContent = name;
                this.headContainer.addClass("tree-item-self")
            
            this.headContainer.onclick = () => {
                if (this.holdContainer.style.display === 'none') {
                    this.holdContainer.style.display = 'inline';
                    this.handleButton.setTooltip("Close " + name);
                    this.handleButton.setIcon("x")
                } else {
                    this.holdContainer.style.display = 'none';
                    this.handleButton.setTooltip("Open " + name);
                    this.handleButton.setIcon("chevron-down")
                }
            };
            this.headContainer.addClass("mod-collapsible")
            this.holdContainer.addClass("tree-item-children")
        } else if (type === "root") {

            this.handleButton = new ExtraButtonComponent(this.headContainer)
                .setTooltip("Open " + name)
                .onClick(() => {
                    if (!this._goAction && this.holdContainer.style.display == 'none' &&
                        this._baseContainer.style.opacity == '100') {
                        this._baseContainer.style.opacity = '0'
                        this._baseContainer.addClass("is-close")
                        this.handleButton.setTooltip("Show settings button");
                        return;
                    }
                    if (this.holdContainer.style.display == 'none' &&
                        this._baseContainer.style.opacity == '0') {
                        this._baseContainer.style.opacity = '100'
                        this.handleButton.setTooltip("Open " + name);
                        this._goAction = true;
                        return;
                    }

                    if (this.holdContainer.style.display === 'none') {
                        this.holdContainer.style.display = 'block';
                        this.handleButton.setTooltip("Close " + name);
                        this.handleButton.setIcon("x")
                        this._baseContainer.removeClass("is-close")
                        this.headContainer.addClasses(["graph-controls-button", "mod-close"])
                        this.handleButton.extraSettingsEl.addClass("narrow-icon-style")
                        this._goAction = false
                    } else {
                        this.holdContainer.style.display = 'none';
                        this.handleButton.setTooltip("Open " + name);
                        this._baseContainer.addClass("is-close")
                        if (this._goAction == false) {
                            this.handleButton.setTooltip("Hide this button");
                            this.headContainer.removeClasses(["graph-controls-button", "mod-close"])
                            this.handleButton.extraSettingsEl.removeClass("narrow-icon-style")
                        }
                        this.handleButton.setIcon("settings")
                    }
                });
            if (this.holdContainer.style.display === 'none') {
                this.handleButton.setIcon("x")
            } else {
                this.handleButton.setIcon("settings")
            }
            this.handleButton.extraSettingsEl.style.justifyContent = 'flex-end';
        }
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
        const subholders = Array.from(this.rootContainer.getElementsByClassName('tree-item-children'));
        subholders.forEach(element => {
            if (element instanceof HTMLElement) {
                (element as HTMLElement).style.display = 'none';
            }
        });
        this._baseContainer.addClass("is-close")
        this._baseContainer.style.padding = '0px'

    }
    public show() {
        this.holdContainer.style.display = 'block'
        return this
    }
    public addExButton(buttonIcon:string,buttonDesc:string,buttonCallback:()=>void) {
        new ExtraButtonComponent(this.holdContainer.createEl('div', { cls: 'group-link-button' }))
            .setIcon(buttonIcon)
            .setTooltip(buttonDesc)
            .onClick(buttonCallback)
        return this;
    }
    public addButton(buttonText: string, buttonClass: string, buttonCallback: () => void) {
        const button = this.holdContainer.createEl('div').createEl('button', { text: buttonText, cls: buttonClass });
        button.addClass("mod-cta")
        button.addEventListener('click', buttonCallback);
        return this;
    }
    public getLastElement(ref: { value: HTMLElement | null }) {
        ref.value = this.holdContainer.lastChild as HTMLElement
        return this
    }
    addDropdown(name: string, options:Record<string,string>, defaultValue: string, cb: (v: string) => void, cls: string = ".setting-item-inline") {
        let _dropdwon: DropdownComponent | undefined;
        const dropdwon = new Setting(this.holdContainer)
            .setName(name)
            .addDropdown(dropDown => _dropdwon = dropDown
                .addOptions(options
                    /* {
                    broken: "broken",
                    md: "md",
                    pdf:"pdf"
                } */
)
                .setValue("broken")
                .onChange(async value => cb(value))
        )
        dropdwon.setClass(cls)
        if (_dropdwon !== undefined) {
            _dropdwon.setValue("broken")
            this.plugin.view._controls.push({ id: name, control: _dropdwon });
        }
        return this;
    }
    addSlider(name: string, min: number, max: number, step: number, defaultNum: number, cb: (v: number) => void, cls: string = "setting-item-block") {
        let _slider: SliderComponent | undefined;
        const slider = new Setting(this.holdContainer)
            .setName(name)
          //  .setClass("mod-slider")
            .addSlider(slider =>
                _slider = slider
                    .setLimits(min, max, step)
                    .setValue(defaultNum)
                    .setDynamicTooltip()
                    .onChange(async value => {
                        cb(value)
                   //     if (!this.plugin.skipSave) {
                        //    this.plugin.view.setSaveButton(true);
                    //    }
                    }))
        slider.setClass(cls)
        if (_slider !== undefined) {
            _slider.setValue(defaultNum)
            this.plugin.view._controls.push({ id: name, control: _slider });
        }
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
                this.plugin.view._controls.push({ id: name, control: picker })
            })
        colorpicker.setClass("setting-item-inline")
        return this;
    }
    addToggle(name: string, defaultState: boolean, cb: (v: boolean) => void, needSave: boolean = true) {
		const toggler = new Setting(this.holdContainer)
			.setName(name)
			//.setDesc('Enable or disable logging the number of nodes and links when the graph loads')
			.addToggle((toggle: ToggleComponent) => {
				toggle
                    .onChange(async value => {
                        cb(value)
                     //   if (needSave && !this.plugin.skipSave) {
                        //    this.plugin.view.setSaveButton(true)
                    //    }
                    }
                      /*  async (value) => {
						if (!value) {
							this.toggleEnableShow.setValue(value);
						}
						this.plugin.settings.enableSave = value;
						await this.plugin.saveSettings();
                    }*/
                )
					.setValue(defaultState)
                //this.toggleEnableSave = toggle;
                this.plugin.view._controls.push({ id: name, control: toggle})
			}
        )
        toggler.setClass("setting-item-inline")
        return this;
    }
    addText(name: string, cb: (v: string) => void) {
        const texter = new Setting(this.holdContainer)
            .setName(name)
            .addText(picker => picker
                .setPlaceholder("file path")
                .onChange(async (value) => {
                    cb(value)
                })
            )
        texter.setClass("setting-item-block")
        return this;
    }
    attachEl(container: HTMLElement) {
        container.append(this.rootContainer)
        this._baseContainer = container;
        this._baseContainer.style.opacity = '100'
        return this;
    }
}