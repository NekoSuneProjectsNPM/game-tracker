'use strict';
class TrackerError extends Error {
  constructor(message,{status,cause}={}) {
    super(message,{cause});
    this.name='TrackerError';
    if(status!==undefined)this.status=status;
  }
}
module.exports={TrackerError};
