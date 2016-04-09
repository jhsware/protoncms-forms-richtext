'use strict';
var React = require('react');
var $ = require('jquery');

var RichEditorWidgetMixin = {
    
    contextTypes: {
        formStatus: React.PropTypes.object,
    },
    
    getInitialState: function () {
        return {
            toolbarBoundary: {top: 0, bottom: 0}
        }
    },
    
    _calculateToolbarBoundary: function () {
        if (!this.refs['editor']) { return };
        
        var editorEl = this.refs['editor'].getDOMNode();
        var topBoundaryNode = $(".edit-page")[0]; // TODO: We shouldn't hard code this!!!
        
        var bottomBoundary = $(editorEl).offset().top + editorEl.clientHeight;
        var topBoundary = $(topBoundaryNode).offset().top;
        
        this.setState({
            toolbarBoundary: { 
                top: topBoundary, 
                bottom: bottomBoundary
            }
        });
    },
    
    componentDidMount: function () {
        this._calculateToolbarBoundary();
    },
    
    didMountWidgets: function () {
        this._calculateToolbarBoundary();
    },
        
    onChange: function(htmlContent, widgets) {
        var context = this.props.context;
        this.props.onChange(context.html.property, htmlContent);
        this.props.onChange(context.widgets.property, widgets);
        this._calculateToolbarBoundary();
    },
    
    doInvokeElement: function (tagName, opt) {
        this.refs['editor'].doInvokeElement(tagName, opt);
    },
    
    doChangeBlockElement: function (tagName, opt) {
        this.refs['editor'].doChangeBlockElement(tagName, opt);
    },
    
    doInsertAction: function (action, opt) {
        this.refs['editor'].doInsertAction(action, opt);
    },
    
    doAddWidget: function (utilityName, opt) {
        this.refs['editor'].doAddWidget(utilityName, opt);
    }
};

module.exports = RichEditorWidgetMixin;