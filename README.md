### TODO

# Custom Bullet Points README

## Features

Describe specific features of your extension including screenshots of your extension in action. Image paths are relative to this README file.

For example if there is an image subfolder under your extension project workspace:

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
Collections of Bullet Points. Can be customized with the following JSON object format:
    `{

    }`
## Known Issues

Weird stuff might happen if you undo exiting active bulleting with backspace.

## Release Notes

### 0.1.0

Initial release of Custom Bullet Points.

-----------------------------------------------------------------------------------------------------------
## TODO
* Fix Tier Mode
* Markdown integration
* Vim extension integration
* LaTex integration