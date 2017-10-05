
// nodeIdSearch.js
// The UI to allow the user to select nodes by ID to create a new attribute.

import React, { Component } from 'react';
import PropTypes from 'prop-types';

import Select2 from '/imports/comp/select2wrap.js';

export default class NodeIdSearch extends Component {

    constructor (props) {
        super(props);
        this.cart = [];
        this.searchPageSize = 20;
        this.dropdownClass = 'nodeIdDropdown';
        
        // Save our selves.
        this.query = this.query.bind(this);
        this.handleLoaded = this.handleLoaded.bind(this);
        this.handleDropdownOpen = this.handleDropdownOpen.bind(this);
        this.handleDropdownKeyUpDown = this.handleDropdownKeyUpDown.bind(this);
        this.handleSelecting = this.handleSelecting.bind(this);
        this.formatResult = this.formatResult.bind(this);
    }
        
    componentDidMount () {
    
        // Handle key up and down events on the entries.
        $(document).on('keyup keydown', ".select2-drop-active",
            this.handleDropdownKeyUpDown);
    }

    componentWillUnmount () {
        $(document).off('keyup keydown', ".select2-drop-active");
        $(document).off('keyup keydown', ".select2-drop-active");
    }

    shouldComponentUpdate (newProps) { // eslint-disable-line
    
        // We don't want to re-render when props we're not interested in
        // change. The parent never changes our props.
        return false;
    }

    isInCart (id) {
        return (this.cart.indexOf(id) > -1);
    }
    
    setSelectStatus () {
    
        // For each item in the dropdown, update its select status.
        var self = this;

        // Get the latest cart contents.
        this.cart = this.props.getCart();
        
        // Add or remove the 'selected' class for each entry.
        _.each($('.nodeIdDropdown .entry'), function (el) {
            el = $(el);

            if (self.isInCart(el.text())) {
                el.addClass('selected');
            } else {
                el.removeClass('selected');
            }
        });
    }
    
    handleDropdownKeyUpDown (event) {
    
        // Save the status of the shift key down for multi-select.
        this.shift = event.shiftKey;
    }

    handleSelecting (event) {
    
        // Handler for the point after the click and before adding to the cart,
        // so we can skip the function to put the selection in the choice box.
        var self = this,
            id = event.val;
        
        // Handle a shift-click to select multiple entries between the last
        // entry clicked and this entry.
        // If there is no previously-selected ID, treat this as a single-select.
        if (this.shift && this.lastId !== id && this.lastId !== '') {
            var range = [id, this.lastId].sort(),
                min = range[0],
                max = range[1];
            
            _.each($('.nodeIdDropdown .entry'), function (el) {
                el = $(el);
                var id = el.text();
                
                // If the id is within the range...
                if ([min, id, max].sort()[1] === id) {
                
                    // Highlight the entry as just selected.
                    el.parents('.select2-result')
                        .addClass('select2-highlighted');
                
                    // Add the id to the cart if it's not there yet,
                    // and mark the entry as selected.
                    if (!self.isInCart(id)) {
                        self.props.addToSelectedList(id);
                        el.addClass('selected');
                    }
                }
            });
        } else {
        
            // Add the single-selected ID to the cart if it's not there yet.
            if (!self.isInCart(id)) {
                self.props.addToSelectedList(id);
            }
        }
        
        // Update the selected status of the dropdown items.
        this.setSelectStatus();
        
        // Save our last selected ID for our next compare.
        this.lastId = id;

        // Don't actually change the selection.
        // This keeps the dropdown open when we click.
        event.preventDefault();
    }
    
    handleDropdownOpen () {
    
        // Handle the open dropdown event.
        // Reset the previously-selected ID.
        this.lastId = '';
    }
    
    handleLoaded () {
        
        // Handle the point after the query completes and dropdown updated.
        // Update the select status of each entry.
        this.setSelectStatus();
    }
    
    query (query) {
    
        // Given a select2 query object, find any matches and
        // call query.callback with the results.
        
        var results = [];

        // Get where we should start in the layer list,
        // from select2's infinite scrolling.
        var start_position = 0,
            allIds = this.props.allIds;
        
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
    
    formatResult (result) {
        
        // This formats display entries every time a query is made
        // and is called once per entry. We only need it here to force
        // the element to be added to the dom so it will be available for
        // updates in handleLoaded().
        //
        // Given a select2 result record, the element that our results go
        // in, and the query used to get the result, return a jQuery element
        // as the result.

        return $("<span class='entry'>" + result.id + "</span>");
    }

    render () {
        var self = this;
        
        return (
            <Select2
                select2-loaded = {self.handleLoaded}
                select2-open = {self.handleDropdownOpen}
                select2-selecting = {self.handleSelecting}
        
                // Options for the original non-react select2.
                select2options = {{
                    data: { id: '', text: '' },
                    dropdownCssClass: this.dropdownClass,
                    formatResult: self.formatResult,
                    placeholder: 'Search nodes...',
                    query: self.query,
                    width: '42em',
                }}
            />
        );
    }
}

NodeIdSearch.propTypes = {

    // IDs available for selection.
    allIds: PropTypes.array.isRequired,

    // Function to call when an ID is selected.
    addToSelectedList: PropTypes.func.isRequired,
    
    // Function to call to get the current cart contents.
    getCart: PropTypes.func.isRequired,
};

NodeIdSearch.defaultProps = {
    /* none */
};
