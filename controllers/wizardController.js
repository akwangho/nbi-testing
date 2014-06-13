angular.module("wizard").controller("wizardCtrl",
    function ($scope, $http, $cookieStore, $interval, $window) {
        $scope.ONE_PORT_GROUP = "One Port Group";
        $scope.TWO_PORT_GROUP = "Two Port Group";
        $scope.WIZARD_URL = 'adminweb/setupWizard';

        var DataToBeStoredInCookie = [
            "szIp",
            "advance",
            "portGroup",
            "isPG1Dhcp",
            "br0Ip",
            "br0Netmask",
            "br0Gateway",
            "primaryDns",
            "secondaryDns",
            "clusterType",
            "clusterName",
            "bladeName",
            "ntpServer",
            "clusterSeeds",
            "clusterNodePassword",
            "adminPass1"
        ];

        // Init all data that will be stored in cookie
        angular.forEach(DataToBeStoredInCookie, function(value) {
            $scope[value] = '';
        });

        // Initial values
        $scope.szIp = '172.17.';
        $scope.advance = false;
        $scope.portGroup = $scope.ONE_PORT_GROUP;
        $scope.isPG1Dhcp = true;
        $scope.primaryDns = '172.17.17.16';
        $scope.clusterType = 'new';
        $scope.ntpServer = 'pool.ntp.org';
        $scope.clusterNodePassword = 'admin!234';
        $scope.adminPass1 = 'admin!234';

        handleFormDataWithCookie(DataToBeStoredInCookie, CookieStoreEnum.RESTORE, $scope, $cookieStore);

        $scope.onClusterControllerNameChange = function () {
            $scope.bladeName = $scope.clusterName;
        };


        $scope.doSetup = function () {
            handleFormDataWithCookie(DataToBeStoredInCookie, CookieStoreEnum.STORE, $scope, $cookieStore);
            $scope.requestContent = {
                "portConfig": $scope.portGroup == $scope.ONE_PORT_GROUP? 1: 2,
                "createClusterType": $scope.clusterType,
                "clusterName": $scope.clusterName,
                "bladeName": $scope.bladeName,
                "bladeDesc": getReadableTime() + ' Setup by One Button Setup',
                "DiscoveryProtocolType": 'Tcp',
                "ntpServer": $scope.ntpServer,
                "clusterSeeds": $scope.clusterSeeds,
                "clusterNodePassword": $scope.clusterNodePassword,
                "by-dhcp-br0": $scope.isPG1Dhcp,
                "ip-br0": $scope.br0Ip,
                "netmask-br0": $scope.br0Netmask,
                "gateway-br0": $scope.br0Gateway,
                "defaultGateway": 'br0',
                "primaryDns": $scope.primaryDns,
                "secondaryDns": $scope.secondaryDns,
                "admin-pass1": $scope.adminPass1,
                "admin-pass2": $scope.adminPass1,
                "enable-pass1": $scope.adminPass1,
                "enable-pass2": $scope.adminPass1,
                "ethers": 'br0',
                "slots": '',
                "mgmtIp": $scope.mgmtIp
            };

            var checkNewUrl = function () {
                $scope.newIP = '';
                if ($scope.isPG1Dhcp) {
                    $scope.newIP = $scope.szIp;
                }
                else {
                    $scope.newIP = $scope.br0Ip;
                }
                var maxRetry = 100;
                var retryCount = 0;
                var retryInterval = 3000; // milliseconds
                $scope.urlCheckTimer = $interval(function() {
                    sendRequest(genBaseUrl($scope.newIP), $scope.WIZARD_URL + "?action=isSetupRunning&t=" + new Date().getTime(), function () {
                        $window.location.href = genBaseUrl($scope.newIP);
                    });
                    retryCount++;
                    if (retryCount >= maxRetry) {
                        $scope.error = "Can't get response within " + maxRetry * retryInterval/1000 + " seconds."
                    }
                    console.log("(" + retryCount + "/" + maxRetry + ")Checking new URL... " + $scope.newIP);
                }, retryInterval, maxRetry);
            };

            $scope.lastRequestContent = angular.copy($scope.requestContent);
            sendRequest(genBaseUrl($scope.szIp), $scope.WIZARD_URL, checkNewUrl, $scope.requestContent);
        };

        function genBaseUrl(ip) {
            return 'http://' + ip + ':8080/'
        }

        function sendRequest(requestUrl, postfix, callback, req) {
            $http({
                url: '/proxy',
                method: "POST",
                data: {
                    requestUrl: requestUrl + (postfix?postfix:'') + (req?"?"+qs(req):'')
                }
            }).success(function (data) {
                $scope.requestContent = undefined;
                if (data.errno) {
                    $scope.error = data;
                    return;
                }
                $scope.response = data;
                if (data['result'] == true && callback) {
                    callback();
                }
            }).error(function (error) {
                $scope.error = error;
            }).then(function () {
                $scope.requestContent = undefined;
            })
        }

        $scope.stopCheckingUrl = function() {
            if (angular.isDefined($scope.urlCheckTimer)) {
                $interval.cancel($scope.urlCheckTimer);
                $scope.urlCheckTimer = undefined;
            }
        };

        $scope.resetStatus = function () {
            $scope.newIP=null;
            $scope.error=false;
            $scope.showResponseDetail=false;
            $scope.showRequestDetail=false;
        };

        $scope.$on('$destroy', function() {
            // Make sure that the interval is destroyed too
            $scope.stopCheckingUrl();
        });
});

