import { endpoints } from "./assets/js/endpoints/mod.mjs";

// respond to incoming requests sent by the content script
chrome.runtime.onMessage.addListener(async (request, _sender, sendResponse) => {
  try {
    // throw new Error("l");
    
    // console.debug('request', request);
    // sendResponse({status: {code: 501, message: 'not implemented'}}); return;

    // find the endpoint implementation for the content-script's request
    const endpoint = endpoints[request.endpoint];
    if (!endpoint) {
      // console.debug('endpoint not found');
      sendResponse({status: {code: 404, message: 'not found'}}); return;
    }

    // return a response
    // console.debug('running the endpoint');
    const responseBody = await endpoint(request.body);
    // console.debug('response body', responseBody);
    sendResponse({status: {code: 200, message: 'OK'}, body: responseBody});

  } catch (error) {
    sendResponse({status: {code: 500, message: `internal server error: ${error}`}});
  }
});

