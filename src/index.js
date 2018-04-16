let dnd = dragAndDrop();
startApp();

/*
* Bootstrap the app: 
* here we tie in the starter event handlers
* and prepare the dom for drag/drop interactions
*/
function startApp() {
  //Creating a global... not happy about it
  const loadPenButton = document.getElementById("load-pen-button");
  loadPenButton.onclick = loadPenPieces;

  // Handle toggling on/off the cheat iframe
  document.getElementById("piece-answer-swapper").onclick = function() {
    document.getElementById("box-cover").style.display !== "block"
      ? (document.getElementById("box-cover").style.display = "block")
      : (document.getElementById("box-cover").style.display = "none");
  };

  document.querySelectorAll(".dropZone").forEach(function(editor) {
    editor.ondrop = dnd.dropOnZone;
    editor.ondragover = dnd.dragOver;
  });
}
/*
* Load the pen pieces from the codepen-url input text
* This code will grab the .html .css and .js files
* from codepen and convert them into puzzle pieces
*/
function loadPenPieces() {
  //Clear existing changes
  // document
  //   .querySelectorAll(".editor-input")
  //   .forEach(zone => (zone.innerHTML = ""));
  document.getElementById("piece-holder").innerHTML = "";
  // Notify user of loading
  const loading = buildDraggable("loading...");
  document.getElementById("piece-holder").appendChild(loading);

  // Get codepen css,js, and html
  const codepenURL =
    document.querySelector("#codepen-url").value ||
    "https://codepen.io/andcircus/pen/aYgxOy";
  const html = get(codepenURL + ".html");
  const css = get(codepenURL + ".css");
  const js = get(codepenURL + ".js");

  Promise.all([html, css, js]).then(function(responses) {
    loading.remove();
    shuffle(
      responses
        // Flatten the js, html, and css into a single array
        // of text based on \n in each of the returned files
        .reduce(function(arr, resp) {
          return arr.concat(
            resp.split("\n").filter(function(line) {
              return line.trim() !== "";
            })
          );
        }, [])
        //build a draggable html element from each of these lines
        .map(buildDraggable)
      //lastly add these lines to the puzzle piece holder
    ).map(a => document.getElementById("piece-holder").appendChild(a));

    // Get the puzzle piece holder height
    const pieceHolderSize = document.getElementById("piece-holder")
      .scrollHeight;
    // Update the src of the cheat iframe
    document.getElementById("box-cover").src =
      codepenURL.replace("/pen/", "/embed/") +
      // Check if the height is greater than 800
      // If so cap the height at 800 to prevent
      // a pen you have to scroll to see
      "/?height=" +
      (pieceHolderSize < 800 ? pieceHolderSize - 5 : 800) +
      "&default-tab=result";
  });
}

// Fisher-Yates Shuffle
// https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle#The_modern_algorithm
// https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array
function shuffle(a) {
  var j, x, i;
  for (i = a.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1));
    x = a[i];
    a[i] = a[j];
    a[j] = x;
  }
  return a;
}

/*
*  Create a draggable HTMLElement out of text
*/
function buildDraggable(text) {
  let draggable = document.createElement("pre");
  draggable.draggable = true;
  draggable.innerText = text;
  draggable.className = "puzzle-piece";

  draggable.addEventListener("dragstart", dnd.drag, false);
  draggable.addEventListener("dragover", dnd.dragOver, false);
  draggable.addEventListener("drop", dnd.dropOnPiece, false);

  return draggable;
}

function dragAndDrop() {
  var dragSrcEl = null;
  return {
    drag: function handleDragStart(e) {
      console.log("dragStart");
      dragSrcEl = this;
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/html", this.innerHTML);
    },
    dropOnPiece: function handleDrop(e) {
      if (e.stopPropagation) {
        e.stopPropagation(); // Stops some browsers from redirecting.
      }
      if (dragSrcEl != this) {
        // Set the source column's HTML to the HTML of the column we dropped on.
        dragSrcEl.innerHTML = this.innerHTML;
        this.innerHTML = e.dataTransfer.getData("text/html");
        updateResultsFrame();
      }
    },
    dropOnZone: function handleDrop(e) {
      if (e.stopPropagation) {
        e.stopPropagation(); // Stops some browsers from redirecting.
      }
      if (dragSrcEl != this) {
        // Set the source column's HTML to the HTML of the column we dropped on.
        //dragSrcEl.innerHTML = this.innerHTML;
        this.append(dragSrcEl);
        updateResultsFrame();
      }
    },
    dragOver: function handleDragOver(e) {
      if (e.preventDefault) {
        e.preventDefault(); // Necessary. Allows us to drop.
      }
      e.dataTransfer.dropEffect = "move"; // Shows "move" visualization icon
      return false;
    }
  };
}
/*
* Specifically update the output of the three editors
*/
function updateResultsFrame() {
  //Get value from all the puzzle pieces in an editor
  function getValueFromEditor(editorId) {
    return Array.from(
      document.getElementById(editorId).querySelectorAll(".puzzle-piece")
    )
      .map(piece => piece.innerText)
      .join("");
  }
  let html = getValueFromEditor("html-editor");
  let css = getValueFromEditor("css-editor");
  let js = getValueFromEditor("js-editor");
  updateFrame({
    iframe: document.getElementById("editor-output"),
    css: css,
    html: html,
    js: js
  });
}
/*
* Update an iframe HTMLElement with the provided css, html, and js
*/
function updateFrame({ iframe, css, html, js }) {
  const resultsFrameDoc = iframe.contentDocument;
  resultsFrameDoc.open();
  resultsFrameDoc.write(
    `
      <!doctype html>
      <html> 
        <head> 
          <meta charset="utf-8"> 
          <title>Guess</title> 
          <style>${css}</style>
        </head> 
        <body> 
          ${html}
          <script>${js}</script>
        </body> 
      </html>
    `
  );
  resultsFrameDoc.close();
}

/*
* Old school xhr get
*/
function get(url) {
  return new Promise(function(resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.onload = function() {
      if (xhr.status == 200) {
        resolve(xhr.response);
      } else {
        resolve(xhr.statusText);
      }
    };
    xhr.onerror = function(response) {
      resolve("Network Error");
    };
    xhr.send();
  });
}
