"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Ticket = function (props, surface) {
    var _a;
    var _b = surface.elements, Box = _b.Box, Text = _b.Text;
    var ref = (_a = surface.state) !== null && _a !== void 0 ? _a : { lastNow: -1, ticks: 0 };
    if (props.now !== ref.lastNow) {
        ref.lastNow = props.now;
        ref.ticks = 0;
    }
    if (surface.state === undefined) {
        surface.setState(ref);
        surface.every(1000, function () {
            ref.ticks += 1;
            surface.setState(ref);
        });
    }
    var leftMs = Math.max(0, props.endsAt - (props.now + ref.ticks * 1000));
    var seconds = Math.ceil(leftMs / 1000);
    var right = " g\u1EEDi sau ".concat(seconds, "s ");
    var room = Math.max(4, props.width - right.length);
    var label = props.left.length > room ? "".concat(props.left.slice(0, room - 1), "\u2026") : props.left.padEnd(room);
    var line = label + right;
    var litCells = Math.round((leftMs / props.total) * line.length);
    return (<Box>
      <Text color={props.fg} backgroundColor={props.lit} bold>
        {line.slice(0, litCells)}
      </Text>
      <Text color={props.fg} backgroundColor={props.dark} bold>
        {line.slice(litCells)}
      </Text>
    </Box>);
};
exports.default = Ticket;
