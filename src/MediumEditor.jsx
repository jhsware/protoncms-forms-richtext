'use strict';
var registry = require('protoncms-core').registry;
var React = require('react');
var ReactDOM = require('react-dom');
var $ = require('jquery');
var cheerio = require('cheerio');
var utils = require('./utils');

var IRichTextWidget = require('./interfaces').IRichTextWidget;
var IRichTextAction = require('./interfaces').IRichTextAction;

if (typeof window !== 'undefined') {
    var Medium = require('medium.js');    
}

var _getCleanedContent = function (editorEl) {
    var $clone = $(editorEl).clone();
    $clone.find(".RichText-Widget").children().remove()
    return $clone.html();
};

var _renderPlaceHolderHTML = function (widgetId) {
    return '<div id="' + widgetId + '" class="RichText-Widget" contenteditable="false">This is a widget placeholder. If you can see this text, the actual widget failed to render.</div>';
};

var _cleanHTML = function (str, baseClassName) {
    var $in = cheerio.load(str, { decodeEntities: false });

    // Remove tags we don't want    
    ['meta', 'img'].forEach(function (tagName) {
        $in(tagName).remove();
    });
    
    // Unwrap tags by replacing them with their children
    ['span', 'div'].forEach(function (tagName) {
        $in(tagName).each(function () {
            $in(this).replaceWith($in(this).html());
        });        
    });
    
    // Strip ALL attributes
    $in("*").each(function (i, el) {
        if (el.name === 'a') {
            el.attribs = {
                href: el.attribs.href
            }
        } else {
            el.attribs = {}
        };
    });
    
    // Add classes to tags
    var blockLevelTags = {
        'p': 'Paragraph', 
        'h1': 'Header_1',
        'h2': 'Header_2',
        'h3': 'Header_3',
        'h4': 'Header_4',
        'blockquote': 'Quote'
    };
    for (var tagName in blockLevelTags) {
        $in(tagName).addClass(baseClassName + '-' + blockLevelTags[tagName]);
    };
    
    return $in.html();
}

