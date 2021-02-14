### TODO

# Custom Bullet Points README

Have you ever wanted to take notes in a text editor with fun, personalized bullet points? If not, this is still for you!

## Features

* Easy to use bulleting
  * Start bulleting with `Tab` key in an active editor
  * Additional presses of `Tab` indent the bullet
  * Pressing `Enter` creates a bulleted newline
  * Pressing `Backspace` makes the bullet go back one indentation level. Backspacing at one indent exits bulleting.

\!\[feature X\]\(images/feature-x.png\)

> Tip: Many popular extensions utilize animations. This is an excellent way to show off your extension! We recommend short, focused animations that are easy to follow.

## Requirements

Only vscode >= 1.52.0 is supported.

## Extension Settings

#### Bullet Point Mode: The method in which bullets are chosen from a collection.
* Tier Mode: Each indentation level receives a bullet from the collection. 
* Cycle Mode: The bullet chosen cycles through the collecion, regardless of indentation level.
* Random Mode: The bullet is chosen randomly from the collection.

#### Bullet Point Collections: 
Collections of Bullet Points. Individual collections can be customized with the following JSON object: format:
```
    {
        "label": ,
        "stringSize": ,
        "bulletStringArray: []"
    }
```
label: The name displayed when choosing a bullet point collection in the command palette.
stringSize: The size of the bullets in characters.
bulletStringArray: An array of Strings used as bullets. They should be the same size, though this is not enforced.

> Warning: Be careful with symbols that use Variation Selectors(https://en.wikipedia.org/wiki/Variation_Selectors_(Unicode_block)). Symbols that appear as 1 character may be in fact 2.
## Known Issues

Problems with Tier Mode.
Weird stuff might happen if you undo exiting active bulleting with backspace.

## Release Notes

### 0.1.0

Initial release of Custom Bullet Points.

-----------------------------------------------------------------------------------------------------------
## TODO
* Fix Tier Mode
* Default bullet collection
* Rembering active bullet collection?
* Markdown integration
* Vim extension integration
* LaTex integration