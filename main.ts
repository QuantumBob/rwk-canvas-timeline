import { App, FileSystemAdapter, Plugin, PluginSettingTab, Setting, TextComponent, TFile } from 'obsidian';
import { CanvasFileSuggest, MarkdownFileSuggest } from 'scripts/inputSuggest';
import { updateTimeline } from 'scripts/scripts';

export interface TimelineSettings {
	canvasPath: string;
	notePath: string;
	headingsAndProperties: string[];
	headings: string[];
	properties: string[];
	titleHeadingIndex: number;
	colourHeaderIndex: number;
	showPageCount: boolean;
	showGroups: boolean;
	groupHeading: string;
}
interface RwkCanvasTimelineSettings {
	timelines: TimelineSettings[];
	suggestText: string;
}

const DEFAULT_SETTINGS: RwkCanvasTimelineSettings = {
	timelines: new Array<TimelineSettings>,
	suggestText: ''
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
	}
	async saveSettings() {
		await this.saveData(this.settings);
	}
	addNewTimeline() {
    	console.log ('adding new timeline');
		this.settings.timelines.push({canvasPath: '', notePath: '', headingsAndProperties: [], headings: [], properties: [], titleHeadingIndex: 0, colourHeaderIndex: 2, showPageCount: false, showGroups:false, groupHeading: ''});
	}
	deleteTimeline(index: number) {
		console.log ('deleting timeline at index: ' + index);
		this.settings.timelines.splice(index, 1);
	}
	addNewHeading(index: number) {
		console.log('adding new heading');
		this.settings.timelines[index].headingsAndProperties.push('none');
	}
	deleteHeading(index: number) {
		console.log('deleting last heading');
		this.settings.timelines[index].headingsAndProperties.pop();
	}
	async copyCssFolder() {
		console.log('copying css folder to clipboard');
		const pathString = '/.obsidian/snippets/';
		let adapter = this.app.vault.adapter;
		if (adapter instanceof FileSystemAdapter) {
			navigator.clipboard.writeText(adapter.getFullPath(pathString));
		}
	}

	updateTimeline(file: TFile) {
		updateTimeline(this, file);
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

		// Input box with simple suggestion search
		// const callback = async (value:string) => {
		// 	this.plugin.settings.suggestText = value;
		// 	await this.plugin.saveSettings();
        // }
		// const setting = new Setting(containerEl)
		// 	.setName('Suggest Test')
		// const textComponent = new TextComponent(setting.controlEl)
		// 	.setValue('')
		// 	.onChange(callback)
		// new FileSuggest(textComponent.inputEl as HTMLInputElement, this.app, callback)
		
		
		new Setting(containerEl)
		.setName('Path to folder with timeline table rows.css file - /.obsidian/snippets/')
		.setTooltip('The stylesheet folder for the row colour classes')
		.addButton(button => button
			.setIcon('copy')
			.setTooltip('Copy the folder path to the clipboard')
			.onClick( mc => {
				this.plugin.copyCssFolder();
			})
		);
		
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

			const canvasCallback = async (value:string) => {
				timeline.canvasPath = value;
				await this.plugin.saveSettings();
			}

			const noteCallback = async (value:string) => {
				timeline.notePath = value;
				await this.plugin.saveSettings();
			}

		    const fileNameSetting = new Setting(divTimeline);

			fileNameSetting.controlEl.addClass("right-justify");

			fileNameSetting
			.setName('Canvas and Note for timeline #' + timelineNumber)
			.setTooltip('The canvas and note paths that will be used to generate the timeline table');
			const canvasTextComponent = new TextComponent(fileNameSetting.controlEl)
				.setPlaceholder('Canvas path')
				.setValue(timeline.canvasPath)
				.onChange(canvasCallback)
			new CanvasFileSuggest(canvasTextComponent.inputEl as HTMLInputElement, this.app, canvasCallback);

			const noteTextComponent = new TextComponent(fileNameSetting.controlEl)
				.setPlaceholder('Note path')
				.setValue(timeline.notePath)
				.onChange(noteCallback)
			new MarkdownFileSuggest(noteTextComponent.inputEl as HTMLInputElement, this.app, noteCallback);
	
			fileNameSetting.addButton(button => button 
				.setIcon('trash')
				.setTooltip('Delete this timeline. No files will be deleted')
				.onClick(async (mc) => {
					this.plugin.deleteTimeline(timelineIndex);
					await this.plugin.saveSettings();
					this.display();
				})
			);

			const headingsTitle = new Setting(divTimeline);
			headingsTitle
			.setName('Headings')
			.setDesc('Use Title as the tag for the title heading, and Group for the group heading')
			.setTooltip("If it doesn't exist, a frontmatter tag will be added, in lowercase, for each heading in the headings fields.\nUse pattern 'heading | frontmatter' to use an alias between the frontmatter and the heading.");
									
			const headingsSetting = new Setting(divTimeline);
			headingsSetting.controlEl.addClass("left-justify", "heading-width");
			headingsSetting.infoEl.addClass("display-none");
			
			for (let [headingIndex, heading] of this.plugin.settings.timelines[timelineIndex].headingsAndProperties.entries()){
				headingsSetting
				.setTooltip("")
				.addText(text => text
					.setPlaceholder('heading')
					.setValue(heading)
					.onChange(async (value) => {
						this.plugin.settings.timelines[timelineIndex].headingsAndProperties[headingIndex] = value;
						await this.plugin.saveSettings();
					})
					.inputEl.before(createEl('label', {text: (headingIndex + 1).toString() + ". "}))
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
			)
			.addButton(button => button 
				.setIcon('trash')
				.setTooltip('Delete the last heading box')
				.onClick(async (mc) => {
					this.plugin.deleteHeading(timelineIndex);
					await this.plugin.saveSettings();
					this.display();
				})
			);
			
			new Setting(divTimeline)
			.setName('What number heading is the Title?')
			.setDesc('')
			.setTooltip('Type the number of the heading. Leave blank for none')
			.addText(text => text
				.setValue((this.plugin.settings.timelines[timelineIndex].titleHeadingIndex + 1).toString())
				.onChange(async value => {
					this.plugin.settings.timelines[timelineIndex].titleHeadingIndex =  parseInt(value) - 1;
					await this.plugin.saveSettings();
				})
			)
			new Setting(divTimeline)
			.setName('What number heading is the colour scheme on?')
			.setTooltip('leave blank for none')
			.addText(text => text
				.setValue((this.plugin.settings.timelines[timelineIndex].colourHeaderIndex + 1).toString())
				.onChange(async value => {
					this.plugin.settings.timelines[timelineIndex].colourHeaderIndex =  parseInt(value) - 1;
					await this.plugin.saveSettings();
				})
			)
			new Setting(divTimeline)
			.setName('Show Page Count')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.timelines[timelineIndex].showPageCount)
				.setTooltip('The page count will be added as the last column to the table')
				.onChange(async value => {
					this.plugin.settings.timelines[timelineIndex].showPageCount =  value;
					await this.plugin.saveSettings();
				})
			)
			new Setting(divTimeline)
			.setName('Show groups in table')
			.setTooltip('leave blank for none')
			.addToggle(toggle => toggle 
				.setValue(this.plugin.settings.timelines[timelineIndex].showGroups)
				.setTooltip('Toggle on and add a column heading name')
				.onChange(async value => {
					this.plugin.settings.timelines[timelineIndex].showGroups =  value;
					await this.plugin.saveSettings();
				})
			)
			.addText(text => text
				.setValue(this.plugin.settings.timelines[timelineIndex].groupHeading)
				.onChange(async value => {
					this.plugin.settings.timelines[timelineIndex].groupHeading= value;
					await this.plugin.saveSettings();
				})
			)
		}
	}

	hide(): void {
		console.log(this.plugin.settings.suggestText);
		updateTimeline(this.plugin, this.app.workspace.getActiveFile());
	}
}