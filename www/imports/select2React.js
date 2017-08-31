
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

import select2 from './lib/select2.js';

const namespace = 'select2-react';

export default class Select2 extends Component {

    constructor(props) {
        super(props);
        this.el = null;
        
        var dropdownParent = props.select2options.dropdownParent;
        if (dropdownParent) {
            
            // The element to capture the select2-open event.
            this.openEl = dropdownParent.parent();
        }
        this.initialRender = true;
    }

    componentDidMount() {
        this.initSelect2(this.props);
        this.updateValue();
    }

    componentWillReceiveProps(nextProps) {
        this.initialRender = false;
        this.updSelect2(nextProps);
    }

    componentDidUpdate() {
        this.updateValue();
    }

    componentWillUnmount() {
        this.destroySelect2();
    }

    initSelect2(props) {
        const { select2options } = props;
        this.el = $(ReactDOM.findDOMNode(this));
        this.el.select2(select2options);
        this.attachEventHandlers(props);
    }

    updSelect2(props) {
        const prevProps = this.props;
        const { select2options } = props;
        
        if (!shallowEqualFuzzy(prevProps.select2options, select2options)) {
            this.el.select2(select2options);
        }

        const handlerChanged = e => prevProps[e[1]] !== props[e[1]];
        if (props.events.some(handlerChanged)) {
            this.detachEventHandlers();
            this.attachEventHandlers(props);
        }
    }

    updateSelect2Value(value) {

        // If a change handler was supplied...
        if (this.props.onChange) {

            // Detach the supplied change handler, then trigger an event.
            // TODO why are we triggering an event here?
            this.el.off(`change.${namespace}`).val(value).trigger('change');

            const dropdownParent = this.props.select2options.dropdownParent,
            choiceDisplay = this.props.choiceDisplay;

            // Get modified text to go in the choice box if we have
            // the dropdown parent and the caller supplied a function.
            if (dropdownParent && choiceDisplay) {
                dropdownParent.find('.select2-choice span')
                    .text(choiceDisplay(value));
            }
            // Attach the supplied change handler.
            this.el.on(`change.${namespace}`, this.props.onChange);
        }
    }

    updateValue() {

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

    fuzzyValuesEqual(currentValue, value) {
        return (currentValue === null && value === '') ||
            shallowEqualFuzzy(currentValue, value);
    }

    handleOpen(event) {
      
        // Handle the select2 v3 open event.
        var results = $('#select2-drop .select2-results');
        results.css('max-height', $(window).height() - results.offset().top - 15);
    }

    destroySelect2() {
        this.detachEventHandlers();
        this.el.select2('destroy');
        this.el = null;
    }

    attachEventHandlers(props) {
    
        if (props.select2options.dropdownParent) {

            // Event fired after the dropdown is shown.
            this.openEl.on('select2-open', this.handleOpen);
        }
        
        // Re-enable the rest of the event handlers.
        props.events.forEach(event => {
            if (typeof props[event[1]] !== 'undefined') {
                this.el.on(event[0], props[event[1]]);
            }
        });
    }

    detachEventHandlers() {
        this.openEl.off('select2-open')
        this.props.events.forEach(event => {
            if (typeof this.props[event[1]] !== 'undefined') {
                this.el.off(event[0]);
            }
        });
    }

    render() {
        const { value, ...props } = this.props;

        // These props don't work with a div,
        // so remove them from this copy of props.
        // TODO: put these all under 'props.comp'.
        delete props.select2options;
        delete props.events;
        delete props.onOpen;
        delete props.onClose;
        delete props.onSelect;
        delete props.onChange;
        delete props['select2-selecting'];
        delete props.choiceDisplay;
        delete props.onUnselect;
        
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
    
    // Options for the pre-react select2 widget.
    select2options: PropTypes.object,
    
    // Allow multiple selections, optional.
    multiple: PropTypes.bool,
  
    // Callback for value change, optional.
    onChange: PropTypes.func,
    
    // Callback for creating choice box text, optional.
    choiceDisplay: PropTypes.func,
    
    // Select2 v3: Handler for click before adding to choice box, optional.
    'select2-selecting': PropTypes.func,
    
    // TODO: remove these if they are Select2 v4 events:
    onOpen: PropTypes.func,
    onClose: PropTypes.func,
    onSelect: PropTypes.func,
    onUnselect: PropTypes.func,
};

Select2.defaultProps = {

    // TODO: what is namespace protecting us from?
    events: [
        [`change.${namespace}`, 'onChange'],
        [`choiceDisplay.${namespace}`, 'choiceDisplay'],
        [`select2-selecting`, 'select2-selecting'],
        [`select2:open.${namespace}`, 'onOpen'],
        [`select2:close.${namespace}`, 'onClose'],
        [`select2:select.${namespace}`, 'onSelect'],
        [`select2:unselect.${namespace}`, 'onUnselect'],
    ],
    multiple: false,
};

