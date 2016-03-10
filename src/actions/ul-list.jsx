'use strict';
var registry = require('protoncms-core').registry;
var createUtility = require('component-registry').createUtility;

var IRichTextAction = require('../interfaces').IRichTextAction;

var utils = require('../utils');

var ActionUtil = createUtility({
    implements: IRichTextAction,
    name: 'ul-list',
    
    action: function(options) {
    	var ul = document.createElement('ul'),
    		li = document.createElement('li');

    	ul.className = options.className;
    	ul.appendChild(li);

    	li.className = options.className + '-Item placeCaretHereNow';
        li.innerHTML = "Type here...";

        var range = utils.getCurrentSelectionRange();
        var startEl = (range.startContainer.tagName ? range.startContainer : range.startContainer.parentNode);
        var blockEl = utils.getBlockEl(this.refs['editor'].getDOMNode(), startEl);
        if (blockEl.textContent == "") {
            // Replace current block
            $(blockEl).replaceWith(ul)
        } else {
            // Insert at caret
            var dummy = document.createElement('div');
            dummy.appendChild(ul);
            var html = dummy.innerHTML;
        
            this.medium.focus();
            this.medium.insertHtml(html);
        }
    
        utils.placeCaretInElement('placeCaretHereNow', 0, 1);
        // Signal change
        this.didChange();
    }
    
});
registry.registerUtility(ActionUtil);


