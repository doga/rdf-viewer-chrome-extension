const
ui = {
  text: {
    extensionName: browser.i18n.getMessage('extension_name'),
    options      : browser.i18n.getMessage('options'),
  }
};

document.title = `${ui.text.options}・${ui.text.extensionName}`;

// console.debug(`options`,browser);
// console.debug(browser.i18n.getMessage('title'));

