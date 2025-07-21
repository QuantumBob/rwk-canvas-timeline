/*
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function allInOne(plugin: RwkCanvasTimelinePlugin, file: TFile) {

    const timeline = plugin.settings.timelines.find(timeline => timeline.notePath == file.path)
    if (timeline == undefined) return;

    let jsonString: string;

    const tFile = plugin.app.vault.getFileByPath(timeline.canvasPath);
    if (tFile == null) {
        jsonString = "";
    } else {
        jsonString = await plugin.app.vault.cachedRead(tFile);
    }
    
    const jsonObject = JSON.parse(jsonString);
    
    const cards: CanvasNode[] = [];
    const groups: CanvasNode[] = [];

    // seperate the json into group and card nodes
    for (const node of jsonObject.nodes) {
        if( node.type == 'file') cards.push(node);
        if( node.type == 'group') groups.push(node);
    }
    // sort the group nodes into x order
    groups.sort((group1: CanvasNode, group2: CanvasNode) => group1.x - group2.x);

    // let groupedCards = [];
    let rows = [];

    for (const group of groups) {
        // find cards with an x value greater than the groups x and less than the groups x + width
        let groupedCards = [];
        
        groupedCards = cards
        .filter((card: CanvasNode) => {
            if (card.x >= group.x && card.x <= group.x + group.width) {
                if(Object.hasOwn(group, "label")) {
                    Object.assign(card, {"group": group.label.toLowerCase()});
                } else {
                    Object.assign(card, {"group": "unknown"});
                }
                return true;
            }})
        .sort((a:CanvasNode, b:CanvasNode) => {
            if (a.y - b.y == 0) {
                return a.x - b.x;
            } else return a.y - b.y;
        });
    

        for(const card of groupedCards) {
            // load each card in the group
            const tFile = plugin.app.vault.getFileByPath(card.file);
            if (tFile != null) {
                //check if the page the card comes from has these in its frontmatter
                await plugin.app.fileManager.processFrontMatter(tFile, (frontmatter: Record<string, string>) => {
                    for(const property of timeline.properties) {
                        if(property.length == 0) continue;
                        
                        if(!(property in frontmatter)) {
                            frontmatter[property.toString()] = 'none';/
                        } else {
                            Object.assign(card, {[property]: frontmatter[property]})
                        }
                    }
                    if(!('group' in frontmatter)) {
                        if(Object.hasOwn(group, "group")) {
                            frontmatter['label'] = group.label;
                        } else {
                            frontmatter['label'] = 'none';
                        }
                    }
                })
                if(Object.hasOwn(tFile, "basename")) {
                    Object.assign(card, {"basename": tFile.basename});
                } else {
                    Object.assign(card, {"basename": "none"});
                }            
                // get the latest page count
                if(timeline.showPageCount)
                    card.pageCount = await pageCount(plugin.app.vault, tFile);
                else card.pageCount = -1;
            }
            rows.push(card);
        }        
    }    
     const tableFile = plugin.app.vault.getFileByPath(timeline.notePath);
    if(tableFile == null) return;
    
    let tableHeadingRow = '|';
    let tableDividerRow = '|';
    for(let i=0; i<timeline.headings.length; i++){
        tableHeadingRow += timeline.headings[i] + '|';
        tableDividerRow += '---|';
    }
    if(timeline.showPageCount)  {
        tableHeadingRow += 'Page Count|';
        tableDividerRow += '---|';
    }

    // const outputRows: string[][] = rows.map((data: Record<string, unknown>) => {
    const outputRows: string[][] = rows.map((data: CanvasNode) => {

        const colourProperty = timeline.properties[timeline.colourHeaderIndex];
        let output = '|<span class="' + data[colourProperty as keyof CanvasNode] + '"></span>';
        
        timeline.properties.forEach((property, index) => {
            if(index == timeline.titleHeadingIndex){
                output += '[[' + data['basename'] + ']]' + '|';
            } else if(index == timeline.groupHeadingIndex){
                output += data.label + '|';
            } else {
                output += data[property as keyof CanvasNode] + '|';
            }
        });

        if(timeline.showPageCount){
           output += data.pageCount + '|';
        }
  
        return [output];
    });
    const finalOutput = tableHeadingRow + '\n' + tableDividerRow + '\n' + outputRows.join('\n');
    plugin.app.vault.process(tableFile, data => {
        const regex = /\|[\|\w\n\s-<=">\[\]/:\.]+\|/
        return data.replace(regex, finalOutput);
    });
    
}	
export function getTimelineData(plugin: RwkCanvasTimelinePlugin, file: TFile): Timeline | undefined{
    return plugin.settings.timelines.find(timeline => timeline.notePath == file.path)
}
export async function getJSONObject(vault: Vault, timeline: Timeline) {
    let jsonString: string;

    const tFile = vault.getFileByPath(timeline.canvasPath);
    if (tFile == null) {
        jsonString = "";
    } else {
        jsonString = await vault.cachedRead(tFile);
    }
    
    const jsonObject = JSON.parse(jsonString);
    return jsonObject;
}
export function getAndSortCards(jsonObject: JsonObject) {

    const cards: CanvasNode[] = [];
    const groups: CanvasNode[] = [];
    // seperate the joson into group and card nodes
    for (const node of jsonObject.nodes) {
        if( node.type == 'file') cards.push(node);
        if( node.type == 'group') groups.push(node);
    }
    // sort the group nodes into x order
    groups.sort((group1: CanvasNode, group2: CanvasNode) => group1.x - group2.x);

    return [groups, cards];
}
// put all cards in a group into the groupedCards array.
export async function processGroup (plugin: RwkCanvasTimelinePlugin, timeline: Timeline, groups: CanvasNode[], cards: CanvasNode[]) {
    
    let groupedCards = [];
    const rows: never[] = [];

    for (const group of groups) {
        // find cards with an x value greater than the groups x and less than the groups x + width
        groupedCards = filterCards(group, cards);
        await updateCards(plugin, timeline, group, groupedCards, rows);
    }    
    return rows;
} 
function filterCards (group: CanvasNode, cards: CanvasNode[]) {
    return cards
        .filter((card: CanvasNode) => {
            if (card.x >= group.x && card.x <= group.x + group.width) {
                if(Object.hasOwn(group, "label")) {
                    Object.assign(card, {"group": group.label.toLowerCase()});
                } else {
                    Object.assign(card, {"group": "unknown"});
                }
                return true;
            }})
        .sort((a:CanvasNode, b:CanvasNode) => {
            if (a.y - b.y == 0) {
                return a.x - b.x;
            } else return a.y - b.y;
    });
}
async function updateCards(plugin: RwkCanvasTimelinePlugin, timeline: Timeline, group: CanvasNode, groupedCards: CanvasNode[], rows: CanvasNode[]) {
    
    for(const card of groupedCards) {
        // load each card in the group
        const tFile = plugin.app.vault.getFileByPath(card.file);
        if (tFile != null) {
            //check if the page the card comes from has these in its frontmatter
            await plugin.app.fileManager.processFrontMatter(tFile, (frontmatter: Record<string, string>) => {
                for(const property of timeline.properties) {
                    if(property.length == 0) continue;
                    
                    if(!(property in frontmatter)) {
                        frontmatter[property.toString()] = 'none';
                    } else {
                        Object.assign(card, {[property]: frontmatter[property]})
                    }
                }
                if(!('group' in frontmatter)) {
                    if(Object.hasOwn(group, "group")) {
                        frontmatter['label'] = group.label;
                    } else {
                        frontmatter['label'] = 'none';
                    }
                }
            })
            if(Object.hasOwn(tFile, "basename")) {
                Object.assign(card, {"basename": tFile.basename});
            } else {
                Object.assign(card, {"basename": "none"});
            }            
            // get the latest page count
            if(timeline.showPageCount)
                card.pageCount = await pageCount(plugin.app.vault, tFile);
            else card.pageCount = -1;
        }
        rows.push(card);
    }
    return rows;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getDate(): string {
    const date = new Date();
    return date.getHours() + ':' + date.getMinutes() + ' - ' + date.getDay() + ':' + date.getMonth() + 1 + ':' + date.getFullYear();
}
export async function createMarkdownTable(plugin: RwkCanvasTimelinePlugin, timeline: Timeline, rows: Record<string, string>[]) { 

    const tableFile = plugin.app.vault.getFileByPath(timeline.notePath);
    if(tableFile == null) return;
    
    let tableHeadingRow = '|';
    let tableDividerRow = '|';
    for(let i=0; i<timeline.headings.length; i++){
        tableHeadingRow += timeline.headings[i] + '|';
        tableDividerRow += '---|';
    }
    if(timeline.showPageCount)  {
        tableHeadingRow += 'Page Count|';
        tableDividerRow += '---|';
    }

    const outputRows = rows.map((data: Record<string, unknown>, index: number) => {

        let output = '|<span class="' + data[timeline.properties[timeline.colourHeaderIndex]] + '"></span>';
        
        timeline.properties.forEach((property, index) => {
            if(index == timeline.titleHeadingIndex){
                output += '[[' + data['basename'] + ']]' + '|';
            } else if(index == timeline.groupHeadingIndex){
                output += data['group'] + '|';
            } else {
                output += data[property] + '|';
            }
        });

        if(timeline.showPageCount){
           output += data.pageCount + '|';
        }
  
        return [output];
    });
    const finalOutput = tableHeadingRow + '\n' + tableDividerRow + '\n' + outputRows.join('\n');
    plugin.app.vault.process(tableFile, data => {
        const regex = /\|[\|\w\n\s-<=">\[\]/:\.]+\|/
        return data.replace(regex, finalOutput);
    });
    
}*/