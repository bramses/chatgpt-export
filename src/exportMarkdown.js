const consoleSave = require("./util/consoleSave");
const getTimestamp = require("./util/getTimestamp");
const TurndownService = require("turndown").default;

/*
          child node example:
          <div class="flex min-h-[24px] items-center gap-2"><svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 shrink-0" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg><div>Searched: <b>“The Weeknd latest song”</b></div></div>

          <div class="flex min-h-[24px] items-center gap-2"><svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 shrink-0" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"></path><path d="M13 13l6 6"></path></svg><div><div class="flex items-center gap-2">Clicked on: <div class="rounded border border-black/10 bg-white"><a href="https://www.forbes.com/sites/hughmcintyre/2023/04/20/the-weeknd-has-a-new-single-dropping-tonight/" target="_blank" rel="noreferrer" class="!no-underline"><div class="tooltip-label flex items-center whitespace-pre-wrap py-1 px-2 text-center text-sm font-medium normal-case text-gray-700"><div class="flex items-center gap-2"><div class="flex shrink-0 items-center justify-center"><img src="https://icons.duckduckgo.com/ip3/www.forbes.com.ico" alt="Favicon" width="16" height="16" class="my-0"></div><div class="max-w-xs truncate text-xs">The Weeknd Has A New Single Dropping Tonight</div><div class="shrink-0"><svg stroke="currentColor" fill="none" stroke-width="1.5" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="h-3 w-3" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg></div></div></div></a></div></div></div></div>
          
          should result:
          1. <svg element> Searched: **“The Weeknd latest song”**
          2. <svg element> Clicked on: [The Weeknd Has A New Single Dropping Tonight](https://www.forbes.com/sites/hughmcintyre/2023/04/20/the-weeknd-has-a-new-single-dropping-tonight/)
          etc.
          */

