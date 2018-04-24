// Handle the home page.

import navBar from '/imports/common/navBar';
import createMap from '/imports/mapPage/calc/createMap';
import util from '/imports/common/util';
import utils from '/imports/common/utils';

import '/imports/homePage/home.html';
import '/imports/homePage/home.css';

var proj = [
    {
        id: 'PancanAtlas_SampleMap',
        proj: 'PancanAtlas/SampleMap/',
        label: 'TCGA PanCanAtlas, Cell 2018',
        png: 'pancanAtlas.png',
        layoutIndex: 8,
        searchSuffix: '&layout=Euclidean%20iCluster',
    },
    {
        id: 'Pancan12_GeneMap',
        proj: 'Pancan12/GeneMap/',
        png: 'pancan12gene.png',
    
    },
    {
        id: 'Gliomas',
        proj: 'Gliomas/',
        png: 'gliomas-paper.png',
    },
    {
        id: 'QuakeBrain',
        proj: 'QuakeBrain/',
        png: 'QuakeBrain.png',
    },
    {
        id: 'pCHIPS',
        proj: 'pCHIPS',
        png: 'pchips.png',
    },
    {
        id: 'mgmarin_public_PCAWG_JuncBASE_CassetteExonPSIs',
        proj: 'mgmarin_public/PCAWG_JuncBASE_CassetteExonPSIs/',
        label: 'PCAWG JuncBASE CassetteExonPSIs',
        linkAnchor: 'PCAWGJuncBASE',
        png: 'PCAWG_JuncBASE.png',
    },
];

Template.homePage.onRendered(function () {
    navBar.init();
    createMap.init();
});

Template.homePage.helpers({
    projects: function () {
        return proj;
    },
    id: function () {
        return this.id;
    },
    proj: function () {
        return this.proj;
    },
    layoutIndex: function () {
        return this.layoutIndex;
    },
    searchSuffix: function () {
        return this.searchSuffix;
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
    
    // Add the click handlers for the thumbnails.
    for (var i in proj) {
        $('body').on('click', '#' + proj[i].id, function(ev) {
            let data = ev.target.parentElement.dataset;
            utils.loadProject(data.proj, data.layoutindex, data.searchsuffix);
        });
    }
    util.googleAnalytics();
};
