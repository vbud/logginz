document.addEventListener('keydown', function(e) {
  console.log({
    timestamp: new Date(),
    keycode: e.which,
    userID: '1'
  });
});
