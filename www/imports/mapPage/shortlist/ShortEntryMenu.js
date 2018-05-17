
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

const filterByRange = (dataType, filterChecked, onMainMenu) => {

    // Render the range filter menu item for continuous data types.
    if (!dataType || (dataType !== 'continuous')) {
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

const applyThresholds = (dataType, filterChecked, onMainMenu) => {

    // Render the threshold menu item for continuous data types.
    if (!dataType || (dataType !== 'continuous')) {
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

const filterByCategory = (dataType, filterChecked, filterList,
    filterValues, onMainMenu, onFilterValue) => {

    // Render the category filter submenu and list of categories.
    // For binary and categorical data types.
    if (!dataType || (dataType === 'continuous')) {
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

const createFilterAttr = (onClick, anyFilters) => {
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

const ShortEntryMenu = ({ dataType, filterChecked, filterList, filterValues,
    onTrigger, onMainMenu, onFilterValue, anyFilters}) => (
    <div>
        { trigger(onTrigger) }
        <ContextMenu
            id = "shortEntryMenuTrigger"
            className = 'entryMenu'
            hideOnLeave = {true}
        >        
            { applyThresholds(dataType, filterChecked, onMainMenu) }
            { filterByRange(dataType, filterChecked, onMainMenu) }
            { filterByCategory(dataType, filterChecked, filterList,
                filterValues, onMainMenu, onFilterValue) }
            { createFilterAttr(onMainMenu, anyFilters) }

        </ContextMenu>
    </div>
)

ShortEntryMenu.propTypes = {
    dataType: PropTypes.string,      // dataType of the menu attr
    filterChecked: PropTypes.string, // group to filter by
    filterList: PropTypes.array,     // list from which to select a filter value
    filterValues: PropTypes.node,    // filter values
    anyFilters: PropTypes.bool,      // whether any filters exist or not

    onTrigger: PropTypes.func,
    onMainMenu: PropTypes.func,
    onFilterValue: PropTypes.func,
}

export default ShortEntryMenu;
