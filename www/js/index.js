var app = {
    RegID: "",
	DeviceType: "",
	DeviceId: "",
	// Application Constructor
    initialize: function() {
        this.bindEvents();
		//TestRun();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicity call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');
        var pushNotification = window.plugins.pushNotification;
        if (device.platform == 'android' || device.platform == 'Android') {
            pushNotification.register(this.successHandler, this.errorHandler, { "senderID": "480409925201", "ecb": "app.onNotificationGCM" });
        } else {
            pushNotification.register(this.tokenHandler, this.errorHandler, { "badge": "true", "sound": "true", "alert": "true", "ecb": "app.onNotificationAPN" });
        }
    },
    // result contains any message sent from the plugin call
    successHandler: function(result) {
        //alert('Callback Success! Result = '+result)
    },
    tokenHandler: function (msg) {
        //console.log("Token Handler " + msg);
        app.RegID = msg;
		app.DeviceType = "iPhone";
		CheckDevice();
    },
    errorHandler:function(error) {
        //alert(error);
    },
    onNotificationGCM: function(e) {
        switch( e.event )
        {
            case 'registered':
                if ( e.regid.length > 0 )
                {
                    app.RegID = e.regid;
					app.DeviceType = "Android";
					CheckDevice();
                }
            break;
 
            case 'message':
              // this is the actual push notification. its format depends on the data model from the push server
              //alert('message = '+e.message+' msgcnt = '+e.msgcnt);
			  ShowMain();
            break;
 
            case 'error':
              //alert('GCM error = '+e.msg);
            break;
 
            default:
              //alert('An unknown GCM event has occurred');
              break;
        }
    },
    onNotificationAPN: function(event) {
        var pushNotification = window.plugins.pushNotification;
        //alert("Running in JS - onNotificationAPN - Received a notification! " + event.alert);
        
        if (event.alert) {
            navigator.notification.alert(event.alert);
			ShowMain();
        }
        if (event.badge) {
            pushNotification.setApplicationIconBadgeNumber(this.successHandler, this.errorHandler, event.badge);
        }
        if (event.sound) {
            var snd = new Media(event.sound);
            snd.play();
        }
    }
};
function CheckDevice() {
	$.get(WebServicesUrl + 'Device/', { Type: app.DeviceType, Id: app.RegID },
	function (data) {
		if (data.OK == 1) {
			if (data.Active) ShowMain(); else ShowActivate();
		} else ShowSignUp();
	}, 'json');
}
function ShowMain() {
	ShowPanel("divAlerts");
	$.get(WebServicesUrl + 'MyMessages/', { Type: app.DeviceType, DeviceId: app.RegID },
	function (data) {
		if (data.OK == 1) ShowMessages(data.List); else AlertPopup(data.Msg);
	}, 'json');
	/*var telephoneNumber = cordova.require("cordova/plugin/telephonenumber");
	telephoneNumber.get(function(result) {
		$("#divAlerts").append('<h3>' + result + '</h3>');
	}, function() {
		$("#divAlerts").append('<h3>Number Not Found</h3>');
	});*/
}
function ShowMessages(list) {
	if (list.length > 0) {
		var ul = $('<ul data-role="listview"></ul>');
		$("#divList").empty().append(ul);
		$.each(list, function(i,item) {
			ul.append($('<li></li>').append($('<a id="lnkMsg-' + item.Id + '" href="#alertpage" data-transition="slide"></a>')
			.append('<h2>' + item.From + '</h2><p>' + item.Subj + '</p>').on("click", function() { OpenMessage(item, item.Secure); })));
		});
	} else $("#divList").empty().append('<li data-corners="false" data-shadow="false" data-iconshadow="true" data-wrapperels="div" data-icon="arrow-r" data-iconpos="right" data-theme="c" class="ui-btn ui-btn-icon-right ui-li-has-arrow ui-li ui-btn-up-c"><div class="ui-btn-inner ui-li"><div class="ui-btn-text"><a href="javascript:;" class="ui-link-inherit wrap-text" style="text-align:center">You have no new notifications to show</a></div></div></li>');
	$("#divList").trigger('create');
}
var MessageCache = new Object();
function OpenMessage(item, secure) {
	if (MessageCache[item.Id]) ShowMessage(item.Id);
	else {
		if (secure) var url = WebServicesSecureUrl; else var url = WebServicesUrl;
		$.get(url + 'MyMessage/', { Type: app.DeviceType, DeviceId: app.RegID, Id: item.Id },
		function (data) {
			if (data.OK == 1) {item.Body = data.Body; MessageCache[item.Id] = item; ShowMessage(item.Id);}
		}, 'json');
	}
}
function ShowMessage(id) {
	$("#msgBody").html(MessageCache[id].Body);
	$("#msgSubj").html(MessageCache[id].Subj);
	$("#msgFrom").html(MessageCache[id].From);
}
function ShowSignUp() {
	$("#ulCountry").empty();
	$.each(CountryObj, function(i, item) {
		$("#ulCountry").append($('<li></li>').append($('<a href="javascript:;" data-direction="reverse" data-transition="slidedown"></a>').append(item.Name + ' (+' + item.Code + ')').on("click", function() {
			$("#hidCountry").val(item.Code);
			$("#lnkCountry .ui-btn-text").html(item.Name + ' (+' + item.Code + ')');
			HistoryPrev();
		})));
	});
	$("#ulCountry").trigger('create');
	$("#hidCountry").val("0");
	/*var telephoneNumber = cordova.require("cordova/plugin/telephonenumber");
	telephoneNumber.get(function(result) {
		$("#txtPhoneNumber").val(result);
	}, function() {
		$("#txtPhoneNumber").val("");
	});*/
	ShowPanel("divSignUp");
}
function SignUp() {
	if ($("#hidCountry").val() == "" || $("#hidCountry").val() == "0") AlertPopup("Please select a country");
	else if ($("#txtPhoneNumber").val() == "") AlertPopup("Please enter your mobile number");
	else {
		$.post(WebServicesUrl + 'Device/', { Type: app.DeviceType, Id: app.RegID, DialCode: $("#hidCountry").val(), Number: $("#txtPhoneNumber").val(), Promo: $("#chkPromo").is(":checked") },
		function (data) {
			if (data.OK == 1) ShowActivate();
		}, 'json');
	}
}
function ShowActivate() {
	ShowPanel("divActivate");
}
function Activate() {
	if ($("#txtActCode").val() == "") AlertPopup("Please enter the activation PIN");
	else {
		$.post(WebServicesUrl + 'Device/Activate', { Type: app.DeviceType, Id: app.RegID, PIN: $("#txtActCode").val() },
		function (data) {
			if (data.OK == 1) ShowMain();
			else AlertPopup("The activation PIN entered is incorrect. Please try again.");
		}, 'json');
	}
}
function TestRun() {
	app.RegID = "ABC123";
	app.DeviceType = "Test";
	CheckDevice();
}
function ShowInfo() {
	console.log(app.RegID);
	console.log(app.DeviceType);
}
function ShowPanel(panel) {
	$(".screen-panel").hide();
	$("#" + panel).show();
}