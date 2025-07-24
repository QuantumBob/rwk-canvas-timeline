# RWK Canvas Timeline

This plugin creates a markdown table from a canvas and sorts it on x and y value and with groups.

It uses the Obsidian (https://obsidian.md) Sample Plugin as a boilerplate template, which can be found here - (https://github.com/obsidianmd/obsidian-sample-theme)

The text suggest code is a simplified version from obsidian-note-from-template which can be found here - (https://github.com/mo-seph/obsidian-note-from-template)

## Be careful which note you select to output the table to. It may change any table you already have in the note.

## Instructions

Add a new timeline with the 'Add new timeline' button.
Timelines can be deleted with the 'trash can' button next to the table note input box.

Add the canvas to use in the canvas input box, and the markdown note that the table will output to in the note input box.

Add a set of new headings with the 'plus' button under the 'Headings' title.

Select the heading that will represent the title by entering its number in the 'What number heading is the Title?' input box.
This will add '[[ ]]' around the title to generate a link to the note it refers to.

Headings can be deleted with the 'trash can' button. It will delete the last heading in the list.

Fill in the headings for the table

Put the 'timeline table rows.css' file into snippets and enable it to colour the rows based on frontmatter property selected in the RWK Timeline settings tab. The property in the frontmatter must have the same text as the class in the 'timeline table rows.css' file, without the period (.). Choose which heading to choose the colour from.

For example:- 

1. Heading 2 is POV. 
2. Put 2 in 'What number heading is the colour scheme on?'
3. All the notes on the canvas will now gain a 'pov' (in lowercase) frontmatter property.
4. Add names/text to the value of these properties in all the notes.
5. Add a class with the same name as in step 4 in 'timeline table rows.css' and choose a colour for it.

The group labels can be added to the table with the 'Show groups in table' toggle. Add a different name to the input box if needed.

The page count (based on 250 words per page) can be shown on the table with the 'Show Page Count' toggle.



