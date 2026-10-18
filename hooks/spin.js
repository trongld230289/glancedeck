"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("./core");
var STEP_MS = 100;
var FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
var Spin = function (props, surface) {
    var _a;
    var Text = surface.elements.Text;
    var ref = (_a = surface.state) !== null && _a !== void 0 ? _a : { lastNow: -1, ticks: 0 };
    if (props.now !== ref.lastNow) {
        ref.lastNow = props.now;
        ref.ticks = 0;
    }
    if (surface.state === undefined) {
        surface.setState(ref);
        surface.every(STEP_MS, function () {
            ref.ticks += 1;
            surface.setState(ref);
        });
    }
    var frame = FRAMES[ref.ticks % FRAMES.length];
    var clock = props.since !== undefined ? " ".concat((0, core_1.fmtElapsed)(props.now + ref.ticks * STEP_MS - props.since)) : '';
    return <Text color={props.color} bold={props.bold}>{"".concat(frame).concat(props.label ? " ".concat(props.label) : '').concat(clock)}</Text>;
};
exports.default = Spin;
