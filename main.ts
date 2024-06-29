import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, getAllTags, CachedMetadata, TagCache } from 'obsidian';
import { ItemView, WorkspaceLeaf } from "obsidian";
import  ForceGraph3D  from "3d-force-graph";


class tagInfo {
	public id:  string;
	public name: string;
	public file: string;
	public time: string;
	public parent: tagInfo;
	public pos: string ;
}

// 定义类型
interface Node {
	id: string;
	type: 'file' | 'tag' | 'attachment';
  }
  
  interface Link {
	source: string;
	target: string;
  }
  /*
  interface CachedMetadata {
	links?: { link: string }[];
	tags?: string[];
  }
  */
  interface FileData {
	path: string;
	cache: CachedMetadata | null;
  }
  
  interface GraphData {
	nodes: Node[];
	links: Link[];
  }
  
  // 函数：获取所有链接
  /*
  const getAllLinks = (cache: CachedMetadata | null): string[] => {
	if (!cache || !cache.links) return [];
	return cache.links.map(link => link.link);
  };*/

  const getAllLinks = (cache: CachedMetadata | null): string[] => {
	if (!cache || !cache.links) return [];
	return cache.links.map(link => {
	  const linkPath = link.link;
	  return linkPath.contains('.') ? linkPath : `${linkPath}.md`;
	});
  };

// 函数：获取所有标签
const getTags = (cache: CachedMetadata | null): TagCache[] => {
	if (!cache || !cache.tags) return [];
	return cache.tags;
  };

// 函数：判断文件类型
const getFileType = (filePath: string): 'file' | 'attachment' => {
	const extension = filePath.split('.').pop();
	if (extension === 'md') {
	  return 'file';
	} else {
	  return 'attachment';
	}
  };
    
// 创建 filesDataMap
const filesDataMap: Map<string, CachedMetadata | null> = new Map();
// 创建节点和链接数组
const nodes: Node[] = [];
const links: Link[] = [];
const tagSet: Set<string> = new Set();

export const VIEW_TYPE_EXAMPLE = "example-view";

// 创建一个View 
export class ExampleView extends ItemView {
  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType() {
    return VIEW_TYPE_EXAMPLE;
  }

  getDisplayText() {
    return "Example view";
  }
  
  getCache()
  {

//	this.app.vault.getMarkdownFiles().forEach(file => {
		this.app.vault.getFiles()
			.filter(f=>f.extension == 'md')
			.forEach(file => {
			const cache = this.app.metadataCache.getCache(file.path);
		filesDataMap.set(file.path, cache);
	  });

	{  

/*
	  const tags = this.app.vault.getMarkdownFiles().map(
		  f=>{
			  const cache = this.app.metadataCache.getCache(f.path);
			 // console.log("file info:", f.path)
			  return cache?(cache.tags? [f.path, cache.tags]:[f.path, []]):[];
			  }
		  
	  )
	  console.log ("gettags: The tags are: ", tags[0][0])
	  const container = this.containerEl.children[1];
	  container.empty();
	  gData = {
		nodes: tags.map(i=>({id: i[0]})),   
		links:  [...Array(tags.length).keys()]
		.filter(id => id)
		.map(id => ({
		  source: tags[id][0],
		  target: tags[Math.round(Math.random() * (id-1))][0]
		  //target: "2"
		}))
	}
	console.log("gdata is:", gData)
	//const container = this.containerEl.children[1];
	//container.empty();
	
	const Graph = ForceGraph3D()
	.width(1024)
	.height(768)
	.backgroundColor("#333333")	  

	(container.createEl("div",  "3d-graph"))
	.graphData(gData)
*/
	  /*
			  实际上我们需要的tags的information包括：
			  1. 名称
			  2. 位置：即行，列的位置
			  3. 时间： 创建的时间，如果有
			  4. 文件： 此时，这个tag位于哪个文件中
			  5. 从属： 它是不是其它tag的子级
	  */
}
  }
  
