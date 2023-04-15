# nightterror
NightTerrorJS is a high-level browser automation library based on <a href="https://github.com/YZYLAB/dream-js">DreamJS</a>, <a href="https://github.com/segmentio/nightmare">NightmareJS</a>, and <a href="https://github.com/unlight/nightmare-xpath">NightmareXPATH</a>.
NightTerror is composed of elements from each, with my additional original code, creating a stronger and more efficient library.

## What does Nightterror have to offer?
- `.xpath()` native method and support. [NightmareXPATH] ✔️
- Removed uneccesary annotations, comments, and documentation from scripts. [NightTerrorJS] ✔️
- Uses ESM modules instead of CJS. [DreamJS] ✔️
- Extra added security to make the webscraper less detectable [DreamJS] ✔️
- Fixed broken scripts and evaluation mechanics from DreamJS [NightTerrorJS] ✔️

## Install for NodeJS
```css
npm i nightterror
```

## Example / Get Started
```js
const NightTerror = require("./index");
const NightTerrorClient = new NightTerror({show: true});

NightTerrorClient
  .goto();
```

In the future, I plan to add more methods as needed, but I am a busy man.<br>
❤️ If you require any assistance, feel free to join <a href="https://discord.gg/y6UywbeB3U">my support Discord!</a>!<br>
💙 If you would love to support me as an independent developer and have the means necessary, check out https://ko-fi.com/evangassman! Anything is appreciated! 

## License
MIT: 
