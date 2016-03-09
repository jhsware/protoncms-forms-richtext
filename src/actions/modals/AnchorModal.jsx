'use strict';
var registry = require('protoncms-core').registry;
var React = require('react');

var Schema = require('isomorphic-schema').Schema;
var validators = require('isomorphic-schema').field_validators;

var IAutoFormWidget = require('protoncms-core').interfaces.IAutoFormWidget;
var IActionBarWidget = require('protoncms-core').interfaces.IActionBarWidget;

var Button = require('react-bootstrap').Button;

// Edit/add widget modal

/*
     NOTE: If we change the schema we need to read more props in the link action method

        var data = {
            href: newEl.getAttribute('href')
            // TODO: Add more attributes
        };

*/
var anchorSchema = new Schema("Anchor Form", {
    // Field defs
    href: validators.textField({
        label: 'Url',
        placeholder: 'Type here...',
        required: true
    })
});

var AnchorModal = React.createClass({
    
    useSchemaForValidation: anchorSchema,
      
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
        state.context = this.props.context || {};
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

    doSave: function (e) {
        e.preventDefault();
        
        this._doSubmit(function () {
            this.props.onSave(this.state.context, function () {
                this.closeModal();
            }.bind(this));
        }.bind(this))        
    },
    
    doNotAdd: function (e) {
        e.preventDefault();
        if (this.props.onCancel) {
            this.props.onCancel(function () {
                this.closeModal();
            }.bind(this))
        } else {
            this.closeModal();
        }
    },
    
    render: function () {
        
        var context = this.state.context;
        
        var FormWidget = registry.getUtility(IAutoFormWidget).ReactComponent;
        var ActionBar = registry.getUtility(IActionBarWidget).ReactComponent;
                
        return (
            <div>
                <div className="modal-header">
                    <h3>Länk</h3>
                </div>
                <FormWidget name="context" 
                    context={context} 
                    onChange={this.didUpdate} 
                    formSchema={this.useSchemaForValidation}
                                    
                    invariantErrors={this.state.formErrors && this.state.formErrors.invariantErrors}
                    serverErrors={this.state.serverErrors} />

                <ActionBar message={this.state.actionBarMessage}>
                    <Button
                        onClick={this.doSave}
                        bsStyle="success"
                        disabled={false}>Spara</Button>
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

module.exports = AnchorModal;
