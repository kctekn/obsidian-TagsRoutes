import { App, WorkspaceLeaf, Notice, Plugin, PluginSettingTab, Setting, ToggleComponent, TextComponent, ColorComponent, ExtraButtonComponent } from 'obsidian';
import { TagRoutesView, VIEW_TYPE_TAGS_ROUTES } from "./views/TagsRoutes"
import { createFolderIfNotExists,namedColor } from "./util/util"
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
	saveSpecVer: number;
	enableSave: boolean;
	enableShow: boolean;
	currentSlot: number;
	openInCurrentTab: boolean;
	customSlot: [TagRoutesSettings, TagRoutesSettings, TagRoutesSettings, TagRoutesSettings, TagRoutesSettings, TagRoutesSettings]
}

export const DEFAULT_DISPLAY_SETTINGS: TagRoutesSettings = {
	broken_file_link_center: 'true',
	broken_file_link_line: 'false',
	node_size: 5,
	node_repulsion: 0,
	link_distance: 10,
	link_width: 1,
	link_particle_size: 2,
	link_particle_number: 2,
	toggle_global_map: false,
	colorMap:defaultolorMap,
}
const DEFAULT_SETTINGS: Settings = {
	saveSpecVer: 109,
	enableSave: true,
	enableShow: true,
	currentSlot: 1,
	openInCurrentTab: false,
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
		this.addRibbonIcon("waypoints", "Open tags routes", () => {
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
					} else if (typeof target[key] === typeof source[key]) {
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
		const loadedSettings = await this.loadData() as Settings;
		if (loadedSettings?.saveSpecVer && loadedSettings.saveSpecVer >= 109) {
			this.settings = this.mergeDeep(this.settings, loadedSettings) as Settings;
		}
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
						if (!this.skipSave) {
							this.plugin.view.onSave();
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
	resetColor(skipSave:boolean) {
		this.skipSave = skipSave;
		this.colorC.setValue(this.plugin.settings.customSlot[0].colorMap[this.keyname].value)
		this.skipSave = false;
	}
}
class TagsroutesSettingsTab extends PluginSettingTab {
	plugin: TagsRoutes;
	toggleEnableSave: ToggleComponent;
	toggleEnableShow: ToggleComponent;
	colors: colorPickerGroup[] = [];
	constructor(app: App, plugin: TagsRoutes) {
		super(app, plugin);
		this.plugin = plugin;
		this.loadColor = this.loadColor.bind(this)
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
		new Setting(containerEl)
			.setName('Open graph in current tab')
			.setDesc('Toggle to open graph within current tab')
			.addToggle((toggle: ToggleComponent) => {
				toggle
					.onChange(async (value) => {
						this.plugin.settings.openInCurrentTab = value;
						await this.plugin.saveSettings();
					})
					.setValue(this.plugin.settings.openInCurrentTab)
				
			}
		)



		const colorTitle = containerEl.createEl("div", {cls: 'tags-routes-settings-title'}); 
		colorTitle.createEl("h1", { text: "Color" });


		new ExtraButtonComponent(colorTitle.createEl('span', { cls: 'group-bar-button' }))
		.setIcon("reset")
		.setTooltip("Reset color of current slot ")
		.onClick(() => {
			this.plugin.settings.customSlot[0].colorMap = structuredClone(defaultolorMap);
			this.plugin.view.onSave();
			this.plugin.view.updateColor();
			this.colors.forEach(v => v.resetColor(true))
			new Notice(`Color reset on slot ${this.plugin.settings.currentSlot}`);
		});

		const desc = containerEl.createEl("div", { text: "You can enter css named colors here, like 'blue', 'lightblue' etc." }); 
		desc.createEl("br")
		desc.appendText("For the supported css named colors, please refer to: ")
		desc.createEl("a", { href: "https://www.w3.org/wiki/CSS/Properties/color/keywords", text: "Css color keywords" })
		desc.addClass("setting-item-description");

		const colorSettingsGroup = containerEl.createEl("div", { cls: "tags-routes" })

		new Setting(colorSettingsGroup).setName("Node type").setHeading().settingEl.addClass("tg-settingtab-heading")
		this.colors.push(new colorPickerGroup(this.plugin, colorSettingsGroup, "Markdown", "markdown"))
		this.colors.push(new colorPickerGroup(this.plugin, colorSettingsGroup, "Tag","tag"));
		this.colors.push(new colorPickerGroup(this.plugin, colorSettingsGroup, "Excalidraw","excalidraw"));
		this.colors.push(new colorPickerGroup(this.plugin, colorSettingsGroup, "Attachment","attachment"));
		this.colors.push(new colorPickerGroup(this.plugin, colorSettingsGroup, "Broken", "broken"));

		new Setting(colorSettingsGroup).setName("Node state").setHeading().setDesc("Effects in global map mode").settingEl.addClass("tg-settingtab-heading")
		this.colors.push(new colorPickerGroup(this.plugin, colorSettingsGroup, "Highlight", "nodeHighlightColor"));
		this.colors.push(new colorPickerGroup(this.plugin, colorSettingsGroup, "Focus", "nodeFocusColor"));

		new Setting(colorSettingsGroup).setName("Link state").setHeading().settingEl.addClass("tg-settingtab-heading")
		this.colors.push(new colorPickerGroup(this.plugin, colorSettingsGroup, "Normal", "linkNormalColor"));
		this.colors.push(new colorPickerGroup(this.plugin, colorSettingsGroup, "Highlight", "linkHighlightColor"));

		new Setting(colorSettingsGroup).setName("Particle state").setHeading().settingEl.addClass("tg-settingtab-heading")
		this.colors.push(new colorPickerGroup(this.plugin, colorSettingsGroup, "Normal", "linkParticleColor"));
		this.colors.push(new colorPickerGroup(this.plugin, colorSettingsGroup, "Highlight", "linkParticleHighlightColor"));
	}
}
