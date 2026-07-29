const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = fs.readFileSync('public/index.html', 'utf8');

const virtualConsole = new jsdom.VirtualConsole();
virtualConsole.on("error", (err) => {
  console.error("JSDOM ERROR:", err);
});
virtualConsole.on("warn", (warn) => {
  console.warn("JSDOM WARN:", warn);
});
virtualConsole.on("log", (log) => {
  console.log("JSDOM LOG:", log);
});

const dom = new JSDOM(html, {
  runScripts: "dangerously",
  resources: "usable",
  virtualConsole
});

setTimeout(() => {
    console.log("JSDOM Execution finished");
    process.exit(0);
}, 2000);
