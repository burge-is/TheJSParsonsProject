startApp();

function startApp() {
  const loadPenButton = document.getElementById("load-pen-button");
  loadPenButton.onclick = loadPenPieces;
  prepareDragAreas();
  document.getElementById("editor-form").oninput = function() {
    updateFrame({
      iframe: document.getElementsByTagName("iframe")[0],
      css: document.getElementById("css-editor").value,
      html: document.getElementById("html-editor").value,
      js: document.getElementById("js-editor").value
    });
  };
  document.getElementById("piece-answer-swapper").onclick = function() {
    document.getElementById("box-cover").style.display === "none"
      ? (document.getElementById("box-cover").style.display = "block")
      : (document.getElementById("box-cover").style.display = "none");
  };
}
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
function loadPenPieces() {
  const button = document.getElementById("load-pen-button");
  const codepenURL =
    button.parentElement.querySelector("#codepen-url").value ||
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
    updateFrame({
      iframe: document.getElementById("box-cover"),
      html: responses[0],
      css: responses[1],
      js: responses[2]
    });
    responses
      .reduce(function(arr, resp) {
        return arr.concat(
          resp.split("\n").filter(function(line) {
            return line !== "";
          })
        );
      }, [])
      .map(buildDraggable)
      .map(a => document.getElementById("piece-holder").appendChild(a));
  });
}
function buildDraggable(text) {
  let draggable = document.createElement("pre");
  draggable.draggable = true;
  draggable.innerText = text;
  draggable.className = "puzzle-piece";

  return draggable;
}
function prepareDragAreas() {}
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
