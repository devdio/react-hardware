/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactHardwareTagHandles
 * @flow
 */
'use strict';

var invariant = require('fbjs/lib/invariant');
var warning = require('fbjs/lib/warning');

/**
 * Keeps track of allocating and associating native "tags" which are numeric,
 * unique view IDs. All the native tags are negative numbers, to avoid
 * collisions, but in the JS we keep track of them as positive integers to store
 * them effectively in Arrays. So we must refer to them as "inverses" of the
 * native tags (that are * normally negative).
 *
 * It *must* be the case that every `rootNodeID` always maps to the exact same
 * `tag` forever. The easiest way to accomplish this is to never delete
 * anything from this table.
 * Why: Because `dangerouslyReplaceNodeWithMarkupByID` relies on being able to
 * unmount a component with a `rootNodeID`, then mount a new one in its place,
 */
var INITIAL_TAG_COUNT = 1;
var ReactHardwareTagHandles = {
  tagsStartAt: INITIAL_TAG_COUNT,
  tagCount: INITIAL_TAG_COUNT,

  allocateTag: function(): number {
    // Skip over root IDs as those are reserved for native
    /*
    while (this.reactTagIsHardwareTopRootID(ReactHardwareTagHandles.tagCount)) {
      ReactHardwareTagHandles.tagCount++;
    }
    */
    var tag = ReactHardwareTagHandles.tagCount;
    ReactHardwareTagHandles.tagCount++;
    return tag;
  },

  /**
   * This associates the *last* observed *native* mounting between `rootNodeID`
   * and some `tag`. This association doesn't imply that `rootNodeID` is still
   * natively mounted as `tag`. The only reason why we don't clear the
   * association when the `rootNodeID` is unmounted, is that we don't have a
   * convenient time to disassociate them (otherwise we would).
   * `unmountComponent` isn't the correct time because that doesn't imply that
   * the native node has been natively unmounted.
   */
  associateRootNodeIDWithMountedNodeHandle: function(
    rootNodeID: ?string,
    tag: ?number
  ) {
    warning(rootNodeID && tag, 'Root node or tag is null when associating');
    if (rootNodeID && tag) {
      ReactHardwareTagHandles.tagToRootNodeID[tag] = rootNodeID;
      ReactHardwareTagHandles.rootNodeIDToTag[rootNodeID] = tag;
    }
  },

  allocateRootNodeIDForTag: function(tag: number): string {
    invariant(
      this.reactTagIsHardwareTopRootID(tag),
      'Expect a native root tag, instead got ', tag
    );
    return '.r[' + tag + ']{TOP_LEVEL}';
  },

  reactTagIsHardwareTopRootID: function(reactTag: number): bool {
    return /^\/dev/.test(reactTag);
    // We reserve all tags that are 1 mod 10 for native root views
    // return reactTag % 10 === 1;
  },

  /**
   * Returns the native `nodeHandle` (`tag`) that was most recently *natively*
   * mounted at the `rootNodeID`. Just because a React component has been
   * mounted, that doesn't mean that its native node has been mounted. The
   * native node is mounted when we actually make the call to insert the
   * `nodeHandle` (`tag`) into the native hierarchy.
   *
   * @param {string} rootNodeID Root node ID to find most recently mounted tag
   * for. Again, this doesn't imply that it is still currently mounted.
   * @return {number} Tag ID of native view for most recent mounting of
   * `rootNodeID`.
   */
  mostRecentMountedNodeHandleForRootNodeID: function(
    rootNodeID: string
  ): number {
    return ReactHardwareTagHandles.rootNodeIDToTag[rootNodeID];
  },

  /* es lint is currently eating it with these types*/
  tagToRootNodeID: [], // ([] : Array<string>),

  rootNodeIDToTag: {}, // ({} : {[key: string]: number})
};

module.exports = ReactHardwareTagHandles;