  buildGdata(container : Element)
  {
// 创建节点数组
const nodes: Node[] = Array.from(filesDataMap.keys()).map(filePath => ({
	id: filePath
  }));
  
  // 创建链接数组
  const links: Link[] = [];
  filesDataMap.forEach((cache, filePath) => {
	const internalLinks = getAllLinks(cache);
	//console.log("filepath: ", filePath, " internallinks: ", internalLinks, " links: ", cache.links);
	internalLinks.forEach(targetPath => {
	//	console.log("check path: ", targetPath)
	  if (filesDataMap.has(targetPath)) {
		//  console.log ("do push: ", filePath, " target : ", targetPath)
		links.push({
		  source: filePath,
		  target: targetPath
		});
	  }
	});
  });
  
  // 生成 gData 对象
  const gData: GraphData = {
	nodes: nodes,
	links: links
  };

// 打印结果
console.log("got the gdata is: ", gData);
const Graph = ForceGraph3D()
					.width(1024)
					.height(768)
					.backgroundColor("#333333")
		
		(container.createEl("div",  "3d-graph"))
			.graphData(gData)
			.nodeLabel('id')
			.nodeOpacity(0.9)
			.nodeColor(()=>'#00ffff')
			//.nodeColor('#00ffff')
			.onNodeClick(node => {
				const distance = 140;
				const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);
				const newPos = node.x || node.y || node.z
				? { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }
				: { x: 0, y: 0, z: distance }; // special case if node is in (0,0,0)
	
			  Graph.cameraPosition(
				newPos, // new position
				node, // lookAt ({ x, y, z })
				3000  // ms transition duration
			  );
			}) 
  }
  	// view的open 事件
  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
	container.createEl("h4", { text: "This is for tags routes." });
	const files = this.app.vault.getMarkdownFiles()
	this.getCache();
	this.buildGdata(container);
	let aa =this.app.metadataCache.getCache("欢迎.md");
	if (aa) {	
		console.log("file found");
		if (aa.tags) {
			console.log("file tags found",aa.tags.length);
			(aa.tags).forEach(e => {
				//console.log("is one");
				//container.createEl("div", "def");
				container.createEl("div",{text: e.tag + "$ " + e.position.start.line.toString()})
			});
		}
		const tags = getAllTags(aa); 
		console.log("tags are: ", tags)
		if (tags) 
		{/*
			tags.forEach(element => {
				container.createEl("div",{text: element})	
			});
			
			const gData1 = {
				nodes: tags.map(i=>({id: i})),
				links:  [...Array(tags.length).keys()]
				.filter(id => id)
				.map(id => ({
				  source: tags[id],
				  target: tags[Math.round(Math.random() * (id-1))]
				  //target: "2"
				}))
			}
			console.log("gdata is : ", gData1);
		const Graph = ForceGraph3D()
					.width(1024)
					.height(768)
					.backgroundColor("#333333")
		
		(container.createEl("div",  "3d-graph"))
			.graphData(gData1)
			.nodeLabel('id')
			.nodeOpacity(0.9)
			.nodeColor(()=>'#00ffff')
			//.nodeColor('#00ffff')
			.onNodeClick(node => {
				const distance = 140;
				const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);
				const newPos = node.x || node.y || node.z
				? { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }
				: { x: 0, y: 0, z: distance }; // special case if node is in (0,0,0)
	
			  Graph.cameraPosition(
				newPos, // new position
				node, // lookAt ({ x, y, z })
				3000  // ms transition duration
			  );
			})
			*/
		}
	} else {
		console.log("file not found");
	}
	for (let i = 0; i < files.length; i++) {
		container.createEl("div", { text: (files[i].path) });
	}
/*
	const N = 3;
    const gData = {
      nodes: [...Array(N).keys()].map(i => ({ id: i })),
      links: [...Array(N).keys()]
        .filter(id => id)
        .map(id => ({
          source: id,
          target: Math.round(Math.random() * (id-1))
        }))
	};
*/
//	console.log("gdata is : ", gData);
	
 //   const Graph = ForceGraph3D()
 //     (container.createEl("div",  "3d-graph"))
 //       .graphData(gData);
  }
  	// view 的close 事件
  async onClose() {
    // Nothing to clean up.
  }
}




// Remember to rename these classes and interfaces!

interface TagRoutesSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: TagRoutesSettings = {
	mySetting: 'default'
}

// plugin 主体
export default class TagRoutes extends Plugin {
	settings: TagRoutesSettings;

	async onload() {

		this.registerView(
			VIEW_TYPE_EXAMPLE,
			(leaf) => new ExampleView(leaf)
		  );
	  
		//添加按钮1
		this.addRibbonIcon("footprints", "Activate view", () => {
		this.activateView();
		});


		await this.loadSettings();

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

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
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
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_EXAMPLE);
	
		if (leaves.length > 0) {
		  // A leaf with our view already exists, use that
		  leaf = leaves[0];
		} else {
		  // Our view could not be found in the workspace, create a new leaf
		  // in the right sidebar for it
		  leaf = workspace.getRightLeaf(false);
		  await leaf.setViewState({ type: VIEW_TYPE_EXAMPLE, active: true });
		}
	
		// "Reveal" the leaf in case it is in a collapsed sidebar
		workspace.revealLeaf(leaf);
	  }
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: TagRoutes;

	constructor(app: App, plugin: TagRoutes) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
