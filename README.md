# Custom Bullet Points

Adds fun, customizable bullet points to VSCode. By deafult only enabled for plain text files.

## Features

* Easy to use bulleting
  * Start bulleting with `Tab` key in an active editor
  * Additional presses of `Tab` indent the bullet
  * Pressing `Enter` creates a bulleted newline
  * Pressing `Backspace` makes the bullet go back one indentation level. Backspacing at one indent exits bulleting.

>TODO <- add gif

#### Bullet Point Mode: The method in which bullets are chosen from a collection.
* Tier Mode: The bullet point is chosen based on the indentation level.
![Tier Mode](https://raw.githubusercontent.com/gorgew/CustomBulletPoints/CustomBulletPoints/images/tier.png)
* Cycle Mode: The bullet points are chosen by cycling through the collecion, regardless of indentation level.
![Cycle Mode](https://raw.githubusercontent.com/gorgew/CustomBulletPoints/CustomBulletPoints/images/cycle.png)
* Random Mode: The bullet is chosen randomly from the collection.
![Random Mode](https://raw.githubusercontent.com/gorgew/CustomBulletPoints/CustomBulletPoints/images/random.png)

## Extension Commands

Found in Command Palette (`Ctrl + shift + p `):
* Custom Bullet Points: Choose Mode
  * Choose the Bullet Mode
* Custom Bullet Points: Choose Bullet Point Collection
  * Choose the Bullet Point Collection
* Custom Bullet Points: Toggle Activation
  * Toggles whether bulleting is on or off
* Custom Bullet Points: Reload Collections
  * Reload the collections. Used when editing bullet point collections on the fly.
#### Bullet Point Collections: 
Collections of Bullet Points. Can edit in settions.json. Individual collections can be customized with the following JSON object: format:
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
