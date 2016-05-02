(function () {
  var newline = function () {
    return [{
      type: 'lang',
      filter: function (text) {
        return text.replace(/^( *(\d+\.  {1,4}|[\w\<\'\">\-*+])[^\n]*)\n{1}(?!\n| *\d+\. {1,4}| *[-*+] +|#|$)/gm, function (e) {
          return e.trim() + "  \n";
        })
      }
    }];
  };

  if (window.showdown) {
    window.showdown.extensions.newline = newline;
  }

  //================
  var codeConfig = {
    autofocus: true,
    lineNumbers: true,
    styleActiveLine: true,
    mode: "gfm",
    lineWrapping: true,
    allowDropFileTypes: ["image/png", "image/jpeg", "image/gif"] //允許上傳的圖片類型:png,jpg,gif
  };

  var converter = new showdown.Converter({
    literalMidWordUnderscores: true,
  });


  var editor = CodeMirror(document.getElementById("editor"), codeConfig);
  var linewidget = [];

  // livepreview
  editor.on('update', function (instance) {
    $("#preview").html(converter.makeHtml(instance.getValue()));
  });

  var waiting;
  editor.on("change", function () {
    clearTimeout(waiting);
    waiting = setTimeout(updateProgress, 100);
  });

  function updateProgress() {
    editor.operation(function () {
      for (var j = 0; j < linewidget.length; ++j) {
        if (linewidget[j] == undefined) continue;
        editor.removeLineWidget(linewidget[j].widget);
        if (linewidget[j].isComplete == false) {
          linewidget[j].widget = editor.addLineWidget(j, linewidget[j].widget.node, { coverGutter: false, noHScroll: true });
        }
      }
      for (var i = linewidget.length - 1; i = 0; --i) {
        if (linewidget[i].isComplete)
          linewidget.splice(i, 1);
      }
    });
    var info = editor.getScrollInfo();
    var after = editor.charCoords({ line: editor.getCursor().line + 1, ch: 0 }, "local").top;
    if (info.top + info.clientHeight < after)
      editor.scrollTo(null, after - info.clientHeight + 3);
  }

  // 處理拖拉圖片上傳並插入的頁面裡

  editor.on("drop", function (editor, e) {
    function _loadFile(file, idx) {
      if (editor.options.allowDropFileTypes && editor.options.allowDropFileTypes.indexOf(file.type) == -1) return;
      var _pos = editor.getPos(editor, e);
      var doc = editor.getDoc();
      var cursor = doc.getCursor();
      var line = doc.getLine(_pos.line); // get the line contents
      var pos = { // create a new object to avoid mutation of the original selection
        line: _pos.line,
        ch: line.length - 1 // set the character position to the end of the line
      }
      // create a node
      var progressNode = document.createElement("progress");
      progressNode.max = 100;
      progressNode.value = 0;
      linewidget[pos.line] = {
        isComplete: false,
        widget: editor.addLineWidget(pos.line, progressNode, { coverGutter: false, noHScroll: true })
      };

      // 執行上傳動作        
      // Create a formdata object and add the files    
      var _formData = new FormData();
      _formData.append("file", file);

      // now post a new XHR request
      if (_formData) {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', '/upload', true);
        xhr.onload = function (evt) {
          progressNode.value = progressNode.innerHTML = 100;
          linewidget[pos.line].isComplete = true;
          editor.removeLineWidget(linewidget[pos.line].widget);          
          doc.replaceRange(xhr.responseText, pos); // adds a new line         
        };
        xhr.upload.onprogress = function (event) {
          if (event.lengthComputable) {
            var complete = (event.loaded / event.total * 100 | 0);
            progressNode.value = progressNode.innerHTML = complete;
          }
        }
        xhr.send(_formData);
      }


    }
    var files = e.dataTransfer.files;
    for (var i = 0; i < files.length; ++i) {
      _loadFile(files[i], i);
    }
  });

  // Run when the DOM has loaded.
  $(function () {
    // Let's define a generic event handler that will look at
    // the key being pressed and log it out to the console.
    var keyHandler = function (event) {
      var keyCode = event.which;
      var keyChar = String.fromCharCode(keyCode);
      // Log the key captured in the event data.
      if (event.altKey && keyChar == "V") {
        $("#preview").toggle();
        $("#editor").toggle();
        editor.focus();
      }
    };
    // Now, let's try binding both the key-down and key-press
    // events to listen for the key and combos.
    $(document).on("keydown", keyHandler);
  });


  //attach event listeners after page has loaded
  // only allow CodeMirror area can dragdrop
  function preventDrag(event) {
    if (event.type == 'dragenter' || event.type == 'dragover' || //if drag over event -- allows for drop event to be captured, in case default for this is to not allow drag over target
      event.type == 'drop') //prevent text dragging -- IE and new Mozilla (like Firefox 3.5+)
    {
      if (event.target.className.trim() != "CodeMirror-line") {        
        if (event.stopPropagation) //(Mozilla)
        {
          event.preventDefault();
          event.stopPropagation(); //prevent drag operation from bubbling up and causing text to be modified on old Mozilla (before Firefox 3.5, which doesn't have drop event -- this avoids having to capture old dragdrop event)
        }
        return false; //(IE)
      }
    }
  }  
  window.onload = function () {
    var body = document; //target any DOM element here

    if (body.addEventListener) //(Mozilla)
    {
      body.addEventListener('dragenter', preventDrag, true); //precursor for drop event
      body.addEventListener('dragover', preventDrag, true); //precursor for drop event
      body.addEventListener('drop', preventDrag, true);
    }
    else if (body.attachEvent) //(IE)
    {
      body.attachEvent('ondragenter', preventDrag);
      body.attachEvent('ondragover', preventDrag);
      body.attachEvent('ondrop', preventDrag);
    }
  }
})();