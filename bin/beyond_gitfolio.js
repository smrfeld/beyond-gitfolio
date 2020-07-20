#! /usr/bin/env node
/* Argument parser */
const program = require("commander");

process.env.OUT_DIR = process.env.OUT_DIR || process.cwd();

const { uiCommand } = require("../src/ui");
const { version } = require("../package.json");

program
  .command("ui")
  .description("Create and Manage blogs with ease")
  .action(uiCommand);

program.on("command:*", () => {
  console.log("Unknown Command: " + program.args.join(" "));
  program.help();
});

program
  .version(version, "-v --version")
  .usage("<command> [options]")
  .parse(process.argv);

if (program.args.length === 0) program.help();
