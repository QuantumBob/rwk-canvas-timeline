import RwkCanvasTimelinePlugin, { TimelineSettings } from 'main';
import { App, Modal, FileSystemAdapter, Plugin, PluginSettingTab, Setting, TextComponent, TFile, TFolder, Vault } from 'obsidian';
import { CanvasFileSuggest, MarkdownFileSuggest, FolderSuggest } from 'scripts/inputSuggest';
import { getJsonObject, sortCards, updateHeadingsAndProperties} from 'scripts/scripts'

export class CollatePagesModal extends Modal {
    timeline: TimelineSettings;
    plugin: RwkCanvasTimelinePlugin;

	constructor(app: App, plugin: RwkCanvasTimelinePlugin, timeline: TimelineSettings, onSubmit: (folderPath: string) => void) {
		super(app);
        this.timeline = timeline;
        this.plugin = plugin;
        this.setTitle('Folder with pages to collate');

        const collatedPagesSetting = new Setting(this.contentEl)
   
        const folderTextComponent = new TextComponent(collatedPagesSetting.controlEl)
        .setPlaceholder('Folder path of files')
        .setValue('')
        new FolderSuggest(folderTextComponent.inputEl as HTMLInputElement, this.app);

        this.contentEl.createEl('div', {text: 'Timeline canvas must be active file.'});
        this.contentEl.createEl('div', {text: 'Collated file will be created in same folder.'});
        this.contentEl.createEl('div', {text: 'Warning - collated file will be overritten'});

        new Setting(this.contentEl)
        .addButton((btn) =>
            btn
            .setButtonText('Submit')
            .setCta()
            .onClick(() => {
                this.close();
                onSubmit(folderTextComponent.getValue());
            }));
	}



}

export async function collatePages(plugin: RwkCanvasTimelinePlugin, folder: TFolder, timeline :TimelineSettings) {
    const vault = plugin.app.vault;
    const folderName = folder.name === '/' ? folder.name : folder.name + '/';
    const filePath = `${folderName}${folder.name}-collated.md`;
    let collateFile = vault.getFileByPath(`${filePath}`);
    if(!collateFile)
        collateFile = await vault.create(filePath, "");
    if(!collateFile) return;

    const collatedContents = await vault.cachedRead(collateFile);
    if(collatedContents.length > 0){
        await vault.process(collateFile, () => {
            return '';
        })
    }

    const jsonObject = await getJsonObject(vault, timeline);
    updateHeadingsAndProperties(timeline);
    const rows = await sortCards(vault, plugin.app.fileManager, jsonObject, timeline);

    rows.forEach(async (row)=>{
        const file = vault.getFileByPath(row.file);
        if(file){

            let act = '';
            let title = file.basename;

            await plugin.app.fileManager.processFrontMatter(file, (frontmatter) => {
                act = 'act' in frontmatter ? frontmatter['act'] : '?';
            });

            let contents = await vault.cachedRead(file);
            contents = contents.replace("`=this.act`", act);
            contents = contents.replace("`=this.title`", title);
            const position = plugin.app.metadataCache.getFileCache(file)?.frontmatterPosition;
            const end = position === undefined ? 0 : position.end.line + 1;
            let body = contents.split("\n").slice(end).join("\n");
            await vault.append(collateFile, body);
        }
    })

}
