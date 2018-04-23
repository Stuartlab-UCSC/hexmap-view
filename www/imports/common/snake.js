
// A progress snake component.

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { render } from 'react-dom';

import rx from '/imports/common/rx';
import '/imports/common/snake.css';

class Snake extends Component {
    constructor (props) {
        super(props);
        this.forceUpdate = this.forceUpdate.bind(this);
    }
    
    componentDidMount () {
        this.unsubscribe = this.props.globalState.subscribe(this.forceUpdate);
    }
    
    render () {
        var states = this.props.globalState.getState(),
            snakeClients = [this.props.stateVars],
        
            // Find those snake clients that want the snake displayed.
            wantSnake = _.filter(snakeClients, function (client) {
                return states[client];
            });
        
        // Display the snake element if any client wants it to.
        if (wantSnake.length > 0) {
            return (
                <div
                    className = {this.props.name +' snake'}
                />
            );
    
        } else {
            return null;
        }
    }
}

Snake.propTypes = {

    // Global state.
    globalState: PropTypes.object.isRequired,

    // Variables in global state that controls the snake visibility.
    stateVars: PropTypes.array.isRequired,

    // Name of this snake for the css class.
    name: PropTypes.string.isRequired,
};

Snake.defaultProps = {
    // none
};

exports.init = function () {
    
    // Initialize the map snake.
    render(
        <Snake
            globalState = {rx}
            stateVars = {['snake.map']}
            name = 'mapSnake'
        />, document.querySelector('#mapSnakeWrap')
    );
    
    // Initialize the shortlist snake.
    render(
        <Snake
            globalState = {rx}
            stateVars = {['snake.shortlist']}
            name = 'shortlistSnake'
        />, document.querySelector('#shortlistSnakeWrap')
    );
};
