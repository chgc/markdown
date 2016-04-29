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
  var progress = document.getElementById('uploadprogress');
  // livepreview
  editor.on('update', function (instance) {
    $("#preview").html(converter.makeHtml(instance.getValue()));
  });

  // 處理拖拉圖片上傳並插入的頁面裡
  editor.on("drop", function (editor, e) {
    function _loadFile(file, idx) {
      if (editor.options.allowDropFileTypes && editor.options.allowDropFileTypes.indexOf(file.type) == -1) return;

      // 執行上傳動作        
      // Create a formdata object and add the files    
      var _formData = new FormData();      
      _formData.append("file", file);

      // now post a new XHR request
      if (_formData) {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', '/upload', true);
        xhr.onload = function () {
          progress.value = progress.innerHTML = 100;
        };
        xhr.upload.onprogress = function (event) {
          if (event.lengthComputable) {
            var complete = (event.loaded / event.total * 100 | 0);
            progress.value = progress.innerHTML = complete;
          }
        }
        xhr.send(_formData);
      }

      var doc = editor.getDoc();
      var cursor = doc.getCursor();
      var line = doc.getLine(cursor.line); // get the line contents
      var pos = { // create a new object to avoid mutation of the original selection
        line: cursor.line,
        ch: line.length - 1 // set the character position to the end of the line
      }
      doc.replaceRange(file.name, pos); // adds a new line      
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
})();