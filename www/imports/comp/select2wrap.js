
/*
A react wrapper for the pre-react select2 v3.

TODO: Not every event implemented.
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

const namespace = 'select2-react';

export default class Select2 extends Component {

    constructor (props) {
        super(props);
        this.initialRender = true;
    }

    componentDidMount () {
        
        // We use findDOMNode rather than a ref here because the dom element is
        // not in the proper state when we try to get it during the render.
        /* eslint-disable */
        this.el = $(ReactDOM.findDOMNode(this)); // eslint-disable-line
        this.openEl =
            $('#' + ReactDOM.findDOMNode(this).parentNode.getAttribute("id"));
        /* eslint-enable */
        this.el.select2(this.props.select2options);
        this.attachEventHandlers(this.props);
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

    updSelect2 (props) {
        const prevProps = this.props;
        const { select2options } = props;
        
        if (!shallowEqualFuzzy(prevProps.select2options, select2options)) {
            this.el.select2(select2options);
        }
    }

    updateSelect2Value (value) {

        // If a change handler was supplied...
        if (this.props.onChange) {

            // Detach the supplied change handler, then trigger an event.
            // TODO why are we triggering an event here?
            this.el.off(`change.${namespace}`).val(value).trigger('change');

            const choiceDisplay = this.props.choiceDisplay;

            // Get modified text to go in the choice box if we have
            // the dropdown parent and the caller supplied a function.
            if (choiceDisplay) {
                this.openEl.find('.select2-choice span')
                    .text(choiceDisplay(value));
            }
            // (Re)attach the supplied change handler.
            this.el.on(`change.${namespace}`, this.props.onChange);
        }
    }

    updateValue () {

        // from componentDidUpdate()
        // TODO do we need all of this?
        const value = this.props.select2options.value;
        const currentValue = this.props.select2options.multiple ?
            this.el.val() || [] : this.el.val();

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

    handleOpen () {
      
        // Handle the select2 v3 open dropdown event.
        // Size the bottom of the dropdown to be just
        // above the bottom of the main window.
        // TODO: what if an instance wants to use this event?
        
        var results = $('#select2-drop .select2-results');
        results.css('max-height',
                    $(window).height() - results.offset().top - 15);
    }

    destroySelect2 () {
        this.detachEventHandlers();
        this.el.select2('destroy');
        this.el = null;
    }

    attachEventHandlers (props) {
    
        this.openEl.on('select2-open', this.handleOpen);
        
        // Enable the rest of the event handlers.
        props.events.forEach(event => {
            if (typeof props[event[1]] !== 'undefined') {
                this.el.on(event[0], props[event[1]]);
            }
        });
    }

    detachEventHandlers () {
        this.openEl.off('select2-open');
        this.props.events.forEach(event => {
            if (typeof this.props[event[1]] !== 'undefined') {
                this.el.off(event[0]);
            }
        });
    }

    render () {
        return (
            <div></div>
        );
    }
}

Select2.propTypes = {
 
    // Options passed to the original pre-react select2 widget.
    select2options: PropTypes.object.isRequired,

    events: PropTypes.array,

    // Callback for value change.
    onChange: PropTypes.func,
    
    // Callback for creating choice box text.
    choiceDisplay: PropTypes.func,
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
};

