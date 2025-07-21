import { App, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';
import { processGroup, createMarkdownTable, getAndSortCards, getJSONObject} from 'scripts/scripts';

export interface Timeline {
	canvasPath: string;
	notePath: string;
	headings: string[];
	titleHeadingIndex: number;
	groupHeadingIndex: number;
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
		this.settings.timelines.push({canvasPath: 'default', notePath: 'default', headings: ['Title', 'Group', 'none'], titleHeadingIndex: 0, groupHeadingIndex: 1});
	}
	deleteTimeline(index: number) {
		console.log ('deleting timeline at index: ' + index);
		this.settings.timelines.splice(index, 1);
	}
	addNewHeading(index: number) {
		console.log('adding new heading');
		this.settings.timelines[index].headings.push('none');
	}
	deleteHeading(index: number) {
		console.log('deleting last heading');
		this.settings.timelines[index].headings.pop();
	}
	getTimelineData(file: TFile): Timeline | undefined{
		return this.settings.timelines.find(timeline => timeline.notePath == file.path)
	}
	async updateTimeline(file: TFile) {
		const timeline = this.getTimelineData(file);
		if (timeline == undefined) return;
		const jsonObject = await getJSONObject(this.app.vault, timeline);
		const groupsAndCards = getAndSortCards(jsonObject);
		const rows = await processGroup(this.app, timeline, groupsAndCards[0], groupsAndCards[1]);
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
		const divTimelines = containerEl.createDiv({cls: "settings-div"});

		for (const [timelineIndex, timeline] of this.plugin.settings.timelines.entries()){

			const divTimeline = divTimelines.createDiv({cls: "settings-div"});
			const timelineNumber = timelineIndex + 1;
		    const fileNameSetting = new Setting(divTimeline);
			fileNameSetting.controlEl.addClass("right-justify");
			fileNameSetting
			.setName('Canvas and Note for timeline #' + timelineNumber)
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
				.setTooltip('Delete this timeline. No files will be deleted')
				.onClick(async (mc) => {
					this.plugin.deleteTimeline(timelineIndex);
					await this.plugin.saveSettings();
					this.display();
				})
			);

			new Setting(divTimeline)
			.setName('Headings')
			.setTooltip("If it doesn't exist, a frontmatter tag will be added, in lowercase, for each heading in the headings fields.\nUse pattern 'heading | frontmatter' to use an alias between the frontmatter and the heading.")
			.addButton(button => button 
				.setIcon('trash')
				.setTooltip('Delete the last heading box')
				.onClick(async (mc) => {
					this.plugin.deleteHeading(timelineIndex);
					await this.plugin.saveSettings();
					this.display();
				})
			);
					
			const headingsSetting = new Setting(divTimeline);
			headingsSetting.controlEl.addClass("left-justify");
			headingsSetting.infoEl.addClass("display-none");
			
			for (let [headingIndex, heading] of timeline.headings.entries()){
				headingsSetting
					.setTooltip("")
					.addText(text => text
						.setPlaceholder('heading')
						.setValue(heading)
						.onChange(async (value) => {
							this.plugin.settings.timelines[timelineIndex].headings[headingIndex] = value;
							await this.plugin.saveSettings();
						})
					)
			}
			headingsSetting
				.addButton(button => button
					.setIcon('plus')
					.onClick(async (mc) => {
						this.plugin.addNewHeading(timelineIndex);
						await this.plugin.saveSettings();
						this.display();
					})
				);
		}
	}
}