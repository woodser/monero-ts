import fs from "fs";
import http from "http";
import os from "os";
import path from "path";
import { ChildProcess, spawn } from "child_process";
import Regtest from "./Regtest";
import RunBrowserTestServers from "./RunBrowserTestServers";
import TestUtils from "./TestUtils";

/**
 * Runs the browser tests in a headless browser, relaying their console output and exiting with the number of failures.
 */
export default class RunBrowserTests {

  static BROWSER_BUILD_DIR = "./browser_build";
  static BROWSERS = process.env.BROWSER_BIN ? [process.env.BROWSER_BIN] : ["google-chrome", "chromium", "chromium-browser", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"];
  static CONTENT_TYPES = {".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".wasm": "application/wasm", ".map": "application/json", ".ico": "image/x-icon"};

  /**
   * Run the tests, forwarding the given mocha style parameters to the page as its query.
   *
   * @param {URLSearchParams} params - page parameters, e.g. grep and timeout
   * @return {Promise<number>} the number of failed tests
   */
  static async run(params: URLSearchParams): Promise<number> {
    await RunBrowserTestServers.run();
    let origin = new URL(TestUtils.WALLET_RPC_ACCESS_CONTROL_ORIGINS); // the servers accept requests from the page at this origin
    let server = await RunBrowserTests.serve(origin);
    let browser = await RunBrowserTests.launchBrowser();
    for (let signal of ["SIGINT", "SIGTERM"] as NodeJS.Signals[]) process.once(signal, () => RunBrowserTests.closeBrowser(browser)); // TestUtils stops the servers and exits
    try {
      params.set("reporter", "spec");
      return await RunBrowserTests.runPage(browser.devtoolsUrl, origin + "tests.html?" + params);
    } finally {
      await RunBrowserTests.closeBrowser(browser);
      server.close();
      await Regtest.stop();
    }
  }

  // stop the browser and delete its profile
  protected static async closeBrowser(browser: {process: ChildProcess, userDataDir: string}) {
    if (browser.process.kill()) await new Promise(resolve => browser.process.once("exit", resolve));
    fs.rmSync(browser.userDataDir, {recursive: true, force: true});
  }

  // serve the browser build at the origin
  protected static serve(origin: URL): Promise<http.Server> {
    let server = http.createServer((req, res) => {
      let file = path.join(RunBrowserTests.BROWSER_BUILD_DIR, new URL(req.url, origin).pathname);
      fs.readFile(file, (err, data) => {
        if (err) res.writeHead(404).end();
        else res.writeHead(200, {"Content-Type": RunBrowserTests.CONTENT_TYPES[path.extname(file)] || "application/octet-stream"}).end(data);
      });
    });
    return new Promise((resolve, reject) => server.listen(Number(origin.port), origin.hostname, () => resolve(server)).on("error", reject));
  }

  // start the first available browser headless with remote debugging on a free port
  protected static async launchBrowser(): Promise<{process: ChildProcess, userDataDir: string, devtoolsUrl: string}> {
    let userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "monero-ts-browser-"));
    let args = ["--headless=new", "--disable-gpu", "--no-first-run", "--remote-debugging-port=0", "--user-data-dir=" + userDataDir, "about:blank"];
    for (let browser of RunBrowserTests.BROWSERS) {
      let proc = spawn(browser, args, {stdio: ["ignore", "ignore", "pipe"]});
      let devtoolsUrl = await new Promise<string>(resolve => {
        let stderr = "";
        proc.stderr.on("data", data => {
          let match = (stderr += data).match(/DevTools listening on (ws:\S+)/);
          if (match) resolve(match[1]);
        });
        proc.on("error", () => resolve(undefined)); // not installed
        proc.on("exit", () => { if (proc.exitCode) console.error(stderr); resolve(undefined); });
      });
      if (devtoolsUrl) return {process: proc, userDataDir, devtoolsUrl};
    }
    throw new Error("No Chromium based browser found, set BROWSER_BIN to one");
  }

  // drive the page over the devtools protocol, relaying its console until mocha reports the number of failures
  protected static async runPage(devtoolsUrl: string, url: string): Promise<number> {
    let targets = await (await fetch(new URL("/json", devtoolsUrl.replace("ws:", "http:")))).json();
    let ws = new WebSocket(targets.find(target => target.type === "page").webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
    return new Promise<number>((resolve, reject) => {
      let nextId = 0, replies = new Map<number, (result: any) => void>();
      let send = (method: string, params?: object) => new Promise(replied => { replies.set(++nextId, replied); ws.send(JSON.stringify({id: nextId, method, params})); });
      ws.onclose = () => reject(new Error("Browser disconnected")); // commands awaiting a reply are abandoned
      ws.onmessage = event => {
        let message = JSON.parse(event.data);
        if (message.error) reject(new Error(message.error.message));
        else if (message.id) replies.get(message.id)(message.result), replies.delete(message.id);
        else if (message.method === "Runtime.consoleAPICalled") (message.params.type === "error" ? console.error : console.log)(...message.params.args.map(arg => arg.value === undefined ? arg.description : arg.value));
        else if (message.method === "Runtime.exceptionThrown") console.error(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
        else if (message.method === "Runtime.bindingCalled") resolve(Number(message.params.payload));
        else if (message.method === "Inspector.targetCrashed") reject(new Error("Page crashed"));
      };
      send("Runtime.enable").then(() => send("Runtime.addBinding", {name: "mochaDone"})).then(() => send("Page.navigate", {url}));
    });
  }
}

// run with mocha style arguments forwarded to the page, e.g. --grep "\bCI\b" --timeout 600000
let params = new URLSearchParams();
for (let i = 2; i < process.argv.length; i += 2) params.set(process.argv[i].replace(/^--/, ""), process.argv[i + 1]);
RunBrowserTests.run(params).then(failures => process.exit(Math.min(failures, 255))).catch(async function(err) {
  console.error(err);
  await Regtest.stop();
  process.exit(1);
});
