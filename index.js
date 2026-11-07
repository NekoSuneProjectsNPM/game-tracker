'use strict';

const { createTracker } = require('./src/tracker');
const { TrackerError } = require('./src/client');

// Default CommonJS export: const APEX = require('@nekosuneprojects/apex-api')
module.exports = createTracker;
module.exports.createTracker = createTracker;
module.exports.TrackerError = TrackerError;
