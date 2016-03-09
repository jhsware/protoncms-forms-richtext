'use strict';
var registry = require('protoncms-core').registry;
var React = require('react');

var RichEditorWidgetMixin = require('./RichEditorWidgetMixin');
var FieldValidationMixin = require('protoncms-formlib').mixins.FieldValidationMixin;

var MediumEditor = require('./MediumEditor');

var EditableDiv = React.createClass({
    
    mixins: [RichEditorWidgetMixin, FieldValidationMixin],
    
    render: function() {
        var htmlValue = this.props.context.html.value;
        
        // Create help text and merge form error into help text USING MIXIN
        var fieldValidator = this.props.fieldValidator;
        var fieldError = fieldValidator && fieldValidator.validate(htmlValue);
        var widgetValidationProps = this.getBootstrapValidationProps(fieldValidator, htmlValue, fieldError);
        
        // Don't show help message if hideHelpText attribute exists
        if (this.props.hasOwnProperty('hideHelpText') && (typeof this.props.hideHelpText === 'undefined' || this.props.hideHelpText)) {
            delete widgetValidationProps.help;
        }
        
        var cls = ["edit-form-row"]
        if ( widgetValidationProps.bsStyle !== undefined ){
            cls.push('has-' + widgetValidationProps.bsStyle);
        }
                
        return (
            <div className={ cls.join(' ') }>
                <label className="control-label"><span>{ this.props.fieldValidator.label }</span></label>
                <div className="form-control">
                    <FormattingToolbar boundary={this.state.toolbarBoundary}>
                        <FormattingButton tagName="bold" onAction={this.doInvokeElement}><b>B</b></FormattingButton>
                        <FormattingButton tagName="italic" onAction={this.doInvokeElement}><i>I</i></FormattingButton>
                        <FormattingButton tagName="underline" onAction={this.doInvokeElement}><u>U</u></FormattingButton>
                        <FormattingButton tagName="h2" options={{className: 'Article-Header_2'}} onAction={this.doChangeBlockElement}>H2</FormattingButton>
                        <FormattingButton tagName="h3" options={{className: 'Article-Header_3'}} onAction={this.doChangeBlockElement}>H3</FormattingButton>
                        <FormattingButton tagName="h4" options={{className: 'Article-Header_4'}} onAction={this.doChangeBlockElement}>H4</FormattingButton>
                        <FormattingButton tagName="p" options={{className: 'Article-Paragraph'}} onAction={this.doChangeBlockElement}>P</FormattingButton>
                        <FormattingButton tagName="blockquote" options={{className: 'Article-Quote'}} onAction={this.doChangeBlockElement}>""</FormattingButton>
                        <InsertActionButton action="link" options={{className: 'Article-Link'}} onAction={this.doInsertAction}>link</InsertActionButton>
                        <InsertActionButton action="unlink" onAction={this.doInsertAction}>unlink</InsertActionButton>
                        <InsertActionButton action="ul-list" options={{className: 'Article-UnorderedList'}} onAction={this.doInsertAction}>ul</InsertActionButton>
                        <WidgetButton utilityName="Podcast" options={{}} onAction={this.doAddWidget}>Pod</WidgetButton>
                        <WidgetButton utilityName="Youtube" options={{}} onAction={this.doAddWidget}>Youtube</WidgetButton>
                        <WidgetButton utilityName="SimpleTable" options={{}} onAction={this.doAddWidget}>Tabell</WidgetButton>
                    </FormattingToolbar>
                    <MediumEditor
                        ref="editor"
                        baseClassName="Article"
                        placeholder={this.props.fieldValidator.placeholder}
                        content={this.props.context.html.value || ""}
                        widgets={this.props.context.widgets.value || {}}
                        onChange={this.onChange}
                        onWidgetsLoaded={this.didMountWidgets} />
                    <div className="clearfix" />
                    <span className="glyphicon glyphicon-ok form-control-feedback"></span>
                </div>
                {widgetValidationProps.help && <span className="help-block">{widgetValidationProps.help}</span>}
                <div style={{height: '1px', marginBottom: '-1px'}}></div>
            </div>
        )
    }
});

module.exports = EditableDiv