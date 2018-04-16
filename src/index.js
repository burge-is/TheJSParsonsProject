startApp();

/*
* Bootstrap the app: 
* here we tie in the starter event handlers
* and prepare the dom for drag/drop interactions
*/
function startApp() {
  const loadPenButton = document.getElementById("load-pen-button");
  loadPenButton.onclick = loadPenPieces;

  // Update result iframe when the html/css/js areas change
  document.getElementById("editor-form").oninput = function() {
    updateFrame({
      iframe: document.getElementsByTagName("iframe")[0],
      css: document.getElementById("css-editor").value || "",
      html: document.getElementById("html-editor").value || "",
      js: document.getElementById("js-editor").value || ""
    });
  };

  // Handle toggling on/off the cheat iframe
  document.getElementById("piece-answer-swapper").onclick = function() {
    document.getElementById("box-cover").style.display !== "block"
      ? (document.getElementById("box-cover").style.display = "block")
      : (document.getElementById("box-cover").style.display = "none");
  };
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
* Load the pen pieces from the codepen-url input text
* This code will grab the .html .css and .js files
* from codepen and convert them into puzzle pieces
*/
function loadPenPieces() {
  const codepenURL =
    document.querySelector("#codepen-url").value ||
    "https://codepen.io/andcircus/pen/aYgxOy";
  const html = get(codepenURL + ".html");
  const css = get(codepenURL + ".css");
  const js = get(codepenURL + ".js");

  document.getElementById("piece-holder").innerHTML = "";
  document
    .getElementById("piece-holder")
    .appendChild(buildDraggable("loading..."));

  Promise.all([html, css, js]).then(function(responses) {
    document.getElementById("piece-holder").innerHTML = "";
    // updateFrame({
    //   iframe: document.getElementById("box-cover"),
    //   html: responses[0],
    //   css: responses[1],
    //   js: responses[2]
    // });
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
      .map(a => document.getElementById("piece-holder").appendChild(a));

    const pieceHolderSize = document.getElementById("piece-holder")
      .scrollHeight;
    document.getElementById("box-cover").src =
      codepenURL.replace("/pen/", "/embed/") +
      "/?height=" +
      (pieceHolderSize < 800 ? pieceHolderSize - 5 : 800) +
      "&default-tab=result";
  });
}
/*
*  Create a draggable HTMLElement out of text
*/
function buildDraggable(text) {
  let draggable = document.createElement("pre");
  draggable.draggable = true;
  draggable.innerText = text;
  draggable.className = "puzzle-piece";
  prepareDragEvents(draggable, closureDND);

  return draggable;
}

//Creating a global... not happy about it
let dnd = dragAndDrop();
/*
* Handle puzzle drag events
*/
function prepareDragEvents(draggable) {
  function handleDragOver(e) {
    if (e.preventDefault) {
      e.preventDefault(); // Necessary. Allows us to drop.
    }
    e.dataTransfer.dropEffect = "move"; // Shows "move" visualization icon
    return false;
  }

  draggable.addEventListener("dragstart", dnd.drag, false);
  draggable.addEventListener("dragover", handleDragOver, false);
  draggable.addEventListener("drop", dnd.drop, false);

  return false;
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
    drop: function handleDrop(e) {
      if (e.stopPropagation) {
        e.stopPropagation(); // Stops some browsers from redirecting.
      }
      if (dragSrcEl != this) {
        // Set the source column's HTML to the HTML of the column we dropped on.
        dragSrcEl.innerHTML = this.innerHTML;
        this.innerHTML = e.dataTransfer.getData("text/html");
      }
    }
  };
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
