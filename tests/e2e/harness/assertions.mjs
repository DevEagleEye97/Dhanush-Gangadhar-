/**
 * Fluent Assertion Library for E2E Test Suite
 * Built on native node:assert/strict with assertion counting and chainable negation (.not)
 */
import assert from 'node:assert/strict';

let totalAssertions = 0;

export function getAssertionCount() {
  return totalAssertions;
}

export function resetAssertionCount() {
  totalAssertions = 0;
}

export function incrementAssertionCount() {
  totalAssertions++;
}

class Expectation {
  constructor(actual, isNegated = false) {
    this.actual = actual;
    this.isNegated = isNegated;
  }

  get not() {
    return new Expectation(this.actual, !this.isNegated);
  }

  _record() {
    incrementAssertionCount();
  }

  _fail(message, expected, actual) {
    const error = new assert.AssertionError({
      message: message || 'Assertion failed',
      actual: actual !== undefined ? actual : this.actual,
      expected: expected,
      stackStartFn: this._record,
    });
    throw error;
  }

  toBe(expected) {
    this._record();
    const matches = Object.is(this.actual, expected);
    if (this.isNegated) {
      if (matches) {
        this._fail(`Expected value NOT to be ${JSON.stringify(expected)}`, expected, this.actual);
      }
    } else {
      if (!matches) {
        this._fail(`Expected ${JSON.stringify(this.actual)} to be ${JSON.stringify(expected)}`, expected, this.actual);
      }
    }
    return this;
  }

  toEqual(expected) {
    this._record();
    let deepEqual = false;
    try {
      assert.deepStrictEqual(this.actual, expected);
      deepEqual = true;
    } catch {
      deepEqual = false;
    }

    if (this.isNegated) {
      if (deepEqual) {
        this._fail(`Expected values NOT to be deeply equal`, expected, this.actual);
      }
    } else {
      if (!deepEqual) {
        // Let assert.deepStrictEqual throw its detailed diff
        assert.deepStrictEqual(this.actual, expected);
      }
    }
    return this;
  }

  toBeNull() {
    return this.toBe(null);
  }

  toBeUndefined() {
    return this.toBe(undefined);
  }

  toBeDefined() {
    this._record();
    const isDefined = this.actual !== undefined;
    if (this.isNegated) {
      if (isDefined) {
        this._fail(`Expected value to be undefined, but got ${typeof this.actual}`, undefined, this.actual);
      }
    } else {
      if (!isDefined) {
        this._fail(`Expected value to be defined, but got undefined`, 'defined value', undefined);
      }
    }
    return this;
  }

  toBeTruthy() {
    this._record();
    const isTruthy = Boolean(this.actual);
    if (this.isNegated) {
      if (isTruthy) {
        this._fail(`Expected ${JSON.stringify(this.actual)} to be falsy`, false, this.actual);
      }
    } else {
      if (!isTruthy) {
        this._fail(`Expected ${JSON.stringify(this.actual)} to be truthy`, true, this.actual);
      }
    }
    return this;
  }

  toBeFalsy() {
    this._record();
    const isFalsy = !this.actual;
    if (this.isNegated) {
      if (isFalsy) {
        this._fail(`Expected ${JSON.stringify(this.actual)} to be truthy`, true, this.actual);
      }
    } else {
      if (!isFalsy) {
        this._fail(`Expected ${JSON.stringify(this.actual)} to be falsy`, false, this.actual);
      }
    }
    return this;
  }

  toContain(item) {
    this._record();
    let contains = false;
    if (this.actual == null) {
      contains = false;
    } else if (typeof this.actual === 'string' || Array.isArray(this.actual)) {
      contains = this.actual.includes(item);
    } else if (this.actual instanceof Set || this.actual instanceof Map) {
      contains = this.actual.has(item);
    } else if (typeof this.actual === 'object') {
      contains = item in this.actual;
    }

    if (this.isNegated) {
      if (contains) {
        this._fail(`Expected container NOT to contain ${JSON.stringify(item)}`, item, this.actual);
      }
    } else {
      if (!contains) {
        this._fail(`Expected container to contain ${JSON.stringify(item)}`, item, this.actual);
      }
    }
    return this;
  }

