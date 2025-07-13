
function createTableFromCanvas(plugin: MyPlugin, tableNote: string){

const path = plugin.settings.locationArray[tableNote]
if (path == null) revoke('no path found')
TFile file = getFileByPath(path);
if (file == null) revoke('no file found')
const jsonString = await vault.cachedRead(file)
const jsonObject = JSON.parse(jsonString);
}
if (Object.keys(jsonObject).length === 0) revoke('jsonObject is empty');


let cards = [];
let groups = [];

jsonObject.nodes.forEach(node => {
    if( node.type == 'card') cards.push(node);
    if( node.type == 'group') groups.push(node);
});
/*
let cards = jsonObject.nodes.filter(data => {
if (Object.hasOwn(data, 'file') return true;
});
const groups = jsonObject.nodes.filter(data => {
if( data.type == 'group') return true;
});
*/
groups.sort((group1, group2) => group1.x - group2.x);

const rows: any[] = [];
let groupedCards = [];

groups.forEach((group, index) => {
// put all cards in one group into the groupedCards array.
groupedCards = cards
.filter(card => {
if (card.x >= group.x && card.x <= group.x + group.width) return true;
});
// sort the cards in y order
groupedCards.sort((a, b) => {
if (a.y - b.y == 0) {
return a.x - b.x;
} else return a.y - b.y;
});

groupedCards.forEach(data => {
// load each card in the group
const page = dv.page(data.file);
// check if the page the card comes from has these in its frontmatter
// using proccess frontmatter which returns a Promise
if(Object.hasOwn(page, "pov")) {
Object.assign(data, {"pov": page.pov});
} else {
Object.assign(data, {"pov": "none"});
}
if(Object.hasOwn(page, "participants")) {
Object.assign(data, {"participants": page.participants});
}
if(Object.hasOwn(group, "label")) {
Object.assign(data, {"date": group.label.toLowerCase()});
} else {
Object.assign(data, {"date": "unknown"});
}
rows.push(data);
});
});
//Object.assign(data, {"words": words.length});
const povClassStart = '<span class="';
const povClassEnd = '">'
const spanEnd = '</span>'
const space = " ";
let totalPages = 0;
const wordsperPage = 250;
//let output = rows.map(data => { return [povClassStart + data.pov + space + data.participants + povClassEnd + dv.fileLink(data.file) + spanEnd, data.pov, data.date]; });
const output =  await Promise.all(rows.map(async data => {
const page = dv.page(data.file);
const content = await dv.io.load(page.file.path);
const numPages = pageCount(content);
//console.log(text);
//const words = text.match(/\S+/g);//content.match(/\b\w+\b/g);
//const numPages = words == null ? 0 : words.length/wordsperPage;
totalPages += numPages;
return [povClassStart + data.pov + povClassEnd + dv.fileLink(data.file) + spanEnd, data.pov, data.date, numPages.toFixed(2)];
}));
dv.table(["Title", "POV", "Date", "Page count: " + Math.round(totalPages)], output);
