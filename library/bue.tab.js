// $Id$

//Introduce indent(TAB), unindent(Shift+TAB), and auto indent(ENTER) in textareas.
BUE.postprocess.push(function(E) {

  E.tabs = {
    str: '  ', //character(s) to be inserted when TAB is pressed. Drupal way is to use double space.
    on: true, //initial state of tabs. Switchable by Ctrl+Alt+TAB
    autoin: true, //auto indent on enter.
    blocks: true //indent/unindent selected text blocks without overwriting.
  };

  $(E.textArea).keydown(function(e) {
    if (e.keyCode == 9) {
      if (e.ctrlKey && e.originalEvent.altKey) {//enable-disable
        E.tabs.on = !E.tabs.on;
        return false;
      }
      if (E.tabs.on && !e.ctrlKey && !e.originalEvent.altKey) {
        var tab = E.tabs.str;
        if (e.shiftKey) {//unindent
          var P = E.posSelection(), start = Math.max(0, P.start-tab.length);
          if (E.getContent().substring(start, P.start) == tab) {
            E.makeSelection(start, P.end);
          }
          E.replaceSelection(E.getSelection().replace(new RegExp('^' + tab), ''));
          E.replaceSelection(E.tabs.blocks ? E.getSelection().replace(new RegExp('\n' + tab, 'g'), '\n') : '');
        }
        else {//indent
          if (E.tabs.blocks) {
            E.replaceSelection(E.getSelection().replace(/\n/g, '\n' + tab)).tagSelection(tab, '');
          }
          else {
            E.replaceSelection(tab, 'end');
          }
        }
        if ($.browser.opera) {//unable to suppress opera's default action.
          $(E.textArea).one('blur', E.focus);
        }
        return false;
      }
    }
    //auto indent on enter
    else if (E.tabs.autoin && !e.ctrlKey && !e.shiftKey && !e.originalEvent.altKey && e.keyCode == 13) {
      var m, text = E.getContent().substr(0, E.posSelection().start);
      if (m = text.substr(text.lastIndexOf('\n') + 1).match(/^(\s+)/)) {
        E.replaceSelection('\n' + m[1], 'end');
        if ($.browser.opera) {//unable to suppress opera's default action.
          setTimeout(function() {
            var pos = E.posSelection();
            E.makeSelection(pos.start - 1, pos.end).replaceSelection('', 'end');
          }, 0);
        }
        return false;
      }
    }
  });
 
});


//Change settings in your own postprocess.
//E.tabs.str = 'YOUR_TAB_CHARACTER(S)';
//E.tabs.on = YOUR_BOOLEAN_INDICATING_THE_INITIAL_STATE_OF_TABS;
//E.tabs.autoin = YOUR_BOOLEAN_INDICATING_THE_STATE_OF_AUTO_INDENT_ON_ENTER;
//E.tabs.blocks = YOUR_BOOLEAN_INDICATING_THE_SUPPORT_FOR_BLOCK_INDENTING;