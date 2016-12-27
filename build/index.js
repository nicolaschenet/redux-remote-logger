"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var ramda_1 = require("ramda");
var deep_diff_1 = require("deep-diff");
var ReduxRemoteLogger = (function () {
    function ReduxRemoteLogger(options) {
        this.currentState = {};
        this.defaultOptions = {
            aggregatorURL: '',
            excludedActionTypes: []
        };
        this.queue = [];
        this.options = __assign({}, this.defaultOptions, options);
    }
    ReduxRemoteLogger.prototype.log = function (action, nextState) {
        var timestamp = new Date().getTime();
        var stateDiff = deep_diff_1.diff(this.currentState, nextState);
        var type = action.type;
        this.queue = ramda_1.append({
            action: action,
            timestamp: timestamp,
            stateDiff: stateDiff
        }, this.queue);
        this.currentState = nextState;
        return this.flush();
    };
    ReduxRemoteLogger.prototype.flush = function () {
        while (this.queue.length !== 0) {
            var data = ramda_1.head(this.queue.splice(0, 1));
            try {
                fetch(this.options.aggregatorURL, {
                    method: 'post',
                    headers: {
                        'content-type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                this.flush();
            }
            catch (error) {
                console.error(error);
            }
        }
    };
    ReduxRemoteLogger.prototype.startLogger = function () {
        var _this = this;
        return function (store) { return function (next) { return function (action) {
            var result = next(action);
            if (ramda_1.contains(action.type, _this.options.excludedActionTypes)) {
                return result;
            }
            _this.log(action, store.getState());
            return result;
        }; }; };
    };
    return ReduxRemoteLogger;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ReduxRemoteLogger;
