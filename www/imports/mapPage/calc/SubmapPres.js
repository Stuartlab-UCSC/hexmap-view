
// Presentational component for the short list entry context menu.

import React from 'react'
import PropTypes from 'prop-types'
import Modal from '/imports/components/Modal'

import '/imports/components/modal.css'

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


const SubmenuPres = ({ able, onKeyPress}) => (
    <div
        onKeyPress = {onKeyPress}
    >
        <Modal
            isOpen = {self.state.isOpen}
            onRequestClose = {self.handleCloseModal}
            body = {
                <div>
                    {this.renderPromptStr(self)}
                </div>
            }
            buttons = {
                <div>
                    <button
                        onClick = {self.handleOkButtonClick}
                        className = 'defaultButton'
                    >
                        OK
                    </button>
                    <button
                        onClick = {self.handleCancelButtonClick}
                    >
                        Cancel
                    </button>
                </div>
            }
        />
    </div>
)

SubmenuPres.propTypes = {
    able: PropTypes.array,           // capabilities to determine menu items
    onTrigger: PropTypes.func,
}

export default SubmenuPres;
