
// initMapPage.js
// Initialization for the map page.

import Project from '/imports/reactCandidates/project.js';

import '/imports/legacy/htmlCss/aHexagram.css';
import '/imports/legacy/htmlCss/colorsFont.css';
import '/imports/legacy/htmlCss/navBar.html';
import '/imports/legacy/htmlCss/navBar.css';
import '/imports/legacy/htmlCss/hexagram.html';
import '/imports/legacy/htmlCss/jobs.html';

exports.init = function () {
    Project.init();
}
