import { App, WorkspaceLeaf, Notice, Plugin, PluginSettingTab, Setting, ToggleComponent, TextComponent, ColorComponent } from 'obsidian';
import { TagRoutesView, VIEW_TYPE_TAGS_ROUTES } from "./views/TagsRoutes"
import { createFolderIfNotExists } from "./util/util"
import { codeBlockProcessor } from './util/CodeBlockProcessor';
//const versionInfo = require('./version_info.txt');
type AnyObject = Record<string, any>;
export interface colorSpec {
	name?: string;
	value: string;
}
export interface colorMap {
	markdown: colorSpec;
	attachment: colorSpec;
	broken: colorSpec;
	excalidraw: colorSpec;
	tag: colorSpec;
	nodeHighlightColor: colorSpec;
	nodeFocusColor: colorSpec;
	linkHighlightColor: colorSpec;
	linkNormalColor: colorSpec;
	linkParticleColor: colorSpec;
	linkParticleHighlightColor: colorSpec;
}
export const defaultolorMap: colorMap = {
	markdown: {name:"default", value: "#00ff00"},
	attachment: {name:"default",  value: "#ffff00" },
	broken: {name:"default",  value: "#ff0000"},
	excalidraw: {name:"default",  value: "#00ffff"},
	tag: {name:"default",  value: "#ff00ff"},
	nodeHighlightColor: {name:"default",  value: "#3333ff"},
	nodeFocusColor: {name:"default",  value: "#FF3333"},
	linkHighlightColor: {name:"default",  value: "#ffffff"},
	linkNormalColor: {name:"default",  value: "#ffffff"},
	linkParticleColor: {name:"default",  value: "#ffffff"},
	linkParticleHighlightColor: {name:"default",  value: "#ff00ff"},
	
	
}
export interface TagRoutesSettings {
	broken_file_link_center: string;
	broken_file_link_line: string;
	node_size: number;
	node_repulsion: number;
	link_distance: number;
	link_width: number;
	link_particle_size: number;
	link_particle_number: number;
	toggle_global_map: boolean;
	colorMap: colorMap;
}
interface Settings {
	enableSave: boolean;
	enableShow: boolean;
	currentSlot: number;
	customSlot: [TagRoutesSettings, TagRoutesSettings, TagRoutesSettings, TagRoutesSettings, TagRoutesSettings, TagRoutesSettings]
}

