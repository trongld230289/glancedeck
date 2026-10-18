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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
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
var testing_1 = require("claude-code/testing");
var PANE = {
    component: 'Pane',
    requestId: 'glancedeck',
    props: {
        title: 'GLANCEDECK',
        isFocused: true,
        bodyColumns: 58,
        placement: 'dock',
        scroll: { bodyRows: 60, offset: 0, contentRows: 0 },
        view: {},
    },
};
var BAND = {
    component: 'AbovePrompt',
    props: {
        hasSurvey: false,
        isWorking: false,
        maxRows: 10,
        bodyColumns: 100,
        scroll: { bodyRows: 10, offset: 0, contentRows: 0 },
        view: {},
    },
};
/** A session on D:/Project/glanceline with an in-memory disk; returns the disk, the clock and what was submitted. */
function world(on) {
    var clock = testing_1.mock.clock(on, { now: Date.UTC(2026, 9, 18, 3, 0, 0) });
    testing_1.mock.env(on, { USERPROFILE: 'C:\\Users\\t', OS: 'Windows_NT' });
    var files = new Map();
    var submitted = [];
    var toasts = [];
    on('session.cwd', function () { return ({ value: 'D:/Project/glanceline' }); });
    on('fs.read', function (_, e) {
        var text = files.get(e.path);
        return text === undefined ? { deny: "no such file: ".concat(e.path) } : { value: text };
    });
    on('fs.write', function (_, e) {
        files.set(e.path, e.text);
        return { value: undefined };
    });
    on('prompt.submit', function (_, e) {
        submitted.push(__assign({ text: e.text }, (e.origin.kind === 'plugin' && e.origin.asUser ? { asUser: true } : {})));
        return { text: e.text };
    });
    on('ui.toast', function (_, e) {
        toasts.push(e.text);
        return { value: undefined };
    });
    on('tool.call', function (_, e) { return (e.tool === 'Bash' ? { isError: true, result: 'exit 1', text: 'exit 1' } : { result: { ok: true } }); });
    on('turn.complete', function () { return ({ text: '' }); });
    on('turn.start', function () { return ({ turnId: 't1' }); });
    on('session.start', function () { return ({ cwd: 'D:/Project/glanceline' }); });
    on('command.register', function () { return ({ value: undefined }); });
    on('agent.spawn', function () { return ({ agentId: 'bg1', model: 'claude-haiku-5-5' }); });
    return {
        clock: clock,
        files: files,
        submitted: submitted,
        toasts: toasts,
        queueText: function () { var _a, _b; return (_b = (_a = __spreadArray([], files.entries(), true).find(function (_a) {
            var p = _a[0];
            return /[\\/]\.glancedeck[\\/]queues[\\/]glanceline-/.test(p);
        })) === null || _a === void 0 ? void 0 : _a[1]) !== null && _b !== void 0 ? _b : ''; },
    };
}
var q = function ($, args) { return $.command.run({ command: 'q', args: args }); };
var turnStart = function ($) { return $.turn.start({ text: 'làm việc', turnId: 't1' }); };
var turnEnd = function ($, extra) {
    if (extra === void 0) { extra = {}; }
    return $.turn.complete(__assign({ reason: 'answer', answer: '', durationMs: 1, isAborted: false, turnId: 't1' }, extra));
};
(0, testing_1.test)('/q while idle counts down 5 seconds, then sends the text as the person', function ($, on) { return __awaiter(void 0, void 0, void 0, function () {
    var w, band, _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                w = world(on);
                return [4 /*yield*/, q($, 'viết test cho install.py')];
            case 1:
                _b.sent();
                return [4 /*yield*/, $.ui.mount(__assign({ plugin: 'glancedeck', surface: 'terminal' }, BAND))];
            case 2:
                band = _b.sent();
                _a = testing_1.expect;
                return [4 /*yield*/, band.find({ text: /sắp gửi/ })];
            case 3:
                _a.apply(void 0, [_b.sent()]).toBeDefined();
                return [4 /*yield*/, band.unmount()];
            case 4:
                _b.sent();
                (0, testing_1.expect)(w.submitted).toEqual([]);
                return [4 /*yield*/, w.clock.advance(5000)];
            case 5:
                _b.sent();
                (0, testing_1.expect)(w.submitted).toEqual([{ text: 'viết test cho install.py', asUser: true }]);
                (0, testing_1.expect)(JSON.parse(w.queueText()).items).toEqual([]);
                (0, testing_1.expect)(JSON.parse(w.queueText()).sent.length).toBe(1);
                return [2 /*return*/];
        }
    });
}); });
(0, testing_1.test)('items wait for the turn and for background agents, then go one at a time', function ($, on) { return __awaiter(void 0, void 0, void 0, function () {
    var w;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                w = world(on);
                return [4 /*yield*/, turnStart($)];
            case 1:
                _a.sent();
                return [4 /*yield*/, q($, 'một')];
            case 2:
                _a.sent();
                return [4 /*yield*/, q($, 'hai')];
            case 3:
                _a.sent();
                return [4 /*yield*/, $.agent.spawn({ prompt: 'p', description: 'Build core', subagentType: 'general-purpose', background: true })];
            case 4:
                _a.sent();
                return [4 /*yield*/, turnEnd($)];
            case 5:
                _a.sent();
                return [4 /*yield*/, w.clock.advance(10000)];
            case 6:
                _a.sent();
                (0, testing_1.expect)(w.submitted).toEqual([]);
                return [4 /*yield*/, turnEnd($, { agentId: 'bg1' })];
            case 7:
                _a.sent();
                return [4 /*yield*/, w.clock.advance(5000)];
            case 8:
                _a.sent();
                (0, testing_1.expect)(w.submitted.map(function (s) { return s.text; })).toEqual(['một']);
                // The sent item starts a turn; the second waits for it to end.
                return [4 /*yield*/, turnStart($)];
            case 9:
                // The sent item starts a turn; the second waits for it to end.
                _a.sent();
                return [4 /*yield*/, w.clock.advance(10000)];
            case 10:
                _a.sent();
                (0, testing_1.expect)(w.submitted.map(function (s) { return s.text; })).toEqual(['một']);
                return [4 /*yield*/, turnEnd($)];
            case 11:
                _a.sent();
                return [4 /*yield*/, w.clock.advance(5000)];
            case 12:
                _a.sent();
                (0, testing_1.expect)(w.submitted.map(function (s) { return s.text; })).toEqual(['một', 'hai']);
                return [2 /*return*/];
        }
    });
}); });
(0, testing_1.test)('--if-ok after a turn with a failed tool call is held, the queue pauses and a toast says why', function ($, on) { return __awaiter(void 0, void 0, void 0, function () {
    var w, stored, pane, _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                w = world(on);
                return [4 /*yield*/, turnStart($)];
            case 1:
                _b.sent();
                return [4 /*yield*/, $.tool.call({ tool: 'Bash', tool_use_id: 'b1', command: 'npm test' })];
            case 2:
                _b.sent();
                return [4 /*yield*/, q($, '--if-ok chạy installer --all-accounts')];
            case 3:
                _b.sent();
                return [4 /*yield*/, turnEnd($)];
            case 4:
                _b.sent();
                return [4 /*yield*/, w.clock.advance(5000)];
            case 5:
                _b.sent();
                (0, testing_1.expect)(w.submitted).toEqual([]);
                (0, testing_1.expect)(w.toasts.some(function (t) { return /lượt trước có lỗi/.test(t); })).toBe(true);
                stored = JSON.parse(w.queueText());
                (0, testing_1.expect)(stored.paused).toBe(true);
                (0, testing_1.expect)(stored.pauseReason).toBe('if-ok');
                return [4 /*yield*/, $.ui.mount(__assign({ plugin: 'glancedeck', surface: 'terminal' }, PANE))];
            case 6:
                pane = _b.sent();
                _a = testing_1.expect;
                return [4 /*yield*/, pane.find({ text: /có lỗi/ })];
            case 7:
                _a.apply(void 0, [_b.sent()]).toBeDefined();
                return [4 /*yield*/, pane.unmount()];
            case 8:
                _b.sent();
                return [2 /*return*/];
        }
    });
}); });
(0, testing_1.test)('Huỷ in the band cancels and pauses; Gửi ngay sends at once', function ($, on) { return __awaiter(void 0, void 0, void 0, function () {
    var w, band;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                w = world(on);
                return [4 /*yield*/, q($, 'một')];
            case 1:
                _a.sent();
                return [4 /*yield*/, $.ui.mount(__assign({ plugin: 'glancedeck', surface: 'terminal' }, BAND))];
            case 2:
                band = _a.sent();
                return [4 /*yield*/, band.press({ key: 'band-cancel' })];
            case 3:
                _a.sent();
                return [4 /*yield*/, band.unmount()];
            case 4:
                _a.sent();
                return [4 /*yield*/, w.clock.advance(10000)];
            case 5:
                _a.sent();
                (0, testing_1.expect)(w.submitted).toEqual([]);
                (0, testing_1.expect)(JSON.parse(w.queueText()).pauseReason).toBe('cancel');
                return [4 /*yield*/, q($, 'resume')];
            case 6:
                _a.sent();
                return [4 /*yield*/, $.ui.mount(__assign({ plugin: 'glancedeck', surface: 'terminal' }, BAND))];
            case 7:
                band = _a.sent();
                return [4 /*yield*/, band.press({ key: 'band-send' })];
            case 8:
                _a.sent();
                return [4 /*yield*/, band.unmount()];
            case 9:
                _a.sent();
                (0, testing_1.expect)(w.submitted.map(function (s) { return s.text; })).toEqual(['một']);
                return [2 /*return*/];
        }
    });
}); });
(0, testing_1.test)('the queue survives a restart: session.start reads it back', function ($, on) { return __awaiter(void 0, void 0, void 0, function () {
    var w, saved, pane, _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                w = world(on);
                return [4 /*yield*/, q($, 'giữ lại qua restart')];
            case 1:
                _c.sent();
                return [4 /*yield*/, q($, 'pause')];
            case 2:
                _c.sent();
                saved = w.queueText();
                return [4 /*yield*/, $.session.start({ cwd: 'D:/Project/glanceline', surface: 'terminal', isInteractive: true })];
            case 3:
                _c.sent();
                (0, testing_1.expect)(w.queueText()).toBe(saved);
                return [4 /*yield*/, $.ui.mount(__assign({ plugin: 'glancedeck', surface: 'terminal' }, PANE))];
            case 4:
                pane = _c.sent();
                _a = testing_1.expect;
                return [4 /*yield*/, pane.find({ text: /giữ lại qua restart/ })];
            case 5:
                _a.apply(void 0, [_c.sent()]).toBeDefined();
                _b = testing_1.expect;
                return [4 /*yield*/, pane.find({ text: /auto off/ })];
            case 6:
                _b.apply(void 0, [_c.sent()]).toBeDefined();
                return [4 /*yield*/, pane.unmount()];
            case 7:
                _c.sent();
                return [2 /*return*/];
        }
    });
}); });
(0, testing_1.test)('over 90% of the 5h window holds the queue, says so once, and goes on by itself after the reset', function ($, on) { return __awaiter(void 0, void 0, void 0, function () {
    var w, resetsAt, pane, _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                w = world(on);
                resetsAt = Date.UTC(2026, 9, 18, 3, 30, 0);
                on('session.usage', function () { return ({
                    value: {
                        startedAt: 0,
                        context: { window: 200000 },
                        rateLimits: [{ kind: 'five_hour', percentUsed: 93, resetsAt: new Date(resetsAt).toISOString() }],
                    },
                }); });
                return [4 /*yield*/, q($, 'chạy test sau khi reset')];
            case 1:
                _c.sent();
                return [4 /*yield*/, w.clock.advance(10000)];
            case 2:
                _c.sent();
                (0, testing_1.expect)(w.submitted).toEqual([]);
                (0, testing_1.expect)(w.toasts.filter(function (t) { return /5h đã dùng 93%/.test(t); }).length).toBe(1);
                return [4 /*yield*/, $.ui.mount(__assign({ plugin: 'glancedeck', surface: 'terminal' }, PANE))];
            case 3:
                pane = _c.sent();
                _a = testing_1.expect;
                return [4 /*yield*/, pane.find({ text: /dừng: 5h 93%/ })];
            case 4:
                _a.apply(void 0, [_c.sent()]).toBeDefined();
                _b = testing_1.expect;
                return [4 /*yield*/, pane.find({ text: /chạy lại sau 30m/ })];
            case 5:
                _b.apply(void 0, [_c.sent()]).toBeDefined();
                return [4 /*yield*/, pane.unmount()
                    // A second item while held: still no second toast.
                ];
            case 6:
                _c.sent();
                // A second item while held: still no second toast.
                return [4 /*yield*/, q($, 'việc thứ hai')];
            case 7:
                // A second item while held: still no second toast.
                _c.sent();
                (0, testing_1.expect)(w.toasts.filter(function (t) { return /5h đã dùng/.test(t); }).length).toBe(1);
                // The window resets: the stale 93% no longer holds the queue.
                return [4 /*yield*/, w.clock.set(resetsAt + 2000)];
            case 8:
                // The window resets: the stale 93% no longer holds the queue.
                _c.sent();
                return [4 /*yield*/, w.clock.advance(5000)];
            case 9:
                _c.sent();
                (0, testing_1.expect)(w.submitted.map(function (s) { return s.text; })).toEqual(['chạy test sau khi reset']);
                return [2 /*return*/];
        }
    });
}); });
