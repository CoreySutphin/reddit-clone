const moment = require('moment');
moment().format();

module.exports = {
  timeSince: function(dateToCalc) {
    return moment(dateToCalc).fromNow();
  }
}
