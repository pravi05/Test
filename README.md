# TK-API-V1
APIs for Tentkotta Website: https://www.tentkotta.com. To be used by various apps and integration along with Website.

# Testing Lambda Function
To test lambda functions, you do not need to start/restart local server.
Instead, install lambda-local pkg as per https://www.npmjs.com/package/lambda-local . Note: This is one time step.
Now, run 'lambda-local -l index.js -h handler -e samples/search.js'

