// mainHex.js

var app = app || {};
(function (hex) { // jshint ignore: line
Hex = (function () { // jshint ignore: line
 
    var VERSION = 'Version 1.0';
 
    Template.localStoreT.created = function () {
        // This template is only used to initialize state
        if (_.isNull(ctx)) { ctx = initState(); }
    };

    Template.body.helpers({
        page: function () {
            return Session.get('page');
        },
    });

    function queryFreeReload () {

        Session.set('loadingMap', true);

        // Strip everything after the query string question mark in the href
        // & reload
        var href = window.location.href,
            quest = href.indexOf('?');
        ctx.save();
        if (quest > -1) {
            href = href.slice(0, href.indexOf('?'));
            window.location.assign(href);
        } else {
            window.location.reload();
        }
    }

    function pageReload (page) {
        ctx.save(page);
        queryFreeReload();
    }

     function loadProject (project) {
        ctx.project = project;
        Session.set('page', 'mapPage');
        queryFreeReload();
    }
 
    Template.body.events({

        // Reload so global variables get reset and release memory
        // TODO we should not require a reload, however we don't yet have a
        // method to clear the appropriate state and reload does this for us
        "click .homePage": function () {
            pageReload('homePage');
        },
        "click .mapPage": function() {
            pageReload('mapPage');
        },

        "click .thumbnail": function (ev){
            var project = $(ev.currentTarget).data('project') + '/';
            loadProject(project);
        },
        "click .gridPage": function() {
            pageReload('gridPage');
        },
    });

    Template.homePage.onRendered(function () {
        Tool.init();
        Download.init();
        CreateMap.init();
    });

    Template.mapPage.onRendered(function () {
        Meteor.autorun(function () {
            if (GoogleMaps.loaded()) {
                initMainMapContainer();
            }
        });
        Project.init();
        GoogleMaps.load({ key: GOOGLE_API_KEY });  // browser key
        Tool.init();
    });

    Template.gridPage.onRendered(function () {
        Meteor.autorun(function () {
            if (GoogleMaps.loaded()) {
                initGridMapContainer();
            }
        });
        GoogleMaps.load({ key: GOOGLE_API_KEY });  // browser key
        Tool.init();
    });

    Template.navBarT.helpers({
        loadingMap: function () {
            if (Session.get('loadingMap')) {
                return 'block';
            } else {
                return 'none';
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

    Template.homePage.helpers({
        projects: function () {
            return [
                { id: 'Pancan12/SampleMap', png: 'pancan12.png' },
                { id: 'Pancan12/GeneMap', png: 'pancan12gene.png' },
                { id: 'Gliomas', png: 'gliomas-paper.png' },
                { id: 'QuakeBrain', png: 'QuakeBrain.png' },
                { id: 'pCHIPS', png: 'pCHIPS.png' },
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

    Template.headerT.helpers({
        sort: function () {
            return Session.get('sort');
        },
        nodeCount: function () {
            return Session.get('nodeCount');
        },
    });

    function resizeMap () {

        // Set the initial map size and capture any resize window event so
        // the map gets resized too.
        var windowHt = $(window).height(),
            navHt = $('#navBar').height(),
            headerHt = $('#header').height();
        $('#mapContent').height(windowHt - navHt - headerHt - 1);
        $('#gridContent').height(windowHt - navHt);
    }

    // Phase 6 init: Autotracker to find when the basic UI is drawn
    Session.set('initedHexagons', false);
    Session.set('initialiedLayers', false);
    Session.set('initedColormaps', false);
    function isUiDrawn (autorun) {
        if (Session.get('initedHexagons') &&
            Session.get('retrievedLayerInfo') &&
            Session.get('initedColormaps')) {
            autorun.stop();
            Meteor.setTimeout(function () {
 
                initMap();
     
                // Turn off the loading progress wheel
                setTimeout(function () {
                    Session.set('loadingMap', false);
                }, 500);

                // Initialize the background functions.
                initOverlayNodes();
                initOverlayNodeUi();
                initLegend();
                Shortlist.init();
                initCoords();
                CheckLayerBox.init();
                Reflect.init();
                Tool.initLabelTool();
                Download.init();
                Colors.init();
                initInfoWindow();
                initSetOperations();
                CreateMap.init();
                Select.init();
                initGchart();
                initBookmark();
                Jobs.init();
                //initDiffAnalysis();
            }, 0);
        }
    }
    Meteor.autorun(isUiDrawn);
 
    // Phase 5 init: Autotracker to find when the layers are initialized
    Session.set('initedLayerTypes', false);
    Session.set('initedLayersArray', false);
    function areLayersInitialized (autorun) {
        if (Session.get('initedLayerTypes') &&
            Session.get('initedLayersArray')) {
            autorun.stop();
 
            initSortAttrs();
            initFilter();
            initLayerLists();
            Session.set('retrievedLayerInfo', true);
        }
    }
    Meteor.autorun(areLayersInitialized);

    // Phase 4 init: Autotracker to find when the layer index is initialized
    Session.set('initedLayerIndex', false);
    function isLayerIndexInitialized (autorun) {
        if (Session.get('initedLayerIndex')) {
            autorun.stop();
 
            initLayersArray();
        }
    }
    Meteor.autorun(isLayerIndexInitialized);
 
    // Phase 3 init: Autotracker to find when the layout is initialized
    Session.set('initedLayout', false);
    function isLayoutInitialized (autorun) {
        if (Session.get('initedLayout')) {
            autorun.stop();
 
            initHexagons();
        }
    }
    Meteor.autorun(isLayoutInitialized);
 
    // Phase 2 init: Autotracker to find when the map prep is complete
    Session.set('initedProject', false);
    Session.set('initedMapContainer', false);
    Session.get('initedMapType', false);
    function areWeReadyForMap (autorun) {
        if (Session.get('initedProject') &&
            Session.get('initedMapContainer') &&
            Session.get('initedMapType')) {
            autorun.stop();
 
            initMapType();
            initLayout();
            initHex();
            initLayerTypes();
            initLayerIndex();
            initColormaps();
        }
    }
    Meteor.autorun(areWeReadyForMap);

    // Phase 1 init: when meteor has been rendered
    // For a graphical view see:
    // https://docs.google.com/presentation/d/1BrHDwcyGkmxD2MeimZ9bU3OPN3KJ85-wPpZxFy0yhmg/edit#slide=id.g12d3244251_0_30
    function initMainMapContainer () { // jshint ignore: line
        setTimeout(function () { // The timeout allows the google libs to load
            resizeMap();
            $(window).resize(resizeMap);
            $('#shortlist_holder').css('top', $('#navBar').height());
            ctx.center = centerToLatLng(ctx.center);
            Session.set('initedMapContainer', true);
        }, 0);
    }

    function initGridMapContainer () { // jshint ignore: line
        setTimeout(function () { // The timeout allows the google libs to load
            $(window).resize(resizeMap);
            ctx.gridCenter = centerToLatLng(ctx.gridCenter);
            initGrid();
            
            // Resize the map to fill the available space
            Meteor.setTimeout(resizeMap, 0);
        }, 0);
    }

return { // Public methods

    loadProject: loadProject,
    pageReload: pageReload,
 
    bookmarkReload: function (bookmark) {
        if (bookmark.slice(0,9) === 'localhost') {
            bookmark = 'http://' + bookmark;
        }
        window.location.assign(bookmark);
    },
};
}());
})(app);

