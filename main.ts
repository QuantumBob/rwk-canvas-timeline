import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { getAndSortCards } from 'scripts/scripts';

interface RwkCanvasTimelineSettings {
	locationMap: Map<string, string>;
	canvasPath: string;
	notePath: string;
}

const DEFAULT_SETTINGS: RwkCanvasTimelineSettings = {
	canvasPath: 'default',
	notePath: 'default',
	locationMap: new Map()
}

class CanvasTimeline {
	canvasPath: string;
	notePath: string;
	dirty: boolean;
	constructor (plugin: RwkCanvasTimelinePlugin) {
		this.canvasPath = plugin.settings.canvasPath;
		this.notePath = plugin.settings.notePath;

		this.dirty = true;
	}
}

export default class RwkCanvasTimelinePlugin extends Plugin {
	settings: RwkCanvasTimelineSettings;
	canvasTimeline: CanvasTimeline;

	async onload() {
		await this.loadSettings();

		this.canvasTimeline = new CanvasTimeline(this);

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new RwkCanvasTimelineSettingTab(this.app, this));

		this.registerEvent(this.app.workspace.on('file-open', (file) => {
			if(file == null) return;
			if (this.settings.notePath.contains(file.name)){				
				getAndSortCards(this, file.name);
			}
		}));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class RwkCanvasTimelineSettingTab extends PluginSettingTab {
	plugin: RwkCanvasTimelinePlugin;

	constructor(app: App, plugin: RwkCanvasTimelinePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();
		containerEl.createEl("h3", { text: "Canvas Timeline Settings" });

		new Setting(containerEl)
			.setName('Canvas to use as timeline')
			.setDesc('The canvas that will be used to generate the timeline table')
			.addText(text => text
				.setPlaceholder('Canvas path')
				.setValue(this.plugin.settings.canvasPath)
				.onChange(async (value) => {
					this.plugin.settings.canvasPath = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Note to use for generated table')
			.setDesc('Note that displays the timeline table')
			.addText(text => text
				.setPlaceholder('Table note path')
				.setValue(this.plugin.settings.notePath)
				.onChange(async (value) => {
					this.plugin.settings.notePath = value;
					await this.plugin.saveSettings();
				}));
	}
}

/* From Better Word Count
function element(name: string) {
    return document.createElement(name);
}
function text(data: string) {
    return document.createTextNode(data);
}
function space() {
    return text(' ');
}

function createFramgment$1 (ctx: any){

	let div6;
	let h40;
	let t1;
	let p0;
	let t3;
	let div2;
	let button0;
	let t5;
	let button1;
	let t7;
	let t8;
	let h41;
	let t10;
	let p1;
	let t12;
	let div5;
	let button2;
	let t14;
	let button3;
	let t16;
	let mounted;
	let dispose;
	let each_value_1 =  ctx[1]; //statusItems
	let each_blocks_1: string | any[] = [];

	let each_value =  ctx[2]; //altSItems
	let each_blocks = [];
	
	return{
		c() {
			div6 = element("div");
			h40 = element("h4");
			h40.textContent = "Markdown Status Bar";
			t1 = space();
			p0 = element("p");
			p0.textContent = "Here you can customize what statistics are displayed on the status bar when editing a markdown note.";
			t3 = space();
			div2 = element("div");
			button0 = element("button");
			button0.innerHTML = `<div class="icon">Add Item</div>`;
			t5 = space();
			button1 = element("button");
			button1.innerHTML = `<div class="icon">Reset</div>`;
			t7 = space();

			for (let i = 0; i < each_blocks_1.length; i += 1) {
					each_blocks_1[i].c();
			}
		}
	}
	
}
*/