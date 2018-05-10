
// Render the short list entry context menu.

import React from 'react';
import PropTypes from 'prop-types';
import { ContextMenu, MenuItem, SubMenu, ContextMenuTrigger }
    from "react-contextmenu";
import '/imports/mapPage/init/contextMenu.css';
import './shortEntry.css';

const selectAll = 'select all'
const selectNone = 'select none'
const tooManyCategories = 'too many categories to display'

let contextTrigger = null;

const toggleMenu = ev => {
    if (contextTrigger) {
        contextTrigger.handleContextClick(ev);
    }
}

const trigger = onTrigger => {

    // Render the context menu trigger on the hovered shortlist entry.
    var trigger =
        <div>
            <ContextMenuTrigger
                id = 'shortEntryMenuTrigger'
                ref = {c => contextTrigger = c}
            >
                <button
                    onClick = {ev => {
                        onTrigger(ev)
                        toggleMenu(ev)
                    }}
                    className = 'entryMenuTrigger'
                >
                ☰
                </button>
            </ContextMenuTrigger>
        </div>;
    return trigger;
}

const filterByRange = (active, dataType, filterBy, filterValues, onFilter) => {
    
    // Render the filter by range item.
    // Only for continuous data types.
    if (!active || (dataType !== 'continuous')) {
        return null
    }
    let label = (filterBy === 'range') ? '✓ Filter by Range' : 'Filter by Range'
    let item =
        <MenuItem
            data = {{by: 'range'}}
            onClick = {onFilter}
        >
            {label}
        </MenuItem>
    
    return item;
}
const filterByThreshold = (active, dataType, filterBy, filterValues,
    onFilter) => {
}
const filterByCategoryValue = (item, i, filterValues, onFilter) => {

    // Render one category name.
    let attributes = null
    let disabled = false
    if (item === selectAll || item === selectNone) {
        attributes = {style: {fontStyle: 'italic'}}
    } else if (item === tooManyCategories) {
        attributes = {className: 'error'}
        disabled = true
    }
    let menuItem =
        <MenuItem
            data = {{value: item, by: 'category'}}
            onClick = {onFilter}
            key = {i}
            preventClose = {true}
            attributes = {attributes}
            disabled = {disabled}
        >
            { (filterValues && filterValues.indexOf(item) > -1) ?
                '✓ ' + item : item }
        </MenuItem>
        ;
    return menuItem
}

const filterByCategory = (active, dataType, filterBy, filterList, filterValues,
    onMain, onFilter) => {

    // Render the category filter submenu and list of categories.
    // For binary and categorical data types.
    if (!active || (dataType === 'continuous')) {
        return null
    }
    var submenu = <SubMenu
        title = { (filterBy === 'category') ?
            '✓ Filter by Category' : 'Filter by Category' }
        onClick = {onMain}
        data = {{by: 'category'}}
        hoverDelay = {0}
    >
        { filterList.map((item, i) =>
            filterByCategoryValue(item, i, filterValues, onFilter)
        ) }
    </SubMenu>

    return submenu;
}

const filterByAttrValue = (dataType, filterList, filterValue, onFilter) => {
    var items = null
    if (filterList && filterList.length > 0) {
        items = filterList.map((item, i) =>
            <MenuItem
                data = {{value: item, by: 'attr'}}
                onClick = {onFilter}
                key = {i}
            >
                { (item === filterValue) ? '✓ ' + item : item }
            </MenuItem>
        );

    } else {
        var msg
        if (dataType === 'binary') {
            msg = 'Add another binary attribute to short list'
        } else {
            msg = 'Add a binary attribute to short list'
        }
        items =
            <MenuItem
                attributes = {{className: 'error'}}
            >
                {msg}
            </MenuItem>
    }
    return items
}

const filterByAttr = (active, dataType, filterBy, filterList, filterValues,
    onMain, onFilter) => {
    if (!active) {
        return null
    }
    let submenu = <SubMenu
        title = { (filterBy === 'attr') ?
            '✓ Filter by Attribute' : 'Filter by Attribute' }
        onClick = {onMain}
        data = {{by: 'attr'}}
        hoverDelay = {0}
    >
        { filterByAttrValue(dataType, filterList, filterValues,
            onFilter) }
    </SubMenu>
    
    return submenu;
}

const handleClick = (ev, data) => {
    console.log('handleClick():data:', data)
}

const menuItem = (label, clickHandler, menuItemId) => {
    let item =
        <MenuItem
            data = {{id: menuItemId}}
            onClick = {clickHandler}
        >
            {label}
        </MenuItem>
    return item
}

const ShortEntryMenu = ({ active, dataType, filterBy, filterLists, filterValues,
    onTrigger, onMain, onFilter}) => (
    <div>
        { trigger(onTrigger) }
        <ContextMenu
            id = "shortEntryMenuTrigger"
            className = 'entryMenu'
            hideOnLeave = {true}
        >
            { filterByRange(active, dataType, filterBy, filterValues,
                onMain, onFilter) }
                
            { filterByThreshold(active, dataType, filterBy, filterValues,
                onMain, onFilter) }
                
            { filterByCategory(active, dataType, filterBy, filterLists.category,
                filterValues, onMain, onFilter) }
                
            { filterByAttr(active, dataType, filterBy, filterLists.attr,
                filterValues, onMain, onFilter) }

            { menuItem('Set Operation', handleClick, 'setOperation') }

        </ContextMenu>
    </div>
)

ShortEntryMenu.propTypes = {
    active: PropTypes.bool,        // menu attr is actively coloring
    dataType: PropTypes.string,    // dataType of the menu attr
    filterBy: PropTypes.string,    // group to filter by
    filterLists: PropTypes.object, // lists from which to select a filter value
    filterValues: PropTypes.node,  // filter values

    onTrigger: PropTypes.func,
    onMain: PropTypes.func,
    onFilter: PropTypes.func,
}

export default ShortEntryMenu;
