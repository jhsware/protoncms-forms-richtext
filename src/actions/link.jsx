'use strict';
var registry = require('protoncms-core').registry;
var React = require('react');
var createUtility = require('component-registry').createUtility;
var $ = require('jquery');

var IRichTextAction = require('../interfaces').IRichTextAction;

var utils = require('../utils');
var AnchorModal = require('./modals/AnchorModal');

var ActionUtil = createUtility({
    implements: IRichTextAction,
    name: 'link',
    
    action: function (options) {        
        var range = utils.getCurrentSelectionRange();
        
        // Check if we are in a link, if found edit it, otherwise create a link later in the callback
        var startEl = (range.startContainer.tagName ? range.startContainer : range.startContainer.parentNode);
        var $a = startEl.tagName === 'A' ? $(startEl) : $(startEl).parent('a');
        if ($a.length > 0) {
            var newEl = $a[0];
            var data = {
                href: newEl.getAttribute('href')
                // TODO: Add more attributes
            };
        } else {
            var newEl;
            var data = {};
        }
        
        // This is called by the modal when finished if anything should be saved
        var doSave = function (context, callback) {
            
            // If the anchor el wasn't found, we need to create it
            if (newEl === undefined) {
                var a = document.createElement('a');
                a.className = (options.className || "") + " createdElementNow";
                a.setAttribute("href", "");
                
                // Don't allow selecting across block elements   
                try {
                    range.surroundContents(a); 
                } catch (e) {
                    var endOffset = range.startContainer.textContent.length;
                    range.setEnd(range.startContainer, endOffset);
                    utils.setSelectionRange(range);

                    range.surroundContents(a);
                }
                       
                var $newEl = $(".createdElementNow").removeClass('createdElementNow');
                $newEl.find('a').each(function (index, el) {
                    var $el = $(el);
                    $el.replaceWith($el.html());
                });
                // newEl is inherited through closure
                newEl = $newEl[0];
            }
            
            // Set all the attributes
            for (var key in context) {
                newEl.setAttribute(key, context[key] || "");
            }
            
            // And finished
            callback();
            
            // Signal change
            this.didChange();
        }.bind(this);
        
        var didCancel = function (callback) {
            // Reset the selection
            utils.setSelectionRange(range);
            callback()
        };
        
        global.dispatcher.dispatch({
            actionType: 'showModal',
            modal: <AnchorModal context={data} onSave={doSave} onCancel={didCancel} />
        });
    }
    
});
registry.registerUtility(ActionUtil);


