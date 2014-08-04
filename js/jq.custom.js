(function($){

    $.custom = {

        o                               : {
            showClass                   : 'show',
            hideClass                   : 'hide',
            activeClass                 : 'active',
            workingClass                : 'working',
            noDismissClass              : 'no-dismiss',
            deletionShowClass           : 'deletion-show',
            deletionSelectedClass       : 'deletion-selected',
            dividerClass                : 'divider',

            loaderId                    : 'loader',
            loaderOverlayId             : 'loader-overlay',

            lastClickTime               : Date.now(),
            doubleClickDelay            : 500
        },


        // PRIVATE

        /**
        * Console writing
        */
        _console : function(label, value) {
            console.log( '----------' );
            var message = '$.custom.' + label;
            if(typeof value !== 'undefined') {
                message += ' | ';
                console.log(message, value);
            } else {
                console.log(message);
            }
        },


        // PUBLIC

        /**
        * Show a custom loader
        */
        showLoader : function( message ) {
            var c = $.custom;
            var $loader = $( '#' + c.o.loaderId );
            var $loaderOverlay = $( '#' + c.o.loaderOverlayId );
            var label = ( typeof message !== 'undefined' ) ? message : 'Traitement...';

            $loader.find( 'p' ).text( label );
            $loader.addClass( 'show' );
            $loaderOverlay.addClass( 'show' );
        },

        /**
        * Hide loader
        */
        hideLoader : function() {
            var c = $.custom;

            $( '#' + c.o.loaderId ).removeClass( 'show' );
            $( '#' + c.o.loaderOverlayId ).removeClass( 'show' );
        },

        /**
        * Init everything related to media capture
        * http://mobilehtml5.org/ts/?id=23
        * http://www.raymondcamden.com/index.cfm/2013/5/20/Capturing-camerapicture-data-without-PhoneGap
        * http://stackoverflow.com/questions/17241707/using-form-input-to-access-camera-and-immediately-upload-photos-using-web-app?lq=1
        */
        initMediaCapture : function() {
            var c = $.custom;

            c._console( 'initMediaCapture()' );

            // Keep only the relevant div
            var $div = $( '#mediaCapture' );
            var $otherDivs = $( 'body > div' ).not( $div ).not( '#' + c.o.loaderId ).not( '#' + c.o.loaderOverlayId );

            $div.show();
            $otherDivs.hide();

            // Define URL
            if( !( 'url' in window ) && ( 'webkitURL' in window ) ) {
                window.URL = window.webkitURL;
            }

            // Listeners
            $( '#mediaCapture-input' ).on( 'change', function(e) {
                if( e.target.files.length == 1 && e.target.files[0].type.indexOf( 'image/' ) == 0 ) {
                    c.showLoader();

                    $( '#mediaCapture-img' )
                    .attr( 'src', URL.createObjectURL( e.target.files[0] ) )
                    .load( function() {
                        c.hideLoader();
                    })
                    .error( function() {
                        c.hideLoader();
                    });
                }
            });
        },

        /**
        * Init scriptcam for desktop
        * https://www.scriptcam.com/download.cfm
        */
        initScriptCam : function() {
            var c = $.custom;

            c._console( 'initScriptCam()' );

            // Keep only the relevant div
            var $div = $( '#scriptCam' );
            var $otherDivs = $( 'body > div' ).not( $div ).not( '#' + c.o.loaderId ).not( '#' + c.o.loaderOverlayId );

            $div.show();
            $otherDivs.hide();

            // Load needed scripts
            $.getScript( 'libs/scriptcam/swfobject.js', function() {
                $.getScript( 'libs/scriptcam/scriptcam.js', function() {

                    var $webcam = $( '#scriptCam-webcam' );
                    var $cameraNames = $( '#scriptCam-cameraNames' );
                    var $formfield = $( '#scriptCam-formfield' );
                    var $img = $( '#scriptCam-img' );
                    var $btn1 = $( '#scriptCam-btn1' );
                    var $btn2 = $( '#scriptCam-btn2' );

                    $webcam.scriptcam({
                        path                    : 'libs/scriptcam/',
                        showMicrophoneErrors    : false,
                        cornerRadius            : 20,
                        cornerColor             : 'e3e5e2',
                        uploadImage             : 'libs/scriptcam/upload.gif',
                        noFlashFound            : '<p>Une version de <a href="http://www.adobe.com/go/getflashplayer">Adobe Flash Player</a> 11.7 ou supérieure est nécessaire pour pouvoir utiliser votre webcam.</p>',
                        onWebcamReady           : function( cameraNames, camera, microphoneNames, microphone, volume ) {
                            $.each( cameraNames, function( index, text ) {
                                $cameraNames.append( $( '<option></option>' ).val( index ).html( text ) )
                            });
                            $cameraNames.val(camera);
                        },
                        onPictureAsBase64       : function( b64 ) {
                            c.showLoader();

                            $formfield.val( b64 );

                            $img
                            .attr( 'src', 'data:image/png;base64,' + b64 )
                            .load( function() {
                                c.hideLoader();
                            })
                            .error( function() {
                                c.hideLoader();
                            });
                        },
                        onError                 : function( errorId, errorMsg ) {
                            $btn1.attr( 'disabled', true );
                            $btn2.attr( 'disabled', true );

                            alert( errorMsg );

                            $( '#scriptCam' ).hide();
                            $( '#noCam' ).show();
                        }
                    });

                    // Listeners
                    $cameraNames.on( 'change', function(e) {
                        $.scriptcam.changeCamera($cameraNames.val());
                    });
                    $btn1.on( 'click', function(e) {
                        $formfield.val( $.scriptcam.getFrameAsBase64() );
                    });
                    $btn2.on( 'click', function(e) {
                        c.showLoader();

                        $img
                        .attr( 'src', 'data:image/png;base64,' + $.scriptcam.getFrameAsBase64() )
                        .load( function() {
                            c.hideLoader();
                        })
                        .error( function() {
                            c.hideLoader();
                        });
                    });
                });
            });
        },

        /**
        * Init everything related to getusermedia
        * http://davidwalsh.name/browser-camera
        * http://www.html5rocks.com/en/tutorials/getusermedia/intro/?redirect_from_locale=fr
        * https://developer.mozilla.org/en-US/docs/Web/API/Navigator.getUserMedia
        * http://stackoverflow.com/questions/21015847/how-to-make-getusermedia-work-on-all-browsers
        */
        initGetUserMedia : function() {
            var c = $.custom;

            c._console( 'initGetUserMedia()' );

            // Keep only the relevant div
            var $div = $( '#getUserMedia' );
            var $otherDivs = $( 'body > div' ).not( $div ).not( '#' + c.o.loaderId ).not( '#' + c.o.loaderOverlayId );

            $div.show();
            $otherDivs.hide();

            // Put event listeners into place
            // Grab elements, create settings, etc.
            var canvas = document.getElementById("getUserMedia-canvas"),
            context = canvas.getContext("2d"),
            video = document.getElementById("getUserMedia-video"),
            videoObj = {
                "video" : true
            },
            errBack = function(error) {
                console.log( "Une erreur est survenue :", error.code );
            };

            // Put video listeners into place
            if(navigator.getUserMedia) { // Standard
                navigator.getUserMedia(videoObj, function(stream) {
                    video.src = stream;
                    video.play();
                }, errBack);
            } else if(navigator.webkitGetUserMedia) { // WebKit-prefixed
                navigator.webkitGetUserMedia(videoObj, function(stream){
                    video.src = window.webkitURL.createObjectURL(stream);
                    video.play();
                }, errBack);
            }
            else if(navigator.mozGetUserMedia) { // Firefox-prefixed
                navigator.mozGetUserMedia(videoObj, function(stream){
                    video.src = window.URL.createObjectURL(stream);
                    video.play();
                }, errBack);
            }

            // Trigger photo take
            document.getElementById("getUserMedia-snap").addEventListener("click", function() {
                c.showLoader();
                context.drawImage(video, 0, 0, 640, 480);
                c.hideLoader();
            });
        },

        /**
        * Init failed
        */
        initFail : function() {
            var c = $.custom;

            c._console( 'initFail()' );

            // Keep only the relevant div
            var $div = $( '#noCam' );
            var $otherDivs = $( 'body > div' ).not( $div );

            $div.show();
            $otherDivs.hide();

            // Listeners
            $( '#noCam-input' ).on( 'change', function(e) {
                $( '#noCam-fileName' ).text( $(this).val() );
            });
        },

        /**
        * When device's orientation changes
        */
        onOrientationChange : function () {
            var c = $.custom;

            c._console( 'onOrientationChange()' );

            // Global variables to update
            $.application.viewport.width = $(window).width();
            $.application.viewport.height = $(window).height();
            if ( $.application.is.ios && $.application.is.protocolHttp ) {
                $.application.viewport.height += 60;
            }

            // DOM update

            // All functions that affect the render must be placed in a timeout (longer if DOM is very complex)
            // See: https://github.com/cubiq/iscroll
            setTimeout(function () {
                }, 0);
        }

    };

})(jQuery);

