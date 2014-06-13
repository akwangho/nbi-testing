angular.module("wizard").controller("wizardCtrl",
    function ($scope, $http, $cookieStore) {
        $scope.ONE_PORT_GROUP = "One Port Group";
        $scope.TWO_PORT_GROUP = "Two Port Group";

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
            "bladeDesc",
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
        $scope.advance = true;
        $scope.portGroup = $scope.ONE_PORT_GROUP;
        $scope.isPG1Dhcp = true;
        $scope.primaryDns = '172.17.17.16';
        $scope.clusterType = 'new';
        $scope.bladeDesc = '-- Setup by One Button Setup --';
        $scope.ntpServer = 'pool.ntp.org';
        $scope.clusterNodePassword = 'admin!234';
        $scope.adminPass1 = 'admin!234';

        handleFormDataWithCookie(DataToBeStoredInCookie, CookieStoreEnum.RESTORE, $scope, $cookieStore);

        $scope.onClusterControllerNameChange = function () {
            $scope.bladeName = $scope.clusterName;
        };


        $scope.doSetup = function () {
            handleFormDataWithCookie(DataToBeStoredInCookie, CookieStoreEnum.STORE, $scope, $cookieStore);
            var req = {
                "portConfig": $scope.portGroup == $scope.ONE_PORT_GROUP? 1: 2,
                "createClusterType": $scope.clusterType,
                "clusterName": $scope.clusterName,
                "bladeName": $scope.bladeName,
                "bladeDesc": $scope.bladeDesc,
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
            sendRequest(req, null);
        };

        function sendRequest(req, callback) {
            $scope.lastRequestContent = angular.copy(req);

            $http({
                url: '/proxy',
                method: "POST",
                data: {
                    requestUrl: 'http://' + $scope.szIp + ':8080/adminweb/setupWizard?' +
                        qs($scope.lastRequestContent)
                }
            }).success(function (data) {
                $scope.lastRequestContent = undefined;
                if (data.errno) {
                    $scope.error = data;
                    return;
                }
                $scope.response = data;
                if (callback) {
                    callback();
                }
            }).error(function (error) {
                $scope.error = error;
            }).then(function () {
                $scope.lastRequestContent = undefined;
            })
        }
});

