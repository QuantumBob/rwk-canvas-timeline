import { App, FileSystemAdapter, Plugin, PluginSettingTab, Setting, TextComponent, TFile } from 'obsidian';
import { CanvasFileSuggest, MarkdownFileSuggest } from 'scripts/inputSuggest';
import { getTimeline, initTimelines, updateTimeline } from 'scripts/scripts';

/** Act interface to store act statistics
 *
 * @interface Act
 * @typedef {Act}
 */
interface Act {
    name: string;
	pages: number;
    scenes: number;
}
/** Timeline interface object
 *
 * @export
 * @interface TimelineSettings
 * @typedef {TimelineSettings}
 */
export interface TimelineSettings {
	canvasPath: string;
	notePath: string;
	headingsAndProperties: string[];
	headings: string[];
	properties: string[];
	// rows: Node[];
	titleHeadingIndex: number;
	colourHeaderIndex: number;
	showPageCount: boolean;
	showRowNumbers: boolean;
	showGroups: boolean;
	showUngrouped: boolean;
	groupHeading: string;
	ignoreGroups: string;
	wordsPerPage: number;
	totalPageCount: number;
	dirtyActStats: boolean;
	actsPageCount: Map<string, number>;
	actStats: Act[];
	showActStats: boolean;
}
/** Plugin interface object
 *
 * @interface RwkCanvasTimelineSettings
 * @typedef {RwkCanvasTimelineSettings}
 */
interface RwkCanvasTimelineSettings {
	timelines: TimelineSettings[];
	lastIndex: number;
	defaultWordsPerPage: number;
	timelineOpened: boolean;
	tableOpened: boolean;
	noteOpened: boolean;
	timelineJustClosed: boolean;
	updateRunning: boolean;
	initializing: boolean;
}
/** Default plugin settings
 *
 * @type {RwkCanvasTimelineSettings}
 */
const DEFAULT_SETTINGS: RwkCanvasTimelineSettings = {
	timelines: new Array<TimelineSettings>,
	lastIndex: 0,
	defaultWordsPerPage: 250,
	timelineOpened: false,
	tableOpened: false,
	noteOpened: false,
	timelineJustClosed: false,
	updateRunning: false,
	initializing: false
}
/** Default timeline settings
 *
 * @type {TimelineSettings}
 */
const DEFAULT_TIMELINE: TimelineSettings = {
	canvasPath: "",
	notePath: "",
	headingsAndProperties: [],
	headings: [],
	properties: [],
	titleHeadingIndex: -1,
	colourHeaderIndex: -1,
	showPageCount: false,
	showRowNumbers: false,
	showGroups: false,
	showUngrouped: false,
	groupHeading: "",
	ignoreGroups: "",
	wordsPerPage: 250,
	totalPageCount: -1,
	dirtyActStats: false,
	actsPageCount: new Map(),
	actStats: [],
	showActStats: false
}

/** The main class for the timmline plugin
 *
 * @export
 * @class RwkCanvasTimelinePlugin
 * @typedef {RwkCanvasTimelinePlugin}
 * @extends {Plugin}
 */
export default class RwkCanvasTimelinePlugin extends Plugin {
	settings!: RwkCanvasTimelineSettings;
			
	async onload() {
		
		await this.loadSettings();
		
		// Add a settings tab to the plugin
		this.addSettingTab(new RwkCanvasTimelineSettingTab(this.app, this));

		// The modify event for a note or canvas. Calls updateTimeline 
		this.registerEvent(this.app.vault.on('modify', async file => {
		    if (this.settings.initializing) return;
			if(file instanceof TFile){					 
					const timeline = await getTimeline(this, file);
					if (!timeline) 
						return;
					await updateTimeline(this, timeline);//file);
			}
		}));
		this.app.workspace.onLayoutReady(async () => {
			this.settings.initializing = true;
			await initTimelines(this);
		})
		
	}
	
	onunload() {}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	addNewTimeline() {
		this.settings.lastIndex = this.settings.timelines.length == 0 ? 0 : this.settings.timelines.length - 1;
		this.settings.timelines.push(DEFAULT_TIMELINE);
	}

	deleteTimeline(index: number) {
		this.settings.timelines.splice(index, 1);
		this.settings.lastIndex = this.settings.timelines.length == 0 ? 0 : this.settings.timelines.length - 1;
	}

	addNewHeading(index: number) {
		this.settings.timelines[index].headingsAndProperties.push('');
	}

	deleteHeading(index: number) {
		this.settings.timelines[index].headingsAndProperties.pop();
	}

	async copyCssFolder() {
		const pathString = '/.obsidian/snippets/';
		let adapter = this.app.vault.adapter;
		if (adapter instanceof FileSystemAdapter) {
			navigator.clipboard.writeText(adapter.getFullPath(pathString));
		}
	}
}

