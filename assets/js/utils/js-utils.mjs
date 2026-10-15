/**
 * JavaScript utilities.
 * @module jsutil
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

export {isNull, isUndefined, isArray, isPlainObject, isString, isEmptyString};
