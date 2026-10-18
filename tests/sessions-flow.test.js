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
var START = Date.UTC(2026, 9, 18, 3, 0, 0);
var norm = function (p) { return p.replace(/\\/g, '/'); };
(0, testing_1.test)('other sessions show up across accounts; one waiting 3 minutes alerts once; an item moves to another session', function ($, on) { return __awaiter(void 0, void 0, void 0, function () {
    var clock, files, toasts, ran, put, SESSIONS, others, pane, _a, _b, _c, _d, _e, target, mine;
    var _f, _g, _h, _j, _k;
    return __generator(this, function (_l) {
        switch (_l.label) {
            case 0:
                clock = testing_1.mock.clock(on, { now: START });
                testing_1.mock.env(on, { USERPROFILE: 'C:\\Users\\t', OS: 'Windows_NT', CLAUDE_CONFIG_DIR: 'C:\\Users\\t\\.claude' });
                files = new Map();
                toasts = [];
                ran = [];
                put = function (path, value) { return files.set(norm(path), { text: JSON.stringify(value), at: clock.now() }); };
                on('session.id', function () { return ({ value: 'self' }); });
                on('session.cwd', function () { return ({ value: 'D:/Project/glanceline' }); });
                on('session.start', function () { return ({ cwd: 'D:/Project/glanceline' }); });
                on('command.register', function () { return ({ value: undefined }); });
                on('ui.open', function () { return ({ value: { isPlaced: true } }); });
                on('fs.read', function (_, e) {
                    var f = files.get(norm(e.path));
                    return f ? { value: f.text } : { deny: 'missing' };
                });
                on('fs.write', function (_, e) {
                    files.set(norm(e.path), { text: e.text, at: clock.now() });
                    return { value: undefined };
                });
                on('fs.exists', function (_, e) { return ({ value: files.has(norm(e.path)) }); });
                on('fs.list', function (_, e) {
                    var dir = "".concat(norm(e.path), "/");
                    var names = __spreadArray([], files.entries(), true).filter(function (_a) {
                        var p = _a[0];
                        return p.startsWith(dir) && !p.slice(dir.length).includes('/');
                    });
                    return { value: names.map(function (_a) {
                            var p = _a[0], f = _a[1];
                            return ({ name: p.slice(dir.length), kind: 'file', size: f.text.length, mtimeMs: f.at, isLink: false });
                        }) };
                });
                on('ui.toast', function (_, e) {
                    toasts.push(e.text);
                    return { value: undefined };
                });
                on('process.run', function (_, e) {
                    ran.push(__spreadArray([], e.argv, true));
                    return { value: { exitCode: 0, stdout: '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } };
                });
                SESSIONS = 'C:/Users/t/.glancedeck/sessions';
                others = function (now) {
                    put("".concat(SESSIONS, "/ask.json"), {
                        sessionId: 'ask',
                        project: 'acme-api',
                        cwd: 'D:/acme-api',
                        queueKey: 'acme-api-abc',
                        account: 'acc2',
                        status: 'waiting',
                        activity: 'xoá migration cũ?',
                        since: START - 60000,
                        startedAt: START - 900000,
                        updatedAt: now,
                        log: [{ at: START - 60000, who: 'main', label: 'main', text: 'hỏi: xoá migration cũ?', isQuestion: true }],
                    });
                    put("".concat(SESSIONS, "/busy.json"), {
                        sessionId: 'busy',
                        project: 'acme-web',
                        cwd: 'D:/acme-web',
                        queueKey: 'acme-web-def',
                        account: null,
                        status: 'working',
                        activity: 'Bash → npm run build',
                        since: START - 360000,
                        startedAt: START - 900000,
                        updatedAt: now,
                        log: [],
                    });
                };
                others(START);
                return [4 /*yield*/, $.session.start({ cwd: 'D:/Project/glanceline', surface: 'terminal', isInteractive: true })];
            case 1:
                _l.sent();
                return [4 /*yield*/, clock.advance(5000)];
            case 2:
                _l.sent();
                return [4 /*yield*/, $.ui.mount(__assign({ plugin: 'glancedeck', surface: 'terminal' }, PANE))];
            case 3:
                pane = _l.sent();
                _a = testing_1.expect;
                return [4 /*yield*/, pane.find({ text: /! acme-api/ })];
            case 4:
                _a.apply(void 0, [_l.sent()]).toBeDefined();
                _b = testing_1.expect;
                return [4 /*yield*/, pane.find({ text: '@acc2' })];
            case 5:
                _b.apply(void 0, [_l.sent()]).toBeDefined();
                _c = testing_1.expect;
                return [4 /*yield*/, pane.find({ text: /Bash → npm run build/ })];
            case 6:
                _c.apply(void 0, [_l.sent()]).toBeDefined();
                _d = testing_1.expect;
                return [4 /*yield*/, pane.find({ text: /1 chờ bạn/ })];
            case 7:
                _d.apply(void 0, [_l.sent()]).toBeDefined();
                return [4 /*yield*/, pane.press({ key: 'l-tab-all' })];
            case 8:
                _l.sent();
                _e = testing_1.expect;
                return [4 /*yield*/, pane.find({ text: /acme-api hỏi/ })];
            case 9:
                _e.apply(void 0, [_l.sent()]).toBeDefined();
                return [4 /*yield*/, pane.unmount()
                    // This session's own heartbeat is in the shared folder for the others.
                ];
            case 10:
                _l.sent();
                // This session's own heartbeat is in the shared folder for the others.
                (0, testing_1.expect)(JSON.parse((_g = (_f = files.get("".concat(SESSIONS, "/self.json"))) === null || _f === void 0 ? void 0 : _f.text) !== null && _g !== void 0 ? _g : '{}')).toMatchObject({ sessionId: 'self', project: 'glanceline', account: null });
                // Waiting on you for 3 minutes: one toast and one sound, not one per heartbeat.
                others(START + 120000);
                return [4 /*yield*/, clock.set(START + 120000)];
            case 11:
                _l.sent();
                return [4 /*yield*/, clock.advance(5000)];
            case 12:
                _l.sent();
                others(clock.now());
                return [4 /*yield*/, clock.advance(5000)];
            case 13:
                _l.sent();
                (0, testing_1.expect)(toasts.filter(function (t) { return /chờ bạn đã 3 phút/.test(t); }).length).toBe(1);
                (0, testing_1.expect)(ran.filter(function (a) { return a[0] === 'powershell'; }).length).toBe(1);
                // m on a queue item, then pick the session: the item moves to that session's queue file.
                return [4 /*yield*/, $.command.run({ command: 'q', args: 'pause' })];
            case 14:
                // m on a queue item, then pick the session: the item moves to that session's queue file.
                _l.sent();
                return [4 /*yield*/, $.command.run({ command: 'q', args: 'viết migration mới' })];
            case 15:
                _l.sent();
                return [4 /*yield*/, $.ui.mount(__assign({ plugin: 'glancedeck', surface: 'terminal' }, PANE))];
            case 16:
                pane = _l.sent();
                return [4 /*yield*/, pane.press({ key: 'q-k-move' })];
            case 17:
                _l.sent();
                return [4 /*yield*/, pane.press({ key: 's-pick-0' })];
            case 18:
                _l.sent();
                return [4 /*yield*/, pane.unmount()];
            case 19:
                _l.sent();
                target = JSON.parse((_j = (_h = files.get('C:/Users/t/.glancedeck/queues/acme-api-abc.json')) === null || _h === void 0 ? void 0 : _h.text) !== null && _j !== void 0 ? _j : '{}');
                (0, testing_1.expect)(target.items.map(function (i) { return i.text; })).toEqual(['viết migration mới']);
                mine = __spreadArray([], files.entries(), true).find(function (_a) {
                    var p = _a[0];
                    return /queues\/glanceline-/.test(p);
                });
                (0, testing_1.expect)(JSON.parse((_k = mine === null || mine === void 0 ? void 0 : mine[1].text) !== null && _k !== void 0 ? _k : '{}').items).toEqual([]);
                return [2 /*return*/];
        }
    });
}); });
