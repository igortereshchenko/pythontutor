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
// customized version of opt-frontend.js for ../composingprograms.html
var opt_shared_sessions_1 = require("./opt-shared-sessions");
var footer_html_1 = require("./footer-html");
var OptFrontendComposingprograms = (function (_super) {
    __extends(OptFrontendComposingprograms, _super);
    function OptFrontendComposingprograms(params) {
        if (params === void 0) { params = {}; }
        var _this = this;
        params.disableLocalStorageToggles = true;
        _this = _super.call(this, params) || this;
        _this.originFrontendJsFile = 'composingprograms.js';
        return _this;
    }
    OptFrontendComposingprograms.prototype.getBaseBackendOptionsObj = function () {
        var ret = { cumulative_mode: ($('#cumulativeModeSelector').val() == 'true'),
            heap_primitives: false,
            show_only_outputs: false,
            origin: this.originFrontendJsFile };
        return ret;
    };
    OptFrontendComposingprograms.prototype.getBaseFrontendOptionsObj = function () {
        var ret = { compactFuncLabels: true,
            showAllFrameLabels: true,
            disableHeapNesting: false,
            textualMemoryLabels: false,
            executeCodeWithRawInputFunc: this.executeCodeWithRawInput.bind(this),
            updateOutputCallback: function () { $('#urlOutput,#urlOutputShortened,#embedCodeOutput').val(''); },
            startingInstruction: 0,
            // always use the same visualizer ID for all
            // instantiated ExecutionVisualizer objects,
            // so that they can sync properly across
            // multiple clients using TogetherJS in shared sessions.
            // this shouldn't lead to problems since only ONE
            // ExecutionVisualizer will be shown at a time
            visualizerIdOverride: '1',
        };
        return ret;
    };
    return OptFrontendComposingprograms;
}(opt_shared_sessions_1.OptFrontendSharedSessions)); // END Class OptFrontendComposingprograms
exports.OptFrontendComposingprograms = OptFrontendComposingprograms;
$(document).ready(function () {
    $("#footer").append(footer_html_1.footerHtml); // initialize all HTML before creating OptFrontend object
    var optFrontend = new OptFrontendComposingprograms();
    optFrontend.setSurveyHTML();
});
//# sourceMappingURL=composingprograms.js.map