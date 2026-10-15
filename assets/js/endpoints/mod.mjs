/**
 * Endpoints used by the service worker to respond to content-script requests.
 */

import { getViewModel } from "./get-view-model.mjs";

const 
endpoints = {
  'get view model for rdf': getViewModel
};

export {endpoints};
