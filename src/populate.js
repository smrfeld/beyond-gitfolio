const path = require("path");

const fs = require("fs");
const emoji = require("github-emoji");
const jsdom = require("jsdom").JSDOM,
  options = {
    resources: "usable"
  };
const { outDir } = require("./utils");
const { getRepos } = require("./api");
const assetDir = path.resolve(`${__dirname}/assets/`);
const hbs = require("handlebars");

function convertToEmoji(text) {
  if (text == null) return;
  text = text.toString();
  var pattern = /(?<=:\s*).*?(?=\s*:)/gs;
  if (text.match(pattern) != null) {
    var str = text.match(pattern);
    str = str.filter(function(arr) {
      return /\S/.test(arr);
    });
    for (i = 0; i < str.length; i++) {
      if (emoji.URLS[str[i]] != undefined) {
        var output = emoji.of(str[i]);
        var emojiImage = output.url.replace(
          "assets-cdn.github",
          "github.githubassets"
        );
        text = text.replace(
          `:${str[i]}:`,
          `<img src="${emojiImage}" class="emoji">`
        );
      }
    }
    return text;
  } else {
    return text;
  }
}

function onlyUnique(value, index, self) { 
  return self.indexOf(value) === index;
}

async function makeUserInfo(document, user, opts) {

  const { twitter, linkedin, medium, dribbble } = opts;

  document.title = user.login;
  var icon = document.createElement("link");
  icon.setAttribute("rel", "icon");
  icon.setAttribute("href", user.avatar_url);
  icon.setAttribute("type", "image/png");

  document.getElementsByTagName("head")[0].appendChild(icon);
  document.getElementById(
    "profile_img"
  ).style.background = `url('${user.avatar_url}') center center`;
  document.getElementById(
    "username"
  ).innerHTML = `<span style="display:${
    user.name == null || !user.name ? "none" : "block"
  };">${user.name}</span><a href="${user.html_url}">@${user.login}</a>`;
  //document.getElementById("github_link").href = `https://github.com/${user.login}`;
  document.getElementById("userbio").innerHTML = convertToEmoji(
    user.bio
  );
  document.getElementById("userbio").style.display =
    user.bio == null || !user.bio ? "none" : "block";
  document.getElementById("about").innerHTML = `
        <span style="display:${
          user.company == null || !user.company ? "none" : "block"
        };"><i class="fas fa-users"></i> &nbsp; ${user.company}</span>
        <span style="display:${
          user.email == null || !user.email ? "none" : "block"
        };"><i class="fas fa-envelope"></i> &nbsp; ${user.email}</span>
        <span style="display:${
          user.blog == null || !user.blog ? "none" : "block"
        };"><i class="fas fa-link"></i> &nbsp; <a href="${user.blog}">${
    user.blog
  }</a></span>
        <span style="display:${
          user.location == null || !user.location ? "none" : "block"
        };"><i class="fas fa-map-marker-alt"></i> &nbsp;&nbsp; ${
    user.location
  }</span>
        <span style="display:${
          user.hireable == false || !user.hireable ? "none" : "block"
        };"><i class="fas fa-user-tie"></i> &nbsp;&nbsp; Available for hire</span>
        <div class="socials">
        <span style="display:${
          twitter == null ? "none !important" : "block"
        };"><a href="https://www.twitter.com/${twitter}" target="_blank" class="socials"><i class="fab fa-twitter"></i></a></span>
        <span style="display:${
          dribbble == null ? "none !important" : "block"
        };"><a href="https://www.dribbble.com/${dribbble}" target="_blank" class="socials"><i class="fab fa-dribbble"></i></a></span>
        <span style="display:${
          linkedin == null ? "none !important" : "block"
        };"><a href="https://www.linkedin.com/in/${linkedin}/" target="_blank" class="socials"><i class="fab fa-linkedin-in"></i></a></span>
        <span style="display:${
          medium == null ? "none !important" : "block"
        };"><a href="https://www.medium.com/@${medium}/" target="_blank" class="socials"><i class="fab fa-medium-m"></i></a></span>
        </div>
        `;
}

