'use strict';
var React = require('react');
var ReactDOM = require('react-dom');
var $ = require('jquery');

var FormattingToolbar = React.createClass({
    // TODO: Make this sticky AF
    
    getInitialState: function () {
        return {
            isSticky: false
        }
    },
    
    didScroll: function (e) {
        // Don't do this more than once per animation frame
        if (this.scrollAnimationFrame) { return }
        
        // Ok so we haven't done this since last frame... let's go
        this.scrollAnimationFrame = window.requestAnimationFrame(function() {
            // Don't do this if we can't find the element
            if (!this.refs['flowing']) {
                delete this.scrollAnimationFrame;
                return;
            }
        
            var flowNode = ReactDOM.findDOMNode(this.refs['flowing']);
        
            var isSticky = ($(flowNode).offset().top < (window.scrollY + this.props.boundary.top) && window.scrollY < this.props.boundary.bottom);
        
            if (isSticky !== this.state.isSticky) {
                this.setState({
                    isSticky: isSticky
                });            
            }
            delete this.scrollAnimationFrame;
        }.bind(this));
    },
    
    componentDidUpdate: function () {
        this.didScroll();
    },
    
    componentDidMount: function () {        
        $(window).on('scroll', this.didScroll);
        $(window).on('resize', this.didScroll);
        this.didScroll();
        
    },
    
    componentWillUnmount: function () {
        $(window).off('scroll', this.didScroll);
        $(window).off('resize', this.didScroll);
    },
    
    render: function () {
        return (
            <div>
                <div ref="flowing" className="RichEditor-FormattingToolbar">
                    {this.props.children}
                </div>
                <div className={"RichEditor-FormattingToolbar RichEditor-StickyFormattingToolbar" + (this.state.isSticky ? "" : " RichEditor-StickyFormattingToolbar--hidden")}
                    style={{top: this.props.boundary.top}}>
                    {this.props.children}
                </div>
                
            </div>
        )
    }
});
module.exports.FormattingToolbar = FormattingToolbar;

var FormattingButton = React.createClass({
    // IMPORTANT! We need to listen to onMouseDown or else we clear the current selection
    doInvoke: function (e) {
        e.preventDefault();
        this.props.onAction(this.props.tagName, this.props.options || {});
    },
    render: function () {
        return (
            <div className="RichEditor-FormattingButton" onMouseDown={this.doInvoke}>
                {this.props.children || this.props.title}
            </div>
        )
    }
});
module.exports.FormattingButton = FormattingButton;

var InsertActionButton = React.createClass({
    // IMPORTANT! We need to listen to onMouseDown or else we clear the current selection
    doInvoke: function (e) {
        e.preventDefault();
        this.props.onAction(this.props.action, this.props.options || {});
    },
    render: function () {
        return (
            <div className="RichEditor-InsertActionButton" onMouseDown={this.doInvoke}>
                {this.props.children || this.props.title}
            </div>
        )
    }
});
module.exports.InsertActionButton = InsertActionButton;

var WidgetButton = React.createClass({
    // IMPORTANT! We need to listen to onMouseDown or else we clear the current selection
    doInsert: function (e) {
        e.preventDefault();
        this.props.onAction(this.props.utilityName, this.props.options || {});
    },
    render: function () {
        return (
            <div className="RichEditor-WidgetButton" onMouseDown={this.doInsert}>
                {this.props.children || this.props.title}
            </div>
        )
    }
});
module.exports.WidgetButton = WidgetButton;

