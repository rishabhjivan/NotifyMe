$(document).bind("mobileinit", function () {
    $.extend($.mobile, { ajaxEnabled: false });
});
function NavigateTo(url) {
    location.replace(url.replace("~/", WebServicesUrl));
}