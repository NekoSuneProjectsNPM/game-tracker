'use strict';
const {createZenlessZoneZero}=require('./src/tracker');
module.exports=createZenlessZoneZero;
module.exports.ZenlessZoneZero=createZenlessZoneZero;
module.exports.createTracker=createZenlessZoneZero;