async function writePage(window, page_name) {
  await fs.writeFile(
    `${outDir}/${page_name}.html`,
    "<!DOCTYPE html>" + window.document.documentElement.outerHTML,
    function(error) {
      if (error) throw error;
      console.log(`Wrote page: ${outDir}/${page_name}.html\n`);
    }
  );
}

function getOrCreateSection(document, section_id, section_name) {

  element = document.getElementById(section_id);

  // Create if needed
  if (element == null) {
    var element_display = document.getElementById("display");

    // Div
    var element_div = document.createElement("div");
    // element_div.setAttribute("id","work");

    // Header
    var header = document.createElement("h1");
    header.setAttribute("style","position: relative");
    header.innerHTML = section_name;
    element_div.appendChild(header);

    // Create element
    element = document.createElement("div");
    element.setAttribute("class","projects");
    element.setAttribute("id",section_id);
    element_div.appendChild(element);

    // Add div
    element_display.insertBefore(element_div, element_display.firstElementChild);

    // Get
    element = document.getElementById(section_id);
  }

  return element;
}

function createScripts(document, section_ids, maxColumns) {

  section_ids = section_ids.filter( onlyUnique );

  var script = document.createElement("script");

  for (var idx in section_ids) {
    var section_id = section_ids[idx];

    // Add script to end
    script.innerHTML = `const ${section_id} = new MagicGrid({
      container: "#${section_id}",
      animate: false,
      gutter: 30, // default gutter size
      static: true,
      useMin: false,
      maxColumns: ${maxColumns},
      useTransform: true
    });`;
  }

  // Script commands at bottom
  script.innerHTML += `$("document").ready(() => {`;
  for (var idx in section_ids) {
    var section_id = section_ids[idx];
    script.innerHTML += `${section_id}.listen();`;
  }
  script.innerHTML += `});`;

  document.body.appendChild(script);
}

/**
 * Creates the stylesheet used by the site from a template stylesheet.
 *
 * Theme styles are added to the new stylesheet depending on command line
 * arguments.
 */
async function populateCSS({
  theme = "light",
  background = "https://images.unsplash.com/photo-1553748024-d1b27fb3f960?w=1500&q=80"
} = {}) {
  /* Get the theme the user requests. Defaults to 'light' */
  theme = `${theme}.css`;
  let template = path.resolve(assetDir, "index.css");
  let stylesheet = path.join(outDir, "index.css");

  try {
    await fs.accessAsync(outDir, fs.constants.F_OK);
  } catch (err) {
    await fs.mkdirAsync(outDir);
  }
  /* Copy over the template CSS stylesheet */
  await fs.copyFileAsync(template, stylesheet);

  /* Get an array of every available theme */
  let themes = await fs.readdirAsync(path.join(assetDir, "themes"));

  if (!themes.includes(theme)) {
    console.error('Error: Requested theme not found. Defaulting to "light".');
    theme = "light";
  }
  /* Read in the theme stylesheet */
  let themeSource = await fs.readFileSync(path.join(assetDir, "themes", theme));
  themeSource = themeSource.toString("utf-8");
  let themeTemplate = hbs.compile(themeSource);
  let styles = themeTemplate({
    background: `${background}`
  });
  /* Add the user-specified styles to the new stylesheet */
  await fs.appendFileAsync(stylesheet, styles);
}

function populateCode(username, user, opts) {
  const { includeFork } = opts;
  //add data to assets/index.html
  jsdom
    .fromFile(assetDir+`/index.html`, options)
    .then(function(dom) {
      let window = dom.window,
        document = window.document;
      (async () => {
        try {
          console.log("Building Code...");
          const repos = await getRepos(username, opts);

          // Create content
          var section_ids = [];
          for (var i = 0; i < repos.length; i++) {

            // Get section
            let element;
            if (repos[i].fork == false) {
              element = getOrCreateSection(document, "work_section", "Work.");
              section_ids.push("work_section");
            } else if (includeFork == true) {
              element = getOrCreateSection(document, "fork_section", "Forks.");
              section_ids.push("fork_section");
            } else {
              continue;
            }
            element.innerHTML += `
                        <a href="${repos[i].html_url}" target="_blank">
                        <section>
                            <div class="section_title">${repos[i].name}</div>
                            <div class="about_section">
                            <span style="display:${
                              repos[i].description == undefined
                                ? "none"
                                : "block"
                            };">${convertToEmoji(repos[i].description)}</span>
                            </div>
                            <div class="bottom_section">
                                <span style="display:${
                                  repos[i].language == null
                                    ? "none"
                                    : "inline-block"
                                };"><i class="fas fa-code"></i>&nbsp; ${
                                  repos[i].language
                                }</span>
                                <span><i class="fas fa-star"></i>&nbsp; ${
                                  repos[i].stargazers_count
                                }</span>
                                <span><i class="fas fa-code-branch"></i>&nbsp; ${
                                  repos[i].forks_count
                                }</span>
                            </div>
                        </section>
                        </a>`;
          }

          // Create scripts
          createScripts(document, section_ids, 2);

          // Write common left side
          await makeUserInfo(document, user, opts);

          // Write
          await writePage(window, "Code");

        } catch (error) {
          console.log(error);
        }
      })();
    })
    .catch(function(error) {
      console.log(error);
    });
};

