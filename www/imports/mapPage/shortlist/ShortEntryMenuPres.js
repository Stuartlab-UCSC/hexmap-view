
// Presentational component for the short list entry context menu.

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

const filterByRange = (able, filterChecked, onMainMenu) => {

    // Render the range filter menu item for continuous data types.
    if (able.indexOf('range') < 0) {
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

const applyThresholds = (able, filterChecked, onMainMenu) => {

    // Render the threshold menu item for continuous data types.
    if (able.indexOf('threshold') < 0) {
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
    let label = (filterValues && filterValues.indexOf(item) > -1) ?
         '✓ ' + item : item
    let attributes = null
    let disabled = false
    let style = {padding: '0.3em 0.7em'}
    
    if (item === selectAll || item === selectNone) {
        style.fontStyle = 'italic'
    } else if (item === tooManyCategories) {
        attributes = {className: 'error'}
        disabled = true
    }
    
    let items =
        <option
            value = {item}
            key = {i}
            data = {{by: 'category'}}
            attributes = {attributes}
            style = {style}
            disabled = {disabled}
        >
            { label }
        </option>
    return items
}

const filterByCategoryList = (filterList, filterValues, onFilterValue) => {

    // Render the category list.
    let attributes = {
        className: 'scrollable select',
        fontSize: '1.1em',
        
    }
    let menuItem =
        <MenuItem
            data = {{by: 'categoryList'}}
            preventClose = {true}
            attributes = {attributes}
        >
            <select
                onChange = {onFilterValue}
                data = {{by: 'category'}}
                multiple = {true}
                style = {{fontSize: '1.1em', height: '100%'}}
            >
                { filterList.map((item, i) =>
                    filterByCategoryValue(item, i, filterValues, onFilterValue)
                )}
            </select>
        </MenuItem>
    
    return menuItem
}

const filterByCategory = (able, filterChecked, filterList, filterValues,
    onMainMenu, onFilterValue) => {

    // Render the category filter submenu and list of categories.
    if (able.indexOf('category') < 0) {
        return null
    }
    let title = 'Filter by Category'
    let attributes = {
        title: 'Only include nodes with certain categories',
        classList: 'scrollable',
        padding: 0,
        margin: 0,
    }
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
        { filterByCategoryList(filterList, filterValues, onFilterValue) }
    </SubMenu>

    return submenu;
}

const createFilterAttr = (able, anyFilters, onClick) => {

    // Render the 'create attr from filter' menu option.
    if (able.indexOf('createFilterAttr') < 0) {
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
            Create Attribute from Filter
        </MenuItem>
    return item
}

const hideBgNodes = (able, onClick) => {

    // Render the 'hide background colors' menu option.
    let label = 'Hide Background Nodes'
    if (able.indexOf('hideBgNodes') > -1) {
        label = '✓ ' + label
    } else if (able.indexOf('showBgNodes') < 0) {
        return null
    }
    let item =
        <MenuItem
            data = {{id: 'hideBgNodes'}}
            attributes = {{
                title: 'Hide the nodes with no data or not passing filters'}}
            onClick = {onClick}
        >
            {label}
        </MenuItem>
    return item
}

const menuItem = (able, id, label, title, onClick) => {
    if (able.indexOf(id) < 0) {
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

const ShortEntryMenuPres = ({ able, filterChecked, filterList, filterValues,
    onTrigger, onMainMenu, onFilterValue, anyFilters}) => (
    <div>
        { trigger(onTrigger) }
        <ContextMenu
            id = "shortEntryMenuTrigger"
            className = 'entryMenu'
            hideOnLeave = {true}
        >        
            { hideBgNodes(able, onMainMenu) }
            <hr></hr>
            { applyThresholds(able, filterChecked, onMainMenu) }
            { filterByRange(able, filterChecked, onMainMenu) }
            { filterByCategory(able, filterChecked, filterList,
                filterValues, onMainMenu, onFilterValue) }
            { createFilterAttr(able, anyFilters, onMainMenu) }
            <hr></hr>
            { menuItem(able, 'setOperation', 'Set Operation',
                "Perform a set operation on two attributes", onMainMenu) }
            { menuItem(able, 'correlationSort', 'Correlation Sort',
                "Sort attributes by correlation", onMainMenu) }
            { menuItem(able, 'reflection', 'Reflect onto Another Map',
                'Reflect this attribute onto another map', onMainMenu) }
            <hr></hr>
            { menuItem(able, 'editColors', 'Edit Colors',
                "Change colors for this attribute", onMainMenu) }
            { menuItem(able, 'download', 'Download',
                "Download the attribute's values", onMainMenu) }

        </ContextMenu>
    </div>
)

ShortEntryMenuPres.propTypes = {
    able: PropTypes.array,           // capabilities to determine menu items
    filterChecked: PropTypes.string, // group to filter by
    filterList: PropTypes.array,     // list from which to select a filter value
    filterValues: PropTypes.node,    // filter values
    anyFilters: PropTypes.bool,      // whether any filters exist or not

    onTrigger: PropTypes.func,
    onMainMenu: PropTypes.func,
    onFilterValue: PropTypes.func,
}

export default ShortEntryMenuPres;
