import { App, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';
import { processGroup, createMarkdownTable, getAndSortCards, getJSONObject} from 'scripts/scripts';

export interface Timeline {
	canvasPath: string;
	notePath: string;
	headings: string[];
}
interface RwkCanvasTimelineSettings {
	timelines: Timeline[];
	timelineNotes: string[];
}

const DEFAULT_SETTINGS: RwkCanvasTimelineSettings = {
	timelines: new Array<Timeline>,
	timelineNotes: new Array<string>
}

export default class RwkCanvasTimelinePlugin extends Plugin {
	settings!: RwkCanvasTimelineSettings;
	
	async onload() {
		await this.loadSettings();
		
		// This adds a settings tab
		this.addSettingTab(new RwkCanvasTimelineSettingTab(this.app, this));
		// when a file is opened check for and update any timeline file
		this.registerEvent(this.app.workspace.on('file-open', (file) => {
			if (file == null) return;
			this.updateTimeline(file);
		}));
	}
	onunload() {}
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
		this.updateNotesArray();
	}
	async saveSettings() {
		await this.saveData(this.settings);
		this.updateNotesArray();
	}
    updateNotesArray() {
		this.settings.timelineNotes = [];
		for (const timeline of this.settings.timelines.values()){
			this.settings.timelineNotes.push(timeline.notePath);
		}
    }
	addNewTimeline() {
    	console.log ('adding new timeline');
		this.settings.timelines.push({canvasPath: 'default', notePath: 'default', headings: ['Title', 'Group', 'none']/*, positionIndex: this.settings.timelines.length, titleHeadimgIndex: 0*/});
	}
	deleteTimeline(index: number) {
		console.log ('deleting timeline at index: ' + index);
		this.settings.timelines.splice(index, 1);
	}
	addNewHeading(index: number) {
		console.log('adding new heading');
		this.settings.timelines[index].headings.push('none');
		
	}
	getTimelineData(file: TFile): Timeline | undefined{
		return this.settings.timelines.find(timeline => timeline.notePath == file.name)
	}
		
	async updateTimeline(file: TFile) {
		const timeline = this.getTimelineData(file);
		if (timeline == undefined) return;
		const jsonObject = await getJSONObject(this.app.vault, timeline);
		const groupsAndCards = getAndSortCards(jsonObject);
		const rows = await processGroup(this.app, groupsAndCards[0], groupsAndCards[1]);
    	createMarkdownTable(this.app.vault, timeline, rows);
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
			.setName('Add new timeline')
			.setDesc('adds fields for another canvas and note to be used as a timelline')
			.addButton(button => button
				.setIcon('plus')
				.onClick(mc => {
					this.plugin.addNewTimeline();
					this.display();
				})
			);
		
		containerEl.createEl("h3", {text: "Timelines"});
		const divTimeline = containerEl.createDiv({cls: "settings-div"});

		for (const [index, timeline] of this.plugin.settings.timelines.entries()){
		    
			new Setting(divTimeline)
			.setName('Canvas and Note for timeline #' + index + 1)//(timeline.positionIndex + 1))
			.setTooltip('The canvas and note paths that will be used to generate the timeline table')
			.addText(text => text
				.setPlaceholder('Canvas path')
				.setValue(timeline.canvasPath)
				.onChange(async (value) => {
					timeline.canvasPath = value;
					await this.plugin.saveSettings();
				})
			)
			.addText(text => text
				.setPlaceholder('Note path')
				.setValue(timeline.notePath)
				.onChange(async (value) => {
					timeline.notePath = value;
					await this.plugin.saveSettings();
				})
			)
			.addButton(button => button 
				.setIcon('trash')
				.onClick(async (mc) => {
					this.plugin.deleteTimeline(index);//timeline.positionIndex);
					await this.plugin.saveSettings();
					this.display();
				})
			);

			new Setting(divTimeline)
			.setName('Headings')
			.setTooltip("If it doesn't exist, a heading name will be added to the frontmatter of each note in the timeline canvas in lowercase")

			const headingsSetting = new Setting(divTimeline);

			for (let heading of timeline.headings.values()){

				headingsSetting.controlEl.addClass("flexy");
				headingsSetting
					.addText(text => text
						.setPlaceholder('heading')
						.setValue(heading)
						.onChange(async (value) => {
							heading = value;
							await this.plugin.saveSettings();
						})
					);
			}
			headingsSetting
				.addButton(button => button
					.setIcon('plus')
					.onClick(async (mc) => {
						this.plugin.addNewHeading(index);
						await this.plugin.saveSettings();
						this.display();
					})
				);
		}
	}
}