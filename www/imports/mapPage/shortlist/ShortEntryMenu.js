
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
    ev.clientY = ev.clientY - 10
    if (contextTrigger) {
        contextTrigger.handleContextClick(ev);
    }
}

const trigger = onTrigger => {

    // Render the context menu trigger on the hovered shortlist entry.
    let attributes = {title: 'Options for this attribute'}
    let trigger =
        <div>
            <ContextMenuTrigger
                id = 'shortEntryMenuTrigger'
                attributes = {attributes}
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

const filterByRange = (capability, filterChecked, onMainMenu) => {

    // Render the range filter menu item for continuous data types.
    if (capability.indexOf('range') < 0) {
        return null
    }
    let attributes = {title: 'Only include nodes within a range of values'}
    let menuItem =
        <MenuItem
            data = {{id: 'range', by: 'range'}}
            onClick = {onMainMenu}
            attributes = {attributes}
            preventClose = {true}
        >
            { (filterChecked === 'range') ?
                '✓ Filter by Range' : 'Filter by Range' }
        </MenuItem>

    return menuItem
}

const applyThresholds = (capability, filterChecked, onMainMenu) => {

    // Render the threshold menu item for continuous data types.
    if (capability.indexOf('threshold') < 0) {
        return null
    }
    let attributes = {title: 'Color nodes by applying threshold values'}
    let menuItem =
        <MenuItem
            data = {{id: 'threshold', by: 'threshold'}}
            onClick = {onMainMenu}
            attributes = {attributes}
            preventClose = {true}
        >
            { (filterChecked === 'threshold') ?
                '✓ Apply Thresholds' : 'Apply Thresholds' }
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

const filterByCategory = (capability, filterChecked, filterList,
    filterValues, onMainMenu, onFilterValue) => {

    // Render the category filter submenu and list of categories.
    if (capability.indexOf('category') < 0) {
        return null
    }
    let title = 'Filter by Category'
    let attributes = {title: 'Only include nodes with certain categories'}
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
        attributes = {attributes}
        preventClose = {preventClose}
        hoverDelay = {0}
    >
        { filterList.map((item, i) =>
            filterByCategoryValue(item, i, filterValues, onFilterValue)
        ) }
    </SubMenu>

    return submenu;
}

const createFilterAttr = (capability, anyFilters, onClick) => {

    // Render the 'create attr from filter' menu option.
    if (capability.indexOf('createFilterAttr') < 0) {
        return null
    }
    let attributes = {title: (anyFilters) ?
        'Create a new attribute applying all filters' :
        'There are no filters to save'
    }
    let item =
        <MenuItem
            data = {{id: 'createFilterAttr'}}
            attributes = {attributes}
            onClick = {onClick}
            disabled = {!anyFilters}
        >
            Save Filter
        </MenuItem>
    return item
}

const hideBgNodes = (capability, onClick) => {

    // Render the 'hide background colors' menu option.
    let label = 'Hide Background Nodes'
    if (capability.indexOf('hideBgNodes') > -1) {
        label = '✓ ' + label
    } else if (capability.indexOf('showBgNodes') < 0) {
        return null
    }
    let item =
        <MenuItem
            data = {{id: 'hideBgNodes'}}
            attributes = {{title: 'Hide the nodes not passing filters'}}
            onClick = {onClick}
        >
            {label}
        </MenuItem>
    return item
}

const menuItem = (capability, id, label, title, onClick) => {
    if (capability.indexOf(id) < 0) {
        return null
    }
    let item =
        <MenuItem
            data = {{id: id}}
            attributes = {{title: title}}
            onClick = {onClick}
        >
            {label}
        </MenuItem>
    return item
}

const ShortEntryMenu = ({ capability, filterChecked, filterList, filterValues,
    onTrigger, onMainMenu, onFilterValue, anyFilters}) => (
    <div>
        { trigger(onTrigger) }
        <ContextMenu
            id = "shortEntryMenuTrigger"
            className = 'entryMenu'
            hideOnLeave = {true}
        >        
            { applyThresholds(capability, filterChecked, onMainMenu) }
            { filterByRange(capability, filterChecked, onMainMenu) }
            { filterByCategory(capability, filterChecked, filterList,
                filterValues, onMainMenu, onFilterValue) }
            { createFilterAttr(capability, anyFilters, onMainMenu) }
            { hideBgNodes(capability, onMainMenu) }
            <hr></hr>
            { menuItem(capability, 'setOperation', 'Set Operation',
                "Perform a set operation on two attributes", onMainMenu) }
            { menuItem(capability, 'correlationSort', 'Correlation Sort',
                "Sort attributes by correlation", onMainMenu) }
            { menuItem(capability, 'reflection', 'Reflect onto Another Map',
                'Reflect this attribute onto another map', onMainMenu) }
            <hr></hr>
            { menuItem(capability, 'editColors', 'Edit Colors',
                "Change colors for this attribute", onMainMenu) }
            { menuItem(capability, 'download', 'Download',
                "Download the attribute's values", onMainMenu) }

        </ContextMenu>
    </div>
)

ShortEntryMenu.propTypes = {
    capability: PropTypes.array,     // capabilities to determine menu items
    filterChecked: PropTypes.string, // group to filter by
    filterList: PropTypes.array,     // list from which to select a filter value
    filterValues: PropTypes.node,    // filter values
    anyFilters: PropTypes.bool,      // whether any filters exist or not

    onTrigger: PropTypes.func,
    onMainMenu: PropTypes.func,
    onFilterValue: PropTypes.func,
}

export default ShortEntryMenu;
