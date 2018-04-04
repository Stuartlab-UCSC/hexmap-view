
// A progress snake component.

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { render } from 'react-dom';

import rx from '/imports/common/rx';
import utils from '/imports/common/utils';
import '/imports/common/snake.css';

class Snake extends Component {
    constructor (props) {
        super(props);
        this.forceUpdate = this.forceUpdate.bind(this);
    }
    
    componentDidMount () {
        this.unsubscribe = this.props.store.subscribe(this.forceUpdate);
    }
    
    render () {
        var states = this.props.store.getState(),
            snakeClients = [
                'createMap.running',
                'init',
                'placeNode.running',
                'projectList.changing',
                'uploading',
            ],
        
            // Find those snake clients that want the snake displayed.
            wantSnake = _.filter(snakeClients, function (client) {
                return states[client];
            });
        
        // Display the snake element if any client wants it to.
        if (wantSnake.length > 0) {
        
            return (
                <div
                    className = {'mapSnake snake'}
                />
            );
    
        } else {
            return null;
        }
    }
}

Snake.propTypes = {

    // Global state.
    store: PropTypes.object.isRequired,
};

Snake.defaultProps = {
    // none
};

exports.init = function () {
    //return;
    
    // Initialize the main snake.
    render(
        <Snake
            store = {rx}
        />, utils.createReactRoot('snakeContainer')
    );
};
