# Covid-visualization-inls641
## Evironment Setup
We need a node.js module to help us visulize the map so make sure you installed `npm`. Although d3 itself has a lot of built-in functions to draw a map, for US map it misses Guam and Puerto Rico and other oversea areas. Since the dataset has the corresponding records for these areas, I think it would be better to also include them on the map. Thus, we need a node.js module to help us.
### Follow these steps to initilize our project:
1. Install npm
2. Open the terminal and make sure you are in the project repo then type:
    ```
    npm install
    ```
    This will automatically install the modules you need. Apart from map projection module, you also need a local server setup to help you debug and test the result. 
3. Since we rely on a local server to display the web page, you should not open the html file directly. Otherwise, every time you want to open the page, type this in the terminal:
    ```
    npx gulp browser-sync
    ```

## A Tour of the Map Code

There is a bunch of files in the repo. Some are task-related files, the others are configuring files which are not important.

- `index.html`
- `style.css`
- `main.js`

These are regular web page files.

### ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
- `us_county_5m_topojson.json`
- `stateFIPS.json` 

These are files recording map information.
### ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
- `bundle.js`

This file is a js file bundling up main js file as well as required node modules.(In this case, that is map projection function) That's why in the html file `bundle.js` is inserted rather than `main.js`.

## How to test the result

Every time you should start with `npx gulp browser-sync`.
The `browser-sync` will automatically watch the file change and synchonically display the change on the page.

When you want to edit `main.js` file, **open a new terminal window** and run
```
npx browserify main.js -o bundle.js
```
Remember we insert `bundle.js`, so changes in the `main.js` should be interpreted in `bundle.js` as well to see the changes. Do not directly edit `bundle.js`.

**To close the local server**, in your browser-sync terminal window and press `ctrl+c`.

