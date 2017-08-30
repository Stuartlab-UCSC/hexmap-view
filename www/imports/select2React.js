
// A react wrapper for the vanilla javascript select2.

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
    this.openEl = props.select2options.dropdownParent.parent();
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
    this.el.off(`change.${namespace}`).val(value).trigger('change');
    
    const onChange = this.props.onChange;
    if (onChange) {
      const dropdownParent = this.props.select2options.dropdownParent,
            choiceDisplay = this.props.choiceDisplay;

      // choiceDisplay is a function to change the text of the selected item
      // in the choice field.
      if (dropdownParent && choiceDisplay) {
        dropdownParent.find('.select2-choice span').text(choiceDisplay(value));
      }
        this.el.on(`change.${namespace}`, onChange);
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

  destroySelect2(withCallbacks = true) {
    if (withCallbacks) {
      this.detachEventHandlers();
    }

    this.el.select2('destroy');
    this.el = null;
  }

  attachEventHandlers(props) {
    this.openEl.on('select2-open', this.handleOpen);
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

    // These props don't work with a div, so remove them from this copy of props
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
    select2options: PropTypes.object,
    multiple: PropTypes.bool,
    
    // Select2 v3 events.
    'select2-selecting': PropTypes.func,
    
    // Select2 v4 events.
    onOpen: PropTypes.func,
    onClose: PropTypes.func,
    onSelect: PropTypes.func,
    onChange: PropTypes.func,
    choiceDisplay: PropTypes.func,
    onUnselect: PropTypes.func,
};

Select2.defaultProps = {
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

