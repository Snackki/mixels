/*
 *******************************  GLOBAL FUNCTIONS  ********************************
 */	

function log() { 
	try {
		console.log.apply(console, arguments);	
	}
	catch(e) {	 
		try { 
			opera.postError.apply(opera, arguments);	
		}
		catch(e){ 
			/*alert(Array.prototype.join.call( arguments, " "));*/	
		}
	}
}

/* 
 * jump to a particular point in the page
 * this is used for mobile devices for things like jumping to a text field or to the top of the page 
 */
function scrollToElement(element) {
	$('html, body').animate({
        scrollTop: element.offset().top
    }, 200);
} 

var _mixelglobal = {}; 	/* global object to contain global variables */
deviceProperties();

/************************* setting device properties. *************************/
function deviceProperties(){
	var device = {};
	device.userAgent = navigator.userAgent;
	device.deviceName = deviceName();
	
	_mixelglobal.device = device;
	
	/*Return iPad/iPhon/IPod, Kindle, Android and Desktop-Other*/
	function deviceName(){
		if (device.userAgent.indexOf('iPad') > -1){
			return 'iPad';
		} else if (device.userAgent.indexOf('iPhone') > -1){
			return 'iPhone';
		} else if (device.userAgent.indexOf('iPod') > -1){
			return 'iPod';
		} else if (device.userAgent.indexOf('Silk') > -1){
			return 'Kindle';
		} else if (device.userAgent.indexOf('Android') > -1){
			return 'Android';
		} else {
			return 'DesktopOthers';
		}
	}
}
/************************* setting device properties. *************************/

/*
 ***********************  Global Resize Listener  *************************
 */

function resizeListener(){
	/* add resize listener with a timeout so that it doesn't fire constantly */
	$(window).resize(function(e) {
	    if(this.resizeDone) {
	    	clearTimeout(this.resizeDone);
	    }
		this.resizeDone = setTimeout(resizeHelper,200);		
	});

	/* check to see if object/function exists before using it */
	function resizeHelper(){	
		/* campaign video card */
		if (typeof mixelsAppVideo != 'undefined'){
			if ($('#overlay').hasClass('active') === true){
				mixelsAppVideo.centerVideo();
			}
		}	
	}
}

resizeListener();

/*
*******************************  DOCUMENT READY  ***********************************
*/
$(function(){
	if (_mixelglobal.isMobileApp === false){
		_cvpInstance = new CvpPlayer();	
	}
	

	/* 
	 * change the header for the video page on desktop
	 * this is used to hide the mobile nav elements and just show the "HOME" link 
	 */
	 // if on the video page AND on a desktop
	if ($('body').attr('id') == "mixelsVideo" && _mixelglobal.device.deviceName === 'DesktopOthers'){
	    $("#mixelsVideo #navMenu .navButtonWrapper").css("display", "none");
	    $("#mixelsVideo #navMenu #backButton").css("display", "inline-block");
	}
});

