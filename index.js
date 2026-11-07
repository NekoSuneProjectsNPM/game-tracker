'use strict';
const {createTracker,TrackerError}=require('./src/tracker');
const provider=require('./src/provider');

module.exports=createTracker;
module.exports.Warframe=createTracker;
module.exports.createTracker=createTracker;
module.exports.TrackerError=TrackerError;
module.exports.platforms=provider.platforms;
module.exports.worldstateFields=provider.worldstateFields;
module.exports.staticKeys=provider.staticKeys;
