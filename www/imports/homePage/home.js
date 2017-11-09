// Handle the home page.

import NavBar from '/imports/common/navBar.js';
import CreateMap from '/imports/mapPage/calc/createMap.js';
import Util from '/imports/common/util.js';

import '/imports/homePage/home.html';
import '/imports/homePage/home.css';

Template.homePage.onRendered(function () {
    NavBar.init();
    CreateMap.init();  // TODO why?
});

Template.homePage.helpers({
    projects: function () {
        return [
            { id: 'Pancan12/SampleMap', png: 'pancan12.png' },
            { id: 'Pancan12/GeneMap', png: 'pancan12gene.png' },
            { id: 'Gliomas', png: 'gliomas-paper.png' },
            { id: 'QuakeBrain', png: 'QuakeBrain.png' },
            { id: 'pCHIPS', png: 'pchips.png' },
            { id: 'mgmarin_public/PCAWG_JuncBASE_CassetteExonPSIs',
                label: 'PCAWG JuncBASE CassetteExonPSIs',
                linkAnchor: 'PCAWGJuncBASE',
                png: 'PCAWG_JuncBASE.png' },
        ];
    },
    id: function () {
        return this.id;
    },
    label: function () {
        if (this.label) {
            return this.label;
        } else {
            return this.id;
        }
    },
    png: function () {
        return this.png;
    },
    linkAnchor: function () {
        if (this.linkAnchor) {
            return this.linkAnchor.toLowerCase();
        } else if (this.label) {
            return this.label.toLowerCase();
        } else {
            return this.id.toLowerCase();
        }
    },
    version: function () {
        if (DEV) {
            return VERSION + ' DEV';
        } else {
            return VERSION;
        }
    },
});

exports.init = function () {
    Blaze.render(Template.homePage, $('body')[0]);
    Util.googleAnalytics();
};
