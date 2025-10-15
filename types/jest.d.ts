// types/jest.d.ts
/// <reference types="jest" />
/// <reference types="@testing-library/jest-native" />

// Declaraciones globales para Jest
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeTruthy(): R;
      toBeFalsy(): R;
      toBeDefined(): R;
      toBeUndefined(): R;
      toBeNull(): R;
      toBe(expected: any): R;
      toEqual(expected: any): R;
      toMatch(expected: string | RegExp): R;
      toContain(expected: any): R;
      toHaveLength(expected: number): R;
      toBeCloseTo(expected: number, precision?: number): R;
      toBeGreaterThan(expected: number): R;
      toBeGreaterThanOrEqual(expected: number): R;
      toBeLessThan(expected: number): R;
      toBeLessThanOrEqual(expected: number): R;
      toHaveBeenCalled(): R;
      toHaveBeenCalledWith(...args: any[]): R;
      toHaveBeenCalledTimes(expected: number): R;
      toMatchObject(expected: any): R;
    }
  }
}

export {};
