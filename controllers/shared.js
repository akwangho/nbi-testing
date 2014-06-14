// Prevent user to change the enum
var CookieStoreEnum = Object.freeze({
    "STORE": "STORE FORM DATA TO COOKIE",
    "RESTORE": "RESTORE FORM DATA FROM COOKIE"
});

function handleFormDataWithCookie(attributeArray, cookieStoreEnum, $scope, $cookieStore) {
    angular.forEach(attributeArray, function(value) {
        if (cookieStoreEnum == CookieStoreEnum.STORE) {
            $cookieStore.put(value, $scope[value]);
        }
        else { // restore
            $scope[value] = $cookieStore.get(value) !== undefined ? $cookieStore.get(value) : $scope[value];
        }
    })
}

/* Converts an object into a key/value par with an optional prefix. Used for converting objects to a query string */
var qs = function(obj, prefix){
    var str = [];
    for (var p in obj) {
        var k = prefix ? prefix + "[" + p + "]" : p,
            v = obj[k];
        str.push(angular.isObject(v) ? qs(v, k) : (k) + "=" + encodeURIComponent(v));
    }
    return str.join("&");
}

var getReadableTime = function () {
    var currentDate = new Date();
    return (currentDate.getMonth() + 1) + "/"
        + currentDate.getDate() + "/" +
        + currentDate.getFullYear() + " @ "
        + currentDate.getHours() + ":"
        + currentDate.getMinutes() + ":"
        + currentDate.getSeconds();
};