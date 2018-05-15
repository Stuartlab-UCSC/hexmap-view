
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

const filterByRange = (active, dataType, filterChecked, onMainMenu) => {

    // Render the range filter menu item for continuous data types.
    if (!active || (dataType !== 'continuous')) {
        return null
    }
    let menuItem =
        <MenuItem
            data = {{id: 'range'}}
            onClick = {onMainMenu}
        >
            { (filterChecked === 'range') ?
                '✓ Filter by Range' : 'Filter by Range' }
        </MenuItem>

    return menuItem
}

const filterByThreshold = (active, dataType, filterChecked, onMainMenu) => {

    // Render the threshold filter menu item for continuous data types.
    if (!active || (dataType !== 'continuous')) {
        return null
    }
    let menuItem =
        <MenuItem
            data = {{id: 'threshold'}}
            onClick = {onMainMenu}
        >
            { (filterChecked === 'threshold') ?
                '✓ Filter by Threshold' : 'Filter by Threshold' }
        </MenuItem>

    return menuItem
}

const filterByCategoryValue = (item, i, filterValues, onFilterValue) => {

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
            onClick = {onFilterValue}
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

const filterByCategory = (active, dataType, filterChecked, filterList,
    filterValues, onMainMenu, onFilterValue) => {

    // Render the category filter submenu and list of categories.
    // For binary and categorical data types.
    if (!active || (dataType === 'continuous')) {
        return null
    }
    let title = 'Filter by Category'
    let onClick = null
    let data = null
    let preventClose = true
    
    // If the main menu filter by category is checked...
    if (filterChecked === 'category') {
        title = '✓ ' + title
        onClick = onMainMenu
        data = {id: 'category'}
        preventClose = null
    }
    let submenu = <SubMenu
        title = {title}
        onClick = {onClick}
        data = {data}
        preventClose = {preventClose}
        hoverDelay = {0}
    >
        { filterList.map((item, i) =>
            filterByCategoryValue(item, i, filterValues, onFilterValue)
        ) }
    </SubMenu>

    return submenu;
}

const filterByAttrValue = (dataType, filterList, filterValue,
    onFilterValue) => {
    var items = null
    if (filterList && filterList.length > 0) {
        items = filterList.map((item, i) =>
            <MenuItem
                data = {{value: item, by: 'attr'}}
                onClick = {onFilterValue}
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

const filterByAttr = (active, dataType, filterChecked, filterList, filterValues,
    onMainMenu, onFilterValue) => {
    if (!active) {
        return null
    }
    let title = 'Filter by Attribute'
    let onClick = null
    let data = null
    let preventClose = true

    // If the main menu filter by attr is checked...
    if (filterChecked === 'attr') {
        title = '✓ ' + title
        onClick = onMainMenu
        data = {id: 'attr'}
        preventClose = null
    }
    let submenu = <SubMenu
        title = {title}
        onClick = {onClick}
        data = {data}
        preventClose = {preventClose}
        hoverDelay = {0}
    >
        { filterByAttrValue(dataType, filterList, filterValues,
            onFilterValue) }
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

const ShortEntryMenu = ({ active, dataType, filterChecked, filterLists, filterValues,
    onTrigger, onMainMenu, onFilterValue}) => (
    <div>
        { trigger(onTrigger) }
        <ContextMenu
            id = "shortEntryMenuTrigger"
            className = 'entryMenu'
            hideOnLeave = {true}
        >        
            { filterByRange(active, dataType, filterChecked, onMainMenu) }
            { filterByThreshold(active, dataType, filterChecked, onMainMenu) }
            { filterByCategory(active, dataType, filterChecked, filterLists.category,
                filterValues, onMainMenu, onFilterValue) }
            { filterByAttr(active, dataType, filterChecked, filterLists.attr,
                filterValues, onMainMenu, onFilterValue) }

            { menuItem('Set Operation', handleClick, 'setOperation') }

        </ContextMenu>
    </div>
)

ShortEntryMenu.propTypes = {
    active: PropTypes.bool,          // menu attr is actively coloring
    dataType: PropTypes.string,      // dataType of the menu attr
    filterChecked: PropTypes.string, // group to filter by
    filterLists: PropTypes.object,  // lists from which to select a filter value
    filterValues: PropTypes.node,   // filter values

    onTrigger: PropTypes.func,
    onMainMenu: PropTypes.func,
    onFilterValue: PropTypes.func,
}

export default ShortEntryMenu;
