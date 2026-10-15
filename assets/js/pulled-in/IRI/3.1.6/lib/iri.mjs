class IRI {
  /** @type {string} */  #str;
  constructor(str) {
    this.#str = str;
  }
  /**
   * 
   * @param {*} other 
   * @returns {boolean}
   */
  equals(other) {
    if (!(other instanceof IRI)) return false;
    return this.toString() === other.toString();
  }

  /**
   * @returns {string}
   */
  toString() {
    return this.#str;
  }
}

export { IRI };
