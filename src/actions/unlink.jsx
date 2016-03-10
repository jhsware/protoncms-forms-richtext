'use strict';
var registry = require('protoncms-core').registry;
var createUtility = require('component-registry').createUtility;
var $ = require('jquery');

var IRichTextAction = require('../interfaces').IRichTextAction;

var utils = require('../utils');

var ActionUtil = createUtility({
    implements: IRichTextAction,
    name: 'link',
    
    action: function () {
        var range = utils.getCurrentSelectionRange();
        var startEl = (range.startContainer.tagName ? range.startContainer : range.startContainer.parentNode);
        if (startEl.tagName !== 'A') {
            var $startEl = $(startEl).parent('a');
        } else {
            var $startEl = $(startEl);
        }
        var tmp = $startEl.html();
        $startEl.replaceWith(tmp);
        
        // Signal change
        this.didChange();
    }
});
registry.registerUtility(ActionUtil);


