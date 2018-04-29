chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('application.html', {
    state: 'fullscreen',
  });
});