(function exportMarkdown() {
  var markdown = "";
  var elements = document.querySelectorAll("[class*='min-h-[20px]']");
  var timestamp = getTimestamp();
  markdown += `\`${timestamp}\`\n\n`;
  const turndownService = new TurndownService();

  turndownService.addRule("code", {
    filter: function (node) {
      return node.nodeName === "CODE" || node.nodeName === "PRE";
    },
    replacement: function (content) {
      // if content is valid json, format it
      try {
        const json = JSON.parse(content);
        return "```json\n" + JSON.stringify(json, null, 2) + "\n```";
      } catch (e) {
        // otherwise, just return the content
        return "```\n" + content + "\n```";
      }
    },
  });

  for (var i = 0; i < elements.length; i++) {
    var ele = elements[i];

    // Get first child
    var firstChild = ele.firstChild;
    if (!firstChild) continue;

    // Element child
    if (firstChild.nodeType === Node.ELEMENT_NODE) {
      var childNodes = firstChild.childNodes;

      // Prefix ChatGPT reponse label
      if (firstChild.className.includes("request-")) {
        markdown += `_ChatGPT_:\n`;
      }

      let seenPlugin = false;

      // Parse child elements
      for (var n = 0; n < childNodes.length; n++) {
        const childNode = childNodes[n];

        if (n == 0) {
          // Prefix plugin label
          markdown += `<hr>\n\n**GPT**:\n\n`;
        }

        if (childNode.nodeType === Node.ELEMENT_NODE) {
          var tag = childNode.tagName;
          var text = childNode.textContent;

          // Plugins (e.g. "browsing")
          if (childNode.parentNode.parentNode.previousSibling && !seenPlugin) {
            var pluginDiv = childNode.parentNode.parentNode.previousSibling;
            var pluginDivChildren = pluginDiv.childNodes;

            let pluginActivity = "";
            for (var p = 0; p < pluginDivChildren.length; p++) {
              const pluginDivChild = pluginDivChildren[p];
              console.log(pluginDivChild);

              // check if pluginDivChild has code descendant
              if (pluginDivChild.querySelector("code") || pluginDivChild.querySelector("pre")) {
                const mdVersion = turndownService.turndown(pluginDivChild);
                pluginActivity += mdVersion + "\n";
              } else {

                const divs = pluginDivChild.querySelectorAll(".max-w-full .flex");

                // Initialize an empty array to store the formatted Markdown content
                const markdownLines = [];

                // Loop through each div element and extract the relevant information
                divs.forEach((div, index) => {
                  // Get the SVG element as a string, if it exists
                  const svgElement = div.querySelector("svg")?.outerHTML || "";

                  // Get the text content, if it exists
                  const textContent =
                    div.querySelector("div")?.textContent?.trim() || "";

                  // Initialize a variable to store the formatted text content
                  let formattedTextContent = textContent;

                  // Check if there is an anchor element (link) within the div
                  const anchorElement = div.querySelector("a");
                  if (anchorElement) {
                    const linkText = anchorElement.textContent.trim();
                    const linkHref = anchorElement.getAttribute("href");
                    formattedTextContent = textContent.replace(
                      linkText,
                      `[${linkText}](${linkHref})`
                    );
                  }

                  // Format the content into Markdown and add it to the array
                  markdownLines.push(
                    `${index + 1}. ${svgElement} ${formattedTextContent}`
                  );
                });

                // Join the array into a single string
                const markdownContent = markdownLines.join("\n");

                // Output the formatted Markdown content
                pluginActivity += `${markdownContent}\n`;
              }
            }

            markdown += `${pluginActivity}\n`;
            seenPlugin = true;
          }

          // Code blocks
          if (tag === "PRE") {
            const codeBlockSplit = text.split("Copy code");
            const codeBlockLang = codeBlockSplit[0].trim();
            const codeBlockData = codeBlockSplit[1].trim();

            markdown += `\`\`\`${codeBlockLang}\n${codeBlockData}\n\`\`\`\n`;
          }

          // Images
          else if (tag === "IMG") {
            const imgSrc = childNode.getAttribute("src");
            markdown += `![${imgSrc}](${imgSrc})\n`;
          }

          // Tables
          else if (tag === "TABLE") {
            // Get table sections
            let tableMarkdown = "";
            childNode.childNodes.forEach((tableSectionNode) => {
              if (
                tableSectionNode.nodeType === Node.ELEMENT_NODE &&
                (tableSectionNode.tagName === "THEAD" ||
                  tableSectionNode.tagName === "TBODY")
              ) {
                // Get table rows
                let tableRows = "";
                let tableColCount = 0;
                tableSectionNode.childNodes.forEach((tableRowNode) => {
                  if (
                    tableRowNode.nodeType === Node.ELEMENT_NODE &&
                    tableRowNode.tagName === "TR"
                  ) {
                    // Get table cells
                    let tableCells = "";

                    tableRowNode.childNodes.forEach((tableCellNode) => {
                      if (
                        tableCellNode.nodeType === Node.ELEMENT_NODE &&
                        (tableCellNode.tagName === "TD" ||
                          tableCellNode.tagName === "TH")
                      ) {
                        tableCells += `| ${tableCellNode.textContent} `;
                        if (tableSectionNode.tagName === "THEAD") {
                          tableColCount++;
                        }
                      }
                    });
                    tableRows += `${tableCells}|\n`;
                  }
                });

                tableMarkdown += tableRows;

                if (tableSectionNode.tagName === "THEAD") {
                  const headerRowDivider = `| ${Array(tableColCount)
                    .fill("---")
                    .join(" | ")} |\n`;
                  tableMarkdown += headerRowDivider;
                }
              }
            });
            markdown += tableMarkdown;
          } else {
            const mdVersion = turndownService.turndown(childNode);
            markdown += mdVersion;
          }

          // Paragraph break after each element
          markdown += "\n";
        }
      }
    }

    // Text child
    if (firstChild.nodeType === Node.TEXT_NODE) {
      // Prefix User prompt label
      markdown += `<hr>\n\n**Bram**:\n\n`;
      markdown += `${firstChild.textContent}\n`;

      // End of prompt paragraphs breaks
      markdown += "\n";
    }
  }

  console.log(markdown);
  // Save to file
  // consoleSave(console, "md");
  // console.save(markdown);
  return markdown;
})();
