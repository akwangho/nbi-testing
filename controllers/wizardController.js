angular.module("wizard").controller("wizardCtrl",
    function ($scope, $http, $cookieStore, $interval, $window, $timeout) {
        $scope.ONE_PORT_GROUP = "One Port Group";
        $scope.TWO_PORT_GROUP = "Two Port Group";
        $scope.WIZARD_URL = 'adminweb/setupWizard';

        var DataToBeStoredInCookie = [
            "szIp",
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
            "adminPass1",
            "isPG2Dhcp",
            "dpIp",
            "dpNetmask",
            "dpGateway",
            "appendIpToClusterName"
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
        $scope.isPG2Dhcp = true;
        $scope.primaryDns = '172.17.17.16';
        $scope.clusterType = 'new';
        $scope.ntpServer = 'pool.ntp.org';
        $scope.clusterNodePassword = 'admin!234';
        $scope.adminPass1 = 'admin!234';
        $scope.appendIpToClusterName = true;

        $scope.toolTipSzIP = "This can reach corporate network (172.17.x.x) and embedded team server room network (192.168.x.x).";
        $scope.toolTipClusterName = "Cluster/Controller name allows only (0-9), (a-Z), _ (underscore) and - (dash).";

        handleFormDataWithCookie(DataToBeStoredInCookie, CookieStoreEnum.RESTORE, $scope, $cookieStore);

        $scope.onClusterControllerNameChange = function () {
            $scope.bladeName = $scope.clusterName;
        };


        $scope.doSetup = function () {
            handleFormDataWithCookie(DataToBeStoredInCookie, CookieStoreEnum.STORE, $scope, $cookieStore);
            $scope.requestContent = {
                "portConfig": $scope.portGroup == $scope.ONE_PORT_GROUP? 1: 2,
                "createClusterType": $scope.clusterType,
                "clusterName": $scope.appendIpToClusterName? $scope.clusterName + "_" +
                    ($scope.isPG1Dhcp? $scope.szIp: $scope.br0Ip).replace(".", "_"): $scope.clusterName,
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

                "by-dhcp-slot-DataPlane0": $scope.isPG2Dhcp,
                "ip-slot-DataPlane0": $scope.dpIp,
                "netmask-slot-DataPlane0": $scope.dpNetmask,
                "gateway-slot-DataPlane0": $scope.dpGateway,

                "defaultGateway": 'br0',
                "primaryDns": $scope.primaryDns,
                "secondaryDns": $scope.secondaryDns,
                "admin-pass1": $scope.adminPass1,
                "admin-pass2": $scope.adminPass1,
                "enable-pass1": $scope.adminPass1,
                "enable-pass2": $scope.adminPass1,
                "ethers": 'br0',
                "slots": $scope.portGroup == $scope.ONE_PORT_GROUP? '': 'DataPlane0',
                "mgmtIp": $scope.mgmtIp
            };

            var checkNewUrl = function () {
                $scope.newIP = $scope.isPG1Dhcp? $scope.szIp: $scope.br0Ip ;

                var setTimerToCheckUrl = function () {
                    var maxRetry = 60; // times
                    var retryInterval = 5000; // milliseconds
                    var _retryCount = 0;
                    $scope.urlCheckTimer = $interval(function() {
                        sendRequest(genBaseUrl($scope.newIP), $scope.WIZARD_URL + "?action=isSetupRunning&t=" + new Date().getTime(), function () {
                            $window.location.href = genBaseUrl($scope.newIP);
                        }, "IGNORE_ERROR");
                        _retryCount++;
                        if (_retryCount >= maxRetry) {
                            $scope.error = "Can't get response within " + maxRetry * retryInterval/1000 + " seconds."
                        }
                        console.log("(" + _retryCount + "/" + maxRetry + ")Checking new URL... " + $scope.newIP);
                    }, retryInterval, maxRetry);
                };
                $timeout(setTimerToCheckUrl, 30 * 1000); // delay 30 s then start query
            };

            $scope.lastRequestContent = angular.copy($scope.requestContent);
            sendRequest(genBaseUrl($scope.szIp), $scope.WIZARD_URL, checkNewUrl, $scope.requestContent);
        };

        function genBaseUrl(ip) {
            return 'http://' + ip + ':8080/'
        }

        function sendRequest(requestUrl, postfix, callback, req, ignoreError) {
            $http({
                url: '/proxy',
                method: "POST",
                data: {
                    requestUrl: requestUrl + (postfix?postfix:'') + (req?"?"+qs(req):'')
                }
            }).success(function (data) {
                $scope.requestContent = undefined;
                if (data.errno && !ignoreError) {
                    $scope.error = data;
                    return;
                }
                $scope.response = data;
                if (data['result'] == true && callback) {
                    callback();
                }
            }).error(function (error) {
                if (!ignoreError) {
                    $scope.error = error;
                }
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

