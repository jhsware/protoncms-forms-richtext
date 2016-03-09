# ProtonCMS Rich Text Editor
A medium style editor with widgets and sticky toolbar. Allows you to add your own widgets and create your own toolbar. Requires you to have a protoncms-style modal where interactions can be made.

Sample setup

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
	    <WidgetButton utilityName="SimpleTable" options={{}} onAction={this.doAddWidget}>Resultat</WidgetButton>
	</FormattingToolbar>
	<MediumEditor
	    ref="editor"
		baseClassName="Article"
	    placeholder={this.props.fieldValidator.placeholder}
	    content={this.props.context.html.value || ""}
	    widgets={this.props.context.widgets.value || {}}
	    onChange={this.onChange}
	    onWidgetsLoaded={this.didMountWidgets} />

## Creating a Toolbar

	<FormattingToolbar boundary={this.state.toolbarBoundary}></FormattingToolbar>

The toolbar is sticky and the boundaries are set by passing the property `boundary`. Add the buttons as children to the toolbar.

### FormattingButton

	<FormattingButton tagName="bold" onAction={this.doInvokeElement}><b>B</b></FormattingButton>

	tagName -- what tag to enclose marked content with when pressed. The choices are:
		
			- bold
			- italic
			- underline
			- h1-h6			(block level)
			- p				(block level)
			- blockqoute 	(block level)

The block level tags will change the tag name of the first entire block of text of the selection. The other tags only wrap the selection.

	onAction -- the event listener callback to use to pass the instruction to MediumEditor

The listener reacts on mouseDown to avoid changing the current selection. For non-block level tagName you bind to:

    doInvokeElement: function (tagName, opt) {
        this.refs['editor'].doInvokeElement(tagName, opt);
    }
  
 And for block level tagNames you bind the button to:
  
    doChangeBlockElement: function (tagName, opt) {
        this.refs['editor'].doChangeBlockElement(tagName, opt);
    }


The event lister callbacks for FormattingBurron are available in RichEditorWidgetMixin for convenience. They assume that mounted MediumEditor component as ref="editor"

### InsertActionButton

	<InsertActionButton action="link" options={{className: 'Article-Link'}} onAction={this.doInsertAction}>link</InsertActionButton>

	action -- what action to perform when pressed

The actions are created as named utilities where `action` matches the name of the IRichTextAction utility.

	options -- options to pass to the action utility (specific for that utility). In this case we are passing the className to 
		be set on the link that is created
		
	onAction -- the event listener callback

The event lister callback for InsertActionButton is implement like this and is available in RichEditorWidgetMixin for convenience. It assumes that mounted MediumEditor component as ref="editor":

    doInsertAction: function (action, opt) {
        this.refs['editor'].doInsertAction(action, opt);
    },
  

### WidgetButton

	<WidgetButton utilityName="Podcast" options={{}} onAction={this.doAddWidget}>Pod</WidgetButton>

	utilityName -- the name of the IRichTextWidget utility that corresponds to the widget
	
	options -- options to send to the widget utility (specific for that utility)
	
	onAction -- event listener callback

The event lister callback is implement like this and is available in RichEditorWidgetMixin for convenience. It assumes that mounted MediumEditor component as ref="editor":

    doAddWidget: function (utilityName, opt) {
        this.refs['editor'].doAddWidget(utilityName, opt);
    }

## Rendering the Rich Text Editor

    <MediumEditor
        ref="editor"
		baseClassName="Article"
        placeholder={this.props.fieldValidator.placeholder}
        content={this.props.context.html.value || ""}
        widgets={this.props.context.widgets.value || {}}
        onChange={this.onChange}
        onWidgetsLoaded={this.didMountWidgets} />

	ref -- just a standard reference used to call methods on the MediumEditor component
	
	baseClassName -- this is prepended to all block level elements (p, quote, h#) to form the class name
		i.e. Article-Paragraph
		
	placeHolder -- the placeholder text rendered when content is empty
	
	content -- the HTML passed to the editor and injected into the medium editor when mounted
	
	widgets -- the object containing all the IRichTextWidget widgets we have inserted into the HTML
	
	onChange -- called on all changes to the content
	
	onWidgetsLoaded -- called when all the widgets have been mounted AND all of their content has loaded. This
		is useful if we need to check the height of the container element to control the boundaries of a
		sticky toolbar


## Render Rich Text in a Page


	
We are asuming that content data is sent as

    this.props.data['/api/articles/:slug']
	
and they contain two properties:

    - body           // HTML-body with widget placeholders
	
    - attachments    // dictionary of RichTextWidget data objects where the key matches a placeholder in the HTML

Implementation example:

```
		
	    var Page = React.createClass({
			
	        mixins: [RichTextRenderMixin],
			
	        getInitialState: function () {
	            var article = this.props.data['/api/articles/:slug'] || {};
	            var body = this.injectWidgetHTML(article.body, article.attachments || []);
	            return {
	                body: body
	            }
	        },
    
	        componentDidMount: function () {
	            // IMPORTANT! Mount all widgets explicitly since they are disconnected from rest of app
	            var article = this.props.data['/api/articles/:slug'];
	            this.mountWidgets(this.refs['body'].getDOMNode(), article.attachments);
	        },
    
	        componentWillUnmount: function () {
	            // IMPORTANT! Unmount all widgets explicitly since they are disconnected from rest of app
	            var article = this.props.data['/api/articles/:slug'];
	            this.unmountWidgets(this.refs['body'].getDOMNode(), article.attachments);
	        },
    
	        render: function() {
	            return (
	                <div ref="body" className="ArticlePage-Body" dangerouslySetInnerHTML={{__html: this.state.body}} />
	            )
	        }
	    });
		
```

## Creating Custom Widgets

You need to implement two properties:

	add: function (currentUser, doAdd)
	
	ReactComponent: React.createClass({})

The ReactComponent takes the following properties:

	context -- the widget data 
	
	allowEditing -- if available and not false, edit buttons should be rendered
	
	editor -- the editor instance, allowing us to interact with the editor
	
	onLoad -- called when all the content has loaded (if we mount images we need to wait for them to be loaded to
		get sizes correct)
		
	onChange: function (widgetId, data, callback) -- called when data is updated, passing widgetId, data and a callback
		allowing the editor to return the result of the update and then the editing modal (if used) to show a message
		or close properly

## Creating Custom Actions

Action utilities only have a single member

	action: function (options) {} -- it is passed the options passed to the InsertActionButton through the options
		 property

### TODO
DONE: ActionBar needs to go into formlib and should be a utility so it can easily be overidden
	DONE: Create IActionBarWidget in protoncms-core


