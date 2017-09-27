
/*
A react wrapper for the pre-react select2.

TODO: This supports some of selec2 v3 and some of v4, so not everything works
yet. It may be best to remove all of the v4 code and bring it back in later
if we want it.
*/
/*
Adapted from https://github.com/rkit/react-select2-wrapper

The MIT License (MIT)

Copyright (c) 2015 Igor Romanov

Permission is hereby granted, free of charge, to any person obtaining a copy of 
this software and associated documentation files (the "Software"), to deal in 
the Software without restriction, including without limitation the rights to 
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of 
the Software, and to permit persons to whom the Software is furnished to do so, 
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all 
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS 
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR 
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER 
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN 
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import shallowEqualFuzzy from 'shallow-equal-fuzzy';

import select2 from '/imports/lib/select2.js';

const namespace = 'select2-react';

export default class Select2 extends Component {

    constructor (props) {
        super(props);
        this.el = null;
        var parent = props.select2options.dropdownParent;
        if (parent) {
            
            // The element to capture the select2-open event.
            this.openEl = parent.parent();
        }
        this.initialRender = true;
    }

    componentDidMount () {
        this.initSelect2(this.props);
        this.updateValue();
    }

    componentWillReceiveProps (nextProps) {
        this.initialRender = false;
        this.updSelect2(nextProps);
    }

    componentDidUpdate () {
        this.updateValue();
    }

    componentWillUnmount () {
        this.destroySelect2();
    }

    initSelect2 (props) {
        const { select2options } = props;
        
        // TODO should this be a ref in the render ?
        this.el = $(ReactDOM.findDOMNode(this));
        this.el.select2(select2options);
        this.attachEventHandlers(props);
    }

    updSelect2 (props) {
        const prevProps = this.props;
        const { select2options } = props;
        
        if (!shallowEqualFuzzy(prevProps.select2options, select2options)) {
            this.el.select2(select2options);
        }

        const handlerChanged = e => prevProps[e[1]] !== props[e[1]];
    }

    updateSelect2Value (value) {

        // If a change handler was supplied...
        if (this.props.onChange) {

            // Detach the supplied change handler, then trigger an event.
            // TODO why are we triggering an event here?
            this.el.off(`change.${namespace}`).val(value).trigger('change');

            choiceDisplay = this.props.choiceDisplay;

            // Get modified text to go in the choice box if we have
            // the dropdown parent and the caller supplied a function.
            if (this.openEl && choiceDisplay) {
                this.openEl.find('.select2-choice span')
                    .text(choiceDisplay(value));
            }
            // Attach the supplied change handler.
            this.el.on(`change.${namespace}`, this.props.onChange);
        }
    }

    updateValue () {

        // from componentDidUpdate()
        // TODO do we need all of this?
        const { value, defaultValue, multiple } = this.props;
        const currentValue = multiple ? this.el.val() || [] : this.el.val();

        if (!this.fuzzyValuesEqual(currentValue, value)) {
            this.updateSelect2Value(value);
            if (!this.initialRender) {
                this.el.trigger('change');
            }
        }
    }

    fuzzyValuesEqual (currentValue, value) {
        return (currentValue === null && value === '') ||
            shallowEqualFuzzy(currentValue, value);
    }

    handleOpen (event) {
      
        // Handle the select2 v3 open dropdown event.
        // Size the bottom of the dropdown to be just
        // above the bottom of the main window.
        // TODO: what if an instance wants to use this event?
        
        var results = $('#select2-drop .select2-results');
        results.css('max-height', $(window).height() - results.offset().top - 15);
    }

    destroySelect2 () {
        this.detachEventHandlers();
        this.el.select2('destroy');
        this.el = null;
    }

    attachEventHandlers (props) {
    
        if (this.openEl) {
            this.openEl.on('select2-open', this.handleOpen);
        }
        
        // (Re-)enable the rest of the event handlers.
        props.events.forEach(event => {
            if (typeof props[event[1]] !== 'undefined') {
                this.el.on(event[0], props[event[1]]);
            }
        });
    }

    detachEventHandlers () {
        if (this.openEl) {
            this.openEl.off('select2-open');
        }
        this.props.events.forEach(event => {
            if (typeof this.props[event[1]] !== 'undefined') {
                this.el.off(event[0]);
            }
        });
    }

    render () {
        const { value, select2, ...props } = this.props;

        // These props don't work with a div,
        // so remove them from this copy of props.
        // TODO: put these all under 'props.comp'.
        delete props.select2options;
        delete props.events;
        delete props['select2-open'];
        delete props['select2-loaded'];
        delete props['select2-selecting'];
        delete props.choiceDisplay;
        
        return (
            <div {...props}>
            </div>
        );
    }
}

Select2.propTypes = {
    defaultValue: PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.array,
        PropTypes.string,
    ]),
    value: PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.array,
        PropTypes.string,
    ]),
    events: PropTypes.array,
    
    // Parameters and options for the pre-react select2 widget.
    select2options: PropTypes.object.isRequired,
    
    // Allow multiple selections.
    multiple: PropTypes.bool,
    
    // DropdownParent allows positioning the bottom of the dropdown
    // close to the bottom of the window. It also allows something other than
    // the selected option to display in the choice field.
    dropdownParent: PropTypes.object,

    // Callback for value change.
    onChange: PropTypes.func,
    
    // Callback for creating choice box text.
    choiceDisplay: PropTypes.func,
    
    'select2-open': PropTypes.func,
    
    // Handler for after the query completes and dropdown has been updated.
    // and the data and the results list has been updated, optional.
    // Fired when query function is done loading the data and the results list
    // has been updated. (Select2 v3)
    'select2-loaded': PropTypes.func,
    
    // Handler for click before adding to choice box.
    // Fired when a choice is being selected in the dropdown, but before any
    // modification has been made to the selection. This event is used to
    // allow the user to reject selection by calling event.preventDefault().
    // (Select2 v3)
    'select2-selecting': PropTypes.func,
};

Select2.defaultProps = {

    // TODO: what is namespace protecting us from?
    events: [
        [`change.${namespace}`, 'onChange'],
        [`choiceDisplay.${namespace}`, 'choiceDisplay'],
        [`select2-open`, 'select2-open'],
        [`select2-loaded`, 'select2-loaded'],
        [`select2-selecting`, 'select2-selecting'],
    ],
    multiple: false,
};