function populateHomepage(user, opts) {
  const { pages } = opts;
  //add data to assets/index.html
  jsdom
    .fromFile(assetDir+`/index.html`, options)
    .then(function(dom) {
      let window = dom.window,
        document = window.document;
      (async () => {
        try {
          console.log("Building Homepage...");

          // Iterate over pages
          console.log(pages);
          var section_ids = [];
          let element = getOrCreateSection(document, "pages", "<br />");
          section_ids.push("pages");

          for (var page_idx in pages) {
            var page = pages[page_idx];
            console.log("Adding page: ", page["name"]);

            var link = ``;
            if (page["is_external"]) {
              link = page["external_url"];
            } else {
              link = `${page["name"]}.html`;
            }

            element.innerHTML += `
            <a href="${link}">
            <section>
                <div class="section_title">${page["name"]}</div>
                <div class="about_section">
                </div>
                <div class="bottom_section">
                </div>
            </section>
            </a>`;
          }

          // Create grid at bottom
          createScripts(document, section_ids, 2);

          // Write common left side
          await makeUserInfo(document, user, opts);

          // Write
          await writePage(window, "index");

        } catch (error) {
          console.log(error);
        }
      })();
    })
    .catch(function(error) {
      console.log(error);
    });
};

async function populatePages(user, opts) {
  const { pages } = opts;
  //add data to assets/index.html

  // Go through all pages
  for (var page_idx in pages) {
    var page = pages[page_idx];

    // Make the page if it is not external
    if (page["is_external"]) {
      console.log("Skipping building page: ",page["name"]," because it is external.");
      continue;
    }

    // Make the page if it is not the code page
    if (page["name"] === "Code") {
      console.log("Skipping building page: ",page["name"]," because it is built separately.");
      continue;
    }

    console.log(`Preparing to build fancy page: ${page["name"]}...`);

    await jsdom
    .fromFile(assetDir+`/index.html`, options)
    .then(function(dom) {
      let window = dom.window,
        document = window.document;
        
      let buildPage = (async () => {
        try {
          console.log(`Building fancy page: ${page["name"]}...`);

          // Make section
          var section_ids = [];
          let element = getOrCreateSection(document, page["ID"], page["name"]);
          section_ids.push(page["ID"]);

          // Iterate over entries
          for (var entry_idx in page["entries"]) {
            var entry = page["entries"][entry_idx];
            console.log(entry);
            console.log("Adding to page: ", page["name"], " entry: ", entry["name"], " url: ", entry["url"]);

            element.innerHTML += `
            <a href="${entry["url"]}" style="width: 100% !important;">
            <section>
                <div class="section_title">${entry["name"]}</div>
                <div class="about_section">
                </div>
                <div class="bottom_section">
                </div>
            </section>
            </a>`;
          }

          // Create grid at bottom
          createScripts(document, section_ids, 1);

          // Write common left side
          await makeUserInfo(document, user, opts);

          // Write
          await writePage(window, page["name"]);

        } catch (error) {
          console.log(error);
        }
      });

      buildPage();
    })
    .catch(function(error) {
      console.log(error);
    });
  } 
};

module.exports = {
  populateCSS,
  populateCode,
  populateHomepage,
  populatePages
};