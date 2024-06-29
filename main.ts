import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, getAllTags, CachedMetadata, TagCache, ToggleComponent } from 'obsidian';
import { ItemView, WorkspaceLeaf, TFile } from "obsidian";
import { TagRoutesView, VIEW_TYPE_TAGS_ROUTES } from "./views/TagsRoutes"
import { createAndWriteToFile } from "./util/util"
import { fileContent } from "./util/query"

interface TagRoutesSettings {
	mySetting: string;
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
	enableSave: boolean;
	enableShow: boolean;
}

const DEFAULT_SETTINGS: TagRoutesSettings = {
	mySetting: 'default',
	broken_file_link_center: 'true',
	broken_file_link_line: 'false',
	md_color: 'green',
	attachment_color: 'yellow',
	broken_color: 'red',
	excllidraw_file_color: '#00ffff',
	tag_color: '#ff00ff',
	link_particle_color: '#ffffff',
	node_size: 5,
	node_repulsion: 5,
	link_distance: 5,
	link_width: 5,
	link_particle_size: 5,
	link_particle_number: 5,
	enableSave: true,
	enableShow: true
}

// plugin 主体
export default class TagsRoutes extends Plugin {

	public settings: TagRoutesSettings;
	onFileClick(filePath: string) {
		// 传递文件路径给 Graph 并聚焦到相应的节点
		for (let leaf of app.workspace.getLeavesOfType(VIEW_TYPE_TAGS_ROUTES)) {
			if (leaf.view instanceof TagRoutesView) {
				leaf.view.focusGraphNodeById(filePath)
			}
		}
	}
	async  onDoubleWait() {
		if (this.app.metadataCache.resolvedLinks !== undefined) {
			console.log("cache is already ready")
			await this.initializePlugin();
		} else {
			this.app.metadataCache.on("resolved", async () => {
				console.log("cache is not ready, wait for it")
				await this.initializePlugin();
			});
		}
	}
	async onload() {
		/*
				await Promise.all([
					new Promise<void>(resolve => this.app.metadataCache.on("resolved", resolve)),
					this.onLayoutReady()
				]);
				await this.onload1.bind(this);*/
		// 监听 metadataCache 的 resolved 事件
		//		this.app.metadataCache.on("resolved", this.onload2.bind(this));

		// 使用 onLayoutReady 确保在布局完成后执行操作
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

		console.log(" on load started initizlize the plugin")
		await this.loadSettings();

		this.registerView(
			VIEW_TYPE_TAGS_ROUTES,
			(leaf) => new TagRoutesView(leaf, this)
		);

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
		this.addRibbonIcon("footprints", "Tags Routes", () => {
			this.activateView();
		});


		/*		
				//添加按钮2
				// This creates an icon in the left ribbon.
				const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
					// Called when the user clicks the icon.
					new Notice('This is a notice!');
				});
				// Perform additional things with the ribbon
				ribbonIconEl.addClass('my-plugin-ribbon-class');
		
		
				//添加按钮3
				this.addRibbonIcon('croissant', 'Greet', () => {
					new Notice('Hello, world! tag routes.');
				});
		
				//添加状态栏元素
				// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
				const statusBarItemEl = this.addStatusBarItem();
				statusBarItemEl.setText('Status Bar Text🍞');
		
				//添加命令：打开一个弹出框
				// This adds a simple command that can be triggered anywhere
				this.addCommand({
					id: 'open-sample-modal-simple',
					name: 'Open sample modal (simple)',
					callback: () => {
						new SampleModal(this.app).open();
					}
				});
				// This adds an editor command that can perform some operation on the current editor instance
				this.addCommand({
					id: 'sample-editor-command',
					name: 'Sample editor command',
					editorCallback: (editor: Editor, view: MarkdownView) => {
						console.log(editor.getSelection());
						editor.replaceSelection('Sample Editor Command');
					}
				});
				// This adds a complex command that can check whether the current state of the app allows execution of the command
				this.addCommand({
					id: 'open-sample-modal-complex',
					name: 'Open sample modal (complex)',
					checkCallback: (checking: boolean) => {
						// Conditions to check
						const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
						if (markdownView) {
							// If checking is true, we're simply "checking" if the command can be run.
							// If checking is false, then we want to actually perform the operation.
							if (!checking) {
								new SampleModal(this.app).open();
							}
		
							// This command will only show up in Command Palette when the check function returns true
							return true;
						}
					}
				});
		*/
		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new TagsroutesSettingsTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		//	this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
		//		console.log('click', evt);
		//	});

		// 在 Obsidian 插件的 onload 方法中注册事件
		this.registerDomEvent(document, 'click', (e: MouseEvent) => {
			const target = e.target as HTMLElement;
			if (target && target.hasClass('tag')) {
				const tag = target.innerText; // 获取标签内容
				console.log("clicked a tag name is:", tag)
				// 传递文件路径给 Graph 并聚焦到相应的节点
				for (let leaf of app.workspace.getLeavesOfType(VIEW_TYPE_TAGS_ROUTES)) {
					if (leaf.view instanceof TagRoutesView) {
						leaf.view.focusGraphTag(tag)
					}
				}
				//	this.focusGraphTag(tag); // 在图形中聚焦到对应的节点
			}
			//console.log("click: ", e)
			//console.log("inner text: ", target.innerText)
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
		createAndWriteToFile("scripts/tag-report.js", fileContent, false);
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
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
			//  const activeLeaf = workspace.getMostRecentLeaf()
			//	leaf = workspace.createLeafBySplit(activeLeaf,'horizontal');
			leaf = workspace.getLeaf('split')
			//		leaf = workspace.getLeaf('window')

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

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
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
			.setName('Log nodes/links number')
			.setDesc('Enable or disable log nodes/links number on graph loading')
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
			.setName('Turn to log file after start')
			.setDesc('Show the log above automaticly after graph loaded')
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