export const DEFAULT_DISPLAY_SETTINGS: TagRoutesSettings = {
	broken_file_link_center: 'true',
	broken_file_link_line: 'false',
	node_size: 5,
	node_repulsion: 0,
	link_distance: 5,
	link_width: 1,
	link_particle_size: 2,
	link_particle_number: 2,
	toggle_global_map: false,
	colorMap:defaultolorMap,
}
const DEFAULT_SETTINGS: Settings = {
	enableSave: true,
	enableShow: true,
	currentSlot: 1,
	customSlot: [DEFAULT_DISPLAY_SETTINGS, DEFAULT_DISPLAY_SETTINGS, DEFAULT_DISPLAY_SETTINGS, DEFAULT_DISPLAY_SETTINGS, DEFAULT_DISPLAY_SETTINGS, DEFAULT_DISPLAY_SETTINGS]
}
// plugin 主体
export default class TagsRoutes extends Plugin {
	public settings: Settings;
	public view: TagRoutesView;
	onFileClick(filePath: string) {
		// 传递文件路径给 Graph 并聚焦到相应的节点
		for (let leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_TAGS_ROUTES)) {
			if (leaf.view instanceof TagRoutesView) {
				leaf.view.focusGraphNodeById(filePath)
			}
		}
	}
	async onDoubleWait() {
		if (this.app.metadataCache.resolvedLinks !== undefined) {
			await this.initializePlugin();
		} else {
			this.app.metadataCache.on("resolved", async () => {
				await this.initializePlugin();
			});
		}
	}
	async onload() {
		this.app.workspace.onLayoutReady(() => {
			this.initializePlugin();
		});
	}
	async onLayoutReady(): Promise<void> {
		return new Promise<void>((resolve) => {
			// 检查 layout 是否已经 ready
			if (this.app.workspace.layoutReady) {
				resolve();
			} else {
				// 等待 layout ready 事件
				this.app.workspace.onLayoutReady(() => resolve());
			}
		});
	}
	async initializePlugin() {
		//console.log(versionInfo);
		//new Notice(versionInfo, 0)
		createFolderIfNotExists('TagsRoutes')
		createFolderIfNotExists('TagsRoutes/logs')
		createFolderIfNotExists('TagsRoutes/reports')
		await this.loadSettings();
		this.registerView(
			VIEW_TYPE_TAGS_ROUTES,
			(leaf) => this.view = new TagRoutesView(leaf, this)
		);
		const codeProcess = new codeBlockProcessor(this);
		this.registerMarkdownCodeBlockProcessor("tagsroutes", codeProcess.codeBlockProcessor);
		this.registerEvent(
			this.app.workspace.on('file-open', (file) => {
				if (file)
					this.onFileClick(file.path);
			})
		);
		this.addRibbonIcon("footprints", "Open tags routes", () => {
			this.activateView();
		});
		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new TagsroutesSettingsTab(this.app, this));
		// 在 Obsidian 插件的 onload 方法中注册事件
		this.registerDomEvent(document, 'click', (e: MouseEvent) => {
			const target = e.target as HTMLElement;
			if (target) { 
				let tag = "";
				if (target.hasClass('tag')) {
					tag = target.innerText; // 获取标签内容
				}
				if (target.hasClass('cm-hashtag')) {
					tag = '#'+target.innerText; // 获取标签内容
				}
				if (tag) {
				// 传递文件路径给 Graph 并聚焦到相应的节点
				for (let leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_TAGS_ROUTES)) {
					if (leaf.view instanceof TagRoutesView) {
						leaf.view.focusGraphTag(tag)
					}
				}
			}
				//	this.focusGraphTag(tag); // 在图形中聚焦到对应的节点
			}
		});
	}
	onunload() {
	}

	mergeDeep(target: any, ...sources: any[]): any {
		if (!sources.length) return target;
		const source = sources.shift();
	
		if (this.isObject(target) && this.isObject(source)) {
			for (const key in target) {
				if (key in source) {
					if (this.isObject(target[key]) && this.isObject(source[key])) {
						// 递归合并嵌套对象
						this.mergeDeep(target[key], source[key]);
					} else if (typeof target[key] === typeof source[key] && typeof target[key] !== 'object') {
						// 只在类型匹配时更新值
						target[key] = source[key];
					}
					// 如果类型不匹配，保留 target 的值
				}
				// 如果 source 中没有这个键，保留 target 的值
			}
		}
	
		// 继续合并剩余的 sources
		return this.mergeDeep(target, ...sources);
	}
	
	// 辅助函数：检查是否为对象
	 isObject(item: any): boolean {
		return (item && typeof item === 'object' && !Array.isArray(item));
	}
	async loadSettings() {
		this.settings = structuredClone(DEFAULT_SETTINGS);
	//	console.log("settings load default: ", this.settings)
		this.settings = this.mergeDeep(this.settings, await this.loadData()) as Settings;
	//	console.log("settings load  merged: ", this.settings)
		this.settings.customSlot[0] = structuredClone(
			this.settings.customSlot[this.settings.currentSlot]);
	}
	async saveSettings() {
		await this.saveData(this.settings);
	}
	async activateView() {
		const { workspace } = this.app;
		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_TAGS_ROUTES);
		if (leaves.length > 0) {
			// A leaf with our view already exists, use that
			leaf = leaves[0];
		} else {
			// Our view could not be found in the workspace, create a new leaf
			// in the right sidebar for it
			leaf = workspace.getLeaf('split')
			if (leaf) {
				await leaf.setViewState({ type: VIEW_TYPE_TAGS_ROUTES, active: true });
			}
		}
		// "Reveal" the leaf in case it is in a collapsed sidebar
		if (leaf) {
			workspace.revealLeaf(leaf);
		}
	}
}
class addColorPickerGroup {
	private plugin: TagsRoutes;
	private text: Setting;
	private colorPicker: Setting;
	private textC: TextComponent;
	private colorC: ColorComponent;
	private isProgrammaticChange: boolean = false;

