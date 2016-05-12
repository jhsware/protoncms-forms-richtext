'use strict';
var registry = require('protoncms-core').registry;
var React = require('react');
var ReactDOM = require('react-dom');
var createUtility = require('component-registry').createUtility;
var $ = require('jquery');

if (typeof window !== 'undefined') {
    var Medium = require('medium.js');    
}

var Button = require('react-bootstrap').Button;

var IRichTextWidget = require('../interfaces').IRichTextWidget;
var IActionBarWidget = require('protoncms-core').interfaces.IActionBarWidget;
var IActionButtonWidget = require('protoncms-core').interfaces.IActionButtonWidget;


// Edit/add widget modal


var TableCell = React.createClass({
    
    componentDidMount: function () {
        var editorEl = ReactDOM.findDOMNode(this.refs['editor']);
        
        editorEl.innerHTML = this.props.children;

        // Initialize Medium editor...
        this.medium = new Medium({
	        element: editorEl,
	        mode: Medium.inlineRichMode,
	        placeholder: this.props.placeholder,
	        attributes: null, // TODO: Hook into paste methods to cleanup tags and attr (seems pretty complicated :( )
	        tags: null,
		    pasteAsText: true,
		    keyContext: {
			    'enter': function(e, element) {
                    // Don't allow creating divs with enter...
                    if (element && element.tagName === 'DIV') {
                        element.remove();
                    }
			    }
		    }
	    });
                
        $(editorEl).on('change', this.didChange);
        
    },
    
    didChange: function (e) {
        var editorEl = ReactDOM.findDOMNode(this.refs['editor']);
        this.props.onChange(this.props.rowIndex, this.props.colIndex, editorEl.innerHTML);
    },
    
    didKeyDown: function (e) {
        // If this is enter, then create a new row and supress the key action
        var enter = 13;
        if (e.keyCode === 13) {
            e.preventDefault();
            this.props.onMoveDown && this.props.onMoveDown(this.props.rowIndex, this.props.colIndex);
        }
    },
    
    componentWillUnmount: function () {
        this.medium.destroy();
    },
    
    render: function () {
        return <td className={this.props.className}>
                 <span ref="editor" className="SimpleTableModal-MediumEditor" onKeyUp={this.didChange} onKeyDown={this.didKeyDown} onClick={this.didClick} />
               </td>
    }
});

var SimpleTableWidgetModal = React.createClass({
    
    getInitialState: function () {
        return {
            tableData: this.props.data || [this._getNewDataRow()]
        };
    },
    
    _getNewDataRow: function () {
        return {
            data: [
                {className: "RichText-SimpleTableCell-Name", data: ""}, 
                {className: "RichText-SimpleTableCell-Result", data: ""}
            ]
        };
    },
    
    closeModal: function () {
      global.dispatcher.dispatch({
          actionType: 'hideModal'
      })  
    },

    doSave: function (e) {
        e.preventDefault();
        
        var data = this.state.tableData;
        var ViewComponent = this.props.ViewComponent;
        
        // If we are adding a new widget
        this.props.onAdd && this.props.onAdd(data, ViewComponent, function () {
            this.closeModal();
        }.bind(this));

        // Otherwise save
        this.props.onSave && this.props.onSave(this.props.widgetId, data, function () {
            this.closeModal();
        }.bind(this));
    },
    
    doCancel: function (e) {
        e.preventDefault();
        this.closeModal();
    },
    
    didUpdate: function (rowIndex, colIndex, data) {
        var tableData = this.state.tableData;
        tableData[rowIndex].data[colIndex].data = data;
        this.setState({tableData: tableData});
    },
    
    doMoveDown: function (rowIndex, colIndex) {
        if (rowIndex + 1 == this.state.tableData.length) {
            var tableData = this.state.tableData;
            tableData.push(this._getNewDataRow());
            this.setState({
                tableData: tableData
            });
            // TODO: Place caret in proper cell
        } else {
            // TODO: move down one row
        };
    },
    
    renderTable: function () {
        
        var rowEls = this.state.tableData.map(function (row, rowIndex) {
            var colEls = row.data.map(function (cell, colIndex) {
                return (<TableCell key={colIndex}
                            className={"RichText-SimpleTableCell " + cell.className} placeholder="Skriv här..." 
                            rowIndex={rowIndex}
                            colIndex={colIndex}
                            onChange={this.didUpdate}
                            onMoveDown={this.doMoveDown}>{cell.data}</TableCell>)
            }.bind(this));
            return (<tr key={rowIndex} className="RichText-SimpleTableRow">{colEls}</tr>)
        }.bind(this))
        
        return (
            <table className="RichText-SimpleTable">
                {rowEls}
            </table>
        )
    },
    
    render: function () {
        
        var context = this.state.context;
                
        var ActionButton = registry.getUtility(IActionButtonWidget).ReactComponent;
        var ActionBar = registry.getUtility(IActionBarWidget).ReactComponent;
        
        return (
            <div>
                <div className="modal-header">
                    <h3>Resultattabell</h3>
                </div>
                
                <div className="SimpleTableModal-TableContainer">
                    {this.renderTable()}
                </div>
                    
                <ActionBar message={this.state.actionBarMessage}>
                    <Button bsStyle="success" onClick={this.doSave}>Spara</Button>
                    
                    <div className="float-right">
                        <Button onClick={this.doCancel}>Ångra</Button>
                    </div>
                </ActionBar>
            </div>
        )
    }
});

// Image widget controller
var SimpleTableWidgetUtility = createUtility({
    implements: IRichTextWidget,
    name: "SimpleTable",
    
    _closeModal: function () {
      global.dispatcher.dispatch({
          actionType: 'hideModal'
      })  
    },
    
    add: function (currentUser, doAdd) {
        // Open a modal and allow user to enter data
        var ViewComponent = this.ReactComponent;
        
        global.dispatcher.dispatch({
            actionType: 'showModal',
            // modal: <SimpleTableWidgetModal doAdd={doAdd} ViewComponent={this.ReactComponent}/>
            modal: <SimpleTableWidgetModal onAdd={doAdd} ViewComponent={this.ReactComponent} />
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
            global.dispatcher.dispatch({
                actionType: 'showModal',
                modal: <SimpleTableWidgetModal widgetId={this.props.widgetId} data={this.state.data} onSave={this.didUpdate} />
            });
        },
        
        didUpdate: function (widgetId, data, callback) {
            this.setState({
                data: data
            });
            this.props.onChange(widgetId, data, callback);
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
            this.props.onChange(this.props.widgetId, data)
        },
        
        renderEditButtons: function () {
            if (!(this.props.hasOwnProperty('allowEditing') && (this.props.allowEditing === undefined || this.props.allowEditing))) {
                return null
            };
            
            return [        
                (<img className="RichText-WidgetFormattingButton RichText-EditButton" 
                    src="/assets/img/rich_text/trash.svg"
                    onClick={this.doEdit}
                    onLoad={this.didLoadImage} />)
            ]
        },
        
        render: function () {
            
            var rowEls = this.state.data.map(function (row, rowIndex) {
                var colEls = row.data.map(function (cell, colIndex) {
                    return <td key={colIndex} className={"RichText-SimpleTableCell " + cell.className}>{cell.data}</td>
                });
                return <tr key={rowIndex} className="RichText-SimpleTableRow">{colEls}</tr>
            });
            
            return <div className={"RichText-ImageContainer RichText-Widget-" + this.state.data.align}>        
                <table className="RichText-SimpleTable">
                    {rowEls}
                </table>
                {this.renderEditButtons()}
            </div>
        }
    })
});
registry.registerUtility(SimpleTableWidgetUtility);
