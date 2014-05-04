// chrome.tabs.create({url: chrome.extension.getURL('background.html')});
chrome.tabs.onUpdated.addListener( function(tabId, changeInfo, tab) {
  console.log(changeInfo.url);
});
