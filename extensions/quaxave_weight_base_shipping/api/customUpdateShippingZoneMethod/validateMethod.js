const validate = require('../customAddShippingZone/validateMethod');

module.exports = async (request, response, deledate, next) => validate(request, response, deledate, next);