  toMatch(pattern) {
    this._record();
    const str = String(this.actual);
    let matched = false;
    if (pattern instanceof RegExp) {
      matched = pattern.test(str);
    } else if (typeof pattern === 'string') {
      matched = str.includes(pattern);
    } else {
      throw new TypeError(`toMatch pattern must be a RegExp or string`);
    }

    if (this.isNegated) {
      if (matched) {
        this._fail(`Expected ${JSON.stringify(str)} NOT to match pattern ${pattern}`, pattern, str);
      }
    } else {
      if (!matched) {
        this._fail(`Expected ${JSON.stringify(str)} to match pattern ${pattern}`, pattern, str);
      }
    }
    return this;
  }

  toHaveLength(length) {
    this._record();
    const actualLength = this.actual?.length ?? this.actual?.size;
    const matches = actualLength === length;
    if (this.isNegated) {
      if (matches) {
        this._fail(`Expected length NOT to be ${length}`, length, actualLength);
      }
    } else {
      if (!matches) {
        this._fail(`Expected length to be ${length}, but got ${actualLength}`, length, actualLength);
      }
    }
    return this;
  }

  toHaveProperty(prop, value) {
    this._record();
    const hasProp = this.actual != null && (prop in this.actual || Object.prototype.hasOwnProperty.call(this.actual, prop));
    if (this.isNegated) {
      if (hasProp && value === undefined) {
        this._fail(`Expected object NOT to have property "${prop}"`, undefined, prop);
      }
      if (hasProp && value !== undefined && Object.is(this.actual[prop], value)) {
        this._fail(`Expected property "${prop}" NOT to equal ${JSON.stringify(value)}`, value, this.actual[prop]);
      }
    } else {
      if (!hasProp) {
        this._fail(`Expected object to have property "${prop}"`, prop, Object.keys(this.actual || {}));
      }
      if (value !== undefined) {
        const matches = Object.is(this.actual[prop], value);
        if (!matches) {
          this._fail(`Expected property "${prop}" to equal ${JSON.stringify(value)}, but got ${JSON.stringify(this.actual[prop])}`, value, this.actual[prop]);
        }
      }
    }
    return this;
  }

  toBeGreaterThan(expected) {
    this._record();
    const pass = this.actual > expected;
    if (this.isNegated) {
      if (pass) {
        this._fail(`Expected ${this.actual} NOT to be greater than ${expected}`, expected, this.actual);
      }
    } else {
      if (!pass) {
        this._fail(`Expected ${this.actual} to be greater than ${expected}`, expected, this.actual);
      }
    }
    return this;
  }

  toBeLessThan(expected) {
    this._record();
    const pass = this.actual < expected;
    if (this.isNegated) {
      if (pass) {
        this._fail(`Expected ${this.actual} NOT to be less than ${expected}`, expected, this.actual);
      }
    } else {
      if (!pass) {
        this._fail(`Expected ${this.actual} to be less than ${expected}`, expected, this.actual);
      }
    }
    return this;
  }

  toBeGreaterThanOrEqual(expected) {
    this._record();
    const pass = this.actual >= expected;
    if (this.isNegated) {
      if (pass) {
        this._fail(`Expected ${this.actual} NOT to be >= ${expected}`, expected, this.actual);
      }
    } else {
      if (!pass) {
        this._fail(`Expected ${this.actual} to be >= ${expected}`, expected, this.actual);
      }
    }
    return this;
  }

  toBeLessThanOrEqual(expected) {
    this._record();
    const pass = this.actual <= expected;
    if (this.isNegated) {
      if (pass) {
        this._fail(`Expected ${this.actual} NOT to be <= ${expected}`, expected, this.actual);
      }
    } else {
      if (!pass) {
        this._fail(`Expected ${this.actual} to be <= ${expected}`, expected, this.actual);
      }
    }
    return this;
  }

