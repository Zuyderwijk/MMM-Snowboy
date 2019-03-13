'use strict';

const path = require('path');
const record = require('node-record-lpcm16');
const Detector = require('snowboy').Detector;
const Models = require('snowboy').Models;

const Notifications = {
    INIT: 'INIT',
    INITIALIZED: 'INITIALIZED',
    RESUME: 'RESUME',
    RESUMED: 'RESUMED',
    NOT_RESUMED: 'NOT_RESUMED',
    PAUSE: 'PAUSE',
    PAUSED: 'PAUSED',
    NOT_PAUSED: 'NOT_PAUSED',
    ALL_MODULES_INIT: 'ALL_MODULES_STARTED',
    DETECT: 'DETECTED'
};

var NodeHelper = require("node_helper");

module.exports = NodeHelper.create({
    start: function () {
        this.config = {};
        this.status = 'OFF';
        this.restart = false;
        console.log(this.name + " is at your service!");
    },

    loadInit: function(config) {
        this.config = config;
        this.restart = this.config.autorestart
    },

    socketNotificationReceived: function(notification, payload) {
        switch(notification) {

            case 'INIT':
                this.loadInit(payload);
                this.sendSocketNotification('INITIALIZED');
                break;
            case 'RESUME':
                if (this.status === 'OFF') {
                    this.status = 'ON';
                    this.activate();
                    this.sendSocketNotification('RESUMED')
                } else {
                    this.sendSocketNotification('NOT_RESUMED')
                }
                break;
            case 'PAUSE':
                if (this.status === 'ON') {
                    this.status = 'OFF';
                    this.deactivate();
                    this.sendSocketNotification('PAUSED')
                } else {
                    this.sendSocketNotification('NOT_PAUSED')
                }
                break
        }
    },

    activate: function() {
        const recordTest = this.config.recordTest;
        const models = new Models();

        this.config.snowboy.forEach((model) => {
            model.file = path.resolve(__dirname, model.file);
            models.add(model);
        });

        let microphone = record.start(this.config.record);

        const detector = new Detector({
            resource: path.resolve(__dirname, "resources/common.res"),
            models: models,
            audioGain: 2.0,
        });
        console.info('[SNOWBOY] :: listening!');
        detector
            .on('silence', () => {
                if (recordTest) {
                    console.warn("[SNOWBOY] :: No sound detected")
                }
            })
            .on('sound', (buffer) => {
                if (recordTest) {
                    console.info("[SNOWBOY] :: Sound detected.")
                }
                //do nothing
            })
            .on('error', (err) => {
                console.error('[SNOWBOY] :: Error detected', err);
                this.stopListening();
                microphone = null;
                this.sendSocketNotification('ERROR', 'DETECTOR');
            })
            .on('hotword', (index, hotword, buffer) => {
                console.info('[SNOWBOY] :: ',hotword, ' detected.');
                if (this.restart === false) {
                    this.stopListening();
                    microphone = null;
                }
                this.sendSocketNotification('DETECTED', {
                    index: index,
                    hotword: hotword
                });
            });

        microphone.pipe(detector);
    },

    deactivate: function() {
        this.stopListening()

    },

    stopListening: function() {
        record.stop();
        this.status = 'OFF';
        console.warn('[SNOWBOY] :: Stopped listening');
    }
})
