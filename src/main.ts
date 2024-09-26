import { App, WorkspaceLeaf, Notice, Plugin, PluginSettingTab, Setting, ToggleComponent, TextComponent, ColorComponent, ExtraButtonComponent } from 'obsidian';
import { TagRoutesView, VIEW_TYPE_TAGS_ROUTES } from "./views/TagsRoutes"
import { createFolderIfNotExists,DebugLevel,DebugMsg,namedColor } from "./util/util"
import { codeBlockProcessor } from './util/CodeBlockProcessor';
//const versionInfo = require('./version_info.txt');

export const globalProgramControl = {
	useDiv : false,
	debugLevel: DebugLevel.INFO,
	useGroup: true,
	allowDuplicated: false,
	aimBeforeLink: true,
}
export const currentVersion = '1.1.1';    //Used to show in debug console
export const currentSaveSpecVer = 10101;  //Indicate current version of saved config file: data.json 
export const minSaveSpecVer = 10101;      //Data will be loaded if the loaded version of data.json >= minSaveSpecVer, and will be completely overrided to default if version < minSaveSpecVer

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
	pdf: colorSpec;
	tag: colorSpec;
	frontmatter_tag: colorSpec;
	nodeHighlightColor: colorSpec;
	nodeFocusColor: colorSpec;
	linkHighlightColor: colorSpec;
	linkNormalColor: colorSpec;
	linkParticleColor: colorSpec;
	linkParticleHighlightColor: colorSpec;
	backgroundColor: colorSpec;
}
export const defaultolorMapDark: colorMap = {
	markdown: {name:"default", value: "#00ff00"},
	attachment: {name:"default",  value: "#ffff00" },
	broken: {name:"default",  value: "#ff0000"},
	excalidraw: {name:"default",  value: "#00ffff"},
	pdf: {name:"default",  value: "#0000ff"},
	tag: { name: "default", value: "#ff00ff" },
	frontmatter_tag:{name: "default", value:"#fa8072"},
	nodeHighlightColor: {name:"default",  value: "#3333ff"},
	nodeFocusColor: {name:"default",  value: "#ff3333"},
	linkHighlightColor: {name:"default",  value: "#ffffff"},
	linkNormalColor: {name:"default",  value: "#ffffff"},
	linkParticleColor: {name:"default",  value: "#ffffff"},
	linkParticleHighlightColor: { name: "default", value: "#ff00ff" },
	backgroundColor:{name:"default",value:"#000003"}
}
export const defaultolorMapLight: colorMap = {
	markdown: {name:"default", value: "#00ff00"},
	attachment: {name:"default",  value: "#ffff00" },
	broken: {name:"default",  value: "#ff0000"},
	excalidraw: {name:"default",  value: "#00ffff"},
	pdf: {name:"default",  value: "#0000ff"},
	tag: {name:"default",  value: "#ff00ff"},
	frontmatter_tag:{name: "default", value:"#fa8072"},
	nodeHighlightColor: {name:"default",  value: "#3333ff"},
	nodeFocusColor: {name:"default",  value: "#ff3333"},
	linkHighlightColor: {name:"default",  value: "#ffffff"},
	linkNormalColor: {name:"default",  value: "#ffffff"},
	linkParticleColor: {name:"default",  value: "#ffffff"},
	linkParticleHighlightColor: { name: "default", value: "#ff00ff" },
	backgroundColor:{name:"default",value:"#ffffff"}
}
export const defaltColorMap = {
	dark: defaultolorMapDark,
	light: defaultolorMapLight
}
export interface TagRoutesSettings {
	node_size: number;
	node_repulsion: number;
	link_distance: number;
	link_width: number;
	link_particle_size: number;
	link_particle_number: number;
	toggle_global_map: boolean;
	toggle_label_display: boolean;
	colorMapSource: string;
	colorMap: colorMap;
}
type ThemeSlots = [TagRoutesSettings, TagRoutesSettings, TagRoutesSettings, TagRoutesSettings, TagRoutesSettings, TagRoutesSettings];
interface Settings {
	saveSpecVer: number;
	enableSave: boolean;
	enableShow: boolean;
	currentSlotNum: number;
	themeSlotNum: {
		dark: number;
		light: number;
	}
	openInCurrentTab: boolean;
	currentTheme: "dark"|"light";
	customSlot: ThemeSlots | null ;
	dark: ThemeSlots;
	light: ThemeSlots;
}

