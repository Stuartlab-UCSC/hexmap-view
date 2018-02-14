
// This code is for future use and checked in to save it.

//add = require('./add');
import overlayNodes from '/imports/mapPage/calc/overlayNodes';
import rx from '/imports/common/rx';
import shortlist from '/imports/mapPage/shortlist/shortlist';
import urlParms from '/imports/common/urlParms';
import util from '/imports/common/util';
import utils from '/imports/common/utils';

import state from './state';

describe('load_background', () => {
  it('should load background state from store', () => {
    expect(state.load({'background': 'white'})).toBe('white');
  });
});
