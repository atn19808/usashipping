Create an extension with the $ARGUMENTS following this directory structure:

extensions/$ARGUMENTS/
|-- bootstrap.js
|-- api/
|-- graphql/types
|-- migration/
|-- pages/admin
|-- pages/frontStore
|-- services/
|-- package.json

add a minimal bootstrap.js with the addProcessor import ready
```javascript
const { addProcessor } = require('@evershop/evershop/src/lib/util/registry');
module.exports = () => {
    // Register processors here
    // addProcessor('processorName', handlerFunction, priority);
};
```

add the extension to config/default.json under system.extensions with the next available priority number:
"$ARGUMENTS": {"resolve": "extensions/$ARGUMENTS", "enabled": true, "priority": "<next number>"}


add the extension version to package.json
{"name" : "$ARGUMENTS", "version": "0.0.1"}