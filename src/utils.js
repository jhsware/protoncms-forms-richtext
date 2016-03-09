'use strict';
var $ = require('jquery');

var _blockLevelTags = ['H#', 'P', 'DIV'];
var _reNums = /\d/g;
var getBlockEl = function (editorEl, startEl) {
    var tagName = startEl.tagName.replace(_reNums, '#');
    if (_blockLevelTags.indexOf(tagName) < 0 && $(editorEl).has(startEl.parentNode).length > 0) {
        // Element is not a block level element according to our list and the parent is still within the editor so we
        // should traverse one step further
        return getBlockEl(editorEl, startEl.parentNode);
    } else {
        return startEl;
    };
};
module.exports.getBlockEl = getBlockEl;

var changeElementType = function (el, newTagName) {
    var attrs = { };
    var $el = $(el);

    $.each($el[0].attributes, function(idx, attr) {
        attrs[attr.nodeName] = attr.nodeValue;
    });


    $el.replaceWith(function () {
        return $("<" + newTagName + " />", attrs).append($(this).contents());
    });
};
module.exports.changeElementType = changeElementType;

var getSelectionBoundaryElement = function (isStart) {
    // http://stackoverflow.com/questions/1335252/how-can-i-get-the-dom-element-which-contains-the-current-selection
    var range, sel, container;
    if (document.selection) {
        range = document.selection.createRange();
        range.collapse(isStart);
        return range.parentElement();
    } else {
        sel = window.getSelection();
        if (sel.getRangeAt) {
            if (sel.rangeCount > 0) {
                range = sel.getRangeAt(0);
            }
        } else {
            // Old WebKit
            range = document.createRange();
            range.setStart(sel.anchorNode, sel.anchorOffset);
            range.setEnd(sel.focusNode, sel.focusOffset);

            // Handle the case when the selection was selected backwards (from the end to the start in the document)
            if (range.collapsed !== sel.isCollapsed) {
                range.setStart(sel.focusNode, sel.focusOffset);
                range.setEnd(sel.anchorNode, sel.anchorOffset);
            }
       }

        if (range) {
           container = range[isStart ? "startContainer" : "endContainer"];

           // Check if the container is a text node and return its parent if so
           return container.nodeType === 3 ? container.parentNode : container;
        }   
    }
};
module.exports.getSelectionBoundaryElement = getSelectionBoundaryElement;

var getCurrentSelectionRange = function () {
    // Store current selection (current browsers)
    var sel = document.getSelection();
    return sel.getRangeAt(0);
}
module.exports.getCurrentSelectionRange = getCurrentSelectionRange;

var setSelectionRange = function (range) {
    // Restore selection
    var sel = document.getSelection();
    sel.removeAllRanges();
    sel.addRange(range)
};
module.exports.setSelectionRange = setSelectionRange;

var placeCaretInElement = function (className, start, end) {
    // Position caret in this element
    var range = getCurrentSelectionRange();    
    var $el = $("." + className);
    $el.removeClass(className);
    range.setStart($el[0], start);
    range.setEnd($el[0], end);
    setSelectionRange(range);
}
module.exports.placeCaretInElement = placeCaretInElement;