import { App, Editor, MarkdownView, Modal,MarkdownRenderer, Notice, Plugin, PluginSettingTab, Setting, getAllTags, CachedMetadata, TagCache, ToggleComponent, ValueComponent } from 'obsidian';
import { ItemView, WorkspaceLeaf, TFile } from "obsidian";
import { TagRoutesView, VIEW_TYPE_TAGS_ROUTES } from "./views/TagsRoutes"
import { createFolderIfNotExists} from "./util/util"
import { fileContent } from "./util/query"
import { codeBlockProcessor } from './util/CodeBlockProcessor';
const versionInfo = require('./version_info.txt');


export interface TagRoutesSettings {
	broken_file_link_center: string;
	broken_file_link_line: string;
	md_color: string;
	attachment_color: string;
	broken_color: string;
	excllidraw_file_color: string;
	tag_color: string;
	node_size: number;
	node_repulsion: number;
	link_distance: number;
	link_width: number;
	link_particle_size: number;
	link_particle_number: number;
	link_particle_color: string;
}
interface Settings {
	enableSave: boolean;
	enableShow: boolean;
	currentSlot: number;
	customSlot: [TagRoutesSettings,TagRoutesSettings,TagRoutesSettings,TagRoutesSettings,TagRoutesSettings,TagRoutesSettings]
}

export const DEFAULT_DISPLAY_SETTINGS: TagRoutesSettings = {
	broken_file_link_center: 'true',
	broken_file_link_line: 'false',
	md_color: 'green',
	attachment_color: 'yellow',
	broken_color: 'red',
	excllidraw_file_color: '#00ffff',
	tag_color: '#ff00ff',
	link_particle_color: '#ffffff',
	node_size: 5,
	node_repulsion: 0,
	link_distance: 5,
	link_width: 1,
	link_particle_size: 2,
	link_particle_number: 2,
}

const DEFAULT_SETTINGS: Settings = {
	enableSave: true,
	enableShow: true,
	currentSlot: 1,
	customSlot:[DEFAULT_DISPLAY_SETTINGS,DEFAULT_DISPLAY_SETTINGS,DEFAULT_DISPLAY_SETTINGS,DEFAULT_DISPLAY_SETTINGS,DEFAULT_DISPLAY_SETTINGS,DEFAULT_DISPLAY_SETTINGS]
}

// plugin 主体
export default class TagsRoutes extends Plugin {

//	public settings_old: TagRoutesSettings;
	public settings: Settings;
//	public settingsSlots: TagRoutesSettings[] = [];
	public view: TagRoutesView;
	onFileClick(filePath: string) {
		// 传递文件路径给 Graph 并聚焦到相应的节点
		for (let leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_TAGS_ROUTES)) {
			if (leaf.view instanceof TagRoutesView) {
				leaf.view.focusGraphNodeById(filePath)
			}
		}
	}
	async  onDoubleWait() {
		if (this.app.metadataCache.resolvedLinks !== undefined) {
			//	console.log("cache is already ready")
			await this.initializePlugin();
		} else {
			this.app.metadataCache.on("resolved", async () => {
			//	console.log("cache is not ready, wait for it")
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
		console.log(versionInfo);
		new Notice(versionInfo, 0)
		createFolderIfNotExists('scripts')
		createFolderIfNotExists('TagsRoutes')
		await this.loadSettings();
		this.registerView(
			VIEW_TYPE_TAGS_ROUTES,
			(leaf) =>  this.view = new TagRoutesView(leaf, this)
		);
		const codeProcess = new codeBlockProcessor(this);
		this.registerMarkdownCodeBlockProcessor("tagsroutes", codeProcess.codeBlockProcessor);
		this.registerEvent(
			this.app.workspace.on('file-open', (file) => {
				if (file)
					this.onFileClick(file.path);
			})
		);
		/*
				this.addRibbonIcon("dice", "Print leaf types", () => {
					this.app.workspace.iterateAllLeaves((leaf) => {
						console.log(leaf.getViewState().type);
					});
				});
		*/
		//添加按钮1
		this.addRibbonIcon("footprints", "Open tags routes", () => {
			this.activateView();
		});



		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new TagsroutesSettingsTab(this.app, this));



		// 在 Obsidian 插件的 onload 方法中注册事件
		this.registerDomEvent(document, 'click', (e: MouseEvent) => {
			const target = e.target as HTMLElement;
			if (target && target.hasClass('tag')) {
				const tag = target.innerText; // 获取标签内容
				// 传递文件路径给 Graph 并聚焦到相应的节点
				for (let leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_TAGS_ROUTES)) {
					if (leaf.view instanceof TagRoutesView) {
						leaf.view.focusGraphTag(tag)
					}
				}
				//	this.focusGraphTag(tag); // 在图形中聚焦到对应的节点
			}
		});

	//	const { vault } = this.app;
    //    // 检查文件是否已经存在
    //    if (!vault.getAbstractFileByPath("scripts/tag-report.js")) {
    //        await vault.create("scripts/tag-report.js", fileContent);
    //    }
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
		this.settings.customSlot[0] =structuredClone( 
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
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Log Node/Link Count')
			.setDesc('Enable or disable logging the number of nodes and links when the graph loads')
			.addToggle((toggle: ToggleComponent) => {
				toggle
					.onChange(async (value) => {
						if (!value) {
							this.toggleEnableShow.setValue(value);
						}
						this.plugin.settings.enableSave = value;
						await this.plugin.saveSettings();
					})
					.setValue(this.plugin.settings.enableSave)
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
				.setValue(this.plugin.settings.enableShow )
				this.toggleEnableShow = toggle;
			}
			)
	}
}
