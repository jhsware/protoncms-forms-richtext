'use strict';
var registry = require('protoncms-core').registry;
var React = require('react');
var createUtility = require('component-registry').createUtility;
var $ = require('jquery');

var Schema = require('isomorphic-schema').Schema;
var validators = require('isomorphic-schema').field_validators;

var IRichTextWidget = require('../interfaces').IRichTextWidget;

var IAutoFormWidget = require('protoncms-core').interfaces.IAutoFormWidget;
var IActionBarWidget = require('protoncms-core').interfaces.IActionBarWidget;

var Button = require('react-bootstrap').Button;

// Edit/add widget modal

var podcastSchema = new Schema("Podcast Form", {
    // Field defs
    url: validators.textField({
        label: 'Url',
        placeholder: '//site.com/etc',
        required: true
    }),
    description: validators.textAreaField({
        label: 'Short description',
        placeholder: 'Type here...',
        required: false
    })
});

var PodcastWidgetModal = React.createClass({
    
    useSchemaForValidation: podcastSchema,
      
    childContextTypes: {
        formStatus: React.PropTypes.object,
        onShownMessage: React.PropTypes.func
    },

    getChildContext: function () {
        return {
            formStatus: {
                failedSubmit: this.state.failedSubmit
            },
            onShownMessage: this.didShowMessage
        };
    },
    
    didShowMessage: function () {
        // This makes sure new messages are shown once if marked with force, but
        // on subsequent redraws it will keep its state set by ActionBar
        var state = this.state;
        state['actionBarMessage'].force = false;
        this.setState(state);
    },
    
    getInitialState: function () {
        var state = {
            failedSubmit: false,
            formErrors: undefined,
            serverErrors: undefined,
            
            spinnerSubmit: false,
            actionBarMessage: undefined,
        }
        state.context = this.props.context || {
            align: 'center'
        };
        return state;
    },
    
    closeModal: function () {
      global.dispatcher.dispatch({
          actionType: 'hideModal'
      })  
    },
    
    _doSubmit: function (callback) {
        
        this.setState({
            actionBarMessage: undefined
        });
        
        // *** Do client side form validation: ***
        var formSchema = this.useSchemaForValidation || this.state.context._implements[0].schema;
        var formErrors = formSchema.validate(this.state.context);
        var newState = {
            formErrors: formErrors
        };
        // If we got form errors, don't submit and mark failedSubmit so we can render
        // required fields as errors
        if (typeof formErrors !== "undefined") {
            newState['failedSubmit'] = true;
            newState['actionBarMessage'] = {
                type: "error",
                message: "The form contains errors, check fields!",
                force: true
            };
            return this.setState(newState);                
        }
        // Otherwise clear the failed submit and continue with post
        newState['failedSubmit'] = false;
        newState['spinnerSubmit'] = true;
        this.setState(newState);
        // *** /END FORM VALIDATION ***
        callback();
    },
    
    didUpdate: function (name, context) {
        this.setState(this.state); // This should really be a force render
    },

    doAdd: function (e) {
        e.preventDefault();
        
        this._doSubmit(function () {
            var ViewComponent = this.props.ViewComponent;
        
            this.props.doAdd(this.state.context, ViewComponent, function () {
                this.closeModal();
            }.bind(this));
        }.bind(this))        
    },
    
    doNotAdd: function (e) {
        e.preventDefault();
        this.closeModal();
    },
    
    render: function () {
        
        var context = this.state.context;
        
        var FormWidget = registry.getUtility(IAutoFormWidget).ReactComponent;
        var ActionBar = registry.getUtility(IActionBarWidget).ReactComponent;
        
        return (
            <div>
                <div className="modal-header">
                    <h3>Podcast widget</h3>
                </div>
                <FormWidget name="context" 
                    context={context} 
                    onChange={this.didUpdate} 
                    formSchema={this.useSchemaForValidation}
                                    
                    invariantErrors={this.state.formErrors && this.state.formErrors.invariantErrors}
                    serverErrors={this.state.serverErrors} />

                <ActionBar message={this.state.actionBarMessage}>
                    <Button
                        onClick={this.doAdd}
                        bsStyle="success"
                        disabled={false}>Lägg till</Button>
                    <div className="float-right">
                        <Button
                            onClick={this.doNotAdd}
                            bsStyle="warning"
                            disabled={false}>Ångra</Button>
                    </div>
                </ActionBar>
            </div>
        )
    }
})


// Image widget controller
var PodcastWidgetUtility = createUtility({
    implements: IRichTextWidget,
    name: "Podcast",
    
    add: function (currentUser, doAdd) {
        // Open a modal and allow user to enter data
        var ViewComponent = this.ReactComponent;
        
        global.dispatcher.dispatch({
            actionType: 'showModal',
            modal: <PodcastWidgetModal doAdd={doAdd} ViewComponent={this.ReactComponent}/>
        });
    },
    
    ReactComponent: React.createClass({
        getInitialState: function () {
            return {
                data: this.props.context
            }
        },
        
        componentDidMount: function () {
            this.props.onLoad && this.props.onLoad();
        },
        
        doEdit: function (e) {
            
        },
        
        doDelete: function (e) {
            e.preventDefault();
            
            this.props.editor.doDeleteWidget(this.props.widgetId);
        },
        
        doChangeAlignment: function (align) {
            var data = this.state.data
            data['align'] = align;
            this.setState({
                data: data
            });
            // TODO: Call this.props.onChange
        },
        
        renderEditButtons: function () {
            if (!(this.props.hasOwnProperty('allowEditing') && (this.props.allowEditing === undefined || this.props.allowEditing))) {
                return null
            };
            
            return [
                (<div className="RichText-WidgetButtonToolbar">
                    <img className="RichText-WidgetFormattingButton" 
                        src="/assets/img/rich_text/justify-left.svg"
                        onClick={function (e) {e.preventDefault(); this.doChangeAlignment('left')}.bind(this)} />
                    <img className="RichText-WidgetFormattingButton" 
                        src="/assets/img/rich_text/justify-center.svg"
                        onClick={function (e) {e.preventDefault(); this.doChangeAlignment('center')}.bind(this)} />
                    <img className="RichText-WidgetFormattingButton" 
                        src="/assets/img/rich_text/justify-right.svg"
                        onClick={function (e) {e.preventDefault(); this.doChangeAlignment('right')}.bind(this)} />
                </div>),
                            
                (<img className="RichText-WidgetFormattingButton RichText-EditButton" 
                    src="/assets/img/rich_text/trash.svg"
                    onClick={this.doDelete} />)
            ]
        },
        
        render: function () {
            var resourceUrl = this.state.data.url.replace("http:", "").replace("https:", "");
            return <div className={"RichText-PodcastContainer RichText-Widget-" + this.state.data.align}>
                <iframe className="RichText-Podcast" width="100%" height="100%" src={resourceUrl} scrolling="no" style={{border:"none", overflow:"hidden"}}></iframe>
                {this.renderEditButtons()}
            </div>
        }
    })
});
registry.registerUtility(PodcastWidgetUtility);
