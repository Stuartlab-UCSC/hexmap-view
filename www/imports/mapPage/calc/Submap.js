
// Logic and state for the creating a sub-map with data from another map.

import { connect } from 'react-redux'
import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux'

import rx from '/imports/common/rx'
import SubmapPres from '/imports/mapPage/calc/SubmapPres'

const getList = (state) => {

    // Get all binary shortlist attrs.
    return rx.get('submap.attrList')
}

const mapStateToProps = (state) => {

    // Map state to the properties.
    return {
        attrId: state['submap.attrId'],
        list: getList(state),
    }
}

const mapDispatchToProps = (dispatch) => {

    // Map the event handlers to the properties.
    let entries
    return {
        onTrigger: ev => {
            dispatch({
                type: 'shortEntry.menu.attr',
                attr: shortlist.get_layer_name_from_child(ev.target)
            })
        },
    }
}

// Connect the value props and eventHandler props
// to the presentational component.
const Submap = connect(
    mapStateToProps,
    mapDispatchToProps
)(SubmapPres)

export show = () => {
    const store = rx.getStore();
    render(
        <Provider store={store}>
            <Submap />
        </Provider>,
        document.getElementById('submapWrap')
    )