/** The settings class for this plugin
 *
 * @class RwkCanvasTimelineSettingTab
 * @typedef {RwkCanvasTimelineSettingTab}
 * @extends {PluginSettingTab}
 */
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

		/* Input box with simple suggestion search
		* import { FileSuggest, CanvasFileSuggest, MarkdownFileSuggest } from 'inputSuggest';
		*
		const callback = async (value:string) => {
			this.plugin.settings.suggestText = value;
			await this.plugin.saveSettings();
        }
		const setting = new Setting(containerEl)
			.setName('Suggest Test')
		const textComponent = new TextComponent(setting.controlEl)
			.setValue('')
			.onChange(callback)
		new FileSuggest(textComponent.inputEl as HTMLInputElement, this.app, callback)
		*/
		
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
			.setTooltip('Leave blank for none')
			.addText(text => text
				.setValue((this.plugin.settings.timelines[timelineIndex].colourHeaderIndex + 1).toString())
				.onChange(async value => {
					this.plugin.settings.timelines[timelineIndex].colourHeaderIndex =  parseInt(value) - 1;
					await this.plugin.saveSettings();
				})
			)
			new Setting(divTimeline)
			.setName('Show Row Numbers')
			.setTooltip('Adds a number to each row')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.timelines[timelineIndex].showRowNumbers)
				.setTooltip('Adds a number to each row')
				.onChange(async value => {
					this.plugin.settings.timelines[timelineIndex].showRowNumbers =  value;
					await this.plugin.saveSettings();
				})
			)
			const pageCountControl = new Setting(divTimeline);
			pageCountControl
			.setName('Show Page Count')
			.setDesc('Add number of words per page. Defaults to 250')
			.setTooltip('Leave blank for default - 250 words per page')
			.addText(text => text
				.setValue(this.plugin.settings.timelines[timelineIndex].wordsPerPage == undefined ? this.plugin.settings.defaultWordsPerPage.toString() : this.plugin.settings.timelines[timelineIndex].wordsPerPage.toString())
				.onChange(async value => {
					this.plugin.settings.timelines[timelineIndex].wordsPerPage = value == '' ? this.plugin.settings.defaultWordsPerPage : parseInt(value);
					await this.plugin.saveSettings();
				})
			)
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.timelines[timelineIndex].showPageCount)
				.setTooltip('The page count will be added as the last column to the table')
				.onChange(async value => {
					this.plugin.settings.timelines[timelineIndex].showPageCount =  value;
					await this.plugin.saveSettings();
				})
			)
			
			new Setting(divTimeline)
			.setName('Show Groups Column')
			.setDesc('Optionally give the column a title')
			.setTooltip('Leave blank for none')
			.addText(text => text
				.setValue(this.plugin.settings.timelines[timelineIndex].groupHeading)
				.onChange(async value => {
					this.plugin.settings.timelines[timelineIndex].groupHeading = value;
					await this.plugin.saveSettings();
				})
			)
			.addToggle(toggle => toggle 
				.setValue(this.plugin.settings.timelines[timelineIndex].showGroups)
				.setTooltip('Toggle on and add a column heading name')
				.onChange(async value => {
					this.plugin.settings.timelines[timelineIndex].showGroups =  value;
					await this.plugin.saveSettings();
				})
			)
			new Setting(divTimeline)
			.setName('Show Ungrouped Cards')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.timelines[timelineIndex].showUngrouped)
				.onChange(async value => {
					this.plugin.settings.timelines[timelineIndex].showUngrouped =  value;
					await this.plugin.saveSettings();
				})
			)
			new Setting(divTimeline)
			.setName('Ignore groups with these labels')
			.setDesc('Seperate each group with a comma or a space')
			.setTooltip('Leave blank for none')
			.addText(text => text
				.setValue(this.plugin.settings.timelines[timelineIndex].ignoreGroups)
				.onChange(async value => {
					this.plugin.settings.timelines[timelineIndex].ignoreGroups = value;
					await this.plugin.saveSettings();
				})
			)
			new Setting(divTimeline)
			.setName('Show Acts Stats')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.timelines[timelineIndex].showActStats)
				.onChange(async value => {
					this.plugin.settings.timelines[timelineIndex].showActStats =  value;
					this.plugin.settings.timelines[timelineIndex].dirtyActStats = true;
					await this.plugin.saveSettings();
				})
			)
		}
	}
	hide(): void {
		if (this.plugin.settings.lastIndex < 0)
			this.plugin.settings.lastIndex = 0;

		for (let i = this.plugin.settings.lastIndex; i < this.plugin.settings.timelines.length; i++){
			updateTimeline(this.plugin, this.plugin.settings.timelines[i]);
		}
		
	}
}