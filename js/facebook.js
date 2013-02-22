// Additional JS functions here
window.fbAsyncInit = function() {
  FB.init({
    appId      : '481140815255845', // App ID
    //channelUrl : '//WWW.YOUR_DOMAIN.COM/channel.html', // Channel File
    status     : true, // check login status
    cookie     : true, // enable cookies to allow the server to access the session
    xfbml      : true  // parse XFBML
  });

  if (typeof facebookInit == 'function') {
      facebookInit();
  }

  // Additional init code here
  FB.getLoginStatus(function(response) {
      if (response.status === 'connected') {
          Capsule.ShowExtraFeatures();
          Capsule.loggedIn = true;
      }
      else {
        Capsule.loggedIn = false;
      }
  });

};

function facebookInit() {
  FB.Event.subscribe('auth.authResponseChange', function(response) {
    if (response.status == "connected") {
      Capsule.ShowExtraFeatures();
      Capsule.loggedIn = true;
    }
    else {
      Capsule.HideExtraFeatures();
      Capsule.loggedIn = false;
    }
  });
}

// Load the SDK Asynchronously
(function(d){
   var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
   if (d.getElementById(id)) {return;}
   js = d.createElement('script'); js.id = id; js.async = true;
   js.src = "//connect.facebook.net/en_US/all.js";
   ref.parentNode.insertBefore(js, ref);
 }(document));