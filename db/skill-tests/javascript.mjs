// JavaScript skill-test question bank. Build with:
//   node db/skill-tests/build.mjs db/skill-tests/javascript.mjs db/migrations/0015_javascript_skill_tests.sql
// Each question lists the CORRECT answer
// first in `c`; build.mjs rotates it into a deterministic position. Where the
// answer is computable, `run` returns the text that must equal c[0], or
// `check` returns true when the claim in c[0] holds. build.mjs fails on any
// mismatch, so every executable answer is verified against Node itself.
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// ---- helpers ---------------------------------------------------------------
export function show(v) {
  if (typeof v === "string") return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(show).join(", ")}]`;
  if (v && typeof v === "object") {
    const keys = Object.keys(v);
    return keys.length ? `{ ${keys.map((k) => `${k}: ${show(v[k])}`).join(", ")} }` : "{}";
  }
  if (typeof v === "bigint") return `${v}n`;
  return String(v);
}
const val = (expr) => new Function(`return (${expr});`)();
const showOf = (expr) => show(val(expr));
async function logs(code, waitMs = 50) {
  const out = [];
  const fakeConsole = { log: (...a) => out.push(a.map(String).join(" ")) };
  new Function("console", code)(fakeConsole);
  await new Promise((r) => setTimeout(r, waitMs));
  return out.join(", ");
}
function errorName(code, strict = false) {
  try {
    new Function(strict ? `"use strict";\n${code}` : code)();
    return "no error";
  } catch (e) {
    return e.name;
  }
}
function runEsm(files, entry) {
  const dir = mkdtempSync(join(tmpdir(), "esm-check-"));
  for (const [name, src] of Object.entries(files)) writeFileSync(join(dir, name), src);
  const r = spawnSync(process.execPath, [join(dir, entry)], { encoding: "utf8" });
  return { stdout: r.stdout.trim(), stderr: r.stderr };
}

// ---- levels ----------------------------------------------------------------
export const stack = "JavaScript";
// The single-tier test these levels replace (see improvements.md).
export const retireSlug = "javascript-fundamentals";

export const levels = [
  {
    slug: "javascript-beginner-1",
    templateId: "4e340373-1448-4da9-9d55-e77d6af8ec3b",
    description: "Variables, basic types, operators and comparisons.",
    questions: [
      { q: "Which keyword declares a variable that can be reassigned later?", c: ["let", "const", "final", "static"] },
      { q: 'What does `"5" + 3` evaluate to?', c: ['"53"', "8", '"8"', "NaN"], run: () => showOf('"5" + 3') },
      { q: 'What does `"5" - 3` evaluate to?', c: ["2", '"53"', '"2"', "NaN"], run: () => showOf('"5" - 3') },
      { q: "What is the index of the first element in a JavaScript array?", c: ["0", "1", "-1", "It depends on the array's length"] },
      { q: 'Given `const colors = ["red", "green", "blue"];`, what does `colors.length` return?', c: ["3", "2", "4", "undefined"], run: () => showOf('["red", "green", "blue"].length') },
      { q: 'What does `typeof "hello"` return?', c: ['"string"', '"text"', '"object"', '"char"'], run: () => showOf('typeof "hello"') },
      { q: "Which of these is a single-line comment in JavaScript?", c: ["// comment", "# comment", "-- comment", "' comment"] },
      { q: "What does `10 % 3` evaluate to?", c: ["1", "3", "3.33", "0"], run: () => showOf("10 % 3") },
      { q: 'What does `console.log(2 === "2")` print?', c: ["false", "true", "undefined", "It throws a TypeError"], run: () => logs('console.log(2 === "2")', 0) },
      {
        q: "What happens when this runs: `const x = 1; x = 2;`?",
        c: ["A TypeError is thrown", "x silently stays 1", "x becomes 2", "x becomes undefined"],
        run: () => (errorName("const x = 1; x = 2;") === "TypeError" ? "A TypeError is thrown" : "mismatch"),
      },
    ],
  },
  {
    slug: "javascript-beginner-2",
    templateId: "0fa109a7-80dc-4a14-a6d3-456c4f3434a0",
    description: "Functions, arrays, objects, loops and template literals.",
    questions: [
      { q: "Given `function add(a, b) { return a + b; }`, what does `add(2, 3)` return?", c: ["5", '"23"', "undefined", "23"], run: () => show(new Function("function add(a, b) { return a + b; } return add(2, 3);")()) },
      { q: "What does a function return if it has no `return` statement?", c: ["undefined", "null", "0", "An empty string"], run: () => show((function () {})()) },
      { q: "Which array method adds an element to the end of an array?", c: ["push", "pop", "shift", "unshift"], check: () => { const a = [1]; a.push(2); return a[1] === 2; } },
      { q: "What does `[1, 2, 3].includes(2)` return?", c: ["true", "1", "false", "2"], run: () => showOf("[1, 2, 3].includes(2)") },
      { q: 'Given `const user = { name: "Ana", age: 30 };`, which expression reads the name?', c: ["user.name", "user->name", "user::name", "user[name] (without quotes)"] },
      { q: "What does the template literal `Total: ${2 + 3}` (written with backticks) evaluate to?", c: ['"Total: 5"', '"Total: ${2 + 3}"', '"Total: 2 + 3"', '"Total: 23"'], run: () => show(`Total: ${2 + 3}`) },
      { q: "Which loop iterates directly over an array's values rather than its indexes?", c: ["for...of", "for...in", "for...each", "do...in"], check: () => { const seen = []; for (const v of ["a", "b"]) seen.push(v); return seen.join() === "a,b"; } },
      { q: "Which of these values is falsy?", c: ["0", '"0"', "[]", "{}"], check: () => !Boolean(0) && Boolean("0") && Boolean([]) && Boolean({}) },
      { q: "What does `[10, 20, 30].indexOf(40)` return?", c: ["-1", "undefined", "null", "3"], run: () => showOf("[10, 20, 30].indexOf(40)") },
      { q: "After `const nums = [1, 2, 3]; nums.pop();`, what is `nums`?", c: ["[1, 2]", "[2, 3]", "[1, 2, 3]", "[3]"], run: () => { const nums = [1, 2, 3]; nums.pop(); return show(nums); } },
    ],
  },
  {
    slug: "javascript-beginner-3",
    templateId: "c11f6b8b-9c3d-4286-841d-50804c328f98",
    description: "Scope, array methods, destructuring, spread and string methods.",
    questions: [
      { q: "What does `[1, 2, 3].map(n => n * 2)` return?", c: ["[2, 4, 6]", "[1, 2, 3]", "12", "undefined"], run: () => showOf("[1, 2, 3].map(n => n * 2)") },
      { q: "What does `[5, 12, 8, 130].find(n => n > 10)` return?", c: ["12", "[12, 130]", "true", "1"], run: () => showOf("[5, 12, 8, 130].find(n => n > 10)") },
      { q: "What does `[1, 2, 3, 4].filter(n => n % 2 === 0)` return?", c: ["[2, 4]", "[1, 3]", "true", "2"], run: () => showOf("[1, 2, 3, 4].filter(n => n % 2 === 0)") },
      { q: 'After `const [first, , third] = ["a", "b", "c"];`, what is `third`?', c: ['"c"', '"b"', "undefined", '["c"]'], run: () => { const [, , third] = ["a", "b", "c"]; return show(third); } },
      { q: 'After `const { name, role = "dev" } = { name: "Sam" };`, what is `role`?', c: ['"dev"', "undefined", "null", "A ReferenceError is thrown"], run: () => { const { role = "dev" } = { name: "Sam" }; return show(role); } },
      { q: 'What does `"hello world".split(" ")` return?', c: ['["hello", "world"]', '["hello world"]', '["hello", " ", "world"]', '"hello,world"'], run: () => showOf('"hello world".split(" ")') },
      { q: 'What does `"JavaScript".slice(0, 4)` return?', c: ['"Java"', '"Javas"', '"avaS"', '"Jav"'], run: () => showOf('"JavaScript".slice(0, 4)') },
      { q: "What does this print: `if (true) { let x = 1; } console.log(typeof x);`?", c: ['"undefined"', '"number"', "1", "A ReferenceError is thrown"], run: () => logs("if (true) { let x = 1; } console.log(JSON.stringify(typeof x));", 0) },
      { q: "What does this print: `if (true) { var y = 1; } console.log(y);`?", c: ["1", "undefined", "A ReferenceError is thrown", "null"], run: () => logs("if (true) { var y = 1; } console.log(y);", 0) },
      { q: 'Given `function greet(name = "friend") { return "Hi " + name; }`, what does `greet()` return?', c: ['"Hi friend"', '"Hi undefined"', '"Hi "', "A TypeError is thrown"], run: () => show(new Function('function greet(name = "friend") { return "Hi " + name; } return greet();')()) },
      { q: "What does `{ ...{ a: 1, b: 2 }, ...{ b: 3 } }` produce?", c: ["{ a: 1, b: 3 }", "{ a: 1, b: 2 }", "{ a: 1, b: 2, b: 3 }", "[{ a: 1, b: 2 }, { b: 3 }]"], run: () => show({ ...{ a: 1, b: 2 }, ...{ b: 3 } }) },
      { q: 'Given `const age = 20;`, what does `age >= 18 ? "adult" : "minor"` evaluate to?', c: ['"adult"', '"minor"', "true", "18"], run: () => { const age = 20; return show(age >= 18 ? "adult" : "minor"); } },
    ],
  },
  {
    slug: "javascript-intermediate-1",
    templateId: "3d086fcc-194a-4fbb-8557-a769abc72783",
    description: "Closures, reduce and sort, references vs copies, optional chaining and JSON.",
    questions: [
      { q: "What does `[10, 1, 5, 100].sort()` return?", c: ["[1, 10, 100, 5]", "[1, 5, 10, 100]", "[100, 10, 5, 1]", "[10, 1, 5, 100]"], run: () => showOf("[10, 1, 5, 100].sort()") },
      { q: "Which comparator makes `.sort()` order numbers from smallest to largest?", c: ["(a, b) => a - b", "(a, b) => b - a", "(a, b) => a > b", "(a, b) => a + b"], check: () => show([10, 1, 5, 100].sort((a, b) => a - b)) === "[1, 5, 10, 100]" },
      { q: "What does `[1, 2, 3, 4].reduce((sum, n) => sum + n, 0)` return?", c: ["10", "[1, 3, 6, 10]", '"1234"', "24"], run: () => showOf("[1, 2, 3, 4].reduce((sum, n) => sum + n, 0)") },
      { q: "What happens when you call `[].reduce((a, b) => a + b)` with no initial value?", c: ["A TypeError is thrown", "It returns 0", "It returns undefined", "It returns an empty array"], run: () => (errorName("[].reduce((a, b) => a + b)") === "TypeError" ? "A TypeError is thrown" : "mismatch") },
      { q: "Given `function counter() { let n = 0; return () => ++n; } const c = counter(); c(); c();`, what does the next `c()` return?", c: ["3", "1", "0", "NaN"], run: () => show(new Function("function counter() { let n = 0; return () => ++n; } const c = counter(); c(); c(); return c();")()) },
      { q: "After `const a = { x: 1 }; const b = a; b.x = 2;`, what is `a.x`?", c: ["2", "1", "undefined", "A TypeError is thrown because a is const"], run: () => { const a = { x: 1 }; const b = a; b.x = 2; return show(a.x); } },
      { q: "After `const original = { info: { score: 1 } }; const copy = { ...original }; copy.info.score = 99;`, what is `original.info.score`?", c: ["99", "1", "undefined", "A ReferenceError is thrown"], run: () => { const original = { info: { score: 1 } }; const copy = { ...original }; copy.info.score = 99; return show(original.info.score); } },
      { q: "If `user` is `{}`, what does `user?.address?.city` evaluate to?", c: ["undefined", "null", "A TypeError is thrown", '""'], run: () => { const user = {}; return show(user?.address?.city); } },
      { q: 'What does `("" ?? "default") + "|" + ("" || "default")` evaluate to?', c: ['"|default"', '"default|default"', '"|"', '"default|"'], run: () => showOf('("" ?? "default") + "|" + ("" || "default")') },
      { q: "Given `function f(first, ...rest) { return rest.length; }`, what does `f(1, 2, 3, 4)` return?", c: ["3", "4", "1", "[2, 3, 4]"], run: () => show(new Function("function f(first, ...rest) { return rest.length; } return f(1, 2, 3, 4);")()) },
      { q: "What does `JSON.stringify({ a: undefined, b: () => 1, c: null })` return?", c: ['\'{"c":null}\'', '\'{"a":undefined,"b":"() => 1","c":null}\'', '\'{"a":null,"b":null,"c":null}\'', "'{}'"], run: () => `'${JSON.stringify({ a: undefined, b: () => 1, c: null })}'` },
      { q: "Which statement about `const arr = [1, 2]; arr.push(3);` is true?", c: ["It works: const stops reassigning the variable, not changing the array", "It throws a TypeError", "It silently does nothing", "It creates a new array and leaves arr unchanged"], check: () => { const arr = [1, 2]; arr.push(3); return arr.length === 3; } },
    ],
  },
  {
    slug: "javascript-intermediate-2",
    templateId: "1f515ffd-3ad0-47e7-998e-f9360aa6ffb1",
    description: "Promises, async/await, event-loop basics and `this`.",
    questions: [
      { q: "What does an `async` function always return?", c: ["A Promise", "Its return value directly", "undefined until it is awaited", "A generator object"], check: () => (async () => 1)() instanceof Promise },
      { q: "What order is logged by `console.log(1); setTimeout(() => console.log(2), 0); console.log(3);`?", c: ["1, 3, 2", "1, 2, 3", "3, 1, 2", "2, 1, 3"], run: () => logs("console.log(1); setTimeout(() => console.log(2), 0); console.log(3);") },
      { q: "Which method waits for every promise to settle and never rejects just because one input rejected?", c: ["Promise.allSettled", "Promise.all", "Promise.race", "Promise.any"], check: async () => (await Promise.allSettled([Promise.reject(new Error("x")), Promise.resolve(1)])).length === 2 },
      { q: "When does the promise returned by `Promise.any(promises)` reject?", c: ["Only when every input rejects, with an AggregateError", "As soon as any input rejects", "Never", "When the first input settles, either way"], check: async () => { try { await Promise.any([Promise.reject(1), Promise.reject(2)]); return false; } catch (e) { return e instanceof AggregateError; } } },
      { q: "In `Promise.race([slow, fast])`, if `fast` rejects before `slow` resolves, what does the race do?", c: ["Rejects with fast's error", "Resolves with slow's value", "Waits for both to settle", "Resolves with undefined"], check: async () => { const slow = new Promise((r) => setTimeout(() => r("slow"), 30)); const fast = new Promise((_, j) => setTimeout(() => j(new Error("fast")), 5)); try { await Promise.race([slow, fast]); return false; } catch (e) { return e.message === "fast"; } } },
      { q: 'What is logged by `async function f() { throw new Error("x"); } f().catch(e => console.log(e.message));`?', c: ["x", "Nothing — the error crashes the program", "undefined", "Error: x is thrown synchronously when f() is called"], run: () => logs('async function f() { throw new Error("x"); } f().catch(e => console.log(e.message));') },
      { q: 'Inside an async function, what does `try { await Promise.reject(new Error("boom")); } catch (e) { return "caught"; }` resolve to?', c: ['"caught"', 'It rejects with the "boom" error', "undefined", '"boom"'], run: async () => show(await (async () => { try { await Promise.reject(new Error("boom")); } catch (e) { return "caught"; } })()) },
      { q: "With `const wait = ms => new Promise(r => setTimeout(r, ms));`, about how long does `await Promise.all([wait(100), wait(100)])` take?", c: ["About 100 ms", "About 200 ms", "0 ms", "It never resolves"], check: async () => { const wait = (ms) => new Promise((r) => setTimeout(r, ms)); const t = Date.now(); await Promise.all([wait(100), wait(100)]); const d = Date.now() - t; return d >= 95 && d < 180; } },
      { q: "What does `await 5` evaluate to inside an async function?", c: ["5, after a microtask tick", "A TypeError, because 5 is not a promise", "undefined", "A Promise that resolves to 5"], run: async () => ((await (async () => await 5)()) === 5 ? "5, after a microtask tick" : "mismatch") },
      { q: 'What does `new Promise(resolve => { resolve("a"); resolve("b"); }).then(console.log)` log?', c: ["a", "b", "a, then b", "An error, because the promise was already resolved"], run: () => logs('new Promise(resolve => { resolve("a"); resolve("b"); }).then(v => console.log(v));') },
      { q: 'What order is logged by `queueMicrotask(() => console.log("micro")); setTimeout(() => console.log("macro")); console.log("sync");`?', c: ["sync, micro, macro", "sync, macro, micro", "micro, sync, macro", "macro, micro, sync"], run: () => logs('queueMicrotask(() => console.log("micro")); setTimeout(() => console.log("macro")); console.log("sync");') },
      { q: "In strict mode, given `const obj = { n: 1, get() { return this.n; } }; const fn = obj.get;`, what happens when you call `fn()`?", c: ["A TypeError is thrown, because this is undefined", "It returns 1", "It returns undefined", "It returns null"], run: () => (errorName("const obj = { n: 1, get() { return this.n; } }; const fn = obj.get; fn();", true) === "TypeError" ? "A TypeError is thrown, because this is undefined" : "mismatch") },
      { q: "Given `const obj = { n: 1, get() { return this.n; } };`, which expression creates a function that always runs `get` with `this` set to `obj`?", c: ["obj.get.bind(obj)", "obj.get.call", "Object.assign(obj.get)", "obj.get.apply"], check: () => { const obj = { n: 1, get() { return this.n; } }; const f = obj.get.bind(obj); return f() === 1; } },
      { q: "With the Fetch API, what happens when the server responds with HTTP 404?", c: ["The promise resolves and response.ok is false", "The promise rejects with a 404 error", "fetch throws synchronously", "fetch retries the request automatically"] },
    ],
  },
  {
    slug: "javascript-intermediate-3",
    templateId: "1400f0f2-89ae-47d2-b766-8863c50884e3",
    description: "Hoisting, the temporal dead zone, classes, private fields and modules.",
    questions: [
      { q: 'What happens when this runs: `sayHi(); function sayHi() { console.log("hi"); }`?', c: ['It logs "hi"', "A ReferenceError is thrown", "A TypeError is thrown", "It logs undefined"], run: () => (logs('sayHi(); function sayHi() { console.log("hi"); }', 0).then((o) => (o === "hi" ? 'It logs "hi"' : "mismatch"))) },
      { q: 'What happens when this runs: `sayHi(); var sayHi = function () { console.log("hi"); };`?', c: ["A TypeError is thrown, because sayHi is undefined at that point", 'It logs "hi"', "A ReferenceError is thrown", "It logs undefined"], run: () => (errorName('sayHi(); var sayHi = function () { console.log("hi"); };') === "TypeError" ? "A TypeError is thrown, because sayHi is undefined at that point" : "mismatch") },
      { q: "What happens when this runs: `console.log(x); let x = 1;`?", c: ["A ReferenceError is thrown", "It logs undefined", "It logs 1", "It logs null"], run: () => (errorName("console.log(x); let x = 1;") === "ReferenceError" ? "A ReferenceError is thrown" : "mismatch") },
      { q: "Given `class A { static create() { return new A(); } }`, how do you call `create`?", c: ["A.create()", "new A().create()", "A.prototype.create()", "create()"], check: () => { class A { static create() { return new A(); } } return A.create() instanceof A && typeof new A().create === "undefined"; } },
      { q: "Given `class Account { #balance = 0; }`, what happens if code outside the class reads `new Account().#balance`?", c: ["A SyntaxError: private fields can't be referenced outside their class", "It returns 0", "It returns undefined", "A TypeError at runtime"], run: () => (errorName("class Account { #balance = 0; } new Account().#balance;") === "SyntaxError" ? "A SyntaxError: private fields can't be referenced outside their class" : "mismatch") },
      { q: "What happens when you construct `class Dog extends Animal { constructor(name) { this.name = name; super(); } }` (Animal is any class)?", c: ["A ReferenceError: this can't be used before super() is called", "It works normally", "A TypeError is thrown", "It works but name is undefined"], run: () => (errorName("class Animal {} class Dog extends Animal { constructor(name) { this.name = name; super(); } } new Dog('rex');") === "ReferenceError" ? "A ReferenceError: this can't be used before super() is called" : "mismatch") },
      { q: "Given `const t = { c: 25, get f() { return this.c * 9 / 5 + 32; } };`, what is `t.f`?", c: ["77", "A function", "undefined", "25"], run: () => { const t = { c: 25, get f() { return (this.c * 9) / 5 + 32; } }; return show(t.f); } },
      { q: 'After `const cfg = Object.freeze({ db: { host: "a" } }); cfg.db.host = "b";`, what is `cfg.db.host`?', c: ['"b"', '"a"', "undefined", "A TypeError is always thrown"], run: () => { const cfg = Object.freeze({ db: { host: "a" } }); cfg.db.host = "b"; return show(cfg.db.host); } },
      { q: 'A module has `export default function () {}` and `export const x = 1;`. Which statement imports both?', c: ['import fn, { x } from "./mod.js";', 'import { default, x } from "./mod.js";', 'import fn, x from "./mod.js";', 'import * as fn, x from "./mod.js";'], check: () => { const r = runEsm({ "mod.mjs": "export default function () { return 'f'; } export const x = 1;", "main.mjs": 'import fn, { x } from "./mod.mjs"; console.log(fn(), x);' }, "main.mjs"); return r.stdout === "f 1"; } },
      { q: "What does `typeof class Foo {}` return?", c: ['"function"', '"class"', '"object"', '"constructor"'], run: () => showOf("typeof class Foo {}") },
      { q: "Given `class P { greet() {} }`, what does `new P().greet === new P().greet` evaluate to?", c: ["true, because methods live on the shared prototype", "false, because each instance gets its own copy", "undefined", "A TypeError is thrown"], check: () => { class P { greet() {} } return new P().greet === new P().greet; } },
      { q: "Given `class A {} class B extends A {}`, what does `new B() instanceof A` evaluate to?", c: ["true", "false", "undefined", "A TypeError is thrown"], run: () => { class A {} class B extends A {} return show(new B() instanceof A); } },
      { q: "Given `class P { constructor() { this.a = 1; } m() {} }`, what does `Object.keys(new P())` return?", c: ['["a"]', '["a", "m"]', '["constructor", "a", "m"]', "[]"], run: () => { class P { constructor() { this.a = 1; } m() {} } return show(Object.keys(new P())); } },
      { q: "What does `typeof []` return, and what is the reliable way to check for an array?", c: ['"object" — use Array.isArray(value)', '"array" — use typeof value === "array"', '"object" — use value instanceof Object', '"list" — use Array.isList(value)'], check: () => typeof [] === "object" && Array.isArray([]) && ({}) instanceof Object && typeof Array.isList === "undefined" },
    ],
  },
  {
    slug: "javascript-advanced-1",
    templateId: "2233f74c-fc3c-4121-a218-9aa2dd1384c9",
    description: "Event-loop ordering, closures in loops, generators, iterators and collections.",
    questions: [
      { q: "What does `for (var i = 0; i < 3; i++) setTimeout(() => console.log(i));` log?", c: ["3, 3, 3", "0, 1, 2", "undefined, undefined, undefined", "2, 2, 2"], run: () => logs("for (var i = 0; i < 3; i++) setTimeout(() => console.log(i));") },
      { q: "Why does changing `var` to `let` in `for (var i = 0; i < 3; i++) setTimeout(() => console.log(i));` make it log 0, 1, 2?", c: ["let creates a new binding for each iteration, and each callback closes over its own one", "let makes setTimeout run synchronously", "let is hoisted to the top of the file", "let copies i into the global scope"], check: async () => (await logs("for (let i = 0; i < 3; i++) setTimeout(() => console.log(i));")) === "0, 1, 2" },
      { q: "What order is logged by `async function a() { console.log(1); await null; console.log(2); } a(); console.log(3);`?", c: ["1, 3, 2", "1, 2, 3", "3, 1, 2", "1, 3 (2 is never logged)"], run: () => logs("async function a() { console.log(1); await null; console.log(2); } a(); console.log(3);") },
      { q: 'What order is logged by `setTimeout(() => console.log("t")); Promise.resolve().then(() => { console.log("p1"); Promise.resolve().then(() => console.log("p2")); }); console.log("s");`?', c: ["s, p1, p2, t", "s, p1, t, p2", "s, t, p1, p2", "p1, p2, s, t"], run: () => logs('setTimeout(() => console.log("t")); Promise.resolve().then(() => { console.log("p1"); Promise.resolve().then(() => console.log("p2")); }); console.log("s");') },
      { q: "Given `function* g() { yield 1; yield 2; } const it = g(); it.next(); it.next();`, what does a third `it.next()` return?", c: ["{ value: undefined, done: true }", "{ value: 2, done: true }", "{ value: undefined, done: false }", "It throws an error"], run: () => { function* g() { yield 1; yield 2; } const it = g(); it.next(); it.next(); return show(it.next()); } },
      { q: "Given `function* g() { yield 1; yield 2; return 3; }`, what is `[...g()]`?", c: ["[1, 2]", "[1, 2, 3]", "[3]", "[]"], run: () => { function* g() { yield 1; yield 2; return 3; } return show([...g()]); } },
      { q: "What must an object implement to be usable in a `for...of` loop?", c: ["A [Symbol.iterator]() method that returns an iterator", "A length property and numeric keys", "A forEach method", "Only a next() method on the object itself"], check: () => { const it = { [Symbol.iterator]() { let i = 0; return { next: () => ({ value: i, done: i++ >= 2 }) }; } }; const seen = []; for (const v of it) seen.push(v); const bad = { next: () => ({ done: true }) }; let threw = false; try { for (const _ of bad); } catch { threw = true; } return seen.join() === "0,1" && threw; } },
      { q: 'After `const m = new Map(); m.set(1, "a"); m.set("1", "b");`, what is `m.size`?', c: ["2", "1", "0", "A TypeError is thrown"], run: () => { const m = new Map(); m.set(1, "a"); m.set("1", "b"); return show(m.size); } },
      { q: 'After `const o = {}; o[1] = "a"; o["1"] = "b";`, what is `Object.keys(o).length`?', c: ["1, because object keys are converted to strings", "2", "0", "A TypeError is thrown"], check: () => { const o = {}; o[1] = "a"; o["1"] = "b"; return Object.keys(o).length === 1; } },
      { q: "What is a WeakMap best suited for?", c: ["Attaching data to objects without stopping them from being garbage-collected", "Storing primitive keys efficiently", "Iterating keys in insertion order", "Sharing a cache across processes"], check: () => { try { new WeakMap().set(1, "x"); return false; } catch { return typeof WeakMap.prototype.keys === "undefined"; } } },
      { q: "What does debouncing a function do?", c: ["Delays calling it until a set time has passed since the last call", "Calls it at most once per interval, however often it's triggered", "Cancels every call after the first", "Runs it on the next animation frame"] },
      { q: "Given `const add = a => b => c => a + b + c;`, what does `add(1)(2)(3)` return?", c: ["6", "A function", "NaN", '"123"'], run: () => { const add = (a) => (b) => (c) => a + b + c; return show(add(1)(2)(3)); } },
      { q: "What does `[[1], [2, [3]]].flat()` return?", c: ["[1, 2, [3]]", "[1, 2, 3]", "[[1], [2, [3]]]", "[1, [2, [3]]]"], run: () => showOf("[[1], [2, [3]]].flat()") },
      { q: "Given `const counter = (() => { let count = 0; return { inc: () => ++count }; })();`, what is `counter.count`?", c: ["undefined", "0", "1", "A ReferenceError is thrown"], run: () => { const counter = (() => { let count = 0; return { inc: () => ++count }; })(); return show(counter.count); } },
      { q: 'What order is logged by `new Promise(() => console.log("a")); console.log("b");`?', c: ["a, b", "b, a", "Only b", "Only a"], run: () => logs('new Promise(() => console.log("a")); console.log("b");') },
      { q: 'What happens with `try { setTimeout(() => { throw new Error("x"); }); } catch { console.log("caught"); }`?', c: ["The error is not caught: the callback runs after the try/catch has finished", '"caught" is logged', "The error is silently swallowed", "setTimeout throws immediately and it is caught"] },
    ],
  },
  {
    slug: "javascript-advanced-2",
    templateId: "0fd04ce0-38be-43f6-8eb4-f357be1f8019",
    description: "Prototypes, bind and new, type coercion, numbers, Proxy and tagged templates.",
    questions: [
      { q: "What does `Object.getPrototypeOf(Object.create(null))` return?", c: ["null", "Object.prototype", "undefined", "{}"], run: () => show(Object.getPrototypeOf(Object.create(null))) },
      { q: 'Given `const o = Object.create({ hi() { return "hi " + this.name; } }); o.name = "Ana";`, what does `o.hi()` return?', c: ['"hi Ana"', '"hi undefined"', "A TypeError is thrown", '"hi "'], run: () => { const o = Object.create({ hi() { return "hi " + this.name; } }); o.name = "Ana"; return show(o.hi()); } },
      { q: 'Given `const o = Object.create({ hi() {} });`, what does `Object.hasOwn(o, "hi")` return?', c: ["false", "true", "undefined", "A TypeError is thrown"], run: () => { const o = Object.create({ hi() {} }); return show(Object.hasOwn(o, "hi")); } },
      { q: 'What does `["1", "2", "3"].map(parseInt)` return?', c: ["[1, NaN, NaN]", "[1, 2, 3]", '["1", "2", "3"]', "[NaN, NaN, NaN]"], run: () => show(["1", "2", "3"].map(parseInt)) },
      { q: "Given `function f() { return this.v; } const g = f.bind({ v: 1 }).bind({ v: 2 });`, what does `g()` return?", c: ["1", "2", "undefined", "A TypeError is thrown"], run: () => { function f() { return this.v; } const g = f.bind({ v: 1 }).bind({ v: 2 }); return show(g()); } },
      { q: "Given `function F() { this.a = 1; return { b: 2 }; }`, what is `new F().a`?", c: ["undefined", "1", "2", "A TypeError is thrown"], run: () => { function F() { this.a = 1; return { b: 2 }; } return show(new F().a); } },
      { q: "What does the expression `[] + {}` evaluate to?", c: ['"[object Object]"', "0", '"{}"', "NaN"], run: () => showOf("[] + {}") },
      { q: "What does `[] == false` evaluate to?", c: ["true", "false", "A TypeError is thrown", "undefined"], run: () => showOf("[] == false") },
      { q: "What does `0.1 + 0.2 === 0.3` evaluate to?", c: ["false, because 0.1 + 0.2 is 0.30000000000000004", "true", "false, because 0.1 + 0.2 is NaN", "A RangeError is thrown"], check: () => 0.1 + 0.2 !== 0.3 && String(0.1 + 0.2) === "0.30000000000000004" },
      { q: "What do `Object.is(NaN, NaN)` and `NaN === NaN` evaluate to?", c: ["true and false", "false and false", "true and true", "false and true"], check: () => Object.is(NaN, NaN) === true && (NaN === NaN) === false },
      { q: "What does `[0 === -0, Object.is(0, -0)]` evaluate to?", c: ["[true, false]", "[true, true]", "[false, false]", "[false, true]"], run: () => showOf("[0 === -0, Object.is(0, -0)]") },
      { q: "What happens when you evaluate `10n + 5`?", c: ["A TypeError: BigInt and Number can't be mixed", "15n", "15", '"105"'], run: () => (errorName("return 10n + 5;") === "TypeError" ? "A TypeError: BigInt and Number can't be mixed" : "mismatch") },
      { q: "Given `const tag = (strings, ...vals) => strings.length + vals.length;`, what does tag`a${1}b${2}c` (a tagged template) return?", c: ["5", "3", "2", "6"], run: () => { const tag = (strings, ...vals) => strings.length + vals.length; return show(tag`a${1}b${2}c`); } },
      { q: 'Given `const p = new Proxy({}, { get: (t, k) => (k in t ? t[k] : "missing") });`, what is `p.foo`?', c: ['"missing"', "undefined", "A TypeError is thrown", '"foo"'], run: () => { const p = new Proxy({}, { get: (t, k) => (k in t ? t[k] : "missing") }); return show(p.foo); } },
      { q: "What does `Reflect.ownKeys(obj)` return?", c: ["All own keys, including non-enumerable and symbol keys", "The same as Object.keys(obj)", "Only symbol keys", "Own and inherited enumerable keys"], check: () => { const s = Symbol("s"); const o = Object.create({ inherited: 1 }, { hidden: { value: 1, enumerable: false } }); o.a = 1; o[s] = 1; const keys = Reflect.ownKeys(o); return keys.length === 3 && keys.includes("hidden") && keys.includes(s) && !keys.includes("inherited"); } },
      { q: "What does `parseInt(0.0000005)` return?", c: ["5", "0", "NaN", "5e-7"], run: () => show(parseInt(0.0000005)) },
    ],
  },
  {
    slug: "javascript-advanced-3",
    templateId: "ca84c036-9abd-4ef5-85d1-3a9ce7ddb775",
    description: "Property descriptors, conversion to primitives, structured cloning, async iteration, modules and edge cases.",
    questions: [
      { q: 'In non-strict code, after `const o = {}; Object.defineProperty(o, "x", { value: 1 }); o.x = 2;`, what is `o.x`?', c: ["1, because the property is not writable by default", "2", "undefined", "A TypeError is always thrown"], check: () => new Function('const o = {}; Object.defineProperty(o, "x", { value: 1 }); o.x = 2; return o.x;')() === 1 },
      { q: 'In strict mode, what does `o.x = 2` do after `Object.defineProperty(o, "x", { value: 1 })`?', c: ["Throws a TypeError", "Is silently ignored", "Sets o.x to 2", "Defines a second x property"], run: () => (errorName('const o = {}; Object.defineProperty(o, "x", { value: 1 }); o.x = 2;', true) === "TypeError" ? "Throws a TypeError" : "mismatch") },
      { q: 'Given `const money = { [Symbol.toPrimitive](hint) { return hint === "number" ? 42 : "forty-two"; } };`, what do the template literal `${money}` and `+money` evaluate to?', c: ['"forty-two" and 42', "42 and 42", '"forty-two" and NaN', '"[object Object]" and NaN'], check: () => { const money = { [Symbol.toPrimitive](hint) { return hint === "number" ? 42 : "forty-two"; } }; return `${money}` === "forty-two" && +money === 42; } },
      { q: "Given `const a = { d: new Date(0), m: new Map([[1, 2]]) }; const b = structuredClone(a);`, which is true?", c: ["b.d is a Date and b.m is a Map, both new copies", "b.d is a string and b.m is an empty object, as with JSON", "It throws, because Map can't be cloned", "b.d and b.m are the same objects as a.d and a.m"], check: () => { const a = { d: new Date(0), m: new Map([[1, 2]]) }; const b = structuredClone(a); return b.d instanceof Date && b.d !== a.d && b.m instanceof Map && b.m !== a.m && b.m.get(1) === 2; } },
      { q: "What does `structuredClone({ f() {} })` do?", c: ["Throws a DataCloneError, because functions can't be cloned", "Copies the function", "Silently drops f and returns {}", "Returns the same object"], check: () => { try { structuredClone({ f() {} }); return false; } catch (e) { return e.name === "DataCloneError"; } } },
      { q: "Given `async function* gen() { yield 1; yield 2; }`, how do you consume it inside an async function?", c: ["for await (const x of gen()) { ... }", "for (const x of gen()) { ... }", "gen().forEach(x => { ... })", "await gen().all()"], check: async () => { async function* gen() { yield 1; yield 2; } const seen = []; for await (const x of gen()) seen.push(x); return seen.join() === "1,2" && !(Symbol.iterator in gen()); } },
      { q: "After `const ac = new AbortController(); const p = fetch(url, { signal: ac.signal }); ac.abort();`, what happens to `p`?", c: ["It rejects with an AbortError", "It resolves with a partial response", "Nothing — abort() only works before fetch is called", "abort() throws synchronously"], check: async () => { const ac = new AbortController(); const p = fetch("http://127.0.0.1:9/", { signal: ac.signal }); ac.abort(); try { await p; return false; } catch (e) { return e.name === "AbortError"; } } },
      { q: "counter.js has `export let count = 0; export function inc() { count++; }`. If main.js runs `import { count, inc } from \"./counter.js\"; inc(); console.log(count);`, what is logged?", c: ["1, because imports are live bindings", "0, because imports are copies", "A ReferenceError is thrown", "undefined"], check: () => runEsm({ "counter.mjs": "export let count = 0; export function inc() { count++; }", "main.mjs": 'import { count, inc } from "./counter.mjs"; inc(); console.log(count);' }, "main.mjs").stdout === "1" },
      { q: 'What happens when a module runs `import { count } from "./counter.js"; count = 5;`?', c: ["A TypeError, because imported bindings are read-only", "count becomes 5 in both modules", "count becomes 5 only in the importing module", "It is silently ignored"], check: () => /TypeError: Assignment to constant variable/.test(runEsm({ "counter.mjs": "export let count = 0;", "main.mjs": 'import { count } from "./counter.mjs"; count = 5;' }, "main.mjs").stderr) },
      { q: "Since ES2019, what does the spec require of `Array.prototype.sort`?", c: ["It must be stable: equal elements keep their original order", "Nothing about order: equal elements may be reordered", "It must use quicksort", "It must be stable only for numeric arrays"], check: () => { const rows = Array.from({ length: 50 }, (_, i) => ({ k: i % 3, i })); const sorted = [...rows].sort((a, b) => a.k - b.k); return sorted.every((r, idx) => idx === 0 || r.k > sorted[idx - 1].k || r.i > sorted[idx - 1].i); } },
      { q: "What does `[1, , 3].map(x => x * 2)` return?", c: ["[2, <empty>, 6] — the hole is skipped and kept", "[2, NaN, 6]", "[2, 0, 6]", "[2, 6]"], check: () => { const r = [1, , 3].map((x) => x * 2); return r.length === 3 && !(1 in r) && r[0] === 2 && r[2] === 6; } },
      { q: "Given `function f() { try { return 1; } finally { return 2; } }`, what does `f()` return?", c: ["2", "1", "undefined", "A SyntaxError is thrown"], run: () => show(new Function("function f() { try { return 1; } finally { return 2; } } return f();")()) },
      { q: "What happens to `setTimeout(() => console.log(\"t\"))` if code also runs `function loop() { Promise.resolve().then(loop); } loop();`?", c: ['"t" is never logged: the microtask queue never empties, so timers never run', '"t" is logged after about 0 ms', '"t" is logged after the 4 ms timer clamp', "A RangeError: maximum call stack size exceeded"] },
      { q: "Given `const ref = new WeakRef(obj);`, what does `ref.deref()` return?", c: ["The object, or undefined once it has been garbage-collected", "Always the object, since the WeakRef keeps it alive", "A copy of the object", "null once it has been garbage-collected"], check: () => { const o = {}; return new WeakRef(o).deref() === o; } },
      { q: "In non-strict code, given `const o = Object.create({ get v() { return 1; } }); o.v = 2;`, what is `o.v`?", c: ["1: assigning to an inherited getter with no setter silently fails", "2: the assignment creates an own property", "undefined", "A TypeError is thrown"], check: () => new Function("const o = Object.create({ get v() { return 1; } }); o.v = 2; return o.v;")() === 1 },
      { q: "What does `JSON.stringify({ toJSON() { return { a: 1 }; }, b: 2 })` return?", c: ['\'{"a":1}\'', '\'{"b":2}\'', '\'{"a":1,"b":2}\'', '\'{"toJSON":{},"b":2}\''], run: () => `'${JSON.stringify({ toJSON() { return { a: 1 }; }, b: 2 })}'` },
      { q: "Given `const a = {}; a.self = a;`, what does `JSON.stringify(a)` do?", c: ["Throws a TypeError about a circular structure", 'Returns \'{"self":{}}\'', 'Returns \'{"self":"[Circular]"}\'', "Loops forever"], run: () => (errorName("const a = {}; a.self = a; JSON.stringify(a);") === "TypeError" ? "Throws a TypeError about a circular structure" : "mismatch") },
      { q: "Given `const a = {}; a.self = a;`, what does `structuredClone(a)` do?", c: ["Copies it, keeping the cycle: the copy's self points to the copy", "Throws a TypeError about a circular structure", "Returns a copy where self points back to the original a", "Loops forever"], check: () => { const a = {}; a.self = a; const b = structuredClone(a); return b !== a && b.self === b; } },
    ],
  },
];
