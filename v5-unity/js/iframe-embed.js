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
/* TODO

- test the resizeContainer option

*/
require('../css/opt-frontend.css');
// need to directly import the class for typechecking to work
var opt_frontend_common_1 = require("./opt-frontend-common");
var optFrontend; // singleton IframeEmbedFrontend object
var IframeEmbedFrontend = (function (_super) {
    __extends(IframeEmbedFrontend, _super);
    function IframeEmbedFrontend(resizeContainer) {
        var _this = _super.call(this) || this;
        _this.originFrontendJsFile = 'iframe-embed.js';
        _this.resizeContainer = false;
        _this.resizeContainer = resizeContainer;
        _this.appMode = 'display'; // peg to display mode by default so that redrawConnectors can work
        return _this;
    }
    IframeEmbedFrontend.prototype.executeCode = function (forceStartingInstr, forceRawInputLst) {
        if (forceStartingInstr === void 0) { forceStartingInstr = undefined; }
        if (forceRawInputLst === void 0) { forceRawInputLst = undefined; }
        var queryStrOptions = optFrontend.getQueryStringOptions();
        var preseededCode = queryStrOptions.preseededCode;
        var pyState = queryStrOptions.py;
        var verticalStackBool = (queryStrOptions.verticalStack == 'true');
        var heapPrimitivesBool = (queryStrOptions.heapPrimitives == 'true');
        var textRefsBool = (queryStrOptions.textReferences == 'true');
        var cumModeBool = (queryStrOptions.cumulative == 'true');
        var drawParentPointerBool = (queryStrOptions.drawParentPointers == 'true');
        var codeDivWidth = undefined;
        var cdw = $.bbq.getState('codeDivWidth');
        if (cdw) {
            codeDivWidth = Number(cdw);
        }
        var codeDivHeight = undefined;
        var cdh = $.bbq.getState('codeDivHeight');
        if (cdh) {
            codeDivHeight = Number(cdh);
        }
        var startingInstruction = queryStrOptions.preseededCurInstr;
        if (!startingInstruction) {
            startingInstruction = 0;
        }
        // set up all options in a JS object
        var backendOptionsObj = { cumulative_mode: cumModeBool,
            heap_primitives: heapPrimitivesBool,
            show_only_outputs: false,
            origin: this.originFrontendJsFile };
        var frontendOptionsObj = { startingInstruction: startingInstruction,
            embeddedMode: true,
            verticalStack: verticalStackBool,
            disableHeapNesting: heapPrimitivesBool,
            drawParentPointers: drawParentPointerBool,
            textualMemoryLabels: textRefsBool,
            executeCodeWithRawInputFunc: this.executeCodeWithRawInput.bind(this),
            heightChangeCallback: (this.resizeContainer ?
                this.resizeContainerNow.bind(this) : undefined),
            codeDivWidth: codeDivWidth,
            codeDivHeight: codeDivHeight,
        };
        if (forceStartingInstr) {
            frontendOptionsObj.startingInstruction = forceStartingInstr;
        }
        this.executeCodeAndCreateViz(preseededCode, pyState, backendOptionsObj, frontendOptionsObj, 'vizDiv');
    };
    IframeEmbedFrontend.prototype.finishSuccessfulExecution = function () {
        if (this.resizeContainer) {
            this.resizeContainerNow();
        }
        this.redrawConnectors();
    };
    IframeEmbedFrontend.prototype.handleUncaughtException = function (trace) {
        // NOP
    };
    // David Pritchard's code for resizeContainer option ...
    IframeEmbedFrontend.prototype.resizeContainerNow = function () {
        function findContainer() {
            var ifs = window.top.document.getElementsByTagName("iframe");
            for (var i = 0, len = ifs.length; i < len; i++) {
                var f = ifs[i];
                var fDoc = f.contentDocument || f.contentWindow.document;
                if (fDoc === document) {
                    return f;
                }
            }
        }
        var container = findContainer();
        $(container).height($("html").height());
    };
    return IframeEmbedFrontend;
}(opt_frontend_common_1.AbstractBaseFrontend)); // END class IframeEmbedFrontend
$(document).ready(function () {
    var resizeContainer = ($.bbq.getState('resizeContainer') == 'true');
    optFrontend = new IframeEmbedFrontend(resizeContainer);
    // also fires when you resize the jQuery UI slider, interesting!
    $(window).resize(optFrontend.redrawConnectors.bind(optFrontend));
    optFrontend.executeCodeFromScratch(); // finally, execute code and display visualization
});
//# sourceMappingURL=iframe-embed.js.map