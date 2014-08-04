(function($){

    /**** LAUNCH APP INIT ****/

    $.application.init({
        onDocumentReady     : function() {
            // Instanciate fastclick on wanted tags
            // WARNING: check if there is no double triggering
            if ( typeof FastClick !== 'undefined' ) {
                FastClick.attach( document.body );
                console.log( 'FastClick activated' );
            }
        },
        onDeviceReady       : function() {

        },
        onAllReady          : function() {
            // Bind orientation scripts to precise events
            // Android: the two events might be fired at the same time, resulting in two executions of the function...
            // iOS: 'resize' seems to be triggered on every page change so we don't use it
            if ( $.application.is.ios ) {
                $(window).on( 'orientationchange', function() {
                    $.custom.onOrientationChange();
                });
            } else {
                $(window).on( 'orientationchange resize', function() {
                    $.custom.onOrientationChange();
                });
            }

            // Add body class
            if ( $.application.is.desktop ) $( 'body' ).addClass( 'isDesktop' );

            // Use media capture on iOS or Android
            if ( ( $.application.is.ios || $.application.is.android ) && !$.application.is.old ) {
                $.custom.initMediaCapture();
            }
            // ScriptCam for desktop (even on Safari or IE)
            // && !( !!navigator.userAgent.match( /Trident/i ) || !!navigator.userAgent.match( /MSIE/i ) )
            // && !( navigator.userAgent.indexOf( 'Safari' ) != -1 && navigator.userAgent.indexOf( 'Chrome' ) == -1 )
            else if ( $.application.is.desktop ) {
                $.custom.initScriptCam();
            }
            // If getusermedia is usable
            else if ( typeof Modernizr !== 'undefined' && Modernizr.getusermedia ) {
                $.custom.initGetUserMedia();
            }
            // When everything else failed
            else {
                $.custom.initFail();
            }
        },
        onSplashHide        : function() {

        },
        onPause             : function() {

        },
        onResume            : function() {

        }
    });




/**** PREVENT DOUBLE TAP ****/
// About the issue:
//     - https://github.com/watusi/jquery-mobile-iscrollview/issues/96
//     - https://github.com/cubiq/iscroll/issues/361#issuecomment-17652950
//     - https://github.com/cubiq/iscroll/issues/582

/* Solution 1 *
    // Append a transparent layer
    $(document).on('click', function(e) {
        var $body = $( 'body' );
        var $noDoubleTapHack = $( '<div />', {
            'class'             : $.custom.o.noDoubleTapClass,
            'css'               : {
                'position'      : 'absolute',
                'pointer-events': 'none',
                'width'         : '100%',
                'height'        : '100%',
                'background'    : 'transparent',
                'z-index'       : '10000'
            }
        });

        // Prevent the possibility of clicking the footer due to iscroll tap's resilience
        if ( !$body.find( '> .' + $.custom.o.noDoubleTapClass ).length ) $body.prepend( $noDoubleTapHack );

        // And remove the hack after a while
        setTimeout( function() {
            $body.find( '> .' + $.custom.o.noDoubleTapClass ).remove();
        }, 200 );
    });
    // Make sure to remove it every time we enter a page
    $(document).one('pagebeforeshow', function(e) {
        $( 'body > .' + $.custom.o.noDoubleTapClass ).remove();
    });

    /* Solution 2
     * Src: http://stackoverflow.com/questions/14982864/phonegap-2-4-0-with-android-4-2-strange-double-click-behaviour
     * Src: http://stackoverflow.com/questions/8996015/jquery-on-vs-javascript-addeventlistener
     * WARNING: doesn't work in Firefox - Src: http://stackoverflow.com/questions/18197401/javascript-event-timestamps-not-consistent *
    if ( !window.navigator.userAgent.match( /Firefox/i ) ) {
        document.addEventListener( 'click', function(e) {
            var c = $.custom;
            var clickTime = e.timeStamp;

            if ( clickTime && ( clickTime - c.o.lastClickTime ) < c.o.doubleClickDelay ) {
                e.stopImmediatePropagation();
                e.preventDefault();
                return false;
            }

            c.o.lastClickTime = clickTime;
        }, true );
    }
     */

})(jQuery);

