var winston = require('winston');
winston.emitErrs = true;
var logger = new winston.Logger({
    transports: [
        new winston.transports.File({
            name: 'error-file',
            level: 'error',
            filename: './logs/error.log',
            handleExceptions: true,
            json: true,
            maxsize: 5242880, //5MB
            maxFiles: 5,
            colorize: false,
            eol: "\r\n",
            tailable: true
        }),
        new winston.transports.File({
            name: 'info-file',
            level: 'info',
            silent: true,
            filename: './logs/info.log',
            handleExceptions: true,
            json: true,
            maxsize: 5242880, //5MB
            maxFiles: 5,
            colorize: false,
            eol: "\r\n",
            tailable: true
        }),
        new winston.transports.Console({
            level: 'debug',
            handleExceptions: true,
            json: false,
            colorize: true
        })
    ],
    exitOnError: false
});

module.exports = logger;
module.exports.stream = {
    write: function(message, encoding) {
        console.log(message);
        console.log(encoding);
        logger.info(message);
    }
};