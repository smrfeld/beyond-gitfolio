const path = require("path");
const bluebird = require("bluebird");
const fs = bluebird.promisifyAll(require("fs"));

const outDir = path.resolve("./dist/" || process.env.OUT_DIR);
const configPath = path.join(outDir, "config.json");
const blogPath = path.join(outDir, "blog.json");

const defaultBlogPath = path.resolve(`${__dirname}/default/blog.json`);

/**
 * Tries to read file from out dir,
 * if not present returns default file contents
 */
async function getFileWithDefaults(file, defaultFile) {
  try {
    await fs.accessAsync(file, fs.constants.F_OK);
  } catch (err) {
    const defaultData = await fs.readFileAsync(defaultFile);
    return JSON.parse(defaultData);
  }
  const data = await fs.readFileAsync(file);
  return JSON.parse(data);
}

async function readConfigAsText() {
  try {
    await fs.accessAsync(configPath, fs.constants.F_OK);
  } catch (err) {
    return [{}];
  }
  const data = await fs.readFileAsync(configPath);
  return data;
}

async function writeConfig(opts, background, user, theme) {
  var data = [{}];
  Object.assign(data[0], opts);

  // Background
  data[0].background = background;

  // User data
  data[0].username = user.login;
  data[0].name = user.name;
  data[0].userimg = user.avatar_url;
  
  // Theme
  data[0].theme = theme;

  await fs.writeFileAsync(configPath, JSON.stringify(data, null, " "));
}

async function getBlog() {
  return getFileWithDefaults(blogPath, defaultBlogPath);
}

module.exports = {
  outDir,
  getBlog,
  writeConfig,
  readConfigAsText
};