export const DEFAULT_DISPLAY_SETTINGS_DARK: TagRoutesSettings = {
	node_size: 5,
	node_repulsion: 0,
	// where is min an max set?
	link_distance: 17,
	link_width: 1,
	link_particle_size: 2,
	link_particle_number: 2,
	toggle_global_map: true,
	toggle_label_display: false,
	colorMapSource:"Default dark",
	colorMap:defaultolorMapDark,
}
export const DEFAULT_DISPLAY_SETTINGS_LIGHT: TagRoutesSettings = {
	node_size: 5,
	node_repulsion: 0,
	link_distance: 5,
	link_width: 1,
	link_particle_size: 2,
	link_particle_number: 2,
	toggle_global_map: true,
	toggle_label_display: false,
	colorMapSource:"Defalt light",
	colorMap:defaultolorMapLight,
}
export const DEFAULT_DISPLAY_SETTINGS = {
	dark: DEFAULT_DISPLAY_SETTINGS_DARK,
	light: DEFAULT_DISPLAY_SETTINGS_LIGHT
}
const DEFAULT_SETTINGS: Settings = {
	saveSpecVer: currentSaveSpecVer,
	enableSave: true,
	enableShow: true,
	currentSlotNum: 1,
	themeSlotNum: {
		dark: 1,
		light: 1,
	},
	openInCurrentTab: false,
	currentTheme: "dark",
	customSlot:null,
	dark: [
		structuredClone(DEFAULT_DISPLAY_SETTINGS_DARK),
		structuredClone(DEFAULT_DISPLAY_SETTINGS_DARK),
		structuredClone(DEFAULT_DISPLAY_SETTINGS_DARK),
		structuredClone(DEFAULT_DISPLAY_SETTINGS_DARK),
		structuredClone(DEFAULT_DISPLAY_SETTINGS_DARK),
		structuredClone(DEFAULT_DISPLAY_SETTINGS_DARK),
	],
	light: [
		structuredClone(DEFAULT_DISPLAY_SETTINGS_LIGHT),
		structuredClone(DEFAULT_DISPLAY_SETTINGS_LIGHT),
		structuredClone(DEFAULT_DISPLAY_SETTINGS_LIGHT),
		structuredClone(DEFAULT_DISPLAY_SETTINGS_LIGHT),
		structuredClone(DEFAULT_DISPLAY_SETTINGS_LIGHT),
		structuredClone(DEFAULT_DISPLAY_SETTINGS_LIGHT),
	]
}
// plugin 主体
export default class TagsRoutes extends Plugin {
	public settings: Settings;
	public view: TagRoutesView;
	public skipSave: boolean = true;
	onFileClick(filePath: string) {
		// 传递文件路径给 Graph 并聚焦到相应的节点
		for (let leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_TAGS_ROUTES)) {
			if (leaf.view instanceof TagRoutesView) {
				leaf.view.focusGraphNodeById(filePath)
			//	leaf.view.Graph.refresh();
			//	leaf.view.updateHighlight();
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
			DebugMsg(DebugLevel.INFO,"Loading Tags Routes v",currentVersion)
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
		//DebugMsg(DebugLevel.DEBUG,versionInfo);
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
		this.addRibbonIcon("waypoints", "Open tags routes", () => {
			this.activateView();
		});
		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new TagsroutesSettingsTab(this.app, this));
		// 在 Obsidian 插件的 onload 方法中注册事件
		this.registerDomEvent(document, 'click', (e: MouseEvent) => {
			const target = e.target as HTMLElement;
			if (target) {
				// 检查是否点击在标签内容上
				let tag = "";
				if (target.hasClass('tag')) {
					tag = target.innerText; // 获取标签内容
				}
				if (target.hasClass('cm-hashtag')) {
					tag = '#' + target.innerText; // 获取标签内容
				}
				if (tag) {
					// 传递文件路径给 Graph 并聚焦到相应的节点
					for (let leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_TAGS_ROUTES)) {
						if (leaf.view instanceof TagRoutesView) {
							leaf.view.focusGraphTag(tag)
						}
					}
					return;
				}
				if (target && target.closest('.multi-select-pill-content')) {
					// 查找父容器，确保是包含frontmatter的标签
					const parent = target.closest('[data-property-key="tags"]');

					if (parent) {
						// 获取点击的标签内容
						const tagContent = target.textContent || target.innerText;
						// 传递文件路径给 Graph 并聚焦到相应的节点
						for (let leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_TAGS_ROUTES)) {
							if (leaf.view instanceof TagRoutesView) {
								leaf.view.focusGraphTag(tagContent)
							}
						}
					}
					return
				}

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
					} else if (Array.isArray(target[key]) && Array.isArray(source[key])) {
						for (let i: number = 0; i < target[key].length; i++) {
							//only deal with an array which have only objects	
							if (this.isObject(target[key][i]) && this.isObject(source[key][i])) {
								this.mergeDeep(target[key][i], source[key][i])
							}

						}


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
		const loadedSettings = await this.loadData() //as Settings;
		if (loadedSettings?.saveSpecVer && loadedSettings.saveSpecVer >= minSaveSpecVer) {
			this.mergeDeep(this.settings, loadedSettings) 
			if (loadedSettings.saveSpecVer != currentSaveSpecVer) {
				DebugMsg(DebugLevel.INFO, `Save spec version ${loadedSettings.saveSpecVer} merged.`)
			}
		} else {
			if (loadedSettings?.saveSpecVer) {
				DebugMsg(DebugLevel.INFO,`Override save spec version ${loadedSettings.saveSpecVer}.`)
			} else {
				DebugMsg(DebugLevel.INFO,`New installation or very old version: Using default settings.`)
			}
		}
		this.settings.customSlot = this.settings[this.settings.currentTheme];
		this.settings.currentSlotNum = this.settings.themeSlotNum[this.settings.currentTheme];
		this.settings.customSlot[0] = structuredClone(
			this.settings.customSlot[this.settings.currentSlotNum]);
		this.settings.saveSpecVer = DEFAULT_SETTINGS.saveSpecVer;
	}
	async saveSettings() {
		if (this.skipSave) return;
		DebugMsg(DebugLevel.DEBUG,"[TagsRoutes: Save settings]")
		this.settings.customSlot = null;  //don't save the duplicated object
		this.saveData(this.settings);  //maybe need await here
		this.settings.customSlot = this.settings[this.settings.currentTheme];
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
			if (!this.settings.openInCurrentTab) {
				leaf = workspace.getLeaf('split')
			} else {
				leaf = workspace.getLeaf()
			}
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
class colorPickerGroup {
	private plugin: TagsRoutes;
	private text: Setting;
	private keyname: keyof colorMap
	private colorPicker: Setting;
	private textC: TextComponent;
	private colorC: ColorComponent;
	private isProgrammaticChange: boolean = false;
	private skipSave = false;

	constructor(plugin: TagsRoutes, container: HTMLElement, name: string, keyname: keyof colorMap) {
		this.plugin = plugin;
		this.keyname = keyname;
		const holder = container.createEl("div", "inline-settings")

		this.text = new Setting(holder.createEl("span")).addText(
			(text) => {
				this.textC = text
					.setValue("")
					.onChange((v) => {
						if (!this.plugin.settings.customSlot) return;
						if (v === "") return;
						const colorHex = this.namedColorToHex(v)
						if (colorHex !== "N/A") {
							this.isProgrammaticChange = true;
							this.plugin.settings.customSlot[0].colorMap[keyname].name = v;
							this.colorC.setValue(colorHex)
							this.text.setDesc(`${v} - ${colorHex}`)
							this.isProgrammaticChange = false;
				}
					})
				

			 }
		).setName(name)
		.setDesc(this.plugin.settings.customSlot?.[0].colorMap[keyname].name||this.plugin.settings.customSlot?.[0].colorMap[keyname].value||"")
		this.colorPicker = new Setting(holder.createEl("span")).addColorPicker(
			(c) => {
				this.colorC = c
					.setValue(this.plugin.settings.customSlot?.[0].colorMap[keyname].value||"")
					.onChange((v) => {
						if (!this.plugin.settings.customSlot) return;
						this.textC.setValue("")
						if (this.isProgrammaticChange == false) {
							this.text.setDesc(v)
							this.plugin.settings.customSlot[0].colorMap[keyname].value = v;
							this.plugin.settings.customSlot[0].colorMap[keyname].name = "";
						} else {
							this.plugin.settings.customSlot[0].colorMap[keyname].value = v;
						}
						if (!this.skipSave) {
							this.plugin.view.onSettingsSave();
						}
						this.plugin.view.updateColor();
                       // setTimeout(() => this.colorPicker.setDesc(v), 0);
				})
			 }
		)
		//this.text.
		return this;
	}
	namedColorToHex(color: string): string {
		const ret = namedColor.get(color);
		if (ret) {
			return ret;
		}

		return 'N/A';
	}
	resetColor(skipSave: boolean) {
		if (!this.plugin.settings.customSlot) return;
		this.skipSave = skipSave;
		this.isProgrammaticChange = true;
		this.colorC.setValue(this.plugin.settings.customSlot[0].colorMap[this.keyname].value)
		this.text.setDesc(this.plugin.settings.customSlot[0].colorMap[this.keyname].name || this.plugin.settings.customSlot[0].colorMap[this.keyname].value)
		this.skipSave = false;
		this.isProgrammaticChange = false;
	}
}
class TagsroutesSettingsTab extends PluginSettingTab {
	plugin: TagsRoutes;
	toggleEnableSave: ToggleComponent;
	toggleEnableShow: ToggleComponent;
	colors: colorPickerGroup[] = [];
	colorMapSourceElement: HTMLElement;
	constructor(app: App, plugin: TagsRoutes) {
		super(app, plugin);
		this.plugin = plugin;
		this.loadColor = this.loadColor.bind(this)
	}
	loadColor(value: string) {
		this.plugin.view.updateColor();
	}

	display(): void {
		this.plugin.skipSave = true;
		const { containerEl } = this;
		containerEl.empty();
	//	containerEl.addClass("tags-routes")
		containerEl.createEl("h1", { text: "General" });

		new Setting(containerEl)
			.setName('Log Node/Link Count')
			.setDesc('Enable or disable logging the number of nodes and links when the graph loads.')
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
			.setDesc('Automatically display the log file after the graph loads.')
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
		new Setting(containerEl)
			.setName('Open graph in current tab')
			.setDesc('Toggle to open graph within current tab.')
			.addToggle((toggle: ToggleComponent) => {
				toggle
					.onChange(async (value) => {
						this.plugin.settings.openInCurrentTab = value;
						await this.plugin.saveSettings();
					})
					.setValue(this.plugin.settings.openInCurrentTab)
				
			}
		)

		const themeTitle = containerEl.createEl("div", {cls: 'tags-routes-settings-title'}); 
		themeTitle.createEl("h1", { text: "Theme" });

		new Setting(containerEl)
			.setName('Theme selection')
			.setDesc('Toggel to use light or dark theme, the default and recommended is dark.')
			.addToggle((toggle: ToggleComponent) => {
				toggle
					.onChange(async (value) => {
						if (value === true) {
							this.plugin.settings.currentTheme = 'light'
						} else {
							this.plugin.settings.currentTheme = 'dark';
						}
						if (this.plugin.view.currentVisualString === this.plugin.settings.currentTheme)
							return;
						// switch save slot
						this.plugin.settings.customSlot = this.plugin.settings[this.plugin.settings.currentTheme];
						this.plugin.settings.currentSlotNum = this.plugin.settings.themeSlotNum[this.plugin.settings.currentTheme];
						this.plugin.view.currentSlotNum = this.plugin.settings.currentSlotNum;
						this.plugin.settings.customSlot[0] = structuredClone(
							this.plugin.settings.customSlot[this.plugin.settings.currentSlotNum]);

						this.plugin.view.switchTheme(this.plugin.settings.currentTheme).then((result) => {
							if (result) {
								const entry = this.plugin.view._controls.find(v => v.id === "Slot #");
								if (entry) {
									entry.control.setValue(this.plugin.settings.currentSlotNum)
								}
								this.plugin.saveSettings();
							} 
						  });
						this.colors.forEach(v => v.resetColor(true))
						this.colorMapSourceElement.innerText = this.plugin.settings.customSlot[this.plugin.settings.currentSlotNum].colorMapSource;

					})
					.setValue(this.plugin.settings.currentTheme === 'dark' ? false : true)

			}
			)

		const colorTitle = containerEl.createEl("div", { cls: 'tags-routes-settings-title' }); 
		colorTitle.createEl("h1", { text: "Color" });


		new ExtraButtonComponent(colorTitle.createEl('span', { cls: 'group-bar-button' }))
		.setIcon("reset")
		.setTooltip("Reset color of current slot ")
			.onClick(() => {
			if (!this.plugin.settings.customSlot) return;
				this.plugin.settings.customSlot[0].colorMap = structuredClone(defaltColorMap[this.plugin.settings.currentTheme]);
				this.plugin.settings.customSlot[0].colorMapSource = DEFAULT_DISPLAY_SETTINGS[this.plugin.settings.currentTheme].colorMapSource;
			this.plugin.view.onSettingsSave();
			this.plugin.view.updateColor();
			this.colors.forEach(v => v.resetColor(true))
			this.colorMapSourceElement.innerText = this.plugin.settings.customSlot[this.plugin.settings.currentSlotNum].colorMapSource;

			new Notice(`Color reset on slot ${this.plugin.settings.currentSlotNum}`);
		});

		const desc = containerEl.createEl("div", { text: "You can enter css named colors here, like 'blue', 'lightblue' etc." }); 
		desc.createEl("br")
		desc.appendText("For the supported css named colors, please refer to: ")
		desc.createEl("a", { href: "https://www.w3.org/wiki/CSS/Properties/color/keywords", text: "Css color keywords" })
		desc.createEl("br")
		desc.createEl("br")
		this.colorMapSourceElement =
		desc.createEl("div").createEl("span", { text: "Current color map source: " })
			.createEl("span", { text: this.plugin.settings.customSlot?.[0]?.colorMapSource || "Defalt" })
		this.colorMapSourceElement.addClass("need-save")
		desc.addClass("tags-routes");
		desc.addClass("setting-item-description");

		const colorSettingsGroup = containerEl.createEl("div", { cls: "tags-routes" })

		new Setting(colorSettingsGroup).setName("Node type").setHeading().settingEl.addClass("tg-settingtab-heading")
		this.colors.push(new colorPickerGroup(this.plugin, colorSettingsGroup, "Markdown", "markdown"))
		this.colors.push(new colorPickerGroup(this.plugin, colorSettingsGroup, "Tag","tag"));
		this.colors.push(new colorPickerGroup(this.plugin, colorSettingsGroup, "Excalidraw","excalidraw"));
		this.colors.push(new colorPickerGroup(this.plugin, colorSettingsGroup, "Pdf","pdf"));
		this.colors.push(new colorPickerGroup(this.plugin, colorSettingsGroup, "Attachment","attachment"));
		this.colors.push(new colorPickerGroup(this.plugin, colorSettingsGroup, "Frontmatter tag","frontmatter_tag"));
		this.colors.push(new colorPickerGroup(this.plugin, colorSettingsGroup, "Broken", "broken"));

		new Setting(colorSettingsGroup).setName("Node state").setHeading().setDesc("Effects in global map mode.").settingEl.addClass("tg-settingtab-heading")
		this.colors.push(new colorPickerGroup(this.plugin, colorSettingsGroup, "Highlight", "nodeHighlightColor"));
		this.colors.push(new colorPickerGroup(this.plugin, colorSettingsGroup, "Focus", "nodeFocusColor"));

		new Setting(colorSettingsGroup).setName("Link state").setHeading().settingEl.addClass("tg-settingtab-heading")
		this.colors.push(new colorPickerGroup(this.plugin, colorSettingsGroup, "Normal", "linkNormalColor"));
		this.colors.push(new colorPickerGroup(this.plugin, colorSettingsGroup, "Highlight", "linkHighlightColor"));

		new Setting(colorSettingsGroup).setName("Particle state").setHeading().settingEl.addClass("tg-settingtab-heading")
		this.colors.push(new colorPickerGroup(this.plugin, colorSettingsGroup, "Normal", "linkParticleColor"));
		this.colors.push(new colorPickerGroup(this.plugin, colorSettingsGroup, "Highlight", "linkParticleHighlightColor"));
		this.plugin.skipSave = false;
	}
}
