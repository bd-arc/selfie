(function($){

    $.application = {

        debug               : false,
        rippleDebug         : ( typeof window.top.ripple !== 'undefined' ) ? true : false,
        localDebug          : ( ( window.navigator.userAgent.match( /(Firefox|Chrome)/i ) ) && !( /mobile/img.test( navigator.userAgent ) ) ) ? true : false,

        o                   : {
            onDocumentReady : function() {},
            onDeviceReady   : function() {},
            onAllReady      : function() {},
            onSplashHide    : function() {},
            onPause         : function() {},
            onResume        : function() {}
        },

        cn                  : {
            prefix          : {
                is          : 'app-is-',
                version     : 'app-version-'
            }
        },

        bodyClass           : new Array(),

        deferred            : {
            documentReady   : $.Deferred(),
            deviceReady     : $.Deferred()
        },

        is                  : {
            protocolHttp    : true,
            protocolFile    : false,

            connected       : true,
            highSpeed       : false,

            hd              : ( window.devicePixelRatio > 1 ) ? true : false,

            connection      : {
                unknown     : true,
                wifi        : false,
                ethernet    : false,
                cell_2g     : false,
                cell_3g     : false,
                cell_4g     : false,
                cell        : false,
                none        : false
            },

            currentConnection   : null,
            networkStateChanged : false,

            documentReady   : false,
            deviceReady     : false,
            allReady        : false,

            desktop         : false,

            android         : false,
            blackberry      : false,
            ios	            : false,
            windowsphone    : false,

            ios7            : false,
            iphone          : false,
            ipad            : false,

            tablet          : false,
            old             : false
        },

        device              : {
            density         : window.devicePixelRatio,
            ua              : window.navigator.userAgent.toLowerCase(),
            appVersion      : navigator.appVersion,
            model           : null,
            platform        : null,
            version         : null,
            cordovaVersion  : null,
            uuid            : null
        },

        viewport            : {
            width           : $(window).width(),
            height          : $(window).height()
        },


        // PRIVATE

        /**
         * Listener for both jQM & Phonegap init
         */
        _bindAllReady : function() {
            var $app = $.application;

            $app._console('_bindAllReady()');

            // Bind to 'deviceReady' only with a 'file:' protocol and when it's not a web browser's local debug
            if( ( $app.is.protocolFile && !$app.localDebug ) || ( $app.is.protocolHttp && $app.rippleDebug ) ) {
                $.when( $app.deferred.documentReady, $app.deferred.deviceReady ).then(function () {
                    $app._deviceDetection( true );
                    $app._allReady( true );
                });
            } else {
                $.when( $app.deferred.documentReady ).then(function () {
                    $app._deviceDetection();
                    $app._allReady();
                });
            }

            $(function() {
                $app._documentReady();
            });

            $(document).one('deviceready', function() {
                $app._deviceReady();
            });
        },

        /**
         * On 'document.ready'...
         */
        _documentReady : function() {
            var $app = $.application;

            $app._console('_documentReady()');

            $app.is.documentReady = true;

            $app.o.onDocumentReady();

            $app.deferred.documentReady.resolve();
        },

        /**
         * On 'deviceready', Phonegap init event
         */
        _deviceReady : function() {
            var $app = $.application;

            $app._console('_deviceReady()');

            $app.is.deviceReady = true;

            /*
            $app._networkDetection();

            // Monitor network connection changes
            $(document).on( 'online', function() {
                console.log( '========== ONLINE ==========' );
                $app._networkDetection();
            });

            $(document).on( 'offline', function() {
                console.log( '========== OFFLINE ==========' );
                $app._networkDetection();
            });
            */

            // Functions from other libraries
            $app.o.onDeviceReady();

            $app.deferred.deviceReady.resolve();
        },

        /**
         * On both jQM & Phonegap init completed
         */
        _allReady : function( usePhonegap ) {
            var $app = $.application;

            $app._console('_allReady()');

            $app.is.allReady = true;

            // Create "is" classes that are going to be appended to <body>
            $.each($app.is, function(index, value){
                if(typeof(value) == 'object' && value != null) {
                    $.each(value, function(subindex, subvalue){
                        if(subvalue) {
                            $app.bodyClass.push($app.cn.prefix.is + index + '-' + subindex);
                        }
                    });
                } else if(value) {
                    $app.bodyClass.push($app.cn.prefix.is + index);
                }
            });

            // Add classes
            var bodyClass = $app.bodyClass.join(' ').toLowerCase();
            $('body').addClass(bodyClass);

            // Determine viewport dimensions
            $app.viewport.width = $(window).width();
            $app.viewport.height = $(window).height();
            if ( $app.is.ios && $app.is.protocolHttp ) {
                $app.viewport.height += 60;
            }

            $app._console('is.documentReady', $app.is.documentReady);
            $app._console('is.deviceReady', $app.is.deviceReady);
            $app._console('is.allReady', $app.is.allReady);

            // Functions using PhoneGap objects
            if ( typeof usePhonegap !== 'undefined' && usePhonegap === true ) {
                // When pausing/resuming the app
                // Manage iOS quirks - Src: http://docs.phonegap.com/en/edge/cordova_events_events.md.html#pause
                // WARNING: device detection is done AFTER deviceready is resolved, so we need this function on _allReady()...
                // var pauseEvent = ( $app.is.ios ) ? 'pause resign' : 'pause';
                // var resumeEvent = ( $app.is.ios ) ? 'resume active' : 'resume';
                $(document).on( 'pause', function() {
                    console.log( '========== PAUSE ==========' );
                    $app.o.onPause();
                });

                $(document).on( 'resume', function() {
                    setTimeout( function() {
                        console.log( '========== RESUME ==========' );
                        $app.o.onResume();
                    }, 0 );
                });

                // Wait before hiding splash
                setTimeout(function() {
                    // Launch functions just before to avoid blinking
                    $app.o.onSplashHide();

                    setTimeout(function() {
                        navigator.splashscreen.hide();
                    }, 500);
                }, 1500);
            }

            // Functions from other libraries
            $app.o.onAllReady();
        },

        /**
         * Check OS properties
         * Rsc: https://github.com/matthewhudson/device.js/blob/master/lib/device.js
         * Rsc: http://stackoverflow.com/questions/17226169/how-to-check-weather-the-device-is-ipad-and-tablet-in-phonegap
         * Rsc: http://stackoverflow.com/questions/7173642/detecting-whether-android-device-is-a-phone-or-a-tablet-with-javascript
         */
        _deviceDetection : function( usePhonegap ) {
            var $app = $.application;

            $app._console('_deviceDetection()');

            // Retrieve device infos (with device object on PhoneGap; with ua on web browser)
            if ( typeof usePhonegap !== 'undefined' && usePhonegap === true ) {
                // Infos
                $app.device.model           = device.model;
                $app.device.platform        = device.platform;
                $app.device.version         = device.version;
                $app.device.cordovaVersion  = device.cordova;
                $app.device.uuid            = device.uuid;

                // Platform
                $app.is.android = (/Android/i).test( $app.device.platform );
                $app.is.blackberry = (/BlackBerry/i).test( $app.device.platform );
                $app.is.ios = (/iOS/i).test( $app.device.platform );
                $app.is.windowsphone = (/(WinCE|Win32NT)/i).test( $app.device.platform );

                // Specific models
                $app.is.iphone = (/iPhone/i).test( $app.device.model );
                $app.is.ipad = (/iPad/i).test( $app.device.model );
            } else {
                // Platform
                $app.is.android = ((/android/i).test($app.device.appVersion) && !/trident/img.test($app.device.ua));
                $app.is.blackberry = (/blackberry/i).test($app.device.ua);
                $app.is.ios = (/(iPhone|iPad|iPod).*AppleWebKit/i).test($app.device.appVersion);
                $app.is.windowsphone = (/(IEMobile|Windows Phone)/i).test($app.device.ua);

                // Specific models
                $app.is.iphone = (/iPhone.*AppleWebKit/i).test($app.device.appVersion);
                $app.is.ipad = (/iPad.*AppleWebKit/i).test($app.device.appVersion);

                // Platform version
                var version, uaIndex;
                if ( $app.is.android ) {
                    uaIndex = ( $app.device.ua.indexOf( 'Android ' ) > -1 ) ? $app.device.ua.indexOf( 'Android ' ) : $app.device.ua.indexOf( 'android ' );
                    if ( uaIndex > -1 ) version = $app.device.ua.substr( uaIndex + 8, 3 );
                } else if ( $app.is.ios ) {
                    uaIndex = ( $app.device.ua.indexOf( 'OS ' ) > -1 ) ? $app.device.ua.indexOf( 'OS ' ) : $app.device.ua.indexOf( 'os ' );
                    if ( uaIndex > -1 ) version = $app.device.ua.substr( uaIndex + 3, 3 ).replace( '_', '.' );
                } else if ( $app.is.windowsphone ) {
                    uaIndex = $app.device.ua.indexOf( 'Windows Phone ' );
                    if ( uaIndex > -1 ) version = $app.device.ua.substr( uaIndex, 6 ).match( /[0-9].[0-9]/ );
                } else {
                    version = 'unknown';
                }

                $app.device.version = version;
            }

            // Detect desktop
            // http://stackoverflow.com/questions/7995752/detect-desktop-browser-not-mobile-with-javascript
            // http://stackoverflow.com/questions/15732847/load-jquery-script-in-desktop-browser-but-not-mobile
            // http://stackoverflow.com/questions/4817029/whats-the-best-way-to-detect-a-touch-screen-device-using-javascript
            var isTouchDevice = function() {
                return 'ontouchstart' in window || 'onmsgesturechange' in window;
            };
            $app.is.desktop = ( /*window.screenX != 0 &&*/ !isTouchDevice() && !( /mobile/img.test( $app.device.ua ) ) ) ? true : false;

            // Push platform version in bodyClass
            if ( typeof $app.device.version !== 'undefined' && $app.device.version != null && $app.device.version != '' && $app.device.version != 'unknown' ) {
                $app.bodyClass.push( $app.cn.prefix.version + $app.device.version.replace( /[.]/g, '-') );
            }

            if ( typeof $app.device.version !== 'undefined' && $app.device.version.length && $app.device.version !== 'unknown' ) {
                // Deal with the fact that version number can be x.y.z (not only x.y) for the float conversion
                var versionNumber = parseFloat( $app.device.version.match( /^[0-9].[0-9]/ ) );

                // Detect old devices (not compatibles with much of CSS3)
                if( ( $app.is.android && versionNumber < 3 )
                    || ( $app.is.ios && versionNumber < 6 )
                    || ( $app.is.windowsphone && versionNumber < 8 )
                    || ( $app.is.blackberry )
                    ) {
                    $app.is.old = true;
                }

                // High capacity devices
                if( ( $app.is.android && versionNumber >= 4 )
                    || ( $app.is.ios && versionNumber >= 6 )
                    || ( $app.is.windowsphone && versionNumber >= 8 )
                    || $app.is.desktop
                    ) {
                    $app.is.fast = true;
                }

                // Deal with iOS 7+ new layout
                if( $app.is.ios && versionNumber >= 7 ) {
                    $app.is.ios7 = true;
                }
            }

            // Detect tablets
            if ( $app.is.ipad || ( $app.is.android && !$app.device.ua.match( /mobile/i ) ) ) {
                $app.is.tablet = true;
            }
            /*
            if ( $(window).width() > 700 && $(window).height() > 700 ) {
                $app.is.tablet = true;
            }
             */

            $app._console('device.model', $app.device.model);
            $app._console('device.platform', $app.device.platform);
            $app._console('device.cordovaVersion', $app.device.cordovaVersion);
            $app._console('device.uuid', $app.device.uuid);

            $app._console('device.version', $app.device.version);

            $app._console('device.ua', $app.device.ua);
            $app._console('device.appVersion', $app.device.appVersion);
            $app._console('device.density', $app.device.density);

            $app._console('is.desktop', $app.is.desktop);

            $app._console('is.android', $app.is.android);
            $app._console('is.blackberry', $app.is.blackberry);
            $app._console('is.ios', $app.is.ios);
            $app._console('is.windowsphone', $app.is.windowsphone);

            $app._console('is.ios7', $app.is.ios7);
            $app._console('is.iphone', $app.is.iphone);
            $app._console('is.ipad', $app.is.ipad);

            $app._console('is.tablet', $app.is.tablet);

            $app._console('is.hd', $app.is.hd);
            $app._console('is.old', $app.is.old);
            $app._console('is.fast', $app.is.fast);

            $app._console('is.protocolHttp', $app.is.protocolHttp);
            $app._console('is.protocolFile', $app.is.protocolFile);
        },

        /**
         * Network connection analysis
         */
        _networkDetection : function() {
            var $app = $.application;

            $app._console('_networkDetection()');

            if($app.is.protocolFile && $app.is.deviceReady) {
                var states = {};
                states[Connection.UNKNOWN]  = 'unknown';
                states[Connection.ETHERNET] = 'ethernet';
                states[Connection.WIFI]     = 'wifi';
                states[Connection.CELL_2G]  = 'cell_2g';
                states[Connection.CELL_3G]  = 'cell_3g';
                states[Connection.CELL_4G]  = 'cell_4g';
                states[Connection.CELL]     = 'cell';
                states[Connection.NONE]     = 'none';

                var networkState = navigator.connection.type;
                var type = states[networkState];
            } else {
                var type = 'unknown';
            }

            if($app.currentConnection !== null) {
                if($app.currentConnection == type) {
                    $app.networkStateChanged = false;
                } else {
                    $app.networkStateChanged = true;
                }
            } else {
                $app.networkStateChanged = true;
            }

            if($app.networkStateChanged) {
                $.each($app.is.connection, function(i) {
                    $app.is.connection[i] = false;
                });
                $app.is.connection[type] = true;
                $app.currentConnection = type;
                $app.networkStateChanged = false;

                if(type == 'none') {
                    $app._console('+++++ OFFLINE +++++');
                    $app.is.connected = false;
                    $app.is.highSpeed = false;
                } else {
                    $app._console('+++++ ONLINE +++++');
                    $app.is.connected = true;

                    switch(type) {
                        case 'ethernet':
                        case 'wifi':
                        case 'cell_3g':
                        case 'cell_4g':
                            $app.is.highSpeed = true;
                            break;
                        default :
                            $app.is.highSpeed = false;
                            break;
                    }
                }

                $app._console('is.connected', $app.is.connected);
                $app._console('is.highSpeed', $app.is.highSpeed);
                $app._console('is.connection.unknown', $app.is.connection.unknown);
                $app._console('is.connection.wifi', $app.is.connection.wifi);
                $app._console('is.connection.ethernet', $app.is.connection.ethernet);
                $app._console('is.connection.cell_2g', $app.is.connection.cell_2g);
                $app._console('is.connection.cell_3g', $app.is.connection.cell_3g);
                $app._console('is.connection.cell_4g', $app.is.connection.cell_4g);
                $app._console('is.connection.cell', $app.is.connection.cell);
                $app._console('is.connection.none', $app.is.connection.none);
            }
        },

        /**
         * Console writing
         */
        _console : function( label, value ) {
            var $app = $.application;
            var message = '$.application | ' + label;

            if( typeof value !== 'undefined' ) {
                message += ' : ';
                if( $app.is.protocolFile ) {
                    message += value;
                    console.log( message );
                } else {
                    console.log( message, value );
                }
            } else {
                console.log( message );
            }
        },


        // PUBLIC

        /**
         * Initialization
         */
        init : function( options ) {
            this._console( 'init()' );

            if( options ) $.extend( true, this.o, options );

            if ( document.location.protocol.match( /^file/i ) ) {
                this.is.protocolHttp = false;
                this.is.protocolFile = true;
            }

            // Prod mode - Src: http://www.jslint.com/lint.html
            if ( !this.debug ) {
                console = {
                    error   : function() {},
                    info    : function() {},
                    dir     : function() {},
                    log     : function() {}
                };

            // this.rippleDebug = false;
            // this.localDebug = false; // With this one set to 'true', _allReady() is never called on computer
            }

            this._bindAllReady();
        }
    };

})(jQuery);

