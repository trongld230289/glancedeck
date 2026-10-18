"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var testing_1 = require("claude-code/testing");
var queue_1 = require("../hooks/queue");
var item = function (id, extra) {
    if (extra === void 0) { extra = {}; }
    return (__assign({ id: id, text: "task ".concat(id), ifOk: false, addedAt: 0 }, extra));
};
var withItems = function () {
    var items = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        items[_i] = arguments[_i];
    }
    return (__assign(__assign({}, queue_1.EMPTY_QUEUE), { items: items }));
};
(0, testing_1.test)('/q parses add, --if-ok and the verbs', function () {
    (0, testing_1.expect)((0, queue_1.parseQ)('viết test cho install.py')).toEqual({ kind: 'add', text: 'viết test cho install.py', ifOk: false });
    (0, testing_1.expect)((0, queue_1.parseQ)('--if-ok  chạy installer')).toEqual({ kind: 'add', text: 'chạy installer', ifOk: true });
    (0, testing_1.expect)((0, queue_1.parseQ)('list')).toEqual({ kind: 'list' });
    (0, testing_1.expect)((0, queue_1.parseQ)('resume')).toEqual({ kind: 'resume' });
    (0, testing_1.expect)((0, queue_1.parseQ)('')).toEqual({ kind: 'help' });
    (0, testing_1.expect)((0, queue_1.parseQ)('--if-ok')).toEqual({ kind: 'help' });
});
(0, testing_1.test)('the next item starts only when the main turn, background agents and questions are all done', function () {
    var q = withItems(item('a'));
    (0, testing_1.expect)((0, queue_1.shouldStart)(q, queue_1.IDLE, 0)).toBe(true);
    (0, testing_1.expect)((0, queue_1.shouldStart)(q, __assign(__assign({}, queue_1.IDLE), { isTurnRunning: true }), 0)).toBe(false);
    (0, testing_1.expect)((0, queue_1.shouldStart)(q, __assign(__assign({}, queue_1.IDLE), { background: ['ag1'] }), 0)).toBe(false);
    (0, testing_1.expect)((0, queue_1.shouldStart)(q, __assign(__assign({}, queue_1.IDLE), { isAsking: true }), 0)).toBe(false);
    (0, testing_1.expect)((0, queue_1.shouldStart)(q, __assign(__assign({}, queue_1.IDLE), { countdown: { id: 'a', endsAt: 1 } }), 0)).toBe(false);
    (0, testing_1.expect)((0, queue_1.shouldStart)(__assign(__assign({}, q), { paused: true }), queue_1.IDLE, 0)).toBe(false);
    (0, testing_1.expect)((0, queue_1.shouldStart)(withItems(item('a', { isBlocked: true })), queue_1.IDLE, 0)).toBe(false);
    (0, testing_1.expect)((0, queue_1.shouldStart)(queue_1.EMPTY_QUEUE, queue_1.IDLE, 0)).toBe(false);
});
(0, testing_1.test)('over 90% of the 5h window holds the queue until the window resets', function () {
    var q = withItems(item('a'));
    var resetsAt = Date.UTC(2026, 9, 18, 12);
    var hot = __assign(__assign({}, queue_1.IDLE), { fiveHour: { percent: 93, resetsAt: resetsAt } });
    (0, testing_1.expect)((0, queue_1.isUsageBlocked)(hot, resetsAt - 1)).toBe(true);
    (0, testing_1.expect)((0, queue_1.shouldStart)(q, hot, resetsAt - 1)).toBe(false);
    (0, testing_1.expect)((0, queue_1.fire)(q, hot, 'a', resetsAt - 1).kind).toBe('none');
    (0, testing_1.expect)((0, queue_1.fire)(q, hot, 'a', resetsAt - 1, true).kind).toBe('send');
    // Past the reset the stale reading no longer holds it.
    (0, testing_1.expect)((0, queue_1.shouldStart)(q, hot, resetsAt)).toBe(true);
    (0, testing_1.expect)((0, queue_1.shouldStart)(q, __assign(__assign({}, queue_1.IDLE), { fiveHour: { percent: 90, resetsAt: resetsAt } }), 0)).toBe(true);
    (0, testing_1.expect)((0, queue_1.fiveHourOf)([
        { kind: 'seven_day', percentUsed: 99 },
        { kind: 'five_hour', percentUsed: 93, resetsAt: new Date(resetsAt).toISOString() },
    ])).toEqual({
        percent: 93,
        resetsAt: resetsAt,
    });
    (0, testing_1.expect)((0, queue_1.fiveHourOf)([])).toBeNull();
});
(0, testing_1.test)('a fire sends the head and records it as sent today', function () {
    var r = (0, queue_1.fire)(withItems(item('a'), item('b')), queue_1.IDLE, 'a', 1000);
    (0, testing_1.expect)(r.kind).toBe('send');
    if (r.kind !== 'send')
        return;
    (0, testing_1.expect)(r.item.id).toBe('a');
    (0, testing_1.expect)(r.queue.items.map(function (i) { return i.id; })).toEqual(['b']);
    (0, testing_1.expect)(r.queue.sent).toEqual([{ text: 'task a', at: 1000 }]);
});
(0, testing_1.test)('--if-ok after a failed turn holds the item and pauses the queue; send-now overrides', function () {
    var _a;
    var q = withItems(item('a', { ifOk: true }), item('b'));
    var bad = __assign(__assign({}, queue_1.IDLE), { lastTurnOk: false });
    var r = (0, queue_1.fire)(q, bad, 'a', 0);
    (0, testing_1.expect)(r.kind).toBe('block');
    if (r.kind !== 'block')
        return;
    (0, testing_1.expect)(r.queue.paused).toBe(true);
    (0, testing_1.expect)(r.queue.pauseReason).toBe('if-ok');
    (0, testing_1.expect)((_a = r.queue.items[0]) === null || _a === void 0 ? void 0 : _a.isBlocked).toBe(true);
    (0, testing_1.expect)((0, queue_1.fire)(q, bad, 'a', 0, true).kind).toBe('send');
});
(0, testing_1.test)('a fire that finds things changed sends nothing', function () {
    var q = withItems(item('a'), item('b'));
    (0, testing_1.expect)((0, queue_1.fire)(q, queue_1.IDLE, 'b', 0).kind).toBe('none');
    (0, testing_1.expect)((0, queue_1.fire)(q, __assign(__assign({}, queue_1.IDLE), { isTurnRunning: true }), 'a', 0).kind).toBe('none');
    (0, testing_1.expect)((0, queue_1.fire)(__assign(__assign({}, q), { paused: true }), queue_1.IDLE, 'a', 0).kind).toBe('none');
});
(0, testing_1.test)('move reorders within bounds', function () {
    var q = withItems(item('a'), item('b'), item('c'));
    (0, testing_1.expect)((0, queue_1.move)(q, 'b', -1).items.map(function (i) { return i.id; })).toEqual(['b', 'a', 'c']);
    (0, testing_1.expect)((0, queue_1.move)(q, 'c', 1)).toBe(q);
    (0, testing_1.expect)((0, queue_1.move)(q, 'zz', 1)).toBe(q);
});
(0, testing_1.test)('a stored file is read leniently and sent history keeps today only', function () {
    var q = (0, queue_1.normalizeQueue)({ items: [{ id: 'a', text: 'x' }, { nope: 1 }], paused: 'yes', pauseReason: 'weird' });
    (0, testing_1.expect)(q.items).toEqual([{ id: 'a', text: 'x', ifOk: false }]);
    (0, testing_1.expect)(q.paused).toBe(false);
    (0, testing_1.expect)(q.pauseReason).toBeNull();
    var day = Date.UTC(2026, 9, 18, 5);
    (0, testing_1.expect)((0, queue_1.keepToday)([
        { text: 'old', at: day - 2 * 86400000 },
        { text: 'new', at: day },
    ], day)).toEqual([{ text: 'new', at: day }]);
});
(0, testing_1.test)('two folders with the same name get different queue files', function () {
    (0, testing_1.expect)((0, queue_1.projectKey)('D:\\Project\\app')).not.toBe((0, queue_1.projectKey)('C:/work/app'));
    (0, testing_1.expect)((0, queue_1.projectKey)('D:\\Project\\App\\')).toBe((0, queue_1.projectKey)('d:/project/app'));
    (0, testing_1.expect)((0, queue_1.projectKey)('D:/Project/acme-web')).toMatch(/^acme-web-[a-z0-9]+$/);
});
