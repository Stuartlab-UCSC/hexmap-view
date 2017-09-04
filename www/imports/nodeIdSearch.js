
// nodeIdSearch.js
// The UI to allow the user to select nodes by ID to create a new attribute.

import React, { Component } from 'react';
import { render, unmountComponentAtNode } from 'react-dom';

import Select2 from './select2wrap.js';

export default class NodeIdSearch extends Component {

    constructor (props) {
        super(props);
        this.cart = [];
        this.searchPageSize = 20;
        
        // Save our selves.
        this.query = this.query.bind(this);
        this.handleLoaded = this.handleLoaded.bind(this);
        this.handleSelecting = this.handleSelecting.bind(this);
        this.formatResult = this.formatResult.bind(this);
    }
        
    componentDidMount() {
    
        // Build the list of node IDs.
        this.allNodeIds = Object.keys(polygons).sort();
    }

    shouldComponentUpdate(newProps) {
    
        // We don't want to re-render when props we're not interested in
        // change. The parent never changes our props.
        return false;
    }

    isInCart (id) {
        return (this.cart.indexOf(id) > -1);
    }
    
    setSelectStatus () {
    
        // For each item in the dropdown, update its select status.
        var self = this,
            $els = $('.nodeIdSearchDropdownEntry');

        // Get the latest cart contents.
        this.cart = this.props.getCart();
        
        // Add or remove the 'selected' class for each entry.
        _.each($els, function (el) {
            var $el = $(el);

            if (self.isInCart($el.text())) {
                $el.addClass('selected');
            } else {
                $el.removeClass('selected');
            }
        });
    }

    handleSelecting (event) {
    
        // Handler for after the click and before adding to the cart,
        // so we can skip the function to put the selection in the choice box.
        
        // TODO if we add shift-click to select multiple, does this event
        //      include all entries selected? If not, we may not want to call
        //      getCart() mulitiple times via setDropdownStatus. We could update
        //      status for each entry without calling getCart();

        // If the ID is not already in the cart...
        if (!this.isInCart(event.val)) {
        
            // Add it to the cart.
            this.props.addToSelectedList(event.val);
        
            // Update the selected status of the dropdown item.
            this.setSelectStatus();
        }
        
        // Don't actually change the selection.
        // This keeps the dropdown open when we click.
        event.preventDefault();
    }
    
    handleLoaded (event) {
        
        // Handler for after the query completes and dropdown
        // has been updated.
        this.setSelectStatus();
    }
    
    query (query) {
    
        // Given a select2 query object, find any matches and
        // call query.callback with the results.
        
        var results = [];

        // Get where we should start in the layer list,
        // from select2's infinite scrolling.
        var start_position = 0,
            allIds = this.allNodeIds;
        
        if (query.context != undefined) {
            start_position = query.context;
        }
        
        for (var i = start_position; i < allIds.length; i++) {
        
            var check = allIds[i].toLowerCase()
                    .indexOf(query.term.toLowerCase());

            // Is the search term in this node ID?
            if (check > -1) {
                
                // Query search term is in this node ID,
                // so add a select2 record to our results.
                results.push({
                    id: allIds[i],
                    text: allIds[i],
                });
                
                if (results.length >= this.searchPageSize) {
                
                    // Page is full. Send it on.
                    break;
                }
            }
        }
    
        // Give the results back to select2 as the results parameter.
        query.callback({
            results: results,
            
            // Say there's more if we broke out of the loop.
            more: i < allIds.length,
            
            // If there are more results, start after where we left off.
            context: i + 1
        });
    }
    
    formatResult (result, container, query) {
        
        // This formats display entries every time a query is made
        // and is called once per entry. We only need it here to force
        // the element to be added to the dom so it will be available to be
        // updated in handleLoaded().
        //
        // Given a select2 result record, the element that our results go
        // in, and the query used to get the result, return a jQuery element
        // as the result.

        return $("<span class='nodeIdSearchDropdownEntry'>" +
            result.id + "</span>");
    }

    render () {
        var self = this;
        
        return (
            <Select2
                select2-loaded = {self.handleLoaded}
                select2-selecting = {self.handleSelecting}
                select2options = {{
                    data: { id: '', text: '' },
                    dropdownCssClass: 'nodeIdSearchDropdown',
                    dropdownParent: this.props.searchDropDownParent,
                    formatResult: self.formatResult,
                    placeholder: 'Search nodes...',
                    query: self.query,
                    value: null,
                    width: '42em',
                }}
            />
        );
    }
}
