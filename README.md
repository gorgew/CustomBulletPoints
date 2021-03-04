# Custom Bullet Points

Have you ever wanted to take notes in a text editor with fun, personalized bullet points? If not, this is still for you!

## Requirements

Only vscode >= 1.52.0 is supported.

## Features

* Easy to use bulleting
  * Start bulleting with `Tab` key in an active editor
  * Additional presses of `Tab` indent the bullet
  * Pressing `Enter` creates a bulleted newline
  * Pressing `Backspace` makes the bullet go back one indentation level. Backspacing at one indent exits bulleting.

>TODO <- add gif

## Extension Settings

#### Bullet Point Mode: The method in which bullets are chosen from a collection.
* Tier Mode: The bullet point is chosen based on the indentation level.
![Tier Mode](/images/tier.png)
* Cycle Mode: The bullet points are chosen by cycling through the collecion, regardless of indentation level.
![Cycle Mode](/images/cycle.png)
* Random Mode: The bullet is chosen randomly from the collection.
![Random Mode](/images/random.png)
#### Bullet Point Collections: 
Collections of Bullet Points. Individual collections can be customized with the following JSON object: format:
```
    {
        "label": ,
        "stringSize": ,
        "bulletStringArray: []"
    }
```
* label: The name displayed when choosing a bullet point collection in the command palette.
* stringSize: The size of the bullets in characters.
* bulletStringArray: An array of Strings used as bullets. They should be the same size, though this is not enforced.

> Warning: Be careful with symbols that use [Variation Selectors](https://en.wikipedia.org/wiki/Variation_Selectors_(Unicode_block)). Symbols that appear as 1 character may be in fact 2.
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
* Integration with LaTex, Markdown, and Vim extensions