var Editor = React.createClass({
    
    contextTypes: {
        // This is used for permissions
        currentUser: React.PropTypes.object
    },
    
    getInitialState: function () {
        return {
            content: this.props.content || "",
            widgets: this.props.widgets
        }
    },
    
    _widgetDidLoadOrFail: function () {
        this.widgetsLeftToMount--;
        if (this.widgetsLeftToMount == 0) {
            this.props.onWidgetsLoaded && this.props.onWidgetsLoaded();
        }
    },
    
    componentDidMount: function () {
        var editorEl = ReactDOM.findDOMNode(this.refs['editor']);
        
        editorEl.innerHTML = this.props.content;
        
        

        // IMPORTANT! Mount all widgets explicitly since they are disconnected from rest of app
        
        this.widgetsLeftToMount = Object.keys(this.state.widgets).length;
        
        for (var key in this.state.widgets) {
            // Get the widget
            var widget = this.state.widgets[key];
            var $widget = $(editorEl).find("#" + widget.widgetId);
            
            // Get the widget utility
            try {
                var widgetUtil = registry.getUtility(IRichTextWidget, widget.utilityName);
                var ViewComponent = widgetUtil.ReactComponent;
                ReactDOM.render(<ViewComponent allowEditing context={widget.data} widgetId={widget.widgetId} editor={this}
                                onChange={this.didUpdateWidget}
                                onLoad={this._widgetDidLoadOrFail} />, $widget[0]);
            } catch (e) {
                this._widgetDidLoadOrFail();
                console.log("[MediumEditor] We couldn't find and/or mount the widget: " + widget.utilityName + " (#" + widget.widgetId + ")");
                console.log(e);
            }
            
        }
        
        // Update state
        this.setState({
            content: editorEl.innerHTML
        });

        var defaultParagraphClassName = this.props.baseClassName + '-Paragraph';
        
        // Initialize Medium editor...
        this.medium = new Medium({
	        element: editorEl,
	        mode: Medium.richMode,
	        placeholder: this.props.placeholder,
	        attributes: null, // TODO: Hook into paste methods to cleanup tags and attr (seems pretty complicated :( )
	        tags: null,
		    pasteAsText: false,
		    keyContext: {
			    'enter': function(e, element) {
                    // Add default paragraph class
                    if (element && element.tagName === 'P') {
                        element.className = defaultParagraphClassName;
                    }
                    
                    // Make sure we don't create empty divs, convert them to paragraphs instead
                    if (element && element.tagName === 'DIV') {
                        element.className = defaultParagraphClassName + " placeCaretHereNow";
                        utils.changeElementType(element, 'p');
                        utils.placeCaretInElement('placeCaretHereNow', 0, 0);
                    };
                                        
                    // Handle list items... (is this needed?)
				    var sib = element.previousSibling;
				    if (sib && sib.tagName == 'LI') {
					    element.className = sib.className;
					    this.cursor.caretToBeginning(element);
				    }
			    }
		    },
            pasteEventHandler: function (e) {
                
                // TODO: Use HTML if available and clean it, otherwise use plaintext
                // TODO: Insert at current position, overwriting if selection is made
                
                var data = e.clipboardData.items;
                if (e.clipboardData.types.indexOf('text/html') >= 0) {
                    var getTypeMatch = "^text/html";
                } else {
                    var getTypeMatch = "^text/plain";
                    
                    // Let Medium handle this!
                    return;
                }
                
                // We'll handle this!
                e.preventDefault();
                
                for (var i = 0; i < data.length; i += 1) {
                    if ((data[i].kind == 'string') && (data[i].type.match(getTypeMatch))) {
                        data[i].getAsString(function (s){
                            
                            var html = _cleanHTML(s, this.props.baseClassName);
                            
                            // NOTE: This is not supported by IE!!!
                            // https://developer.mozilla.org/en-US/docs/Web/API/Document/execCommand#Commands
                            if (!document.execCommand('insertHTML', true, html)) {
                                console.log("[MediumEditor] Paste failed! 'insertHTML' not supported!");
                            };
                            
                            // Trigger update
                            this.didChange();
                            
                        }.bind(this));
                    } else if ((data[i].kind == 'file') && (data[i].type.match('^image/'))) {
                        // TODO: Upload image an inject image widget
                        var f = data[i].getAsFile();
                        console.log("... Drop: File ");
                    }
                }
               
            }.bind(this)
	    });
                
        $(editorEl).on('change', this.didChange);
        
    },
    
    didClick: function (e) {
        // The click handler should be used to catch clicks on anchor elements
        console.log(e);
    },
    
    didUpdateWidget: function (widgetId, data, callback) {
        var widgets = this.state.widgets;
        for (var key in widgets) {
            if (widgets[key].widgetId === widgetId) {
                widgets[key].data = data;
                break;
            }
        };
                
        this.setState({
            widgets: widgets
        });
        
        // Call the callback so we can get on with our life...
        callback && callback();
        
        // And do the change notification process
        this.didChange();
        
    },
    
    didChange: function (e) {
        // TODO: Need to catch onPaste
        var editorEl = ReactDOM.findDOMNode(this.refs['editor']);
        
        if (editorEl.childElementCount == 0 && editorEl.textContent !== "") {
            // Text only, so we need to wrap it in a paragraph before proceeding
            editorEl.innerHTML = '<p class="' + this.props.baseClassName + "-Paragraph" + ' placeCaretHereNow">' + editorEl.innerHTML + '</p>';
            utils.placeCaretInElement('placeCaretHereNow', 1, 1);
        };
        
        this.setState({
            content: editorEl.innerHTML
        });
        this.props.onChange(_getCleanedContent(editorEl), this.state.widgets);
    },
    
    componentWillUnmount: function () {
        this.medium.destroy();
        
        // IMPORTANT! Unmount all widgets explicitly since they are disconnected from rest of app
        var editorEl = ReactDOM.findDOMNode(this.refs['editor']);
        
        for (var key in this.state.widgets) {
            // Get the widget
            var widget = this.state.widgets[key];
            var $widget = $(editorEl).find("#" + widget.widgetId);
            
            // Get the widget utility
            try {
                React.unmountComponentAtNode($widget[0]);
            } catch (e) {
                console.log("[MediumEditor] We couldn't unmount the widget: " + widget.utilityName + " (#" + widget.widgetId + ")");
                console.log(e);
            }
            
        };
    },
    
    componentWillReceiveProps: function (nextProps) {
        if (this.props.content !== this.state.content) {
            this.setState({
                content: this.props.content
            });
            // TODO: Check widget ids and mount / unmount
        };
    },
    
    _selectionIsInEditor: function () {
        // Check if current seltion is outside editor
        var startEl = utils.getSelectionBoundaryElement(true);
        return $(ReactDOM.findDOMNode(this.refs['editor'])).has(startEl).length > 0;
    },
    
    doInvokeElement: function (elType, opt) {
        if (!this._selectionIsInEditor()) { return };
        this.medium.invokeElement(elType, opt || {});
    },
    
    doInsertAction: function (action, opt) {
        if (!this._selectionIsInEditor()) { return };
        // Execute an insert action
        var actionUtil = registry.getUtility(IRichTextAction, action);
        actionUtil.action.call(this, opt);
    },
    
    doChangeBlockElement: function (tagName, opt) {
        if (!this._selectionIsInEditor()) { return };
        
        // Get current selection so we can restore it
        var range = utils.getCurrentSelectionRange();
        var startOffset = range.startOffset;
        
        // 1 Get start el
        var startEl = utils.getSelectionBoundaryElement(true);
        
        // 2 Find closest parent block level element
        var blockEl = utils.getBlockEl(ReactDOM.findDOMNode(this.refs['editor']), startEl);
        
        // 3 Mutate it
        var $el = $(blockEl);
        $el.removeClass(); // Remove all classes
        $el.addClass(opt.className + " placeCaretHereNow");
        utils.changeElementType(blockEl, tagName);
        
        // Restore selection
        range = utils.getCurrentSelectionRange();
        var $el = $(".placeCaretHereNow");
        $el.removeClass("placeCaretHereNow");
        var startNode = $el[0].childNodes[0];
        range.setStart(startNode, startOffset);
        range.setEnd(startNode, startOffset);
        utils.setSelectionRange(range);
        
        // Trigger update
        this.didChange();
    },
    
    doAddWidget: function (utilityName, opt) {
        if (!this._selectionIsInEditor()) { return };
        
        // Store current selection (current browsers)
        var currentSelectionRange = utils.getCurrentSelectionRange();
        
        var widgetUtil = registry.getUtility(IRichTextWidget, utilityName);
        
        // TODO: Add currentUser as first parameter
        widgetUtil.add(this.context.currentUser, function (data, ViewComponent, callback) {
            
            // Restore selection
            utils.setSelectionRange(currentSelectionRange);
            
            var widgets = this.state.widgets;
            
            var idNr = Object.keys(widgets).length;
            // Check that widget name is unique!!!
            while (widgets['widget_' + idNr]) {
                idNr++;
            };
            var widgetId = 'widget_' + idNr;
            
            var html = _renderPlaceHolderHTML(widgetId);
            
            // Add new widget
            widgets[widgetId] = {
                utilityName: utilityName,
                widgetId: widgetId,
                data: data
            };
            this.setState({
                widgets: widgets
            });
                    
            var editorEl = ReactDOM.findDOMNode(this.refs['editor']);
            var selBoundEl = utils.getSelectionBoundaryElement(true);
            var blockEl = utils.getBlockEl(editorEl, selBoundEl);
            
            // Remove existing placeholder if there is one left behind by mistake
            $(editorEl).find("#" + widgetId).remove();
            
            if (blockEl.textContent === "") {
                // If empty replace the block level element with widget
                $(blockEl).replaceWith(html);
            } else {
                // Otherwise just insert before the selected block node
                $(blockEl).before(html);
            };
                
            // Mount image view component in widget (it is disconnected from the rest of the React model)
            var $widget = $(editorEl).find("#" + widgetId);
            
            // We need to mount the react component explicitly
            ReactDOM.render(<ViewComponent allowEditing context={data} widgetId={widgetId} editor={this} />, $widget[0]);
                        
            // We are done!
            callback();
            
            // Restore selection again
            utils.setSelectionRange(currentSelectionRange);
            
            // Trigger update
            this.didChange();
        }.bind(this));
    },
    
    doDeleteWidget: function (widgetId) {
        var widgets = this.state.widgets;
        var widget = this.state.widgets[widgetId];
        
        var editorEl = ReactDOM.findDOMNode(this.refs['editor']);
        var $widget = $(editorEl).find("#" + widgetId);
        
        // Get the widget utility
        try {
            // Unmount the element..
            ReactDOM.unmountComponentAtNode($widget[0]);
            // ...and remove from DOM
            $widget.remove();
            
            delete widgets[widgetId];
            this.setState({
                widgets: widgets
            });
        } catch (e) {
            console.log("[MediumEditor] We couldn't unmount the widget: " + widget.utilityName + " (#" + widget.widgetId + ")");
            console.log(e);
        }
        
    },
        
    render: function () {
        return (
            <div ref="editor" onKeyUp={this.didChange} onClick={this.didClick}/>
        )
    }
});

module.exports = Editor;