Module.register("MMM-Snowboy", {
    defaults: {
        snowboy: [
            {
                hotwords: "smartmirror", //this will be sended to other module for distinguishing which hotword is detected.
                file: "resources/models/smart_mirror.umdl",
                sensitivity: '0.5',
            },
            {
                hotwords: "snowboy",
                file: "resources/models/snowboy.umdl",
                sensitivity: '0.5',
            },
        ],
        record: {
            sampleRate    : 16000,      // audio sample rate
            threshold     : 0.5,        // silence threshold (rec only)
            thresholdStart: null,       // silence threshold to start recording, overrides threshold (rec only)
            thresholdEnd  : null,       // silence threshold to end recording, overrides threshold (rec only)
            silence       : 1.0,        // seconds of silence before ending
            verbose       : false,      // log info to the console
            recordProgram : 'arecord',  // Defaults to 'arecord' - also supports 'rec' and 'sox'
            device        : null,        // recording device (e.g.: 'plughw:1')

        },
        autostart: true,
        autorestart: false,
        recordTest: false, //If set as true, You can test whether Mic device is working properly.
        notifications: {
            PAUSE: "HOTWORD_PAUSE",
            RESUME: "HOTWORD_RESUME",
            LISTENING : "HOTWORD_LISTENING",
            SLEEPING : "HOTWORD_SLEEPING",
            ERROR : "HOTWORD_ERROR",
        },
        onDetect: {
            notification: (payload) => {
                return "HOTWORD_DETECTED"
            },
            payload: (payload) => {
                return payload
            }
        },
    },

    notificationReceived: function(notification, payload, sender) {
        switch(notification) {
            case 'ALL_MODULES_STARTED':
                if(this.config.autostart === true) {
                    this.sendSocketNotification('RESUME')
                }
                break;
            case this.config.notifications.RESUME:
                this.sendSocketNotification('RESUME');
                break;
            case this.config.notifications.PAUSE:
                this.sendSocketNotification('PAUSE');
                break
        }
    },

    socketNotificationReceived: function(notification, payload) {
        switch(notification) {
            case 'INITIALIZED':
                break;
            case 'NOT_PAUSED':
                this.sendNotification(this.config.notifications.LISTENING);
                break;
            case 'NOT_RESUMED':
                this.sendNotification(this.config.notifications.SLEEPING);
                break;
            case 'RESUMED':
                this.sendNotification(this.config.notifications.LISTENING);
                break;
            case 'PAUSED':
                this.sendNotification(this.config.notifications.SLEEPING);
                break;
            case 'DETECTED':
                var on = this.config.onDetect;
                var noti = (typeof on.notification == "function") ? on.notification(payload) : on.notification
                var pl
                if (on.payload) {
                    pl = (typeof on.payload == "function") ? on.payload(payload) : on.payload
                } else {
                    pl = payload
                }
                this.sendNotification(noti, pl)
                break;
            case 'ERROR':
                this.sendNotification(this.config.notifications.ERROR, payload);
                console.error('[SNOWBOY] :: (error)', payload);
                break
        }
    },

    start: function () {
        this.isInitialized = 0;
        this.config = this.configAssignment({}, this.defaults, this.config);
        this.sendSocketNotification('INIT', this.config);
    },

    configAssignment : function (result) {
        var stack = Array.prototype.slice.call(arguments, 1);
        var item;
        var key;

        while (stack.length) {
            item = stack.shift();
            for (key in item) {
                if (item.hasOwnProperty(key)) {
                    if (
                        typeof result[key] === 'object'
                        && result[key]
                        && Object.prototype.toString.call(result[key]) !== '[object Array]'
                    ) {
                        if (typeof item[key] === 'object' && item[key] !== null) {
                            result[key] = this.configAssignment({}, result[key], item[key]);
                        } else {
                            result[key] = item[key];
                        }
                    } else {
                        result[key] = item[key];
                    }
                }
            }
        }
        return result;
    },
});
