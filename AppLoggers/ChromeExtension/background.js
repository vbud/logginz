var notification = webkitNotifications.createNotification("",
  "Simple Background App",
  "A background window has been created");
notification.show();
chrome.tabs.onUpdated.addListener( function(tabId, changeInfo, tab) {
  console.log(changeInfo.url);
});
