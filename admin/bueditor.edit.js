// $Id$
(function($) {

//Faster alternative to resizable textareas.
//Make textareas full expand/shrink on dblclick to grippie
Drupal.behaviors.textarea = function(context) {
  $('textarea.resizable:not(.textarea-processed)', context).each(textArea);
};

//Faster alternative to sticky headers.
//Header creation is skipped on load and done once the user scrolls on a table.
//Fixes tableselect bug where the state of checkbox in the cloned header is not updated.
Drupal.behaviors.tableHeader = function(context) {
  var tables =$('table.sticky-enabled:not(.sticky-table)', context).addClass('sticky-table').get();
  if (tables.length) {
    if (!bue.tables) {
      bue.tables = [];
      $(window).scroll(winScroll).resize(winResize);
    }
    bue.tables = bue.tables.concat(tables);
  }
};

//process resizable textareas
var textArea = function(i, T) {
  var spn = El('span'), wrp = $(El('div')).addClass('resizable-textarea').append(spn);
  $(El('div')).addClass('grippie').mousedown(TDrag).dblclick(TExpand).appendTo(spn)[0].bueT = T;
  $(T).before(wrp).prependTo(spn).addClass('textarea-processed');
  //grp.style.marginRight = (grp.offsetWidth - T.offsetWidth) +'px';//slow
};

//start resizing textarea
var TDrag = function(e) {
  var $T = $(this.bueT), $doc = $(document);
  var doDrag = function(e) {$T.height(Math.max(18, bue.Y + e.pageY));return false;}
  var noDrag = function(e) {$doc.unbind('mousemove', doDrag).unbind('mouseup', noDrag);$T.css('opacity', 1);}
  bue.Y = $T.css('opacity', 0.25).height() - e.pageY;
  $doc.mousemove(doDrag).mouseup(noDrag);
  return false;
};

//resize the textarea to its scroll height
var TExpand = function(e) {
  $(this).unbind('dblclick', TExpand).dblclick(TShrink);
  var T = this.bueT, sH = T.scrollHeight, $T = $(T), tH = $T.height();
  if (tH >= sH) return;
  this.bueH = tH;
  $T.height(sH).focus();
};

//resize the textarea to its original height
var TShrink = function(e) {
  $(this).unbind('dblclick', TShrink).dblclick(TExpand);
  if (!this.bueH) return;
  var T = this.bueT, $T = $(T), oriH = this.bueH, $w = $(window), sTop = $w.scrollTop();
  var diffH = $T.offset().top < sTop  ? $T.height() - oriH : 0;
  $T.height(oriH);
  $w.scrollTop(sTop - diffH);
};

//create (table header)
var createHeader = function(table) {
  var $fixed = table.$fixed = $(table.cloneNode(false));
  var $repo = table.$repo = $(El('table')).append(table.tHead.cloneNode(true));
  $repo.css({visibility: 'hidden', position: 'absolute', left: -1000, top: -1000}).insertBefore(table);
  $fixed.addClass('sticky-header').css('position', 'fixed')[0].id += '-fixed';
  return $fixed.insertBefore(table);
};

//handle window scroll (table header)
var winScroll = function(e) {
  var $w = $(window), sX = $w.scrollLeft(), sY = $w.scrollTop();
  for (var table, i = 0; table = bue.tables[i]; i++) {
    tableScroll(table, sX, sY);
  }
};

//handle window resize (table header)
var winResize = function(e) {
  for (var table, i = 0; table = bue.tables[i]; i++) if (table.$fixed && table.$fixed[0].tHead) {
    table.$fixed.width($(table).width());
  }
};

//handle sticky head on scroll (table header)
var tableScroll = function(table, sX, sY) {
  var $table = $(table), pos = $table.offset();
  var minY = pos.top, maxY = minY + $table.height() - $(table.tHead).height() * 2, minX = pos.left;
  var action = minY < sY && sY < maxY;
  var $fixed = table.$fixed || false;
  if (!action && (!$fixed || !$fixed[0].tHead)) return;
  $fixed = $fixed || createHeader(table);//create when necessary
  var $repo = table.$repo;
  if (action) {
    $fixed.css({visibility: 'visible', top: 0, left: minX-sX});
    if (!$fixed[0].tHead) {//run once in action
      var head = table.tHead;
      $table.prepend($repo[0].tHead);
      $fixed.append(head).width($table.width());
    }
  }
  else {//run once out of action
    $fixed.css('visibility', 'hidden');
    var head = table.tHead;
    $table.prepend($fixed[0].tHead);
    $repo.append(head);
  }
};

//process initial text(icon) fields. Add selector-opener next to them.
var iconProc = function(i, inp) {
  var sop = bue.sop.cloneNode(false);
  sop._txt = inp;
  sop.onclick = sopClick;
  inp.parentNode.insertBefore(sop, inp);
  bue.IL[inp.value] && iconShow(inp.value, sop);
};

//click event for selector opener.
var sopClick = function(e) {
  var pos = $(activeSop = this).offset();
  $(bue.IS).css({left: pos.left-parseInt($(bue.IS).width()/2)+10, top: pos.top+10}).show();
  $('#edit-selaction').addClass('ie6');//fix ie6's selectbox z-index bug.
  setTimeout(function(){$(document).click(doClick)});
  return false;
};

//document click to close selector
var doClick = function(e) {
  $(document).unbind('click', doClick);
  $(bue.IS).hide();
  $('#edit-selaction').removeClass('ie6');
};

//select text option
var textClick = function() {
  var sop = activeSop;
  if (sop._ico && $(sop._txt).is(':hidden')) {
    $(sop._ico).hide();
    $(sop._txt).show().val('');
  }
  sop._txt.focus();
};

//replace textfield with icon
var iconShow = function(name, sop) {
  $(sop._txt).val(name).hide();
  var img = sop._ico;
  if (img) {
    img.src = iconUrl(name);
    img.alt = img.title = name;
    $(img).show();
  }
  else {
    img = sop._ico = iconCreate(name).cloneNode(false);
    sop.parentNode.appendChild(img);
  }
};

//select image option
var iconClick = function() {iconShow(this.title, activeSop)};

//return URL for an icon
var iconUrl = function(name) {return bue.IP + name};

//create icon image.
var iconCreate = function(name) {
  var img = bue.IL[name];
  if (!img) return false;
  if (img.nodeType) return img;
  img = bue.IL[name] = El('img');
  img.src = iconUrl(name);
  img.alt = img.title = name;
  return img;
};

//create icon selector table
var createIS = function() {
  var table = $html('<table><tbody><tr><td title="'+ Drupal.t('Text button') +'"><input type="text" size="1" /></td></tr></tbody></table>')[0];
  var tbody = table.tBodies[0];
  var row = tbody.rows[0];
  row.cells[0].onclick = textClick;
  var i = 1;
  for (var name in bue.IL) {
    if (i == 6) {
      tbody.appendChild(row = El('tr'));
      i = 0;
    }
    row.appendChild(cell = El('td'));
    cell.title = name;
    cell.onclick = iconClick;
    cell.appendChild(iconCreate(name));
    i++;
  }
  //fill in last row
  for(; i < 6; i++) {
    row.appendChild(El('td'));
  }
  return $(table).attr('id', 'icon-selector').appendTo(document.body).hide()[0];
};

//table drag adjustment. make value updating simpler and start from 0.
var tableDrag = function() {
  var tdrag = Drupal.tableDrag && Drupal.tableDrag['button-table'];
  tdrag && (tdrag.updateFields = function() {
    $('#button-table input.input-weight').each(function(i, field) {field.value = i});
  })();//sort initially to make new buttons sink.
};

//actions for selected buttons
var selAction = function() {
  var $chks = $('#button-table').find('input:checkbox');
  if ($chks.size()) {
    $('#edit-go').click(function() {
      var action = $('#edit-selaction').val();
      if (action && $chks.filter(':checked').size()) {
        return action != 'delete' || confirm(Drupal.t('Are you sure want to delete the selected buttons?'));
      }
      return false;
    });
    $('#edit-selaction').change(function() {
      $('#edit-copyto')[this.value == 'copyto' ? 'show' : 'hide']();
    }).change();
  }
  else {
    $('#sel-action-wrapper').hide();
  }
};

//initiate variables and process page elements
var init = function() {
  bue.IL = Drupal.settings.BUE.iconlist;
  bue.BP = Drupal.settings.basePath;
  bue.IP = bue.BP + Drupal.settings.BUE.iconpath +'/';
  bue.$div = $(El('div'));
  bue.sop = $html('<img class="icon-selector-opener" src="'+ bue.BP +'misc/menu-expanded.png" title="'+ Drupal.t('Select an icon') +'" />')[0];
  bue.IS = createIS(); //create icon selector
  $('input.input-icon').each(iconProc);//process icon textfields
  selAction();//selected buttons actions
  tableDrag();//alter table drag
};

//local container
var bue = {};
//create document element
var El = function(name) {return document.createElement(name)};
//html to jQuery
var $html = function(s){return bue.$div.html(s).children()};
//initiate
$(document).ready(init);

})(jQuery);