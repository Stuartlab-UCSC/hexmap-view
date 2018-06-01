
// Presentational component for the short list entry context menu.

import React from 'react';
import PropTypes from 'prop-types';
import { ContextMenu, MenuItem, SubMenu, ContextMenuTrigger }
    from "react-contextmenu";

import '/imports/mapPage/init/contextMenu.css';
import './shortEntry.css';

const selectAll = 'select all'
const selectNone = 'select none'
const tooManyCats = 'too many categories to display'

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

const indexOfCategory = (filterValues, catIn) => {
    let index = -1
    filterValues.find((catName, i) => {
        if (catName === catIn.name) {
            index = i
            return true
        } else {
            return false
        }
    })
    return index
}

const filterByCategoryValue = (item, i, filterValues, onFilterValue) => {

    // Render one category name.
    let attributes = null
    let disabled = false
    if (item.name === selectAll || item.name === selectNone) {
        attributes = { style: {fontStyle: 'italic' }}
    } else if (item.name.slice(0, tooManyCats.length) === tooManyCats) {
        attributes = {className: 'error'}
        disabled = true
    } else {
        attributes = {style: {
            color: (item.color.dark()) ? 'white' : 'black',
            backgroundColor: item.color.hexString(),
        }}
    }
    let menuItem =
        <MenuItem
            data = {{value: item.name, by: 'category'}}
            onClick = {onFilterValue}
            key = {i}
            preventClose = {true}
            attributes = {attributes}
            disabled = {disabled}
        >
            { (filterValues && indexOfCategory(filterValues, item) > -1) ?
                '✓ ' + item.name : item.name }
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

const createFilterAttr = (able, onClick) => {

    // Render the 'create attr from filter' menu option.
    if (able.indexOf('createFilterAttr') < 0) {
        return null
    }
    let item =
        <MenuItem
            data = {{id: 'createFilterAttr'}}
            attributes = {{
                title: 'Create a new attribute applying all filters'}}
            onClick = {onClick}
        >
            Create Attribute from Filter
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

const select = (able, onMainMenu) => {

    // Render the select nodes submenu.
    if (able.indexOf('select') < 0) {
        return null
    }
    let submenu = <SubMenu
        title = 'Create with Selection'
        data = {{id: 'select'}}
        attributes = {{
            title: 'Create an attribute by selecting nodes on the map'}}
        hoverDelay = {0}
    >
        { menuItem(able, 'byRectangle', 'by Rectangle',
            "Select a rectangular region of nodes", onMainMenu) }
        { menuItem(able, 'byPolygon', 'by Polygon',
            "Select a polygonal region of nodes", onMainMenu) }
        { menuItem(able, 'byNodeId', 'by Node IDs',
            "Select nodes by node IDs", onMainMenu) }
    </SubMenu>
    
    return submenu;
}

const ShortEntryMenuPres = ({ able, filterChecked, filterList, filterValues,
    onTrigger, onMainMenu, onFilterValue}) => (
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
            { createFilterAttr(able, onMainMenu) }
            { menuItem(able, 'clearAllFilters', 'Clear All Filters',
                "Remove ALL filters from ALL attributes in the short list",
                onMainMenu) }
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
            <hr></hr>
            { select(able, onMainMenu) }
            { menuItem(able, 'addAttr', 'Add Yours',
                "Add an attribute from your data", onMainMenu) }
            { menuItem(able, 'deleteAttr', 'Delete',
                "Delete this attribute from the short list", onMainMenu) }
            { menuItem(able, 'deleteAllAttrs', 'Delete All',
                "Delete ALL attributes from the short list", onMainMenu) }

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
