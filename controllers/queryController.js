/* My first angularjs code. I think I abuse the $scope.
 * Anyway, it just a practice. Maybe will refactor afterward.
 */

angular.module("nbi")
    .controller("queryCtrl", function($scope, $http) {
        $scope.response = undefined;
        $scope.isCollapsed = true;

        var UserOnlineControl = "UserOnlineControl";
        var GetConfig = "GetConfig";

        $scope.datastore = [];
        $scope.datastore.category = [UserOnlineControl, GetConfig];
        $scope.category = $scope.datastore.category[0];

        $scope.datastore.requestType = [
            {name: 'Status', category: UserOnlineControl},
            {name: 'Login', category: UserOnlineControl},
            {name: 'Logout', category: UserOnlineControl},
            {name: 'LoginAsync', category: UserOnlineControl},
            {name: 'Authorize', category: UserOnlineControl},
            {name: 'Disconnect', category: UserOnlineControl},
            {name: 'EnrichmentInfo', category: UserOnlineControl},
            {name: 'EncryptIP', category: GetConfig},
            {name: 'DecryptIP', category: GetConfig},
            {name: 'ControlBladeIPList', category: GetConfig},
            {name: 'ClusterBladeIPList', category: GetConfig},
            {name: 'ManagementBladeIPList', category: GetConfig}
        ];

        $scope.requestType = $scope.datastore.requestType[0];

        $scope.requestPassword = "admin!234";
        $scope.ueMac = "00:1F:1F:47:57:36";
        $scope.ueIp = "192.168.60.50";
        $scope.reqUrl = "http://172.17.24.144:9080/portalintf";
        $scope.isEncUeMac = true;
        $scope.isEncUeIp = true;
        $scope.encryptedUeMac = undefined;
        $scope.needUsernamePassword = false;
        $scope.ueUsername = "";
        $scope.uePassword = "";

        $scope.requestContent = "";

        function sendRequest(req, callback) {
            var reqTemplate = {
                "Vendor": "Ruckus",
                "RequestPassword": $scope.requestPassword,
                "APIVersion": "1.0",
                "RequestCategory": $scope.category,
                "RequestType": $scope.requestType.name
            };
            if ($scope.category == UserOnlineControl) {
                reqTemplate["UE-IP"] = $scope.encryptedUeIp? $scope.encryptedUeIp: $scope.ueIp;
                reqTemplate["UE-MAC"] = $scope.encryptedUeMac? $scope.encryptedUeMac: $scope.ueMac;
                reqTemplate["UE-Proxy"] = "0";
                if ($scope.needUsernamePassword) {
                    reqTemplate["UE-Username"] = $scope.ueUsername;
                    reqTemplate["UE-Password"] = $scope.uePassword;
                }
            }
            else { // GetConfig
                reqTemplate["UE-IP"] = $scope.ueIp;
            }
            $scope.requestContent = {};
            for (var key2 in reqTemplate) $scope.requestContent[key2] = reqTemplate[key2];
            if (req) {
                for (var key1 in req) $scope.requestContent[key1] = req[key1];
            }

            $http({
                url: '/nbi',
                method: "POST",
                data: {
                    requestUrl: $scope.reqUrl,
                    requestContent: $scope.requestContent
                }
            }).success(function (data) {
                $scope.requestContent = undefined;
                if (data.errno) {
                    $scope.error = data;
                    return;
                }
                $scope.response = data;
                if (callback) {
                    callback(data["ENC-UE-IP"]);
                }
            }).error(function (error) {
                $scope.error = error;
            }).then(function () {
                $scope.requestContent = undefined;
            })
        }

        function sendFinalRequest() {
            if ($scope.isAutoGetConfigForUeMacOngoing || $scope.isAutoGetConfigForUeIpOngoing) {
                return;
            }
            sendRequest();
        }

        $scope.query = function () {
            function prepareRequestForEncryptIP(data) {
                return {
                    "RequestCategory": GetConfig,
                    "RequestType": "EncryptIP",
                    "UE-IP": data
                };
            }

            if ($scope.isEncUeMac && $scope.ueMac && !$scope.encryptedUeMac) {
                var req = prepareRequestForEncryptIP($scope.ueMac);
                $scope.isAutoGetConfigForUeMacOngoing = true;
                sendRequest(req, function(result) {
                    $scope.isAutoGetConfigForUeMacOngoing = false;
                    $scope.encryptedUeMac = result;
                    sendFinalRequest();
                });
            }
            if ($scope.isEncUeIp && $scope.ueIp && !$scope.encryptedUeIp) {
                var req2 = prepareRequestForEncryptIP($scope.ueIp);
                $scope.isAutoGetConfigForUeIpOngoing = true;
                sendRequest(req2, function(result) {
                    $scope.isAutoGetConfigForUeIpOngoing = false;
                    $scope.encryptedUeIp = result;
                    sendFinalRequest();
                });
            }
            if ((($scope.isEncUeMac && $scope.encryptedUeMac) ||  ($scope.isEncUeIp && $scope.encryptedUeIp) ||
                ((!$scope.isEncUeMac && $scope.ueMac) || ($scope.isEncUeIp && $scope.ueIp)))) {
                sendFinalRequest();
            }
        };

        $scope.onRequestTypeChange = function() {
            $scope.needUsernamePassword =
                ($scope.requestType.name == 'Login' || $scope.requestType.name == 'LoginAsync');
        }
    });