"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var testing_1 = require("claude-code/testing");
var core_1 = require("../hooks/core");
var card = { id: 'a', name: 'x', ctx: 0, out: 0, spawnedAt: 0, endedAt: null, status: 'running', tools: [], answer: '' };
(0, testing_1.test)('describeCall names the file, command or pattern, with secrets masked', function () {
    (0, testing_1.expect)((0, core_1.describeCall)('Edit', { file_path: 'D:\\Project\\glanceline\\install.py' })).toBe('Edit → glanceline/install.py');
    (0, testing_1.expect)((0, core_1.describeCall)('Bash', { command: 'curl -H "token: ghp_abcdefghijk1234"' })).toContain('•••');
    (0, testing_1.expect)((0, core_1.describeCall)('Grep', { pattern: 'retry' })).toBe('Grep → retry');
});
(0, testing_1.test)('applyStep keeps the latest context and adds up output', function () {
    var one = (0, core_1.applyStep)(card, { input_tokens: 100, cache_read_input_tokens: 900, output_tokens: 50 });
    var two = (0, core_1.applyStep)(one, { input_tokens: 10, cache_read_input_tokens: 1990, output_tokens: 25 });
    (0, testing_1.expect)(two.ctx).toBe(2000);
    (0, testing_1.expect)(two.out).toBe(75);
    (0, testing_1.expect)((0, core_1.applyStep)(two, null).ctx).toBe(2000);
});
(0, testing_1.test)('a tagged engine message is not logged as the person', function () {
    (0, testing_1.expect)((0, core_1.promptText)('<task-notification>done</task-notification>')).toBeNull();
    (0, testing_1.expect)((0, core_1.promptText)('  viết test\n cho install.py ')).toBe('viết test cho install.py');
});
(0, testing_1.test)('the log keeps its newest rows', function () {
    var _a;
    var log = (0, core_1.pushLog)([], { at: 0, who: 'main', label: 'main', text: '0' });
    for (var i = 1; i <= core_1.LOG_MAX + 5; i += 1)
        log = (0, core_1.pushLog)(log, { at: i, who: 'main', label: 'main', text: String(i) });
    (0, testing_1.expect)(log.length).toBe(core_1.LOG_MAX);
    (0, testing_1.expect)((_a = log.at(-1)) === null || _a === void 0 ? void 0 : _a.text).toBe(String(core_1.LOG_MAX + 5));
});
(0, testing_1.test)('numbers read short', function () {
    (0, testing_1.expect)((0, core_1.kTokens)(123456)).toBe('123k');
    (0, testing_1.expect)((0, core_1.kTokens)(1500000)).toBe('1.5M');
    (0, testing_1.expect)((0, core_1.fmtElapsed)(158000)).toBe('2:38');
    (0, testing_1.expect)((0, core_1.fmtElapsed)(3900000)).toBe('1h05');
});
(0, testing_1.test)('model ids read as names', function () {
    (0, testing_1.expect)((0, core_1.prettyModel)('claude-opus-5-5')).toBe('Opus 5.5');
    (0, testing_1.expect)((0, core_1.prettyModel)('claude-haiku-5-5-20260101')).toBe('Haiku 5.5');
    (0, testing_1.expect)((0, core_1.prettyModel)('')).toBe('Claude');
});