	constructor(plugin: TagsRoutes, container: HTMLElement, name: string, keyname: keyof colorMap) {
		this.plugin = plugin;
		const holder = container.createEl("div", "inline-settings")

		this.text = new Setting(holder.createEl("span")).addText(
			(text) => {
				this.textC = text
					.setValue("")
					.onChange((v) => {
						if (v === "") return;
						const colorHex = this.namedColorToHex(v)
						if (colorHex !== "" && colorHex !== "#0e0e0e") {
							this.isProgrammaticChange = true;
							this.plugin.settings.customSlot[0].colorMap[keyname].name = v;
							this.colorC.setValue(colorHex)
							this.text.setDesc(`${v} - ${colorHex}`)
							this.isProgrammaticChange = false;
				}
					})
				

			 }
		).setName(name)
		.setDesc(this.plugin.settings.customSlot[0].colorMap[keyname].name||this.plugin.settings.customSlot[0].colorMap[keyname].value)
		this.colorPicker = new Setting(holder.createEl("span")).addColorPicker(
			(c) => {
				this.colorC = c
					.setValue(this.plugin.settings.customSlot[0].colorMap[keyname].value)
					.onChange((v) => {
						this.textC.setValue("")
						if (this.isProgrammaticChange == false) {
							this.text.setDesc(v)
							this.plugin.settings.customSlot[0].colorMap[keyname].value = v;
							this.plugin.settings.customSlot[0].colorMap[keyname].name = "";
						} else {
							this.plugin.settings.customSlot[0].colorMap[keyname].value = v;
						}
						console.log("the color3: ",this.plugin.settings.customSlot[0].colorMap[keyname] )
						this.plugin.view.onSave();
						this.plugin.view.updateColor();
                       // setTimeout(() => this.colorPicker.setDesc(v), 0);
				})
			 }
		)
		//this.text.
	}
	capitalizeFirstLetter(string:string) {
		return string.toLowerCase().replace(/\b[a-z]/g, function(match) {
		  return match.toUpperCase();
		});
	}
	namedColorToHex(color: string): string {
		const tempDiv = document.createElement('div');
		tempDiv.style.color = color;
		document.body.appendChild(tempDiv);
	
		const computedColor = window.getComputedStyle(tempDiv).color;
		document.body.removeChild(tempDiv);
	
		const rgb = computedColor.match(/\d+/g)?.map(Number);
		if (!rgb || rgb.length !== 3) {
			console.log("not a color")
			return "";
			throw new Error(`Invalid color: ${color}`);
		}
	
		const hex = rgb.map(c => c.toString(16).padStart(2, '0')).join('');
		return `#${hex}`;
	}
}
class TagsroutesSettingsTab extends PluginSettingTab {
	plugin: TagsRoutes;
	toggleEnableSave: ToggleComponent;
	toggleEnableShow: ToggleComponent;
	constructor(app: App, plugin: TagsRoutes) {
		super(app, plugin);
		this.plugin = plugin;
		this.loadColor = this.loadColor.bind(this)
	}
	addColorPicker(container: HTMLElement, name: string,  keyName: keyof colorMap, cb: (v: string) => void) {
		const defaultColor = this.plugin.settings.customSlot[0].colorMap[keyName].value;
		const colorpicker = new Setting(container)
            .setName(name)
            .setDesc(defaultColor || "#000000")
            .addColorPicker(picker => {
                picker
				.setValue(defaultColor)
				.onChange(async (value) => {
						this.plugin.settings.customSlot[0].colorMap[keyName].value=value
						this.plugin.view.onSave();
						cb(value)
                        setTimeout(() => colorpicker.setDesc(value), 0);
                    })
            })
        //colorpicker.setClass("setting-item-inline")
        return this;
	}
	loadColor(value: string) {
		this.plugin.view.updateColor();
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
	//	containerEl.addClass("tags-routes")
		containerEl.createEl("h1", { text: "General" });

		new Setting(containerEl)
			.setName('Log Node/Link Count')
			.setDesc('Enable or disable logging the number of nodes and links when the graph loads')
			.addToggle((toggle: ToggleComponent) => {
				toggle
				.setValue(this.plugin.settings.enableSave)
				.onChange(async (value) => {
						if (!value) {
							this.toggleEnableShow.setValue(value);
						}
						this.plugin.settings.enableSave = value;
						await this.plugin.saveSettings();
					})
				this.toggleEnableSave = toggle;
			}
			)
		new Setting(containerEl)
			.setName('Show Log File on Startup')
			.setDesc('Automatically display the log file after the graph loads')
			.addToggle((toggle: ToggleComponent) => {
				toggle
					.onChange(async (value) => {
						if (value) {
							this.toggleEnableSave.setValue(value);
						}
						this.plugin.settings.enableShow = value;
						await this.plugin.saveSettings();
					})
					.setValue(this.plugin.settings.enableShow)
				this.toggleEnableShow = toggle;
			}
		)
		containerEl.createEl("h1", { text: "Color" });
		const desc = containerEl.createEl("div", { text: "You can enter css named colors here, like 'blue', 'lightblue' etc." }); //For supported css named color, please refer to: <a href=\"abc\">abc</a> " }).addClass("setting-item-description")
		desc.createEl("br")
		desc.appendText("For the supported css named colors, please refer to: ")
		desc.createEl("a", { href: "https://www.w3.org/wiki/CSS/Properties/color/keywords", text: "Css color keywords" })
		desc.addClass("setting-item-description");
		
		//containerEl.createEl("a", { href: "https://www.w3.org/wiki/CSS/Properties/color/keywords", text:"Color keywords" }).addClass("setting-item-description")

        const colorSettingsGroup = containerEl.createEl("div",{cls: "tags-routes"})
		new Setting(colorSettingsGroup).setName("Node type").setHeading().settingEl.addClass("tg-settingtab-heading")
	//	this.addColorPicker(colorSettingsGroup, "Markdown", "markdown", this.loadColor)

		new addColorPickerGroup(this.plugin, colorSettingsGroup, "Markdown", "markdown");
		new addColorPickerGroup(this.plugin, colorSettingsGroup, "Tag","tag");
		new addColorPickerGroup(this.plugin, colorSettingsGroup, "Excalidraw","excalidraw");
		new addColorPickerGroup(this.plugin, colorSettingsGroup, "Attachment","attachment");
		new addColorPickerGroup(this.plugin, colorSettingsGroup, "Broken", "broken");


//		this.addColorPicker	(colorSettingsGroup,"Tags", "tag",this.loadColor)
//		this.addColorPicker	(containerEl,"Exclidraw","excalidraw",this.loadColor)
//		this.addColorPicker	(containerEl,"Attachments", "attachment",this.loadColor)
//		this.addColorPicker	(containerEl,"Broken", "broken",this.loadColor)

		new Setting(colorSettingsGroup).setName("Node state").setHeading().setDesc("Effects in global map mode").settingEl.addClass("tg-settingtab-heading")
		new addColorPickerGroup(this.plugin, colorSettingsGroup, "Highlight", "nodeHighlightColor");
		new addColorPickerGroup(this.plugin, colorSettingsGroup, "Focus", "nodeFocusColor");
		//this.addColorPicker	(containerEl,"Highlight", "nodeHighlightColor",this.loadColor)
		//this.addColorPicker	(containerEl,"Focus", "nodeFocusColor",this.loadColor)

		new Setting(colorSettingsGroup).setName("Link state").setHeading().settingEl.addClass("tg-settingtab-heading")
		new addColorPickerGroup(this.plugin, colorSettingsGroup, "Normal", "linkNormalColor");
		new addColorPickerGroup(this.plugin, colorSettingsGroup, "Highlight", "linkHighlightColor");
		//this.addColorPicker	(containerEl,"Normal", "linkNormalColor",this.loadColor)
		//this.addColorPicker(containerEl, "Highlight", "linkHighlightColor", this.loadColor)

		new Setting(colorSettingsGroup).setName("Particle state").setHeading().settingEl.addClass("tg-settingtab-heading")
		new addColorPickerGroup(this.plugin, colorSettingsGroup, "Normal", "linkParticleColor");
		new addColorPickerGroup(this.plugin, colorSettingsGroup, "Highlight", "linkParticleHighlightColor");
		//this.addColorPicker	(containerEl,"Normal", "linkParticleColor",this.loadColor)
		//this.addColorPicker	(containerEl,"Highlight", "linkParticleHighlightColor",this.loadColor)
	}
}
