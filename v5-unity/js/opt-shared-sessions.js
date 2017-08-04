"use strict";
// Python Tutor: https://github.com/pgbovine/OnlinePythonTutor/
// Copyright (C) Philip Guo (philip@pgbovine.net)
// LICENSE: https://github.com/pgbovine/OnlinePythonTutor/blob/master/LICENSE.txt
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
// Implements shared sessions (a.k.a. Codechella)
// VERY IMPORTANT to grab the value of  togetherjsInUrl before loading
// togetherjs-min.js, since loading that file deletes #togetherjs from URL
// NB: kinda gross global
var togetherjsInUrl = !!(window.location.hash.match(/^#togetherjs/)); // turn into bool
if (togetherjsInUrl) {
    console.log("togetherjsInUrl!");
}
require('script-loader!./lib/togetherjs/togetherjs-min.js');
exports.TogetherJS = window.TogetherJS;
var opt_frontend_common_1 = require("./opt-frontend-common");
var opt_frontend_1 = require("./opt-frontend");
var pytutor_1 = require("./pytutor");
var OptFrontendSharedSessions = (function (_super) {
    __extends(OptFrontendSharedSessions, _super);
    function OptFrontendSharedSessions(params) {
        if (params === void 0) { params = {}; }
        var _this = _super.call(this, params) || this;
        _this.executeCodeSignalFromRemote = false;
        _this.togetherjsSyncRequested = false;
        _this.pendingCodeOutputScrollTop = null;
        _this.updateOutputSignalFromRemote = false;
        _this.initTogetherJS();
        _this.pyInputAceEditor.getSession().on("change", function (e) {
            // unfortunately, Ace doesn't detect whether a change was caused
            // by a setValue call
            if (exports.TogetherJS.running) {
                exports.TogetherJS.send({ type: "codemirror-edit" });
            }
        });
        // NB: don't sync changeScrollTop for Ace since I can't get it working yet
        //this.pyInputAceEditor.getSession().on('changeScrollTop', () => {
        //  if (typeof TogetherJS !== 'undefined' && TogetherJS.running) {
        //    $.doTimeout('codeInputScroll', 100, function() { // debounce
        //      // note that this will send a signal back and forth both ways
        //      // (there's no easy way to prevent this), but it shouldn't keep
        //      // bouncing back and forth indefinitely since no the second signal
        //      // causes no additional scrolling
        //      TogetherJS.send({type: "codeInputScroll",
        //                       scrollTop: pyInputGetScrollTop()});
        //    });
        //  }
        //});
        // add an additional listener in addition to whatever the superclass/ added
        window.addEventListener("hashchange", function (e) {
            if (exports.TogetherJS.running && !_this.isExecutingCode) {
                exports.TogetherJS.send({ type: "hashchange",
                    appMode: _this.appMode,
                    codeInputScrollTop: _this.pyInputGetScrollTop(),
                    myAppState: _this.getAppState() });
            }
        });
        return _this;
    }
    // important overrides to inject in pieces of TogetherJS functionality
    OptFrontendSharedSessions.prototype.ignoreAjaxError = function (settings) {
        if (settings.url.indexOf('togetherjs') > -1) {
            return true;
        }
        else {
            return _super.prototype.ignoreAjaxError.call(this, settings);
        }
    };
    OptFrontendSharedSessions.prototype.logEditDelta = function (delta) {
        _super.prototype.logEditDelta.call(this, delta);
        if (exports.TogetherJS.running) {
            exports.TogetherJS.send({ type: "editCode", delta: delta });
        }
    };
    OptFrontendSharedSessions.prototype.startExecutingCode = function (startingInstruction) {
        if (startingInstruction === void 0) { startingInstruction = 0; }
        if (exports.TogetherJS.running && !this.executeCodeSignalFromRemote) {
            exports.TogetherJS.send({ type: "executeCode",
                myAppState: this.getAppState(),
                forceStartingInstr: startingInstruction,
                rawInputLst: this.rawInputLst });
        }
        _super.prototype.startExecutingCode.call(this, startingInstruction);
    };
    OptFrontendSharedSessions.prototype.updateAppDisplay = function (newAppMode) {
        _super.prototype.updateAppDisplay.call(this, newAppMode); // do this first!
        // now this.appMode should be canonicalized to either 'edit' or 'display'
        if (this.appMode === 'edit') {
            // pass
        }
        else if (this.appMode === 'display') {
            pytutor_1.assert(this.myVisualizer);
            if (!exports.TogetherJS.running) {
                $("#surveyHeader").show();
            }
            if (this.pendingCodeOutputScrollTop) {
                this.myVisualizer.domRoot.find('#pyCodeOutputDiv').scrollTop(this.pendingCodeOutputScrollTop);
                this.pendingCodeOutputScrollTop = null;
            }
            $.doTimeout('pyCodeOutputDivScroll'); // cancel any prior scheduled calls
            // TODO: this might interfere with experimentalPopUpSyntaxErrorSurvey (2015-04-19)
            this.myVisualizer.domRoot.find('#pyCodeOutputDiv').scroll(function (e) {
                var elt = $(this);
                // debounce
                $.doTimeout('pyCodeOutputDivScroll', 100, function () {
                    // note that this will send a signal back and forth both ways
                    if (exports.TogetherJS.running) {
                        // (there's no easy way to prevent this), but it shouldn't keep
                        // bouncing back and forth indefinitely since no the second signal
                        // causes no additional scrolling
                        exports.TogetherJS.send({ type: "pyCodeOutputDivScroll",
                            scrollTop: elt.scrollTop() });
                    }
                });
            });
        }
        else {
            pytutor_1.assert(false);
        }
    };
    OptFrontendSharedSessions.prototype.finishSuccessfulExecution = function () {
        var _this = this;
        pytutor_1.assert(this.myVisualizer);
        this.myVisualizer.add_pytutor_hook("end_updateOutput", function (args) {
            if (_this.updateOutputSignalFromRemote) {
                return [true]; // die early; no more hooks should run after this one!
            }
            if (exports.TogetherJS.running && !_this.isExecutingCode) {
                exports.TogetherJS.send({ type: "updateOutput", step: args.myViz.curInstr });
            }
            return [false]; // pass through to let other hooks keep handling
        });
        // do this late since we want the hook in this function to be installed
        // FIRST so that it can run before the hook installed by our superclass
        _super.prototype.finishSuccessfulExecution.call(this);
        // VERY SUBTLE -- reinitialize TogetherJS at the END so that it can detect
        // and sync any new elements that are now inside myVisualizer
        if (exports.TogetherJS.running) {
            exports.TogetherJS.reinitialize();
        }
    };
    OptFrontendSharedSessions.prototype.initTogetherJS = function () {
        var _this = this;
        pytutor_1.assert(exports.TogetherJS);
        if (togetherjsInUrl) {
            $("#ssDiv,#surveyHeader,#adHeader").hide(); // hide ASAP!
            $("#togetherjsStatus").html("Please wait ... loading shared session");
        }
        // clear your name from the cache every time to prevent privacy leaks
        if (opt_frontend_common_1.supports_html5_storage()) {
            localStorage.removeItem('togetherjs.settings.name');
        }
        // This event triggers when you first join a session and say 'hello',
        // and then one of your peers says hello back to you. If they have the
        // exact same name as you, then change your own name to avoid ambiguity.
        // Remember, they were here first (that's why they're saying 'hello-back'),
        // so they keep their own name, but you need to change yours :)
        exports.TogetherJS.hub.on("togetherjs.hello-back", function (msg) {
            if (!msg.sameUrl)
                return; // make sure we're on the same page
            var p = exports.TogetherJS.require("peers");
            var peerNames = p.getAllPeers().map(function (e) { return e.name; });
            if (msg.name == p.Self.name) {
                var newName = undefined;
                var toks = msg.name.split(' ');
                var count = Number(toks[1]);
                // make sure the name is truly unique, incrementing count as necessary
                do {
                    if (!isNaN(count)) {
                        newName = toks[0] + ' ' + String(count + 1); // e.g., "Tutor 3"
                        count++;
                    }
                    else {
                        // the original name was something like "Tutor", so make
                        // newName into, say, "Tutor 2"
                        newName = p.Self.name + ' 2';
                        count = 2;
                    }
                } while ($.inArray(newName, peerNames) >= 0); // i.e., is newName in peerNames?
                p.Self.update({ name: newName }); // change our own name
            }
        });
        exports.TogetherJS.hub.on("updateOutput", function (msg) {
            if (!msg.sameUrl)
                return; // make sure we're on the same page
            if (_this.isExecutingCode) {
                return;
            }
            if (_this.myVisualizer) {
                // to prevent this call to updateOutput from firing its own TogetherJS event
                _this.updateOutputSignalFromRemote = true;
                try {
                    _this.myVisualizer.renderStep(msg.step);
                }
                finally {
                    _this.updateOutputSignalFromRemote = false;
                }
            }
        });
        exports.TogetherJS.hub.on("executeCode", function (msg) {
            if (!msg.sameUrl)
                return; // make sure we're on the same page
            if (_this.isExecutingCode) {
                return;
            }
            _this.executeCodeSignalFromRemote = true;
            try {
                _this.executeCode(msg.forceStartingInstr, msg.rawInputLst);
            }
            finally {
                _this.executeCodeSignalFromRemote = false;
            }
        });
        exports.TogetherJS.hub.on("hashchange", function (msg) {
            if (!msg.sameUrl)
                return; // make sure we're on the same page
            if (_this.isExecutingCode) {
                return;
            }
            console.log("TogetherJS RECEIVE hashchange", msg.appMode);
            if (msg.appMode != _this.appMode) {
                _this.updateAppDisplay(msg.appMode);
                if (_this.appMode == 'edit' && msg.codeInputScrollTop !== undefined &&
                    _this.pyInputGetScrollTop() != msg.codeInputScrollTop) {
                    // hack: give it a bit of time to settle first ...
                    $.doTimeout('pyInputCodeMirrorInit', 200, function () {
                        _this.pyInputSetScrollTop(msg.codeInputScrollTop);
                    });
                }
            }
        });
        exports.TogetherJS.hub.on("codemirror-edit", function (msg) {
            if (!msg.sameUrl)
                return; // make sure we're on the same page
            $("#codeInputWarnings").hide();
            $("#someoneIsTypingDiv").show();
            $.doTimeout('codeMirrorWarningTimeout', 500, function () {
                $("#codeInputWarnings").show();
                $("#someoneIsTypingDiv").hide();
            });
        });
        exports.TogetherJS.hub.on("requestSync", function (msg) {
            // DON'T USE msg.sameUrl check here since it doesn't work properly, eek!
            exports.TogetherJS.send({ type: "myAppState",
                myAppState: _this.getAppState(),
                codeInputScrollTop: _this.pyInputGetScrollTop(),
                pyCodeOutputDivScrollTop: _this.myVisualizer ?
                    _this.myVisualizer.domRoot.find('#pyCodeOutputDiv').scrollTop() :
                    undefined });
        });
        exports.TogetherJS.hub.on("myAppState", function (msg) {
            // DON'T USE msg.sameUrl check here since it doesn't work properly, eek!
            // if we didn't explicitly request a sync, then don't do anything
            if (!_this.togetherjsSyncRequested) {
                return;
            }
            _this.togetherjsSyncRequested = false;
            var learnerAppState = msg.myAppState;
            if (learnerAppState.mode == 'display') {
                if (OptFrontendSharedSessions.appStateEq(_this.getAppState(), learnerAppState)) {
                    // update curInstr only
                    console.log("on:myAppState - app states equal, renderStep", learnerAppState.curInstr);
                    _this.myVisualizer.renderStep(learnerAppState.curInstr);
                    if (msg.pyCodeOutputDivScrollTop !== undefined) {
                        _this.myVisualizer.domRoot.find('#pyCodeOutputDiv').scrollTop(msg.pyCodeOutputDivScrollTop);
                    }
                }
                else if (!_this.isExecutingCode) {
                    console.log("on:myAppState - app states unequal, executing", learnerAppState);
                    _this.syncAppState(learnerAppState);
                    _this.executeCodeSignalFromRemote = true;
                    try {
                        if (msg.pyCodeOutputDivScrollTop !== undefined) {
                            _this.pendingCodeOutputScrollTop = msg.pyCodeOutputDivScrollTop;
                        }
                        _this.executeCode(learnerAppState.curInstr);
                    }
                    finally {
                        _this.executeCodeSignalFromRemote = false;
                    }
                }
            }
            else {
                pytutor_1.assert(learnerAppState.mode == 'edit');
                if (!OptFrontendSharedSessions.appStateEq(_this.getAppState(), learnerAppState)) {
                    console.log("on:myAppState - edit mode sync");
                    _this.syncAppState(learnerAppState);
                    _this.enterEditMode();
                }
            }
            if (msg.codeInputScrollTop !== undefined) {
                // give pyInputAceEditor a bit of time to settle with
                // its new value. this is hacky; ideally we have a callback for
                // when setValue() completes.
                $.doTimeout('pyInputCodeMirrorInit', 200, function () {
                    _this.pyInputSetScrollTop(msg.codeInputScrollTop);
                });
            }
        });
        exports.TogetherJS.hub.on("syncAppState", function (msg) {
            if (!msg.sameUrl)
                return; // make sure we're on the same page
            _this.syncAppState(msg.myAppState);
        });
        exports.TogetherJS.hub.on("codeInputScroll", function (msg) {
            if (!msg.sameUrl)
                return; // make sure we're on the same page
            // don't sync for Ace editor since I can't get it working properly yet
        });
        exports.TogetherJS.hub.on("pyCodeOutputDivScroll", function (msg) {
            if (!msg.sameUrl)
                return; // make sure we're on the same page
            if (_this.myVisualizer) {
                _this.myVisualizer.domRoot.find('#pyCodeOutputDiv').scrollTop(msg.scrollTop);
            }
        });
        $("#sharedSessionBtn").click(this.startSharedSession.bind(this));
        $("#stopTogetherJSBtn").click(exports.TogetherJS); // toggles off
        // fired when TogetherJS is activated. might fire on page load if there's
        // already an open session from a prior page load in the recent past.
        exports.TogetherJS.on("ready", function () {
            console.log("TogetherJS ready");
            $("#sharedSessionDisplayDiv").show();
            $("#adInfo,#ssDiv,#adHeader,#testCasesParent").hide();
            // send this to the server for the purposes of logging, but other
            // clients shouldn't do anything with this data
            if (exports.TogetherJS.running) {
                exports.TogetherJS.send({ type: "initialAppState",
                    myAppState: _this.getAppState(),
                    user_uuid: _this.userUUID,
                    // so that you can tell whether someone else
                    // shared a TogetherJS URL with you to invite you
                    // into this shared session:
                    togetherjsInUrl: togetherjsInUrl }); // kinda gross global
            }
            _this.requestSync(); // immediately try to sync upon startup so that if
            // others are already in the session, we will be
            // synced up. and if nobody is here, then this is a NOP.
            _this.TogetherjsReadyHandler();
            _this.redrawConnectors(); // update all arrows at the end
        });
        // emitted when TogetherJS is closed. This is not emitted when the
        // webpage simply closes or navigates elsewhere, ONLY when TogetherJS
        // is explicitly stopped via a call to TogetherJS()
        exports.TogetherJS.on("close", function () {
            console.log("TogetherJS close");
            $("#togetherjsStatus").html(''); // clear it
            $("#sharedSessionDisplayDiv").hide();
            $("#adInfo,#ssDiv,#adHeader,#testCasesParent").show();
            _this.TogetherjsCloseHandler();
            _this.redrawConnectors(); // update all arrows at the end
        });
    };
    OptFrontendSharedSessions.prototype.requestSync = function () {
        if (exports.TogetherJS.running) {
            this.togetherjsSyncRequested = true;
            exports.TogetherJS.send({ type: "requestSync" });
        }
    };
    OptFrontendSharedSessions.prototype.syncAppState = function (appState) {
        this.setToggleOptions(appState);
        // VERY VERY subtle -- temporarily prevent TogetherJS from sending
        // form update events while we set the input value. otherwise
        // this will send an incorrect delta to the other end and screw things
        // up because the initial states of the two forms aren't equal.
        var orig = exports.TogetherJS.config.get('ignoreForms');
        exports.TogetherJS.config('ignoreForms', true);
        this.pyInputSetValue(appState.code);
        exports.TogetherJS.config('ignoreForms', orig);
        if (appState.rawInputLst) {
            this.rawInputLst = $.parseJSON(appState.rawInputLstJSON);
        }
        else {
            this.rawInputLst = [];
        }
    };
    OptFrontendSharedSessions.prototype.TogetherjsReadyHandler = function () {
        $("#surveyHeader").hide();
        this.populateTogetherJsShareUrl();
    };
    OptFrontendSharedSessions.prototype.TogetherjsCloseHandler = function () {
        if (this.appMode === "display") {
            $("#surveyHeader").show();
        }
    };
    OptFrontendSharedSessions.prototype.startSharedSession = function () {
        $("#ssDiv,#surveyHeader,#adHeader").hide(); // hide ASAP!
        $("#togetherjsStatus").html("Please wait ... loading shared session");
        exports.TogetherJS();
    };
    // return whether two states match, except don't worry about curInstr
    OptFrontendSharedSessions.appStateEq = function (s1, s2) {
        pytutor_1.assert(s1.origin == s2.origin); // sanity check!
        return (s1.code == s2.code &&
            s1.mode == s2.mode &&
            s1.cumulative == s2.cumulative &&
            s1.heapPrimitives == s1.heapPrimitives &&
            s1.textReferences == s2.textReferences &&
            s1.py == s2.py &&
            s1.rawInputLstJSON == s2.rawInputLstJSON);
    };
    OptFrontendSharedSessions.prototype.populateTogetherJsShareUrl = function () {
        // without anything after the '#' in the hash
        var cleanUrl = $.param.fragment(location.href, {}, 2); // 2 means 'override'
        var shareId = exports.TogetherJS.shareId();
        pytutor_1.assert(shareId); // make sure we're not attempting to access shareId before it's set
        var urlToShare = cleanUrl + 'togetherjs=' + shareId;
        $("#togetherjsStatus").html('<div>\
                                 Send the URL below to invite someone to join this shared session:\
                                 </div>\
                                 <input type="text" style="font-size: 10pt; \
                                 font-weight: bold; padding: 4px;\
                                 margin-top: 3pt; \
                                 margin-bottom: 6pt;" \
                                 id="togetherjsURL" size="80" readonly="readonly"/>');
        var extraHtml = '<div style="margin-top: 3px; margin-bottom: 10px; font-size: 8pt;">For best results, do not click or move around too quickly, and press "Force sync" if you get out of sync: <button id="syncBtn" type="button">Force sync</button><br/><a href="https://docs.google.com/forms/d/126ZijTGux_peoDusn1F9C1prkR226897DQ0MTTB5Q4M/viewform" target="_blank">Report bugs and feedback</a> on this shared sessions feature.</div>';
        $("#togetherjsStatus").append(extraHtml);
        $("#togetherjsURL").val(urlToShare).attr('size', urlToShare.length + 20);
        $("#syncBtn").click(this.requestSync.bind(this));
    };
    return OptFrontendSharedSessions;
}(opt_frontend_1.OptFrontend)); // END class OptFrontendSharedSessions
exports.OptFrontendSharedSessions = OptFrontendSharedSessions;
//# sourceMappingURL=opt-shared-sessions.js.map