'use strict';
const {createTracker,categories}=require('./src/tracker');
module.exports=createTracker;
module.exports.VRChat=createTracker;
module.exports.createTracker=createTracker;
module.exports.categories=categories;
