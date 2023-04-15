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
    .goto("https://google.com");
```
### For full documentation, see <a href="https://github.com/segmentio/nightmare/blob/master/Readme.md">Nightmare's README</a>.
## Other Information and Help
In the future, I plan to add more methods as needed, but I am a busy man.<br>
❤️ If you require any assistance, feel free to join <a href="https://discord.gg/y6UywbeB3U">my support Discord!</a>!<br>
💙 If you would love to support me as an independent developer and have the means necessary, check out https://ko-fi.com/evangassman! Anything is appreciated! 

## License (MIT) 
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
