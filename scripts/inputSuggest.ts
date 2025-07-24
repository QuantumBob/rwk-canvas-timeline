import { AbstractInputSuggest, App } from "obsidian";

abstract class AddTextSuggest extends AbstractInputSuggest<string> {
    content: string[];
    targetMatch = /^(.*),\s*([^,]*)/


    constructor(private inputEl: HTMLInputElement, app: App, private onSelectCb: (value: string) => void = (v)=>{}) {
        super(app, inputEl);
        this.content = this.getContent();
    }

    getSuggestions(inputStr: string): string[] {
        console.log('in addTextSuggest');
        return this.doSimpleSearch(this.getParts(inputStr)[1]);
    }

    // Returns the bit at the beginning to ignore [0] and the target bit [1]
    getParts(input:string) : [string,string] {
        const m = input.match(this.targetMatch)
        if(m) {
            return [m[1],m[2]]
        } else {
            return ["",input]
        }
    }

    doSimpleSearch(target:string) : string[] {
        if( ! target || target.length < 2 ) return []
        const lowerCaseInputStr = target.toLocaleLowerCase();
        const t = this.content.filter((content) =>
            content.toLocaleLowerCase().contains(lowerCaseInputStr)
        );
        return t
    }

    renderSuggestion(content: string, el: HTMLElement): void {
        el.setText(content);
    }

    selectSuggestion(content: string, evt: MouseEvent | KeyboardEvent): void {
        let [head] = this.getParts(this.inputEl.value)
        if( head.length > 0 ) {
            this.onSelectCb(head + ", "+content);
            this.inputEl.value = head + ", " +this.wrapContent(content)
        }
        else {
            this.onSelectCb(content);
            this.inputEl.value = this.wrapContent(content) 
        }
        this.inputEl.dispatchEvent(new Event("change"))
        this.inputEl.setSelectionRange(0, 1)
        this.inputEl.setSelectionRange(this.inputEl.value.length,this.inputEl.value.length)
        this.inputEl.focus()
        this.close();
    }

    wrapContent(content:string):string {
        return content
    }

    abstract getContent(): string[];
}

export class FileSuggest extends AddTextSuggest {
	getContent() {
		const files = this.app.vault.getFiles();
        return files.map(file => {
            return file.path;
        })
    }
    getSuggestions(inputStr: string): string[] {
        return this.doSimpleSearch(inputStr);
    }
}

export class MarkdownFileSuggest extends AddTextSuggest {
	getContent() {
		const files = this.app.vault.getMarkdownFiles();
        return files.map(file => {
            return file.path;
        })
    }
    getSuggestions(inputStr: string): string[] {
        return this.doSimpleSearch(inputStr);
    }
}

export class CanvasFileSuggest extends AddTextSuggest {
	getContent() {
		const files = this.app.vault.getFiles();
        return files.map(file => {
            if( file.extension == 'canvas')
                return file.path;
            else
                return '';
        })
    }
    getSuggestions(inputStr: string): string[] {
        return this.doSimpleSearch(inputStr);
    }
}