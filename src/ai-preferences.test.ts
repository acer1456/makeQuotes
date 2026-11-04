import test from 'node:test';
import assert from 'node:assert/strict';
import { loadLastModel, saveLastModel } from './storage.ts';

test('last model survives reopening while an empty filter selection does not erase it', t => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) } });
  t.after(() => { if (original) Object.defineProperty(globalThis, 'localStorage', original); else Reflect.deleteProperty(globalThis, 'localStorage'); });
  assert.equal(loadLastModel(), '');
  saveLastModel('provider/my-paid-model'); assert.equal(loadLastModel(), 'provider/my-paid-model');
  saveLastModel(''); assert.equal(loadLastModel(), 'provider/my-paid-model');
  saveLastModel('provider/another-model:free'); assert.equal(loadLastModel(), 'provider/another-model:free');
});

test('blocked browser storage does not break the AI editor', t => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('storage blocked'); } });
  t.after(() => { if (original) Object.defineProperty(globalThis, 'localStorage', original); else Reflect.deleteProperty(globalThis, 'localStorage'); });
  assert.equal(loadLastModel(), ''); assert.doesNotThrow(() => saveLastModel('provider/model'));
});
