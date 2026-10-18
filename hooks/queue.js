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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectKey = exports.newId = exports.move = exports.keepToday = exports.fire = exports.shouldStart = exports.isFree = exports.normalizeQueue = exports.parseQ = exports.isUsageBlocked = exports.fiveHourOf = exports.USAGE_LIMIT = exports.IDLE = exports.EMPTY_QUEUE = void 0;
exports.EMPTY_QUEUE = { items: [], paused: false, pauseReason: null, sent: [] };
exports.IDLE = {
    isTurnRunning: false,
    background: [],
    isAsking: false,
    turnErrors: 0,
    lastTurnOk: true,
    countdown: null,
    fiveHour: null,
    isQueueOwner: true,
    question: null,
};
/** Above this share of the 5-hour window the queue holds, until the window resets. */
exports.USAGE_LIMIT = 90;
/** The 5-hour reading from the rate-limit windows the last API response reported; null when there is none. */
var fiveHourOf = function (limits) {
    var w = limits.find(function (l) { return l.kind === 'five_hour'; });
    if (!w)
        return null;
    var at = w.resetsAt ? Date.parse(w.resetsAt) : NaN;
    return { percent: w.percentUsed, resetsAt: Number.isFinite(at) ? at : null };
};
exports.fiveHourOf = fiveHourOf;
/**
 * Over the limit and the window has not reset yet. The reading only moves when a request is made,
 * and a held queue makes none, so once the reset time passes the stale reading no longer holds it.
 */
var isUsageBlocked = function (rt, now) {
    return rt.fiveHour !== null && rt.fiveHour.percent > exports.USAGE_LIMIT && (rt.fiveHour.resetsAt === null || now < rt.fiveHour.resetsAt);
};
exports.isUsageBlocked = isUsageBlocked;
var parseQ = function (args) {
    var a = args.trim();
    if (a === '' || a === 'help' || a === '--help')
        return { kind: 'help' };
    if (a === 'list' || a === 'clear' || a === 'pause' || a === 'resume')
        return { kind: a };
    var m = /^--if-ok\s+([\s\S]+)$/.exec(a);
    if (m === null || m === void 0 ? void 0 : m[1])
        return { kind: 'add', text: m[1].trim(), ifOk: true };
    if (a === '--if-ok')
        return { kind: 'help' };
    return { kind: 'add', text: a, ifOk: false };
};
exports.parseQ = parseQ;
/** Reads a stored file leniently: anything malformed becomes the empty queue's field. */
var normalizeQueue = function (x) {
    var o = typeof x === 'object' && x !== null ? x : {};
    var items = Array.isArray(o.items)
        ? o.items.filter(function (i) {
            return typeof i === 'object' && i !== null && typeof i.id === 'string' && typeof i.text === 'string';
        })
        : [];
    var sent = Array.isArray(o.sent)
        ? o.sent.filter(function (s) { return typeof s === 'object' && s !== null && typeof s.text === 'string'; })
        : [];
    var reason = o.pauseReason;
    return {
        items: items.map(function (i) { return (__assign(__assign({}, i), { ifOk: i.ifOk === true })); }),
        paused: o.paused === true,
        pauseReason: reason === 'user' || reason === 'cancel' || reason === 'if-ok' || reason === 'usage' ? reason : null,
        sent: sent,
    };
};
exports.normalizeQueue = normalizeQueue;
/** The session is free for the next item: no turn, no background agent, no open question, no countdown. */
var isFree = function (rt) { return !rt.isTurnRunning && rt.background.length === 0 && !rt.isAsking && rt.countdown === null; };
exports.isFree = isFree;
var shouldStart = function (q, rt, now) { var _a; return rt.isQueueOwner && !q.paused && q.items.length > 0 && !((_a = q.items[0]) === null || _a === void 0 ? void 0 : _a.isBlocked) && (0, exports.isFree)(rt) && !(0, exports.isUsageBlocked)(rt, now); };
exports.shouldStart = shouldStart;
/**
 * The countdown for `id` ran out (or the person pressed send-now): send the head item, or hold it
 * when it is --if-ok and the last turn failed. Anything else that changed meanwhile means no send.
 */
var fire = function (q, rt, id, now, isForced) {
    if (isForced === void 0) { isForced = false; }
    var head = q.items[0];
    if (!head || head.id !== id)
        return { kind: 'none' };
    if (!isForced && (q.paused || rt.isTurnRunning || rt.background.length > 0 || rt.isAsking || (0, exports.isUsageBlocked)(rt, now)))
        return { kind: 'none' };
    if (head.ifOk && !rt.lastTurnOk && !isForced) {
        return {
            kind: 'block',
            item: head,
            queue: __assign(__assign({}, q), { paused: true, pauseReason: 'if-ok', items: __spreadArray([__assign(__assign({}, head), { isBlocked: true })], q.items.slice(1), true) }),
        };
    }
    return {
        kind: 'send',
        item: head,
        queue: __assign(__assign({}, q), { items: q.items.slice(1), sent: (0, exports.keepToday)(__spreadArray(__spreadArray([], q.sent, true), [{ text: head.text, at: now }], false), now) }),
    };
};
exports.fire = fire;
var dayOf = function (at) { return new Date(at).toDateString(); };
var keepToday = function (sent, now) { return sent.filter(function (s) { return dayOf(s.at) === dayOf(now); }).slice(-50); };
exports.keepToday = keepToday;
var move = function (q, id, by) {
    var i = q.items.findIndex(function (x) { return x.id === id; });
    var j = i + by;
    if (i < 0 || j < 0 || j >= q.items.length)
        return q;
    var items = __spreadArray([], q.items, true);
    var _a = [items[i], items[j]], a = _a[0], b = _a[1];
    if (!a || !b)
        return q;
    items[i] = b;
    items[j] = a;
    return __assign(__assign({}, q), { items: items });
};
exports.move = move;
var newId = function (now, n) { return "".concat(now.toString(36)).concat(n.toString(36)); };
exports.newId = newId;
/** A file name for the project: its folder name plus a short hash of the whole path, so two `app` folders differ. */
var projectKey = function (cwd) {
    var norm = cwd.replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase();
    var h = 0;
    for (var i = 0; i < norm.length; i += 1)
        h = (Math.imul(h, 31) + norm.charCodeAt(i)) | 0;
    var base = (norm.split('/').pop() || 'root').replace(/[^a-z0-9._-]/g, '_');
    return "".concat(base, "-").concat((h >>> 0).toString(36));
};
exports.projectKey = projectKey;