  toThrow(expectedError) {
    this._record();
    const target = this.actual;

    const checkError = (err) => {
      if (expectedError) {
        if (expectedError instanceof RegExp) {
          if (!expectedError.test(err.message)) {
            this._fail(`Expected error message to match ${expectedError}, got "${err.message}"`, expectedError, err.message);
          }
        } else if (typeof expectedError === 'string') {
          if (!err.message.includes(expectedError)) {
            this._fail(`Expected error message to contain "${expectedError}", got "${err.message}"`, expectedError, err.message);
          }
        } else if (typeof expectedError === 'function') {
          if (!(err instanceof expectedError)) {
            this._fail(`Expected error to be instance of ${expectedError.name}, got ${err.constructor.name}`, expectedError.name, err.constructor.name);
          }
        }
      }
    };

    if (typeof target === 'function') {
      let threw = false;
      let thrownError = null;
      try {
        const result = target();
        if (result && typeof result.then === 'function') {
          return result.then(
            () => {
              if (!this.isNegated) {
                this._fail('Expected async function to throw, but it resolved successfully');
              }
            },
            (err) => {
              if (this.isNegated) {
                this._fail(`Expected async function NOT to throw, but it threw: ${err.message}`, undefined, err.message);
              } else {
                checkError(err);
              }
            }
          );
        }
      } catch (err) {
        threw = true;
        thrownError = err;
      }

      if (this.isNegated) {
        if (threw) {
          this._fail(`Expected function NOT to throw, but it threw: ${thrownError.message}`, undefined, thrownError.message);
        }
      } else {
        if (!threw) {
          this._fail('Expected function to throw an error, but it did not throw');
        }
        checkError(thrownError);
      }
      return this;
    }

    if (target && typeof target.then === 'function') {
      return target.then(
        () => {
          if (!this.isNegated) {
            this._fail('Expected promise to reject, but it resolved');
          }
        },
        (err) => {
          if (this.isNegated) {
            this._fail(`Expected promise NOT to reject, but it rejected: ${err.message}`, undefined, err.message);
          } else {
            checkError(err);
          }
        }
      );
    }

    throw new TypeError('toThrow() must be called on a function or a Promise');
  }

  // --- HTTP & Web API Matchers ---

  toHaveStatus(expectedStatus) {
    this._record();
    const actualStatus = typeof this.actual === 'number' ? this.actual : this.actual?.status;
    const matches = actualStatus === expectedStatus;
    if (this.isNegated) {
      if (matches) {
        this._fail(`Expected HTTP status NOT to be ${expectedStatus}`, expectedStatus, actualStatus);
      }
    } else {
      if (!matches) {
        this._fail(`Expected HTTP status to be ${expectedStatus}, but got ${actualStatus}`, expectedStatus, actualStatus);
      }
    }
    return this;
  }

  toHaveHeader(headerName, expectedPattern) {
    this._record();
    let headerVal = null;
    if (this.actual?.headers) {
      if (typeof this.actual.headers.get === 'function') {
        headerVal = this.actual.headers.get(headerName);
      } else {
        const lower = headerName.toLowerCase();
        for (const [k, v] of Object.entries(this.actual.headers)) {
          if (k.toLowerCase() === lower) {
            headerVal = v;
            break;
          }
        }
      }
    }

    const hasHeader = headerVal !== null && headerVal !== undefined;
    if (this.isNegated) {
      if (hasHeader && expectedPattern === undefined) {
        this._fail(`Expected header "${headerName}" NOT to be present`, undefined, headerVal);
      }
      if (hasHeader && expectedPattern !== undefined) {
        const matched = expectedPattern instanceof RegExp ? expectedPattern.test(headerVal) : headerVal.includes(expectedPattern);
        if (matched) {
          this._fail(`Expected header "${headerName}" NOT to match ${expectedPattern}`, expectedPattern, headerVal);
        }
      }
    } else {
      if (!hasHeader) {
        this._fail(`Expected header "${headerName}" to be present on response`, headerName, null);
      }
      if (expectedPattern !== undefined) {
        const matched = expectedPattern instanceof RegExp ? expectedPattern.test(headerVal) : headerVal.includes(expectedPattern);
        if (!matched) {
          this._fail(`Expected header "${headerName}" to match ${expectedPattern}, but got "${headerVal}"`, expectedPattern, headerVal);
        }
      }
    }
    return this;
  }

  toBeJson() {
    this._record();
    let isJson = false;
    let contentType = null;

    if (this.actual?.headers) {
      contentType = typeof this.actual.headers.get === 'function' 
        ? this.actual.headers.get('content-type') 
        : this.actual.headers['content-type'];
      if (contentType && contentType.toLowerCase().includes('application/json')) {
        isJson = true;
      }
    }

    if (!isJson && typeof this.actual === 'string') {
      try {
        JSON.parse(this.actual);
        isJson = true;
      } catch {
        isJson = false;
      }
    }

    if (this.isNegated) {
      if (isJson) {
        this._fail(`Expected response NOT to be JSON`, 'non-JSON', contentType || this.actual);
      }
    } else {
      if (!isJson) {
        this._fail(`Expected response to have JSON content type or parseable JSON string`, 'application/json', contentType || this.actual);
      }
    }
    return this;
  }
}

export function expect(actual) {
  return new Expectation(actual);
}

const assertions = {
  expect,
  getAssertionCount,
  resetAssertionCount,
  incrementAssertionCount,
};

export default assertions;
