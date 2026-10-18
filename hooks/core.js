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
exports.prettyModel = exports.basename = exports.fmtClock = exports.fmtUntil = exports.fmtElapsed = exports.kTokens = exports.promptText = exports.pushLog = exports.noteTool = exports.applyStep = exports.describeCall = exports.pathOf = exports.shorten = exports.redact = exports.isLogged = exports.EDIT_TOOLS = exports.AGENTS_MAX = exports.LOG_MAX = void 0;
exports.LOG_MAX = 200;
exports.AGENTS_MAX = 24;
var LOGGED_TOOLS = new Set(['Read', 'Edit', 'Write', 'NotebookEdit', 'Bash', 'PowerShell', 'Grep', 'Glob', 'WebFetch', 'WebSearch']);
exports.EDIT_TOOLS = new Set(['Edit', 'Write', 'NotebookEdit']);
var isLogged = function (tool) { return LOGGED_TOOLS.has(tool); };
exports.isLogged = isLogged;
var isObject = function (x) { return typeof x === 'object' && x !== null; };
// Credentials never reach state: a token in a command or URL is masked before it is stored.
var SECRETS = [
    [/\b(sk-ant-[\w-]{6})[\w-]+/g, '$1•••'],
    [/\b(gh[pousr]_)[A-Za-z0-9]{8,}/g, '$1•••'],
    [/((?:api[_-]?key|token|password|secret)\s*[=:]\s*)\S+/gi, '$1•••'],
    [/(\b[a-z][a-z0-9+.-]*:\/\/[^\s/:@]+:)[^\s@]+@/gi, '$1•••@'],
];
var redact = function (s) { return SECRETS.reduce(function (t, _a) {
    var re = _a[0], to = _a[1];
    return t.replace(re, to);
}, s); };
exports.redact = redact;
var shorten = function (s, max) {
    var one = s.replace(/\s+/g, ' ').trim();
    return one.length > max ? "".concat(one.slice(0, max - 1), "\u2026") : one;
};
exports.shorten = shorten;
/** The file a call is about, as given (absolute or relative), or undefined. */
var pathOf = function (input) {
    var _a;
    var i = isObject(input) ? input : {};
    var p = (_a = i.file_path) !== null && _a !== void 0 ? _a : i.notebook_path;
    return typeof p === 'string' ? p : undefined;
};
exports.pathOf = pathOf;
/** One line saying what a call was about: `Edit → glanceline/install.py`, `Bash → npm test`. */
var describeCall = function (tool, input) {
    var _a, _b;
    var i = isObject(input) ? input : {};
    var path = (_b = (_a = (0, exports.pathOf)(input)) === null || _a === void 0 ? void 0 : _a.split(/[\\/]/).slice(-2).join('/')) !== null && _b !== void 0 ? _b : '';
    var what = typeof i.command === 'string'
        ? i.command
        : path || (typeof i.pattern === 'string' ? i.pattern : typeof i.url === 'string' ? i.url : typeof i.query === 'string' ? i.query : '');
    return (0, exports.redact)(what ? "".concat(tool, " \u2192 ").concat((0, exports.shorten)(what, 60)) : tool);
};
exports.describeCall = describeCall;
/** Context is the latest request's whole input; output adds up over the agent's requests. */
var applyStep = function (c, u) {
    var _a, _b, _c, _d;
    var x = u !== null && u !== void 0 ? u : {};
    var ctx = ((_a = x.input_tokens) !== null && _a !== void 0 ? _a : 0) + ((_b = x.cache_read_input_tokens) !== null && _b !== void 0 ? _b : 0) + ((_c = x.cache_creation_input_tokens) !== null && _c !== void 0 ? _c : 0);
    return __assign(__assign({}, c), { ctx: ctx > 0 ? ctx : c.ctx, out: c.out + ((_d = x.output_tokens) !== null && _d !== void 0 ? _d : 0) });
};
exports.applyStep = applyStep;
var noteTool = function (c, text) { return (__assign(__assign({}, c), { tools: __spreadArray(__spreadArray([], c.tools, true), [text], false).slice(-3) })); };
exports.noteTool = noteTool;
var pushLog = function (log, line) { return __spreadArray(__spreadArray([], log, true), [line], false).slice(-exports.LOG_MAX); };
exports.pushLog = pushLog;
/** A prompt's first line for the log; a turn the engine opened with a tagged message is not the person's. */
var promptText = function (text) {
    if (/^\s*<[a-z][\w-]*/i.test(text))
        return null;
    return (0, exports.shorten)(text, 80);
};
exports.promptText = promptText;
var kTokens = function (n) {
    return n >= 1000000 ? "".concat((n / 1000000).toFixed(1), "M") : n >= 1000 ? "".concat(Math.round(n / 1000), "k") : String(n);
};
exports.kTokens = kTokens;
var fmtElapsed = function (ms) {
    var s = Math.max(0, Math.floor(ms / 1000));
    var m = Math.floor(s / 60);
    return m < 60 ? "".concat(m, ":").concat(String(s % 60).padStart(2, '0')) : "".concat(Math.floor(m / 60), "h").concat(String(m % 60).padStart(2, '0'));
};
exports.fmtElapsed = fmtElapsed;
/** Time left, coarse: `46m`, `2h05`. */
var fmtUntil = function (ms) {
    var m = Math.max(1, Math.ceil(ms / 60000));
    return m < 60 ? "".concat(m, "m") : "".concat(Math.floor(m / 60), "h").concat(String(m % 60).padStart(2, '0'));
};
exports.fmtUntil = fmtUntil;
var fmtClock = function (at) {
    var d = new Date(at);
    return [d.getHours(), d.getMinutes(), d.getSeconds()].map(function (n) { return String(n).padStart(2, '0'); }).join(':');
};
exports.fmtClock = fmtClock;
var basename = function (path) {
    return path
        .replace(/[\\/]+$/, '')
        .split(/[\\/]/)
        .pop() || path;
};
exports.basename = basename;
/** `claude-opus-5-5` → `Opus 5.5`; an id it does not know, shortened. */
var prettyModel = function (id) {
    if (!id)
        return 'Claude';
    var m = /claude-([a-z]+)-(\d+)(?:-(\d{1,2}))?(?![\d])/i.exec(id);
    if ((m === null || m === void 0 ? void 0 : m[1]) && m[2])
        return "".concat(m[1].charAt(0).toUpperCase()).concat(m[1].slice(1).toLowerCase(), " ").concat(m[2]).concat(m[3] ? ".".concat(m[3]) : '');
    return (0, exports.shorten)(id, 18);
};
exports.prettyModel = prettyModel;
