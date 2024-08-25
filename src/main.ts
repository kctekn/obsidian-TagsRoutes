import { App, WorkspaceLeaf, Notice, Plugin, PluginSettingTab, Setting, ToggleComponent } from 'obsidian';
import { TagRoutesView, VIEW_TYPE_TAGS_ROUTES } from "./views/TagsRoutes"
import { createFolderIfNotExists } from "./util/util"
import { codeBlockProcessor } from './util/CodeBlockProcessor';
//const versionInfo = require('./version_info.txt');
type AnyObject = Record<string, any>;

export interface colorMap {
	markdown: string;
	attachment: string;
	broken: string;
	excalidraw: string;
	tag: string;
	nodeHighlightColor: string;
	nodeFocusColor: string;
	linkHighlightColor: string;
	linkNormalColor: string;
	linkParticleColor: string;
	linkParticleHighlightColor: string;
}
export const defaultolorMap: colorMap = {
	markdown: "#00ff00",
	attachment: "#ffff00",
	broken: "#ff0000",
	excalidraw: "#00ffff",
	tag: "#ff00ff",
	nodeHighlightColor: "#3333ff",
	nodeFocusColor: "#FF3333",
	linkHighlightColor: "#ffffff",
	linkNormalColor: "#ffffff",
	linkParticleColor: "#ffffff",
	linkParticleHighlightColor:"#ff00ff",
	
	
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

	mergeDeep(target: AnyObject, ...sources: AnyObject[]): AnyObject {
		if (!sources.length) return target;
		const source = sources.shift();

		if (typeof target === 'object' && typeof source === 'object') {
			for (const key in source) {
				if (source[key] !== undefined) {
					if (typeof source[key] === 'object' && source[key] !== null) {
						if (!target[key]) Object.assign(target, { [key]: {} });
						this.mergeDeep(target[key], source[key]);
					} else {
						Object.assign(target, { [key]: source[key] });
					}
				}
			}
		}

		return this.mergeDeep(target, ...sources);
	}
	async loadSettings() {
		this.settings = this.mergeDeep({}, DEFAULT_SETTINGS, await this.loadData()) as Settings;
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
		const defaultColor = this.plugin.settings.customSlot[0].colorMap[keyName];
		const colorpicker = new Setting(container)
            .setName(name)
            .setDesc(defaultColor || "#000000")
            .addColorPicker(picker => {
                picker
				.setValue(defaultColor)
				.onChange(async (value) => {
						this.plugin.settings.customSlot[0].colorMap[keyName]=value
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

		new Setting(containerEl).setName("Node type").setHeading()
		this.addColorPicker(containerEl, "Markdown", "markdown", this.loadColor)
		this.addColorPicker	(containerEl,"Tags", "tag",this.loadColor)
		this.addColorPicker	(containerEl,"Exclidraw","excalidraw",this.loadColor)
		this.addColorPicker	(containerEl,"Attachments", "attachment",this.loadColor)
		this.addColorPicker	(containerEl,"Broken", "broken",this.loadColor)

		new Setting(containerEl).setName("Node state").setHeading().setDesc("Effects in global map mode")
		this.addColorPicker	(containerEl,"Highlight", "nodeHighlightColor",this.loadColor)
		this.addColorPicker	(containerEl,"Focus", "nodeFocusColor",this.loadColor)

		new Setting(containerEl).setName("Link state").setHeading()
		this.addColorPicker	(containerEl,"Normal", "linkNormalColor",this.loadColor)
		this.addColorPicker(containerEl, "Highlight", "linkHighlightColor", this.loadColor)

		new Setting(containerEl).setName("Particle state").setHeading()
		this.addColorPicker	(containerEl,"Normal", "linkParticleColor",this.loadColor)
		this.addColorPicker	(containerEl,"Highlight", "linkParticleHighlightColor",this.loadColor)
	}
}
