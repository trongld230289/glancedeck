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
(0, testing_1.test)('the pane draws the four blocks at 58 columns', function ($, on) { return __awaiter(void 0, void 0, void 0, function () {
    var ui, _a, _i, _b, title, _c, _d, _e;
    return __generator(this, function (_f) {
        switch (_f.label) {
            case 0:
                testing_1.mock.clock(on, { now: Date.UTC(2026, 9, 18, 10, 0, 0) });
                on('session.cwd', function () { return ({ value: 'D:/Project/glanceline' }); });
                return [4 /*yield*/, $.ui.mount(__assign({ plugin: 'glancedeck', surface: 'terminal' }, PANE))];
            case 1:
                ui = _f.sent();
                _a = testing_1.expect;
                return [4 /*yield*/, ui.find({ text: /glanceline/ })];
            case 2:
                _a.apply(void 0, [_f.sent()]).toBeDefined();
                _i = 0, _b = ['GLANCEDECK', 'QUEUE', 'SESSIONS', 'AGENTS', 'SESSION LOG'];
                _f.label = 3;
            case 3:
                if (!(_i < _b.length)) return [3 /*break*/, 6];
                title = _b[_i];
                _c = testing_1.expect;
                return [4 /*yield*/, ui.find({ text: title })];
            case 4:
                _c.apply(void 0, [_f.sent()]).toBeDefined();
                _f.label = 5;
            case 5:
                _i++;
                return [3 /*break*/, 3];
            case 6:
                _d = testing_1.expect;
                return [4 /*yield*/, ui.find({ text: /\/q <việc>/ })];
            case 7:
                _d.apply(void 0, [_f.sent()]).toBeDefined();
                _e = testing_1.expect;
                return [4 /*yield*/, ui.find({ text: /AGENTS · chưa có|chưa có/ })];
            case 8:
                _e.apply(void 0, [_f.sent()]).toBeDefined();
                return [4 /*yield*/, ui.unmount()];
            case 9:
                _f.sent();
                return [2 /*return*/];
        }
    });
}); });
(0, testing_1.test)('tool calls land in the log, an edit row opens its file, a failed call is marked', function ($, on) { return __awaiter(void 0, void 0, void 0, function () {
    var ran, ui, _a, _b, _c;
    var _d;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                testing_1.mock.clock(on, { now: Date.UTC(2026, 9, 18, 10, 0, 0) });
                testing_1.mock.env(on, { OS: 'Windows_NT' });
                ran = [];
                on('tool.call', function (_, e) { return (e.tool === 'Bash' ? { isError: true, result: 'exit 1', text: 'exit 1' } : { result: { ok: true } }); });
                on('process.run', function (_, e) {
                    ran.push(__spreadArray([], e.argv, true));
                    return { value: { exitCode: 0, stdout: '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } };
                });
                return [4 /*yield*/, $.tool.call({
                        tool: 'Edit',
                        tool_use_id: 't1',
                        file_path: 'D:/Project/glanceline/install.py',
                        old_string: 'a',
                        new_string: 'b',
                    })];
            case 1:
                _e.sent();
                return [4 /*yield*/, $.tool.call({ tool: 'Bash', tool_use_id: 't2', command: 'python install.py --token=abc123' })];
            case 2:
                _e.sent();
                return [4 /*yield*/, $.tool.call({ tool: 'TodoWrite', tool_use_id: 't3', todos: [] })];
            case 3:
                _e.sent();
                return [4 /*yield*/, $.ui.mount(__assign({ plugin: 'glancedeck', surface: 'terminal' }, PANE))];
            case 4:
                ui = _e.sent();
                _a = testing_1.expect;
                return [4 /*yield*/, ui.find({ text: /Edit → glanceline\/install\.py/ })];
            case 5:
                _a.apply(void 0, [_e.sent()]).toBeDefined();
                _b = testing_1.expect;
                return [4 /*yield*/, ui.find({ text: /Bash → python install\.py --token=•••  ✗/ })];
            case 6:
                _b.apply(void 0, [_e.sent()]).toBeDefined();
                _c = testing_1.expect;
                return [4 /*yield*/, ui.find({ text: /TodoWrite/ })];
            case 7:
                _c.apply(void 0, [_e.sent()]).toBeUndefined();
                return [4 /*yield*/, ui.press({ key: 'l-0' })];
            case 8:
                _e.sent();
                (0, testing_1.expect)((_d = ran.at(-1)) === null || _d === void 0 ? void 0 : _d.slice(-2)).toEqual(['-g', 'D:/Project/glanceline/install.py']);
                return [4 /*yield*/, ui.unmount()];
            case 9:
                _e.sent();
                return [2 /*return*/];
        }
    });
}); });
(0, testing_1.test)('a subagent gets a card, its tools, and a done mark with its answer', function ($, on) { return __awaiter(void 0, void 0, void 0, function () {
    var clock, ui, _a, _b, _c, _d, _e, _f, _g;
    return __generator(this, function (_h) {
        switch (_h.label) {
            case 0:
                clock = testing_1.mock.clock(on, { now: Date.UTC(2026, 9, 18, 10, 0, 0) });
                on('agent.spawn', function () { return ({ agentId: 'ag1', model: 'claude-haiku-5-5' }); });
                on('tool.call', function () { return ({ result: { ok: true } }); });
                on('turn.complete', function () { return ({ text: '' }); });
                return [4 /*yield*/, $.agent.spawn({ prompt: 'review', description: 'Review flow', subagentType: 'general-purpose', background: false })];
            case 1:
                _h.sent();
                return [4 /*yield*/, $.tool.call({ tool: 'Read', tool_use_id: 't9', agentId: 'ag1', file_path: 'D:/x/src/flow.ts' })];
            case 2:
                _h.sent();
                return [4 /*yield*/, $.ui.mount(__assign({ plugin: 'glancedeck', surface: 'terminal' }, PANE))];
            case 3:
                ui = _h.sent();
                _a = testing_1.expect;
                return [4 /*yield*/, ui.find({ text: /Review flow/ })];
            case 4:
                _a.apply(void 0, [_h.sent()]).toBeDefined();
                _b = testing_1.expect;
                return [4 /*yield*/, ui.find({ text: /1 running · 1 total/ })];
            case 5:
                _b.apply(void 0, [_h.sent()]).toBeDefined();
                _c = testing_1.expect;
                return [4 /*yield*/, ui.find({ text: /agent 1/ })];
            case 6:
                _c.apply(void 0, [_h.sent()]).toBeDefined();
                return [4 /*yield*/, ui.unmount()];
            case 7:
                _h.sent();
                return [4 /*yield*/, clock.advance(158000)];
            case 8:
                _h.sent();
                return [4 /*yield*/, $.turn.complete({
                        agentId: 'ag1',
                        reason: 'answer',
                        answer: 'Two retries are missing.',
                        durationMs: 1000,
                        isAborted: false,
                        turnId: 'x',
                    })];
            case 9:
                _h.sent();
                return [4 /*yield*/, $.ui.mount(__assign({ plugin: 'glancedeck', surface: 'terminal' }, PANE))];
            case 10:
                ui = _h.sent();
                _d = testing_1.expect;
                return [4 /*yield*/, ui.find({ text: /0 running · 1 total/ })];
            case 11:
                _d.apply(void 0, [_h.sent()]).toBeDefined();
                _e = testing_1.expect;
                return [4 /*yield*/, ui.find({ text: '✓ 2:38' })];
            case 12:
                _e.apply(void 0, [_h.sent()]).toBeDefined();
                return [4 /*yield*/, ui.press({ key: 'a-0' })];
            case 13:
                _h.sent();
                _f = testing_1.expect;
                return [4 /*yield*/, ui.find({ text: /Read → src\/flow\.ts/ })];
            case 14:
                _f.apply(void 0, [_h.sent()]).toBeDefined();
                _g = testing_1.expect;
                return [4 /*yield*/, ui.find({ text: /Two retries are missing/ })];
            case 15:
                _g.apply(void 0, [_h.sent()]).toBeDefined();
                return [4 /*yield*/, ui.unmount()];
            case 16:
                _h.sent();
                return [2 /*return*/];
        }
    });
}); });
(0, testing_1.test)('c folds the block that holds the focus; the all tab shows other sessions', function ($, on) { return __awaiter(void 0, void 0, void 0, function () {
    var ui, _a, _b, _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                testing_1.mock.clock(on, { now: Date.UTC(2026, 9, 18, 10, 0, 0) });
                return [4 /*yield*/, $.ui.mount(__assign({ plugin: 'glancedeck', surface: 'terminal' }, PANE))];
            case 1:
                ui = _d.sent();
                _a = testing_1.expect;
                return [4 /*yield*/, ui.find({ text: /\/q <việc>/ })];
            case 2:
                _a.apply(void 0, [_d.sent()]).toBeDefined();
                return [4 /*yield*/, ui.press({ key: 'f-collapse' })];
            case 3:
                _d.sent();
                _b = testing_1.expect;
                return [4 /*yield*/, ui.find({ text: /\/q <việc>/ })];
            case 4:
                _b.apply(void 0, [_d.sent()]).toBeUndefined();
                return [4 /*yield*/, ui.press({ key: 'l-tab-all' })];
            case 5:
                _d.sent();
                _c = testing_1.expect;
                return [4 /*yield*/, ui.find({ text: '[all]' })];
            case 6:
                _c.apply(void 0, [_d.sent()]).toBeDefined();
                return [4 /*yield*/, ui.unmount()];
            case 7:
                _d.sent();
                return [2 /*return*/];
        }
    });
}); });
(0, testing_1.test)('the TURN block runs while the main turn does, then becomes a receipt', function ($, on) { return __awaiter(void 0, void 0, void 0, function () {
    var clock, ui, _a, _b, _c, _d, _e, _f;
    return __generator(this, function (_g) {
        switch (_g.label) {
            case 0:
                clock = testing_1.mock.clock(on, { now: Date.UTC(2026, 9, 18, 10, 0, 0) });
                on('turn.start', function () { return ({ turnId: 't1' }); });
                on('turn.complete', function () { return ({ text: '' }); });
                on('tool.call', function (_, e) { return (e.tool === 'Bash' ? { isError: true, result: 'exit 1', text: 'exit 1' } : { result: { ok: true } }); });
                return [4 /*yield*/, $.ui.mount(__assign({ plugin: 'glancedeck', surface: 'terminal' }, PANE))];
            case 1:
                ui = _g.sent();
                _a = testing_1.expect;
                return [4 /*yield*/, ui.find({ text: 'chưa có lượt nào' })];
            case 2:
                _a.apply(void 0, [_g.sent()]).toBeDefined();
                return [4 /*yield*/, ui.unmount()];
            case 3:
                _g.sent();
                return [4 /*yield*/, $.turn.start({ text: 'sửa lỗi', turnId: 't1' })];
            case 4:
                _g.sent();
                return [4 /*yield*/, $.tool.call({ tool: 'Edit', tool_use_id: 'e1', file_path: 'D:/x/a.ts', old_string: 'a', new_string: 'b' })];
            case 5:
                _g.sent();
                return [4 /*yield*/, $.tool.call({ tool: 'Bash', tool_use_id: 'b1', command: 'npm test' })];
            case 6:
                _g.sent();
                return [4 /*yield*/, $.ui.mount(__assign({ plugin: 'glancedeck', surface: 'terminal' }, PANE))];
            case 7:
                ui = _g.sent();
                _b = testing_1.expect;
                return [4 /*yield*/, ui.find({ text: 'TURN' })];
            case 8:
                _b.apply(void 0, [_g.sent()]).toBeDefined();
                _c = testing_1.expect;
                return [4 /*yield*/, ui.find({ text: '1 sửa' })];
            case 9:
                _c.apply(void 0, [_g.sent()]).toBeDefined();
                _d = testing_1.expect;
                return [4 /*yield*/, ui.find({ text: '1 lỗi' })];
            case 10:
                _d.apply(void 0, [_g.sent()]).toBeDefined();
                _e = testing_1.expect;
                return [4 /*yield*/, ui.find({ text: /lượt trước/ })];
            case 11:
                _e.apply(void 0, [_g.sent()]).toBeUndefined();
                return [4 /*yield*/, ui.unmount()];
            case 12:
                _g.sent();
                return [4 /*yield*/, clock.advance(79000)];
            case 13:
                _g.sent();
                return [4 /*yield*/, $.turn.complete({ reason: 'answer', answer: '', durationMs: 1, isAborted: false, turnId: 't1' })];
            case 14:
                _g.sent();
                return [4 /*yield*/, $.ui.mount(__assign({ plugin: 'glancedeck', surface: 'terminal' }, PANE))];
            case 15:
                ui = _g.sent();
                _f = testing_1.expect;
                return [4 /*yield*/, ui.find({ text: /✗ lượt trước · 1:19/ })];
            case 16:
                _f.apply(void 0, [_g.sent()]).toBeDefined();
                return [4 /*yield*/, ui.unmount()];
            case 17:
                _g.sent();
                return [2 /*return*/];
        }
    });
}); });
