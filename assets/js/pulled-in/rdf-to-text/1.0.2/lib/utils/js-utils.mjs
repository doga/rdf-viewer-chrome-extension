/**
 * JavaScript utilities.
 * @module jsutils
 */

function isNull(val) {
  return val === null;
}

function isUndefined(val) {
  return typeof val === 'undefined';
}

function isArray(val) {
  return Object.prototype.toString.call(val) === '[object Array]';
}

function isPlainObject(val) {
  return Object.prototype.toString.call(val) === '[object Object]';
}

function isString(val) {
  return typeof val === 'string';
}

function isEmptyString(val) {
  return isString(val) && val.length === 0;
}

function isEmptyArray(val) {
  return isArray(val) && val.length === 0;
}

function isBoolean(val) {
  return typeof val === 'boolean';
}

export {isNull, isUndefined, isArray, isPlainObject, isString, isEmptyString, isEmptyArray, isBoolean};
