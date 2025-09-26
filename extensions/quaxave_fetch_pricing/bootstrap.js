const fetchRate = require('./jobs/fetchRate');

module.exports = () => {
    (async function init() {
        await fetchRate();
    })();
}